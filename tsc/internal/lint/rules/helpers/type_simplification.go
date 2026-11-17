package helpers

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

func SemanticSyntaxStart(context Context, node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, context.File, false)
}

func SemanticSyntaxText(context Context, node *ast.Node) string {
	return context.File.Text()[SemanticSyntaxStart(context, node):node.End()]
}

func SemanticSyntaxOptions(context Context) map[string]any {
	if len(context.Options) > 0 {
		options, _ := context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func SemanticSyntaxBoolean(context Context, key string) bool {
	value, _ := SemanticSyntaxOptions(context)[key].(bool)
	return value
}

func SemanticSyntaxStrict(context Context) bool {
	return context.CompilerOptions != nil && context.CompilerOptions.GetStrictOptionValue(context.CompilerOptions.StrictNullChecks)
}

func SemanticSyntaxParts(value *checker.Type) []*checker.Type {
	if value == nil {
		return nil
	}
	if value.IsUnion() {
		return value.Types()
	}
	return []*checker.Type{value}
}

func SemanticSyntaxHas(value *checker.Type, flags checker.TypeFlags) bool {
	for _, part := range SemanticSyntaxParts(value) {
		if part.Flags()&flags != 0 {
			return true
		}
	}
	return false
}

func SemanticSyntaxComments(context Context, start, end int) string {
	var result strings.Builder
	lexer := scanner.NewScanner()
	lexer.SetText(context.File.Text())
	lexer.SetSkipTrivia(false)
	lexer.ResetPos(start)
	for token := lexer.Scan(); token != ast.KindEndOfFile && lexer.TokenStart() < end; token = lexer.Scan() {
		if (token == ast.KindSingleLineCommentTrivia || token == ast.KindMultiLineCommentTrivia) && lexer.TokenEnd() <= end {
			text := lexer.TokenText()
			result.WriteString(text)
			if strings.HasPrefix(text, "//") {
				result.WriteByte('\n')
			} else {
				result.WriteByte(' ')
			}
		}
	}
	return result.String()
}

func SemanticSyntaxEdit(start, end int, text string) core.TextChange {
	return core.TextChange{TextRange: core.NewTextRange(start, end), NewText: text}
}

func SemanticSyntaxPropertyName(node *ast.Node) (string, bool) {
	if node == nil {
		return "", false
	}
	if node.Kind == ast.KindComputedPropertyName {
		node = node.Expression()
		if node.Kind == ast.KindIdentifier {
			return "", false
		}
	}
	switch node.Kind {
	case ast.KindIdentifier, ast.KindStringLiteral, ast.KindNumericLiteral, ast.KindNoSubstitutionTemplateLiteral:
		return node.Text(), true
	}
	return "", false
}
