package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoMeaninglessVoidOperatorRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func (rule *typescriptNoMeaninglessVoidOperatorRule) meaninglessVoid(node *ast.Node) {
	inner := typeSafetyVoidArgument(node.Expression())
	typeChecker := rule.context.GetChecker()
	valueType := typeChecker.GetTypeAtLocation(node.Expression())
	var diagnostic *ast.Diagnostic
	suggest := false
	if inner.Kind != ast.KindCallExpression {
		if helpers.SharedNumericLiteralEquals(inner, 0) || inner.Kind == ast.KindBinaryExpression && ast.IsAssignmentOperator(inner.AsBinaryExpression().OperatorToken.Kind) || helpers.PromiseThenableWithRestCallback(rule.context, node.Expression(), valueType) {
			return
		}
		diagnostic = rule.context.Report(rule.context.Range(node), diagnostics.X_void_operator_is_useless_here_it_should_only_discard_a_call_s_return_value)
		_, parent := helpers.OuterParenthesizedNodeAndParent(node)
		if parent == nil || parent.Kind != ast.KindExpressionStatement {
			return
		}
	} else {
		allVoid := true
		allVoidOrNever := true
		for _, part := range helpers.TypeSafetyUnionParts(valueType) {
			allVoid = allVoid && part.Flags()&(checker.TypeFlagsVoid|checker.TypeFlagsUndefined) != 0
			allVoidOrNever = allVoidOrNever && part.Flags()&(checker.TypeFlagsVoid|checker.TypeFlagsUndefined|checker.TypeFlagsNever) != 0
		}
		checkNever := helpers.BooleanRuleOption(rule.context, "checkNever", false)
		if !allVoid && (!checkNever || !allVoidOrNever) {
			return
		}
		diagnostic = rule.context.Report(rule.context.Range(node), diagnostics.X_void_operator_shouldn_t_be_used_on_0_it_should_convey_that_a_return_value_is_being_ignored, typeChecker.TypeToString(valueType))
		suggest = !allVoid
	}
	if rule.context.NewTracker == nil {
		return
	}
	start := scanner.GetTokenPosOfNode(node, rule.context.File, false)
	tokens := scanner.GetScannerForSourceFile(rule.context.File, start)
	tokens.Scan()
	tracker := rule.context.NewTracker()
	tracker.DeleteRange(rule.context.File, core.NewTextRange(start, tokens.TokenStart()))
	name := "@typescript-eslint/" + "no-meaningless-void-operator"
	if suggest {
		rule.AddSuggestion(diagnostic, name, tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Remove_void))
	} else {
		diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Remove_void), name, ast.NewCompilerDiagnostic(diagnostics.Remove_void)))
	}
}

func (rule *typescriptNoMeaninglessVoidOperatorRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindVoidExpression {
		rule.meaninglessVoid(node)
	}
	return true
}

func (rule *typescriptNoMeaninglessVoidOperatorRule) OnExitNode(node *ast.Node) {}

func typeSafetyVoidArgument(node *ast.Node) *ast.Node {
	for {
		node = ast.SkipParentheses(node)
		switch node.Kind {
		case ast.KindAsExpression, ast.KindTypeAssertionExpression, ast.KindNonNullExpression, ast.KindSatisfiesExpression:
			node = node.Expression()
		case ast.KindBinaryExpression:
			if node.AsBinaryExpression().OperatorToken.Kind != ast.KindCommaToken {
				return node
			}
			node = node.AsBinaryExpression().Right
		default:
			return node
		}
	}
}

func newTypeScriptNoMeaninglessVoidOperator(context Context) Rule {
	return &typescriptNoMeaninglessVoidOperatorRule{context: context}
}
