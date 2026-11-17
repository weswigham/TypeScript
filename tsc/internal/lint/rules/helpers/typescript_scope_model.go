package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
)

type TsScopeFrame struct {
	Owner    *ast.Node
	Parent   *TsScopeFrame
	bindings map[string]*TsScopeBinding
}

type TsScopeReference struct {
	Node     *ast.Node
	TypeOnly bool
	Write    bool
}

type TsScopeBinding struct {
	Name         string
	Frame        *TsScopeFrame
	Declarations []*ast.Node
	Identifiers  []*ast.Node
	References   []TsScopeReference
	Value        bool
	typeValue    bool
}

type TsScopeModel struct {
	Bindings []*TsScopeBinding
	frames   map[*ast.Node]*TsScopeFrame
	Nodes    map[*ast.Node]*TsScopeFrame
	Decls    map[*ast.Node]*TsScopeBinding
	symbols  map[*ast.Symbol]*TsScopeBinding
}

func tsScopeOwnsFrame(node *ast.Node) bool {
	return ast.IsFunctionLike(node) || TsScopeSignature(node) || ast.IsClassLike(node) || node.Kind == ast.KindSourceFile || node.Kind == ast.KindBlock || node.Kind == ast.KindModuleDeclaration || node.Kind == ast.KindForStatement || node.Kind == ast.KindForInStatement || node.Kind == ast.KindForOfStatement || node.Kind == ast.KindCatchClause || node.Kind == ast.KindCaseBlock || node.Kind == ast.KindTypeAliasDeclaration || node.Kind == ast.KindInterfaceDeclaration || node.Kind == ast.KindMappedType || node.Kind == ast.KindEnumDeclaration || node.Kind == ast.KindClassStaticBlockDeclaration
}

func TsScopeDeclaration(node *ast.Node) bool {
	if node == nil || node.Parent == nil || node.Parent.Name() != node || node.Kind != ast.KindIdentifier && node.Kind != ast.KindThisKeyword && node.Kind != ast.KindStringLiteral && node.Kind != ast.KindNumericLiteral {
		return false
	}
	if node.Parent.Kind == ast.KindModuleDeclaration && (node.Kind == ast.KindStringLiteral || ast.IsGlobalScopeAugmentation(node.Parent)) {
		return false
	}
	switch node.Parent.Kind {
	case ast.KindVariableDeclaration, ast.KindParameter, ast.KindBindingElement, ast.KindFunctionDeclaration, ast.KindFunctionExpression, ast.KindClassDeclaration, ast.KindClassExpression, ast.KindInterfaceDeclaration, ast.KindTypeAliasDeclaration, ast.KindTypeParameter, ast.KindEnumDeclaration, ast.KindEnumMember, ast.KindModuleDeclaration, ast.KindImportClause, ast.KindNamespaceImport, ast.KindImportSpecifier, ast.KindImportEqualsDeclaration:
		return true
	}
	return false
}

func TsScopeReferenceNode(node *ast.Node) bool {
	if node.Kind != ast.KindIdentifier || node.Parent == nil || TsScopeDeclaration(node) {
		return false
	}
	parent := node.Parent
	if ast.IsDeclarationNameOrImportPropertyName(node) && parent.Kind != ast.KindShorthandPropertyAssignment && parent.Kind != ast.KindExportSpecifier {
		return false
	}
	switch parent.Kind {
	case ast.KindPropertyAccessExpression, ast.KindQualifiedName:
		return parent.Name() != node
	case ast.KindLabeledStatement, ast.KindBreakStatement, ast.KindContinueStatement, ast.KindImportSpecifier, ast.KindNamespaceImport, ast.KindImportClause:
		return false
	case ast.KindExportSpecifier:
		specifier := parent.AsExportSpecifier()
		return specifier.PropertyName == node || specifier.PropertyName == nil && specifier.Name() == node
	}
	return true
}

func (frame *TsScopeFrame) Find(name string) *TsScopeBinding {
	for ; frame != nil; frame = frame.Parent {
		if binding := frame.bindings[name]; binding != nil {
			return binding
		}
	}
	return nil
}

