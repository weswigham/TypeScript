/* @internal */
namespace ts.codefix {
    const fixId = "convertToAsyncFunction";
    const errorCodes = [ts.Diagnostics.This_may_be_converted_to_an_async_function.code];
    let codeActionSucceeded = true;
    ts.codefix.registerCodeFix({
        errorCodes,
        getCodeActions(context: ts.CodeFixContext) {
            codeActionSucceeded = true;
            const changes = ts.textChanges.ChangeTracker.with(context, (t) => convertToAsyncFunction(t, context.sourceFile, context.span.start, context.program.getTypeChecker(), context));
            return codeActionSucceeded ? [ts.codefix.createCodeFixAction(fixId, changes, ts.Diagnostics.Convert_to_async_function, fixId, ts.Diagnostics.Convert_all_to_async_functions)] : [];
        },
        fixIds: [fixId],
        getAllCodeActions: context => ts.codefix.codeFixAll(context, errorCodes, (changes, err) => convertToAsyncFunction(changes, err.file, err.start, context.program.getTypeChecker(), context)),
    });
    const enum SynthBindingNameKind {
        Identifier,
        BindingPattern
    }
    type SynthBindingName = SynthBindingPattern | SynthIdentifier;
    interface SynthBindingPattern {
        readonly kind: SynthBindingNameKind.BindingPattern;
        readonly elements: readonly SynthBindingName[];
        readonly bindingPattern: ts.BindingPattern;
        readonly types: ts.Type[];
    }
    interface SynthIdentifier {
        readonly kind: SynthBindingNameKind.Identifier;
        readonly identifier: ts.Identifier;
        readonly types: ts.Type[];
        numberOfAssignmentsOriginal: number; // number of times the variable should be assigned in the refactor
    }
    interface SymbolAndIdentifier {
        readonly identifier: ts.Identifier;
        readonly symbol: ts.Symbol;
    }
    interface Transformer {
        readonly checker: ts.TypeChecker;
        readonly synthNamesMap: ts.Map<SynthIdentifier>; // keys are the symbol id of the identifier
        readonly allVarNames: readonly SymbolAndIdentifier[];
        readonly setOfExpressionsToReturn: ts.ReadonlyMap<true>; // keys are the node ids of the expressions
        readonly constIdentifiers: ts.Identifier[];
        readonly originalTypeMap: ts.ReadonlyMap<ts.Type>; // keys are the node id of the identifier
        readonly isInJSFile: boolean;
    }
    function convertToAsyncFunction(changes: ts.textChanges.ChangeTracker, sourceFile: ts.SourceFile, position: number, checker: ts.TypeChecker, context: ts.CodeFixContextBase): void {
        // get the function declaration - returns a promise
        const tokenAtPosition = ts.getTokenAtPosition(sourceFile, position);
        let functionToConvert: ts.FunctionLikeDeclaration | undefined;
        // if the parent of a FunctionLikeDeclaration is a variable declaration, the convertToAsync diagnostic will be reported on the variable name
        if (ts.isIdentifier(tokenAtPosition) && ts.isVariableDeclaration(tokenAtPosition.parent) &&
            tokenAtPosition.parent.initializer && ts.isFunctionLikeDeclaration(tokenAtPosition.parent.initializer)) {
            functionToConvert = tokenAtPosition.parent.initializer;
        }
        else {
            functionToConvert = ts.tryCast(ts.getContainingFunction(ts.getTokenAtPosition(sourceFile, position)), ts.isFunctionLikeDeclaration);
        }
        if (!functionToConvert) {
            return;
        }
        const synthNamesMap: ts.Map<SynthIdentifier> = ts.createMap();
        const originalTypeMap: ts.Map<ts.Type> = ts.createMap();
        const allVarNames: SymbolAndIdentifier[] = [];
        const isInJavascript = ts.isInJSFile(functionToConvert);
        const setOfExpressionsToReturn = getAllPromiseExpressionsToReturn(functionToConvert, checker);
        const functionToConvertRenamed = renameCollidingVarNames(functionToConvert, checker, synthNamesMap, context, setOfExpressionsToReturn, originalTypeMap, allVarNames);
        const constIdentifiers = getConstIdentifiers(synthNamesMap);
        const returnStatements = functionToConvertRenamed.body && ts.isBlock(functionToConvertRenamed.body) ? getReturnStatementsWithPromiseHandlers(functionToConvertRenamed.body) : ts.emptyArray;
        const transformer: Transformer = { checker, synthNamesMap, allVarNames, setOfExpressionsToReturn, constIdentifiers, originalTypeMap, isInJSFile: isInJavascript };
        if (!returnStatements.length) {
            return;
        }
        // add the async keyword
        changes.insertLastModifierBefore(sourceFile, ts.SyntaxKind.AsyncKeyword, functionToConvert);
        function startTransformation(node: ts.CallExpression, nodeToReplace: ts.Node) {
            const newNodes = transformExpression(node, transformer, node);
            changes.replaceNodeWithNodes(sourceFile, nodeToReplace, newNodes);
        }
        for (const statement of returnStatements) {
            ts.forEachChild(statement, function visit(node) {
                if (ts.isCallExpression(node)) {
                    startTransformation(node, statement);
                }
                else if (!ts.isFunctionLike(node)) {
                    ts.forEachChild(node, visit);
                }
            });
        }
    }
    function getReturnStatementsWithPromiseHandlers(body: ts.Block): readonly ts.ReturnStatement[] {
        const res: ts.ReturnStatement[] = [];
        ts.forEachReturnStatement(body, ret => {
            if (ts.isReturnStatementWithFixablePromiseHandler(ret))
                res.push(ret);
        });
        return res;
    }
    // Returns the identifiers that are never reassigned in the refactor
    function getConstIdentifiers(synthNamesMap: ts.ReadonlyMap<SynthIdentifier>): ts.Identifier[] {
        const constIdentifiers: ts.Identifier[] = [];
        synthNamesMap.forEach((val) => {
            if (val.numberOfAssignmentsOriginal === 0) {
                constIdentifiers.push(val.identifier);
            }
        });
        return constIdentifiers;
    }
    /*
        Finds all of the expressions of promise type that should not be saved in a variable during the refactor
    */
    function getAllPromiseExpressionsToReturn(func: ts.FunctionLikeDeclaration, checker: ts.TypeChecker): ts.Map<true> {
        if (!func.body) {
            return ts.createMap<true>();
        }
        const setOfExpressionsToReturn: ts.Map<true> = ts.createMap<true>();
        ts.forEachChild(func.body, function visit(node: ts.Node) {
            if (isPromiseReturningExpression(node, checker, "then")) {
                setOfExpressionsToReturn.set(ts.getNodeId(node).toString(), true);
                ts.forEach((<ts.CallExpression>node).arguments, visit);
            }
            else if (isPromiseReturningExpression(node, checker, "catch")) {
                setOfExpressionsToReturn.set(ts.getNodeId(node).toString(), true);
                // if .catch() is the last call in the chain, move leftward in the chain until we hit something else that should be returned
                ts.forEachChild(node, visit);
            }
            else if (isPromiseReturningExpression(node, checker)) {
                setOfExpressionsToReturn.set(ts.getNodeId(node).toString(), true);
                // don't recurse here, since we won't refactor any children or arguments of the expression
            }
            else {
                ts.forEachChild(node, visit);
            }
        });
        return setOfExpressionsToReturn;
    }
    /*
        Returns true if node is a promise returning expression
        If name is not undefined, node is a promise returning call of name
    */
    function isPromiseReturningExpression(node: ts.Node, checker: ts.TypeChecker, name?: string): boolean {
        const isNodeExpression = name ? ts.isCallExpression(node) : ts.isExpression(node);
        const isExpressionOfName = isNodeExpression && (!name || ts.hasPropertyAccessExpressionWithName((node as ts.CallExpression), name));
        const nodeType = isExpressionOfName && checker.getTypeAtLocation(node);
        return !!(nodeType && checker.getPromisedTypeOfPromise(nodeType));
    }
    function declaredInFile(symbol: ts.Symbol, sourceFile: ts.SourceFile): boolean {
        return symbol.valueDeclaration && symbol.valueDeclaration.getSourceFile() === sourceFile;
    }
    /*
        Renaming of identifiers may be neccesary as the refactor changes scopes -
        This function collects all existing identifier names and names of identifiers that will be created in the refactor.
        It then checks for any collisions and renames them through getSynthesizedDeepClone
    */
    function renameCollidingVarNames(nodeToRename: ts.FunctionLikeDeclaration, checker: ts.TypeChecker, synthNamesMap: ts.Map<SynthIdentifier>, context: ts.CodeFixContextBase, setOfAllExpressionsToReturn: ts.Map<true>, originalType: ts.Map<ts.Type>, allVarNames: SymbolAndIdentifier[]): ts.FunctionLikeDeclaration {
        const identsToRenameMap: ts.Map<ts.Identifier> = ts.createMap(); // key is the symbol id
        const collidingSymbolMap: ts.Map<ts.Symbol[]> = ts.createMap();
        ts.forEachChild(nodeToRename, function visit(node: ts.Node) {
            if (!ts.isIdentifier(node)) {
                ts.forEachChild(node, visit);
                return;
            }
            const symbol = checker.getSymbolAtLocation(node);
            const isDefinedInFile = symbol && declaredInFile(symbol, context.sourceFile);
            if (symbol && isDefinedInFile) {
                const type = checker.getTypeAtLocation(node);
                const lastCallSignature = getLastCallSignature(type, checker);
                const symbolIdString = ts.getSymbolId(symbol).toString();
                // if the identifier refers to a function we want to add the new synthesized variable for the declaration (ex. blob in let blob = res(arg))
                // Note - the choice of the last call signature is arbitrary
                if (lastCallSignature && !ts.isFunctionLikeDeclaration(node.parent) && !synthNamesMap.has(symbolIdString)) {
                    const firstParameter = ts.firstOrUndefined(lastCallSignature.parameters);
                    const ident = firstParameter && ts.isParameter(firstParameter.valueDeclaration) && ts.tryCast(firstParameter.valueDeclaration.name, ts.isIdentifier) || ts.createOptimisticUniqueName("result");
                    const synthName = getNewNameIfConflict(ident, collidingSymbolMap);
                    synthNamesMap.set(symbolIdString, synthName);
                    allVarNames.push({ identifier: synthName.identifier, symbol });
                    addNameToFrequencyMap(collidingSymbolMap, ident.text, symbol);
                }
                // we only care about identifiers that are parameters, declarations, or binding elements (don't care about other uses)
                else if (node.parent && (ts.isParameter(node.parent) || ts.isVariableDeclaration(node.parent) || ts.isBindingElement(node.parent))) {
                    const originalName = node.text;
                    const collidingSymbols = collidingSymbolMap.get(originalName);
                    // if the identifier name conflicts with a different identifier that we've already seen
                    if (collidingSymbols && collidingSymbols.some(prevSymbol => prevSymbol !== symbol)) {
                        const newName = getNewNameIfConflict(node, collidingSymbolMap);
                        identsToRenameMap.set(symbolIdString, newName.identifier);
                        synthNamesMap.set(symbolIdString, newName);
                        allVarNames.push({ identifier: newName.identifier, symbol });
                        addNameToFrequencyMap(collidingSymbolMap, originalName, symbol);
                    }
                    else {
                        const identifier = ts.getSynthesizedDeepClone(node);
                        identsToRenameMap.set(symbolIdString, identifier);
                        synthNamesMap.set(symbolIdString, createSynthIdentifier(identifier, [], allVarNames.filter(elem => elem.identifier.text === node.text).length /*, numberOfAssignmentsSynthesized: 0*/));
                        if ((ts.isParameter(node.parent) && isExpressionOrCallOnTypePromise(node.parent.parent)) || ts.isVariableDeclaration(node.parent)) {
                            allVarNames.push({ identifier, symbol });
                            addNameToFrequencyMap(collidingSymbolMap, originalName, symbol);
                        }
                    }
                }
            }
        });
        return ts.getSynthesizedDeepCloneWithRenames(nodeToRename, /*includeTrivia*/ true, identsToRenameMap, checker, deepCloneCallback);
        function isExpressionOrCallOnTypePromise(child: ts.Node): boolean {
            const node = child.parent;
            if (ts.isCallExpression(node) || ts.isIdentifier(node) && !setOfAllExpressionsToReturn.get(ts.getNodeId(node).toString())) {
                const nodeType = checker.getTypeAtLocation(node);
                const isPromise = nodeType && checker.getPromisedTypeOfPromise(nodeType);
                return !!isPromise;
            }
            return false;
        }
        function deepCloneCallback(node: ts.Node, clone: ts.Node) {
            if (ts.isIdentifier(node)) {
                const symbol = checker.getSymbolAtLocation(node);
                const symboldIdString = symbol && ts.getSymbolId(symbol).toString();
                const renameInfo = symbol && synthNamesMap.get(symboldIdString!);
                if (renameInfo) {
                    const type = checker.getTypeAtLocation(node);
                    originalType.set(ts.getNodeId(clone).toString(), type);
                }
            }
            const val = setOfAllExpressionsToReturn.get(ts.getNodeId(node).toString());
            if (val !== undefined) {
                setOfAllExpressionsToReturn.delete(ts.getNodeId(node).toString());
                setOfAllExpressionsToReturn.set(ts.getNodeId(clone).toString(), val);
            }
        }
    }
    function addNameToFrequencyMap(renamedVarNameFrequencyMap: ts.Map<ts.Symbol[]>, originalName: string, symbol: ts.Symbol) {
        if (renamedVarNameFrequencyMap.has(originalName)) {
            renamedVarNameFrequencyMap.get(originalName)!.push(symbol);
        }
        else {
            renamedVarNameFrequencyMap.set(originalName, [symbol]);
        }
    }
    function getNewNameIfConflict(name: ts.Identifier, originalNames: ts.ReadonlyMap<ts.Symbol[]>): SynthIdentifier {
        const numVarsSameName = (originalNames.get(name.text) || ts.emptyArray).length;
        const numberOfAssignmentsOriginal = 0;
        const identifier = numVarsSameName === 0 ? name : ts.createIdentifier(name.text + "_" + numVarsSameName);
        return createSynthIdentifier(identifier, [], numberOfAssignmentsOriginal);
    }
    // dispatch function to recursively build the refactoring
    // should be kept up to date with isFixablePromiseHandler in suggestionDiagnostics.ts
    function transformExpression(node: ts.Expression, transformer: Transformer, outermostParent: ts.CallExpression, prevArgName?: SynthBindingName): readonly ts.Statement[] {
        if (!node) {
            return ts.emptyArray;
        }
        const originalType = ts.isIdentifier(node) && transformer.originalTypeMap.get(ts.getNodeId(node).toString());
        const nodeType = originalType || transformer.checker.getTypeAtLocation(node);
        if (ts.isCallExpression(node) && ts.hasPropertyAccessExpressionWithName(node, "then") && nodeType && !!transformer.checker.getPromisedTypeOfPromise(nodeType)) {
            return transformThen(node, transformer, outermostParent, prevArgName);
        }
        else if (ts.isCallExpression(node) && ts.hasPropertyAccessExpressionWithName(node, "catch") && nodeType && !!transformer.checker.getPromisedTypeOfPromise(nodeType)) {
            return transformCatch(node, transformer, prevArgName);
        }
        else if (ts.isPropertyAccessExpression(node)) {
            return transformExpression(node.expression, transformer, outermostParent, prevArgName);
        }
        else if (nodeType && transformer.checker.getPromisedTypeOfPromise(nodeType)) {
            return transformPromiseCall(node, transformer, prevArgName);
        }
        codeActionSucceeded = false;
        return ts.emptyArray;
    }
    function transformCatch(node: ts.CallExpression, transformer: Transformer, prevArgName?: SynthBindingName): readonly ts.Statement[] {
        const func = node.arguments[0];
        const argName = getArgBindingName(func, transformer);
        const shouldReturn = transformer.setOfExpressionsToReturn.get(ts.getNodeId(node).toString());
        let possibleNameForVarDecl: SynthIdentifier | undefined;
        /*
            If there is another call in the chain after the .catch() we are transforming, we will need to save the result of both paths (try block and catch block)
            To do this, we will need to synthesize a variable that we were not aware of while we were adding identifiers to the synthNamesMap
            We will use the prevArgName and then update the synthNamesMap with a new variable name for the next transformation step
        */
        if (prevArgName && !shouldReturn) {
            if (isSynthIdentifier(prevArgName)) {
                possibleNameForVarDecl = prevArgName;
                transformer.synthNamesMap.forEach((val, key) => {
                    if (val.identifier.text === prevArgName.identifier.text) {
                        const newSynthName = createUniqueSynthName(prevArgName);
                        transformer.synthNamesMap.set(key, newSynthName);
                    }
                });
            }
            else {
                possibleNameForVarDecl = createSynthIdentifier(ts.createOptimisticUniqueName("result"), prevArgName.types);
            }
            possibleNameForVarDecl.numberOfAssignmentsOriginal = 2; // Try block and catch block
            // update the constIdentifiers list
            if (transformer.constIdentifiers.some(elem => elem.text === possibleNameForVarDecl!.identifier.text)) {
                transformer.constIdentifiers.push(createUniqueSynthName(possibleNameForVarDecl).identifier);
            }
        }
        const tryBlock = ts.createBlock(transformExpression(node.expression, transformer, node, possibleNameForVarDecl));
        const transformationBody = getTransformationBody(func, possibleNameForVarDecl, argName, node, transformer);
        const catchArg = argName ? isSynthIdentifier(argName) ? argName.identifier.text : argName.bindingPattern : "e";
        const catchVariableDeclaration = ts.createVariableDeclaration(catchArg);
        const catchClause = ts.createCatchClause(catchVariableDeclaration, ts.createBlock(transformationBody));
        /*
            In order to avoid an implicit any, we will synthesize a type for the declaration using the unions of the types of both paths (try block and catch block)
        */
        let varDeclList: ts.VariableStatement | undefined;
        let varDeclIdentifier: ts.Identifier | undefined;
        if (possibleNameForVarDecl && !shouldReturn) {
            varDeclIdentifier = ts.getSynthesizedDeepClone(possibleNameForVarDecl.identifier);
            const typeArray: ts.Type[] = possibleNameForVarDecl.types;
            const unionType = transformer.checker.getUnionType(typeArray, ts.UnionReduction.Subtype);
            const unionTypeNode = transformer.isInJSFile ? undefined : transformer.checker.typeToTypeNode(unionType);
            const varDecl = [ts.createVariableDeclaration(varDeclIdentifier, unionTypeNode)];
            varDeclList = ts.createVariableStatement(/*modifiers*/ undefined, ts.createVariableDeclarationList(varDecl, ts.NodeFlags.Let));
        }
        const tryStatement = ts.createTry(tryBlock, catchClause, /*finallyBlock*/ undefined);
        const destructuredResult = prevArgName && varDeclIdentifier && isSynthBindingPattern(prevArgName)
            && ts.createVariableStatement(/* modifiers */ undefined, ts.createVariableDeclarationList([ts.createVariableDeclaration(ts.getSynthesizedDeepCloneWithRenames(prevArgName.bindingPattern), /* type */ undefined, varDeclIdentifier)], ts.NodeFlags.Const));
        return ts.compact([varDeclList, tryStatement, destructuredResult]);
    }
    function getIdentifierTextsFromBindingName(bindingName: ts.BindingName): readonly string[] {
        if (ts.isIdentifier(bindingName))
            return [bindingName.text];
        return ts.flatMap(bindingName.elements, element => {
            if (ts.isOmittedExpression(element))
                return [];
            return getIdentifierTextsFromBindingName(element.name);
        });
    }
    function createUniqueSynthName(prevArgName: SynthIdentifier): SynthIdentifier {
        const renamedPrevArg = ts.createOptimisticUniqueName(prevArgName.identifier.text);
        return createSynthIdentifier(renamedPrevArg);
    }
    function transformThen(node: ts.CallExpression, transformer: Transformer, outermostParent: ts.CallExpression, prevArgName?: SynthBindingName): readonly ts.Statement[] {
        const [res, rej] = node.arguments;
        if (!res) {
            return transformExpression(node.expression, transformer, outermostParent);
        }
        const argNameRes = getArgBindingName(res, transformer);
        const transformationBody = getTransformationBody(res, prevArgName, argNameRes, node, transformer);
        if (rej) {
            const argNameRej = getArgBindingName(rej, transformer);
            const tryBlock = ts.createBlock(transformExpression(node.expression, transformer, node, argNameRes).concat(transformationBody));
            const transformationBody2 = getTransformationBody(rej, prevArgName, argNameRej, node, transformer);
            const catchArg = argNameRej ? isSynthIdentifier(argNameRej) ? argNameRej.identifier.text : argNameRej.bindingPattern : "e";
            const catchVariableDeclaration = ts.createVariableDeclaration(catchArg);
            const catchClause = ts.createCatchClause(catchVariableDeclaration, ts.createBlock(transformationBody2));
            return [ts.createTry(tryBlock, catchClause, /* finallyBlock */ undefined)];
        }
        return transformExpression(node.expression, transformer, node, argNameRes).concat(transformationBody);
    }
    function getFlagOfBindingName(bindingName: SynthBindingName, constIdentifiers: readonly ts.Identifier[]): ts.NodeFlags {
        const identifiers = getIdentifierTextsFromBindingName(getNode(bindingName));
        const inArr: boolean = constIdentifiers.some(elem => ts.contains(identifiers, elem.text));
        return inArr ? ts.NodeFlags.Const : ts.NodeFlags.Let;
    }
    function transformPromiseCall(node: ts.Expression, transformer: Transformer, prevArgName?: SynthBindingName): readonly ts.Statement[] {
        const shouldReturn = transformer.setOfExpressionsToReturn.get(ts.getNodeId(node).toString());
        // the identifier is empty when the handler (.then()) ignores the argument - In this situation we do not need to save the result of the promise returning call
        const originalNodeParent = node.original ? node.original.parent : node.parent;
        if (prevArgName && !shouldReturn && (!originalNodeParent || ts.isPropertyAccessExpression(originalNodeParent))) {
            return createTransformedStatement(prevArgName, ts.createAwait(node), transformer);
        }
        else if (!prevArgName && !shouldReturn && (!originalNodeParent || ts.isPropertyAccessExpression(originalNodeParent))) {
            return [ts.createStatement(ts.createAwait(node))];
        }
        return [ts.createReturn(ts.getSynthesizedDeepClone(node))];
    }
    function createTransformedStatement(prevArgName: SynthBindingName | undefined, rightHandSide: ts.Expression, transformer: Transformer): readonly ts.Statement[] {
        if (!prevArgName || isEmpty(prevArgName)) {
            // if there's no argName to assign to, there still might be side effects
            return [ts.createStatement(rightHandSide)];
        }
        if (isSynthIdentifier(prevArgName) && prevArgName.types.length < prevArgName.numberOfAssignmentsOriginal) {
            // if the variable has already been declared, we don't need "let" or "const"
            return [ts.createStatement(ts.createAssignment(ts.getSynthesizedDeepClone(prevArgName.identifier), rightHandSide))];
        }
        return [ts.createVariableStatement(/*modifiers*/ undefined, (ts.createVariableDeclarationList([ts.createVariableDeclaration(ts.getSynthesizedDeepClone(getNode(prevArgName)), /*type*/ undefined, rightHandSide)], getFlagOfBindingName(prevArgName, transformer.constIdentifiers))))];
    }
    // should be kept up to date with isFixablePromiseArgument in suggestionDiagnostics.ts
    function getTransformationBody(func: ts.Expression, prevArgName: SynthBindingName | undefined, argName: SynthBindingName | undefined, parent: ts.CallExpression, transformer: Transformer): readonly ts.Statement[] {
        const shouldReturn = transformer.setOfExpressionsToReturn.get(ts.getNodeId(parent).toString());
        switch (func.kind) {
            case ts.SyntaxKind.NullKeyword:
                // do not produce a transformed statement for a null argument
                break;
            case ts.SyntaxKind.Identifier: // identifier includes undefined
                if (!argName) {
                    // undefined was argument passed to promise handler
                    break;
                }
                const synthCall = ts.createCall(ts.getSynthesizedDeepClone((func as ts.Identifier)), /*typeArguments*/ undefined, isSynthIdentifier(argName) ? [argName.identifier] : []);
                if (shouldReturn) {
                    return [ts.createReturn(synthCall)];
                }
                const type = transformer.originalTypeMap.get(ts.getNodeId(func).toString()) || transformer.checker.getTypeAtLocation(func);
                const callSignatures = transformer.checker.getSignaturesOfType(type, ts.SignatureKind.Call);
                if (!callSignatures.length) {
                    // if identifier in handler has no call signatures, it's invalid
                    codeActionSucceeded = false;
                    break;
                }
                const returnType = callSignatures[0].getReturnType();
                const varDeclOrAssignment = createTransformedStatement(prevArgName, ts.createAwait(synthCall), transformer);
                if (prevArgName) {
                    prevArgName.types.push(returnType);
                }
                return varDeclOrAssignment;
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.ArrowFunction: {
                const funcBody = (func as ts.FunctionExpression | ts.ArrowFunction).body;
                // Arrow functions with block bodies { } will enter this control flow
                if (ts.isBlock(funcBody)) {
                    let refactoredStmts: ts.Statement[] = [];
                    let seenReturnStatement = false;
                    for (const statement of funcBody.statements) {
                        if (ts.isReturnStatement(statement)) {
                            seenReturnStatement = true;
                        }
                        if (ts.isReturnStatementWithFixablePromiseHandler(statement)) {
                            refactoredStmts = refactoredStmts.concat(getInnerTransformationBody(transformer, [statement], prevArgName));
                        }
                        else {
                            refactoredStmts.push(statement);
                        }
                    }
                    return shouldReturn ? refactoredStmts.map(s => ts.getSynthesizedDeepClone(s)) :
                        removeReturns(refactoredStmts, prevArgName, transformer, seenReturnStatement);
                }
                else {
                    const innerRetStmts = ts.isFixablePromiseHandler(funcBody) ? [ts.createReturn(funcBody)] : ts.emptyArray;
                    const innerCbBody = getInnerTransformationBody(transformer, innerRetStmts, prevArgName);
                    if (innerCbBody.length > 0) {
                        return innerCbBody;
                    }
                    const type = transformer.checker.getTypeAtLocation(func);
                    const returnType = getLastCallSignature(type, transformer.checker)!.getReturnType();
                    const rightHandSide = ts.getSynthesizedDeepClone(funcBody);
                    const possiblyAwaitedRightHandSide = !!transformer.checker.getPromisedTypeOfPromise(returnType) ? ts.createAwait(rightHandSide) : rightHandSide;
                    if (!shouldReturn) {
                        const transformedStatement = createTransformedStatement(prevArgName, possiblyAwaitedRightHandSide, transformer);
                        if (prevArgName) {
                            prevArgName.types.push(returnType);
                        }
                        return transformedStatement;
                    }
                    else {
                        return [ts.createReturn(possiblyAwaitedRightHandSide)];
                    }
                }
            }
            default:
                // If no cases apply, we've found a transformation body we don't know how to handle, so the refactoring should no-op to avoid deleting code.
                codeActionSucceeded = false;
                break;
        }
        return ts.emptyArray;
    }
    function getLastCallSignature(type: ts.Type, checker: ts.TypeChecker): ts.Signature | undefined {
        const callSignatures = checker.getSignaturesOfType(type, ts.SignatureKind.Call);
        return ts.lastOrUndefined(callSignatures);
    }
    function removeReturns(stmts: readonly ts.Statement[], prevArgName: SynthBindingName | undefined, transformer: Transformer, seenReturnStatement: boolean): readonly ts.Statement[] {
        const ret: ts.Statement[] = [];
        for (const stmt of stmts) {
            if (ts.isReturnStatement(stmt)) {
                if (stmt.expression) {
                    const possiblyAwaitedExpression = isPromiseReturningExpression(stmt.expression, transformer.checker) ? ts.createAwait(stmt.expression) : stmt.expression;
                    if (prevArgName === undefined) {
                        ret.push(ts.createExpressionStatement(possiblyAwaitedExpression));
                    }
                    else {
                        ret.push(ts.createVariableStatement(/*modifiers*/ undefined, (ts.createVariableDeclarationList([ts.createVariableDeclaration(getNode(prevArgName), /*type*/ undefined, possiblyAwaitedExpression)], getFlagOfBindingName(prevArgName, transformer.constIdentifiers)))));
                    }
                }
            }
            else {
                ret.push(ts.getSynthesizedDeepClone(stmt));
            }
        }
        // if block has no return statement, need to define prevArgName as undefined to prevent undeclared variables
        if (!seenReturnStatement && prevArgName !== undefined) {
            ret.push(ts.createVariableStatement(/*modifiers*/ undefined, (ts.createVariableDeclarationList([ts.createVariableDeclaration(getNode(prevArgName), /*type*/ undefined, ts.createIdentifier("undefined"))], getFlagOfBindingName(prevArgName, transformer.constIdentifiers)))));
        }
        return ret;
    }
    function getInnerTransformationBody(transformer: Transformer, innerRetStmts: readonly ts.Node[], prevArgName?: SynthBindingName) {
        let innerCbBody: ts.Statement[] = [];
        for (const stmt of innerRetStmts) {
            ts.forEachChild(stmt, function visit(node) {
                if (ts.isCallExpression(node)) {
                    const temp = transformExpression(node, transformer, node, prevArgName);
                    innerCbBody = innerCbBody.concat(temp);
                    if (innerCbBody.length > 0) {
                        return;
                    }
                }
                else if (!ts.isFunctionLike(node)) {
                    ts.forEachChild(node, visit);
                }
            });
        }
        return innerCbBody;
    }
    function getArgBindingName(funcNode: ts.Expression, transformer: Transformer): SynthBindingName | undefined {
        const numberOfAssignmentsOriginal = 0;
        const types: ts.Type[] = [];
        let name: SynthBindingName | undefined;
        if (ts.isFunctionLikeDeclaration(funcNode)) {
            if (funcNode.parameters.length > 0) {
                const param = funcNode.parameters[0].name;
                name = getMappedBindingNameOrDefault(param);
            }
        }
        else if (ts.isIdentifier(funcNode)) {
            name = getMapEntryOrDefault(funcNode);
        }
        // return undefined argName when arg is null or undefined
        // eslint-disable-next-line no-in-operator
        if (!name || "identifier" in name && name.identifier.text === "undefined") {
            return undefined;
        }
        return name;
        function getMappedBindingNameOrDefault(bindingName: ts.BindingName): SynthBindingName {
            if (ts.isIdentifier(bindingName))
                return getMapEntryOrDefault(bindingName);
            const elements = ts.flatMap(bindingName.elements, element => {
                if (ts.isOmittedExpression(element))
                    return [];
                return [getMappedBindingNameOrDefault(element.name)];
            });
            return createSynthBindingPattern(bindingName, elements);
        }
        function getMapEntryOrDefault(identifier: ts.Identifier): SynthIdentifier {
            const originalNode = getOriginalNode(identifier);
            const symbol = getSymbol(originalNode);
            if (!symbol) {
                return createSynthIdentifier(identifier, types, numberOfAssignmentsOriginal);
            }
            const mapEntry = transformer.synthNamesMap.get(ts.getSymbolId(symbol).toString());
            return mapEntry || createSynthIdentifier(identifier, types, numberOfAssignmentsOriginal);
        }
        function getSymbol(node: ts.Node): ts.Symbol | undefined {
            return node.symbol ? node.symbol : transformer.checker.getSymbolAtLocation(node);
        }
        function getOriginalNode(node: ts.Node): ts.Node {
            return node.original ? node.original : node;
        }
    }
    function isEmpty(bindingName: SynthBindingName | undefined): boolean {
        if (!bindingName) {
            return true;
        }
        if (isSynthIdentifier(bindingName)) {
            return !bindingName.identifier.text;
        }
        return ts.every(bindingName.elements, isEmpty);
    }
    function getNode(bindingName: SynthBindingName) {
        return isSynthIdentifier(bindingName) ? bindingName.identifier : bindingName.bindingPattern;
    }
    function createSynthIdentifier(identifier: ts.Identifier, types: ts.Type[] = [], numberOfAssignmentsOriginal = 0): SynthIdentifier {
        return { kind: SynthBindingNameKind.Identifier, identifier, types, numberOfAssignmentsOriginal };
    }
    function createSynthBindingPattern(bindingPattern: ts.BindingPattern, elements: readonly SynthBindingName[] = ts.emptyArray, types: ts.Type[] = []): SynthBindingPattern {
        return { kind: SynthBindingNameKind.BindingPattern, bindingPattern, elements, types };
    }
    function isSynthIdentifier(bindingName: SynthBindingName): bindingName is SynthIdentifier {
        return bindingName.kind === SynthBindingNameKind.Identifier;
    }
    function isSynthBindingPattern(bindingName: SynthBindingName): bindingName is SynthBindingPattern {
        return bindingName.kind === SynthBindingNameKind.BindingPattern;
    }
}
