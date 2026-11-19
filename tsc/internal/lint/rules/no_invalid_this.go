package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noInvalidThisRule struct {
	helpers.LexicalScopeAnalysis
}

func newNoInvalidThisRule(context Context) Rule {
	rule := &noInvalidThisRule{LexicalScopeAnalysis: helpers.NewLexicalScopeAnalysis(context)}

	return Rule{
		Enter: rule.OnEnterNode,
		Exit:  rule.OnExitNode,
		ExitKinds: []ast.Kind{
			ast.KindFunctionDeclaration,
			ast.KindFunctionExpression,
			ast.KindArrowFunction,
			ast.KindMethodDeclaration,
			ast.KindGetAccessor,
			ast.KindSetAccessor,
			ast.KindConstructor,
			ast.KindMethodSignature,
			ast.KindCallSignature,
			ast.KindJSDocSignature,
			ast.KindConstructSignature,
			ast.KindIndexSignature,
			ast.KindFunctionType,
			ast.KindConstructorType,
			ast.KindClassDeclaration,
			ast.KindClassExpression,
			ast.KindSourceFile,
			ast.KindBlock,
			ast.KindModuleDeclaration,
			ast.KindForStatement,
			ast.KindForInStatement,
			ast.KindForOfStatement,
			ast.KindCatchClause,
			ast.KindCaseBlock,
			ast.KindTypeAliasDeclaration,
			ast.KindInterfaceDeclaration,
			ast.KindMappedType,
			ast.KindEnumDeclaration,
			ast.KindClassStaticBlockDeclaration,
		},
	}
}

func (rule *noInvalidThisRule) OnEnterNode(node *ast.Node) bool {
	rule.Model.Enter(rule.Context, node)
	return true
}

func (rule *noInvalidThisRule) OnExitNode(node *ast.Node) {
	rule.Model.Exit(node)
	if node.Kind != ast.KindSourceFile {
		return
	}
	rule.Model.Resolve(rule.Context)
	for _, expression := range rule.Model.ThisNodes {
		if rule.invalidThis(expression) {
			rule.Context.Report(rule.Context.Range(expression), diagnostics.Unexpected_this)
		}
	}
}

func (rule *noInvalidThisRule) invalidThis(node *ast.Node) bool {
	owner := helpers.LexicalScopeThisOwner(node)
	if owner == nil || owner.Kind == ast.KindSourceFile {
		return ast.IsExternalModule(rule.Context.File)
	}
	return rule.Strict(owner) && rule.DefaultThis(owner, rule.Boolean("capIsConstructor", true))
}
