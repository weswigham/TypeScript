package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/nodebuilder"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typeScriptPreferReadonly struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptPreferReadonly(context Context) Rule {
	return &typeScriptPreferReadonly{context: context}
}

func (rule *typeScriptPreferReadonly) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typeScriptPreferReadonly) OnEnterNode(node *ast.Node) bool { return true }

func (rule *typeScriptPreferReadonly) OnExitNode(node *ast.Node) {
	if ast.IsClassLike(node) {
		rule.readonlyMembers(node)
	}
}

func (rule *typeScriptPreferReadonly) Text(node *ast.Node) string {
	return rule.context.File.Text()[scanner.GetTokenPosOfNode(node, rule.context.File, false):node.End()]
}

func (rule *typeScriptPreferReadonly) fix(diagnostic *ast.Diagnostic, tracker *change.Tracker, description *ast.Diagnostic) {
	name := "@typescript-eslint/" + "prefer-readonly"
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), description, name, description))
}

func typeScriptPreferReadonlyWalk(node *ast.Node, visit func(*ast.Node) bool) {
	if node != nil && visit(node) {
		node.ForEachChild(func(child *ast.Node) bool { typeScriptPreferReadonlyWalk(child, visit); return false })
	}
}

type typeScriptPreferReadonlyMember struct {
	declaration               *ast.Node
	written, constructorWrite bool
}

func (rule *typeScriptPreferReadonly) readonlyMembers(class *ast.Node) {
	c := rule.context.GetChecker()
	members := make(map[*ast.Symbol]*typeScriptPreferReadonlyMember)
	var ordered []*typeScriptPreferReadonlyMember
	add := func(declaration *ast.Node) {
		name := declaration.Name()
		flags := ast.GetCombinedModifierFlags(declaration)
		if name == nil || flags&(ast.ModifierFlagsReadonly|ast.ModifierFlagsAccessor) != 0 || flags&ast.ModifierFlagsPrivate == 0 && name.Kind != ast.KindPrivateIdentifier {
			return
		}
		if name.Kind == ast.KindComputedPropertyName && name.Expression().Kind == ast.KindStringLiteral {
			return
		}
		if helpers.SemanticMemberBoolean(rule.context, "onlyInlineLambdas", false) && declaration.Initializer() != nil && declaration.Initializer().Kind != ast.KindArrowFunction {
			return
		}
		symbol := c.GetSymbolAtLocation(name)
		if symbol == nil {
			symbol = declaration.Symbol()
		}
		if symbol == nil {
			return
		}
		member := &typeScriptPreferReadonlyMember{declaration: declaration}
		members[symbol] = member
		ordered = append(ordered, member)
	}
	for _, member := range class.Members() {
		if member.Kind == ast.KindPropertyDeclaration {
			add(member)
		}
		if member.Kind == ast.KindConstructor {
			for _, parameter := range member.Parameters() {
				if ast.GetCombinedModifierFlags(parameter)&ast.ModifierFlagsPrivate != 0 {
					add(parameter)
				}
			}
		}
	}
	typeScriptPreferReadonlyWalk(class, func(node *ast.Node) bool {
		if node != class && ast.IsClassLike(node) {
			return false
		}
		if !ast.IsAccessExpression(node) || !ast.IsWriteAccess(node) && (node.Parent == nil || node.Parent.Kind != ast.KindDeleteExpression) {
			return true
		}
		var symbol *ast.Symbol
		if node.Kind == ast.KindPropertyAccessExpression {
			symbol = c.GetSymbolAtLocation(node.Name())
		} else {
			symbol = c.GetSymbolAtLocation(node.AsElementAccessExpression().ArgumentExpression)
		}
		member := members[symbol]
		if member == nil && symbol != nil {
			for _, declaration := range symbol.Declarations() {
				for _, candidate := range ordered {
					if candidate.declaration == declaration {
						member = candidate
						break
					}
				}
			}
		}
		if member == nil {
			return true
		}
		directConstructor := false
		for parent := node.Parent; parent != nil && parent != class; parent = parent.Parent {
			if ast.IsFunctionLike(parent) {
				directConstructor = parent.Kind == ast.KindConstructor && parent.Parent == class
				break
			}
		}
		if directConstructor && ast.GetCombinedModifierFlags(member.declaration)&ast.ModifierFlagsStatic == 0 {
			member.constructorWrite = true
		} else {
			member.written = true
		}
		return true
	})
	for _, member := range ordered {
		if member.written {
			continue
		}
		declaration := member.declaration
		name := declaration.Name()
		reportName := name
		if name.Kind == ast.KindComputedPropertyName {
			reportName = name.Expression()
		}

		end := name.End()
		diagnostic := rule.context.Report(

			core.NewTextRange(scanner.GetTokenPosOfNode(declaration, rule.context.File, false), end), diagnostics.Member_0_is_never_reassigned_mark_it_as_readonly, rule.Text(reportName))

		if rule.context.NewTracker == nil {
			continue
		}
		tracker := rule.context.NewTracker()
		tracker.InsertModifierBefore(rule.context.File, ast.KindReadonlyKeyword, name)
		if declaration.Kind == ast.KindPropertyDeclaration && declaration.Type() == nil && declaration.Initializer() != nil && name.Kind == ast.KindIdentifier && member.constructorWrite {
			value := c.GetTypeAtLocation(declaration)
			initial := c.GetTypeAtLocation(declaration.Initializer())
			if value != initial && initial.Flags()&checker.TypeFlagsLiteral != 0 {
				annotation := c.TypeToTypeNode(value, declaration, nodebuilder.FlagsNone, nil)
				if annotation != nil {
					tracker.TryInsertTypeAnnotation(rule.context.File, declaration, annotation)
				}
			}
		}
		rule.fix(diagnostic, tracker, ast.NewCompilerDiagnostic(diagnostics.Member_0_is_never_reassigned_mark_it_as_readonly, rule.Text(reportName)))
	}
}
