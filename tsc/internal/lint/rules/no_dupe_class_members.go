package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noDupeClassMembers struct {
	context Context
}

func newNoDupeClassMembers(context Context) Rule { return &noDupeClassMembers{context: context} }

func (rule *noDupeClassMembers) duplicateMembers(members []*ast.Node) {
	type memberKey struct {
		name   string
		static bool
	}
	seen := make(map[memberKey]uint8)
	for _, member := range members {
		if member.Kind == ast.KindSpreadAssignment || member.Kind == ast.KindClassStaticBlockDeclaration || member.Kind == ast.KindConstructor || ast.IsFunctionLike(member) && member.Body() == nil {
			continue
		}
		name, known := helpers.StaticPropertyNameText(member.Name())
		if !known {
			continue
		}
		key := memberKey{name: name, static: ast.HasSyntacticModifier(member, ast.ModifierFlagsStatic)}
		mask := uint8(3)
		if member.Kind == ast.KindGetAccessor {
			mask = 1
		} else if member.Kind == ast.KindSetAccessor {
			mask = 2
		}
		if seen[key]&mask != 0 {
			report := member.Name()
			if report.Kind == ast.KindComputedPropertyName {
				report = report.Expression()
			}
			rule.context.Report(rule.context.Range(report), diagnostics.Duplicate_name_0, name)
		}
		seen[key] |= mask
	}
}

func (rule *noDupeClassMembers) OnEnterNode(node *ast.Node) bool {
	if ast.IsClassLike(node) {
		rule.duplicateMembers(node.Members())
	}

	return true
}

func (rule *noDupeClassMembers) OnExitNode(node *ast.Node) {
}
