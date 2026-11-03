package tsoptions

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/collections"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
)

func (p *ParsedCommandLine) FormattingOptions() *core.FormattingOptions {
	return p.ParsedConfig.FormattingOptions
}

func getFormattingOptions(options *parsedFormattingOptions) *core.FormattingOptions {
	if options == nil {
		return nil
	}
	return options.FormattingOptions
}

type parsedFormattingOptions struct {
	*core.FormattingOptions
	nullFields collections.Set[string]
}

func (p *parsedFormattingOptions) ParseOption(name string, value any) {
	ParseFormattingOptions(name, value, p.FormattingOptions)
	if value == nil {
		p.nullFields.Add(name)
	} else {
		p.nullFields.Delete(name)
	}
}

func (p *parsedFormattingOptions) UnknownOptionDiagnostic() *diagnostics.Message {
	return diagnostics.Unknown_compiler_option_0
}

func (p *parsedFormattingOptions) UnknownDidYouMeanDiagnostic() *diagnostics.Message {
	return diagnostics.Unknown_compiler_option_0_Did_you_mean_1
}

func parseFormattingOptions(value any, basePath tspath.RootedDirectoryPath) (*parsedFormattingOptions, []*ast.Diagnostic) {
	if value == nil {
		return nil, nil
	}
	object, ok := value.(*collections.OrderedMap[string, any])
	if !ok {
		return nil, []*ast.Diagnostic{ast.NewCompilerDiagnostic(diagnostics.Compiler_option_0_requires_a_value_of_type_1, "formattingOptions", "object")}
	}
	if object.Size() == 0 {
		return nil, nil
	}
	result := &parsedFormattingOptions{FormattingOptions: &core.FormattingOptions{}}
	_, errors := convertOptionsFromJson(formattingOptionsDeclaration.ElementOptions, value, basePath, result)
	return result, errors
}
