package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noEmptyCharacterClass struct{ context Context }

func (rule *noEmptyCharacterClass) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindRegularExpressionLiteral {
		return true
	}
	start := scanner.GetTokenPosOfNode(node, rule.context.File, false)
	raw := rule.context.File.Text()[start:node.End()]
	if slash := strings.LastIndexByte(raw, '/'); slash > 0 {
		for range scanner.RegExpEmptyCharacterClasses(raw[1:slash], raw[slash+1:]) {
			rule.context.Report(rule.context.Range(node), diagnostics.Empty_class)
		}
	}
	return true
}

func (rule *noEmptyCharacterClass) OnExitNode(node *ast.Node) {}

func newNoEmptyCharacterClass(context Context) Rule { return &noEmptyCharacterClass{context: context} }
