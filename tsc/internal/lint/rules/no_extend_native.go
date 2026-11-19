package rules

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noExtendNativeRule struct{ context Context }

func newNoExtendNativeRule(context Context) Rule {
	rule := &noExtendNativeRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindBinaryExpression, ast.KindCallExpression},
	}
}

func (rule *noExtendNativeRule) OnEnterNode(node *ast.Node) bool {
	rule.checkExtendNative(node)
	return true
}

var noExtendNativeNames = strings.Fields("Array Boolean Date Error EvalError Function Infinity Math NaN Number Object RangeError ReferenceError RegExp String SyntaxError TypeError URIError JSON ArrayBuffer DataView Float32Array Float64Array Int16Array Int32Array Int8Array Intl Map Promise Proxy Reflect Set Symbol Uint16Array Uint32Array Uint8Array Uint8ClampedArray WeakMap WeakSet Atomics SharedArrayBuffer BigInt BigInt64Array BigUint64Array AggregateError FinalizationRegistry WeakRef Float16Array Iterator AsyncDisposableStack DisposableStack SuppressedError Temporal")

func (rule *noExtendNativeRule) checkExtendNative(node *ast.Node) {
	var prototype *ast.Node
	if ast.IsAssignmentExpression(node, false) {
		left := ast.SkipParentheses(node.AsBinaryExpression().Left)
		if ast.IsAccessExpression(left) {
			prototype = ast.SkipParentheses(left.Expression())
		}
	} else if node.Kind == ast.KindCallExpression {
		call := node.AsCallExpression()
		callee := ast.SkipParentheses(call.Expression)
		if ast.IsAccessExpression(callee) && len(call.Arguments.Nodes) > 0 {
			object := ast.SkipParentheses(callee.Expression())
			method, known := helpers.StaticMemberNameText(callee)
			if object.Kind == ast.KindIdentifier && object.Text() == "Object" && known && (method == "defineProperty" || method == "defineProperties") {
				prototype = ast.SkipParentheses(call.Arguments.Nodes[0])
			}
		}
	}
	if prototype == nil || !ast.IsAccessExpression(prototype) {
		return
	}
	property, known := helpers.StaticMemberNameText(prototype)
	constructor := ast.SkipParentheses(prototype.Expression())
	if !known || property != "prototype" || constructor.Kind != ast.KindIdentifier || !slices.Contains(noExtendNativeNames, constructor.Text()) {
		return
	}
	if len(rule.context.Options) > 0 {
		if options, ok := rule.context.Options[0].(map[string]any); ok {
			if exceptions, ok := options["exceptions"].([]any); ok {
				for _, exception := range exceptions {
					if exception == constructor.Text() {
						return
					}
				}
			}
		}
	}
	if !helpers.StatementBuiltin(rule.context, constructor, false) && !rule.scriptGlobal(constructor) {
		return
	}
	rule.context.Report(rule.context.Range(node), diagnostics.X_0_prototype_is_read_only_properties_should_not_be_added, constructor.Text())
}

func (rule *noExtendNativeRule) scriptGlobal(identifier *ast.Node) bool {
	if ast.IsExternalModule(rule.context.File) {
		return false
	}
	for scope := identifier.Parent; scope != nil; scope = scope.Parent {
		if symbol := scope.Locals().Get(identifier.Text()); symbol != nil && symbol.Flags()&(ast.SymbolFlagsValue|ast.SymbolFlagsAlias) != 0 {
			return scope.Kind == ast.KindSourceFile
		}
	}
	return false
}
