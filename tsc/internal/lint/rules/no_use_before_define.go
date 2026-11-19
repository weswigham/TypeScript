package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noUseBeforeDefineRule struct {
	helpers.LexicalScopeAnalysis
}

func newNoUseBeforeDefineRule(context Context) Rule {
	rule := &noUseBeforeDefineRule{LexicalScopeAnalysis: helpers.NewLexicalScopeAnalysis(context)}

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

func (rule *noUseBeforeDefineRule) OnEnterNode(node *ast.Node) bool {
	rule.Model.Enter(rule.Context, node)
	return true
}

func (rule *noUseBeforeDefineRule) OnExitNode(node *ast.Node) {
	rule.Model.Exit(node)
	if node.Kind != ast.KindSourceFile {
		return
	}
	rule.Model.Resolve(rule.Context)
	for _, binding := range rule.Model.Bindings {
		rule.beforeDefine(binding)
	}
}

func noUseBeforeDefineImmediate(node *ast.Node) bool {
	if node.Kind == ast.KindClassStaticBlockDeclaration || node.Kind == ast.KindPropertyDeclaration && ast.HasSyntacticModifier(node, ast.ModifierFlagsStatic) {
		return true
	}
	if !ast.IsFunctionLike(node) || ast.HasSyntacticModifier(node, ast.ModifierFlagsAsync) || node.Kind == ast.KindFunctionExpression && node.AsFunctionExpression().AsteriskToken != nil || node.Kind == ast.KindFunctionDeclaration && node.AsFunctionDeclaration().AsteriskToken != nil {
		return false
	}
	current := helpers.LexicalScopeUnwrap(node)
	return current.Parent.Kind == ast.KindCallExpression && current.Parent.Expression() == current
}

func noUseBeforeDefineSeparate(reference, declaration *ast.Node) bool {
	target := helpers.LexicalScopeExecution(declaration)
	for execution := helpers.LexicalScopeExecution(reference); execution != target; execution = helpers.LexicalScopeExecution(execution) {
		if execution == nil || !noUseBeforeDefineImmediate(execution) {
			return true
		}
	}
	return false
}

func noUseBeforeDefineStaticRange(declaration, reference *ast.Node) bool {
	for _, member := range declaration.Members() {
		if member.Kind == ast.KindClassStaticBlockDeclaration && helpers.TsScopeContains(member, reference) || member.Kind == ast.KindPropertyDeclaration && ast.HasSyntacticModifier(member, ast.ModifierFlagsStatic) && helpers.TsScopeContains(member.Initializer(), reference) {
			return true
		}
	}
	return false
}

func (rule *noUseBeforeDefineRule) duringInitialization(binding *helpers.TsScopeBinding, reference *ast.Node) bool {
	declaration := binding.Declarations[0]
	if noUseBeforeDefineSeparate(reference, binding.Identifiers[0]) {
		return false
	}
	if ast.IsClassLike(declaration) {
		return helpers.TsScopeContains(declaration, reference) && !noUseBeforeDefineStaticRange(declaration, reference)
	}
	for current := declaration; current != nil; current = current.Parent {
		if helpers.TsScopeContains(helpers.TsScopeInitializer(current), reference) {
			return true
		}
		if current.Kind == ast.KindVariableDeclaration {
			return ast.IsForInOrOfStatement(current.Parent.Parent) && helpers.TsScopeContains(current.Parent.Parent.Expression(), reference)
		}
		if ast.IsFunctionLike(current) || ast.IsClassLike(current) || current.Kind == ast.KindCatchClause || ast.IsStatement(current) {
			break
		}
	}
	return false
}

func (rule *noUseBeforeDefineRule) beforeDefine(binding *helpers.TsScopeBinding) {
	declaration, identifier := binding.Declarations[0], binding.Identifiers[0]
	for _, reference := range binding.References {
		node := reference.Node
		if reference.TypeOnly && rule.Boolean("ignoreTypeReferences", true) || node.Parent.Kind == ast.KindExportSpecifier && rule.Boolean("allowNamedExports", false) {
			continue
		}
		functionEnabled := rule.Boolean("functions", true)
		if len(rule.Context.Options) != 0 && rule.Context.Options[0] == "nofunc" {
			functionEnabled = false
		}
		if (declaration.Kind == ast.KindFunctionDeclaration || declaration.Kind == ast.KindFunctionExpression) && !functionEnabled || declaration.Kind == ast.KindEnumDeclaration && !rule.Boolean("enums", true) || (declaration.Kind == ast.KindTypeAliasDeclaration || declaration.Kind == ast.KindInterfaceDeclaration) && !rule.Boolean("typedefs", true) {
			continue
		}
		if noUseBeforeDefineSeparate(node, identifier) && (declaration.Kind == ast.KindClassDeclaration && !rule.Boolean("classes", true) || helpers.TsScopeRootBinding(declaration).Kind == ast.KindVariableDeclaration && !rule.Boolean("variables", true)) {
			continue
		}
		decorator := false
		if ast.IsClassLike(declaration) {
			for current := node.Parent; current != nil && current != declaration; current = current.Parent {
				if current.Kind == ast.KindDecorator && current.Parent == declaration {
					decorator = true
				}
			}
		}
		if !decorator && (node.End() < identifier.End() || !reference.TypeOnly && rule.duringInitialization(binding, node)) {
			rule.Context.Report(rule.Context.Range(node), diagnostics.X_0_was_used_before_it_was_defined, binding.Name)
		}
	}
}
