package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/locale"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
)

type Rule interface {
	OnEnterNode(node *ast.Node) bool
	OnExitNode(node *ast.Node)
}

type Context struct {
	File       *ast.SourceFile
	Locale     locale.Locale
	GetChecker func() *checker.Checker
	NewTracker func() *change.Tracker
	Report     func(node *ast.Node, message *diagnostics.Message, args ...any) *ast.Diagnostic
}

type Factory func(context Context) Rule

var Factories = map[string]Factory{
	"no-debugger": func(context Context) Rule { return &noDebugger{context: context} },
}
