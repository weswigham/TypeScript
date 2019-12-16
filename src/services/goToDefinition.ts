/* @internal */
namespace ts.GoToDefinition {
    export function getDefinitionAtPosition(program: ts.Program, sourceFile: ts.SourceFile, position: number): readonly ts.DefinitionInfo[] | undefined {
        const reference = getReferenceAtPosition(sourceFile, position, program);
        if (reference) {
            return [getDefinitionInfoForFileReference(reference.fileName, reference.file.fileName)];
        }
        const node = ts.getTouchingPropertyName(sourceFile, position);
        if (node === sourceFile) {
            return undefined;
        }
        const { parent } = node;
        const typeChecker = program.getTypeChecker();
        // Labels
        if (ts.isJumpStatementTarget(node)) {
            const label = ts.getTargetLabel(node.parent, node.text);
            return label ? [createDefinitionInfoFromName(typeChecker, label, ts.ScriptElementKind.label, node.text, /*containerName*/ (undefined!))] : undefined; // TODO: GH#18217
        }
        const symbol = getSymbol(node, typeChecker);
        // Could not find a symbol e.g. node is string or number keyword,
        // or the symbol was an internal symbol and does not have a declaration e.g. undefined symbol
        if (!symbol) {
            return getDefinitionInfoForIndexSignatures(node, typeChecker);
        }
        const calledDeclaration = tryGetSignatureDeclaration(typeChecker, node);
        // Don't go to the component constructor definition for a JSX element, just go to the component definition.
        if (calledDeclaration && !(ts.isJsxOpeningLikeElement(node.parent) && isConstructorLike(calledDeclaration))) {
            const sigInfo = createDefinitionFromSignatureDeclaration(typeChecker, calledDeclaration);
            // For a function, if this is the original function definition, return just sigInfo.
            // If this is the original constructor definition, parent is the class.
            if (typeChecker.getRootSymbols(symbol).some(s => symbolMatchesSignature(s, calledDeclaration)) ||
                // TODO: GH#25533 Following check shouldn't be necessary if 'require' is an alias
                symbol.declarations && symbol.declarations.some(d => ts.isVariableDeclaration(d) && !!d.initializer && ts.isRequireCall(d.initializer, /*checkArgumentIsStringLiteralLike*/ false))) {
                return [sigInfo];
            }
            else {
                const defs = getDefinitionFromSymbol(typeChecker, symbol, node, calledDeclaration) || ts.emptyArray;
                // For a 'super()' call, put the signature first, else put the variable first.
                return node.kind === ts.SyntaxKind.SuperKeyword ? [sigInfo, ...defs] : [...defs, sigInfo];
            }
        }
        // Because name in short-hand property assignment has two different meanings: property name and property value,
        // using go-to-definition at such position should go to the variable declaration of the property value rather than
        // go to the declaration of the property name (in this case stay at the same position). However, if go-to-definition
        // is performed at the location of property access, we would like to go to definition of the property in the short-hand
        // assignment. This case and others are handled by the following code.
        if (node.parent.kind === ts.SyntaxKind.ShorthandPropertyAssignment) {
            const shorthandSymbol = typeChecker.getShorthandAssignmentValueSymbol(symbol.valueDeclaration);
            return shorthandSymbol ? shorthandSymbol.declarations.map(decl => createDefinitionInfo(decl, typeChecker, shorthandSymbol, node)) : [];
        }
        // If the node is the name of a BindingElement within an ObjectBindingPattern instead of just returning the
        // declaration the symbol (which is itself), we should try to get to the original type of the ObjectBindingPattern
        // and return the property declaration for the referenced property.
        // For example:
        //      import('./foo').then(({ b/*goto*/ar }) => undefined); => should get use to the declaration in file "./foo"
        //
        //      function bar<T>(onfulfilled: (value: T) => void) { //....}
        //      interface Test {
        //          pr/*destination*/op1: number
        //      }
        //      bar<Test>(({pr/*goto*/op1})=>{});
        if (ts.isPropertyName(node) && ts.isBindingElement(parent) && ts.isObjectBindingPattern(parent.parent) &&
            (node === (parent.propertyName || parent.name))) {
            const name = ts.getNameFromPropertyName(node);
            const type = typeChecker.getTypeAtLocation(parent.parent);
            return name === undefined ? ts.emptyArray : ts.flatMap(type.isUnion() ? type.types : [type], t => {
                const prop = t.getProperty(name);
                return prop && getDefinitionFromSymbol(typeChecker, prop, node);
            });
        }
        // If the current location we want to find its definition is in an object literal, try to get the contextual type for the
        // object literal, lookup the property symbol in the contextual type, and use this for goto-definition.
        // For example
        //      interface Props{
        //          /*first*/prop1: number
        //          prop2: boolean
        //      }
        //      function Foo(arg: Props) {}
        //      Foo( { pr/*1*/op1: 10, prop2: true })
        const element = ts.getContainingObjectLiteralElement(node);
        if (element) {
            const contextualType = element && typeChecker.getContextualType(element.parent);
            if (contextualType) {
                return ts.flatMap(ts.getPropertySymbolsFromContextualType(element, typeChecker, contextualType, /*unionSymbolOk*/ false), propertySymbol => getDefinitionFromSymbol(typeChecker, propertySymbol, node));
            }
        }
        return getDefinitionFromSymbol(typeChecker, symbol, node);
    }
    /**
     * True if we should not add definitions for both the signature symbol and the definition symbol.
     * True for `const |f = |() => 0`, false for `function |f() {} const |g = f;`.
     */
    function symbolMatchesSignature(s: ts.Symbol, calledDeclaration: ts.SignatureDeclaration) {
        return s === calledDeclaration.symbol || s === calledDeclaration.symbol.parent ||
            !ts.isCallLikeExpression(calledDeclaration.parent) && s === calledDeclaration.parent.symbol;
    }
    export function getReferenceAtPosition(sourceFile: ts.SourceFile, position: number, program: ts.Program): {
        fileName: string;
        file: ts.SourceFile;
    } | undefined {
        const referencePath = findReferenceInPosition(sourceFile.referencedFiles, position);
        if (referencePath) {
            const file = program.getSourceFileFromReference(sourceFile, referencePath);
            return file && { fileName: referencePath.fileName, file };
        }
        const typeReferenceDirective = findReferenceInPosition(sourceFile.typeReferenceDirectives, position);
        if (typeReferenceDirective) {
            const reference = program.getResolvedTypeReferenceDirectives().get(typeReferenceDirective.fileName);
            const file = reference && program.getSourceFile(reference.resolvedFileName!); // TODO:GH#18217
            return file && { fileName: typeReferenceDirective.fileName, file };
        }
        const libReferenceDirective = findReferenceInPosition(sourceFile.libReferenceDirectives, position);
        if (libReferenceDirective) {
            const file = program.getLibFileFromReference(libReferenceDirective);
            return file && { fileName: libReferenceDirective.fileName, file };
        }
        return undefined;
    }
    /// Goto type
    export function getTypeDefinitionAtPosition(typeChecker: ts.TypeChecker, sourceFile: ts.SourceFile, position: number): readonly ts.DefinitionInfo[] | undefined {
        const node = ts.getTouchingPropertyName(sourceFile, position);
        if (node === sourceFile) {
            return undefined;
        }
        const symbol = typeChecker.getSymbolAtLocation(node);
        if (!symbol)
            return undefined;
        const typeAtLocation = typeChecker.getTypeOfSymbolAtLocation(symbol, node);
        const returnType = tryGetReturnTypeOfFunction(symbol, typeAtLocation, typeChecker);
        const fromReturnType = returnType && definitionFromType(returnType, typeChecker, node);
        // If a function returns 'void' or some other type with no definition, just return the function definition.
        return fromReturnType && fromReturnType.length !== 0 ? fromReturnType : definitionFromType(typeAtLocation, typeChecker, node);
    }
    function definitionFromType(type: ts.Type, checker: ts.TypeChecker, node: ts.Node): readonly ts.DefinitionInfo[] {
        return ts.flatMap(type.isUnion() && !(type.flags & ts.TypeFlags.Enum) ? type.types : [type], t => t.symbol && getDefinitionFromSymbol(checker, t.symbol, node));
    }
    function tryGetReturnTypeOfFunction(symbol: ts.Symbol, type: ts.Type, checker: ts.TypeChecker): ts.Type | undefined {
        // If the type is just a function's inferred type,
        // go-to-type should go to the return type instead, since go-to-definition takes you to the function anyway.
        if (type.symbol === symbol ||
            // At `const f = () => {}`, the symbol is `f` and the type symbol is at `() => {}`
            symbol.valueDeclaration && type.symbol && ts.isVariableDeclaration(symbol.valueDeclaration) && symbol.valueDeclaration.initializer === (type.symbol.valueDeclaration as ts.Node)) {
            const sigs = type.getCallSignatures();
            if (sigs.length === 1)
                return checker.getReturnTypeOfSignature(ts.first(sigs));
        }
        return undefined;
    }
    export function getDefinitionAndBoundSpan(program: ts.Program, sourceFile: ts.SourceFile, position: number): ts.DefinitionInfoAndBoundSpan | undefined {
        const definitions = getDefinitionAtPosition(program, sourceFile, position);
        if (!definitions || definitions.length === 0) {
            return undefined;
        }
        // Check if position is on triple slash reference.
        const comment = findReferenceInPosition(sourceFile.referencedFiles, position) ||
            findReferenceInPosition(sourceFile.typeReferenceDirectives, position) ||
            findReferenceInPosition(sourceFile.libReferenceDirectives, position);
        if (comment) {
            return { definitions, textSpan: ts.createTextSpanFromRange(comment) };
        }
        const node = ts.getTouchingPropertyName(sourceFile, position);
        const textSpan = ts.createTextSpan(node.getStart(), node.getWidth());
        return { definitions, textSpan };
    }
    // At 'x.foo', see if the type of 'x' has an index signature, and if so find its declarations.
    function getDefinitionInfoForIndexSignatures(node: ts.Node, checker: ts.TypeChecker): ts.DefinitionInfo[] | undefined {
        if (!ts.isPropertyAccessExpression(node.parent) || node.parent.name !== node)
            return;
        const type = checker.getTypeAtLocation(node.parent.expression);
        return ts.mapDefined(type.isUnionOrIntersection() ? type.types : [type], nonUnionType => {
            const info = checker.getIndexInfoOfType(nonUnionType, ts.IndexKind.String);
            return info && info.declaration && createDefinitionFromSignatureDeclaration(checker, info.declaration);
        });
    }
    function getSymbol(node: ts.Node, checker: ts.TypeChecker): ts.Symbol | undefined {
        const symbol = checker.getSymbolAtLocation(node);
        // If this is an alias, and the request came at the declaration location
        // get the aliased symbol instead. This allows for goto def on an import e.g.
        //   import {A, B} from "mod";
        // to jump to the implementation directly.
        if (symbol && symbol.flags & ts.SymbolFlags.Alias && shouldSkipAlias(node, symbol.declarations[0])) {
            const aliased = checker.getAliasedSymbol(symbol);
            if (aliased.declarations) {
                return aliased;
            }
        }
        return symbol;
    }
    // Go to the original declaration for cases:
    //
    //   (1) when the aliased symbol was declared in the location(parent).
    //   (2) when the aliased symbol is originating from an import.
    //
    function shouldSkipAlias(node: ts.Node, declaration: ts.Node): boolean {
        if (node.kind !== ts.SyntaxKind.Identifier) {
            return false;
        }
        if (node.parent === declaration) {
            return true;
        }
        switch (declaration.kind) {
            case ts.SyntaxKind.ImportClause:
            case ts.SyntaxKind.ImportEqualsDeclaration:
                return true;
            case ts.SyntaxKind.ImportSpecifier:
                return declaration.parent.kind === ts.SyntaxKind.NamedImports;
            default:
                return false;
        }
    }
    function getDefinitionFromSymbol(typeChecker: ts.TypeChecker, symbol: ts.Symbol, node: ts.Node, declarationNode?: ts.Node): ts.DefinitionInfo[] | undefined {
        // There are cases when you extend a function by adding properties to it afterwards,
        // we want to strip those extra properties.
        // For deduping purposes, we also want to exclude any declarationNodes if provided.
        const filteredDeclarations = ts.filter(symbol.declarations, d => d !== declarationNode && (!ts.isAssignmentDeclaration(d) || d === symbol.valueDeclaration)) || undefined;
        return getConstructSignatureDefinition() || getCallSignatureDefinition() || ts.map(filteredDeclarations, declaration => createDefinitionInfo(declaration, typeChecker, symbol, node));
        function getConstructSignatureDefinition(): ts.DefinitionInfo[] | undefined {
            // Applicable only if we are in a new expression, or we are on a constructor declaration
            // and in either case the symbol has a construct signature definition, i.e. class
            if (symbol.flags & ts.SymbolFlags.Class && !(symbol.flags & ts.SymbolFlags.Function) && (ts.isNewExpressionTarget(node) || node.kind === ts.SyntaxKind.ConstructorKeyword)) {
                const cls = ts.find(filteredDeclarations, ts.isClassLike) || ts.Debug.fail("Expected declaration to have at least one class-like declaration");
                return getSignatureDefinition(cls.members, /*selectConstructors*/ true);
            }
        }
        function getCallSignatureDefinition(): ts.DefinitionInfo[] | undefined {
            return ts.isCallOrNewExpressionTarget(node) || ts.isNameOfFunctionDeclaration(node)
                ? getSignatureDefinition(filteredDeclarations, /*selectConstructors*/ false)
                : undefined;
        }
        function getSignatureDefinition(signatureDeclarations: readonly ts.Declaration[] | undefined, selectConstructors: boolean): ts.DefinitionInfo[] | undefined {
            if (!signatureDeclarations) {
                return undefined;
            }
            const declarations = signatureDeclarations.filter(selectConstructors ? ts.isConstructorDeclaration : ts.isFunctionLike);
            const declarationsWithBody = declarations.filter(d => !!(<ts.FunctionLikeDeclaration>d).body);
            // declarations defined on the global scope can be defined on multiple files. Get all of them.
            return declarations.length
                ? declarationsWithBody.length !== 0
                    ? declarationsWithBody.map(x => createDefinitionInfo(x, typeChecker, symbol, node))
                    : [createDefinitionInfo(ts.last(declarations), typeChecker, symbol, node)]
                : undefined;
        }
    }
    /** Creates a DefinitionInfo from a Declaration, using the declaration's name if possible. */
    function createDefinitionInfo(declaration: ts.Declaration, checker: ts.TypeChecker, symbol: ts.Symbol, node: ts.Node): ts.DefinitionInfo {
        const symbolName = checker.symbolToString(symbol); // Do not get scoped name, just the name of the symbol
        const symbolKind = ts.SymbolDisplay.getSymbolKind(checker, symbol, node);
        const containerName = symbol.parent ? checker.symbolToString(symbol.parent, node) : "";
        return createDefinitionInfoFromName(checker, declaration, symbolKind, symbolName, containerName);
    }
    /** Creates a DefinitionInfo directly from the name of a declaration. */
    function createDefinitionInfoFromName(checker: ts.TypeChecker, declaration: ts.Declaration, symbolKind: ts.ScriptElementKind, symbolName: string, containerName: string): ts.DefinitionInfo {
        const name = ts.getNameOfDeclaration(declaration) || declaration;
        const sourceFile = name.getSourceFile();
        const textSpan = ts.createTextSpanFromNode(name, sourceFile);
        return {
            fileName: sourceFile.fileName,
            textSpan,
            kind: symbolKind,
            name: symbolName,
            containerKind: undefined!,
            containerName,
            ...ts.FindAllReferences.toContextSpan(textSpan, sourceFile, ts.FindAllReferences.getContextNode(declaration)),
            isLocal: !checker.isDeclarationVisible(declaration)
        };
    }
    function createDefinitionFromSignatureDeclaration(typeChecker: ts.TypeChecker, decl: ts.SignatureDeclaration): ts.DefinitionInfo {
        return createDefinitionInfo(decl, typeChecker, decl.symbol, decl);
    }
    export function findReferenceInPosition(refs: readonly ts.FileReference[], pos: number): ts.FileReference | undefined {
        return ts.find(refs, ref => ts.textRangeContainsPositionInclusive(ref, pos));
    }
    function getDefinitionInfoForFileReference(name: string, targetFileName: string): ts.DefinitionInfo {
        return {
            fileName: targetFileName,
            textSpan: ts.createTextSpanFromBounds(0, 0),
            kind: ts.ScriptElementKind.scriptElement,
            name,
            containerName: undefined!,
            containerKind: undefined!,
        };
    }
    /** Returns a CallLikeExpression where `node` is the target being invoked. */
    function getAncestorCallLikeExpression(node: ts.Node): ts.CallLikeExpression | undefined {
        const target = climbPastManyPropertyAccesses(node);
        const callLike = target.parent;
        return callLike && ts.isCallLikeExpression(callLike) && ts.getInvokedExpression(callLike) === target ? callLike : undefined;
    }
    function climbPastManyPropertyAccesses(node: ts.Node): ts.Node {
        return ts.isRightSideOfPropertyAccess(node) ? climbPastManyPropertyAccesses(node.parent) : node;
    }
    function tryGetSignatureDeclaration(typeChecker: ts.TypeChecker, node: ts.Node): ts.SignatureDeclaration | undefined {
        const callLike = getAncestorCallLikeExpression(node);
        const signature = callLike && typeChecker.getResolvedSignature(callLike);
        // Don't go to a function type, go to the value having that type.
        return ts.tryCast(signature && signature.declaration, (d): d is ts.SignatureDeclaration => ts.isFunctionLike(d) && !ts.isFunctionTypeNode(d));
    }
    function isConstructorLike(node: ts.Node): boolean {
        switch (node.kind) {
            case ts.SyntaxKind.Constructor:
            case ts.SyntaxKind.ConstructorType:
            case ts.SyntaxKind.ConstructSignature:
                return true;
            default:
                return false;
        }
    }
}
