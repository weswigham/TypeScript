package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type complexityRule struct{ context Context }

func newComplexityRule(context Context) Rule {
	rule := &complexityRule{context: context}

	return Rule{
		Enter: rule.OnEnterNode,
		EnterKinds: []ast.Kind{
			ast.KindFunctionDeclaration,
			ast.KindFunctionExpression,
			ast.KindArrowFunction,
			ast.KindMethodDeclaration,
			ast.KindGetAccessor,
			ast.KindSetAccessor,
			ast.KindConstructor,
			ast.KindPropertyDeclaration,
			ast.KindClassStaticBlockDeclaration,
		},
	}
}

func (rule *complexityRule) OnEnterNode(node *ast.Node) bool {
	rule.checkComplexity(node)
	return true
}

func (rule *complexityRule) checkComplexity(node *ast.Node) {
	var roots []*ast.Node
	name := ""
	start := scanner.GetTokenPosOfNode(node, rule.context.File, false)
	var end int
	if helpers.FunctionHasBody(node) {
		roots = append(roots, node.Parameters()...)
		roots = append(roots, node.Body())
		name = helpers.CapitalizeFirstRune(helpers.SharedFunctionName(node))
		start, end = helpers.SharedFunctionHead(rule.context, node)
	} else if node.Kind == ast.KindPropertyDeclaration && node.Initializer() != nil {
		roots = []*ast.Node{node.Initializer()}
		name = "Class field initializer"
		start = scanner.GetTokenPosOfNode(node.Initializer(), rule.context.File, false)
		end = node.Initializer().End()
	} else if node.Kind == ast.KindClassStaticBlockDeclaration {
		roots = []*ast.Node{node.AsClassStaticBlockDeclaration().Body}
		name = "Class static block"
		end = start + len("static")
	} else {
		return
	}
	maximum := 20
	modified := false
	if len(rule.context.Options) > 0 {
		if options, ok := rule.context.Options[0].(map[string]any); ok {
			if options["maximum"] != nil && helpers.IntegerOptionValue(options["maximum"], 0) != 0 {
				maximum = helpers.IntegerOptionValue(options["maximum"], maximum)
			} else {
				maximum = helpers.IntegerOptionValue(options["max"], maximum)
			}
			modified = options["variant"] == "modified"
		} else {
			maximum = helpers.IntegerOptionValue(rule.context.Options[0], maximum)
		}
	}
	count := 1
	var visit func(*ast.Node)
	visit = func(child *ast.Node) {
		if child == nil {
			return
		}
		if ast.IsFunctionLike(child) || child.Kind == ast.KindPropertyDeclaration {
			if key := child.Name(); key != nil && key.Kind == ast.KindComputedPropertyName {
				visit(key.Expression())
			}
			return
		}
		if child.Kind == ast.KindClassStaticBlockDeclaration {
			return
		}
		switch child.Kind {
		case ast.KindCatchClause, ast.KindConditionalExpression, ast.KindForStatement, ast.KindForInStatement, ast.KindForOfStatement, ast.KindIfStatement, ast.KindWhileStatement, ast.KindDoStatement:
			count++
		case ast.KindParameter, ast.KindBindingElement:
			if child.Initializer() != nil {
				count++
			}
		case ast.KindShorthandPropertyAssignment:
			if child.AsShorthandPropertyAssignment().ObjectAssignmentInitializer != nil {
				count++
			}
		case ast.KindBinaryExpression:
			operator := child.AsBinaryExpression().OperatorToken.Kind
			if ast.IsLogicalOrCoalescingBinaryOperator(operator) || ast.IsLogicalOrCoalescingAssignmentOperator(operator) || operator == ast.KindEqualsToken && ast.IsAssignmentTarget(child) {
				count++
			}
		case ast.KindCaseClause:
			if !modified {
				count++
			}
		case ast.KindSwitchStatement:
			if modified {
				count++
			}
		case ast.KindCallExpression:
			if child.AsCallExpression().QuestionDotToken != nil {
				count++
			}
		case ast.KindPropertyAccessExpression:
			if child.AsPropertyAccessExpression().QuestionDotToken != nil {
				count++
			}
		case ast.KindElementAccessExpression:
			if child.AsElementAccessExpression().QuestionDotToken != nil {
				count++
			}
		}
		child.ForEachChild(func(descendant *ast.Node) bool {
			visit(descendant)
			return false
		})
	}
	for _, root := range roots {
		visit(root)
	}
	if count > maximum {
		rule.context.Report(core.NewTextRange(start, end), diagnostics.X_0_has_a_complexity_of_1_Maximum_allowed_is_2, name, count, maximum)
	}
}
