package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noDupeArgs struct {
	context Context
}

func newNoDupeArgs(context Context) Rule {
	rule := &noDupeArgs{context: context}

	return Rule{
		Enter: rule.OnEnterNode,
		EnterKinds: []ast.Kind{
			ast.KindConstructor,
			ast.KindFunctionDeclaration,
			ast.KindFunctionExpression,
			ast.KindGetAccessor,
			ast.KindMethodDeclaration,
			ast.KindSetAccessor,
		},
	}
}

func (rule *noDupeArgs) OnEnterNode(node *ast.Node) bool {
	switch node.Kind {
	case ast.KindFunctionDeclaration, ast.KindFunctionExpression, ast.KindMethodDeclaration,
		ast.KindGetAccessor, ast.KindSetAccessor, ast.KindConstructor:
		if node.Body() == nil {
			return true
		}
		counts := make(map[string]int)
		var names []string
		var collect func(*ast.Node)
		collect = func(name *ast.Node) {
			if name == nil {
				return
			}
			switch name.Kind {
			case ast.KindIdentifier:
				if counts[name.Text()] == 0 {
					names = append(names, name.Text())
				}
				counts[name.Text()]++
			case ast.KindObjectBindingPattern, ast.KindArrayBindingPattern:
				for _, element := range name.AsBindingPattern().Elements.Nodes {
					if element.Kind == ast.KindBindingElement {
						collect(element.AsBindingElement().Name())
					}
				}
			}
		}
		for _, parameter := range node.Parameters() {
			collect(parameter.Name())
		}
		for _, name := range names {
			if counts[name] < 2 {
				continue
			}
			start := node.ParameterList().Pos() - 1
			end := node.ParameterList().End()
			if token := scanner.GetScannerForSourceFile(rule.context.File, end); token.Token() == ast.KindCloseParenToken {
				end = token.TokenEnd()
			}
			rule.context.Report(core.NewTextRange(start, end), noDupeArgsMessage, name)
		}
	}
	return true
}

var noDupeArgsMessage = diagnostics.Duplicate_param_0
