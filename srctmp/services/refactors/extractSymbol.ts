import * as ts from "../ts";
/* @internal */
const refactorName = "Extract Symbol";
/* @internal */
ts.refactor.registerRefactor(refactorName, { getAvailableActions, getEditsForAction });
/**
 * Compute the associated code actions
 * Exported for tests.
 */
/* @internal */
export function getAvailableActions(context: ts.RefactorContext): readonly ts.ApplicableRefactorInfo[] {
    const rangeToExtract = getRangeToExtract(context.file, ts.getRefactorContextSpan(context));
    const targetRange = rangeToExtract.targetRange;
    if (targetRange === undefined) {
        return ts.emptyArray;
    }
    const extractions = getPossibleExtractions(targetRange, context);
    if (extractions === undefined) {
        // No extractions possible
        return ts.emptyArray;
    }
    const functionActions: ts.RefactorActionInfo[] = [];
    const usedFunctionNames: ts.Map<boolean> = ts.createMap();
    const constantActions: ts.RefactorActionInfo[] = [];
    const usedConstantNames: ts.Map<boolean> = ts.createMap();
    let i = 0;
    for (const { functionExtraction, constantExtraction } of extractions) {
        // Skip these since we don't have a way to report errors yet
        if (functionExtraction.errors.length === 0) {
            // Don't issue refactorings with duplicated names.
            // Scopes come back in "innermost first" order, so extractions will
            // preferentially go into nearer scopes
            const description = functionExtraction.description;
            if (!usedFunctionNames.has(description)) {
                usedFunctionNames.set(description, true);
                functionActions.push({
                    description,
                    name: `function_scope_${i}`
                });
            }
        }
        // Skip these since we don't have a way to report errors yet
        if (constantExtraction.errors.length === 0) {
            // Don't issue refactorings with duplicated names.
            // Scopes come back in "innermost first" order, so extractions will
            // preferentially go into nearer scopes
            const description = constantExtraction.description;
            if (!usedConstantNames.has(description)) {
                usedConstantNames.set(description, true);
                constantActions.push({
                    description,
                    name: `constant_scope_${i}`
                });
            }
        }
        // *do* increment i anyway because we'll look for the i-th scope
        // later when actually doing the refactoring if the user requests it
        i++;
    }
    const infos: ts.ApplicableRefactorInfo[] = [];
    if (constantActions.length) {
        infos.push({
            name: refactorName,
            description: ts.getLocaleSpecificMessage(ts.Diagnostics.Extract_constant),
            actions: constantActions
        });
    }
    if (functionActions.length) {
        infos.push({
            name: refactorName,
            description: ts.getLocaleSpecificMessage(ts.Diagnostics.Extract_function),
            actions: functionActions
        });
    }
    return infos.length ? infos : ts.emptyArray;
}
/* Exported for tests */
/* @internal */
export function getEditsForAction(context: ts.RefactorContext, actionName: string): ts.RefactorEditInfo | undefined {
    const rangeToExtract = getRangeToExtract(context.file, ts.getRefactorContextSpan(context));
    const targetRange = rangeToExtract.targetRange!; // TODO:GH#18217
    const parsedFunctionIndexMatch = /^function_scope_(\d+)$/.exec(actionName);
    if (parsedFunctionIndexMatch) {
        const index = +parsedFunctionIndexMatch[1];
        ts.Debug.assert(isFinite(index), "Expected to parse a finite number from the function scope index");
        return getFunctionExtractionAtIndex(targetRange, context, index);
    }
    const parsedConstantIndexMatch = /^constant_scope_(\d+)$/.exec(actionName);
    if (parsedConstantIndexMatch) {
        const index = +parsedConstantIndexMatch[1];
        ts.Debug.assert(isFinite(index), "Expected to parse a finite number from the constant scope index");
        return getConstantExtractionAtIndex(targetRange, context, index);
    }
    ts.Debug.fail("Unrecognized action name");
}
// Move these into diagnostic messages if they become user-facing
/* @internal */
export namespace Messages {
    function createMessage(message: string): ts.DiagnosticMessage {
        return { message, code: 0, category: ts.DiagnosticCategory.Message, key: message };
    }
    export const cannotExtractRange: ts.DiagnosticMessage = createMessage("Cannot extract range.");
    export const cannotExtractImport: ts.DiagnosticMessage = createMessage("Cannot extract import statement.");
    export const cannotExtractSuper: ts.DiagnosticMessage = createMessage("Cannot extract super call.");
    export const cannotExtractJSDoc: ts.DiagnosticMessage = createMessage("Cannot extract JSDoc.");
    export const cannotExtractEmpty: ts.DiagnosticMessage = createMessage("Cannot extract empty range.");
    export const expressionExpected: ts.DiagnosticMessage = createMessage("expression expected.");
    export const uselessConstantType: ts.DiagnosticMessage = createMessage("No reason to extract constant of type.");
    export const statementOrExpressionExpected: ts.DiagnosticMessage = createMessage("Statement or expression expected.");
    export const cannotExtractRangeContainingConditionalBreakOrContinueStatements: ts.DiagnosticMessage = createMessage("Cannot extract range containing conditional break or continue statements.");
    export const cannotExtractRangeContainingConditionalReturnStatement: ts.DiagnosticMessage = createMessage("Cannot extract range containing conditional return statement.");
    export const cannotExtractRangeContainingLabeledBreakOrContinueStatementWithTargetOutsideOfTheRange: ts.DiagnosticMessage = createMessage("Cannot extract range containing labeled break or continue with target outside of the range.");
    export const cannotExtractRangeThatContainsWritesToReferencesLocatedOutsideOfTheTargetRangeInGenerators: ts.DiagnosticMessage = createMessage("Cannot extract range containing writes to references located outside of the target range in generators.");
    export const typeWillNotBeVisibleInTheNewScope = createMessage("Type will not visible in the new scope.");
    export const functionWillNotBeVisibleInTheNewScope = createMessage("Function will not visible in the new scope.");
    export const cannotExtractIdentifier = createMessage("Select more than a single identifier.");
    export const cannotExtractExportedEntity = createMessage("Cannot extract exported declaration");
    export const cannotWriteInExpression = createMessage("Cannot write back side-effects when extracting an expression");
    export const cannotExtractReadonlyPropertyInitializerOutsideConstructor = createMessage("Cannot move initialization of read-only class property outside of the constructor");
    export const cannotExtractAmbientBlock = createMessage("Cannot extract code from ambient contexts");
    export const cannotAccessVariablesFromNestedScopes = createMessage("Cannot access variables from nested scopes");
    export const cannotExtractToOtherFunctionLike = createMessage("Cannot extract method to a function-like scope that is not a function");
    export const cannotExtractToJSClass = createMessage("Cannot extract constant to a class scope in JS");
    export const cannotExtractToExpressionArrowFunction = createMessage("Cannot extract constant to an arrow function without a block");
}
/* @internal */
enum RangeFacts {
    None = 0,
    HasReturn = 1 << 0,
    IsGenerator = 1 << 1,
    IsAsyncFunction = 1 << 2,
    UsesThis = 1 << 3,
    /**
     * The range is in a function which needs the 'static' modifier in a class
     */
    InStaticRegion = 1 << 4
}
/**
 * Represents an expression or a list of statements that should be extracted with some extra information
 */
/* @internal */
interface TargetRange {
    readonly range: ts.Expression | ts.Statement[];
    readonly facts: RangeFacts;
    /**
     * A list of symbols that are declared in the selected range which are visible in the containing lexical scope
     * Used to ensure we don't turn something used outside the range free (or worse, resolve to a different entity).
     */
    readonly declarations: ts.Symbol[];
}
/**
 * Result of 'getRangeToExtract' operation: contains either a range or a list of errors
 */
/* @internal */
type RangeToExtract = {
    readonly targetRange?: never;
    readonly errors: readonly ts.Diagnostic[];
} | {
    readonly targetRange: TargetRange;
    readonly errors?: never;
};
/*
 * Scopes that can store newly extracted method
 */
/* @internal */
type Scope = ts.FunctionLikeDeclaration | ts.SourceFile | ts.ModuleBlock | ts.ClassLikeDeclaration;
/**
 * getRangeToExtract takes a span inside a text file and returns either an expression or an array
 * of statements representing the minimum set of nodes needed to extract the entire span. This
 * process may fail, in which case a set of errors is returned instead (these are currently
 * not shown to the user, but can be used by us diagnostically)
 */
