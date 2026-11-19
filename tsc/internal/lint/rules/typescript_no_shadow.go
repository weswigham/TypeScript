package rules

import (
	"slices"
	"strings"
	"unicode/utf16"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoShadowRule struct {
	helpers.TypescriptScopeRuleContext
}

func newTypeScriptNoShadow(context Context) Rule {
	rule := &typescriptNoShadowRule{Context: context, Name: "no-shadow"}

	return Rule{
		Exit:           rule.OnExitNode,
		ExitKinds:      []ast.Kind{ast.KindSourceFile},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptNoShadowRule) OnExitNode(node *ast.Node) {
	if node.Kind != ast.KindSourceFile {
		return
	}
	for _, binding := range rule.Bindings().Bindings {
		rule.shadow(binding)
	}
}

func (rule *typescriptNoShadowRule) shadow(binding *helpers.TsScopeBinding) {
	if binding.Frame.Parent == nil || binding.Name == "this" || slices.Contains(helpers.TsScopeStrings(rule.Options()["allow"]), binding.Name) {
		return
	}
	declaration, identifier := binding.Declarations[0], binding.Identifiers[0]
	for frame := binding.Frame; frame != nil; frame = frame.Parent {
		if frame.Owner.Kind == ast.KindModuleDeclaration && frame.Owner.Name() != nil && frame.Owner.Name().Kind == ast.KindIdentifier && frame.Owner.Name().Text() == "global" {
			return
		}
	}
	outer := binding.Frame.Parent.Find(binding.Name)
	if outer == nil {
		if !rule.Boolean("builtinGlobals", false) || rule.Context.GetChecker == nil {
			return
		}
		location := binding.Frame.Parent.Owner
		if symbol := rule.Context.GetChecker().ResolveName(binding.Name, location, ast.SymbolFlagsValue|ast.SymbolFlagsType, false); symbol != nil {
			for _, definition := range symbol.Declarations() {
				if ast.GetSourceFileOfNode(definition) != rule.Context.File {
					rule.Context.Report(rule.Context.Range(identifier), diagnostics.X_0_is_already_a_global_variable, binding.Name)
					return
				}
			}
		}
		return
	}
	if rule.Boolean("ignoreTypeValueShadow", true) && binding.Value != outer.Value {
		return
	}
	if rule.Boolean("ignoreFunctionTypeParameterNameValueShadow", true) && declaration.Kind == ast.KindParameter && helpers.TsScopeSignature(declaration.Parent) && outer.Value {
		return
	}
	if declaration.Kind == ast.KindTypeParameter && declaration.Parent.Kind == ast.KindMethodDeclaration && ast.HasSyntacticModifier(declaration.Parent, ast.ModifierFlagsStatic) && outer.Declarations[0].Kind == ast.KindTypeParameter && ast.IsClassLike(outer.Declarations[0].Parent) {
		return
	}
	outerDeclaration := outer.Declarations[0]
	if (declaration.Kind == ast.KindFunctionExpression || declaration.Kind == ast.KindClassExpression) && outerDeclaration.Kind == ast.KindVariableDeclaration {
		current := declaration
		for current.Parent != nil && (current.Parent.Kind == ast.KindParenthesizedExpression || current.Parent.Kind == ast.KindConditionalExpression && current.Parent.AsConditionalExpression().Condition != current || current.Parent.Kind == ast.KindBinaryExpression && (current.Parent.AsBinaryExpression().OperatorToken.Kind == ast.KindBarBarToken || current.Parent.AsBinaryExpression().OperatorToken.Kind == ast.KindAmpersandAmpersandToken || current.Parent.AsBinaryExpression().OperatorToken.Kind == ast.KindQuestionQuestionToken)) {
			current = current.Parent
		}
		if outerDeclaration.Initializer() == current {
			return
		}
	}
	if rule.Boolean("ignoreOnInitialization", false) && outerDeclaration.Kind == ast.KindVariableDeclaration && helpers.TsScopeContains(outerDeclaration.Initializer(), declaration) {
		for current := declaration.Parent; current != nil && helpers.TsScopeContains(outerDeclaration.Initializer(), current); current = current.Parent {
			if current.Kind == ast.KindCallExpression && helpers.TsScopeFunction(declaration) != helpers.TsScopeFunction(outerDeclaration) {
				return
			}
		}
	}
	if identifier.End() < outer.Identifiers[0].Pos() {
		hoist := rule.StringOption("hoist", "functions-and-types")
		hoisted := hoist == "all" || (hoist == "functions" || hoist == "functions-and-types") && outerDeclaration.Kind == ast.KindFunctionDeclaration || (hoist == "types" || hoist == "functions-and-types") && (outerDeclaration.Kind == ast.KindTypeAliasDeclaration || outerDeclaration.Kind == ast.KindInterfaceDeclaration)
		if !hoisted {
			return
		}
	}
	position := rule.Start(outer.Identifiers[0])
	before := rule.Context.File.Text()[:position]
	line := strings.Count(before, "\n") + 1
	column := len(utf16.Encode([]rune(before[strings.LastIndex(before, "\n")+1:]))) + 1
	message := diagnostics.X_0_is_already_declared_in_the_upper_scope_on_line_1_column_2
	if declaration.Kind == ast.KindEnumMember {
		message = diagnostics.Enum_members_are_added_to_the_enum_scope_so_references_to_0_in_enum_member_initializers_resolve_to_this_member_instead_of_the_declaration_in_the_upper_scope_on_line_1_column_2
	}
	rule.Context.Report(rule.Context.Range(identifier), message, binding.Name, line, column)
}
