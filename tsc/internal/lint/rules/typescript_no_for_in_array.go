package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoForInArrayRule struct{ context Context }

func (rule *typescriptNoForInArrayRule) arrayLike(valueType *checker.Type) bool {
	if valueType.Flags()&checker.TypeFlagsUnionOrIntersection != 0 {
		return slices.ContainsFunc(valueType.Types(), rule.arrayLike)
	}
	typeChecker := rule.context.GetChecker()
	length := typeChecker.GetPropertyOfType(valueType, "length")
	return length != nil && typeChecker.GetIndexTypeOfType(valueType, typeChecker.GetNumberType()) != nil &&
		typeChecker.GetTypeOfSymbol(length).Flags()&checker.TypeFlagsNumberLike != 0
}

func (rule *typescriptNoForInArrayRule) forIn(node *ast.Node) {
	if !rule.arrayLike(helpers.TypeSafetyConstrainedNode(rule.context, node.Expression())) {
		return
	}
	start := scanner.GetTokenPosOfNode(node, rule.context.File, false)
	tokens := scanner.GetScannerForSourceFile(rule.context.File, node.Expression().End())
	end := node.Expression().End()
	for tokens.Token() != ast.KindEndOfFile && tokens.TokenEnd() <= node.Statement().Pos() {
		if tokens.Token() == ast.KindCloseParenToken {
			end = tokens.TokenEnd()
		}
		tokens.Scan()
	}
	rule.context.Report(core.NewTextRange(start, end), diagnostics.For_in_loops_over_arrays_skips_holes_returns_indices_as_strings_and_may_visit_the_prototype_chain_or_other_enumerable_properties_Use_a_more_robust_iteration_method_such_as_for_of_or_array_forEach_instead)
}

func (rule *typescriptNoForInArrayRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindForInStatement {
		rule.forIn(node)
	}
	return true
}

func (rule *typescriptNoForInArrayRule) OnExitNode(node *ast.Node) {}

func newTypeScriptNoForInArray(context Context) Rule {
	return &typescriptNoForInArrayRule{context: context}
}
