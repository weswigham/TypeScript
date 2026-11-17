package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptConsistentTypeImportsRule struct {
	helpers.TypescriptScopeRuleContext
	hasDecoratorMetadata bool
	runtimeSymbols       map[*ast.Symbol]bool
}

func (rule *typescriptConsistentTypeImportsRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindSourceFile && rule.StringOption("prefer", "type-imports") != "no-type-imports" {
		rule.collectRuntimeReferences()
	}
	rule.typeImports(node)
	return true
}

func (rule *typescriptConsistentTypeImportsRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptConsistentTypeImportsRule) collectRuntimeReferences() {
	options := rule.Context.CompilerOptions
	if options == nil {
		options = &core.CompilerOptions{}
	}
	metadata := options.ExperimentalDecorators.IsTrue() && options.EmitDecoratorMetadata.IsTrue()
	jsx := rule.Context.File.LanguageVariant == core.LanguageVariantJSX && ast.GetJSXImplicitImportBase(options, rule.Context.File) == ""
	if !metadata && !jsx {
		return
	}
	var visit func(*ast.Node) bool
	visit = func(node *ast.Node) bool {
		if metadata && node.Kind == ast.KindDecorator {
			rule.hasDecoratorMetadata = true
			return true
		}
		if jsx && (ast.IsJsxOpeningLikeElement(node) || ast.IsJsxOpeningFragment(node)) {
			checker := rule.Context.GetChecker()
			names := []string{checker.GetJsxNamespace(rule.Context.File.AsNode())}
			if ast.IsJsxOpeningFragment(node) {
				names = append(names, checker.GetJsxFragmentFactory(node))
			}
			for _, name := range names {
				if name == "" {
					continue
				}
				if symbol := checker.ResolveName(name, node, ast.SymbolFlagsValue, false); symbol != nil {
					if rule.runtimeSymbols == nil {
						rule.runtimeSymbols = make(map[*ast.Symbol]bool)
					}
					rule.runtimeSymbols[symbol] = true
				}
			}
		}
		return node.ForEachChild(visit)
	}
	visit(rule.Context.File.AsNode())
}

func (rule *typescriptConsistentTypeImportsRule) removeTypeKeyword(node *ast.Node) helpers.TsScopeEdit {
	lexer := scanner.GetScannerForSourceFile(rule.Context.File, rule.Start(node))
	for kind := lexer.Token(); kind != ast.KindEndOfFile && lexer.TokenStart() < node.End(); kind = lexer.Scan() {
		if kind == ast.KindTypeKeyword {
			end := lexer.TokenEnd()
			text := rule.Context.File.Text()
			for end < node.End() && (text[end] == ' ' || text[end] == '\t') {
				end++
			}
			return helpers.TsScopeEdit{Start: lexer.TokenStart(), End: end, Text: ""}
		}
	}
	return helpers.TsScopeEdit{Start: rule.Start(node), End: rule.Start(node), Text: ""}
}

