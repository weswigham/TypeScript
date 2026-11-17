package helpers

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
)

func BindingParent(node *ast.Node) (*ast.Node, *ast.Node) {
	for node.Parent != nil && node.Parent.Kind == ast.KindParenthesizedExpression {
		node = node.Parent
	}
	return node, node.Parent
}

func BindingAttribute(node *ast.Node) bool {
	parent := node.Parent
	if parent.Kind == ast.KindImportAttribute {
		return parent.Name() == node
	}
	if parent.Kind != ast.KindPropertyAssignment && parent.Kind != ast.KindShorthandPropertyAssignment {
		return false
	}
	if parent.Name() != node {
		return false
	}
	for current := parent; current.Parent != nil; {
		object := current.Parent
		if object.Kind != ast.KindObjectLiteralExpression {
			return false
		}
		current = object.Parent
		if current == nil {
			return false
		}
		if current.Kind == ast.KindCallExpression && current.Expression().Kind == ast.KindImportKeyword {
			return len(current.Arguments()) > 1 && current.Arguments()[1] == object
		}
		if current.Kind != ast.KindPropertyAssignment || current.Initializer() != object {
			return false
		}
	}
	return false
}

func BindingPatternProperty(node *ast.Node) bool {
	if node.Parent.Kind == ast.KindBindingElement {
		return node.Parent.Parent.Kind == ast.KindObjectBindingPattern
	}
	if node.Parent.Kind == ast.KindPropertyAssignment || node.Parent.Kind == ast.KindShorthandPropertyAssignment {
		object := node.Parent.Parent
		return object.Kind == ast.KindObjectLiteralExpression && ast.IsAssignmentTarget(object)
	}
	return false
}

func BindingOriginal(node *ast.Node) bool {
	parent := node.Parent
	if parent.Kind == ast.KindBindingElement && parent.Name() == node && parent.Parent.Kind == ast.KindObjectBindingPattern {
		if parent.AsBindingElement().DotDotDotToken != nil {
			return false
		}
		property := parent.AsBindingElement().PropertyName
		return property == nil || property.Kind == ast.KindIdentifier && property.Text() == node.Text()
	}
	if parent.Kind == ast.KindImportSpecifier && parent.Name() == node {
		property := parent.AsImportSpecifier().PropertyName
		return property == nil || property.Text() == node.Text()
	}
	if parent.Kind == ast.KindShorthandPropertyAssignment {
		return true
	}
	value := node
	if parent.Kind == ast.KindBinaryExpression && parent.AsBinaryExpression().OperatorToken.Kind == ast.KindEqualsToken && parent.AsBinaryExpression().Left == node {
		value, parent = parent, parent.Parent
	}
	return parent != nil && parent.Kind == ast.KindPropertyAssignment && parent.Initializer() == value && parent.Name().Kind == ast.KindIdentifier && parent.Name().Text() == node.Text()
}

func BindingDefaultValue(node *ast.Node) bool {
	parent := node.Parent
	switch parent.Kind {
	case ast.KindParameter, ast.KindBindingElement:
		return parent.Initializer() == node
	case ast.KindShorthandPropertyAssignment:
		return parent.AsShorthandPropertyAssignment().ObjectAssignmentInitializer == node
	case ast.KindBinaryExpression:
		return parent.AsBinaryExpression().OperatorToken.Kind == ast.KindEqualsToken && parent.AsBinaryExpression().Right == node && ast.IsAssignmentTarget(parent)
	}
	return false
}

func BindingNamingTarget(node *ast.Node) bool {
	target := ast.GetAssignmentTarget(SharedParenthesizedOuter(node))
	return target != nil && target.Kind == ast.KindBinaryExpression
}

func BindingReference(node *ast.Node) bool {
	if node.Parent != nil && node.Parent.Kind == ast.KindBindingElement && node.Parent.AsBindingElement().PropertyName == node {
		return false
	}
	return TsScopeReferenceNode(node) && !ast.IsPartOfTypeNode(node)
}

var BindingBuiltins = strings.Fields("AggregateError Array ArrayBuffer AsyncDisposableStack Atomics BigInt BigInt64Array BigUint64Array Boolean DataView Date DisposableStack Error EvalError FinalizationRegistry Float16Array Float32Array Float64Array Function Infinity Int8Array Int16Array Int32Array Intl Iterator JSON Map Math NaN Number Object Promise Proxy RangeError ReferenceError Reflect RegExp Set SharedArrayBuffer String SuppressedError Symbol SyntaxError Temporal TypeError Uint8Array Uint8ClampedArray Uint16Array Uint32Array URIError WeakMap WeakRef WeakSet decodeURI decodeURIComponent encodeURI encodeURIComponent escape eval globalThis isFinite isNaN parseFloat parseInt undefined unescape")
