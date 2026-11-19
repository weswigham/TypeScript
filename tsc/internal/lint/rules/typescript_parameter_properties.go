package rules

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptParameterPropertiesRule struct {
	context Context
}

func newTypeScriptParameterProperties(context Context) Rule {
	rule := &typescriptParameterPropertiesRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindParameter},
		Exit:       rule.OnExitNode,
		ExitKinds:  []ast.Kind{ast.KindClassDeclaration, ast.KindClassExpression},
	}
}

func (rule *typescriptParameterPropertiesRule) OnEnterNode(node *ast.Node) bool {
	rule.parameterProperty(node)
	return true
}

func (rule *typescriptParameterPropertiesRule) OnExitNode(node *ast.Node) {
	rule.preferredParameterProperties(node)
}

func (rule *typescriptParameterPropertiesRule) parameterProperty(node *ast.Node) {
	allow := helpers.TypescriptSyntaxStrings(rule.Options()["allow"])
	if rule.Options()["prefer"] != "parameter-property" {
		if node.Kind == ast.KindParameter && node.Parent.Kind == ast.KindConstructor && ast.HasSyntacticModifier(node, ast.ModifierFlagsParameterPropertyModifier) && !slices.Contains(allow, typescriptParameterPropertiesModifiers(node)) {
			rule.context.Report(rule.context.Range(node), diagnostics.Property_0_should_be_declared_as_a_class_property, node.Name().Text())
		}
	}
}

func (rule *typescriptParameterPropertiesRule) preferredParameterProperties(node *ast.Node) {
	if !ast.IsClassLike(node) || rule.Options()["prefer"] != "parameter-property" {
		return
	}
	parameters := make(map[string]*ast.Node)
	assignments := make(map[string]bool)
	for _, member := range node.Members() {
		if member.Kind != ast.KindConstructor {
			continue
		}
		for _, parameter := range member.FunctionLikeData().Parameters.Nodes {
			if parameter.Name().Kind == ast.KindIdentifier && parameter.Initializer() == nil && parameter.AsParameterDeclaration().DotDotDotToken == nil && !ast.HasSyntacticModifier(parameter, ast.ModifierFlagsParameterPropertyModifier) {
				parameters[parameter.Name().Text()] = parameter
			}
		}
		if member.Body() == nil {
			continue
		}
		for _, statement := range member.Body().Statements() {
			if statement.Kind != ast.KindExpressionStatement {
				break
			}
			expression := ast.SkipParentheses(statement.Expression())
			if expression.Kind != ast.KindBinaryExpression || !ast.IsAssignmentOperator(expression.AsBinaryExpression().OperatorToken.Kind) {
				break
			}
			assignment := expression.AsBinaryExpression()
			left := ast.SkipParentheses(assignment.Left)
			if !ast.IsAccessExpression(left) || left.Expression().Kind != ast.KindThisKeyword || assignment.Right.Kind != ast.KindIdentifier {
				break
			}
			property := left.Name()
			if left.Kind == ast.KindElementAccessExpression {
				property = left.AsElementAccessExpression().ArgumentExpression
			}
			if property == nil || property.Kind != ast.KindIdentifier {
				break
			}
			assignments[assignment.Right.Text()] = true
		}
	}
	allow := helpers.TypescriptSyntaxStrings(rule.Options()["allow"])
	for _, member := range node.Members() {
		if member.Kind != ast.KindPropertyDeclaration || member.Name().Kind != ast.KindIdentifier || member.Initializer() != nil || slices.Contains(allow, typescriptParameterPropertiesModifiers(member)) {
			continue
		}
		name := member.Name().Text()
		if parameter := parameters[name]; parameter != nil && assignments[name] && rule.annotation(member) == rule.annotation(parameter) {
			rule.context.Report(rule.context.Range(member), diagnostics.Property_0_should_be_declared_as_a_parameter_property, name)
		}
	}
}

func (rule *typescriptParameterPropertiesRule) Options() map[string]any {
	if len(rule.context.Options) != 0 {
		options, _ := rule.context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func (rule *typescriptParameterPropertiesRule) annotation(node *ast.Node) string {
	if node.Type() == nil {
		return ""
	}
	colon := helpers.TsAnnotationColon(rule.context, node)
	if colon < 0 {
		return ""
	}
	return rule.context.File.Text()[colon:node.Type().End()]
}

func typescriptParameterPropertiesModifiers(node *ast.Node) string {
	var modifiers []string
	switch {
	case ast.HasSyntacticModifier(node, ast.ModifierFlagsPrivate):
		modifiers = append(modifiers, "private")
	case ast.HasSyntacticModifier(node, ast.ModifierFlagsProtected):
		modifiers = append(modifiers, "protected")
	case ast.HasSyntacticModifier(node, ast.ModifierFlagsPublic):
		modifiers = append(modifiers, "public")
	}
	if ast.HasSyntacticModifier(node, ast.ModifierFlagsReadonly) {
		modifiers = append(modifiers, "readonly")
	}
	return strings.Join(modifiers, " ")
}
