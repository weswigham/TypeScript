package helpers

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
)

func semanticTypeSpecifierFileMatches(context Context, filename string, requestedPath any) bool {
	base := context.File.FileName().Directory().AsString()
	if context.CompilerOptions != nil && context.CompilerOptions.ConfigFilePath != "" {
		base = context.CompilerOptions.ConfigFilePath.Directory().AsString()
	} else if context.CurrentDirectory != "" {
		base = context.CurrentDirectory.AsString()
	}
	base = tspath.NormalizePath(base)
	filename = tspath.NormalizePath(filename)
	if relative, ok := requestedPath.(string); ok {
		return filename == tspath.NormalizePath(base+"/"+relative)
	}
	return strings.HasPrefix(filename, base)
}

func SemanticLibrarySymbol(context Context, symbol *ast.Symbol) bool {
	return symbol != nil && context.GetChecker().IsLibSymbolForHoverVerbosity(symbol)
}

func SemanticMatchesBase(context Context, value *checker.Type, predicate func(*checker.Type) bool, seen map[*checker.Type]bool) bool {
	if value == nil || seen[value] {
		return false
	}
	seen[value] = true
	if predicate(value) {
		return true
	}
	declared := value
	if value.ObjectFlags()&checker.ObjectFlagsReference != 0 {
		declared = value.Target()
	}
	if declared.ObjectFlags()&checker.ObjectFlagsClassOrInterface != 0 {
		for _, base := range context.GetChecker().GetBaseTypes(declared) {
			if SemanticMatchesBase(context,

				base, predicate, seen) {
				return true
			}
		}
	}
	return false
}

func semanticTypeSpecifier(context Context, value *checker.Type, spec any) bool {
	if value == nil || value.Flags()&checker.TypeFlagsAny != 0 && value.AsIntrinsicType().IntrinsicName() == "error" {
		return false
	}
	if value.IsIntersection() {
		for _, part := range value.Types() {
			if semanticTypeSpecifier(context,

				part, spec) {
				return true
			}
		}
	}
	if value.IsUnion() {
		for _, part := range value.Types() {
			if !semanticTypeSpecifier(context,

				part, spec) {
				return false
			}
		}
		return true
	}
	options, structured := spec.(map[string]any)
	names := SemanticOptionNames(spec)
	if structured {
		names = SemanticOptionNames(options["name"])
	}
	symbol := value.Symbol()
	nameSymbol := symbol
	if alias := value.Alias(); alias != nil {
		nameSymbol = alias.Symbol()
		if symbol == nil {
			symbol = nameSymbol
		}
	}
	name := ""
	if nameSymbol != nil {
		name = nameSymbol.Name()
	}
	intrinsic := ""
	if value.Flags()&checker.TypeFlagsIntrinsic != 0 {
		intrinsic = value.AsIntrinsicType().IntrinsicName()
	}
	if !slices.Contains(names, name) && (intrinsic == "" || !slices.Contains(names, intrinsic)) {
		return false
	}
	if !structured {
		return true
	}
	return SemanticTypeSpecifierOrigin(context, symbol, options)
}

func SemanticTypeSpecifierOrigin(context Context, symbol *ast.Symbol, options map[string]any) bool {
	from, _ := options["from"].(string)
	if from == "lib" {
		return symbol == nil || len(symbol.Declarations()) == 0 || SemanticLibrarySymbol(context,

			symbol)
	}
	if symbol == nil {
		return false
	}
	for _, declaration := range symbol.Declarations() {
		file := ast.GetSourceFileOfNode(declaration)
		if file == nil {
			continue
		}
		filename := strings.ReplaceAll(file.FileName().AsString(), "\\", "/")
		if from == "file" {
			if semanticTypeSpecifierFileMatches(context, filename, options["path"]) {
				return !SemanticLibrarySymbol(context,

					symbol)
			}
		}
		if from == "package" {
			packageName, _ := options["package"].(string)
			if packageName != "" && file.IsDeclarationFile && (strings.Contains(filename, "/node_modules/"+packageName+"/") || strings.Contains(filename, "/node_modules/@types/"+strings.ReplaceAll(strings.TrimPrefix(packageName, "@"), "/", "__")+"/")) {
				return true
			}
			for ancestor := declaration.Parent; ancestor != nil; ancestor = ancestor.Parent {
				if ancestor.Kind == ast.KindModuleDeclaration && ancestor.Name().Kind == ast.KindStringLiteral && ancestor.Name().Text() == packageName {
					return true
				}
			}
		}
	}
	return false
}

func SemanticAllowedType(context Context, value *checker.Type, defaults []any) bool {
	items := defaults
	if option, exists := SemanticRuleOptions(context.Options)["allow"]; exists {
		items, _ = option.([]any)
	}
	for _, item := range items {
		if semanticTypeSpecifier(context,

			value, item) {
			return true
		}
	}
	return false
}