// exported only for tests
/* @internal */
export function getRangeToExtract(sourceFile: ts.SourceFile, span: ts.TextSpan): RangeToExtract {
    const { length } = span;
    if (length === 0) {
        return { errors: [ts.createFileDiagnostic(sourceFile, span.start, length, Messages.cannotExtractEmpty)] };
    }
    // Walk up starting from the the start position until we find a non-SourceFile node that subsumes the selected span.
    // This may fail (e.g. you select two statements in the root of a source file)
    const start = ts.getParentNodeInSpan(ts.getTokenAtPosition(sourceFile, span.start), sourceFile, span);
    // Do the same for the ending position
    const end = ts.getParentNodeInSpan(ts.findTokenOnLeftOfPosition(sourceFile, ts.textSpanEnd(span)), sourceFile, span);
    const declarations: ts.Symbol[] = [];
    // We'll modify these flags as we walk the tree to collect data
    // about what things need to be done as part of the extraction.
    let rangeFacts = RangeFacts.None;
    if (!start || !end) {
        // cannot find either start or end node
        return { errors: [ts.createFileDiagnostic(sourceFile, span.start, length, Messages.cannotExtractRange)] };
    }
    if (start.parent !== end.parent) {
        // start and end nodes belong to different subtrees
        return { errors: [ts.createFileDiagnostic(sourceFile, span.start, length, Messages.cannotExtractRange)] };
    }
    if (start !== end) {
        // start and end should be statements and parent should be either block or a source file
        if (!isBlockLike(start.parent)) {
            return { errors: [ts.createFileDiagnostic(sourceFile, span.start, length, Messages.cannotExtractRange)] };
        }
        const statements: ts.Statement[] = [];
        const start2 = start; // TODO: GH#18217 Need to alias `start` to get this to compile. See https://github.com/Microsoft/TypeScript/issues/19955#issuecomment-344118248
        for (const statement of (start2.parent as ts.BlockLike).statements) {
            if (statement === start || statements.length) {
                const errors = checkNode(statement);
                if (errors) {
                    return { errors };
                }
                statements.push(statement);
            }
            if (statement === end) {
                break;
            }
        }
        if (!statements.length) {
            // https://github.com/Microsoft/TypeScript/issues/20559
            // Ranges like [|case 1: break;|] will fail to populate `statements` because
            // they will never find `start` in `start.parent.statements`.
            // Consider: We could support ranges like [|case 1:|] by refining them to just
            // the expression.
            return { errors: [ts.createFileDiagnostic(sourceFile, span.start, length, Messages.cannotExtractRange)] };
        }
        return { targetRange: { range: statements, facts: rangeFacts, declarations } };
    }
    if (ts.isJSDoc(start)) {
        return { errors: [ts.createFileDiagnostic(sourceFile, span.start, length, Messages.cannotExtractJSDoc)] };
    }
    if (ts.isReturnStatement(start) && !start.expression) {
        // Makes no sense to extract an expression-less return statement.
        return { errors: [ts.createFileDiagnostic(sourceFile, span.start, length, Messages.cannotExtractRange)] };
    }
    // We have a single node (start)
    const node = refineNode(start);
    const errors = checkRootNode(node) || checkNode(node);
    if (errors) {
        return { errors };
    }
    return { targetRange: { range: getStatementOrExpressionRange(node)!, facts: rangeFacts, declarations } }; // TODO: GH#18217
    /**
     * Attempt to refine the extraction node (generally, by shrinking it) to produce better results.
     * @param node The unrefined extraction node.
     */
    function refineNode(node: ts.Node): ts.Node {
        if (ts.isReturnStatement(node)) {
            if (node.expression) {
                return node.expression;
            }
        }
        else if (ts.isVariableStatement(node)) {
            let numInitializers = 0;
            let lastInitializer: ts.Expression | undefined;
            for (const declaration of node.declarationList.declarations) {
                if (declaration.initializer) {
                    numInitializers++;
                    lastInitializer = declaration.initializer;
                }
            }
            if (numInitializers === 1) {
                return lastInitializer!;
            }
            // No special handling if there are multiple initializers.
        }
        else if (ts.isVariableDeclaration(node)) {
            if (node.initializer) {
                return node.initializer;
            }
        }
        return node;
    }
    function checkRootNode(node: ts.Node): ts.Diagnostic[] | undefined {
        if (ts.isIdentifier(ts.isExpressionStatement(node) ? node.expression : node)) {
            return [ts.createDiagnosticForNode(node, Messages.cannotExtractIdentifier)];
        }
        return undefined;
    }
    function checkForStaticContext(nodeToCheck: ts.Node, containingClass: ts.Node) {
        let current: ts.Node = nodeToCheck;
        while (current !== containingClass) {
            if (current.kind === ts.SyntaxKind.PropertyDeclaration) {
                if (ts.hasModifier(current, ts.ModifierFlags.Static)) {
                    rangeFacts |= RangeFacts.InStaticRegion;
                }
                break;
            }
            else if (current.kind === ts.SyntaxKind.Parameter) {
                const ctorOrMethod = (ts.getContainingFunction(current)!);
                if (ctorOrMethod.kind === ts.SyntaxKind.Constructor) {
                    rangeFacts |= RangeFacts.InStaticRegion;
                }
                break;
            }
            else if (current.kind === ts.SyntaxKind.MethodDeclaration) {
                if (ts.hasModifier(current, ts.ModifierFlags.Static)) {
                    rangeFacts |= RangeFacts.InStaticRegion;
                }
            }
            current = current.parent;
        }
    }
    // Verifies whether we can actually extract this node or not.
    function checkNode(nodeToCheck: ts.Node): ts.Diagnostic[] | undefined {
        const enum PermittedJumps {
            None = 0,
            Break = 1 << 0,
            Continue = 1 << 1,
            Return = 1 << 2
        }
        // We believe it's true because the node is from the (unmodified) tree.
        ts.Debug.assert(nodeToCheck.pos <= nodeToCheck.end, "This failure could trigger https://github.com/Microsoft/TypeScript/issues/20809 (1)");
        // For understanding how skipTrivia functioned:
        ts.Debug.assert(!ts.positionIsSynthesized(nodeToCheck.pos), "This failure could trigger https://github.com/Microsoft/TypeScript/issues/20809 (2)");
        if (!ts.isStatement(nodeToCheck) && !(ts.isExpressionNode(nodeToCheck) && isExtractableExpression(nodeToCheck))) {
            return [ts.createDiagnosticForNode(nodeToCheck, Messages.statementOrExpressionExpected)];
        }
        if (nodeToCheck.flags & ts.NodeFlags.Ambient) {
            return [ts.createDiagnosticForNode(nodeToCheck, Messages.cannotExtractAmbientBlock)];
        }
        // If we're in a class, see whether we're in a static region (static property initializer, static method, class constructor parameter default)
        const containingClass = ts.getContainingClass(nodeToCheck);
        if (containingClass) {
            checkForStaticContext(nodeToCheck, containingClass);
        }
        let errors: ts.Diagnostic[] | undefined;
        let permittedJumps = PermittedJumps.Return;
        let seenLabels: ts.__String[];
        visit(nodeToCheck);
        return errors;
        function visit(node: ts.Node) {
            if (errors) {
                // already found an error - can stop now
                return true;
            }
            if (ts.isDeclaration(node)) {
                const declaringNode = (node.kind === ts.SyntaxKind.VariableDeclaration) ? node.parent.parent : node;
                if (ts.hasModifier(declaringNode, ts.ModifierFlags.Export)) {
                    // TODO: GH#18217 Silly to use `errors ||` since it's definitely not defined (see top of `visit`)
                    // Also, if we're only pushing one error, just use `let error: Diagnostic | undefined`!
                    // Also TODO: GH#19956
                    (errors || (errors = ([] as ts.Diagnostic[]))).push(ts.createDiagnosticForNode(node, Messages.cannotExtractExportedEntity));
                    return true;
                }
                declarations.push(node.symbol);
            }
            // Some things can't be extracted in certain situations
            switch (node.kind) {
                case ts.SyntaxKind.ImportDeclaration:
                    (errors || (errors = ([] as ts.Diagnostic[]))).push(ts.createDiagnosticForNode(node, Messages.cannotExtractImport));
                    return true;
                case ts.SyntaxKind.SuperKeyword:
                    // For a super *constructor call*, we have to be extracting the entire class,
                    // but a super *method call* simply implies a 'this' reference
                    if (node.parent.kind === ts.SyntaxKind.CallExpression) {
                        // Super constructor call
                        const containingClass = (ts.getContainingClass(node)!); // TODO:GH#18217
                        if (containingClass.pos < span.start || containingClass.end >= (span.start + span.length)) {
                            (errors || (errors = ([] as ts.Diagnostic[]))).push(ts.createDiagnosticForNode(node, Messages.cannotExtractSuper));
                            return true;
                        }
                    }
                    else {
                        rangeFacts |= RangeFacts.UsesThis;
                    }
                    break;
            }
            if (ts.isFunctionLikeDeclaration(node) || ts.isClassLike(node)) {
                switch (node.kind) {
                    case ts.SyntaxKind.FunctionDeclaration:
                    case ts.SyntaxKind.ClassDeclaration:
                        if (ts.isSourceFile(node.parent) && node.parent.externalModuleIndicator === undefined) {
                            // You cannot extract global declarations
                            (errors || (errors = ([] as ts.Diagnostic[]))).push(ts.createDiagnosticForNode(node, Messages.functionWillNotBeVisibleInTheNewScope));
                        }
                        break;
                }
                // do not dive into functions or classes
                return false;
            }
            const savedPermittedJumps = permittedJumps;
            switch (node.kind) {
                case ts.SyntaxKind.IfStatement:
                    permittedJumps = PermittedJumps.None;
                    break;
                case ts.SyntaxKind.TryStatement:
                    // forbid all jumps inside try blocks
                    permittedJumps = PermittedJumps.None;
                    break;
                case ts.SyntaxKind.Block:
                    if (node.parent && node.parent.kind === ts.SyntaxKind.TryStatement && (<ts.TryStatement>node.parent).finallyBlock === node) {
                        // allow unconditional returns from finally blocks
                        permittedJumps = PermittedJumps.Return;
                    }
                    break;
                case ts.SyntaxKind.CaseClause:
                    // allow unlabeled break inside case clauses
                    permittedJumps |= PermittedJumps.Break;
                    break;
                default:
                    if (ts.isIterationStatement(node, /*lookInLabeledStatements*/ false)) {
                        // allow unlabeled break/continue inside loops
                        permittedJumps |= PermittedJumps.Break | PermittedJumps.Continue;
                    }
                    break;
            }
            switch (node.kind) {
                case ts.SyntaxKind.ThisType:
                case ts.SyntaxKind.ThisKeyword:
                    rangeFacts |= RangeFacts.UsesThis;
                    break;
                case ts.SyntaxKind.LabeledStatement: {
                    const label = (<ts.LabeledStatement>node).label;
                    (seenLabels || (seenLabels = [])).push(label.escapedText);
                    ts.forEachChild(node, visit);
                    seenLabels.pop();
                    break;
                }
                case ts.SyntaxKind.BreakStatement:
                case ts.SyntaxKind.ContinueStatement: {
                    const label = (<ts.BreakStatement | ts.ContinueStatement>node).label;
                    if (label) {
                        if (!ts.contains(seenLabels, label.escapedText)) {
                            // attempts to jump to label that is not in range to be extracted
                            (errors || (errors = ([] as ts.Diagnostic[]))).push(ts.createDiagnosticForNode(node, Messages.cannotExtractRangeContainingLabeledBreakOrContinueStatementWithTargetOutsideOfTheRange));
                        }
                    }
                    else {
                        if (!(permittedJumps & (node.kind === ts.SyntaxKind.BreakStatement ? PermittedJumps.Break : PermittedJumps.Continue))) {
                            // attempt to break or continue in a forbidden context
                            (errors || (errors = ([] as ts.Diagnostic[]))).push(ts.createDiagnosticForNode(node, Messages.cannotExtractRangeContainingConditionalBreakOrContinueStatements));
                        }
                    }
                    break;
                }
                case ts.SyntaxKind.AwaitExpression:
                    rangeFacts |= RangeFacts.IsAsyncFunction;
                    break;
                case ts.SyntaxKind.YieldExpression:
                    rangeFacts |= RangeFacts.IsGenerator;
                    break;
                case ts.SyntaxKind.ReturnStatement:
                    if (permittedJumps & PermittedJumps.Return) {
                        rangeFacts |= RangeFacts.HasReturn;
                    }
                    else {
                        (errors || (errors = ([] as ts.Diagnostic[]))).push(ts.createDiagnosticForNode(node, Messages.cannotExtractRangeContainingConditionalReturnStatement));
                    }
                    break;
                default:
                    ts.forEachChild(node, visit);
                    break;
            }
            permittedJumps = savedPermittedJumps;
        }
    }
}
/* @internal */
function getStatementOrExpressionRange(node: ts.Node): ts.Statement[] | ts.Expression | undefined {
    if (ts.isStatement(node)) {
        return [node];
    }
    else if (ts.isExpressionNode(node)) {
        // If our selection is the expression in an ExpressionStatement, expand
        // the selection to include the enclosing Statement (this stops us
        // from trying to care about the return value of the extracted function
        // and eliminates double semicolon insertion in certain scenarios)
        return ts.isExpressionStatement(node.parent) ? [node.parent] : node as ts.Expression;
    }
    return undefined;
}
/* @internal */
function isScope(node: ts.Node): node is Scope {
    return ts.isFunctionLikeDeclaration(node) || ts.isSourceFile(node) || ts.isModuleBlock(node) || ts.isClassLike(node);
}
/**
 * Computes possible places we could extract the function into. For example,
 * you may be able to extract into a class method *or* local closure *or* namespace function,
 * depending on what's in the extracted body.
 */
