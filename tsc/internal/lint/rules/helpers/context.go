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

// Rule subscribes callbacks to node kinds. A nil kind list selects all kinds;
// an empty list selects none. A false Enter result prunes only this rule's subtree,
// including its Exit callback for that node. Nil callbacks are not invoked, and
// Exit does not require an Enter callback.
type Rule struct {
	Enter          func(*ast.Node) bool
	Exit           func(*ast.Node)
	EnterKinds     []ast.Kind
	ExitKinds      []ast.Kind
	GetSuggestions func() map[*ast.Diagnostic][]*codefix.CodeFixAction
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

// Factory creates per-file rule state and returns its callbacks directly.
type Factory func(context Context) Rule
