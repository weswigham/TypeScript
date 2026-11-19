package rules

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/importpatterns"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noRestrictedImports struct {
	context Context
	imports []restrictedImport
}

func newNoRestrictedImports(context Context) Rule {
	rule := &noRestrictedImports{context: context}
	paths := context.Options
	var patterns []any
	if len(paths) > 0 {
		if object, ok := paths[0].(map[string]any); ok {
			_, hasPaths := object["paths"]
			_, hasPatterns := object["patterns"]
			if hasPaths || hasPatterns {
				paths, _ = object["paths"].([]any)
				patterns, _ = object["patterns"].([]any)
			}
		}
	}
	for _, path := range paths {
		if name, ok := path.(string); ok {
			rule.imports = append(rule.imports, restrictedImport{name: name})
		} else if object, ok := path.(map[string]any); ok {
			entry := restrictedImportOption(object)
			entry.name, _ = object["name"].(string)
			rule.imports = append(rule.imports, entry)
		}
	}
	if len(patterns) > 0 {
		if _, ok := patterns[0].(string); ok {
			patterns = []any{map[string]any{"group": patterns}}
		}
	}
	for _, pattern := range patterns {
		object, _ := pattern.(map[string]any)
		entry := restrictedImportOption(object)
		entry.pattern = true
		sensitive, _ := object["caseSensitive"].(bool)
		if text, ok := object["regex"].(string); ok {
			flags := "u"
			if !sensitive {
				flags = "iu"
			}
			entry.matchPath = helpers.MustCompileRegexMatcher(text, flags)
		} else {
			matcher, err := importpatterns.Compile(restrictedImportStrings(object["group"]), sensitive)
			if err != nil {
				panic(err)
			}
			entry.matchPath = matcher.Match
		}
		rule.imports = append(rule.imports, entry)
	}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindExportDeclaration, ast.KindImportDeclaration, ast.KindImportEqualsDeclaration},
	}
}

func (rule *noRestrictedImports) OnEnterNode(node *ast.Node) bool {
	switch node.Kind {
	case ast.KindImportDeclaration, ast.KindExportDeclaration, ast.KindImportEqualsDeclaration:
		rule.checkImport(node)
	}
	return true
}

type restrictedImport struct {
	name, message                 string
	pattern                       bool
	allowType                     bool
	importNames, allowNames       []string
	hasImportNames, hasAllowNames bool
	namePattern, allowPattern     string
	matchName, matchAllowedName   func(string) bool
	matchPath                     func(string) bool
}

type restrictedImportMessage struct {
	plain, custom *diagnostics.Message
	parameters    []string
}

var restrictedImportMessages = map[string]restrictedImportMessage{
	"path":                 {diagnostics.X_0_import_is_restricted_from_being_used, diagnostics.X_0_import_is_restricted_from_being_used_1, []string{"importSource"}},
	"patterns":             {diagnostics.X_0_import_is_restricted_from_being_used_by_a_pattern, diagnostics.X_0_import_is_restricted_from_being_used_by_a_pattern_1, []string{"importSource"}},
	"importName":           {diagnostics.X_0_import_from_1_is_restricted, diagnostics.X_0_import_from_1_is_restricted_2, []string{"importName", "importSource"}},
	"patternAndImportName": {diagnostics.X_0_import_from_1_is_restricted_from_being_used_by_a_pattern, diagnostics.X_0_import_from_1_is_restricted_from_being_used_by_a_pattern_2, []string{"importName", "importSource"}},
	"everything":           {diagnostics.Asterisk_import_is_invalid_because_0_from_1_2_restricted, diagnostics.Asterisk_import_is_invalid_because_0_from_1_2_restricted_3, []string{"importNames", "importSource", "isOrAre"}},
	"patternAndEverything": {diagnostics.Asterisk_import_is_invalid_because_0_from_1_2_restricted_from_being_used_by_a_pattern, diagnostics.Asterisk_import_is_invalid_because_0_from_1_2_restricted_from_being_used_by_a_pattern_3, []string{"importNames", "importSource", "isOrAre"}},
	"patternAndEverythingWithRegexImportName": {diagnostics.Asterisk_import_is_invalid_because_import_name_matching_0_pattern_from_1_is_restricted_from_being_used, diagnostics.Asterisk_import_is_invalid_because_import_name_matching_0_pattern_from_1_is_restricted_from_being_used_2, []string{"importNames", "importSource"}},
	"allowedImportName":                       {diagnostics.X_0_import_from_1_is_restricted_because_only_2_3_allowed, diagnostics.X_0_import_from_1_is_restricted_because_only_2_3_allowed_4, []string{"importName", "importSource", "allowedImportNames", "isOrAre"}},
	"everythingWithAllowImportNames":          {diagnostics.Asterisk_import_is_invalid_because_only_0_from_1_2_allowed, diagnostics.Asterisk_import_is_invalid_because_only_0_from_1_2_allowed_3, []string{"allowedImportNames", "importSource", "isOrAre"}},
	"allowedImportNamePattern":                {diagnostics.X_0_import_from_1_is_restricted_because_only_imports_that_match_the_pattern_2_are_allowed_from_1, diagnostics.X_0_import_from_1_is_restricted_because_only_imports_that_match_the_pattern_2_are_allowed_from_1_3, []string{"importName", "importSource", "allowedImportNamePattern"}},
	"everythingWithAllowedImportNamePattern":  {diagnostics.Asterisk_import_is_invalid_because_only_imports_that_match_the_pattern_0_from_1_are_allowed, diagnostics.Asterisk_import_is_invalid_because_only_imports_that_match_the_pattern_0_from_1_are_allowed_2, []string{"allowedImportNamePattern", "importSource"}},
}

