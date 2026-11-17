package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/regex"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noFallthrough struct {
	helpers.SharedControlFlowContext
}

func (rule *noFallthrough) OnEnterNode(node *ast.Node) bool { return rule.EnterGraph(node, nil) }
func (rule *noFallthrough) OnExitNode(node *ast.Node) {
	if node.Kind != ast.KindSourceFile {
		return
	}
	for _, graph := range rule.Graphs {
		rule.checkGraph(graph)
	}
}

func (rule *noFallthrough) checkGraph(graph *helpers.ControlFlowGraph) {
	for _, clause := range graph.Cases {
		rule.fallthroughCase(clause)
	}
}

type controlFlowComment struct {
	start, end int
	text       string
}

func (rule *noFallthrough) leadingComment(position int) *controlFlowComment {
	tokenScanner := scanner.GetScannerForSourceFile(rule.Context.File, position)
	tokenScanner.SetSkipTrivia(false)
	tokenScanner.ResetPos(position)
	var comment *controlFlowComment
	for {
		kind := tokenScanner.Scan()
		switch kind {
		case ast.KindSingleLineCommentTrivia, ast.KindMultiLineCommentTrivia:
			start, end := tokenScanner.TokenStart(), tokenScanner.TokenEnd()
			value := rule.Context.File.Text()[start+2 : end]
			if kind == ast.KindMultiLineCommentTrivia {
				value = strings.TrimSuffix(value, "*/")
			}
			comment = &controlFlowComment{start: start, end: end, text: value}
		case ast.KindWhitespaceTrivia, ast.KindNewLineTrivia:
			continue
		default:
			return comment
		}
	}
}

func (rule *noFallthrough) fallthroughCase(clause helpers.ControlFlowCase) {
	pattern := regex.Compile(`(?i:falls?\s?through)`)
	if custom, ok := rule.Options()["commentPattern"].(string); ok && custom != "" {
		compiled := regex.Compile(custom)
		if !compiled.IsValid() {
			return
		}
		pattern = compiled
	}
	valid := func(comment *controlFlowComment) bool {
		if comment == nil || !pattern.MatchString(comment.text) {
			return false
		}
		value := strings.TrimSpace(comment.text)
		return !strings.HasPrefix(value, "eslint-") && !strings.HasPrefix(value, "eslint ") && !strings.HasPrefix(value, "global ") && !strings.HasPrefix(value, "exported ")
	}
	statements := clause.Node.AsCaseOrDefaultClause().Statements.Nodes
	comment := rule.leadingComment(clause.Node.End())
	if len(statements) == 1 && statements[0].Kind == ast.KindBlock {
		block := statements[0]
		position := scanner.GetTokenPosOfNode(block, rule.Context.File, false) + 1
		if children := block.AsBlock().Statements.Nodes; len(children) != 0 {
			position = children[len(children)-1].End()
		}
		inner := rule.leadingComment(position)
		if valid(inner) {
			comment = inner
		}
	}
	reachable := helpers.ControlFlowState(clause.End) != 0
	if !reachable {
		if valid(comment) && rule.Options()["reportUnusedFallthroughComment"] == true {
			rule.Context.Report(
				core.NewTextRange(comment.start, comment.end), diagnostics.Found_a_comment_that_would_permit_fallthrough_but_case_cannot_fall_through)
		}
		return
	}
	emptyAllowed := len(statements) == 0 && (rule.Options()["allowEmptyCase"] == true || strings.Count(rule.Context.File.Text()[clause.Node.End():scanner.GetTokenPosOfNode(clause.Next, rule.Context.File, false)], "\n") < 2)
	if emptyAllowed || valid(comment) {
		return
	}
	message := diagnostics.Expected_a_break_statement_before_case
	if clause.Next.Kind == ast.KindDefaultClause {
		message = diagnostics.Expected_a_break_statement_before_default
	}
	rule.ReportOnce(clause.Next, message)
}

func newNoFallthrough(context Context) Rule {
	return &noFallthrough{Context: context}
}
