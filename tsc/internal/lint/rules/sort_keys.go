package rules

import (
	"cmp"
	"strconv"
	"strings"
	"unicode/utf16"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type sortKeysRule struct {
	context Context
}

func (rule *sortKeysRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindObjectLiteralExpression {
		rule.sortKeys(node)
	}

	return true
}

func (rule *sortKeysRule) OnExitNode(node *ast.Node) {
}

func (rule *sortKeysRule) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return nil
}

func (rule *sortKeysRule) blankBetween(start, end int) bool {
	lexer := scanner.GetScannerForSourceFile(rule.context.File, start)
	lexer.SetSkipTrivia(false)
	lexer.ResetPos(start)
	previousEnd := start
	for kind := lexer.Scan(); kind != ast.KindEndOfFile && lexer.TokenStart() < end; kind = lexer.Scan() {
		if kind == ast.KindWhitespaceTrivia || kind == ast.KindNewLineTrivia {
			continue
		}
		if helpers.StyleLines(rule.context.File.Text()[previousEnd:lexer.TokenStart()]) > 1 {
			return true
		}
		previousEnd = lexer.TokenEnd()
	}
	return helpers.StyleLines(rule.context.File.Text()[previousEnd:end]) > 1
}

func (rule *sortKeysRule) option(index int, fallback string) string {
	if index < len(rule.context.Options) {
		if value, ok := rule.context.Options[index].(string); ok {
			return value
		}
	}
	return fallback
}

func (rule *sortKeysRule) options(index int) map[string]any {
	if index < len(rule.context.Options) {
		options, _ := rule.context.Options[index].(map[string]any)
		return options
	}
	return nil
}

func (rule *sortKeysRule) sortKeys(node *ast.Node) {
	options := rule.options(1)
	properties := node.AsObjectLiteralExpression().Properties.Nodes
	minKeys := 2
	if configured, ok := options["minKeys"].(float64); ok {
		minKeys = int(configured)
	} else if configured, ok := options["minKeys"].(int); ok {
		minKeys = configured
	}
	var previousNode *ast.Node
	previousName, hasPrevious, previousBlank := "", false, false
	for _, property := range properties {
		if property.Kind == ast.KindSpreadAssignment {
			hasPrevious = false
			continue
		}
		key := property.Name()
		if key == nil {
			continue
		}
		if key.Kind == ast.KindComputedPropertyName && helpers.BooleanOptionValue(options, "ignoreComputedKeys", false) {
			hasPrevious = false
			continue
		}
		name, known := helpers.StaticMemberNameText(property)
		if !known {
			expression := key
			if key.Kind == ast.KindComputedPropertyName {
				expression = ast.SkipParentheses(key.Expression())
			}
			if expression.Kind == ast.KindIdentifier {
				name, known = expression.Text(), true
			}
		}
		blank := previousBlank
		if previousNode != nil {
			blank = blank || rule.blankBetween(previousNode.End(), rule.Start(property))
		}
		oldName, hadPrevious := previousName, hasPrevious
		previousNode = property
		if known {
			previousName, hasPrevious = name, true
		}
		if helpers.BooleanOptionValue(options, "allowLineSeparatedGroups", false) && blank {
			previousBlank = !known
			continue
		}
		if !hadPrevious || !known || len(properties) < minKeys {
			continue
		}
		left, right := oldName, name
		insensitive, natural := "", ""
		if !helpers.BooleanOptionValue(options, "caseSensitive", true) {
			left, right = strings.ToLower(left), strings.ToLower(right)
			insensitive = "insensitive "
		}
		comparison := helpers.StyleCompare(left, right)
		if helpers.BooleanOptionValue(options, "natural", false) {
			comparison = styleNatural(left, right)
			natural = "natural "
		}
		order := rule.option(0, "asc")
		if order == "asc" && comparison > 0 || order == "desc" && comparison < 0 {
			location := key
			if key.Kind == ast.KindComputedPropertyName {
				location = ast.SkipParentheses(key.Expression())
			}
			rule.context.Report(rule.context.Range(location), diagnostics.Expected_object_keys_to_be_in_0_1_2_ending_order_3_should_be_before_4, natural, insensitive, order, name, oldName)
		}
	}
}

func (rule *sortKeysRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

func styleNaturalCode(character uint16) int {
	switch {
	case character < 45 || character > 127:
		return int(character)
	case character < 46:
		return 65
	case character < 48:
		return int(character) - 1
	case character < 58:
		return int(character) + 18
	case character < 65:
		return int(character) - 11
	case character < 91:
		return int(character) + 11
	case character < 97:
		return int(character) - 37
	case character < 123:
		return int(character) + 5
	}
	return int(character) - 63
}

func styleNatural(left, right string) int {
	leftUnits, rightUnits := utf16.Encode([]rune(left)), utf16.Encode([]rune(right))
	leftIndex, rightIndex := 0, 0
	for leftIndex < len(leftUnits) && rightIndex < len(rightUnits) {
		leftCode, rightCode := styleNaturalCode(leftUnits[leftIndex]), styleNaturalCode(rightUnits[rightIndex])
		if leftCode > 66 && leftCode < 76 && rightCode > 66 && rightCode < 76 {
			leftEnd, rightEnd := leftIndex, rightIndex
			for leftEnd < len(leftUnits) && leftUnits[leftEnd] >= '0' && leftUnits[leftEnd] <= '9' {
				leftEnd++
			}
			for rightEnd < len(rightUnits) && rightUnits[rightEnd] >= '0' && rightUnits[rightEnd] <= '9' {
				rightEnd++
			}
			leftNumber, _ := strconv.ParseFloat(string(utf16.Decode(leftUnits[leftIndex:leftEnd])), 64)
			rightNumber, _ := strconv.ParseFloat(string(utf16.Decode(rightUnits[rightIndex:rightEnd])), 64)
			if result := cmp.Compare(leftNumber, rightNumber); result != 0 {
				return result
			}
			leftIndex, rightIndex = leftEnd, rightEnd
			continue
		}
		if leftCode != rightCode {
			return cmp.Compare(leftCode, rightCode)
		}
		leftIndex++
		rightIndex++
	}
	return cmp.Compare(len(leftUnits)-leftIndex, len(rightUnits)-rightIndex)
}

func newSortKeys(context Context) Rule { return &sortKeysRule{context: context} }