func (rule *typescriptConsistentTypeImportsRule) typeImports(node *ast.Node) {
	if node.Kind == ast.KindImportType && rule.Boolean("disallowTypeAnnotations", true) {
		rule.Context.Report(rule.Context.Range(node), diagnostics.X_import_type_annotations_are_forbidden)
		return
	}
	if rule.StringOption("prefer", "type-imports") == "no-type-imports" {
		if node.Kind == ast.KindImportDeclaration && node.AsImportDeclaration().ImportClause != nil && node.AsImportDeclaration().ImportClause.AsImportClause().IsTypeOnly() || node.Kind == ast.KindImportSpecifier && node.AsImportSpecifier().IsTypeOnly {
			diagnostic := rule.Context.Report(rule.Context.Range(node), diagnostics.Use_an_import_instead_of_an_import_type)
			rule.Edits(diagnostic, nil, rule.removeTypeKeyword(node))
		}
		return
	}
	if node.Kind != ast.KindImportDeclaration || rule.hasDecoratorMetadata {
		return
	}
	declaration := node.AsImportDeclaration()
	clause := declaration.ImportClause
	if clause == nil || clause.AsImportClause().IsTypeOnly() {
		return
	}
	specifiers := helpers.TsScopeImportSpecifiers(clause)
	var types, values, inline []*ast.Node
	for _, specifier := range specifiers {
		if specifier.Kind == ast.KindImportSpecifier && specifier.AsImportSpecifier().IsTypeOnly {
			inline = append(inline, specifier)
			continue
		}
		binding := rule.Bindings().Decls[specifier.Name()]
		onlyType := binding != nil && len(binding.References) > 0
		if onlyType {
			for _, reference := range binding.References {
				if !reference.TypeOnly {
					onlyType = false
				}
			}
			if onlyType && len(rule.runtimeSymbols) > 0 {
				onlyType = !rule.runtimeSymbols[rule.Context.GetChecker().GetSymbolAtLocation(specifier.Name())]
			}
		}
		if onlyType {
			types = append(types, specifier)
		} else {
			values = append(values, specifier)
		}
	}
	if len(types) == 0 {
		return
	}
	if len(values) == 0 {
		if declaration.Attributes != nil && len(declaration.Attributes.Elements()) > 0 {
			return
		}
		diagnostic := rule.Context.Report(rule.Context.Range(node), diagnostics.All_imports_in_the_declaration_are_only_used_as_types_Use_import_type)
		if clause.Name() != nil && clause.AsImportClause().NamedBindings != nil {
			rule.splitTypeImports(diagnostic, node, types)
			return
		}
		edits := []helpers.TsScopeEdit{{Start: rule.Start(clause), End: rule.Start(clause), Text: "type "}}
		for _, specifier := range inline {
			edits = append(edits, rule.removeTypeKeyword(specifier))
		}

		if rule.StringOption("fixStyle", "separate-type-imports") == "inline-type-imports" && clause.Name() == nil && clause.AsImportClause().NamedBindings.Kind == ast.KindNamedImports {
			edits = nil
			for _, specifier := range types {
				edits = append(edits, helpers.TsScopeEdit{Start: rule.Start(specifier), End: rule.Start(specifier), Text: "type "})
			}
		}
		rule.Edits(diagnostic, nil, edits...)
		return
	}
	var names []string
	for _, specifier := range types {
		names = append(names, `"`+specifier.Name().Text()+`"`)
	}
	diagnostic := rule.Context.Report(rule.Context.Range(node), diagnostics.Imports_0_are_only_used_as_type, strings.Join(names, ", "))
	if rule.StringOption("fixStyle", "separate-type-imports") == "inline-type-imports" {
		var edits []helpers.TsScopeEdit
		allNamed := true
		for _, specifier := range types {
			if specifier.Kind != ast.KindImportSpecifier {
				allNamed = false
				break
			}
			edits = append(edits, helpers.TsScopeEdit{Start: rule.Start(specifier), End: rule.Start(specifier), Text: "type "})
		}
		if allNamed {
			rule.Edits(diagnostic, nil, edits...)
			return
		}
	}
	rule.splitTypeImports(diagnostic, node, types)
}

func (rule *typescriptConsistentTypeImportsRule) splitTypeImports(diagnostic *ast.Diagnostic, node *ast.Node, types []*ast.Node) {
	declaration := node.AsImportDeclaration()
	clause := declaration.ImportClause
	bindings := clause.AsImportClause().NamedBindings
	text := rule.Context.File.Text()
	module := rule.Text(declaration.ModuleSpecifier)
	isType := make(map[*ast.Node]bool, len(types))
	var namedTypes []*ast.Node
	for _, specifier := range types {
		isType[specifier] = true
		if specifier.Kind == ast.KindImportSpecifier {
			namedTypes = append(namedTypes, specifier)
		}
	}
	comma, afterComma := 0, 0
	if clause.Name() != nil {
		lexer := scanner.GetScannerForSourceFile(rule.Context.File, clause.Name().End())
		comma = lexer.TokenStart()
		afterComma = scanner.SkipTriviaEx(text, lexer.TokenEnd(), &scanner.SkipTriviaOptions{StopAtComments: true})
	}
	var edits []helpers.TsScopeEdit
	var statements []string
	if bindings.Kind == ast.KindNamespaceImport && isType[bindings] {
		statements = append(statements, "import type "+rule.Text(bindings)+" from "+module+";\n")
		edits = append(edits, helpers.TsScopeEdit{Start: comma, End: bindings.End(), Text: ""})
	} else if bindings.Kind == ast.KindNamedImports {
		named := bindings.AsNamedImports().Elements.Nodes
		content := ""
		if len(namedTypes) == len(named) {
			content = text[rule.Start(bindings)+1 : bindings.End()-1]
			edits = append(edits, helpers.TsScopeEdit{Start: comma, End: bindings.End(), Text: ""})
		} else {
			var removals []helpers.TsScopeEdit
			content, removals = rule.extractNamedTypeImports(bindings, namedTypes)
			edits = append(edits, removals...)
		}
		if len(namedTypes) > 0 {
			if target := rule.namedTypeImportTarget(node); target != nil {
				lexer := scanner.GetScannerForSourceFile(rule.Context.File, rule.Start(target))
				previous := ast.KindUnknown
				for lexer.Token() != ast.KindCloseBraceToken && lexer.Token() != ast.KindEndOfFile {
					previous = lexer.Token()
					lexer.Scan()
				}
				if previous != ast.KindCommaToken && previous != ast.KindOpenBraceToken {
					content = "," + content
				}
				edits = append(edits, helpers.TsScopeEdit{Start: lexer.TokenStart(), End: lexer.TokenStart(), Text: content})
			} else if rule.StringOption("fixStyle", "separate-type-imports") == "inline-type-imports" {
				var specifiers []string
				for _, specifier := range namedTypes {
					specifiers = append(specifiers, "type "+rule.Text(specifier))
				}
				statements = append(statements, "import {"+strings.Join(specifiers, ", ")+"} from "+module+";\n")
			} else {
				statements = append(statements, "import type {"+content+"} from "+module+";\n")
			}
		}
	}
	if isType[clause] {
		if len(types) == len(helpers.TsScopeImportSpecifiers(clause)) {
			lexer := scanner.GetScannerForSourceFile(rule.Context.File, rule.Start(node))
			edits = append(edits, helpers.TsScopeEdit{Start: lexer.TokenEnd(), End: lexer.TokenEnd(), Text: " type"})
		} else {
			defaultText := strings.TrimSpace(text[rule.Start(clause):comma])
			statements = append(statements, "import type "+defaultText+" from "+module+";\n")
			edits = append(edits, helpers.TsScopeEdit{Start: rule.Start(clause), End: afterComma, Text: ""})
		}
	}
	if len(statements) > 0 {
		edits = append(edits, helpers.TsScopeEdit{Start: rule.Start(node), End: rule.Start(node), Text: strings.Join(statements, "")})
	}
	rule.Edits(diagnostic, nil, edits...)
}

