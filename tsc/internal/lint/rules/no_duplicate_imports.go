package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noDuplicateImports struct {
	context Context
}

func newNoDuplicateImports(context Context) Rule {
	rule := &noDuplicateImports{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindExportDeclaration, ast.KindImportDeclaration},
	}
}

func (rule *noDuplicateImports) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindImportDeclaration || node.Kind == ast.KindExportDeclaration && rule.Boolean("includeExports") {
		rule.duplicateImport(node)
	}

	return true
}

func (rule *noDuplicateImports) Options() map[string]any {
	if len(rule.context.Options) > 0 {
		options, _ := rule.context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func (rule *noDuplicateImports) Boolean(name string) bool {
	value, _ := rule.Options()[name].(bool)
	return value
}

func (rule *noDuplicateImports) duplicateImport(node *ast.Node) {
	info := getDuplicateImportInfo(node)
	if info.module == "" {
		return
	}
	var reported [2]bool
	for _, previous := range rule.context.File.Statements.Nodes {
		if previous == node {
			break
		}
		other := getDuplicateImportInfo(previous)
		if other.module != info.module || other.export && !rule.Boolean("includeExports") || rule.Boolean("allowSeparateTypeImports") && other.typeOnly != info.typeOnly {
			continue
		}
		if info.typeOnly && other.typeOnly && (info.kind == "default" && other.kind == "named" || info.kind == "named" && other.kind == "default") {
			continue
		}
		if info.kind == "all" && other.kind != "all" && other.kind != "side" || other.kind == "all" && info.kind != "all" && info.kind != "side" || info.kind == "namespace" && other.kind == "named" || other.kind == "namespace" && info.kind == "named" {
			continue
		}
		if other.export {
			reported[1] = true
		} else {
			reported[0] = true
		}
	}
	if info.export {
		if reported[1] {
			rule.context.Report(rule.context.Range(node), diagnostics.X_0_export_is_duplicated, info.module)
		}
		if reported[0] {
			rule.context.Report(rule.context.Range(node), diagnostics.X_0_export_is_duplicated_as_import, info.module)
		}
	} else {
		if reported[0] {
			rule.context.Report(rule.context.Range(node), diagnostics.X_0_import_is_duplicated, info.module)
		}
		if reported[1] {
			rule.context.Report(rule.context.Range(node), diagnostics.X_0_import_is_duplicated_as_export, info.module)
		}
	}
}

type duplicateImportInfo struct {
	module   string
	kind     string
	export   bool
	typeOnly bool
}

func getDuplicateImportInfo(node *ast.Node) duplicateImportInfo {
	info := duplicateImportInfo{}
	var source *ast.Node
	if node.Kind == ast.KindImportDeclaration {
		declaration := node.AsImportDeclaration()
		source = declaration.ModuleSpecifier
		info.kind = "side"
		if clause := declaration.ImportClause; clause != nil {
			info.typeOnly = clause.IsTypeOnly()
			info.kind = "default"
			if bindings := clause.AsImportClause().NamedBindings; bindings != nil {
				if bindings.Kind == ast.KindNamespaceImport {
					info.kind = "namespace"
				} else if len(bindings.AsNamedImports().Elements.Nodes) > 0 {
					info.kind = "named"
				}
			}
		}
	} else if node.Kind == ast.KindExportDeclaration {
		declaration := node.AsExportDeclaration()
		source = declaration.ModuleSpecifier
		info.export, info.typeOnly = true, node.IsTypeOnly()
		info.kind = "all"
		if clause := declaration.ExportClause; clause != nil {
			if clause.Kind == ast.KindNamespaceExport {
				info.kind = "namespace"
			} else if len(clause.AsNamedExports().Elements.Nodes) > 0 {
				info.kind = "named"
			} else {
				info.kind = "side"
			}
		}
	}
	if source != nil && source.Kind == ast.KindStringLiteral {
		info.module = strings.TrimSpace(source.Text())
	}
	return info
}
