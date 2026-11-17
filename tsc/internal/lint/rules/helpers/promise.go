package helpers

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type PromiseQueryContext struct{ Context Context }

func (helper *PromiseQueryContext) Thenable(node *ast.Node, value *checker.Type, rejectable bool) bool {
	return PromiseThenable(helper.Context, node, value, rejectable)
}

func PromiseAllowed(context Context, node *ast.Node, value *checker.Type, key string, matchValue bool) bool {
	items, _ := PromiseOptions(context)[key].([]any)
	for _, item := range items {
		if promiseMatchesSpecifier(context, node, value, item, matchValue) {
			return true
		}
	}
	return false
}

func PromiseAwaitable(context Context, node *ast.Node, value *checker.Type) int {
	typeChecker := context.GetChecker()
	if constraint := typeChecker.GetBaseConstraintOfType(value); constraint != nil {
		value = constraint
	}
	if value.Flags()&(checker.TypeFlagsAny|checker.TypeFlagsUnknown|checker.TypeFlagsTypeParameter) != 0 {
		return 0
	}
	if PromiseThenable(context, node, value, false) {
		return 1
	}
	return -1
}

func PromiseBoolean(context Context, key string, fallback bool) bool {
	if value, ok := PromiseOptions(context)[key].(bool); ok {
		return value
	}
	return fallback
}

func PromiseBuiltin(context Context, value *checker.Type, name string) bool {
	return promiseBuiltinSeen(context, value, name, make(map[*checker.Type]bool))
}

func promiseBuiltinSeen(context Context, value *checker.Type, name string, seen map[*checker.Type]bool) bool {
	if value == nil || seen[value] {
		return false
	}
	seen[value] = true
	defer delete(seen, value)
	if value.IsUnion() {
		for _, part := range value.Types() {
			if !promiseBuiltinSeen(context, part, name, seen) {
				return false
			}
		}
		return true
	}
	if value.IsIntersection() {
		for _, part := range value.Types() {
			if promiseBuiltinSeen(context, part, name, seen) {
				return true
			}
		}
	}
	symbol := value.Symbol()
	if symbol != nil && symbol.Name() == name && PromiseLibrary(context, symbol) {
		return true
	}
	typeChecker := context.GetChecker()
	if value.Flags()&checker.TypeFlagsTypeParameter != 0 {
		return promiseBuiltinSeen(context, typeChecker.GetBaseConstraintOfType(value), name, seen)
	}
	if symbol != nil && symbol.Flags()&(ast.SymbolFlagsClass|ast.SymbolFlagsInterface) != 0 {
		for _, base := range typeChecker.GetBaseTypes(typeChecker.GetDeclaredTypeOfSymbol(symbol)) {
			if promiseBuiltinSeen(context, base, name, seen) {
				return true
			}
		}
	}
	if symbol != nil && value.ObjectFlags()&checker.ObjectFlagsAnonymous != 0 {
		for _, declaration := range symbol.Declarations() {
			if ast.IsClassLike(declaration) {
				for _, base := range ast.GetExtendsHeritageClauseElements(declaration) {
					if promiseBuiltinSeen(context, typeChecker.GetTypeAtLocation(ast.GetHeritageClauseElementName(base)), name, seen) {
						return true
					}
				}
			}
		}
	}
	return false
}

func PromiseCallable(context Context, value *checker.Type) bool {
	return value != nil && len(context.GetChecker().GetSignaturesOfType(value, checker.SignatureKindCall)) > 0
}

func PromiseConstrained(context Context, node *ast.Node) *checker.Type {
	checker := context.GetChecker()
	value := checker.GetTypeAtLocation(node)
	if constraint := checker.GetBaseConstraintOfType(value); constraint != nil {
		return constraint
	}
	return value
}

func PromiseHasWellKnown(context Context, value *checker.Type, name string) bool {
	for _, part := range PromiseParts(value) {
		if PromiseWellKnown(context, part, name) != nil {
			return true
		}
	}
	return false
}

func PromiseInsertOperator(context Context, tracker *change.Tracker, node *ast.Node, operator string) {
	start := PromiseStart(context, node)
	if node.Kind == ast.KindParenthesizedExpression || ast.GetExpressionPrecedence(node) > ast.OperatorPrecedenceUnary {
		PromiseReplace(context, tracker, start, start, operator+" ")
	} else {
		PromiseReplace(context, tracker, start, start, operator+" (")
		PromiseReplace(context, tracker, node.End(), node.End(), ")")
	}
}

func PromiseLibrary(context Context, symbol *ast.Symbol) bool {
	return context.GetChecker().IsLibSymbolForHoverVerbosity(symbol)
}

