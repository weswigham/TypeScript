package rules

import (
	"cmp"
	"slices"
	"strings"

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

type typeScriptSwitchExhaustivenessCheck struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptSwitchExhaustivenessCheck(context Context) Rule {
	return &typeScriptSwitchExhaustivenessCheck{context: context}
}

func (rule *typeScriptSwitchExhaustivenessCheck) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typeScriptSwitchExhaustivenessCheck) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindSwitchStatement {
		rule.switchStatement(node)
	}
	return true
}

func (rule *typeScriptSwitchExhaustivenessCheck) OnExitNode(node *ast.Node) {}

func (rule *typeScriptSwitchExhaustivenessCheck) suggest(diagnostic *ast.Diagnostic, tracker *change.Tracker, message *diagnostics.Message) {
	if rule.suggestions == nil {
		rule.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
	}
	rule.suggestions[diagnostic] = append(rule.suggestions[diagnostic], codefix.CreateCodeFixAction("@typescript-eslint/"+"switch-exhaustiveness-check", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(message), "", nil))
}

func typeScriptSwitchExhaustivenessCheckLiteral(value *checker.Type) bool {
	return value.Flags()&(checker.TypeFlagsLiteral|checker.TypeFlagsUndefined|checker.TypeFlagsNull|checker.TypeFlagsUniqueESSymbol) != 0
}

func (rule *typeScriptSwitchExhaustivenessCheck) switchStatement(node *ast.Node) {
	c := rule.context.GetChecker()
	statement := node.AsSwitchStatement()
	clauses := statement.CaseBlock.AsCaseBlock().Clauses.Nodes
	value := helpers.SemanticMemberConstrained(c, c.GetTypeAtLocation(statement.Expression))
	caseTypes := make(map[*checker.Type]bool)
	undefined := false
	var defaultClause *ast.Node
	for _, clause := range clauses {
		if clause.Kind == ast.KindDefaultClause {
			defaultClause = clause
			continue
		}
		caseType := helpers.SemanticMemberConstrained(c, c.GetTypeAtLocation(clause.Expression()))
		caseTypes[caseType] = true
		undefined = undefined || caseType.Flags()&checker.TypeFlagsUndefined != 0
	}
	commentStart, commentEnd := rule.defaultComment(statement.CaseBlock, clauses)
	hasDefault := defaultClause != nil || commentStart >= 0
	containsNonLiteral := false
	var missing []*checker.Type
	for _, union := range helpers.SemanticMemberParts(value) {
		partLiteral := false
		for _, part := range helpers.SemanticMemberIntersection(union) {
			if !typeScriptSwitchExhaustivenessCheckLiteral(part) {
				continue
			}
			partLiteral = true
			if caseTypes[part] || undefined && part.Flags()&checker.TypeFlagsUndefined != 0 {
				continue
			}
			missing = append(missing, part)
		}
		containsNonLiteral = containsNonLiteral || !partLiteral
	}
	format := func(value *checker.Type) string {
		return c.TypeToStringEx(value, nil, checker.TypeFormatFlagsAllowUniqueESSymbolType|checker.TypeFormatFlagsUseAliasDefinedOutsideCurrentScope|checker.TypeFormatFlagsUseFullyQualifiedType, nil)
	}
	slices.SortStableFunc(missing, func(left, right *checker.Type) int {
		leftName, rightName := format(left), format(right)
		if order := cmp.Compare(strings.ToLower(leftName), strings.ToLower(rightName)); order != 0 {
			return order
		}
		return cmp.Compare(leftName, rightName)
	})
	if len(missing) > 0 && !(hasDefault && helpers.SemanticMemberBoolean(rule.context, "considerDefaultExhaustiveForUnions", false)) {
		names := make([]string, len(missing))
		for index, part := range missing {
			names[index] = format(part)
		}
		diagnostic := rule.context.Report(rule.context.Range(statement.Expression), diagnostics.Switch_is_not_exhaustive_Cases_not_matched_Colon_0, strings.Join(names, " | "))
		rule.missingCases(diagnostic, statement.CaseBlock, missing, defaultClause, commentStart)
	}
	if !helpers.SemanticMemberBoolean(rule.context, "allowDefaultCaseForExhaustiveSwitch", true) && len(missing) == 0 && hasDefault && !containsNonLiteral {
		location := defaultClause
		if location == nil {
			location = statement.CaseBlock
		}
		diagnosticLocation := rule.context.Range(location)
		if defaultClause == nil {
			diagnosticLocation = core.NewTextRange(commentStart, commentEnd)
		}
		rule.context.Report(diagnosticLocation, diagnostics.The_switch_statement_is_exhaustive_so_the_default_case_is_unnecessary)

	}
	if helpers.SemanticMemberBoolean(rule.context, "requireDefaultForNonUnion", false) && containsNonLiteral && !hasDefault {
		diagnostic := rule.context.Report(rule.context.Range(statement.Expression), diagnostics.Switch_is_not_exhaustive_Cases_not_matched_Colon_0, "default")
		rule.missingCases(diagnostic, statement.CaseBlock, []*checker.Type{nil}, nil, -1)
	}
}

