package ls

import (
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/ls/lsconv"
	"github.com/microsoft/TypeScript/tsc/internal/lsp/lsproto"
	"github.com/microsoft/TypeScript/tsc/internal/spanmap"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs/vfstest"
	"gotest.tools/v3/assert"
)

func TestLintCodeFixMappedProjections(t *testing.T) {
	t.Parallel()
	fs := vfstest.FromMap(map[string]any{"/input.ts": "debugger;\ndebugger;"}, tspath.CaseSensitive)
	config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{NoLib: core.TSTrue}, []tspath.RootedFilePath{"/input.ts"}, nil, "/", tspath.CaseSensitive)
	program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: compiler.NewCompilerHost(fs, "/lib", nil, nil, nil)})
	file := program.GetSourceFile("/input.ts")
	file.SetContentMapperInfo(ast.ContentMapperSourceFileInfo{
		ContentMapper: "test",
		OriginalText:  "debugger;",
		SpanMap: spanmap.New([]spanmap.Segment{
			{VirtualStart: 0, VirtualEnd: 9, OriginalStart: 0, OriginalEnd: 9, Kind: spanmap.KindVerbatim, Features: spanmap.FeatureAll},
			{VirtualStart: 10, VirtualEnd: 19, OriginalStart: 0, OriginalEnd: 9, Kind: spanmap.KindVerbatim, Features: spanmap.FeatureAll},
		}),
	})
	service := &LanguageService{converters: lsconv.NewConverters(lsproto.PositionEncodingKindUTF16, func(_ tspath.RootedFilePath) *lsconv.LSPLineMap {
		return lsconv.ComputeLSPLineStarts(file.OriginalText())
	})}
	for _, replacement := range []string{"{}", ";"} {
		changes := []codefix.FileTextChanges{{FileName: "/input.ts", TextChanges: []core.TextChange{
			{TextRange: core.NewTextRange(0, 9), NewText: "{}"},
			{TextRange: core.NewTextRange(10, 19), NewText: replacement},
		}}}
		mapped := service.codeFixWorkspaceChanges(program, changes)
		if replacement == "{}" {
			assert.Equal(t, len(mapped["file:///input.ts"]), 1)
		} else {
			assert.Equal(t, len(mapped), 0)
		}
	}
}
