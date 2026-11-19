package rules

import (
	"strconv"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typeScriptDotNotation struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptDotNotation(context Context) Rule {
	rule := &typeScriptDotNotation{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindPropertyAccessExpression, ast.KindElementAccessExpression},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typeScriptDotNotation) OnEnterNode(node *ast.Node) bool {
	rule.dotNotation(node)
	return true
}

func (rule *typeScriptDotNotation) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typeScriptDotNotation) fix(diagnostic *ast.Diagnostic, tracker *change.Tracker, description *ast.Diagnostic) {
	name := "@typescript-eslint/" + "dot-notation"
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), description, name, description))
}

func (rule *typeScriptDotNotation) dotNotation(node *ast.Node) {
	if node.Kind == ast.KindPropertyAccessExpression {
		access := node.AsPropertyAccessExpression()
		name := access.Name().Text()
		if helpers.SemanticMemberBoolean(rule.context, "allowKeywords", true) || !typeScriptDotNotationKeyword(name) {
			return
		}
		diagnostic := rule.context.Report(rule.context.Range(access.Name()), diagnostics.X_0_is_a_syntax_error, name)
		if rule.context.NewTracker == nil || typeScriptDotNotationComments(rule.context.File, access.Expression.End(), node.End()) || access.Expression.Kind == ast.KindIdentifier && access.Expression.Text() == "let" && access.QuestionDotToken == nil {
			return
		}
		tracker := rule.context.NewTracker()
		tracker.ReplaceNodePreservingComments(rule.context.File, node, tracker.NewElementAccessExpression(access.Expression, access.QuestionDotToken, tracker.NewStringLiteral(name, ast.TokenFlagsNone), node.Flags))
		rule.fix(diagnostic, tracker, ast.NewCompilerDiagnostic(diagnostics.X_0_is_a_syntax_error, name))
		return
	}
	if node.Kind != ast.KindElementAccessExpression {
		return
	}
	access := node.AsElementAccessExpression()
	property := ast.SkipParentheses(access.ArgumentExpression)
	name, display := "", ""
	switch property.Kind {
	case ast.KindStringLiteral:
		name = property.Text()
		display = strconv.Quote(name)
	case ast.KindNoSubstitutionTemplateLiteral:
		name = property.Text()
		display = "`" + name + "`"
	case ast.KindTrueKeyword:
		name, display = "true", "true"
	case ast.KindFalseKeyword:
		name, display = "false", "false"
	case ast.KindNullKeyword:
		name, display = "null", "null"
	default:
		return
	}
	if !scanner.IsIdentifierText(name, rule.context.File.LanguageVariant) || !helpers.SemanticMemberBoolean(rule.context, "allowKeywords", true) && typeScriptDotNotationKeyword(name) {
		return
	}
	if pattern, ok := helpers.SemanticMemberOptions(rule.context)["allowPattern"].(string); ok && pattern != "" && helpers.MatchesRegularExpression(pattern, name) {
		return
	}
	c := rule.context.GetChecker()
	value := c.GetNonNullableType(helpers.SemanticMemberConstrained(c, c.GetTypeAtLocation(access.Expression)))
	symbol := c.GetSymbolAtLocation(access.ArgumentExpression)
	if symbol == nil {
		symbol = c.GetPropertyOfType(value, name)
	}
	if symbol != nil && len(symbol.Declarations()) > 0 {
		modifiers := ast.GetCombinedModifierFlags(symbol.Declarations()[0])
		if modifiers&ast.ModifierFlagsPrivate != 0 && helpers.SemanticMemberBoolean(rule.context, "allowPrivateClassPropertyAccess", false) || modifiers&ast.ModifierFlagsProtected != 0 && helpers.SemanticMemberBoolean(rule.context, "allowProtectedClassPropertyAccess", false) {
			return
		}
	}
	allowIndex := helpers.SemanticMemberBoolean(rule.context, "allowIndexSignaturePropertyAccess", false) || rule.context.CompilerOptions != nil && rule.context.CompilerOptions.NoPropertyAccessFromIndexSignature.IsTrue()
	if symbol == nil && allowIndex {
		for _, info := range c.GetIndexInfosOfType(value) {
			if info.KeyType().Flags()&checker.TypeFlagsStringLike != 0 {
				return
			}
		}
	}
	diagnostic := rule.context.Report(rule.context.Range(property), diagnostics.X_0_is_better_written_in_dot_notation, display)
	if rule.context.NewTracker != nil && !typeScriptDotNotationComments(rule.context.File, access.Expression.End(), node.End()) {
		tracker := rule.context.NewTracker()
		receiver := access.Expression
		if receiver.Kind == ast.KindNumericLiteral {
			receiver = tracker.NewParenthesizedExpression(receiver)
		}
		tracker.ReplaceNodePreservingComments(rule.context.File, node, tracker.NewPropertyAccessExpression(receiver, access.QuestionDotToken, tracker.NewIdentifier(name), node.Flags))
		rule.fix(diagnostic, tracker, ast.NewCompilerDiagnostic(diagnostics.X_0_is_better_written_in_dot_notation, display))
	}
}

func typeScriptDotNotationKeyword(name string) bool {
	keyword := scanner.StringToToken(name)
	return keyword >= ast.KindFirstKeyword && keyword <= ast.KindLastReservedWord
}

func typeScriptDotNotationComments(file *ast.SourceFile, start, end int) bool {
	lexer := scanner.NewScanner()
	lexer.SetText(file.Text()[start:end])
	lexer.SetSkipTrivia(false)
	for kind := lexer.Scan(); kind != ast.KindEndOfFile; kind = lexer.Scan() {
		if kind == ast.KindSingleLineCommentTrivia || kind == ast.KindMultiLineCommentTrivia {
			return true
		}
	}
	return false
}
