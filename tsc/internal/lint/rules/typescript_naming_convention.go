package rules

import (
	"cmp"
	"slices"
	"strings"
	"unicode"
	"unicode/utf8"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/regex"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

type typescriptNamingConventionRule struct {
	context Context
	naming  []namingConventionConfig
	scope   *helpers.TsScopeModel
	helpers.DiagnosticSuggestions
}

func newTypeScriptNamingConventionRule(context Context) Rule {
	rule := &typescriptNamingConventionRule{context: context}
	options := context.Options
	if len(options) == 0 {
		options = []any{
			map[string]any{"selector": "default", "format": []any{"camelCase"}, "leadingUnderscore": "allow", "trailingUnderscore": "allow"},
			map[string]any{"selector": "import", "format": []any{"camelCase", "PascalCase"}},
			map[string]any{"selector": "variable", "format": []any{"camelCase", "UPPER_CASE"}, "leadingUnderscore": "allow", "trailingUnderscore": "allow"},
			map[string]any{"selector": "typeLike", "format": []any{"PascalCase"}},
		}
	}
	for _, option := range options {
		object, ok := option.(map[string]any)
		if !ok {
			continue
		}
		config := namingConventionConfig{options: object, filterMatch: true}
		for _, modifier := range helpers.SemanticOptionStrings(object["modifiers"]) {
			config.modifiers |= namingConventionModifiers[modifier]
		}
		config.weight = config.modifiers
		for _, modifier := range helpers.SemanticOptionStrings(object["types"]) {
			config.weight |= map[string]int{"boolean": 1 << 17, "string": 1 << 18, "number": 1 << 19, "function": 1 << 20, "array": 1 << 21}[modifier]
		}
		if object["filter"] != nil {
			pattern, _ := object["filter"].(string)
			if filter, ok := object["filter"].(map[string]any); ok {
				pattern, _ = filter["regex"].(string)
				config.filterMatch, _ = filter["match"].(bool)
			}
			config.filter = regex.Compile(pattern)
			config.weight |= 1 << 30
		}
		if custom, ok := object["custom"].(map[string]any); ok {
			pattern, _ := custom["regex"].(string)
			config.custom = regex.Compile(pattern)
			config.customMatch, _ = custom["match"].(bool)
		}
		selectors := helpers.SemanticOptionStrings(object["selector"])
		if selector, ok := object["selector"].(string); ok {
			selectors = []string{selector}
		}
		for _, selector := range selectors {
			entry := config
			entry.selector = namingConventionSelectors[selector]
			entry.meta = entry.selector == -1 || entry.selector&(entry.selector-1) != 0
			entry.methodProperty = selector == "method" || selector == "property"
			rule.naming = append(rule.naming, entry)
		}
	}

	return Rule{
		Enter: rule.OnEnterNode,
		EnterKinds: []ast.Kind{
			ast.KindClassDeclaration,
			ast.KindClassExpression,
			ast.KindEnumDeclaration,
			ast.KindEnumMember,
			ast.KindFunctionDeclaration,
			ast.KindFunctionExpression,
			ast.KindGetAccessor,
			ast.KindImportClause,
			ast.KindImportSpecifier,
			ast.KindInterfaceDeclaration,
			ast.KindMethodDeclaration,
			ast.KindMethodSignature,
			ast.KindNamespaceImport,
			ast.KindParameter,
			ast.KindPropertyAssignment,
			ast.KindPropertyDeclaration,
			ast.KindPropertySignature,
			ast.KindSetAccessor,
			ast.KindShorthandPropertyAssignment,
			ast.KindSourceFile,
			ast.KindTypeAliasDeclaration,
			ast.KindTypeParameter,
			ast.KindVariableDeclaration,
		},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptNamingConventionRule) OnEnterNode(node *ast.Node) bool {
	rule.namingConvention(node)
	return true
}

var namingConventionSelectors = map[string]int{
	"variable": 1 << 0, "function": 1 << 1, "parameter": 1 << 2,
	"parameterProperty": 1 << 3, "classicAccessor": 1 << 4, "enumMember": 1 << 5,
	"classMethod": 1 << 6, "objectLiteralMethod": 1 << 7, "typeMethod": 1 << 8,
	"classProperty": 1 << 9, "objectLiteralProperty": 1 << 10, "typeProperty": 1 << 11, "autoAccessor": 1 << 12,
	"class": 1 << 13, "interface": 1 << 14, "typeAlias": 1 << 15, "enum": 1 << 16, "typeParameter": 1 << 17, "import": 1 << 18,
	"default":      -1,
	"variableLike": 1<<0 | 1<<1 | 1<<2,
	"memberLike":   1<<3 | 1<<4 | 1<<5 | 1<<6 | 1<<7 | 1<<8 | 1<<9 | 1<<10 | 1<<11 | 1<<12,
	"typeLike":     1<<13 | 1<<14 | 1<<15 | 1<<16 | 1<<17,
	"method":       1<<6 | 1<<7 | 1<<8,
	"property":     1<<9 | 1<<10 | 1<<11,
	"accessor":     1<<4 | 1<<12,
}

var namingConventionModifiers = map[string]int{
	"const": 1 << 0, "readonly": 1 << 1, "static": 1 << 2, "public": 1 << 3, "protected": 1 << 4, "private": 1 << 5, "#private": 1 << 6,
	"abstract": 1 << 7, "destructured": 1 << 8, "global": 1 << 9, "exported": 1 << 10, "unused": 1 << 11, "requiresQuotes": 1 << 12,
	"override": 1 << 13, "async": 1 << 14, "default": 1 << 15, "namespace": 1 << 16,
}

type namingConventionConfig struct {
	selector, weight, modifiers int
	meta, methodProperty        bool
	options                     map[string]any
	filter, custom              *regex.Pattern
	filterMatch, customMatch    bool
}

func namingConventionCase(value string, upper bool) string {
	if upper {
		return cases.Upper(language.Und).String(value)
	}
	return cases.Lower(language.Und).String(value)
}

func namingConventionFormat(name, format string) bool {
	if name == "" {
		return true
	}
	first, width := utf8.DecodeRuneInString(name)
	firstText := string(first)
	if first > 0xffff {
		firstText = ""
	}
	switch format {
	case "camelCase", "strictCamelCase":
		if firstText != namingConventionCase(firstText, false) {
			return false
		}
	case "PascalCase", "StrictPascalCase":
		if firstText != namingConventionCase(firstText, true) {
			return false
		}
	case "snake_case", "UPPER_CASE":
		return name == namingConventionCase(name, format == "UPPER_CASE") && !strings.HasPrefix(name, "_") && !strings.HasSuffix(name, "_") && !strings.Contains(name, "__")
	default:
		return false
	}
	if strings.Contains(name, "_") {
		return false
	}
	if format != "strictCamelCase" && format != "StrictPascalCase" {
		return true
	}
	upper := format == "StrictPascalCase"
	for _, character := range name[width:] {
		text := string(character)
		isUpper := text == namingConventionCase(text, true) && text != namingConventionCase(text, false)
		if upper == isUpper {
			if upper {
				return false
			}
		} else {
			upper = !upper
		}
	}
	return true
}

func (rule *typescriptNamingConventionRule) namingCorrectType(node *ast.Node, selector string, config namingConventionConfig) bool {
	configured, exists := config.options["types"]
	if !exists || configured == nil {
		return true
	}
	if !slices.Contains([]string{"variable", "parameter", "classProperty", "objectLiteralProperty", "typeProperty", "parameterProperty", "classicAccessor"}, selector) {
		return true
	}
	typeChecker := rule.context.GetChecker()
	value := typeChecker.GetNonNullableType(typeChecker.GetTypeAtLocation(node))
	if value == nil {
		return false
	}
	for _, allowed := range helpers.SemanticOptionStrings(configured) {
		parts := []*checker.Type{value}
		if value.Flags()&checker.TypeFlagsUnion != 0 {
			parts = value.Types()
		}
		all := true
		for _, part := range parts {
			matches := false
			switch allowed {
			case "array":
				matches = typeChecker.IsArrayType(part) || checker.IsTupleType(part)
			case "function":
				matches = len(typeChecker.GetSignaturesOfType(part, checker.SignatureKindCall)) > 0
			case "boolean":
				matches = part.Flags()&checker.TypeFlagsBooleanLike != 0
			case "string":
				matches = part.Flags()&checker.TypeFlagsStringLike != 0
			case "number":
				matches = part.Flags()&checker.TypeFlagsNumberLike != 0
			}
			if !matches {
				all = false
				break
			}
		}
		if all {
			return true
		}
	}
	return false
}

func namingConventionLabel(selector string) string {
	var result strings.Builder
	for index, character := range selector {
		if index == 0 {
			result.WriteRune(unicode.ToUpper(character))
		} else {
			if unicode.IsUpper(character) {
				result.WriteByte(' ')
			}
			result.WriteRune(character)
		}
	}
	return result.String()
}

func (rule *typescriptNamingConventionRule) validateName(node *ast.Node, selector string, modifiers int) {
	if node == nil {
		return
	}
	name := node.Text()
	if node.Kind == ast.KindPrivateIdentifier {
		name = strings.TrimPrefix(name, "#")
	}
	if node.Kind != ast.KindIdentifier && node.Kind != ast.KindPrivateIdentifier && node.Kind != ast.KindStringLiteral && node.Kind != ast.KindNumericLiteral {
		name = "undefined"
	}
	var configs []namingConventionConfig
	for _, config := range rule.naming {
		if config.selector&namingConventionSelectors[selector] != 0 || config.selector == -1 {
			configs = append(configs, config)
		}
	}
	slices.SortStableFunc(configs, func(left, right namingConventionConfig) int {
		if left.selector == right.selector {
			return cmp.Compare(right.weight, left.weight)
		}
		if left.meta != right.meta {
			if left.meta {
				return 1
			}
			return -1
		}
		if left.methodProperty != right.methodProperty {
			if left.methodProperty {
				return -1
			}
			return 1
		}
		return cmp.Compare(right.selector, left.selector)
	})
	label := namingConventionLabel(selector)
	for _, config := range configs {
		if config.filter != nil && config.filter.MatchString(name) != config.filterMatch || modifiers&config.modifiers != config.modifiers || !rule.namingCorrectType(node, selector, config) {
			continue
		}
		processed := name
		for _, position := range []string{"leading", "trailing"} {
			option, _ := config.options[position+"Underscore"].(string)
			count := 0
			if position == "leading" {
				count = len(processed) - len(strings.TrimLeft(processed, "_"))
			} else {
				count = len(processed) - len(strings.TrimRight(processed, "_"))
			}
			trim := 0
			switch option {
			case "allow":
				if count > 0 {
					trim = 1
				}
			case "allowDouble":
				if count > 1 {
					trim = 2
				}
			case "allowSingleOrDouble":
				trim = min(count, 2)
			case "forbid":
				if count > 0 {
					rule.namingReport(node, selector, diagnostics.X_0_name_1_must_not_have_a_2_underscore, label, name, position)
					return
				}
			case "require", "requireDouble":
				required, word := 1, "one"
				if option == "requireDouble" {
					required, word = 2, "two"
				}
				if count < required {
					rule.namingReport(node, selector, diagnostics.X_0_name_1_must_have_2_3_underscore_s, label, name, word, position)
					return
				}
				trim = required
			}
			if position == "leading" {
				processed = processed[trim:]
			} else {
				processed = processed[:len(processed)-trim]
			}
		}
		for _, position := range []string{"prefix", "suffix"} {
			affixes := helpers.SemanticOptionStrings(config.options[position])
			if len(affixes) == 0 {
				continue
			}
			found := false
			for _, affix := range affixes {
				if position == "prefix" && strings.HasPrefix(processed, affix) {
					processed = processed[len(affix):]
					found = true
					break
				}
				if position == "suffix" && strings.HasSuffix(processed, affix) {
					if affix == "" {
						processed = ""
					} else {
						processed = processed[:len(processed)-len(affix)]
					}
					found = true
					break
				}
			}
			if !found {
				rule.namingReport(node, selector, diagnostics.X_0_name_1_must_have_one_of_the_following_2_es_Colon_3, label, name, position, strings.Join(affixes, ", "))
				return
			}
		}
		if config.custom != nil && config.custom.MatchString(processed) != config.customMatch {
			custom := config.options["custom"].(map[string]any)
			pattern, _ := custom["regex"].(string)
			if pattern == "" {
				pattern = "(?:)"
			}
			pattern = strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(pattern, "/", `\/`), "\n", `\n`), "\r", `\r`), "\u2028", `\u2028`)
			match := "not match"
			if config.customMatch {
				match = "match"
			}
			rule.namingReport(node, selector, diagnostics.X_0_name_1_must_2_the_RegExp_Colon_3, label, name, match, "/"+pattern+"/u")
			return
		}
		formats := helpers.SemanticOptionStrings(config.options["format"])
		if len(formats) == 0 {
			return
		}
		if modifiers&namingConventionModifiers["requiresQuotes"] == 0 {
			for _, format := range formats {
				if namingConventionFormat(processed, format) {
					return
				}
			}
		}
		if processed == name {
			rule.namingReport(node, selector, diagnostics.X_0_name_1_must_match_one_of_the_following_formats_Colon_2, label, name, strings.Join(formats, ", "))
		} else {
			rule.namingReport(node, selector, diagnostics.X_0_name_1_trimmed_as_2_must_match_one_of_the_following_formats_Colon_3, label, name, processed, strings.Join(formats, ", "))
		}
		return
	}
}

