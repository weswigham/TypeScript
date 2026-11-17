package rules

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typeScriptNoUnnecessaryTypeAssertion struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptNoUnnecessaryTypeAssertion(context Context) Rule {
	return &typeScriptNoUnnecessaryTypeAssertion{context: context}
}

func (rule *typeScriptNoUnnecessaryTypeAssertion) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typeScriptNoUnnecessaryTypeAssertion) OnExitNode(node *ast.Node) {}

func (rule *typeScriptNoUnnecessaryTypeAssertion) fix(diagnostic *ast.Diagnostic, name string, edits []core.TextChange, suggestion *diagnostics.Message) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	for _, edit := range edits {
		tracker.ReplaceTextRangeWithText(rule.context.File, edit.TextRange, edit.NewText)
	}
	description := ast.NewCompilerDiagnostic(diagnostics.Fix_0, name)
	if suggestion != nil {
		description = ast.NewCompilerDiagnostic(suggestion)
	}
	action := codefix.CreateCodeFixAction("@typescript-eslint/"+name, tracker.GetTextChanges(), description, "@typescript-eslint/"+name, ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, name))
	if suggestion == nil {
		diagnostic.SetCodeFixes(action)
		return
	}
	if rule.suggestions == nil {
		rule.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
	}
	rule.suggestions[diagnostic] = append(rule.suggestions[diagnostic], action)
}

func typeScriptNoUnnecessaryTypeAssertionStrings(value any) []string {
	if strings, ok := value.([]string); ok {
		return strings
	}
	var result []string
	if values, ok := value.([]any); ok {
		for _, value := range values {
			if text, ok := value.(string); ok {
				result = append(result, text)
			}
		}
	}
	return result
}

func typeScriptNoUnnecessaryTypeAssertionRegular(value *checker.Type) *checker.Type {
	if value.Flags()&checker.TypeFlagsFreshable != 0 {
		return value.AsLiteralType().RegularType()
	}
	return value
}

func typeScriptNoUnnecessaryTypeAssertionContains(c *checker.Checker, value *checker.Type, flags checker.TypeFlags) bool {
	seen := make(map[*checker.Type]bool)
	var visit func(*checker.Type, int) bool
	visit = func(value *checker.Type, depth int) bool {
		if value == nil || seen[value] || depth > 50 {
			return false
		}
		seen[value] = true
		if value.Flags()&flags != 0 {
			return true
		}
		if value.Flags()&checker.TypeFlagsUnionOrIntersection != 0 {
			for _, part := range value.Types() {
				if visit(part, depth+1) {
					return true
				}
			}
			return false
		}
		for _, argument := range typeScriptNoUnnecessaryTypeAssertionTypeArguments(c, value) {
			if visit(argument, depth+1) {
				return true
			}
		}
		for _, signature := range c.GetSignaturesOfType(value, checker.SignatureKindCall) {
			if visit(c.GetReturnTypeOfSignature(signature), depth+1) {
				return true
			}
			for _, parameter := range signature.Parameters() {
				if visit(c.GetTypeOfSymbol(parameter), depth+1) {
					return true
				}
			}
		}
		return false
	}
	return visit(value, 0)
}

func typeScriptNoUnnecessaryTypeAssertionConceptualLiteral(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	switch node.Kind {
	case ast.KindNumericLiteral, ast.KindBigIntLiteral, ast.KindStringLiteral, ast.KindTrueKeyword, ast.KindFalseKeyword, ast.KindNullKeyword, ast.KindRegularExpressionLiteral, ast.KindArrayLiteralExpression, ast.KindObjectLiteralExpression, ast.KindTemplateExpression, ast.KindNoSubstitutionTemplateLiteral, ast.KindClassExpression, ast.KindFunctionExpression, ast.KindArrowFunction, ast.KindJsxElement, ast.KindJsxSelfClosingElement, ast.KindJsxFragment:
		return true
	}
	return false
}

func typeScriptNoUnnecessaryTypeAssertionEmpty(c *checker.Checker, value *checker.Type) bool {
	return value.Flags()&checker.TypeFlagsNonPrimitive != 0 || len(c.GetPropertiesOfType(value)) == 0 && len(c.GetSignaturesOfType(value, checker.SignatureKindCall)) == 0 && len(c.GetSignaturesOfType(value, checker.SignatureKindConstruct)) == 0 && len(c.GetIndexInfosOfType(value)) == 0
}

