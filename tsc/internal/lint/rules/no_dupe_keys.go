package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noDupeKeys struct {
	context Context
}

func newNoDupeKeys(context Context) Rule { return &noDupeKeys{context: context} }

func (rule *noDupeKeys) duplicateMembers(members []*ast.Node) {
	seen := make(map[string]uint8)
	for _, member := range members {
		if member.Kind == ast.KindSpreadAssignment || member.Kind == ast.KindClassStaticBlockDeclaration || member.Kind == ast.KindConstructor {
			continue
		}
		name, known := helpers.StaticPropertyNameText(member.Name())
		if !known || name == "__proto__" && member.Kind == ast.KindPropertyAssignment && member.Name().Kind != ast.KindComputedPropertyName {
			continue
		}
		mask := uint8(3)
		if member.Kind == ast.KindGetAccessor {
			mask = 1
		} else if member.Kind == ast.KindSetAccessor {
			mask = 2
		}
		if seen[name]&mask != 0 {
			report := member.Name()
			if report.Kind == ast.KindComputedPropertyName {
				report = report.Expression()
			}
			rule.context.Report(rule.context.Range(report), diagnostics.Duplicate_key_0, name)
		}
		seen[name] |= mask
	}
}

func (rule *noDupeKeys) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindObjectLiteralExpression && !helpers.SourceDestructuring(node) {
		rule.duplicateMembers(node.AsObjectLiteralExpression().Properties.Nodes)
	}

	return true
}

func (rule *noDupeKeys) OnExitNode(node *ast.Node) {
}
