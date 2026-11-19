package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/evaluator"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type TypeSafetyReportContext struct{ Context Context }

func TypeSafetyFunctionHead(context Context, node *ast.Node) core.TextRange {
	if node.Kind == ast.KindArrowFunction && (node.Parent == nil || node.Parent.Kind != ast.KindPropertyDeclaration && node.Parent.Kind != ast.KindPropertyAssignment) {
		arrow := node.AsArrowFunction().EqualsGreaterThanToken
		return core.NewTextRange(scanner.GetTokenPosOfNode(arrow, context.File, false), arrow.End())
	}
	start := scanner.GetTokenPosOfNode(node, context.File, false)
	if node.Parent != nil && (node.Parent.Kind == ast.KindPropertyDeclaration || node.Parent.Kind == ast.KindPropertyAssignment) {
		start = scanner.GetTokenPosOfNode(node.Parent, context.File, false)
	}
	if modifiers := node.Modifiers(); modifiers != nil {
		for _, modifier := range modifiers.Nodes {
			if modifier.Kind == ast.KindDecorator {
				start = scanner.SkipTrivia(context.File.Text(), modifier.End())
			}
		}
	}
	lexer := scanner.NewScanner()
	lexer.SetText(context.File.Text())
	lexer.ResetPos(scanner.GetTokenPosOfNode(node, context.File, false))
	if node.Name() != nil {
		lexer.ResetPos(node.Name().End())
	}
	end := start
	for token := lexer.Scan(); token != ast.KindEndOfFile && lexer.TokenStart() < node.Body().End(); token = lexer.Scan() {
		if token == ast.KindOpenParenToken {
			end = lexer.TokenStart()
			break
		}
		if node.Kind == ast.KindArrowFunction && len(node.Parameters()) == 1 && lexer.TokenStart() == scanner.GetTokenPosOfNode(node.Parameters()[0], context.File, false) {
			end = lexer.TokenStart()
			break
		}
	}
	return core.NewTextRange(start, end)
}

func (signature *TypeSafetyArgumentSignature) Next() *checker.Type {
	index := signature.index
	signature.index++
	if !signature.Consumed && index < len(signature.parameters) {
		return signature.parameters[index]
	}
	if len(signature.rest) == 0 {
		return nil
	}
	index -= len(signature.parameters)
	if signature.Consumed || index >= len(signature.rest) {
		index = len(signature.rest) - 1
	}
	return signature.rest[index]
}

func TypeSafetyAny(value *checker.Type) bool {
	return value != nil && value.Flags()&checker.TypeFlagsAny != 0
}

func TypeSafetyAssertionAny(typeValue *checker.Type) bool {
	return typeValue.Flags()&checker.TypeFlagsAny != 0
}

func TypeSafetyAssertionAnyName(typeValue *checker.Type) string {
	if TypeSafetyAssertionAny(typeValue) && typeValue.AsIntrinsicType().IntrinsicName() == "error" {
		return "error typed"
	}
	return "`any`"
}

func TypeSafetyAssertionUnsafe(typeChecker *checker.Checker, sender, receiver *checker.Type, node *ast.Node) bool {
	visited := make(map[[2]*checker.Type]bool)
	var check func(*checker.Type, *checker.Type) bool
	check = func(sender, receiver *checker.Type) bool {
		if sender == nil || receiver == nil {
			return false
		}
		if TypeSafetyAssertionAny(sender) && receiver.Flags()&checker.TypeFlagsUnknown == 0 && !TypeSafetyAssertionAny(receiver) {
			return true
		}
		pair := [2]*checker.Type{sender, receiver}
		if visited[pair] {
			return false
		}
		visited[pair] = true
		if !TypeSafetyAssertionReference(sender) || !TypeSafetyAssertionReference(receiver) || sender.Target() != receiver.Target() {
			return false
		}
		if node != nil && node.Kind == ast.KindNewExpression && node.Expression().Kind == ast.KindIdentifier && node.Expression().Text() == "Map" && len(node.Arguments()) == 0 && node.TypeArguments() == nil {
			return false
		}
		senderArgs, receiverArgs := typeChecker.GetTypeArguments(sender), typeChecker.GetTypeArguments(receiver)
		for index, argument := range senderArgs {
			if index < len(receiverArgs) && check(argument, receiverArgs[index]) {
				return true
			}
		}
		return false
	}
	return check(sender, receiver)
}

func TypeSafetyArguments(node *ast.Node) []*ast.Node {
	if node.Kind == ast.KindTaggedTemplateExpression {
		template := node.AsTaggedTemplateExpression().Template
		if template.Kind != ast.KindTemplateExpression {
			return nil
		}
		var arguments []*ast.Node
		for _, span := range template.AsTemplateExpression().TemplateSpans.Nodes {
			arguments = append(arguments, span.AsTemplateSpan().Expression)
		}
		return arguments
	}
	return node.Arguments()
}

func TypeSafetyArray(typeChecker *checker.Checker, value *checker.Type, flags checker.TypeFlags) bool {
	if value == nil || !typeChecker.IsArrayType(value) {
		return false
	}
	arguments := typeChecker.GetTypeArguments(value)
	return len(arguments) != 0 && arguments[0].Flags()&flags != 0
}