func typeScriptNoUnnecessaryTypeAssertionSameArguments(c *checker.Checker, left, right *checker.Type) bool {
	return slices.Equal(typeScriptNoUnnecessaryTypeAssertionTypeArguments(c, left), typeScriptNoUnnecessaryTypeAssertionTypeArguments(c, right))
}

func (rule *typeScriptNoUnnecessaryTypeAssertion) unchanged(node, expression *ast.Node, uncast, cast *checker.Type) bool {
	c := rule.context.GetChecker()
	uncast, cast = typeScriptNoUnnecessaryTypeAssertionRegular(uncast), typeScriptNoUnnecessaryTypeAssertionRegular(cast)
	if uncast == cast {
		return true
	}
	if node.Type().Kind == ast.KindIntersectionType && typeScriptNoUnnecessaryTypeAssertionContains(c, cast, checker.TypeFlagsTypeVariable|checker.TypeFlagsIndex) {
		return false
	}
	if rule.context.CompilerOptions != nil && rule.context.CompilerOptions.ExactOptionalPropertyTypes == core.TSTrue && helpers.SemanticSyntaxHas(uncast, checker.TypeFlagsUndefined) && helpers.SemanticSyntaxHas(cast, checker.TypeFlagsUndefined) {
		withoutUndefined := func(value *checker.Type) []*checker.Type {
			var parts []*checker.Type
			for _, part := range helpers.SemanticSyntaxParts(value) {
				if part.Flags()&checker.TypeFlagsUndefined == 0 {
					parts = append(parts, part)
				}
			}
			return parts
		}
		return slices.Equal(withoutUndefined(uncast), withoutUndefined(cast))
	}
	hasIndex := func(value *checker.Type) bool {
		for _, part := range helpers.SemanticSyntaxParts(value) {
			if len(c.GetIndexInfosOfType(part)) > 0 {
				return true
			}
		}
		return false
	}
	if uncast.Flags()&checker.TypeFlagsNonPrimitive != 0 && cast.Flags()&checker.TypeFlagsNonPrimitive == 0 || hasIndex(uncast) != hasIndex(cast) || typeScriptNoUnnecessaryTypeAssertionContains(c, uncast, checker.TypeFlagsAny) || typeScriptNoUnnecessaryTypeAssertionContains(c, cast, checker.TypeFlagsAny) || typeScriptNoUnnecessaryTypeAssertionContains(c, cast, checker.TypeFlagsTypeVariable|checker.TypeFlagsIndex) && !typeScriptNoUnnecessaryTypeAssertionContains(c, uncast, checker.TypeFlagsTypeVariable|checker.TypeFlagsIndex) {
		return false
	}
	expression = ast.SkipParentheses(expression)
	if typeScriptNoUnnecessaryTypeAssertionConceptualLiteral(expression) {
		if expression.Kind != ast.KindObjectLiteralExpression || len(expression.AsObjectLiteralExpression().Properties.Nodes) == 0 {
			return false
		}
		for _, property := range c.GetPropertiesOfType(cast) {
			if c.GetTypeOfSymbol(property).Flags()&checker.TypeFlagsLiteral != 0 {
				return false
			}
		}
	}
	if cast.IsIntersection() && !uncast.IsIntersection() {
		if uncast.Flags()&checker.TypeFlagsTypeParameter != 0 && len(cast.Types()) == 2 && slices.Contains(cast.Types(), uncast) {
			for _, part := range cast.Types() {
				if part != uncast && typeScriptNoUnnecessaryTypeAssertionEmpty(c, part) && !typeScriptNoUnnecessaryTypeAssertionContains(c, part, checker.TypeFlagsTypeVariable|checker.TypeFlagsIndex) {
					constraint := c.GetBaseConstraintOfType(uncast)
					return constraint != nil && !c.IsNullableType(constraint)
				}
			}
		}
		return false
	}
	leftProperties, rightProperties := c.GetPropertiesOfType(uncast), c.GetPropertiesOfType(cast)
	if len(leftProperties) != len(rightProperties) || !typeScriptNoUnnecessaryTypeAssertionSameArguments(c, uncast, cast) {
		return false
	}
	for _, property := range leftProperties {
		other := c.GetPropertyOfType(cast, property.Name())
		if other == nil || c.IsReadonlySymbol(property) != c.IsReadonlySymbol(other) {
			return false
		}
	}
	return c.IsTypeAssignableTo(uncast, cast) && c.IsTypeAssignableTo(cast, uncast)
}

