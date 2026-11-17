package rules

import (
	"cmp"
	"slices"
	"strings"
	"unicode"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type objectShorthandRule struct {
	context Context
}

func (rule *objectShorthandRule) OnEnterNode(node *ast.Node) bool {
	rule.objectShorthand(node)

	return true
}

func (rule *objectShorthandRule) OnExitNode(node *ast.Node) {}

func (rule *objectShorthandRule) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return nil
}

func (rule *objectShorthandRule) fix(report *ast.Diagnostic, tracker *change.Tracker) {
	changes := tracker.GetTextChanges()
	for index := range changes {
		edits := changes[index].TextChanges
		if len(edits) < 2 {
			continue
		}
		slices.SortStableFunc(edits, func(left, right core.TextChange) int {
			if order := cmp.Compare(left.Pos(), right.Pos()); order != 0 {
				return order
			}
			return cmp.Compare(left.End(), right.End())
		})
		start, end := edits[0].Pos(), edits[0].Pos()
		var text strings.Builder
		for _, edit := range edits {
			if edit.Pos() < end {
				return
			}
			text.WriteString(rule.context.File.Text()[end:edit.Pos()])
			text.WriteString(edit.NewText)
			end = edit.End()
		}
		changes[index].TextChanges = []core.TextChange{{TextRange: core.NewTextRange(start, end), NewText: text.String()}}
	}
	report.SetCodeFixes(codefix.CreateCodeFixAction("object-shorthand", changes, ast.NewCompilerDiagnostic(diagnostics.Fix_0, "object-shorthand"), "object-shorthand", ast.NewCompilerDiagnostic(diagnostics.Fix_0, "object-shorthand")))
}

func (rule *objectShorthandRule) lexical(function *ast.Node, kind ast.Kind) bool {
	found := false
	var visit func(*ast.Node)
	visit = func(node *ast.Node) {
		if node == nil || found {
			return
		}
		if node != function && ast.IsFunctionLike(node) && node.Kind != ast.KindArrowFunction {
			if node.Name() != nil && node.Name().Kind == ast.KindComputedPropertyName {
				visit(node.Name())
			}
			return
		}
		if node.Kind == ast.KindClassStaticBlockDeclaration || node.Kind == ast.KindPropertyDeclaration {
			if node.Name() != nil && node.Name().Kind == ast.KindComputedPropertyName {
				visit(node.Name())
			}
			return
		}
		if node.Kind == kind || kind == ast.KindUnknown && (node.Kind == ast.KindThisKeyword || node.Kind == ast.KindSuperKeyword || node.Kind == ast.KindMetaProperty) {
			if node.Kind != ast.KindMetaProperty || strings.HasPrefix(rule.Text(node), "new") {
				found = true
			}
		}
		if kind == ast.KindUnknown && node.Kind == ast.KindIdentifier && node.Text() == "arguments" && helpers.DeclarationReference(node) {
			found = true
		}
		node.ForEachChild(func(child *ast.Node) bool { visit(child); return false })
	}
	visit(function)
	return found
}

