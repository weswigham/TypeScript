package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoDupeClassMembersRule struct {
	context Context
}

func (rule *typescriptNoDupeClassMembersRule) OnEnterNode(node *ast.Node) bool {
	if ast.IsClassLike(node) {
		rule.duplicateMembers(node)
	}
	return true
}

func (rule *typescriptNoDupeClassMembersRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptNoDupeClassMembersRule) duplicateMembers(node *ast.Node) {
	type key struct {
		name   string
		static bool
	}
	seen := make(map[key]uint8)
	for _, member := range node.Members() {
		name := member.Name()
		if name == nil || name.Kind == ast.KindComputedPropertyName || name.Kind == ast.KindPrivateIdentifier || member.Kind == ast.KindConstructor || ast.IsFunctionLike(member) && member.Body() == nil {
			continue
		}
		text, known := helpers.StaticPropertyNameText(name)
		if !known {
			continue
		}
		memberKey := key{text, ast.HasSyntacticModifier(member, ast.ModifierFlagsStatic)}
		mask := uint8(3)
		if member.Kind == ast.KindGetAccessor {
			mask = 1
		} else if member.Kind == ast.KindSetAccessor {
			mask = 2
		}
		if seen[memberKey]&mask != 0 {
			rule.context.Report(rule.context.Range(name), diagnostics.Duplicate_name_0, text)
		}
		seen[memberKey] |= mask
	}
}

func newTypeScriptNoDupeClassMembers(context Context) Rule {
	return &typescriptNoDupeClassMembersRule{context: context}
}