func tsScopeDeclarationFrame(declaration *ast.Node, frame *TsScopeFrame) *TsScopeFrame {
	switch declaration.Kind {
	case ast.KindFunctionDeclaration, ast.KindClassDeclaration, ast.KindTypeAliasDeclaration, ast.KindInterfaceDeclaration, ast.KindEnumDeclaration, ast.KindModuleDeclaration:
		if frame.Owner == declaration {
			frame = frame.Parent
		}
	case ast.KindVariableDeclaration, ast.KindBindingElement:
		root := declaration
		for root.Kind == ast.KindBindingElement {
			root = root.Parent.Parent
		}
		if root.Kind == ast.KindVariableDeclaration && root.Parent.Kind == ast.KindVariableDeclarationList && root.Parent.Flags&ast.NodeFlagsBlockScoped == 0 {
			for frame.Parent != nil && !ast.IsFunctionLike(frame.Owner) && frame.Owner.Kind != ast.KindSourceFile && frame.Owner.Kind != ast.KindModuleDeclaration && frame.Owner.Kind != ast.KindClassStaticBlockDeclaration {
				frame = frame.Parent
			}
		}
	}
	return frame
}

func NewTScopeModel(context Context) *TsScopeModel {
	model := &TsScopeModel{frames: make(map[*ast.Node]*TsScopeFrame), Nodes: make(map[*ast.Node]*TsScopeFrame), Decls: make(map[*ast.Node]*TsScopeBinding), symbols: make(map[*ast.Symbol]*TsScopeBinding)}
	var collect func(*ast.Node, *TsScopeFrame)
	collect = func(node *ast.Node, frame *TsScopeFrame) {
		if tsScopeOwnsFrame(node) {
			frame = &TsScopeFrame{Owner: node, Parent: frame, bindings: make(map[string]*TsScopeBinding)}
			model.frames[node] = frame
		}
		model.Nodes[node] = frame
		if TsScopeDeclaration(node) {
			declaration := node.Parent
			owner := tsScopeDeclarationFrame(declaration, frame)
			if declaration.Kind == ast.KindParameter && owner.Owner.Kind == ast.KindBlock {
				owner = owner.Parent
			}
			name := node.Text()
			binding := owner.bindings[name]
			if binding == nil {
				binding = &TsScopeBinding{Name: name, Frame: owner}
				owner.bindings[name] = binding
				model.Bindings = append(model.Bindings, binding)
			}
			binding.Declarations = append(binding.Declarations, declaration)
			binding.Identifiers = append(binding.Identifiers, node)
			model.Decls[node] = binding
			switch declaration.Kind {
			case ast.KindInterfaceDeclaration, ast.KindTypeAliasDeclaration, ast.KindTypeParameter:
				binding.typeValue = true
			case ast.KindClassDeclaration, ast.KindClassExpression, ast.KindEnumDeclaration:
				binding.typeValue, binding.Value = true, true
			default:
				binding.Value = true
			}
			if TsScopeImport(declaration) && TsScopeTypeImport(declaration) {
				binding.Value, binding.typeValue = false, true
			}
			if context.GetChecker != nil {
				if symbol := context.GetChecker().GetSymbolAtLocation(node); symbol != nil {
					model.symbols[symbol] = binding
				}
			}
		}
		node.ForEachChild(func(child *ast.Node) bool { collect(child, frame); return false })
	}
	collect(context.File.AsNode(), nil)
	TsScopeWalk(context.File.AsNode(), func(node *ast.Node) bool {
		if !TsScopeReferenceNode(node) {
			return true
		}
		binding := model.Nodes[node].Find(node.Text())
		if context.GetChecker != nil {
			symbol := context.GetChecker().GetSymbolAtLocation(node)
			if node.Parent.Kind == ast.KindShorthandPropertyAssignment {
				symbol = context.GetChecker().GetShorthandAssignmentValueSymbol(node.Parent)
			}
			if resolved := model.symbols[symbol]; resolved != nil {
				binding = resolved
			}
		}
		if binding != nil {
			binding.References = append(binding.References, TsScopeReference{Node: node, TypeOnly: TsScopeTypeOnly(node), Write: ast.IsAssignmentTarget(node)})
		}
		return true
	})
	return model
}

func TsScopeTypeImport(node *ast.Node) bool {
	for ; node != nil; node = node.Parent {
		switch node.Kind {
		case ast.KindImportSpecifier:
			if node.AsImportSpecifier().IsTypeOnly {
				return true
			}
		case ast.KindImportClause:
			return node.AsImportClause().IsTypeOnly()
		case ast.KindImportEqualsDeclaration:
			return node.AsImportEqualsDeclaration().IsTypeOnly
		case ast.KindSourceFile:
			return false
		}
	}
	return false
}
