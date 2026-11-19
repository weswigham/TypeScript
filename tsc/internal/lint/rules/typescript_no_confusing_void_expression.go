package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoConfusingVoidExpressionRule struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptNoConfusingVoidExpression(context Context) Rule {
	rule := &typescriptNoConfusingVoidExpressionRule{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindCallExpression, ast.KindAwaitExpression, ast.KindTaggedTemplateExpression},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptNoConfusingVoidExpressionRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindCallExpression || node.Kind == ast.KindAwaitExpression || node.Kind == ast.KindTaggedTemplateExpression {
		rule.confusingVoid(node)
	}
	return true
}

func noConfusingVoidExpressionOuter(node *ast.Node) (*ast.Node, *ast.Node) {
	for node.Parent != nil && node.Parent.Kind == ast.KindParenthesizedExpression {
		node = node.Parent
	}
	return node, node.Parent
}

func (rule *typescriptNoConfusingVoidExpressionRule) invalidVoidAncestor(node *ast.Node) *ast.Node {
	outer, parent := noConfusingVoidExpressionOuter(node)
	if parent == nil {
		return nil
	}
	switch parent.Kind {
	case ast.KindExpressionStatement:
		return nil
	case ast.KindBinaryExpression:
		binary := parent.AsBinaryExpression()
		if binary.OperatorToken.Kind == ast.KindCommaToken {
			if binary.Left == outer {
				return nil
			}
			sequence := parent
			for sequence.Parent != nil && sequence.Parent.Kind == ast.KindBinaryExpression && sequence.Parent.AsBinaryExpression().OperatorToken.Kind == ast.KindCommaToken {
				if sequence.Parent.AsBinaryExpression().Left == sequence {
					return nil
				}
				sequence = sequence.Parent
			}
			return parent
		}
		if binary.Right == outer && (binary.OperatorToken.Kind == ast.KindAmpersandAmpersandToken || binary.OperatorToken.Kind == ast.KindBarBarToken || binary.OperatorToken.Kind == ast.KindQuestionQuestionToken) {
			return rule.invalidVoidAncestor(parent)
		}
	case ast.KindConditionalExpression:
		if parent.AsConditionalExpression().Condition != outer {
			return rule.invalidVoidAncestor(parent)
		}
	case ast.KindArrowFunction:
		if helpers.SemanticBooleanOption(rule.context,

			"ignoreArrowShorthand", false) {
			return nil
		}
	case ast.KindVoidExpression:
		if helpers.SemanticBooleanOption(rule.context,

			"ignoreVoidOperator", false) {
			return nil
		}
	}
	return parent
}

func (rule *typescriptNoConfusingVoidExpressionRule) includesVoid(value *checker.Type) bool {
	for _, part := range helpers.SemanticUnionParts(value) {
		if part.Flags() == checker.TypeFlagsVoid {
			return true
		}
	}
	return false
}

func (rule *typescriptNoConfusingVoidExpressionRule) voidReturningFunction(function *ast.Node) bool {
	c := rule.context.GetChecker()
	if function.Type() != nil {
		return rule.includesVoid(c.GetTypeFromTypeNode(function.Type()))
	}
	if function.Kind == ast.KindFunctionDeclaration {
		return false
	}
	contextual := c.GetContextualType(function, checker.ContextFlagsNone)
	for _, signature := range helpers.SemanticCallSignatures(rule.context,

		contextual) {
		if rule.includesVoid(c.GetReturnTypeOfSignature(signature)) {
			return true
		}
	}
	return false
}

func (rule *typescriptNoConfusingVoidExpressionRule) canDiscardReturn(function, target *ast.Node) bool {
	if function == nil {
		return false
	}
	c := rule.context.GetChecker()
	if helpers.SemanticConstrainedType(rule.context,

		c.GetTypeAtLocation(target)).Flags()&checker.TypeFlagsVoidLike == 0 {
		return false
	}
	if function.Type() == nil {
		return true
	}
	declared := c.GetTypeFromTypeNode(function.Type())
	if ast.HasSyntacticModifier(function, ast.ModifierFlagsAsync) {
		if awaited := c.GetAwaitedType(declared); awaited != nil {
			declared = awaited
		}
	}
	for _, part := range helpers.SemanticUnionParts(declared) {
		if part.Flags()&(checker.TypeFlagsAny|checker.TypeFlagsVoidLike) != 0 {
			return true
		}
	}
	return false
}

