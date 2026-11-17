package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/parser"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typeScriptNoDeprecated struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptNoDeprecated(context Context) Rule {
	return &typeScriptNoDeprecated{context: context}
}

func (rule *typeScriptNoDeprecated) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typeScriptNoDeprecated) OnEnterNode(node *ast.Node) bool {
	rule.deprecated(node)
	return true
}

func (rule *typeScriptNoDeprecated) OnExitNode(node *ast.Node) {}

func typeScriptNoDeprecatedDeclarationDeprecation(declaration *ast.Node) (string, bool) {
	if declaration == nil || declaration.Flags&ast.NodeFlagsJSDoc != 0 {
		return "", false
	}
	for current := declaration; current != nil; current = ast.GetNextJSDocCommentLocation(current) {
		comments := current.JSDoc(nil)
		if len(comments) == 0 && current.Flags&(ast.NodeFlagsHasJSDoc|ast.NodeFlagsPossiblyContainsDeprecatedTag) == ast.NodeFlagsHasJSDoc|ast.NodeFlagsPossiblyContainsDeprecatedTag {
			file := ast.GetSourceFileOfNode(current)
			if file != nil {
				trivia := file.Text()[current.Pos():scanner.GetTokenPosOfNode(current, file, false)]
				parsed := parser.ParseSourceFile(ast.SourceFileParseOptions{FileName: "/deprecation.ts"}, trivia+"const declaration = 0;", core.ScriptKindTS)
				comments = parsed.Statements.Nodes[0].JSDoc(parsed)
			}
		}
		if len(comments) == 0 {
			continue
		}
		tags := comments[len(comments)-1].AsJSDoc().Tags
		if tags == nil {
			return "", false
		}
		hasTypedef, hasParameter := false, false
		for _, tag := range tags.Nodes {
			hasTypedef = hasTypedef || tag.Kind == ast.KindJSDocTypedefTag || tag.Kind == ast.KindJSDocCallbackTag
			hasParameter = hasParameter || tag.Kind == ast.KindJSDocParameterTag || tag.Kind == ast.KindJSDocReturnTag
		}
		if hasTypedef && !hasParameter {
			return "", false
		}
		for _, tag := range tags.Nodes {
			if tag.Kind == ast.KindJSDocDeprecatedTag {
				return scanner.GetTextOfJSDocComment(tag.CommentList()), true
			}
		}
		return "", false
	}
	return "", false
}

func (rule *typeScriptNoDeprecated) symbolDeprecation(symbol *ast.Symbol) (string, bool) {
	if symbol == nil {
		return "", false
	}
	for _, root := range rule.context.GetChecker().GetRootSymbols(symbol) {
		for _, declaration := range root.Declarations() {
			if reason, deprecated := typeScriptNoDeprecatedDeclarationDeprecation(declaration); deprecated {
				return reason, true
			}
		}
	}
	return "", false
}

func (rule *typeScriptNoDeprecated) aliasDeprecation(symbol *ast.Symbol, includeTarget bool) (string, bool) {
	seen := make(map[*ast.Symbol]bool)
	for symbol != nil && !seen[symbol] {
		seen[symbol] = true
		if symbol.Flags()&ast.SymbolFlagsAlias == 0 {
			if includeTarget {
				return rule.symbolDeprecation(symbol)
			}
			return "", false
		}
		if reason, deprecated := rule.symbolDeprecation(symbol); deprecated {
			return reason, true
		}
		if len(symbol.Declarations()) == 0 {
			return "", false
		}
		symbol = rule.context.GetChecker().GetImmediateAliasedSymbol(symbol)
	}
	return "", false
}

