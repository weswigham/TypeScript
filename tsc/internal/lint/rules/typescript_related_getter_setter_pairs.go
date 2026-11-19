package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptRelatedGetterSetterPairsRule struct{ context Context }

func newTypeScriptRelatedGetterSetterPairs(context Context) Rule {
	rule := &typescriptRelatedGetterSetterPairsRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindClassDeclaration, ast.KindClassExpression, ast.KindInterfaceDeclaration, ast.KindTypeLiteral},
	}
}

func (rule *typescriptRelatedGetterSetterPairsRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindClassDeclaration && node.Kind != ast.KindClassExpression && node.Kind != ast.KindInterfaceDeclaration && node.Kind != ast.KindTypeLiteral {
		return true
	}
	type pair struct{ get, set *ast.Node }
	pairs := make(map[string]pair)
	var names []string
	for _, member := range node.Members() {
		if member.Kind != ast.KindGetAccessor && member.Kind != ast.KindSetAccessor {
			continue
		}
		name := member.Name()
		if name.Kind == ast.KindComputedPropertyName {
			name = ast.SkipParentheses(name.Expression())
		}
		key := "expression:" + rule.context.File.Text()[scanner.GetTokenPosOfNode(name, rule.context.File, false):name.End()]
		switch name.Kind {
		case ast.KindIdentifier:
			key = "name:" + name.Text()
		default:
			if text, ok := semanticLiteralString(rule.context, name); ok {
				key = "name:" + text
			}
		}
		current, exists := pairs[key]
		if !exists {
			names = append(names, key)
		}
		if member.Kind == ast.KindGetAccessor && member.Type() != nil {
			current.get = member
		}
		if member.Kind == ast.KindSetAccessor && len(member.Parameters()) == 1 {
			current.set = member
		}
		pairs[key] = current
	}
	for _, name := range names {
		current := pairs[name]
		if current.get != nil && current.set != nil {
			c := rule.context.GetChecker()
			getType := c.GetTypeFromTypeNode(current.get.Type())
			setType := c.GetTypeAtLocation(current.set.Parameters()[0])
			if !c.IsTypeAssignableTo(getType, setType) {
				rule.context.Report(rule.context.Range(current.get.Type()), diagnostics.X_get_type_should_be_assignable_to_its_equivalent_set_type)
			}
		}
	}
	return true
}