func (rule *typescriptNamingConventionRule) namingReport(node *ast.Node, selector string, message *diagnostics.Message, arguments ...any) {
	diagnosticLocation := rule.context.Range(node)
	if selector == "parameter" && node.Parent.Kind == ast.KindParameter && node.Parent.Name() == node {
		parameter := node.Parent
		end := node.End()
		if parameter.QuestionToken() != nil {
			end = parameter.QuestionToken().End()
		}
		if parameter.Type() != nil && parameter.AsParameterDeclaration().DotDotDotToken == nil {
			end = parameter.Type().End()
		}
		diagnosticLocation = core.NewTextRange(scanner.GetTokenPosOfNode(node, rule.context.File, false), end)
	}
	rule.context.Report(diagnosticLocation, message, arguments...)
}

func namingConventionMemberModifiers(node *ast.Node) int {
	modifiers := namingConventionModifiers[helpers.SemanticMemberAccessibility(node)]
	for flag, name := range map[ast.ModifierFlags]string{ast.ModifierFlagsStatic: "static", ast.ModifierFlagsReadonly: "readonly", ast.ModifierFlagsOverride: "override", ast.ModifierFlagsAbstract: "abstract"} {
		if node.ModifierFlags()&flag != 0 {
			modifiers |= namingConventionModifiers[name]
		}
	}
	return modifiers
}