func typeScriptNoUnnecessaryTypeAssertionOuter(node *ast.Node) *ast.Node {
	for node.Parent != nil && node.Parent.Kind == ast.KindParenthesizedExpression {
		node = node.Parent
	}
	return node
}

func typeScriptNoUnnecessaryTypeAssertionOriginal(node *ast.Node) *ast.Node {
	for {
		node = ast.SkipParentheses(node)
		if node.Kind != ast.KindAsExpression && node.Kind != ast.KindTypeAssertionExpression {
			return node
		}
		node = node.Expression()
	}
}

func typeScriptNoUnnecessaryTypeAssertionGenericCall(c *checker.Checker, expression *ast.Node) bool {
	for {
		expression = ast.SkipParentheses(expression)
		switch expression.Kind {
		case ast.KindAwaitExpression, ast.KindNonNullExpression:
			expression = expression.Expression()
		case ast.KindBinaryExpression:
			if expression.AsBinaryExpression().OperatorToken.Kind != ast.KindCommaToken {
				return false
			}
			expression = expression.AsBinaryExpression().Right
		case ast.KindCallExpression:
			if len(expression.TypeArguments()) > 0 {
				return false
			}
			for _, signature := range c.GetSignaturesOfType(c.GetNonNullableType(c.GetTypeAtLocation(expression.Expression())), checker.SignatureKindCall) {
				if len(signature.TypeParameters()) > 0 {
					return true
				}
			}
			return false
		default:
			return false
		}
	}
}

func (rule *typeScriptNoUnnecessaryTypeAssertion) genericContext(node *ast.Node) bool {
	c := rule.context.GetChecker()
	seenFunction := false
	for current := node.Parent; current != nil; current = current.Parent {
		if current.Kind == ast.KindFunctionDeclaration {
			return false
		}
		if current.Kind == ast.KindFunctionExpression || current.Kind == ast.KindArrowFunction {
			if current.Body().Kind == ast.KindBlock || seenFunction {
				return false
			}
			seenFunction = true
		}
		if current.Kind == ast.KindCallExpression || current.Kind == ast.KindNewExpression {
			if len(current.TypeArguments()) > 0 {
				continue
			}
			if current.Kind == ast.KindCallExpression && current.Expression().Kind == ast.KindPropertyAccessExpression && slices.Contains(current.Arguments(), typeScriptNoUnnecessaryTypeAssertionOuter(node)) {
				continue
			}
			for _, signature := range c.GetSignaturesOfType(c.GetTypeAtLocation(current.Expression()), checker.SignatureKindCall) {
				if len(signature.TypeParameters()) > 0 {
					return true
				}
			}
		}
	}
	return false
}

func (rule *typeScriptNoUnnecessaryTypeAssertion) overloaded(node, expression *ast.Node) bool {
	outer := typeScriptNoUnnecessaryTypeAssertionOuter(node)
	parent := outer.Parent
	if parent == nil || parent.Kind != ast.KindCallExpression && parent.Kind != ast.KindNewExpression {
		return false
	}
	index := slices.Index(parent.Arguments(), outer)
	if index < 0 {
		return false
	}
	c := rule.context.GetChecker()
	signatures := c.GetSignaturesOfType(c.GetNonNullableType(c.GetTypeAtLocation(parent.Expression())), checker.SignatureKindCall)
	if len(signatures) <= 1 {
		return false
	}
	var first *checker.Type
	allSame, allAssignable := true, true
	for _, signature := range signatures {
		if index >= len(signature.Parameters()) {
			return true
		}
		parameter := signature.Parameters()[index]
		value := c.GetTypeOfSymbol(parameter)
		if declaration := parameter.ValueDeclaration(); declaration != nil && declaration.Kind == ast.KindParameter && declaration.AsParameterDeclaration().DotDotDotToken != nil {
			if arguments := typeScriptNoUnnecessaryTypeAssertionTypeArguments(c, value); len(arguments) > 0 {
				value = arguments[0]
			}
		}
		if first == nil {
			first = value
		} else {
			allSame = allSame && value == first
		}
		allAssignable = allAssignable && c.IsTypeAssignableTo(c.GetTypeAtLocation(expression), value)
	}
	return !allSame && !allAssignable
}

