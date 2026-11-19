package rules

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
)

type noUnusedPrivateClassMembers struct{ helpers.UsageRuleContext }

func newNoUnusedPrivateClassMembers(context Context) Rule {
	rule := &noUnusedPrivateClassMembers{Context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *noUnusedPrivateClassMembers) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindSourceFile {
		return false
	}
	rule.privateMembers(node)
	return false
}

type usagePrivate struct {
	member   *ast.Node
	used     bool
	referred bool
	accessor bool
}

func (rule *noUnusedPrivateClassMembers) privateMembers(root *ast.Node) {
	classes := make(map[*ast.Node]map[string]*usagePrivate)
	var ordered []*usagePrivate
	helpers.UsageVisit(root, func(node *ast.Node) {
		if !ast.IsClassLike(node) {
			return
		}
		members := make(map[string]*usagePrivate)
		for _, member := range node.Members() {
			name := member.Name()
			if name != nil && name.Kind == ast.KindPrivateIdentifier {
				private := members[name.Text()]
				if private == nil {
					private = &usagePrivate{}
					members[name.Text()] = private
					ordered = append(ordered, private)
				}
				private.member = member
				private.accessor = member.Kind == ast.KindGetAccessor || member.Kind == ast.KindSetAccessor
			}
		}
		classes[node] = members
	})
	helpers.UsageVisit(root, func(node *ast.Node) {
		if node.Kind != ast.KindPrivateIdentifier || ast.IsDeclarationName(node) || helpers.UsageTypeOnly(node) {
			return
		}
		var private *usagePrivate
		for current := node.Parent; current != nil; current = current.Parent {
			if members := classes[current]; members != nil {
				if private = members[node.Text()]; private != nil {
					break
				}
			}
		}
		if private == nil {
			return
		}
		private.referred = true
		if private.accessor {
			private.used = true
			return
		}
		access := node.Parent
		if access.Kind != ast.KindPropertyAccessExpression {
			private.used = true
			return
		}
		read, write := helpers.UsageAccess(access)
		if !read && write {
			return
		}
		parent := helpers.UsageUnwrap(access).Parent
		if parent.Kind == ast.KindBinaryExpression || parent.Kind == ast.KindPrefixUnaryExpression || parent.Kind == ast.KindPostfixUnaryExpression {
			if write && helpers.UsageUnwrap(parent).Parent.Kind == ast.KindExpressionStatement {
				return
			}
		}
		private.used = true
	})
	for _, private := range ordered {
		if private.used {
			continue
		}
		name := private.member.Name()
		diagnostic := rule.Context.Report(rule.Context.Range(name), diagnostics.X_0_is_defined_but_never_used, name.Text())
		if !private.referred && rule.Context.NewTracker != nil {
			tracker := rule.Context.NewTracker()
			members := private.member.Parent.Members()
			index := slices.Index(members, private.member)
			if index > 0 && index+1 < len(members) {
				previous, next := members[index-1], members[index+1]
				nextName := next.Name()
				continues := nextName != nil && (nextName.Kind == ast.KindComputedPropertyName || nextName.Kind == ast.KindIdentifier && (nextName.Text() == "in" || nextName.Text() == "instanceof")) || next.Kind == ast.KindMethodDeclaration && next.AsMethodDeclaration().AsteriskToken != nil
				if previous.Kind == ast.KindPropertyDeclaration && previous.Initializer() != nil && !strings.HasSuffix(rule.Text(previous), ";") && !strings.HasSuffix(rule.Text(previous), "}") && continues {
					tracker.InsertNodeAt(rule.Context.File, core.TextPos(previous.End()), tracker.NewSemicolonClassElement(), change.NodeOptions{})
				}
			}
			tracker.DeleteNode(rule.Context.File, private.member, change.LeadingTriviaOptionIncludeAll, change.TrailingTriviaOptionInclude)
			rule.AddSuggestion(diagnostic, []*codefix.CodeFixAction{codefix.CreateCodeFixAction("no-unused-private-class-members", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Remove_unused_private_class_member_0, name.Text()), "", nil)})
		}
	}
}
