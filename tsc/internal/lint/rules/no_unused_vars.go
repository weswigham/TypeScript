package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/astnav"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noUnusedVars struct{ helpers.UsageRuleContext }

func newNoUnusedVars(context Context) Rule {
	rule := &noUnusedVars{Context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *noUnusedVars) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindSourceFile {
		return false
	}
	rule.Model.Build(rule.Context)
	rule.unusedVariables()
	return false
}

func usageInitializer(node *ast.Node) *ast.Node {
	switch node.Kind {
	case ast.KindVariableDeclaration, ast.KindParameter, ast.KindBindingElement:
		return node.Initializer()
	}
	return nil
}

func usageContains(outer, inner *ast.Node) bool {
	for node := inner; node != nil; node = node.Parent {
		if node == outer {
			return true
		}
	}
	return false
}

func usageInLoop(node, owner *ast.Node) bool {
	for current := node.Parent; current != nil && current != owner; current = current.Parent {
		if ast.IsIterationStatement(current, false) {
			return true
		}
	}
	return false
}

func (rule *noUnusedVars) used(binding *helpers.UsageBinding) bool {
	function := binding.Root
	if function.Kind == ast.KindVariableDeclaration {
		function = function.Initializer()
	}
	for _, reference := range binding.References {
		if !reference.Read {
			continue
		}
		if function != nil && ast.IsFunctionLike(function) && usageContains(function, reference.Node) {
			continue
		}
		node := helpers.UsageUnwrap(reference.Node)
		parent := node.Parent
		if parent.Kind == ast.KindPrefixUnaryExpression || parent.Kind == ast.KindPostfixUnaryExpression {
			var operator ast.Kind
			if parent.Kind == ast.KindPrefixUnaryExpression {
				operator = parent.AsPrefixUnaryExpression().Operator
			} else {
				operator = parent.AsPostfixUnaryExpression().Operator
			}
			if (operator == ast.KindPlusPlusToken || operator == ast.KindMinusMinusToken) && helpers.UsageDiscarded(parent) {
				continue
			}
		}
		if parent.Kind == ast.KindBinaryExpression {
			binary := parent.AsBinaryExpression()
			if binary.Left == node && binary.OperatorToken.Kind >= ast.KindFirstAssignment && binary.OperatorToken.Kind <= ast.KindLastAssignment && !helpers.UsageLogical(binary.OperatorToken.Kind) && helpers.UsageDiscarded(parent) {
				continue
			}
		}
		selfRead := false
		for current := reference.Node; current.Parent != nil && current != binding.Owner; current = current.Parent {
			assignment := current.Parent
			if assignment.Kind == ast.KindBinaryExpression {
				binary := assignment.AsBinaryExpression()
				if binary.Right == current && binary.Left.Kind == ast.KindIdentifier && rule.Model.Binding(binary.Left) == binding && binary.OperatorToken.Kind >= ast.KindFirstAssignment && binary.OperatorToken.Kind <= ast.KindLastAssignment && helpers.UsageDiscarded(assignment) && helpers.UsageOwner(assignment.Parent) == binding.Owner && !usageInLoop(assignment, binding.Owner) && !usageStorableFunction(reference.Node, binary.Right) {
					selfRead = true
					break
				}
			}
		}
		if !selfRead {
			return true
		}
	}
	for _, reference := range binding.References {
		node := reference.Node
		for node.Parent != nil && node.Parent.Kind != ast.KindForInStatement && node.Parent.Kind != ast.KindForOfStatement && node.Parent != binding.Owner {
			node = node.Parent
		}
		if node.Parent == nil || node.Parent == binding.Owner {
			continue
		}
		var body *ast.Node
		if (node.Parent.Kind == ast.KindForInStatement || node.Parent.Kind == ast.KindForOfStatement) && node.Parent.AsForInOrOfStatement().Initializer == node {
			body = node.Parent.AsForInOrOfStatement().Statement
		}
		if body != nil && body.Kind == ast.KindBlock && len(body.AsBlock().Statements.Nodes) > 0 {
			body = body.AsBlock().Statements.Nodes[0]
		}
		if body != nil && body.Kind == ast.KindReturnStatement {
			return true
		}
	}
	return false
}

