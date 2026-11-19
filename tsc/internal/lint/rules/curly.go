package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type curlyRule struct {
	context Context
}

func newCurly(context Context) Rule {
	rule := &curlyRule{context: context}

	return Rule{
		Enter: rule.OnEnterNode,
		EnterKinds: []ast.Kind{
			ast.KindDoStatement,
			ast.KindForInStatement,
			ast.KindForOfStatement,
			ast.KindForStatement,
			ast.KindIfStatement,
			ast.KindWhileStatement,
		},
	}
}

func (rule *curlyRule) OnEnterNode(node *ast.Node) bool {
	var checks []curlyBraceCheck
	if node.Kind == ast.KindIfStatement {
		if node.Parent.Kind == ast.KindIfStatement && node.Parent.AsIfStatement().ElseStatement == node {
			return true
		}
		for current := node; current != nil; {
			statement := current.AsIfStatement()
			checks = append(checks, rule.braceCheck(statement.ThenStatement, "if", true))
			if statement.ElseStatement == nil {
				break
			}
			if statement.ElseStatement.Kind == ast.KindIfStatement {
				current = statement.ElseStatement
			} else {
				checks = append(checks, rule.braceCheck(statement.ElseStatement, "else", false))
				break
			}
		}
		if helpers.SyntaxOption(rule.context, 1) == "consistent" {
			expected := 0
			for _, check := range checks {
				if check.expected == 1 || check.expected == -1 && check.body.Kind == ast.KindBlock {
					expected = 1
				}
			}
			for index := range checks {
				checks[index].expected = expected
			}
		}
	} else {
		name, condition := "", false
		switch node.Kind {
		case ast.KindForStatement:
			name, condition = "for", true
		case ast.KindForInStatement:
			name = "for-in"
		case ast.KindForOfStatement:
			name = "for-of"
		case ast.KindWhileStatement:
			name, condition = "while", true
		case ast.KindDoStatement:
			name = "do"
		default:
			return true
		}
		checks = append(checks, rule.braceCheck(node.Statement(), name, condition))
	}
	for _, check := range checks {
		hasBlock := check.body.Kind == ast.KindBlock
		if check.expected < 0 || hasBlock == (check.expected == 1) {
			continue
		}
		message := diagnostics.Expected_after_0
		if check.expected == 0 {
			message = diagnostics.Unnecessary_after_0
		}
		if check.condition {
			if check.expected == 0 {
				message = diagnostics.Unnecessary_after_0_condition
			} else {
				message = diagnostics.Expected_after_0_condition
			}
		}
		diagnostic := rule.context.Report(rule.context.Range(check.body), message, check.name)
		helpers.SyntaxFix(rule.context, "curly", diagnostic, check.body, func(tracker *change.Tracker) *ast.Node {
			if hasBlock {
				return check.body.Statements()[0]
			}
			return tracker.NewBlock(tracker.NewNodeList([]*ast.Node{check.body}), true)
		})
	}
	return true
}

type curlyBraceCheck struct {
	body      *ast.Node
	name      string
	condition bool
	expected  int
}

func (rule *curlyRule) braceCheck(body *ast.Node, name string, condition bool) curlyBraceCheck {
	mode := helpers.StringOptionValue(helpers.SyntaxOption(rule.context, 0), "all")
	expected := 1
	hasBlock := body.Kind == ast.KindBlock
	if hasBlock && (len(body.Statements()) != 1 || curlyBracesNecessary(body)) {
		return curlyBraceCheck{body, name, condition, 1}
	}
	switch mode {
	case "multi":
		expected = 0
	case "multi-line":
		start := body.Pos()
		end := body.End()
		if strings.ContainsAny(rule.context.File.Text()[start:end], "\r\n\u2028\u2029") {
			expected = 1
		} else {
			expected = -1
		}
	case "multi-or-nest":
		statement := body
		if hasBlock {
			statement = body.Statements()[0]
		}
		start := scanner.GetTokenPosOfNode(statement, rule.context.File, false)
		if !strings.ContainsAny(rule.context.File.Text()[start:statement.End()], "\r\n\u2028\u2029") && (!hasBlock || len(helpers.SyntaxComments(rule.context, body.Pos(), start)) == 0) {
			expected = 0
		}
	}
	return curlyBraceCheck{body, name, condition, expected}
}

func curlyBracesNecessary(body *ast.Node) bool {
	statement := body.Statements()[0]
	if statement.Kind == ast.KindVariableStatement {
		return statement.AsVariableStatement().DeclarationList.Flags&ast.NodeFlagsBlockScoped != 0
	}
	switch statement.Kind {
	case ast.KindClassDeclaration, ast.KindFunctionDeclaration:
		return true
	}
	if body.Parent != nil && body.Parent.Kind == ast.KindIfStatement && body.Parent.AsIfStatement().ThenStatement == body && body.Parent.AsIfStatement().ElseStatement != nil {
		for statement != nil {
			if statement.Kind == ast.KindIfStatement {
				if statement.AsIfStatement().ElseStatement == nil {
					return true
				}
				statement = statement.AsIfStatement().ElseStatement
			} else if ast.IsIterationStatement(statement, false) || statement.Kind == ast.KindWithStatement || statement.Kind == ast.KindLabeledStatement {
				statement = statement.Statement()
			} else {
				break
			}
		}
	}
	return false
}
