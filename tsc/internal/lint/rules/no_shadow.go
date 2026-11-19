package rules

import (
	"slices"
	"strings"
	"unicode/utf16"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noShadowRule struct {
	helpers.LexicalScopeAnalysis
}

func newNoShadowRule(context Context) Rule {
	rule := &noShadowRule{LexicalScopeAnalysis: helpers.NewLexicalScopeAnalysis(context)}

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

func (rule *noShadowRule) OnEnterNode(node *ast.Node) bool {
	rule.Model.Enter(rule.Context, node)
	return true
}

func (rule *noShadowRule) OnExitNode(node *ast.Node) {
	rule.Model.Exit(node)
	if node.Kind != ast.KindSourceFile {
		return
	}
	rule.Model.Resolve(rule.Context)
	for _, binding := range rule.Model.Bindings {
		rule.shadow(binding)
	}
}

func (rule *noShadowRule) shadow(binding *helpers.TsScopeBinding) {
	if binding.Name == "this" || slices.Contains(helpers.TsScopeStrings(rule.Options()["allow"]), binding.Name) {
		return
	}
	if binding.Frame.Parent == nil {
		if ast.IsExternalModule(rule.Context.File) && rule.Boolean("builtinGlobals", false) && rule.ExternalGlobal(binding.Name, nil) {
			rule.Context.Report(rule.Context.Range(binding.Identifiers[0]), diagnostics.X_0_is_already_a_global_variable, binding.Name)
		}
		return
	}
	declaration, identifier := binding.Declarations[0], binding.Identifiers[0]
	for frame := binding.Frame; frame != nil; frame = frame.Parent {
		if frame.Owner.Kind == ast.KindModuleDeclaration && ast.IsGlobalScopeAugmentation(frame.Owner) {
			return
		}
	}
	if rule.Context.File.IsDeclarationFile && ast.HasSyntacticModifier(helpers.TsScopeRootBinding(declaration), ast.ModifierFlagsAmbient) {
		return
	}
	outer := binding.Frame.Parent.Find(binding.Name)
	if outer == nil {
		if rule.Boolean("builtinGlobals", false) && rule.ExternalGlobal(binding.Name, binding.Frame.Parent.Owner) {
			rule.Context.Report(rule.Context.Range(identifier), diagnostics.X_0_is_already_a_global_variable, binding.Name)
		}
		return
	}
	if outer == binding {
		return
	}
	if helpers.TsScopeImport(outer.Declarations[0]) && helpers.TsScopeTypeImport(outer.Declarations[0]) {
		importDeclaration := outer.Declarations[0]
		for importDeclaration != nil && importDeclaration.Kind != ast.KindImportDeclaration {
			importDeclaration = importDeclaration.Parent
		}
		if importDeclaration != nil {
			for frame := binding.Frame; frame != nil; frame = frame.Parent {
				if frame.Owner.Kind == ast.KindModuleDeclaration && frame.Owner.Name().Kind == ast.KindStringLiteral && frame.Owner.Name().Text() == importDeclaration.AsImportDeclaration().ModuleSpecifier.Text() {
					return
				}
			}
		}
	}
	if rule.Boolean("ignoreTypeValueShadow", true) && binding.Value != outer.Value || rule.Boolean("ignoreFunctionTypeParameterNameValueShadow", true) && declaration.Kind == ast.KindParameter && helpers.TsScopeSignature(declaration.Parent) {
		return
	}
	if declaration.Kind == ast.KindTypeParameter && declaration.Parent.Kind == ast.KindMethodDeclaration && ast.HasSyntacticModifier(declaration.Parent, ast.ModifierFlagsStatic) {
		return
	}
	outerDeclaration := outer.Declarations[0]
	if declaration.Kind == ast.KindFunctionExpression || declaration.Kind == ast.KindClassExpression {
		current := helpers.LexicalScopeUnwrap(declaration)
		for current.Parent != nil {
			parent := current.Parent
			if parent.Kind == ast.KindConditionalExpression && parent.AsConditionalExpression().Condition != current || parent.Kind == ast.KindBinaryExpression && slices.Contains([]ast.Kind{ast.KindBarBarToken, ast.KindAmpersandAmpersandToken, ast.KindQuestionQuestionToken}, parent.AsBinaryExpression().OperatorToken.Kind) {
				current = helpers.LexicalScopeUnwrap(parent)
			} else {
				break
			}
		}
		if helpers.TsScopeInitializer(outerDeclaration) == current {
			return
		}
	}
	if rule.Boolean("ignoreOnInitialization", false) && rule.initializationShadow(binding, outer) {
		return
	}
	if identifier.End() < scanner.GetTokenPosOfNode(outer.Identifiers[0], rule.Context.File, false) {
		hoist, _ := rule.Options()["hoist"].(string)
		if hoist == "" {
			hoist = "functions"
		}
		hoisted := hoist == "all" || (hoist == "functions" || hoist == "functions-and-types") && outerDeclaration.Kind == ast.KindFunctionDeclaration || (hoist == "types" || hoist == "functions-and-types") && (outerDeclaration.Kind == ast.KindTypeAliasDeclaration || outerDeclaration.Kind == ast.KindInterfaceDeclaration)
		if !hoisted {
			return
		}
	}
	position := scanner.GetTokenPosOfNode(outer.Identifiers[0], rule.Context.File, false)
	before := rule.Context.File.Text()[:position]
	line := strings.Count(before, "\n") + 1
	column := len(utf16.Encode([]rune(before[strings.LastIndex(before, "\n")+1:]))) + 1
	rule.Context.Report(rule.Context.Range(identifier), diagnostics.X_0_is_already_declared_in_the_upper_scope_on_line_1_column_2, binding.Name, line, column)
}

func (rule *noShadowRule) initializationShadow(binding, outer *helpers.TsScopeBinding) bool {
	function := helpers.LexicalScopeExecution(binding.Identifiers[0])
	if function == nil || function.Kind != ast.KindFunctionExpression && function.Kind != ast.KindArrowFunction {
		return false
	}
	frame := rule.Model.Nodes[function].Parent
	if frame != nil && frame.Owner == function {
		frame = frame.Parent
	}
	if frame != outer.Frame {
		return false
	}
	call := function.Parent
	for call != nil && call.Kind != ast.KindCallExpression {
		call = call.Parent
	}
	if call == nil {
		return false
	}
	for declaration := outer.Declarations[0]; declaration != nil; declaration = declaration.Parent {
		if helpers.TsScopeContains(helpers.TsScopeInitializer(declaration), call) {
			return true
		}
		if declaration.Kind == ast.KindVariableDeclaration {
			return ast.IsForInOrOfStatement(declaration.Parent.Parent) && helpers.TsScopeContains(declaration.Parent.Parent.Expression(), call)
		}
		if ast.IsFunctionLike(declaration) || ast.IsClassLike(declaration) || ast.IsStatement(declaration) {
			break
		}
	}
	return false
}
