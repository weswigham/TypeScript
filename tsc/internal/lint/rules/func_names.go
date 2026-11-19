package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type funcNamesRule struct{ context Context }

func newFuncNamesRule(context Context) Rule {
	rule := &funcNamesRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindFunctionDeclaration, ast.KindFunctionExpression},
	}
}

func (rule *funcNamesRule) OnEnterNode(node *ast.Node) bool {
	rule.checkFunctionNames(node)
	return true
}

func funcNamesInferredFunctionName(node *ast.Node) bool {
	outer := node
	for outer.Parent != nil && outer.Parent.Kind == ast.KindParenthesizedExpression {
		outer = outer.Parent
	}
	parent := outer.Parent
	if parent == nil {
		return false
	}
	switch parent.Kind {
	case ast.KindVariableDeclaration, ast.KindParameter, ast.KindBindingElement:
		return parent.Name().Kind == ast.KindIdentifier && parent.Initializer() == outer
	case ast.KindPropertyAssignment, ast.KindPropertyDeclaration:
		return parent.Initializer() == outer
	case ast.KindShorthandPropertyAssignment:
		return parent.AsShorthandPropertyAssignment().ObjectAssignmentInitializer == outer
	case ast.KindBinaryExpression:
		binary := parent.AsBinaryExpression()
		return ast.IsAssignmentOperator(binary.OperatorToken.Kind) && ast.SkipParentheses(binary.Left).Kind == ast.KindIdentifier && binary.Right == outer
	}
	return false
}

func (rule *funcNamesRule) checkFunctionNames(node *ast.Node) {
	if node.Kind != ast.KindFunctionExpression && !(node.Kind == ast.KindFunctionDeclaration && ast.HasSyntacticModifier(node, ast.ModifierFlagsDefault)) {
		return
	}
	mode := "always"
	if len(rule.context.Options) > 0 {
		mode = helpers.StringOptionValue(rule.context.Options[0], mode)
	}
	if node.BodyData().AsteriskToken != nil && len(rule.context.Options) > 1 {
		if options, ok := rule.context.Options[1].(map[string]any); ok {
			mode = helpers.StringOptionValue(options["generators"], mode)
		}
	}
	hasName := node.Name() != nil
	if hasName {
		var referenced func(*ast.Node) bool
		referenced = func(child *ast.Node) bool {
			if helpers.SharedValueReference(child) && child.Text() == node.Name().Text() {
				symbol := rule.context.GetChecker().ResolveName(child.Text(), child, ast.SymbolFlagsValue, false)
				if symbol != nil {
					if slices.Contains(symbol.Declarations(), node) {
						return true
					}
				}
			}
			return child.ForEachChild(referenced)
		}
		if node.ForEachChild(referenced) {
			return
		}
	}
	if mode == "never" {
		if hasName && node.Kind != ast.KindFunctionDeclaration {
			start, end := helpers.SharedFunctionHead(rule.context, node)
			rule.context.Report(core.NewTextRange(start, end), diagnostics.Unexpected_named_0, helpers.SharedFunctionName(node))
		}
		return
	}
	if hasName || mode == "as-needed" && funcNamesInferredFunctionName(node) {
		return
	}
	start, end := helpers.SharedFunctionHead(rule.context, node)
	rule.context.Report(core.NewTextRange(start, end), diagnostics.Unexpected_unnamed_0, helpers.SharedFunctionName(node))
}
