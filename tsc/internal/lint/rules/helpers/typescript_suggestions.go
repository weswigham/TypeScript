package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
)

type DiagnosticSuggestions struct {
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func (suggestions *DiagnosticSuggestions) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return suggestions.suggestions
}

func (suggestions *DiagnosticSuggestions) AddSuggestion(diagnostic *ast.Diagnostic, name string, changes []codefix.FileTextChanges, description *ast.Diagnostic) {
	if suggestions.suggestions == nil {
		suggestions.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
	}
	suggestions.suggestions[diagnostic] = append(suggestions.suggestions[diagnostic], codefix.CreateCodeFixAction(name, changes, description, "", nil))
}
