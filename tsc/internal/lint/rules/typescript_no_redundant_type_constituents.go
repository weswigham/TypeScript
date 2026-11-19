package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/json"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typeScriptNoRedundantTypeConstituents struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptNoRedundantTypeConstituents(context Context) Rule {
	rule := &typeScriptNoRedundantTypeConstituents{context: context}

	return Rule{
		Exit:           rule.OnExitNode,
		ExitKinds:      []ast.Kind{ast.KindUnionType, ast.KindIntersectionType},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typeScriptNoRedundantTypeConstituents) OnExitNode(node *ast.Node) {
	if node.Kind == ast.KindUnionType || node.Kind == ast.KindIntersectionType {
		rule.redundant(node)
	}
}

func (rule *typeScriptNoRedundantTypeConstituents) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

type typeScriptNoRedundantTypeConstituentsFlag struct {
	flags checker.TypeFlags
	name  string
}

var typeScriptNoRedundantTypeConstituentsPrimitives = []checker.TypeFlags{checker.TypeFlagsBigInt, checker.TypeFlagsBoolean, checker.TypeFlagsNumber, checker.TypeFlagsString}

func typeScriptNoRedundantTypeConstituentsPrimitive(flags checker.TypeFlags) checker.TypeFlags {
	switch flags {
	case checker.TypeFlagsBigIntLiteral:
		return checker.TypeFlagsBigInt
	case checker.TypeFlagsBooleanLiteral:
		return checker.TypeFlagsBoolean
	case checker.TypeFlagsNumberLiteral:
		return checker.TypeFlagsNumber
	case checker.TypeFlagsStringLiteral, checker.TypeFlagsTemplateLiteral:
		return checker.TypeFlagsString
	}
	return 0
}

func typeScriptNoRedundantTypeConstituentsPrimitiveName(flags checker.TypeFlags) string {
	switch flags {
	case checker.TypeFlagsBigInt:
		return "bigint"
	case checker.TypeFlagsBoolean:
		return "boolean"
	case checker.TypeFlagsNumber:
		return "number"
	case checker.TypeFlagsString:
		return "string"
	}
	return ""
}

func (rule *typeScriptNoRedundantTypeConstituents) partFlags(raw *ast.Node) []typeScriptNoRedundantTypeConstituentsFlag {
	node := ast.SkipTypeParentheses(raw)
	if node.Kind == ast.KindBooleanKeyword {
		return []typeScriptNoRedundantTypeConstituentsFlag{{checker.TypeFlagsBoolean, "boolean"}}
	}
	if node.Kind == ast.KindUnionType {
		var result []typeScriptNoRedundantTypeConstituentsFlag
		for _, part := range helpers.SemanticTypeTypes(node) {
			result = append(result, rule.partFlags(part)...)
		}
		return result
	}
	value := rule.context.GetChecker().GetTypeAtLocation(node)
	parts := []*checker.Type{value}
	if value.IsUnion() && value.Flags()&checker.TypeFlagsBoolean == 0 {
		parts = value.Types()
	}
	var result []typeScriptNoRedundantTypeConstituentsFlag
	for _, part := range parts {
		name := "literal type"
		switch {
		case part.Flags()&checker.TypeFlagsStringLiteral != 0:
			encoded, err := json.Marshal(part.AsLiteralType().Value())
			if err != nil {
				panic(err)
			}
			name = strings.NewReplacer("&", `\u0026`, "<", `\u003c`, ">", `\u003e`, "\u2028", `\u2028`, "\u2029", `\u2029`).Replace(string(encoded))
		case part.Flags()&checker.TypeFlagsTemplateLiteral != 0:
			name = "template literal type"
		case part.Flags()&(checker.TypeFlagsNumberLiteral|checker.TypeFlagsBigIntLiteral|checker.TypeFlagsBooleanLiteral|checker.TypeFlagsAny|checker.TypeFlagsNever|checker.TypeFlagsUnknown) != 0:
			name = rule.context.GetChecker().TypeToString(part)
			if part.Flags()&checker.TypeFlagsAny != 0 && part.Alias() != nil {
				name = part.Alias().Symbol().Name()
			}
		}
		result = append(result, typeScriptNoRedundantTypeConstituentsFlag{part.Flags(), name})
	}
	return result
}

