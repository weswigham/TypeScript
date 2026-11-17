package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoUnusedVarsRule struct {
	helpers.TypescriptScopeRuleContext
}

func (rule *typescriptNoUnusedVarsRule) OnEnterNode(node *ast.Node) bool {
	return true
}

func (rule *typescriptNoUnusedVarsRule) OnExitNode(node *ast.Node) {
	if node.Kind != ast.KindSourceFile {
		return
	}
	for _, binding := range rule.Bindings().Bindings {
		rule.unused(binding)
	}
}

func tsScopeExported(declaration *ast.Node) bool {
	for current := declaration; current != nil; current = current.Parent {
		if current != declaration && (ast.IsFunctionLike(current) || ast.IsClassLike(current)) {
			return false
		}
		if ast.IsDeclaration(current) && ast.HasSyntacticModifier(current, ast.ModifierFlagsExport) {
			return true
		}
		if current.Kind == ast.KindVariableStatement {
			return ast.HasSyntacticModifier(current, ast.ModifierFlagsExport)
		}
		if ast.IsFunctionLike(current) || ast.IsClassLike(current) || current.Kind == ast.KindSourceFile || current.Kind == ast.KindModuleBlock {
			return false
		}
	}
	return false
}

func tsScopeReads(reference helpers.TsScopeReference, binding *helpers.TsScopeBinding) bool {
	node := reference.Node
	if !reference.Write {
		if (binding.Declarations[0].Kind == ast.KindFunctionDeclaration || binding.Declarations[0].Kind == ast.KindFunctionExpression || binding.Declarations[0].Kind == ast.KindClassDeclaration || binding.Declarations[0].Kind == ast.KindClassExpression || binding.Declarations[0].Kind == ast.KindTypeAliasDeclaration || binding.Declarations[0].Kind == ast.KindInterfaceDeclaration) && helpers.TsScopeContains(binding.Declarations[0], node) {
			return false
		}
		for current := node; current.Parent != nil; current = current.Parent {
			parent := current.Parent
			if parent.Kind == ast.KindBinaryExpression && ast.IsAssignmentOperator(parent.AsBinaryExpression().OperatorToken.Kind) && helpers.TsScopeContains(parent.AsBinaryExpression().Right, node) {
				left := ast.SkipParentheses(parent.AsBinaryExpression().Left)
				if helpers.TsScopeIdentifier(left, binding.Name) && parent.Parent.Kind == ast.KindExpressionStatement {
					return false
				}
			}
			if ast.IsStatement(parent) || ast.IsFunctionLike(parent) {
				break
			}
		}
		return true
	}
	parent := node.Parent
	if parent.Kind == ast.KindPrefixUnaryExpression || parent.Kind == ast.KindPostfixUnaryExpression {
		return parent.Parent.Kind != ast.KindExpressionStatement && parent.Parent.Kind != ast.KindForStatement
	}
	if parent.Kind == ast.KindBinaryExpression {
		return parent.AsBinaryExpression().OperatorToken.Kind != ast.KindEqualsToken && parent.Parent.Kind != ast.KindExpressionStatement
	}
	return false
}

func tsScopeQuery(node *ast.Node) bool {
	for current := node.Parent; current != nil; current = current.Parent {
		if current.Kind == ast.KindTypeQuery {
			return true
		}
		if ast.IsStatement(current) || ast.IsFunctionLike(current) {
			return false
		}
	}
	return false
}

func tsScopePattern(pattern, name string) bool {
	if pattern == "" {
		return false
	}
	return helpers.MatchesRegularExpression(pattern, name)
}

func tsScopeImportDeclaration(node *ast.Node) *ast.Node {
	for ; node != nil; node = node.Parent {
		if node.Kind == ast.KindImportDeclaration || node.Kind == ast.KindImportEqualsDeclaration {
			return node
		}
	}
	return nil
}

