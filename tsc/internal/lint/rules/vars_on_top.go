package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type varsOnTopRule struct {
	context Context
}

func newVarsOnTop(context Context) Rule {
	rule := &varsOnTopRule{
		context: context,
	}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindVariableDeclarationList},
	}
}

func (rule *varsOnTopRule) OnEnterNode(node *ast.Node) bool {
	rule.checkVarsOnTop(node)
	return true
}

func (rule *varsOnTopRule) checkVarsOnTop(node *ast.Node) {
	if node.Kind != ast.KindVariableDeclarationList || node.Flags&ast.NodeFlagsBlockScoped != 0 {
		return
	}
	declaration := node.Parent
	if declaration.Kind != ast.KindVariableStatement {
		rule.context.Report(rule.context.Range(node), diagnostics.All_var_declarations_must_be_at_the_top_of_the_function_scope)
		return
	}
	parent := declaration.Parent
	var statements []*ast.Node
	static := false
	switch parent.Kind {
	case ast.KindSourceFile:
		statements = parent.AsSourceFile().Statements.Nodes
	case ast.KindBlock:
		if parent.Parent != nil && ast.IsFunctionLike(parent.Parent) && parent.Parent.Body() == parent {
			statements = parent.AsBlock().Statements.Nodes
		} else if parent.Parent != nil && parent.Parent.Kind == ast.KindClassStaticBlockDeclaration {
			static = true
			statements = parent.AsBlock().Statements.Nodes
		}
	}
	leading := !static
	for _, statement := range statements {
		if leading && (statement.Kind == ast.KindImportDeclaration || statement.Kind == ast.KindExpressionStatement && ast.SkipParentheses(statement.Expression()).Kind == ast.KindStringLiteral) {
			continue
		}
		leading = false
		if statement.Kind != ast.KindVariableStatement {
			break
		}
		if statement == declaration {
			return
		}
	}
	rule.context.Report(rule.context.Range(declaration), diagnostics.All_var_declarations_must_be_at_the_top_of_the_function_scope)
}
