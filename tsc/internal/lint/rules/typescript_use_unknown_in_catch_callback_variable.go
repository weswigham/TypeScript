package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptUseUnknownInCatchCallbackVariableRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func newTypeScriptUseUnknownInCatchCallbackVariable(context Context) Rule {
	rule := &typescriptUseUnknownInCatchCallbackVariableRule{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindCallExpression},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptUseUnknownInCatchCallbackVariableRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindCallExpression {
		return true
	}
	object, method := helpers.TypeSafetyMember(rule.context, node.Expression())
	index, appendText := 0, ""
	if method == "then" {
		index, appendText = 1, " rejection"
	} else if method != "catch" {
		return true
	}
	if len(node.Arguments()) <= index {
		return true
	}
	for _, argument := range node.Arguments()[:index+1] {
		if argument.Kind == ast.KindSpreadElement {
			return true
		}
	}
	if helpers.PromiseHasThenProperty(rule.context.GetChecker(), object) {
		rule.check(node.Arguments()[index], method, appendText)
	}
	return true
}

func (rule *typescriptUseUnknownInCatchCallbackVariableRule) check(node *ast.Node, method, appendText string) {
	node = ast.SkipParentheses(node)
	switch node.Kind {
	case ast.KindBinaryExpression:
		binary := node.AsBinaryExpression()
		switch binary.OperatorToken.Kind {
		case ast.KindAmpersandAmpersandToken, ast.KindBarBarToken, ast.KindQuestionQuestionToken:
			rule.check(binary.Left, method, appendText)
			rule.check(binary.Right, method, appendText)
		case ast.KindCommaToken:
			rule.check(binary.Right, method, appendText)
		}
		return
	case ast.KindConditionalExpression:
		conditional := node.AsConditionalExpression()
		rule.check(conditional.WhenTrue, method, appendText)
		rule.check(conditional.WhenFalse, method, appendText)
		return
	case ast.KindArrowFunction, ast.KindFunctionExpression:
		if !rule.flagged(node) {
			return
		}
	default:
		return
	}
	parameter := node.Parameters()[0]
	declaration := parameter.AsParameterDeclaration()
	message := diagnostics.Prefer_the_safe_Colon_unknown_for_a_0_1_callback_variable
	if declaration.DotDotDotToken == nil {
		if parameter.Name().Kind == ast.KindArrayBindingPattern {
			message = diagnostics.Prefer_the_safe_Colon_unknown_for_a_0_1_callback_variable_The_thrown_error_may_not_be_iterable
		} else if parameter.Name().Kind == ast.KindObjectBindingPattern {
			message = diagnostics.Prefer_the_safe_Colon_unknown_for_a_0_1_callback_variable_The_thrown_error_may_be_nullable_or_may_not_have_the_expected_shape
		}
	}
	diagnostic := rule.context.Report(rule.context.Range(parameter), message, method, appendText)
	if rule.context.NewTracker == nil || declaration.DotDotDotToken == nil && parameter.Name().Kind != ast.KindIdentifier {
		return
	}
	annotation := "unknown"
	description := ast.NewCompilerDiagnostic(diagnostics.Add_an_explicit_Colon_unknown_type_annotation_to_the_rejection_callback_variable)
	if declaration.DotDotDotToken != nil {
		annotation = "[unknown]"
		description = ast.NewCompilerDiagnostic(diagnostics.Add_an_explicit_Colon_unknown_type_annotation_to_the_rejection_callback_rest_variable)
	}
	tracker := rule.context.NewTracker()
	if parameter.Type() != nil {
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(scanner.GetTokenPosOfNode(parameter.Type(), rule.context.File, false), parameter.Type().End()), annotation)
		description = ast.NewCompilerDiagnostic(diagnostics.Change_existing_type_annotation_to_Colon_0, annotation)
	} else {
		position := parameter.Name().End()
		if declaration.QuestionToken != nil {
			position = declaration.QuestionToken.End()
		}
		parenless := node.Kind == ast.KindArrowFunction && scanner.GetTokenPosOfNode(node, rule.context.File, false) == scanner.GetTokenPosOfNode(parameter, rule.context.File, false)
		if parenless {
			start := scanner.GetTokenPosOfNode(parameter, rule.context.File, false)
			tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, start), "(")
			tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(position, position), ": "+annotation+")")
		} else {
			tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(position, position), ": "+annotation)
		}
	}
	rule.AddSuggestion(diagnostic, "@typescript-eslint/use-unknown-in-catch-callback-variable", tracker.GetTextChanges(), description)
}

func (rule *typescriptUseUnknownInCatchCallbackVariableRule) flagged(node *ast.Node) bool {
	c := rule.context.GetChecker()
	for _, part := range helpers.TypeSafetyUnionParts(c.GetTypeAtLocation(node)) {
		for _, signature := range c.GetSignaturesOfType(c.GetApparentType(part), checker.SignatureKindCall) {
			parameters := signature.Parameters()
			if len(parameters) == 0 {
				continue
			}
			value := c.GetTypeOfSymbol(parameters[0])
			if declaration := parameters[0].ValueDeclaration(); declaration != nil && declaration.Kind == ast.KindParameter && declaration.AsParameterDeclaration().DotDotDotToken != nil {
				if !c.IsArrayType(value) && !checker.IsTupleType(value) {
					return true
				}
				arguments := c.GetTypeArguments(value)
				if len(arguments) == 0 {
					return true
				}
				value = arguments[0]
			}
			if value.Flags()&checker.TypeFlagsUnknown == 0 {
				return true
			}
		}
	}
	return false
}
