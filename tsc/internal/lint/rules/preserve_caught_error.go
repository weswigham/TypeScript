package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type preserveCaughtErrorRule struct {
	helpers.DiagnosticSuggestions
	context Context
}

func newPreserveCaughtErrorRule(context Context) Rule {
	return &preserveCaughtErrorRule{context: context}
}

func (rule *preserveCaughtErrorRule) OnEnterNode(node *ast.Node) bool {
	rule.caughtError(node)
	return true
}

func (rule *preserveCaughtErrorRule) OnExitNode(node *ast.Node) {}

func (rule *preserveCaughtErrorRule) caughtError(node *ast.Node) {
	if node.Kind != ast.KindThrowStatement {
		return
	}
	expression := ast.SkipParentheses(node.Expression())
	if expression == nil || expression.Kind != ast.KindCallExpression && expression.Kind != ast.KindNewExpression || expression.Flags&ast.NodeFlagsOptionalChain != 0 {
		return
	}
	var catch *ast.Node
	for ancestor := node.Parent; ancestor != nil; ancestor = ancestor.Parent {
		if ast.IsFunctionLike(ancestor) || ancestor.Kind == ast.KindClassStaticBlockDeclaration {
			return
		}
		if ancestor.Kind == ast.KindCatchClause {
			catch = ancestor
			break
		}
	}
	if catch == nil {
		return
	}
	if helpers.SharedOptionalChainBoundary(expression.Expression()) {
		return
	}
	callee := ast.SkipParentheses(expression.Expression())
	builtin := false
	name := ""
	if callee.Kind == ast.KindIdentifier {
		name = callee.Text()
		switch name {
		case "Error", "EvalError", "RangeError", "ReferenceError", "SyntaxError", "TypeError", "URIError", "AggregateError":
			builtin = helpers.StatementBuiltin(rule.context, callee, true)
		}
	} else if callee.Kind == ast.KindPropertyAccessExpression {
		name = callee.Name().Text()
	}
	optionsIndex := -1
	if builtin {
		optionsIndex = 1
		if name == "AggregateError" {
			optionsIndex = 2
		}
	} else if len(rule.context.Options) > 0 {
		options, _ := rule.context.Options[0].(map[string]any)
		if classes, ok := options["errorClassNames"].([]any); ok {
			for _, item := range classes {
				if class, ok := item.(string); ok && class == name {
					optionsIndex = 1
				} else if class, ok := item.(map[string]any); ok && class["name"] == name {
					optionsIndex = helpers.IntegerOptionValue(class["argumentPosition"], 2) - 1
				}
			}
		}
	}
	if optionsIndex < 0 {
		return
	}
	parameter := catch.AsCatchClause().VariableDeclaration
	if parameter != nil && parameter.Name().Kind != ast.KindIdentifier {
		rule.context.Report(rule.context.Range(catch), diagnostics.Re_throws_cannot_preserve_the_caught_error_as_a_part_of_it_is_being_lost_due_to_destructuring)
		return
	}
	if parameter == nil {
		if helpers.SharedRuleBoolean(rule.context.Options, "requireCatchParameter", false) {
			rule.context.Report(rule.context.Range(node), diagnostics.The_caught_error_is_not_accessible_because_the_catch_clause_lacks_the_error_parameter_Start_referencing_the_caught_error_using_the_catch_parameter)
		}
		return
	}
	arguments := expression.Arguments()
	for index := 0; index <= optionsIndex && index < len(arguments); index++ {
		if arguments[index].Kind == ast.KindSpreadElement {
			return
		}
	}
	var cause, causeProperty *ast.Node
	causeCount := 0
	if optionsIndex < len(arguments) {
		options := ast.SkipParentheses(arguments[optionsIndex])
		if options.Kind != ast.KindObjectLiteralExpression {
			return
		}
		for _, property := range options.AsObjectLiteralExpression().Properties.Nodes {
			if property.Kind == ast.KindSpreadAssignment {
				return
			}
			if propertyName, known := helpers.StaticMemberNameText(property); known && propertyName == "cause" {
				causeProperty = property
				causeCount++
				switch property.Kind {
				case ast.KindPropertyAssignment:
					cause = ast.SkipParentheses(property.Initializer())
				case ast.KindShorthandPropertyAssignment:
					cause = property.Name()
				default:
					cause = property
				}
			}
		}
	}
	if cause == nil {
		diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.There_is_no_cause_attached_to_the_symptom_error_being_thrown)
		rule.suggestMissingCause(diagnostic, expression, optionsIndex, builtin, name, parameter.Name().Text())
		return
	}
	if cause.Kind != ast.KindIdentifier || cause.Text() != parameter.Name().Text() {
		diagnostic := rule.context.Report(rule.context.Range(cause), diagnostics.The_symptom_error_is_being_thrown_with_an_incorrect_cause)
		if causeCount == 1 && rule.context.NewTracker != nil {
			replacement := parameter.Name().Text()
			target := cause
			if causeProperty.Kind != ast.KindPropertyAssignment {
				target = causeProperty
				replacement = "cause: " + replacement
			}
			start := scanner.GetTokenPosOfNode(target, rule.context.File, false)
			rule.suggestCause(diagnostic, start, target.End(), replacement)
		}
		return
	}
	checker := rule.context.GetChecker()
	symbol := checker.ResolveName(cause.Text(), node, ast.SymbolFlagsValue, false)
	if symbol != parameter.Symbol() {
		rule.context.Report(rule.context.Range(node), diagnostics.The_caught_error_is_being_attached_as_cause_but_is_shadowed_by_a_closer_scoped_redeclaration)
	}
}