type restrictedImportSpecifier struct {
	name     string
	node     *ast.Node
	typeOnly bool
	star     bool
}

func restrictedImportStrings(value any) []string {
	if strings, ok := value.([]string); ok {
		return strings
	}
	values, _ := value.([]any)
	result := make([]string, 0, len(values))
	for _, value := range values {
		if text, ok := value.(string); ok {
			result = append(result, text)
		}
	}
	return result
}

func restrictedImportOption(options map[string]any) restrictedImport {
	entry := restrictedImport{}
	entry.message, _ = options["message"].(string)
	entry.allowType, _ = options["allowTypeImports"].(bool)
	_, entry.hasImportNames = options["importNames"]
	_, entry.hasAllowNames = options["allowImportNames"]
	entry.importNames = restrictedImportStrings(options["importNames"])
	entry.allowNames = restrictedImportStrings(options["allowImportNames"])
	entry.namePattern, _ = options["importNamePattern"].(string)
	entry.allowPattern, _ = options["allowImportNamePattern"].(string)
	if entry.namePattern != "" {
		entry.matchName = helpers.MustCompileRegexMatcher(entry.namePattern, "u")
	}
	if entry.allowPattern != "" {
		entry.matchAllowedName = helpers.MustCompileRegexMatcher(entry.allowPattern, "u")
	}
	return entry
}

func restrictedImportFormatNames(names []string) string {
	quoted := make([]string, len(names))
	for index, name := range names {
		quoted[index] = "'" + name + "'"
	}
	switch len(quoted) {
	case 0:
		return ""
	case 1:
		return quoted[0]
	case 2:
		return quoted[0] + " and " + quoted[1]
	default:
		return strings.Join(quoted[:len(quoted)-1], ", ") + ", and " + quoted[len(quoted)-1]
	}
}

