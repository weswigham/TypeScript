package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type strictRule struct {
	context      Context
	strictScopes []bool
	strictMode   string
}

func (rule *strictRule) OnEnterNode(node *ast.Node) bool {
	rule.strictEnter(node)

	return true
}

func (rule *strictRule) OnExitNode(node *ast.Node) {
	if rule.strictMode == "function" && helpers.StyleFunction(node) {
		rule.strictScopes = rule.strictScopes[:len(rule.strictScopes)-1]
	}
}

func (rule *strictRule) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return nil
}

func (rule *strictRule) option(index int, fallback string) string {
	if index < len(rule.context.Options) {
		if value, ok := rule.context.Options[index].(string); ok {
			return value
		}
	}
	return fallback
}

func (rule *strictRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

func (rule *strictRule) strictEnter(node *ast.Node) {
	if node.Kind == ast.KindSourceFile {
		rule.strictMode = rule.option(0, "safe")
		if rule.strictMode == "safe" {
			rule.strictMode = "function"
			if rule.context.File.CommonJSModuleIndicator != nil {
				rule.strictMode = "global"
			}
		}
		if ast.IsExternalModule(rule.context.File) {
			rule.strictMode = "module"
		}
		statements := rule.context.File.Statements.Nodes
		directives := styleDirectives(statements)
		if rule.strictMode == "global" {
			if len(statements) > 0 && len(directives) == 0 {
				rule.context.Report(
					core.NewTextRange(rule.Start(statements[0]), statements[len(statements)-1].End()), diagnostics.Use_the_global_form_of_use_strict)
			}
			if len(directives) > 0 {
				directives = directives[1:]
			}
			for _, directive := range directives {
				rule.strictReport(directive, "multiple")
			}
		} else {
			for _, directive := range directives {
				rule.strictReport(directive, rule.strictMode)
			}
		}
		return
	}
	if !helpers.StyleFunction(node) {
		return
	}
	var directives []*ast.Node
	if node.Body().Kind == ast.KindBlock {
		directives = styleDirectives(node.Body().AsBlock().Statements.Nodes)
	}
	simple := true
	for _, parameter := range node.Parameters() {
		if parameter.Name().Kind != ast.KindIdentifier || parameter.Initializer() != nil || parameter.AsParameterDeclaration().DotDotDotToken != nil {
			simple = false
		}
	}
	parentStrict := len(rule.strictScopes) > 0 && rule.strictScopes[len(rule.strictScopes)-1]
	if rule.strictMode == "function" {
		if len(directives) > 0 {
			if !simple {
				rule.strictReport(directives[0], "parameters")
			} else if parentStrict {
				rule.strictReport(directives[0], "unnecessary")
			} else if styleInClass(node) {
				rule.strictReport(directives[0], "class")
			}
		} else if len(rule.strictScopes) == 0 && !styleInClass(node) {
			if simple {
				rule.strictReport(node, "function")
			} else {
				rule.context.Report(rule.context.Range(node), diagnostics.Wrap_0_in_a_function_with_use_strict_directive, helpers.FunctionDiagnosticName(node))
			}
		}
		rule.strictScopes = append(rule.strictScopes, parentStrict || len(directives) > 0)
	} else if len(directives) > 0 {
		if simple {
			for _, directive := range directives {
				rule.strictReport(directive, rule.strictMode)
			}
			return
		}
		rule.strictReport(directives[0], "parameters")
	}
	for _, directive := range directives[min(1, len(directives)):] {
		rule.strictReport(directive, "multiple")
	}
}

func (rule *strictRule) strictReport(node *ast.Node, mode string) {
	message := map[string]*diagnostics.Message{
		"function":    diagnostics.Use_the_function_form_of_use_strict,
		"global":      diagnostics.Use_the_global_form_of_use_strict,
		"multiple":    diagnostics.Multiple_use_strict_directives,
		"never":       diagnostics.Strict_mode_is_not_permitted,
		"unnecessary": diagnostics.Unnecessary_use_strict_directive,
		"module":      diagnostics.X_use_strict_is_unnecessary_inside_of_modules,
		"class":       diagnostics.X_use_strict_is_unnecessary_inside_of_classes,
		"parameters":  diagnostics.X_use_strict_directive_inside_a_function_with_non_simple_parameter_list_throws_a_syntax_error_since_ES2016,
	}[mode]
	diagnostic := rule.context.Report(rule.context.Range(node), message)
	if rule.context.NewTracker == nil || mode != "multiple" && mode != "unnecessary" && mode != "module" && mode != "class" {
		return
	}
	tracker := rule.context.NewTracker()
	tracker.DeleteNode(rule.context.File, node, change.LeadingTriviaOptionExclude, change.TrailingTriviaOptionExclude)
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("strict", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, "strict"), "strict", ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "strict")))
}

func styleDirectives(statements []*ast.Node) []*ast.Node {
	var result []*ast.Node
	for _, statement := range statements {
		if statement.Kind != ast.KindExpressionStatement || statement.Expression().Kind != ast.KindStringLiteral || statement.Expression().Text() != "use strict" {
			break
		}
		result = append(result, statement)
	}
	return result
}

func styleInClass(node *ast.Node) bool {
	for current := node; current.Parent != nil; current = current.Parent {
		if ast.IsClassLike(current.Parent) {
			if slices.Contains(current.Parent.Members(), current) {
				return true
			}
		}
	}
	return false
}

func newStrict(context Context) Rule { return &strictRule{context: context} }
