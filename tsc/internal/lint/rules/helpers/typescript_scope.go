package helpers

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type TypescriptScopeRuleContext struct {
	Context     Context
	Name        string
	model       *TsScopeModel
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

type TsScopeEdit struct {
	Start int
	End   int
	Text  string
}

func (rule *TypescriptScopeRuleContext) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *TypescriptScopeRuleContext) Options() map[string]any {
	if len(rule.Context.Options) > 0 {
		options, _ := rule.Context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func (rule *TypescriptScopeRuleContext) Boolean(name string, fallback bool) bool {
	if value, ok := rule.Options()[name].(bool); ok {
		return value
	}
	return fallback
}

func (rule *TypescriptScopeRuleContext) StringOption(name, fallback string) string {
	if value, ok := rule.Options()[name].(string); ok {
		return value
	}
	return fallback
}

func (rule *TypescriptScopeRuleContext) Mode(fallback string) string {
	if len(rule.Context.Options) > 0 {
		if value, ok := rule.Context.Options[0].(string); ok {
			return value
		}
	}
	return fallback
}

func (rule *TypescriptScopeRuleContext) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.Context.File, false)
}

func (rule *TypescriptScopeRuleContext) Text(node *ast.Node) string {
	return rule.Context.File.Text()[rule.Start(node):node.End()]
}

func (rule *TypescriptScopeRuleContext) Edits(diagnostic *ast.Diagnostic, suggestion *ast.Diagnostic, edits ...TsScopeEdit) {
	if rule.Context.NewTracker == nil || len(edits) == 0 {
		return
	}
	tracker := rule.Context.NewTracker()
	for _, edit := range edits {
		tracker.ReplaceTextRangeWithText(rule.Context.File, core.NewTextRange(edit.Start, edit.End), edit.Text)
	}
	name := "@typescript-eslint/" + rule.Name
	if suggestion != nil {
		if rule.suggestions == nil {
			rule.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
		}
		rule.suggestions[diagnostic] = append(rule.suggestions[diagnostic], codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), suggestion, "", nil))
	} else {
		diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, rule.Name), name, ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, rule.Name)))
	}
}

func (rule *TypescriptScopeRuleContext) Replace(diagnostic *ast.Diagnostic, node *ast.Node, text string, suggestion *ast.Diagnostic) {
	rule.Edits(diagnostic, suggestion, TsScopeEdit{rule.Start(node), node.End(), text})
}

func (rule *TypescriptScopeRuleContext) Bindings() *TsScopeModel {
	if rule.model == nil {
		rule.model = NewTScopeModel(rule.Context)
	}
	return rule.model
}

func (rule *TypescriptScopeRuleContext) UnpreservedComments(node *ast.Node, preserved ...*ast.Node) bool {
	lexer := scanner.GetScannerForSourceFile(rule.Context.File, rule.Start(node))
	lexer.SetSkipTrivia(false)
	for kind := lexer.Scan(); kind != ast.KindEndOfFile && lexer.TokenStart() < node.End(); kind = lexer.Scan() {
		if kind != ast.KindSingleLineCommentTrivia && kind != ast.KindMultiLineCommentTrivia {
			continue
		}
		kept := false
		for _, target := range preserved {
			if target != nil && rule.Start(target) <= lexer.TokenStart() && lexer.TokenEnd() <= target.End() {
				kept = true
			}
		}
		if !kept {
			return true
		}
	}
	return false
}

func TsScopeStrings(value any) []string {
	if values, ok := value.([]string); ok {
		return values
	}
	var values []string
	if items, ok := value.([]any); ok {
		for _, item := range items {
			if text, ok := item.(string); ok {
				values = append(values, text)
			}
		}
	}
	return values
}

func TsScopeContains(outer, inner *ast.Node) bool {
	return outer != nil && inner != nil && outer.Pos() <= inner.Pos() && inner.End() <= outer.End()
}

