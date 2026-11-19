package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptAdjacentOverloadSignaturesRule struct {
	context Context
}

func newTypeScriptAdjacentOverloadSignatures(context Context) Rule {
	rule := &typescriptAdjacentOverloadSignaturesRule{context: context}

	return Rule{
		Enter: rule.OnEnterNode,
		EnterKinds: []ast.Kind{
			ast.KindBlock,
			ast.KindClassDeclaration,
			ast.KindClassExpression,
			ast.KindInterfaceDeclaration,
			ast.KindModuleBlock,
			ast.KindSourceFile,
			ast.KindTypeLiteral,
		},
	}
}

func (rule *typescriptAdjacentOverloadSignaturesRule) OnEnterNode(node *ast.Node) bool {
	var members []*ast.Node
	switch node.Kind {
	case ast.KindSourceFile, ast.KindBlock, ast.KindModuleBlock:
		if node.Kind == ast.KindBlock && node.Parent.Kind == ast.KindClassStaticBlockDeclaration {
			return true
		}
		members = node.Statements()
	case ast.KindClassDeclaration, ast.KindClassExpression, ast.KindInterfaceDeclaration, ast.KindTypeLiteral:
		members = node.Members()
	default:
		return true
	}
	seen := make(map[tsOverloadName]bool)
	var previous tsOverloadName
	previousIsMethod := false
	for _, member := range members {
		if member.Kind == ast.KindSemicolonClassElement {
			continue
		}
		method, ok := rule.memberName(member)
		if !ok {
			previousIsMethod = false
			continue
		}
		if seen[method] && (!previousIsMethod || previous != method) {
			name := method.name
			if method.static {
				name = "static " + name
			}
			rule.context.Report(rule.context.Range(member), tsAdjacentSignature, name)
		}
		seen[method] = true
		previous, previousIsMethod = method, true
	}
	return true
}

var tsAdjacentSignature = diagnostics.All_0_signatures_should_be_adjacent

type tsOverloadName struct {
	name      string
	nameKind  ast.Kind
	static    bool
	call      bool
	hasStatic bool
}

func (rule *typescriptAdjacentOverloadSignaturesRule) memberName(node *ast.Node) (tsOverloadName, bool) {
	method := tsOverloadName{}
	switch node.Kind {
	case ast.KindFunctionDeclaration:
		if node.Name() == nil {
			return method, false
		}
		method.name = node.Name().Text()
		return method, true
	case ast.KindCallSignature:
		method.name, method.call = "call", true
		return method, true
	case ast.KindConstructSignature:
		method.name = "new"
		return method, true
	case ast.KindConstructor:
		method.name, method.hasStatic = "constructor", true
		method.static = node.ModifierFlags()&ast.ModifierFlagsStatic != 0
		return method, true
	case ast.KindMethodDeclaration, ast.KindMethodSignature, ast.KindGetAccessor, ast.KindSetAccessor:
		if node.ModifierFlags()&ast.ModifierFlagsAbstract != 0 {
			return method, false
		}
		method.static = node.ModifierFlags()&ast.ModifierFlagsStatic != 0
		method.hasStatic = true
	default:
		return method, false
	}
	name := node.Name()
	if name.Kind == ast.KindComputedPropertyName {
		name = ast.SkipParentheses(name.AsComputedPropertyName().Expression)
		if name.Kind != ast.KindStringLiteral && name.Kind != ast.KindNumericLiteral && name.Kind != ast.KindIdentifier {
			method.nameKind = ast.KindComputedPropertyName
			method.name = rule.context.File.Text()[scanner.GetTokenPosOfNode(name, rule.context.File, false):name.End()]
			return method, true
		}
	}
	method.name = name.Text()
	if name.Kind == ast.KindPrivateIdentifier {
		method.nameKind = ast.KindPrivateIdentifier
	} else if (name.Kind == ast.KindStringLiteral || name.Kind == ast.KindNumericLiteral) && !scanner.IsIdentifierText(method.name, rule.context.File.LanguageVariant) {
		method.nameKind = ast.KindStringLiteral
		method.name = "\"" + method.name + "\""
	}
	return method, true
}
