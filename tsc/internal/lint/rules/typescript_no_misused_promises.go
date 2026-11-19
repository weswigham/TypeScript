package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoMisusedPromisesRule struct {
	context Context
	checked map[*ast.Node]bool
}

func newTypeScriptNoMisusedPromises(context Context) Rule {
	rule := &typescriptNoMisusedPromisesRule{context: context, checked: make(map[*ast.Node]bool)}

	return Rule{
		Enter: rule.OnEnterNode,
		EnterKinds: []ast.Kind{
			ast.KindIfStatement,
			ast.KindWhileStatement,
			ast.KindDoStatement,
			ast.KindForStatement,
			ast.KindConditionalExpression,
			ast.KindBinaryExpression,
			ast.KindPrefixUnaryExpression,
			ast.KindCallExpression,
			ast.KindSpreadAssignment,
			ast.KindNewExpression,
			ast.KindVariableDeclaration,
			ast.KindReturnStatement,
			ast.KindPropertyAssignment,
			ast.KindShorthandPropertyAssignment,
			ast.KindMethodDeclaration,
			ast.KindJsxAttribute,
			ast.KindClassDeclaration,
			ast.KindClassExpression,
			ast.KindInterfaceDeclaration,
		},
	}
}

func (rule *typescriptNoMisusedPromisesRule) OnEnterNode(node *ast.Node) bool {
	rule.checkMisused(node)
	return true
}

func (rule *typescriptNoMisusedPromisesRule) returnsPromise(node *ast.Node, value *checker.Type) bool {
	if value == nil {
		return false
	}
	typeChecker := rule.context.GetChecker()
	if node.Kind == ast.KindSpreadElement {
		for _, part := range helpers.PromiseParts(value) {
			if typeChecker.IsArrayType(part) || checker.IsTupleType(part) {
				for _, element := range typeChecker.GetTypeArguments(part) {
					if rule.returnsPromise(node.Expression(), element) {
						return true
					}
				}
			}
		}
	}
	for _, part := range helpers.PromiseParts(typeChecker.GetApparentType(value)) {
		for _, signature := range typeChecker.GetSignaturesOfType(part, checker.SignatureKindCall) {
			if helpers.PromiseThenable(rule.context, node, typeChecker.GetReturnTypeOfSignature(signature), false) {
				return true
			}
		}
	}
	return false
}

func (rule *typescriptNoMisusedPromisesRule) returnsVoid(node *ast.Node, value *checker.Type) bool {
	if value == nil {
		return false
	}
	typeChecker := rule.context.GetChecker()
	hasVoid := false
	for _, part := range helpers.PromiseParts(value) {
		for _, signature := range typeChecker.GetSignaturesOfType(part, checker.SignatureKindCall) {
			result := typeChecker.GetReturnTypeOfSignature(signature)
			if helpers.PromiseThenable(rule.context, node, result, false) {
				return false
			}
			if result.Flags()&checker.TypeFlagsVoid != 0 {
				hasVoid = true
			}
		}
	}
	return hasVoid
}

func (rule *typescriptNoMisusedPromisesRule) voidOption(key string) bool {
	value := helpers.PromiseOptions(rule.context)["checksVoidReturn"]
	if enabled, ok := value.(bool); ok {
		return enabled
	}
	if options, ok := value.(map[string]any); ok {
		if enabled, ok := options[key].(bool); ok {
			return enabled
		}
	}
	return true
}