func usageStorableFunction(node, rhs *ast.Node) bool {
	function := helpers.UsageOwner(node.Parent)
	if function == nil || !ast.IsFunctionLike(function) || !usageContains(rhs, function) {
		return false
	}
	for node, parent := function, function.Parent; parent != nil && usageContains(rhs, parent); node, parent = parent, parent.Parent {
		switch parent.Kind {
		case ast.KindBinaryExpression:
			binary := parent.AsBinaryExpression()
			if binary.OperatorToken.Kind == ast.KindCommaToken && binary.Left == node {
				return false
			}
			if ast.IsAssignmentOperator(binary.OperatorToken.Kind) {
				return true
			}
		case ast.KindCallExpression, ast.KindNewExpression:
			return parent.Expression() != node
		case ast.KindTaggedTemplateExpression, ast.KindYieldExpression:
			return true
		default:
			if ast.IsStatement(parent) || ast.IsDeclaration(parent) {
				return true
			}
		}
	}
	return false
}

func (rule *noUnusedVars) patternOption(name, value string) bool {
	pattern := rule.Setting(name, "")
	if pattern == "" {
		return false
	}
	return helpers.MatchesRegularExpression(pattern, value)
}

func (rule *noUnusedVars) ignoreDescription(binding *helpers.UsageBinding) (string, string, bool) {
	array := binding.Array
	for _, reference := range binding.References {
		array = array || reference.Node.Parent.Kind == ast.KindArrayLiteralExpression && reference.Write
	}
	if array && rule.patternOption("destructuredArrayIgnorePattern", binding.Name) {
		return "elements of array destructuring", rule.Setting("destructuredArrayIgnorePattern", ""), true
	}
	key, description := "varsIgnorePattern", "vars"
	if binding.Caught {
		key, description = "caughtErrorsIgnorePattern", "caught errors"
	} else if binding.Parameter {
		key, description = "argsIgnorePattern", "args"
	}
	if rule.patternOption(key, binding.Name) {
		return description, rule.Setting(key, ""), true
	}
	if array && rule.Setting("destructuredArrayIgnorePattern", "") != "" {
		return "elements of array destructuring", rule.Setting("destructuredArrayIgnorePattern", ""), false
	}
	return description, rule.Setting(key, ""), false
}

func (rule *noUnusedVars) restSibling(binding *helpers.UsageBinding) bool {
	if !rule.Boolean("ignoreRestSiblings") {
		return false
	}
	nodes := []*ast.Node{binding.Identifier}
	for _, reference := range binding.References {
		if reference.Write {
			nodes = append(nodes, reference.Node)
		}
	}
	for _, node := range nodes {
		parent := node.Parent
		if parent.Kind == ast.KindBindingElement && parent.Parent.Kind == ast.KindObjectBindingPattern && parent.AsBindingElement().DotDotDotToken == nil {
			elements := parent.Parent.AsBindingPattern().Elements.Nodes
			if len(elements) > 0 && elements[len(elements)-1].AsBindingElement().DotDotDotToken != nil {
				return true
			}
		}
		if parent.Kind == ast.KindShorthandPropertyAssignment || parent.Kind == ast.KindPropertyAssignment {
			if parent.Parent.Kind == ast.KindObjectLiteralExpression {
				properties := parent.Parent.AsObjectLiteralExpression().Properties.Nodes
				if len(properties) > 0 && properties[len(properties)-1].Kind == ast.KindSpreadAssignment {
					return true
				}
			}
		}
	}
	return false
}

func (rule *noUnusedVars) varsSetting() string {
	if len(rule.Context.Options) > 0 {
		if value, ok := rule.Context.Options[0].(string); ok {
			return value
		}
	}
	return rule.Setting("vars", "all")
}

