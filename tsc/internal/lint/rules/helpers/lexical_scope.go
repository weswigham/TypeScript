package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
)

type LexicalScopeAnalysis struct {
	Context         Context
	Model           LexicalScopeIndex
	CompilerOptions *core.CompilerOptions
	EcmaVersion     int
	GlobalNames     map[string]bool
}

func NewLexicalScopeAnalysis(context Context) LexicalScopeAnalysis {
	return LexicalScopeAnalysis{Context: context, CompilerOptions: context.CompilerOptions, EcmaVersion: 2026}
}

func (scope *LexicalScopeAnalysis) LexicalScope() *LexicalScopeAnalysis {
	return scope
}

func (scope *LexicalScopeAnalysis) Options() map[string]any {
	if len(scope.Context.Options) != 0 {
		options, _ := scope.Context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func (scope *LexicalScopeAnalysis) Boolean(name string, fallback bool) bool {
	if value, ok := scope.Options()[name].(bool); ok {
		return value
	}
	return fallback
}

func (scope *LexicalScopeAnalysis) Global(identifier *ast.Node, allowScriptDeclaration bool) bool {
	if binding := scope.Model.Binding(identifier); binding != nil {
		return allowScriptDeclaration && binding.Frame.Owner.Kind == ast.KindSourceFile && !ast.IsExternalModule(scope.Context.File)
	}
	return true
}

func (scope *LexicalScopeAnalysis) KnownGlobal(identifier *ast.Node) bool {
	if identifier.Text() == "arguments" {
		for frame := scope.Model.Nodes[identifier]; frame != nil; frame = frame.Parent {
			if ast.IsFunctionLike(frame.Owner) && frame.Owner.Kind != ast.KindArrowFunction {
				return true
			}
		}
	}
	return scope.ExternalGlobal(identifier.Text(), identifier)
}

func (scope *LexicalScopeAnalysis) ExternalGlobal(name string, location *ast.Node) bool {
	if scope.GlobalNames != nil {
		_, exists := scope.GlobalNames[name]
		return exists
	}
	if scope.Context.GetChecker != nil {
		var symbol *ast.Symbol
		if location == nil {
			symbol = scope.Context.GetChecker().GetGlobalSymbol(name, ast.SymbolFlagsValue|ast.SymbolFlagsType|ast.SymbolFlagsNamespace, nil)
		} else {
			symbol = scope.Context.GetChecker().ResolveName(name, location, ast.SymbolFlagsValue|ast.SymbolFlagsType|ast.SymbolFlagsNamespace|ast.SymbolFlagsAlias, false)
		}
		if symbol != nil {
			if len(symbol.Declarations()) == 0 {
				return scope.GlobalNames == nil || scope.GlobalNames[name]
			}
			for _, declaration := range symbol.Declarations() {
				if ast.GetSourceFileOfNode(declaration) != scope.Context.File {
					return true
				}
			}
		}
	}
	return false
}
