package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typeScriptNoUselessDefaultAssignment struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptNoUselessDefaultAssignment(context Context) Rule {
	return &typeScriptNoUselessDefaultAssignment{context: context}
}

func (rule *typeScriptNoUselessDefaultAssignment) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typeScriptNoUselessDefaultAssignment) OnExitNode(node *ast.Node) {}

func (rule *typeScriptNoUselessDefaultAssignment) fix(diagnostic *ast.Diagnostic, name string, edits []core.TextChange, suggestion *diagnostics.Message) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	for _, edit := range edits {
		tracker.ReplaceTextRangeWithText(rule.context.File, edit.TextRange, edit.NewText)
	}
	description := ast.NewCompilerDiagnostic(diagnostics.Fix_0, name)
	if suggestion != nil {
		description = ast.NewCompilerDiagnostic(suggestion)
	}
	action := codefix.CreateCodeFixAction("@typescript-eslint/"+name, tracker.GetTextChanges(), description, "@typescript-eslint/"+name, ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, name))
	if suggestion == nil {
		diagnostic.SetCodeFixes(action)
		return
	}
	if rule.suggestions == nil {
		rule.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
	}
	rule.suggestions[diagnostic] = append(rule.suggestions[diagnostic], action)
}

func typeScriptNoUselessDefaultAssignmentCanBeUndefined(value *checker.Type) bool {
	return value == nil || helpers.SemanticSyntaxHas(value, checker.TypeFlagsAny|checker.TypeFlagsUnknown|checker.TypeFlagsUndefined)
}

func (rule *typeScriptNoUselessDefaultAssignment) source(pattern *ast.Node) *checker.Type {
	owner := pattern.Parent
	if owner == nil {
		return nil
	}
	c := rule.context.GetChecker()
	switch owner.Kind {
	case ast.KindVariableDeclaration:
		if owner.Initializer() != nil {
			return c.GetTypeAtLocation(owner.Initializer())
		}
	case ast.KindParameter:
		if owner.Type() != nil {
			return c.GetTypeFromTypeNode(owner.Type())
		}
		return c.GetTypeAtLocation(pattern)
	case ast.KindBindingElement:
		return rule.bindingType(owner, false)
	}
	return nil
}

func typeScriptNoUselessDefaultAssignmentBranchHasProperty(node *ast.Node, name string) bool {
	node = ast.SkipParentheses(node)
	if node.Kind == ast.KindConditionalExpression {
		expression := node.AsConditionalExpression()
		return typeScriptNoUselessDefaultAssignmentBranchHasProperty(expression.WhenTrue, name) && typeScriptNoUselessDefaultAssignmentBranchHasProperty(expression.WhenFalse, name)
	}
	if node.Kind == ast.KindObjectLiteralExpression {
		for _, property := range node.AsObjectLiteralExpression().Properties.Nodes {
			if key, ok := helpers.SemanticSyntaxPropertyName(property.Name()); ok && key == name {
				return true
			}
		}
	}
	return false
}

func (rule *typeScriptNoUselessDefaultAssignment) bindingType(element *ast.Node, requireTuple bool) *checker.Type {
	pattern := element.Parent
	value := rule.source(pattern)
	if value == nil {
		return nil
	}
	c := rule.context.GetChecker()
	if pattern.Kind == ast.KindObjectBindingPattern {
		key := element.AsBindingElement().PropertyName
		if key == nil {
			key = element.Name()
		}
		name, ok := helpers.SemanticSyntaxPropertyName(key)
		if !ok {
			return nil
		}
		symbol := c.GetPropertyOfType(value, name)
		if symbol == nil {
			return nil
		}
		if symbol.Flags()&ast.SymbolFlagsOptional != 0 {
			owner := pattern.Parent
			if owner.Kind == ast.KindVariableDeclaration && owner.Initializer() != nil {
				initializer := ast.SkipParentheses(owner.Initializer())
				if (initializer.Kind == ast.KindConditionalExpression || initializer.Kind == ast.KindBinaryExpression) && !typeScriptNoUselessDefaultAssignmentBranchHasProperty(initializer, name) {
					return nil
				}
			}
		}
		return c.GetTypeOfSymbol(symbol)
	}
	if pattern.Kind != ast.KindArrayBindingPattern {
		return nil
	}
	index := slices.Index(pattern.AsBindingPattern().Elements.Nodes, element)
	if index < 0 {
		return nil
	}
	if checker.IsTupleType(value) {
		arguments := c.GetTypeArguments(value)
		if index >= len(arguments) {
			return nil
		}
		if requireTuple {
			target := value.Target().AsTupleType()
			minimum := 0
			for _, flags := range target.ElementFlags() {
				if flags&(checker.ElementFlagsRequired|checker.ElementFlagsVariadic) != 0 {
					minimum++
				}
			}
			if index >= minimum {
				return nil
			}
			if index >= target.FixedLength() {
				return c.GetUnionTypeEx(arguments[target.FixedLength():], checker.UnionReductionNone)
			}
		}
		return arguments[index]
	}
	if requireTuple {
		return nil
	}
	return c.GetIndexTypeOfType(value, c.GetNumberType())
}