func (rule *typeScriptNoUnnecessaryTypeAssertion) skipContext(node *ast.Node, castAny bool) bool {
	outer := typeScriptNoUnnecessaryTypeAssertionOuter(node)
	parent := outer.Parent
	if parent == nil {
		return true
	}
	if castAny {
		return rule.genericContext(node) || parent.Kind == ast.KindBinaryExpression && (parent.AsBinaryExpression().OperatorToken.Kind == ast.KindBarBarToken || parent.AsBinaryExpression().OperatorToken.Kind == ast.KindAmpersandAmpersandToken || parent.AsBinaryExpression().OperatorToken.Kind == ast.KindQuestionQuestionToken)
	}
	expression := ast.SkipParentheses(node.Expression())
	if expression.Kind == ast.KindTemplateExpression || expression.Kind == ast.KindArrayLiteralExpression {
		return true
	}
	switch parent.Kind {
	case ast.KindAsExpression, ast.KindTypeAssertionExpression, ast.KindSpreadElement, ast.KindSatisfiesExpression:
		return true
	case ast.KindVariableDeclaration:
		if ast.IsBindingPattern(parent.Name()) {
			return true
		}
	case ast.KindPropertyAssignment:
		object := typeScriptNoUnnecessaryTypeAssertionOuter(parent.Parent)
		c := rule.context.GetChecker()
		if contextual := c.GetContextualType(parent.Parent, checker.ContextFlagsNone); contextual != nil && contextual.IsUnion() {
			propertyContext := c.GetContextualType(node, checker.ContextFlagsNone)
			if propertyContext == nil || c.GetNonNullableType(propertyContext).IsUnion() || !c.IsTypeAssignableTo(c.GetTypeAtLocation(node.Expression()), c.GetNonNullableType(propertyContext)) {
				return true
			}
		}
		if object.Parent != nil && (object.Parent.Kind == ast.KindSatisfiesExpression || object.Parent.Kind == ast.KindCallExpression && object.Parent.Parent != nil && object.Parent.Parent.Kind == ast.KindSatisfiesExpression) {
			return true
		}
	case ast.KindBinaryExpression:
		binary := parent.AsBinaryExpression()
		if binary.Right == outer && ast.IsAssignmentOperator(binary.OperatorToken.Kind) && (binary.OperatorToken.Kind != ast.KindEqualsToken || typeScriptNoUnnecessaryTypeAssertionOuter(parent).Parent.Kind != ast.KindExpressionStatement) {
			return true
		}
	}
	if rule.overloaded(node, node.Expression()) {
		return true
	}
	return rule.genericContext(node) && !typeScriptNoUnnecessaryTypeAssertionConceptualLiteral(typeScriptNoUnnecessaryTypeAssertionOriginal(node)) && parent.Kind != ast.KindPropertyAssignment
}

func (rule *typeScriptNoUnnecessaryTypeAssertion) genericsMismatch(uncast, contextual *checker.Type) bool {
	c := rule.context.GetChecker()
	hasGeneric := func(value *checker.Type) bool {
		for _, signature := range c.GetSignaturesOfType(value, checker.SignatureKindCall) {
			if len(signature.TypeParameters()) > 0 {
				return true
			}
		}
		return false
	}
	for _, property := range c.GetPropertiesOfType(contextual) {
		if hasGeneric(c.GetTypeOfSymbol(property)) {
			other := c.GetPropertyOfType(uncast, property.Name())
			if other == nil || !hasGeneric(c.GetTypeOfSymbol(other)) {
				return true
			}
		}
	}
	return false
}

