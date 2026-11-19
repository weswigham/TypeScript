package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptPreferOptionalChainRule struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
	checked     map[*ast.Node]bool
}

func newTypeScriptPreferOptionalChain(context Context) Rule {
	rule := &typescriptPreferOptionalChainRule{context: context, checked: map[*ast.Node]bool{}}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindBinaryExpression},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptPreferOptionalChainRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindBinaryExpression || rule.checked[node] {
		return true
	}
	binary := node.AsBinaryExpression()
	operator := binary.OperatorToken.Kind
	if operator == ast.KindBarBarToken || operator == ast.KindQuestionQuestionToken {
		right := ast.SkipParentheses(binary.Right)
		parent := helpers.SemanticExpressionParent(node)
		if right.Kind == ast.KindObjectLiteralExpression && len(right.AsObjectLiteralExpression().Properties.Nodes) == 0 && parent != nil && (parent.Kind == ast.KindPropertyAccessExpression || parent.Kind == ast.KindElementAccessExpression) && parent.QuestionDotToken() == nil && ast.SkipParentheses(parent.Expression()) == node {
			operand := preferOptionalChainOperand{name: binary.Left}
			if rule.requireNullish([]preferOptionalChainOperand{operand}) {
				property := ""
				if parent.Kind == ast.KindPropertyAccessExpression {
					property = helpers.SemanticSourceText(rule.context, parent.Name())
				} else {
					property = "[" + helpers.SemanticSourceText(rule.context, parent.AsElementAccessExpression().ArgumentExpression) + "]"
				}
				report := rule.context.Report(rule.context.Range(parent), diagnostics.Prefer_using_an_optional_chain_expression_instead_as_it_s_more_concise_and_easier_to_read)
				rule.suggest(report, parent, helpers.SemanticWrappedExpression(rule.context, binary.Left)+"?."+property, diagnostics.Change_to_an_optional_chain)
			}
			return true
		}
	}
	if operator == ast.KindAmpersandAmpersandToken || operator == ast.KindBarBarToken {
		rule.logical(node)
	}
	return true
}

type preferOptionalChainOperand struct {
	node, name, comparedValue             *ast.Node
	operator                              ast.Kind
	nullish                               checker.TypeFlags
	negative, loose, typeOf, yoda, truthy bool
}

func (rule *typescriptPreferOptionalChainRule) operand(node *ast.Node) preferOptionalChainOperand {
	original := node
	node = ast.SkipParentheses(node)
	result := preferOptionalChainOperand{node: original, name: node, truthy: true}
	if helpers.SemanticNegation(node) {
		result.name = ast.SkipParentheses(node.AsPrefixUnaryExpression().Operand)
		result.negative = true
		return result
	}
	if node.Kind != ast.KindBinaryExpression {
		return result
	}
	binary := node.AsBinaryExpression()
	result.operator = binary.OperatorToken.Kind
	result.truthy = false
	if result.operator != ast.KindEqualsEqualsToken && result.operator != ast.KindEqualsEqualsEqualsToken && result.operator != ast.KindExclamationEqualsToken && result.operator != ast.KindExclamationEqualsEqualsToken {
		result.name = nil
		return result
	}
	result.name, result.comparedValue = binary.Left, binary.Right
	result.nullish = helpers.SemanticNullishKind(rule.context, binary.Right)
	if result.nullish == 0 && helpers.SemanticNullishKind(rule.context, binary.Left) != 0 {
		result.name, result.comparedValue, result.yoda = binary.Right, binary.Left, true
		result.nullish = helpers.SemanticNullishKind(rule.context, binary.Left)
	}
	for _, pair := range [][2]*ast.Node{{binary.Left, binary.Right}, {binary.Right, binary.Left}} {
		expression, value := ast.SkipParentheses(pair[0]), ast.SkipParentheses(pair[1])
		if expression.Kind == ast.KindTypeOfExpression && value.Kind == ast.KindStringLiteral && value.Text() == "undefined" {
			result.name, result.comparedValue, result.typeOf, result.nullish = expression.Expression(), pair[1], true, checker.TypeFlagsUndefined
			result.yoda = pair[0] == binary.Right
			if result.name.Kind == ast.KindIdentifier {
				symbol := rule.context.GetChecker().GetSymbolAtLocation(result.name)
				local := false
				if symbol != nil {
					for _, declaration := range symbol.Declarations() {
						if ast.GetSourceFileOfNode(declaration) == rule.context.File {
							local = true
							break
						}
					}
				}
				if !local {
					result.name = nil
				}
			}
			break
		}
	}
	result.negative = result.operator == ast.KindExclamationEqualsToken || result.operator == ast.KindExclamationEqualsEqualsToken
	result.loose = result.operator == ast.KindEqualsEqualsToken || result.operator == ast.KindExclamationEqualsToken
	return result
}

