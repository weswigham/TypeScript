package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noImplicitGlobalsRule struct {
	helpers.LexicalScopeAnalysis
}

func newNoImplicitGlobalsRule(context Context) Rule {
	return &noImplicitGlobalsRule{LexicalScopeAnalysis: helpers.NewLexicalScopeAnalysis(context)}
}

func (rule *noImplicitGlobalsRule) OnEnterNode(node *ast.Node) bool {
	rule.Model.Enter(rule.Context, node)
	return true
}

func (rule *noImplicitGlobalsRule) OnExitNode(node *ast.Node) {
	rule.Model.Exit(node)
	if node.Kind != ast.KindSourceFile {
		return
	}
	rule.Model.Resolve(rule.Context)
	rule.implicitGlobals()
}

func (rule *noImplicitGlobalsRule) implicitGlobals() {
	if ast.IsExternalModule(rule.Context.File) {
		return
	}
	for _, binding := range rule.Model.Bindings {
		if binding.Frame.Parent != nil {
			continue
		}
		if writable, configured := rule.GlobalNames[binding.Name]; configured && writable {
			continue
		}
		seen := make(map[*ast.Node]bool)
		for _, declaration := range binding.Declarations {
			root := helpers.TsScopeRootBinding(declaration)
			if seen[root] {
				continue
			}
			seen[root] = true
			kind := ""
			lexical := false
			switch root.Kind {
			case ast.KindFunctionDeclaration:
				kind = "function"
			case ast.KindClassDeclaration:
				kind, lexical = "class", true
			case ast.KindVariableDeclaration:
				if root.Parent.Kind != ast.KindVariableDeclarationList {
					continue
				}
				flags := root.Parent.Flags
				if flags&ast.NodeFlagsConst != 0 {
					kind, lexical = "'const'", true
				} else if flags&ast.NodeFlagsLet != 0 {
					kind, lexical = "'let'", true
				} else if flags&ast.NodeFlagsBlockScoped == 0 {
					kind = "'var'"
				}
			}
			if kind == "" || lexical && !rule.Boolean("lexicalBindings", false) {
				continue
			}
			if rule.readonlyGlobal(binding.Name) {
				rule.Context.Report(rule.Context.Range(root), diagnostics.Unexpected_redeclaration_of_read_only_global_variable)
			} else if lexical {
				rule.Context.Report(rule.Context.Range(root), diagnostics.Unexpected_0_declaration_in_the_global_scope_wrap_in_a_block_or_in_an_IIFE, kind)
			} else {
				rule.Context.Report(rule.Context.Range(root), diagnostics.Unexpected_0_declaration_in_the_global_scope_wrap_in_an_IIFE_for_a_local_variable_assign_as_global_property_for_a_global_variable, kind)
			}
		}
	}
	for _, identifier := range rule.Model.References {
		if rule.Model.Binding(identifier) != nil || !ast.IsWriteAccess(identifier) {
			continue
		}
		assignment := noImplicitGlobalsAssignment(identifier)
		if assignment == nil {
			continue
		}
		if rule.KnownGlobal(identifier) {
			if rule.readonlyGlobal(identifier.Text()) {
				rule.Context.Report(rule.Context.Range(assignment), diagnostics.Unexpected_assignment_to_read_only_global_variable)
			}
			continue
		}
		if rule.Strict(identifier) {
			continue
		}
		rule.Context.Report(rule.Context.Range(assignment), diagnostics.Global_variable_leak_declare_the_variable_if_it_is_intended_to_be_local)
	}
}

func (rule *noImplicitGlobalsRule) readonlyGlobal(name string) bool {
	if writable, configured := rule.GlobalNames[name]; configured {
		return !writable
	}
	symbol := rule.Context.GetChecker().GetGlobalSymbol(name, ast.SymbolFlagsValue, nil)
	if symbol == nil {
		return false
	}
	if len(symbol.Declarations()) == 0 {
		return name == "undefined" || name == "NaN" || name == "Infinity"
	}
	for _, declaration := range symbol.Declarations() {
		if ast.GetSourceFileOfNode(declaration) != rule.Context.File && (rule.Context.GetChecker().IsLibSymbolForHoverVerbosity(declaration.Symbol()) || declaration.Kind == ast.KindVariableDeclaration && declaration.Parent.Flags&ast.NodeFlagsConst != 0) {
			return true
		}
	}
	return false
}

func noImplicitGlobalsAssignment(node *ast.Node) *ast.Node {
	for current := node.Parent; current != nil; current = current.Parent {
		if ast.IsAssignmentExpression(current, true) {
			if current.AsBinaryExpression().OperatorToken.Kind == ast.KindEqualsToken {
				return current
			}
			return nil
		}
		if ast.IsForInOrOfStatement(current) {
			return current
		}
		if ast.IsFunctionLike(current) || ast.IsStatement(current) || current.Kind == ast.KindPrefixUnaryExpression || current.Kind == ast.KindPostfixUnaryExpression {
			return nil
		}
	}
	return nil
}
