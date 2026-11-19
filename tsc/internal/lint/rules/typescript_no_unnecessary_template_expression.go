package rules

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/jsnum"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typeScriptNoUnnecessaryTemplateExpression struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptNoUnnecessaryTemplateExpression(context Context) Rule {
	rule := &typeScriptNoUnnecessaryTemplateExpression{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindTemplateExpression, ast.KindTemplateLiteralType},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typeScriptNoUnnecessaryTemplateExpression) OnEnterNode(node *ast.Node) bool {
	typeNode := node.Kind == ast.KindTemplateLiteralType
	if node.Kind != ast.KindTemplateExpression && !typeNode {
		return true
	}
	if node.Parent != nil && node.Parent.Kind == ast.KindTaggedTemplateExpression {
		return true
	}
	var head *ast.Node
	var spans []*ast.Node
	if typeNode {
		head = node.AsTemplateLiteralTypeNode().Head
		spans = node.AsTemplateLiteralTypeNode().TemplateSpans.Nodes
	} else {
		head = node.AsTemplateExpression().Head
		spans = node.AsTemplateExpression().TemplateSpans.Nodes
	}
	if len(spans) == 1 && head.Text() == "" {
		span := spans[0]
		var expression, tail *ast.Node
		if typeNode {
			expression, tail = span.AsTemplateLiteralTypeSpan().Type, span.AsTemplateLiteralTypeSpan().Literal
		} else {
			expression, tail = span.AsTemplateSpan().Expression, span.AsTemplateSpan().Literal
		}
		if tail.Text() == "" && helpers.SemanticSyntaxComments(rule.context, head.End(), tail.Pos()) == "" {
			c := rule.context.GetChecker()
			value := c.GetTypeAtLocation(expression)
			parameter := value.Flags()&checker.TypeFlagsTypeParameter != 0
			if constraint := c.GetBaseConstraintOfType(value); constraint != nil {
				value = constraint
			}
			stringLike := true
			for _, part := range helpers.SemanticSyntaxParts(value) {
				partStringLike := false
				for _, item := range helpers.SemanticMemberIntersection(part) {
					if item.Flags()&checker.TypeFlagsStringLike != 0 {
						partStringLike = true
					}
					if typeNode && item.Flags()&checker.TypeFlagsEnumLiteral != 0 {
						stringLike = false
					}
				}
				if !partStringLike {
					stringLike = false
				}
			}
			if stringLike && (!typeNode || !parameter) {
				diagnostic := rule.context.Report(rule.context.Range(expression), diagnostics.Template_literal_expression_is_unnecessary_and_can_be_simplified)
				text := helpers.SemanticSyntaxText(rule.context, expression)
				if !typeNode {
					text = "(" + text + ")"
					if expression.Kind == ast.KindIdentifier || expression.Kind == ast.KindStringLiteral || expression.Kind == ast.KindPropertyAccessExpression || expression.Kind == ast.KindCallExpression {
						text = helpers.SemanticSyntaxText(rule.context, expression)
					}
				}
				rule.fix(diagnostic, "no-unnecessary-template-expression", []core.TextChange{helpers.SemanticSyntaxEdit(helpers.SemanticSyntaxStart(rule.context, node), node.End(), text)}, nil)
				return true
			}
		}
	}
	for index, span := range spans {
		var expression, literal *ast.Node
		if typeNode {
			expression, literal = span.AsTemplateLiteralTypeSpan().Type, span.AsTemplateLiteralTypeSpan().Literal
		} else {
			expression, literal = span.AsTemplateSpan().Expression, span.AsTemplateSpan().Literal
		}
		previous := head
		if index > 0 {
			if typeNode {
				previous = spans[index-1].AsTemplateLiteralTypeSpan().Literal
			} else {
				previous = spans[index-1].AsTemplateSpan().Literal
			}
		}
		if helpers.SemanticSyntaxComments(rule.context, previous.End(), literal.Pos()) != "" {
			continue
		}
		text, ok := rule.literal(expression, typeNode)
		if !ok {
			continue
		}
		next := rule.context.File.Text()[literal.End()-len(literal.Text())-1 : literal.End()-1]
		if (strings.HasPrefix(next, "\n") || strings.HasPrefix(next, "\r")) && strings.TrimSpace(text) == "" {
			continue
		}
		edits := []core.TextChange{}
		if strings.HasPrefix(next, "{") && typeScriptNoUnnecessaryTemplateExpressionEndsDollar(text) {
			text = text[:len(text)-1] + "\\$"
		}
		if strings.HasPrefix(text, "{") && typeScriptNoUnnecessaryTemplateExpressionEndsDollar(rule.context.File.Text()[helpers.SemanticSyntaxStart(rule.context, previous)+1:previous.End()-2]) {
			edits = append(edits, helpers.SemanticSyntaxEdit(previous.End()-3, previous.End()-2, "\\$"))
		}
		edits = append(edits, helpers.SemanticSyntaxEdit(previous.End()-2, helpers.SemanticSyntaxStart(rule.context, literal)+1, text))
		diagnostic := rule.context.Report(rule.context.Range(expression), diagnostics.Template_literal_expression_is_unnecessary_and_can_be_simplified)
		rule.fix(diagnostic, "no-unnecessary-template-expression", edits, nil)
	}
	return true
}