/* @internal */
function collectEnclosingScopes(range: TargetRange): Scope[] {
    let current: ts.Node = isReadonlyArray(range.range) ? ts.first(range.range) : range.range;
    if (range.facts & RangeFacts.UsesThis) {
        // if range uses this as keyword or as type inside the class then it can only be extracted to a method of the containing class
        const containingClass = ts.getContainingClass(current);
        if (containingClass) {
            const containingFunction = ts.findAncestor(current, ts.isFunctionLikeDeclaration);
            return containingFunction
                ? [containingFunction, containingClass]
                : [containingClass];
        }
    }
    const scopes: Scope[] = [];
    while (true) {
        current = current.parent;
        // A function parameter's initializer is actually in the outer scope, not the function declaration
        if (current.kind === ts.SyntaxKind.Parameter) {
            // Skip all the way to the outer scope of the function that declared this parameter
            current = ts.findAncestor(current, parent => ts.isFunctionLikeDeclaration(parent))!.parent;
        }
        // We want to find the nearest parent where we can place an "equivalent" sibling to the node we're extracting out of.
        // Walk up to the closest parent of a place where we can logically put a sibling:
        //  * Function declaration
        //  * Class declaration or expression
        //  * Module/namespace or source file
        if (isScope(current)) {
            scopes.push(current);
            if (current.kind === ts.SyntaxKind.SourceFile) {
                return scopes;
            }
        }
    }
}
/* @internal */
function getFunctionExtractionAtIndex(targetRange: TargetRange, context: ts.RefactorContext, requestedChangesIndex: number): ts.RefactorEditInfo {
    const { scopes, readsAndWrites: { target, usagesPerScope, functionErrorsPerScope, exposedVariableDeclarations } } = getPossibleExtractionsWorker(targetRange, context);
    ts.Debug.assert(!functionErrorsPerScope[requestedChangesIndex].length, "The extraction went missing? How?");
    context.cancellationToken!.throwIfCancellationRequested(); // TODO: GH#18217
    return extractFunctionInScope(target, scopes[requestedChangesIndex], usagesPerScope[requestedChangesIndex], exposedVariableDeclarations, targetRange, context);
}
/* @internal */
function getConstantExtractionAtIndex(targetRange: TargetRange, context: ts.RefactorContext, requestedChangesIndex: number): ts.RefactorEditInfo {
    const { scopes, readsAndWrites: { target, usagesPerScope, constantErrorsPerScope, exposedVariableDeclarations } } = getPossibleExtractionsWorker(targetRange, context);
    ts.Debug.assert(!constantErrorsPerScope[requestedChangesIndex].length, "The extraction went missing? How?");
    ts.Debug.assert(exposedVariableDeclarations.length === 0, "Extract constant accepted a range containing a variable declaration?");
    context.cancellationToken!.throwIfCancellationRequested();
    const expression = ts.isExpression(target)
        ? target
        : (target.statements[0] as ts.ExpressionStatement).expression;
    return extractConstantInScope(expression, scopes[requestedChangesIndex], usagesPerScope[requestedChangesIndex], targetRange.facts, context);
}
/* @internal */
interface Extraction {
    readonly description: string;
    readonly errors: readonly ts.Diagnostic[];
}
/* @internal */
interface ScopeExtractions {
    readonly functionExtraction: Extraction;
    readonly constantExtraction: Extraction;
}
/**
 * Given a piece of text to extract ('targetRange'), computes a list of possible extractions.
 * Each returned ExtractResultForScope corresponds to a possible target scope and is either a set of changes
 * or an error explaining why we can't extract into that scope.
 */
/* @internal */
function getPossibleExtractions(targetRange: TargetRange, context: ts.RefactorContext): readonly ScopeExtractions[] | undefined {
    const { scopes, readsAndWrites: { functionErrorsPerScope, constantErrorsPerScope } } = getPossibleExtractionsWorker(targetRange, context);
    // Need the inner type annotation to avoid https://github.com/Microsoft/TypeScript/issues/7547
    const extractions = scopes.map((scope, i): ScopeExtractions => {
        const functionDescriptionPart = getDescriptionForFunctionInScope(scope);
        const constantDescriptionPart = getDescriptionForConstantInScope(scope);
        const scopeDescription = ts.isFunctionLikeDeclaration(scope)
            ? getDescriptionForFunctionLikeDeclaration(scope)
            : ts.isClassLike(scope)
                ? getDescriptionForClassLikeDeclaration(scope)
                : getDescriptionForModuleLikeDeclaration(scope);
        let functionDescription: string;
        let constantDescription: string;
        if (scopeDescription === SpecialScope.Global) {
            functionDescription = ts.formatStringFromArgs(ts.getLocaleSpecificMessage(ts.Diagnostics.Extract_to_0_in_1_scope), [functionDescriptionPart, "global"]);
            constantDescription = ts.formatStringFromArgs(ts.getLocaleSpecificMessage(ts.Diagnostics.Extract_to_0_in_1_scope), [constantDescriptionPart, "global"]);
        }
        else if (scopeDescription === SpecialScope.Module) {
            functionDescription = ts.formatStringFromArgs(ts.getLocaleSpecificMessage(ts.Diagnostics.Extract_to_0_in_1_scope), [functionDescriptionPart, "module"]);
            constantDescription = ts.formatStringFromArgs(ts.getLocaleSpecificMessage(ts.Diagnostics.Extract_to_0_in_1_scope), [constantDescriptionPart, "module"]);
        }
        else {
            functionDescription = ts.formatStringFromArgs(ts.getLocaleSpecificMessage(ts.Diagnostics.Extract_to_0_in_1), [functionDescriptionPart, scopeDescription]);
            constantDescription = ts.formatStringFromArgs(ts.getLocaleSpecificMessage(ts.Diagnostics.Extract_to_0_in_1), [constantDescriptionPart, scopeDescription]);
        }
        // Customize the phrasing for the innermost scope to increase clarity.
        if (i === 0 && !ts.isClassLike(scope)) {
            constantDescription = ts.formatStringFromArgs(ts.getLocaleSpecificMessage(ts.Diagnostics.Extract_to_0_in_enclosing_scope), [constantDescriptionPart]);
        }
        return {
            functionExtraction: {
                description: functionDescription,
                errors: functionErrorsPerScope[i],
            },
            constantExtraction: {
                description: constantDescription,
                errors: constantErrorsPerScope[i],
            },
        };
    });
    return extractions;
}
/* @internal */
function getPossibleExtractionsWorker(targetRange: TargetRange, context: ts.RefactorContext): {
    readonly scopes: Scope[];
    readonly readsAndWrites: ReadsAndWrites;
} {
    const { file: sourceFile } = context;
    const scopes = collectEnclosingScopes(targetRange);
    const enclosingTextRange = getEnclosingTextRange(targetRange, sourceFile);
    const readsAndWrites = collectReadsAndWrites(targetRange, scopes, enclosingTextRange, sourceFile, context.program.getTypeChecker(), context.cancellationToken!);
    return { scopes, readsAndWrites };
}
/* @internal */
function getDescriptionForFunctionInScope(scope: Scope): string {
    return ts.isFunctionLikeDeclaration(scope)
        ? "inner function"
        : ts.isClassLike(scope)
            ? "method"
            : "function";
}
/* @internal */
function getDescriptionForConstantInScope(scope: Scope): string {
    return ts.isClassLike(scope)
        ? "readonly field"
        : "constant";
}
/* @internal */
function getDescriptionForFunctionLikeDeclaration(scope: ts.FunctionLikeDeclaration): string {
    switch (scope.kind) {
        case ts.SyntaxKind.Constructor:
            return "constructor";
        case ts.SyntaxKind.FunctionExpression:
        case ts.SyntaxKind.FunctionDeclaration:
            return scope.name
                ? `function '${scope.name.text}'`
                : "anonymous function";
        case ts.SyntaxKind.ArrowFunction:
            return "arrow function";
        case ts.SyntaxKind.MethodDeclaration:
            return `method '${scope.name.getText()}'`;
        case ts.SyntaxKind.GetAccessor:
            return `'get ${scope.name.getText()}'`;
        case ts.SyntaxKind.SetAccessor:
            return `'set ${scope.name.getText()}'`;
        default:
            throw ts.Debug.assertNever(scope, `Unexpected scope kind ${(scope as ts.FunctionLikeDeclaration).kind}`);
    }
}
/* @internal */
function getDescriptionForClassLikeDeclaration(scope: ts.ClassLikeDeclaration): string {
    return scope.kind === ts.SyntaxKind.ClassDeclaration
        ? scope.name ? `class '${scope.name.text}'` : "anonymous class declaration"
        : scope.name ? `class expression '${scope.name.text}'` : "anonymous class expression";
}
/* @internal */
function getDescriptionForModuleLikeDeclaration(scope: ts.SourceFile | ts.ModuleBlock): string | SpecialScope {
    return scope.kind === ts.SyntaxKind.ModuleBlock
        ? `namespace '${scope.parent.name.getText()}'`
        : scope.externalModuleIndicator ? SpecialScope.Module : SpecialScope.Global;
}
/* @internal */
const enum SpecialScope {
    Module,
    Global
}
/**
 * Result of 'extractRange' operation for a specific scope.
 * Stores either a list of changes that should be applied to extract a range or a list of errors
 */
