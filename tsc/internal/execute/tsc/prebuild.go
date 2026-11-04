package tsc

import (
	"context"
	"io"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
)

type PreBuildStatus uint8

const (
	PreBuildContinue PreBuildStatus = iota
	PreBuildComplete
	PreBuildFailed
)

type PreBuildInput struct {
	Sys             System
	Config          *tsoptions.ParsedCommandLine
	Writer          io.Writer
	GenerationCache *GenerationCache
	OnGenerated     func()
	SelectFiles     func(*tsoptions.ParsedCommandLine) *tsoptions.ParsedCommandLine
	Format          func(context.Context, *tsoptions.ParsedCommandLine) (FormatResult, *ast.Diagnostic)
}

type PreBuildResult struct {
	Config      *tsoptions.ParsedCommandLine
	Status      PreBuildStatus
	Diagnostics []*ast.Diagnostic
	Generation  GenerationResult
	Formatting  FormatResult
}

func RunPreBuildStages(ctx context.Context, input PreBuildInput) PreBuildResult {
	result := PreBuildResult{Config: input.Config}
	if errors := tsoptions.ValidateBuildStageOptions(result.Config.CompilerOptions()); len(errors) > 0 {
		result.Status = PreBuildFailed
		result.Diagnostics = errors
		return result
	}
	result.Generation = Generate(ctx, input.Sys, result.Config, input.Writer, input.GenerationCache)
	if result.Generation.Executed > 0 {
		if input.OnGenerated != nil {
			input.OnGenerated()
		}
		if result.Config.ConfigFile != nil {
			result.Config = result.Config.ReloadFileNamesOfParsedCommandLine(input.Sys.FS())
			if input.SelectFiles != nil {
				result.Config = input.SelectFiles(result.Config)
			}
		}
	}
	var fatal *ast.Diagnostic
	if len(result.Generation.Diagnostics) == 0 && !result.Config.CompilerOptions().GenerateOnly.IsTrue() && FormattingEnabled(result.Config.CompilerOptions()) && input.Format != nil {
		result.Formatting, fatal = input.Format(ctx, result.Config)
	}
	result.Generation.Save(input.Sys, result.Config, result.Formatting.Changes...)
	result.Diagnostics = append(result.Diagnostics, result.Generation.Diagnostics...)
	result.Diagnostics = append(result.Diagnostics, result.Formatting.Diagnostics...)
	if fatal != nil {
		result.Diagnostics = append(result.Diagnostics, fatal)
	}
	if len(result.Generation.Diagnostics) > 0 || fatal != nil {
		result.Status = PreBuildFailed
	} else if result.Config.CompilerOptions().GenerateOnly.IsTrue() || result.Config.CompilerOptions().FormatOnly.IsTrue() {
		result.Status = PreBuildComplete
		if len(result.Diagnostics) > 0 {
			result.Status = PreBuildFailed
		}
	}
	return result
}