func (rule *typescriptNoUnusedVarsRule) unused(binding *helpers.TsScopeBinding) {
	declaration, identifier := binding.Declarations[0], binding.Identifiers[0]
	root := helpers.TsScopeRootBinding(declaration)
	if binding.Name == "this" || declaration.Kind == ast.KindEnumMember || root.Kind == ast.KindParameter && (helpers.TsScopeSignature(root.Parent) || ast.GetCombinedModifierFlags(root)&ast.ModifierFlagsParameterPropertyModifier != 0) {
		return
	}
	if tsScopeExported(declaration) {
		return
	}
	if binding.Frame.Owner.Kind == ast.KindSourceFile && !ast.IsExternalModule(rule.Context.File) && (rule.Mode("") == "local" || rule.StringOption("vars", "all") == "local") {
		return
	}
	if rule.Boolean("ignoreClassWithStaticInitBlock", false) && ast.IsClassLike(declaration) {
		for _, member := range declaration.Members() {
			if member.Kind == ast.KindClassStaticBlockDeclaration {
				return
			}
		}
	}
	if root.Kind == ast.KindVariableDeclaration && root.Parent.Kind == ast.KindVariableDeclarationList && rule.Boolean("ignoreUsingDeclarations", false) && root.Parent.Flags&ast.NodeFlagsUsing != 0 {
		return
	}
	used, onlyQuery := false, false
	lastWrite := identifier
	assigned := helpers.TsScopeInitializer(root) != nil
	for _, reference := range binding.References {
		if reference.Write && reference.Node.End() > lastWrite.End() && helpers.TsScopeFunction(reference.Node) == helpers.TsScopeFunction(declaration) {
			lastWrite, assigned = reference.Node, true
		}
		if tsScopeReads(reference, binding) {
			if tsScopeQuery(reference.Node) && binding.Value && !helpers.TsScopeImport(declaration) {
				onlyQuery = true
			} else {
				used = true
			}
		}
	}
	patternOption, description := "varsIgnorePattern", "vars"
	if root.Kind == ast.KindParameter {
		if rule.StringOption("args", "after-used") == "none" {
			return
		}
		patternOption, description = "argsIgnorePattern", "args"
	} else if root.Kind == ast.KindVariableDeclaration && root.Parent.Kind == ast.KindCatchClause {
		if rule.StringOption("caughtErrors", "all") == "none" {
			return
		}
		patternOption, description = "caughtErrorsIgnorePattern", "caught errors"
	}
	if declaration.Kind == ast.KindBindingElement && declaration.Parent.Kind == ast.KindArrayBindingPattern && tsScopePattern(rule.StringOption("destructuredArrayIgnorePattern", ""), binding.Name) {
		patternOption, description = "destructuredArrayIgnorePattern", "elements of array destructuring"
	}
	pattern := rule.StringOption(patternOption, "")
	if tsScopePattern(pattern, binding.Name) {
		if used && rule.Boolean("reportUsedIgnorePattern", false) {
			rule.Context.Report(rule.Context.Range(identifier), diagnostics.X_0_is_marked_as_ignored_but_is_used_Used_1_must_not_match_Slash_2_Slashu, binding.Name, description, pattern)
		}
		return
	}
	if root.Kind == ast.KindParameter && rule.StringOption("args", "after-used") == "after-used" && declaration.Kind != ast.KindBindingElement {
		for _, parameter := range root.Parent.Parameters() {
			if parameter.Pos() <= root.Pos() {
				continue
			}
			for _, other := range rule.Bindings().Bindings {
				if helpers.TsScopeRootBinding(other.Declarations[0]) == parameter {
					for _, reference := range other.References {
						if tsScopeReads(reference, other) {
							return
						}
					}
				}
			}
		}
	}
	if rule.Boolean("ignoreRestSiblings", false) && declaration.Kind == ast.KindBindingElement && declaration.Parent.Kind == ast.KindObjectBindingPattern && declaration.AsBindingElement().DotDotDotToken == nil {
		elements := declaration.Parent.AsBindingPattern().Elements.Nodes
		if len(elements) > 0 && elements[len(elements)-1].AsBindingElement().DotDotDotToken != nil {
			return
		}
	}
	if used {
		return
	}
	action, usage := "defined", "never used"
	if assigned {
		action = "assigned a value"
	}
	if onlyQuery {
		usage = "only used as a type"
	}
	additional := ""
	if pattern != "" {
		additional = ". Allowed unused " + description + " must match /" + pattern + "/u"
	}
	diagnostic := rule.Context.Report(rule.Context.Range(lastWrite), diagnostics.X_0_is_1_but_2_3, binding.Name, action, usage, additional)
	if helpers.TsScopeImport(declaration) && len(binding.Declarations) == 1 {
		rule.unusedImportFix(diagnostic, binding)
	}
}

func (rule *typescriptNoUnusedVarsRule) unusedImportFix(diagnostic *ast.Diagnostic, binding *helpers.TsScopeBinding) {
	declaration := binding.Declarations[0]
	statement := tsScopeImportDeclaration(declaration)
	if statement == nil {
		return
	}
	autofix, _ := rule.Options()["enableAutofixRemoval"].(map[string]any)
	suggestion := ast.NewCompilerDiagnostic(diagnostics.Remove_unused_variable_0_24433, binding.Name)
	if autofix["imports"] == true {
		suggestion = nil
	}
	if statement.Kind == ast.KindImportEqualsDeclaration {
		rule.Replace(diagnostic, statement, "", suggestion)
		return
	}
	clause := statement.AsImportDeclaration().ImportClause
	specifiers := helpers.TsScopeImportSpecifiers(clause)
	if len(specifiers) == 1 {
		rule.Replace(diagnostic, statement, "", suggestion)
		return
	}
	start, end := rule.Start(declaration), declaration.End()
	if declaration.Kind == ast.KindImportClause {
		start, end = rule.Start(clause.Name()), clause.Name().End()
		lexer := scanner.GetScannerForSourceFile(rule.Context.File, end)
		if lexer.Scan() == ast.KindCommaToken {
			end = lexer.TokenEnd()
		}
	} else if declaration.Kind == ast.KindNamespaceImport || declaration.Parent.Kind == ast.KindNamedImports && len(declaration.Parent.AsNamedImports().Elements.Nodes) == 1 {
		if declaration.Kind == ast.KindImportSpecifier {
			end = declaration.Parent.End()
		}
		start = clause.Name().End()
	} else {
		elements := declaration.Parent.AsNamedImports().Elements.Nodes
		for index, element := range elements {
			if element == declaration {
				if index > 0 {
					start = elements[index-1].End()
				} else {
					end = rule.Start(elements[index+1])
				}
				break
			}
		}
	}
	rule.Edits(diagnostic, suggestion, helpers.TsScopeEdit{Start: start, End: end, Text: ""})
}

func newTypeScriptNoUnusedVars(context Context) Rule {
	return &typescriptNoUnusedVarsRule{Context: context, Name: "no-unused-vars"}
}