/* @internal */
function extractFunctionInScope(node: ts.Statement | ts.Expression | ts.Block, scope: Scope, { usages: usagesInScope, typeParameterUsages, substitutions }: ScopeUsages, exposedVariableDeclarations: readonly ts.VariableDeclaration[], range: TargetRange, context: ts.RefactorContext): ts.RefactorEditInfo {
    const checker = context.program.getTypeChecker();
    // Make a unique name for the extracted function
    const file = scope.getSourceFile();
    const functionNameText = ts.getUniqueName(ts.isClassLike(scope) ? "newMethod" : "newFunction", file);
    const isJS = ts.isInJSFile(scope);
    const functionName = ts.createIdentifier(functionNameText);
    let returnType: ts.TypeNode | undefined;
    const parameters: ts.ParameterDeclaration[] = [];
    const callArguments: ts.Identifier[] = [];
    let writes: UsageEntry[] | undefined;
    usagesInScope.forEach((usage, name) => {
        let typeNode: ts.TypeNode | undefined;
        if (!isJS) {
            let type = checker.getTypeOfSymbolAtLocation(usage.symbol, usage.node);
            // Widen the type so we don't emit nonsense annotations like "function fn(x: 3) {"
            type = checker.getBaseTypeOfLiteralType(type);
            typeNode = checker.typeToTypeNode(type, scope, ts.NodeBuilderFlags.NoTruncation);
        }
        const paramDecl = ts.createParameter(
        /*decorators*/ undefined, 
        /*modifiers*/ undefined, 
        /*dotDotDotToken*/ undefined, 
        /*name*/ name, 
        /*questionToken*/ undefined, typeNode);
        parameters.push(paramDecl);
        if (usage.usage === Usage.Write) {
            (writes || (writes = [])).push(usage);
        }
        callArguments.push(ts.createIdentifier(name));
    });
    const typeParametersAndDeclarations = ts.arrayFrom(typeParameterUsages.values()).map(type => ({ type, declaration: getFirstDeclaration(type) }));
    const sortedTypeParametersAndDeclarations = typeParametersAndDeclarations.sort(compareTypesByDeclarationOrder);
    const typeParameters: readonly ts.TypeParameterDeclaration[] | undefined = sortedTypeParametersAndDeclarations.length === 0
        ? undefined
        : sortedTypeParametersAndDeclarations.map(t => t.declaration as ts.TypeParameterDeclaration);
    // Strictly speaking, we should check whether each name actually binds to the appropriate type
    // parameter.  In cases of shadowing, they may not.
    const callTypeArguments: readonly ts.TypeNode[] | undefined = typeParameters !== undefined
        ? typeParameters.map(decl => ts.createTypeReferenceNode(decl.name, /*typeArguments*/ undefined))
        : undefined;
    // Provide explicit return types for contextually-typed functions
    // to avoid problems when there are literal types present
    if (ts.isExpression(node) && !isJS) {
        const contextualType = checker.getContextualType(node);
        returnType = checker.typeToTypeNode((contextualType!), scope, ts.NodeBuilderFlags.NoTruncation); // TODO: GH#18217
    }
    const { body, returnValueProperty } = transformFunctionBody(node, exposedVariableDeclarations, writes, substitutions, !!(range.facts & RangeFacts.HasReturn));
    ts.suppressLeadingAndTrailingTrivia(body);
    let newFunction: ts.MethodDeclaration | ts.FunctionDeclaration;
    if (ts.isClassLike(scope)) {
        // always create private method in TypeScript files
        const modifiers: ts.Modifier[] = isJS ? [] : [ts.createToken(ts.SyntaxKind.PrivateKeyword)];
        if (range.facts & RangeFacts.InStaticRegion) {
            modifiers.push(ts.createToken(ts.SyntaxKind.StaticKeyword));
        }
        if (range.facts & RangeFacts.IsAsyncFunction) {
            modifiers.push(ts.createToken(ts.SyntaxKind.AsyncKeyword));
        }
        newFunction = ts.createMethod(
        /*decorators*/ undefined, modifiers.length ? modifiers : undefined, range.facts & RangeFacts.IsGenerator ? ts.createToken(ts.SyntaxKind.AsteriskToken) : undefined, functionName, 
        /*questionToken*/ undefined, typeParameters, parameters, returnType, body);
    }
    else {
        newFunction = ts.createFunctionDeclaration(
        /*decorators*/ undefined, range.facts & RangeFacts.IsAsyncFunction ? [ts.createToken(ts.SyntaxKind.AsyncKeyword)] : undefined, range.facts & RangeFacts.IsGenerator ? ts.createToken(ts.SyntaxKind.AsteriskToken) : undefined, functionName, typeParameters, parameters, returnType, body);
    }
    const changeTracker = ts.textChanges.ChangeTracker.fromContext(context);
    const minInsertionPos = (isReadonlyArray(range.range) ? ts.last(range.range) : range.range).end;
    const nodeToInsertBefore = getNodeToInsertFunctionBefore(minInsertionPos, scope);
    if (nodeToInsertBefore) {
        changeTracker.insertNodeBefore(context.file, nodeToInsertBefore, newFunction, /*blankLineBetween*/ true);
    }
    else {
        changeTracker.insertNodeAtEndOfScope(context.file, scope, newFunction);
    }
    const newNodes: ts.Node[] = [];
    // replace range with function call
    const called = getCalledExpression(scope, range, functionNameText);
    let call: ts.Expression = ts.createCall(called, callTypeArguments, // Note that no attempt is made to take advantage of type argument inference
    callArguments);
    if (range.facts & RangeFacts.IsGenerator) {
        call = ts.createYield(ts.createToken(ts.SyntaxKind.AsteriskToken), call);
    }
    if (range.facts & RangeFacts.IsAsyncFunction) {
        call = ts.createAwait(call);
    }
    if (exposedVariableDeclarations.length && !writes) {
        // No need to mix declarations and writes.
        // How could any variables be exposed if there's a return statement?
        ts.Debug.assert(!returnValueProperty, "Expected no returnValueProperty");
        ts.Debug.assert(!(range.facts & RangeFacts.HasReturn), "Expected RangeFacts.HasReturn flag to be unset");
        if (exposedVariableDeclarations.length === 1) {
            // Declaring exactly one variable: let x = newFunction();
            const variableDeclaration = exposedVariableDeclarations[0];
            newNodes.push(ts.createVariableStatement(
            /*modifiers*/ undefined, ts.createVariableDeclarationList([ts.createVariableDeclaration(ts.getSynthesizedDeepClone(variableDeclaration.name), /*type*/ ts.getSynthesizedDeepClone(variableDeclaration.type), /*initializer*/ call)], // TODO (acasey): test binding patterns
            variableDeclaration.parent.flags)));
        }
        else {
            // Declaring multiple variables / return properties:
            //   let {x, y} = newFunction();
            const bindingElements: ts.BindingElement[] = [];
            const typeElements: ts.TypeElement[] = [];
            let commonNodeFlags = exposedVariableDeclarations[0].parent.flags;
            let sawExplicitType = false;
            for (const variableDeclaration of exposedVariableDeclarations) {
                bindingElements.push(ts.createBindingElement(
                /*dotDotDotToken*/ undefined, 
                /*propertyName*/ undefined, 
                /*name*/ ts.getSynthesizedDeepClone(variableDeclaration.name)));
                // Being returned through an object literal will have widened the type.
                const variableType: ts.TypeNode | undefined = checker.typeToTypeNode(checker.getBaseTypeOfLiteralType(checker.getTypeAtLocation(variableDeclaration)), scope, ts.NodeBuilderFlags.NoTruncation);
                typeElements.push(ts.createPropertySignature(
                /*modifiers*/ undefined, 
                /*name*/ variableDeclaration.symbol.name, 
                /*questionToken*/ undefined, 
                /*type*/ variableType, 
                /*initializer*/ undefined));
                sawExplicitType = sawExplicitType || variableDeclaration.type !== undefined;
                commonNodeFlags = commonNodeFlags & variableDeclaration.parent.flags;
            }
            const typeLiteral: ts.TypeLiteralNode | undefined = sawExplicitType ? ts.createTypeLiteralNode(typeElements) : undefined;
            if (typeLiteral) {
                ts.setEmitFlags(typeLiteral, ts.EmitFlags.SingleLine);
            }
            newNodes.push(ts.createVariableStatement(
            /*modifiers*/ undefined, ts.createVariableDeclarationList([ts.createVariableDeclaration(ts.createObjectBindingPattern(bindingElements), 
                /*type*/ typeLiteral, 
                /*initializer*/ call)], commonNodeFlags)));
        }
    }
    else if (exposedVariableDeclarations.length || writes) {
        if (exposedVariableDeclarations.length) {
            // CONSIDER: we're going to create one statement per variable, but we could actually preserve their original grouping.
            for (const variableDeclaration of exposedVariableDeclarations) {
                let flags: ts.NodeFlags = variableDeclaration.parent.flags;
                if (flags & ts.NodeFlags.Const) {
                    flags = (flags & ~ts.NodeFlags.Const) | ts.NodeFlags.Let;
                }
                newNodes.push(ts.createVariableStatement(
                /*modifiers*/ undefined, ts.createVariableDeclarationList([ts.createVariableDeclaration(variableDeclaration.symbol.name, getTypeDeepCloneUnionUndefined(variableDeclaration.type))], flags)));
            }
        }
        if (returnValueProperty) {
            // has both writes and return, need to create variable declaration to hold return value;
            newNodes.push(ts.createVariableStatement(
            /*modifiers*/ undefined, ts.createVariableDeclarationList([ts.createVariableDeclaration(returnValueProperty, getTypeDeepCloneUnionUndefined(returnType))], ts.NodeFlags.Let)));
        }
        const assignments = getPropertyAssignmentsForWritesAndVariableDeclarations(exposedVariableDeclarations, writes);
        if (returnValueProperty) {
            assignments.unshift(ts.createShorthandPropertyAssignment(returnValueProperty));
        }
        // propagate writes back
        if (assignments.length === 1) {
            // We would only have introduced a return value property if there had been
            // other assignments to make.
            ts.Debug.assert(!returnValueProperty, "Shouldn't have returnValueProperty here");
            newNodes.push(ts.createStatement(ts.createAssignment(assignments[0].name, call)));
            if (range.facts & RangeFacts.HasReturn) {
                newNodes.push(ts.createReturn());
            }
        }
        else {
            // emit e.g.
            //   { a, b, __return } = newFunction(a, b);
            //   return __return;
            newNodes.push(ts.createStatement(ts.createAssignment(ts.createObjectLiteral(assignments), call)));
            if (returnValueProperty) {
                newNodes.push(ts.createReturn(ts.createIdentifier(returnValueProperty)));
            }
        }
    }
    else {
        if (range.facts & RangeFacts.HasReturn) {
            newNodes.push(ts.createReturn(call));
        }
        else if (isReadonlyArray(range.range)) {
            newNodes.push(ts.createStatement(call));
        }
        else {
            newNodes.push(call);
        }
    }
    if (isReadonlyArray(range.range)) {
        changeTracker.replaceNodeRangeWithNodes(context.file, ts.first(range.range), ts.last(range.range), newNodes);
    }
    else {
        changeTracker.replaceNodeWithNodes(context.file, range.range, newNodes);
    }
    const edits = changeTracker.getChanges();
    const renameRange = isReadonlyArray(range.range) ? ts.first(range.range) : range.range;
    const renameFilename = renameRange.getSourceFile().fileName;
    const renameLocation = ts.getRenameLocation(edits, renameFilename, functionNameText, /*isDeclaredBeforeUse*/ false);
    return { renameFilename, renameLocation, edits };
    function getTypeDeepCloneUnionUndefined(typeNode: ts.TypeNode | undefined): ts.TypeNode | undefined {
        if (typeNode === undefined) {
            return undefined;
        }
        const clone = ts.getSynthesizedDeepClone(typeNode);
        let withoutParens = clone;
        while (ts.isParenthesizedTypeNode(withoutParens)) {
            withoutParens = withoutParens.type;
        }
        return ts.isUnionTypeNode(withoutParens) && ts.find(withoutParens.types, t => t.kind === ts.SyntaxKind.UndefinedKeyword)
            ? clone
            : ts.createUnionTypeNode([clone, ts.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)]);
    }
}
/**
 * Result of 'extractRange' operation for a specific scope.
 * Stores either a list of changes that should be applied to extract a range or a list of errors
 */
