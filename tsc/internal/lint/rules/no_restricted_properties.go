package rules

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noRestrictedPropertyRestriction struct {
	message string
	allowed []string
	hasList bool
}

type noRestrictedProperties struct {
	context    Context
	specific   map[string]map[string]noRestrictedPropertyRestriction
	objects    map[string]noRestrictedPropertyRestriction
	properties map[string]noRestrictedPropertyRestriction
}

func newNoRestrictedProperties(context Context) Rule {
	rule := &noRestrictedProperties{
		context:    context,
		specific:   make(map[string]map[string]noRestrictedPropertyRestriction),
		objects:    make(map[string]noRestrictedPropertyRestriction),
		properties: make(map[string]noRestrictedPropertyRestriction),
	}
	for _, value := range context.Options {
		option, ok := value.(map[string]any)
		if !ok {
			continue
		}
		object, hasObject := option["object"].(string)
		property, hasProperty := option["property"].(string)
		message, _ := option["message"].(string)
		restriction := noRestrictedPropertyRestriction{message: message}
		if hasObject && hasProperty {
			if rule.specific[object] == nil {
				rule.specific[object] = make(map[string]noRestrictedPropertyRestriction)
			}
			rule.specific[object][property] = restriction
		} else if hasObject {
			restriction.allowed, restriction.hasList = noRestrictedPropertiesStringList(option, "allowProperties")
			rule.objects[object] = restriction
		} else if hasProperty {
			restriction.allowed, restriction.hasList = noRestrictedPropertiesStringList(option, "allowObjects")
			rule.properties[property] = restriction
		}
	}
	return rule
}

func noRestrictedPropertiesStringList(option map[string]any, name string) ([]string, bool) {
	value, exists := option[name]
	if !exists {
		return nil, false
	}
	if list, ok := value.([]string); ok {
		return list, true
	}
	var result []string
	if list, ok := value.([]any); ok {
		for _, item := range list {
			if text, ok := item.(string); ok {
				result = append(result, text)
			}
		}
	}
	return result, true
}

func (rule *noRestrictedProperties) OnEnterNode(node *ast.Node) bool {
	if ast.IsAccessExpression(node) {
		object := ast.SkipParentheses(node.Expression())
		name, known := helpers.StaticMemberNameText(node)
		if known {
			objectName := ""
			if object.Kind == ast.KindIdentifier {
				objectName = object.Text()
			}
			rule.check(node, objectName, object.Kind == ast.KindIdentifier, name)
		}
	} else if node.Kind == ast.KindObjectBindingPattern || node.Kind == ast.KindObjectLiteralExpression && helpers.IsDestructuringAssignmentPattern(node) {
		var source *ast.Node
		parent := helpers.OuterParenthesizedExpression(node).Parent
		if parent != nil {
			switch parent.Kind {
			case ast.KindVariableDeclaration, ast.KindParameter, ast.KindBindingElement:
				source = parent.Initializer()
			case ast.KindBinaryExpression:
				if parent.AsBinaryExpression().OperatorToken.Kind == ast.KindEqualsToken {
					source = parent.AsBinaryExpression().Right
				}
			}
		}
		objectName, knownObject := "", false
		if source != nil {
			source = ast.SkipParentheses(source)
			if source.Kind == ast.KindIdentifier {
				objectName, knownObject = source.Text(), true
			}
		}
		var properties []*ast.Node
		if node.Kind == ast.KindObjectBindingPattern {
			properties = node.AsBindingPattern().Elements.Nodes
		} else {
			properties = node.AsObjectLiteralExpression().Properties.Nodes
		}
		for _, property := range properties {
			if property.Kind == ast.KindSpreadAssignment || property.Kind == ast.KindBindingElement && property.AsBindingElement().DotDotDotToken != nil {
				continue
			}
			if name, ok := helpers.StaticMemberNameText(property); ok {
				rule.check(node, objectName, knownObject, name)
			}
		}
	}
	return true
}

func (rule *noRestrictedProperties) OnExitNode(node *ast.Node) {}

func (rule *noRestrictedProperties) check(node *ast.Node, object string, knownObject bool, property string) {
	var restriction noRestrictedPropertyRestriction
	var restricted bool
	if knownObject {
		if specific, exists := rule.specific[object]; exists {
			restriction, restricted = specific[property]
		} else {
			restriction, restricted = rule.objects[object]
		}
	}
	if restricted && !slices.Contains(restriction.allowed, property) {
		extra := ""
		if restriction.hasList {
			extra = " Only these properties are allowed: " + strings.Join(restriction.allowed, ", ") + "."
		}
		if restriction.message != "" {
			extra += " " + restriction.message
		}
		rule.context.Report(rule.context.Range(node), diagnostics.X_0_1_is_restricted_from_being_used_2, object, property, extra)
		return
	}
	if restriction, exists := rule.properties[property]; exists && !(knownObject && slices.Contains(restriction.allowed, object)) {
		extra := ""
		if restriction.hasList {
			extra = " Property '" + property + "' is only allowed on these objects: " + strings.Join(restriction.allowed, ", ") + "."
		}
		if restriction.message != "" {
			extra += " " + restriction.message
		}
		rule.context.Report(rule.context.Range(node), diagnostics.X_0_is_restricted_from_being_used_1, property, extra)
	}
}
