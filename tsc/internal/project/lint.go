package project

import (
	"cmp"
	"context"
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ls/lsconv"
	"github.com/microsoft/TypeScript/tsc/internal/lsp/lsproto"
	"github.com/microsoft/TypeScript/tsc/internal/nativepath"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
)

type lintWatchState struct {
	files       []string
	directories []string
}

func (s *Session) scheduleLintWatchUpdate() {
	if !s.options.WatchEnabled {
		return
	}
	s.lintWatchGeneration.Add(1)
	if !s.lintWatchPending.CompareAndSwap(false, true) {
		return
	}
	s.backgroundQueue.Enqueue(s.backgroundContext(), func(ctx context.Context) {
		for {
			generation := s.lintWatchGeneration.Load()
			s.updateLintWatches(ctx)
			s.lintWatchPending.Store(false)
			if generation == s.lintWatchGeneration.Load() || !s.lintWatchPending.CompareAndSwap(false, true) {
				return
			}
		}
	})
}

func (s *Session) updateLintWatches(ctx context.Context) {
	provider, ok := s.lintPluginHost.(interface{ WatchedFiles() []string })
	if !ok {
		return
	}
	files := provider.WatchedFiles()
	for index, file := range files {
		files[index] = tspath.RootedFilePathFromAbsolute(file).AsString()
	}
	slices.Sort(files)
	files = slices.Compact(files)
	var directories []string
	if provider, ok := s.lintPluginHost.(interface{ WatchedDirectories() []string }); ok {
		directories = compactLintPluginDirectories(provider.WatchedDirectories(), s.caseSensitivity)
	}
	state := lintWatchState{files: files, directories: directories}
	s.lintWatchMu.Lock()
	defer s.lintWatchMu.Unlock()
	if s.lintWatch != nil && slices.Equal(s.lintWatch.input.files, files) && slices.Equal(s.lintWatch.input.directories, directories) && !s.watches.IsPending(s.lintWatch.ID()) {
		return
	}
	relative := lsproto.GetClientCapabilities(ctx).Workspace.DidChangeWatchedFiles.RelativePatternSupport
	caseSensitivity := s.caseSensitivity
	watch := NewWatchedFiles("lint-plugins", lsproto.WatchKindCreate|lsproto.WatchKindChange|lsproto.WatchKindDelete, relative, func(state lintWatchState) PatternsAndIgnored {
		return lintPluginWatchPatterns(state.files, state.directories, relative, caseSensitivity)
	})
	watch = watch.Clone(state)
	if errors := s.updateWatch(ctx, s.lintWatch, watch); len(errors) != 0 {
		s.logger.Logf("Error updating lint plugin watches: %v", errors)
	}
	s.lintWatch = watch
}

func compactLintPluginDirectories(directories []string, caseSensitivity tspath.CaseSensitivity) []string {
	for index, directory := range directories {
		directories[index] = tspath.RootedDirectoryPathFromAbsolute(directory).AsString()
	}
	slices.SortFunc(directories, func(a, b string) int {
		return cmp.Compare(caseSensitivity.PathKey(tspath.RootedDirectoryPathFromAbsolute(a).AsPath()), caseSensitivity.PathKey(tspath.RootedDirectoryPathFromAbsolute(b).AsPath()))
	})
	var result []string
	for _, directory := range directories {
		path := tspath.RootedDirectoryPathFromAbsolute(directory)
		if nativepath.IsNetworkPath(directory) || path.BaseName() == "node_modules" {
			continue
		}
		if !slices.ContainsFunc(result, func(parent string) bool {
			return caseSensitivity.ContainsPath(tspath.RootedDirectoryPathFromAbsolute(parent), path.AsPath())
		}) {
			result = append(result, directory)
		}
	}
	return result
}

func lintPluginWatchPatterns(patterns, directories []string, relative bool, caseSensitivity tspath.CaseSensitivity) PatternsAndIgnored {
	slices.Sort(patterns)
	patterns = slices.Compact(patterns)
	directories = compactLintPluginDirectories(directories, caseSensitivity)
	var result PatternsAndIgnored
	kind := lsproto.WatchKindCreate | lsproto.WatchKindChange | lsproto.WatchKindDelete
	for _, directory := range directories {
		result.directWatchers = append(result.directWatchers, newRecursiveDirectoryWatcher(tspath.RootedDirectoryPathFromAbsolute(directory), kind, relative))
	}
	for _, pattern := range patterns {
		if nativepath.IsNetworkPath(pattern) {
			continue
		}
		file := tspath.RootedFilePathFromAbsolute(pattern)
		if slices.ContainsFunc(directories, func(directory string) bool {
			return caseSensitivity.ContainsFilePath(tspath.RootedDirectoryPathFromAbsolute(directory), file)
		}) {
			continue
		}
		if !relative {
			result.patternsInsideWorkspace = append(result.patternsInsideWorkspace, file.AsString())
			continue
		}
		uri := lsproto.URI(lsconv.FileNameToDocumentURI(tspath.RootedFilePathFromPath(file.Directory().AsPath())))
		result.directWatchers = append(result.directWatchers, &lsproto.FileSystemWatcher{
			GlobPattern: lsproto.PatternOrRelativePattern{RelativePattern: &lsproto.RelativePattern{
				BaseUri: lsproto.WorkspaceFolderOrURI{URI: &uri},
				Pattern: file.BaseName(),
			}},
			Kind: &kind,
		})
	}
	return result
}

func (s *Session) invalidateLintPlugins(changes []*lsproto.FileEvent) bool {
	host, ok := s.lintPluginHost.(interface {
		WatchedFiles() []string
		Invalidate()
	})
	if !ok {
		return false
	}
	files := host.WatchedFiles()
	var directories []string
	if provider, ok := s.lintPluginHost.(interface{ WatchedDirectories() []string }); ok {
		directories = compactLintPluginDirectories(provider.WatchedDirectories(), s.caseSensitivity)
	}
	for _, change := range changes {
		if change.Type != lsproto.FileChangeTypeCreated && change.Type != lsproto.FileChangeTypeChanged && change.Type != lsproto.FileChangeTypeDeleted {
			continue
		}
		path := change.Uri.PathKey(s.caseSensitivity)
		for _, directory := range directories {
			root := s.caseSensitivity.PathKey(tspath.RootedDirectoryPathFromAbsolute(directory).AsPath())
			if root.ContainsPath(path) || path.ContainsPath(root) {
				host.Invalidate()
				s.lintCache.Clear()
				return true
			}
		}
		for _, file := range files {
			fileName := tspath.RootedFilePathFromAbsolute(file)
			tracked := s.caseSensitivity.PathKey(tspath.RootedPath(fileName))
			if path == tracked || path.ContainsPath(tracked) {
				host.Invalidate()
				s.lintCache.Clear()
				return true
			}
			if fileName.ExtensionIsOneOf([]string{".js", ".cjs", ".mjs", ".ts", ".cts", ".mts"}) &&
				s.caseSensitivity.PathKey(fileName.Directory().AsPath()).ContainsPath(path) {
				host.Invalidate()
				s.lintCache.Clear()
				return true
			}
		}
	}
	return false
}
