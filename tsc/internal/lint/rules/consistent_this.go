package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

func consistentThisLexicalScope(node *ast.Node) *ast.Node {
	for parent := node.Parent; parent != nil; parent = parent.Parent {
		if ast.IsFunctionLike(parent) || parent.Kind == ast.KindSourceFile || parent.Kind == ast.KindCatchClause || parent.Kind == ast.KindClassStaticBlockDeclaration || parent.Kind == ast.KindCaseBlock {
			return parent
		}
		if parent.Kind == ast.KindBlock && !(parent.Parent != nil && ast.IsFunctionLike(parent.Parent) && parent.Parent.Body() == parent) {
			return parent
		}
		if ast.IsIterationStatement(parent, false) && parent.Initializer() != nil && parent.Initializer().Kind == ast.KindVariableDeclarationList && parent.Initializer().Flags&ast.NodeFlagsBlockScoped != 0 {
			return parent
		}
	}
	return nil
}

type consistentThisRule struct {
	context    Context
	thisWrites map[*ast.Symbol][]*ast.Node
}

func newConsistentThisRule(context Context) Rule {
	return &consistentThisRule{context: context}
}

func (rule *consistentThisRule) OnEnterNode(node *ast.Node) bool {
	rule.checkThisAssignment(node)
	return true
}

func (rule *consistentThisRule) OnExitNode(node *ast.Node) {
	rule.checkThisAliases(node)
}

func (rule *consistentThisRule) checkThisAssignment(node *ast.Node) {
	var target, value *ast.Node
	plain := true
	if node.Kind == ast.KindVariableDeclaration {
		target, value = node.Name(), node.Initializer()
	} else if ast.IsAssignmentExpression(node, false) {
		binary := node.AsBinaryExpression()
		target, value = ast.SkipParentheses(binary.Left), binary.Right
		plain = binary.OperatorToken.Kind == ast.KindEqualsToken
	}
	if target == nil || target.Kind != ast.KindIdentifier || value == nil {
		return
	}
	value = ast.SkipParentheses(value)
	isThis := value.Kind == ast.KindThisKeyword
	designated := false
	for _, alias := range rule.thisAliases() {
		designated = designated || alias == target.Text()
	}
	if designated && (!isThis || !plain) {
		rule.context.Report(rule.context.Range(node), diagnostics.Designated_alias_0_is_not_assigned_to_this, target.Text())
	} else if !designated && isThis {
		rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_alias_0_for_this, target.Text())
	}
	if isThis && plain && node.Kind == ast.KindBinaryExpression {
		symbol := rule.context.GetChecker().ResolveName(target.Text(), target, ast.SymbolFlagsValue, false)
		if symbol != nil {
			if rule.thisWrites == nil {
				rule.thisWrites = make(map[*ast.Symbol][]*ast.Node)
			}
			rule.thisWrites[symbol] = append(rule.thisWrites[symbol], node)
		}
	}
}

func (rule *consistentThisRule) checkThisAliases(node *ast.Node) {
	if node.Kind != ast.KindSourceFile && (!helpers.FunctionHasBody(node) || node.Kind == ast.KindArrowFunction) {
		return
	}
	for _, alias := range rule.thisAliases() {
		symbol := node.Locals().Get(alias)
		if symbol == nil && node.Body() != nil {
			symbol = node.Body().Locals().Get(alias)
		}
		if symbol == nil {
			continue
		}
		initialized := false
		for _, declaration := range symbol.Declarations() {
			root := ast.GetRootDeclaration(declaration)
			if root.Kind == ast.KindVariableDeclaration && root.Initializer() != nil {
				initialized = true
				break
			}
		}
		writeSymbol := rule.context.GetChecker().ResolveName(alias, symbol.Declarations()[0], ast.SymbolFlagsValue, false)
		for _, assignment := range rule.thisWrites[writeSymbol] {
			if consistentThisLexicalScope(assignment) == node {
				initialized = true
				break
			}
		}
		if !initialized {
			seen := make(map[*ast.Node]bool)
			for _, declaration := range symbol.Declarations() {
				root := ast.GetRootDeclaration(declaration)
				if !seen[root] {
					seen[root] = true
					rule.context.Report(rule.context.Range(root), diagnostics.Designated_alias_0_is_not_assigned_to_this, alias)
				}
			}
		}
	}
}

func (rule *consistentThisRule) thisAliases() []string {
	if len(rule.context.Options) == 0 {
		return []string{"that"}
	}
	aliases := make([]string, 0, len(rule.context.Options))
	for _, option := range rule.context.Options {
		if alias, ok := option.(string); ok {
			aliases = append(aliases, alias)
		}
	}
	return aliases
}
