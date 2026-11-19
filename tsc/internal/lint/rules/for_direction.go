package rules

import (
	"math"
	"strconv"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type forDirectionRule struct {
	context Context
	model   *helpers.TsScopeModel
}

func newForDirection(context Context) Rule {
	rule := &forDirectionRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindForStatement},
	}
}

func (rule *forDirectionRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindForStatement {
		rule.forDirection(node)
	}

	return true
}

func (rule *forDirectionRule) Binding(node *ast.Node) *helpers.TsScopeBinding {
	model := rule.Bindings()
	if binding := model.Decls[node]; binding != nil {
		return binding
	}
	if frame := model.Nodes[node]; frame != nil {
		return frame.Find(node.Text())
	}
	return nil
}

func (rule *forDirectionRule) Bindings() *helpers.TsScopeModel {
	if rule.model == nil {
		rule.model = helpers.NewTScopeModel(rule.context)
	}
	return rule.model
}

func (rule *forDirectionRule) forDirection(node *ast.Node) {
	loop := node.AsForStatement()
	if loop.Condition == nil || loop.Incrementor == nil {
		return
	}
	condition := ast.SkipParentheses(loop.Condition)
	if condition.Kind != ast.KindBinaryExpression {
		return
	}
	binary := condition.AsBinaryExpression()
	wrong := 0
	switch binary.OperatorToken.Kind {
	case ast.KindLessThanToken, ast.KindLessThanEqualsToken:
		wrong = -1
	case ast.KindGreaterThanToken, ast.KindGreaterThanEqualsToken:
		wrong = 1
	default:
		return
	}
	for index, counter := range []*ast.Node{ast.SkipParentheses(binary.Left), ast.SkipParentheses(binary.Right)} {
		if counter.Kind != ast.KindIdentifier {
			continue
		}
		count, direction := 0, 0
		var visit func(*ast.Node)
		visit = func(update *ast.Node) {
			update = ast.SkipParentheses(update)
			if update.Kind == ast.KindBinaryExpression {
				expression := update.AsBinaryExpression()
				if expression.OperatorToken.Kind == ast.KindCommaToken {
					visit(expression.Left)
					visit(expression.Right)
					return
				}
				left := ast.SkipParentheses(expression.Left)
				if !ast.IsAssignmentOperator(expression.OperatorToken.Kind) || left.Kind != ast.KindIdentifier || left.Text() != counter.Text() {
					return
				}
				count++
				if expression.OperatorToken.Kind == ast.KindPlusEqualsToken || expression.OperatorToken.Kind == ast.KindMinusEqualsToken {
					if value, ok := rule.number(expression.Right, make(map[*ast.Node]bool)); ok && !math.IsNaN(value) && value != 0 {
						direction = 1
						if value < 0 {
							direction = -1
						}
						if expression.OperatorToken.Kind == ast.KindMinusEqualsToken {
							direction = -direction
						}
					}
				}
			} else if update.Kind == ast.KindPrefixUnaryExpression || update.Kind == ast.KindPostfixUnaryExpression {
				var operand *ast.Node
				var operator ast.Kind
				if update.Kind == ast.KindPostfixUnaryExpression {
					operand, operator = update.AsPostfixUnaryExpression().Operand, update.AsPostfixUnaryExpression().Operator
				} else {
					operand, operator = update.AsPrefixUnaryExpression().Operand, update.AsPrefixUnaryExpression().Operator
				}
				operand = ast.SkipParentheses(operand)
				if operand.Kind != ast.KindIdentifier || operand.Text() != counter.Text() || operator != ast.KindPlusPlusToken && operator != ast.KindMinusMinusToken {
					return
				}
				count++
				direction = 1
				if operator == ast.KindMinusMinusToken {
					direction = -1
				}
			}
		}
		visit(loop.Incrementor)
		expected := wrong
		if index == 1 {
			expected = -expected
		}
		if count == 1 && direction == expected {

			lexer := scanner.NewScanner()
			lexer.SetText(rule.context.File.Text())
			lexer.SetSkipTrivia(true)
			lexer.ResetPos(loop.Incrementor.End())
			lexer.Scan()
			rule.context.Report(

				core.NewTextRange(scanner.GetTokenPosOfNode(node, rule.context.File, false), lexer.TokenEnd()), diagnostics.The_update_clause_in_this_loop_moves_the_variable_in_the_wrong_direction)

		}
	}
}

