package rules

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noEmptyFunction struct {
	helpers.DiagnosticSuggestions
	context Context
}

func newNoEmptyFunction(context Context) Rule { return &noEmptyFunction{context: context} }

func (rule *noEmptyFunction) OnEnterNode(node *ast.Node) bool {
	if ast.IsFunctionLike(node) && helpers.IsEmptyCommentFreeBlock(rule.context, node.Body()) {
		rule.emptyFunction(node)
	}

	return true
}

func (rule *noEmptyFunction) OnExitNode(node *ast.Node) {
}

func (rule *noEmptyFunction) Options() map[string]any {
	if len(rule.context.Options) > 0 {
		options, _ := rule.context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func (rule *noEmptyFunction) allow(name string) bool {
	values, _ := rule.Options()["allow"].([]any)
	return slices.Contains(values, any(name))
}

func (rule *noEmptyFunction) emptyFunction(node *ast.Node) {
	kind, description := "functions", "function"
	name := node.Name()
	switch node.Kind {
	case ast.KindArrowFunction:
		kind, description = "arrowFunctions", "arrow function"
	case ast.KindMethodDeclaration:
		kind, description = "methods", "method"
	case ast.KindGetAccessor:
		kind, description = "getters", "getter"
	case ast.KindSetAccessor:
		kind, description = "setters", "setter"
	case ast.KindConstructor:
		kind, description = "constructors", "constructor"
		for _, parameter := range node.Parameters() {
			if ast.GetCombinedModifierFlags(parameter)&ast.ModifierFlagsParameterPropertyModifier != 0 {
				return
			}
		}
		if ast.HasSyntacticModifier(node, ast.ModifierFlagsPrivate) && rule.allow("privateConstructors") || ast.HasSyntacticModifier(node, ast.ModifierFlagsProtected) && rule.allow("protectedConstructors") {
			return
		}
	}
	generator := node.Kind == ast.KindFunctionDeclaration && node.AsFunctionDeclaration().AsteriskToken != nil || node.Kind == ast.KindFunctionExpression && node.AsFunctionExpression().AsteriskToken != nil || node.Kind == ast.KindMethodDeclaration && node.AsMethodDeclaration().AsteriskToken != nil
	if node.Kind != ast.KindArrowFunction && (kind == "functions" || kind == "methods") {
		if generator {
			kind = "generator" + strings.ToUpper(kind[:1]) + kind[1:]
			description = "generator " + description
		} else if ast.HasSyntacticModifier(node, ast.ModifierFlagsAsync) {
			kind = "async" + strings.ToUpper(kind[:1]) + kind[1:]
			description = "async " + description
		}
	}
	if rule.allow(kind) {
		return
	}
	if node.Kind == ast.KindMethodDeclaration || node.Kind == ast.KindGetAccessor || node.Kind == ast.KindSetAccessor {
		if ast.HasSyntacticModifier(node, ast.ModifierFlagsOverride) && rule.allow("overrideMethods") || ast.HasSyntacticModifier(node, ast.ModifierFlagsDecorator) && rule.allow("decoratedFunctions") {
			return
		}
	}
	if node.Kind == ast.KindFunctionExpression && node.Parent.Kind == ast.KindPropertyAssignment {
		name = node.Parent.Name()
		description = strings.Replace(description, "function", "method", 1)
	}
	if ast.HasSyntacticModifier(node, ast.ModifierFlagsStatic) {
		description = "static " + description
	}
	if name != nil {
		if text, ok := helpers.StaticPropertyNameText(name); ok {
			description += " '" + text + "'"
		}
	}
	diagnostic := rule.context.Report(rule.context.Range(node.Body()), diagnostics.Unexpected_empty_0, description)
	if rule.context.NewTracker != nil {
		body := node.Body()
		start := scanner.GetTokenPosOfNode(body, rule.context.File, false)
		tracker := rule.context.NewTracker()
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start+1, body.End()-1), " /* empty */ ")
		rule.AddSuggestion(diagnostic, "no-empty-function", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Add_comment_inside_empty_0, description))
	}
}
