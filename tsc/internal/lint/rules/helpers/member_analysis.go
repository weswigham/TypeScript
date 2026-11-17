package helpers

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
)

func SemanticMemberOptions(context Context) map[string]any {
	if len(context.Options) > 0 {
		options, _ := context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func SemanticMemberBoolean(context Context, name string, fallback bool) bool {
	if value, ok := SemanticMemberOptions(context)[name].(bool); ok {
		return value
	}
	return fallback
}

func SemanticMemberParts(value *checker.Type) []*checker.Type {
	if value.IsUnion() {
		return value.Types()
	}
	return []*checker.Type{value}
}

func SemanticMemberIntersection(value *checker.Type) []*checker.Type {
	if value.IsIntersection() {
		return value.Types()
	}
	return []*checker.Type{value}
}

func SemanticMemberConstrained(c *checker.Checker, value *checker.Type) *checker.Type {
	if constraint := c.GetBaseConstraintOfType(value); constraint != nil {
		return constraint
	}
	return value
}

func SemanticMemberLibrary(symbol *ast.Symbol) bool {
	if symbol == nil || len(symbol.Declarations()) == 0 {
		return false
	}
	for _, declaration := range symbol.Declarations() {
		file := ast.GetSourceFileOfNode(declaration)
		name := strings.ReplaceAll(string(file.FileName()), "\\", "/")
		if !strings.Contains(name, "/lib.") || !strings.HasSuffix(name, ".d.ts") {
			return false
		}
	}
	return true
}