func (rule *forDirectionRule) number(node *ast.Node, seen map[*ast.Node]bool) (float64, bool) {
	if node == nil {
		return 0, false
	}
	node = ast.SkipParentheses(node)
	if seen[node] {
		return 0, false
	}
	seen[node] = true
	defer delete(seen, node)
	switch node.Kind {
	case ast.KindNumericLiteral, ast.KindBigIntLiteral:
		text := strings.TrimSuffix(strings.ReplaceAll(node.Text(), "_", ""), "n")
		if len(text) > 2 && text[0] == '0' && strings.ContainsAny(text[1:2], "xXoObB") {
			value, err := strconv.ParseUint(text, 0, 64)
			return float64(value), err == nil
		}
		value, err := strconv.ParseFloat(text, 64)
		return value, err == nil
	case ast.KindTrueKeyword:
		return 1, true
	case ast.KindFalseKeyword:
		return 0, true
	case ast.KindIdentifier:
		if node.Text() == "Infinity" && rule.Binding(node) == nil {
			return math.Inf(1), true
		}
		if node.Text() == "NaN" && rule.Binding(node) == nil {
			return math.NaN(), true
		}
		if rule.context.GetChecker == nil {
			return 0, false
		}
		symbol := rule.context.GetChecker().GetSymbolAtLocation(node)
		if symbol != nil && len(symbol.Declarations()) == 1 {
			declaration := symbol.Declarations()[0]
			binding := rule.Binding(node)
			if declaration.Kind == ast.KindVariableDeclaration && binding != nil && rule.stable(binding) {
				return rule.number(declaration.Initializer(), seen)
			}
		}
	case ast.KindPrefixUnaryExpression:
		unary := node.AsPrefixUnaryExpression()
		value, ok := rule.number(unary.Operand, seen)
		if ok {
			switch unary.Operator {
			case ast.KindPlusToken:
				return value, true
			case ast.KindMinusToken:
				return -value, true
			case ast.KindExclamationToken:
				if value == 0 || math.IsNaN(value) {
					return 1, true
				}
				return 0, true
			case ast.KindTildeToken:
				return float64(^int32(value)), true
			}
		}
	case ast.KindBinaryExpression:
		binary := node.AsBinaryExpression()
		left, leftOK := rule.number(binary.Left, seen)
		right, rightOK := rule.number(binary.Right, seen)
		if leftOK && rightOK {
			switch binary.OperatorToken.Kind {
			case ast.KindPlusToken:
				return left + right, true
			case ast.KindMinusToken:
				return left - right, true
			case ast.KindAsteriskToken:
				return left * right, true
			case ast.KindSlashToken:
				return left / right, true
			case ast.KindPercentToken:
				return math.Mod(left, right), true
			case ast.KindAsteriskAsteriskToken:
				return math.Pow(left, right), true
			case ast.KindLessThanLessThanToken:
				return float64(int32(left) << (uint32(right) & 31)), true
			case ast.KindGreaterThanGreaterThanToken:
				return float64(int32(left) >> (uint32(right) & 31)), true
			case ast.KindGreaterThanGreaterThanGreaterThanToken:
				return float64(uint32(left) >> (uint32(right) & 31)), true
			case ast.KindBarToken:
				return float64(int32(left) | int32(right)), true
			case ast.KindAmpersandToken:
				return float64(int32(left) & int32(right)), true
			case ast.KindCaretToken:
				return float64(int32(left) ^ int32(right)), true
			}
		}
	}
	return 0, false
}

func (rule *forDirectionRule) stable(binding *helpers.TsScopeBinding) bool {
	for _, reference := range binding.References {
		if reference.Write {
			return false
		}
	}
	return true
}