func (rule *typeScriptSwitchExhaustivenessCheck) defaultComment(block *ast.Node, clauses []*ast.Node) (int, int) {
	if len(clauses) == 0 {
		return -1, -1
	}
	start := clauses[len(clauses)-1].End()
	lexer := scanner.NewScanner()
	lexer.SetText(rule.context.File.Text()[start : block.End()-1])
	lexer.SetSkipTrivia(false)
	text, pos, end := "", -1, -1
	for kind := lexer.Scan(); kind != ast.KindEndOfFile; kind = lexer.Scan() {
		if kind == ast.KindSingleLineCommentTrivia || kind == ast.KindMultiLineCommentTrivia {
			pos, end = start+lexer.TokenStart(), start+lexer.TokenEnd()
			text = rule.context.File.Text()[pos+2 : end]
			if kind == ast.KindMultiLineCommentTrivia {
				text = strings.TrimSuffix(text, "*/")
			}
			text = strings.TrimSpace(text)
		}
	}
	pattern, configured := helpers.SemanticMemberOptions(rule.context)["defaultCaseCommentPattern"].(string)
	if !configured && strings.EqualFold(text, "no default") || configured && helpers.MatchesRegularExpression(pattern, text) {
		return pos, end
	}
	return -1, -1
}

func (rule *typeScriptSwitchExhaustivenessCheck) missingCases(diagnostic *ast.Diagnostic, block *ast.Node, missing []*checker.Type, defaultClause *ast.Node, commentStart int) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	c := rule.context.GetChecker()
	var added []*ast.Node
	for _, value := range missing {
		kind, text := ast.KindDefaultClause, "default case"
		var expression *ast.Node
		if value != nil {
			kind = ast.KindCaseClause
			expression = rule.caseExpression(tracker, value, block)
			if expression == nil {
				return
			}
			text = "Not implemented yet: " + c.TypeToString(value) + " case"
		}
		body := tracker.NewBlock(tracker.NewNodeList([]*ast.Node{tracker.NewThrowStatement(tracker.NewNewExpression(tracker.NewIdentifier("Error"), nil, tracker.NewNodeList([]*ast.Node{tracker.NewStringLiteral(text, ast.TokenFlagsSingleQuote)})))}), false)
		added = append(added, tracker.NewCaseOrDefaultClause(kind, expression, tracker.NewNodeList([]*ast.Node{body})))
	}
	clauses := block.AsCaseBlock().Clauses.Nodes
	if defaultClause != nil {
		tracker.InsertNodesAt(rule.context.File, core.TextPos(scanner.GetTokenPosOfNode(defaultClause, rule.context.File, false)), added, change.NodeOptions{Suffix: "\n"})
	} else if commentStart >= 0 {
		tracker.InsertNodesAt(rule.context.File, core.TextPos(commentStart), added, change.NodeOptions{Suffix: "\n"})
	} else if len(clauses) > 0 {
		tracker.InsertNodesAt(rule.context.File, core.TextPos(clauses[len(clauses)-1].End()), added, change.NodeOptions{Prefix: "\n", Suffix: "\n"})
	} else {
		tracker.ReplaceNodePreservingComments(rule.context.File, block, tracker.NewCaseBlock(tracker.NewNodeList(added)))
	}
	rule.suggest(diagnostic, tracker, diagnostics.Add_branches_for_missing_cases)
}

func (rule *typeScriptSwitchExhaustivenessCheck) caseExpression(tracker *change.Tracker, value *checker.Type, location *ast.Node) *ast.Node {
	c := rule.context.GetChecker()
	if value.Flags()&checker.TypeFlagsUniqueESSymbol != 0 && value.Symbol() != nil {
		return tracker.NewIdentifier(value.Symbol().Name())
	}
	if value.Flags()&checker.TypeFlagsUndefined != 0 {
		return tracker.NewIdentifier("undefined")
	}
	if value.Flags()&checker.TypeFlagsNull != 0 {
		return tracker.NewToken(ast.KindNullKeyword)
	}
	typeNode := c.TypeToTypeNode(value, location, nodebuilder.FlagsNone, nil)
	if typeNode == nil {
		return nil
	}
	if typeNode.Kind == ast.KindLiteralType {
		return typeNode.AsLiteralTypeNode().Literal
	}
	if typeNode.Kind == ast.KindTypeReference {
		return typeScriptSwitchExhaustivenessCheckEntityExpression(tracker, typeNode.AsTypeReferenceNode().TypeName)
	}
	if value.Symbol() != nil && value.Symbol().Flags()&ast.SymbolFlagsEnumMember != 0 {
		declaration := value.Symbol().ValueDeclaration()
		if declaration != nil {
			object := tracker.NewIdentifier(declaration.Parent.Name().Text())
			name := declaration.Name()
			if scanner.IsIdentifierText(name.Text(), rule.context.File.LanguageVariant) {
				return tracker.NewPropertyAccessExpression(object, nil, tracker.NewIdentifier(name.Text()), ast.NodeFlagsNone)
			}
			return tracker.NewElementAccessExpression(object, nil, tracker.NewStringLiteral(name.Text(), ast.TokenFlagsSingleQuote), ast.NodeFlagsNone)
		}
	}
	return nil
}

func typeScriptSwitchExhaustivenessCheckEntityExpression(tracker *change.Tracker, name *ast.Node) *ast.Node {
	if name.Kind == ast.KindIdentifier {
		return tracker.NewIdentifier(name.Text())
	}
	if name.Kind == ast.KindQualifiedName {
		qualified := name.AsQualifiedName()
		return tracker.NewPropertyAccessExpression(typeScriptSwitchExhaustivenessCheckEntityExpression(tracker, qualified.Left), nil, tracker.NewIdentifier(qualified.Right.Text()), ast.NodeFlagsNone)
	}
	return nil
}