func (rule *typeScriptNoRedundantTypeConstituents) redundant(node *ast.Node) {
	intersection := node.Kind == ast.KindIntersectionType
	container := "union"
	if intersection {
		container = "intersection"
	}
	parts := helpers.SemanticTypeTypes(node)
	flags := make(map[*ast.Node][]typeScriptNoRedundantTypeConstituentsFlag)
	literals := make(map[checker.TypeFlags][]string)
	primitives := make(map[checker.TypeFlags][]*ast.Node)
	var unionNodes []*ast.Node
	for _, part := range parts {
		flags[part] = rule.partFlags(part)
		for _, value := range flags[part] {
			message := (*diagnostics.Message)(nil)
			if value.flags == checker.TypeFlagsAny || intersection && value.flags == checker.TypeFlagsNever || !intersection && value.flags == checker.TypeFlagsUnknown {
				message = diagnostics.X_0_overrides_all_other_types_in_this_1_type
				if value.flags == checker.TypeFlagsAny && value.name != "any" {
					message = diagnostics.X_0_is_an_error_type_that_acts_as_any_and_overrides_all_other_types_in_this_1_type
				}
			} else if intersection && value.flags == checker.TypeFlagsUnknown || !intersection && value.flags == checker.TypeFlagsNever && !typeScriptNoRedundantTypeConstituentsReturnType(node) {
				message = diagnostics.X_0_is_overridden_by_other_types_in_this_1_type
			}
			if message != nil {
				rule.context.Report(rule.context.Range(ast.SkipTypeParentheses(part)), message, value.name, container)
				continue
			}
			if primitive := typeScriptNoRedundantTypeConstituentsPrimitive(value.flags); primitive != 0 {
				literals[primitive] = append(literals[primitive], value.name)
			}
			for _, primitive := range typeScriptNoRedundantTypeConstituentsPrimitives {
				if intersection && value.flags == primitive || !intersection && value.flags&primitive != 0 {
					primitives[primitive] = append(primitives[primitive], part)
				}
			}
		}
		if len(flags[part]) >= 2 {
			unionNodes = append(unionNodes, part)
		}
	}
	if intersection {
		if len(unionNodes) > 0 {
			for _, part := range unionNodes {
				var names []string
				var primitive checker.TypeFlags
				for _, value := range flags[part] {
					primitive = typeScriptNoRedundantTypeConstituentsPrimitive(value.flags)
					if len(primitives[primitive]) == 0 {
						primitive = 0
						break
					}
					names = append(names, value.name)
				}
				if primitive != 0 {
					rule.context.Report(rule.context.Range(ast.SkipTypeParentheses(part)), diagnostics.X_0_is_overridden_by_the_1_in_this_intersection_type, typeScriptNoRedundantTypeConstituentsPrimitiveName(primitive), strings.Join(names, " | "))
				}
			}
			return
		}
		for _, primitive := range typeScriptNoRedundantTypeConstituentsPrimitives {
			if len(literals[primitive]) > 0 {
				for _, part := range primitives[primitive] {
					rule.context.Report(rule.context.Range(ast.SkipTypeParentheses(part)), diagnostics.X_0_is_overridden_by_the_1_in_this_intersection_type, typeScriptNoRedundantTypeConstituentsPrimitiveName(primitive), strings.Join(literals[primitive], " | "))
				}
			}
		}
		return
	}
	for _, part := range parts {
		for _, primitive := range typeScriptNoRedundantTypeConstituentsPrimitives {
			var names []string
			for _, value := range flags[part] {
				if typeScriptNoRedundantTypeConstituentsPrimitive(value.flags) == primitive && len(primitives[primitive]) > 0 {
					names = append(names, value.name)
				}
			}
			if len(names) > 0 {
				rule.context.Report(rule.context.Range(ast.SkipTypeParentheses(part)), diagnostics.X_0_is_overridden_by_1_in_this_union_type, strings.Join(names, " | "), typeScriptNoRedundantTypeConstituentsPrimitiveName(primitive))
			}
		}
	}
}

func typeScriptNoRedundantTypeConstituentsReturnType(node *ast.Node) bool {
	return node.Parent != nil && ast.IsFunctionLike(node.Parent) && node.Parent.Type() == node
}
