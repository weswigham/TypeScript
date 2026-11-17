package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

var noAsyncPromiseExecutorMessage = diagnostics.Promise_executor_functions_should_not_be_async

type noAsyncPromiseExecutor struct {
	context Context
}

func (rule *noAsyncPromiseExecutor) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindNewExpression {
		return true
	}
	expression := node.AsNewExpression()
	callee := ast.SkipParentheses(expression.Expression)
	if callee.Kind != ast.KindIdentifier || callee.Text() != "Promise" || expression.Arguments == nil || len(expression.Arguments.Nodes) == 0 {
		return true
	}
	executor := ast.SkipParentheses(expression.Arguments.Nodes[0])
	if (executor.Kind != ast.KindArrowFunction && executor.Kind != ast.KindFunctionExpression) || !ast.HasSyntacticModifier(executor, ast.ModifierFlagsAsync) {
		return true
	}
	if expressionGlobalReference(rule.context, callee) {
		for _, modifier := range executor.Modifiers().Nodes {
			if modifier.Kind == ast.KindAsyncKeyword {
				start := scanner.GetTokenPosOfNode(modifier, rule.context.File, false)
				rule.context.Report(core.NewTextRange(start, modifier.End()), noAsyncPromiseExecutorMessage)
				break
			}
		}
	}
	return true
}

func (rule *noAsyncPromiseExecutor) OnExitNode(node *ast.Node) {}

func expressionGlobalReference(context Context, node *ast.Node) bool {
	if node.Kind != ast.KindIdentifier {
		return false
	}
	if local := context.File.AsNode().Locals().Get(node.Text()); local != nil && local.Flags()&(ast.SymbolFlagsValue|ast.SymbolFlagsAlias) != 0 {
		return false
	}
	symbol := context.GetChecker().GetSymbolAtLocation(node)
	if symbol == nil {
		return true
	}
	for _, declaration := range symbol.Declarations() {
		if ast.GetSourceFileOfNode(declaration) == context.File {
			switch declaration.Kind {
			case ast.KindInterfaceDeclaration, ast.KindTypeAliasDeclaration:
				continue
			}
			return false
		}
	}
	return true
}

func newNoAsyncPromiseExecutor(context Context) Rule {
	return &noAsyncPromiseExecutor{context: context}
}
