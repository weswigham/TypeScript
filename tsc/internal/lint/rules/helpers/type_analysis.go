package helpers

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

func SemanticTypeOptions(context Context) map[string]any {
	if len(context.Options) != 0 {
		if options, ok := context.Options[0].(map[string]any); ok {
			return options
		}
	}
	return nil
}

func SemanticTypeStart(context Context, node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, context.File, false)
}

func SemanticTypeText(context Context, node *ast.Node) string {
	return context.File.Text()[SemanticTypeStart(context, node):node.End()]
}

func SemanticTypeTypes(node *ast.Node) []*ast.Node {
	if node.Kind == ast.KindUnionType {
		return node.AsUnionTypeNode().Types.Nodes
	}
	return node.AsIntersectionTypeNode().Types.Nodes
}

func semanticTypeNames(raw any) []string {
	switch value := raw.(type) {
	case string:
		return []string{value}
	case []string:
		return value
	case []any:
		var result []string
		for _, item := range value {
			if name, ok := item.(string); ok {
				result = append(result, name)
			}
		}
		return result
	}
	return nil
}

func SemanticTypeAllowed(context Context, value *checker.Type, node *ast.Node, matchValue bool) bool {
	options, _ := SemanticTypeOptions(context)["allow"].([]any)
	for _, specifier := range options {
		if semanticTypeMatchesType(context, value, specifier) {
			return true
		}
		if matchValue && node != nil {
			names := semanticTypeNames(specifier)
			object, structured := specifier.(map[string]any)
			if structured {
				names = semanticTypeNames(object["name"])
			}
			if slices.Contains(names, node.Text()) && (!structured || object["from"] != "package" || semanticTypeMatchesOrigin(context, value.Symbol(), object)) {
				return true
			}
		}
	}
	return false
}

func semanticTypeMatchesType(context Context, value *checker.Type, specifier any) bool {
	if value == nil {
		return false
	}
	if value.IsUnion() {
		for _, part := range value.Types() {
			if !semanticTypeMatchesType(context, part, specifier) {
				return false
			}
		}
		return true
	}
	if value.Flags()&checker.TypeFlagsAny != 0 && value.AsIntrinsicType().IntrinsicName() == "error" {
		return false
	}
	names := semanticTypeNames(specifier)
	object, structured := specifier.(map[string]any)
	if structured {
		names = semanticTypeNames(object["name"])
	}
	symbol := value.Symbol()
	if value.Alias() != nil {
		symbol = value.Alias().Symbol()
	}
	nameMatches := symbol != nil && slices.Contains(names, symbol.Name())
	if value.Flags()&checker.TypeFlagsIntrinsic != 0 && value.Flags()&checker.TypeFlagsUnionOrIntersection == 0 {
		nameMatches = nameMatches || slices.Contains(names, value.AsIntrinsicType().IntrinsicName())
	}
	if nameMatches {
		originSymbol := value.Symbol()
		if originSymbol == nil {
			originSymbol = symbol
		}
		if !structured || semanticTypeMatchesOrigin(context, originSymbol, object) {
			return true
		}
	}
	if value.IsIntersection() {
		for _, part := range value.Types() {
			if semanticTypeMatchesType(context, part, specifier) {
				return true
			}
		}
	}
	return false
}

func semanticTypeMatchesOrigin(context Context, symbol *ast.Symbol, specifier map[string]any) bool {
	if symbol == nil {
		return false
	}
	if specifier["from"] == "lib" {
		return context.GetChecker().IsLibSymbolForHoverVerbosity(symbol)
	}
	for _, declaration := range symbol.Declarations() {
		file := ast.GetSourceFileOfNode(declaration)
		switch specifier["from"] {
		case "file":
			if semanticTypeSpecifierFileMatches(context, file.FileName().AsString(), specifier["path"]) {
				return true
			}
		case "package":
			packageName, _ := specifier["package"].(string)
			for parent := declaration.Parent; parent != nil && parent.Kind != ast.KindSourceFile; parent = parent.Parent {
				if parent.Kind == ast.KindModuleDeclaration && parent.Name().Kind == ast.KindStringLiteral && parent.Name().Text() == packageName {
					return true
				}
			}
			if module := context.GetChecker().TryFindAmbientModule(packageName); module != nil {
				for exported := range module.Exports().Values() {
					if exported.Flags()&ast.SymbolFlagsAlias != 0 {
						exported = context.GetChecker().GetAliasedSymbol(exported)
					}
					if exported == symbol {
						return true
					}
				}
			}
		}
	}
	return false
}
