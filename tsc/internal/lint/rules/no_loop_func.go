package rules

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noLoopFuncRule struct {
	context            Context
	referencesBySymbol map[*ast.Symbol][]*ast.Node
	skippedIIFEs       map[*ast.Node]bool
}

func newNoLoopFuncRule(context Context) Rule {
	rule := &noLoopFuncRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindArrowFunction, ast.KindFunctionDeclaration, ast.KindFunctionExpression},
	}
}

func (rule *noLoopFuncRule) OnEnterNode(node *ast.Node) bool {
	rule.checkLoopFunction(node)
	return true
}

func noLoopFuncContains(outer, inner *ast.Node) bool {
	for node := inner; node != nil; node = node.Parent {
		if node == outer {
			return true
		}
	}
	return false
}

func noLoopFuncVariableScope(node *ast.Node) *ast.Node {
	for current := node.Parent; current != nil; current = current.Parent {
		if ast.IsFunctionLike(current) || current.Kind == ast.KindClassStaticBlockDeclaration || current.Kind == ast.KindPropertyDeclaration && noLoopFuncContains(current.Initializer(), node) || current.Kind == ast.KindSourceFile {
			return current
		}
	}
	return nil
}

func (rule *noLoopFuncRule) checkLoopFunction(node *ast.Node) {
	if node.Kind != ast.KindFunctionDeclaration && node.Kind != ast.KindFunctionExpression && node.Kind != ast.KindArrowFunction {
		return
	}
	loop := rule.containingLoop(node)
	if loop == nil || node.Body() == nil {
		return
	}
	outer := helpers.SharedParenthesizedOuter(node)
	if node.Kind != ast.KindFunctionDeclaration && node.ModifierFlags()&ast.ModifierFlagsAsync == 0 && node.BodyData().AsteriskToken == nil && outer.Parent != nil && outer.Parent.Kind == ast.KindCallExpression && outer.Parent.Expression() == outer {
		selfReferenced := false
		if node.Kind == ast.KindFunctionExpression && node.Name() != nil {
			selfReferenced = len(helpers.SharedBindingReferences(rule.context, &rule.referencesBySymbol, helpers.SharedBindingSymbol(rule.context, node.Name()))) != 0
		}
		if !selfReferenced {
			if rule.skippedIIFEs == nil {
				rule.skippedIIFEs = make(map[*ast.Node]bool)
			}
			rule.skippedIIFEs[node] = true
			return
		}
	}
	var unsafeNames []string
	seen := make(map[*ast.Symbol]bool)
	var visit func(*ast.Node) bool
	visit = func(child *ast.Node) bool {
		if helpers.SharedBindingReference(child) {
			symbol := helpers.SharedBindingSymbol(rule.context, child)
			if symbol != nil && !seen[symbol] {
				seen[symbol] = true
				local := false
				for _, declaration := range symbol.Declarations() {
					if noLoopFuncContains(node, declaration) {
						local = true
					}
				}
				if !local && !rule.safeLoopReference(loop, symbol) && !slices.Contains(unsafeNames, child.Text()) {
					unsafeNames = append(unsafeNames, child.Text())
				}
			}
		}
		child.ForEachChild(visit)
		return false
	}
	node.ForEachChild(visit)
	if len(unsafeNames) > 0 {
		rule.context.Report(rule.context.Range(node), diagnostics.Function_declared_in_a_loop_contains_unsafe_references_to_variable_s_0, "'"+strings.Join(unsafeNames, "', '")+"'")
	}
}

func (rule *noLoopFuncRule) containingLoop(node *ast.Node) *ast.Node {
	for parent := node.Parent; parent != nil; node, parent = parent, parent.Parent {
		switch parent.Kind {
		case ast.KindWhileStatement, ast.KindDoStatement:
			return parent
		case ast.KindForStatement:
			if parent.Initializer() != node {
				return parent
			}
		case ast.KindForInStatement, ast.KindForOfStatement:
			if parent.Expression() != node {
				return parent
			}
		case ast.KindFunctionDeclaration, ast.KindFunctionExpression, ast.KindArrowFunction, ast.KindMethodDeclaration, ast.KindConstructor, ast.KindGetAccessor, ast.KindSetAccessor:
			if !rule.skippedIIFEs[parent] {
				return nil
			}
		}
	}
	return nil
}

func (rule *noLoopFuncRule) safeLoopReference(loop *ast.Node, symbol *ast.Symbol) bool {
	declarations := symbol.Declarations()
	if len(declarations) == 0 {
		return true
	}
	declaration := ast.GetRootDeclaration(declarations[0])
	var lexicalList *ast.Node
	if declaration.Kind == ast.KindVariableDeclaration && declaration.Parent.Kind == ast.KindVariableDeclarationList {
		list := declaration.Parent
		if list.Flags&(ast.NodeFlagsConst|ast.NodeFlagsUsing|ast.NodeFlagsAwaitUsing) != 0 {
			return true
		}
		if list.Flags&ast.NodeFlagsLet != 0 {
			lexicalList = list
			if noLoopFuncContains(loop, list) {
				return true
			}
		}
	}
	topLoop := loop
	for current := rule.containingLoop(loop); current != nil; current = rule.containingLoop(current) {
		if lexicalList != nil && current.Pos() < lexicalList.End() {
			break
		}
		topLoop = current
	}
	border := topLoop.Pos()
	variableScope := noLoopFuncVariableScope(declaration)
	for _, reference := range helpers.SharedBindingReferences(rule.context, &rule.referencesBySymbol, symbol) {
		if ast.IsAssignmentTarget(reference) && (reference.Pos() >= border || noLoopFuncVariableScope(reference) != variableScope) {
			return false
		}
	}
	for _, binding := range declarations {
		root := ast.GetRootDeclaration(binding)
		if root.Kind != ast.KindVariableDeclaration {
			continue
		}
		if root.Initializer() != nil || root.Parent.Kind == ast.KindVariableDeclarationList && ast.IsForInOrOfStatement(root.Parent.Parent) {
			if root.Pos() >= border || noLoopFuncVariableScope(root) != variableScope {
				return false
			}
		}
	}
	return true
}
