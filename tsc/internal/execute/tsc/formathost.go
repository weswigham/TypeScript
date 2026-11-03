package tsc

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
)

type formattingCompilerHost struct {
	compiler.CompilerHost
	files map[ast.SourceFileParseOptions]*ast.SourceFile
}

func WithFormattingSourceFiles(host compiler.CompilerHost, files []*ast.SourceFile) compiler.CompilerHost {
	if len(files) == 0 {
		return host
	}
	result := &formattingCompilerHost{CompilerHost: host, files: make(map[ast.SourceFileParseOptions]*ast.SourceFile, len(files))}
	for _, file := range files {
		result.files[file.ParseOptions()] = file
	}
	return result
}

func (host *formattingCompilerHost) GetSourceFile(options ast.SourceFileParseOptions) *ast.SourceFile {
	if file := host.files[options]; file != nil {
		return file
	}
	return host.CompilerHost.GetSourceFile(options)
}
