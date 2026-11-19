package rules

import (
	"fmt"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptUnifiedSignaturesRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func newTypeScriptUnifiedSignatures(context Context) Rule {
	rule := &typescriptUnifiedSignaturesRule{context: context}

	return Rule{
		Exit: rule.OnExitNode,
		ExitKinds: []ast.Kind{
			ast.KindClassDeclaration,
			ast.KindInterfaceDeclaration,
			ast.KindModuleBlock,
			ast.KindSourceFile,
			ast.KindTypeLiteral,
		},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptUnifiedSignaturesRule) OnExitNode(node *ast.Node) { rule.unifiedSignatures(node) }

func unifiedSignaturesSkipParens(node *ast.Node) *ast.Node {
	for node != nil && node.Kind == ast.KindParenthesizedType {
		node = node.AsParenthesizedTypeNode().Type
	}
	return node
}

func (rule *typescriptUnifiedSignaturesRule) equalType(left, right *ast.Node) bool {
	left, right = unifiedSignaturesSkipParens(left), unifiedSignaturesSkipParens(right)
	return left == right || left != nil && right != nil && helpers.SemanticSourceText(rule.context,

		left) == helpers.SemanticSourceText(rule.context,

		right)
}

func unifiedSignaturesParameterShape(node *ast.Node) int {
	shape := 0
	if node.AsParameterDeclaration().DotDotDotToken != nil {
		shape |= 1
	}
	if node.QuestionToken() != nil {
		shape |= 2
	}
	return shape
}

func unifiedSignaturesParameterIsThis(node *ast.Node) bool {
	return node != nil && node.Name() != nil && node.Name().Kind == ast.KindIdentifier && node.Name().Text() == "this"
}

func unifiedSignaturesParameterThisVoid(parameters []*ast.Node) bool {
	return len(parameters) != 0 && unifiedSignaturesParameterIsThis(parameters[0]) && parameters[0].Type() != nil && parameters[0].Type().Kind == ast.KindVoidKeyword
}

func (rule *typescriptUnifiedSignaturesRule) overloadDoc(node *ast.Node) string {
	scan := scanner.NewScanner()
	scan.SetText(rule.context.File.Text())
	scan.SetSkipTrivia(false)
	scan.ResetPos(node.Pos())
	doc := ""
	for scan.TokenEnd() < scanner.GetTokenPosOfNode(node, rule.context.File, false) {
		kind := scan.Scan()
		if kind == ast.KindMultiLineCommentTrivia {
			doc = rule.context.File.Text()[scan.TokenStart()+2 : scan.TokenEnd()-2]
		}
		if kind == ast.KindEndOfFile {
			break
		}
	}
	return doc
}

func unifiedSignaturesUsesOuter(node *ast.Node, outer map[string]bool) bool {
	for _, parameter := range node.Parameters() {
		value := unifiedSignaturesSkipParens(parameter.Type())
		for value != nil {
			if value.Kind == ast.KindTypeReference && value.AsTypeReferenceNode().TypeName.Kind == ast.KindIdentifier && outer[value.AsTypeReferenceNode().TypeName.Text()] {
				return true
			}
			if value.Kind != ast.KindArrayType {
				break
			}
			value = unifiedSignaturesSkipParens(value.AsArrayTypeNode().ElementType)
		}
	}
	return false
}

func (rule *typescriptUnifiedSignaturesRule) unifiedTypeText(left, right *ast.Node) string {
	var members []*ast.Node
	var add func(*ast.Node)
	add = func(node *ast.Node) {
		node = unifiedSignaturesSkipParens(node)
		if node == nil {
			return
		}
		if node.Kind == ast.KindUnionType {
			for _, child := range node.AsUnionTypeNode().Types.Nodes {
				add(child)
			}
			return
		}
		for _, earlier := range members {
			if rule.equalType(earlier, node) {
				return
			}
		}
		members = append(members, node)
	}
	add(left)
	add(right)
	texts := make([]string, len(members))
	for index, member := range members {
		texts[index] = helpers.SemanticSourceText(rule.context,

			member)
		if member.Kind == ast.KindFunctionType || member.Kind == ast.KindConstructorType || member.Kind == ast.KindConditionalType {
			texts[index] = "(" + texts[index] + ")"
		}
	}
	return strings.Join(texts, " | ")
}

func (rule *typescriptUnifiedSignaturesRule) compareSignatures(left, right *ast.Node, onlyTwo bool, outer map[string]bool) {
	if !rule.equalType(left.Type(), right.Type()) {
		return
	}
	leftTypes, rightTypes := left.TypeParameters(), right.TypeParameters()
	if len(leftTypes) != len(rightTypes) {
		return
	}
	for index, parameter := range leftTypes {
		other := rightTypes[index]
		if parameter.Name().Text() != other.Name().Text() || !rule.equalType(parameter.AsTypeParameterDeclaration().Constraint, other.AsTypeParameterDeclaration().Constraint) {
			return
		}
	}
	if unifiedSignaturesUsesOuter(left, outer) != unifiedSignaturesUsesOuter(right, outer) {
		return
	}
	options := helpers.SemanticRuleOptions(rule.context.Options)
	if options["ignoreOverloadsWithDifferentJSDoc"] == true && rule.overloadDoc(left) != rule.overloadDoc(right) {
		return
	}
	leftParams, rightParams := left.Parameters(), right.Parameters()
	common := min(len(leftParams), len(rightParams))
	if options["ignoreDifferentlyNamedParameters"] == true {
		for index := range common {
			first, second := leftParams[index], rightParams[index]
			shape := func(node *ast.Node) int {
				if node.ModifierFlags()&ast.ModifierFlagsParameterPropertyModifier != 0 {
					return 3
				}
				if node.AsParameterDeclaration().DotDotDotToken != nil {
					return 1
				}
				if node.Initializer() != nil {
					return 2
				}
				return 0
			}
			staticName := func(node *ast.Node) string {
				if shape(node) == 2 || shape(node) == 3 || node.Name().Kind != ast.KindIdentifier {
					return ""
				}
				return node.Name().Text()
			}
			if shape(first) == shape(second) && staticName(first) != staticName(second) {
				return
			}
		}
	}
	if unifiedSignaturesParameterThisVoid(leftParams) || unifiedSignaturesParameterThisVoid(rightParams) {
		return
	}
	start := func(other *ast.Node) string {
		prefix := "These overloads"
		if !onlyTwo {
			position := scanner.GetTokenPosOfNode(other, rule.context.File, false)
			line := 1 + strings.Count(rule.context.File.Text()[:position], "\n")
			prefix = fmt.Sprintf("This overload and the one on line %d", line)
		}
		return prefix + " can be combined into one signature"
	}
	if len(leftParams) == len(rightParams) {
		difference := -1
		for index, parameter := range leftParams {
			other := rightParams[index]
			if unifiedSignaturesParameterShape(parameter) != unifiedSignaturesParameterShape(other) || !rule.equalType(parameter.Type(), other.Type()) {
				if difference != -1 {
					return
				}
				difference = index
			}
		}
		if difference == -1 {
			diagnosticLocation := rule.context.Range(right)
			if right.Kind == ast.KindMethodDeclaration || right.Kind == ast.KindConstructor {
				scan := scanner.NewScanner()
				scan.SetText(rule.context.File.Text())
				scan.SetSkipTrivia(true)
				scan.ResetPos(scanner.GetTokenPosOfNode(right, rule.context.File, false))
				for token := scan.Scan(); token != ast.KindOpenParenToken && token != ast.KindLessThanToken && token != ast.KindEndOfFile; token = scan.Scan() {
				}
				diagnosticLocation = core.NewTextRange(scan.TokenStart(), right.End())
			}
			rule.context.Report(diagnosticLocation, diagnostics.X_0_with_identical_parameters, start(left))

			return
		}
		first, second := leftParams[difference], rightParams[difference]
		if unifiedSignaturesParameterShape(first) != unifiedSignaturesParameterShape(second) || unifiedSignaturesParameterShape(first)&1 != 0 {
			return
		}
		rule.context.Report(rule.context.Range(second), diagnostics.X_0_taking_1, start(first), rule.unifiedTypeText(first.Type(), second.Type()))
		return
	}
	firstThis, secondThis := len(leftParams) > 0 && unifiedSignaturesParameterIsThis(leftParams[0]), len(rightParams) > 0 && unifiedSignaturesParameterIsThis(rightParams[0])
	if firstThis != secondThis {
		return
	}
	longer, shorter, shortSignature := rightParams, leftParams, left
	if len(leftParams) > len(rightParams) {
		longer, shorter, shortSignature = leftParams, rightParams, right
	}
	for index := common + 1; index < len(longer); index++ {
		if unifiedSignaturesParameterShape(longer[index]) == 0 {
			return
		}
	}
	for index := range common {
		if !rule.equalType(leftParams[index].Type(), rightParams[index].Type()) {
			return
		}
	}
	if common > 0 && unifiedSignaturesParameterShape(shorter[common-1])&1 != 0 {
		return
	}
	extra := longer[len(longer)-1]
	message := diagnostics.X_0_with_an_optional_parameter
	if unifiedSignaturesParameterShape(extra)&1 != 0 {
		message = diagnostics.X_0_with_a_rest_parameter
	}
	rule.context.Report(rule.context.Range(extra), message, start(shortSignature))
}

func (rule *typescriptUnifiedSignaturesRule) unifiedSignatures(node *ast.Node) {
	var children []*ast.Node
	switch node.Kind {
	case ast.KindSourceFile, ast.KindModuleBlock:
		children = node.Statements()
	case ast.KindClassDeclaration, ast.KindInterfaceDeclaration, ast.KindTypeLiteral:
		children = node.Members()
	default:
		return
	}
	outer := map[string]bool{}
	if node.Kind == ast.KindClassDeclaration || node.Kind == ast.KindInterfaceDeclaration {
		for _, parameter := range node.TypeParameters() {
			outer[parameter.Name().Text()] = true
		}
	}
	var groups [][]*ast.Node
	indices := map[string]int{}
	for _, child := range children {
		key := ""
		switch child.Kind {
		case ast.KindFunctionDeclaration:
			if child.Body() != nil {
				continue
			}
			key = "function:default"
			if child.Name() != nil {
				key = "function:" + child.Name().Text()
			}
		case ast.KindCallSignature:
			key = "call"
		case ast.KindConstructSignature, ast.KindConstructor:
			if child.Kind == ast.KindConstructor && child.Body() != nil {
				continue
			}
			key = "constructor"
		case ast.KindMethodDeclaration, ast.KindMethodSignature:
			if child.Kind == ast.KindMethodDeclaration && child.Body() != nil {
				continue
			}
			name := child.Name()
			if name == nil {
				continue
			}
			key = "method:"
			if child.ModifierFlags()&ast.ModifierFlagsStatic != 0 {
				key += "static:"
			}
			if name.Kind == ast.KindComputedPropertyName {
				key += "computed:"
				name = name.AsComputedPropertyName().Expression
			}
			switch name.Kind {
			case ast.KindIdentifier:
				key += "identifier:" + name.Text()
			case ast.KindPrivateIdentifier:
				key += "private:" + name.Text()
			case ast.KindStringLiteral, ast.KindNumericLiteral:
				key += helpers.SemanticSourceText(rule.context,

					name)
			default:
				key += "undefined"
			}
		default:
			continue
		}
		index, exists := indices[key]
		if !exists {
			index = len(groups)
			indices[key] = index
			groups = append(groups, nil)
		}
		groups[index] = append(groups[index], child)
	}
	for _, group := range groups {
		for first := range group {
			for second := first + 1; second < len(group); second++ {
				rule.compareSignatures(group[first], group[second], len(group) == 2, outer)
			}
		}
	}
}
