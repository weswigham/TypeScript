package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type oneVarRule struct {
	context     Context
	varScopes   []*styleVarScope
	blockScopes []map[string]*styleVarScope
}

func newOneVar(context Context) Rule {
	rule := &oneVarRule{context: context}

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
			ast.KindBlock,
			ast.KindForStatement,
			ast.KindForInStatement,
			ast.KindForOfStatement,
			ast.KindSwitchStatement,
			ast.KindVariableDeclarationList,
		},
		Exit: rule.OnExitNode,
		ExitKinds: []ast.Kind{
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
			ast.KindBlock,
			ast.KindForStatement,
			ast.KindForInStatement,
			ast.KindForOfStatement,
			ast.KindSwitchStatement,
		},
	}
}

func (rule *oneVarRule) OnEnterNode(node *ast.Node) bool {
	rule.oneVarEnter(node)

	return true
}

func (rule *oneVarRule) OnExitNode(node *ast.Node) {
	if styleVarFunction(node) {
		rule.varScopes = rule.varScopes[:len(rule.varScopes)-1]
		rule.blockScopes = rule.blockScopes[:len(rule.blockScopes)-1]
	} else if styleVarBlock(node) {
		rule.blockScopes = rule.blockScopes[:len(rule.blockScopes)-1]
	}
}

func (rule *oneVarRule) oneVarEnter(node *ast.Node) {
	if styleVarFunction(node) {
		rule.varScopes = append(rule.varScopes, &styleVarScope{})
		rule.blockScopes = append(rule.blockScopes, make(map[string]*styleVarScope))
	} else if styleVarBlock(node) {
		rule.blockScopes = append(rule.blockScopes, make(map[string]*styleVarScope))
	}
	if node.Kind != ast.KindVariableDeclarationList {
		return
	}
	key, kind := styleVarKind(node)
	initializedMode, uninitializedMode := rule.option(0, "always"), rule.option(0, "always")
	options := rule.options(0)
	if options != nil {
		initializedMode, _ = options[key].(string)
		uninitializedMode = initializedMode
		if value, ok := options["initialized"].(string); ok {
			initializedMode = value
		}
		if value, ok := options["uninitialized"].(string); ok {
			uninitializedMode = value
		}
	}
	declarations := node.AsVariableDeclarationList().Declarations.Nodes
	initialized, uninitialized, required := styleVarCounts(declarations)
	statement := node.Parent
	location := node
	if statement.Kind == ast.KindVariableStatement {
		location = statement
	}
	report := func(message *diagnostics.Message, fix string) {
		diagnostic := rule.context.Report(
			core.NewTextRange(rule.Start(node), location.End()), message, kind)

		if fix == "join" {
			rule.oneVarJoin(diagnostic, node)
		} else if fix == "split" {
			rule.oneVarSplit(diagnostic, node, kind)
		}
	}
	if initializedMode == "always" && helpers.BooleanOptionValue(options, "separateRequires", false) && required > 0 && required < len(declarations) {
		rule.context.Report(rule.context.Range(location), diagnostics.Split_requires_to_be_separated_into_a_single_block)
	}
	if statement.Kind == ast.KindVariableStatement {
		previous := stylePreviousStatement(statement)
		if previous != nil && previous.Kind == ast.KindVariableStatement && ast.GetCombinedModifierFlags(statement)&ast.ModifierFlagsExport == 0 && ast.GetCombinedModifierFlags(previous)&ast.ModifierFlagsExport == 0 {
			previousList := previous.AsVariableStatement().DeclarationList
			previousKey, _ := styleVarKind(previousList)
			previousInitialized, previousUninitialized, previousRequired := styleVarCounts(previousList.AsVariableDeclarationList().Declarations.Nodes)
			total := len(declarations) + len(previousList.AsVariableDeclarationList().Declarations.Nodes)
			if key == previousKey && !(required+previousRequired > 0 && required+previousRequired < total) {
				if initializedMode == "consecutive" && uninitializedMode == "consecutive" {
					report(diagnostics.Combine_this_with_the_previous_0_statement, "join")
				} else if initializedMode == "consecutive" && initialized > 0 && previousInitialized > 0 {
					report(diagnostics.Combine_this_with_the_previous_0_statement_with_initialized_variables, "join")
				} else if uninitializedMode == "consecutive" && uninitialized > 0 && previousUninitialized > 0 {
					report(diagnostics.Combine_this_with_the_previous_0_statement_with_uninitialized_variables, "join")
				}
			}
		}
	}
	var scope *styleVarScope
	if key == "var" {
		scope = rule.varScopes[len(rule.varScopes)-1]
	} else {
		block := rule.blockScopes[len(rule.blockScopes)-1]
		scope = block[key]
		if scope == nil {
			scope = &styleVarScope{}
			block[key] = scope
		}
	}
	one := true
	if initializedMode == "always" && uninitializedMode == "always" && (scope.initialized || scope.uninitialized) && required == 0 {
		one = false
	}
	if uninitializedMode == "always" && uninitialized > 0 && scope.uninitialized || initializedMode == "always" && initialized > 0 && scope.initialized && required == 0 || scope.required && required > 0 {
		one = false
	}
	if one {
		if uninitialized > 0 && uninitializedMode == "always" {
			scope.uninitialized = true
		}
		if initializedMode == "always" {
			if required > 0 && helpers.BooleanOptionValue(options, "separateRequires", false) {
				scope.required = true
			}
			if initialized > 0 && (!helpers.BooleanOptionValue(options, "separateRequires", false) || initialized > required) {
				scope.initialized = true
			}
		}
	} else if initializedMode == "always" && uninitializedMode == "always" {
		report(diagnostics.Combine_this_with_the_previous_0_statement, "join")
	} else {
		if initializedMode == "always" && initialized > 0 {
			report(diagnostics.Combine_this_with_the_previous_0_statement_with_initialized_variables, "join")
		}
		if uninitializedMode == "always" && uninitialized > 0 && statement.Kind != ast.KindForInStatement && statement.Kind != ast.KindForOfStatement {
			report(diagnostics.Combine_this_with_the_previous_0_statement_with_uninitialized_variables, "join")
		}
	}
	if statement.Kind != ast.KindForStatement && len(declarations) > 1 {
		if initializedMode == "never" && uninitializedMode == "never" {
			report(diagnostics.Split_0_declarations_into_multiple_statements, "split")
		} else if initializedMode == "never" && initialized > 0 {
			report(diagnostics.Split_initialized_0_declarations_into_multiple_statements, "split")
		} else if uninitializedMode == "never" && uninitialized > 0 {
			report(diagnostics.Split_uninitialized_0_declarations_into_multiple_statements, "split")
		}
	}
}

