package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptPreferFunctionTypeRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func newTypeScriptPreferFunctionType(context Context) Rule {
	rule := &typescriptPreferFunctionTypeRule{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindInterfaceDeclaration, ast.KindTypeLiteral},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptPreferFunctionTypeRule) OnEnterNode(node *ast.Node) bool {
	rule.functionType(node)
	return true
}

func (rule *typescriptPreferFunctionTypeRule) functionType(node *ast.Node) {
	if node.Kind != ast.KindInterfaceDeclaration && node.Kind != ast.KindTypeLiteral {
		return
	}
	if len(node.Members()) != 1 {
		return
	}
	member := node.Members()[0]
	if member.Kind != ast.KindCallSignature && member.Kind != ast.KindConstructSignature || member.Type() == nil {
		return
	}
	phrase := "Type literal"
	if node.Kind == ast.KindInterfaceDeclaration {
		phrase = "Interface"
		clauses := node.AsInterfaceDeclaration().HeritageClauses
		if clauses != nil {
			for _, clause := range clauses.Nodes {
				types := clause.AsHeritageClause().Types.Nodes
				if len(types) != 1 || types[0].Kind != ast.KindTypeReference || types[0].AsTypeReferenceNode().TypeName.Kind != ast.KindIdentifier || types[0].AsTypeReferenceNode().TypeName.Text() != "Function" {
					return
				}
			}
		}
		var thisType *ast.Node
		var visit func(*ast.Node)
		visit = func(child *ast.Node) {
			if child.Kind == ast.KindTypeLiteral {
				return
			}
			if child.Kind == ast.KindThisType && thisType == nil {
				thisType = child
			}
			child.ForEachChild(func(next *ast.Node) bool { visit(next); return false })
		}
		visit(member)
		if thisType != nil {
			rule.context.Report(rule.context.Range(thisType), diagnostics.X_this_refers_to_the_function_type_0_did_you_intend_to_use_a_generic_this_parameter_like_Self_this_Colon_Self_Self_instead, node.Name().Text())
			return
		}
	}
	diagnostic := rule.context.Report(rule.context.Range(member), diagnostics.X_0_only_has_a_call_signature_you_should_use_a_function_type_instead, phrase)
	if node.ModifierFlags()&ast.ModifierFlagsDefault != 0 {
		return
	}
	start := scanner.GetTokenPosOfNode(member, rule.context.File, false)
	end := scanner.GetTokenPosOfNode(member.Type(), rule.context.File, false)
	text := rule.context.File.Text()
	colon := end
	scan := scanner.NewScanner()
	scan.SetText(text)
	scan.SetSkipTrivia(true)
	scan.ResetPos(start)
	for scan.TokenEnd() < end {
		kind := scan.Scan()
		if kind == ast.KindColonToken {
			colon = scan.TokenStart()
		}
		if kind == ast.KindEndOfFile {
			break
		}
	}
	replacement := text[start:colon] + " =>" + text[colon+1:member.End()]
	semicolon := ""
	if trimmed, found := strings.CutSuffix(replacement, ";"); found {
		replacement = trimmed
		semicolon = ";"
	}
	replacement = strings.TrimSuffix(replacement, ",")
	if node.Kind == ast.KindInterfaceDeclaration {
		name := helpers.SemanticSourceText(rule.context,

			node.Name())
		if parameters := node.TypeParameters(); len(parameters) != 0 {
			name = text[scanner.GetTokenPosOfNode(node.Name(), rule.context.File, false):parameters[len(parameters)-1].End()] + ">"
		}
		prefix := ""
		if node.ModifierFlags()&ast.ModifierFlagsExport != 0 {
			prefix += "export "
		}
		if node.ModifierFlags()&ast.ModifierFlagsAmbient != 0 {
			prefix += "declare "
		}
		replacement = prefix + "type " + name + " = " + replacement + semicolon
	} else if node.Parent.Kind == ast.KindUnionType || node.Parent.Kind == ast.KindIntersectionType || node.Parent.Kind == ast.KindArrayType {
		replacement = "(" + replacement + ")"
	}
	scan.ResetPos(scanner.GetTokenPosOfNode(node, rule.context.File, false))
	scan.SetSkipTrivia(false)
	bodyStart := scanner.GetTokenPosOfNode(node, rule.context.File, false)
	for scan.TokenEnd() < start {
		kind := scan.Scan()
		if kind == ast.KindOpenBraceToken {
			bodyStart = scan.TokenEnd()
		}
		if kind == ast.KindEndOfFile {
			break
		}
	}
	var comments []string
	for _, bounds := range [][2]int{{bodyStart, start}, {member.End(), node.End()}} {
		scan.ResetPos(bounds[0])
		for scan.TokenEnd() < bounds[1] {
			kind := scan.Scan()
			if kind == ast.KindSingleLineCommentTrivia || kind == ast.KindMultiLineCommentTrivia {
				comment := text[scan.TokenStart():scan.TokenEnd()]
				separator := " "
				if node.Kind == ast.KindInterfaceDeclaration && node.ModifierFlags()&ast.ModifierFlagsExport != 0 || strings.Count(text[:scan.TokenStart()], "\n") != strings.Count(text[:start], "\n") {
					separator = "\n"
				}
				comments = append(comments, comment+separator)
			}
			if kind == ast.KindEndOfFile {
				break
			}
		}
	}
	replacement = strings.Join(comments, "") + replacement
	rule.fix(diagnostic, node, replacement)
}

func (rule *typescriptPreferFunctionTypeRule) fix(diagnostic *ast.Diagnostic, node *ast.Node, text string) {
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(scanner.GetTokenPosOfNode(node, rule.context.File, false), node.End()), text)
	name := "@typescript-eslint/prefer-function-type"
	description := ast.NewCompilerDiagnostic(diagnostics.Use_a_function_type)
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), description, name, description))
}
