package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/regex"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noRestrictedExportsRule struct {
	context  Context
	patterns map[string]*regex.Pattern
}

func newNoRestrictedExports(context Context) Rule {
	rule := &noRestrictedExportsRule{context: context}

	return Rule{
		Enter: rule.OnEnterNode,
		EnterKinds: []ast.Kind{
			ast.KindClassDeclaration,
			ast.KindExportAssignment,
			ast.KindExportSpecifier,
			ast.KindFunctionDeclaration,
			ast.KindNamespaceExport,
			ast.KindVariableStatement,
		},
	}
}

func (rule *noRestrictedExportsRule) OnEnterNode(node *ast.Node) bool {
	rule.restrictedExport(node)

	return true
}

func (rule *noRestrictedExportsRule) exportedName(node *ast.Node, defaultMode string) {
	if node == nil {
		return
	}
	options := rule.options(0)
	name := node.Text()
	pattern, _ := options["restrictedNamedExportsPattern"].(string)
	if slices.Contains(helpers.SharedRuleStrings(options["restrictedNamedExports"]), name) || name != "default" && pattern != "" && rule.matches(pattern, name) {
		rule.context.Report(rule.context.Range(node), diagnostics.X_0_is_restricted_from_being_used_as_an_exported_name, name)
	} else if name == "default" {
		defaults, _ := options["restrictDefaultExports"].(map[string]any)
		if defaults[defaultMode] == true {
			rule.context.Report(rule.context.Range(node), diagnostics.Exporting_default_is_restricted)
		}
	}
}

func (rule *noRestrictedExportsRule) matches(pattern, value string) bool {
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

func (rule *noRestrictedExportsRule) options(index int) map[string]any {
	if index < len(rule.context.Options) {
		options, _ := rule.context.Options[index].(map[string]any)
		return options
	}
	return nil
}

func (rule *noRestrictedExportsRule) restrictedExport(node *ast.Node) {
	if node.Kind == ast.KindExportAssignment && !node.AsExportAssignment().IsExportEquals || (node.Kind == ast.KindFunctionDeclaration || node.Kind == ast.KindClassDeclaration) && ast.HasSyntacticModifier(node, ast.ModifierFlagsDefault) {
		defaults, _ := rule.options(0)["restrictDefaultExports"].(map[string]any)
		if defaults["direct"] == true {
			rule.context.Report(rule.context.Range(node), diagnostics.Exporting_default_is_restricted)
		}
		return
	}
	switch node.Kind {
	case ast.KindExportSpecifier:
		declaration := node.Parent.Parent.AsExportDeclaration()
		mode := "named"
		if declaration.ModuleSpecifier != nil {
			local := node.AsExportSpecifier().PropertyName
			if local == nil {
				local = node.Name()
			}
			mode = "namedFrom"
			if local.Text() == "default" {
				mode = "defaultFrom"
			}
		}
		rule.exportedName(node.Name(), mode)
	case ast.KindNamespaceExport:
		rule.exportedName(node.Name(), "namespaceFrom")
	case ast.KindFunctionDeclaration, ast.KindClassDeclaration:
		if ast.HasSyntacticModifier(node, ast.ModifierFlagsExport) {
			rule.exportedName(node.Name(), "")
		}
	case ast.KindVariableStatement:
		if ast.HasSyntacticModifier(node, ast.ModifierFlagsExport) {
			var names func(*ast.Node)
			names = func(name *ast.Node) {
				if name.Kind == ast.KindIdentifier {
					rule.exportedName(name, "")
					return
				}
				for _, element := range name.AsBindingPattern().Elements.Nodes {
					if element.Kind == ast.KindBindingElement {
						names(element.Name())
					}
				}
			}
			for _, declaration := range node.AsVariableStatement().DeclarationList.AsVariableDeclarationList().Declarations.Nodes {
				names(declaration.Name())
			}
		}
	}
}