func (rule *oneVarRule) oneVarJoin(diagnostic *ast.Diagnostic, node *ast.Node) {
	statement := node.Parent
	if statement.Kind != ast.KindVariableStatement || ast.GetCombinedModifierFlags(statement)&ast.ModifierFlagsExport != 0 {
		return
	}
	previous := stylePreviousStatement(statement)
	if previous == nil || previous.Kind != ast.KindVariableStatement || ast.GetCombinedModifierFlags(previous)&ast.ModifierFlagsExport != 0 {
		return
	}
	previousList := previous.AsVariableStatement().DeclarationList
	key, _ := styleVarKind(node)
	previousKey, _ := styleVarKind(previousList)
	if key != previousKey || rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	end := previousList.End()
	lexer := scanner.GetScannerForSourceFile(rule.context.File, end)
	if lexer.Token() == ast.KindSemicolonToken {
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(lexer.TokenStart(), lexer.TokenEnd()), ",")
	} else {
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(end, end), ",")
	}
	lexer = scanner.GetScannerForSourceFile(rule.context.File, rule.Start(node))
	tracker.DeleteRange(rule.context.File, core.NewTextRange(lexer.TokenStart(), lexer.TokenEnd()))
	if key == "awaitUsing" {
		lexer.Scan()
		tracker.DeleteRange(rule.context.File, core.NewTextRange(lexer.TokenStart(), lexer.TokenEnd()))
	}
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("one-var", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, "one-var"), "one-var", ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "one-var")))
}