func TsScopeWalk(node *ast.Node, visit func(*ast.Node) bool) {
	if node != nil && visit(node) {
		node.ForEachChild(func(child *ast.Node) bool { TsScopeWalk(child, visit); return false })
	}
}

func TsScopeFunction(node *ast.Node) *ast.Node {
	for ; node != nil; node = node.Parent {
		if ast.IsFunctionLike(node) || node.Kind == ast.KindSourceFile || node.Kind == ast.KindClassStaticBlockDeclaration {
			return node
		}
	}
	return nil
}

func TsScopeTypeOnly(node *ast.Node) bool {
	for current := node; current != nil; current = current.Parent {
		switch current.Kind {
		case ast.KindExportSpecifier:
			return current.AsExportSpecifier().IsTypeOnly || current.Parent.Parent.AsExportDeclaration().IsTypeOnly
		case ast.KindTypeQuery, ast.KindInterfaceDeclaration, ast.KindTypeAliasDeclaration, ast.KindTypeParameter:
			return true
		case ast.KindExpressionWithTypeArguments:
			return current.Parent.Kind == ast.KindHeritageClause && (current.Parent.Parent.Kind == ast.KindInterfaceDeclaration || current.Parent.AsHeritageClause().Token == ast.KindImplementsKeyword)
		case ast.KindComputedPropertyName:
			return current.Parent.Kind == ast.KindPropertySignature || current.Parent.Kind == ast.KindMethodSignature
		}
		if ast.IsTypeNode(current) {
			return true
		}
		if ast.IsExpression(current) && current != node && current.Kind != ast.KindPropertyAccessExpression && current.Kind != ast.KindElementAccessExpression && current.Kind != ast.KindQualifiedName {
			return false
		}
		if ast.IsStatement(current) {
			return false
		}
	}
	return false
}

func TsScopeImport(node *ast.Node) bool {
	return slices.Contains([]ast.Kind{ast.KindImportClause, ast.KindImportSpecifier, ast.KindNamespaceImport, ast.KindImportEqualsDeclaration}, node.Kind)
}

func TsScopeInitializer(node *ast.Node) *ast.Node {
	switch node.Kind {
	case ast.KindVariableDeclaration, ast.KindParameter, ast.KindBindingElement, ast.KindEnumMember, ast.KindPropertyDeclaration, ast.KindPropertyAssignment:
		return node.Initializer()
	}
	return nil
}

func TsScopeIdentifier(node *ast.Node, name string) bool {
	return node != nil && node.Kind == ast.KindIdentifier && node.Text() == name
}

func TsScopeSignature(node *ast.Node) bool {
	return node != nil && (node.Kind == ast.KindFunctionType || node.Kind == ast.KindConstructorType || node.Kind == ast.KindMethodSignature || node.Kind == ast.KindCallSignature || node.Kind == ast.KindConstructSignature || ast.IsFunctionLike(node) && node.Body() == nil)
}

func TsScopeRootBinding(node *ast.Node) *ast.Node {
	for node.Kind == ast.KindBindingElement {
		node = node.Parent.Parent
	}
	return node
}

func TsScopeMemberName(node *ast.Node) string {
	if node == nil {
		return ""
	}
	if node.Kind == ast.KindPropertyAccessExpression {
		return node.Name().Text()
	}
	if node.Kind == ast.KindElementAccessExpression {
		key := node.AsElementAccessExpression().ArgumentExpression
		if key.Kind == ast.KindStringLiteral || key.Kind == ast.KindNoSubstitutionTemplateLiteral {
			return key.Text()
		}
	}
	return ""
}

func TsScopeImportSpecifiers(clause *ast.Node) []*ast.Node {
	var result []*ast.Node
	if clause.Name() != nil {
		result = append(result, clause)
	}
	bindings := clause.AsImportClause().NamedBindings
	if bindings != nil {
		if bindings.Kind == ast.KindNamespaceImport {
			result = append(result, bindings)
		} else {
			result = append(result, bindings.AsNamedImports().Elements.Nodes...)
		}
	}
	return result
}
