package helpers

import (
	"slices"
	"strings"
	"unicode"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/regex"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type SourceCommentContext struct {
	Context Context
}

func FunctionHasBody(node *ast.Node) bool {
	switch node.Kind {
	case ast.KindFunctionDeclaration, ast.KindFunctionExpression, ast.KindArrowFunction, ast.KindMethodDeclaration, ast.KindGetAccessor, ast.KindSetAccessor, ast.KindConstructor:
		return node.Body() != nil
	}
	return false
}

func BooleanOptionValue(object map[string]any, name string, fallback bool) bool {
	if value, ok := object[name].(bool); ok {
		return value
	}
	return fallback
}

func StringOptionValue(value any, fallback string) string {
	if text, ok := value.(string); ok {
		return text
	}
	return fallback
}

func MatchesRegularExpression(pattern string, text string) bool {
	return regex.Compile(pattern).MatchString(text)
}

type SourceComment struct {
	Start, End int
	Text       string
	Kind       ast.Kind
}

func StaticDeclarationNameText(name *ast.Node) (string, bool) {
	if name == nil {
		return "", false
	}
	computed := name.Kind == ast.KindComputedPropertyName
	if computed {
		name = ast.SkipParentheses(name.Expression())
	}
	switch name.Kind {
	case ast.KindIdentifier, ast.KindPrivateIdentifier:
		return name.Text(), !computed
	case ast.KindStringLiteral, ast.KindNumericLiteral, ast.KindBigIntLiteral, ast.KindNoSubstitutionTemplateLiteral:
		return name.Text(), true
	case ast.KindTrueKeyword:
		return "true", true
	case ast.KindFalseKeyword:
		return "false", true
	case ast.KindNullKeyword:
		return "null", true
	}
	return "", false
}

func HasStaticModifier(node *ast.Node) bool {
	return ast.GetCombinedModifierFlags(node)&ast.ModifierFlagsStatic != 0
}

func AccessPropertyNameText(node *ast.Node) string {
	if node == nil {
		return ""
	}
	if node.Kind == ast.KindPropertyAccessExpression {
		return node.Name().Text()
	}
	if node.Kind == ast.KindElementAccessExpression {
		name := ast.SkipParentheses(node.AsElementAccessExpression().ArgumentExpression)
		if name != nil {
			if value, ok := StaticDeclarationNameText(name); ok && name.Kind != ast.KindIdentifier {
				return value
			}
		}
	}
	return ""
}

func IsPropertyDescriptorObject(node *ast.Node) bool {
	if node.Kind != ast.KindObjectLiteralExpression || node.Parent == nil {
		return false
	}
	parent := node.Parent
	if parent.Kind == ast.KindCallExpression {
		callee := ast.SkipParentheses(parent.Expression())
		name := AccessPropertyNameText(callee)
		if (name == "defineProperty") && len(parent.Arguments()) >= 3 && parent.Arguments()[2] == node && ast.IsAccessExpression(callee) {
			object := ast.SkipParentheses(callee.Expression())
			return object.Kind == ast.KindIdentifier && (object.Text() == "Object" || object.Text() == "Reflect")
		}
	}
	if parent.Kind == ast.KindPropertyAssignment && parent.Initializer() == node && parent.Parent.Kind == ast.KindObjectLiteralExpression {
		object := parent.Parent
		call := object.Parent
		if call != nil && call.Kind == ast.KindCallExpression && len(call.Arguments()) >= 2 && call.Arguments()[1] == object {
			callee := ast.SkipParentheses(call.Expression())
			if ast.IsAccessExpression(callee) {
				base := ast.SkipParentheses(callee.Expression())
				name := AccessPropertyNameText(callee)
				return base.Kind == ast.KindIdentifier && base.Text() == "Object" && (name == "create" || name == "defineProperties")
			}
		}
	}
	return false
}

type AccessorPositions struct {
	Getters, Setters []int
}

func UsesLexicalThisOrSuper(node *ast.Node, root *ast.Node, arrowsAreBoundaries bool) bool {
	if node.Kind == ast.KindThisKeyword || node.Kind == ast.KindSuperKeyword {
		return true
	}
	if node != root {
		if node.Kind == ast.KindFunctionDeclaration || node.Kind == ast.KindFunctionExpression || arrowsAreBoundaries && node.Kind == ast.KindArrowFunction || node.Kind == ast.KindClassStaticBlockDeclaration {
			return false
		}
		if node.Kind == ast.KindPropertyDeclaration {
			if node.Name() != nil && node.Name().Kind == ast.KindComputedPropertyName {
				return UsesLexicalThisOrSuper(node.Name(), root, arrowsAreBoundaries)
			}
			return false
		}
		if node.Kind == ast.KindMethodDeclaration || node.Kind == ast.KindGetAccessor || node.Kind == ast.KindSetAccessor || node.Kind == ast.KindConstructor {
			return node.Name() != nil && node.Name().Kind == ast.KindComputedPropertyName && UsesLexicalThisOrSuper(node.Name(), root, arrowsAreBoundaries)
		}
	}
	return node.ForEachChild(func(child *ast.Node) bool {
		return UsesLexicalThisOrSuper(child, root, arrowsAreBoundaries)
	})
}

func StringListOptionValue(value any) []string {
	if values, ok := value.([]string); ok {
		return values
	}
	var result []string
	if values, ok := value.([]any); ok {
		for _, entry := range values {
			if text, ok := entry.(string); ok {
				result = append(result, text)
			}
		}
	}
	return result
}

func StringListOptionContains(value any, text string) bool {
	return slices.Contains(StringListOptionValue(value), text)
}

func IntegerOptionValue(value any, fallback int) int {
	switch number := value.(type) {
	case int:
		return number
	case int32:
		return int(number)
	case int64:
		return int(number)
	case float64:
		return int(number)
	}
	return fallback
}

