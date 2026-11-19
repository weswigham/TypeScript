package rules

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptConsistentTypeExportsRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func newTypeScriptConsistentTypeExports(context Context) Rule {
	rule := &typescriptConsistentTypeExportsRule{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindExportDeclaration},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptConsistentTypeExportsRule) OnEnterNode(node *ast.Node) bool {
	rule.typeExports(node)
	return true
}

func (rule *typescriptConsistentTypeExportsRule) exportIsType(symbol *ast.Symbol, seen map[*ast.Symbol]bool) int {
	typeChecker := rule.context.GetChecker()
	if symbol == nil || typeChecker.IsUnknownSymbol(symbol) || seen[symbol] {
		return -1
	}
	seen[symbol] = true
	if slices.ContainsFunc(symbol.Declarations(), ast.IsTypeOnlyImportOrExportDeclaration) {
		return 1
	}
	if symbol.Flags()&ast.SymbolFlagsValue != 0 {
		return 0
	}
	if symbol.Flags()&ast.SymbolFlagsAlias != 0 {
		return rule.exportIsType(typeChecker.GetImmediateAliasedSymbol(symbol), seen)
	}
	return 1
}

func consistentTypeExportsWordList(words []string) string {
	if len(words) < 2 {
		return strings.Join(words, "")
	}
	if len(words) == 2 {
		return words[0] + " and " + words[1]
	}
	return strings.Join(words[:len(words)-1], ", ") + " and " + words[len(words)-1]
}

func (rule *typescriptConsistentTypeExportsRule) exportSpecifierText(node *ast.Node) string {
	specifier := node.AsExportSpecifier()
	if specifier.PropertyName == nil || helpers.SemanticSourceText(rule.context,

		specifier.PropertyName) == helpers.SemanticSourceText(rule.context,

		node.Name()) {
		return helpers.SemanticSourceText(rule.context,

			node.Name())
	}
	return helpers.SemanticSourceText(rule.context,

		specifier.PropertyName) + " as " + helpers.SemanticSourceText(rule.context,

		node.Name())
}

