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

type idMatchRule struct {
	context  Context
	model    *helpers.TsScopeModel
	globals  map[string]string
	patterns map[string]*regex.Pattern
}

func newIdMatch(context Context) Rule {
	rule := &idMatchRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindIdentifier, ast.KindPrivateIdentifier},
	}
}

func (rule *idMatchRule) OnEnterNode(node *ast.Node) bool {
	rule.identifier(node)

	return true
}

func (rule *idMatchRule) Binding(node *ast.Node) *helpers.TsScopeBinding {
	model := rule.Bindings()
	if binding := model.Decls[node]; binding != nil {
		return binding
	}
	if frame := model.Nodes[node]; frame != nil {
		return frame.Find(node.Text())
	}
	return nil
}

func (rule *idMatchRule) Bindings() *helpers.TsScopeModel {
	if rule.model == nil {
		rule.model = helpers.NewTScopeModel(rule.context)
	}
	return rule.model
}

func (rule *idMatchRule) externalGlobal(node *ast.Node) bool {
	return helpers.BindingReference(node) && rule.Binding(node) == nil && rule.knownGlobal(node.Text())
}

func (rule *idMatchRule) globalDirectives() map[string]string {
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

func (rule *idMatchRule) identifier(node *ast.Node) {
	if node.Kind != ast.KindIdentifier && node.Kind != ast.KindPrivateIdentifier || node.Parent == nil || node.Parent.Kind == ast.KindMetaProperty || helpers.BindingAttribute(node) {
		return
	}
	name := strings.TrimPrefix(node.Text(), "#")
	private := node.Kind == ast.KindPrivateIdentifier

	pattern := "^.+$"
	if len(rule.context.Options) > 0 {
		if value, ok := rule.context.Options[0].(string); ok {
			pattern = value
		}
	}
	if !rule.matchedIdentifier(node) || rule.matches(pattern, name) {
		return
	}
	message := diagnostics.Identifier_0_does_not_match_the_pattern_1
	if private {
		message = diagnostics.Identifier_0_does_not_match_the_pattern_1_24215
	}
	rule.context.Report(rule.context.Range(node), message, name, pattern)
}

func (rule *idMatchRule) knownGlobal(name string) bool {
	if mode, found := rule.globalDirectives()[name]; found {
		return mode != "off"
	}
	return slices.Contains(helpers.BindingBuiltins, name)
}

func (rule *idMatchRule) matchDeclarationParent(parent *ast.Node, options map[string]any) bool {
	if parent.Kind == ast.KindCallExpression || parent.Kind == ast.KindNewExpression {
		return false
	}
	if options["onlyDeclarations"] != true {
		return true
	}
	if parent.Kind == ast.KindParameter {
		return parent.Parent.Kind == ast.KindFunctionDeclaration
	}
	return parent.Kind == ast.KindFunctionDeclaration || parent.Kind == ast.KindVariableDeclaration
}

func (rule *idMatchRule) matchedIdentifier(node *ast.Node) bool {
	options := rule.options(1)
	outer, parent := helpers.BindingParent(node)
	if parent == nil {
		return false
	}
	if node.Kind == ast.KindPrivateIdentifier {
		return parent.Kind != ast.KindPropertyDeclaration || options["classFields"] == true
	}
	if rule.externalGlobal(node) {
		return false
	}
	if ast.IsAccessExpression(parent) {
		if options["properties"] != true {
			return false
		}
		if parent.Expression() == outer {
			return true
		}
		_, effective := helpers.BindingParent(parent)
		if effective != nil && effective.Kind == ast.KindBinaryExpression && ast.IsAssignmentOperator(effective.AsBinaryExpression().OperatorToken.Kind) {
			left := ast.SkipParentheses(effective.AsBinaryExpression().Left)
			if ast.IsAccessExpression(left) {
				property := left.Name()
				if left.Kind == ast.KindElementAccessExpression {
					property = left.AsElementAccessExpression().ArgumentExpression
				}
				if property != nil && property.Kind == ast.KindIdentifier && property.Text() == node.Text() {
					return true
				}
			}
			return !ast.IsAccessExpression(ast.SkipParentheses(effective.AsBinaryExpression().Right))
		}
		return false
	}
	if parent.Kind == ast.KindComputedPropertyName {
		return rule.matchDeclarationParent(parent.Parent, options)
	}
	if parent.Kind == ast.KindPropertyDeclaration {
		return options["classFields"] == true
	}
	if parent.Kind == ast.KindImportSpecifier {
		return parent.Name() == node
	}
	if parent.Kind == ast.KindNamespaceImport || parent.Kind == ast.KindImportClause {
		return true
	}
	if helpers.BindingDefaultValue(node) {
		return false
	}
	if parent.Kind == ast.KindBindingElement {
		if parent.AsBindingElement().PropertyName == node {
			return false
		}
		if parent.Parent.Kind == ast.KindObjectBindingPattern && parent.Name() == node {
			return options["ignoreDestructuring"] != true || !helpers.BindingOriginal(node)
		}
		return rule.matchDeclarationParent(parent, options)
	}
	if parent.Kind == ast.KindPropertyAssignment || parent.Kind == ast.KindShorthandPropertyAssignment || parent.Kind == ast.KindMethodDeclaration && parent.Parent.Kind == ast.KindObjectLiteralExpression || ast.IsAccessor(parent) && parent.Parent.Kind == ast.KindObjectLiteralExpression {
		if parent.Name() == node && !helpers.BindingPatternProperty(node) {
			return options["properties"] == true
		}
		if helpers.BindingPatternProperty(node) {
			if parent.Kind == ast.KindShorthandPropertyAssignment {
				return options["ignoreDestructuring"] != true
			}
			if parent.Name() == node {
				return false
			}
			if helpers.BindingOriginal(node) && options["ignoreDestructuring"] == true {
				return false
			}
			return true
		}
		if options["properties"] != true {
			return false
		}
	}
	return rule.matchDeclarationParent(parent, options)
}

func (rule *idMatchRule) matches(pattern, value string) bool {
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

func (rule *idMatchRule) options(index int) map[string]any {
	if index < len(rule.context.Options) {
		options, _ := rule.context.Options[index].(map[string]any)
		return options
	}
	return nil
}
