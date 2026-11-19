package rules

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/astnav"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/regex"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type camelcaseRule struct {
	context  Context
	model    *helpers.TsScopeModel
	globals  map[string]string
	patterns map[string]*regex.Pattern
}

func newCamelcase(context Context) Rule {
	rule := &camelcaseRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindIdentifier, ast.KindPrivateIdentifier},
	}
}

func (rule *camelcaseRule) OnEnterNode(node *ast.Node) bool {
	rule.identifier(node)

	return true
}

func (rule *camelcaseRule) Binding(node *ast.Node) *helpers.TsScopeBinding {
	model := rule.Bindings()
	if binding := model.Decls[node]; binding != nil {
		return binding
	}
	if frame := model.Nodes[node]; frame != nil {
		return frame.Find(node.Text())
	}
	return nil
}

func (rule *camelcaseRule) Bindings() *helpers.TsScopeModel {
	if rule.model == nil {
		rule.model = helpers.NewTScopeModel(rule.context)
	}
	return rule.model
}

func (rule *camelcaseRule) camelIdentifier(node *ast.Node) bool {
	options := rule.options(0)
	outer, parent := helpers.BindingParent(node)
	if parent == nil {
		return false
	}
	properties := options["properties"] != "never"
	if parent.Kind == ast.KindExportSpecifier && parent.Name() == node || parent.Kind == ast.KindNamespaceExport || parent.Kind == ast.KindLabeledStatement || parent.Kind == ast.KindBreakStatement || parent.Kind == ast.KindContinueStatement {
		return node.Kind == ast.KindIdentifier
	}
	if parent.Kind == ast.KindPropertyAccessExpression && parent.Name() == outer {
		if node.Kind == ast.KindPrivateIdentifier {
			return false
		}
		return properties && helpers.BindingNamingTarget(parent)
	}
	if (parent.Kind == ast.KindPropertyAssignment || parent.Kind == ast.KindShorthandPropertyAssignment) && parent.Name() == node && parent.Parent.Kind == ast.KindObjectLiteralExpression && !ast.IsAssignmentTarget(parent.Parent) {
		if properties {
			return true
		}
	}
	if (parent.Kind == ast.KindPropertyDeclaration || parent.Kind == ast.KindMethodDeclaration || ast.IsAccessor(parent)) && parent.Name() == node {
		return properties
	}
	if node.Kind == ast.KindPrivateIdentifier || helpers.BindingDefaultValue(node) {
		return false
	}
	model := rule.Bindings()
	if binding := model.Decls[node]; binding != nil {
		declaration := ast.GetRootDeclaration(node.Parent)
		if declaration.Kind == ast.KindInterfaceDeclaration || declaration.Kind == ast.KindTypeAliasDeclaration || declaration.Kind == ast.KindTypeParameter {
			return false
		}
		if binding.Identifiers[0] != node {
			return false
		}
		if options["ignoreImports"] == true && node.Parent.Kind == ast.KindImportSpecifier && helpers.BindingOriginal(node) {
			return false
		}
		return options["ignoreDestructuring"] != true || !helpers.BindingOriginal(node)
	}
	if !helpers.BindingReference(node) {
		return false
	}
	if options["ignoreGlobals"] == true && rule.externalGlobal(node) {
		return false
	}
	if parent.Kind == ast.KindCallExpression || parent.Kind == ast.KindNewExpression {
		return false
	}
	if options["ignoreDestructuring"] == true && helpers.BindingOriginal(node) {
		return false
	}
	return true
}

func (rule *camelcaseRule) externalGlobal(node *ast.Node) bool {
	return helpers.BindingReference(node) && rule.Binding(node) == nil && rule.knownGlobal(node.Text())
}

func (rule *camelcaseRule) globalDirectives() map[string]string {
	if rule.globals != nil {
		return rule.globals
	}
	rule.globals = make(map[string]string)
	file := rule.context.File
	previousEnd := 0
	for token := astnav.GetTokenAtPosition(file, 0); token != nil; token = astnav.FindNextToken(token, file.AsNode(), file) {
		start := scanner.GetTokenPosOfNode(token, file, false)
		lexer := scanner.NewScanner()
		lexer.SetText(file.Text())
		lexer.SetSkipTrivia(false)
		lexer.ResetPos(previousEnd)
		for lexer.TokenEnd() < start {
			kind := lexer.Scan()
			if kind == ast.KindMultiLineCommentTrivia {
				text := strings.TrimSpace(file.Text()[lexer.TokenStart()+2 : lexer.TokenEnd()-2])
				fields := strings.Fields(text)
				if len(fields) > 0 && (fields[0] == "global" || fields[0] == "globals") {
					text = strings.TrimSpace(strings.TrimPrefix(text, fields[0]))
					if before, _, found := strings.Cut(text, "--"); found {
						text = before
					}
					text = strings.ReplaceAll(strings.ReplaceAll(text, ": ", ":"), " :", ":")
					for _, entry := range strings.FieldsFunc(text, func(character rune) bool {
						return character == ',' || character == ' ' || character == '\t' || character == '\r' || character == '\n'
					}) {
						name, mode, found := strings.Cut(entry, ":")
						if !found {
							mode = "readonly"
						}
						rule.globals[name] = mode
					}
				}
			}
			if kind == ast.KindEndOfFile {
				break
			}
		}
		if token.Kind == ast.KindEndOfFile {
			break
		}
		previousEnd = token.End()
	}
	return rule.globals
}

func (rule *camelcaseRule) identifier(node *ast.Node) {
	if node.Kind != ast.KindIdentifier && node.Kind != ast.KindPrivateIdentifier || node.Parent == nil || node.Parent.Kind == ast.KindMetaProperty || helpers.BindingAttribute(node) {
		return
	}
	name := strings.TrimPrefix(node.Text(), "#")
	private := node.Kind == ast.KindPrivateIdentifier

	body := strings.Trim(name, "_")
	if !strings.Contains(body, "_") || body == strings.ToUpper(body) {
		return
	}
	for _, allowed := range helpers.SharedRuleStrings(rule.options(0)["allow"]) {
		if allowed == name || rule.matches(allowed, name) {
			return
		}
	}
	if !rule.camelIdentifier(node) {
		return
	}
	message := diagnostics.Identifier_0_is_not_in_camel_case
	if private {
		message = diagnostics.X_0_is_not_in_camel_case
	}
	rule.context.Report(rule.context.Range(node), message, name)
}

func (rule *camelcaseRule) knownGlobal(name string) bool {
	if mode, found := rule.globalDirectives()[name]; found {
		return mode != "off"
	}
	return slices.Contains(helpers.BindingBuiltins, name)
}

func (rule *camelcaseRule) matches(pattern, value string) bool {
	if rule.patterns == nil {
		rule.patterns = make(map[string]*regex.Pattern)
	}
	compiled := rule.patterns[pattern]
	if compiled == nil {
		compiled = regex.Compile(pattern)
		rule.patterns[pattern] = compiled
	}
	return compiled.MatchString(value)
}

func (rule *camelcaseRule) options(index int) map[string]any {
	if index < len(rule.context.Options) {
		options, _ := rule.context.Options[index].(map[string]any)
		return options
	}
	return nil
}