func promiseMatchesSpecifier(context Context, node *ast.Node, value *checker.Type, item any, matchValue bool) bool {
	if value == nil {
		return false
	}
	if value.IsUnion() {
		for _, part := range value.Types() {
			if !promiseMatchesSpecifier(context, node, part, item, matchValue) {
				return false
			}
		}
		return true
	}
	options, structured := item.(map[string]any)
	names := promiseNames(item)
	if structured {
		names = promiseNames(options["name"])
	}
	symbol := value.Symbol()
	alias := value.Alias()
	matched := false
	for _, name := range names {
		if symbol != nil && symbol.Name() == name || alias != nil && alias.Symbol().Name() == name || matchValue && node.Kind == ast.KindIdentifier && node.Text() == name {
			matched = true
		}
	}
	if matched {
		if !structured {
			return true
		}
		if symbol == nil && alias != nil {
			symbol = alias.Symbol()
		}
		from, _ := options["from"].(string)
		if matchValue && from != "package" {
			return true
		}
		if SemanticTypeSpecifierOrigin(context, symbol, options) {
			return true
		}
	}
	if value.IsIntersection() {
		for _, part := range value.Types() {
			if promiseMatchesSpecifier(context, node, part, item, matchValue) {
				return true
			}
		}
	}
	return false
}

func PromiseMember(context Context, node *ast.Node) (*ast.Node, string) {
	node = ast.SkipParentheses(node)
	if node.Kind == ast.KindPropertyAccessExpression {
		return node.Expression(), node.Name().Text()
	}
	if node.Kind == ast.KindElementAccessExpression {
		key := node.AsElementAccessExpression().ArgumentExpression
		if key != nil {
			key = ast.SkipParentheses(key)
			if key.Kind == ast.KindStringLiteral || key.Kind == ast.KindNoSubstitutionTemplateLiteral {
				return node.Expression(), key.Text()
			}
			value := context.GetChecker().GetTypeAtLocation(key)
			if value.Flags()&checker.TypeFlagsStringLiteral != 0 {
				return node.Expression(), value.AsLiteralType().Value().(string)
			}
		}
	}
	return nil, ""
}