func TypeSafetyAssignment(typeChecker *checker.Checker, sender, receiver *checker.Type, node *ast.Node) bool {
	visited := make(map[[2]*checker.Type]bool)
	var check func(*checker.Type, *checker.Type) bool
	check = func(sender, receiver *checker.Type) bool {
		if sender == nil || receiver == nil {
			return false
		}
		if TypeSafetyAny(sender) {
			return !TypeSafetyUnknown(receiver) && !TypeSafetyAny(receiver)
		}
		pair := [2]*checker.Type{sender, receiver}
		if visited[pair] {
			return false
		}
		visited[pair] = true
		if !TypeSafetyReference(sender) || !TypeSafetyReference(receiver) || sender.Target() != receiver.Target() {
			return false
		}
		if node != nil && node.Kind == ast.KindNewExpression && node.Expression().Kind == ast.KindIdentifier && node.Expression().Text() == "Map" && len(node.Arguments()) == 0 && node.TypeArguments() == nil {
			return false
		}
		senderArguments, receiverArguments := typeChecker.GetTypeArguments(sender), typeChecker.GetTypeArguments(receiver)
		for index, argument := range senderArguments {
			if index < len(receiverArguments) && check(argument, receiverArguments[index]) {
				return true
			}
		}
		return false
	}
	return check(sender, receiver)
}

func TypeSafetyCallee(node *ast.Node) *ast.Node {
	if node.Kind == ast.KindTaggedTemplateExpression {
		return node.AsTaggedTemplateExpression().Tag
	}
	return node.Expression()
}

func TypeSafetyConstrain(typeChecker *checker.Checker, value *checker.Type) *checker.Type {
	if value != nil {
		if constraint := typeChecker.GetBaseConstraintOfType(value); constraint != nil {
			return constraint
		}
	}
	return value
}

func TypeSafetyDescribe(typeChecker *checker.Checker, value *checker.Type) string {
	if TypeSafetyError(value) {
		return "error typed"
	}
	return "`" + typeChecker.TypeToString(value) + "`"
}

func TypeSafetyError(value *checker.Type) bool {
	return TypeSafetyAny(value) && value.AsIntrinsicType().IntrinsicName() == "error"
}

func TypeSafetyImplicitThis(context Context, node *ast.Node) bool {
	if context.CompilerOptions != nil && context.CompilerOptions.GetStrictOptionValue(context.CompilerOptions.NoImplicitThis) {
		return false
	}
	thisNode := TypeSafetyThis(node)
	return thisNode != nil && TypeSafetyAny(TypeSafetyConstrain(context.GetChecker(), context.GetChecker().GetTypeAtLocation(thisNode)))
}

func TypeSafetyNewArgumentSignature(typeChecker *checker.Checker, node *ast.Node) TypeSafetyArgumentSignature {
	result := TypeSafetyArgumentSignature{}
	signature := typeChecker.GetResolvedSignature(node)
	if signature == nil {
		return result
	}
	result.parameters = make([]*checker.Type, 0, len(signature.Parameters()))
	for _, parameter := range signature.Parameters() {
		value := typeChecker.GetTypeOfSymbolAtLocation(parameter, node)
		var declaration *ast.Node
		if len(parameter.Declarations()) != 0 {
			declaration = parameter.Declarations()[0]
		}
		if declaration != nil && declaration.Kind == ast.KindParameter && declaration.AsParameterDeclaration().DotDotDotToken != nil {
			value = TypeSafetyConstrain(typeChecker, value)
			if checker.IsTupleType(value) {
				result.rest = typeChecker.GetTypeArguments(value)
			} else {
				element := typeChecker.GetIndexTypeOfType(value, typeChecker.GetNumberType())
				if element == nil {
					element = value
				}
				result.rest = []*checker.Type{element}
			}
			break
		}
		result.parameters = append(result.parameters, value)
	}
	return result
}

func TypeSafetyParentFunction(node *ast.Node) *ast.Node {
	for parent := node.Parent; parent != nil; parent = parent.Parent {
		if ast.IsFunctionLike(parent) {
			return parent
		}
	}
	return nil
}

func TypeSafetyReference(value *checker.Type) bool {
	return value != nil && value.Flags()&checker.TypeFlagsObject != 0 && value.ObjectFlags()&checker.ObjectFlagsReference != 0
}

type TypeSafetyArgumentSignature struct {
	parameters []*checker.Type
	rest       []*checker.Type
	index      int
	Consumed   bool
}

func TypeSafetyThis(node *ast.Node) *ast.Node {
	for node != nil {
		node = ast.SkipParentheses(node)
		if node.Kind == ast.KindThisKeyword {
			return node
		}
		if !ast.IsAccessExpression(node) && node.Kind != ast.KindCallExpression && node.Kind != ast.KindNonNullExpression {
			return nil
		}
		node = node.Expression()
	}
	return nil
}

func TypeSafetyUnknown(value *checker.Type) bool {
	return value != nil && value.Flags()&checker.TypeFlagsUnknown != 0
}

