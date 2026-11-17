package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
)

type Rule interface {
	OnEnterNode(node *ast.Node) bool
	OnExitNode(node *ast.Node)
}

type Context struct {
	CompilerOptions  *core.CompilerOptions
	CurrentDirectory tspath.RootedDirectoryPath
	File             *ast.SourceFile
	Options          []any
	GetChecker       func() *checker.Checker
	NewTracker       func() *change.Tracker
	Report           func(location core.TextRange, message *diagnostics.Message, args ...any) *ast.Diagnostic
}

func (context Context) Range(node *ast.Node) core.TextRange {
	return core.NewTextRange(scanner.GetTokenPosOfNode(node, context.File, false), node.End())
}

type Factory func(context Context) Rule

type SuggestionProvider interface {
	Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction
}
