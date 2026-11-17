package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type typescriptNoGeneratedEmptyObjectTypeRule struct{ context Context }

func (rule *typescriptNoGeneratedEmptyObjectTypeRule) emptyObject(valueType *checker.Type) bool {
	if valueType.IsUnion() {
		return slices.ContainsFunc(valueType.Types(), rule.emptyObject)
	}
	typeChecker := rule.context.GetChecker()
	return valueType.Flags()&checker.TypeFlagsObject != 0 &&
		valueType.ObjectFlags()&(checker.ObjectFlagsClass|checker.ObjectFlagsInterface) == 0 &&
		len(typeChecker.GetPropertiesOfType(valueType)) == 0 &&
		len(typeChecker.GetIndexInfosOfType(valueType)) == 0 &&
		len(typeChecker.GetSignaturesOfType(valueType, checker.SignatureKindCall)) == 0 &&
		len(typeChecker.GetSignaturesOfType(valueType, checker.SignatureKindConstruct)) == 0 &&
		typeChecker.IsTypeAssignableTo(typeChecker.GetNumberType(), valueType) &&
		typeChecker.IsTypeAssignableTo(typeChecker.GetStringType(), valueType)
}

func (rule *typescriptNoGeneratedEmptyObjectTypeRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindIntersectionType || node.Kind == ast.KindTypeReference && node.AsTypeReferenceNode().TypeArguments != nil && node.Parent.Kind != ast.KindIntersectionType {
		valueType := rule.context.GetChecker().GetTypeAtLocation(node)
		if rule.emptyObject(valueType) {
			rule.context.Report(rule.context.Range(node), diagnostics.This_type_resolves_to_the_empty_object_type_This_was_likely_not_intentional)
		}
	}
	return true
}

func (rule *typescriptNoGeneratedEmptyObjectTypeRule) OnExitNode(node *ast.Node) {}

func newTypeScriptNoGeneratedEmptyObjectType(context Context) Rule {
	return &typescriptNoGeneratedEmptyObjectTypeRule{context: context}
}