func (rule *typescriptPreferOptionalChainRule) looseType(node *ast.Node, disallowFalsy bool) bool {
	allowed := checker.TypeFlagsNull | checker.TypeFlagsUndefined | checker.TypeFlagsObject
	for option, flag := range map[string]checker.TypeFlags{"checkAny": checker.TypeFlagsAny, "checkUnknown": checker.TypeFlagsUnknown, "checkBigInt": checker.TypeFlagsBigIntLike, "checkBoolean": checker.TypeFlagsBooleanLike, "checkNumber": checker.TypeFlagsNumberLike, "checkString": checker.TypeFlagsStringLike} {
		if helpers.SemanticBooleanOption(rule.context, option, true) {
			allowed |= flag
		}
	}
	var check func(*checker.Type) bool
	check = func(value *checker.Type) bool {
		if value.IsUnion() || value.IsIntersection() {
			for _, part := range value.Types() {
				if !check(part) {
					return false
				}
			}
			return true
		}
		if disallowFalsy && value.Flags()&checker.TypeFlagsLiteral != 0 && !helpers.SemanticTruthyLiteral(value) {
			return false
		}
		return value.Flags()&allowed != 0
	}
	return check(helpers.SemanticTypeAtLocation(rule.context, node))
}

func (rule *typescriptPreferOptionalChainRule) guard(operand preferOptionalChainOperand, operator ast.Kind) bool {
	if operand.name == nil {
		return false
	}
	and := operator == ast.KindAmpersandAmpersandToken
	if operand.truthy {
		return operand.negative != and && rule.looseType(operand.name, true)
	}
	if operand.nullish == 0 || operand.negative != and {
		return false
	}
	if operand.loose {
		return true
	}
	flags := helpers.SemanticTypeFlags(helpers.SemanticTypeAtLocation(rule.context, operand.name))
	missing := checker.TypeFlagsNull
	if operand.nullish == checker.TypeFlagsNull {
		missing = checker.TypeFlagsUndefined
	}
	return flags&(missing|checker.TypeFlagsAny|checker.TypeFlagsUnknown) == 0
}

func (rule *typescriptPreferOptionalChainRule) terminal(operand preferOptionalChainOperand, operator ast.Kind) bool {
	if operand.name == nil {
		return false
	}
	if operand.truthy {
		return operand.negative == (operator == ast.KindBarBarToken)
	}
	if operand.comparedValue == nil {
		return false
	}
	value := helpers.SemanticTypeAtLocation(rule.context, operand.comparedValue)
	flags := helpers.SemanticTypeFlags(value)
	maybeUndefined := checker.TypeFlagsAny | checker.TypeFlagsUnknown | checker.TypeFlagsInstantiableNonPrimitive | checker.TypeFlagsUndefined | checker.TypeFlagsVoid
	positive := operand.operator == ast.KindEqualsEqualsToken || operand.operator == ast.KindEqualsEqualsEqualsToken
	if operator == ast.KindBarBarToken {
		positive = !positive
	}
	if positive {
		if operand.loose {
			maybeUndefined |= checker.TypeFlagsNull
		}
		return flags&maybeUndefined == 0
	}
	allowed := checker.TypeFlagsUndefined
	if operand.loose {
		allowed |= checker.TypeFlagsNull
	}
	for _, part := range helpers.SemanticUnionParts(value) {
		if part.Flags()&allowed == 0 {
			return false
		}
	}
	return true
}

func preferOptionalChainBase(node *ast.Node) *ast.Node {
	if node == nil {
		return nil
	}
	node = ast.SkipParentheses(node)
	if node.Kind == ast.KindNonNullExpression {
		return preferOptionalChainBase(node.Expression())
	}
	if node.Kind == ast.KindPropertyAccessExpression {
		if node.Name().Kind == ast.KindPrivateIdentifier {
			return nil
		}
	} else if node.Kind != ast.KindElementAccessExpression && node.Kind != ast.KindCallExpression {
		return nil
	}
	base := node.Expression()
	if base.Kind == ast.KindParenthesizedExpression && ast.IsOptionalChain(ast.SkipParentheses(base)) {
		return nil
	}
	return ast.SkipParentheses(base)
}