func (rule *typeScriptNoUnnecessaryTypeAssertion) remove(diagnostic *ast.Diagnostic, node, expression *ast.Node) {
	var edits []core.TextChange
	if node.Kind == ast.KindNonNullExpression {
		edits = []core.TextChange{helpers.SemanticSyntaxEdit(node.End()-1, node.End(), "")}
	} else if expression == node.Expression() && node.Kind == ast.KindAsExpression {
		start := expression.End()
		edits = []core.TextChange{helpers.SemanticSyntaxEdit(start, node.End(), helpers.SemanticSyntaxComments(rule.context, start, node.End()))}
	} else if expression == node.Expression() && node.Kind == ast.KindTypeAssertionExpression {
		end := node.Type().End()
		lexer := scanner.NewScanner()
		lexer.SetText(rule.context.File.Text())
		lexer.ResetPos(end)
		lexer.Scan()
		end = lexer.TokenStart() + 1
		edits = []core.TextChange{helpers.SemanticSyntaxEdit(helpers.SemanticSyntaxStart(rule.context, node), end, helpers.SemanticSyntaxComments(rule.context, helpers.SemanticSyntaxStart(rule.context, node), end))}
		text := strings.TrimSpace(rule.context.File.Text()[end:node.End()])
		outer := typeScriptNoUnnecessaryTypeAssertionOuter(node)
		if outer == node && (strings.HasPrefix(text, "{") || strings.HasPrefix(text, "function") || strings.HasPrefix(text, "class")) {
			edits = append(edits, helpers.SemanticSyntaxEdit(helpers.SemanticSyntaxStart(rule.context, node), helpers.SemanticSyntaxStart(rule.context, node), "("), helpers.SemanticSyntaxEdit(node.End(), node.End(), ")"))
		}
	} else {
		text := helpers.SemanticSyntaxComments(rule.context, helpers.SemanticSyntaxStart(rule.context, node), helpers.SemanticSyntaxStart(rule.context, expression)) + helpers.SemanticSyntaxText(rule.context, expression) + helpers.SemanticSyntaxComments(rule.context, expression.End(), node.End())
		if expression.Kind == ast.KindObjectLiteralExpression || expression.Kind == ast.KindBinaryExpression || expression.Kind == ast.KindConditionalExpression {
			text = "(" + text + ")"
		}
		edits = []core.TextChange{helpers.SemanticSyntaxEdit(helpers.SemanticSyntaxStart(rule.context, node), node.End(), text)}
	}
	rule.fix(diagnostic, "no-unnecessary-type-assertion", edits, nil)
}

func (rule *typeScriptNoUnnecessaryTypeAssertion) possiblyUnassigned(expression *ast.Node, value *checker.Type) bool {
	c := rule.context.GetChecker()
	symbol := c.GetSymbolAtLocation(expression)
	if symbol == nil || len(symbol.Declarations()) == 0 {
		return true
	}
	declaration := symbol.Declarations()[0]
	if !helpers.SemanticSyntaxStrict(rule.context) || declaration.Kind != ast.KindVariableDeclaration {
		return false
	}
	if declaration.Parent.Kind == ast.KindVariableDeclarationList && declaration.Parent.Flags&ast.NodeFlagsBlockScoped == 0 && ast.GetSourceFileOfNode(declaration) == rule.context.File {
		for scope := declaration.Parent.Parent.Parent; scope != nil && !ast.IsFunctionLike(scope) && scope.Kind != ast.KindSourceFile; scope = scope.Parent {
			if scope.Kind == ast.KindBlock && !(expression.Pos() >= scope.Pos() && expression.End() <= scope.End()) {
				return true
			}
		}
	}
	return declaration.Initializer() == nil && declaration.AsVariableDeclaration().ExclamationToken == nil && declaration.Type() != nil && c.GetTypeFromTypeNode(declaration.Type()) == value && ast.GetCombinedModifierFlags(declaration)&ast.ModifierFlagsAmbient == 0
}

