package rules

import (
	"maps"
	"slices"
	"strconv"
	"strings"
	"unicode/utf16"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptMemberOrderingRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func memberOrderingDefaultOrder() []any {
	order := []any{"signature", "call-signature"}
	for _, kind := range []string{"field", "accessor", "get", "set", "method"} {
		if kind == "accessor" {
			order = append(order, "static-initialization", "public-constructor", "protected-constructor", "private-constructor", "constructor")
		}
		for _, scope := range []string{"static", "decorated", "instance", "abstract", ""} {
			accessibilities := []string{"public", "protected", "private", "#private"}
			if scope == "decorated" {
				accessibilities = accessibilities[:3]
			}
			if scope == "abstract" {
				accessibilities = accessibilities[:2]
			}
			for _, accessibility := range accessibilities {
				prefix := accessibility + "-"
				if scope != "" {
					prefix += scope + "-"
				}
				order = append(order, prefix+kind)
			}
		}
		for _, scope := range []string{"static", "instance", "abstract", "decorated", ""} {
			prefix := scope
			if scope != "" {
				prefix += "-"
			}
			order = append(order, prefix+kind)
		}
	}
	return order
}

func memberOrderingKind(node *ast.Node) string {
	switch node.Kind {
	case ast.KindCallSignature:
		return "call-signature"
	case ast.KindConstructor, ast.KindConstructSignature:
		return "constructor"
	case ast.KindMethodDeclaration, ast.KindMethodSignature:
		return "method"
	case ast.KindGetAccessor:
		return "get"
	case ast.KindSetAccessor:
		return "set"
	case ast.KindClassStaticBlockDeclaration:
		return "static-initialization"
	case ast.KindIndexSignature:
		if node.ModifierFlags()&ast.ModifierFlagsReadonly != 0 {
			return "readonly-signature"
		}
		return "signature"
	case ast.KindPropertyDeclaration, ast.KindPropertySignature:
		if node.ModifierFlags()&ast.ModifierFlagsAccessor != 0 {
			return "accessor"
		}
		if initializer := node.Initializer(); initializer != nil && (initializer.Kind == ast.KindArrowFunction || initializer.Kind == ast.KindFunctionExpression) {
			return "method"
		}
		if node.ModifierFlags()&ast.ModifierFlagsReadonly != 0 {
			return "readonly-field"
		}
		return "field"
	}
	return ""
}

func memberOrderingRank(node *ast.Node, order []any, supportsModifiers bool) int {
	if (node.Kind == ast.KindMethodDeclaration || node.Kind == ast.KindConstructor || node.Kind == ast.KindGetAccessor || node.Kind == ast.KindSetAccessor) && node.Body() == nil && node.ModifierFlags()&ast.ModifierFlagsAbstract == 0 {
		return -1
	}
	kind := memberOrderingKind(node)
	if kind == "" {
		return len(order) - 1
	}
	var groups []string
	if supportsModifiers {
		accessibility := helpers.SemanticMemberAccessibility(node)
		scope := "instance"
		if node.ModifierFlags()&ast.ModifierFlagsStatic != 0 {
			scope = "static"
		} else if node.ModifierFlags()&ast.ModifierFlagsAbstract != 0 {
			scope = "abstract"
		}
		if node.ModifierFlags()&ast.ModifierFlagsDecorator != 0 && slices.Contains([]string{"field", "readonly-field", "method", "accessor", "get", "set"}, kind) {
			groups = append(groups, accessibility+"-decorated-"+kind, "decorated-"+kind)
			if kind == "readonly-field" {
				groups = append(groups, accessibility+"-decorated-field", "decorated-field")
			}
		}
		if kind != "signature" && kind != "readonly-signature" && kind != "static-initialization" {
			if kind != "constructor" {
				groups = append(groups, accessibility+"-"+scope+"-"+kind, scope+"-"+kind)
				if kind == "readonly-field" {
					groups = append(groups, accessibility+"-"+scope+"-field", scope+"-field")
				}
			}
			groups = append(groups, accessibility+"-"+kind)
			if kind == "readonly-field" {
				groups = append(groups, accessibility+"-field")
			}
		}
	}
	groups = append(groups, kind)
	if kind == "readonly-field" {
		groups = append(groups, "field")
	}
	if kind == "readonly-signature" {
		groups = append(groups, "signature")
	}
	for _, group := range groups {
		for rank, configured := range order {
			if text, ok := configured.(string); ok && text == group {
				return rank
			}
			if slices.Contains(helpers.SemanticOptionStrings(configured), group) {
				return rank
			}
		}
	}
	return -1
}

func (rule *typescriptMemberOrderingRule) memberName(node *ast.Node) string {
	switch node.Kind {
	case ast.KindConstructor:
		return "constructor"
	case ast.KindConstructSignature:
		return "new"
	case ast.KindCallSignature:
		return "call"
	case ast.KindClassStaticBlockDeclaration:
		return "static block"
	case ast.KindIndexSignature:
		if len(node.Parameters()) != 0 {
			return helpers.SemanticSourceText(rule.context,

				node.Parameters()[0].Name())
		}
		return "(index signature)"
	}
	name := node.Name()
	if name == nil {
		return ""
	}
	if name.Kind == ast.KindComputedPropertyName {
		name = name.AsComputedPropertyName().Expression
	}
	if name.Kind == ast.KindIdentifier || name.Kind == ast.KindStringLiteral || name.Kind == ast.KindNumericLiteral {
		return name.Text()
	}
	if name.Kind == ast.KindPrivateIdentifier {
		return strings.TrimPrefix(name.Text(), "#")
	}
	return helpers.SemanticSourceText(rule.context,

		name)
}

func memberOrderingNaturalCompare(left, right string) int {
	leftUnits, rightUnits := utf16.Encode([]rune(left)), utf16.Encode([]rune(right))
	code := func(units []uint16, index int) int {
		if index >= len(units) {
			return 0
		}
		value := int(units[index])
		if value < 45 || value > 127 {
			return value
		}
		if value < 46 {
			return 65
		}
		if value < 48 {
			return value - 1
		}
		if value < 58 {
			return value + 18
		}
		if value < 65 {
			return value - 11
		}
		if value < 91 {
			return value + 11
		}
		if value < 97 {
			return value - 37
		}
		if value < 123 {
			return value + 5
		}
		return value - 63
	}
	for leftIndex, rightIndex := 0, 0; ; {
		leftCode, rightCode := code(leftUnits, leftIndex), code(rightUnits, rightIndex)
		leftIndex++
		rightIndex++
		if leftCode == 0 && rightCode == 0 {
			return 0
		}
		if leftCode > 66 && leftCode < 76 && rightCode > 66 && rightCode < 76 {
			leftStart, rightStart := leftIndex-1, rightIndex-1
			for next := code(leftUnits, leftIndex); next > 65 && next < 76; next = code(leftUnits, leftIndex) {
				leftIndex++
			}
			for next := code(rightUnits, rightIndex); next > 65 && next < 76; next = code(rightUnits, rightIndex) {
				rightIndex++
			}
			leftNumber, _ := strconv.ParseFloat(string(utf16.Decode(leftUnits[leftStart:leftIndex])), 64)
			rightNumber, _ := strconv.ParseFloat(string(utf16.Decode(rightUnits[rightStart:rightIndex])), 64)
			if leftNumber < rightNumber {
				return -1
			}
			if leftNumber > rightNumber {
				return 1
			}
			continue
		}
		if leftCode < rightCode {
			return -1
		}
		if leftCode > rightCode {
			return 1
		}
	}
}

func (rule *typescriptMemberOrderingRule) memberDependency(member *ast.Node, members []*ast.Node, from, to int) bool {
	if member.Kind != ast.KindPropertyDeclaration || member.Initializer() == nil {
		return false
	}
	references := map[string]bool{}
	var walk func(*ast.Node)
	walk = func(node *ast.Node) {
		if node.Kind == ast.KindArrowFunction || node.Kind == ast.KindFunctionExpression {
			return
		}
		if node.Kind == ast.KindClassExpression || node.Kind == ast.KindClassDeclaration {
			if clauses := node.ClassLikeData().HeritageClauses; clauses != nil {
				for _, clause := range clauses.Nodes {
					walk(clause)
				}
			}
			return
		}
		if node.Kind == ast.KindPropertyAccessExpression && node.AsPropertyAccessExpression().Expression.Kind == ast.KindThisKeyword {
			references[node.AsPropertyAccessExpression().Name().Text()] = true
		}
		if node.Kind == ast.KindElementAccessExpression && node.AsElementAccessExpression().Expression.Kind == ast.KindThisKeyword {
			argument := node.AsElementAccessExpression().ArgumentExpression
			if argument.Kind == ast.KindStringLiteral || argument.Kind == ast.KindNoSubstitutionTemplateLiteral {
				references[argument.Text()] = true
			}
		}
		node.ForEachChild(func(child *ast.Node) bool { walk(child); return false })
	}
	walk(member.Initializer())
	for _, earlier := range members[from:to] {
		if earlier.Kind == ast.KindPropertyDeclaration && earlier.Initializer() != nil && references[rule.memberName(earlier)] {
			return true
		}
	}
	return false
}

func (rule *typescriptMemberOrderingRule) memberAlpha(members []*ast.Node, order string) {
	previous, previousIndex := "", 0
	for index, member := range members {
		name := rule.memberName(member)
		if name == "" {
			continue
		}
		left, right := name, previous
		if strings.HasSuffix(order, "case-insensitive") {
			left, right = strings.ToLower(left), strings.ToLower(right)
		}
		outOfOrder := left < right
		if strings.HasPrefix(order, "natural") {
			outOfOrder = name != previous && memberOrderingNaturalCompare(left, right) != 1
		}
		if outOfOrder {
			if rule.memberDependency(member, members, previousIndex, index) {
				continue
			}
			rule.context.Report(rule.context.Range(member), diagnostics.Member_0_should_be_declared_before_member_1, name, previous)
		}
		previous, previousIndex = name, index
	}
}

func (rule *typescriptMemberOrderingRule) memberOrdering(node *ast.Node) {
	key, modifiers := "", false
	switch node.Kind {
	case ast.KindClassDeclaration:
		key, modifiers = "classes", true
	case ast.KindClassExpression:
		key, modifiers = "classExpressions", true
	case ast.KindInterfaceDeclaration:
		key = "interfaces"
	case ast.KindTypeLiteral:
		key = "typeLiterals"
	default:
		return
	}
	members := slices.DeleteFunc(slices.Clone(node.Members()), func(member *ast.Node) bool { return member.Kind == ast.KindSemicolonClassElement })
	if len(members) == 0 {
		return
	}
	options := helpers.SemanticRuleOptions(rule.context.Options)
	configured := options[key]
	if configured == nil {
		configured = options["default"]
		if configured == nil {
			configured = memberOrderingDefaultOrder()
		} else if object, ok := configured.(map[string]any); ok && object["memberTypes"] == nil {
			memberOptions := map[string]any{"memberTypes": memberOrderingDefaultOrder()}
			maps.Copy(memberOptions, object)
			configured = memberOptions
		}
	}
	if configured == "never" {
		return
	}
	memberTypes, order, optionality := helpers.SemanticOptionArray(configured), "", ""
	if object, ok := configured.(map[string]any); ok {
		memberTypes = helpers.SemanticOptionArray(object["memberTypes"])
		order, _ = object["order"].(string)
		optionality, _ = object["optionalityOrder"].(string)
	}
	var check func([]*ast.Node)
	check = func(set []*ast.Node) {
		alpha := order != "" && order != "as-written"
		if memberTypes == nil {
			if alpha {
				rule.memberAlpha(set, order)
			}
			return
		}
		var ranks []int
		var groups [][]*ast.Node
		correct := true
		for _, member := range set {
			rank := memberOrderingRank(member, memberTypes, modifiers)
			if rank == -1 {
				continue
			}
			if len(ranks) > 0 && rank < ranks[len(ranks)-1] {
				lowest := ranks[len(ranks)-1]
				for _, earlier := range ranks {
					if earlier > rank && earlier < lowest {
						lowest = earlier
					}
				}
				groupNames := helpers.SemanticOptionStrings(memberTypes[lowest])
				if text, ok := memberTypes[lowest].(string); ok {
					groupNames = []string{text}
				}
				for index := range groupNames {
					groupNames[index] = strings.ReplaceAll(groupNames[index], "-", " ")
				}
				rule.context.Report(rule.context.Range(member), diagnostics.Member_0_should_be_declared_before_all_1_definitions, rule.memberName(member), strings.Join(groupNames, ", "))
				correct = false
			} else if len(ranks) > 0 && rank == ranks[len(ranks)-1] {
				groups[len(groups)-1] = append(groups[len(groups)-1], member)
			} else {
				ranks = append(ranks, rank)
				groups = append(groups, []*ast.Node{member})
			}
		}
		if !alpha {
			return
		}
		if correct {
			for _, group := range groups {
				rule.memberAlpha(group, order)
			}
			return
		}
		var consecutive [][]*ast.Node
		previous := -100
		for index, member := range members {
			if index == len(members)-1 {
				break
			}
			rank := memberOrderingRank(member, memberTypes, modifiers)
			if rank == previous {
				if len(consecutive) != 0 {
					consecutive[len(consecutive)-1] = append(consecutive[len(consecutive)-1], member)
				}
			} else if rank == memberOrderingRank(members[index+1], memberTypes, modifiers) {
				consecutive = append(consecutive, []*ast.Node{member})
				previous = rank
			}
		}
		for _, group := range consecutive {
			rule.memberAlpha(group, order)
		}
	}
	switchIndex := -1
	if optionality != "" {
		for index := 1; index < len(members); index++ {
			if (members[index].QuestionToken() != nil) != (members[index-1].QuestionToken() != nil) {
				switchIndex = index
				break
			}
		}
	}
	if switchIndex == -1 {
		check(members)
		return
	}
	bad := members[0]
	if (bad.QuestionToken() != nil) == (optionality == "optional-first") {
		bad = nil
		for index := switchIndex + 1; index < len(members); index++ {
			if (members[index].QuestionToken() != nil) != (members[switchIndex].QuestionToken() != nil) {
				bad = members[switchIndex]
				break
			}
		}
	}
	if bad != nil {
		group := "optional"
		if optionality == "required-first" {
			group = "required"
		}
		rule.context.Report(rule.context.Range(bad), diagnostics.Member_0_should_be_declared_after_all_1_members, rule.memberName(bad), group)
		return
	}
	check(members[:switchIndex])
	check(members[switchIndex:])
}

func (rule *typescriptMemberOrderingRule) OnEnterNode(node *ast.Node) bool {
	rule.memberOrdering(node)
	return true
}

func (rule *typescriptMemberOrderingRule) OnExitNode(node *ast.Node) {}

func newTypeScriptMemberOrdering(context Context) Rule {
	return &typescriptMemberOrderingRule{context: context}
}
