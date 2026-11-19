package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noImpliedEvalRule struct {
	helpers.LexicalScopeAnalysis
}

func newNoImpliedEvalRule(context Context) Rule {
	rule := &noImpliedEvalRule{LexicalScopeAnalysis: helpers.NewLexicalScopeAnalysis(context)}

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

func (rule *noImpliedEvalRule) OnEnterNode(node *ast.Node) bool {
	rule.Model.Enter(rule.Context, node)
	return true
}

func (rule *noImpliedEvalRule) OnExitNode(node *ast.Node) {
	rule.Model.Exit(node)
	if node.Kind != ast.KindSourceFile {
		return
	}
	rule.Model.Resolve(rule.Context)
	rule.impliedEval()
}

func (rule *noImpliedEvalRule) globalMember(node *ast.Node, candidates []string, allowDeclaration bool) (*ast.Node, string) {
	object, property, method := rule.Member(node)
	if object == nil {
		return nil, ""
	}
	for ast.IsAccessExpression(object) {
		base, _, name := rule.Member(object)
		if base == nil || !slices.Contains(candidates, name) {
			return nil, ""
		}
		root := base
		for ast.IsAccessExpression(root) {
			root = ast.SkipParentheses(root.Expression())
		}
		if root.Kind != ast.KindIdentifier || root.Text() != name {
			return nil, ""
		}
		object = base
	}
	if object.Kind == ast.KindIdentifier && slices.Contains(candidates, object.Text()) && rule.Global(object, allowDeclaration) && (rule.KnownGlobal(object) || rule.Model.Binding(object) != nil) {
		return property, method
	}
	return nil, ""
}

func noImpliedEvalString(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	if node.Kind == ast.KindStringLiteral || node.Kind == ast.KindNoSubstitutionTemplateLiteral || node.Kind == ast.KindTemplateExpression {
		return true
	}
	return node.Kind == ast.KindBinaryExpression && node.AsBinaryExpression().OperatorToken.Kind == ast.KindPlusToken && (noImpliedEvalString(node.AsBinaryExpression().Left) || noImpliedEvalString(node.AsBinaryExpression().Right))
}

func (rule *noImpliedEvalRule) impliedEval() {
	for _, call := range rule.Model.Calls {
		if len(call.Arguments()) == 0 {
			continue
		}
		callee := ast.SkipParentheses(call.Expression())
		name := ""
		if callee.Kind == ast.KindIdentifier && rule.Global(callee, false) && rule.KnownGlobal(callee) {
			name = callee.Text()
		} else {
			_, name = rule.globalMember(callee, []string{"global", "window", "globalThis", "self"}, false)
		}
		if !slices.Contains([]string{"setTimeout", "setInterval", "execScript"}, name) {
			continue
		}
		argument := call.Arguments()[0]
		_, staticString := rule.Static(argument).(string)
		if !staticString && !noImpliedEvalString(argument) {
			continue
		}
		if name == "execScript" {
			rule.Context.Report(rule.Context.Range(call), diagnostics.Implied_eval_Do_not_use_execScript)
		} else {
			rule.Context.Report(rule.Context.Range(call), diagnostics.Implied_eval_Consider_passing_a_function_instead_of_a_string)
		}
	}
}
