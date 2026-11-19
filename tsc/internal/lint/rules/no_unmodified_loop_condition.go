package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noUnmodifiedLoopCondition struct {
	helpers.SharedControlFlowContext
}

func newNoUnmodifiedLoopCondition(context Context) Rule {
	rule := &noUnmodifiedLoopCondition{Context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindWhileStatement, ast.KindDoStatement, ast.KindForStatement},
	}
}

func (rule *noUnmodifiedLoopCondition) OnEnterNode(node *ast.Node) bool {
	if helpers.ControlFlowLoopCondition(node) != nil {
		rule.unmodifiedCondition(node)
	}
	return true
}

type controlFlowCondition struct {
	node, group *ast.Node
	symbol      *ast.Symbol
	modified    bool
}

func controlFlowDynamic(node *ast.Node) bool {
	if ast.IsFunctionLike(node) || ast.IsClassLike(node) {
		return false
	}
	switch node.Kind {
	case ast.KindCallExpression, ast.KindNewExpression, ast.KindPropertyAccessExpression, ast.KindElementAccessExpression, ast.KindTaggedTemplateExpression, ast.KindYieldExpression:
		return true
	}
	return node.ForEachChild(controlFlowDynamic)
}

func (rule *noUnmodifiedLoopCondition) unmodifiedCondition(loop *ast.Node) {
	condition := helpers.ControlFlowLoopCondition(loop)
	var conditions []*controlFlowCondition
	var collect func(*ast.Node, *ast.Node)
	collect = func(node, group *ast.Node) {
		if node == nil || ast.IsFunctionLike(node) || ast.IsClassLike(node) {
			return
		}
		switch node.Kind {
		case ast.KindCallExpression, ast.KindNewExpression, ast.KindPropertyAccessExpression, ast.KindElementAccessExpression, ast.KindTaggedTemplateExpression, ast.KindYieldExpression:
			return
		case ast.KindBinaryExpression:
			operator := node.AsBinaryExpression().OperatorToken.Kind
			if !ast.IsAssignmentOperator(operator) && !ast.IsLogicalOrCoalescingBinaryOperator(operator) && operator != ast.KindCommaToken {
				if controlFlowDynamic(node) {
					return
				}
				if group == nil {
					group = node
				}
			}
		case ast.KindConditionalExpression:
			if rule.Options()["checkConditionalExpressions"] != true {
				if controlFlowDynamic(node) {
					return
				}
				if group == nil {
					group = node
				}
			}
		case ast.KindIdentifier:
			symbol := rule.Context.GetChecker().GetSymbolAtLocation(node)
			if symbol != nil && len(symbol.Declarations()) != 0 && ast.GetSourceFileOfNode(symbol.Declarations()[0]) == rule.Context.File {
				conditions = append(conditions, &controlFlowCondition{node: node, group: group, symbol: symbol})
			}
		}
		node.ForEachChild(func(child *ast.Node) bool { collect(child, group); return false })
	}
	collect(condition, nil)
	inside := func(node *ast.Node) bool {
		if node.Pos() < loop.Pos() || node.End() > loop.End() {
			return false
		}
		if loop.Kind == ast.KindForStatement {
			initializer := loop.AsForStatement().Initializer
			if initializer != nil && node.Pos() >= initializer.Pos() && node.End() <= initializer.End() {
				return false
			}
		}
		return true
	}
	var references []*ast.Node
	var visit func(*ast.Node)
	visit = func(node *ast.Node) {
		if node.Kind == ast.KindIdentifier {
			references = append(references, node)
		}
		node.ForEachChild(func(child *ast.Node) bool { visit(child); return false })
	}
	visit(rule.Context.File.AsNode())
	for _, reference := range references {
		if !ast.IsWriteAccess(reference) {
			continue
		}
		if reference.Parent.Kind == ast.KindVariableDeclaration && reference.Parent.Name() == reference {
			declaration := reference.Parent
			if declaration.Initializer() == nil || declaration.Parent.Flags&ast.NodeFlagsBlockScoped != 0 {
				continue
			}
		}
		modified := inside(reference)
		if !modified {
			for owner := reference.Parent; owner != nil; owner = owner.Parent {
				if owner.Kind != ast.KindFunctionDeclaration || owner.Name() == nil {
					continue
				}
				function := rule.Context.GetChecker().GetSymbolAtLocation(owner.Name())
				for _, use := range references {
					if function != nil && inside(use) && use != owner.Name() && rule.Context.GetChecker().GetSymbolAtLocation(use) == function {
						modified = true
						break
					}
				}
				break
			}
		}
		if modified {
			symbol := rule.Context.GetChecker().GetSymbolAtLocation(reference)
			for _, item := range conditions {
				if item.symbol == symbol {
					item.modified = true
				}
			}
		}
	}
	groups := make(map[*ast.Node]bool)
	for _, item := range conditions {
		if item.group != nil {
			groups[item.group] = groups[item.group] || item.modified
		}
	}
	for _, item := range conditions {
		if !item.modified && !groups[item.group] {
			rule.ReportOnce(item.node, diagnostics.X_0_is_not_modified_in_this_loop, item.node.Text())
		}
	}
}
