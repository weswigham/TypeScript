package project

import (
	"context"
	"errors"
	"slices"
	"sync"
	"sync/atomic"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/contentmapper"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/lint"
	"github.com/microsoft/TypeScript/tsc/internal/ls/lsutil"
	"github.com/microsoft/TypeScript/tsc/internal/lsp/lsproto"
	"github.com/microsoft/TypeScript/tsc/internal/project/logging"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs"
)

// SnapshotHost owns the services shared by a collection of immutable snapshots.
type SnapshotHost struct {
	options         *SessionOptions
	caseSensitivity tspath.CaseSensitivity
	fs              vfs.FS

	parseCache              *ParseCache
	contentMappedParseCache *ContentMappedParseCache
	extendedConfigCache     *ExtendedConfigCache
	programCounter          *programCounter
	contentMapperHost       contentmapper.Host
	lintPluginHost          lint.Host
	lintCache               lint.Cache
	lintWatchFilesChanged   func()

	snapshotID atomic.Uint64
}

type SourceFileLease struct {
	cache       *ParseCache
	key         ParseCacheKey
	sourceFile  *ast.SourceFile
	releaseOnce sync.Once
}

func (l *SourceFileLease) SourceFile() *ast.SourceFile {
	return l.sourceFile
}

func (l *SourceFileLease) Release() {
	l.releaseOnce.Do(func() {
		if l.cache != nil {
			l.cache.Deref(l.key)
		}
	})
}

func NewBorrowedSourceFileLease(file *ast.SourceFile) *SourceFileLease {
	return &SourceFileLease{sourceFile: file}
}

func (s *SnapshotHost) LintPluginHost() lint.Host { return s.lintPluginHost }

func (s *SnapshotHost) GetLintDiagnostics(ctx context.Context, program *compiler.Program, files []*ast.SourceFile) []*ast.Diagnostic {
	result := s.lintCache.GetDiagnostics(lint.WithHost(ctx, s.lintPluginHost), program, files)
	if s.lintWatchFilesChanged != nil {
		s.lintWatchFilesChanged()
	}
	return result
}

func (s *SnapshotHost) nextSnapshotID() uint64 {
	return s.snapshotID.Add(1)
}

func (s *SnapshotHost) AcquireSourceFile(options ast.SourceFileParseOptions, text string, scriptKind core.ScriptKind) *SourceFileLease {
	fileHandle := NewCachedFileHandle(options.FileName, text)
	key := NewParseCacheKey(options, fileHandle.Hash(), scriptKind)
	return &SourceFileLease{
		cache:      s.parseCache,
		key:        key,
		sourceFile: s.parseCache.Acquire(key, fileHandle),
	}
}

func (s *SnapshotHost) AcquireExistingSourceFile(key ParseCacheKey) *SourceFileLease {
	sourceFile, ok := s.parseCache.AcquireExisting(key)
	if !ok {
		return nil
	}
	return &SourceFileLease{
		cache:      s.parseCache,
		key:        key,
		sourceFile: sourceFile,
	}
}

func NewSnapshotHost(init *SessionInit) *SnapshotHost {
	parseCache := init.ParseCache
	if parseCache == nil {
		parseCache = NewParseCache(RefCountCacheOptions{})
	}
	contentMappedParseCache := init.ContentMappedParseCache
	if contentMappedParseCache == nil {
		contentMappedParseCache = NewContentMappedParseCache(RefCountCacheOptions{})
	}

	return &SnapshotHost{
		options:                 init.Options,
		caseSensitivity:         init.FS.CaseSensitivity(),
		fs:                      init.FS,
		parseCache:              parseCache,
		contentMappedParseCache: contentMappedParseCache,
		extendedConfigCache:     NewExtendedConfigCache(),
		programCounter:          &programCounter{},
		contentMapperHost:       newContentMapperHost(init),
		lintPluginHost:          init.LintHost,
	}
}

// NewRootSnapshot creates an independent root snapshot.
func (s *SnapshotHost) NewRootSnapshot() *Snapshot {
	return s.newRootSnapshot(0, false)
}

// NewIndependentSnapshot allocates an identity for a root that will be exposed directly,
// rather than used as the identity-free seed for a later snapshot update.
func (s *SnapshotHost) NewIndependentSnapshot() *Snapshot {
	return s.newRootSnapshot(s.nextSnapshotID(), false)
}

