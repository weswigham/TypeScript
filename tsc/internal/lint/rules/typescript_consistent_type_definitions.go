package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptConsistentTypeDefinitionsRule struct {
	context Context
}

func newTypeScriptConsistentTypeDefinitions(context Context) Rule {
	rule := &typescriptConsistentTypeDefinitionsRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindTypeAliasDeclaration, ast.KindInterfaceDeclaration},
	}
}

func (rule *typescriptConsistentTypeDefinitionsRule) OnEnterNode(node *ast.Node) bool {
	rule.typeDefinitions(node)
	return true
}

func (rule *typescriptConsistentTypeDefinitionsRule) typeDefinitions(node *ast.Node) {
	mode := helpers.StringOptionValue(rule.option(0), "interface")
	var objectType *ast.Node
	if node.Kind == ast.KindTypeAliasDeclaration {
		objectType = node.Type()
		for objectType.Kind == ast.KindParenthesizedType {
			objectType = objectType.Type()
		}
	}
	if mode == "interface" && objectType != nil && objectType.Kind == ast.KindTypeLiteral {
		diagnostic := rule.context.Report(rule.context.Range(node.Name()), diagnostics.Use_an_interface_instead_of_a_type)
		if rule.context.NewTracker != nil {
			keyword := rule.keywordRange(node, ast.KindTypeKeyword)
			if keyword.Pos() < 0 {
				return
			}
			objectStart := scanner.GetTokenPosOfNode(objectType, rule.context.File, false)
			lexer := scanner.NewScanner()
			lexer.SetText(rule.context.File.Text())
			lexer.SetSkipTrivia(false)
			lexer.ResetPos(node.Name().End())
			beforeEquals, previousEnd := -1, node.Name().End()
			for kind := lexer.Scan(); kind != ast.KindEndOfFile && lexer.TokenStart() < objectStart; kind = lexer.Scan() {
				if kind == ast.KindEqualsToken {
					beforeEquals = previousEnd
				}
				if !ast.IsTrivia(kind) || kind == ast.KindSingleLineCommentTrivia || kind == ast.KindMultiLineCommentTrivia {
					previousEnd = lexer.TokenEnd()
				}
			}
			if beforeEquals < 0 {
				return
			}
			tracker := rule.context.NewTracker()
			tracker.ReplaceTextRangeWithText(rule.context.File, keyword, "interface")
			tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(beforeEquals, objectStart), " ")
			tracker.DeleteRange(rule.context.File, core.NewTextRange(objectType.End(), node.End()))
			rule.fix(diagnostic, tracker, ast.NewCompilerDiagnostic(diagnostics.Convert_type_alias_to_interface))
		}
	} else if mode == "type" && node.Kind == ast.KindInterfaceDeclaration {
		diagnostic := rule.context.Report(rule.context.Range(node.Name()), diagnostics.Use_a_type_instead_of_an_interface)
		for parent := node.Parent; parent != nil; parent = parent.Parent {
			if ast.IsGlobalScopeAugmentation(parent) && ast.HasSyntacticModifier(parent, ast.ModifierFlagsAmbient) {
				return
			}
		}
		if rule.context.NewTracker == nil {
			return
		}
		keyword := rule.keywordRange(node, ast.KindInterfaceKeyword)
		if keyword.Pos() < 0 {
			return
		}
		headerEnd := node.Name().End()
		if parameters := node.TypeParameterList(); parameters != nil {
			lexer := scanner.GetScannerForSourceFile(rule.context.File, parameters.End())
			if lexer.Token() != ast.KindGreaterThanToken {
				return
			}
			headerEnd = lexer.TokenEnd()
		}
		text := rule.context.File.Text()
		bodyStart := node.AsInterfaceDeclaration().Members.Pos() - 1
		if bodyStart < headerEnd || text[bodyStart] != '{' {
			return
		}
		tracker := rule.context.NewTracker()
		tracker.ReplaceTextRangeWithText(rule.context.File, keyword, "type")
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(headerEnd, bodyStart), " = ")
		var suffix strings.Builder
		for _, base := range ast.GetExtendsHeritageClauseElements(node) {
			suffix.WriteString(" & ")
			suffix.WriteString(text[scanner.GetTokenPosOfNode(base, rule.context.File, false):base.End()])
		}
		if ast.HasSyntacticModifier(node, ast.ModifierFlagsDefault) {
			tracker.DeleteRange(rule.context.File, core.NewTextRange(scanner.GetTokenPosOfNode(node, rule.context.File, false), keyword.Pos()))
			suffix.WriteString("\nexport default ")
			suffix.WriteString(node.Name().Text())
		}
		if suffix.Len() > 0 {
			tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(node.End(), node.End()), suffix.String())
		}
		rule.fix(diagnostic, tracker, ast.NewCompilerDiagnostic(diagnostics.Convert_interface_to_type_alias))
	}
}

func (rule *typescriptConsistentTypeDefinitionsRule) option(index int) any {
	if index < len(rule.context.Options) {
		return rule.context.Options[index]
	}
	return nil
}

func (rule *typescriptConsistentTypeDefinitionsRule) keywordRange(node *ast.Node, kind ast.Kind) core.TextRange {
	lexer := scanner.GetScannerForSourceFile(rule.context.File, scanner.GetTokenPosOfNode(node, rule.context.File, false))
	for lexer.TokenStart() < node.Name().End() && lexer.Token() != ast.KindEndOfFile {
		if lexer.Token() == kind {
			return lexer.TokenRange()
		}
		lexer.Scan()
	}
	return core.NewTextRange(-1, -1)
}

func (rule *typescriptConsistentTypeDefinitionsRule) fix(diagnostic *ast.Diagnostic, tracker *change.Tracker, description *ast.Diagnostic) {
	name := "@typescript-eslint/consistent-type-definitions"
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), description, name, description))
}
