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

type noGlobalAssignRule struct {
	context Context
	model   *helpers.TsScopeModel
	globals map[string]string
}

func (rule *noGlobalAssignRule) OnEnterNode(node *ast.Node) bool {
	rule.globalWrite(node)

	return true
}

func (rule *noGlobalAssignRule) OnExitNode(node *ast.Node) {}

func (rule *noGlobalAssignRule) Binding(node *ast.Node) *helpers.TsScopeBinding {
	model := rule.Bindings()
	if binding := model.Decls[node]; binding != nil {
		return binding
	}
	if frame := model.Nodes[node]; frame != nil {
		return frame.Find(node.Text())
	}
	return nil
}

func (rule *noGlobalAssignRule) Bindings() *helpers.TsScopeModel {
	if rule.model == nil {
		rule.model = helpers.NewTScopeModel(rule.context)
	}
	return rule.model
}

func (rule *noGlobalAssignRule) globalDirectives() map[string]string {
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

func (rule *noGlobalAssignRule) globalWrite(node *ast.Node) {
	if !helpers.BindingReference(node) || !ast.IsAssignmentTarget(node) || !rule.knownGlobal(node.Text()) || slices.Contains(helpers.SharedRuleStrings(rule.options(0)["exceptions"]), node.Text()) {
		return
	}
	mode := rule.globalDirectives()[node.Text()]
	if mode == "true" || mode == "writable" || mode == "writeable" {
		return
	}
	if binding := rule.Binding(node); binding != nil {
		if binding.Frame.Parent != nil || ast.IsExternalModule(rule.context.File) {
			return
		}
		for _, declaration := range binding.Declarations {
			if declaration.Kind != ast.KindVariableDeclaration || declaration.Parent.Flags&ast.NodeFlagsBlockScoped != 0 {
				return
			}
		}
	}
	rule.context.Report(rule.context.Range(node), diagnostics.Read_only_global_0_should_not_be_modified, node.Text())
}

func (rule *noGlobalAssignRule) knownGlobal(name string) bool {
	if mode, found := rule.globalDirectives()[name]; found {
		return mode != "off"
	}
	return slices.Contains(helpers.BindingBuiltins, name)
}

func (rule *noGlobalAssignRule) options(index int) map[string]any {
	if index < len(rule.context.Options) {
		options, _ := rule.context.Options[index].(map[string]any)
		return options
	}
	return nil
}

func newNoGlobalAssign(context Context) Rule { return &noGlobalAssignRule{context: context} }
