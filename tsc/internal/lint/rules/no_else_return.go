package rules

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/astnav"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noElseReturn struct{ helpers.ReturnRuleContext }

func (rule *noElseReturn) OnEnterNode(node *ast.Node) bool { return true }
func (rule *noElseReturn) OnExitNode(node *ast.Node) {
	if node.Kind == ast.KindIfStatement {
		rule.elseReturn(node)
	}
}

func completionElseNaiveReturn(node *ast.Node) bool {
	if node.Kind == ast.KindBlock {
		body := node.AsBlock().Statements.Nodes
		return len(body) != 0 && body[len(body)-1].Kind == ast.KindReturnStatement
	}
	return node.Kind == ast.KindReturnStatement
}

func completionElseReturns(node *ast.Node) bool {
	check := func(statement *ast.Node) bool {
		if statement.Kind == ast.KindReturnStatement {
			return true
		}
		if statement.Kind == ast.KindIfStatement {
			branch := statement.AsIfStatement()
			return branch.ElseStatement != nil && completionElseNaiveReturn(branch.ThenStatement) && completionElseNaiveReturn(branch.ElseStatement)
		}
		return false
	}
	if node.Kind != ast.KindBlock {
		return check(node)
	}
	return slices.ContainsFunc(node.AsBlock().Statements.Nodes, check)
}

func (rule *noElseReturn) elseSafe(alternate *ast.Node) bool {
	if alternate.Kind == ast.KindFunctionDeclaration {
		return false
	}
	if alternate.Kind != ast.KindBlock {
		return true
	}
	names := make(map[string]bool)
	var binding func(*ast.Node)
	binding = func(node *ast.Node) {
		if node == nil {
			return
		}
		if node.Kind == ast.KindIdentifier {
			names[node.Text()] = true
			return
		}
		if ast.IsBindingPattern(node) {
			node.ForEachChild(func(child *ast.Node) bool {
				if child.Kind == ast.KindBindingElement {
					binding(child.Name())
				}
				return false
			})
		}
	}
	for _, statement := range alternate.AsBlock().Statements.Nodes {
		switch statement.Kind {
		case ast.KindFunctionDeclaration, ast.KindClassDeclaration:
			binding(statement.Name())
		case ast.KindVariableStatement:
			list := statement.AsVariableStatement().DeclarationList
			if list.Flags&ast.NodeFlagsBlockScoped != 0 {
				for _, declaration := range list.AsVariableDeclarationList().Declarations.Nodes {
					binding(declaration.Name())
				}
			}
		}
	}
	if len(names) == 0 {
		return true
	}
	owner := alternate.Parent.Parent
	for !helpers.ReturnListParent(owner) && owner.Parent != nil {
		owner = owner.Parent
	}
	containers := []*ast.Node{owner}
	if owner.Parent != nil && (helpers.ReturnFunction(owner.Parent) || owner.Parent.Kind == ast.KindCatchClause) {
		containers = append(containers, owner.Parent)
	}
	for _, container := range containers {
		for name := range names {
			if symbol := container.Locals().Get(name); symbol != nil && len(symbol.Declarations()) != 0 {
				return false
			}
		}
	}
	safe := true
	var walk func(*ast.Node)
	walk = func(node *ast.Node) {
		if node == alternate || !safe {
			return
		}
		if node.Kind == ast.KindIdentifier && names[node.Text()] && helpers.TsScopeReferenceNode(node) {
			if rule.Context.GetChecker == nil {
				safe = false
				return
			}
			symbol := rule.Context.GetChecker().GetSymbolAtLocation(node)
			if symbol == nil {
				safe = false
				return
			}
			for _, declaration := range symbol.Declarations() {
				if declaration.Pos() < owner.Pos() || declaration.End() > owner.End() {
					safe = false
					return
				}
			}
		}
		node.ForEachChild(func(child *ast.Node) bool { walk(child); return false })
	}
	walk(owner)
	if helpers.ReturnFunction(owner.Parent) {
		for _, parameter := range owner.Parent.Parameters() {
			walk(parameter)
		}
	}
	return safe
}

func (rule *noElseReturn) elseReturn(node *ast.Node) {
	if !helpers.ReturnListParent(node.Parent) {
		return
	}
	statement := node.AsIfStatement()
	alternate := statement.ElseStatement
	if alternate == nil || !completionElseReturns(statement.ThenStatement) {
		return
	}
	if rule.Option("allowElseIf", true) {
		for alternate.Kind == ast.KindIfStatement {
			branch := alternate.AsIfStatement()
			if branch.ElseStatement == nil || !completionElseReturns(branch.ThenStatement) {
				return
			}
			alternate = branch.ElseStatement
		}
	}
	report := rule.Context.Report(rule.Context.Range(alternate), diagnostics.Unnecessary_else_after_return)
	if !rule.elseSafe(alternate) {
		return
	}
	elseToken := astnav.FindPrecedingToken(rule.Context.File, rule.Start(alternate))
	if elseToken == nil || elseToken.Kind != ast.KindElseKeyword {
		return
	}
	lastIf := astnav.FindPrecedingToken(rule.Context.File, rule.Start(elseToken))
	first := astnav.GetTokenAtPosition(rule.Context.File, rule.Start(alternate))
	last := astnav.FindPrecedingToken(rule.Context.File, alternate.End())
	start, end := rule.Start(alternate), alternate.End()
	if alternate.Kind == ast.KindBlock {
		first = astnav.FindNextToken(first, rule.Context.File.AsNode(), rule.Context.File)
		last = astnav.FindPrecedingToken(rule.Context.File, alternate.End()-1)
		start++
		end--
	}
	unsafe := func(token *ast.Node) bool {
		return token != nil && strings.ContainsAny(rule.Context.File.Text()[rule.Start(token):rule.Start(token)+1], "([/+`-")
	}
	if alternate.Parent.AsIfStatement().ThenStatement.Kind != ast.KindBlock && lastIf != nil && lastIf.Kind != ast.KindSemicolonToken && unsafe(first) {
		return
	}
	if last != nil && last.Kind != ast.KindSemicolonToken {
		next := astnav.FindNextToken(astnav.FindPrecedingToken(rule.Context.File, alternate.End()), rule.Context.File.AsNode(), rule.Context.File)
		if next != nil && (unsafe(next) || !strings.ContainsAny(rule.Context.File.Text()[last.End():rule.Start(next)], "\r\n\u2028\u2029") && next.Kind != ast.KindCloseBraceToken && next.Kind != ast.KindEndOfFile) {
			return
		}
	}
	rule.RetainedFix("no-else-return", report, node, rule.Start(elseToken), alternate.End(), rule.Context.File.Text()[start:end])
}

func newNoElseReturn(context Context) Rule {
	return &noElseReturn{Context: context}
}
