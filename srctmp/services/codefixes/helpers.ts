import * as ts from "../ts";
/* @internal */
/**
 * Finds members of the resolved type that are missing in the class pointed to by class decl
 * and generates source code for the missing members.
 * @param possiblyMissingSymbols The collection of symbols to filter and then get insertions for.
 * @returns Empty string iff there are no member insertions.
 */
export function createMissingMemberNodes(classDeclaration: ts.ClassLikeDeclaration, possiblyMissingSymbols: readonly ts.Symbol[], context: TypeConstructionContext, preferences: ts.UserPreferences, out: (node: ts.ClassElement) => void): void {
    const classMembers = classDeclaration.symbol.members!;
    for (const symbol of possiblyMissingSymbols) {
        if (!classMembers.has(symbol.escapedName)) {
            addNewNodeForMemberSymbol(symbol, classDeclaration, context, preferences, out);
        }
    }
}
/* @internal */
function getModuleSpecifierResolverHost(context: TypeConstructionContext): ts.SymbolTracker["moduleResolverHost"] {
    return {
        directoryExists: context.host.directoryExists ? d => context.host.directoryExists!(d) : undefined,
        fileExists: context.host.fileExists ? f => context.host.fileExists!(f) : undefined,
        getCurrentDirectory: context.host.getCurrentDirectory ? () => context.host.getCurrentDirectory!() : undefined,
        readFile: context.host.readFile ? f => context.host.readFile!(f) : undefined,
        useCaseSensitiveFileNames: context.host.useCaseSensitiveFileNames ? () => context.host.useCaseSensitiveFileNames!() : undefined,
        getSourceFiles: () => context.program.getSourceFiles(),
        getCommonSourceDirectory: () => context.program.getCommonSourceDirectory(),
    };
}
/* @internal */
export function getNoopSymbolTrackerWithResolver(context: TypeConstructionContext): ts.SymbolTracker {
    return {
        trackSymbol: ts.noop,
        moduleResolverHost: getModuleSpecifierResolverHost(context),
    };
}
/* @internal */
export interface TypeConstructionContext {
    program: ts.Program;
    host: ts.ModuleSpecifierResolutionHost;
}
/**
 * @returns Empty string iff there we can't figure out a representation for `symbol` in `enclosingDeclaration`.
 */
