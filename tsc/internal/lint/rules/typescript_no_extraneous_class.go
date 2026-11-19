package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoExtraneousClassRule struct {
	context Context
}

func newTypeScriptNoExtraneousClass(context Context) Rule {
	rule := &typescriptNoExtraneousClassRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindClassDeclaration, ast.KindClassExpression},
	}
}

func (rule *typescriptNoExtraneousClassRule) OnEnterNode(node *ast.Node) bool {
	if ast.IsClassLike(node) {
		rule.extraneousClass(node)
	}
	return true
}

func (rule *typescriptNoExtraneousClassRule) extraneousClass(node *ast.Node) {
	if ast.GetHeritageClause(node, ast.KindExtendsKeyword) != nil {
		return
	}
	if rule.Boolean("allowWithDecorator", false) && ast.HasSyntacticModifier(node, ast.ModifierFlagsDecorator) {
		return
	}
	var members []*ast.Node
	for _, member := range node.Members() {
		if member.Kind != ast.KindSemicolonClassElement {
			members = append(members, member)
		}
	}
	report := node
	if node.Kind == ast.KindClassDeclaration && node.Name() != nil {
		report = node.Name()
	}
	if len(members) == 0 {
		if !rule.Boolean("allowEmpty", false) {
			rule.context.Report(rule.context.Range(report), diagnostics.Unexpected_empty_class)
		}
		return
	}
	constructors, static := true, true
	for _, member := range members {
		if member.Kind == ast.KindConstructor {
			for _, parameter := range member.Parameters() {
				if ast.HasSyntacticModifier(parameter, ast.ModifierFlagsAccessibilityModifier|ast.ModifierFlagsReadonly|ast.ModifierFlagsOverride) {
					constructors, static = false, false
				}
			}
		} else {
			constructors = false
			if member.Kind != ast.KindClassStaticBlockDeclaration && (!ast.HasSyntacticModifier(member, ast.ModifierFlagsStatic) || ast.HasSyntacticModifier(member, ast.ModifierFlagsAbstract)) {
				static = false
			}
		}
	}
	if constructors {
		if !rule.Boolean("allowConstructorOnly", false) {
			rule.context.Report(rule.context.Range(report), diagnostics.Unexpected_class_with_only_a_constructor)
		}
	} else if static && !rule.Boolean("allowStaticOnly", false) {
		rule.context.Report(rule.context.Range(report), diagnostics.Unexpected_class_with_only_static_properties)
	}
}

func (rule *typescriptNoExtraneousClassRule) Boolean(name string, fallback bool) bool {
	return helpers.BooleanOptionValue(rule.Options(), name, fallback)
}

func (rule *typescriptNoExtraneousClassRule) Options() map[string]any {
	options, _ := rule.option(0).(map[string]any)
	return options
}

func (rule *typescriptNoExtraneousClassRule) option(index int) any {
	if index < len(rule.context.Options) {
		return rule.context.Options[index]
	}
	return nil
}
