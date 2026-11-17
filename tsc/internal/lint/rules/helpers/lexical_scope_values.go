package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/evaluator"
)

func (scope *LexicalScopeAnalysis) Static(node *ast.Node) any {
	seen := make(map[*ast.Symbol]bool)
	var evaluate evaluator.Evaluator
	evaluate = evaluator.NewEvaluator(func(entity, location *ast.Node) evaluator.Result {
		symbol := scope.Context.GetChecker().GetSymbolAtLocation(entity)
		if symbol == nil || seen[symbol] || scope.Model.writes[symbol] || len(symbol.Declarations()) != 1 {
			return evaluator.Result{}
		}
		declaration := symbol.Declarations()[0]
		if declaration.Kind != ast.KindVariableDeclaration || declaration.Name().Kind != ast.KindIdentifier || declaration.Initializer() == nil || declaration.Name().End() > location.End() {
			return evaluator.Result{}
		}
		seen[symbol] = true
		defer delete(seen, symbol)
		return evaluate(declaration.Initializer(), location)
	}, 0)
	return evaluate(node, node).Value
}

func (scope *LexicalScopeAnalysis) Member(node *ast.Node) (*ast.Node, *ast.Node, string) {
	node = ast.SkipParentheses(node)
	switch node.Kind {
	case ast.KindPropertyAccessExpression:
		return ast.SkipParentheses(node.Expression()), node.Name(), node.Name().Text()
	case ast.KindElementAccessExpression:
		property := node.AsElementAccessExpression().ArgumentExpression
		if property != nil {
			if name, ok := scope.Static(property).(string); ok {
				return ast.SkipParentheses(node.Expression()), property, name
			}
		}
	}
	return nil, nil, ""
}