func (rule *noUnusedVars) skip(binding *helpers.UsageBinding) bool {
	if binding.Root.Kind == ast.KindFunctionExpression || binding.Root.Kind == ast.KindClassExpression {
		return true
	}
	if rule.varsSetting() == "local" && binding.Owner.Kind == ast.KindSourceFile && !ast.IsExternalModule(rule.Context.File) && !binding.Parameter && !binding.Caught {
		root := binding.Root
		if root.Kind != ast.KindVariableDeclaration || root.Parent.Flags&ast.NodeFlagsBlockScoped == 0 {
			return true
		}
	}
	if binding.Caught && rule.Setting("caughtErrors", "all") == "none" {
		return true
	}
	if binding.Parameter {
		if binding.Root.Parent.Kind == ast.KindSetAccessor || rule.Setting("args", "after-used") == "none" {
			return true
		}
		if rule.Setting("args", "after-used") == "after-used" && binding.Root.Name().Kind == ast.KindIdentifier && binding.Root.Initializer() == nil {
			for _, other := range rule.Model.Bindings {
				if other.Parameter && other.Owner == binding.Owner && other.Identifier.Pos() > binding.Identifier.Pos() && len(other.References) > 0 {
					return true
				}
			}
		}
	}
	if rule.Boolean("ignoreClassWithStaticInitBlock") && ast.IsClassLike(binding.Root) {
		for _, member := range binding.Root.Members() {
			if member.Kind == ast.KindClassStaticBlockDeclaration {
				return true
			}
		}
	}
	return false
}

func (rule *noUnusedVars) unusedVariables() {
	if rule.varsSetting() != "local" {
		for _, global := range rule.Model.Globals {
			if !global.Used && !global.Declared && !global.Disabled {
				rule.Context.Report(
					global.Location, diagnostics.X_0_is_1_but_never_used_2, global.Name, "defined", "")
			}
		}
	}
	for _, binding := range rule.Model.Bindings {
		if rule.skip(binding) {
			continue
		}
		used := rule.used(binding)
		description, pattern, ignored := rule.ignoreDescription(binding)
		if ignored {
			if used && rule.Boolean("reportUsedIgnorePattern") {
				rule.Context.Report(rule.Context.Range(binding.Identifier), diagnostics.X_0_is_marked_as_ignored_but_is_used_1, binding.Name, ". Used "+description+" must not match /"+strings.ReplaceAll(pattern, "/", `\/`)+"/u")
			}
			continue
		}
		if used || binding.Exported || rule.restSibling(binding) {
			continue
		}
		if rule.Boolean("ignoreUsingDeclarations") && binding.Root.Kind == ast.KindVariableDeclaration && binding.Root.Parent.Flags&ast.NodeFlagsUsing != 0 {
			continue
		}
		location, action := binding.Identifier, "defined"
		if usageInitializer(binding.Root) != nil && !binding.Caught || usageInitializer(binding.Declaration) != nil {
			action = "assigned a value"
		}
		for _, reference := range binding.References {
			if reference.Write {
				action = "assigned a value"
				if reference.Owner == binding.Owner && reference.Node.Pos() > location.Pos() {
					location = reference.Node
				}
			}
		}
		additional := ""
		if pattern != "" {
			additional = ". Allowed unused " + description + " must match /" + strings.ReplaceAll(pattern, "/", `\/`) + "/u"
		}
		diagnostic := rule.Context.Report(rule.Context.Range(location), diagnostics.X_0_is_1_but_never_used_2, binding.Name, action, additional)
		rule.removeVariable(diagnostic, binding)
	}
}

