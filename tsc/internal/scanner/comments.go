package scanner

import (
	"cmp"
	"iter"
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
)

// GetCommentRanges scans comments without interpreting literal or JSX text as comments.
func GetCommentRanges(file *ast.SourceFile) iter.Seq[core.TextRange] {
	return func(yield func(core.TextRange) bool) {
		var literals []core.TextRange
		var collect func(*ast.Node)
		collect = func(node *ast.Node) {
			switch node.Kind {
			case ast.KindStringLiteral, ast.KindRegularExpressionLiteral, ast.KindNoSubstitutionTemplateLiteral,
				ast.KindTemplateHead, ast.KindTemplateMiddle, ast.KindTemplateTail, ast.KindJsxText:
				start := node.Pos()
				if node.Kind != ast.KindJsxText {
					start = GetTokenPosOfNode(node, file, false)
				}
				literals = append(literals, core.NewTextRange(start, node.End()))
			}
			node.ForEachChild(func(child *ast.Node) bool {
				collect(child)
				return false
			})
		}
		collect(file.AsNode())
		slices.SortFunc(literals, func(left, right core.TextRange) int {
			return cmp.Compare(left.Pos(), right.Pos())
		})
		lexer := GetScannerForSourceFile(file, 0)
		lexer.SetSkipTrivia(false)
		lexer.ResetPos(0)
		index := 0
		for position := 0; position < len(file.Text()); {
			for index < len(literals) && literals[index].End() <= position {
				index++
			}
			if index < len(literals) && literals[index].Pos() <= position {
				position = literals[index].End()
				lexer.ResetPos(position)
				continue
			}
			kind := lexer.Scan()
			if kind == ast.KindEndOfFile {
				return
			}
			if (kind == ast.KindSingleLineCommentTrivia || kind == ast.KindMultiLineCommentTrivia) && !yield(lexer.TokenRange()) {
				return
			}
			position = lexer.TokenEnd()
		}
	}
}
