package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptStrictVoidReturnRule struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func (rule *typescriptStrictVoidReturnRule) voidFunctionType(value *checker.Type) bool {
	signatures := helpers.SemanticCallSignatures(rule.context,

		value)
	if len(signatures) == 0 {
		return false
	}
	for _, signature := range signatures {
		for _, part := range helpers.SemanticUnionParts(rule.context.GetChecker().GetReturnTypeOfSignature(signature)) {
			if part.Flags()&checker.TypeFlagsVoid == 0 {
				return false
			}
		}
	}
	return true
}

func (rule *typescriptStrictVoidReturnRule) strictExpression(node *ast.Node) bool {
	if node == nil {
		return false
	}
	node = ast.SkipParentheses(node)
	contextual := rule.context.GetChecker().GetContextualType(node, checker.ContextFlagsNone)
	if contextual != nil && rule.voidFunctionType(contextual) {
		rule.nonVoidFunction(node)
		return true
	}
	return false
}

func (rule *typescriptStrictVoidReturnRule) strictVoid(node *ast.Node) {
	switch node.Kind {
	case ast.KindArrayLiteralExpression:
		for _, element := range node.AsArrayLiteralExpression().Elements.Nodes {
			if element.Kind != ast.KindSpreadElement && element.Kind != ast.KindOmittedExpression {
				rule.strictExpression(element)
			}
		}
	case ast.KindArrowFunction:
		if node.Body().Kind != ast.KindBlock {
			rule.strictExpression(node.Body())
		}
	case ast.KindBinaryExpression:
		if ast.IsAssignmentOperator(node.AsBinaryExpression().OperatorToken.Kind) {
			rule.strictExpression(node.AsBinaryExpression().Right)
		}
	case ast.KindCallExpression, ast.KindNewExpression:
		rule.strictCall(node)
	case ast.KindReturnStatement:
		rule.strictExpression(node.Expression())
	case ast.KindVariableDeclaration:
		rule.strictExpression(node.Initializer())
	case ast.KindJsxAttribute:
		if value := node.Initializer(); value != nil && value.Kind == ast.KindJsxExpression {
			rule.strictExpression(value.Expression())
		}
	case ast.KindObjectLiteralExpression:
		for _, property := range node.AsObjectLiteralExpression().Properties.Nodes {
			switch property.Kind {
			case ast.KindPropertyAssignment:
				rule.strictExpression(property.Initializer())
			case ast.KindShorthandPropertyAssignment:
				rule.strictExpression(property.Name())
			case ast.KindMethodDeclaration:
				if property.Name().Kind != ast.KindComputedPropertyName {
					contextual := rule.context.GetChecker().GetContextualTypeForObjectLiteralElement(property, checker.ContextFlagsNone)
					if rule.voidFunctionType(contextual) {
						rule.nonVoidFunction(property)
					}
				}
			}
		}
	case ast.KindPropertyDeclaration:
		if node.Initializer() != nil && !rule.strictHeritage(node, node.Initializer()) {
			rule.strictExpression(node.Initializer())
		}
	case ast.KindMethodDeclaration, ast.KindGetAccessor, ast.KindSetAccessor:
		if node.Body() != nil && ast.IsClassLike(node.Parent) {
			rule.strictHeritage(node, node)
		}
	}
}

func (rule *typescriptStrictVoidReturnRule) strictHeritage(member, expression *ast.Node) bool {
	c := rule.context.GetChecker()
	symbol := c.GetSymbolAtLocation(member.Name())
	if symbol == nil {
		return false
	}
	for _, kind := range []ast.Kind{ast.KindExtendsKeyword, ast.KindImplementsKeyword} {
		for _, heritage := range ast.GetHeritageElements(member.Parent, kind) {
			base := c.GetTypeAtLocation(heritage)
			property := c.GetPropertyOfType(base, symbol.Name())
			if property != nil && rule.voidFunctionType(c.GetTypeOfSymbolAtLocation(property, member)) {
				rule.nonVoidFunction(expression)
				return true
			}
		}
	}
	return false
}