func (rule *typeScriptNoUnnecessaryTypeAssertion) nonNull(node *ast.Node) {
	expression := node.Expression()
	parent := typeScriptNoUnnecessaryTypeAssertionOuter(node).Parent
	message := diagnostics.This_assertion_is_unnecessary_since_it_does_not_change_the_type_of_the_expression
	if parent != nil && parent.Kind == ast.KindBinaryExpression && parent.AsBinaryExpression().OperatorToken.Kind == ast.KindEqualsToken {
		if parent.AsBinaryExpression().Left == typeScriptNoUnnecessaryTypeAssertionOuter(node) {
			diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.This_assertion_is_unnecessary_since_the_receiver_accepts_the_original_type_of_the_expression)
			rule.remove(diagnostic, node, expression)
		}
		return
	}
	c := rule.context.GetChecker()
	actual := c.GetTypeAtLocation(expression)
	constrained := actual
	if constraint := c.GetBaseConstraintOfType(actual); constraint != nil {
		constrained = constraint
	}
	if !c.IsNullableType(actual) && !c.IsNullableType(constrained) {
		if ast.SkipParentheses(expression).Kind == ast.KindIdentifier && rule.possiblyUnassigned(ast.SkipParentheses(expression), constrained) {
			return
		}
	} else {
		if actual != constrained {
			return
		}
		contextual := c.GetContextualType(node, checker.ContextFlagsNone)
		if contextual == nil || helpers.SemanticSyntaxHas(actual, checker.TypeFlagsUnknown) && !helpers.SemanticSyntaxHas(contextual, checker.TypeFlagsUnknown) {
			return
		}
		for _, flag := range []checker.TypeFlags{checker.TypeFlagsUndefined, checker.TypeFlagsNull, checker.TypeFlagsVoid} {
			if helpers.SemanticSyntaxHas(constrained, flag) && !helpers.SemanticSyntaxHas(contextual, flag) {
				return
			}
		}
		message = diagnostics.This_assertion_is_unnecessary_since_the_receiver_accepts_the_original_type_of_the_expression
	}
	diagnostic := rule.context.Report(rule.context.Range(node), message)
	rule.remove(diagnostic, node, expression)
}