func WalkSyntaxWhile(node *ast.Node, visitor func(*ast.Node) bool) {
	if visitor(node) {
		node.ForEachChild(func(child *ast.Node) bool {
			WalkSyntaxWhile(child, visitor)
			return false
		})
	}
}

func EnclosingFunctionOrStaticBlock(node *ast.Node) *ast.Node {
	for parent := node.Parent; parent != nil; parent = parent.Parent {
		if FunctionHasBody(parent) || parent.Kind == ast.KindClassStaticBlockDeclaration {
			return parent
		}
	}
	return nil
}

func FunctionDiagnosticName(node *ast.Node) string {
	name := "function"
	if node.Kind == ast.KindArrowFunction {
		return "arrow function"
	}
	if node.Kind == ast.KindConstructor {
		return "constructor"
	}
	if node.Kind == ast.KindGetAccessor {
		name = "getter"
	} else if node.Kind == ast.KindSetAccessor {
		name = "setter"
	} else if node.Kind == ast.KindMethodDeclaration {
		name = "method"
	}
	if node.Name() != nil && (node.Name().Kind == ast.KindIdentifier || node.Name().Kind == ast.KindPrivateIdentifier || node.Name().Kind == ast.KindStringLiteral || node.Name().Kind == ast.KindNumericLiteral) {
		name += " '" + node.Name().Text() + "'"
	}
	return name
}

func CapitalizeFirstRune(text string) string {
	characters := []rune(text)
	if len(characters) > 0 {
		characters[0] = unicode.ToUpper(characters[0])
	}
	return string(characters)
}

var normalizedLineBreaks = strings.NewReplacer("\r\n", "\n", "\r", "\n", "\u2028", "\n", "\u2029", "\n")

func SyntaxOption(context Context, index int) any {
	if index < len(context.Options) {
		return context.Options[index]
	}
	return nil
}

func SyntaxObject(context Context, index int) map[string]any {
	object, _ := SyntaxOption(context, index).(map[string]any)
	return object
}

func SyntaxComments(context Context, start, end int) []SourceComment {
	lexer := scanner.NewScanner()
	lexer.SetText(context.File.Text()[start:end])
	lexer.SetSkipTrivia(false)
	var result []SourceComment
	for kind := lexer.Scan(); kind != ast.KindEndOfFile; kind = lexer.Scan() {
		if kind == ast.KindSingleLineCommentTrivia || kind == ast.KindMultiLineCommentTrivia {
			text := context.File.Text()[start+lexer.TokenStart()+2 : start+lexer.TokenEnd()]
			if kind == ast.KindMultiLineCommentTrivia {
				text = strings.TrimSuffix(text, "*/")
			}
			result = append(result, SourceComment{start + lexer.TokenStart(), start + lexer.TokenEnd(), text, kind})
		}
	}
	return result
}

func SyntaxMaximum(context Context, fallback int) int {
	if options := SyntaxObject(context, 0); options != nil {
		if options["maximum"] != nil && IntegerOptionValue(options["maximum"], 0) != 0 {
			return IntegerOptionValue(options["maximum"], fallback)
		}
		return IntegerOptionValue(options["max"], fallback)
	}
	return IntegerOptionValue(SyntaxOption(context, 0), fallback)
}

func SyntaxLineCount(context Context, node *ast.Node, skipComments, skipBlank bool) int {
	text := context.File.Text()
	start := scanner.GetTokenPosOfNode(node, context.File, false)
	if node.Kind == ast.KindSourceFile {
		start = 0
	}
	startLine := strings.Count(normalizedLineBreaks.Replace(text[:start]), "\n")
	endLine := strings.Count(normalizedLineBreaks.Replace(text[:node.End()]), "\n")
	lines := strings.Split(normalizedLineBreaks.Replace(text), "\n")
	if node.Kind == ast.KindSourceFile && len(lines) > 1 && lines[len(lines)-1] == "" {
		endLine--
	}
	commentOnly := make(map[int]bool)
	if skipComments {
		lexer := scanner.NewScanner()
		lexer.SetText(text)
		lexer.SetSkipTrivia(false)
		codeLines := make(map[int]bool)
		for kind := lexer.Scan(); kind != ast.KindEndOfFile; kind = lexer.Scan() {
			if kind == ast.KindWhitespaceTrivia || kind == ast.KindNewLineTrivia {
				continue
			}
			first := strings.Count(normalizedLineBreaks.Replace(text[:lexer.TokenStart()]), "\n")
			last := strings.Count(normalizedLineBreaks.Replace(text[:lexer.TokenEnd()]), "\n")
			for line := first; line <= last; line++ {
				if kind == ast.KindSingleLineCommentTrivia || kind == ast.KindMultiLineCommentTrivia {
					commentOnly[line] = true
				} else {
					codeLines[line] = true
				}
			}
		}
		for line := range codeLines {
			delete(commentOnly, line)
		}
	}
	count := 0
	for line := startLine; line <= endLine && line < len(lines); line++ {
		if skipComments && commentOnly[line] || skipBlank && strings.TrimSpace(lines[line]) == "" {
			continue
		}
		count++
	}
	return count
}

func SyntaxFix(context Context, name string, diagnostic *ast.Diagnostic, old *ast.Node, build func(*change.Tracker) *ast.Node) {
	if context.NewTracker == nil {
		return
	}
	tracker := context.NewTracker()
	tracker.ReplaceNodePreservingComments(context.File, old, build(tracker))
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, name), name, ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, name)))
}

func (rule *SourceCommentContext) Comments(start, end int) []SourceComment {
	return SyntaxComments(rule.Context, start, end)
}
