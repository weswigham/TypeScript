package format

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/ls/lsutil"
)

func getAllRules() []ruleSpec {
	allTokens := make([]ast.Kind, 0, ast.KindLastToken-ast.KindFirstToken+1)
	for token := ast.KindFirstToken; token <= ast.KindLastToken; token++ {
		if token != ast.KindEndOfFile {
			allTokens = append(allTokens, token)
		}
	}

	anyTokenExcept := func(tokens ...ast.Kind) tokenRange {
		newTokens := make([]ast.Kind, 0, len(allTokens))
		for _, token := range allTokens {
			if slices.Contains(tokens, token) {
				continue
			}
			newTokens = append(newTokens, token)
		}
		return tokenRange{
			isSpecific: false,
			tokens:     newTokens,
		}
	}

	anyToken := tokenRange{
		isSpecific: false,
		tokens:     allTokens,
	}

	anyTokenIncludingMultilineComments := tokenRangeFromEx(allTokens, ast.KindMultiLineCommentTrivia)
	anyTokenIncludingEOF := tokenRangeFromEx(allTokens, ast.KindEndOfFile)
	keywords := tokenRangeFromRange(ast.KindFirstKeyword, ast.KindLastKeyword)
	binaryOperators := tokenRangeFromRange(ast.KindFirstBinaryOperator, ast.KindLastBinaryOperator)
	binaryKeywordOperators := []ast.Kind{
		ast.KindInKeyword,
		ast.KindInstanceOfKeyword,
		ast.KindOfKeyword,
		ast.KindAsKeyword,
		ast.KindIsKeyword,
		ast.KindSatisfiesKeyword,
	}
	unaryPrefixOperators := []ast.Kind{ast.KindPlusPlusToken, ast.KindMinusToken, ast.KindTildeToken, ast.KindExclamationToken}
	unaryPrefixExpressions := []ast.Kind{
		ast.KindNumericLiteral,
		ast.KindBigIntLiteral,
		ast.KindIdentifier,
		ast.KindOpenParenToken,
		ast.KindOpenBracketToken,
		ast.KindOpenBraceToken,
		ast.KindThisKeyword,
		ast.KindNewKeyword,
	}
	unaryPreincrementExpressions := []ast.Kind{ast.KindIdentifier, ast.KindOpenParenToken, ast.KindThisKeyword, ast.KindNewKeyword}
	unaryPostincrementExpressions := []ast.Kind{ast.KindIdentifier, ast.KindCloseParenToken, ast.KindCloseBracketToken, ast.KindNewKeyword}
	unaryPredecrementExpressions := []ast.Kind{ast.KindIdentifier, ast.KindOpenParenToken, ast.KindThisKeyword, ast.KindNewKeyword}
	unaryPostdecrementExpressions := []ast.Kind{ast.KindIdentifier, ast.KindCloseParenToken, ast.KindCloseBracketToken, ast.KindNewKeyword}
	comments := []ast.Kind{ast.KindSingleLineCommentTrivia, ast.KindMultiLineCommentTrivia}
	typeKeywords := []ast.Kind{
		ast.KindAnyKeyword,
		ast.KindAssertsKeyword,
		ast.KindBigIntKeyword,
		ast.KindBooleanKeyword,
		ast.KindFalseKeyword,
		ast.KindInferKeyword,
		ast.KindKeyOfKeyword,
		ast.KindNeverKeyword,
		ast.KindNullKeyword,
		ast.KindNumberKeyword,
		ast.KindObjectKeyword,
		ast.KindReadonlyKeyword,
		ast.KindStringKeyword,
		ast.KindSymbolKeyword,
		ast.KindTypeOfKeyword,
		ast.KindTrueKeyword,
		ast.KindVoidKeyword,
		ast.KindUndefinedKeyword,
		ast.KindUniqueKeyword,
		ast.KindUnknownKeyword,
	}
	typeNames := append([]ast.Kind{ast.KindIdentifier}, typeKeywords...)

	// Place a space before open brace in a function declaration
	// TypeScript: Function can have return types, which can be made of tons of different token kinds
	functionOpenBraceLeftTokenRange := anyTokenIncludingMultilineComments

	// Place a space before open brace in a TypeScript declaration that has braces as children (class, module, enum, etc)
	typeScriptOpenBraceLeftTokenRange := tokenRangeFrom(ast.KindIdentifier, ast.KindGreaterThanToken, ast.KindMultiLineCommentTrivia, ast.KindClassKeyword, ast.KindExportKeyword, ast.KindImportKeyword)

	// Place a space before open brace in a control flow construct
	controlOpenBraceLeftTokenRange := tokenRangeFrom(ast.KindCloseParenToken, ast.KindMultiLineCommentTrivia, ast.KindDoKeyword, ast.KindTryKeyword, ast.KindFinallyKeyword, ast.KindElseKeyword, ast.KindCatchKeyword)

	// These rules are higher in priority than user-configurable
	highPriorityCommonRules := []ruleSpec{
		// Leave comments alone
		rule("IgnoreBeforeComment", nil, anyToken, comments, anyContext, ruleActionStopProcessingSpaceActions),
		rule("IgnoreAfterLineComment", nil, ast.KindSingleLineCommentTrivia, anyToken, anyContext, ruleActionStopProcessingSpaceActions),

		rule("NotSpaceBeforeColon", diagnostics.Unexpected_whitespace_before_1, anyToken, ast.KindColonToken, []contextPredicate{isNonJsxSameLineTokenContext, isNotBinaryOpContext, isNotTypeAnnotationContext}, ruleActionDeleteSpace),
		rule("SpaceAfterColon", diagnostics.Expected_a_space_after_0, ast.KindColonToken, anyToken, []contextPredicate{isNonJsxSameLineTokenContext, isNotBinaryOpContext, isNextTokenParentNotJsxNamespacedName}, ruleActionInsertSpace),
		rule("NoSpaceBeforeQuestionMark", diagnostics.Unexpected_whitespace_before_1, anyToken, ast.KindQuestionToken, []contextPredicate{isNonJsxSameLineTokenContext, isNotBinaryOpContext, isNotTypeAnnotationContext}, ruleActionDeleteSpace),
		// insert space after '?' only when it is used in conditional operator
		rule("SpaceAfterQuestionMarkInConditionalOperator", diagnostics.Expected_a_space_after_0, ast.KindQuestionToken, anyToken, []contextPredicate{isNonJsxSameLineTokenContext, isConditionalOperatorContext}, ruleActionInsertSpace),

		// in other cases there should be no space between '?' and next token
		rule("NoSpaceAfterQuestionMark", diagnostics.Unexpected_whitespace_after_0, ast.KindQuestionToken, anyToken, []contextPredicate{isNonJsxSameLineTokenContext, isNonOptionalPropertyContext}, ruleActionDeleteSpace),

		rule("NoSpaceBeforeDot", diagnostics.Unexpected_whitespace_before_1, anyToken, []ast.Kind{ast.KindDotToken, ast.KindQuestionDotToken}, []contextPredicate{isNonJsxSameLineTokenContext, isNotPropertyAccessOnIntegerLiteral}, ruleActionDeleteSpace),
		rule("NoSpaceAfterDot", diagnostics.Unexpected_whitespace_after_0, []ast.Kind{ast.KindDotToken, ast.KindQuestionDotToken}, anyToken, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),

		rule("NoSpaceBetweenImportParenInImportType", diagnostics.Unexpected_whitespace_between_0_and_1, ast.KindImportKeyword, ast.KindOpenParenToken, []contextPredicate{isNonJsxSameLineTokenContext, isImportTypeContext}, ruleActionDeleteSpace),

		// Special handling of unary operators.
		// Prefix operators generally shouldn't have a space between
		// them and their target unary expression.
		rule("NoSpaceAfterUnaryPrefixOperator", diagnostics.Unexpected_whitespace_after_0, unaryPrefixOperators, unaryPrefixExpressions, []contextPredicate{isNonJsxSameLineTokenContext, isNotBinaryOpContext}, ruleActionDeleteSpace),
		rule("NoSpaceAfterUnaryPreincrementOperator", diagnostics.Unexpected_whitespace_after_0, ast.KindPlusPlusToken, unaryPreincrementExpressions, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),
		rule("NoSpaceAfterUnaryPredecrementOperator", diagnostics.Unexpected_whitespace_after_0, ast.KindMinusMinusToken, unaryPredecrementExpressions, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),
		rule("NoSpaceBeforeUnaryPostincrementOperator", diagnostics.Unexpected_whitespace_before_1, unaryPostincrementExpressions, ast.KindPlusPlusToken, []contextPredicate{isNonJsxSameLineTokenContext, isNotStatementConditionContext}, ruleActionDeleteSpace),
		rule("NoSpaceBeforeUnaryPostdecrementOperator", diagnostics.Unexpected_whitespace_before_1, unaryPostdecrementExpressions, ast.KindMinusMinusToken, []contextPredicate{isNonJsxSameLineTokenContext, isNotStatementConditionContext}, ruleActionDeleteSpace),

		// More unary operator special-casing.
		// DevDiv 181814: Be careful when removing leading whitespace
		// around unary operators.  Examples:
		//      1 - -2  --X--> 1--2
		//      a + ++b --X--> a+++b
		rule("SpaceAfterPostincrementWhenFollowedByAdd", diagnostics.Expected_a_space_after_0, ast.KindPlusPlusToken, ast.KindPlusToken, []contextPredicate{isNonJsxSameLineTokenContext, isBinaryOpContext}, ruleActionInsertSpace),
		rule("SpaceAfterAddWhenFollowedByUnaryPlus", diagnostics.Expected_a_space_after_0, ast.KindPlusToken, ast.KindPlusToken, []contextPredicate{isNonJsxSameLineTokenContext, isBinaryOpContext}, ruleActionInsertSpace),
		rule("SpaceAfterAddWhenFollowedByPreincrement", diagnostics.Expected_a_space_after_0, ast.KindPlusToken, ast.KindPlusPlusToken, []contextPredicate{isNonJsxSameLineTokenContext, isBinaryOpContext}, ruleActionInsertSpace),
		rule("SpaceAfterPostdecrementWhenFollowedBySubtract", diagnostics.Expected_a_space_after_0, ast.KindMinusMinusToken, ast.KindMinusToken, []contextPredicate{isNonJsxSameLineTokenContext, isBinaryOpContext}, ruleActionInsertSpace),
		rule("SpaceAfterSubtractWhenFollowedByUnaryMinus", diagnostics.Expected_a_space_after_0, ast.KindMinusToken, ast.KindMinusToken, []contextPredicate{isNonJsxSameLineTokenContext, isBinaryOpContext}, ruleActionInsertSpace),
		rule("SpaceAfterSubtractWhenFollowedByPredecrement", diagnostics.Expected_a_space_after_0, ast.KindMinusToken, ast.KindMinusMinusToken, []contextPredicate{isNonJsxSameLineTokenContext, isBinaryOpContext}, ruleActionInsertSpace),

		rule("NoSpaceAfterCloseBrace", diagnostics.Unexpected_whitespace_after_0, ast.KindCloseBraceToken, []ast.Kind{ast.KindCommaToken, ast.KindSemicolonToken}, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),
		// For functions and control block place } on a new line []ast.Kind{multi-line rule}
		rule("NewLineBeforeCloseBraceInBlockContext", diagnostics.Expected_a_line_break_before_the_closing_brace, anyTokenIncludingMultilineComments, ast.KindCloseBraceToken, []contextPredicate{isMultilineBlockContext}, ruleActionInsertNewLine),

		// Space/new line after }.
		rule("SpaceAfterCloseBrace", diagnostics.Expected_a_space_after_0, ast.KindCloseBraceToken, anyTokenExcept(ast.KindCloseParenToken), []contextPredicate{isNonJsxSameLineTokenContext, isAfterCodeBlockContext}, ruleActionInsertSpace),
		// Special case for (}, else) and (}, while) since else & while tokens are not part of the tree which makes SpaceAfterCloseBrace rule not applied
		// Also should not apply to })
		rule("SpaceBetweenCloseBraceAndElse", diagnostics.Expected_a_space_between_0_and_1, ast.KindCloseBraceToken, ast.KindElseKeyword, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionInsertSpace),
		rule("SpaceBetweenCloseBraceAndWhile", diagnostics.Expected_a_space_between_0_and_1, ast.KindCloseBraceToken, ast.KindWhileKeyword, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionInsertSpace),
		rule("NoSpaceBetweenEmptyBraceBrackets", diagnostics.Unexpected_whitespace_between_0_and_1, ast.KindOpenBraceToken, ast.KindCloseBraceToken, []contextPredicate{isNonJsxSameLineTokenContext, isObjectContext}, ruleActionDeleteSpace),

		// Add a space after control dec context if the next character is an open bracket ex: 'if (false)[]ast.Kind{a, b} = []ast.Kind{1, 2};' -> 'if (false) []ast.Kind{a, b} = []ast.Kind{1, 2};'
		rule("SpaceAfterConditionalClosingParen", diagnostics.Expected_a_space_after_0, ast.KindCloseParenToken, ast.KindOpenBracketToken, []contextPredicate{isControlDeclContext}, ruleActionInsertSpace),

		rule("NoSpaceBetweenFunctionKeywordAndStar", diagnostics.Unexpected_whitespace_between_0_and_1, ast.KindFunctionKeyword, ast.KindAsteriskToken, []contextPredicate{isFunctionDeclarationOrFunctionExpressionContext}, ruleActionDeleteSpace),
		rule("SpaceAfterStarInGeneratorDeclaration", diagnostics.Expected_a_space_after_0, ast.KindAsteriskToken, ast.KindIdentifier, []contextPredicate{isFunctionDeclarationOrFunctionExpressionContext}, ruleActionInsertSpace),

		rule("SpaceAfterFunctionInFuncDecl", diagnostics.Expected_a_space_after_0, ast.KindFunctionKeyword, anyToken, []contextPredicate{isFunctionDeclContext}, ruleActionInsertSpace),
		// Insert new line after { and before } in multi-line contexts.
		rule("NewLineAfterOpenBraceInBlockContext", diagnostics.Expected_a_line_break_after_the_opening_brace, ast.KindOpenBraceToken, anyToken, []contextPredicate{isMultilineBlockContext}, ruleActionInsertNewLine),

		// For get/set members, we check for (identifier,identifier) since get/set don't have tokens and they are represented as just an identifier token.
		// Though, we do extra check on the context to make sure we are dealing with get/set node. Example:
		//      get x() {}
		//      set x(val) {}
		rule("SpaceAfterGetSetInMember", diagnostics.Expected_a_space_after_0, []ast.Kind{ast.KindGetKeyword, ast.KindSetKeyword}, ast.KindIdentifier, []contextPredicate{isFunctionDeclContext}, ruleActionInsertSpace),

		rule("NoSpaceBetweenYieldKeywordAndStar", diagnostics.Unexpected_whitespace_between_0_and_1, ast.KindYieldKeyword, ast.KindAsteriskToken, []contextPredicate{isNonJsxSameLineTokenContext, isYieldOrYieldStarWithOperand}, ruleActionDeleteSpace),
		rule("SpaceBetweenYieldOrYieldStarAndOperand", diagnostics.Expected_a_space_between_0_and_1, []ast.Kind{ast.KindYieldKeyword, ast.KindAsteriskToken}, anyToken, []contextPredicate{isNonJsxSameLineTokenContext, isYieldOrYieldStarWithOperand}, ruleActionInsertSpace),

		rule("NoSpaceBetweenReturnAndSemicolon", diagnostics.Unexpected_whitespace_between_0_and_1, ast.KindReturnKeyword, ast.KindSemicolonToken, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),
		rule("SpaceAfterCertainKeywords", diagnostics.Expected_a_space_after_0, []ast.Kind{ast.KindVarKeyword, ast.KindThrowKeyword, ast.KindNewKeyword, ast.KindDeleteKeyword, ast.KindReturnKeyword, ast.KindTypeOfKeyword, ast.KindAwaitKeyword}, anyToken, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionInsertSpace),
		rule("SpaceAfterLetConstInVariableDeclaration", diagnostics.Expected_a_space_after_0, []ast.Kind{ast.KindLetKeyword, ast.KindConstKeyword}, anyToken, []contextPredicate{isNonJsxSameLineTokenContext, isStartOfVariableDeclarationList}, ruleActionInsertSpace),
		rule("NoSpaceBeforeOpenParenInFuncCall", diagnostics.Unexpected_whitespace_before_the_argument_list, anyToken, ast.KindOpenParenToken, []contextPredicate{isNonJsxSameLineTokenContext, isFunctionCallOrNewContext, isPreviousTokenNotComma}, ruleActionDeleteSpace),

		// Special case for binary operators (that are keywords). For these we have to add a space and shouldn't follow any user options.
		rule("SpaceBeforeBinaryKeywordOperator", diagnostics.Expected_a_space_before_the_binary_operator_1, anyToken, binaryKeywordOperators, []contextPredicate{isNonJsxSameLineTokenContext, isBinaryOpContext}, ruleActionInsertSpace),
		rule("SpaceAfterBinaryKeywordOperator", diagnostics.Expected_a_space_after_the_binary_operator_0, binaryKeywordOperators, anyToken, []contextPredicate{isNonJsxSameLineTokenContext, isBinaryOpContext}, ruleActionInsertSpace),

		rule("SpaceAfterVoidOperator", diagnostics.Expected_a_space_after_0, ast.KindVoidKeyword, anyToken, []contextPredicate{isNonJsxSameLineTokenContext, isVoidOpContext}, ruleActionInsertSpace),

		// Async-await
		rule("SpaceBetweenAsyncAndOpenParen", diagnostics.Expected_a_space_between_0_and_1, ast.KindAsyncKeyword, ast.KindOpenParenToken, []contextPredicate{isArrowFunctionContext, isNonJsxSameLineTokenContext}, ruleActionInsertSpace),
		rule("SpaceBetweenAsyncAndFunctionKeyword", diagnostics.Expected_a_space_between_0_and_1, ast.KindAsyncKeyword, []ast.Kind{ast.KindFunctionKeyword, ast.KindIdentifier}, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionInsertSpace),

		// Template string
		rule("NoSpaceBetweenTagAndTemplateString", diagnostics.Unexpected_whitespace_between_0_and_1, []ast.Kind{ast.KindIdentifier, ast.KindCloseParenToken}, []ast.Kind{ast.KindNoSubstitutionTemplateLiteral, ast.KindTemplateHead}, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),

		// JSX opening elements
		rule("SpaceBeforeJsxAttribute", diagnostics.Expected_a_space_before_the_JSX_attribute, anyToken, ast.KindIdentifier, []contextPredicate{isNextTokenParentJsxAttribute, isNonJsxSameLineTokenContext}, ruleActionInsertSpace),
		rule("SpaceBeforeSlashInJsxOpeningElement", diagnostics.Expected_a_space_before_the_self_closing_JSX_tag_terminator, anyToken, ast.KindSlashToken, []contextPredicate{isJsxSelfClosingElementContext, isNonJsxSameLineTokenContext}, ruleActionInsertSpace),
		rule("NoSpaceBeforeGreaterThanTokenInJsxOpeningElement", diagnostics.Unexpected_whitespace_inside_the_JSX_tag_terminator, ast.KindSlashToken, ast.KindGreaterThanToken, []contextPredicate{isJsxSelfClosingElementContext, isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),
		rule("NoSpaceBeforeEqualInJsxAttribute", diagnostics.Unexpected_whitespace_before_1, anyToken, ast.KindEqualsToken, []contextPredicate{isJsxAttributeContext, isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),
		rule("NoSpaceAfterEqualInJsxAttribute", diagnostics.Unexpected_whitespace_after_0, ast.KindEqualsToken, anyToken, []contextPredicate{isJsxAttributeContext, isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),
		rule("NoSpaceBeforeJsxNamespaceColon", diagnostics.Unexpected_whitespace_before_1, ast.KindIdentifier, ast.KindColonToken, []contextPredicate{isNextTokenParentJsxNamespacedName}, ruleActionDeleteSpace),
		rule("NoSpaceAfterJsxNamespaceColon", diagnostics.Unexpected_whitespace_after_0, ast.KindColonToken, ast.KindIdentifier, []contextPredicate{isNextTokenParentJsxNamespacedName}, ruleActionDeleteSpace),

		// TypeScript-specific rules
		// Use of module as a function call. e.g.: import m2 = module("m2");
		rule("NoSpaceAfterModuleImport", diagnostics.Unexpected_whitespace_after_0, []ast.Kind{ast.KindModuleKeyword, ast.KindRequireKeyword}, ast.KindOpenParenToken, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),
		// Add a space around certain TypeScript keywords
		rule(
			"SpaceAfterCertainTypeScriptKeywords", diagnostics.Expected_a_space_after_0,
			[]ast.Kind{
				ast.KindAbstractKeyword,
				ast.KindAccessorKeyword,
				ast.KindClassKeyword,
				ast.KindDeclareKeyword,
				ast.KindDefaultKeyword,
				ast.KindEnumKeyword,
				ast.KindExportKeyword,
				ast.KindExtendsKeyword,
				ast.KindGetKeyword,
				ast.KindImplementsKeyword,
				ast.KindImportKeyword,
				ast.KindInterfaceKeyword,
				ast.KindModuleKeyword,
				ast.KindNamespaceKeyword,
				ast.KindOverrideKeyword,
				ast.KindPrivateKeyword,
				ast.KindPublicKeyword,
				ast.KindProtectedKeyword,
				ast.KindReadonlyKeyword,
				ast.KindSetKeyword,
				ast.KindStaticKeyword,
				ast.KindTypeKeyword,
				ast.KindFromKeyword,
				ast.KindKeyOfKeyword,
				ast.KindInferKeyword,
			},
			anyToken,
			[]contextPredicate{isNonJsxSameLineTokenContext},
			ruleActionInsertSpace,
		),
		rule(
			"SpaceBeforeCertainTypeScriptKeywords", diagnostics.Expected_a_space_before_1,
			anyToken,
			[]ast.Kind{ast.KindExtendsKeyword, ast.KindImplementsKeyword, ast.KindFromKeyword},
			[]contextPredicate{isNonJsxSameLineTokenContext},
			ruleActionInsertSpace,
		),
		// Treat string literals in module names as identifiers, and add a space between the literal and the opening Brace braces, e.g.: module "m2" {
		rule("SpaceAfterModuleName", diagnostics.Expected_a_space_after_0, ast.KindStringLiteral, ast.KindOpenBraceToken, []contextPredicate{isModuleDeclContext}, ruleActionInsertSpace),

		// Lambda expressions
		rule("SpaceBeforeArrow", diagnostics.Expected_a_space_before_1, anyToken, ast.KindEqualsGreaterThanToken, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionInsertSpace),
		rule("SpaceAfterArrow", diagnostics.Expected_a_space_after_0, ast.KindEqualsGreaterThanToken, anyToken, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionInsertSpace),

		// Optional parameters and let args
		rule("NoSpaceAfterEllipsis", diagnostics.Unexpected_whitespace_after_0, ast.KindDotDotDotToken, ast.KindIdentifier, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),
		rule("NoSpaceAfterOptionalParameters", diagnostics.Unexpected_whitespace_after_0, ast.KindQuestionToken, []ast.Kind{ast.KindCloseParenToken, ast.KindCommaToken}, []contextPredicate{isNonJsxSameLineTokenContext, isNotBinaryOpContext}, ruleActionDeleteSpace),

		// Remove spaces in empty interface literals. e.g.: x: {}
		rule("NoSpaceBetweenEmptyInterfaceBraceBrackets", diagnostics.Unexpected_whitespace_between_0_and_1, ast.KindOpenBraceToken, ast.KindCloseBraceToken, []contextPredicate{isNonJsxSameLineTokenContext, isObjectTypeContext}, ruleActionDeleteSpace),

		// generics and type assertions
		rule("NoSpaceBeforeOpenAngularBracket", diagnostics.Unexpected_whitespace_before_1, typeNames, ast.KindLessThanToken, []contextPredicate{isNonJsxSameLineTokenContext, isTypeArgumentOrParameterOrAssertionContext}, ruleActionDeleteSpace),
		rule("NoSpaceBetweenCloseParenAndAngularBracket", diagnostics.Unexpected_whitespace_between_0_and_1, ast.KindCloseParenToken, ast.KindLessThanToken, []contextPredicate{isNonJsxSameLineTokenContext, isTypeArgumentOrParameterOrAssertionContext}, ruleActionDeleteSpace),
		rule("NoSpaceAfterOpenAngularBracket", diagnostics.Unexpected_whitespace_after_0, ast.KindLessThanToken, anyToken, []contextPredicate{isNonJsxSameLineTokenContext, isTypeArgumentOrParameterOrAssertionContext}, ruleActionDeleteSpace),
		rule("NoSpaceBeforeCloseAngularBracket", diagnostics.Unexpected_whitespace_before_1, anyToken, ast.KindGreaterThanToken, []contextPredicate{isNonJsxSameLineTokenContext, isTypeArgumentOrParameterOrAssertionContext}, ruleActionDeleteSpace),
		rule("NoSpaceAfterCloseAngularBracket", diagnostics.Unexpected_whitespace_after_0, ast.KindGreaterThanToken, []ast.Kind{ast.KindOpenParenToken, ast.KindOpenBracketToken, ast.KindGreaterThanToken, ast.KindCommaToken}, []contextPredicate{
			isNonJsxSameLineTokenContext,
			isTypeArgumentOrParameterOrAssertionContext,
			isNotFunctionDeclContext, /*To prevent an interference with the SpaceBeforeOpenParenInFuncDecl rule*/
			isNonTypeAssertionContext,
		}, ruleActionDeleteSpace),

		// decorators
		rule("SpaceBeforeAt", diagnostics.Expected_a_space_before_1, []ast.Kind{ast.KindCloseParenToken, ast.KindIdentifier}, ast.KindAtToken, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionInsertSpace),
		rule("NoSpaceAfterAt", diagnostics.Unexpected_whitespace_after_0, ast.KindAtToken, anyToken, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),
		// Insert space after @ in decorator
		rule(
			"SpaceAfterDecorator", diagnostics.Expected_a_space_after_the_decorator,
			anyToken,
			[]ast.Kind{
				ast.KindAbstractKeyword,
				ast.KindIdentifier,
				ast.KindExportKeyword,
				ast.KindDefaultKeyword,
				ast.KindClassKeyword,
				ast.KindStaticKeyword,
				ast.KindPublicKeyword,
				ast.KindPrivateKeyword,
				ast.KindProtectedKeyword,
				ast.KindGetKeyword,
				ast.KindSetKeyword,
				ast.KindOpenBracketToken,
				ast.KindAsteriskToken,
			},
			[]contextPredicate{isEndOfDecoratorContextOnSameLine},
			ruleActionInsertSpace,
		),

		rule("NoSpaceBeforeNonNullAssertionOperator", diagnostics.Unexpected_whitespace_before_the_non_null_assertion_operator, anyToken, ast.KindExclamationToken, []contextPredicate{isNonJsxSameLineTokenContext, isNonNullAssertionContext}, ruleActionDeleteSpace),
		rule("NoSpaceAfterNewKeywordOnConstructorSignature", diagnostics.Unexpected_whitespace_after_0, ast.KindNewKeyword, ast.KindOpenParenToken, []contextPredicate{isNonJsxSameLineTokenContext, isConstructorSignatureContext}, ruleActionDeleteSpace),
		rule("SpaceLessThanAndNonJSXTypeAnnotation", diagnostics.Expected_a_space_between_0_and_1, ast.KindLessThanToken, ast.KindLessThanToken, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionInsertSpace),
	}

	// These rules are applied after high priority
	userConfigurableRules := []ruleSpec{
		// Treat constructor as an identifier in a function declaration, and remove spaces between constructor and following left parentheses
		rule("SpaceAfterConstructor", diagnostics.Expected_a_space_after_0, ast.KindConstructorKeyword, ast.KindOpenParenToken, []contextPredicate{isOptionEnabled(insertSpaceAfterConstructorOption), isNonJsxSameLineTokenContext}, ruleActionInsertSpace),
		rule("NoSpaceAfterConstructor", diagnostics.Unexpected_whitespace_after_0, ast.KindConstructorKeyword, ast.KindOpenParenToken, []contextPredicate{isOptionDisabledOrUndefined(insertSpaceAfterConstructorOption), isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),

		rule("SpaceAfterComma", diagnostics.Expected_a_space_after_0, ast.KindCommaToken, anyToken, []contextPredicate{isOptionEnabled(insertSpaceAfterCommaDelimiterOption), isNonJsxSameLineTokenContext, isNonJsxElementOrFragmentContext, isNextTokenNotCloseBracket, isNextTokenNotCloseParen}, ruleActionInsertSpace),
		rule("NoSpaceAfterComma", diagnostics.Unexpected_whitespace_after_0, ast.KindCommaToken, anyToken, []contextPredicate{isOptionDisabledOrUndefined(insertSpaceAfterCommaDelimiterOption), isNonJsxSameLineTokenContext, isNonJsxElementOrFragmentContext}, ruleActionDeleteSpace),

		// Insert space after function keyword for anonymous functions
		rule("SpaceAfterAnonymousFunctionKeyword", diagnostics.Expected_a_space_after_0, []ast.Kind{ast.KindFunctionKeyword, ast.KindAsteriskToken}, ast.KindOpenParenToken, []contextPredicate{isOptionEnabled(insertSpaceAfterFunctionKeywordForAnonymousFunctionsOption), isFunctionDeclContext}, ruleActionInsertSpace),
		rule("NoSpaceAfterAnonymousFunctionKeyword", diagnostics.Unexpected_whitespace_after_0, []ast.Kind{ast.KindFunctionKeyword, ast.KindAsteriskToken}, ast.KindOpenParenToken, []contextPredicate{isOptionDisabledOrUndefined(insertSpaceAfterFunctionKeywordForAnonymousFunctionsOption), isFunctionDeclContext}, ruleActionDeleteSpace),

		// Insert space after keywords in control flow statements
		rule("SpaceAfterKeywordInControl", diagnostics.Expected_a_space_after_0, keywords, ast.KindOpenParenToken, []contextPredicate{isOptionEnabled(insertSpaceAfterKeywordsInControlFlowStatementsOption), isControlDeclContext}, ruleActionInsertSpace),
		rule("NoSpaceAfterKeywordInControl", diagnostics.Unexpected_whitespace_after_0, keywords, ast.KindOpenParenToken, []contextPredicate{isOptionDisabledOrUndefined(insertSpaceAfterKeywordsInControlFlowStatementsOption), isControlDeclContext}, ruleActionDeleteSpace),

		// Insert space after opening and before closing nonempty parenthesis
		rule("SpaceAfterOpenParen", diagnostics.Expected_a_space_after_0, ast.KindOpenParenToken, anyToken, []contextPredicate{isOptionEnabled(insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesisOption), isNonJsxSameLineTokenContext}, ruleActionInsertSpace),
		rule("SpaceBeforeCloseParen", diagnostics.Expected_a_space_before_1, anyToken, ast.KindCloseParenToken, []contextPredicate{isOptionEnabled(insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesisOption), isNonJsxSameLineTokenContext}, ruleActionInsertSpace),
		rule("SpaceBetweenOpenParens", diagnostics.Expected_a_space_between_0_and_1, ast.KindOpenParenToken, ast.KindOpenParenToken, []contextPredicate{isOptionEnabled(insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesisOption), isNonJsxSameLineTokenContext}, ruleActionInsertSpace),
		rule("NoSpaceBetweenParens", diagnostics.Unexpected_whitespace_between_0_and_1, ast.KindOpenParenToken, ast.KindCloseParenToken, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),
		rule("NoSpaceAfterOpenParen", diagnostics.Unexpected_whitespace_after_0, ast.KindOpenParenToken, anyToken, []contextPredicate{isOptionDisabledOrUndefined(insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesisOption), isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),
		rule("NoSpaceBeforeCloseParen", diagnostics.Unexpected_whitespace_before_1, anyToken, ast.KindCloseParenToken, []contextPredicate{isOptionDisabledOrUndefined(insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesisOption), isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),

		// Insert space after opening and before closing nonempty brackets
		rule("SpaceAfterOpenBracket", diagnostics.Expected_a_space_after_0, ast.KindOpenBracketToken, anyToken, []contextPredicate{isOptionEnabled(insertSpaceAfterOpeningAndBeforeClosingNonemptyBracketsOption), isNonJsxSameLineTokenContext}, ruleActionInsertSpace),
		rule("SpaceBeforeCloseBracket", diagnostics.Expected_a_space_before_1, anyToken, ast.KindCloseBracketToken, []contextPredicate{isOptionEnabled(insertSpaceAfterOpeningAndBeforeClosingNonemptyBracketsOption), isNonJsxSameLineTokenContext}, ruleActionInsertSpace),
		rule("NoSpaceBetweenBrackets", diagnostics.Unexpected_whitespace_between_0_and_1, ast.KindOpenBracketToken, ast.KindCloseBracketToken, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),
		rule("NoSpaceAfterOpenBracket", diagnostics.Unexpected_whitespace_after_0, ast.KindOpenBracketToken, anyToken, []contextPredicate{isOptionDisabledOrUndefined(insertSpaceAfterOpeningAndBeforeClosingNonemptyBracketsOption), isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),
		rule("NoSpaceBeforeCloseBracket", diagnostics.Unexpected_whitespace_before_1, anyToken, ast.KindCloseBracketToken, []contextPredicate{isOptionDisabledOrUndefined(insertSpaceAfterOpeningAndBeforeClosingNonemptyBracketsOption), isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),

		// Insert a space after { and before } in single-line contexts, but remove space from empty object literals {}.
		rule("SpaceAfterOpenBrace", diagnostics.Expected_a_space_after_0, ast.KindOpenBraceToken, anyToken, []contextPredicate{isOptionEnabledOrUndefined(insertSpaceAfterOpeningAndBeforeClosingNonemptyBracesOption), isBraceWrappedContext}, ruleActionInsertSpace),
		rule("SpaceBeforeCloseBrace", diagnostics.Expected_a_space_before_1, anyToken, ast.KindCloseBraceToken, []contextPredicate{isOptionEnabledOrUndefined(insertSpaceAfterOpeningAndBeforeClosingNonemptyBracesOption), isBraceWrappedContext}, ruleActionInsertSpace),
		rule("NoSpaceBetweenEmptyBraceBrackets", diagnostics.Unexpected_whitespace_between_0_and_1, ast.KindOpenBraceToken, ast.KindCloseBraceToken, []contextPredicate{isNonJsxSameLineTokenContext, isObjectContext}, ruleActionDeleteSpace),
		rule("NoSpaceAfterOpenBrace", diagnostics.Unexpected_whitespace_after_0, ast.KindOpenBraceToken, anyToken, []contextPredicate{isOptionDisabled(insertSpaceAfterOpeningAndBeforeClosingNonemptyBracesOption), isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),
		rule("NoSpaceBeforeCloseBrace", diagnostics.Unexpected_whitespace_before_1, anyToken, ast.KindCloseBraceToken, []contextPredicate{isOptionDisabled(insertSpaceAfterOpeningAndBeforeClosingNonemptyBracesOption), isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),

		// Insert a space after opening and before closing empty brace brackets
		rule("SpaceBetweenEmptyBraceBrackets", diagnostics.Expected_a_space_between_0_and_1, ast.KindOpenBraceToken, ast.KindCloseBraceToken, []contextPredicate{isOptionEnabled(insertSpaceAfterOpeningAndBeforeClosingEmptyBracesOption)}, ruleActionInsertSpace),
		rule("NoSpaceBetweenEmptyBraceBrackets", diagnostics.Unexpected_whitespace_between_0_and_1, ast.KindOpenBraceToken, ast.KindCloseBraceToken, []contextPredicate{isOptionDisabled(insertSpaceAfterOpeningAndBeforeClosingEmptyBracesOption), isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),

		// Insert space after opening and before closing template string braces
		rule("SpaceAfterTemplateHeadAndMiddle", diagnostics.Expected_a_space_after_0, []ast.Kind{ast.KindTemplateHead, ast.KindTemplateMiddle}, anyToken, []contextPredicate{isOptionEnabled(insertSpaceAfterOpeningAndBeforeClosingTemplateStringBracesOption), isNonJsxTextContext}, ruleActionInsertSpace, ruleFlagsCanDeleteNewLines),
		rule("SpaceBeforeTemplateMiddleAndTail", diagnostics.Expected_a_space_before_1, anyToken, []ast.Kind{ast.KindTemplateMiddle, ast.KindTemplateTail}, []contextPredicate{isOptionEnabled(insertSpaceAfterOpeningAndBeforeClosingTemplateStringBracesOption), isNonJsxSameLineTokenContext}, ruleActionInsertSpace),
		rule("NoSpaceAfterTemplateHeadAndMiddle", diagnostics.Unexpected_whitespace_after_0, []ast.Kind{ast.KindTemplateHead, ast.KindTemplateMiddle}, anyToken, []contextPredicate{isOptionDisabledOrUndefined(insertSpaceAfterOpeningAndBeforeClosingTemplateStringBracesOption), isNonJsxTextContext}, ruleActionDeleteSpace, ruleFlagsCanDeleteNewLines),
		rule("NoSpaceBeforeTemplateMiddleAndTail", diagnostics.Unexpected_whitespace_before_1, anyToken, []ast.Kind{ast.KindTemplateMiddle, ast.KindTemplateTail}, []contextPredicate{isOptionDisabledOrUndefined(insertSpaceAfterOpeningAndBeforeClosingTemplateStringBracesOption), isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),

		// No space after { and before } in JSX expression
		rule("SpaceAfterOpenBraceInJsxExpression", diagnostics.Expected_a_space_after_0, ast.KindOpenBraceToken, anyToken, []contextPredicate{isOptionEnabled(insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBracesOption), isNonJsxSameLineTokenContext, isJsxExpressionContext}, ruleActionInsertSpace),
		rule("SpaceBeforeCloseBraceInJsxExpression", diagnostics.Expected_a_space_before_1, anyToken, ast.KindCloseBraceToken, []contextPredicate{isOptionEnabled(insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBracesOption), isNonJsxSameLineTokenContext, isJsxExpressionContext}, ruleActionInsertSpace),
		rule("NoSpaceAfterOpenBraceInJsxExpression", diagnostics.Unexpected_whitespace_after_0, ast.KindOpenBraceToken, anyToken, []contextPredicate{isOptionDisabledOrUndefined(insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBracesOption), isNonJsxSameLineTokenContext, isJsxExpressionContext}, ruleActionDeleteSpace),
		rule("NoSpaceBeforeCloseBraceInJsxExpression", diagnostics.Unexpected_whitespace_before_1, anyToken, ast.KindCloseBraceToken, []contextPredicate{isOptionDisabledOrUndefined(insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBracesOption), isNonJsxSameLineTokenContext, isJsxExpressionContext}, ruleActionDeleteSpace),

		// Insert space after semicolon in for statement
		rule("SpaceAfterSemicolonInFor", diagnostics.Expected_a_space_after_0, ast.KindSemicolonToken, anyToken, []contextPredicate{isOptionEnabled(insertSpaceAfterSemicolonInForStatementsOption), isNonJsxSameLineTokenContext, isForContext}, ruleActionInsertSpace),
		rule("NoSpaceAfterSemicolonInFor", diagnostics.Unexpected_whitespace_after_0, ast.KindSemicolonToken, anyToken, []contextPredicate{isOptionDisabledOrUndefined(insertSpaceAfterSemicolonInForStatementsOption), isNonJsxSameLineTokenContext, isForContext}, ruleActionDeleteSpace),

		// Insert space before and after binary operators
		rule("SpaceBeforeBinaryOperator", diagnostics.Expected_a_space_before_the_binary_operator_1, anyToken, binaryOperators, []contextPredicate{isOptionEnabled(insertSpaceBeforeAndAfterBinaryOperatorsOption), isNonJsxSameLineTokenContext, isBinaryOpContext}, ruleActionInsertSpace),
		rule("SpaceAfterBinaryOperator", diagnostics.Expected_a_space_after_the_binary_operator_0, binaryOperators, anyToken, []contextPredicate{isOptionEnabled(insertSpaceBeforeAndAfterBinaryOperatorsOption), isNonJsxSameLineTokenContext, isBinaryOpContext}, ruleActionInsertSpace),
		rule("NoSpaceBeforeBinaryOperator", diagnostics.Unexpected_whitespace_before_the_binary_operator_1, anyToken, binaryOperators, []contextPredicate{isOptionDisabledOrUndefined(insertSpaceBeforeAndAfterBinaryOperatorsOption), isNonJsxSameLineTokenContext, isBinaryOpContext}, ruleActionDeleteSpace),
		rule("NoSpaceAfterBinaryOperator", diagnostics.Unexpected_whitespace_after_the_binary_operator_0, binaryOperators, anyToken, []contextPredicate{isOptionDisabledOrUndefined(insertSpaceBeforeAndAfterBinaryOperatorsOption), isNonJsxSameLineTokenContext, isBinaryOpContext}, ruleActionDeleteSpace),

		rule("SpaceBeforeOpenParenInFuncDecl", diagnostics.Expected_a_space_before_the_function_parameter_list, anyToken, ast.KindOpenParenToken, []contextPredicate{isOptionEnabled(insertSpaceBeforeFunctionParenthesisOption), isNonJsxSameLineTokenContext, isFunctionDeclContext}, ruleActionInsertSpace),
		rule("NoSpaceBeforeOpenParenInFuncDecl", diagnostics.Unexpected_whitespace_before_the_function_parameter_list, anyToken, ast.KindOpenParenToken, []contextPredicate{isOptionDisabledOrUndefined(insertSpaceBeforeFunctionParenthesisOption), isNonJsxSameLineTokenContext, isFunctionDeclContext}, ruleActionDeleteSpace),

		// Open Brace braces after control block
		rule("NewLineBeforeOpenBraceInControl", diagnostics.Expected_the_opening_brace_of_the_control_flow_block_on_a_new_line, controlOpenBraceLeftTokenRange, ast.KindOpenBraceToken, []contextPredicate{isOptionEnabled(placeOpenBraceOnNewLineForControlBlocksOption), isControlDeclContext, isBeforeMultilineBlockContext}, ruleActionInsertNewLine, ruleFlagsCanDeleteNewLines),

		// Open Brace braces after function
		// TypeScript: Function can have return types, which can be made of tons of different token kinds
		rule("NewLineBeforeOpenBraceInFunction", diagnostics.Expected_the_opening_brace_of_the_function_body_on_a_new_line, functionOpenBraceLeftTokenRange, ast.KindOpenBraceToken, []contextPredicate{isOptionEnabled(placeOpenBraceOnNewLineForFunctionsOption), isFunctionDeclContext, isBeforeMultilineBlockContext}, ruleActionInsertNewLine, ruleFlagsCanDeleteNewLines),
		// Open Brace braces after TypeScript module/class/interface
		rule("NewLineBeforeOpenBraceInTypeScriptDeclWithBlock", diagnostics.Expected_the_opening_brace_of_the_declaration_body_on_a_new_line, typeScriptOpenBraceLeftTokenRange, ast.KindOpenBraceToken, []contextPredicate{isOptionEnabled(placeOpenBraceOnNewLineForFunctionsOption), isTypeScriptDeclWithBlockContext, isBeforeMultilineBlockContext}, ruleActionInsertNewLine, ruleFlagsCanDeleteNewLines),

		rule("SpaceAfterTypeAssertion", diagnostics.Expected_a_space_after_0, ast.KindGreaterThanToken, anyToken, []contextPredicate{isOptionEnabled(insertSpaceAfterTypeAssertionOption), isNonJsxSameLineTokenContext, isTypeAssertionContext}, ruleActionInsertSpace),
		rule("NoSpaceAfterTypeAssertion", diagnostics.Unexpected_whitespace_after_0, ast.KindGreaterThanToken, anyToken, []contextPredicate{isOptionDisabledOrUndefined(insertSpaceAfterTypeAssertionOption), isNonJsxSameLineTokenContext, isTypeAssertionContext}, ruleActionDeleteSpace),

		rule("SpaceBeforeTypeAnnotation", diagnostics.Expected_a_space_before_the_type_annotation, anyToken, []ast.Kind{ast.KindQuestionToken, ast.KindColonToken}, []contextPredicate{isOptionEnabled(insertSpaceBeforeTypeAnnotationOption), isNonJsxSameLineTokenContext, isTypeAnnotationContext}, ruleActionInsertSpace),
		rule("NoSpaceBeforeTypeAnnotation", diagnostics.Unexpected_whitespace_before_the_type_annotation, anyToken, []ast.Kind{ast.KindQuestionToken, ast.KindColonToken}, []contextPredicate{isOptionDisabledOrUndefined(insertSpaceBeforeTypeAnnotationOption), isNonJsxSameLineTokenContext, isTypeAnnotationContext}, ruleActionDeleteSpace),

		rule("NoOptionalSemicolon", diagnostics.Unnecessary_semicolon, ast.KindSemicolonToken, anyTokenIncludingEOF, []contextPredicate{optionEquals(semicolonOption, lsutil.SemicolonPreferenceRemove), isSemicolonDeletionContext}, ruleActionDeleteToken),
		rule("OptionalSemicolon", diagnostics.Expected_a_semicolon_at_the_end_of_the_statement, anyToken, anyTokenIncludingEOF, []contextPredicate{optionEquals(semicolonOption, lsutil.SemicolonPreferenceInsert), isSemicolonInsertionContext}, ruleActionInsertTrailingSemicolon),
	}

	// These rules are lower in priority than user-configurable. Rules earlier in this list have priority over rules later in the list.
	lowPriorityCommonRules := []ruleSpec{
		// Space after keyword but not before ; or : or ?
		rule("NoSpaceBeforeSemicolon", diagnostics.Unexpected_whitespace_before_1, anyToken, ast.KindSemicolonToken, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),

		rule("SpaceBeforeOpenBraceInControl", diagnostics.Expected_a_space_before_the_control_flow_block, controlOpenBraceLeftTokenRange, ast.KindOpenBraceToken, []contextPredicate{isOptionDisabledOrUndefinedOrTokensOnSameLine(placeOpenBraceOnNewLineForControlBlocksOption), isControlDeclContext, isNotFormatOnEnter, isSameLineTokenOrBeforeBlockContext}, ruleActionInsertSpace, ruleFlagsCanDeleteNewLines),
		rule("SpaceBeforeOpenBraceInFunction", diagnostics.Expected_a_space_before_the_function_body, functionOpenBraceLeftTokenRange, ast.KindOpenBraceToken, []contextPredicate{isOptionDisabledOrUndefinedOrTokensOnSameLine(placeOpenBraceOnNewLineForFunctionsOption), isFunctionDeclContext, isBeforeBlockContext, isNotFormatOnEnter, isSameLineTokenOrBeforeBlockContext}, ruleActionInsertSpace, ruleFlagsCanDeleteNewLines),
		rule("SpaceBeforeOpenBraceInTypeScriptDeclWithBlock", diagnostics.Expected_a_space_before_the_declaration_body, typeScriptOpenBraceLeftTokenRange, ast.KindOpenBraceToken, []contextPredicate{isOptionDisabledOrUndefinedOrTokensOnSameLine(placeOpenBraceOnNewLineForFunctionsOption), isTypeScriptDeclWithBlockContext, isNotFormatOnEnter, isSameLineTokenOrBeforeBlockContext}, ruleActionInsertSpace, ruleFlagsCanDeleteNewLines),

		rule("NoSpaceBeforeComma", diagnostics.Unexpected_whitespace_before_1, anyToken, ast.KindCommaToken, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),

		// No space before and after indexer `x[]ast.Kind{}`
		rule("NoSpaceBeforeOpenBracket", diagnostics.Unexpected_whitespace_before_1, anyTokenExcept(ast.KindAsyncKeyword, ast.KindCaseKeyword), ast.KindOpenBracketToken, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),
		rule("NoSpaceAfterCloseBracket", diagnostics.Unexpected_whitespace_after_0, ast.KindCloseBracketToken, anyToken, []contextPredicate{isNonJsxSameLineTokenContext, isNotBeforeBlockInFunctionDeclarationContext}, ruleActionDeleteSpace),
		rule("SpaceAfterSemicolon", diagnostics.Expected_a_space_after_0, ast.KindSemicolonToken, anyToken, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionInsertSpace),

		// Remove extra space between for and await
		rule("SpaceBetweenForAndAwaitKeyword", diagnostics.Expected_a_space_between_0_and_1, ast.KindForKeyword, ast.KindAwaitKeyword, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionInsertSpace),

		// Remove extra spaces between ... and type name in tuple spread
		rule("SpaceBetweenDotDotDotAndTypeName", diagnostics.Unexpected_whitespace_between_0_and_1, ast.KindDotDotDotToken, typeNames, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionDeleteSpace),

		// Add a space between statements. All keywords except (do,else,case) has open/close parens after them.
		// So, we have a rule to add a space for []ast.Kind{),Any}, []ast.Kind{do,Any}, []ast.Kind{else,Any}, and []ast.Kind{case,Any}
		rule(
			"SpaceBetweenStatements", diagnostics.Expected_a_space_between_0_and_1,
			[]ast.Kind{ast.KindCloseParenToken, ast.KindDoKeyword, ast.KindElseKeyword, ast.KindCaseKeyword},
			anyToken,
			[]contextPredicate{isNonJsxSameLineTokenContext, isNonJsxElementOrFragmentContext, isNotForContext},
			ruleActionInsertSpace,
		),
		// This low-pri rule takes care of "try {", "catch {" and "finally {" in case the rule SpaceBeforeOpenBraceInControl didn't execute on FormatOnEnter.
		rule("SpaceAfterTryCatchFinally", diagnostics.Expected_a_space_after_0, []ast.Kind{ast.KindTryKeyword, ast.KindCatchKeyword, ast.KindFinallyKeyword}, ast.KindOpenBraceToken, []contextPredicate{isNonJsxSameLineTokenContext}, ruleActionInsertSpace),
	}

	result := make([]ruleSpec, 0, len(highPriorityCommonRules)+len(userConfigurableRules)+len(lowPriorityCommonRules))
	result = append(result, highPriorityCommonRules...)
	result = append(result, userConfigurableRules...)
	result = append(result, lowPriorityCommonRules...)
	return result
}

func tokenRangeFrom(tokens ...ast.Kind) tokenRange {
	return tokenRange{
		isSpecific: true,
		tokens:     tokens,
	}
}

func tokenRangeFromEx(prefix []ast.Kind, tokens ...ast.Kind) tokenRange {
	tokens = append(prefix, tokens...)
	return tokenRange{
		isSpecific: true,
		tokens:     tokens,
	}
}

func tokenRangeFromRange(start ast.Kind, end ast.Kind) tokenRange {
	tokens := make([]ast.Kind, 0, end-start+1)
	for token := start; token <= end; token++ {
		tokens = append(tokens, token)
	}

	return tokenRangeFrom(tokens...)
}
