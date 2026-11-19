package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptRequireAwaitRule struct {
	context     Context
	functions   []helpers.PromiseFunctionScope
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptRequireAwait(context Context) Rule {
	rule := &typescriptRequireAwaitRule{context: context}

	return Rule{
		Enter: rule.OnEnterNode,
		EnterKinds: []ast.Kind{
			ast.KindFunctionDeclaration,
			ast.KindMethodDeclaration,
			ast.KindConstructor,
			ast.KindGetAccessor,
			ast.KindSetAccessor,
			ast.KindFunctionExpression,
			ast.KindArrowFunction,
			ast.KindMethodSignature,
			ast.KindCallSignature,
			ast.KindJSDocSignature,
			ast.KindConstructSignature,
			ast.KindIndexSignature,
			ast.KindFunctionType,
			ast.KindConstructorType,
			ast.KindAwaitExpression,
			ast.KindForOfStatement,
			ast.KindVariableDeclarationList,
			ast.KindReturnStatement,
			ast.KindYieldExpression,
		},
		Exit: rule.OnExitNode,
		ExitKinds: []ast.Kind{
			ast.KindFunctionDeclaration,
			ast.KindMethodDeclaration,
			ast.KindConstructor,
			ast.KindGetAccessor,
			ast.KindSetAccessor,
			ast.KindFunctionExpression,
			ast.KindArrowFunction,
			ast.KindMethodSignature,
			ast.KindCallSignature,
			ast.KindJSDocSignature,
			ast.KindConstructSignature,
			ast.KindIndexSignature,
			ast.KindFunctionType,
			ast.KindConstructorType,
		},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptRequireAwaitRule) OnEnterNode(node *ast.Node) bool {
	rule.enterAwaitFunction(node)
	return true
}

func (rule *typescriptRequireAwaitRule) OnExitNode(node *ast.Node) { rule.exitAwaitFunction(node) }

func (rule *typescriptRequireAwaitRule) enterAwaitFunction(node *ast.Node) {
	if helpers.PromiseFunctionLike(node) {
		rule.functions = append(rule.functions, helpers.PromiseFunctionScope{Node: node})
	}
	if len(rule.functions) == 0 {
		return
	}
	scope := &rule.functions[len(rule.functions)-1]
	if node.Kind == ast.KindAwaitExpression || node.Kind == ast.KindForOfStatement && node.AsForInOrOfStatement().AwaitModifier != nil || node.Kind == ast.KindVariableDeclarationList && node.Flags&ast.NodeFlagsBlockScoped == ast.NodeFlagsAwaitUsing {
		scope.Await = true
	}
	if node.Kind == ast.KindReturnStatement && node.Expression() != nil && ast.HasSyntacticModifier(scope.Node, ast.ModifierFlagsAsync) && helpers.PromiseThenable(rule.context, node.Expression(), helpers.PromiseConstrained(rule.context, node.Expression()), false) {
		scope.Await = true
	}
	if node == scope.Node && node.Kind == ast.KindArrowFunction && node.Body().Kind != ast.KindBlock && helpers.PromiseThenable(rule.context, node.Body(), helpers.PromiseConstrained(rule.context, node.Body()), false) {
		scope.Await = true
	}
	if node.Kind == ast.KindYieldExpression && node.Expression() != nil && helpers.PromiseGenerator(scope.Node) {
		if node.AsYieldExpression().AsteriskToken != nil {
			if helpers.PromiseHasWellKnown(rule.context, helpers.PromiseConstrained(rule.context, node.Expression()), "asyncIterator") {
				scope.Await = true
			}
		} else if helpers.PromiseThenable(rule.context, node.Expression(), helpers.PromiseConstrained(rule.context, node.Expression()), false) {
			scope.Await = true
		}
	}
}

func (rule *typescriptRequireAwaitRule) exitAwaitFunction(node *ast.Node) {
	if !helpers.PromiseFunctionLike(node) {
		return
	}
	scope := rule.functions[len(rule.functions)-1]
	rule.functions = rule.functions[:len(rule.functions)-1]
	if !ast.HasSyntacticModifier(node, ast.ModifierFlagsAsync) || scope.Await || node.Body().Kind == ast.KindBlock && len(node.Body().AsBlock().Statements.Nodes) == 0 {
		return
	}
	name := "Async function"
	if node.Kind == ast.KindArrowFunction {
		name = "Async arrow function"
	} else if node.Kind == ast.KindMethodDeclaration {
		name = "Async method"
	}
	if helpers.PromiseGenerator(node) {
		name = "Async generator function"
	}
	identifier := node.Name()
	if identifier == nil && node.Parent != nil && node.Parent.Kind == ast.KindVariableDeclaration {
		identifier = node.Parent.Name()
	}
	if identifier != nil && identifier.Kind == ast.KindIdentifier && identifier.Text() != "" {
		name += " '" + identifier.Text() + "'"
	}

	start := helpers.PromiseStart(rule.context, node)
	var end int
	if node.Kind == ast.KindArrowFunction {
		start, end = helpers.PromiseStart(rule.context, node.AsArrowFunction().EqualsGreaterThanToken), node.AsArrowFunction().EqualsGreaterThanToken.End()
	} else {
		tokenScanner := scanner.GetScannerForSourceFile(rule.context.File, helpers.PromiseStart(rule.context, node))
		for tokenScanner.Token() != ast.KindOpenParenToken && tokenScanner.Token() != ast.KindEndOfFile {
			tokenScanner.Scan()
		}
		end = tokenScanner.TokenStart()
	}
	diagnostic := rule.context.Report(

		core.NewTextRange(start, end), diagnostics.X_0_has_no_await_expression, name)

	rule.action(diagnostic, ast.NewCompilerDiagnostic(diagnostics.Remove_async), false, func(tracker *change.Tracker) {
		for _, modifier := range node.Modifiers().Nodes {
			if modifier.Kind != ast.KindAsyncKeyword {
				continue
			}
			removeStart, removeEnd := helpers.PromiseStart(rule.context, modifier), modifier.End()
			text := rule.context.File.Text()
			for removeEnd < len(text) && strings.ContainsRune(" \t\r\n", rune(text[removeEnd])) {
				removeEnd++
			}
			replacement := ""
			if removeEnd < len(text) && (text[removeEnd] == '[' || text[removeEnd] == '(') {
				prefix := strings.TrimSpace(text[:removeStart])
				if prefix != "" && !strings.ContainsRune(";{}:", rune(prefix[len(prefix)-1])) {
					replacement = ";"
				}
			}
			helpers.PromiseReplace(rule.context, tracker, removeStart, removeEnd, replacement)
		}
		annotation := node.Type()
		if annotation == nil || annotation.Kind != ast.KindTypeReference {
			return
		}
		reference := annotation.AsTypeReferenceNode()
		if reference.TypeName.Kind != ast.KindIdentifier {
			return
		}
		if helpers.PromiseGenerator(node) {
			if reference.TypeName.Text() == "AsyncGenerator" {
				helpers.PromiseReplace(rule.context, tracker, helpers.PromiseStart(rule.context, reference.TypeName), reference.TypeName.End(), "Generator")
			}
		} else if reference.TypeName.Text() == "Promise" && reference.TypeArguments != nil && len(reference.TypeArguments.Nodes) == 1 {
			argument := reference.TypeArguments.Nodes[0]
			helpers.PromiseReplace(rule.context, tracker, helpers.PromiseStart(rule.context, annotation), annotation.End(), helpers.PromiseText(rule.context, argument))
		}
	})
}

func (rule *typescriptRequireAwaitRule) action(diagnostic *ast.Diagnostic, description *ast.Diagnostic, automatic bool, edit func(*change.Tracker)) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	edit(tracker)
	action := codefix.CreateCodeFixAction("@typescript-eslint/"+"require-await", tracker.GetTextChanges(), description, "", nil)
	if automatic {
		diagnostic.SetCodeFixes(action)
		return
	}
	if rule.suggestions == nil {
		rule.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
	}
	rule.suggestions[diagnostic] = append(rule.suggestions[diagnostic], action)
}

func (rule *typescriptRequireAwaitRule) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}