/* @internal */
function extractConstantInScope(node: ts.Expression, scope: Scope, { substitutions }: ScopeUsages, rangeFacts: RangeFacts, context: ts.RefactorContext): ts.RefactorEditInfo {
    const checker = context.program.getTypeChecker();
    // Make a unique name for the extracted variable
    const file = scope.getSourceFile();
    const localNameText = ts.getUniqueName(ts.isClassLike(scope) ? "newProperty" : "newLocal", file);
    const isJS = ts.isInJSFile(scope);
    let variableType = isJS || !checker.isContextSensitive(node)
        ? undefined
        : checker.typeToTypeNode((checker.getContextualType(node)!), scope, ts.NodeBuilderFlags.NoTruncation); // TODO: GH#18217
    let initializer = transformConstantInitializer(node, substitutions);
    ({ variableType, initializer } = transformFunctionInitializerAndType(variableType, initializer));
    ts.suppressLeadingAndTrailingTrivia(initializer);
    const changeTracker = ts.textChanges.ChangeTracker.fromContext(context);
    if (ts.isClassLike(scope)) {
        ts.Debug.assert(!isJS, "Cannot extract to a JS class"); // See CannotExtractToJSClass
        const modifiers: ts.Modifier[] = [];
        modifiers.push(ts.createToken(ts.SyntaxKind.PrivateKeyword));
        if (rangeFacts & RangeFacts.InStaticRegion) {
            modifiers.push(ts.createToken(ts.SyntaxKind.StaticKeyword));
        }
        modifiers.push(ts.createToken(ts.SyntaxKind.ReadonlyKeyword));
        const newVariable = ts.createProperty(
        /*decorators*/ undefined, modifiers, localNameText, 
        /*questionToken*/ undefined, variableType, initializer);
        const localReference = ts.createPropertyAccess(rangeFacts & RangeFacts.InStaticRegion
            ? ts.createIdentifier(scope.name!.getText()) // TODO: GH#18217
            : ts.createThis(), ts.createIdentifier(localNameText));
        // Declare
        const maxInsertionPos = node.pos;
        const nodeToInsertBefore = getNodeToInsertPropertyBefore(maxInsertionPos, scope);
        changeTracker.insertNodeBefore(context.file, nodeToInsertBefore, newVariable, /*blankLineBetween*/ true);
        // Consume
        changeTracker.replaceNode(context.file, node, localReference);
    }
    else {
        const newVariableDeclaration = ts.createVariableDeclaration(localNameText, variableType, initializer);
        // If the node is part of an initializer in a list of variable declarations, insert a new
        // variable declaration into the list (in case it depends on earlier ones).
        // CONSIDER: If the declaration list isn't const, we might want to split it into multiple
        // lists so that the newly extracted one can be const.
        const oldVariableDeclaration = getContainingVariableDeclarationIfInList(node, scope);
        if (oldVariableDeclaration) {
            // Declare
            // CONSIDER: could detect that each is on a separate line (See `extractConstant_VariableList_MultipleLines` in `extractConstants.ts`)
            changeTracker.insertNodeBefore(context.file, oldVariableDeclaration, newVariableDeclaration);
            // Consume
            const localReference = ts.createIdentifier(localNameText);
            changeTracker.replaceNode(context.file, node, localReference);
        }
        else if (node.parent.kind === ts.SyntaxKind.ExpressionStatement && scope === ts.findAncestor(node, isScope)) {
            // If the parent is an expression statement and the target scope is the immediately enclosing one,
            // replace the statement with the declaration.
            const newVariableStatement = ts.createVariableStatement(
            /*modifiers*/ undefined, ts.createVariableDeclarationList([newVariableDeclaration], ts.NodeFlags.Const));
            changeTracker.replaceNode(context.file, node.parent, newVariableStatement);
        }
        else {
            const newVariableStatement = ts.createVariableStatement(
            /*modifiers*/ undefined, ts.createVariableDeclarationList([newVariableDeclaration], ts.NodeFlags.Const));
            // Declare
            const nodeToInsertBefore = getNodeToInsertConstantBefore(node, scope);
            if (nodeToInsertBefore.pos === 0) {
                changeTracker.insertNodeAtTopOfFile(context.file, newVariableStatement, /*blankLineBetween*/ false);
            }
            else {
                changeTracker.insertNodeBefore(context.file, nodeToInsertBefore, newVariableStatement, /*blankLineBetween*/ false);
            }
            // Consume
            if (node.parent.kind === ts.SyntaxKind.ExpressionStatement) {
                // If the parent is an expression statement, delete it.
                changeTracker.delete(context.file, node.parent);
            }
            else {
                const localReference = ts.createIdentifier(localNameText);
                changeTracker.replaceNode(context.file, node, localReference);
            }
        }
    }
    const edits = changeTracker.getChanges();
    const renameFilename = node.getSourceFile().fileName;
    const renameLocation = ts.getRenameLocation(edits, renameFilename, localNameText, /*isDeclaredBeforeUse*/ true);
    return { renameFilename, renameLocation, edits };
    function transformFunctionInitializerAndType(variableType: ts.TypeNode | undefined, initializer: ts.Expression): {
        variableType: ts.TypeNode | undefined;
        initializer: ts.Expression;
    } {
        // If no contextual type exists there is nothing to transfer to the function signature
        if (variableType === undefined)
            return { variableType, initializer };
        // Only do this for function expressions and arrow functions that are not generic
        if (!ts.isFunctionExpression(initializer) && !ts.isArrowFunction(initializer) || !!initializer.typeParameters)
            return { variableType, initializer };
        const functionType = checker.getTypeAtLocation(node);
        const functionSignature = ts.singleOrUndefined(checker.getSignaturesOfType(functionType, ts.SignatureKind.Call));
        // If no function signature, maybe there was an error, do nothing
        if (!functionSignature)
            return { variableType, initializer };
        // If the function signature has generic type parameters we don't attempt to move the parameters
        if (!!functionSignature.getTypeParameters())
            return { variableType, initializer };
        // We add parameter types if needed
        const parameters: ts.ParameterDeclaration[] = [];
        let hasAny = false;
        for (const p of initializer.parameters) {
            if (p.type) {
                parameters.push(p);
            }
            else {
                const paramType = checker.getTypeAtLocation(p);
                if (paramType === checker.getAnyType())
                    hasAny = true;
                parameters.push(ts.updateParameter(p, p.decorators, p.modifiers, p.dotDotDotToken, p.name, p.questionToken, p.type || checker.typeToTypeNode(paramType, scope, ts.NodeBuilderFlags.NoTruncation), p.initializer));
            }
        }
        // If a parameter was inferred as any we skip adding function parameters at all.
        // Turning an implicit any (which under common settings is a error) to an explicit
        // is probably actually a worse refactor outcome.
        if (hasAny)
            return { variableType, initializer };
        variableType = undefined;
        if (ts.isArrowFunction(initializer)) {
            initializer = ts.updateArrowFunction(initializer, node.modifiers, initializer.typeParameters, parameters, initializer.type || checker.typeToTypeNode(functionSignature.getReturnType(), scope, ts.NodeBuilderFlags.NoTruncation), initializer.equalsGreaterThanToken, initializer.body);
        }
        else {
            if (functionSignature && !!functionSignature.thisParameter) {
                const firstParameter = ts.firstOrUndefined(parameters);
                // If the function signature has a this parameter and if the first defined parameter is not the this parameter, we must add it
                // Note: If this parameter was already there, it would have been previously updated with the type if not type was present
                if ((!firstParameter || (ts.isIdentifier(firstParameter.name) && firstParameter.name.escapedText !== "this"))) {
                    const thisType = checker.getTypeOfSymbolAtLocation(functionSignature.thisParameter, node);
                    parameters.splice(0, 0, ts.createParameter(
                    /* decorators */ undefined, 
                    /* modifiers */ undefined, 
                    /* dotDotDotToken */ undefined, "this", 
                    /* questionToken */ undefined, checker.typeToTypeNode(thisType, scope, ts.NodeBuilderFlags.NoTruncation)));
                }
            }
            initializer = ts.updateFunctionExpression(initializer, node.modifiers, initializer.asteriskToken, initializer.name, initializer.typeParameters, parameters, initializer.type || checker.typeToTypeNode(functionSignature.getReturnType(), scope, ts.NodeBuilderFlags.NoTruncation), initializer.body);
        }
        return { variableType, initializer };
    }
}
/* @internal */
function getContainingVariableDeclarationIfInList(node: ts.Node, scope: Scope) {
    let prevNode;
    while (node !== undefined && node !== scope) {
        if (ts.isVariableDeclaration(node) &&
            node.initializer === prevNode &&
            ts.isVariableDeclarationList(node.parent) &&
            node.parent.declarations.length > 1) {
            return node;
        }
        prevNode = node;
        node = node.parent;
    }
}
/* @internal */
function getFirstDeclaration(type: ts.Type): ts.Declaration | undefined {
    let firstDeclaration;
    const symbol = type.symbol;
    if (symbol && symbol.declarations) {
        for (const declaration of symbol.declarations) {
            if (firstDeclaration === undefined || declaration.pos < firstDeclaration.pos) {
                firstDeclaration = declaration;
            }
        }
    }
    return firstDeclaration;
}
/* @internal */
function compareTypesByDeclarationOrder({ type: type1, declaration: declaration1 }: {
    type: ts.Type;
    declaration?: ts.Declaration;
}, { type: type2, declaration: declaration2 }: {
    type: ts.Type;
    declaration?: ts.Declaration;
}) {
    return ts.compareProperties(declaration1, declaration2, "pos", ts.compareValues)
        || ts.compareStringsCaseSensitive(type1.symbol ? type1.symbol.getName() : "", type2.symbol ? type2.symbol.getName() : "")
        || ts.compareValues(type1.id, type2.id);
}
/* @internal */
function getCalledExpression(scope: ts.Node, range: TargetRange, functionNameText: string): ts.Expression {
    const functionReference = ts.createIdentifier(functionNameText);
    if (ts.isClassLike(scope)) {
        const lhs = range.facts & RangeFacts.InStaticRegion ? ts.createIdentifier(scope.name!.text) : ts.createThis(); // TODO: GH#18217
        return ts.createPropertyAccess(lhs, functionReference);
    }
    else {
        return functionReference;
    }
}
/* @internal */
function transformFunctionBody(body: ts.Node, exposedVariableDeclarations: readonly ts.VariableDeclaration[], writes: readonly UsageEntry[] | undefined, substitutions: ts.ReadonlyMap<ts.Node>, hasReturn: boolean): {
    body: ts.Block;
    returnValueProperty: string | undefined;
} {
    const hasWritesOrVariableDeclarations = writes !== undefined || exposedVariableDeclarations.length > 0;
    if (ts.isBlock(body) && !hasWritesOrVariableDeclarations && substitutions.size === 0) {
        // already block, no declarations or writes to propagate back, no substitutions - can use node as is
        return { body: ts.createBlock(body.statements, /*multLine*/ true), returnValueProperty: undefined };
    }
    let returnValueProperty: string | undefined;
    let ignoreReturns = false;
    const statements = ts.createNodeArray(ts.isBlock(body) ? body.statements.slice(0) : [ts.isStatement(body) ? body : ts.createReturn((<ts.Expression>body))]);
    // rewrite body if either there are writes that should be propagated back via return statements or there are substitutions
    if (hasWritesOrVariableDeclarations || substitutions.size) {
        const rewrittenStatements = ts.visitNodes(statements, visitor).slice();
        if (hasWritesOrVariableDeclarations && !hasReturn && ts.isStatement(body)) {
            // add return at the end to propagate writes back in case if control flow falls out of the function body
            // it is ok to know that range has at least one return since it we only allow unconditional returns
            const assignments = getPropertyAssignmentsForWritesAndVariableDeclarations(exposedVariableDeclarations, writes);
            if (assignments.length === 1) {
                rewrittenStatements.push(ts.createReturn(assignments[0].name));
            }
            else {
                rewrittenStatements.push(ts.createReturn(ts.createObjectLiteral(assignments)));
            }
        }
        return { body: ts.createBlock(rewrittenStatements, /*multiLine*/ true), returnValueProperty };
    }
    else {
        return { body: ts.createBlock(statements, /*multiLine*/ true), returnValueProperty: undefined };
    }
    function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
        if (!ignoreReturns && node.kind === ts.SyntaxKind.ReturnStatement && hasWritesOrVariableDeclarations) {
            const assignments: ts.ObjectLiteralElementLike[] = getPropertyAssignmentsForWritesAndVariableDeclarations(exposedVariableDeclarations, writes);
            if ((<ts.ReturnStatement>node).expression) {
                if (!returnValueProperty) {
                    returnValueProperty = "__return";
                }
                assignments.unshift(ts.createPropertyAssignment(returnValueProperty, ts.visitNode((<ts.ReturnStatement>node).expression, visitor)));
            }
            if (assignments.length === 1) {
                return ts.createReturn((assignments[0].name as ts.Expression));
            }
            else {
                return ts.createReturn(ts.createObjectLiteral(assignments));
            }
        }
        else {
            const oldIgnoreReturns = ignoreReturns;
            ignoreReturns = ignoreReturns || ts.isFunctionLikeDeclaration(node) || ts.isClassLike(node);
            const substitution = substitutions.get(ts.getNodeId(node).toString());
            const result = substitution ? ts.getSynthesizedDeepClone(substitution) : ts.visitEachChild(node, visitor, ts.nullTransformationContext);
            ignoreReturns = oldIgnoreReturns;
            return result;
        }
    }
}
/* @internal */
function transformConstantInitializer(initializer: ts.Expression, substitutions: ts.ReadonlyMap<ts.Node>): ts.Expression {
    return substitutions.size
        ? visitor(initializer) as ts.Expression
        : initializer;
    function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
        const substitution = substitutions.get(ts.getNodeId(node).toString());
        return substitution ? ts.getSynthesizedDeepClone(substitution) : ts.visitEachChild(node, visitor, ts.nullTransformationContext);
    }
}
/* @internal */
function getStatementsOrClassElements(scope: Scope): readonly ts.Statement[] | readonly ts.ClassElement[] {
    if (ts.isFunctionLikeDeclaration(scope)) {
        const body = scope.body!; // TODO: GH#18217
        if (ts.isBlock(body)) {
            return body.statements;
        }
    }
    else if (ts.isModuleBlock(scope) || ts.isSourceFile(scope)) {
        return scope.statements;
    }
    else if (ts.isClassLike(scope)) {
        return scope.members;
    }
    else {
        ts.assertType<never>(scope);
    }
    return ts.emptyArray;
}
/**
 * If `scope` contains a function after `minPos`, then return the first such function.
 * Otherwise, return `undefined`.
 */