func (rule *noRestrictedImports) checkImport(node *ast.Node) {
	var source *ast.Node
	var specifiers []restrictedImportSpecifier
	typeOnly := node.IsTypeOnly()
	switch node.Kind {
	case ast.KindImportDeclaration:
		declaration := node.AsImportDeclaration()
		source = declaration.ModuleSpecifier
		if clause := declaration.ImportClause; clause != nil {
			typeOnly = clause.IsTypeOnly()
			if clause.Name() != nil {
				specifiers = append(specifiers, restrictedImportSpecifier{name: "default", node: clause.Name()})
			}
			if bindings := clause.AsImportClause().NamedBindings; bindings != nil {
				if bindings.Kind == ast.KindNamespaceImport {
					specifiers = append(specifiers, restrictedImportSpecifier{name: "*", node: bindings})
				} else {
					for _, specifier := range bindings.Elements() {
						specifiers = append(specifiers, restrictedImportSpecifier{name: specifier.PropertyNameOrName().Text(), node: specifier, typeOnly: specifier.IsTypeOnly()})
					}
				}
			}
		}
	case ast.KindExportDeclaration:
		declaration := node.AsExportDeclaration()
		source = declaration.ModuleSpecifier
		if declaration.ExportClause == nil || declaration.ExportClause.Kind == ast.KindNamespaceExport {
			specifiers = append(specifiers, restrictedImportSpecifier{name: "*", node: node, star: true})
		} else {
			for _, specifier := range declaration.ExportClause.Elements() {
				specifiers = append(specifiers, restrictedImportSpecifier{name: specifier.PropertyNameOrName().Text(), node: specifier, typeOnly: specifier.IsTypeOnly()})
			}
		}
	case ast.KindImportEqualsDeclaration:
		reference := node.AsImportEqualsDeclaration().ModuleReference
		if reference.Kind != ast.KindExternalModuleReference {
			return
		}
		source = reference.Expression()
	}
	if source == nil || source.Kind != ast.KindStringLiteral {
		return
	}
	path := source.Text()
	if node.Kind != ast.KindImportEqualsDeclaration {
		path = strings.TrimFunc(path, helpers.TsCommentSpace)
	}
	if len(specifiers) > 0 && !typeOnly {
		typeOnly = true
		for _, specifier := range specifiers {
			if !specifier.typeOnly {
				typeOnly = false
				break
			}
		}
	}
	for _, entry := range rule.imports {
		if entry.pattern {
			if !entry.matchPath(path) {
				continue
			}
		} else if entry.name != path {
			continue
		}
		if entry.allowType && typeOnly {
			continue
		}
		if !entry.hasImportNames && !entry.hasAllowNames && entry.matchName == nil && entry.matchAllowedName == nil {
			id := "path"
			if entry.pattern {
				id = "patterns"
			}
			rule.importReport(node, nil, entry, id, map[string]any{"importSource": path})
			continue
		}
		for _, specifier := range specifiers {
			data := map[string]any{"importSource": path, "importName": specifier.name, "importNames": restrictedImportFormatNames(entry.importNames), "allowedImportNames": restrictedImportFormatNames(entry.allowNames), "allowedImportNamePattern": "/" + entry.allowPattern + "/u"}
			if specifier.name == "*" {
				id := "everything"
				names := entry.importNames
				switch {
				case entry.hasImportNames:
					if entry.pattern {
						id = "patternAndEverything"
					}
				case entry.hasAllowNames:
					id = "everythingWithAllowImportNames"
					names = entry.allowNames
				case entry.matchAllowedName != nil:
					id = "everythingWithAllowedImportNamePattern"
				default:
					id = "patternAndEverythingWithRegexImportName"
					data["importNames"] = "/" + entry.namePattern + "/u"
				}
				data["isOrAre"] = core.IfElse(len(names) == 1, "is", "are")
				rule.importReport(node, &specifier, entry, id, data)
				continue
			}
			if entry.allowType && specifier.typeOnly {
				continue
			}
			if entry.hasImportNames && slices.Contains(entry.importNames, specifier.name) || entry.matchName != nil && entry.matchName(specifier.name) {
				id := "importName"
				if entry.pattern {
					id = "patternAndImportName"
				}
				rule.importReport(node, &specifier, entry, id, data)
			}
			if entry.hasAllowNames && !slices.Contains(entry.allowNames, specifier.name) {
				data["isOrAre"] = core.IfElse(len(entry.allowNames) == 1, "is", "are")
				rule.importReport(node, &specifier, entry, "allowedImportName", data)
			} else if entry.matchAllowedName != nil && !entry.matchAllowedName(specifier.name) {
				rule.importReport(node, &specifier, entry, "allowedImportNamePattern", data)
			}
		}
	}
}

func (rule *noRestrictedImports) importReport(node *ast.Node, specifier *restrictedImportSpecifier, entry restrictedImport, id string, data map[string]any) {
	definition := restrictedImportMessages[id]
	message := definition.plain
	args := make([]any, 0, len(definition.parameters)+1)
	for _, name := range definition.parameters {
		args = append(args, data[name])
	}
	if entry.message != "" {
		message = definition.custom
		args = append(args, entry.message)
	}
	diagnosticLocation := rule.context.Range(node)
	if specifier != nil {
		start, end := scanner.GetTokenPosOfNode(specifier.node, rule.context.File, false), specifier.node.End()
		if specifier.star {
			tokenScanner := scanner.GetScannerForSourceFile(rule.context.File, start)
			for token := tokenScanner.Scan(); token != ast.KindEndOfFile; token = tokenScanner.Scan() {
				if token == ast.KindAsteriskToken {
					start, end = tokenScanner.TokenStart(), tokenScanner.TokenEnd()
					break
				}
			}
		}
		diagnosticLocation = core.NewTextRange(start, end)
	}
	rule.context.Report(diagnosticLocation, message, args...)
}