// NewProgramSnapshot exposes an existing compiler program through a synthetic
// project in a snapshot. The program remains owned by its original host.
func (s *SnapshotHost) NewProgramSnapshot(program *compiler.Program, id SyntheticProjectID, handle Handle) (*Snapshot, *Project, error) {
	if program == nil || program.CommandLine() == nil {
		return nil, nil, errors.New("a program snapshot requires a program with a parsed command line")
	}
	snapshot := s.NewIndependentSnapshot()
	if id == "" {
		id = NewSyntheticProjectID(int(snapshot.ID()))
	}
	if handle == 0 {
		handle = Handle(nextProjectHandle.Add(1))
	}
	project := &Project{
		Kind:             KindSynthetic,
		id:               id.AsID(),
		handle:           handle,
		projectDirectory: program.GetCurrentDirectory(),
		CommandLine:      program.CommandLine(),
		Program:          program,
	}
	snapshot.ProjectCollection.syntheticProjects = map[SyntheticProjectID]*Project{id: project}
	return snapshot, project, nil
}

// RetainSnapshot adds a reference to a snapshot owned by this host.
func (s *SnapshotHost) RetainSnapshot(snapshot *Snapshot) {
	snapshot.ref()
}

// CloneSnapshot derives a snapshot from baseSnapshot without adopting it as any
// canonical session state or performing session side effects.
func (s *SnapshotHost) CloneSnapshot(
	ctx context.Context,
	baseSnapshot *Snapshot,
	fileChanges FileChangeSummary,
	apiRequest *APISnapshotRequest,
) (*Snapshot, error) {
	change := SnapshotChange{
		apiRequest:  apiRequest,
		fileChanges: fileChanges,
	}
	if apiRequest != nil {
		change.fs = apiRequest.FileSystem
		change.fileSystemOverride = apiRequest.FileSystem != nil
		change.replaceFileSystem = apiRequest.ReplaceFileSystem
		change.newConfig = apiRequest.UserPreferences
		if apiRequest.PrepareAutoImports != "" {
			change.ResourceRequest = baseSnapshot.resourceRequestForDocument(apiRequest.PrepareAutoImports)
			change.AutoImports = apiRequest.PrepareAutoImports
		}
	}
	snapshot := s.update(ctx, baseSnapshot, change)
	return snapshot, snapshot.apiError
}

// update derives a snapshot from baseSnapshot without adopting it as any
// canonical session state or performing session side effects.
func (s *SnapshotHost) update(ctx context.Context, baseSnapshot *Snapshot, change SnapshotChange) *Snapshot {
	return baseSnapshot.Clone(ctx, change, baseSnapshot.overlays(), nil, nil)
}

// CloneSnapshotWithAutoImports derives a snapshot with auto-import preparation without
// adopting the clone in the background.
func (s *SnapshotHost) CloneSnapshotWithAutoImports(ctx context.Context, baseSnapshot *Snapshot, uri lsproto.DocumentUri, logger logging.Logger) *Snapshot {
	change := SnapshotChange{
		reason:             UpdateReasonRequestedLanguageServiceWithAutoImports,
		fs:                 baseSnapshot.fs.fs,
		fileSystemOverride: baseSnapshot.fileSystemOverride,
		ResourceRequest:    baseSnapshot.resourceRequestForDocument(uri),
	}
	change.AutoImports = uri
	return baseSnapshot.Clone(ctx, change, baseSnapshot.overlays(), logger, nil)
}

func (s *SnapshotHost) newRootSnapshot(id uint64, relativePatternSupport bool) *Snapshot {
	fileSystem := newOverlayFS(s.fs, nil, s.options.PositionEncoding)
	return s.newSnapshot(
		id,
		&SnapshotFS{
			caseSensitivity: s.caseSensitivity,
			fs:              fileSystem,
		},
		&ConfigFileRegistry{},
		nil,
		lsutil.NewDefaultUserPreferences(),
		nil,
		NewWatchedFiles(
			"auto-import",
			lsproto.WatchKindCreate|lsproto.WatchKindChange|lsproto.WatchKindDelete,
			relativePatternSupport,
			func(nodeModulesDirs map[tspath.PathKey]tspath.RootedDirectoryPath) PatternsAndIgnored {
				patterns := make([]string, 0, len(nodeModulesDirs))
				for _, dir := range nodeModulesDirs {
					patterns = append(patterns, getRecursiveGlobPattern(dir))
				}
				slices.Sort(patterns)
				return PatternsAndIgnored{
					patternsInsideWorkspace: patterns,
				}
			},
		),
	)
}

func (s *SnapshotHost) FS() vfs.FS {
	return s.fs
}

func (s *SnapshotHost) GetCurrentDirectory() tspath.RootedDirectoryPath {
	return s.options.CurrentDirectory
}

func (s *SnapshotHost) DefaultLibraryPath() tspath.RootedDirectoryPath {
	return s.options.DefaultLibraryPath
}

func (s *SnapshotHost) Close() {
	if s.lintPluginHost != nil {
		_ = s.lintPluginHost.Close()
	}
	if s.contentMapperHost != nil {
		_ = s.contentMapperHost.Close()
	}
}
