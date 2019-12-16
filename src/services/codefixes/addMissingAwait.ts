/* @internal */
namespace ts.codefix {
    type ContextualTrackChangesFunction = (cb: (changeTracker: ts.textChanges.ChangeTracker) => void) => ts.FileTextChanges[];
    const fixId = "addMissingAwait";
    const propertyAccessCode = ts.Diagnostics.Property_0_does_not_exist_on_type_1.code;
    const callableConstructableErrorCodes = [
        ts.Diagnostics.This_expression_is_not_callable.code,
        ts.Diagnostics.This_expression_is_not_constructable.code,
    ];
    const errorCodes = [
        ts.Diagnostics.An_arithmetic_operand_must_be_of_type_any_number_bigint_or_an_enum_type.code,
        ts.Diagnostics.The_left_hand_side_of_an_arithmetic_operation_must_be_of_type_any_number_bigint_or_an_enum_type.code,
        ts.Diagnostics.The_right_hand_side_of_an_arithmetic_operation_must_be_of_type_any_number_bigint_or_an_enum_type.code,
        ts.Diagnostics.Operator_0_cannot_be_applied_to_type_1.code,
        ts.Diagnostics.Operator_0_cannot_be_applied_to_types_1_and_2.code,
        ts.Diagnostics.This_condition_will_always_return_0_since_the_types_1_and_2_have_no_overlap.code,
        ts.Diagnostics.Type_0_is_not_an_array_type.code,
        ts.Diagnostics.Type_0_is_not_an_array_type_or_a_string_type.code,
        ts.Diagnostics.Type_0_is_not_an_array_type_or_a_string_type_Use_compiler_option_downlevelIteration_to_allow_iterating_of_iterators.code,
        ts.Diagnostics.Type_0_is_not_an_array_type_or_a_string_type_or_does_not_have_a_Symbol_iterator_method_that_returns_an_iterator.code,
        ts.Diagnostics.Type_0_is_not_an_array_type_or_does_not_have_a_Symbol_iterator_method_that_returns_an_iterator.code,
        ts.Diagnostics.Type_0_must_have_a_Symbol_iterator_method_that_returns_an_iterator.code,
        ts.Diagnostics.Type_0_must_have_a_Symbol_asyncIterator_method_that_returns_an_async_iterator.code,
        ts.Diagnostics.Argument_of_type_0_is_not_assignable_to_parameter_of_type_1.code,
        propertyAccessCode,
        ...callableConstructableErrorCodes,
    ];
    ts.codefix.registerCodeFix({
        fixIds: [fixId],
        errorCodes,
        getCodeActions: context => {
            const { sourceFile, errorCode, span, cancellationToken, program } = context;
            const expression = getFixableErrorSpanExpression(sourceFile, errorCode, span, cancellationToken, program);
            if (!expression) {
                return;
            }
            const checker = context.program.getTypeChecker();
            const trackChanges: ContextualTrackChangesFunction = cb => ts.textChanges.ChangeTracker.with(context, cb);
            return ts.compact([
                getDeclarationSiteFix(context, expression, errorCode, checker, trackChanges),
                getUseSiteFix(context, expression, errorCode, checker, trackChanges)
            ]);
        },
        getAllCodeActions: context => {
            const { sourceFile, program, cancellationToken } = context;
            const checker = context.program.getTypeChecker();
            const fixedDeclarations = ts.createMap<true>();
            return ts.codefix.codeFixAll(context, errorCodes, (t, diagnostic) => {
                const expression = getFixableErrorSpanExpression(sourceFile, diagnostic.code, diagnostic, cancellationToken, program);
                if (!expression) {
                    return;
                }
                const trackChanges: ContextualTrackChangesFunction = cb => (cb(t), []);
                return getDeclarationSiteFix(context, expression, diagnostic.code, checker, trackChanges, fixedDeclarations)
                    || getUseSiteFix(context, expression, diagnostic.code, checker, trackChanges, fixedDeclarations);
            });
        },
    });
    function getDeclarationSiteFix(context: ts.CodeFixContext | ts.CodeFixAllContext, expression: ts.Expression, errorCode: number, checker: ts.TypeChecker, trackChanges: ContextualTrackChangesFunction, fixedDeclarations?: ts.Map<true>) {
        const { sourceFile, program, cancellationToken } = context;
        const awaitableInitializers = findAwaitableInitializers(expression, sourceFile, cancellationToken, program, checker);
        if (awaitableInitializers) {
            const initializerChanges = trackChanges(t => {
                ts.forEach(awaitableInitializers.initializers, ({ expression }) => makeChange(t, errorCode, sourceFile, checker, expression, fixedDeclarations));
                if (fixedDeclarations && awaitableInitializers.needsSecondPassForFixAll) {
                    makeChange(t, errorCode, sourceFile, checker, expression, fixedDeclarations);
                }
            });
            return ts.codefix.createCodeFixActionNoFixId("addMissingAwaitToInitializer", initializerChanges, awaitableInitializers.initializers.length === 1
                ? [ts.Diagnostics.Add_await_to_initializer_for_0, awaitableInitializers.initializers[0].declarationSymbol.name]
                : ts.Diagnostics.Add_await_to_initializers);
        }
    }
    function getUseSiteFix(context: ts.CodeFixContext | ts.CodeFixAllContext, expression: ts.Expression, errorCode: number, checker: ts.TypeChecker, trackChanges: ContextualTrackChangesFunction, fixedDeclarations?: ts.Map<true>) {
        const changes = trackChanges(t => makeChange(t, errorCode, context.sourceFile, checker, expression, fixedDeclarations));
        return ts.codefix.createCodeFixAction(fixId, changes, ts.Diagnostics.Add_await, fixId, ts.Diagnostics.Fix_all_expressions_possibly_missing_await);
    }
    function isMissingAwaitError(sourceFile: ts.SourceFile, errorCode: number, span: ts.TextSpan, cancellationToken: ts.CancellationToken, program: ts.Program) {
        const checker = program.getDiagnosticsProducingTypeChecker();
        const diagnostics = checker.getDiagnostics(sourceFile, cancellationToken);
        return ts.some(diagnostics, ({ start, length, relatedInformation, code }) => ts.isNumber(start) && ts.isNumber(length) && ts.textSpansEqual({ start, length }, span) &&
            code === errorCode &&
            !!relatedInformation &&
            ts.some(relatedInformation, related => related.code === ts.Diagnostics.Did_you_forget_to_use_await.code));
    }
    function getFixableErrorSpanExpression(sourceFile: ts.SourceFile, errorCode: number, span: ts.TextSpan, cancellationToken: ts.CancellationToken, program: ts.Program): ts.Expression | undefined {
        const token = ts.getTokenAtPosition(sourceFile, span.start);
        // Checker has already done work to determine that await might be possible, and has attached
        // related info to the node, so start by finding the expression that exactly matches up
        // with the diagnostic range.
        const expression = (ts.findAncestor(token, node => {
            if (node.getStart(sourceFile) < span.start || node.getEnd() > ts.textSpanEnd(span)) {
                return "quit";
            }
            return ts.isExpression(node) && ts.textSpansEqual(span, ts.createTextSpanFromNode(node, sourceFile));
        }) as ts.Expression | undefined);
        return expression
            && isMissingAwaitError(sourceFile, errorCode, span, cancellationToken, program)
            && isInsideAwaitableBody(expression) ? expression : undefined;
    }
    interface AwaitableInitializer {
        expression: ts.Expression;
        declarationSymbol: ts.Symbol;
    }
    interface AwaitableInitializers {
        initializers: readonly AwaitableInitializer[];
        needsSecondPassForFixAll: boolean;
    }
    function findAwaitableInitializers(expression: ts.Node, sourceFile: ts.SourceFile, cancellationToken: ts.CancellationToken, program: ts.Program, checker: ts.TypeChecker): AwaitableInitializers | undefined {
        const identifiers = getIdentifiersFromErrorSpanExpression(expression, checker);
        if (!identifiers) {
            return;
        }
        let isCompleteFix = identifiers.isCompleteFix;
        let initializers: AwaitableInitializer[] | undefined;
        for (const identifier of identifiers.identifiers) {
            const symbol = checker.getSymbolAtLocation(identifier);
            if (!symbol) {
                continue;
            }
            const declaration = ts.tryCast(symbol.valueDeclaration, ts.isVariableDeclaration);
            const variableName = declaration && ts.tryCast(declaration.name, ts.isIdentifier);
            const variableStatement = ts.getAncestor(declaration, ts.SyntaxKind.VariableStatement);
            if (!declaration || !variableStatement ||
                declaration.type ||
                !declaration.initializer ||
                variableStatement.getSourceFile() !== sourceFile ||
                ts.hasModifier(variableStatement, ts.ModifierFlags.Export) ||
                !variableName ||
                !isInsideAwaitableBody(declaration.initializer)) {
                isCompleteFix = false;
                continue;
            }
            const diagnostics = program.getSemanticDiagnostics(sourceFile, cancellationToken);
            const isUsedElsewhere = ts.FindAllReferences.Core.eachSymbolReferenceInFile(variableName, checker, sourceFile, reference => {
                return identifier !== reference && !symbolReferenceIsAlsoMissingAwait(reference, diagnostics, sourceFile, checker);
            });
            if (isUsedElsewhere) {
                isCompleteFix = false;
                continue;
            }
            (initializers || (initializers = [])).push({
                expression: declaration.initializer,
                declarationSymbol: symbol,
            });
        }
        return initializers && {
            initializers,
            needsSecondPassForFixAll: !isCompleteFix,
        };
    }
    interface Identifiers {
        identifiers: readonly ts.Identifier[];
        isCompleteFix: boolean;
    }
    function getIdentifiersFromErrorSpanExpression(expression: ts.Node, checker: ts.TypeChecker): Identifiers | undefined {
        if (ts.isPropertyAccessExpression(expression.parent) && ts.isIdentifier(expression.parent.expression)) {
            return { identifiers: [expression.parent.expression], isCompleteFix: true };
        }
        if (ts.isIdentifier(expression)) {
            return { identifiers: [expression], isCompleteFix: true };
        }
        if (ts.isBinaryExpression(expression)) {
            let sides: ts.Identifier[] | undefined;
            let isCompleteFix = true;
            for (const side of [expression.left, expression.right]) {
                const type = checker.getTypeAtLocation(side);
                if (checker.getPromisedTypeOfPromise(type)) {
                    if (!ts.isIdentifier(side)) {
                        isCompleteFix = false;
                        continue;
                    }
                    (sides || (sides = [])).push(side);
                }
            }
            return sides && { identifiers: sides, isCompleteFix };
        }
    }
    function symbolReferenceIsAlsoMissingAwait(reference: ts.Identifier, diagnostics: readonly ts.Diagnostic[], sourceFile: ts.SourceFile, checker: ts.TypeChecker) {
        const errorNode = ts.isPropertyAccessExpression(reference.parent) ? reference.parent.name :
            ts.isBinaryExpression(reference.parent) ? reference.parent :
                reference;
        const diagnostic = ts.find(diagnostics, diagnostic => diagnostic.start === errorNode.getStart(sourceFile) &&
            diagnostic.start + diagnostic.length! === errorNode.getEnd());
        return diagnostic && ts.contains(errorCodes, diagnostic.code) ||
            // A Promise is usually not correct in a binary expression (it’s not valid
            // in an arithmetic expression and an equality comparison seems unusual),
            // but if the other side of the binary expression has an error, the side
            // is typed `any` which will squash the error that would identify this
            // Promise as an invalid operand. So if the whole binary expression is
            // typed `any` as a result, there is a strong likelihood that this Promise
            // is accidentally missing `await`.
            checker.getTypeAtLocation(errorNode).flags & ts.TypeFlags.Any;
    }
    function isInsideAwaitableBody(node: ts.Node) {
        return node.kind & ts.NodeFlags.AwaitContext || !!ts.findAncestor(node, ancestor => ancestor.parent && ts.isArrowFunction(ancestor.parent) && ancestor.parent.body === ancestor ||
            ts.isBlock(ancestor) && (ancestor.parent.kind === ts.SyntaxKind.FunctionDeclaration ||
                ancestor.parent.kind === ts.SyntaxKind.FunctionExpression ||
                ancestor.parent.kind === ts.SyntaxKind.ArrowFunction ||
                ancestor.parent.kind === ts.SyntaxKind.MethodDeclaration));
    }
    function makeChange(changeTracker: ts.textChanges.ChangeTracker, errorCode: number, sourceFile: ts.SourceFile, checker: ts.TypeChecker, insertionSite: ts.Expression, fixedDeclarations?: ts.Map<true>) {
        if (ts.isBinaryExpression(insertionSite)) {
            for (const side of [insertionSite.left, insertionSite.right]) {
                if (fixedDeclarations && ts.isIdentifier(side)) {
                    const symbol = checker.getSymbolAtLocation(side);
                    if (symbol && fixedDeclarations.has(ts.getSymbolId(symbol).toString())) {
                        continue;
                    }
                }
                const type = checker.getTypeAtLocation(side);
                const newNode = checker.getPromisedTypeOfPromise(type) ? ts.createAwait(side) : side;
                changeTracker.replaceNode(sourceFile, side, newNode);
            }
        }
        else if (errorCode === propertyAccessCode && ts.isPropertyAccessExpression(insertionSite.parent)) {
            if (fixedDeclarations && ts.isIdentifier(insertionSite.parent.expression)) {
                const symbol = checker.getSymbolAtLocation(insertionSite.parent.expression);
                if (symbol && fixedDeclarations.has(ts.getSymbolId(symbol).toString())) {
                    return;
                }
            }
            changeTracker.replaceNode(sourceFile, insertionSite.parent.expression, ts.createParen(ts.createAwait(insertionSite.parent.expression)));
            insertLeadingSemicolonIfNeeded(changeTracker, insertionSite.parent.expression, sourceFile);
        }
        else if (ts.contains(callableConstructableErrorCodes, errorCode) && ts.isCallOrNewExpression(insertionSite.parent)) {
            if (fixedDeclarations && ts.isIdentifier(insertionSite)) {
                const symbol = checker.getSymbolAtLocation(insertionSite);
                if (symbol && fixedDeclarations.has(ts.getSymbolId(symbol).toString())) {
                    return;
                }
            }
            changeTracker.replaceNode(sourceFile, insertionSite, ts.createParen(ts.createAwait(insertionSite)));
            insertLeadingSemicolonIfNeeded(changeTracker, insertionSite, sourceFile);
        }
        else {
            if (fixedDeclarations && ts.isVariableDeclaration(insertionSite.parent) && ts.isIdentifier(insertionSite.parent.name)) {
                const symbol = checker.getSymbolAtLocation(insertionSite.parent.name);
                if (symbol && !ts.addToSeen(fixedDeclarations, ts.getSymbolId(symbol))) {
                    return;
                }
            }
            changeTracker.replaceNode(sourceFile, insertionSite, ts.createAwait(insertionSite));
        }
    }
    function insertLeadingSemicolonIfNeeded(changeTracker: ts.textChanges.ChangeTracker, beforeNode: ts.Node, sourceFile: ts.SourceFile) {
        const precedingToken = ts.findPrecedingToken(beforeNode.pos, sourceFile);
        if (precedingToken && ts.positionIsASICandidate(precedingToken.end, precedingToken.parent, sourceFile)) {
            changeTracker.insertText(sourceFile, beforeNode.getStart(sourceFile), ";");
        }
    }
}