func (rule *typeScriptNoUnnecessaryTemplateExpression) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typeScriptNoUnnecessaryTemplateExpression) fix(diagnostic *ast.Diagnostic, name string, edits []core.TextChange, suggestion *diagnostics.Message) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	for _, edit := range edits {
		tracker.ReplaceTextRangeWithText(rule.context.File, edit.TextRange, edit.NewText)
	}
	description := ast.NewCompilerDiagnostic(diagnostics.Fix_0, name)
	if suggestion != nil {
		description = ast.NewCompilerDiagnostic(suggestion)
	}
	action := codefix.CreateCodeFixAction("@typescript-eslint/"+name, tracker.GetTextChanges(), description, "@typescript-eslint/"+name, ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, name))
	if suggestion == nil {
		diagnostic.SetCodeFixes(action)
		return
	}
	if rule.suggestions == nil {
		rule.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
	}
	rule.suggestions[diagnostic] = append(rule.suggestions[diagnostic], action)
}

func typeScriptNoUnnecessaryTemplateExpressionEscapeTemplate(text string) string {
	text = strings.ReplaceAll(text, "\\", "\\\\")
	text = strings.ReplaceAll(text, "`", "\\`")
	text = strings.ReplaceAll(text, "${", "\\${")
	text = strings.ReplaceAll(text, "\r", "\\r")
	return text
}

func semanticLiteralString(context Context, node *ast.Node) (string, bool) {
	switch node.Kind {
	case ast.KindStringLiteral:
		return node.Text(), true
	case ast.KindNumericLiteral:
		return jsnum.FromString(node.Text()).String(), true
	case ast.KindBigIntLiteral:
		return jsnum.ParseValidBigInt(node.Text()).String(), true
	case ast.KindTrueKeyword:
		return "true", true
	case ast.KindFalseKeyword:
		return "false", true
	case ast.KindNullKeyword:
		return "null", true
	case ast.KindRegularExpressionLiteral:
		text := helpers.SemanticSyntaxText(context, node)
		end := strings.LastIndexByte(text, '/')
		flags := []byte(text[end+1:])
		slices.Sort(flags)
		return text[:end+1] + string(flags), true
	}
	return "", false
}

func (rule *typeScriptNoUnnecessaryTemplateExpression) literal(node *ast.Node, typeNode bool) (string, bool) {
	if node.Kind == ast.KindLiteralType {
		node = node.AsLiteralTypeNode().Literal
	}
	if text, ok := semanticLiteralString(rule.context, node); ok {
		return typeScriptNoUnnecessaryTemplateExpressionEscapeTemplate(text), !typeNode || node.Kind != ast.KindRegularExpressionLiteral
	}
	switch node.Kind {
	case ast.KindNoSubstitutionTemplateLiteral:
		return typeScriptNoUnnecessaryTemplateExpressionEscapeTemplate(node.Text()), true
	case ast.KindUndefinedKeyword:
		return "undefined", typeNode
	case ast.KindIdentifier:
		if !typeNode && (node.Text() == "undefined" || node.Text() == "Infinity" || node.Text() == "NaN") {
			return node.Text(), true
		}
	case ast.KindTemplateExpression:
		text := helpers.SemanticSyntaxText(rule.context, node)
		return text[1 : len(text)-1], true
	case ast.KindTemplateLiteralType:
		text := helpers.SemanticSyntaxText(rule.context, node)
		return text[1 : len(text)-1], typeNode
	}
	return "", false
}

func typeScriptNoUnnecessaryTemplateExpressionEndsDollar(text string) bool {
	if !strings.HasSuffix(text, "$") {
		return false
	}
	backslashes := 0
	for index := len(text) - 2; index >= 0 && text[index] == '\\'; index-- {
		backslashes++
	}
	return backslashes%2 == 0
}
