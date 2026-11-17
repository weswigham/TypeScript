package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type maxClassesPerFileRule struct {
	context Context
}

func (rule *maxClassesPerFileRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindSourceFile {
		return true
	}
	count := 0
	ignoreExpressions := helpers.BooleanOptionValue(helpers.SyntaxObject(rule.context, 0), "ignoreExpressions", false)
	helpers.WalkSyntaxWhile(node, func(child *ast.Node) bool {
		if child.Kind == ast.KindClassDeclaration || child.Kind == ast.KindClassExpression && !ignoreExpressions {
			count++
		}
		return true
	})
	if maximum := helpers.SyntaxMaximum(rule.context, 1); count > maximum {
		rule.context.Report(rule.context.Range(node), diagnostics.File_has_too_many_classes_0_Maximum_allowed_is_1, count, maximum)
	}
	return true
}

func (rule *maxClassesPerFileRule) OnExitNode(node *ast.Node) {
}

func newMaxClassesPerFile(context Context) Rule {
	return &maxClassesPerFileRule{context: context}
}
