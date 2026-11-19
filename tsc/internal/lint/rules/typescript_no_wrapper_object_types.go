package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoWrapperObjectTypesRule struct {
	context Context
}

func newTypeScriptNoWrapperObjectTypes(context Context) Rule {
	rule := &typescriptNoWrapperObjectTypesRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindTypeReference, ast.KindExpressionWithTypeArguments},
	}
}

func (rule *typescriptNoWrapperObjectTypesRule) OnEnterNode(node *ast.Node) bool {
	rule.wrapper(node)
	return true
}

func (rule *typescriptNoWrapperObjectTypesRule) wrapper(node *ast.Node) {
	var name *ast.Node
	fix := false
	if node.Kind == ast.KindTypeReference {
		name = node.AsTypeReferenceNode().TypeName
		fix = true
		if node.Parent.Kind == ast.KindHeritageClause {
			fix = false
			if node.Parent.AsHeritageClause().Token == ast.KindExtendsKeyword && node.Parent.Parent.Kind != ast.KindInterfaceDeclaration {
				return
			}
		}
	} else if node.Kind == ast.KindExpressionWithTypeArguments && node.Parent.Kind == ast.KindHeritageClause {
		if node.Parent.AsHeritageClause().Token == ast.KindExtendsKeyword && node.Parent.Parent.Kind != ast.KindInterfaceDeclaration {
			return
		}
		name = node.Expression()
	}
	if name == nil || name.Kind != ast.KindIdentifier || !rule.global(name) {
		return
	}
	switch name.Text() {
	case "BigInt", "Boolean", "Number", "Object", "String", "Symbol":
		preferred := strings.ToLower(name.Text())
		diagnostic := rule.context.Report(rule.context.Range(name), diagnostics.Prefer_using_the_primitive_0_as_a_type_name_rather_than_the_upper_cased_1, preferred, name.Text())
		if fix {
			rule.fix(diagnostic, rule.Start(name), name.End(), preferred)
		}
	}
}

func (rule *typescriptNoWrapperObjectTypesRule) global(node *ast.Node) bool {
	for scope := node.Parent; scope != nil; scope = scope.Parent {
		if scope.Locals().Get(node.Text()) != nil {
			return false
		}
	}
	return true
}

func (rule *typescriptNoWrapperObjectTypesRule) fix(diagnostic *ast.Diagnostic, start, end int, text string) {
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), text)
	const name = "@typescript-eslint/no-wrapper-object-types"
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, "no-wrapper-object-types"), name, ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "no-wrapper-object-types")))
}

func (rule *typescriptNoWrapperObjectTypesRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}
