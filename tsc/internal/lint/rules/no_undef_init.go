package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noUndefInitRule struct{ context Context }

func newNoUndefInitRule(context Context) Rule {
	return &noUndefInitRule{context: context}
}

func (rule *noUndefInitRule) OnEnterNode(node *ast.Node) bool {
	rule.undefinedInitializer(node)
	return true
}

func (rule *noUndefInitRule) OnExitNode(node *ast.Node) {}

func (rule *noUndefInitRule) undefinedInitializer(node *ast.Node) {
	if node.Kind != ast.KindVariableDeclaration || node.Initializer() == nil || node.Parent.Kind != ast.KindVariableDeclarationList || node.Parent.Flags&(ast.NodeFlagsConst|ast.NodeFlagsUsing|ast.NodeFlagsAwaitUsing) != 0 {
		return
	}
	initializer := ast.SkipParentheses(node.Initializer())
	if initializer.Kind != ast.KindIdentifier || initializer.Text() != "undefined" || !helpers.StatementBuiltin(rule.context, initializer, false) {
		return
	}
	diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.It_s_not_necessary_to_initialize_0_to_undefined, helpers.SourceNodeText(rule.context, node.Name()))
	if node.Parent.Flags&ast.NodeFlagsLet == 0 || node.Name().Kind != ast.KindIdentifier {
		return
	}
	end := node.Name().End()
	if annotation := node.AsVariableDeclaration().Type; annotation != nil {
		end = annotation.End()
	}
	if !helpers.ContainsCommentTrivia(rule.context.File.Text()[end:node.End()]) {
		rule.fix(diagnostic, end, node.End(), "", ast.NewCompilerDiagnostic(diagnostics.Remove_unnecessary_undefined_initializer))
	}
}

func (rule *noUndefInitRule) fix(diagnostic *ast.Diagnostic, start, end int, replacement string, description *ast.Diagnostic) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), replacement)
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("no-undef-init", tracker.GetTextChanges(), description, "no-undef-init", description))
}
