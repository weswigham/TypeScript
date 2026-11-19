package rules

import (
	"strings"
	"unicode"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typeScriptConsistentReturn struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptConsistentReturn(context Context) Rule {
	rule := &typeScriptConsistentReturn{context: context}

	return Rule{
		Exit: rule.OnExitNode,
		ExitKinds: []ast.Kind{
			ast.KindFunctionDeclaration,
			ast.KindMethodDeclaration,
			ast.KindConstructor,
			ast.KindGetAccessor,
			ast.KindSetAccessor,
			ast.KindFunctionExpression,
			ast.KindArrowFunction,
			ast.KindMethodSignature,
			ast.KindCallSignature,
			ast.KindJSDocSignature,
			ast.KindConstructSignature,
			ast.KindIndexSignature,
			ast.KindFunctionType,
			ast.KindConstructorType,
		},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typeScriptConsistentReturn) OnExitNode(node *ast.Node) {
	if !ast.IsFunctionLike(node) || node.Body() == nil || node.Body().Kind != ast.KindBlock {
		return
	}
	body := node.Body()
	void := rule.void(node)
	first, expectsValue := true, false
	name := typeScriptConsistentReturnFunctionName(node)
	upperName := strings.ToUpper(name[:1]) + name[1:]
	ast.ForEachReturnStatement(body, func(statement *ast.Node) bool {
		expression := statement.Expression()
		if expression == nil && void {
			return false
		}
		hasValue := expression != nil
		if hasValue && helpers.SemanticSyntaxBoolean(rule.context, "treatUndefinedAsUnspecified") {
			value := rule.context.GetChecker().GetTypeAtLocation(expression)
			expression = ast.SkipParentheses(expression)
			hasValue = value.Flags() != checker.TypeFlagsUndefined && expression.Kind != ast.KindVoidExpression && !(expression.Kind == ast.KindIdentifier && expression.Text() == "undefined")
		}
		if first {
			first = false
			expectsValue = hasValue
		} else if hasValue != expectsValue {
			message := diagnostics.X_0_expected_no_return_value
			if expectsValue {
				message = diagnostics.X_0_expected_a_return_value
			}
			rule.context.Report(rule.context.Range(statement), message, upperName)
		}
		return false
	})
	if !expectsValue || node.Kind == ast.KindConstructor {
		return
	}
	if node.Kind == ast.KindFunctionDeclaration || node.Kind == ast.KindFunctionExpression {
		if node.Name() != nil {
			for _, character := range node.Name().Text() {
				if unicode.IsUpper(character) {
					return
				}
				break
			}
		}
	}
	flow := helpers.ReturnFlowAnalysis{}
	if helpers.CompletionHasNormal(flow.Statement(body, nil)) {
		target := node
		if node.Name() != nil {
			target = node.Name()
		}
		rule.context.Report(rule.context.Range(target), diagnostics.Expected_to_return_a_value_at_the_end_of_0, name)
	}
}

func (rule *typeScriptConsistentReturn) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func typeScriptConsistentReturnFunctionName(node *ast.Node) string {
	name, kind := "", "function"
	if node.Kind == ast.KindArrowFunction {
		kind = "arrow function"
	}
	if node.Kind == ast.KindMethodDeclaration || node.Kind == ast.KindMethodSignature {
		kind = "method"
	}
	if node.Kind == ast.KindGetAccessor {
		kind = "getter"
	}
	if node.Kind == ast.KindSetAccessor {
		kind = "setter"
	}
	if node.Kind == ast.KindConstructor {
		return "constructor"
	}
	if node.Name() != nil {
		name, _ = helpers.SemanticSyntaxPropertyName(node.Name())
	}
	if ast.GetCombinedModifierFlags(node)&ast.ModifierFlagsAsync != 0 {
		kind = "async " + kind
	}
	if name != "" {
		return kind + " '" + name + "'"
	}
	return kind
}

func typeScriptConsistentReturnPromiseVoid(c *checker.Checker, value *checker.Type, seen map[*checker.Type]bool) bool {
	if value == nil || seen[value] || value.ObjectFlags()&checker.ObjectFlagsReference == 0 {
		return false
	}
	seen[value] = true
	then := c.GetTypeOfPropertyOfType(value, "then")
	if then == nil || len(c.GetSignaturesOfType(then, checker.SignatureKindCall)) == 0 {
		return false
	}
	arguments := c.GetTypeArguments(value)
	return len(arguments) > 0 && (helpers.SemanticSyntaxHas(arguments[0], checker.TypeFlagsVoid) || typeScriptConsistentReturnPromiseVoid(c, arguments[0], seen))
}

func (rule *typeScriptConsistentReturn) void(node *ast.Node) bool {
	c := rule.context.GetChecker()
	async := ast.GetCombinedModifierFlags(node)&ast.ModifierFlagsAsync != 0
	for _, signature := range c.GetSignaturesOfType(c.GetTypeAtLocation(node), checker.SignatureKindCall) {
		value := c.GetReturnTypeOfSignature(signature)
		if !async && helpers.SemanticSyntaxHas(value, checker.TypeFlagsVoid) || async && typeScriptConsistentReturnPromiseVoid(c, value, make(map[*checker.Type]bool)) {
			return true
		}
	}
	return false
}
