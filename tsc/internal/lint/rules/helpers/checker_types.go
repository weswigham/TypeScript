package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
)

func SemanticTypeAtLocation(context Context, node *ast.Node) *checker.Type {
	typeChecker := context.GetChecker()
	value := typeChecker.GetTypeAtLocation(node)
	if constraint := typeChecker.GetBaseConstraintOfType(value); constraint != nil {
		return constraint
	}
	return value
}

func SemanticUnionParts(value *checker.Type) []*checker.Type {
	if value.IsUnion() {
		return value.Types()
	}
	return []*checker.Type{value}
}

func SemanticConstrainedType(context Context, value *checker.Type) *checker.Type {
	if constraint := context.GetChecker().GetBaseConstraintOfType(value); constraint != nil {
		return constraint
	}
	return value
}

func SemanticCallSignatures(context Context, value *checker.Type) []*checker.Signature {
	if value == nil {
		return nil
	}
	var result []*checker.Signature
	for _, part := range SemanticUnionParts(value) {
		result = append(result, context.GetChecker().GetSignaturesOfType(part, checker.SignatureKindCall)...)
	}
	return result
}

func SemanticTypeName(context Context, value *checker.Type) string {
	if value.Flags()&checker.TypeFlagsStringLike != 0 {
		return "string"
	}
	if value.Flags()&checker.TypeFlagsTypeParameter != 0 {
		if constraint := context.GetChecker().GetBaseConstraintOfType(value); constraint != nil {
			return SemanticTypeName(context,

				constraint)
		}
	}
	if value.IsUnion() {
		all := true
		for _, part := range value.Types() {
			all = all && SemanticTypeName(context,

				part) == "string"
		}
		if all {
			return "string"
		}
	}
	if value.IsIntersection() {
		for _, part := range value.Types() {
			if SemanticTypeName(context,

				part) == "string" {
				return "string"
			}
		}
	}
	return context.GetChecker().TypeToString(value)
}
