package rules

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typeScriptNoUnnecessaryTypeParameters struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptNoUnnecessaryTypeParameters(context Context) Rule {
	return &typeScriptNoUnnecessaryTypeParameters{context: context}
}

func (rule *typeScriptNoUnnecessaryTypeParameters) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typeScriptNoUnnecessaryTypeParameters) OnExitNode(node *ast.Node) {}

func (rule *typeScriptNoUnnecessaryTypeParameters) fix(diagnostic *ast.Diagnostic, name string, edits []core.TextChange, suggestion *diagnostics.Message) {
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

type typeScriptNoUnnecessaryTypeParametersUsage struct {
	c           *checker.Checker
	counts      map[*ast.Symbol]int
	types       map[*checker.Type]int
	symbols     map[*ast.Symbol]bool
	constraints map[*checker.Type]bool
	defaults    map[*checker.Type]bool
	fromClass   bool
}

func (usage *typeScriptNoUnnecessaryTypeParametersUsage) signature(signature *checker.Signature) {
	if signature == nil {
		return
	}
	if parameter := signature.ThisParameter(); parameter != nil {
		usage.visit(usage.c.GetTypeOfSymbol(parameter), false, false)
	}
	for _, parameter := range signature.Parameters() {
		usage.visit(usage.c.GetTypeOfSymbol(parameter), false, false)
	}
	for _, parameter := range signature.TypeParameters() {
		usage.visit(parameter, false, false)
	}
	if predicate := usage.c.GetTypePredicateOfSignature(signature); predicate != nil && predicate.Type() != nil {
		usage.visit(predicate.Type(), false, true)
	} else {
		usage.visit(usage.c.GetReturnTypeOfSignature(signature), false, true)
	}
}

func (usage *typeScriptNoUnnecessaryTypeParametersUsage) visit(value *checker.Type, multiple, returned bool) {
	if value == nil {
		return
	}
	usage.types[value]++
	if usage.types[value] > 9 {
		return
	}
	flags := value.Flags()
	switch {
	case flags&checker.TypeFlagsTypeParameter != 0:
		if symbol := value.Symbol(); symbol != nil {
			amount := 1
			if multiple {
				amount = 2
			}
			usage.counts[symbol] += amount
		}
		if !usage.constraints[value] {
			usage.constraints[value] = true
			usage.visit(usage.c.GetConstraintOfTypeParameter(value), false, false)
		}
		if !usage.defaults[value] {
			usage.defaults[value] = true
			usage.visit(usage.c.GetDefaultFromTypeParameter(value), false, false)
		}
	case len(value.Alias().TypeArguments()) > 0:
		for _, argument := range value.Alias().TypeArguments() {
			usage.visit(argument, true, false)
		}
	case flags&checker.TypeFlagsUnionOrIntersection != 0:
		for _, part := range value.Types() {
			usage.visit(part, multiple, returned)
		}
	case flags&checker.TypeFlagsIndexedAccess != 0:
		usage.visit(value.AsIndexedAccessType().ObjectType(), multiple, false)
		usage.visit(value.AsIndexedAccessType().IndexType(), multiple, false)
	case value.ObjectFlags()&checker.ObjectFlagsReference != 0:
		assumeMultiple := usage.fromClass || multiple
		if checker.IsTupleType(value) {
			assumeMultiple = assumeMultiple || returned && !value.Target().AsTupleType().IsReadonly()
		} else if usage.c.IsArrayType(value) {
			assumeMultiple = assumeMultiple || returned && value.Symbol() != nil && value.Symbol().Name() == "Array"
		} else {
			assumeMultiple = true
		}
		for _, argument := range usage.c.GetTypeArguments(value) {
			usage.visit(argument, assumeMultiple, returned)
		}
	case flags&checker.TypeFlagsTemplateLiteral != 0:
		for _, part := range value.AsTemplateLiteralType().Types() {
			usage.visit(part, multiple, false)
		}
	case flags&checker.TypeFlagsConditional != 0:
		usage.visit(value.AsConditionalType().CheckType(), multiple, false)
		usage.visit(value.AsConditionalType().ExtendsType(), multiple, false)
	case flags&checker.TypeFlagsObject != 0:
		properties := usage.c.GetPropertiesOfType(value)
		for _, property := range properties {
			if !usage.symbols[property] {
				usage.symbols[property] = true
				usage.visit(usage.c.GetTypeOfSymbol(property), false, false)
			}
		}
		if value.ObjectFlags()&checker.ObjectFlagsMapped != 0 {
			mapped := value.AsMappedType()
			mapped.ResolveComponents(usage.c, value)
			usage.visit(mapped.TypeParameter(), false, false)
			if len(properties) == 0 {
				usage.visit(mapped.TemplateType(), false, false)
				if mapped.ConstraintType() != nil && (mapped.TypeParameter() == nil || mapped.ConstraintType() != usage.c.GetConstraintOfTypeParameter(mapped.TypeParameter())) {
					usage.visit(mapped.ConstraintType(), false, false)
				}
			}
			usage.visit(mapped.NameType(), false, false)
		}
		for _, index := range usage.c.GetIndexInfosOfType(value) {
			usage.visit(index.ValueType(), true, false)
		}
		for _, kind := range []checker.SignatureKind{checker.SignatureKindCall, checker.SignatureKindConstruct} {
			for _, signature := range usage.c.GetSignaturesOfType(value, kind) {
				usage.signature(signature)
			}
		}
	case flags&checker.TypeFlagsIndex != 0:
		usage.visit(value.AsIndexType().Target(), multiple, false)
	case flags&checker.TypeFlagsStringMapping != 0:
		usage.visit(value.AsStringMappingType().Target(), multiple, false)
	case flags&checker.TypeFlagsSubstitution != 0:
		usage.visit(value.AsSubstitutionType().BaseType(), multiple, false)
	}
}

func (rule *typeScriptNoUnnecessaryTypeParameters) collect(node *ast.Node, counts map[*ast.Symbol]int, fromClass bool) {
	usage := typeScriptNoUnnecessaryTypeParametersUsage{c: rule.context.GetChecker(), counts: counts, types: make(map[*checker.Type]int), symbols: make(map[*ast.Symbol]bool), constraints: make(map[*checker.Type]bool), defaults: make(map[*checker.Type]bool), fromClass: fromClass}
	if node.Kind == ast.KindCallSignature || node.Kind == ast.KindConstructor || node.Kind == ast.KindConstructSignature || ast.IsFunctionLike(node) {
		usage.signature(usage.c.GetSignatureFromDeclaration(node))
		return
	}
	usage.visit(usage.c.GetTypeAtLocation(node), false, false)
}

func (rule *typeScriptNoUnnecessaryTypeParameters) references(root, parameter *ast.Node) []*ast.Node {
	c := rule.context.GetChecker()
	symbol := c.GetSymbolAtLocation(parameter.Name())
	var result []*ast.Node
	var visit func(*ast.Node)
	visit = func(node *ast.Node) {
		if node.Kind == ast.KindIdentifier && node.Parent != nil && node.Parent.Kind == ast.KindTypeReference && node.Parent.AsTypeReferenceNode().TypeName == node && c.GetSymbolAtLocation(node) == symbol {
			result = append(result, node.Parent)
		}
		node.ForEachChild(func(child *ast.Node) bool { visit(child); return false })
	}
	visit(root)
	return result
}

func (rule *typeScriptNoUnnecessaryTypeParameters) repeated(node, parameter *ast.Node, references []*ast.Node) bool {
	if ast.IsClassLike(node) {
		return false
	}
	boundary := node.End()
	if node.Body() != nil {
		boundary = helpers.SemanticSyntaxStart(rule.context, node.Body())
	}
	count := 0
	for _, reference := range references {
		if reference.Pos() >= parameter.Pos() && reference.End() <= parameter.End() || helpers.SemanticSyntaxStart(rule.context, reference) > boundary {
			continue
		}
		parent := reference.Parent
		for parent != nil && (parent.Kind == ast.KindUnionType || parent.Kind == ast.KindIntersectionType || parent.Kind == ast.KindParenthesizedType) {
			parent = parent.Parent
		}
		if parent != nil && (parent.Kind == ast.KindTypeReference || parent.Kind == ast.KindExpressionWithTypeArguments || parent.Kind == ast.KindCallExpression || parent.Kind == ast.KindNewExpression) && slices.Contains(parent.TypeArguments(), reference) {
			if parent.Kind != ast.KindTypeReference || parent.AsTypeReferenceNode().TypeName.Kind != ast.KindIdentifier || parent.AsTypeReferenceNode().TypeName.Text() != "Array" && parent.AsTypeReferenceNode().TypeName.Text() != "ReadonlyArray" {
				return true
			}
		}
		count++
		if count >= 2 {
			return true
		}
	}
	return false
}

func (rule *typeScriptNoUnnecessaryTypeParameters) replacement(parameter, reference *ast.Node) string {
	constraint := parameter.AsTypeParameterDeclaration().Constraint
	if constraint == nil || constraint.Kind == ast.KindAnyKeyword {
		return "unknown"
	}
	text := helpers.SemanticSyntaxText(rule.context, constraint)
	weak := constraint.Kind == ast.KindUnionType || constraint.Kind == ast.KindIntersectionType || constraint.Kind == ast.KindConditionalType || constraint.Kind == ast.KindTypeOperator || constraint.Kind == ast.KindFunctionType || constraint.Kind == ast.KindConstructorType
	parent := reference.Parent
	if weak && parent != nil {
		switch parent.Kind {
		case ast.KindArrayType, ast.KindIndexedAccessType, ast.KindUnionType, ast.KindIntersectionType, ast.KindConditionalType, ast.KindTypeOperator, ast.KindOptionalType:
			text = "(" + text + ")"
		}
	}
	return text
}

func (rule *typeScriptNoUnnecessaryTypeParameters) OnEnterNode(node *ast.Node) bool {
	class := ast.IsClassLike(node)
	if !class && !ast.IsFunctionLike(node) {
		return true
	}
	parameters := node.TypeParameters()
	if len(parameters) == 0 {
		return true
	}
	counts := make(map[*ast.Symbol]int)
	if class {
		for _, parameter := range parameters {
			rule.collect(parameter, counts, true)
		}
		for _, member := range node.Members() {
			rule.collect(member, counts, true)
		}
	} else {
		rule.collect(node, counts, false)
	}
	for index, parameter := range parameters {
		references := rule.references(node, parameter)
		if rule.repeated(node, parameter, references) {
			continue
		}
		count := counts[rule.context.GetChecker().GetSymbolAtLocation(parameter.Name())]
		if count == 0 || count > 2 {
			continue
		}
		uses, descriptor := "used only once", "function"
		if count == 1 {
			uses = "never used"
		}
		if class {
			descriptor = "class"
		}
		diagnostic := rule.context.Report(rule.context.Range(parameter), diagnostics.Type_parameter_0_is_1_in_the_2_signature, parameter.Name().Text(), uses, descriptor)
		start, end := helpers.SemanticSyntaxStart(rule.context, parameter), parameter.End()
		if len(parameters) == 1 {
			start = helpers.SemanticSyntaxStart(rule.context, node) + strings.LastIndex(rule.context.File.Text()[helpers.SemanticSyntaxStart(rule.context, node):start], "<")
			end += strings.Index(rule.context.File.Text()[end:], ">") + 1
		} else if index == 0 {
			end = helpers.SemanticSyntaxStart(rule.context, parameters[1])
		} else {
			start = parameters[index-1].End() + strings.LastIndex(rule.context.File.Text()[parameters[index-1].End():start], ",")
		}
		edits := []core.TextChange{helpers.SemanticSyntaxEdit(start, end, helpers.SemanticSyntaxComments(rule.context, start, end))}
		for _, reference := range references {
			if reference.Pos() >= start && reference.End() <= end {
				continue
			}
			edits = append(edits, helpers.SemanticSyntaxEdit(helpers.SemanticSyntaxStart(rule.context, reference), reference.End(), rule.replacement(parameter, reference)))
		}
		rule.fix(diagnostic, "no-unnecessary-type-parameters", edits, diagnostics.Replace_all_usages_of_type_parameter_with_its_constraint)
	}
	return true
}
