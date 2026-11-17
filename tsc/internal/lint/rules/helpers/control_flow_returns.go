package helpers

import (
	"strings"
	"unicode"
	"unicode/utf8"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type ReturnRuleContext struct {
	Context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
	fixOwners   map[*ast.Node]bool
}

func (rule *ReturnRuleContext) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *ReturnRuleContext) Option(name string, fallback bool) bool {
	if len(rule.Context.Options) != 0 {
		object, _ := rule.Context.Options[0].(map[string]any)
		if value, ok := object[name].(bool); ok {
			return value
		}
	}
	return fallback
}

func (rule *ReturnRuleContext) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.Context.File, false)
}

func ReturnFunction(node *ast.Node) bool {
	switch node.Kind {
	case ast.KindFunctionDeclaration, ast.KindFunctionExpression, ast.KindArrowFunction, ast.KindMethodDeclaration, ast.KindGetAccessor, ast.KindSetAccessor, ast.KindConstructor:
		return node.Body() != nil
	}
	return false
}

func ReturnWalk(node *ast.Node, visit func(*ast.Node)) {
	if node == nil || ReturnFunction(node) || node.Kind == ast.KindClassStaticBlockDeclaration {
		return
	}
	visit(node)
	node.ForEachChild(func(child *ast.Node) bool {
		ReturnWalk(child, visit)
		return false
	})
}

func ReturnProperty(node *ast.Node) (string, bool) {
	if node == nil {
		return "", false
	}
	if node.Kind == ast.KindComputedPropertyName {
		node = ast.SkipParentheses(node.Expression())
		if node.Kind != ast.KindStringLiteral && node.Kind != ast.KindNumericLiteral && node.Kind != ast.KindNoSubstitutionTemplateLiteral {
			return "", false
		}
	}
	switch node.Kind {
	case ast.KindIdentifier, ast.KindPrivateIdentifier, ast.KindStringLiteral, ast.KindNumericLiteral, ast.KindNoSubstitutionTemplateLiteral:
		return node.Text(), true
	}
	return "", false
}

func ReturnMember(node *ast.Node) (receiver *ast.Node, name string) {
	node = ast.SkipParentheses(node)
	if node.Kind == ast.KindPropertyAccessExpression {
		return node.Expression(), node.Name().Text()
	}
	if node.Kind == ast.KindElementAccessExpression {
		argument := ast.SkipParentheses(node.AsElementAccessExpression().ArgumentExpression)
		if argument.Kind == ast.KindStringLiteral || argument.Kind == ast.KindNoSubstitutionTemplateLiteral {
			return node.Expression(), argument.Text()
		}
	}
	return nil, ""
}

func ReturnOuter(node *ast.Node) *ast.Node {
	for node.Parent != nil && node.Parent.Kind == ast.KindParenthesizedExpression {
		node = node.Parent
	}
	return node
}

func ReturnGenerator(node *ast.Node) bool {
	switch node.Kind {
	case ast.KindFunctionDeclaration:
		return node.AsFunctionDeclaration().AsteriskToken != nil
	case ast.KindFunctionExpression:
		return node.AsFunctionExpression().AsteriskToken != nil
	case ast.KindMethodDeclaration:
		return node.AsMethodDeclaration().AsteriskToken != nil
	}
	return false
}

func ReturnAsync(node *ast.Node) bool {
	return ast.GetCombinedModifierFlags(node)&ast.ModifierFlagsAsync != 0
}

func ReturnName(node *ast.Node) string {
	if node.Kind == ast.KindSourceFile {
		return "program"
	}
	if node.Kind == ast.KindConstructor {
		return "constructor"
	}
	property := node
	method := node.Kind == ast.KindMethodDeclaration || node.Kind == ast.KindGetAccessor || node.Kind == ast.KindSetAccessor
	if parent := ReturnOuter(node).Parent; parent != nil && (parent.Kind == ast.KindPropertyAssignment || parent.Kind == ast.KindPropertyDeclaration) {
		property, method = parent, true
	}
	var words []string
	if ast.GetCombinedModifierFlags(property)&ast.ModifierFlagsStatic != 0 {
		words = append(words, "static")
	}
	if method && property.Name() != nil && property.Name().Kind == ast.KindPrivateIdentifier {
		words = append(words, "private")
	}
	if ReturnAsync(node) {
		words = append(words, "async")
	}
	if ReturnGenerator(node) {
		words = append(words, "generator")
	}
	switch node.Kind {
	case ast.KindGetAccessor:
		words = append(words, "getter")
	case ast.KindSetAccessor:
		words = append(words, "setter")
	default:
		if method {
			words = append(words, "method")
		} else {
			if node.Kind == ast.KindArrowFunction {
				words = append(words, "arrow")
			}
			words = append(words, "function")
		}
	}
	name := node.Name()
	if method {
		name = property.Name()
	}
	if text, ok := ReturnProperty(name); ok {
		if name.Kind == ast.KindPrivateIdentifier {
			words = append(words, text)
		} else {
			words = append(words, "'"+text+"'")
		}
	} else if method && node.Kind == ast.KindFunctionExpression && node.Name() != nil {
		words = append(words, "'"+node.Name().Text()+"'")
	}
	return strings.Join(words, " ")
}

