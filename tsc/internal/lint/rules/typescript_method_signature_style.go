package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptMethodSignatureStyleRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func newTypeScriptMethodSignatureStyle(context Context) Rule {
	rule := &typescriptMethodSignatureStyleRule{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindMethodSignature, ast.KindPropertySignature},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptMethodSignatureStyleRule) OnEnterNode(node *ast.Node) bool {
	rule.methodSignatures(node)
	return true
}

func (rule *typescriptMethodSignatureStyleRule) methodSignatures(node *ast.Node) {
	mode := helpers.StringOptionValue(rule.option(0), "property")
	method := node.Kind == ast.KindMethodSignature
	if mode == "property" && !method || mode == "method" && (node.Kind != ast.KindPropertySignature || node.Type() == nil || node.Type().Kind != ast.KindFunctionType) {
		return
	}
	message := diagnostics.Shorthand_method_signature_is_forbidden_Use_a_function_property_instead
	if mode == "method" {
		message = diagnostics.Function_property_signature_is_forbidden_Use_a_method_shorthand_instead
	}
	diagnostic := rule.context.Report(rule.context.Range(node), message)
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	var replacement *ast.Node
	if method {
		if typescriptMethodSignatureStyleThisType(node.Type()) {
			return
		}
		for parent := node.Parent; parent != nil; parent = parent.Parent {
			if parent.Kind == ast.KindModuleDeclaration {
				return
			}
		}
		var signatures []*ast.Node
		for _, member := range node.Parent.Members() {
			if member.Kind == ast.KindMethodSignature && rule.Text(member.Name()) == rule.Text(node.Name()) && (member.AsMethodSignatureDeclaration().PostfixToken != nil) == (node.AsMethodSignatureDeclaration().PostfixToken != nil) {
				if typescriptMethodSignatureStyleThisType(member.Type()) {
					return
				}
				result := member.Type()
				if result == nil {
					result = tracker.NewKeywordTypeNode(ast.KindAnyKeyword)
				}
				signatures = append(signatures, tracker.NewFunctionTypeNode(member.TypeParameterList(), member.ParameterList(), result))
				if member != node {
					tracker.DeleteNode(rule.context.File, member, change.LeadingTriviaOptionExclude, change.TrailingTriviaOptionExclude)
				}
			}
		}
		if len(signatures) == 0 {
			return
		}
		typeNode := signatures[0]
		if len(signatures) > 1 {
			for index, signature := range signatures {
				signatures[index] = tracker.NewParenthesizedTypeNode(signature)
			}
			typeNode = tracker.NewIntersectionTypeNode(tracker.NewNodeList(signatures))
		}
		replacement = tracker.NewPropertySignatureDeclaration(node.Modifiers(), node.Name(), node.AsMethodSignatureDeclaration().PostfixToken, typeNode, nil)
	} else {
		typeNode := node.Type()
		result := typeNode.Type()
		if result == nil {
			result = tracker.NewKeywordTypeNode(ast.KindAnyKeyword)
		}
		replacement = tracker.NewMethodSignatureDeclaration(nil, node.Name(), node.AsPropertySignatureDeclaration().PostfixToken, typeNode.TypeParameterList(), typeNode.ParameterList(), result)
	}
	rule.replace(tracker, node, replacement)
	if !method && ast.HasSyntacticModifier(node, ast.ModifierFlagsReadonly) {
		rule.suggest(diagnostic, tracker, ast.NewCompilerDiagnostic(diagnostics.Convert_to_a_method_signature_This_removes_the_readonly_modifier_allowing_the_member_to_be_reassigned))
	} else {
		rule.fix(diagnostic, tracker, ast.NewCompilerDiagnostic(diagnostics.Convert_method_signature_style))
	}
}

func (rule *typescriptMethodSignatureStyleRule) option(index int) any {
	if index < len(rule.context.Options) {
		return rule.context.Options[index]
	}
	return nil
}

func (rule *typescriptMethodSignatureStyleRule) Text(node *ast.Node) string {
	return rule.context.File.Text()[scanner.GetTokenPosOfNode(node, rule.context.File, false):node.End()]
}

func (rule *typescriptMethodSignatureStyleRule) replace(tracker *change.Tracker, node, replacement *ast.Node) {
	tracker.ReplaceNodePreservingComments(rule.context.File, node, replacement)
}

func (rule *typescriptMethodSignatureStyleRule) suggest(diagnostic *ast.Diagnostic, tracker *change.Tracker, description *ast.Diagnostic) {
	rule.AddSuggestion(diagnostic, "@typescript-eslint/method-signature-style", tracker.GetTextChanges(), description)
}

func (rule *typescriptMethodSignatureStyleRule) fix(diagnostic *ast.Diagnostic, tracker *change.Tracker, description *ast.Diagnostic) {
	name := "@typescript-eslint/method-signature-style"
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), description, name, description))
}

func typescriptMethodSignatureStyleThisType(node *ast.Node) bool {
	if node == nil {
		return false
	}
	if node.Kind == ast.KindThisType {
		return true
	}
	return node.ForEachChild(typescriptMethodSignatureStyleThisType)
}