func (rule *typescriptNoMisusedPromisesRule) misusedConditional(node *ast.Node, test bool) {
	if node == nil {
		return
	}
	node = ast.SkipParentheses(node)
	if rule.checked[node] {
		return
	}
	rule.checked[node] = true
	if node.Kind == ast.KindBinaryExpression {
		binary := node.AsBinaryExpression()
		switch binary.OperatorToken.Kind {
		case ast.KindAmpersandAmpersandToken, ast.KindBarBarToken, ast.KindQuestionQuestionToken:
			if binary.OperatorToken.Kind != ast.KindQuestionQuestionToken || test {
				rule.misusedConditional(binary.Left, test)
			}
			if test {
				rule.misusedConditional(binary.Right, test)
			}
			return
		}
	}
	typeChecker := rule.context.GetChecker()
	value := typeChecker.GetApparentType(typeChecker.GetTypeAtLocation(node))
	always, sometimes := true, false
	var awaited, nonPromises []*checker.Type
	for _, part := range helpers.PromiseParts(value) {
		if helpers.PromiseThenable(rule.context, node, part, false) {
			sometimes = true
			if resolved := typeChecker.GetAwaitedType(part); resolved != nil {
				awaited = append(awaited, helpers.PromiseParts(resolved)...)
			} else {
				always = false
			}
		} else {
			always = false
			nonPromises = append(nonPromises, part)
		}
	}
	mode := "none"
	if options, ok := helpers.PromiseOptions(rule.context)["checksConditionals"].(map[string]any); ok {
		if option, ok := options["flagUnions"].(string); ok {
			mode = option
		}
	}
	flagged := always || mode == "all" && sometimes
	if !flagged && mode == "strict" && sometimes && len(awaited) > 0 {
		equivalent := func(left, right []*checker.Type) bool {
			for _, source := range left {
				found := false
				for _, target := range right {
					if typeChecker.IsTypeAssignableTo(source, target) && typeChecker.IsTypeAssignableTo(target, source) {
						found = true
						break
					}
				}
				if !found {
					return false
				}
			}
			return true
		}
		flagged = equivalent(awaited, nonPromises) && equivalent(nonPromises, awaited)
	}
	if flagged {
		rule.context.Report(rule.context.Range(node), diagnostics.Expected_non_Promise_value_in_a_boolean_conditional)
	}
}

func (rule *typescriptNoMisusedPromisesRule) misusedArguments(node *ast.Node) {
	if len(node.Arguments()) == 0 {
		return
	}
	typeChecker := rule.context.GetChecker()
	object, method := helpers.PromiseMember(rule.context, node.Expression())
	if method == "finally" && object != nil && helpers.PromiseBuiltin(rule.context, helpers.PromiseConstrained(rule.context, object), "Promise") {
		return
	}
	kind := checker.SignatureKindCall
	if node.Kind == ast.KindNewExpression {
		kind = checker.SignatureKindConstruct
	}
	voidIndices, promiseIndices := make(map[int]bool), make(map[int]bool)
	check := func(value *checker.Type, index int) {
		if rule.returnsPromise(node, value) {
			promiseIndices[index] = true
		} else if rule.returnsVoid(node, value) {
			voidIndices[index] = true
		}
	}
	for _, part := range helpers.PromiseParts(typeChecker.GetTypeAtLocation(node.Expression())) {
		for _, signature := range typeChecker.GetSignaturesOfType(part, kind) {
			for index, parameter := range signature.Parameters() {
				value := typeChecker.GetTypeOfSymbolAtLocation(parameter, node.Expression())
				declaration := parameter.ValueDeclaration()
				if declaration != nil && declaration.Kind == ast.KindParameter && declaration.AsParameterDeclaration().DotDotDotToken != nil {
					if typeChecker.IsArrayType(value) {
						arguments := typeChecker.GetTypeArguments(value)
						if len(arguments) > 0 {
							for position := index; position < len(node.Arguments()); position++ {
								check(arguments[0], position)
							}
						}
					} else if checker.IsTupleType(value) {
						for offset, element := range typeChecker.GetTypeArguments(value) {
							check(element, index+offset)
						}
					}
				} else {
					check(value, index)
				}
			}
		}
	}
	for index, argument := range node.Arguments() {
		check(typeChecker.GetContextualTypeForArgumentAtIndex(node, index), index)
		if voidIndices[index] && !promiseIndices[index] && rule.returnsPromise(argument, typeChecker.GetTypeAtLocation(argument)) {
			rule.context.Report(rule.context.Range(argument), diagnostics.Promise_returned_in_function_argument_where_a_void_return_was_expected)
		}
	}
}