func (rule *typeScriptNoUselessDefaultAssignment) contextualParameter(node *ast.Node) *checker.Type {
	function := node.Parent
	if function.Kind != ast.KindArrowFunction && function.Kind != ast.KindFunctionExpression {
		return nil
	}
	c := rule.context.GetChecker()
	contextual := c.GetContextualType(function, checker.ContextFlagsNone)
	if contextual == nil {
		return nil
	}
	index := slices.Index(function.Parameters(), node)
	signatures := c.GetSignaturesOfType(contextual, checker.SignatureKindCall)
	if index < 0 || len(signatures) == 0 {
		return nil
	}
	var result *checker.Type
	for _, signature := range signatures {
		parameters := signature.Parameters()
		if signature.Declaration() == function || index >= len(parameters) {
			return nil
		}
		parameter := parameters[index]
		declaration := parameter.ValueDeclaration()
		if parameter.Flags()&ast.SymbolFlagsOptional != 0 || declaration != nil && declaration.Kind == ast.KindParameter && declaration.AsParameterDeclaration().DotDotDotToken != nil {
			return nil
		}
		value := c.GetTypeOfSymbol(parameter)
		if value.Flags()&checker.TypeFlagsTypeParameter != 0 || typeScriptNoUselessDefaultAssignmentCanBeUndefined(value) {
			return nil
		}
		result = value
	}
	return result
}

func (rule *typeScriptNoUselessDefaultAssignment) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindSourceFile && !helpers.SemanticSyntaxStrict(rule.context) && !helpers.SemanticSyntaxBoolean(rule.context, "allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing") {
		rule.context.Report(rule.context.Range(node), diagnostics.This_rule_requires_the_strictNullChecks_compiler_option_to_be_turned_on_to_function_correctly)
	}
	if node.Kind != ast.KindParameter && node.Kind != ast.KindBindingElement {
		return true
	}
	initializer := node.Initializer()
	if initializer == nil {
		return true
	}
	c := rule.context.GetChecker()
	kind := "property"
	if node.Kind == ast.KindParameter {
		kind = "parameter"
	}
	message := diagnostics.Default_value_is_useless_because_the_0_is_not_optional
	suggestion := diagnostics.Remove_the_default_value
	optional := false
	if initializer.Kind == ast.KindIdentifier && initializer.Text() == "undefined" {
		message = diagnostics.Default_value_is_useless_because_it_is_undefined_Optional_0_s_are_already_undefined_by_default
		if node.Kind == ast.KindParameter && node.Type() != nil && typeScriptNoUselessDefaultAssignmentCanBeUndefined(c.GetTypeFromTypeNode(node.Type())) {
			message = diagnostics.Using_undefined_to_make_a_parameter_optional_adds_unnecessary_runtime_logic
			suggestion = diagnostics.Use_the_optional_syntax_instead
			optional = true
		}
	} else {
		var value *checker.Type
		if node.Kind == ast.KindBindingElement {
			value = rule.bindingType(node, true)
		} else {
			value = rule.contextualParameter(node)
		}
		if typeScriptNoUselessDefaultAssignmentCanBeUndefined(value) {
			return true
		}
	}
	var diagnostic *ast.Diagnostic
	if optional {
		diagnostic = rule.context.Report(rule.context.Range(initializer), message)
	} else {
		diagnostic = rule.context.Report(rule.context.Range(initializer), message, kind)
	}
	leftEnd := node.Name().End()
	if node.Type() != nil {
		leftEnd = node.Type().End()
	}
	edits := []core.TextChange{helpers.SemanticSyntaxEdit(leftEnd, initializer.End(), helpers.SemanticSyntaxComments(rule.context, leftEnd, initializer.End()))}
	if optional && node.Name().Kind == ast.KindIdentifier && node.AsParameterDeclaration().QuestionToken == nil {
		edits = append(edits, helpers.SemanticSyntaxEdit(node.Name().End(), node.Name().End(), "?"))
	}
	rule.fix(diagnostic, "no-useless-default-assignment", edits, suggestion)
	return true
}
