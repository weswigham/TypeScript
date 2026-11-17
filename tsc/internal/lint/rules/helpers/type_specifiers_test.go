package helpers_test

import (
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/bundled"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs/vfstest"
)

func TestTypeSpecifierFileOriginProjectDirectory(t *testing.T) {
	t.Parallel()
	for _, declaration := range []struct{ name, source string }{
		{"no-floating-promises", "export type Allowed = Promise<void> & { brand: true };"},
		{"only-throw-error", "export class Allowed { value = 0; }"},
		{"prefer-readonly-parameter-types", "export interface Allowed { value: number; }"},
		{"no-misused-spread", "export class Allowed { value = 0; }"},
	} {
		for _, test := range []struct {
			name, path string
			directory  tspath.RootedDirectoryPath
			configless bool
			matches    bool
		}{
			{"configured", "types.ts", "/outside", false, true},
			{"configless", "types.ts", "/project", true, true},
			{"configless different directory", "types.ts", "/outside", true, false},
			{"legacy source directory", "../types.ts", "", true, true},
		} {
			t.Run(declaration.name+"/"+test.name, func(t *testing.T) {
				t.Parallel()
				fs := bundled.WrapFS(vfstest.FromMap(map[string]string{
					"/project/src/input.ts":  "import { Allowed } from '../types'; export {};",
					"/project/types.ts":      declaration.source,
					"/project/tsconfig.json": "{\"compilerOptions\":{\"target\":\"esnext\",\"strict\":true},\"files\":[\"src/input.ts\"]}",
				}, tspath.CaseSensitive))
				config, errors := tsoptions.GetParsedCommandLineOfConfigFile("/project/tsconfig.json", &core.CompilerOptions{}, nil, tsoptions.NewDefaultParseConfigHost(fs), nil)
				if len(errors) != 0 {
					t.Fatal(errors)
				}
				program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: compiler.NewCompilerHost(fs, bundled.LibPath(), nil, nil, nil)})
				program.BindSourceFiles()
				typeChecker, release := program.GetTypeChecker(t.Context())
				defer release()
				options := program.Options().Clone()
				if test.configless {
					options.ConfigFilePath = ""
				}
				context := helpers.Context{CompilerOptions: options, CurrentDirectory: test.directory, File: program.GetSourceFile("/project/src/input.ts"), GetChecker: func() *checker.Checker { return typeChecker }}
				symbol := typeChecker.GetSymbolAtLocation(program.GetSourceFile("/project/types.ts").Statements.Nodes[0].Name())
				if actual := helpers.SemanticTypeSpecifierOrigin(context, symbol, map[string]any{"from": "file", "name": "Allowed", "path": test.path}); actual != test.matches {
					t.Fatalf("file type-specifier origin matched = %v, want %v", actual, test.matches)
				}
			})
		}
	}
}