func (rule *typescriptStrictVoidReturnRule) strictCall(node *ast.Node) {
	c := rule.context.GetChecker()
	kind := checker.SignatureKindCall
	if node.Kind == ast.KindNewExpression {
		kind = checker.SignatureKindConstruct
	}
	var signatures []*checker.Signature
	for _, part := range helpers.SemanticUnionParts(c.GetTypeAtLocation(node.Expression())) {
		signatures = append(signatures, c.GetSignaturesOfType(part, kind)...)
	}
	for index, argument := range node.Arguments() {
		if argument.Kind == ast.KindSpreadElement {
			continue
		}
		var returns []*checker.Type
		for _, signature := range signatures {
			parameters := signature.Parameters()
			if index >= len(parameters) {
				continue
			}
			parameterType := c.GetTypeOfSymbolAtLocation(parameters[index], node.Expression())
			for _, callback := range helpers.SemanticCallSignatures(rule.context,

				parameterType) {
				returns = append(returns, c.GetReturnTypeOfSignature(callback))
			}
		}
		allVoid, someVoid, allNullish := true, false, true
		for _, result := range returns {
			nullish := result.Flags()&(checker.TypeFlagsVoidLike|checker.TypeFlagsNull|checker.TypeFlagsAny|checker.TypeFlagsNever) != 0
			allVoid = allVoid && (nullish || result.Flags()&checker.TypeFlagsTypeParameter != 0)
			someVoid = someVoid || result.Flags()&checker.TypeFlagsVoid != 0
			allNullish = allNullish && nullish
		}
		if (len(signatures) == 1 || allVoid) && rule.strictExpression(argument) {
			continue
		}
		if someVoid && allNullish {
			rule.nonVoidFunction(ast.SkipParentheses(argument))
		}
	}
}

func (rule *typescriptStrictVoidReturnRule) allowedReturnFlags() checker.TypeFlags {
	flags := checker.TypeFlagsVoid | checker.TypeFlagsNever | checker.TypeFlagsUndefined
	if helpers.SemanticBooleanOption(rule.context,

		"allowReturnAny", false) {
		flags |= checker.TypeFlagsAny
	}
	return flags
}

func strictVoidReturnSideEffect(node *ast.Node) bool {
	if node == nil {
		return false
	}
	switch node.Kind {
	case ast.KindFunctionExpression, ast.KindArrowFunction:
		return false
	case ast.KindCallExpression, ast.KindNewExpression, ast.KindTaggedTemplateExpression, ast.KindAwaitExpression, ast.KindYieldExpression, ast.KindDeleteExpression, ast.KindPostfixUnaryExpression:
		return true
	case ast.KindPrefixUnaryExpression:
		if node.AsPrefixUnaryExpression().Operator == ast.KindPlusPlusToken || node.AsPrefixUnaryExpression().Operator == ast.KindMinusMinusToken {
			return true
		}
	case ast.KindBinaryExpression:
		if ast.IsAssignmentOperator(node.AsBinaryExpression().OperatorToken.Kind) {
			return true
		}
	case ast.KindMethodDeclaration, ast.KindGetAccessor, ast.KindSetAccessor:
		return node.Name().Kind == ast.KindComputedPropertyName && strictVoidReturnSideEffect(node.Name().Expression())
	}
	return node.ForEachChild(strictVoidReturnSideEffect)
}

func (rule *typescriptStrictVoidReturnRule) nonVoidFunction(node *ast.Node) {
	c := rule.context.GetChecker()
	flags := rule.allowedReturnFlags()
	invalid := false
	for _, signature := range helpers.SemanticCallSignatures(rule.context,

		c.GetApparentType(c.GetTypeAtLocation(node))) {
		for _, part := range helpers.SemanticUnionParts(c.GetReturnTypeOfSignature(signature)) {
			invalid = invalid || part.Flags()&flags == 0
		}
	}
	if !invalid {
		return
	}
	if node.Kind != ast.KindArrowFunction && node.Kind != ast.KindFunctionExpression && node.Kind != ast.KindMethodDeclaration && node.Kind != ast.KindGetAccessor && node.Kind != ast.KindSetAccessor {
		rule.context.Report(rule.context.Range(node), diagnostics.Value_returning_function_used_in_a_context_where_a_void_function_is_expected)
		return
	}
	if node.BodyData() != nil && node.BodyData().AsteriskToken != nil {
		rule.context.Report(helpers.TypeSafetyFunctionHead(rule.context, node), diagnostics.Value_returning_function_used_in_a_context_where_a_void_function_is_expected)
		return
	}
	async := ast.HasSyntacticModifier(node, ast.ModifierFlagsAsync)
	body := ast.SkipParentheses(node.Body())
	if async {
		diagnostic := rule.context.Report(helpers.TypeSafetyFunctionHead(rule.context, node), diagnostics.Async_function_used_in_a_context_where_a_void_function_is_expected)
		if body.Kind == ast.KindBlock {
			rule.strictAsyncSuggestion(diagnostic, node)
		} else if strictVoidReturnSideEffect(body) {
			rule.strictArrowSuggestion(diagnostic, node)
		}
		return
	}
	if body.Kind != ast.KindBlock {
		diagnostic := rule.context.Report(rule.context.Range(body), diagnostics.Value_returned_in_a_context_where_a_void_return_is_expected)
		if strictVoidReturnSideEffect(body) {
			rule.strictArrowSuggestion(diagnostic, node)
		}
		return
	}
	if node.Type() != nil && node.Type().Kind != ast.KindVoidKeyword {
		rule.context.Report(rule.context.Range(node.Type()), diagnostics.Value_returning_function_used_in_a_context_where_a_void_function_is_expected)
		return
	}
	var visit func(*ast.Node)
	visit = func(statement *ast.Node) {
		if ast.IsFunctionLike(statement) || ast.IsClassLike(statement) {
			return
		}
		if statement.Kind == ast.KindReturnStatement && statement.Expression() != nil && c.GetTypeAtLocation(statement.Expression()).Flags()&flags == 0 {
			rule.context.Report(
				core.NewTextRange(helpers.SemanticTokenStart(rule.context,

					statement), helpers.SemanticTokenStart(rule.context,

					statement)+len("return")), diagnostics.Value_returned_in_a_context_where_a_void_return_is_expected)
		}
		statement.ForEachChild(func(child *ast.Node) bool { visit(child); return false })
	}
	visit(body)
}