/* @internal */
function getNodeToInsertFunctionBefore(minPos: number, scope: Scope): ts.Statement | ts.ClassElement | undefined {
    return ts.find<ts.Statement | ts.ClassElement>(getStatementsOrClassElements(scope), child => child.pos >= minPos && ts.isFunctionLikeDeclaration(child) && !ts.isConstructorDeclaration(child));
}
/* @internal */
function getNodeToInsertPropertyBefore(maxPos: number, scope: ts.ClassLikeDeclaration): ts.ClassElement {
    const members = scope.members;
    ts.Debug.assert(members.length > 0, "Found no members"); // There must be at least one child, since we extracted from one.
    let prevMember: ts.ClassElement | undefined;
    let allProperties = true;
    for (const member of members) {
        if (member.pos > maxPos) {
            return prevMember || members[0];
        }
        if (allProperties && !ts.isPropertyDeclaration(member)) {
            // If it is non-vacuously true that all preceding members are properties,
            // insert before the current member (i.e. at the end of the list of properties).
            if (prevMember !== undefined) {
                return member;
            }
            allProperties = false;
        }
        prevMember = member;
    }
    if (prevMember === undefined)
        return ts.Debug.fail(); // If the loop didn't return, then it did set prevMember.
    return prevMember;
}
/* @internal */
function getNodeToInsertConstantBefore(node: ts.Node, scope: Scope): ts.Statement {
    ts.Debug.assert(!ts.isClassLike(scope));
    let prevScope: Scope | undefined;
    for (let curr = node; curr !== scope; curr = curr.parent) {
        if (isScope(curr)) {
            prevScope = curr;
        }
    }
    for (let curr = (prevScope || node).parent;; curr = curr.parent) {
        if (isBlockLike(curr)) {
            let prevStatement: ts.Statement | undefined;
            for (const statement of curr.statements) {
                if (statement.pos > node.pos) {
                    break;
                }
                prevStatement = statement;
            }
            if (!prevStatement && ts.isCaseClause(curr)) {
                // We must have been in the expression of the case clause.
                ts.Debug.assert(ts.isSwitchStatement(curr.parent.parent), "Grandparent isn't a switch statement");
                return curr.parent.parent;
            }
            // There must be at least one statement since we started in one.
            return ts.Debug.assertDefined(prevStatement, "prevStatement failed to get set");
        }
        ts.Debug.assert(curr !== scope, "Didn't encounter a block-like before encountering scope");
    }
}
/* @internal */
function getPropertyAssignmentsForWritesAndVariableDeclarations(exposedVariableDeclarations: readonly ts.VariableDeclaration[], writes: readonly UsageEntry[] | undefined): ts.ShorthandPropertyAssignment[] {
    const variableAssignments = ts.map(exposedVariableDeclarations, v => ts.createShorthandPropertyAssignment(v.symbol.name));
    const writeAssignments = ts.map(writes, w => ts.createShorthandPropertyAssignment(w.symbol.name));
    // TODO: GH#18217 `variableAssignments` not possibly undefined!
    return variableAssignments === undefined
        ? writeAssignments!
        : writeAssignments === undefined
            ? variableAssignments
            : variableAssignments.concat(writeAssignments);
}
/* @internal */
function isReadonlyArray(v: any): v is readonly any[] {
    return ts.isArray(v);
}
/**
 * Produces a range that spans the entirety of nodes, given a selection
 * that might start/end in the middle of nodes.
 *
 * For example, when the user makes a selection like this
 *                     v---v
 *   var someThing = foo + bar;
 *  this returns     ^-------^
 */