func TypeSafetyVariableTuple(value *checker.Type) bool {
	if !checker.IsTupleType(value) {
		return false
	}
	for _, flag := range value.TargetTupleType().ElementFlags() {
		if flag&checker.ElementFlagsVariable != 0 {
			return true
		}
	}
	return false
}

func TypeSafetyConstrainedNode(context Context, node *ast.Node) *checker.Type {
	typeChecker := context.GetChecker()
	valueType := typeChecker.GetTypeAtLocation(node)
	if constraint := typeChecker.GetBaseConstraintOfType(valueType); constraint != nil {
		return constraint
	}
	return valueType
}

func TypeSafetyUnionParts(valueType *checker.Type) []*checker.Type {
	if valueType.IsUnion() {
		return valueType.Types()
	}
	return []*checker.Type{valueType}
}

func TypeSafetyConstrainedAt(c *checker.Checker, node *ast.Node) *checker.Type {
	typeValue := c.GetTypeAtLocation(node)
	if constraint := c.GetBaseConstraintOfType(typeValue); constraint != nil {
		return constraint
	}
	return typeValue
}

func TypeSafetyAssertionFix(context Context, diagnostic *ast.Diagnostic, name string, start, end int, text string) {
	if context.NewTracker == nil {
		return
	}
	tracker := context.NewTracker()
	tracker.ReplaceTextRangeWithText(context.File, core.NewTextRange(start, end), text)
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("@typescript-eslint/"+name, tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Remove_unnecessary_syntax), "@typescript-eslint/"+name, ast.NewCompilerDiagnostic(diagnostics.Remove_unnecessary_syntax)))
}

func TypeSafetyAssertionFlags(typeValue *checker.Type) checker.TypeFlags {
	flags := typeValue.Flags()
	if flags&(checker.TypeFlagsUnion|checker.TypeFlagsIntersection) != 0 {
		for _, part := range typeValue.Types() {
			flags |= TypeSafetyAssertionFlags(part)
		}
	}
	return flags
}

func TypeSafetyAssertionReference(typeValue *checker.Type) bool {
	return typeValue.Flags()&checker.TypeFlagsObject != 0 && typeValue.ObjectFlags()&checker.ObjectFlagsReference != 0
}

func TypeSafetyBool(context Context, name string, fallback bool) bool {
	if value, ok := TypeSafetyOptions(context)[name].(bool); ok {
		return value
	}
	return fallback
}

func TypeSafetyConstrained(c *checker.Checker, value *checker.Type) *checker.Type {
	if constraint := c.GetBaseConstraintOfType(value); constraint != nil {
		return constraint
	}
	return value
}

func TypeSafetyHasFlag(value *checker.Type, flags checker.TypeFlags) bool {
	for _, part := range TypeSafetyUnionParts(value) {
		if part.Flags()&flags != 0 {
			return true
		}
	}
	return false
}

func TypeSafetyMember(context Context, node *ast.Node) (*ast.Node, string) {
	node = ast.SkipParentheses(node)
	switch node.Kind {
	case ast.KindPropertyAccessExpression:
		return node.Expression(), node.Name().Text()
	case ast.KindElementAccessExpression:
		argument := ast.SkipParentheses(node.AsElementAccessExpression().ArgumentExpression)
		if argument.Kind == ast.KindStringLiteral || argument.Kind == ast.KindNoSubstitutionTemplateLiteral {
			return node.Expression(), argument.Text()
		}
		if value, ok := typeSafetyStatic(context, argument).(string); ok {
			return node.Expression(), value
		}
	}
	return nil, ""
}

func TypeSafetyOptions(context Context) map[string]any {
	if len(context.Options) != 0 {
		options, _ := context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func typeSafetyStatic(context Context, node *ast.Node) any {
	c := context.GetChecker()
	seen := make(map[*ast.Symbol]bool)
	var evaluate evaluator.Evaluator
	evaluate = evaluator.NewEvaluator(func(entity, location *ast.Node) evaluator.Result {
		symbol := c.GetSymbolAtLocation(entity)
		if symbol == nil || seen[symbol] || len(symbol.Declarations()) != 1 {
			return evaluator.Result{}
		}
		declaration := symbol.Declarations()[0]
		if declaration.Kind != ast.KindVariableDeclaration || declaration.Initializer() == nil || declaration.Name().Kind != ast.KindIdentifier {
			return evaluator.Result{}
		}
		written := false
		var visit func(*ast.Node)
		visit = func(current *ast.Node) {
			if current.Kind == ast.KindIdentifier && current != declaration.Name() && ast.IsWriteAccess(current) && c.GetSymbolAtLocation(current) == symbol {
				written = true
				return
			}
			current.ForEachChild(func(child *ast.Node) bool { visit(child); return written })
		}
		visit(context.File.AsNode())
		if written {
			return evaluator.Result{}
		}
		seen[symbol] = true
		defer delete(seen, symbol)
		return evaluate(declaration.Initializer(), location)
	}, 0)
	return evaluate(node, node).Value
}