func (rule *typescriptConsistentTypeExportsRule) typeExports(node *ast.Node) {
	if node.Kind != ast.KindExportDeclaration {
		return
	}
	export := node.AsExportDeclaration()
	if export.IsTypeOnly {
		return
	}
	typeChecker := rule.context.GetChecker()
	if export.ExportClause == nil || export.ExportClause.Kind == ast.KindNamespaceExport {
		if export.ModuleSpecifier == nil {
			return
		}
		symbol := typeChecker.GetSymbolAtLocation(export.ModuleSpecifier)
		if symbol == nil || typeChecker.IsUnknownSymbol(symbol) {
			return
		}
		moduleType := typeChecker.GetTypeOfSymbol(symbol)
		for _, property := range typeChecker.GetPropertiesOfType(moduleType) {
			if typeChecker.GetPropertyOfType(moduleType, property.Name()) != nil {
				return
			}
		}
		diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.All_exports_in_the_declaration_are_only_used_as_types_Use_export_type)
		scan := scanner.NewScanner()
		scan.SetText(rule.context.File.Text())
		scan.SetSkipTrivia(true)
		scan.ResetPos(scanner.GetTokenPosOfNode(node, rule.context.File, false))
		for token := scan.Scan(); token != ast.KindAsteriskToken && token != ast.KindEndOfFile; token = scan.Scan() {
		}
		if scan.Token() == ast.KindEndOfFile {
			return
		}
		tracker := rule.context.NewTracker()
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(scan.TokenStart(), scan.TokenStart()), "type ")
		name := "@typescript-eslint/consistent-type-exports"
		diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Use_type_exports), name, ast.NewCompilerDiagnostic(diagnostics.Use_type_exports)))
		return
	}
	specifiers := export.ExportClause.AsNamedExports().Elements.Nodes
	var types, inline, values []*ast.Node
	for _, specifier := range specifiers {
		if specifier.AsExportSpecifier().IsTypeOnly {
			inline = append(inline, specifier)
			continue
		}
		switch rule.exportIsType(typeChecker.GetSymbolAtLocation(specifier.Name()), map[*ast.Symbol]bool{}) {
		case 1:
			types = append(types, specifier)
		case 0:
			values = append(values, specifier)
		}
	}
	if len(types) == 0 {
		return
	}
	message := diagnostics.All_exports_in_the_declaration_are_only_used_as_types_Use_export_type
	var arguments []any
	if len(values) > 0 {
		names := make([]string, len(types))
		for index, specifier := range types {
			local := specifier.AsExportSpecifier().PropertyName
			if local == nil {
				local = specifier.Name()
			}
			names[index] = local.Text()
		}
		if len(types) == 1 {
			message = diagnostics.Type_export_0_is_not_a_value_and_should_be_exported_using_export_type
		} else {
			message = diagnostics.Type_exports_0_are_not_values_and_should_be_exported_using_export_type
		}
		arguments = []any{consistentTypeExportsWordList(names)}
	}
	diagnostic := rule.context.Report(rule.context.Range(node), message, arguments...)
	tracker := rule.context.NewTracker()
	text := rule.context.File.Text()
	if len(values) == 0 {
		start := scanner.GetTokenPosOfNode(node, rule.context.File, false) + len("export")
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, start), " type")
		for _, specifier := range inline {
			start := scanner.GetTokenPosOfNode(specifier, rule.context.File, false)
			scan := scanner.NewScanner()
			scan.SetText(text)
			scan.SetSkipTrivia(false)
			scan.ResetPos(start + len("type"))
			for token := scan.Scan(); token == ast.KindWhitespaceTrivia || token == ast.KindNewLineTrivia; token = scan.Scan() {
			}
			tracker.DeleteRange(rule.context.File, core.NewTextRange(start, scan.TokenStart()))
		}
	} else if helpers.SemanticRuleOptions(rule.context.Options)["fixMixedExportsWithInlineTypeSpecifier"] == true {
		for _, specifier := range types {
			position := scanner.GetTokenPosOfNode(specifier, rule.context.File, false)
			tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(position, position), "type ")
		}
	} else {
		typeSpecifiers := append(append([]*ast.Node{}, types...), inline...)
		typeTexts, valueTexts := make([]string, len(typeSpecifiers)), make([]string, len(values))
		for index, specifier := range typeSpecifiers {
			typeTexts[index] = rule.exportSpecifierText(specifier)
		}
		for index, specifier := range values {
			valueTexts[index] = rule.exportSpecifierText(specifier)
		}
		open := scanner.GetTokenPosOfNode(export.ExportClause, rule.context.File, false) + 1
		closePosition := export.ExportClause.End() - 1
		if strings.Contains(text[open:closePosition], "/*") || strings.Contains(text[open:closePosition], "//") {
			attached := map[*ast.Node]string{}
			previous := open
			for _, specifier := range specifiers {
				prefix := text[previous:scanner.GetTokenPosOfNode(specifier, rule.context.File, false)]
				prefix = strings.TrimPrefix(strings.TrimSpace(prefix), ",")
				value := helpers.SemanticSourceText(rule.context,

					specifier)
				if specifier.AsExportSpecifier().IsTypeOnly {
					value = strings.TrimSpace(strings.TrimPrefix(value, "type"))
				}
				attached[specifier] = strings.TrimSpace(prefix + " " + value)
				previous = specifier.End()
			}
			for index, specifier := range typeSpecifiers {
				typeTexts[index] = attached[specifier]
			}
			for index, specifier := range values {
				valueTexts[index] = attached[specifier]
			}
			suffix := strings.TrimSpace(strings.TrimPrefix(strings.TrimSpace(text[previous:closePosition]), ","))
			if suffix != "" {
				valueTexts[len(valueTexts)-1] += " " + suffix + "\n"
			}
		}
		source := ""
		if export.ModuleSpecifier != nil && export.ModuleSpecifier.Text() != "" {
			source = " from '" + strings.ReplaceAll(export.ModuleSpecifier.Text(), "'", "\\'") + "'"
		}
		start := scanner.GetTokenPosOfNode(node, rule.context.File, false)
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, start), "export type { "+strings.Join(typeTexts, ", ")+" }"+source+";\n")
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(open, closePosition), " "+strings.Join(valueTexts, ", ")+" ")
	}
	name := "@typescript-eslint/consistent-type-exports"
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Use_type_exports), name, ast.NewCompilerDiagnostic(diagnostics.Use_type_exports)))
}
