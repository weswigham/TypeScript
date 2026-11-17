package helpers

import "github.com/microsoft/TypeScript/tsc/internal/ast"

type LexicalScopeIndex struct {
	Bindings   []*TsScopeBinding
	Nodes      map[*ast.Node]*TsScopeFrame
	frames     map[*ast.Node]*TsScopeFrame
	current    *TsScopeFrame
	References []*ast.Node
	Calls      []*ast.Node
	ThisNodes  []*ast.Node
	writes     map[*ast.Symbol]bool
}

func lexicalScopeParameters(node *ast.Node) bool {
	for _, parameter := range node.Parameters() {
		if parameter.Initializer() != nil || parameter.Name() != nil && ast.IsBindingPattern(parameter.Name()) {
			return true
		}
	}
	return false
}

func lexicalScopeFunctionBody(node *ast.Node) bool {
	return node.Kind == ast.KindBlock && node.Parent != nil && ast.IsFunctionLike(node.Parent) && node.Parent.Body() == node
}

func (index *LexicalScopeIndex) frame(node *ast.Node) {
	index.current = &TsScopeFrame{Owner: node, Parent: index.current, bindings: make(map[string]*TsScopeBinding)}
	index.frames[node] = index.current
}

func (index *LexicalScopeIndex) Enter(context Context, node *ast.Node) {
	if index.Nodes == nil {
		index.Nodes = make(map[*ast.Node]*TsScopeFrame)
		index.frames = make(map[*ast.Node]*TsScopeFrame)
		index.writes = make(map[*ast.Symbol]bool)
	}
	if node.Kind == ast.KindFunctionExpression && node.Name() != nil {
		index.frame(node)
		index.declare(node.Name(), node, index.current)
	}
	if tsScopeOwnsFrame(node) && (!lexicalScopeFunctionBody(node) || lexicalScopeParameters(node.Parent)) {
		index.frame(node)
	}
	index.Nodes[node] = index.current
	if TsScopeDeclaration(node) {
		declaration := node.Parent
		if declaration.Kind != ast.KindFunctionExpression {
			owner := index.current
			if declaration.Kind == ast.KindParameter && declaration.Parent.Kind == ast.KindCatchClause {
				owner = index.Nodes[declaration.Parent]
			} else if declaration.Kind == ast.KindVariableDeclaration || declaration.Kind == ast.KindBindingElement {
				root := TsScopeRootBinding(declaration)
				if root.Kind == ast.KindVariableDeclaration && root.Parent.Kind == ast.KindVariableDeclarationList && root.Parent.Flags&ast.NodeFlagsBlockScoped == 0 {
					for owner.Parent != nil && !ast.IsFunctionLike(owner.Owner) && !lexicalScopeFunctionBody(owner.Owner) && owner.Owner.Kind != ast.KindSourceFile && owner.Owner.Kind != ast.KindModuleDeclaration && owner.Owner.Kind != ast.KindClassStaticBlockDeclaration {
						owner = owner.Parent
					}
				}
			} else {
				owner = tsScopeDeclarationFrame(declaration, owner)
			}
			binding := index.declare(node, declaration, owner)
			if ast.IsClassLike(declaration) && declaration.Kind == ast.KindClassDeclaration {
				index.Nodes[declaration].bindings[node.Text()] = binding
			}
		}
	}
	if TsScopeReferenceNode(node) && node.Parent.Kind != ast.KindMetaProperty && (node.Parent.Kind != ast.KindQualifiedName || node.Parent.AsQualifiedName().Left == node) {
		index.References = append(index.References, node)
	}
	if node.Kind == ast.KindCallExpression {
		index.Calls = append(index.Calls, node)
	}
	if node.Kind == ast.KindThisKeyword && node.Parent.Kind != ast.KindParameter && !TsScopeTypeOnly(node) {
		index.ThisNodes = append(index.ThisNodes, node)
	}
	if node.Kind == ast.KindIdentifier && ast.IsWriteAccess(node) && !TsScopeDeclaration(node) && context.GetChecker != nil {
		if symbol := context.GetChecker().GetSymbolAtLocation(node); symbol != nil {
			index.writes[symbol] = true
		}
	}
}

func (index *LexicalScopeIndex) declare(identifier, declaration *ast.Node, owner *TsScopeFrame) *TsScopeBinding {
	binding := owner.bindings[identifier.Text()]
	if binding == nil {
		binding = &TsScopeBinding{Name: identifier.Text(), Frame: owner}
		owner.bindings[binding.Name] = binding
		index.Bindings = append(index.Bindings, binding)
	}
	binding.Declarations = append(binding.Declarations, declaration)
	binding.Identifiers = append(binding.Identifiers, identifier)
	switch declaration.Kind {
	case ast.KindInterfaceDeclaration, ast.KindTypeAliasDeclaration, ast.KindTypeParameter:
		binding.typeValue = true
	case ast.KindClassDeclaration, ast.KindClassExpression, ast.KindEnumDeclaration:
		binding.Value, binding.typeValue = true, true
	default:
		binding.Value = true
	}
	if TsScopeImport(declaration) && TsScopeTypeImport(declaration) {
		binding.Value, binding.typeValue = false, true
	}
	return binding
}

func (index *LexicalScopeIndex) Exit(node *ast.Node) {
	for index.current != nil && index.current.Owner == node {
		index.current = index.current.Parent
	}
}

func (index *LexicalScopeIndex) Binding(node *ast.Node) *TsScopeBinding {
	return index.Nodes[node].Find(node.Text())
}

func (index *LexicalScopeIndex) Resolve(context Context) {
	for _, node := range index.References {
		binding := index.Binding(node)
		if binding != nil {
			binding.References = append(binding.References, TsScopeReference{Node: node, TypeOnly: TsScopeTypeOnly(node), Write: ast.IsWriteAccess(node)})
		}
	}
}
