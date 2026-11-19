package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noUnreachable struct {
	helpers.SharedControlFlowContext
	states       map[*ast.Node]uint8
	constructors []*noUnreachableConstructor
	fields       []*ast.Node
}

func newNoUnreachable(context Context) Rule {
	rule := &noUnreachable{Context: context}

	return Rule{
		Enter: rule.OnEnterNode,
		EnterKinds: []ast.Kind{
			ast.KindFunctionDeclaration,
			ast.KindFunctionExpression,
			ast.KindArrowFunction,
			ast.KindMethodDeclaration,
			ast.KindGetAccessor,
			ast.KindSetAccessor,
			ast.KindConstructor,
			ast.KindMethodSignature,
			ast.KindCallSignature,
			ast.KindJSDocSignature,
			ast.KindConstructSignature,
			ast.KindIndexSignature,
			ast.KindFunctionType,
			ast.KindConstructorType,
			ast.KindSourceFile,
			ast.KindClassStaticBlockDeclaration,
			ast.KindCallExpression,
		},
		Exit:      rule.OnExitNode,
		ExitKinds: []ast.Kind{ast.KindConstructor, ast.KindSourceFile},
	}
}

func (rule *noUnreachable) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindConstructor {
		rule.constructors = append(rule.constructors, &noUnreachableConstructor{})
	}
	if node.Kind == ast.KindCallExpression && node.Expression().Kind == ast.KindSuperKeyword && len(rule.constructors) != 0 {
		rule.constructors[len(rule.constructors)-1].hasSuperCall = true
	}
	if node.Kind == ast.KindSourceFile || ast.IsFunctionLike(node) && node.Body() != nil || node.Kind == ast.KindClassStaticBlockDeclaration {
		if bound, ok := helpers.ControlFlowBinderStatements(node); ok {
			if rule.states == nil {
				rule.states = make(map[*ast.Node]uint8)
			}
			for statement, reachable := range bound.Statements {
				if reachable {
					rule.states[statement] |= 1
				} else if _, exists := rule.states[statement]; !exists {
					rule.states[statement] = 0
				}
			}
			return true
		}
		return rule.EnterGraph(node, nil)
	}
	return true
}

func (rule *noUnreachable) OnExitNode(node *ast.Node) {
	if node.Kind == ast.KindConstructor {
		index := len(rule.constructors) - 1
		constructor := rule.constructors[index]
		rule.constructors = rule.constructors[:index]
		if node.Body() != nil && helpers.ControlFlowBase(node) != nil && !constructor.hasSuperCall {
			for _, member := range node.Parent.Members() {
				if member.Kind == ast.KindPropertyDeclaration && ast.GetCombinedModifierFlags(member)&ast.ModifierFlagsStatic == 0 {
					rule.fields = append(rule.fields, member)
				}
			}
		}
	}
	if node.Kind != ast.KindSourceFile {
		return
	}
	rule.unreachable()
}

type noUnreachableConstructor struct {
	hasSuperCall bool
}

func controlFlowUnreachableStatement(node *ast.Node) bool {
	switch node.Kind {
	case ast.KindFunctionDeclaration, ast.KindImportDeclaration, ast.KindInterfaceDeclaration, ast.KindTypeAliasDeclaration, ast.KindEmptyStatement:
		return false
	case ast.KindVariableStatement:
		list := node.AsVariableStatement().DeclarationList.AsVariableDeclarationList()
		if list.Flags&ast.NodeFlagsBlockScoped != 0 {
			return true
		}
		for _, declaration := range list.Declarations.Nodes {
			if declaration.Initializer() != nil {
				return true
			}
		}
		return false
	}
	return true
}

func (rule *noUnreachable) unreachable() {
	states := rule.states
	if states == nil {
		states = make(map[*ast.Node]uint8)
	}
	for _, graph := range rule.Graphs {
		for node, segments := range graph.Statements {
			states[node] |= helpers.ControlFlowState(segments)
		}
	}
	for _, field := range rule.fields {
		states[field] = 0
	}
	var nodes []*ast.Node
	for node, state := range states {
		if state == 0 && controlFlowUnreachableStatement(node) {
			nodes = append(nodes, node)
		}
	}
	slices.SortFunc(nodes, func(left, right *ast.Node) int {
		if left.Pos() != right.Pos() {
			return left.Pos() - right.Pos()
		}
		return right.End() - left.End()
	})
	var start *ast.Node
	end := 0
	flush := func() {
		if start != nil {
			rule.Context.Report(
				core.NewTextRange(scanner.GetTokenPosOfNode(start, rule.Context.File, false), end), diagnostics.Unreachable_code)
		}
	}
	for _, node := range nodes {
		position := scanner.GetTokenPosOfNode(node, rule.Context.File, false)
		if start != nil && node.End() <= end {
			continue
		}
		consecutive := false
		if start != nil {
			tokenScanner := scanner.NewScanner()
			tokenScanner.SetText(rule.Context.File.Text()[end:position])
			tokenScanner.SetSkipTrivia(true)
			consecutive = tokenScanner.Scan() == ast.KindEndOfFile
		}
		if !consecutive {
			flush()
			start = node
		}
		end = node.End()
	}
	flush()
}