func (rule *typeScriptNoDeprecated) callDeprecation(node *ast.Node) (string, bool) {
	typeChecker := rule.context.GetChecker()
	symbol := typeChecker.GetSymbolAtLocation(node)
	resolved := symbol
	if resolved != nil && resolved.Flags()&ast.SymbolFlagsAlias != 0 {
		resolved = typeChecker.GetAliasedSymbol(resolved)
	}
	checkTarget := true
	if resolved != nil && len(resolved.Declarations()) > 0 {
		switch resolved.Declarations()[0].Kind {
		case ast.KindMethodDeclaration, ast.KindFunctionDeclaration, ast.KindMethodSignature:
			checkTarget = false
		}
	}
	if reason, deprecated := rule.aliasDeprecation(symbol, checkTarget); deprecated {
		return reason, true
	}
	if signature := typeChecker.GetResolvedSignature(node.Parent); signature != nil {
		if reason, deprecated := typeScriptNoDeprecatedDeclarationDeprecation(signature.Declaration()); deprecated {
			return reason, true
		}
	}
	if checkTarget {
		return rule.symbolDeprecation(resolved)
	}
	return "", false
}

func typeScriptNoDeprecatedCallTarget(node *ast.Node) *ast.Node {
	current := node
	for current.Parent != nil && current.Parent.Kind == ast.KindPropertyAccessExpression && current.Parent.Name() == current {
		current = current.Parent
	}
	parent := current.Parent
	if parent == nil {
		return nil
	}
	switch parent.Kind {
	case ast.KindCallExpression, ast.KindNewExpression:
		if parent.Expression() == current {
			return current
		}
	case ast.KindTaggedTemplateExpression:
		if parent.AsTaggedTemplateExpression().Tag == current {
			return current
		}
	case ast.KindJsxOpeningElement, ast.KindJsxSelfClosingElement:
		if parent.TagName() == current {
			return current
		}
	}
	return nil
}

func (rule *typeScriptNoDeprecated) reportDeprecated(node *ast.Node, name, reason string) {
	if reason == "" {
		rule.context.Report(rule.context.Range(node), diagnostics.X_0_is_deprecated_24031, name)
	} else {
		rule.context.Report(rule.context.Range(node), diagnostics.X_0_is_deprecated_1, name, reason)
	}
}

func (rule *typeScriptNoDeprecated) propertyName(node *ast.Node) (string, bool) {
	if node.Kind == ast.KindIdentifier || node.Kind == ast.KindPrivateIdentifier || ast.IsStringOrNumericLiteralLike(node) {
		return node.Text(), true
	}
	if node.Kind == ast.KindComputedPropertyName {
		node = node.Expression()
	}
	value := rule.context.GetChecker().GetTypeAtLocation(node)
	if value.Flags()&(checker.TypeFlagsStringLiteral|checker.TypeFlagsNumberLiteral) != 0 {
		return checker.GetPropertyNameFromType(value), true
	}
	return "", false
}

func (rule *typeScriptNoDeprecated) contextualProperty(node *ast.Node) {
	if node.Parent.Kind != ast.KindObjectLiteralExpression {
		return
	}
	name, known := rule.propertyName(node.Name())
	if !known {
		return
	}
	typeChecker := rule.context.GetChecker()
	contextual := typeChecker.GetContextualType(node.Parent, checker.ContextFlagsNone)
	if contextual == nil {
		return
	}
	if reason, deprecated := rule.symbolDeprecation(typeChecker.GetPropertyOfType(contextual, name)); deprecated && !helpers.SemanticTypeAllowed(rule.context, contextual, nil, false) {
		key := node.Name()
		if key.Kind == ast.KindComputedPropertyName {
			key = key.Expression()
		}
		rule.reportDeprecated(key, name, reason)
	}
}

