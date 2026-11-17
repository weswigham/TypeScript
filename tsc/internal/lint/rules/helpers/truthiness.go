package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/jsnum"
)

func SemanticTypeFlags(value *checker.Type) checker.TypeFlags {
	flags := value.Flags()
	if value.IsUnion() || value.IsIntersection() {
		for _, part := range value.Types() {
			flags |= SemanticTypeFlags(part)
		}
	}
	return flags
}

func SemanticLiteralValue(value *checker.Type) (any, bool) {
	if value.Flags()&checker.TypeFlagsLiteral != 0 {
		return value.AsLiteralType().Value(), true
	}
	if value.Flags()&(checker.TypeFlagsNull|checker.TypeFlagsUndefined) != 0 {
		return nil, true
	}
	return nil, false
}

func SemanticTruthyLiteral(value *checker.Type) bool {
	literal, known := SemanticLiteralValue(value)
	if !known {
		return false
	}
	switch literal := literal.(type) {
	case bool:
		return literal
	case string:
		return literal != ""
	case jsnum.Number:
		return literal != 0 && !literal.IsNaN()
	case jsnum.PseudoBigInt:
		return literal.Sign() != 0
	}
	return false
}

func SemanticTruthiness(value *checker.Type) (truthy, falsy bool) {
	if value.IsUnion() {
		for _, part := range value.Types() {
			partTruthy, partFalsy := SemanticTruthiness(part)
			truthy, falsy = truthy || partTruthy, falsy || partFalsy
		}
		return
	}
	if value.IsIntersection() {
		truthy = true
		for _, part := range value.Types() {
			partTruthy, partFalsy := SemanticTruthiness(part)
			truthy, falsy = truthy && partTruthy, falsy || partFalsy
		}
		return
	}
	if value.Flags()&checker.TypeFlagsNever != 0 {
		return false, false
	}
	if _, known := SemanticLiteralValue(value); known {
		return SemanticTruthyLiteral(value), !SemanticTruthyLiteral(value)
	}
	if value.Flags()&checker.TypeFlagsVoid != 0 {
		return false, true
	}
	return true, value.Flags()&checker.TypeFlagsPossiblyFalsy != 0
}

func SemanticUncertainType(value *checker.Type) bool {
	return SemanticTypeFlags(value)&(checker.TypeFlagsAny|checker.TypeFlagsUnknown|checker.TypeFlagsTypeVariable|checker.TypeFlagsConditional) != 0
}

func SemanticNullishType(value *checker.Type, uncertain bool) bool {
	flags := checker.TypeFlagsNull | checker.TypeFlagsUndefined | checker.TypeFlagsVoid
	if uncertain {
		flags |= checker.TypeFlagsAny | checker.TypeFlagsUnknown
	}
	return SemanticTypeFlags(value)&flags != 0
}
