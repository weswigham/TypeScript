package tsoptions

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/contentmapper"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
)

type ParsedOptions struct {
	CompilerOptions   *core.CompilerOptions   `json:"compilerOptions"`
	TypeAcquisition   *core.TypeAcquisition   `json:"typeAcquisition"`
	FormattingOptions *core.FormattingOptions `json:"formattingOptions,omitzero"`
	Generate          []GenerateCommand       `json:"generate,omitzero"`
	Lint              *LintOptions            `json:"lint,omitzero"`

	FileNames         []tspath.RootedFilePath  `json:"fileNames"`
	ProjectReferences []*core.ProjectReference `json:"projectReferences"`
	ContentMappers    []*contentmapper.Mapper  `json:"contentMappers"`
}

// Equals compares parsed configuration values using each option type's equality semantics.
func (p *ParsedOptions) Equals(other *ParsedOptions) bool {
	if p == other {
		return true
	}
	if p == nil || other == nil {
		return false
	}
	if !p.CompilerOptions.Equals(other.CompilerOptions) ||
		!p.TypeAcquisition.Equals(other.TypeAcquisition) ||
		!p.FormattingOptions.Equals(other.FormattingOptions) ||
		!p.Lint.Equals(other.Lint) {
		return false
	}
	return (p.FileNames == nil) == (other.FileNames == nil) &&
		(p.Generate == nil) == (other.Generate == nil) &&
		slices.EqualFunc(p.Generate, other.Generate, GenerateCommand.Equals) &&
		slices.Equal(p.FileNames, other.FileNames) &&
		(p.ProjectReferences == nil) == (other.ProjectReferences == nil) &&
		slices.EqualFunc(p.ProjectReferences, other.ProjectReferences, func(a, b *core.ProjectReference) bool {
			return a == b || a != nil && b != nil && *a == *b
		}) &&
		(p.ContentMappers == nil) == (other.ContentMappers == nil) &&
		slices.EqualFunc(p.ContentMappers, other.ContentMappers, (*contentmapper.Mapper).Equals)
}
