package rules

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/astnav"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type idDenylistRule struct {
	context Context
	model   *helpers.TsScopeModel
	globals map[string]string
}

func (rule *idDenylistRule) OnEnterNode(node *ast.Node) bool {
	rule.identifier(node)

	return true
}

func (rule *idDenylistRule) OnExitNode(node *ast.Node) {}

func (rule *idDenylistRule) Binding(node *ast.Node) *helpers.TsScopeBinding {
	model := rule.Bindings()
	if binding := model.Decls[node]; binding != nil {
		return binding
	}
	if frame := model.Nodes[node]; frame != nil {
		return frame.Find(node.Text())
	}
	return nil
}

func (rule *idDenylistRule) Bindings() *helpers.TsScopeModel {
	if rule.model == nil {
		rule.model = helpers.NewTScopeModel(rule.context)
	}
	return rule.model
}

func (rule *idDenylistRule) deniedIdentifier(node *ast.Node) bool {
	outer, parent := helpers.BindingParent(node)
	if parent == nil {
		return false
	}
	if parent.Kind == ast.KindPropertyAccessExpression && parent.Name() == outer {
		return helpers.BindingNamingTarget(parent)
	}
	if parent.Kind == ast.KindCallExpression || parent.Kind == ast.KindNewExpression {
		return false
	}
	if parent.Kind == ast.KindImportSpecifier && parent.AsImportSpecifier().PropertyName == outer {
		return false
	}
	if parent.Kind == ast.KindExportSpecifier && parent.AsExportSpecifier().PropertyName == outer && parent.Parent.Parent.AsExportDeclaration().ModuleSpecifier != nil {
		return false
	}
	if helpers.BindingPatternProperty(node) && parent.Kind == ast.KindBindingElement && parent.AsBindingElement().PropertyName == node {
		return false
	}
	if helpers.BindingPatternProperty(node) && parent.Kind == ast.KindPropertyAssignment && parent.Name() == node {
		return false
	}
	if parent.Kind == ast.KindShorthandPropertyAssignment && !ast.IsAssignmentTarget(parent.Parent) {
		return true
	}
	return !rule.externalGlobal(node)
}

func (rule *idDenylistRule) externalGlobal(node *ast.Node) bool {
	return helpers.BindingReference(node) && rule.Binding(node) == nil && rule.knownGlobal(node.Text())
}

func (rule *idDenylistRule) globalDirectives() map[string]string {
	if rule.globals != nil {
		return rule.globals
	}
	rule.globals = make(map[string]string)
	file := rule.context.File
	previousEnd := 0
	for token := astnav.GetTokenAtPosition(file, 0); token != nil; token = astnav.FindNextToken(token, file.AsNode(), file) {
		start := scanner.GetTokenPosOfNode(token, file, false)
		lexer := scanner.NewScanner()
		lexer.SetText(file.Text())
		lexer.SetSkipTrivia(false)
		lexer.ResetPos(previousEnd)
		for lexer.TokenEnd() < start {
			kind := lexer.Scan()
			if kind == ast.KindMultiLineCommentTrivia {
				text := strings.TrimSpace(file.Text()[lexer.TokenStart()+2 : lexer.TokenEnd()-2])
				fields := strings.Fields(text)
				if len(fields) > 0 && (fields[0] == "global" || fields[0] == "globals") {
					text = strings.TrimSpace(strings.TrimPrefix(text, fields[0]))
					if before, _, found := strings.Cut(text, "--"); found {
						text = before
					}
					text = strings.ReplaceAll(strings.ReplaceAll(text, ": ", ":"), " :", ":")
					for _, entry := range strings.FieldsFunc(text, func(character rune) bool {
						return character == ',' || character == ' ' || character == '\t' || character == '\r' || character == '\n'
					}) {
						name, mode, found := strings.Cut(entry, ":")
						if !found {
							mode = "readonly"
						}
						rule.globals[name] = mode
					}
				}
			}
			if kind == ast.KindEndOfFile {
				break
			}
		}
		if token.Kind == ast.KindEndOfFile {
			break
		}
		previousEnd = token.End()
	}
	return rule.globals
}

func (rule *idDenylistRule) identifier(node *ast.Node) {
	if node.Kind != ast.KindIdentifier && node.Kind != ast.KindPrivateIdentifier || node.Parent == nil || node.Parent.Kind == ast.KindMetaProperty || helpers.BindingAttribute(node) {
		return
	}
	name := strings.TrimPrefix(node.Text(), "#")
	private := node.Kind == ast.KindPrivateIdentifier

	if !slices.Contains(helpers.SharedRuleStrings(rule.context.Options), name) || !rule.deniedIdentifier(node) {
		return
	}
	message := diagnostics.Identifier_0_is_restricted
	if private {
		message = diagnostics.Identifier_0_is_restricted_24213
	}
	rule.context.Report(rule.context.Range(node), message, name)
}

func (rule *idDenylistRule) knownGlobal(name string) bool {
	if mode, found := rule.globalDirectives()[name]; found {
		return mode != "off"
	}
	return slices.Contains(helpers.BindingBuiltins, name)
}

func newIdDenylist(context Context) Rule { return &idDenylistRule{context: context} }
