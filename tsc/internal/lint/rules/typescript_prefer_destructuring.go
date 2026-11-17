package rules

import (
	"math"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typeScriptPreferDestructuring struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptPreferDestructuring(context Context) Rule {
	return &typeScriptPreferDestructuring{context: context, suggestions: make(map[*ast.Diagnostic][]*codefix.CodeFixAction)}
}

func (rule *typeScriptPreferDestructuring) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typeScriptPreferDestructuring) OnEnterNode(node *ast.Node) bool {
	if rule.context.GetChecker != nil {
		rule.destructuring(node)
	}
	return true
}

func (rule *typeScriptPreferDestructuring) OnExitNode(node *ast.Node) {}

func (rule *typeScriptPreferDestructuring) destructuringEnabled(declaration bool, kind string) bool {
	options := helpers.SemanticExpressionOption(rule.context, 0)
	if options == nil {
		return true
	}
	_, array := options["array"]
	_, object := options["object"]
	if !array && !object {
		name := "AssignmentExpression"
		if declaration {
			name = "VariableDeclarator"
		}
		options, _ = options[name].(map[string]any)
		if enabled, exists := options[kind]; exists {
			result, _ := enabled.(bool)
			return result
		}
		return true
	}
	enabled, _ := options[kind].(bool)
	return enabled
}

func (rule *typeScriptPreferDestructuring) iterable(value *checker.Type) bool {
	typeChecker := rule.context.GetChecker()
	if value.Flags()&checker.TypeFlagsAny != 0 {
		return true
	}
	if value.IsUnion() {
		for _, part := range value.Types() {
			if !rule.iterable(part) {
				return false
			}
		}
		return true
	}
	symbol := typeChecker.ResolveName("Symbol", nil, ast.SymbolFlagsValue, false)
	if symbol == nil {
		return false
	}
	key := typeChecker.GetTypeOfPropertyOfType(typeChecker.GetTypeOfSymbol(symbol), "iterator")
	return key != nil && key.Flags()&checker.TypeFlagsUniqueESSymbol != 0 && typeChecker.GetPropertyOfType(value, checker.GetPropertyNameFromType(key)) != nil
}

func (rule *typeScriptPreferDestructuring) commentsOutside(node, preserved *ast.Node) bool {
	lexer := scanner.NewScanner()
	lexer.SetText(rule.context.File.Text())
	lexer.SetSkipTrivia(false)
	lexer.ResetPos(helpers.SemanticExpressionStart(rule.context, node))
	for lexer.TokenStart() < node.End() {
		if preserved != nil && lexer.TokenEnd() <= helpers.SemanticExpressionStart(rule.context, preserved) && lexer.TokenFullStart() >= helpers.SemanticExpressionStart(rule.context, preserved) {
			lexer.ResetPos(preserved.End())
		}
		kind := lexer.Scan()
		if kind == ast.KindEndOfFile || lexer.TokenStart() >= node.End() {
			break
		}
		if kind == ast.KindSingleLineCommentTrivia || kind == ast.KindMultiLineCommentTrivia {
			if preserved == nil || lexer.TokenStart() < helpers.SemanticExpressionStart(rule.context, preserved) || lexer.TokenEnd() > preserved.End() {
				return true
			}
		}
	}
	return false
}

func (rule *typeScriptPreferDestructuring) destructuring(node *ast.Node) {
	var left, right *ast.Node
	declaration := node.Kind == ast.KindVariableDeclaration
	if declaration {
		if node.Parent.Flags&ast.NodeFlagsUsing != 0 {
			return
		}
		left, right = node.Name(), node.Initializer()
		if node.Type() != nil {
			enabled, _ := helpers.SemanticExpressionOption(rule.context, 1)["enforceForDeclarationWithTypeAnnotation"].(bool)
			if !enabled {
				return
			}
		}
	} else if node.Kind == ast.KindBinaryExpression && node.AsBinaryExpression().OperatorToken.Kind == ast.KindEqualsToken {
		left, right = node.AsBinaryExpression().Left, node.AsBinaryExpression().Right
	} else {
		return
	}
	if right == nil {
		return
	}
	right = ast.SkipParentheses(right)
	if right.Flags&ast.NodeFlagsOptionalChain != 0 {
		return
	}
	object, property, _, _ := helpers.SemanticExpressionMember(rule.context, right)
	if object == nil || object.Kind == ast.KindSuperKeyword || property.Kind == ast.KindPrivateIdentifier {
		return
	}
	renamed, _ := helpers.SemanticExpressionOption(rule.context, 1)["enforceForRenamedProperties"].(bool)
	if right.Kind == ast.KindElementAccessExpression && property.Kind == ast.KindNumericLiteral {
		value, known := helpers.SemanticExpressionStatic(rule.context, property, 0)
		number, numeric := value.(float64)
		if known && numeric && math.Trunc(number) == number {
			if !rule.iterable(rule.context.GetChecker().GetTypeAtLocation(object)) {
				if renamed && rule.destructuringEnabled(declaration, "object") {
					rule.context.Report(rule.context.Range(node), diagnostics.Use_0_destructuring, "object")
				}
			} else if rule.destructuringEnabled(declaration, "array") {
				rule.context.Report(rule.context.Range(node), diagnostics.Use_0_destructuring, "array")
			}
			return
		}
	}
	if !rule.destructuringEnabled(declaration, "object") {
		return
	}
	sameName := left.Kind == ast.KindIdentifier && (right.Kind == ast.KindPropertyAccessExpression && property.Kind == ast.KindIdentifier && left.Text() == property.Text() || right.Kind == ast.KindElementAccessExpression && property.Kind == ast.KindStringLiteral && left.Text() == property.Text())
	if !renamed && !sameName {
		return
	}
	diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Use_0_destructuring, "object")
	if !declaration || left.Kind != ast.KindIdentifier || node.Type() != nil || right.Kind != ast.KindPropertyAccessExpression || left.Text() != property.Text() || rule.commentsOutside(node, object) {
		return
	}
	objectText := helpers.SemanticExpressionText(rule.context, object)
	if object.Kind == ast.KindBinaryExpression && object.AsBinaryExpression().OperatorToken.Kind == ast.KindCommaToken {
		objectText = "(" + objectText + ")"
	}
	rule.replace(diagnostic, node, "{"+property.Text()+"} = "+objectText)
}

func (rule *typeScriptPreferDestructuring) action(diagnostic *ast.Diagnostic, description *ast.Diagnostic, suggestion bool, edits ...helpers.SemanticExpressionEdit) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	for _, edit := range edits {
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(edit.Start, edit.End), edit.Text)
	}
	name := "@typescript-eslint/" + "prefer-destructuring"
	action := codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), description, name, description)
	if suggestion {
		rule.suggestions[diagnostic] = append(rule.suggestions[diagnostic], action)
	} else {
		diagnostic.SetCodeFixes(action)
	}
}

func (rule *typeScriptPreferDestructuring) replace(diagnostic *ast.Diagnostic, node *ast.Node, text string) {
	description := diagnostic
	rule.action(diagnostic, description, false, helpers.SemanticExpressionEdit{Start: helpers.SemanticExpressionStart(rule.context, node), End: node.End(), Text: text})
}