func (rule *objectShorthandRule) objectShorthand(node *ast.Node) {
	mode := "always"
	if len(rule.context.Options) > 0 {
		if value, ok := rule.context.Options[0].(string); ok {
			mode = value
		}
	}
	if node.Kind == ast.KindObjectLiteralExpression && (mode == "consistent" || mode == "consistent-as-needed") {
		count, short := 0, 0
		redundant := true
		for _, property := range node.AsObjectLiteralExpression().Properties.Nodes {
			if property.Kind != ast.KindPropertyAssignment && property.Kind != ast.KindMethodDeclaration && property.Kind != ast.KindShorthandPropertyAssignment {
				continue
			}
			count++
			if property.Kind == ast.KindMethodDeclaration || property.Kind == ast.KindShorthandPropertyAssignment {
				short++
				continue
			}
			value := ast.SkipParentheses(property.Initializer())
			if helpers.DeclarationProperty(property.Name()) == "__proto__" && property.Name().Kind != ast.KindComputedPropertyName || !(value.Kind == ast.KindFunctionExpression && value.Name() == nil || value.Kind == ast.KindIdentifier && helpers.DeclarationProperty(property.Name()) == value.Text()) {
				redundant = false
			}
		}
		if short > 0 && short < count {
			rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_mix_of_shorthand_and_non_shorthand_properties)
		} else if count > 0 && short == 0 && redundant && mode == "consistent-as-needed" {
			rule.context.Report(rule.context.Range(node), diagnostics.Expected_shorthand_for_all_properties)
		}
		return
	}
	if node.Parent == nil || node.Parent.Kind != ast.KindObjectLiteralExpression || node.Name() == nil {
		return
	}
	name := node.Name()
	static := helpers.DeclarationProperty(name)
	if static == "__proto__" && name.Kind != ast.KindComputedPropertyName {
		return
	}
	quoted := name.Kind == ast.KindStringLiteral || name.Kind == ast.KindComputedPropertyName && ast.SkipParentheses(name.AsComputedPropertyName().Expression).Kind == ast.KindStringLiteral
	options := rule.option(1)
	if node.Kind == ast.KindShorthandPropertyAssignment {
		if mode == "never" {
			report := rule.context.Report(rule.context.Range(node), diagnostics.Expected_longform_property_syntax)
			if rule.context.NewTracker != nil {
				tracker := rule.context.NewTracker()
				rule.replace(tracker, name.End(), name.End(), ": "+name.Text())
				rule.fix(report, tracker)
			}
		}
		return
	}
	if node.Kind == ast.KindMethodDeclaration {
		if mode != "never" && !(quoted && helpers.DeclarationBool(options, "avoidQuotes", false)) {
			return
		}
		if rule.lexical(node, ast.KindSuperKeyword) {
			return
		}
		message := diagnostics.Expected_longform_method_syntax
		if mode != "never" {
			message = diagnostics.Expected_longform_method_syntax_for_string_literal_keys
		}
		report := rule.context.Report(rule.context.Range(node), message)
		if rule.context.NewTracker != nil {
			prefix := "function"
			if ast.GetCombinedModifierFlags(node)&ast.ModifierFlagsAsync != 0 {
				prefix = "async " + prefix
			}
			if node.AsMethodDeclaration().AsteriskToken != nil {
				prefix += "*"
			}
			tracker := rule.context.NewTracker()
			rule.replace(tracker, rule.Start(node), name.End(), rule.Text(name)+": "+prefix)
			rule.fix(report, tracker)
		}
		return
	}
	if node.Kind != ast.KindPropertyAssignment {
		return
	}
	value := ast.SkipParentheses(node.Initializer())
	if value.Kind == ast.KindFunctionExpression || value.Kind == ast.KindArrowFunction {
		if mode != "always" && mode != "methods" || value.Name() != nil {
			return
		}
		if quoted && helpers.DeclarationBool(options, "avoidQuotes", false) {
			return
		}
		if helpers.DeclarationBool(options, "ignoreConstructors", false) {
			for _, character := range static {
				if character == '_' || character == '$' || character >= '0' && character <= '9' {
					continue
				}
				if unicode.IsLetter(character) && unicode.IsUpper(character) {
					return
				}
				break
			}
		}
		if pattern, ok := options["methodsIgnorePattern"].(string); ok && static != "" {
			if helpers.MatchesRegularExpression(pattern, static) {
				return
			}
		}
		if value.Kind == ast.KindArrowFunction && (!helpers.DeclarationBool(options, "avoidExplicitReturnArrows", false) || value.Body().Kind != ast.KindBlock || rule.lexical(value, ast.KindUnknown)) {
			return
		}
		report := rule.context.Report(rule.context.Range(node), diagnostics.Expected_method_shorthand)
		if rule.context.NewTracker == nil || helpers.DeclarationComment(rule.context.File.Text()[name.End():rule.Start(value)]) {
			return
		}
		prefix := ""
		if ast.GetCombinedModifierFlags(value)&ast.ModifierFlagsAsync != 0 {
			prefix = "async "
		}
		start := rule.Start(value)
		if value.Kind == ast.KindFunctionExpression {
			if value.AsFunctionExpression().AsteriskToken != nil {
				prefix += "*"
			}
			for _, token := range rule.tokens(start, rule.Start(value.Body())) {
				if token.Kind == ast.KindFunctionKeyword {
					start = token.End
					if value.AsFunctionExpression().AsteriskToken != nil {
						continue
					}
					break
				}
				if token.Kind == ast.KindAsteriskToken {
					start = token.End
					break
				}
			}
			tracker := rule.context.NewTracker()
			rule.replace(tracker, rule.Start(node), node.End(), prefix+rule.Text(name)+rule.context.File.Text()[start:value.End()])
			rule.fix(report, tracker)
		} else {
			arrow := value.AsArrowFunction().EqualsGreaterThanToken
			if ast.GetCombinedModifierFlags(value)&ast.ModifierFlagsAsync != 0 {
				for _, token := range rule.tokens(start, rule.Start(arrow)) {
					if token.Kind == ast.KindAsyncKeyword {
						start = token.End
						break
					}
				}
			}
			parameters := strings.TrimSpace(rule.context.File.Text()[start:rule.Start(arrow)])
			if len(value.Parameters()) == 1 && rule.Start(value.Parameters()[0]) == start {
				parameters = "(" + parameters + ")"
			}
			if len(value.Parameters()) == 1 && !strings.HasPrefix(parameters, "(") && !strings.HasPrefix(parameters, "<") {
				parameters = "(" + parameters + ")"
			}
			tracker := rule.context.NewTracker()
			rule.replace(tracker, rule.Start(node), node.End(), prefix+rule.Text(name)+parameters+rule.context.File.Text()[arrow.End():value.End()])
			rule.fix(report, tracker)
		}
		return
	}
	if mode != "always" && mode != "properties" || name.Kind == ast.KindComputedPropertyName || value.Kind != ast.KindIdentifier || static != value.Text() || quoted && helpers.DeclarationBool(options, "avoidQuotes", false) {
		return
	}
	text := rule.Text(node)
	if strings.Contains(text, "/**") && strings.Contains(text, "@type") {
		return
	}
	report := rule.context.Report(rule.context.Range(node), diagnostics.Expected_property_shorthand)
	if rule.context.NewTracker != nil && !helpers.DeclarationComment(text) {
		tracker := rule.context.NewTracker()
		rule.replace(tracker, rule.Start(node), node.End(), value.Text())
		rule.fix(report, tracker)
	}
}

func (rule *objectShorthandRule) option(index int) map[string]any {
	if index < len(rule.context.Options) {
		value, _ := rule.context.Options[index].(map[string]any)
		return value
	}
	return nil
}

func (rule *objectShorthandRule) replace(tracker *change.Tracker, start, end int, text string) {
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), text)
}

func (rule *objectShorthandRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

func (rule *objectShorthandRule) Text(node *ast.Node) string {
	return rule.context.File.Text()[rule.Start(node):node.End()]
}

func (rule *objectShorthandRule) tokens(start, end int) []helpers.DeclarationToken {
	lexer := scanner.NewScanner()
	lexer.SetText(rule.context.File.Text())
	lexer.SetSkipTrivia(true)
	lexer.ResetPos(start)
	var result []helpers.DeclarationToken
	for kind := lexer.Scan(); kind != ast.KindEndOfFile && lexer.TokenStart() < end; kind = lexer.Scan() {
		result = append(result, helpers.DeclarationToken{Kind: kind, Start: lexer.TokenStart(), End: lexer.TokenEnd()})
	}
	return result
}

func newObjectShorthand(context Context) Rule { return &objectShorthandRule{context: context} }