func ReturnCapitalize(text string) string {
	first, width := utf8.DecodeRuneInString(text)
	return string(unicode.ToUpper(first)) + text[width:]
}

func (rule *ReturnRuleContext) Head(node *ast.Node, missing bool) core.TextRange {
	if node.Kind == ast.KindSourceFile {
		return core.NewTextRange(0, 0)
	}
	if node.Kind == ast.KindArrowFunction {
		token := node.AsArrowFunction().EqualsGreaterThanToken
		return core.NewTextRange(rule.Start(token), token.End())
	}
	if missing && node.Name() != nil {
		name := node.Name()
		if name.Kind == ast.KindComputedPropertyName {
			name = name.Expression()
		}
		return core.NewTextRange(rule.Start(name), name.End())
	}
	start := rule.Start(node)
	if parent := ReturnOuter(node).Parent; parent != nil && (parent.Kind == ast.KindPropertyAssignment || parent.Kind == ast.KindPropertyDeclaration) {
		start = rule.Start(parent)
	}
	return core.NewTextRange(start, node.ParameterList().Pos()-1)
}

func (rule *ReturnRuleContext) Suggestion(fixName string, report *ast.Diagnostic, message *diagnostics.Message, edit func(*change.Tracker)) {
	if rule.Context.NewTracker == nil {
		return
	}
	tracker := rule.Context.NewTracker()
	edit(tracker)
	if rule.suggestions == nil {
		rule.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
	}
	rule.suggestions[report] = append(rule.suggestions[report], codefix.CreateCodeFixAction(fixName, tracker.GetTextChanges(), ast.NewCompilerDiagnostic(message), "", nil))
}

func AnalyzeFunctionReturns(node *ast.Node) ([]*ast.Node, bool, *ReturnFlowAnalysis) {
	body := node
	if node.Kind != ast.KindSourceFile {
		body = node.Body()
	}
	flow := &ReturnFlowAnalysis{}
	completion := flow.Statement(body, nil)
	return flow.returns, CompletionHasNormal(completion), flow
}

func ReturnList(node *ast.Node) []*ast.Node {
	switch node.Kind {
	case ast.KindBlock:
		return node.AsBlock().Statements.Nodes
	case ast.KindSourceFile:
		return node.AsSourceFile().Statements.Nodes
	case ast.KindCaseClause, ast.KindDefaultClause:
		return node.AsCaseOrDefaultClause().Statements.Nodes
	}
	return nil
}

func ReturnListParent(node *ast.Node) bool {
	if node == nil {
		return false
	}
	switch node.Kind {
	case ast.KindBlock, ast.KindSourceFile, ast.KindCaseClause, ast.KindDefaultClause:
		return true
	}
	return false
}

func returnOwner(node *ast.Node) *ast.Node {
	for node.Parent != nil && !ReturnFunction(node) && node.Kind != ast.KindSourceFile {
		node = node.Parent
	}
	return node
}

func (rule *ReturnRuleContext) RetainedFix(fixName string, report *ast.Diagnostic, node *ast.Node, start, end int, replacement string) {
	if rule.Context.NewTracker == nil {
		return
	}
	owner := returnOwner(node)
	if rule.fixOwners == nil {
		rule.fixOwners = make(map[*ast.Node]bool)
	}
	if rule.fixOwners[owner] {
		return
	}
	rule.fixOwners[owner] = true
	text := rule.Context.File.Text()
	ownerStart := rule.Start(owner)
	tracker := rule.Context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.Context.File, core.NewTextRange(ownerStart, owner.End()), text[ownerStart:start]+replacement+text[end:owner.End()])
	report.SetCodeFixes(codefix.CreateCodeFixAction(fixName, tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, fixName), fixName, ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, fixName)))
}