func (rule *noUnusedVars) removeVariable(diagnostic *ast.Diagnostic, binding *helpers.UsageBinding) {
	if rule.Context.NewTracker == nil {
		return
	}
	for _, reference := range binding.References {
		if reference.Write || !usageContains(binding.Root, reference.Node) {
			return
		}
	}
	tracker := rule.Context.NewTracker()
	declaration := binding.Declaration
	if binding.Caught && declaration.Name().Kind == ast.KindIdentifier {
		return
	}
	if binding.Root.Kind == ast.KindVariableDeclaration {
		parent := binding.Root.Parent.Parent
		if ast.IsIterationStatement(parent, false) {
			return
		}
	}
	for declaration.Kind == ast.KindBindingElement {
		pattern := declaration.Parent
		count := 0
		for _, element := range pattern.AsBindingPattern().Elements.Nodes {
			if element.Kind != ast.KindOmittedExpression {
				count++
			}
		}
		if count != 1 {
			break
		}
		declaration = pattern.Parent
	}
	if declaration.Kind == ast.KindImportClause && declaration.AsImportClause().NamedBindings == nil || declaration.Kind == ast.KindNamespaceImport && declaration.Parent.AsImportClause().Name() == nil {
		importDeclaration := declaration.Parent
		if declaration.Kind == ast.KindNamespaceImport {
			importDeclaration = importDeclaration.Parent
		}
		tracker.DeleteRange(rule.Context.File, core.NewTextRange(scanner.GetTokenPosOfNode(declaration, rule.Context.File, false), scanner.GetTokenPosOfNode(importDeclaration.AsImportDeclaration().ModuleSpecifier, rule.Context.File, false)))
	} else if declaration.Kind == ast.KindParameter && declaration.Parent.Kind == ast.KindArrowFunction && astnav.FindChildOfKind(declaration.Parent, ast.KindOpenParenToken, rule.Context.File) == nil {
		tracker.ReplaceNode(rule.Context.File, declaration, tracker.NewParenthesizedExpression(tracker.NewOmittedExpression()), &change.NodeOptions{LeadingTriviaOption: change.LeadingTriviaOptionExclude, TrailingTriviaOption: change.TrailingTriviaOptionExclude})
	} else {
		whole := declaration
		if declaration.Kind == ast.KindVariableDeclaration && declaration.Parent.Kind == ast.KindVariableDeclarationList && len(declaration.Parent.AsVariableDeclarationList().Declarations.Nodes) == 1 {
			whole = declaration.Parent.Parent
		}
		if whole.Kind == ast.KindVariableStatement || whole.Kind == ast.KindFunctionDeclaration || whole.Kind == ast.KindClassDeclaration {
			if rule.unsafeRemoval(whole) {
				return
			}
			if whole.Parent.Kind != ast.KindSourceFile && whole.Parent.Kind != ast.KindBlock && whole.Parent.Kind != ast.KindCaseClause && whole.Parent.Kind != ast.KindDefaultClause {
				tracker.ReplaceNode(rule.Context.File, whole, tracker.NewEmptyStatement(), &change.NodeOptions{LeadingTriviaOption: change.LeadingTriviaOptionExclude, TrailingTriviaOption: change.TrailingTriviaOptionExclude})
			} else {
				tracker.DeleteRange(rule.Context.File, core.NewTextRange(scanner.GetTokenPosOfNode(whole, rule.Context.File, false), whole.End()))
			}
		} else {
			if declaration.Kind == ast.KindImportClause {
				declaration = declaration.Name()
			}
			tracker.Delete(rule.Context.File, declaration)
		}
	}
	changes := tracker.GetTextChanges()
	if len(changes) == 0 {
		return
	}
	rule.AddSuggestion(diagnostic, []*codefix.CodeFixAction{codefix.CreateCodeFixAction("no-unused-vars", changes, ast.NewCompilerDiagnostic(diagnostics.Remove_unused_variable_0, binding.Name), "", nil)})
}

func (rule *noUnusedVars) unsafeRemoval(node *ast.Node) bool {
	file := rule.Context.File
	last := astnav.FindPrecedingToken(file, node.End())
	if last == nil {
		return false
	}
	next := astnav.FindNextToken(last, file.AsNode(), file)
	if next == nil || next.Kind == ast.KindEndOfFile {
		return false
	}
	if next.Kind == ast.KindStringLiteral {
		return true
	}
	previous := astnav.FindPrecedingToken(file, scanner.GetTokenPosOfNode(node, file, false))
	if previous == nil || previous.Kind == ast.KindSemicolonToken || previous.Kind == ast.KindOpenBraceToken {
		return false
	}
	if previous.Kind == ast.KindCloseBraceToken {
		for parent := previous.Parent; parent != nil; parent = parent.Parent {
			if parent.Kind == ast.KindBlock {
				return parent.Parent.Kind == ast.KindFunctionExpression || parent.Parent.Kind == ast.KindArrowFunction
			}
			if ast.IsClassLike(parent) {
				return parent.Kind != ast.KindClassDeclaration
			}
			if parent.Kind == ast.KindObjectLiteralExpression {
				return true
			}
			if parent.Kind == ast.KindSwitchStatement {
				return false
			}
		}
	}
	return true
}