func (rule *typescriptConsistentTypeImportsRule) namedTypeImportTarget(node *ast.Node) *ast.Node {
	module := node.AsImportDeclaration().ModuleSpecifier.Text()
	for _, statement := range rule.Context.File.Statements.Nodes {
		if statement.Kind != ast.KindImportDeclaration || statement == node {
			continue
		}
		declaration := statement.AsImportDeclaration()
		clause := declaration.ImportClause
		if declaration.ModuleSpecifier.Text() != module || clause == nil || clause.Name() != nil || !clause.AsImportClause().IsTypeOnly() {
			continue
		}
		bindings := clause.AsImportClause().NamedBindings
		if bindings != nil && bindings.Kind == ast.KindNamedImports {
			return bindings
		}
	}
	return nil
}

func (rule *typescriptConsistentTypeImportsRule) extractNamedTypeImports(bindings *ast.Node, types []*ast.Node) (string, []helpers.TsScopeEdit) {
	type token struct {
		kind       ast.Kind
		start, end int
	}
	var tokens []token
	lexer := scanner.GetScannerForSourceFile(rule.Context.File, rule.Start(bindings))
	for kind := lexer.Token(); lexer.TokenStart() < bindings.End() && kind != ast.KindEndOfFile; kind = lexer.Scan() {
		tokens = append(tokens, token{kind, lexer.TokenStart(), lexer.TokenEnd()})
	}
	named := bindings.AsNamedImports().Elements.Nodes
	isType := make(map[*ast.Node]bool, len(types))
	for _, specifier := range types {
		isType[specifier] = true
	}
	var parts []string
	var edits []helpers.TsScopeEdit
	for index := 0; index < len(named); index++ {
		if !isType[named[index]] {
			continue
		}
		first := index
		for index+1 < len(named) && isType[named[index+1]] {
			index++
		}
		var before, after token
		for _, candidate := range tokens {
			if candidate.end <= rule.Start(named[first]) {
				before = candidate
			} else if candidate.start >= named[index].End() {
				after = candidate
				break
			}
		}
		start, end := before.end, named[index].End()
		if before.kind == ast.KindCommaToken {
			start = before.start
		}
		if (first == 0 || index == len(named)-1) && after.kind == ast.KindCommaToken {
			end = after.end
		}
		parts = append(parts, rule.Context.File.Text()[before.end:after.start])
		edits = append(edits, helpers.TsScopeEdit{Start: start, End: end, Text: ""})
	}
	return strings.Join(parts, ","), edits
}

func newTypeScriptConsistentTypeImports(context Context) Rule {
	return &typescriptConsistentTypeImportsRule{Context: context, Name: "consistent-type-imports"}
}
