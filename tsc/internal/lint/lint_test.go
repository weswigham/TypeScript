package lint

import (
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules"
	"github.com/microsoft/TypeScript/tsc/internal/parser"
	"gotest.tools/v3/assert"
)

type recordingRule struct {
	t       *testing.T
	prune   ast.Kind
	entered []*ast.Node
	exited  []*ast.Node
	stack   []*ast.Node
}

func (rule *recordingRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == rule.prune {
		return false
	}
	rule.entered = append(rule.entered, node)
	rule.stack = append(rule.stack, node)
	return true
}

func (rule *recordingRule) OnExitNode(node *ast.Node) {
	assert.Assert(rule.t, len(rule.stack) > 0)
	assert.Equal(rule.t, rule.stack[len(rule.stack)-1], node)
	rule.stack = rule.stack[:len(rule.stack)-1]
	rule.exited = append(rule.exited, node)
}

func TestLintTraversal(t *testing.T) {
	t.Parallel()
	file := parser.ParseSourceFile(ast.SourceFileParseOptions{FileName: "/input.ts", PathKey: "/input.ts"}, "function f() { debugger; } debugger;", core.ScriptKindTS)
	all := &recordingRule{t: t}
	pruned := &recordingRule{t: t, prune: ast.KindFunctionDeclaration}
	rejected := &recordingRule{t: t, prune: ast.KindSourceFile}
	visitors := []rules.Rule{all, pruned, rejected}
	for range 130 {
		visitors = append(visitors, &recordingRule{t: t})
	}
	Walk(file.AsNode(), visitors)
	assert.Equal(t, len(rejected.entered), 0)
	assert.Equal(t, len(rejected.exited), 0)
	for _, visitor := range visitors {
		rule := visitor.(*recordingRule)
		assert.Equal(t, len(rule.entered), len(rule.exited))
		assert.Equal(t, len(rule.stack), 0)
	}
	countDebuggers := func(rule *recordingRule) int {
		count := 0
		for _, node := range rule.entered {
			if node.Kind == ast.KindDebuggerStatement {
				count++
			}
		}
		return count
	}
	assert.Equal(t, countDebuggers(all), 2)
	assert.Equal(t, countDebuggers(pruned), 1)
	assert.Equal(t, all.exited[len(all.exited)-1], file.AsNode())
}
