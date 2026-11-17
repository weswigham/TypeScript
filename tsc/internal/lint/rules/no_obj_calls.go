package rules

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/astnav"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noObjCallsRule struct {
	context Context
	model   *helpers.TsScopeModel
	globals map[string]string
}

func (rule *noObjCallsRule) OnEnterNode(node *ast.Node) bool {
	rule.objectCall(node)

	return true
}

func (rule *noObjCallsRule) OnExitNode(node *ast.Node) {}

func (rule *noObjCallsRule) Binding(node *ast.Node) *helpers.TsScopeBinding {
	model := rule.Bindings()
	if binding := model.Decls[node]; binding != nil {
		return binding
	}
	if frame := model.Nodes[node]; frame != nil {
		return frame.Find(node.Text())
	}
	return nil
}

func (rule *noObjCallsRule) Bindings() *helpers.TsScopeModel {
	if rule.model == nil {
		rule.model = helpers.NewTScopeModel(rule.context)
	}
	return rule.model
}

func (rule *noObjCallsRule) globalDirectives() map[string]string {
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

func (rule *noObjCallsRule) knownGlobal(name string) bool {
	if mode, found := rule.globalDirectives()[name]; found {
		return mode != "off"
	}
	return slices.Contains(helpers.BindingBuiltins, name)
}

func (rule *noObjCallsRule) objectCall(node *ast.Node) {
	if node.Kind != ast.KindCallExpression && node.Kind != ast.KindNewExpression {
		return
	}
	callee := ast.SkipParentheses(node.Expression())
	name := ""
	if callee.Kind == ast.KindIdentifier {
		name = callee.Text()
	} else if ast.IsAccessExpression(callee) {
		name = helpers.StatementPropertyName(callee)
	}
	for _, reference := range slices.Compact(rule.objectReferences(callee, make(map[*ast.Node]bool))) {
		if name == reference {
			rule.context.Report(rule.context.Range(node), diagnostics.X_0_is_not_a_function, name)
		} else {
			rule.context.Report(rule.context.Range(node), diagnostics.X_0_is_reference_to_1_which_is_not_a_function, name, reference)
		}
	}
}

func (rule *noObjCallsRule) objectReferences(node *ast.Node, seen map[*ast.Node]bool) []string {
	if node == nil {
		return nil
	}
	node = ast.SkipParentheses(node)
	if seen[node] {
		return nil
	}
	seen[node] = true
	defer delete(seen, node)
	switch node.Kind {
	case ast.KindIdentifier:
		if binding := rule.Binding(node); binding != nil {
			if !rule.stable(binding) || len(binding.Declarations) != 1 {
				return nil
			}
			declaration := binding.Declarations[0]
			if declaration.Kind == ast.KindVariableDeclaration {
				return rule.objectReferences(declaration.Initializer(), seen)
			}
			if declaration.Kind == ast.KindBindingElement {
				pattern := declaration.Parent
				root := pattern.Parent
				if pattern.Kind == ast.KindObjectBindingPattern && root.Kind == ast.KindVariableDeclaration && declaration.AsBindingElement().DotDotDotToken == nil {
					property := declaration.AsBindingElement().PropertyName
					if property == nil {
						property = declaration.Name()
					}
					if property.Kind == ast.KindIdentifier || property.Kind == ast.KindStringLiteral {
						for _, base := range rule.objectReferences(root.Initializer(), seen) {
							if base == "globalThis" && rule.unmodifiedGlobal(property.Text()) && slices.Contains(bindingNonCallable, property.Text()) {
								return []string{property.Text()}
							}
						}
					}
				}
			}
			return nil
		}
		if slices.Contains(bindingNonCallable, node.Text()) && rule.unmodifiedGlobal(node.Text()) {
			return []string{node.Text()}
		}
		if slices.Contains([]string{"window", "self", "global"}, node.Text()) && rule.knownGlobal(node.Text()) {
			return []string{"globalThis"}
		}
	case ast.KindPropertyAccessExpression, ast.KindElementAccessExpression:
		name := helpers.StatementPropertyName(node)
		for _, base := range rule.objectReferences(node.Expression(), seen) {
			if base == "globalThis" && slices.Contains(bindingNonCallable, name) && rule.unmodifiedGlobal(name) {
				return []string{name}
			}
		}
	case ast.KindConditionalExpression:
		expression := node.AsConditionalExpression()
		return append(rule.objectReferences(expression.WhenTrue, seen), rule.objectReferences(expression.WhenFalse, seen)...)
	case ast.KindBinaryExpression:
		expression := node.AsBinaryExpression()
		switch expression.OperatorToken.Kind {
		case ast.KindBarBarToken, ast.KindAmpersandAmpersandToken, ast.KindQuestionQuestionToken:
			return append(rule.objectReferences(expression.Left, seen), rule.objectReferences(expression.Right, seen)...)
		case ast.KindCommaToken, ast.KindEqualsToken:
			return rule.objectReferences(expression.Right, seen)
		}
	}
	return nil
}

func (rule *noObjCallsRule) stable(binding *helpers.TsScopeBinding) bool {
	for _, reference := range binding.References {
		if reference.Write {
			return false
		}
	}
	return true
}

func (rule *noObjCallsRule) unmodifiedGlobal(name string) bool {
	modified := false
	helpers.TsScopeWalk(rule.context.File.AsNode(), func(node *ast.Node) bool {
		if node.Kind == ast.KindIdentifier && node.Text() == name && helpers.BindingReference(node) && rule.Binding(node) == nil && ast.IsAssignmentTarget(node) {
			modified = true
		}
		return !modified
	})
	return !modified && rule.knownGlobal(name)
}

var bindingNonCallable = []string{"Atomics", "JSON", "Math", "Reflect", "Intl", "Temporal", "globalThis"}

func newNoObjCalls(context Context) Rule { return &noObjCallsRule{context: context} }
