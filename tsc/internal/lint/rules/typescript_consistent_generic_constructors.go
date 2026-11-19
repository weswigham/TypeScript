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

type typescriptConsistentGenericConstructorsRule struct {
	context Context
}

func newTypeScriptConsistentGenericConstructors(context Context) Rule {
	rule := &typescriptConsistentGenericConstructorsRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindParameter, ast.KindPropertyDeclaration, ast.KindVariableDeclaration},
	}
}

func (rule *typescriptConsistentGenericConstructorsRule) OnEnterNode(node *ast.Node) bool {
	switch node.Kind {
	case ast.KindVariableDeclaration, ast.KindPropertyDeclaration:
		if node.Kind == ast.KindPropertyDeclaration && node.ModifierFlags()&ast.ModifierFlagsAbstract != 0 {
			return true
		}
	case ast.KindParameter:
		switch node.Parent.Kind {
		case ast.KindFunctionDeclaration, ast.KindFunctionExpression, ast.KindMethodDeclaration, ast.KindConstructor, ast.KindGetAccessor, ast.KindSetAccessor:
			if len(node.ModifierNodes()) != 0 || node.Parent.Body() == nil {
				return true
			}
		default:
			return true
		}
	default:
		return true
	}
	if node.Initializer() == nil {
		return true
	}
	rhs := ast.SkipParentheses(node.Initializer())
	if rhs.Kind != ast.KindNewExpression {
		return true
	}
	callee := ast.SkipParentheses(rhs.Expression())
	if callee.Kind != ast.KindIdentifier {
		return true
	}
	if len(rule.context.Options) > 0 && rule.context.Options[0] == "type-annotation" {
		if node.Type() == nil && rhs.TypeArgumentList() != nil {
			rule.moveToAnnotation(node, rhs, callee)
		}
		return true
	}
	if rule.context.CompilerOptions != nil && rule.context.CompilerOptions.IsolatedDeclarations.IsTrue() || node.Type() == nil {
		return true
	}
	lhs := node.Type()
	for lhs.Kind == ast.KindParenthesizedType {
		lhs = lhs.Type()
	}
	if lhs.Kind != ast.KindTypeReference || len(lhs.TypeArguments()) == 0 || rhs.TypeArgumentList() != nil {
		return true
	}
	typeName := lhs.AsTypeReferenceNode().TypeName
	if typeName.Kind != ast.KindIdentifier || callee.Kind != ast.KindIdentifier || typeName.Text() != callee.Text() || rule.isBuiltInArray(typeName) {
		return true
	}
	colon := helpers.TsAnnotationColon(rule.context, node)
	if colon < 0 {
		return true
	}
	text := rule.context.File.Text()
	tokenScanner := scanner.NewScanner()
	tokenScanner.SetText(text)
	tokenScanner.ResetPos(typeName.End())
	if tokenScanner.Scan() != ast.KindLessThanToken {
		return true
	}
	argumentsStart := tokenScanner.TokenStart()
	arguments := text[argumentsStart:lhs.End()]
	var comments strings.Builder
	tokenScanner.SetSkipTrivia(false)
	tokenScanner.ResetPos(colon)
	for tokenScanner.TokenEnd() < node.Type().End() {
		kind := tokenScanner.Scan()
		if (kind == ast.KindMultiLineCommentTrivia || kind == ast.KindSingleLineCommentTrivia) && (tokenScanner.TokenStart() < argumentsStart || tokenScanner.TokenStart() >= lhs.End()) {
			comments.WriteString(tokenScanner.TokenText())
			if kind == ast.KindSingleLineCommentTrivia {
				comments.WriteByte('\n')
			}
		}
		if kind == ast.KindEndOfFile {
			break
		}
	}
	insert := comments.String() + arguments
	if rhs.AsNewExpression().Arguments == nil {
		insert += "()"
	}
	diagnostic := rule.context.Report(rule.context.Range(node), tsPreferConstructor)
	tracker := rule.context.NewTracker()
	tracker.DeleteRange(rule.context.File, core.NewTextRange(colon, node.Type().End()))
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(rhs.Expression().End(), rhs.Expression().End()), insert)
	const name = "@typescript-eslint/consistent-generic-constructors"
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Move_generic_type_arguments_to_the_constructor), name, ast.NewCompilerDiagnostic(diagnostics.Move_generic_type_arguments_to_constructors)))
	return true
}

var tsPreferConstructor = diagnostics.The_generic_type_arguments_should_be_specified_as_part_of_the_constructor_type_arguments

var tsPreferTypeAnnotation = diagnostics.The_generic_type_arguments_should_be_specified_as_part_of_the_type_annotation

func (rule *typescriptConsistentGenericConstructorsRule) isBuiltInArray(name *ast.Node) bool {
	switch name.Text() {
	case "Float32Array", "Float64Array", "Int16Array", "Int32Array", "Int8Array", "Uint16Array", "Uint32Array", "Uint8Array", "Uint8ClampedArray":
		symbol := rule.context.GetChecker().GetSymbolAtLocation(name)
		for scope := name.Parent; scope != nil; scope = scope.Parent {
			if scope.Locals().Get(name.Text()) != nil {
				return false
			}
		}
		if symbol != nil {
			for _, declaration := range symbol.Declarations() {
				if ast.GetSourceFileOfNode(declaration) == rule.context.File {
					return false
				}
			}
		}
		return true
	default:
		return false
	}
}

func (rule *typescriptConsistentGenericConstructorsRule) moveToAnnotation(node, rhs, callee *ast.Node) {
	text := rule.context.File.Text()
	tokenScanner := scanner.GetScannerForSourceFile(rule.context.File, rhs.Expression().End())
	if tokenScanner.Token() != ast.KindLessThanToken {
		return
	}
	start := tokenScanner.TokenStart()
	tokenScanner.ResetPos(rhs.TypeArgumentList().End())
	if tokenScanner.Scan() != ast.KindGreaterThanToken {
		return
	}
	end := tokenScanner.TokenEnd()
	diagnostic := rule.context.Report(rule.context.Range(node), tsPreferTypeAnnotation)
	tracker := rule.context.NewTracker()
	tracker.DeleteRange(rule.context.File, core.NewTextRange(start, end))
	position := node.Name().End()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(position, position), ": "+callee.Text()+text[start:end])
	const name = "@typescript-eslint/consistent-generic-constructors"
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Move_generic_type_arguments_to_the_type_annotation), name, ast.NewCompilerDiagnostic(diagnostics.Move_generic_type_arguments_to_type_annotations)))
}