func PromiseOptions(context Context) map[string]any {
	if len(context.Options) > 0 {
		options, _ := context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func PromiseRemoveAwait(context Context, tracker *change.Tracker, node *ast.Node) {
	start := PromiseStart(context, node)
	tokenScanner := scanner.GetScannerForSourceFile(context.File, start)
	for tokenScanner.Token() != ast.KindAwaitKeyword && tokenScanner.Token() != ast.KindEndOfFile {
		tokenScanner.Scan()
	}
	end := tokenScanner.TokenEnd()
	text := context.File.Text()
	for end < len(text) && strings.ContainsRune(" \t\r\n", rune(text[end])) {
		end++
	}
	PromiseReplace(context, tracker, tokenScanner.TokenStart(), end, "")
	if node.Kind != ast.KindAwaitExpression {
		return
	}
	expression := node.Expression()
	parent := node.Parent
	if parent != nil && (parent.Kind == ast.KindArrowFunction && parent.Body() == node || parent.Kind == ast.KindExpressionStatement) {
		first := scanner.GetScannerForSourceFile(context.File, PromiseStart(context, expression))
		if first.Token() == ast.KindOpenBraceToken || parent.Kind == ast.KindExpressionStatement && (first.Token() == ast.KindFunctionKeyword || first.Token() == ast.KindClassKeyword) {
			PromiseReplace(context, tracker, PromiseStart(context, expression), PromiseStart(context, expression), "(")
			PromiseReplace(context, tracker, expression.End(), expression.End(), ")")
		}
	}
}

func PromiseReplace(context Context, tracker *change.Tracker, start, end int, replacement string) {
	tracker.ReplaceTextRangeWithText(context.File, core.NewTextRange(start, end), replacement)
}

func promiseSomeCallable(context Context, value *checker.Type) bool {
	return slices.ContainsFunc(PromiseParts(value), func(value *checker.Type) bool { return PromiseCallable(context, value) })
}

func PromiseStart(context Context, node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, context.File, false)
}

func PromiseText(context Context, node *ast.Node) string {
	return context.File.Text()[PromiseStart(context, node):node.End()]
}

func PromiseThenable(context Context, node *ast.Node, value *checker.Type, rejectable bool) bool {
	typeChecker := context.GetChecker()
	for _, part := range PromiseParts(typeChecker.GetApparentType(value)) {
		then := typeChecker.GetPropertyOfType(part, "then")
		if then == nil {
			continue
		}
		for _, thenPart := range PromiseParts(typeChecker.GetTypeOfSymbolAtLocation(then, node)) {
			for _, signature := range typeChecker.GetSignaturesOfType(thenPart, checker.SignatureKindCall) {
				parameters := signature.Parameters()
				if len(parameters) == 0 || rejectable && len(parameters) < 2 {
					continue
				}
				if !promiseSomeCallable(context, typeChecker.GetApparentType(typeChecker.GetTypeOfSymbolAtLocation(parameters[0], node))) {
					continue
				}
				if !rejectable || promiseSomeCallable(context, typeChecker.GetApparentType(typeChecker.GetTypeOfSymbolAtLocation(parameters[1], node))) {
					return true
				}
			}
		}
	}
	return false
}

func PromiseThenableWithRestCallback(context Context, node *ast.Node, valueType *checker.Type) bool {
	typeChecker := context.GetChecker()
	for _, part := range TypeSafetyUnionParts(typeChecker.GetApparentType(valueType)) {
		then := typeChecker.GetPropertyOfType(part, "then")
		if then == nil {
			continue
		}
		for _, thenPart := range TypeSafetyUnionParts(typeChecker.GetTypeOfSymbolAtLocation(then, node)) {
			for _, signature := range typeChecker.GetSignaturesOfType(thenPart, checker.SignatureKindCall) {
				parameters := signature.Parameters()
				if len(parameters) == 0 {
					continue
				}
				parameter := parameters[0]
				callbackType := typeChecker.GetApparentType(typeChecker.GetTypeOfSymbolAtLocation(parameter, node))
				if declaration := parameter.ValueDeclaration(); declaration != nil && declaration.Kind == ast.KindParameter && declaration.AsParameterDeclaration().DotDotDotToken != nil {
					callbackType = typeChecker.GetIndexTypeOfType(callbackType, typeChecker.GetNumberType())
					if callbackType == nil {
						continue
					}
				}
				for _, callbackPart := range TypeSafetyUnionParts(callbackType) {
					if len(typeChecker.GetSignaturesOfType(callbackPart, checker.SignatureKindCall)) != 0 {
						return true
					}
				}
			}
		}
	}
	return false
}

func PromiseWellKnown(context Context, value *checker.Type, name string) *checker.Type {
	if value == nil {
		return nil
	}
	typeChecker := context.GetChecker()
	symbol := typeChecker.ResolveName("Symbol", nil, ast.SymbolFlagsValue, false)
	if symbol == nil {
		return nil
	}
	key := typeChecker.GetTypeOfPropertyOfType(typeChecker.GetTypeOfSymbol(symbol), name)
	if key == nil || key.Flags()&checker.TypeFlagsUniqueESSymbol == 0 {
		return nil
	}
	property := typeChecker.GetPropertyOfType(value, checker.GetPropertyNameFromType(key))
	if property != nil {
		return typeChecker.GetTypeOfSymbolAtLocation(property, context.File.AsNode())
	}
	return nil
}

type PromiseFunctionScope struct {
	Node  *ast.Node
	Await bool
}

func PromiseFunctionLike(node *ast.Node) bool {
	return ast.IsFunctionLike(node) && node.Body() != nil
}

func PromiseGenerator(node *ast.Node) bool {
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

func promiseNames(value any) []string {
	switch value := value.(type) {
	case string:
		return []string{value}
	case []string:
		return value
	case []any:
		var result []string
		for _, item := range value {
			if name, ok := item.(string); ok {
				result = append(result, name)
			}
		}
		return result
	}
	return nil
}

func PromiseParts(value *checker.Type) []*checker.Type {
	if value == nil {
		return nil
	}
	if value.IsUnion() {
		return value.Types()
	}
	return []*checker.Type{value}
}

func PromiseMatchesNames(c *checker.Checker, value *checker.Type, names map[string]bool, anyPart bool, seen map[*checker.Type]bool) bool {
	if TypeSafetyHasFlag(value, checker.TypeFlagsAny|checker.TypeFlagsUnknown) {
		return false
	}
	if value.ObjectFlags()&checker.ObjectFlagsReference != 0 {
		value = value.Target()
	}
	if symbol := value.Symbol(); symbol != nil && names[symbol.Name()] {
		return true
	}
	if seen[value] {
		return false
	}
	seen[value] = true
	defer delete(seen, value)
	var parts []*checker.Type
	if value.Flags()&checker.TypeFlagsUnionOrIntersection != 0 {
		parts = value.Types()
	} else if value.ObjectFlags()&checker.ObjectFlagsClassOrInterface != 0 {
		parts = c.GetBaseTypes(value)
	}
	if len(parts) == 0 {
		return false
	}
	for _, part := range parts {
		matches := PromiseMatchesNames(c, part, names, anyPart, seen)
		if matches && anyPart {
			return true
		}
		if !matches && !anyPart {
			return false
		}
	}
	return !anyPart
}

func PromiseHasThenProperty(c *checker.Checker, node *ast.Node) bool {
	for _, part := range TypeSafetyUnionParts(c.GetApparentType(c.GetTypeAtLocation(node))) {
		then := c.GetPropertyOfType(part, "then")
		if then == nil {
			continue
		}
		for _, signature := range c.GetSignaturesOfType(c.GetTypeOfSymbolAtLocation(then, node), checker.SignatureKindCall) {
			parameters := signature.Parameters()
			if len(parameters) == 0 {
				continue
			}
			for _, callback := range TypeSafetyUnionParts(c.GetTypeOfSymbolAtLocation(parameters[0], node)) {
				if len(c.GetSignaturesOfType(callback, checker.SignatureKindCall)) > 0 {
					return true
				}
			}
		}
	}
	return false
}