func (rule *typescriptPreferOptionalChainRule) subset(left, right *ast.Node) bool {
	for base := preferOptionalChainBase(right); base != nil; base = preferOptionalChainBase(base) {
		if helpers.SemanticSameExpression(rule.context, left, base, false) {
			return true
		}
	}
	return false
}

func (rule *typescriptPreferOptionalChainRule) extend(text string, previous, next *ast.Node) (string, bool) {
	next = ast.SkipParentheses(next)
	if next.Kind == ast.KindNonNullExpression {
		return rule.extend(text, previous, next.Expression())
	}
	base := preferOptionalChainBase(next)
	if base == nil {
		return "", false
	}
	suffix := ""
	optional := next.QuestionDotToken() != nil
	switch next.Kind {
	case ast.KindPropertyAccessExpression:
		suffix = "." + helpers.SemanticSourceText(rule.context, next.Name())
		if optional {
			suffix = "?." + helpers.SemanticSourceText(rule.context, next.Name())
		}
	case ast.KindElementAccessExpression:
		suffix = "[" + helpers.SemanticSourceText(rule.context, next.AsElementAccessExpression().ArgumentExpression) + "]"
		if optional {
			suffix = "?." + suffix
		}
	case ast.KindCallExpression:
		start := next.Expression().End()
		if next.QuestionDotToken() != nil {
			start = next.QuestionDotToken().End()
		}
		suffix = strings.TrimSpace(rule.context.File.Text()[start:next.End()])
		if optional {
			suffix = "?." + suffix
		}
	}
	if helpers.SemanticSameExpression(rule.context, previous, base, false) {
		if next.Kind == ast.KindPropertyAccessExpression {
			suffix = "?." + helpers.SemanticSourceText(rule.context, next.Name())
		} else if !optional {
			suffix = "?." + suffix
		}
		return text + suffix, true
	}
	prefix, ok := rule.extend(text, previous, base)
	if !ok {
		return "", false
	}
	return prefix + suffix, true
}

func (rule *typescriptPreferOptionalChainRule) requireNullish(operands []preferOptionalChainOperand) bool {
	if !helpers.SemanticBooleanOption(rule.context, "requireNullish", false) {
		return true
	}
	for _, operand := range operands {
		if helpers.SemanticNullishType(helpers.SemanticTypeAtLocation(rule.context, operand.name), true) {
			return true
		}
	}
	return false
}

func (rule *typescriptPreferOptionalChainRule) report(root *ast.Node, operator ast.Kind, leaves []*ast.Node, start, end int, operands []preferOptionalChainOperand, pairedLast bool) {
	if len(operands) < 2 || !rule.requireNullish(operands[:len(operands)-1]) {
		return
	}
	text := helpers.SemanticSourceText(rule.context, operands[0].name)
	previous := operands[0].name
	for _, operand := range operands[1:] {
		if helpers.SemanticSameExpression(rule.context, previous, operand.name, false) {
			continue
		}
		next, ok := rule.extend(text, previous, operand.name)
		if !ok {
			return
		}
		text, previous = next, operand.name
	}
	last := operands[len(operands)-1]
	if last.truthy {
		if last.negative {
			text = "!" + text
		}
	} else {
		if last.typeOf {
			text = "typeof " + text
		}
		other := helpers.SemanticSourceText(rule.context, last.comparedValue)
		if last.yoda {
			text = other + " " + scanner.TokenToString(last.operator) + " " + text
		} else {
			text += " " + scanner.TokenToString(last.operator) + " " + other
		}
	}
	position, limit := scanner.GetTokenPosOfNode(leaves[start], rule.context.File, false), leaves[end].End()
	report := rule.context.Report(
		core.NewTextRange(position, limit), diagnostics.Prefer_using_an_optional_chain_expression_instead_as_it_s_more_concise_and_easier_to_read)

	leafIndex := 0
	var render func(*ast.Node) string
	render = func(node *ast.Node) string {
		inner := ast.SkipParentheses(node)
		if inner.Kind == ast.KindBinaryExpression && inner.AsBinaryExpression().OperatorToken.Kind == operator {
			left := render(inner.AsBinaryExpression().Left)
			right := render(inner.AsBinaryExpression().Right)
			if left == "" {
				return right
			}
			if right == "" {
				return left
			}
			return left + " " + scanner.TokenToString(operator) + " " + right
		}
		index := leafIndex
		leafIndex++
		if index == start {
			return text
		}
		if index > start && index <= end {
			return ""
		}
		return helpers.SemanticSourceText(rule.context, node)
	}
	replacement := render(root)
	safe := helpers.SemanticBooleanOption(rule.context, "allowPotentiallyUnsafeFixesThatModifyTheReturnTypeIKnowWhatImDoing", false)
	if !pairedLast && !last.truthy && (last.loose && last.nullish != 0 || !last.loose && last.nullish == checker.TypeFlagsUndefined) || operator == ast.KindBarBarToken && last.truthy && last.negative {
		safe = true
	}
	if !pairedLast && !safe {
		for _, operand := range operands {
			if helpers.SemanticTypeFlags(rule.context.GetChecker().GetTypeAtLocation(operand.node))&(checker.TypeFlagsUndefined|checker.TypeFlagsAny|checker.TypeFlagsUnknown) != 0 {
				safe = true
				break
			}
		}
	}
	if safe {
		tracker := rule.context.NewTracker()
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(scanner.GetTokenPosOfNode(root, rule.context.File, false), root.End()), replacement)
		report.SetCodeFixes(codefix.CreateCodeFixAction("@typescript-eslint/prefer-optional-chain", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Change_to_an_optional_chain), "", nil))
	} else {
		rule.suggest(report, root, replacement, diagnostics.Change_to_an_optional_chain)
	}
}