func (rule *typeScriptNoDeprecated) deprecated(node *ast.Node) {
	if node.Kind == ast.KindPropertyAssignment || node.Kind == ast.KindShorthandPropertyAssignment || node.Kind == ast.KindMethodDeclaration || node.Kind == ast.KindGetAccessor || node.Kind == ast.KindSetAccessor {
		rule.contextualProperty(node)
	}
	typeChecker := rule.context.GetChecker()
	if node.Kind == ast.KindElementAccessExpression {
		key := node.AsElementAccessExpression().ArgumentExpression
		value := typeChecker.GetTypeAtLocation(key)
		if value.Flags()&(checker.TypeFlagsStringLiteral|checker.TypeFlagsNumberLiteral) == 0 {
			return
		}
		name := checker.GetPropertyNameFromType(value)
		object := typeChecker.GetTypeAtLocation(node.Expression())
		if reason, deprecated := rule.symbolDeprecation(typeChecker.GetPropertyOfType(object, name)); deprecated && !helpers.SemanticTypeAllowed(rule.context, object, nil, false) {
			rule.reportDeprecated(key, name, reason)
		}
		return
	}
	if node.Kind != ast.KindIdentifier && node.Kind != ast.KindPrivateIdentifier && node.Kind != ast.KindSuperKeyword {
		return
	}
	if node.Kind == ast.KindPrivateIdentifier && typeScriptNoDeprecatedCallTarget(node) == nil {
		return
	}
	parent := node.Parent
	if parent == nil {
		return
	}
	if parent.Kind == ast.KindElementAccessExpression && parent.AsElementAccessExpression().ArgumentExpression == node || parent.Kind == ast.KindJsxClosingElement {
		return
	}
	for current := node; current != nil; current = current.Parent {
		if current.Kind == ast.KindImportDeclaration {
			return
		}
		if current.Kind == ast.KindVariableDeclaration || current.Kind == ast.KindBlock || current.Kind == ast.KindSourceFile {
			break
		}
	}
	if parent.Kind == ast.KindExportSpecifier {
		if parent.Name() != node {
			return
		}
		if _, deprecated := rule.symbolDeprecation(typeChecker.GetSymbolAtLocation(node)); deprecated {
			return
		}
	} else if parent.Kind == ast.KindBindingElement && parent.Initializer() != node {
		if parent.AsBindingElement().PropertyName != node {
			if parent.AsBindingElement().PropertyName != nil || parent.Parent.Kind != ast.KindObjectBindingPattern {
				return
			}
		}
	} else if parent.Kind == ast.KindShorthandPropertyAssignment {
	} else if ast.IsDeclarationName(node) && parent.Kind != ast.KindJsxAttribute || parent.Kind == ast.KindPropertyAssignment && parent.Name() == node || ast.IsFunctionLike(parent) && parent.Kind != ast.KindArrowFunction {
		return
	}
	var reason string
	var deprecated bool
	if call := typeScriptNoDeprecatedCallTarget(node); call != nil {
		reason, deprecated = rule.callDeprecation(call)
	} else if parent.Kind == ast.KindJsxAttribute && parent.Name() == node {
		contextual := typeChecker.GetContextualType(parent.Parent, checker.ContextFlagsNone)
		if contextual != nil {
			reason, deprecated = rule.symbolDeprecation(typeChecker.GetPropertyOfType(contextual, node.Text()))
		}
	} else if parent.Kind == ast.KindBindingElement && parent.Parent.Kind == ast.KindObjectBindingPattern && parent.Initializer() != node {
		object := typeChecker.GetTypeAtLocation(parent.Parent)
		reason, deprecated = rule.aliasDeprecation(typeChecker.GetPropertyOfType(object, node.Text()), true)
	} else {
		reason, deprecated = rule.aliasDeprecation(typeChecker.GetSymbolAtLocation(node), true)
		if !deprecated && parent.Kind == ast.KindShorthandPropertyAssignment {
			reason, deprecated = rule.aliasDeprecation(typeChecker.GetShorthandAssignmentValueSymbol(parent), true)
		}
	}
	if !deprecated || helpers.SemanticTypeAllowed(rule.context, typeChecker.GetTypeAtLocation(node), node, true) {
		return
	}
	name := "super"
	if node.Kind != ast.KindSuperKeyword {
		name = node.Text()
	}
	rule.reportDeprecated(node, name, reason)
}
