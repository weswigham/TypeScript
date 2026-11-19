package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noUselessRenameRule struct {
	context             Context
	ignoreDestructuring bool
	ignoreImport        bool
	ignoreExport        bool
}

func newNoUselessRename(context Context) Rule {
	rule := &noUselessRenameRule{
		context:             context,
		ignoreDestructuring: helpers.ExpressionBooleanOption(context, "ignoreDestructuring", false),
		ignoreImport:        helpers.ExpressionBooleanOption(context, "ignoreImport", false),
		ignoreExport:        helpers.ExpressionBooleanOption(context, "ignoreExport", false),
	}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindBindingElement, ast.KindExportSpecifier, ast.KindImportSpecifier, ast.KindPropertyAssignment},
	}
}

func (rule *noUselessRenameRule) OnEnterNode(node *ast.Node) bool {
	rule.checkRename(node)
	return true
}

func (rule *noUselessRenameRule) checkRename(node *ast.Node) {
	var key, replacement, target *ast.Node
	var kind string
	defaultValue := false
	switch node.Kind {
	case ast.KindBindingElement:
		if rule.ignoreDestructuring || node.Parent.Kind != ast.KindObjectBindingPattern {
			return
		}
		key = node.AsBindingElement().PropertyName
		replacement = node.Name()
		target = replacement
		kind = "Destructuring assignment"
		defaultValue = node.Initializer() != nil
	case ast.KindPropertyAssignment:
		if rule.ignoreDestructuring || !helpers.IsDestructuringAssignmentTarget(node.Parent) {
			return
		}
		key = node.Name()
		replacement = ast.SkipParentheses(node.Initializer())
		target = replacement
		if replacement.Kind == ast.KindBinaryExpression && replacement.AsBinaryExpression().OperatorToken.Kind == ast.KindEqualsToken {
			target = ast.SkipParentheses(replacement.AsBinaryExpression().Left)
			defaultValue = true
		}
		kind = "Destructuring assignment"
	case ast.KindImportSpecifier:
		if rule.ignoreImport {
			return
		}
		key = node.AsImportSpecifier().PropertyName
		replacement = node.Name()
		target = replacement
		kind = "Import"
	case ast.KindExportSpecifier:
		if rule.ignoreExport {
			return
		}
		replacement = node.AsExportSpecifier().PropertyName
		key = node.Name()
		target = replacement
		kind = "Export"
	default:
		return
	}
	if key == nil || target == nil || (key.Kind != ast.KindIdentifier && key.Kind != ast.KindStringLiteral) || (target.Kind != ast.KindIdentifier && (kind != "Export" || target.Kind != ast.KindStringLiteral)) || key.Text() != target.Text() {
		return
	}
	diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.X_0_1_unnecessarily_renamed, kind, key.Text())
	start := scanner.GetTokenPosOfNode(node, rule.context.File, false)
	replacementStart := scanner.GetTokenPosOfNode(replacement, rule.context.File, false)
	replacementEnd := replacement.End()
	if defaultValue && node.Kind == ast.KindBindingElement {
		replacementEnd = node.End()
	}
	if defaultValue && replacement.Kind == ast.KindBinaryExpression && replacement.AsBinaryExpression().Left.Kind == ast.KindParenthesizedExpression {
		return
	}
	if helpers.HasSourceCommentBetween(rule.context, start, replacementStart) || helpers.HasSourceCommentBetween(rule.context, replacementEnd, node.End()) {
		return
	}
	text := rule.context.File.Text()[replacementStart:replacementEnd]
	if node.Kind == ast.KindImportSpecifier && node.AsImportSpecifier().IsTypeOnly || node.Kind == ast.KindExportSpecifier && node.AsExportSpecifier().IsTypeOnly {
		text = "type " + text
	}
	rule.fixRange(diagnostic, start, node.End(), text)
}

func (rule *noUselessRenameRule) fixRange(diagnostic *ast.Diagnostic, start int, end int, replacement string) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), replacement)
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("no-useless-rename", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, "no-useless-rename"), "no-useless-rename", ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "no-useless-rename")))
}