func (rule *typescriptNoMisusedPromisesRule) checkMisused(node *ast.Node) {
	typeChecker := rule.context.GetChecker()
	if helpers.PromiseBoolean(rule.context, "checksConditionals", true) {
		switch node.Kind {
		case ast.KindIfStatement, ast.KindWhileStatement, ast.KindDoStatement:
			rule.misusedConditional(node.Expression(), true)
		case ast.KindForStatement:
			rule.misusedConditional(node.AsForStatement().Condition, true)
		case ast.KindConditionalExpression:
			rule.misusedConditional(node.AsConditionalExpression().Condition, true)
		case ast.KindBinaryExpression:
			binary := node.AsBinaryExpression()
			if binary.OperatorToken.Kind == ast.KindAmpersandAmpersandToken || binary.OperatorToken.Kind == ast.KindBarBarToken || binary.OperatorToken.Kind == ast.KindQuestionQuestionToken {
				rule.misusedConditional(node, false)
			}
		case ast.KindPrefixUnaryExpression:
			if node.AsPrefixUnaryExpression().Operator == ast.KindExclamationToken {
				rule.misusedConditional(node.AsPrefixUnaryExpression().Operand, true)
			}
		case ast.KindCallExpression:
			object, method := helpers.PromiseMember(rule.context, node.Expression())
			if object != nil && len(node.Arguments()) > 0 && (method == "every" || method == "filter" || method == "find" || method == "findIndex" || method == "findLast" || method == "findLastIndex" || method == "some") {
				array := true
				for _, part := range helpers.PromiseParts(helpers.PromiseConstrained(rule.context, object)) {
					if !typeChecker.IsArrayType(part) && !checker.IsTupleType(part) {
						array = false
					}
				}
				callback := node.Arguments()[0]
				if array && rule.returnsPromise(callback, typeChecker.GetTypeAtLocation(callback)) {
					rule.context.Report(rule.context.Range(callback), diagnostics.Expected_a_non_Promise_value_to_be_returned)
				}
			}
		}
	}
	if helpers.PromiseBoolean(rule.context, "checksSpreads", true) && node.Kind == ast.KindSpreadAssignment && helpers.PromiseThenable(rule.context, node.Expression(), typeChecker.GetTypeAtLocation(node.Expression()), false) {
		rule.context.Report(rule.context.Range(node.Expression()), diagnostics.Expected_a_non_Promise_value_to_be_spread_in_an_object)
	}
	if (node.Kind == ast.KindCallExpression || node.Kind == ast.KindNewExpression) && rule.voidOption("arguments") {
		rule.misusedArguments(node)
	}
	if node.Kind == ast.KindVariableDeclaration && rule.voidOption("variables") && node.Initializer() != nil {
		init := node.Initializer()
		variableType, initType := typeChecker.GetTypeAtLocation(node.Name()), typeChecker.GetTypeAtLocation(init)
		misused := node.Type() != nil && rule.returnsVoid(init, variableType) && rule.returnsPromise(init, initType)
		dispose := helpers.PromiseWellKnown(rule.context, initType, "dispose")
		if dispose != nil && rule.returnsPromise(init, dispose) {
			if node.Parent.Kind == ast.KindVariableDeclarationList && node.Parent.Flags&ast.NodeFlagsBlockScoped == ast.NodeFlagsUsing || node.Type() != nil && rule.returnsVoid(init, helpers.PromiseWellKnown(rule.context, variableType, "dispose")) {
				misused = true
			}
		}
		if misused {
			rule.context.Report(rule.context.Range(init), diagnostics.Promise_returning_function_provided_to_variable_where_a_void_return_was_expected)
		}
	}
	if node.Kind == ast.KindBinaryExpression && node.AsBinaryExpression().OperatorToken.Kind == ast.KindEqualsToken && rule.voidOption("variables") {
		binary := node.AsBinaryExpression()
		if rule.returnsVoid(binary.Left, typeChecker.GetTypeAtLocation(binary.Left)) && rule.returnsPromise(binary.Right, typeChecker.GetTypeAtLocation(binary.Right)) {
			rule.context.Report(rule.context.Range(binary.Right), diagnostics.Promise_returning_function_provided_to_variable_where_a_void_return_was_expected)
		}
	}
	if node.Kind == ast.KindReturnStatement && node.Expression() != nil && rule.voidOption("returns") {
		expression := node.Expression()
		if ast.FindAncestor(node.Parent, ast.IsFunctionLike) != nil && rule.returnsVoid(expression, typeChecker.GetContextualType(expression, checker.ContextFlagsNone)) && rule.returnsPromise(expression, typeChecker.GetTypeAtLocation(expression)) {
			rule.context.Report(rule.context.Range(expression), diagnostics.Promise_returning_function_provided_to_return_value_where_a_void_return_was_expected)
		}
	}
	if rule.voidOption("properties") && (node.Kind == ast.KindPropertyAssignment || node.Kind == ast.KindShorthandPropertyAssignment || node.Kind == ast.KindMethodDeclaration && node.Parent.Kind == ast.KindObjectLiteralExpression) {
		rule.misusedProperty(node)
	}
	if node.Kind == ast.KindJsxAttribute && rule.voidOption("attributes") {
		init := node.Initializer()
		if init != nil && init.Kind == ast.KindJsxExpression && init.Expression() != nil && rule.returnsVoid(init, typeChecker.GetContextualType(init, checker.ContextFlagsNone)) && rule.returnsPromise(init.Expression(), typeChecker.GetTypeAtLocation(init.Expression())) {
			rule.context.Report(rule.context.Range(init), diagnostics.Promise_returning_function_provided_to_attribute_where_a_void_return_was_expected)
		}
	}
	if rule.voidOption("inheritedMethods") && (ast.IsClassLike(node) || node.Kind == ast.KindInterfaceDeclaration) {
		rule.misusedHeritage(node)
	}
}

