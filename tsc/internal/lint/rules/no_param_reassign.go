package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/regex"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noParamReassignRule struct {
	context  Context
	model    *helpers.TsScopeModel
	patterns map[string]*regex.Pattern
}

func (rule *noParamReassignRule) OnEnterNode(node *ast.Node) bool {
	rule.parameterWrite(node)

	return true
}

func (rule *noParamReassignRule) OnExitNode(node *ast.Node) {}

func (rule *noParamReassignRule) Binding(node *ast.Node) *helpers.TsScopeBinding {
	model := rule.Bindings()
	if binding := model.Decls[node]; binding != nil {
		return binding
	}
	if frame := model.Nodes[node]; frame != nil {
		return frame.Find(node.Text())
	}
	return nil
}

func (rule *noParamReassignRule) Bindings() *helpers.TsScopeModel {
	if rule.model == nil {
		rule.model = helpers.NewTScopeModel(rule.context)
	}
	return rule.model
}

func (rule *noParamReassignRule) matches(pattern, value string) bool {
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

func (rule *noParamReassignRule) options(index int) map[string]any {
	if index < len(rule.context.Options) {
		options, _ := rule.context.Options[index].(map[string]any)
		return options
	}
	return nil
}

func (rule *noParamReassignRule) parameterWrite(node *ast.Node) {
	if !helpers.BindingReference(node) {
		return
	}
	binding := rule.Binding(node)
	if binding == nil || len(binding.Declarations) == 0 {
		return
	}
	declaration := ast.GetRootDeclaration(binding.Declarations[0])
	if declaration.Kind != ast.KindParameter {
		return
	}
	if ast.IsAssignmentTarget(node) {
		rule.context.Report(rule.context.Range(node), diagnostics.Assignment_to_function_parameter_0, node.Text())
		return
	}
	options := rule.options(0)
	if options["props"] != true || slices.Contains(helpers.SharedRuleStrings(options["ignorePropertyModificationsFor"]), node.Text()) {
		return
	}
	for _, pattern := range helpers.SharedRuleStrings(options["ignorePropertyModificationsForRegex"]) {
		if rule.matches(pattern, node.Text()) {
			return
		}
	}
	if bindingModifiesProperty(node) {
		rule.context.Report(rule.context.Range(node), diagnostics.Assignment_to_property_of_function_parameter_0, node.Text())
	}
}

func bindingModifiesProperty(node *ast.Node) bool {
	for parent := node.Parent; parent != nil; node, parent = parent, parent.Parent {
		switch parent.Kind {
		case ast.KindBinaryExpression:
			binary := parent.AsBinaryExpression()
			if ast.IsAssignmentOperator(binary.OperatorToken.Kind) {
				return binary.Left == node
			}
		case ast.KindPrefixUnaryExpression:
			if parent.AsPrefixUnaryExpression().Operator == ast.KindPlusPlusToken || parent.AsPrefixUnaryExpression().Operator == ast.KindMinusMinusToken {
				return true
			}
		case ast.KindPostfixUnaryExpression, ast.KindDeleteExpression:
			return true
		case ast.KindForInStatement, ast.KindForOfStatement:
			return parent.Initializer() == node
		case ast.KindCallExpression:
			if parent.Expression() != node {
				return false
			}
		case ast.KindPropertyAccessExpression:
			if parent.Name() == node {
				return false
			}
		case ast.KindElementAccessExpression:
			if parent.AsElementAccessExpression().ArgumentExpression == node {
				return false
			}
		case ast.KindPropertyAssignment, ast.KindBindingElement:
			if parent.Name() == node || parent.Kind == ast.KindBindingElement && parent.AsBindingElement().PropertyName == node {
				return false
			}
		case ast.KindConditionalExpression:
			if parent.AsConditionalExpression().Condition == node {
				return false
			}
		default:
			if ast.IsStatement(parent) || ast.IsDeclaration(parent) && parent.Kind != ast.KindShorthandPropertyAssignment || ast.IsFunctionLike(parent) || parent.Kind == ast.KindSourceFile {
				return false
			}
		}
	}
	return false
}

func newNoParamReassign(context Context) Rule { return &noParamReassignRule{context: context} }