func (rule *typescriptNamingConventionRule) namingMember(node *ast.Node, selector string, modifiers int) {
	name := node.Name()
	if name == nil {
		return
	}
	if name.Kind == ast.KindComputedPropertyName {
		if selector != "autoAccessor" {
			return
		}
		name = name.AsComputedPropertyName().Expression
	}
	text := name.Text()
	if name.Kind == ast.KindPrivateIdentifier {
		text = strings.TrimPrefix(text, "#")
	}
	target := core.ScriptTargetESNext
	if rule.context.CompilerOptions != nil {
		target = rule.context.CompilerOptions.GetEmitScriptTarget()
	}
	quoted := text == ""
	for index, character := range text {
		if target < core.ScriptTargetES2015 && character > 0xffff {
			quoted = true
		}
		if index == 0 {
			quoted = quoted || !scanner.IsIdentifierStart(character)
		} else {
			quoted = quoted || !scanner.IsIdentifierPart(character)
		}
	}
	if quoted {
		modifiers |= namingConventionModifiers["requiresQuotes"]
	}
	rule.validateName(name, selector, modifiers)
}

func (rule *typescriptNamingConventionRule) namingBindingModifiers(name, root *ast.Node) int {
	modifiers := 0
	binding := rule.scope.Decls[name]
	if binding == nil {
		return modifiers
	}
	exported := ast.GetCombinedModifierFlags(root)&ast.ModifierFlagsExport != 0
	used := exported
	for _, reference := range binding.References {
		if reference.Node.Parent.Kind == ast.KindExportSpecifier || reference.Node.Parent.Kind == ast.KindExportAssignment {
			exported = true
			used = true
		}
		if reference.Write || ast.IsWriteOnlyAccess(reference.Node) {
			continue
		}
		self := false
		for ancestor := reference.Node.Parent; ancestor != nil; ancestor = ancestor.Parent {
			if ancestor == root && (root.Kind == ast.KindFunctionDeclaration || root.Kind == ast.KindFunctionExpression || root.Kind == ast.KindClassDeclaration || root.Kind == ast.KindClassExpression || root.Kind == ast.KindInterfaceDeclaration || root.Kind == ast.KindTypeAliasDeclaration) {
				self = true
				break
			}
		}
		if !self {
			used = true
		}
	}
	if root.Kind == ast.KindParameter {
		parent := root.Parent
		used = used || parent.Kind == ast.KindSetAccessor || parent.Body() == nil || root.ModifierFlags()&ast.ModifierFlagsParameterPropertyModifier != 0 || name.Text() == "this"
	}
	if exported {
		modifiers |= namingConventionModifiers["exported"]
	}
	if !used {
		modifiers |= namingConventionModifiers["unused"]
	}
	return modifiers
}