func (rule *typescriptStrictVoidReturnRule) syncEdits(node *ast.Node) []core.TextChange {
	var edits []core.TextChange
	if ast.HasSyntacticModifier(node, ast.ModifierFlagsAsync) {
		for _, modifier := range node.Modifiers().Nodes {
			if modifier.Kind == ast.KindAsyncKeyword {
				edits = append(edits, helpers.SemanticTextEdit(helpers.SemanticTokenStart(rule.context,

					modifier), modifier.End(), ""))
				break
			}
		}
	}
	if node.Type() != nil {
		edits = append(edits, helpers.SemanticTextEdit(helpers.SemanticTokenStart(rule.context,

			node.Type()), node.Type().End(), "void"))
	}
	return edits
}

func (rule *typescriptStrictVoidReturnRule) strictArrowSuggestion(diagnostic *ast.Diagnostic, node *ast.Node) {
	body := ast.SkipParentheses(node.Body())
	text := helpers.SemanticSourceText(rule.context,

		body)
	wrap := true
	switch body.Kind {
	case ast.KindNumericLiteral, ast.KindBigIntLiteral, ast.KindStringLiteral, ast.KindRegularExpressionLiteral,
		ast.KindTrueKeyword, ast.KindFalseKeyword, ast.KindNullKeyword, ast.KindIdentifier, ast.KindTypeReference,
		ast.KindArrayLiteralExpression, ast.KindPropertyAccessExpression, ast.KindElementAccessExpression,
		ast.KindCallExpression, ast.KindNewExpression, ast.KindTaggedTemplateExpression, ast.KindExpressionWithTypeArguments:
		wrap = ast.IsOptionalChain(body) || body.Kind == ast.KindCallExpression && body.Expression().Kind == ast.KindImportKeyword
	}
	if wrap {
		text = "(" + text + ")"
	}
	edits := append(rule.syncEdits(node), helpers.SemanticTextEdit(helpers.SemanticTokenStart(rule.context,

		body), body.End(), "void "+text))
	rule.suggest(diagnostic, diagnostics.Add_a_void_operator_to_discard_the_return_value, edits...)
}

func (rule *typescriptStrictVoidReturnRule) strictAsyncSuggestion(diagnostic *ast.Diagnostic, node *ast.Node) {
	edits := rule.syncEdits(node)
	if node.Kind == ast.KindArrowFunction {
		arrow := node.AsArrowFunction().EqualsGreaterThanToken
		edits = append(edits, helpers.SemanticTextEdit(arrow.End(), arrow.End(), " void (async () =>"), helpers.SemanticTextEdit(node.End(), node.End(), ")()"))
	} else {
		body := node.Body()
		edits = append(edits, helpers.SemanticTextEdit(helpers.SemanticTokenStart(rule.context,

			body), helpers.SemanticTokenStart(rule.context,

			body), "{ (async () => "), helpers.SemanticTextEdit(body.End(), body.End(), ")(); }"))
	}
	rule.suggest(diagnostic, diagnostics.Wrap_the_function_body_in_an_async_IIFE, edits...)
}

func (rule *typescriptStrictVoidReturnRule) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typescriptStrictVoidReturnRule) action(message *diagnostics.Message, edits ...core.TextChange) *codefix.CodeFixAction {
	return codefix.CreateCodeFixAction("@typescript-eslint/strict-void-return", []codefix.FileTextChanges{{FileName: rule.context.File.FileName(), TextChanges: edits}}, ast.NewCompilerDiagnostic(message), "", nil)
}

func (rule *typescriptStrictVoidReturnRule) suggest(diagnostic *ast.Diagnostic, message *diagnostics.Message, edits ...core.TextChange) {
	if rule.suggestions == nil {
		rule.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
	}
	rule.suggestions[diagnostic] = append(rule.suggestions[diagnostic], rule.action(message, edits...))
}

func (rule *typescriptStrictVoidReturnRule) OnEnterNode(node *ast.Node) bool {
	rule.strictVoid(node)
	return true
}

func (rule *typescriptStrictVoidReturnRule) OnExitNode(node *ast.Node) {}

func newTypeScriptStrictVoidReturn(context Context) Rule {
	return &typescriptStrictVoidReturnRule{context: context}
}