/* @internal */
function getEnclosingTextRange(targetRange: TargetRange, sourceFile: ts.SourceFile): ts.TextRange {
    return isReadonlyArray(targetRange.range)
        ? { pos: ts.first(targetRange.range).getStart(sourceFile), end: ts.last(targetRange.range).getEnd() }
        : targetRange.range;
}
/* @internal */
const enum Usage {
    // value should be passed to extracted method
    Read = 1,
    // value should be passed to extracted method and propagated back
    Write = 2
}
/* @internal */
interface UsageEntry {
    readonly usage: Usage;
    readonly symbol: ts.Symbol;
    readonly node: ts.Node;
}
/* @internal */
interface ScopeUsages {
    readonly usages: ts.Map<UsageEntry>;
    readonly typeParameterUsages: ts.Map<ts.TypeParameter>; // Key is type ID
    readonly substitutions: ts.Map<ts.Node>;
}
/* @internal */
interface ReadsAndWrites {
    readonly target: ts.Expression | ts.Block;
    readonly usagesPerScope: readonly ScopeUsages[];
    readonly functionErrorsPerScope: readonly (readonly ts.Diagnostic[])[];
    readonly constantErrorsPerScope: readonly (readonly ts.Diagnostic[])[];
    readonly exposedVariableDeclarations: readonly ts.VariableDeclaration[];
}
/* @internal */
function collectReadsAndWrites(targetRange: TargetRange, scopes: Scope[], enclosingTextRange: ts.TextRange, sourceFile: ts.SourceFile, checker: ts.TypeChecker, cancellationToken: ts.CancellationToken): ReadsAndWrites {
    const allTypeParameterUsages = ts.createMap<ts.TypeParameter>(); // Key is type ID
    const usagesPerScope: ScopeUsages[] = [];
    const substitutionsPerScope: ts.Map<ts.Node>[] = [];
    const functionErrorsPerScope: ts.Diagnostic[][] = [];
    const constantErrorsPerScope: ts.Diagnostic[][] = [];
    const visibleDeclarationsInExtractedRange: ts.NamedDeclaration[] = [];
    const exposedVariableSymbolSet = ts.createMap<true>(); // Key is symbol ID
    const exposedVariableDeclarations: ts.VariableDeclaration[] = [];
    let firstExposedNonVariableDeclaration: ts.NamedDeclaration | undefined;
    const expression = !isReadonlyArray(targetRange.range)
        ? targetRange.range
        : targetRange.range.length === 1 && ts.isExpressionStatement(targetRange.range[0])
            ? (targetRange.range[0] as ts.ExpressionStatement).expression
            : undefined;
    let expressionDiagnostic: ts.Diagnostic | undefined;
    if (expression === undefined) {
        const statements = (targetRange.range as readonly ts.Statement[]);
        const start = ts.first(statements).getStart();
        const end = ts.last(statements).end;
        expressionDiagnostic = ts.createFileDiagnostic(sourceFile, start, end - start, Messages.expressionExpected);
    }
    else if (checker.getTypeAtLocation(expression).flags & (ts.TypeFlags.Void | ts.TypeFlags.Never)) {
        expressionDiagnostic = ts.createDiagnosticForNode(expression, Messages.uselessConstantType);
    }
    // initialize results
    for (const scope of scopes) {
        usagesPerScope.push({ usages: ts.createMap<UsageEntry>(), typeParameterUsages: ts.createMap<ts.TypeParameter>(), substitutions: ts.createMap<ts.Expression>() });
        substitutionsPerScope.push(ts.createMap<ts.Expression>());
        functionErrorsPerScope.push(ts.isFunctionLikeDeclaration(scope) && scope.kind !== ts.SyntaxKind.FunctionDeclaration
            ? [ts.createDiagnosticForNode(scope, Messages.cannotExtractToOtherFunctionLike)]
            : []);
        const constantErrors = [];
        if (expressionDiagnostic) {
            constantErrors.push(expressionDiagnostic);
        }
        if (ts.isClassLike(scope) && ts.isInJSFile(scope)) {
            constantErrors.push(ts.createDiagnosticForNode(scope, Messages.cannotExtractToJSClass));
        }
        if (ts.isArrowFunction(scope) && !ts.isBlock(scope.body)) {
            // TODO (https://github.com/Microsoft/TypeScript/issues/18924): allow this
            constantErrors.push(ts.createDiagnosticForNode(scope, Messages.cannotExtractToExpressionArrowFunction));
        }
        constantErrorsPerScope.push(constantErrors);
    }
    const seenUsages = ts.createMap<Usage>();
    const target = isReadonlyArray(targetRange.range) ? ts.createBlock(targetRange.range) : targetRange.range;
    const unmodifiedNode = isReadonlyArray(targetRange.range) ? ts.first(targetRange.range) : targetRange.range;
    const inGenericContext = isInGenericContext(unmodifiedNode);
    collectUsages(target);
    // Unfortunately, this code takes advantage of the knowledge that the generated method
    // will use the contextual type of an expression as the return type of the extracted
    // method (and will therefore "use" all the types involved).
    if (inGenericContext && !isReadonlyArray(targetRange.range)) {
        const contextualType = checker.getContextualType(targetRange.range)!; // TODO: GH#18217
        recordTypeParameterUsages(contextualType);
    }
    if (allTypeParameterUsages.size > 0) {
        const seenTypeParameterUsages = ts.createMap<ts.TypeParameter>(); // Key is type ID
        let i = 0;
        for (let curr: ts.Node = unmodifiedNode; curr !== undefined && i < scopes.length; curr = curr.parent) {
            if (curr === scopes[i]) {
                // Copy current contents of seenTypeParameterUsages into scope.
                seenTypeParameterUsages.forEach((typeParameter, id) => {
                    usagesPerScope[i].typeParameterUsages.set(id, typeParameter);
                });
                i++;
            }
            // Note that we add the current node's type parameters *after* updating the corresponding scope.
            if (ts.isDeclarationWithTypeParameters(curr)) {
                for (const typeParameterDecl of ts.getEffectiveTypeParameterDeclarations(curr)) {
                    const typeParameter = (checker.getTypeAtLocation(typeParameterDecl) as ts.TypeParameter);
                    if (allTypeParameterUsages.has(typeParameter.id.toString())) {
                        seenTypeParameterUsages.set(typeParameter.id.toString(), typeParameter);
                    }
                }
            }
        }
        // If we didn't get through all the scopes, then there were some that weren't in our
        // parent chain (impossible at time of writing).  A conservative solution would be to
        // copy allTypeParameterUsages into all remaining scopes.
        ts.Debug.assert(i === scopes.length, "Should have iterated all scopes");
    }
    // If there are any declarations in the extracted block that are used in the same enclosing
    // lexical scope, we can't move the extraction "up" as those declarations will become unreachable
    if (visibleDeclarationsInExtractedRange.length) {
        const containingLexicalScopeOfExtraction = ts.isBlockScope(scopes[0], scopes[0].parent)
            ? scopes[0]
            : ts.getEnclosingBlockScopeContainer(scopes[0]);
        ts.forEachChild(containingLexicalScopeOfExtraction, checkForUsedDeclarations);
    }
    for (let i = 0; i < scopes.length; i++) {
        const scopeUsages = usagesPerScope[i];
        // Special case: in the innermost scope, all usages are available.
        // (The computed value reflects the value at the top-level of the scope, but the
        // local will actually be declared at the same level as the extracted expression).
        if (i > 0 && (scopeUsages.usages.size > 0 || scopeUsages.typeParameterUsages.size > 0)) {
            const errorNode = isReadonlyArray(targetRange.range) ? targetRange.range[0] : targetRange.range;
            constantErrorsPerScope[i].push(ts.createDiagnosticForNode(errorNode, Messages.cannotAccessVariablesFromNestedScopes));
        }
        let hasWrite = false;
        let readonlyClassPropertyWrite: ts.Declaration | undefined;
        usagesPerScope[i].usages.forEach(value => {
            if (value.usage === Usage.Write) {
                hasWrite = true;
                if (value.symbol.flags & ts.SymbolFlags.ClassMember &&
                    value.symbol.valueDeclaration &&
                    ts.hasModifier(value.symbol.valueDeclaration, ts.ModifierFlags.Readonly)) {
                    readonlyClassPropertyWrite = value.symbol.valueDeclaration;
                }
            }
        });
        // If an expression was extracted, then there shouldn't have been any variable declarations.
        ts.Debug.assert(isReadonlyArray(targetRange.range) || exposedVariableDeclarations.length === 0, "No variable declarations expected if something was extracted");
        if (hasWrite && !isReadonlyArray(targetRange.range)) {
            const diag = ts.createDiagnosticForNode(targetRange.range, Messages.cannotWriteInExpression);
            functionErrorsPerScope[i].push(diag);
            constantErrorsPerScope[i].push(diag);
        }
        else if (readonlyClassPropertyWrite && i > 0) {
            const diag = ts.createDiagnosticForNode(readonlyClassPropertyWrite, Messages.cannotExtractReadonlyPropertyInitializerOutsideConstructor);
            functionErrorsPerScope[i].push(diag);
            constantErrorsPerScope[i].push(diag);
        }
        else if (firstExposedNonVariableDeclaration) {
            const diag = ts.createDiagnosticForNode(firstExposedNonVariableDeclaration, Messages.cannotExtractExportedEntity);
            functionErrorsPerScope[i].push(diag);
            constantErrorsPerScope[i].push(diag);
        }
    }
    return { target, usagesPerScope, functionErrorsPerScope, constantErrorsPerScope, exposedVariableDeclarations };
    function isInGenericContext(node: ts.Node) {
        return !!ts.findAncestor(node, n => ts.isDeclarationWithTypeParameters(n) && ts.getEffectiveTypeParameterDeclarations(n).length !== 0);
    }
    function recordTypeParameterUsages(type: ts.Type) {
        // PERF: This is potentially very expensive.  `type` could be a library type with
        // a lot of properties, each of which the walker will visit.  Unfortunately, the
        // solution isn't as trivial as filtering to user types because of (e.g.) Array.
        const symbolWalker = checker.getSymbolWalker(() => (cancellationToken.throwIfCancellationRequested(), true));
        const { visitedTypes } = symbolWalker.walkType(type);
        for (const visitedType of visitedTypes) {
            if (visitedType.isTypeParameter()) {
                allTypeParameterUsages.set(visitedType.id.toString(), visitedType);
            }
        }
    }
    function collectUsages(node: ts.Node, valueUsage = Usage.Read) {
        if (inGenericContext) {
            const type = checker.getTypeAtLocation(node);
            recordTypeParameterUsages(type);
        }
        if (ts.isDeclaration(node) && node.symbol) {
            visibleDeclarationsInExtractedRange.push(node);
        }
        if (ts.isAssignmentExpression(node)) {
            // use 'write' as default usage for values
            collectUsages(node.left, Usage.Write);
            collectUsages(node.right);
        }
        else if (ts.isUnaryExpressionWithWrite(node)) {
            collectUsages(node.operand, Usage.Write);
        }
        else if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
            // use 'write' as default usage for values
            ts.forEachChild(node, collectUsages);
        }
        else if (ts.isIdentifier(node)) {
            if (!node.parent) {
                return;
            }
            if (ts.isQualifiedName(node.parent) && node !== node.parent.left) {
                return;
            }
            if (ts.isPropertyAccessExpression(node.parent) && node !== node.parent.expression) {
                return;
            }
            recordUsage(node, valueUsage, /*isTypeNode*/ ts.isPartOfTypeNode(node));
        }
        else {
            ts.forEachChild(node, collectUsages);
        }
    }
    function recordUsage(n: ts.Identifier, usage: Usage, isTypeNode: boolean) {
        const symbolId = recordUsagebySymbol(n, usage, isTypeNode);
        if (symbolId) {
            for (let i = 0; i < scopes.length; i++) {
                // push substitution from map<symbolId, subst> to map<nodeId, subst> to simplify rewriting
                const substitution = substitutionsPerScope[i].get(symbolId);
                if (substitution) {
                    usagesPerScope[i].substitutions.set(ts.getNodeId(n).toString(), substitution);
                }
            }
        }
    }
    function recordUsagebySymbol(identifier: ts.Identifier, usage: Usage, isTypeName: boolean) {
        const symbol = getSymbolReferencedByIdentifier(identifier);
        if (!symbol) {
            // cannot find symbol - do nothing
            return undefined;
        }
        const symbolId = ts.getSymbolId(symbol).toString();
        const lastUsage = seenUsages.get(symbolId);
        // there are two kinds of value usages
        // - reads - if range contains a read from the value located outside of the range then value should be passed as a parameter
        // - writes - if range contains a write to a value located outside the range the value should be passed as a parameter and
        //   returned as a return value
        // 'write' case is a superset of 'read' so if we already have processed 'write' of some symbol there is not need to handle 'read'
        // since all information is already recorded
        if (lastUsage && lastUsage >= usage) {
            return symbolId;
        }
        seenUsages.set(symbolId, usage);
        if (lastUsage) {
            // if we get here this means that we are trying to handle 'write' and 'read' was already processed
            // walk scopes and update existing records.
            for (const perScope of usagesPerScope) {
                const prevEntry = perScope.usages.get(identifier.text);
                if (prevEntry) {
                    perScope.usages.set(identifier.text, { usage, symbol, node: identifier });
                }
            }
            return symbolId;
        }
        // find first declaration in this file
        const decls = symbol.getDeclarations();
        const declInFile = decls && ts.find(decls, d => d.getSourceFile() === sourceFile);
        if (!declInFile) {
            return undefined;
        }
        if (ts.rangeContainsStartEnd(enclosingTextRange, declInFile.getStart(), declInFile.end)) {
            // declaration is located in range to be extracted - do nothing
            return undefined;
        }
        if (targetRange.facts & RangeFacts.IsGenerator && usage === Usage.Write) {
            // this is write to a reference located outside of the target scope and range is extracted into generator
            // currently this is unsupported scenario
            const diag = ts.createDiagnosticForNode(identifier, Messages.cannotExtractRangeThatContainsWritesToReferencesLocatedOutsideOfTheTargetRangeInGenerators);
            for (const errors of functionErrorsPerScope) {
                errors.push(diag);
            }
            for (const errors of constantErrorsPerScope) {
                errors.push(diag);
            }
        }
        for (let i = 0; i < scopes.length; i++) {
            const scope = scopes[i];
            const resolvedSymbol = checker.resolveName(symbol.name, scope, symbol.flags, /*excludeGlobals*/ false);
            if (resolvedSymbol === symbol) {
                continue;
            }
            if (!substitutionsPerScope[i].has(symbolId)) {
                const substitution = tryReplaceWithQualifiedNameOrPropertyAccess(symbol.exportSymbol || symbol, scope, isTypeName);
                if (substitution) {
                    substitutionsPerScope[i].set(symbolId, substitution);
                }
                else if (isTypeName) {
                    // If the symbol is a type parameter that won't be in scope, we'll pass it as a type argument
                    // so there's no problem.
                    if (!(symbol.flags & ts.SymbolFlags.TypeParameter)) {
                        const diag = ts.createDiagnosticForNode(identifier, Messages.typeWillNotBeVisibleInTheNewScope);
                        functionErrorsPerScope[i].push(diag);
                        constantErrorsPerScope[i].push(diag);
                    }
                }
                else {
                    usagesPerScope[i].usages.set(identifier.text, { usage, symbol, node: identifier });
                }
            }
        }
        return symbolId;
    }
    function checkForUsedDeclarations(node: ts.Node) {
        // If this node is entirely within the original extraction range, we don't need to do anything.
        if (node === targetRange.range || (isReadonlyArray(targetRange.range) && targetRange.range.indexOf((node as ts.Statement)) >= 0)) {
            return;
        }
        // Otherwise check and recurse.
        const sym = ts.isIdentifier(node)
            ? getSymbolReferencedByIdentifier(node)
            : checker.getSymbolAtLocation(node);
        if (sym) {
            const decl = ts.find(visibleDeclarationsInExtractedRange, d => d.symbol === sym);
            if (decl) {
                if (ts.isVariableDeclaration(decl)) {
                    const idString = decl.symbol.id!.toString();
                    if (!exposedVariableSymbolSet.has(idString)) {
                        exposedVariableDeclarations.push(decl);
                        exposedVariableSymbolSet.set(idString, true);
                    }
                }
                else {
                    // CONSIDER: this includes binding elements, which we could
                    // expose in the same way as variables.
                    firstExposedNonVariableDeclaration = firstExposedNonVariableDeclaration || decl;
                }
            }
        }
        ts.forEachChild(node, checkForUsedDeclarations);
    }
    /**
     * Return the symbol referenced by an identifier (even if it declares a different symbol).
     */
    function getSymbolReferencedByIdentifier(identifier: ts.Identifier) {
        // If the identifier is both a property name and its value, we're only interested in its value
        // (since the name is a declaration and will be included in the extracted range).
        return identifier.parent && ts.isShorthandPropertyAssignment(identifier.parent) && identifier.parent.name === identifier
            ? checker.getShorthandAssignmentValueSymbol(identifier.parent)
            : checker.getSymbolAtLocation(identifier);
    }
    function tryReplaceWithQualifiedNameOrPropertyAccess(symbol: ts.Symbol | undefined, scopeDecl: ts.Node, isTypeNode: boolean): ts.PropertyAccessExpression | ts.EntityName | undefined {
        if (!symbol) {
            return undefined;
        }
        const decls = symbol.getDeclarations();
        if (decls && decls.some(d => d.parent === scopeDecl)) {
            return ts.createIdentifier(symbol.name);
        }
        const prefix = tryReplaceWithQualifiedNameOrPropertyAccess(symbol.parent, scopeDecl, isTypeNode);
        if (prefix === undefined) {
            return undefined;
        }
        return isTypeNode
            ? ts.createQualifiedName((<ts.EntityName>prefix), ts.createIdentifier(symbol.name))
            : ts.createPropertyAccess((<ts.Expression>prefix), symbol.name);
    }
}
/**
 * Computes whether or not a node represents an expression in a position where it could
 * be extracted.
 * The isExpression() in utilities.ts returns some false positives we need to handle,
 * such as `import x from 'y'` -- the 'y' is a StringLiteral but is *not* an expression
 * in the sense of something that you could extract on
 */
/* @internal */
function isExtractableExpression(node: ts.Node): boolean {
    const { parent } = node;
    switch (parent.kind) {
        case ts.SyntaxKind.EnumMember:
            return false;
    }
    switch (node.kind) {
        case ts.SyntaxKind.StringLiteral:
            return parent.kind !== ts.SyntaxKind.ImportDeclaration &&
                parent.kind !== ts.SyntaxKind.ImportSpecifier;
        case ts.SyntaxKind.SpreadElement:
        case ts.SyntaxKind.ObjectBindingPattern:
        case ts.SyntaxKind.BindingElement:
            return false;
        case ts.SyntaxKind.Identifier:
            return parent.kind !== ts.SyntaxKind.BindingElement &&
                parent.kind !== ts.SyntaxKind.ImportSpecifier &&
                parent.kind !== ts.SyntaxKind.ExportSpecifier;
    }
    return true;
}
/* @internal */
function isBlockLike(node: ts.Node): node is ts.BlockLike {
    switch (node.kind) {
        case ts.SyntaxKind.Block:
        case ts.SyntaxKind.SourceFile:
        case ts.SyntaxKind.ModuleBlock:
        case ts.SyntaxKind.CaseClause:
            return true;
        default:
            return false;
    }
}
