package selectors

import (
	"strconv"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type adapter struct{ file *ast.SourceFile }

func FromFile(file *ast.SourceFile) *Node {
	return (&adapter{file: file}).convert(file.AsNode(), false)
}

func (adapter *adapter) make(native *ast.Node, kind string) *Node {
	return &Node{Type: kind, Native: native, Attributes: make(map[string]any), Index: -1}
}

func attach(parent *Node, field string, child *Node, index int) {
	if child == nil {
		return
	}
	child.Parent, child.Field, child.Index, child.List = parent, field, index, index >= 0
	parent.Children = append(parent.Children, child)
}

func (adapter *adapter) add(parent *Node, field string, native *ast.Node) {
	attach(parent, field, adapter.convert(native, false), -1)
}

func (adapter *adapter) list(parent *Node, field string, natives []*ast.Node) {
	parent.Attributes[field+".length"] = float64(len(natives))
	for index, native := range natives {
		attach(parent, field, adapter.convert(native, false), index)
	}
}

func variableKind(node *ast.Node) string {
	flags := node.Flags
	switch {
	case flags&ast.NodeFlagsAwaitUsing == ast.NodeFlagsAwaitUsing:
		return "await using"
	case flags&ast.NodeFlagsUsing != 0:
		return "using"
	case flags&ast.NodeFlagsConst != 0:
		return "const"
	case flags&ast.NodeFlagsLet != 0:
		return "let"
	default:
		return "var"
	}
}

func (adapter *adapter) convert(native *ast.Node, insideChain bool) *Node {
	if native == nil {
		return nil
	}
	if native.Kind == ast.KindParenthesizedExpression {
		return adapter.convert(native.Expression(), false)
	}
	if ast.IsOptionalChain(native) && !insideChain {
		chain := adapter.make(native, "ChainExpression")
		attach(chain, "expression", adapter.convert(native, true), -1)
		return chain
	}
	node := adapter.make(native, strings.TrimPrefix(native.Kind.String(), "Kind"))
	add := func(field string, child *ast.Node) { adapter.add(node, field, child) }
	list := func(field string, children []*ast.Node) { adapter.list(node, field, children) }
	switch native.Kind {
	case ast.KindSourceFile:
		node.Type = "Program"
		node.Attributes["sourceType"] = "module"
		list("body", native.Statements())
	case ast.KindIdentifier, ast.KindPrivateIdentifier:
		node.Type = "Identifier"
		node.Attributes["name"] = native.Text()
		if native.Kind == ast.KindPrivateIdentifier {
			node.Type = "PrivateIdentifier"
			node.Attributes["name"] = strings.TrimPrefix(native.Text(), "#")
		}
	case ast.KindStringLiteral, ast.KindNumericLiteral, ast.KindBigIntLiteral, ast.KindRegularExpressionLiteral, ast.KindTrueKeyword, ast.KindFalseKeyword, ast.KindNullKeyword:
		node.Type = "Literal"
		raw := adapter.file.Text()[scanner.GetTokenPosOfNode(native, adapter.file, false):native.End()]
		node.Attributes["raw"] = raw
		switch native.Kind {
		case ast.KindStringLiteral:
			node.Attributes["value"] = native.Text()
		case ast.KindNumericLiteral:
			value, _ := strconv.ParseFloat(strings.ReplaceAll(native.Text(), "_", ""), 64)
			node.Attributes["value"] = value
		case ast.KindBigIntLiteral:
			node.Attributes["bigint"] = strings.TrimSuffix(native.Text(), "n")
		case ast.KindTrueKeyword:
			node.Attributes["value"] = true
		case ast.KindFalseKeyword:
			node.Attributes["value"] = false
		case ast.KindNullKeyword:
			node.Attributes["value"] = nil
		case ast.KindRegularExpressionLiteral:
			end := strings.LastIndex(raw, "/")
			if end > 0 {
				node.Attributes["regex.pattern"], node.Attributes["regex.flags"] = raw[1:end], raw[end+1:]
			}
		}
	case ast.KindThisKeyword:
		node.Type = "ThisExpression"
	case ast.KindSuperKeyword:
		node.Type = "Super"
	case ast.KindVariableStatement:
		declaration := native.AsVariableStatement().DeclarationList
		node.Type = "VariableDeclaration"
		node.Attributes["kind"] = variableKind(declaration)
		list("declarations", declaration.AsVariableDeclarationList().Declarations.Nodes)
	case ast.KindVariableDeclarationList:
		node.Type = "VariableDeclaration"
		node.Attributes["kind"] = variableKind(native)
		list("declarations", native.AsVariableDeclarationList().Declarations.Nodes)
	case ast.KindVariableDeclaration:
		node.Type = "VariableDeclarator"
		add("id", native.Name())
		add("init", native.Initializer())
	case ast.KindParameter:
		parameter := native.AsParameterDeclaration()
		if parameter.DotDotDotToken != nil {
			node.Type = "RestElement"
			add("argument", native.Name())
		} else if native.Initializer() != nil {
			node.Type = "AssignmentPattern"
			add("left", native.Name())
			add("right", native.Initializer())
		} else {
			return adapter.convert(native.Name(), false)
		}
	case ast.KindBindingElement:
		element := native.AsBindingElement()
		if element.DotDotDotToken != nil {
			node.Type = "RestElement"
			add("argument", native.Name())
			break
		}
		value := adapter.convert(native.Name(), false)
		if native.Initializer() != nil {
			assignment := adapter.make(native, "AssignmentPattern")
			attach(assignment, "left", value, -1)
			adapter.add(assignment, "right", native.Initializer())
			value = assignment
		}
		if native.Parent != nil && native.Parent.Kind == ast.KindArrayBindingPattern {
			return value
		}
		node.Type = "Property"
		node.Attributes["kind"] = "init"
		node.Attributes["method"] = false
		node.Attributes["shorthand"] = element.PropertyName == nil
		node.Attributes["computed"] = element.PropertyName != nil && element.PropertyName.Kind == ast.KindComputedPropertyName
		add("key", native.PropertyNameOrName())
		attach(node, "value", value, -1)
	case ast.KindObjectBindingPattern:
		node.Type = "ObjectPattern"
		list("properties", native.Elements())
	case ast.KindArrayBindingPattern:
		node.Type = "ArrayPattern"
		list("elements", native.Elements())
	case ast.KindObjectLiteralExpression:
		node.Type = "ObjectExpression"
		list("properties", native.AsObjectLiteralExpression().Properties.Nodes)
	case ast.KindArrayLiteralExpression:
		node.Type = "ArrayExpression"
		list("elements", native.AsArrayLiteralExpression().Elements.Nodes)
	case ast.KindOmittedExpression:
		return nil
	case ast.KindComputedPropertyName:
		return adapter.convert(native.Expression(), false)
	case ast.KindPropertyAssignment, ast.KindShorthandPropertyAssignment:
		node.Type = "Property"
		node.Attributes["kind"] = "init"
		node.Attributes["method"] = false
		node.Attributes["shorthand"] = native.Kind == ast.KindShorthandPropertyAssignment
		node.Attributes["computed"] = native.Name().Kind == ast.KindComputedPropertyName
		add("key", native.Name())
		if native.Kind == ast.KindShorthandPropertyAssignment {
			add("value", native.Name())
		} else {
			add("value", native.Initializer())
		}
	case ast.KindSpreadElement, ast.KindSpreadAssignment:
		node.Type = "SpreadElement"
		add("argument", native.Expression())
	case ast.KindFunctionDeclaration, ast.KindFunctionExpression, ast.KindArrowFunction:
		if native.Kind == ast.KindArrowFunction {
			node.Type = "ArrowFunctionExpression"
		}
		add("id", native.Name())
		list("params", native.Parameters())
		add("body", native.Body())
		node.Attributes["async"] = ast.GetCombinedModifierFlags(native)&ast.ModifierFlagsAsync != 0
		node.Attributes["generator"] = native.BodyData().AsteriskToken != nil
		node.Attributes["expression"] = native.Body() != nil && native.Body().Kind != ast.KindBlock
	case ast.KindMethodDeclaration, ast.KindGetAccessor, ast.KindSetAccessor, ast.KindConstructor:
		class := native.Parent != nil && (native.Parent.Kind == ast.KindClassDeclaration || native.Parent.Kind == ast.KindClassExpression)
		node.Type = "Property"
		if class {
			node.Type = "MethodDefinition"
		}
		kind := "method"
		if native.Kind == ast.KindGetAccessor {
			kind = "get"
		}
		if native.Kind == ast.KindSetAccessor {
			kind = "set"
		}
		if native.Kind == ast.KindConstructor {
			kind = "constructor"
		}
		if !class && kind == "method" {
			kind = "init"
		}
		node.Attributes["kind"] = kind
		node.Attributes["method"] = native.Kind == ast.KindMethodDeclaration
		node.Attributes["computed"] = native.Name() != nil && native.Name().Kind == ast.KindComputedPropertyName
		node.Attributes["static"] = ast.GetCombinedModifierFlags(native)&ast.ModifierFlagsStatic != 0
		if native.Name() != nil {
			add("key", native.Name())
		} else {
			key := adapter.make(native, "Identifier")
			key.Attributes["name"] = "constructor"
			attach(node, "key", key, -1)
		}
		function := adapter.make(native, "FunctionExpression")
		function.Attributes["async"] = ast.GetCombinedModifierFlags(native)&ast.ModifierFlagsAsync != 0
		function.Attributes["generator"] = native.BodyData().AsteriskToken != nil
		adapter.list(function, "params", native.Parameters())
		adapter.add(function, "body", native.Body())
		attach(node, "value", function, -1)
	case ast.KindClassDeclaration, ast.KindClassExpression:
		add("id", native.Name())
		class := native.ClassLikeData()
		body := adapter.make(native, "ClassBody")
		adapter.list(body, "body", class.Members.Nodes)
		attach(node, "body", body, -1)
		if class.HeritageClauses != nil {
			for _, heritage := range class.HeritageClauses.Nodes {
				if heritage.AsHeritageClause().Token == ast.KindExtendsKeyword && len(heritage.AsHeritageClause().Types.Nodes) > 0 {
					add("superClass", heritage.AsHeritageClause().Types.Nodes[0].Expression())
				}
			}
		}
	case ast.KindPropertyDeclaration:
		node.Type = "PropertyDefinition"
		add("key", native.Name())
		add("value", native.Initializer())
		node.Attributes["computed"] = native.Name().Kind == ast.KindComputedPropertyName
		node.Attributes["static"] = ast.GetCombinedModifierFlags(native)&ast.ModifierFlagsStatic != 0
	case ast.KindClassStaticBlockDeclaration:
		node.Type = "StaticBlock"
		list("body", native.Body().Statements())
	case ast.KindBlock:
		node.Type = "BlockStatement"
		list("body", native.Statements())
	case ast.KindExpressionStatement:
		add("expression", native.Expression())
	case ast.KindReturnStatement, ast.KindThrowStatement:
		add("argument", native.Expression())
	case ast.KindBreakStatement:
		add("label", native.AsBreakStatement().Label)
	case ast.KindContinueStatement:
		add("label", native.AsContinueStatement().Label)
	case ast.KindLabeledStatement:
		add("label", native.AsLabeledStatement().Label)
		add("body", native.AsLabeledStatement().Statement)
	case ast.KindIfStatement:
		statement := native.AsIfStatement()
		add("test", statement.Expression)
		add("consequent", statement.ThenStatement)
		add("alternate", statement.ElseStatement)
	case ast.KindWhileStatement:
		add("test", native.AsWhileStatement().Expression)
		add("body", native.AsWhileStatement().Statement)
	case ast.KindDoStatement:
		node.Type = "DoWhileStatement"
		add("body", native.AsDoStatement().Statement)
		add("test", native.AsDoStatement().Expression)
	case ast.KindForStatement:
		statement := native.AsForStatement()
		add("init", statement.Initializer)
		add("test", statement.Condition)
		add("update", statement.Incrementor)
		add("body", statement.Statement)
	case ast.KindForInStatement, ast.KindForOfStatement:
		statement := native.AsForInOrOfStatement()
		add("left", statement.Initializer)
		add("right", statement.Expression)
		add("body", statement.Statement)
		node.Attributes["await"] = statement.AwaitModifier != nil
	case ast.KindWithStatement:
		add("object", native.AsWithStatement().Expression)
		add("body", native.AsWithStatement().Statement)
	case ast.KindTryStatement:
		statement := native.AsTryStatement()
		add("block", statement.TryBlock)
		add("handler", statement.CatchClause)
		add("finalizer", statement.FinallyBlock)
	case ast.KindCatchClause:
		clause := native.AsCatchClause()
		if clause.VariableDeclaration != nil {
			add("param", clause.VariableDeclaration.Name())
		}
		add("body", clause.Block)
	case ast.KindSwitchStatement:
		statement := native.AsSwitchStatement()
		add("discriminant", statement.Expression)
		list("cases", statement.CaseBlock.AsCaseBlock().Clauses.Nodes)
	case ast.KindCaseClause:
		node.Type = "SwitchCase"
		add("test", native.AsCaseOrDefaultClause().Expression)
		list("consequent", native.Statements())
	case ast.KindDefaultClause:
		node.Type = "SwitchCase"
		list("consequent", native.Statements())
	case ast.KindConditionalExpression:
		node.Type = "ConditionalExpression"
		expression := native.AsConditionalExpression()
		add("test", expression.Condition)
		add("consequent", expression.WhenTrue)
		add("alternate", expression.WhenFalse)
	case ast.KindBinaryExpression:
		expression := native.AsBinaryExpression()
		operator := expression.OperatorToken.Kind
		node.Attributes["operator"] = scanner.TokenToString(operator)
		switch {
		case operator == ast.KindCommaToken:
			node.Type = "SequenceExpression"
			var expressions []*ast.Node
			var flatten func(*ast.Node)
			flatten = func(current *ast.Node) {
				if current.Kind == ast.KindBinaryExpression && current.AsBinaryExpression().OperatorToken.Kind == ast.KindCommaToken {
					flatten(current.AsBinaryExpression().Left)
					flatten(current.AsBinaryExpression().Right)
				} else {
					expressions = append(expressions, current)
				}
			}
			flatten(native)
			list("expressions", expressions)
		case ast.IsAssignmentOperator(operator):
			node.Type = "AssignmentExpression"
			add("left", expression.Left)
			add("right", expression.Right)
		default:
			node.Type = "BinaryExpression"
			if operator == ast.KindAmpersandAmpersandToken || operator == ast.KindBarBarToken || operator == ast.KindQuestionQuestionToken {
				node.Type = "LogicalExpression"
			}
			add("left", expression.Left)
			add("right", expression.Right)
		}
	case ast.KindPrefixUnaryExpression, ast.KindPostfixUnaryExpression:
		var operator ast.Kind
		var operand *ast.Node
		if native.Kind == ast.KindPrefixUnaryExpression {
			operator = native.AsPrefixUnaryExpression().Operator
			operand = native.AsPrefixUnaryExpression().Operand
		} else {
			operator = native.AsPostfixUnaryExpression().Operator
			operand = native.AsPostfixUnaryExpression().Operand
		}
		node.Type = "UnaryExpression"
		if operator == ast.KindPlusPlusToken || operator == ast.KindMinusMinusToken {
			node.Type = "UpdateExpression"
		}
		node.Attributes["operator"] = scanner.TokenToString(operator)
		node.Attributes["prefix"] = native.Kind == ast.KindPrefixUnaryExpression
		add("argument", operand)
	case ast.KindTypeOfExpression, ast.KindVoidExpression, ast.KindDeleteExpression:
		node.Type = "UnaryExpression"
		operator := "typeof"
		if native.Kind == ast.KindVoidExpression {
			operator = "void"
		}
		if native.Kind == ast.KindDeleteExpression {
			operator = "delete"
		}
		node.Attributes["operator"] = operator
		node.Attributes["prefix"] = true
		add("argument", native.Expression())
	case ast.KindAwaitExpression:
		node.Type = "AwaitExpression"
		add("argument", native.Expression())
	case ast.KindYieldExpression:
		node.Type = "YieldExpression"
		add("argument", native.Expression())
		node.Attributes["delegate"] = native.AsYieldExpression().AsteriskToken != nil
	case ast.KindPropertyAccessExpression, ast.KindElementAccessExpression:
		node.Type = "MemberExpression"
		node.Attributes["computed"] = native.Kind == ast.KindElementAccessExpression
		node.Attributes["optional"] = native.QuestionDotToken() != nil
		attach(node, "object", adapter.convert(native.Expression(), insideChain), -1)
		if native.Kind == ast.KindPropertyAccessExpression {
			add("property", native.Name())
		} else {
			add("property", native.AsElementAccessExpression().ArgumentExpression)
		}
	case ast.KindCallExpression, ast.KindNewExpression:
		attach(node, "callee", adapter.convert(native.Expression(), insideChain), -1)
		node.Attributes["optional"] = native.QuestionDotToken() != nil
		if native.Kind == ast.KindCallExpression {
			node.Type = "CallExpression"
			list("arguments", native.AsCallExpression().Arguments.Nodes)
		} else {
			node.Type = "NewExpression"
			if native.AsNewExpression().Arguments != nil {
				list("arguments", native.AsNewExpression().Arguments.Nodes)
			} else {
				list("arguments", nil)
			}
		}
	case ast.KindMetaProperty:
		node.Type = "MetaProperty"
		meta := adapter.make(native, "Identifier")
		meta.Attributes["name"] = scanner.TokenToString(native.AsMetaProperty().KeywordToken)
		attach(node, "meta", meta, -1)
		add("property", native.Name())
	case ast.KindImportDeclaration:
		node.Type = "ImportDeclaration"
		declaration := native.AsImportDeclaration()
		add("source", declaration.ModuleSpecifier)
		node.Attributes["importKind"] = "value"
		var specifiers []*Node
		if clause := declaration.ImportClause; clause != nil {
			if clause.IsTypeOnly() {
				node.Attributes["importKind"] = "type"
			}
			if clause.Name() != nil {
				specifier := adapter.make(clause.Name(), "ImportDefaultSpecifier")
				adapter.add(specifier, "local", clause.Name())
				specifiers = append(specifiers, specifier)
			}
			if bindings := clause.AsImportClause().NamedBindings; bindings != nil {
				if bindings.Kind == ast.KindNamespaceImport {
					specifiers = append(specifiers, adapter.convert(bindings, false))
				} else {
					for _, specifier := range bindings.Elements() {
						specifiers = append(specifiers, adapter.convert(specifier, false))
					}
				}
			}
		}
		node.Attributes["specifiers.length"] = float64(len(specifiers))
		for index, specifier := range specifiers {
			attach(node, "specifiers", specifier, index)
		}
	case ast.KindNamespaceImport:
		node.Type = "ImportNamespaceSpecifier"
		add("local", native.Name())
	case ast.KindImportSpecifier:
		add("imported", native.PropertyNameOrName())
		add("local", native.Name())
		node.Attributes["importKind"] = core.IfElse(native.IsTypeOnly(), "type", "value")
	case ast.KindExportSpecifier:
		add("local", native.PropertyNameOrName())
		add("exported", native.Name())
		node.Attributes["exportKind"] = core.IfElse(native.IsTypeOnly(), "type", "value")
	case ast.KindExportDeclaration:
		declaration := native.AsExportDeclaration()
		node.Type = "ExportNamedDeclaration"
		add("source", declaration.ModuleSpecifier)
		node.Attributes["exportKind"] = core.IfElse(native.IsTypeOnly(), "type", "value")
		if declaration.ExportClause == nil || declaration.ExportClause.Kind == ast.KindNamespaceExport {
			node.Type = "ExportAllDeclaration"
			if declaration.ExportClause != nil {
				add("exported", declaration.ExportClause.Name())
			}
		} else {
			list("specifiers", declaration.ExportClause.Elements())
		}
	case ast.KindExportAssignment:
		node.Type = "ExportDefaultDeclaration"
		add("declaration", native.Expression())
	case ast.KindImportEqualsDeclaration:
		node.Type = "TSImportEqualsDeclaration"
		add("id", native.Name())
		add("moduleReference", native.AsImportEqualsDeclaration().ModuleReference)
		node.Attributes["importKind"] = core.IfElse(native.IsTypeOnly(), "type", "value")
	case ast.KindExternalModuleReference:
		node.Type = "TSExternalModuleReference"
		add("expression", native.Expression())
	case ast.KindJsxSelfClosingElement:
		node.Type = "JSXElement"
		opening := adapter.make(native, "JSXOpeningElement")
		opening.Attributes["selfClosing"] = true
		adapter.add(opening, "name", native.AsJsxSelfClosingElement().TagName)
		attach(node, "openingElement", opening, -1)
		node.Attributes["children.length"] = float64(0)
	case ast.KindJsxElement:
		node.Type = "JSXElement"
		expression := native.AsJsxElement()
		add("openingElement", expression.OpeningElement)
		list("children", expression.Children.Nodes)
		add("closingElement", expression.ClosingElement)
	case ast.KindJsxOpeningElement:
		node.Type = "JSXOpeningElement"
		add("name", native.AsJsxOpeningElement().TagName)
		list("attributes", native.AsJsxOpeningElement().Attributes.AsJsxAttributes().Properties.Nodes)
		node.Attributes["selfClosing"] = false
	case ast.KindJsxClosingElement:
		node.Type = "JSXClosingElement"
		add("name", native.AsJsxClosingElement().TagName)
	case ast.KindJsxExpression:
		node.Type = "JSXExpressionContainer"
		add("expression", native.Expression())
	case ast.KindJsxText:
		node.Type = "JSXText"
	case ast.KindJsxAttribute:
		node.Type = "JSXAttribute"
		add("name", native.Name())
		add("value", native.Initializer())
	case ast.KindJsxSpreadAttribute:
		node.Type = "JSXSpreadAttribute"
		add("argument", native.Expression())
	case ast.KindAsExpression, ast.KindSatisfiesExpression, ast.KindTypeAssertionExpression, ast.KindNonNullExpression:
		switch native.Kind {
		case ast.KindAsExpression:
			node.Type = "TSAsExpression"
		case ast.KindSatisfiesExpression:
			node.Type = "TSSatisfiesExpression"
		case ast.KindTypeAssertionExpression:
			node.Type = "TSTypeAssertion"
		case ast.KindNonNullExpression:
			node.Type = "TSNonNullExpression"
		}
		add("expression", native.Expression())
		add("typeAnnotation", native.Type())
	default:
		if native.Kind < ast.KindFirstNode {
			return nil
		}
		native.ForEachChild(func(child *ast.Node) bool { add("", child); return false })
	}
	return node
}
