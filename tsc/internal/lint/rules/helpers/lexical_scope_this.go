package helpers

import (
	"iter"
	"slices"
	"unicode"
	"unicode/utf8"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

func (scope *LexicalScopeAnalysis) Strict(node *ast.Node) bool {
	file := scope.Context.File
	if scope.CompilerOptions != nil && scope.CompilerOptions.GetStrictOptionValue(scope.CompilerOptions.AlwaysStrict) {
		return true
	}
	if ast.IsExternalModule(file) {
		return true
	}
	if scope.EcmaVersion != 0 && scope.EcmaVersion < 5 {
		return false
	}
	for current := node; current != nil; current = current.Parent {
		if ast.IsClassLike(current) {
			return true
		}
		var statements []*ast.Node
		if current.Kind == ast.KindSourceFile {
			statements = file.Statements.Nodes
		} else if ast.IsFunctionLike(current) && current.Body() != nil && current.Body().Kind == ast.KindBlock {
			statements = current.Body().AsBlock().Statements.Nodes
		}
		for _, statement := range statements {
			if statement.Kind != ast.KindExpressionStatement || statement.Expression().Kind != ast.KindStringLiteral {
				break
			}
			if statement.Expression().Text() == "use strict" {
				return true
			}
		}
	}
	return false
}

func lexicalScopeUpper(name *ast.Node) bool {
	if name == nil || name.Kind != ast.KindIdentifier {
		return false
	}
	first, _ := utf8.DecodeRuneInString(name.Text())
	return unicode.IsUpper(first)
}

func lexicalScopeNullish(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	return node.Kind == ast.KindNullKeyword || node.Kind == ast.KindVoidExpression || TsScopeIdentifier(node, "undefined")
}

func (scope *LexicalScopeAnalysis) DefaultThis(node *ast.Node, constructors bool) bool {
	if node.Kind == ast.KindClassStaticBlockDeclaration || node.Kind == ast.KindPropertyDeclaration || node.Kind == ast.KindMethodDeclaration || node.Kind == ast.KindConstructor || node.Kind == ast.KindGetAccessor || node.Kind == ast.KindSetAccessor {
		return false
	}
	for _, parameter := range node.Parameters() {
		if parameter.Name() != nil && parameter.Name().Text() == "this" {
			return false
		}
	}
	if constructors && lexicalScopeUpper(node.Name()) || scope.thisTag(node) {
		return false
	}
	for current := LexicalScopeUnwrap(node); current.Parent != nil; {
		parent := current.Parent
		switch parent.Kind {
		case ast.KindConditionalExpression:
			current = LexicalScopeUnwrap(parent)
		case ast.KindBinaryExpression:
			binary := parent.AsBinaryExpression()
			if slices.Contains([]ast.Kind{ast.KindBarBarToken, ast.KindAmpersandAmpersandToken, ast.KindQuestionQuestionToken}, binary.OperatorToken.Kind) {
				current = LexicalScopeUnwrap(parent)
				continue
			}
			if ast.IsAssignmentOperator(binary.OperatorToken.Kind) {
				left := ast.SkipParentheses(binary.Left)
				return !ast.IsAccessExpression(left) && !(constructors && node.Name() == nil && lexicalScopeUpper(left))
			}
			return true
		case ast.KindReturnStatement:
			function := LexicalScopeExecution(parent)
			if function == nil {
				return true
			}
			callee := LexicalScopeUnwrap(function)
			if callee.Parent.Kind != ast.KindCallExpression || callee.Parent.Expression() != callee {
				return true
			}
			current = LexicalScopeUnwrap(callee.Parent)
		case ast.KindArrowFunction:
			callee := LexicalScopeUnwrap(parent)
			if parent.Body() != current || callee.Parent.Kind != ast.KindCallExpression || callee.Parent.Expression() != callee {
				return true
			}
			current = LexicalScopeUnwrap(callee.Parent)
		case ast.KindPropertyAssignment, ast.KindPropertyDeclaration:
			return parent.Initializer() != current
		case ast.KindVariableDeclaration, ast.KindBindingElement, ast.KindParameter:
			return !(constructors && node.Name() == nil && parent.Initializer() == current && lexicalScopeUpper(parent.Name()))
		case ast.KindPropertyAccessExpression, ast.KindElementAccessExpression:
			_, _, name := scope.Member(parent)
			callee := LexicalScopeUnwrap(parent)
			return !(parent.Expression() == current && slices.Contains([]string{"bind", "call", "apply"}, name) && callee.Parent.Kind == ast.KindCallExpression && callee.Parent.Expression() == callee && len(callee.Parent.Arguments()) != 0 && !lexicalScopeNullish(callee.Parent.Arguments()[0]))
		case ast.KindCallExpression:
			object, _, method := scope.Member(parent.Expression())
			arguments := parent.Arguments()
			if object != nil && TsScopeIdentifier(object, "Reflect") && method == "apply" {
				return len(arguments) != 3 || arguments[0] != current || lexicalScopeNullish(arguments[1])
			}
			if object != nil && TsScopeIdentifier(object, "Array") && (method == "from" || method == "fromAsync") {
				return len(arguments) != 3 || arguments[1] != current || lexicalScopeNullish(arguments[2])
			}
			if slices.Contains([]string{"every", "filter", "find", "findIndex", "findLast", "findLastIndex", "flatMap", "forEach", "map", "some"}, method) {
				return len(arguments) != 2 || arguments[0] != current || lexicalScopeNullish(arguments[1])
			}
			return true
		default:
			return true
		}
	}
	return true
}

func (scope *LexicalScopeAnalysis) thisTag(node *ast.Node) bool {
	for current := node; current != nil; current = current.Parent {
		if current != node && (ast.IsFunctionLike(current) || node.Parent.Kind == ast.KindCallExpression || node.Parent.Kind == ast.KindNewExpression) {
			break
		}
		for _, comment := range current.JSDoc(scope.Context.File) {
			if comment.AsJSDoc().Tags != nil {
				for _, tag := range comment.AsJSDoc().Tags.Nodes {
					if tag.Kind == ast.KindJSDocThisTag {
						return true
					}
				}
			}
		}
		if scope.thisTagComment(current) {
			return true
		}
		if current != node && (ast.IsFunctionLike(current) || ast.IsStatement(current)) {
			break
		}
	}
	return false
}

func (scope *LexicalScopeAnalysis) thisTagComment(node *ast.Node) bool {
	text := scope.Context.File.Text()
	for _, ranges := range []iter.Seq[ast.CommentRange]{
		scanner.GetLeadingCommentRanges(nil, text, node.Pos()),
		scanner.GetTrailingCommentRanges(nil, text, node.Pos()),
	} {
		for comment := range ranges {
			lex := scanner.NewScanner()
			lex.SetText(text[comment.Pos()+2 : comment.End()])
			for token := lex.ScanJSDocToken(); token != ast.KindEndOfFile; token = lex.ScanJSDocToken() {
				if token == ast.KindAtToken {
					lex.ScanJSDocToken()
					if lex.TokenText() == "this" {
						return true
					}
				}
			}
		}
	}
	return false
}

func LexicalScopeThisOwner(node *ast.Node) *ast.Node {
	for current := node.Parent; current != nil; current = current.Parent {
		if current.Kind == ast.KindSourceFile || current.Kind == ast.KindClassStaticBlockDeclaration || current.Kind == ast.KindPropertyDeclaration && TsScopeContains(current.Initializer(), node) || ast.IsFunctionLike(current) && current.Kind != ast.KindArrowFunction && !TsScopeContains(current.Name(), node) {
			return current
		}
	}
	return nil
}