func (rule *oneVarRule) oneVarSplit(diagnostic *ast.Diagnostic, node *ast.Node, kind string) {
	statement := node.Parent
	if statement.Kind != ast.KindVariableStatement || rule.context.NewTracker == nil {
		return
	}
	if statement.Parent.Kind != ast.KindSourceFile && statement.Parent.Kind != ast.KindBlock && statement.Parent.Kind != ast.KindCaseClause && statement.Parent.Kind != ast.KindDefaultClause && statement.Parent.Kind != ast.KindModuleBlock {
		return
	}
	export := ""
	if ast.GetCombinedModifierFlags(statement)&ast.ModifierFlagsExport != 0 {
		export = "export "
	}
	tracker := rule.context.NewTracker()
	declarations := node.AsVariableDeclarationList().Declarations.Nodes
	for index := 0; index+1 < len(declarations); index++ {
		lexer := scanner.GetScannerForSourceFile(rule.context.File, declarations[index].End())
		if lexer.Token() != ast.KindCommaToken {
			continue
		}
		commaStart, commaEnd := lexer.TokenStart(), lexer.TokenEnd()
		nextStart := rule.Start(declarations[index+1])
		gap := rule.context.File.Text()[commaEnd:nextStart]
		replacement := "; " + export + kind
		end := commaEnd
		if nextStart == commaEnd {
			replacement += " "
		} else if helpers.StyleLines(gap) > 0 || helpers.ContainsCommentTrivia(gap) {
			replacement = ";" + gap + export + kind + " "
			end = nextStart
		}
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(commaStart, end), replacement)
	}
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("one-var", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, "one-var"), "one-var", ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "one-var")))
}

func (rule *oneVarRule) option(index int, fallback string) string {
	if index < len(rule.context.Options) {
		if value, ok := rule.context.Options[index].(string); ok {
			return value
		}
	}
	return fallback
}

func (rule *oneVarRule) options(index int) map[string]any {
	if index < len(rule.context.Options) {
		options, _ := rule.context.Options[index].(map[string]any)
		return options
	}
	return nil
}

func (rule *oneVarRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

type styleVarScope struct {
	initialized   bool
	uninitialized bool
	required      bool
}

func styleVarFunction(node *ast.Node) bool {
	return node.Kind == ast.KindSourceFile || node.Kind == ast.KindClassStaticBlockDeclaration || helpers.StyleFunction(node)
}

func styleVarBlock(node *ast.Node) bool {
	switch node.Kind {
	case ast.KindBlock, ast.KindForStatement, ast.KindForInStatement, ast.KindForOfStatement, ast.KindSwitchStatement:
		return true
	}
	return false
}

func styleVarKind(node *ast.Node) (string, string) {
	switch {
	case node.Flags&ast.NodeFlagsAwaitUsing == ast.NodeFlagsAwaitUsing:
		return "awaitUsing", "await using"
	case node.Flags&ast.NodeFlagsUsing != 0:
		return "using", "using"
	case node.Flags&ast.NodeFlagsConst != 0:
		return "const", "const"
	case node.Flags&ast.NodeFlagsLet != 0:
		return "let", "let"
	}
	return "var", "var"
}

func styleRequire(node *ast.Node) bool {
	initializer := node.Initializer()
	if initializer == nil {
		return false
	}
	initializer = ast.SkipParentheses(initializer)
	return initializer.Kind == ast.KindCallExpression && ast.SkipParentheses(initializer.Expression()).Kind == ast.KindIdentifier && ast.SkipParentheses(initializer.Expression()).Text() == "require"
}

func styleVarCounts(declarations []*ast.Node) (int, int, int) {
	initialized, uninitialized, required := 0, 0, 0
	for _, declaration := range declarations {
		if declaration.Initializer() == nil {
			uninitialized++
		} else {
			initialized++
		}
		if styleRequire(declaration) {
			required++
		}
	}
	return initialized, uninitialized, required
}

func stylePreviousStatement(statement *ast.Node) *ast.Node {
	parent := statement.Parent
	if parent == nil || !parent.CanHaveStatements() {
		return nil
	}
	statements := parent.Statements()
	for index, sibling := range statements {
		if sibling == statement && index > 0 {
			return statements[index-1]
		}
	}
	return nil
}
