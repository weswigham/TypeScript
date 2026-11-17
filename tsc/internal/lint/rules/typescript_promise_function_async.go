package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptPromiseFunctionAsyncRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func (rule *typescriptPromiseFunctionAsyncRule) OnEnterNode(node *ast.Node) bool {
	option := ""
	switch node.Kind {
	case ast.KindArrowFunction:
		option = "checkArrowFunctions"
	case ast.KindFunctionDeclaration:
		option = "checkFunctionDeclarations"
	case ast.KindFunctionExpression:
		option = "checkFunctionExpressions"
	case ast.KindMethodDeclaration:
		option = "checkMethodDeclarations"
		if node.Parent.Kind == ast.KindObjectLiteralExpression {
			option = "checkFunctionExpressions"
		}
	default:
		return true
	}
	if node.Body() == nil || node.ModifierFlags()&(ast.ModifierFlagsAsync|ast.ModifierFlagsAbstract) != 0 || !helpers.TypeSafetyBool(rule.context, option, true) {
		return true
	}
	c := rule.context.GetChecker()
	signatures := c.GetSignaturesOfType(c.GetTypeAtLocation(node), checker.SignatureKindCall)
	if len(signatures) == 0 {
		return true
	}
	names := map[string]bool{"Promise": true}
	if allowed, ok := helpers.TypeSafetyOptions(rule.context)["allowedPromiseNames"].([]any); ok {
		for _, name := range allowed {
			if text, ok := name.(string); ok {
				names[text] = true
			}
		}
	}
	unknown, matches, hybrid := false, true, false
	for _, signature := range signatures {
		value := c.GetReturnTypeOfSignature(signature)
		unknown = unknown || helpers.TypeSafetyHasFlag(value, checker.TypeFlagsAny|checker.TypeFlagsUnknown)
		matches = matches && helpers.PromiseMatchesNames(c, value, names, node.Type() == nil, make(map[*checker.Type]bool))
		if value.IsUnion() && !helpers.PromiseMatchesNames(c, value, names, false, make(map[*checker.Type]bool)) {
			hybrid = true
		}
	}
	unknown = unknown && !helpers.TypeSafetyBool(rule.context, "allowAny", true)
	if !matches && !unknown {
		return true
	}
	message := diagnostics.Functions_that_return_promises_must_be_async
	if hybrid && !unknown {
		message = diagnostics.Functions_that_return_promises_must_be_async_Consider_adding_an_explicit_return_type_annotation_if_the_function_is_intended_to_return_a_union_of_promise_and_non_promise_types
	}
	diagnostic := rule.context.Report(helpers.TypeSafetyFunctionHead(rule.context, node), message)
	if !unknown && rule.context.NewTracker != nil {
		position := scanner.GetTokenPosOfNode(node, rule.context.File, false)
		if node.Kind == ast.KindMethodDeclaration {
			position = scanner.GetTokenPosOfNode(node.Name(), rule.context.File, false)
			if asterisk := node.AsMethodDeclaration().AsteriskToken; asterisk != nil {
				position = scanner.GetTokenPosOfNode(asterisk, rule.context.File, false)
			}
		}
		text := "async "
		if position > 0 && scanner.IsIdentifierPart(rune(rule.context.File.Text()[position-1])) {
			text = " " + text
		}
		tracker := rule.context.NewTracker()
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(position, position), text)
		rule.AddSuggestion(diagnostic, "@typescript-eslint/promise-function-async", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Mark_the_function_async))
	}
	return true
}

func (rule *typescriptPromiseFunctionAsyncRule) OnExitNode(node *ast.Node) {}

func newTypeScriptPromiseFunctionAsync(context Context) Rule {
	return &typescriptPromiseFunctionAsyncRule{context: context}
}