func namingConventionGlobal(node *ast.Node) bool {
	for current := node.Parent; current != nil; current = current.Parent {
		if current.Kind == ast.KindSourceFile {
			return true
		}
		if current.Kind == ast.KindBlock || current.Kind == ast.KindModuleBlock || ast.IsFunctionLike(current) || ast.IsClassLike(current) || current.Kind == ast.KindForStatement || current.Kind == ast.KindForInStatement || current.Kind == ast.KindForOfStatement {
			return false
		}
	}
	return false
}

func (rule *typescriptNamingConventionRule) namingPattern(pattern, root *ast.Node, selector string, base int) {
	if pattern == nil {
		return
	}
	if pattern.Kind == ast.KindObjectBindingPattern || pattern.Kind == ast.KindArrayBindingPattern {
		for _, element := range pattern.AsBindingPattern().Elements.Nodes {
			if element.Kind == ast.KindBindingElement {
				rule.namingPattern(element.Name(), root, selector, base)
			}
		}
		return
	}
	if pattern.Kind != ast.KindIdentifier {
		return
	}
	modifiers := base | rule.namingBindingModifiers(pattern, root)
	if selector == "parameter" {
		modifiers &^= namingConventionModifiers["exported"]
	}
	if pattern.Parent.Kind == ast.KindBindingElement && pattern.Parent.Parent.Kind == ast.KindObjectBindingPattern && pattern.Parent.AsBindingElement().PropertyName == nil && pattern.Parent.AsBindingElement().DotDotDotToken == nil {
		modifiers |= namingConventionModifiers["destructured"]
	}
	if pattern.Parent == root && root.Initializer() != nil && root.Initializer().ModifierFlags()&ast.ModifierFlagsAsync != 0 {
		modifiers |= namingConventionModifiers["async"]
	}
	rule.validateName(pattern, selector, modifiers)
}

