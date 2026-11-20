package api

import (
	"fmt"
	"strings"
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/bundled"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/json"
	"github.com/microsoft/TypeScript/tsc/internal/lint"
	"github.com/microsoft/TypeScript/tsc/internal/lsp/lsproto"
	"github.com/microsoft/TypeScript/tsc/internal/project"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs/vfstest"
	"gotest.tools/v3/assert"
)

func TestProgramSnapshotAPIBinding(t *testing.T) {
	t.Parallel()
	fs := bundled.WrapFS(vfstest.FromMap(map[string]string{"/project/input.ts": `const value: string = "native";`}, tspath.CaseSensitive))
	config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{NoCheck: core.TSTrue}, []tspath.RootedFilePath{"/project/input.ts"}, nil, "/project", tspath.CaseSensitive)
	program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: compiler.NewCompilerHost(fs, bundled.LibPath(), nil, nil, nil)})
	session := NewStandaloneSession(&project.SessionInit{BackgroundCtx: t.Context(), FS: fs, Options: &project.SessionOptions{CurrentDirectory: "/project", DefaultLibraryPath: bundled.LibPath(), PositionEncoding: lsproto.PositionEncodingKindUTF8}}, &SessionOptions{UseBinaryResponses: true})
	defer session.Close()
	binding, err := session.bindProgramSnapshot(program, "", 0)
	assert.NilError(t, err)
	assert.Assert(t, binding.Snapshot != 0)
	defer func() { _ = session.releaseSnapshot(binding.Snapshot) }()
	data, err := session.getSnapshotData(binding.Snapshot)
	assert.NilError(t, err)
	actual, err := data.getProgram(binding.Projects[0].Handle)
	assert.NilError(t, err)
	assert.Assert(t, actual == program)
	proj, err := data.getProject(binding.Projects[0].Handle)
	assert.NilError(t, err)
	assert.Assert(t, proj.Program == program)
	assert.Assert(t, proj.ID().String() == string(binding.Projects[0].Id))
	file := program.GetSourceFile("/project/input.ts")
	var identifier *ast.Node
	var visit func(*ast.Node) bool
	visit = func(node *ast.Node) bool {
		if node.Kind == ast.KindIdentifier && node.AsIdentifier().Text == "value" {
			identifier = node
			return true
		}
		return node.ForEachChild(visit)
	}
	visit(file.AsNode())
	assert.Assert(t, identifier != nil)
	lease, err := session.acquireCachedSourceFile(newSourceFileDescriptor(file))
	assert.NilError(t, err)
	assert.Assert(t, lease.SourceFile() == file)
	assert.Assert(t, identifier.Parent.Symbol() != nil)
	lease.Release()
	index, _, _ := strings.Cut(string(nodeHandleFrom(identifier)), ".")
	location := NodeHandle(fmt.Sprintf("%s.#%d", index, sourceFileNodeID(file)))
	params, err := json.Marshal(&GetTypeAtLocationParams{Snapshot: binding.Snapshot, Project: binding.Projects[0].Handle, Location: location})
	assert.NilError(t, err)
	value, err := session.HandleRequest(t.Context(), "getTypeAtLocation", params)
	assert.NilError(t, err)
	response := value.(*TypeResponse)
	assert.Assert(t, response.Flags&uint32(checker.TypeFlagsString) != 0)
	raw, err := session.handleGetSourceFile(t.Context(), &GetSourceFileParams{Snapshot: binding.Snapshot, Project: binding.Projects[0].Handle, File: DocumentIdentifier{FileName: "/project/input.ts"}})
	assert.NilError(t, err)
	assert.Assert(t, len(raw.(RawBinary)) != 0)
}

func TestProjectSnapshotAPIBindingPreservesProjectAndDisambiguatesHandles(t *testing.T) {
	t.Parallel()
	fs := bundled.WrapFS(vfstest.FromMap(map[string]string{
		"/project/input.ts": `const value = "from project";`,
	}, tspath.CaseSensitive))
	init := &project.SessionInit{
		BackgroundCtx: t.Context(),
		FS:            fs,
		Options:       &project.SessionOptions{CurrentDirectory: "/project", DefaultLibraryPath: bundled.LibPath(), PositionEncoding: lsproto.PositionEncodingKindUTF8},
	}
	sourceSession := NewStandaloneSession(init, nil)
	defer sourceSession.Close()
	sourceResponse, err := sourceSession.handleCreateSnapshot(t.Context(), &CreateSnapshotParams{
		OpenFiles: []DocumentIdentifier{{FileName: "/project/input.ts"}},
	})
	assert.NilError(t, err)
	sourceData, err := sourceSession.getSnapshotData(sourceResponse.Snapshot)
	assert.NilError(t, err)
	sourceProject, err := sourceData.getProject(sourceResponse.Projects[0].Handle)
	assert.NilError(t, err)
	program := sourceProject.GetProgram()
	assert.Assert(t, program != nil)

	apiSession := NewStandaloneSession(init, nil)
	defer apiSession.Close()
	ownedResponse, err := apiSession.handleCreateSnapshot(t.Context(), &CreateSnapshotParams{
		OpenFiles: []DocumentIdentifier{{FileName: "/project/input.ts"}},
	})
	assert.NilError(t, err)
	assert.Equal(t, ownedResponse.Snapshot, sourceResponse.Snapshot)

	binding, err := apiSession.bindProjectSnapshot(&lint.ProjectBinding{
		Snapshot: sourceData.snapshot,
		Handle:   uint64(sourceProject.Handle()),
	}, program)
	assert.NilError(t, err)
	assert.Assert(t, binding.Snapshot != ownedResponse.Snapshot)
	assert.Equal(t, binding.Projects[0].Handle, sourceProject.Handle())
	assert.Equal(t, binding.Projects[0].Id, sourceProject.ID())

	boundData, err := apiSession.getSnapshotData(binding.Snapshot)
	assert.NilError(t, err)
	boundProject, err := boundData.getProject(binding.Projects[0].Handle)
	assert.NilError(t, err)
	assert.Assert(t, boundProject == sourceProject)
	boundProgram, err := boundData.getProgram(binding.Projects[0].Handle)
	assert.NilError(t, err)
	assert.Assert(t, boundProgram == program)
	assert.NilError(t, apiSession.releaseSnapshot(binding.Snapshot))
}
