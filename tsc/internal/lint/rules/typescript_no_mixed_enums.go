package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type typeScriptNoMixedEnums struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptNoMixedEnums(context Context) Rule {
	rule := &typeScriptNoMixedEnums{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindEnumDeclaration},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typeScriptNoMixedEnums) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindEnumDeclaration {
		rule.mixedEnum(node)
	}
	return true
}

func (rule *typeScriptNoMixedEnums) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typeScriptNoMixedEnums) enumMemberKind(member *ast.Node) int {
	initializer := member.Initializer()
	if initializer == nil {
		return 0
	}
	switch initializer.Kind {
	case ast.KindNumericLiteral:
		return 0
	case ast.KindStringLiteral, ast.KindNoSubstitutionTemplateLiteral, ast.KindTemplateExpression:
		return 1
	case ast.KindTrueKeyword, ast.KindFalseKeyword, ast.KindNullKeyword, ast.KindBigIntLiteral, ast.KindRegularExpressionLiteral:
		return 2
	}
	if rule.context.GetChecker().GetTypeAtLocation(initializer).Flags()&checker.TypeFlagsStringLike != 0 {
		return 1
	}
	return 0
}

func (rule *typeScriptNoMixedEnums) mixedEnum(node *ast.Node) {
	members := node.AsEnumDeclaration().Members.Nodes
	if len(members) == 0 {
		return
	}
	desired := rule.enumMemberKind(members[0])
	typeChecker := rule.context.GetChecker()
	symbol := typeChecker.GetSymbolAtLocation(node.Name())
	if symbol != nil {
		for _, declaration := range typeChecker.GetMergedSymbol(symbol).Declarations() {
			if declaration == node || declaration.Kind != ast.KindEnumDeclaration || len(declaration.AsEnumDeclaration().Members.Nodes) == 0 {
				continue
			}
			if ast.GetSourceFileOfNode(declaration) != rule.context.File {
				if typeChecker.GetTypeAtLocation(declaration.AsEnumDeclaration().Members.Nodes[0]).Flags()&checker.TypeFlagsStringLike != 0 {
					desired = 1
				} else {
					desired = 0
				}
				break
			}
			if declaration.Pos() < node.Pos() {
				desired = rule.enumMemberKind(declaration.AsEnumDeclaration().Members.Nodes[0])
				break
			}
		}
	}
	if desired == 2 {
		return
	}
	for _, member := range members {
		current := rule.enumMemberKind(member)
		if current == 2 {
			return
		}
		if current != desired {
			reportNode := member.Initializer()
			if reportNode == nil {
				reportNode = member
			}
			rule.context.Report(rule.context.Range(reportNode), diagnostics.Mixing_number_and_string_enums_can_be_confusing)
			return
		}
	}
}