func (rule *typescriptNamingConventionRule) namingConvention(node *ast.Node) {
	if node.Kind == ast.KindSourceFile {
		rule.scope = helpers.NewTScopeModel(rule.context)
		return
	}
	name := node.Name()
	switch node.Kind {
	case ast.KindVariableDeclaration:
		modifiers := 0
		if node.Parent.Kind == ast.KindCatchClause {
			return
		}
		if node.Parent.Kind == ast.KindVariableDeclarationList && node.Parent.Flags&ast.NodeFlagsConst != 0 {
			modifiers |= namingConventionModifiers["const"]
		}
		if namingConventionGlobal(node) {
			modifiers |= namingConventionModifiers["global"]
		}
		root := node
		if node.Parent.Kind == ast.KindVariableDeclarationList {
			root = node.Parent.Parent
		}
		rule.namingPattern(name, node, "variable", modifiers|rule.namingBindingModifiers(name, root))
	case ast.KindFunctionDeclaration, ast.KindFunctionExpression:
		if name == nil {
			return
		}
		modifiers := rule.namingBindingModifiers(name, node)
		if namingConventionGlobal(node) {
			modifiers |= namingConventionModifiers["global"]
		}
		if node.ModifierFlags()&ast.ModifierFlagsAsync != 0 {
			modifiers |= namingConventionModifiers["async"]
		}
		rule.validateName(name, "function", modifiers)
	case ast.KindClassDeclaration, ast.KindClassExpression, ast.KindInterfaceDeclaration, ast.KindTypeAliasDeclaration, ast.KindEnumDeclaration:
		if name == nil {
			return
		}
		selector := map[ast.Kind]string{ast.KindClassDeclaration: "class", ast.KindClassExpression: "class", ast.KindInterfaceDeclaration: "interface", ast.KindTypeAliasDeclaration: "typeAlias", ast.KindEnumDeclaration: "enum"}[node.Kind]
		modifiers := rule.namingBindingModifiers(name, node)
		if node.ModifierFlags()&ast.ModifierFlagsAbstract != 0 {
			modifiers |= namingConventionModifiers["abstract"]
		}
		rule.validateName(name, selector, modifiers)
	case ast.KindTypeParameter:
		if node.Parent.Kind == ast.KindInferType || node.Parent.Kind == ast.KindMappedType {
			return
		}
		rule.validateName(name, "typeParameter", rule.namingBindingModifiers(name, node))
	case ast.KindEnumMember:
		rule.namingMember(node, "enumMember", 0)
	case ast.KindParameter:
		switch node.Parent.Kind {
		case ast.KindFunctionDeclaration, ast.KindFunctionExpression, ast.KindArrowFunction, ast.KindMethodDeclaration, ast.KindConstructor, ast.KindGetAccessor, ast.KindSetAccessor:
			selector, modifiers := "parameter", 0
			if node.ModifierFlags()&ast.ModifierFlagsParameterPropertyModifier != 0 {
				selector, modifiers = "parameterProperty", namingConventionMemberModifiers(node)
			}
			rule.namingPattern(name, node, selector, modifiers)
		}
	case ast.KindImportClause:
		if name != nil {
			rule.validateName(name, "import", namingConventionModifiers["default"])
		}
	case ast.KindNamespaceImport:
		rule.validateName(name, "import", namingConventionModifiers["namespace"])
	case ast.KindImportSpecifier:
		imported := node.AsImportSpecifier().PropertyName
		if imported == nil {
			imported = name
		}
		if imported.Kind == ast.KindIdentifier && imported.Text() != "default" {
			return
		}
		rule.validateName(name, "import", namingConventionModifiers["default"])
	case ast.KindPropertyDeclaration:
		selector := "classProperty"
		modifiers := namingConventionMemberModifiers(node)
		if node.ModifierFlags()&ast.ModifierFlagsAccessor != 0 {
			selector = "autoAccessor"
		} else if initializer := node.Initializer(); initializer != nil && (initializer.Kind == ast.KindArrowFunction || initializer.Kind == ast.KindFunctionExpression) {
			selector = "classMethod"
			if initializer.ModifierFlags()&ast.ModifierFlagsAsync != 0 {
				modifiers |= namingConventionModifiers["async"]
			}
		}
		rule.namingMember(node, selector, modifiers)
	case ast.KindMethodDeclaration:
		selector, modifiers := "classMethod", namingConventionMemberModifiers(node)
		if node.Parent.Kind == ast.KindObjectLiteralExpression {
			selector, modifiers = "objectLiteralMethod", namingConventionModifiers["public"]
		}
		if node.ModifierFlags()&ast.ModifierFlagsAsync != 0 {
			modifiers |= namingConventionModifiers["async"]
		}
		rule.namingMember(node, selector, modifiers)
	case ast.KindGetAccessor, ast.KindSetAccessor:
		if node.Parent.Kind == ast.KindInterfaceDeclaration || node.Parent.Kind == ast.KindTypeLiteral {
			rule.namingMember(node, "typeMethod", namingConventionModifiers["public"])
			return
		}
		modifiers := namingConventionMemberModifiers(node)
		if node.Parent.Kind == ast.KindObjectLiteralExpression {
			modifiers = namingConventionModifiers["public"]
		}
		rule.namingMember(node, "classicAccessor", modifiers)
	case ast.KindMethodSignature:
		rule.namingMember(node, "typeMethod", namingConventionModifiers["public"])
	case ast.KindPropertySignature:
		selector, modifiers := "typeProperty", namingConventionModifiers["public"]
		if node.Type() != nil && node.Type().Kind == ast.KindFunctionType {
			selector = "typeMethod"
		} else if node.ModifierFlags()&ast.ModifierFlagsReadonly != 0 {
			modifiers |= namingConventionModifiers["readonly"]
		}
		rule.namingMember(node, selector, modifiers)
	case ast.KindPropertyAssignment, ast.KindShorthandPropertyAssignment:
		if ast.IsAssignmentTarget(node.Parent) {
			return
		}
		selector, modifiers := "objectLiteralProperty", namingConventionModifiers["public"]
		if node.Kind == ast.KindPropertyAssignment {
			if value := node.Initializer(); value != nil && (value.Kind == ast.KindArrowFunction || value.Kind == ast.KindFunctionExpression) {
				selector = "objectLiteralMethod"
				if value.ModifierFlags()&ast.ModifierFlagsAsync != 0 {
					modifiers |= namingConventionModifiers["async"]
				}
			}
		}
		rule.namingMember(node, selector, modifiers)
	}
}
