package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
)

type UsageReference struct {
	Node, Owner *ast.Node
	Read, Write bool
}

type UsageBinding struct {
	Name        string
	Identifier  *ast.Node
	Declaration *ast.Node
	Root        *ast.Node
	Owner       *ast.Node
	References  []UsageReference
	Exported    bool
	Parameter   bool
	Caught      bool
	Array       bool
}

type UsageModel struct {
	context   Context
	Bindings  []*UsageBinding
	symbols   map[*ast.Symbol]*UsageBinding
	nodes     map[*ast.Node]*UsageBinding
	Graphs    []*UsageGraph
	functions []*ast.Node
	Globals   []*UsageGlobal
}

func UsageOwner(node *ast.Node) *ast.Node {
	for node != nil {
		if node.Kind == ast.KindSourceFile || ast.IsFunctionLike(node) || node.Kind == ast.KindClassStaticBlockDeclaration || node.Kind == ast.KindPropertyDeclaration && node.Initializer() != nil {
			return node
		}
		node = node.Parent
	}
	return nil
}

func usageRoot(node *ast.Node) *ast.Node {
	for node != nil && node.Kind == ast.KindBindingElement {
		node = node.Parent.Parent
	}
	return node
}

func UsageTypeOnly(node *ast.Node) bool {
	for current := node; current != nil && current.Kind != ast.KindSourceFile; current = current.Parent {
		if ast.IsTypeNode(current) && (current.Kind != ast.KindExpressionWithTypeArguments || ast.IsPartOfTypeNode(current)) || current.Kind == ast.KindInterfaceDeclaration || current.Kind == ast.KindTypeAliasDeclaration || current.Kind == ast.KindTypeParameter {
			return true
		}
		if current.Kind == ast.KindImportSpecifier && current.AsImportSpecifier().IsTypeOnly || current.Kind == ast.KindImportClause && current.AsImportClause().IsTypeOnly() || current.Kind == ast.KindExportSpecifier && current.AsExportSpecifier().IsTypeOnly || current.Kind == ast.KindExportDeclaration && current.AsExportDeclaration().IsTypeOnly {
			return true
		}
		if ast.IsExpression(current) && current != node && current.Kind != ast.KindPropertyAccessExpression && current.Kind != ast.KindParenthesizedExpression {
			break
		}
	}
	return false
}

func usageDeclaration(node *ast.Node) bool {
	if node.Kind != ast.KindIdentifier || !ast.IsDeclarationName(node) {
		return false
	}
	switch node.Parent.Kind {
	case ast.KindVariableDeclaration, ast.KindBindingElement, ast.KindParameter, ast.KindFunctionDeclaration, ast.KindFunctionExpression, ast.KindClassDeclaration, ast.KindClassExpression, ast.KindImportClause, ast.KindImportSpecifier, ast.KindNamespaceImport, ast.KindImportEqualsDeclaration:
		return !UsageTypeOnly(node)
	}
	return false
}

func usageReferenceNode(node *ast.Node) bool {
	if node.Kind != ast.KindIdentifier || node.Parent == nil || UsageTypeOnly(node) {
		return false
	}
	parent := node.Parent
	if parent.Kind == ast.KindShorthandPropertyAssignment {
		return true
	}
	if parent.Kind == ast.KindExportSpecifier {
		export := parent.Parent.Parent
		return export.AsExportDeclaration().ModuleSpecifier == nil && (parent.AsExportSpecifier().PropertyName == node || parent.AsExportSpecifier().PropertyName == nil && parent.Name() == node)
	}
	if ast.IsDeclarationName(node) {
		return false
	}
	switch parent.Kind {
	case ast.KindPropertyAccessExpression:
		return parent.Expression() == node
	case ast.KindQualifiedName:
		return parent.AsQualifiedName().Left == node
	case ast.KindImportSpecifier, ast.KindImportClause, ast.KindNamespaceImport, ast.KindImportEqualsDeclaration, ast.KindMetaProperty, ast.KindLabeledStatement, ast.KindBreakStatement, ast.KindContinueStatement, ast.KindJsxAttribute:
		return false
	case ast.KindBindingElement:
		return parent.AsBindingElement().PropertyName != node
	}
	if ast.IsJsxTagName(node) {
		text := node.Text()
		return text != "" && (text[0] < 'a' || text[0] > 'z')
	}
	return true
}

func (model *UsageModel) symbol(node *ast.Node) *ast.Symbol {
	if model.context.GetChecker == nil {
		return nil
	}
	typeChecker := model.context.GetChecker()
	if node.Parent.Kind == ast.KindShorthandPropertyAssignment {
		return typeChecker.GetShorthandAssignmentValueSymbol(node.Parent)
	}
	if node.Parent.Kind == ast.KindExportSpecifier {
		return typeChecker.GetExportSpecifierLocalTargetSymbol(node.Parent)
	}
	symbol := typeChecker.GetSymbolAtLocation(node)
	if symbol == nil && usageDeclaration(node) {
		symbol = node.Parent.Symbol()
	}
	return symbol
}

func (model *UsageModel) Binding(node *ast.Node) *UsageBinding {
	return model.nodes[node]
}

