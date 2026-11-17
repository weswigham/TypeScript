package selectors

import (
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	tsparser "github.com/microsoft/TypeScript/tsc/internal/parser"
)

func TestESTreeAdapter(t *testing.T) {
	t.Parallel()
	file := tsparser.ParseSourceFile(ast.SourceFileParseOptions{FileName: "/input.tsx"}, "function foo(a,b,c) {} const obj = {foo:1,'bar':2}; const chain = obj?.foo?.(); const elements=[<div/>,<div/>];", core.ScriptKindTSX)
	root := FromFile(file)
	for _, test := range []struct {
		selector string
		count    int
	}{{"FunctionDeclaration[params.length>2]", 1}, {"Property > Literal.key", 1}, {"ChainExpression", 1}, {"[optional=true]", 2}, {"JSXElement ~ JSXElement", 1}, {"VariableDeclaration[kind='const']", 3}, {"CallExpression[callee.property.name='foo']", 1}} {
		selector, err := Parse(test.selector)
		if err != nil {
			t.Fatal(err)
		}
		count := 0
		var visit func(*Node)
		visit = func(node *Node) {
			if selector.Match(node) {
				count++
			}
			for _, child := range node.Children {
				visit(child)
			}
		}
		visit(root)
		if count != test.count {
			t.Errorf("%s: got %d, want %d", test.selector, count, test.count)
		}
	}
}
