package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoUnusedPrivateClassMembersRule struct {
	helpers.TypescriptScopeRuleContext
}

func newTypeScriptNoUnusedPrivateClassMembers(context Context) Rule {
	rule := &typescriptNoUnusedPrivateClassMembersRule{Context: context, Name: "no-unused-private-class-members"}

	return Rule{
		Exit:           rule.OnExitNode,
		ExitKinds:      []ast.Kind{ast.KindSourceFile},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptNoUnusedPrivateClassMembersRule) OnExitNode(node *ast.Node) {
	if node.Kind != ast.KindSourceFile {
		return
	}
	rule.unusedPrivate()
}

func (rule *typescriptNoUnusedPrivateClassMembersRule) unusedPrivate() {
	type memberInfo struct {
		node   *ast.Node
		used   bool
		setter bool
	}
	members := make(map[*ast.Node]map[string]*memberInfo)
	var ordered []*memberInfo
	helpers.TsScopeWalk(rule.Context.File.AsNode(), func(node *ast.Node) bool {
		if !ast.IsClassLike(node) {
			return true
		}
		members[node] = make(map[string]*memberInfo)
		for _, member := range node.Members() {
			name := member.Name()
			if name == nil || name.Kind != ast.KindPrivateIdentifier && !ast.HasSyntacticModifier(member, ast.ModifierFlagsPrivate) {
				continue
			}
			if name.Kind == ast.KindComputedPropertyName {
				name = name.Expression()
				if name.Kind != ast.KindStringLiteral && name.Kind != ast.KindNoSubstitutionTemplateLiteral && name.Kind != ast.KindNumericLiteral {
					continue
				}
			}
			info := members[node][name.Text()]
			if info == nil {
				info = &memberInfo{node: name}
				members[node][name.Text()] = info
				ordered = append(ordered, info)
			}
			info.used = info.used || len(member.Decorators()) > 0
			info.setter = info.setter || member.Kind == ast.KindSetAccessor
		}
		for _, constructor := range node.Members() {
			if constructor.Kind != ast.KindConstructor {
				continue
			}
			for _, parameter := range constructor.Parameters() {
				if ast.HasSyntacticModifier(parameter, ast.ModifierFlagsPrivate) {
					info := &memberInfo{node: parameter.Name()}
					members[node][parameter.Name().Text()] = info
					ordered = append(ordered, info)
				}
			}
		}
		return true
	})
	find := func(node *ast.Node, name string, private bool) *memberInfo {
		for owner := node.Parent; owner != nil; owner = owner.Parent {
			if ast.IsClassLike(owner) {
				if info := members[owner][name]; info != nil {
					return info
				}
				if !private {
					return nil
				}
			}
		}
		return nil
	}
	helpers.TsScopeWalk(rule.Context.File.AsNode(), func(node *ast.Node) bool {
		var target *ast.Node
		if node.Kind == ast.KindPropertyAccessExpression {
			target = node.Name()
		} else if node.Kind == ast.KindElementAccessExpression {
			target = node.AsElementAccessExpression().ArgumentExpression
		} else if node.Kind == ast.KindPrivateIdentifier && node.Parent.Kind == ast.KindBinaryExpression && node.Parent.AsBinaryExpression().OperatorToken.Kind == ast.KindInKeyword {
			target = node
		}
		var info *memberInfo
		if target != nil && (target.Kind == ast.KindIdentifier || target.Kind == ast.KindPrivateIdentifier || target.Kind == ast.KindStringLiteral || target.Kind == ast.KindNoSubstitutionTemplateLiteral || target.Kind == ast.KindNumericLiteral) {
			private := target.Kind == ast.KindPrivateIdentifier
			if private || ast.IsAccessExpression(node) && ast.SkipParentheses(node.Expression()).Kind == ast.KindThisKeyword {
				info = find(node, target.Text(), private)
			} else if ast.IsAccessExpression(node) && node.Expression().Kind == ast.KindIdentifier {
				for owner := node.Parent; owner != nil; owner = owner.Parent {
					if ast.IsClassLike(owner) {
						matches := owner.Name() != nil && owner.Name().Text() == node.Expression().Text()
						binding := rule.Bindings().Nodes[node].Find(node.Expression().Text())
						if binding != nil {
							for _, declaration := range binding.Declarations {
								if initializer := helpers.TsScopeInitializer(declaration); initializer != nil && ast.SkipParentheses(initializer).Kind == ast.KindThisKeyword {
									matches = true
								}
								annotation := declaration.Type()
								if owner.Name() != nil && annotation != nil {
									if annotation.Kind == ast.KindTypeReference {
										matches = matches || helpers.TsScopeIdentifier(annotation.AsTypeReferenceNode().TypeName, owner.Name().Text())
									} else if annotation.Kind == ast.KindTypeQuery {
										matches = matches || helpers.TsScopeIdentifier(annotation.AsTypeQueryNode().ExprName, owner.Name().Text())
									}
								}
							}
						}
						if matches {
							info = members[owner][target.Text()]
						}
						break
					}
				}
			}
		}
		if info != nil {
			outer := node
			for outer.Parent.Kind == ast.KindParenthesizedExpression {
				outer = outer.Parent
			}
			parent := outer.Parent
			writeOnly := ast.IsAssignmentTarget(node)
			if parent.Kind == ast.KindBinaryExpression && ast.IsAssignmentOperator(parent.AsBinaryExpression().OperatorToken.Kind) && parent.AsBinaryExpression().OperatorToken.Kind != ast.KindEqualsToken {
				writeOnly = parent.Parent.Kind == ast.KindExpressionStatement || parent.Parent.Kind == ast.KindForStatement
			}
			if parent.Kind == ast.KindPrefixUnaryExpression || parent.Kind == ast.KindPostfixUnaryExpression {
				writeOnly = parent.Parent.Kind == ast.KindExpressionStatement || parent.Parent.Kind == ast.KindForStatement
			}
			if !writeOnly || info.setter {
				info.used = true
			}
		}
		var pattern, value *ast.Node
		if node.Kind == ast.KindVariableDeclaration || node.Kind == ast.KindParameter {
			pattern, value = node.Name(), node.Initializer()
		} else if node.Kind == ast.KindBinaryExpression && node.AsBinaryExpression().OperatorToken.Kind == ast.KindEqualsToken {
			pattern, value = node.AsBinaryExpression().Left, node.AsBinaryExpression().Right
		}
		if value != nil && ast.SkipParentheses(value).Kind == ast.KindThisKeyword && pattern != nil {
			var names []*ast.Node
			if pattern.Kind == ast.KindObjectBindingPattern {
				for _, element := range pattern.AsBindingPattern().Elements.Nodes {
					name := element.AsBindingElement().PropertyName
					if name == nil {
						name = element.Name()
					}
					names = append(names, name)
				}
			} else if pattern.Kind == ast.KindObjectLiteralExpression {
				for _, property := range pattern.AsObjectLiteralExpression().Properties.Nodes {
					if property.Name() != nil {
						names = append(names, property.Name())
					}
				}
			}
			for _, name := range names {
				if name.Kind == ast.KindIdentifier || name.Kind == ast.KindStringLiteral {
					if info := find(node, name.Text(), false); info != nil {
						info.used = true
					}
				}
			}
		}
		return true
	})
	for _, info := range ordered {
		if !info.used {
			rule.Context.Report(rule.Context.Range(info.node), diagnostics.Private_class_member_0_is_defined_but_never_used, strings.TrimPrefix(info.node.Text(), "#"))
		}
	}
}