func (rule *preserveCaughtErrorRule) suggestCause(diagnostic *ast.Diagnostic, start, end int, replacement string) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), replacement)
	rule.AddSuggestion(diagnostic, "preserve-caught-error", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Include_the_original_caught_error_as_the_cause_of_the_symptom_error))
}

func (rule *preserveCaughtErrorRule) suggestMissingCause(diagnostic *ast.Diagnostic, expression *ast.Node, optionsIndex int, builtin bool, name, caught string) {
	arguments := expression.Arguments()
	if optionsIndex < len(arguments) {
		options := ast.SkipParentheses(arguments[optionsIndex])
		properties := options.AsObjectLiteralExpression().Properties.Nodes
		position := scanner.GetTokenPosOfNode(options, rule.context.File, false) + 1
		text := "cause: " + caught
		if len(properties) > 0 {
			position = properties[len(properties)-1].End()
			text = ", " + text
		}
		rule.suggestCause(diagnostic, position, position, text)
		return
	}
	if !builtin && len(arguments) < optionsIndex {
		return
	}
	values := []string{}
	if builtin {
		for index := len(arguments); index < optionsIndex; index++ {
			if name == "AggregateError" && index == 0 {
				values = append(values, "[]")
			} else {
				values = append(values, `""`)
			}
		}
	}
	values = append(values, "{ cause: "+caught+" }")
	text := strings.Join(values, ", ")
	if len(arguments) > 0 {
		last := arguments[len(arguments)-1]
		rule.suggestCause(diagnostic, last.End(), last.End(), ", "+text)
		return
	}
	lexer := scanner.GetScannerForSourceFile(rule.context.File, expression.Expression().End())
	lexer.SetSkipTrivia(true)
	lexer.ResetPos(expression.Expression().End())
	if kind := lexer.Scan(); kind == ast.KindOpenParenToken && lexer.TokenEnd() <= expression.End() {
		position := lexer.TokenEnd()
		rule.suggestCause(diagnostic, position, position, text)
		return
	}
	rule.suggestCause(diagnostic, expression.End(), expression.End(), "("+text+")")
}