func UsageVisit(node *ast.Node, visitor func(*ast.Node)) {
	visitor(node)
	node.ForEachChild(func(child *ast.Node) bool { UsageVisit(child, visitor); return false })
}

func (model *UsageModel) Build(context Context) {
	model.context = context
	model.symbols = make(map[*ast.Symbol]*UsageBinding)
	model.nodes = make(map[*ast.Node]*UsageBinding)
	globals, exported := model.directives()
	UsageVisit(context.File.AsNode(), func(node *ast.Node) {
		if ast.IsFunctionLike(node) && node.Body() != nil || node.Kind == ast.KindClassStaticBlockDeclaration || node.Kind == ast.KindPropertyDeclaration && node.Initializer() != nil {
			model.functions = append(model.functions, node)
		}
		if !usageDeclaration(node) {
			return
		}
		symbol := model.symbol(node)
		if symbol == nil {
			return
		}
		binding := model.symbols[symbol]
		if binding == nil {
			declaration := node.Parent
			root := usageRoot(declaration)
			owner := UsageOwner(declaration.Parent)
			if root.Kind == ast.KindParameter {
				owner = UsageOwner(root.Parent)
			}
			binding = &UsageBinding{Name: node.Text(), Identifier: node, Declaration: declaration, Root: root, Owner: owner, Parameter: root.Kind == ast.KindParameter, Caught: root.Kind == ast.KindVariableDeclaration && root.Parent.Kind == ast.KindCatchClause, Array: declaration.Kind == ast.KindBindingElement && declaration.Parent.Kind == ast.KindArrayBindingPattern}
			model.symbols[symbol] = binding
			model.Bindings = append(model.Bindings, binding)
		}
		model.nodes[node] = binding
		root := usageRoot(node.Parent)
		if root.Kind == ast.KindVariableDeclaration && root.Parent.Kind == ast.KindVariableDeclarationList {
			loop := root.Parent.Parent
			if loop.Kind == ast.KindForInStatement || loop.Kind == ast.KindForOfStatement {
				binding.References = append(binding.References, UsageReference{Node: node, Owner: binding.Owner, Write: true})
			}
		}
		if root.Kind == ast.KindVariableDeclaration {
			root = root.Parent.Parent
		}
		if ast.GetCombinedModifierFlags(root)&ast.ModifierFlagsExport != 0 {
			binding.Exported = true
		}
	})
	if !ast.IsExternalModule(context.File) {
		for name, global := range globals {
			global.Declared = model.symbols[context.File.AsNode().Locals().Get(name)] != nil
		}
		for name := range exported {
			if binding := model.symbols[context.File.AsNode().Locals().Get(name)]; binding != nil {
				binding.Exported = true
			}
			if global := globals[name]; global != nil {
				global.Used = true
			}
		}
	}
	UsageVisit(context.File.AsNode(), func(node *ast.Node) {
		if !usageReferenceNode(node) {
			return
		}
		symbol := model.symbol(node)
		if global := globals[node.Text()]; global != nil {
			binding := model.symbols[symbol]
			if binding == nil || binding.Root == nil {
				read, _ := UsageAccess(node)
				global.Used = global.Used || read
			}
		}
		if symbol == nil {
			return
		}
		binding := model.symbols[symbol]
		if binding == nil {
			binding = &UsageBinding{Name: node.Text()}
			model.symbols[symbol] = binding
		}
		model.nodes[node] = binding
		read, write := UsageAccess(node)
		binding.References = append(binding.References, UsageReference{Node: node, Owner: UsageOwner(node.Parent), Read: read, Write: write})
		if node.Parent.Kind == ast.KindExportSpecifier {
			binding.Exported = true
		}
	})
	model.makeGraph(context.File.AsNode())
	for _, function := range model.functions {
		model.makeGraph(function)
	}
}

func UsageAccess(node *ast.Node) (bool, bool) {
	parent := node.Parent
	if parent.Kind == ast.KindSpreadElement || parent.Kind == ast.KindSpreadAssignment {
		if ast.GetAssignmentTarget(node) != nil {
			return false, true
		}
		return UsageAccess(parent)
	}
	return !ast.IsWriteOnlyAccess(node), ast.IsWriteAccess(node)
}

func UsageUnwrap(node *ast.Node) *ast.Node {
	for node.Parent != nil && (node.Parent.Kind == ast.KindParenthesizedExpression || node.Parent.Kind == ast.KindNonNullExpression || node.Parent.Kind == ast.KindAsExpression || node.Parent.Kind == ast.KindSatisfiesExpression || node.Parent.Kind == ast.KindTypeAssertionExpression) {
		node = node.Parent
	}
	return node
}

func UsageDiscarded(node *ast.Node) bool {
	node = UsageUnwrap(node)
	parent := node.Parent
	if parent == nil {
		return false
	}
	if parent.Kind == ast.KindExpressionStatement {
		return true
	}
	if parent.Kind == ast.KindBinaryExpression && parent.AsBinaryExpression().OperatorToken.Kind == ast.KindCommaToken {
		return parent.AsBinaryExpression().Left == node || UsageDiscarded(parent)
	}
	return false
}
