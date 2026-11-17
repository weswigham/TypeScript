package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptConsistentIndexedObjectStyleRule struct {
	helpers.TypescriptScopeRuleContext
}

func (rule *typescriptConsistentIndexedObjectStyleRule) OnEnterNode(node *ast.Node) bool {
	rule.indexedObject(node)
	return true
}

func (rule *typescriptConsistentIndexedObjectStyleRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptConsistentIndexedObjectStyleRule) deeplyReferences(node *ast.Node, binding *helpers.TsScopeBinding, seen map[*ast.Node]bool) bool {
	if node == nil || seen[node] {
		return false
	}
	seen[node] = true
	switch node.Kind {
	case ast.KindTypeLiteral, ast.KindInterfaceDeclaration:
		for _, member := range node.Members() {
			if rule.deeplyReferences(member, binding, seen) {
				return true
			}
		}
		return false
	case ast.KindTypeAliasDeclaration, ast.KindIndexSignature, ast.KindMappedType, ast.KindParenthesizedType:
		return rule.deeplyReferences(node.Type(), binding, seen)
	case ast.KindIndexedAccessType, ast.KindConditionalType, ast.KindUnionType, ast.KindIntersectionType, ast.KindTypeReference:
		return node.ForEachChild(func(child *ast.Node) bool { return rule.deeplyReferences(child, binding, seen) })
	case ast.KindIdentifier:
		if !helpers.TsScopeReferenceNode(node) {
			return false
		}
	default:
		return false
	}
	resolved := rule.Bindings().Nodes[node].Find(node.Text())
	if resolved == binding {
		return true
	}
	if resolved != nil {
		for _, declaration := range resolved.Declarations {
			if declaration.Kind == ast.KindTypeAliasDeclaration || declaration.Kind == ast.KindInterfaceDeclaration {
				if rule.deeplyReferences(declaration, binding, seen) {
					return true
				}
			}
		}
	}
	return false
}

func (rule *typescriptConsistentIndexedObjectStyleRule) indexedObject(node *ast.Node) {
	if rule.Mode("record") == "index-signature" {
		if node.Kind != ast.KindTypeReference || !helpers.TsScopeIdentifier(node.AsTypeReferenceNode().TypeName, "Record") || len(node.TypeArguments()) != 2 {
			return
		}
		key, value := node.TypeArguments()[0], node.TypeArguments()[1]
		diagnostic := rule.Context.Report(rule.Context.Range(node), diagnostics.An_index_signature_is_preferred_over_a_record)
		var suggestion *ast.Diagnostic
		if key.Kind != ast.KindStringKeyword && key.Kind != ast.KindNumberKeyword && key.Kind != ast.KindSymbolKeyword || rule.UnpreservedComments(node, key, value) {
			suggestion = ast.NewCompilerDiagnostic(diagnostics.Change_into_an_index_signature_instead_of_a_record)
		}
		rule.Replace(diagnostic, node, "{ [key: "+rule.Text(key)+"]: "+rule.Text(value)+" }", suggestion)
		return
	}
	var key, value *ast.Node
	readonly, optional, required, unsafe := false, false, false, false
	prefix, suffix := "", ""
	if node.Kind == ast.KindMappedType {
		mapped := node.AsMappedTypeNode()
		if mapped.NameType != nil {
			return
		}
		parameter := mapped.TypeParameter.AsTypeParameterDeclaration()
		key, value = parameter.Constraint, mapped.Type
		binding := rule.Bindings().Decls[parameter.Name()]
		if binding != nil && len(binding.References) > 0 {
			return
		}
		if key == nil || key.Kind == ast.KindTypeOperator && key.AsTypeOperatorNode().Operator == ast.KindKeyOfKeyword {
			return
		}
		unsafe = mapped.ReadonlyToken != nil && mapped.ReadonlyToken.Kind == ast.KindMinusToken
		readonly = mapped.ReadonlyToken != nil && !unsafe
		optional = mapped.QuestionToken != nil && mapped.QuestionToken.Kind != ast.KindMinusToken
		required = mapped.QuestionToken != nil && mapped.QuestionToken.Kind == ast.KindMinusToken
	} else if node.Kind == ast.KindTypeLiteral || node.Kind == ast.KindInterfaceDeclaration {
		members := node.Members()
		if len(members) != 1 || members[0].Kind != ast.KindIndexSignature || len(members[0].Parameters()) != 1 {
			return
		}
		member := members[0]
		parameter := member.Parameters()[0]
		if parameter.Name().Kind != ast.KindIdentifier || parameter.Type() == nil || member.Type() == nil {
			return
		}
		key, value = parameter.Type(), member.Type()
		readonly = ast.HasSyntacticModifier(member, ast.ModifierFlagsReadonly)
		if node.Kind == ast.KindInterfaceDeclaration {
			unsafe = node.AsInterfaceDeclaration().HeritageClauses != nil || ast.HasSyntacticModifier(node, ast.ModifierFlagsDefault)
			parameters := ""
			if node.TypeParameterList() != nil {
				var names []string
				for _, parameter := range node.TypeParameterList().Nodes {
					names = append(names, rule.Text(parameter))
				}
				parameters = "<" + strings.Join(names, ", ") + ">"
			}
			modifiers := ""
			if ast.HasSyntacticModifier(node, ast.ModifierFlagsExport) {
				modifiers += "export "
			}
			if ast.HasSyntacticModifier(node, ast.ModifierFlagsAmbient) {
				modifiers += "declare "
			}
			prefix, suffix = modifiers+"type "+rule.Text(node.Name())+parameters+" = ", ";"
		}
	} else {
		return
	}
	for parent := node; parent != nil; parent = parent.Parent {
		if parent.Kind == ast.KindTypeAliasDeclaration || parent.Kind == ast.KindInterfaceDeclaration {
			if binding := rule.Bindings().Decls[parent.Name()]; binding != nil && rule.deeplyReferences(node, binding, make(map[*ast.Node]bool)) {
				return
			}
			break
		}
		if parent != node && (ast.IsStatement(parent) || ast.IsFunctionLike(parent)) {
			break
		}
	}
	diagnostic := rule.Context.Report(rule.Context.Range(node), diagnostics.A_record_is_preferred_over_an_index_signature)
	if unsafe {
		return
	}
	valueText := "any"
	if value != nil {
		valueText = rule.Text(value)
	}
	replacement := "Record<" + rule.Text(key) + ", " + valueText + ">"
	if optional {
		replacement = "Partial<" + replacement + ">"
	} else if required {
		replacement = "Required<" + replacement + ">"
	}
	if readonly {
		replacement = "Readonly<" + replacement + ">"
	}
	var suggestion *ast.Diagnostic
	if rule.UnpreservedComments(node, key, value) {
		suggestion = ast.NewCompilerDiagnostic(diagnostics.Change_into_a_record_instead_of_an_index_signature)
	}
	rule.Replace(diagnostic, node, prefix+replacement+suffix, suggestion)
}

func newTypeScriptConsistentIndexedObjectStyle(context Context) Rule {
	return &typescriptConsistentIndexedObjectStyleRule{Context: context, Name: "consistent-indexed-object-style"}
}