func (rule *typescriptNoMisusedPromisesRule) misusedProperty(node *ast.Node) {
	typeChecker := rule.context.GetChecker()
	if node.Kind == ast.KindMethodDeclaration && node.Name().Kind == ast.KindComputedPropertyName {
		return
	}
	var expression *ast.Node
	if node.Kind == ast.KindPropertyAssignment {
		expression = node.Initializer()
	}
	if node.Kind == ast.KindShorthandPropertyAssignment {
		expression = node.Name()
	}
	if node.Kind == ast.KindMethodDeclaration {
		expression = node
	}
	if expression == nil {
		return
	}
	value := typeChecker.GetTypeAtLocation(expression)
	if node.Kind == ast.KindShorthandPropertyAssignment {
		if symbol := typeChecker.GetShorthandAssignmentValueSymbol(node); symbol != nil {
			value = typeChecker.GetTypeOfSymbolAtLocation(symbol, node)
		}
	}
	contextual := typeChecker.GetContextualTypeForObjectLiteralElement(node, checker.ContextFlagsNone)
	if !rule.returnsVoid(expression, contextual) || !rule.returnsPromise(expression, value) {
		return
	}
	reportNode := expression
	if ast.IsFunctionLike(expression) && expression.Type() != nil {
		reportNode = expression.Type()
	}
	diagnosticLocation := rule.context.Range(reportNode)
	if ast.IsFunctionLike(expression) && expression.Type() == nil {
		end := expression.Body().Pos()
		if expression.Kind == ast.KindArrowFunction {
			end = expression.AsArrowFunction().EqualsGreaterThanToken.End()
		}
		diagnosticLocation = core.NewTextRange(helpers.PromiseStart(rule.context, node), end)
	}
	rule.context.Report(diagnosticLocation, diagnostics.Promise_returning_function_provided_to_property_where_a_void_return_was_expected)
}

func (rule *typescriptNoMisusedPromisesRule) misusedHeritage(node *ast.Node) {
	typeChecker := rule.context.GetChecker()
	var members []*ast.Node
	switch node.Kind {
	case ast.KindClassDeclaration:
		members = node.AsClassDeclaration().Members.Nodes
	case ast.KindClassExpression:
		members = node.AsClassExpression().Members.Nodes
	case ast.KindInterfaceDeclaration:
		members = node.AsInterfaceDeclaration().Members.Nodes
	}
	for _, member := range members {
		name := member.Name()
		if name == nil || name.Kind == ast.KindComputedPropertyName || ast.HasSyntacticModifier(member, ast.ModifierFlagsStatic) || !rule.returnsPromise(member, typeChecker.GetTypeAtLocation(member)) {
			continue
		}
		for _, kind := range []ast.Kind{ast.KindExtendsKeyword, ast.KindImplementsKeyword} {
			for _, heritage := range ast.GetHeritageElements(node, kind) {
				value := typeChecker.GetTypeAtLocation(heritage)
				property := typeChecker.GetPropertyOfType(value, name.Text())
				if property != nil && rule.returnsVoid(member, typeChecker.GetTypeOfSymbolAtLocation(property, member)) {
					rule.context.Report(rule.context.Range(member), diagnostics.Promise_returning_method_provided_where_a_void_return_was_expected_by_extended_Slashimplemented_type_0, typeChecker.TypeToString(value))
				}
			}
		}
	}
}