/* @internal */
function addNewNodeForMemberSymbol(symbol: ts.Symbol, enclosingDeclaration: ts.ClassLikeDeclaration, context: TypeConstructionContext, preferences: ts.UserPreferences, out: (node: ts.Node) => void): void {
    const declarations = symbol.getDeclarations();
    if (!(declarations && declarations.length)) {
        return undefined;
    }
    const checker = context.program.getTypeChecker();
    const declaration = declarations[0];
    const name = (ts.getSynthesizedDeepClone(ts.getNameOfDeclaration(declaration), /*includeTrivia*/ false) as ts.PropertyName);
    const visibilityModifier = createVisibilityModifier(ts.getModifierFlags(declaration));
    const modifiers = visibilityModifier ? ts.createNodeArray([visibilityModifier]) : undefined;
    const type = checker.getWidenedType(checker.getTypeOfSymbolAtLocation(symbol, enclosingDeclaration));
    const optional = !!(symbol.flags & ts.SymbolFlags.Optional);
    const ambient = !!(enclosingDeclaration.flags & ts.NodeFlags.Ambient);
    switch (declaration.kind) {
        case ts.SyntaxKind.PropertySignature:
        case ts.SyntaxKind.PropertyDeclaration:
            const typeNode = checker.typeToTypeNode(type, enclosingDeclaration, /*flags*/ undefined, getNoopSymbolTrackerWithResolver(context));
            out(ts.createProperty(
            /*decorators*/ undefined, modifiers, name, optional ? ts.createToken(ts.SyntaxKind.QuestionToken) : undefined, typeNode, 
            /*initializer*/ undefined));
            break;
        case ts.SyntaxKind.GetAccessor:
        case ts.SyntaxKind.SetAccessor: {
            const allAccessors = ts.getAllAccessorDeclarations(declarations, (declaration as ts.AccessorDeclaration));
            const typeNode = checker.typeToTypeNode(type, enclosingDeclaration, /*flags*/ undefined, getNoopSymbolTrackerWithResolver(context));
            const orderedAccessors = allAccessors.secondAccessor
                ? [allAccessors.firstAccessor, allAccessors.secondAccessor]
                : [allAccessors.firstAccessor];
            for (const accessor of orderedAccessors) {
                if (ts.isGetAccessorDeclaration(accessor)) {
                    out(ts.createGetAccessor(
                    /*decorators*/ undefined, modifiers, name, ts.emptyArray, typeNode, ambient ? undefined : createStubbedMethodBody(preferences)));
                }
                else {
                    ts.Debug.assertNode(accessor, ts.isSetAccessorDeclaration, "The counterpart to a getter should be a setter");
                    const parameter = ts.getSetAccessorValueParameter(accessor);
                    const parameterName = parameter && ts.isIdentifier(parameter.name) ? ts.idText(parameter.name) : undefined;
                    out(ts.createSetAccessor(
                    /*decorators*/ undefined, modifiers, name, createDummyParameters(1, [parameterName], [typeNode], 1, /*inJs*/ false), ambient ? undefined : createStubbedMethodBody(preferences)));
                }
            }
            break;
        }
        case ts.SyntaxKind.MethodSignature:
        case ts.SyntaxKind.MethodDeclaration:
            // The signature for the implementation appears as an entry in `signatures` iff
            // there is only one signature.
            // If there are overloads and an implementation signature, it appears as an
            // extra declaration that isn't a signature for `type`.
            // If there is more than one overload but no implementation signature
            // (eg: an abstract method or interface declaration), there is a 1-1
            // correspondence of declarations and signatures.
            const signatures = checker.getSignaturesOfType(type, ts.SignatureKind.Call);
            if (!ts.some(signatures)) {
                break;
            }
            if (declarations.length === 1) {
                ts.Debug.assert(signatures.length === 1, "One declaration implies one signature");
                const signature = signatures[0];
                outputMethod(signature, modifiers, name, ambient ? undefined : createStubbedMethodBody(preferences));
                break;
            }
            for (const signature of signatures) {
                // Need to ensure nodes are fresh each time so they can have different positions.
                outputMethod(signature, ts.getSynthesizedDeepClones(modifiers, /*includeTrivia*/ false), ts.getSynthesizedDeepClone(name, /*includeTrivia*/ false));
            }
            if (!ambient) {
                if (declarations.length > signatures.length) {
                    const signature = (checker.getSignatureFromDeclaration((declarations[declarations.length - 1] as ts.SignatureDeclaration))!);
                    outputMethod(signature, modifiers, name, createStubbedMethodBody(preferences));
                }
                else {
                    ts.Debug.assert(declarations.length === signatures.length, "Declarations and signatures should match count");
                    out(createMethodImplementingSignatures(signatures, name, optional, modifiers, preferences));
                }
            }
            break;
    }
    function outputMethod(signature: ts.Signature, modifiers: ts.NodeArray<ts.Modifier> | undefined, name: ts.PropertyName, body?: ts.Block): void {
        const method = signatureToMethodDeclaration(context, signature, enclosingDeclaration, modifiers, name, optional, body);
        if (method)
            out(method);
    }
}
/* @internal */
function signatureToMethodDeclaration(context: TypeConstructionContext, signature: ts.Signature, enclosingDeclaration: ts.ClassLikeDeclaration, modifiers: ts.NodeArray<ts.Modifier> | undefined, name: ts.PropertyName, optional: boolean, body: ts.Block | undefined): ts.MethodDeclaration | undefined {
    const program = context.program;
    const signatureDeclaration = (<ts.MethodDeclaration>program.getTypeChecker().signatureToSignatureDeclaration(signature, ts.SyntaxKind.MethodDeclaration, enclosingDeclaration, ts.NodeBuilderFlags.NoTruncation | ts.NodeBuilderFlags.SuppressAnyReturnType, getNoopSymbolTrackerWithResolver(context)));
    if (!signatureDeclaration) {
        return undefined;
    }
    signatureDeclaration.decorators = undefined;
    signatureDeclaration.modifiers = modifiers;
    signatureDeclaration.name = name;
    signatureDeclaration.questionToken = optional ? ts.createToken(ts.SyntaxKind.QuestionToken) : undefined;
    signatureDeclaration.body = body;
    return signatureDeclaration;
}
/* @internal */
export function createMethodFromCallExpression(context: ts.CodeFixContextBase, call: ts.CallExpression, methodName: string, inJs: boolean, makeStatic: boolean, preferences: ts.UserPreferences, contextNode: ts.Node): ts.MethodDeclaration {
    const body = !ts.isInterfaceDeclaration(contextNode);
    const { typeArguments, arguments: args, parent } = call;
    const checker = context.program.getTypeChecker();
    const tracker = getNoopSymbolTrackerWithResolver(context);
    const types = ts.map(args, arg => 
    // Widen the type so we don't emit nonsense annotations like "function fn(x: 3) {"
    checker.typeToTypeNode(checker.getBaseTypeOfLiteralType(checker.getTypeAtLocation(arg)), contextNode, /*flags*/ undefined, tracker));
    const names = ts.map(args, arg => ts.isIdentifier(arg) ? arg.text : ts.isPropertyAccessExpression(arg) ? arg.name.text : undefined);
    const contextualType = checker.getContextualType(call);
    const returnType = (inJs || !contextualType) ? undefined : checker.typeToTypeNode(contextualType, contextNode, /*flags*/ undefined, tracker);
    return ts.createMethod(
    /*decorators*/ undefined, 
    /*modifiers*/ makeStatic ? [ts.createToken(ts.SyntaxKind.StaticKeyword)] : undefined, 
    /*asteriskToken*/ ts.isYieldExpression(parent) ? ts.createToken(ts.SyntaxKind.AsteriskToken) : undefined, methodName, 
    /*questionToken*/ undefined, 
    /*typeParameters*/ inJs ? undefined : ts.map(typeArguments, (_, i) => ts.createTypeParameterDeclaration(ts.CharacterCodes.T + typeArguments!.length - 1 <= ts.CharacterCodes.Z ? String.fromCharCode(ts.CharacterCodes.T + i) : `T${i}`)), 
    /*parameters*/ createDummyParameters(args.length, names, types, /*minArgumentCount*/ undefined, inJs), 
    /*type*/ returnType, body ? createStubbedMethodBody(preferences) : undefined);
}
/* @internal */
function createDummyParameters(argCount: number, names: (string | undefined)[] | undefined, types: (ts.TypeNode | undefined)[] | undefined, minArgumentCount: number | undefined, inJs: boolean): ts.ParameterDeclaration[] {
    const parameters: ts.ParameterDeclaration[] = [];
    for (let i = 0; i < argCount; i++) {
        const newParameter = ts.createParameter(
        /*decorators*/ undefined, 
        /*modifiers*/ undefined, 
        /*dotDotDotToken*/ undefined, 
        /*name*/ names && names[i] || `arg${i}`, 
        /*questionToken*/ minArgumentCount !== undefined && i >= minArgumentCount ? ts.createToken(ts.SyntaxKind.QuestionToken) : undefined, 
        /*type*/ inJs ? undefined : types && types[i] || ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword), 
        /*initializer*/ undefined);
        parameters.push(newParameter);
    }
    return parameters;
}
/* @internal */
function createMethodImplementingSignatures(signatures: readonly ts.Signature[], name: ts.PropertyName, optional: boolean, modifiers: readonly ts.Modifier[] | undefined, preferences: ts.UserPreferences): ts.MethodDeclaration {
    /** This is *a* signature with the maximal number of arguments,
     * such that if there is a "maximal" signature without rest arguments,
     * this is one of them.
     */
    let maxArgsSignature = signatures[0];
    let minArgumentCount = signatures[0].minArgumentCount;
    let someSigHasRestParameter = false;
    for (const sig of signatures) {
        minArgumentCount = Math.min(sig.minArgumentCount, minArgumentCount);
        if (ts.signatureHasRestParameter(sig)) {
            someSigHasRestParameter = true;
        }
        if (sig.parameters.length >= maxArgsSignature.parameters.length && (!ts.signatureHasRestParameter(sig) || ts.signatureHasRestParameter(maxArgsSignature))) {
            maxArgsSignature = sig;
        }
    }
    const maxNonRestArgs = maxArgsSignature.parameters.length - (ts.signatureHasRestParameter(maxArgsSignature) ? 1 : 0);
    const maxArgsParameterSymbolNames = maxArgsSignature.parameters.map(symbol => symbol.name);
    const parameters = createDummyParameters(maxNonRestArgs, maxArgsParameterSymbolNames, /* types */ undefined, minArgumentCount, /*inJs*/ false);
    if (someSigHasRestParameter) {
        const anyArrayType = ts.createArrayTypeNode(ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
        const restParameter = ts.createParameter(
        /*decorators*/ undefined, 
        /*modifiers*/ undefined, ts.createToken(ts.SyntaxKind.DotDotDotToken), maxArgsParameterSymbolNames[maxNonRestArgs] || "rest", 
        /*questionToken*/ maxNonRestArgs >= minArgumentCount ? ts.createToken(ts.SyntaxKind.QuestionToken) : undefined, anyArrayType, 
        /*initializer*/ undefined);
        parameters.push(restParameter);
    }
    return createStubbedMethod(modifiers, name, optional, 
    /*typeParameters*/ undefined, parameters, 
    /*returnType*/ undefined, preferences);
}
/* @internal */
function createStubbedMethod(modifiers: readonly ts.Modifier[] | undefined, name: ts.PropertyName, optional: boolean, typeParameters: readonly ts.TypeParameterDeclaration[] | undefined, parameters: readonly ts.ParameterDeclaration[], returnType: ts.TypeNode | undefined, preferences: ts.UserPreferences): ts.MethodDeclaration {
    return ts.createMethod(
    /*decorators*/ undefined, modifiers, 
    /*asteriskToken*/ undefined, name, optional ? ts.createToken(ts.SyntaxKind.QuestionToken) : undefined, typeParameters, parameters, returnType, createStubbedMethodBody(preferences));
}
/* @internal */
function createStubbedMethodBody(preferences: ts.UserPreferences): ts.Block {
    return ts.createBlock([ts.createThrow(ts.createNew(ts.createIdentifier("Error"), 
        /*typeArguments*/ undefined, 
        // TODO Handle auto quote preference.
        [ts.createLiteral("Method not implemented.", /*isSingleQuote*/ preferences.quotePreference === "single")]))], 
    /*multiline*/ true);
}
/* @internal */
function createVisibilityModifier(flags: ts.ModifierFlags): ts.Modifier | undefined {
    if (flags & ts.ModifierFlags.Public) {
        return ts.createToken(ts.SyntaxKind.PublicKeyword);
    }
    else if (flags & ts.ModifierFlags.Protected) {
        return ts.createToken(ts.SyntaxKind.ProtectedKeyword);
    }
    return undefined;
}
/* @internal */
export function setJsonCompilerOptionValue(changeTracker: ts.textChanges.ChangeTracker, configFile: ts.TsConfigSourceFile, optionName: string, optionValue: ts.Expression) {
    const tsconfigObjectLiteral = ts.getTsConfigObjectLiteralExpression(configFile);
    if (!tsconfigObjectLiteral)
        return undefined;
    const compilerOptionsProperty = findJsonProperty(tsconfigObjectLiteral, "compilerOptions");
    if (compilerOptionsProperty === undefined) {
        changeTracker.insertNodeAtObjectStart(configFile, tsconfigObjectLiteral, createJsonPropertyAssignment("compilerOptions", ts.createObjectLiteral([
            createJsonPropertyAssignment(optionName, optionValue),
        ])));
        return;
    }
    const compilerOptions = compilerOptionsProperty.initializer;
    if (!ts.isObjectLiteralExpression(compilerOptions)) {
        return;
    }
    const optionProperty = findJsonProperty(compilerOptions, optionName);
    if (optionProperty === undefined) {
        changeTracker.insertNodeAtObjectStart(configFile, compilerOptions, createJsonPropertyAssignment(optionName, optionValue));
    }
    else {
        changeTracker.replaceNode(configFile, optionProperty.initializer, optionValue);
    }
}
/* @internal */
export function createJsonPropertyAssignment(name: string, initializer: ts.Expression) {
    return ts.createPropertyAssignment(ts.createStringLiteral(name), initializer);
}
/* @internal */
export function findJsonProperty(obj: ts.ObjectLiteralExpression, name: string): ts.PropertyAssignment | undefined {
    return ts.find(obj.properties, (p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && !!p.name && ts.isStringLiteral(p.name) && p.name.text === name);
}