func (rule *typescriptNoConfusingVoidExpressionRule) confusingVoid(node *ast.Node) {
	ancestor := rule.invalidVoidAncestor(node)
	if ancestor == nil || helpers.SemanticConstrainedType(rule.context,

		rule.context.GetChecker().GetTypeAtLocation(node)).Flags()&checker.TypeFlagsVoidLike == 0 {
		return
	}
	message := diagnostics.Placing_a_void_expression_inside_another_expression_is_forbidden_Move_it_to_its_own_statement_instead
	var edits []core.TextChange
	wrap := helpers.SemanticTextEdit(helpers.SemanticTokenStart(rule.context,

		node), node.End(), "void "+helpers.SemanticSourceText(rule.context,

		node))
	suggestion := false
	switch ancestor.Kind {
	case ast.KindArrowFunction:
		if helpers.SemanticBooleanOption(rule.context,

			"ignoreVoidReturningFunctions", false) && rule.voidReturningFunction(ancestor) {
			return
		}
		message = diagnostics.Returning_a_void_expression_from_an_arrow_function_shorthand_is_forbidden_Please_add_braces_to_the_arrow_function
		if helpers.SemanticBooleanOption(rule.context,

			"ignoreVoidOperator", false) {
			message = diagnostics.Void_expressions_returned_from_an_arrow_function_shorthand_must_be_marked_explicitly_with_the_void_operator
			edits = []core.TextChange{wrap}
		} else if rule.canDiscardReturn(ancestor, ancestor.Body()) {
			body := ast.SkipParentheses(ancestor.Body())
			arrow := ancestor.AsArrowFunction().EqualsGreaterThanToken
			edits = []core.TextChange{helpers.SemanticTextEdit(arrow.End(), helpers.SemanticTokenStart(rule.context,

				body), " { "), helpers.SemanticTextEdit(body.End(), ancestor.End(), "; }")}
		}
	case ast.KindReturnStatement:
		function := ast.FindAncestor(ancestor.Parent, ast.IsFunctionLike)
		if helpers.SemanticBooleanOption(rule.context,

			"ignoreVoidReturningFunctions", false) && function != nil && rule.voidReturningFunction(function) {
			return
		}
		message = diagnostics.Returning_a_void_expression_from_a_function_is_forbidden_Please_move_it_before_the_return_statement
		block := ancestor.Parent
		last := block.Kind == ast.KindBlock && block.Parent != nil && ast.IsFunctionLike(block.Parent) && block.Parent.Body() == block && len(block.Statements()) > 0 && block.Statements()[len(block.Statements())-1] == ancestor
		if last {
			message = diagnostics.Returning_a_void_expression_from_a_function_is_forbidden_Please_remove_the_return_statement
		}
		if helpers.SemanticBooleanOption(rule.context,

			"ignoreVoidOperator", false) {
			message = diagnostics.Void_expressions_returned_from_a_function_must_be_marked_explicitly_with_the_void_operator
			edits = []core.TextChange{wrap}
		} else if !last || rule.canDiscardReturn(function, ancestor.Expression()) {
			argument := ast.SkipParentheses(ancestor.Expression())
			text := helpers.SemanticSourceText(rule.context,

				argument) + ";"
			if text[0] == '(' || text[0] == '[' || text[0] == '`' {
				text = ";" + text
			}
			if !last {
				text += " return;"
				if block.Kind != ast.KindBlock {
					text = "{ " + text + " }"
				}
			}
			edits = []core.TextChange{helpers.SemanticTextEdit(helpers.SemanticTokenStart(rule.context,

				ancestor), ancestor.End(), text)}
		}
	default:
		if helpers.SemanticBooleanOption(rule.context,

			"ignoreVoidOperator", false) {
			message = diagnostics.Void_expressions_used_inside_another_expression_must_be_moved_to_its_own_statement_or_marked_explicitly_with_the_void_operator
			edits = []core.TextChange{wrap}
			suggestion = true
		}
	}
	diagnostic := rule.context.Report(rule.context.Range(node), message)
	if len(edits) > 0 {
		if suggestion {
			rule.suggest(diagnostic, diagnostics.Mark_with_an_explicit_void_operator, edits...)
		} else {
			diagnostic.SetCodeFixes(rule.action(message, edits...))
		}
	}
}

func (rule *typescriptNoConfusingVoidExpressionRule) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typescriptNoConfusingVoidExpressionRule) action(message *diagnostics.Message, edits ...core.TextChange) *codefix.CodeFixAction {
	return codefix.CreateCodeFixAction("@typescript-eslint/no-confusing-void-expression", []codefix.FileTextChanges{{FileName: rule.context.File.FileName(), TextChanges: edits}}, ast.NewCompilerDiagnostic(message), "", nil)
}

func (rule *typescriptNoConfusingVoidExpressionRule) suggest(diagnostic *ast.Diagnostic, message *diagnostics.Message, edits ...core.TextChange) {
	if rule.suggestions == nil {
		rule.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
	}
	rule.suggestions[diagnostic] = append(rule.suggestions[diagnostic], rule.action(message, edits...))
}
