package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptClassLiteralPropertyStyleRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func newTypeScriptClassLiteralPropertyStyle(context Context) Rule {
	rule := &typescriptClassLiteralPropertyStyleRule{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindGetAccessor, ast.KindPropertyDeclaration},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptClassLiteralPropertyStyleRule) OnEnterNode(node *ast.Node) bool {
	rule.literalProperty(node)
	return true
}

func (rule *typescriptClassLiteralPropertyStyleRule) literalProperty(node *ast.Node) {
	if node.Parent == nil || !ast.IsClassLike(node.Parent) || ast.HasSyntacticModifier(node, ast.ModifierFlagsOverride) {
		return
	}
	mode := helpers.StringOptionValue(rule.option(0), "fields")
	var value *ast.Node
	if mode == "fields" {
		if node.Kind != ast.KindGetAccessor || node.Body() == nil || len(node.Body().Statements()) == 0 {
			return
		}
		first := node.Body().Statements()[0]
		if first.Kind != ast.KindReturnStatement {
			return
		}
		value = first.AsReturnStatement().Expression
		name, known := helpers.StaticPropertyNameText(node.Name())
		for _, member := range node.Parent.Members() {
			if member.Kind == ast.KindSetAccessor {
				setter, setterKnown := helpers.StaticPropertyNameText(member.Name())
				if known && setterKnown && name == setter || !known && !setterKnown && rule.Text(member.Name()) == rule.Text(node.Name()) {
					return
				}
			}
		}
	} else {
		if node.Kind != ast.KindPropertyDeclaration || !ast.HasSyntacticModifier(node, ast.ModifierFlagsReadonly) || ast.HasSyntacticModifier(node, ast.ModifierFlagsAmbient) {
			return
		}
		value = node.Initializer()
		name, known := helpers.StaticPropertyNameText(node.Name())
		if known {
			for _, member := range node.Parent.Members() {
				if member.Kind != ast.KindConstructor || member.Body() == nil {
					continue
				}
				assigned := false
				helpers.WalkSyntaxWhile(member.Body(), func(child *ast.Node) bool {
					if ast.IsFunctionLike(child) {
						return false
					}
					if ast.IsAccessExpression(child) && child.Expression().Kind == ast.KindThisKeyword && helpers.StatementPropertyName(child) == name && tsSyntaxIsAssignee(child) {
						assigned = true
					}
					return true
				})
				if assigned {
					return
				}
			}
		}
	}
	if !typescriptClassLiteralPropertyStyleSupportedLiteral(value) {
		return
	}
	message, description := diagnostics.Literals_should_be_exposed_using_readonly_fields, ast.NewCompilerDiagnostic(diagnostics.Replace_the_literals_with_readonly_fields)
	if mode == "getters" {
		message, description = diagnostics.Literals_should_be_exposed_using_getters, ast.NewCompilerDiagnostic(diagnostics.Replace_the_literals_with_getters)
	}
	diagnostic := rule.context.Report(rule.context.Range(node.Name()), message)
	if rule.context.NewTracker == nil || mode == "fields" && len(node.Decorators()) > 0 {
		return
	}
	tracker := rule.context.NewTracker()
	var modifiers []*ast.Node
	for _, modifier := range node.ModifierNodes() {
		if modifier.Kind == ast.KindPublicKeyword || modifier.Kind == ast.KindPrivateKeyword || modifier.Kind == ast.KindProtectedKeyword || modifier.Kind == ast.KindStaticKeyword {
			modifiers = append(modifiers, modifier)
		}
	}
	var replacement *ast.Node
	if mode == "fields" {
		modifiers = append(modifiers, tracker.NewToken(ast.KindReadonlyKeyword))
		replacement = tracker.NewPropertyDeclaration(tracker.NewModifierList(modifiers), node.Name(), nil, node.Type(), value)
	} else {
		replacement = tracker.NewGetAccessorDeclaration(tracker.NewModifierList(modifiers), node.Name(), nil, tracker.NewNodeList(nil), nil, nil, tracker.NewBlock(tracker.NewNodeList([]*ast.Node{tracker.NewReturnStatement(value)}), false))
	}
	rule.replace(tracker, node, replacement)
	rule.suggest(diagnostic, tracker, description)
}

func (rule *typescriptClassLiteralPropertyStyleRule) option(index int) any {
	if index < len(rule.context.Options) {
		return rule.context.Options[index]
	}
	return nil
}

func (rule *typescriptClassLiteralPropertyStyleRule) Text(node *ast.Node) string {
	return rule.context.File.Text()[scanner.GetTokenPosOfNode(node, rule.context.File, false):node.End()]
}

func (rule *typescriptClassLiteralPropertyStyleRule) replace(tracker *change.Tracker, node, replacement *ast.Node) {
	tracker.ReplaceNodePreservingComments(rule.context.File, node, replacement)
}

func (rule *typescriptClassLiteralPropertyStyleRule) suggest(diagnostic *ast.Diagnostic, tracker *change.Tracker, description *ast.Diagnostic) {
	rule.AddSuggestion(diagnostic, "@typescript-eslint/class-literal-property-style", tracker.GetTextChanges(), description)
}

func typescriptClassLiteralPropertyStyleSupportedLiteral(node *ast.Node) bool {
	if node == nil {
		return false
	}
	node = ast.SkipParentheses(node)
	switch node.Kind {
	case ast.KindStringLiteral, ast.KindNumericLiteral, ast.KindBigIntLiteral, ast.KindTrueKeyword, ast.KindFalseKeyword, ast.KindNullKeyword, ast.KindRegularExpressionLiteral, ast.KindNoSubstitutionTemplateLiteral:
		return true
	case ast.KindTaggedTemplateExpression:
		return node.AsTaggedTemplateExpression().Template.Kind == ast.KindNoSubstitutionTemplateLiteral
	}
	return false
}