func (rule *typescriptPreferOptionalChainRule) logical(node *ast.Node) {
	operator := node.AsBinaryExpression().OperatorToken.Kind
	var leaves []*ast.Node
	var flatten func(*ast.Node)
	flatten = func(current *ast.Node) {
		inner := ast.SkipParentheses(current)
		if inner.Kind == ast.KindBinaryExpression && inner.AsBinaryExpression().OperatorToken.Kind == operator {
			rule.checked[inner] = true
			flatten(inner.AsBinaryExpression().Left)
			flatten(inner.AsBinaryExpression().Right)
		} else {
			leaves = append(leaves, current)
		}
	}
	flatten(node)
	var chain []preferOptionalChainOperand
	start, end := 0, 0
	flush := func() {
		if len(chain) > 1 {
			rule.report(node, operator, leaves, start, end, chain, false)
		}
		chain = nil
	}
	for index := 0; index < len(leaves); index++ {
		operand := rule.operand(leaves[index])
		valid := rule.guard(operand, operator)
		paired := false
		if !valid && operand.name != nil && operand.nullish != 0 && !operand.loose && operand.negative == (operator == ast.KindAmpersandAmpersandToken) && index+1 < len(leaves) {
			next := rule.operand(leaves[index+1])
			if next.name != nil && next.nullish != 0 && next.nullish != operand.nullish && !next.loose && next.negative == operand.negative && helpers.SemanticSameExpression(rule.context, operand.name, next.name, false) {
				valid, paired = true, true
			}
		}
		if len(chain) > 0 && operand.name != nil {
			last := chain[len(chain)-1]
			if helpers.SemanticSameExpression(rule.context, last.name, operand.name, false) {
				if paired {
					index++
				}
				end = index
				continue
			}
			if rule.subset(last.name, operand.name) {
				if valid || rule.terminal(operand, operator) {
					if operator == ast.KindBarBarToken && operand.nullish == checker.TypeFlagsNull && !operand.loose && !paired {
						unsafe := false
						for _, previous := range chain {
							if previous.nullish == checker.TypeFlagsUndefined && !previous.loose {
								unsafe = true
							}
						}
						if unsafe {
							flush()
						} else {
							chain = append(chain, operand)
							end = index
						}
					} else {
						chain = append(chain, operand)
						end = index
					}
					if paired {
						index++
						end = index
					}
					if !valid || paired && index == len(leaves)-1 {
						if len(chain) > 1 {
							rule.report(node, operator, leaves, start, end-preferOptionalChainBoolInt(paired), chain, paired)
						}
						chain = nil
					}
					continue
				}
			}
			flush()
		}
		if !valid {
			flush()
			continue
		}
		if len(chain) == 0 {
			start = index
		}
		chain = append(chain, operand)
		end = index
		if paired {
			index++
			end = index
		}
	}
	flush()
}

func preferOptionalChainBoolInt(value bool) int {
	if value {
		return 1
	}
	return 0
}

func (rule *typescriptPreferOptionalChainRule) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typescriptPreferOptionalChainRule) suggest(report *ast.Diagnostic, node *ast.Node, text string, message *diagnostics.Message, args ...any) {
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(scanner.GetTokenPosOfNode(node, rule.context.File, false), node.End()), text)
	if rule.suggestions == nil {
		rule.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
	}
	rule.suggestions[report] = append(rule.suggestions[report], codefix.CreateCodeFixAction("@typescript-eslint/prefer-optional-chain", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(message, args...), "", nil))
}