func (rule *typeScriptNoUnnecessaryTypeAssertion) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindNonNullExpression {
		rule.nonNull(node)
		return true
	}
	if node.Kind != ast.KindAsExpression && node.Kind != ast.KindTypeAssertionExpression {
		return true
	}
	for _, ignored := range typeScriptNoUnnecessaryTypeAssertionStrings(helpers.SemanticSyntaxOptions(rule.context)["typesToIgnore"]) {
		if ignored == helpers.SemanticSyntaxText(rule.context, node.Type()) {
			return true
		}
	}
	c := rule.context.GetChecker()
	cast, uncast := c.GetTypeAtLocation(node), c.GetTypeAtLocation(node.Expression())
	constAssertion := node.Type().Kind == ast.KindTypeReference && node.Type().AsTypeReferenceNode().TypeName.Kind == ast.KindIdentifier && node.Type().AsTypeReferenceNode().TypeName.Text() == "const"
	literal := cast.Flags()&checker.TypeFlagsLiteral != 0
	if literal && constAssertion && !helpers.SemanticSyntaxBoolean(rule.context, "checkLiteralConstAssertions") {
		return true
	}
	expression := ast.SkipParentheses(node.Expression())
	if expression.Kind == ast.KindCallExpression {
		callee := ast.SkipParentheses(expression.Expression())
		if (callee.Kind == ast.KindFunctionExpression || callee.Kind == ast.KindArrowFunction) && callee.Type() == nil {
			if signature := c.GetSignatureFromDeclaration(callee); signature != nil && c.GetReturnTypeOfSignature(signature).Flags() == checker.TypeFlagsUndefined {
				uncast = c.GetVoidType()
			}
		}
	}
	parent := typeScriptNoUnnecessaryTypeAssertionOuter(node).Parent
	inferred := !constAssertion
	if literal {
		inferred = expression.Kind != ast.KindTemplateExpression && parent != nil && (parent.Kind == ast.KindVariableDeclaration && parent.Parent.Flags&ast.NodeFlagsConst != 0 || parent.Kind == ast.KindPropertyDeclaration && ast.GetCombinedModifierFlags(parent)&ast.ModifierFlagsReadonly != 0)
	}
	if rule.unchanged(node, node.Expression(), uncast, cast) && inferred {
		message := diagnostics.This_assertion_is_unnecessary_since_it_does_not_change_the_type_of_the_expression
		generic := typeScriptNoUnnecessaryTypeAssertionGenericCall(c, node.Expression())
		if generic {
			message = diagnostics.The_type_arguments_for_this_generic_call_may_be_inferred_from_the_assertion_Specify_them_explicitly_instead
		}
		diagnostic := rule.context.Report(rule.context.Range(node), message)
		if !generic {
			rule.remove(diagnostic, node, node.Expression())
		}
		return true
	}
	castAny := cast.Flags()&checker.TypeFlagsAny != 0 && parent != nil && parent.Kind != ast.KindAsExpression && parent.Kind != ast.KindTypeAssertionExpression && parent.Kind != ast.KindSpreadElement && parent.Kind != ast.KindSatisfiesExpression
	var contextual *checker.Type
	if !rule.skipContext(node, castAny) {
		contextual = c.GetContextualType(node, checker.ContextFlagsNone)
	}
	if contextual != nil {
		contextAny := contextual.Flags()&checker.TypeFlagsAny != 0
		callArgument := parent != nil && (parent.Kind == ast.KindCallExpression || parent.Kind == ast.KindNewExpression) && slices.Contains(parent.Arguments(), typeScriptNoUnnecessaryTypeAssertionOuter(node))
		anyAllowed := !typeScriptNoUnnecessaryTypeAssertionContains(c, contextual, checker.TypeFlagsAny)
		if contextAny {
			anyAllowed = callArgument && !typeScriptNoUnnecessaryTypeAssertionContains(c, cast, checker.TypeFlagsAny)
		}
		nullishUnion := cast.IsUnion() && (expression.Kind == ast.KindNullKeyword || expression.Kind == ast.KindIdentifier && expression.Text() == "undefined")
		phantom := rule.genericContext(node) && (typeScriptNoUnnecessaryTypeAssertionEmpty(c, uncast) && len(typeScriptNoUnnecessaryTypeAssertionTypeArguments(c, uncast)) > 0 || typeScriptNoUnnecessaryTypeAssertionEmpty(c, contextual) && len(typeScriptNoUnnecessaryTypeAssertionTypeArguments(c, contextual)) > 0) && !typeScriptNoUnnecessaryTypeAssertionSameArguments(c, uncast, contextual)
		if !constAssertion && !typeScriptNoUnnecessaryTypeAssertionContains(c, uncast, checker.TypeFlagsAny) && anyAllowed && !phantom && (castAny || !rule.genericsMismatch(uncast, contextual)) && (contextAny || c.IsTypeAssignableTo(uncast, contextual)) && !nullishUnion {
			diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.This_assertion_is_unnecessary_since_the_receiver_accepts_the_original_type_of_the_expression)
			rule.remove(diagnostic, node, node.Expression())
			return true
		}
	}
	if expression.Kind == ast.KindAsExpression || expression.Kind == ast.KindTypeAssertionExpression {
		original := typeScriptNoUnnecessaryTypeAssertionOriginal(node)
		originalType := c.GetTypeAtLocation(original)
		message := diagnostics.This_assertion_is_unnecessary_since_it_does_not_change_the_type_of_the_expression
		unnecessary := cast.Flags()&checker.TypeFlagsAny == 0 && rule.unchanged(node, expression, originalType, cast)
		if !unnecessary && contextual != nil && c.GetTypeAtLocation(expression).Flags()&checker.TypeFlagsAnyOrUnknown != 0 && c.IsTypeAssignableTo(originalType, contextual) {
			unnecessary = true
			message = diagnostics.This_assertion_is_unnecessary_since_the_receiver_accepts_the_original_type_of_the_expression
		}
		if unnecessary {
			diagnostic := rule.context.Report(rule.context.Range(node), message)
			rule.remove(diagnostic, node, original)
		}
	}
	return true
}

func typeScriptNoUnnecessaryTypeAssertionTypeArguments(c *checker.Checker, value *checker.Type) []*checker.Type {
	if arguments := value.Alias().TypeArguments(); len(arguments) != 0 {
		return arguments
	}
	if value.ObjectFlags()&checker.ObjectFlagsReference != 0 {
		return c.GetTypeArguments(value)
	}
	return nil
}
