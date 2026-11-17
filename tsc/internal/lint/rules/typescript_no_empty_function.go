package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoEmptyFunctionRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func (rule *typescriptNoEmptyFunctionRule) OnEnterNode(node *ast.Node) bool {
	if helpers.FunctionHasBody(node) && helpers.IsEmptyCommentFreeBlock(rule.context, node.Body()) {
		rule.emptyFunction(node)
	}
	return true
}

func (rule *typescriptNoEmptyFunctionRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptNoEmptyFunctionRule) emptyFunction(node *ast.Node) {
	allow := helpers.TypescriptSyntaxStrings(rule.Options()["allow"])
	allowed := func(kind string) bool { return slices.Contains(allow, kind) }
	kind := "functions"
	switch node.Kind {
	case ast.KindArrowFunction:
		kind = "arrowFunctions"
	case ast.KindConstructor:
		kind = "constructors"
		if ast.HasSyntacticModifier(node, ast.ModifierFlagsPrivate) && allowed("private-constructors") || ast.HasSyntacticModifier(node, ast.ModifierFlagsProtected) && allowed("protected-constructors") {
			return
		}
		for _, parameter := range node.Parameters() {
			if ast.HasSyntacticModifier(parameter, ast.ModifierFlagsAccessibilityModifier|ast.ModifierFlagsReadonly|ast.ModifierFlagsOverride) {
				return
			}
		}
	case ast.KindGetAccessor:
		kind = "getters"
	case ast.KindSetAccessor:
		kind = "setters"
	case ast.KindMethodDeclaration:
		kind = "methods"
	}
	if node.Kind == ast.KindFunctionExpression && node.Parent != nil && node.Parent.Kind == ast.KindPropertyAssignment {
		kind = "functions"
	}
	if node.BodyData() != nil && node.BodyData().AsteriskToken != nil {
		if kind == "methods" {
			kind = "generatorMethods"
		} else {
			kind = "generatorFunctions"
		}
	} else if ast.HasSyntacticModifier(node, ast.ModifierFlagsAsync) && kind != "arrowFunctions" {
		if kind == "methods" {
			kind = "asyncMethods"
		} else {
			kind = "asyncFunctions"
		}
	}
	if allowed(kind) || node.Parent != nil && ast.IsClassLike(node.Parent) && (allowed("decoratedFunctions") && ast.HasSyntacticModifier(node, ast.ModifierFlagsDecorator) || allowed("overrideMethods") && ast.HasSyntacticModifier(node, ast.ModifierFlagsOverride)) {
		return
	}
	diagnostic := rule.context.Report(rule.context.Range(node.Body()), diagnostics.Unexpected_empty_0, helpers.FunctionDiagnosticName(node))
	if rule.context.NewTracker != nil {
		tracker := rule.context.NewTracker()
		start := scanner.GetTokenPosOfNode(node.Body(), rule.context.File, false) + 1
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, start), " /* empty */ ")
		rule.suggest(diagnostic, tracker, ast.NewCompilerDiagnostic(diagnostics.Add_comment_inside_empty_0, helpers.FunctionDiagnosticName(node)))
	}
}

func (rule *typescriptNoEmptyFunctionRule) Options() map[string]any {
	options, _ := rule.option(0).(map[string]any)
	return options
}

func (rule *typescriptNoEmptyFunctionRule) suggest(diagnostic *ast.Diagnostic, tracker *change.Tracker, description *ast.Diagnostic) {
	rule.AddSuggestion(diagnostic, "@typescript-eslint/no-empty-function", tracker.GetTextChanges(), description)
}

func (rule *typescriptNoEmptyFunctionRule) option(index int) any {
	if index < len(rule.context.Options) {
		return rule.context.Options[index]
	}
	return nil
}

func newTypeScriptNoEmptyFunction(context Context) Rule {
	return &typescriptNoEmptyFunctionRule{context: context}
}
