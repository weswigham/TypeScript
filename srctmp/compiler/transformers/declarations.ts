import * as ts from "../ts";
/*@internal*/
export function getDeclarationDiagnostics(host: ts.EmitHost, resolver: ts.EmitResolver, file: ts.SourceFile | undefined): ts.DiagnosticWithLocation[] | undefined {
    const compilerOptions = host.getCompilerOptions();
    const result = ts.transformNodes(resolver, host, compilerOptions, file ? [file] : host.getSourceFiles(), [transformDeclarations], /*allowDtsFiles*/ false);
    return result.diagnostics;
}
/* @internal */
function hasInternalAnnotation(range: ts.CommentRange, currentSourceFile: ts.SourceFile) {
    const comment = currentSourceFile.text.substring(range.pos, range.end);
    return ts.stringContains(comment, "@internal");
}
/* @internal */
export function isInternalDeclaration(node: ts.Node, currentSourceFile: ts.SourceFile) {
    const parseTreeNode = ts.getParseTreeNode(node);
    if (parseTreeNode && parseTreeNode.kind === ts.SyntaxKind.Parameter) {
        const paramIdx = (parseTreeNode.parent as ts.FunctionLike).parameters.indexOf((parseTreeNode as ts.ParameterDeclaration));
        const previousSibling = paramIdx > 0 ? (parseTreeNode.parent as ts.FunctionLike).parameters[paramIdx - 1] : undefined;
        const text = currentSourceFile.text;
        const commentRanges = previousSibling
            ? ts.concatenate(
            // to handle
            // ... parameters, /* @internal */
            // public param: string
            ts.getTrailingCommentRanges(text, ts.skipTrivia(text, previousSibling.end + 1, /* stopAfterLineBreak */ false, /* stopAtComments */ true)), ts.getLeadingCommentRanges(text, node.pos))
            : ts.getTrailingCommentRanges(text, ts.skipTrivia(text, node.pos, /* stopAfterLineBreak */ false, /* stopAtComments */ true));
        return commentRanges && commentRanges.length && hasInternalAnnotation(ts.last(commentRanges), currentSourceFile);
    }
    const leadingCommentRanges = parseTreeNode && ts.getLeadingCommentRangesOfNode(parseTreeNode, currentSourceFile);
    return !!ts.forEach(leadingCommentRanges, range => {
        return hasInternalAnnotation(range, currentSourceFile);
    });
}
/* @internal */
const declarationEmitNodeBuilderFlags = ts.NodeBuilderFlags.MultilineObjectLiterals |
    ts.NodeBuilderFlags.WriteClassExpressionAsTypeLiteral |
    ts.NodeBuilderFlags.UseTypeOfFunction |
    ts.NodeBuilderFlags.UseStructuralFallback |
    ts.NodeBuilderFlags.AllowEmptyTuple |
    ts.NodeBuilderFlags.GenerateNamesForShadowedTypeParams |
    ts.NodeBuilderFlags.NoTruncation;
/**
 * Transforms a ts file into a .d.ts file
 * This process requires type information, which is retrieved through the emit resolver. Because of this,
 * in many places this transformer assumes it will be operating on parse tree nodes directly.
 * This means that _no transforms should be allowed to occur before this one_.
 */
/* @internal */
export function transformDeclarations(context: ts.TransformationContext) {
    const throwDiagnostic = () => ts.Debug.fail("Diagnostic emitted without context");
    let getSymbolAccessibilityDiagnostic: ts.GetSymbolAccessibilityDiagnostic = throwDiagnostic;
    let needsDeclare = true;
    let isBundledEmit = false;
    let resultHasExternalModuleIndicator = false;
    let needsScopeFixMarker = false;
    let resultHasScopeMarker = false;
    let enclosingDeclaration: ts.Node;
    let necessaryTypeReferences: ts.Map<true> | undefined;
    let lateMarkedStatements: ts.LateVisibilityPaintedStatement[] | undefined;
    let lateStatementReplacementMap: ts.Map<ts.VisitResult<ts.LateVisibilityPaintedStatement | ts.ExportAssignment>>;
    let suppressNewDiagnosticContexts: boolean;
    let exportedModulesFromDeclarationEmit: ts.Symbol[] | undefined;
    const host = context.getEmitHost();
    const symbolTracker: ts.SymbolTracker = {
        trackSymbol,
        reportInaccessibleThisError,
        reportInaccessibleUniqueSymbolError,
        reportPrivateInBaseOfClassExpression,
        reportLikelyUnsafeImportRequiredError,
        moduleResolverHost: host,
        trackReferencedAmbientModule,
        trackExternalModuleSymbolOfImportTypeNode
    };
    let errorNameNode: ts.DeclarationName | undefined;
    let currentSourceFile: ts.SourceFile;
    let refs: ts.Map<ts.SourceFile>;
    let libs: ts.Map<boolean>;
    let emittedImports: readonly ts.AnyImportSyntax[] | undefined; // must be declared in container so it can be `undefined` while transformer's first pass
    const resolver = context.getEmitResolver();
    const options = context.getCompilerOptions();
    const { noResolve, stripInternal } = options;
    return transformRoot;
    function recordTypeReferenceDirectivesIfNecessary(typeReferenceDirectives: readonly string[] | undefined): void {
        if (!typeReferenceDirectives) {
            return;
        }
        necessaryTypeReferences = necessaryTypeReferences || ts.createMap<true>();
        for (const ref of typeReferenceDirectives) {
            necessaryTypeReferences.set(ref, true);
        }
    }
    function trackReferencedAmbientModule(node: ts.ModuleDeclaration, symbol: ts.Symbol) {
        // If it is visible via `// <reference types="..."/>`, then we should just use that
        const directives = resolver.getTypeReferenceDirectivesForSymbol(symbol, ts.SymbolFlags.All);
        if (ts.length(directives)) {
            return recordTypeReferenceDirectivesIfNecessary(directives);
        }
        // Otherwise we should emit a path-based reference
        const container = ts.getSourceFileOfNode(node);
        refs.set("" + ts.getOriginalNodeId(container), container);
    }
    function handleSymbolAccessibilityError(symbolAccessibilityResult: ts.SymbolAccessibilityResult) {
        if (symbolAccessibilityResult.accessibility === ts.SymbolAccessibility.Accessible) {
            // Add aliases back onto the possible imports list if they're not there so we can try them again with updated visibility info
            if (symbolAccessibilityResult && symbolAccessibilityResult.aliasesToMakeVisible) {
                if (!lateMarkedStatements) {
                    lateMarkedStatements = symbolAccessibilityResult.aliasesToMakeVisible;
                }
                else {
                    for (const ref of symbolAccessibilityResult.aliasesToMakeVisible) {
                        ts.pushIfUnique(lateMarkedStatements, ref);
                    }
                }
            }
            // TODO: Do all these accessibility checks inside/after the first pass in the checker when declarations are enabled, if possible
        }
        else {
            // Report error
            const errorInfo = getSymbolAccessibilityDiagnostic(symbolAccessibilityResult);
            if (errorInfo) {
                if (errorInfo.typeName) {
                    context.addDiagnostic(ts.createDiagnosticForNode(symbolAccessibilityResult.errorNode || errorInfo.errorNode, errorInfo.diagnosticMessage, ts.getTextOfNode(errorInfo.typeName), symbolAccessibilityResult.errorSymbolName, symbolAccessibilityResult.errorModuleName));
                }
                else {
                    context.addDiagnostic(ts.createDiagnosticForNode(symbolAccessibilityResult.errorNode || errorInfo.errorNode, errorInfo.diagnosticMessage, symbolAccessibilityResult.errorSymbolName, symbolAccessibilityResult.errorModuleName));
                }
            }
        }
    }
    function trackExternalModuleSymbolOfImportTypeNode(symbol: ts.Symbol) {
        if (!isBundledEmit) {
            (exportedModulesFromDeclarationEmit || (exportedModulesFromDeclarationEmit = [])).push(symbol);
        }
    }
    function trackSymbol(symbol: ts.Symbol, enclosingDeclaration?: ts.Node, meaning?: ts.SymbolFlags) {
        if (symbol.flags & ts.SymbolFlags.TypeParameter)
            return;
        handleSymbolAccessibilityError(resolver.isSymbolAccessible(symbol, enclosingDeclaration, meaning, /*shouldComputeAliasesToMakeVisible*/ true));
        recordTypeReferenceDirectivesIfNecessary(resolver.getTypeReferenceDirectivesForSymbol(symbol, meaning));
    }
    function reportPrivateInBaseOfClassExpression(propertyName: string) {
        if (errorNameNode) {
            context.addDiagnostic(ts.createDiagnosticForNode(errorNameNode, ts.Diagnostics.Property_0_of_exported_class_expression_may_not_be_private_or_protected, propertyName));
        }
    }
    function reportInaccessibleUniqueSymbolError() {
        if (errorNameNode) {
            context.addDiagnostic(ts.createDiagnosticForNode(errorNameNode, ts.Diagnostics.The_inferred_type_of_0_references_an_inaccessible_1_type_A_type_annotation_is_necessary, ts.declarationNameToString(errorNameNode), "unique symbol"));
        }
    }
    function reportInaccessibleThisError() {
        if (errorNameNode) {
            context.addDiagnostic(ts.createDiagnosticForNode(errorNameNode, ts.Diagnostics.The_inferred_type_of_0_references_an_inaccessible_1_type_A_type_annotation_is_necessary, ts.declarationNameToString(errorNameNode), "this"));
        }
    }
    function reportLikelyUnsafeImportRequiredError(specifier: string) {
        if (errorNameNode) {
            context.addDiagnostic(ts.createDiagnosticForNode(errorNameNode, ts.Diagnostics.The_inferred_type_of_0_cannot_be_named_without_a_reference_to_1_This_is_likely_not_portable_A_type_annotation_is_necessary, ts.declarationNameToString(errorNameNode), specifier));
        }
    }
    function transformDeclarationsForJS(sourceFile: ts.SourceFile, bundled?: boolean) {
        const oldDiag = getSymbolAccessibilityDiagnostic;
        getSymbolAccessibilityDiagnostic = (s) => ({
            diagnosticMessage: s.errorModuleName
                ? ts.Diagnostics.Declaration_emit_for_this_file_requires_using_private_name_0_from_module_1_An_explicit_type_annotation_may_unblock_declaration_emit
                : ts.Diagnostics.Declaration_emit_for_this_file_requires_using_private_name_0_An_explicit_type_annotation_may_unblock_declaration_emit,
            errorNode: s.errorNode || sourceFile
        });
        const result = resolver.getDeclarationStatementsForSourceFile(sourceFile, declarationEmitNodeBuilderFlags, symbolTracker, bundled);
        getSymbolAccessibilityDiagnostic = oldDiag;
        return result;
    }
    function transformRoot(node: ts.Bundle): ts.Bundle;
    function transformRoot(node: ts.SourceFile): ts.SourceFile;
    function transformRoot(node: ts.SourceFile | ts.Bundle): ts.SourceFile | ts.Bundle;
    function transformRoot(node: ts.SourceFile | ts.Bundle) {
        if (node.kind === ts.SyntaxKind.SourceFile && node.isDeclarationFile) {
            return node;
        }
        if (node.kind === ts.SyntaxKind.Bundle) {
            isBundledEmit = true;
            refs = ts.createMap<ts.SourceFile>();
            libs = ts.createMap<boolean>();
            let hasNoDefaultLib = false;
            const bundle = ts.createBundle(ts.map(node.sourceFiles, sourceFile => {
                if (sourceFile.isDeclarationFile)
                    return undefined!; // Omit declaration files from bundle results, too // TODO: GH#18217
                hasNoDefaultLib = hasNoDefaultLib || sourceFile.hasNoDefaultLib;
                currentSourceFile = sourceFile;
                enclosingDeclaration = sourceFile;
                lateMarkedStatements = undefined;
                suppressNewDiagnosticContexts = false;
                lateStatementReplacementMap = ts.createMap();
                getSymbolAccessibilityDiagnostic = throwDiagnostic;
                needsScopeFixMarker = false;
                resultHasScopeMarker = false;
                collectReferences(sourceFile, refs);
                collectLibs(sourceFile, libs);
                if (ts.isExternalOrCommonJsModule(sourceFile) || ts.isJsonSourceFile(sourceFile)) {
                    resultHasExternalModuleIndicator = false; // unused in external module bundle emit (all external modules are within module blocks, therefore are known to be modules)
                    needsDeclare = false;
                    const statements = ts.isSourceFileJS(sourceFile) ? ts.createNodeArray(transformDeclarationsForJS(sourceFile, /*bundled*/ true)) : ts.visitNodes(sourceFile.statements, visitDeclarationStatements);
                    const newFile = ts.updateSourceFileNode(sourceFile, [ts.createModuleDeclaration([], [ts.createModifier(ts.SyntaxKind.DeclareKeyword)], ts.createLiteral(ts.getResolvedExternalModuleName(context.getEmitHost(), sourceFile)), ts.createModuleBlock(ts.setTextRange(ts.createNodeArray(transformAndReplaceLatePaintedStatements(statements)), sourceFile.statements)))], /*isDeclarationFile*/ true, /*referencedFiles*/ [], /*typeReferences*/ [], /*hasNoDefaultLib*/ false, /*libReferences*/ []);
                    return newFile;
                }
                needsDeclare = true;
                const updated = ts.isSourceFileJS(sourceFile) ? ts.createNodeArray(transformDeclarationsForJS(sourceFile)) : ts.visitNodes(sourceFile.statements, visitDeclarationStatements);
                return ts.updateSourceFileNode(sourceFile, transformAndReplaceLatePaintedStatements(updated), /*isDeclarationFile*/ true, /*referencedFiles*/ [], /*typeReferences*/ [], /*hasNoDefaultLib*/ false, /*libReferences*/ []);
            }), ts.mapDefined(node.prepends, prepend => {
                if (prepend.kind === ts.SyntaxKind.InputFiles) {
                    const sourceFile = ts.createUnparsedSourceFile(prepend, "dts", stripInternal);
                    hasNoDefaultLib = hasNoDefaultLib || !!sourceFile.hasNoDefaultLib;
                    collectReferences(sourceFile, refs);
                    recordTypeReferenceDirectivesIfNecessary(sourceFile.typeReferenceDirectives);
                    collectLibs(sourceFile, libs);
                    return sourceFile;
                }
                return prepend;
            }));
            bundle.syntheticFileReferences = [];
            bundle.syntheticTypeReferences = getFileReferencesForUsedTypeReferences();
            bundle.syntheticLibReferences = getLibReferences();
            bundle.hasNoDefaultLib = hasNoDefaultLib;
            const outputFilePath = ts.getDirectoryPath(ts.normalizeSlashes((ts.getOutputPathsFor(node, host, /*forceDtsPaths*/ true).declarationFilePath!)));
            const referenceVisitor = mapReferencesIntoArray((bundle.syntheticFileReferences as ts.FileReference[]), outputFilePath);
            refs.forEach(referenceVisitor);
            return bundle;
        }
        // Single source file
        needsDeclare = true;
        needsScopeFixMarker = false;
        resultHasScopeMarker = false;
        enclosingDeclaration = node;
        currentSourceFile = node;
        getSymbolAccessibilityDiagnostic = throwDiagnostic;
        isBundledEmit = false;
        resultHasExternalModuleIndicator = false;
        suppressNewDiagnosticContexts = false;
        lateMarkedStatements = undefined;
        lateStatementReplacementMap = ts.createMap();
        necessaryTypeReferences = undefined;
        refs = collectReferences(currentSourceFile, ts.createMap());
        libs = collectLibs(currentSourceFile, ts.createMap());
        const references: ts.FileReference[] = [];
        const outputFilePath = ts.getDirectoryPath(ts.normalizeSlashes((ts.getOutputPathsFor(node, host, /*forceDtsPaths*/ true).declarationFilePath!)));
        const referenceVisitor = mapReferencesIntoArray(references, outputFilePath);
        let combinedStatements: ts.NodeArray<ts.Statement>;
        if (ts.isSourceFileJS(currentSourceFile)) {
            combinedStatements = ts.createNodeArray(transformDeclarationsForJS(node));
            refs.forEach(referenceVisitor);
            emittedImports = ts.filter(combinedStatements, ts.isAnyImportSyntax);
        }
        else {
            const statements = ts.visitNodes(node.statements, visitDeclarationStatements);
            combinedStatements = ts.setTextRange(ts.createNodeArray(transformAndReplaceLatePaintedStatements(statements)), node.statements);
            refs.forEach(referenceVisitor);
            emittedImports = ts.filter(combinedStatements, ts.isAnyImportSyntax);
            if (ts.isExternalModule(node) && (!resultHasExternalModuleIndicator || (needsScopeFixMarker && !resultHasScopeMarker))) {
                combinedStatements = ts.setTextRange(ts.createNodeArray([...combinedStatements, ts.createEmptyExports()]), combinedStatements);
            }
        }
        const updated = ts.updateSourceFileNode(node, combinedStatements, /*isDeclarationFile*/ true, references, getFileReferencesForUsedTypeReferences(), node.hasNoDefaultLib, getLibReferences());
        updated.exportedModulesFromDeclarationEmit = exportedModulesFromDeclarationEmit;
        return updated;
        function getLibReferences() {
            return ts.map(ts.arrayFrom(libs.keys()), lib => ({ fileName: lib, pos: -1, end: -1 }));
        }
        function getFileReferencesForUsedTypeReferences() {
            return necessaryTypeReferences ? ts.mapDefined(ts.arrayFrom(necessaryTypeReferences.keys()), getFileReferenceForTypeName) : [];
        }
        function getFileReferenceForTypeName(typeName: string): ts.FileReference | undefined {
            // Elide type references for which we have imports
            if (emittedImports) {
                for (const importStatement of emittedImports) {
                    if (ts.isImportEqualsDeclaration(importStatement) && ts.isExternalModuleReference(importStatement.moduleReference)) {
                        const expr = importStatement.moduleReference.expression;
                        if (ts.isStringLiteralLike(expr) && expr.text === typeName) {
                            return undefined;
                        }
                    }
                    else if (ts.isImportDeclaration(importStatement) && ts.isStringLiteral(importStatement.moduleSpecifier) && importStatement.moduleSpecifier.text === typeName) {
                        return undefined;
                    }
                }
            }
            return { fileName: typeName, pos: -1, end: -1 };
        }
        function mapReferencesIntoArray(references: ts.FileReference[], outputFilePath: string): (file: ts.SourceFile) => void {
            return file => {
                let declFileName: string;
                if (file.isDeclarationFile) { // Neither decl files or js should have their refs changed
                    declFileName = file.fileName;
                }
                else {
                    if (isBundledEmit && ts.contains((node as ts.Bundle).sourceFiles, file))
                        return; // Omit references to files which are being merged
                    const paths = ts.getOutputPathsFor(file, host, /*forceDtsPaths*/ true);
                    declFileName = paths.declarationFilePath || paths.jsFilePath || file.fileName;
                }
                if (declFileName) {
                    const specifier = ts.moduleSpecifiers.getModuleSpecifier(
                    // We pathify the baseUrl since we pathify the other paths here, so we can still easily check if the other paths are within the baseUrl
                    // TODO: Should we _always_ be pathifying the baseUrl as we read it in?
                    { ...options, baseUrl: options.baseUrl && ts.toPath(options.baseUrl, host.getCurrentDirectory(), host.getCanonicalFileName) }, currentSourceFile, ts.toPath(outputFilePath, host.getCurrentDirectory(), host.getCanonicalFileName), ts.toPath(declFileName, host.getCurrentDirectory(), host.getCanonicalFileName), host, host.getSourceFiles(), 
                    /*preferences*/ undefined, host.redirectTargetsMap);
                    if (!ts.pathIsRelative(specifier)) {
                        // If some compiler option/symlink/whatever allows access to the file containing the ambient module declaration
                        // via a non-relative name, emit a type reference directive to that non-relative name, rather than
                        // a relative path to the declaration file
                        recordTypeReferenceDirectivesIfNecessary([specifier]);
                        return;
                    }
                    let fileName = ts.getRelativePathToDirectoryOrUrl(outputFilePath, declFileName, host.getCurrentDirectory(), host.getCanonicalFileName, 
                    /*isAbsolutePathAnUrl*/ false);
                    if (ts.startsWith(fileName, "./") && ts.hasExtension(fileName)) {
                        fileName = fileName.substring(2);
                    }
                    // omit references to files from node_modules (npm may disambiguate module
                    // references when installing this package, making the path is unreliable).
                    if (ts.startsWith(fileName, "node_modules/") || fileName.indexOf("/node_modules/") !== -1) {
                        return;
                    }
                    references.push({ pos: -1, end: -1, fileName });
                }
            };
        }
    }
    function collectReferences(sourceFile: ts.SourceFile | ts.UnparsedSource, ret: ts.Map<ts.SourceFile>) {
        if (noResolve || (!ts.isUnparsedSource(sourceFile) && ts.isSourceFileJS(sourceFile)))
            return ret;
        ts.forEach(sourceFile.referencedFiles, f => {
            const elem = host.getSourceFileFromReference(sourceFile, f);
            if (elem) {
                ret.set("" + ts.getOriginalNodeId(elem), elem);
            }
        });
        return ret;
    }
    function collectLibs(sourceFile: ts.SourceFile | ts.UnparsedSource, ret: ts.Map<boolean>) {
        ts.forEach(sourceFile.libReferenceDirectives, ref => {
            const lib = host.getLibFileFromReference(ref);
            if (lib) {
                ret.set(ref.fileName.toLocaleLowerCase(), true);
            }
        });
        return ret;
    }
    function filterBindingPatternInitializers(name: ts.BindingName) {
        if (name.kind === ts.SyntaxKind.Identifier) {
            return name;
        }
        else {
            if (name.kind === ts.SyntaxKind.ArrayBindingPattern) {
                return ts.updateArrayBindingPattern(name, ts.visitNodes(name.elements, visitBindingElement));
            }
            else {
                return ts.updateObjectBindingPattern(name, ts.visitNodes(name.elements, visitBindingElement));
            }
        }
        function visitBindingElement<T extends ts.ArrayBindingElement>(elem: T): T;
        function visitBindingElement(elem: ts.ArrayBindingElement): ts.ArrayBindingElement {
            if (elem.kind === ts.SyntaxKind.OmittedExpression) {
                return elem;
            }
            return ts.updateBindingElement(elem, elem.dotDotDotToken, elem.propertyName, filterBindingPatternInitializers(elem.name), shouldPrintWithInitializer(elem) ? elem.initializer : undefined);
        }
    }
    function ensureParameter(p: ts.ParameterDeclaration, modifierMask?: ts.ModifierFlags, type?: ts.TypeNode): ts.ParameterDeclaration {
        let oldDiag: typeof getSymbolAccessibilityDiagnostic | undefined;
        if (!suppressNewDiagnosticContexts) {
            oldDiag = getSymbolAccessibilityDiagnostic;
            getSymbolAccessibilityDiagnostic = ts.createGetSymbolAccessibilityDiagnosticForNode(p);
        }
        const newParam = ts.updateParameter(p, 
        /*decorators*/ undefined, maskModifiers(p, modifierMask), p.dotDotDotToken, filterBindingPatternInitializers(p.name), resolver.isOptionalParameter(p) ? (p.questionToken || ts.createToken(ts.SyntaxKind.QuestionToken)) : undefined, ensureType(p, type || p.type, /*ignorePrivate*/ true), // Ignore private param props, since this type is going straight back into a param
        ensureNoInitializer(p));
        if (!suppressNewDiagnosticContexts) {
            getSymbolAccessibilityDiagnostic = oldDiag!;
        }
        return newParam;
    }
    function shouldPrintWithInitializer(node: ts.Node) {
        return canHaveLiteralInitializer(node) && resolver.isLiteralConstDeclaration((ts.getParseTreeNode(node) as CanHaveLiteralInitializer)); // TODO: Make safe
    }
    function ensureNoInitializer(node: CanHaveLiteralInitializer) {
        if (shouldPrintWithInitializer(node)) {
            return resolver.createLiteralConstValue((ts.getParseTreeNode(node) as CanHaveLiteralInitializer), symbolTracker); // TODO: Make safe
        }
        return undefined;
    }
    type HasInferredType = ts.FunctionDeclaration | ts.MethodDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration | ts.BindingElement | ts.ConstructSignatureDeclaration | ts.VariableDeclaration | ts.MethodSignature | ts.CallSignatureDeclaration | ts.ParameterDeclaration | ts.PropertyDeclaration | ts.PropertySignature;
    function ensureType(node: HasInferredType, type: ts.TypeNode | undefined, ignorePrivate?: boolean): ts.TypeNode | undefined {
        if (!ignorePrivate && ts.hasModifier(node, ts.ModifierFlags.Private)) {
            // Private nodes emit no types (except private parameter properties, whose parameter types are actually visible)
            return;
        }
        if (shouldPrintWithInitializer(node)) {
            // Literal const declarations will have an initializer ensured rather than a type
            return;
        }
        const shouldUseResolverType = node.kind === ts.SyntaxKind.Parameter &&
            (resolver.isRequiredInitializedParameter(node) ||
                resolver.isOptionalUninitializedParameterProperty(node));
        if (type && !shouldUseResolverType) {
            return ts.visitNode(type, visitDeclarationSubtree);
        }
        if (!ts.getParseTreeNode(node)) {
            return type ? ts.visitNode(type, visitDeclarationSubtree) : ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
        }
        if (node.kind === ts.SyntaxKind.SetAccessor) {
            // Set accessors with no associated type node (from it's param or get accessor return) are `any` since they are never contextually typed right now
            // (The inferred type here will be void, but the old declaration emitter printed `any`, so this replicates that)
            return ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
        }
        errorNameNode = node.name;
        let oldDiag: typeof getSymbolAccessibilityDiagnostic;
        if (!suppressNewDiagnosticContexts) {
            oldDiag = getSymbolAccessibilityDiagnostic;
            getSymbolAccessibilityDiagnostic = ts.createGetSymbolAccessibilityDiagnosticForNode(node);
        }
        if (node.kind === ts.SyntaxKind.VariableDeclaration || node.kind === ts.SyntaxKind.BindingElement) {
            return cleanup(resolver.createTypeOfDeclaration(node, enclosingDeclaration, declarationEmitNodeBuilderFlags, symbolTracker));
        }
        if (node.kind === ts.SyntaxKind.Parameter
            || node.kind === ts.SyntaxKind.PropertyDeclaration
            || node.kind === ts.SyntaxKind.PropertySignature) {
            if (!node.initializer)
                return cleanup(resolver.createTypeOfDeclaration(node, enclosingDeclaration, declarationEmitNodeBuilderFlags, symbolTracker, shouldUseResolverType));
            return cleanup(resolver.createTypeOfDeclaration(node, enclosingDeclaration, declarationEmitNodeBuilderFlags, symbolTracker, shouldUseResolverType) || resolver.createTypeOfExpression(node.initializer, enclosingDeclaration, declarationEmitNodeBuilderFlags, symbolTracker));
        }
        return cleanup(resolver.createReturnTypeOfSignatureDeclaration(node, enclosingDeclaration, declarationEmitNodeBuilderFlags, symbolTracker));
        function cleanup(returnValue: ts.TypeNode | undefined) {
            errorNameNode = undefined;
            if (!suppressNewDiagnosticContexts) {
                getSymbolAccessibilityDiagnostic = oldDiag;
            }
            return returnValue || ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
        }
    }
    function isDeclarationAndNotVisible(node: ts.NamedDeclaration) {
        node = (ts.getParseTreeNode(node) as ts.NamedDeclaration);
        switch (node.kind) {
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.ModuleDeclaration:
            case ts.SyntaxKind.InterfaceDeclaration:
            case ts.SyntaxKind.ClassDeclaration:
            case ts.SyntaxKind.TypeAliasDeclaration:
            case ts.SyntaxKind.EnumDeclaration:
                return !resolver.isDeclarationVisible(node);
            // The following should be doing their own visibility checks based on filtering their members
            case ts.SyntaxKind.VariableDeclaration:
                return !getBindingNameVisible((node as ts.VariableDeclaration));
            case ts.SyntaxKind.ImportEqualsDeclaration:
            case ts.SyntaxKind.ImportDeclaration:
            case ts.SyntaxKind.ExportDeclaration:
            case ts.SyntaxKind.ExportAssignment:
                return false;
        }
        return false;
    }
    function getBindingNameVisible(elem: ts.BindingElement | ts.VariableDeclaration | ts.OmittedExpression): boolean {
        if (ts.isOmittedExpression(elem)) {
            return false;
        }
        if (ts.isBindingPattern(elem.name)) {
            // If any child binding pattern element has been marked visible (usually by collect linked aliases), then this is visible
            return ts.some(elem.name.elements, getBindingNameVisible);
        }
        else {
            return resolver.isDeclarationVisible(elem);
        }
    }
    function updateParamsList(node: ts.Node, params: ts.NodeArray<ts.ParameterDeclaration>, modifierMask?: ts.ModifierFlags) {
        if (ts.hasModifier(node, ts.ModifierFlags.Private)) {
            return undefined!; // TODO: GH#18217
        }
        const newParams = ts.map(params, p => ensureParameter(p, modifierMask));
        if (!newParams) {
            return undefined!; // TODO: GH#18217
        }
        return ts.createNodeArray(newParams, params.hasTrailingComma);
    }
    function updateAccessorParamsList(input: ts.AccessorDeclaration, isPrivate: boolean) {
        let newParams: ts.ParameterDeclaration[] | undefined;
        if (!isPrivate) {
            const thisParameter = ts.getThisParameter(input);
            if (thisParameter) {
                newParams = [ensureParameter(thisParameter)];
            }
        }
        if (ts.isSetAccessorDeclaration(input)) {
            let newValueParameter: ts.ParameterDeclaration | undefined;
            if (!isPrivate) {
                const valueParameter = ts.getSetAccessorValueParameter(input);
                if (valueParameter) {
                    const accessorType = getTypeAnnotationFromAllAccessorDeclarations(input, resolver.getAllAccessorDeclarations(input));
                    newValueParameter = ensureParameter(valueParameter, /*modifierMask*/ undefined, accessorType);
                }
            }
            if (!newValueParameter) {
                newValueParameter = ts.createParameter(
                /*decorators*/ undefined, 
                /*modifiers*/ undefined, 
                /*dotDotDotToken*/ undefined, "value");
            }
            newParams = ts.append(newParams, newValueParameter);
        }
        return ts.createNodeArray(newParams || ts.emptyArray) as ts.NodeArray<ts.ParameterDeclaration>;
    }
    function ensureTypeParams(node: ts.Node, params: ts.NodeArray<ts.TypeParameterDeclaration> | undefined) {
        return ts.hasModifier(node, ts.ModifierFlags.Private) ? undefined : ts.visitNodes(params, visitDeclarationSubtree);
    }
    function isEnclosingDeclaration(node: ts.Node) {
        return ts.isSourceFile(node)
            || ts.isTypeAliasDeclaration(node)
            || ts.isModuleDeclaration(node)
            || ts.isClassDeclaration(node)
            || ts.isInterfaceDeclaration(node)
            || ts.isFunctionLike(node)
            || ts.isIndexSignatureDeclaration(node)
            || ts.isMappedTypeNode(node);
    }
    function checkEntityNameVisibility(entityName: ts.EntityNameOrEntityNameExpression, enclosingDeclaration: ts.Node) {
        const visibilityResult = resolver.isEntityNameVisible(entityName, enclosingDeclaration);
        handleSymbolAccessibilityError(visibilityResult);
        recordTypeReferenceDirectivesIfNecessary(resolver.getTypeReferenceDirectivesForEntityName(entityName));
    }
    function preserveJsDoc<T extends ts.Node>(updated: T, original: ts.Node): T {
        if (ts.hasJSDocNodes(updated) && ts.hasJSDocNodes(original)) {
            updated.jsDoc = original.jsDoc;
        }
        return ts.setCommentRange(updated, ts.getCommentRange(original));
    }
    function rewriteModuleSpecifier<T extends ts.Node>(parent: ts.ImportEqualsDeclaration | ts.ImportDeclaration | ts.ExportDeclaration | ts.ModuleDeclaration | ts.ImportTypeNode, input: T | undefined): T | ts.StringLiteral {
        if (!input)
            return undefined!; // TODO: GH#18217
        resultHasExternalModuleIndicator = resultHasExternalModuleIndicator || (parent.kind !== ts.SyntaxKind.ModuleDeclaration && parent.kind !== ts.SyntaxKind.ImportType);
        if (ts.isStringLiteralLike(input)) {
            if (isBundledEmit) {
                const newName = ts.getExternalModuleNameFromDeclaration(context.getEmitHost(), resolver, parent);
                if (newName) {
                    return ts.createLiteral(newName);
                }
            }
            else {
                const symbol = resolver.getSymbolOfExternalModuleSpecifier(input);
                if (symbol) {
                    (exportedModulesFromDeclarationEmit || (exportedModulesFromDeclarationEmit = [])).push(symbol);
                }
            }
        }
        return input;
    }
    function transformImportEqualsDeclaration(decl: ts.ImportEqualsDeclaration) {
        if (!resolver.isDeclarationVisible(decl))
            return;
        if (decl.moduleReference.kind === ts.SyntaxKind.ExternalModuleReference) {
            // Rewrite external module names if necessary
            const specifier = ts.getExternalModuleImportEqualsDeclarationExpression(decl);
            return ts.updateImportEqualsDeclaration(decl, 
            /*decorators*/ undefined, decl.modifiers, decl.name, ts.updateExternalModuleReference(decl.moduleReference, rewriteModuleSpecifier(decl, specifier)));
        }
        else {
            const oldDiag = getSymbolAccessibilityDiagnostic;
            getSymbolAccessibilityDiagnostic = ts.createGetSymbolAccessibilityDiagnosticForNode(decl);
            checkEntityNameVisibility(decl.moduleReference, enclosingDeclaration);
            getSymbolAccessibilityDiagnostic = oldDiag;
            return decl;
        }
    }
    function transformImportDeclaration(decl: ts.ImportDeclaration) {
        if (!decl.importClause) {
            // import "mod" - possibly needed for side effects? (global interface patches, module augmentations, etc)
            return ts.updateImportDeclaration(decl, 
            /*decorators*/ undefined, decl.modifiers, decl.importClause, rewriteModuleSpecifier(decl, decl.moduleSpecifier));
        }
        // The `importClause` visibility corresponds to the default's visibility.
        const visibleDefaultBinding = decl.importClause && decl.importClause.name && resolver.isDeclarationVisible(decl.importClause) ? decl.importClause.name : undefined;
        if (!decl.importClause.namedBindings) {
            // No named bindings (either namespace or list), meaning the import is just default or should be elided
            return visibleDefaultBinding && ts.updateImportDeclaration(decl, /*decorators*/ undefined, decl.modifiers, ts.updateImportClause(decl.importClause, visibleDefaultBinding, 
            /*namedBindings*/ undefined), rewriteModuleSpecifier(decl, decl.moduleSpecifier));
        }
        if (decl.importClause.namedBindings.kind === ts.SyntaxKind.NamespaceImport) {
            // Namespace import (optionally with visible default)
            const namedBindings = resolver.isDeclarationVisible(decl.importClause.namedBindings) ? decl.importClause.namedBindings : /*namedBindings*/ undefined;
            return visibleDefaultBinding || namedBindings ? ts.updateImportDeclaration(decl, /*decorators*/ undefined, decl.modifiers, ts.updateImportClause(decl.importClause, visibleDefaultBinding, namedBindings), rewriteModuleSpecifier(decl, decl.moduleSpecifier)) : undefined;
        }
        // Named imports (optionally with visible default)
        const bindingList = ts.mapDefined(decl.importClause.namedBindings.elements, b => resolver.isDeclarationVisible(b) ? b : undefined);
        if ((bindingList && bindingList.length) || visibleDefaultBinding) {
            return ts.updateImportDeclaration(decl, 
            /*decorators*/ undefined, decl.modifiers, ts.updateImportClause(decl.importClause, visibleDefaultBinding, bindingList && bindingList.length ? ts.updateNamedImports(decl.importClause.namedBindings, bindingList) : undefined), rewriteModuleSpecifier(decl, decl.moduleSpecifier));
        }
        // Nothing visible
    }
    function transformAndReplaceLatePaintedStatements(statements: ts.NodeArray<ts.Statement>): ts.NodeArray<ts.Statement> {
        // This is a `while` loop because `handleSymbolAccessibilityError` can see additional import aliases marked as visible during
        // error handling which must now be included in the output and themselves checked for errors.
        // For example:
        // ```
        // module A {
        //   export module Q {}
        //   import B = Q;
        //   import C = B;
        //   export import D = C;
        // }
        // ```
        // In such a scenario, only Q and D are initially visible, but we don't consider imports as private names - instead we say they if they are referenced they must
        // be recorded. So while checking D's visibility we mark C as visible, then we must check C which in turn marks B, completing the chain of
        // dependent imports and allowing a valid declaration file output. Today, this dependent alias marking only happens for internal import aliases.
        while (ts.length(lateMarkedStatements)) {
            const i = lateMarkedStatements!.shift()!;
            if (!ts.isLateVisibilityPaintedStatement(i)) {
                return ts.Debug.fail(`Late replaced statement was found which is not handled by the declaration transformer!: ${(ts as any).SyntaxKind ? (ts as any).SyntaxKind[(i as any).kind] : (i as any).kind}`);
            }
            const priorNeedsDeclare = needsDeclare;
            needsDeclare = i.parent && ts.isSourceFile(i.parent) && !(ts.isExternalModule(i.parent) && isBundledEmit);
            const result = transformTopLevelDeclaration(i);
            needsDeclare = priorNeedsDeclare;
            lateStatementReplacementMap.set("" + ts.getOriginalNodeId(i), result);
        }
        // And lastly, we need to get the final form of all those indetermine import declarations from before and add them to the output list
        // (and remove them from the set to examine for outter declarations)
        return ts.visitNodes(statements, visitLateVisibilityMarkedStatements);
        function visitLateVisibilityMarkedStatements(statement: ts.Statement) {
            if (ts.isLateVisibilityPaintedStatement(statement)) {
                const key = "" + ts.getOriginalNodeId(statement);
                if (lateStatementReplacementMap.has(key)) {
                    const result = lateStatementReplacementMap.get(key);
                    lateStatementReplacementMap.delete(key);
                    if (result) {
                        if (ts.isArray(result) ? ts.some(result, ts.needsScopeMarker) : ts.needsScopeMarker(result)) {
                            // Top-level declarations in .d.ts files are always considered exported even without a modifier unless there's an export assignment or specifier
                            needsScopeFixMarker = true;
                        }
                        if (ts.isSourceFile(statement.parent) && (ts.isArray(result) ? ts.some(result, ts.isExternalModuleIndicator) : ts.isExternalModuleIndicator(result))) {
                            resultHasExternalModuleIndicator = true;
                        }
                    }
                    return result;
                }
            }
            return statement;
        }
    }
    function visitDeclarationSubtree(input: ts.Node): ts.VisitResult<ts.Node> {
        if (shouldStripInternal(input))
            return;
        if (ts.isDeclaration(input)) {
            if (isDeclarationAndNotVisible(input))
                return;
            if (ts.hasDynamicName(input) && !resolver.isLateBound((ts.getParseTreeNode(input) as ts.Declaration))) {
                return;
            }
        }
        // Elide implementation signatures from overload sets
        if (ts.isFunctionLike(input) && resolver.isImplementationOfOverload(input))
            return;
        // Elide semicolon class statements
        if (ts.isSemicolonClassElement(input))
            return;
        let previousEnclosingDeclaration: typeof enclosingDeclaration;
        if (isEnclosingDeclaration(input)) {
            previousEnclosingDeclaration = enclosingDeclaration;
            enclosingDeclaration = (input as ts.Declaration);
        }
        const oldDiag = getSymbolAccessibilityDiagnostic;
        // Setup diagnostic-related flags before first potential `cleanup` call, otherwise
        // We'd see a TDZ violation at runtime
        const canProduceDiagnostic = ts.canProduceDiagnostics(input);
        const oldWithinObjectLiteralType = suppressNewDiagnosticContexts;
        let shouldEnterSuppressNewDiagnosticsContextContext = ((input.kind === ts.SyntaxKind.TypeLiteral || input.kind === ts.SyntaxKind.MappedType) && input.parent.kind !== ts.SyntaxKind.TypeAliasDeclaration);
        // Emit methods which are private as properties with no type information
        if (ts.isMethodDeclaration(input) || ts.isMethodSignature(input)) {
            if (ts.hasModifier(input, ts.ModifierFlags.Private)) {
                if (input.symbol && input.symbol.declarations && input.symbol.declarations[0] !== input)
                    return; // Elide all but the first overload
                return cleanup(ts.createProperty(/*decorators*/ undefined, ensureModifiers(input), input.name, /*questionToken*/ undefined, /*type*/ undefined, /*initializer*/ undefined));
            }
        }
        if (canProduceDiagnostic && !suppressNewDiagnosticContexts) {
            getSymbolAccessibilityDiagnostic = ts.createGetSymbolAccessibilityDiagnosticForNode((input as ts.DeclarationDiagnosticProducing));
        }
        if (ts.isTypeQueryNode(input)) {
            checkEntityNameVisibility(input.exprName, enclosingDeclaration);
        }
        if (shouldEnterSuppressNewDiagnosticsContextContext) {
            // We stop making new diagnostic contexts within object literal types. Unless it's an object type on the RHS of a type alias declaration. Then we do.
            suppressNewDiagnosticContexts = true;
        }
        if (isProcessedComponent(input)) {
            switch (input.kind) {
                case ts.SyntaxKind.ExpressionWithTypeArguments: {
                    if ((ts.isEntityName(input.expression) || ts.isEntityNameExpression(input.expression))) {
                        checkEntityNameVisibility(input.expression, enclosingDeclaration);
                    }
                    const node = ts.visitEachChild(input, visitDeclarationSubtree, context);
                    return cleanup(ts.updateExpressionWithTypeArguments(node, ts.parenthesizeTypeParameters(node.typeArguments), node.expression));
                }
                case ts.SyntaxKind.TypeReference: {
                    checkEntityNameVisibility(input.typeName, enclosingDeclaration);
                    const node = ts.visitEachChild(input, visitDeclarationSubtree, context);
                    return cleanup(ts.updateTypeReferenceNode(node, node.typeName, ts.parenthesizeTypeParameters(node.typeArguments)));
                }
                case ts.SyntaxKind.ConstructSignature:
                    return cleanup(ts.updateConstructSignature(input, ensureTypeParams(input, input.typeParameters), updateParamsList(input, input.parameters), ensureType(input, input.type)));
                case ts.SyntaxKind.Constructor: {
                    const isPrivate = ts.hasModifier(input, ts.ModifierFlags.Private);
                    // A constructor declaration may not have a type annotation
                    const ctor = ts.createSignatureDeclaration(ts.SyntaxKind.Constructor, isPrivate ? undefined : ensureTypeParams(input, input.typeParameters), 
                    // TODO: GH#18217
                    isPrivate ? undefined! : updateParamsList(input, input.parameters, ts.ModifierFlags.None), 
                    /*type*/ undefined);
                    ctor.modifiers = ts.createNodeArray(ensureModifiers(input));
                    return cleanup(ctor);
                }
                case ts.SyntaxKind.MethodDeclaration: {
                    const sig = (ts.createSignatureDeclaration(ts.SyntaxKind.MethodSignature, ensureTypeParams(input, input.typeParameters), updateParamsList(input, input.parameters), ensureType(input, input.type)) as ts.MethodSignature);
                    sig.name = input.name;
                    sig.modifiers = ts.createNodeArray(ensureModifiers(input));
                    sig.questionToken = input.questionToken;
                    return cleanup(sig);
                }
                case ts.SyntaxKind.GetAccessor: {
                    const isPrivate = ts.hasModifier(input, ts.ModifierFlags.Private);
                    const accessorType = getTypeAnnotationFromAllAccessorDeclarations(input, resolver.getAllAccessorDeclarations(input));
                    return cleanup(ts.updateGetAccessor(input, 
                    /*decorators*/ undefined, ensureModifiers(input), input.name, updateAccessorParamsList(input, isPrivate), !isPrivate ? ensureType(input, accessorType) : undefined, 
                    /*body*/ undefined));
                }
                case ts.SyntaxKind.SetAccessor: {
                    return cleanup(ts.updateSetAccessor(input, 
                    /*decorators*/ undefined, ensureModifiers(input), input.name, updateAccessorParamsList(input, ts.hasModifier(input, ts.ModifierFlags.Private)), 
                    /*body*/ undefined));
                }
                case ts.SyntaxKind.PropertyDeclaration:
                    return cleanup(ts.updateProperty(input, 
                    /*decorators*/ undefined, ensureModifiers(input), input.name, input.questionToken, !ts.hasModifier(input, ts.ModifierFlags.Private) ? ensureType(input, input.type) : undefined, ensureNoInitializer(input)));
                case ts.SyntaxKind.PropertySignature:
                    return cleanup(ts.updatePropertySignature(input, ensureModifiers(input), input.name, input.questionToken, !ts.hasModifier(input, ts.ModifierFlags.Private) ? ensureType(input, input.type) : undefined, ensureNoInitializer(input)));
                case ts.SyntaxKind.MethodSignature: {
                    return cleanup(ts.updateMethodSignature(input, ensureTypeParams(input, input.typeParameters), updateParamsList(input, input.parameters), ensureType(input, input.type), input.name, input.questionToken));
                }
                case ts.SyntaxKind.CallSignature: {
                    return cleanup(ts.updateCallSignature(input, ensureTypeParams(input, input.typeParameters), updateParamsList(input, input.parameters), ensureType(input, input.type)));
                }
                case ts.SyntaxKind.IndexSignature: {
                    return cleanup(ts.updateIndexSignature(input, 
                    /*decorators*/ undefined, ensureModifiers(input), updateParamsList(input, input.parameters), ts.visitNode(input.type, visitDeclarationSubtree) || ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)));
                }
                case ts.SyntaxKind.VariableDeclaration: {
                    if (ts.isBindingPattern(input.name)) {
                        return recreateBindingPattern(input.name);
                    }
                    shouldEnterSuppressNewDiagnosticsContextContext = true;
                    suppressNewDiagnosticContexts = true; // Variable declaration types also suppress new diagnostic contexts, provided the contexts wouldn't be made for binding pattern types
                    return cleanup(ts.updateTypeScriptVariableDeclaration(input, input.name, /*exclaimationToken*/ undefined, ensureType(input, input.type), ensureNoInitializer(input)));
                }
                case ts.SyntaxKind.TypeParameter: {
                    if (isPrivateMethodTypeParameter(input) && (input.default || input.constraint)) {
                        return cleanup(ts.updateTypeParameterDeclaration(input, input.name, /*constraint*/ undefined, /*defaultType*/ undefined));
                    }
                    return cleanup(ts.visitEachChild(input, visitDeclarationSubtree, context));
                }
                case ts.SyntaxKind.ConditionalType: {
                    // We have to process conditional types in a special way because for visibility purposes we need to push a new enclosingDeclaration
                    // just for the `infer` types in the true branch. It's an implicit declaration scope that only applies to _part_ of the type.
                    const checkType = ts.visitNode(input.checkType, visitDeclarationSubtree);
                    const extendsType = ts.visitNode(input.extendsType, visitDeclarationSubtree);
                    const oldEnclosingDecl = enclosingDeclaration;
                    enclosingDeclaration = input.trueType;
                    const trueType = ts.visitNode(input.trueType, visitDeclarationSubtree);
                    enclosingDeclaration = oldEnclosingDecl;
                    const falseType = ts.visitNode(input.falseType, visitDeclarationSubtree);
                    return cleanup(ts.updateConditionalTypeNode(input, checkType, extendsType, trueType, falseType));
                }
                case ts.SyntaxKind.FunctionType: {
                    return cleanup(ts.updateFunctionTypeNode(input, ts.visitNodes(input.typeParameters, visitDeclarationSubtree), updateParamsList(input, input.parameters), ts.visitNode(input.type, visitDeclarationSubtree)));
                }
                case ts.SyntaxKind.ConstructorType: {
                    return cleanup(ts.updateConstructorTypeNode(input, ts.visitNodes(input.typeParameters, visitDeclarationSubtree), updateParamsList(input, input.parameters), ts.visitNode(input.type, visitDeclarationSubtree)));
                }
                case ts.SyntaxKind.ImportType: {
                    if (!ts.isLiteralImportTypeNode(input))
                        return cleanup(input);
                    return cleanup(ts.updateImportTypeNode(input, ts.updateLiteralTypeNode(input.argument, rewriteModuleSpecifier(input, input.argument.literal)), input.qualifier, ts.visitNodes(input.typeArguments, visitDeclarationSubtree, ts.isTypeNode), input.isTypeOf));
                }
                default: ts.Debug.assertNever(input, `Attempted to process unhandled node kind: ${(ts as any).SyntaxKind[(input as any).kind]}`);
            }
        }
        return cleanup(ts.visitEachChild(input, visitDeclarationSubtree, context));
        function cleanup<T extends ts.Node>(returnValue: T | undefined): T | undefined {
            if (returnValue && canProduceDiagnostic && ts.hasDynamicName((input as ts.Declaration))) {
                checkName((input as ts.DeclarationDiagnosticProducing));
            }
            if (isEnclosingDeclaration(input)) {
                enclosingDeclaration = previousEnclosingDeclaration;
            }
            if (canProduceDiagnostic && !suppressNewDiagnosticContexts) {
                getSymbolAccessibilityDiagnostic = oldDiag;
            }
            if (shouldEnterSuppressNewDiagnosticsContextContext) {
                suppressNewDiagnosticContexts = oldWithinObjectLiteralType;
            }
            if (returnValue === input) {
                return returnValue;
            }
            return returnValue && ts.setOriginalNode(preserveJsDoc(returnValue, input), input);
        }
    }
    function isPrivateMethodTypeParameter(node: ts.TypeParameterDeclaration) {
        return node.parent.kind === ts.SyntaxKind.MethodDeclaration && ts.hasModifier(node.parent, ts.ModifierFlags.Private);
    }
    function visitDeclarationStatements(input: ts.Node): ts.VisitResult<ts.Node> {
        if (!isPreservedDeclarationStatement(input)) {
            // return undefined for unmatched kinds to omit them from the tree
            return;
        }
        if (shouldStripInternal(input))
            return;
        switch (input.kind) {
            case ts.SyntaxKind.ExportDeclaration: {
                if (ts.isSourceFile(input.parent)) {
                    resultHasExternalModuleIndicator = true;
                }
                resultHasScopeMarker = true;
                // Always visible if the parent node isn't dropped for being not visible
                // Rewrite external module names if necessary
                return ts.updateExportDeclaration(input, /*decorators*/ undefined, input.modifiers, input.exportClause, rewriteModuleSpecifier(input, input.moduleSpecifier));
            }
            case ts.SyntaxKind.ExportAssignment: {
                // Always visible if the parent node isn't dropped for being not visible
                if (ts.isSourceFile(input.parent)) {
                    resultHasExternalModuleIndicator = true;
                }
                resultHasScopeMarker = true;
                if (input.expression.kind === ts.SyntaxKind.Identifier) {
                    return input;
                }
                else {
                    const newId = ts.createOptimisticUniqueName("_default");
                    getSymbolAccessibilityDiagnostic = () => ({
                        diagnosticMessage: ts.Diagnostics.Default_export_of_the_module_has_or_is_using_private_name_0,
                        errorNode: input
                    });
                    const varDecl = ts.createVariableDeclaration(newId, resolver.createTypeOfExpression(input.expression, input, declarationEmitNodeBuilderFlags, symbolTracker), /*initializer*/ undefined);
                    const statement = ts.createVariableStatement(needsDeclare ? [ts.createModifier(ts.SyntaxKind.DeclareKeyword)] : [], ts.createVariableDeclarationList([varDecl], ts.NodeFlags.Const));
                    return [statement, ts.updateExportAssignment(input, input.decorators, input.modifiers, newId)];
                }
            }
        }
        const result = transformTopLevelDeclaration(input);
        // Don't actually transform yet; just leave as original node - will be elided/swapped by late pass
        lateStatementReplacementMap.set("" + ts.getOriginalNodeId(input), result);
        return input;
    }
    function stripExportModifiers(statement: ts.Statement): ts.Statement {
        if (ts.isImportEqualsDeclaration(statement) || ts.hasModifier(statement, ts.ModifierFlags.Default)) {
            // `export import` statements should remain as-is, as imports are _not_ implicitly exported in an ambient namespace
            // Likewise, `export default` classes and the like and just be `default`, so we preserve their `export` modifiers, too
            return statement;
        }
        const clone = ts.getMutableClone(statement);
        const modifiers = ts.createModifiersFromModifierFlags(ts.getModifierFlags(statement) & (ts.ModifierFlags.All ^ ts.ModifierFlags.Export));
        clone.modifiers = modifiers.length ? ts.createNodeArray(modifiers) : undefined;
        return clone;
    }
    function transformTopLevelDeclaration(input: ts.LateVisibilityPaintedStatement) {
        if (shouldStripInternal(input))
            return;
        switch (input.kind) {
            case ts.SyntaxKind.ImportEqualsDeclaration: {
                return transformImportEqualsDeclaration(input);
            }
            case ts.SyntaxKind.ImportDeclaration: {
                return transformImportDeclaration(input);
            }
        }
        if (ts.isDeclaration(input) && isDeclarationAndNotVisible(input))
            return;
        // Elide implementation signatures from overload sets
        if (ts.isFunctionLike(input) && resolver.isImplementationOfOverload(input))
            return;
        let previousEnclosingDeclaration: typeof enclosingDeclaration;
        if (isEnclosingDeclaration(input)) {
            previousEnclosingDeclaration = enclosingDeclaration;
            enclosingDeclaration = (input as ts.Declaration);
        }
        const canProdiceDiagnostic = ts.canProduceDiagnostics(input);
        const oldDiag = getSymbolAccessibilityDiagnostic;
        if (canProdiceDiagnostic) {
            getSymbolAccessibilityDiagnostic = ts.createGetSymbolAccessibilityDiagnosticForNode((input as ts.DeclarationDiagnosticProducing));
        }
        const previousNeedsDeclare = needsDeclare;
        switch (input.kind) {
            case ts.SyntaxKind.TypeAliasDeclaration: // Type aliases get `declare`d if need be (for legacy support), but that's all
                return cleanup(ts.updateTypeAliasDeclaration(input, 
                /*decorators*/ undefined, ensureModifiers(input), input.name, ts.visitNodes(input.typeParameters, visitDeclarationSubtree, ts.isTypeParameterDeclaration), ts.visitNode(input.type, visitDeclarationSubtree, ts.isTypeNode)));
            case ts.SyntaxKind.InterfaceDeclaration: {
                return cleanup(ts.updateInterfaceDeclaration(input, 
                /*decorators*/ undefined, ensureModifiers(input), input.name, ensureTypeParams(input, input.typeParameters), transformHeritageClauses(input.heritageClauses), ts.visitNodes(input.members, visitDeclarationSubtree)));
            }
            case ts.SyntaxKind.FunctionDeclaration: {
                // Generators lose their generator-ness, excepting their return type
                const clean = cleanup(ts.updateFunctionDeclaration(input, 
                /*decorators*/ undefined, ensureModifiers(input), 
                /*asteriskToken*/ undefined, input.name, ensureTypeParams(input, input.typeParameters), updateParamsList(input, input.parameters), ensureType(input, input.type), 
                /*body*/ undefined));
                if (clean && resolver.isExpandoFunctionDeclaration(input)) {
                    const props = resolver.getPropertiesOfContainerFunction(input);
                    const fakespace = ts.createModuleDeclaration(/*decorators*/ undefined, /*modifiers*/ undefined, clean.name || ts.createIdentifier("_default"), ts.createModuleBlock([]), ts.NodeFlags.Namespace);
                    fakespace.flags ^= ts.NodeFlags.Synthesized; // unset synthesized so it is usable as an enclosing declaration
                    fakespace.parent = (enclosingDeclaration as ts.SourceFile | ts.NamespaceDeclaration);
                    fakespace.locals = ts.createSymbolTable(props);
                    fakespace.symbol = props[0].parent!;
                    const declarations = ts.mapDefined(props, p => {
                        if (!ts.isPropertyAccessExpression(p.valueDeclaration)) {
                            return undefined; // TODO GH#33569: Handle element access expressions that created late bound names (rather than silently omitting them)
                        }
                        getSymbolAccessibilityDiagnostic = ts.createGetSymbolAccessibilityDiagnosticForNode(p.valueDeclaration);
                        const type = resolver.createTypeOfDeclaration(p.valueDeclaration, fakespace, declarationEmitNodeBuilderFlags, symbolTracker);
                        getSymbolAccessibilityDiagnostic = oldDiag;
                        const varDecl = ts.createVariableDeclaration(ts.unescapeLeadingUnderscores(p.escapedName), type, /*initializer*/ undefined);
                        return ts.createVariableStatement(/*modifiers*/ undefined, ts.createVariableDeclarationList([varDecl]));
                    });
                    const namespaceDecl = ts.createModuleDeclaration(/*decorators*/ undefined, ensureModifiers(input), (input.name!), ts.createModuleBlock(declarations), ts.NodeFlags.Namespace);
                    if (!ts.hasModifier(clean, ts.ModifierFlags.Default)) {
                        return [clean, namespaceDecl];
                    }
                    const modifiers = ts.createModifiersFromModifierFlags((ts.getModifierFlags(clean) & ~ts.ModifierFlags.ExportDefault) | ts.ModifierFlags.Ambient);
                    const cleanDeclaration = ts.updateFunctionDeclaration(clean, 
                    /*decorators*/ undefined, modifiers, 
                    /*asteriskToken*/ undefined, clean.name, clean.typeParameters, clean.parameters, clean.type, 
                    /*body*/ undefined);
                    const namespaceDeclaration = ts.updateModuleDeclaration(namespaceDecl, 
                    /*decorators*/ undefined, modifiers, namespaceDecl.name, namespaceDecl.body);
                    const exportDefaultDeclaration = ts.createExportAssignment(
                    /*decorators*/ undefined, 
                    /*modifiers*/ undefined, 
                    /*isExportEquals*/ false, namespaceDecl.name);
                    if (ts.isSourceFile(input.parent)) {
                        resultHasExternalModuleIndicator = true;
                    }
                    resultHasScopeMarker = true;
                    return [cleanDeclaration, namespaceDeclaration, exportDefaultDeclaration];
                }
                else {
                    return clean;
                }
            }
            case ts.SyntaxKind.ModuleDeclaration: {
                needsDeclare = false;
                const inner = input.body;
                if (inner && inner.kind === ts.SyntaxKind.ModuleBlock) {
                    const oldNeedsScopeFix = needsScopeFixMarker;
                    const oldHasScopeFix = resultHasScopeMarker;
                    resultHasScopeMarker = false;
                    needsScopeFixMarker = false;
                    const statements = ts.visitNodes(inner.statements, visitDeclarationStatements);
                    let lateStatements = transformAndReplaceLatePaintedStatements(statements);
                    if (input.flags & ts.NodeFlags.Ambient) {
                        needsScopeFixMarker = false; // If it was `declare`'d everything is implicitly exported already, ignore late printed "privates"
                    }
                    // With the final list of statements, there are 3 possibilities:
                    // 1. There's an export assignment or export declaration in the namespace - do nothing
                    // 2. Everything is exported and there are no export assignments or export declarations - strip all export modifiers
                    // 3. Some things are exported, some are not, and there's no marker - add an empty marker
                    if (!ts.isGlobalScopeAugmentation(input) && !hasScopeMarker(lateStatements) && !resultHasScopeMarker) {
                        if (needsScopeFixMarker) {
                            lateStatements = ts.createNodeArray([...lateStatements, ts.createEmptyExports()]);
                        }
                        else {
                            lateStatements = ts.visitNodes(lateStatements, stripExportModifiers);
                        }
                    }
                    const body = ts.updateModuleBlock(inner, lateStatements);
                    needsDeclare = previousNeedsDeclare;
                    needsScopeFixMarker = oldNeedsScopeFix;
                    resultHasScopeMarker = oldHasScopeFix;
                    const mods = ensureModifiers(input);
                    return cleanup(ts.updateModuleDeclaration(input, 
                    /*decorators*/ undefined, mods, ts.isExternalModuleAugmentation(input) ? rewriteModuleSpecifier(input, input.name) : input.name, body));
                }
                else {
                    needsDeclare = previousNeedsDeclare;
                    const mods = ensureModifiers(input);
                    needsDeclare = false;
                    ts.visitNode(inner, visitDeclarationStatements);
                    // eagerly transform nested namespaces (the nesting doesn't need any elision or painting done)
                    const id = "" + ts.getOriginalNodeId((inner!)); // TODO: GH#18217
                    const body = lateStatementReplacementMap.get(id);
                    lateStatementReplacementMap.delete(id);
                    return cleanup(ts.updateModuleDeclaration(input, 
                    /*decorators*/ undefined, mods, input.name, (body as ts.ModuleBody)));
                }
            }
            case ts.SyntaxKind.ClassDeclaration: {
                const modifiers = ts.createNodeArray(ensureModifiers(input));
                const typeParameters = ensureTypeParams(input, input.typeParameters);
                const ctor = ts.getFirstConstructorWithBody(input);
                let parameterProperties: readonly ts.PropertyDeclaration[] | undefined;
                if (ctor) {
                    const oldDiag = getSymbolAccessibilityDiagnostic;
                    parameterProperties = ts.compact(ts.flatMap(ctor.parameters, (param) => {
                        if (!ts.hasModifier(param, ts.ModifierFlags.ParameterPropertyModifier) || shouldStripInternal(param))
                            return;
                        getSymbolAccessibilityDiagnostic = ts.createGetSymbolAccessibilityDiagnosticForNode(param);
                        if (param.name.kind === ts.SyntaxKind.Identifier) {
                            return preserveJsDoc(ts.createProperty(
                            /*decorators*/ undefined, ensureModifiers(param), param.name, param.questionToken, ensureType(param, param.type), ensureNoInitializer(param)), param);
                        }
                        else {
                            // Pattern - this is currently an error, but we emit declarations for it somewhat correctly
                            return walkBindingPattern(param.name);
                        }
                        function walkBindingPattern(pattern: ts.BindingPattern) {
                            let elems: ts.PropertyDeclaration[] | undefined;
                            for (const elem of pattern.elements) {
                                if (ts.isOmittedExpression(elem))
                                    continue;
                                if (ts.isBindingPattern(elem.name)) {
                                    elems = ts.concatenate(elems, walkBindingPattern(elem.name));
                                }
                                elems = elems || [];
                                elems.push(ts.createProperty(
                                /*decorators*/ undefined, ensureModifiers(param), (elem.name as ts.Identifier), 
                                /*questionToken*/ undefined, ensureType(elem, /*type*/ undefined), 
                                /*initializer*/ undefined));
                            }
                            return elems;
                        }
                    }));
                    getSymbolAccessibilityDiagnostic = oldDiag;
                }
                const members = ts.createNodeArray(ts.concatenate(parameterProperties, ts.visitNodes(input.members, visitDeclarationSubtree)));
                const extendsClause = ts.getEffectiveBaseTypeNode(input);
                if (extendsClause && !ts.isEntityNameExpression(extendsClause.expression) && extendsClause.expression.kind !== ts.SyntaxKind.NullKeyword) {
                    // We must add a temporary declaration for the extends clause expression
                    const oldId = input.name ? ts.unescapeLeadingUnderscores(input.name.escapedText) : "default";
                    const newId = ts.createOptimisticUniqueName(`${oldId}_base`);
                    getSymbolAccessibilityDiagnostic = () => ({
                        diagnosticMessage: ts.Diagnostics.extends_clause_of_exported_class_0_has_or_is_using_private_name_1,
                        errorNode: extendsClause,
                        typeName: input.name
                    });
                    const varDecl = ts.createVariableDeclaration(newId, resolver.createTypeOfExpression(extendsClause.expression, input, declarationEmitNodeBuilderFlags, symbolTracker), /*initializer*/ undefined);
                    const statement = ts.createVariableStatement(needsDeclare ? [ts.createModifier(ts.SyntaxKind.DeclareKeyword)] : [], ts.createVariableDeclarationList([varDecl], ts.NodeFlags.Const));
                    const heritageClauses = ts.createNodeArray(ts.map(input.heritageClauses, clause => {
                        if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
                            const oldDiag = getSymbolAccessibilityDiagnostic;
                            getSymbolAccessibilityDiagnostic = ts.createGetSymbolAccessibilityDiagnosticForNode(clause.types[0]);
                            const newClause = ts.updateHeritageClause(clause, ts.map(clause.types, t => ts.updateExpressionWithTypeArguments(t, ts.visitNodes(t.typeArguments, visitDeclarationSubtree), newId)));
                            getSymbolAccessibilityDiagnostic = oldDiag;
                            return newClause;
                        }
                        return ts.updateHeritageClause(clause, ts.visitNodes(ts.createNodeArray(ts.filter(clause.types, t => ts.isEntityNameExpression(t.expression) || t.expression.kind === ts.SyntaxKind.NullKeyword)), visitDeclarationSubtree));
                    }));
                    return [statement, (cleanup(ts.updateClassDeclaration(input, 
                        /*decorators*/ undefined, modifiers, input.name, typeParameters, heritageClauses, members))!)]; // TODO: GH#18217
                }
                else {
                    const heritageClauses = transformHeritageClauses(input.heritageClauses);
                    return cleanup(ts.updateClassDeclaration(input, 
                    /*decorators*/ undefined, modifiers, input.name, typeParameters, heritageClauses, members));
                }
            }
            case ts.SyntaxKind.VariableStatement: {
                return cleanup(transformVariableStatement(input));
            }
            case ts.SyntaxKind.EnumDeclaration: {
                return cleanup(ts.updateEnumDeclaration(input, /*decorators*/ undefined, ts.createNodeArray(ensureModifiers(input)), input.name, ts.createNodeArray(ts.mapDefined(input.members, m => {
                    if (shouldStripInternal(m))
                        return;
                    // Rewrite enum values to their constants, if available
                    const constValue = resolver.getConstantValue(m);
                    return preserveJsDoc(ts.updateEnumMember(m, m.name, constValue !== undefined ? ts.createLiteral(constValue) : undefined), m);
                }))));
            }
        }
        // Anything left unhandled is an error, so this should be unreachable
        return ts.Debug.assertNever(input, `Unhandled top-level node in declaration emit: ${(ts as any).SyntaxKind[(input as any).kind]}`);
        function cleanup<T extends ts.Node>(node: T | undefined): T | undefined {
            if (isEnclosingDeclaration(input)) {
                enclosingDeclaration = previousEnclosingDeclaration;
            }
            if (canProdiceDiagnostic) {
                getSymbolAccessibilityDiagnostic = oldDiag;
            }
            if (input.kind === ts.SyntaxKind.ModuleDeclaration) {
                needsDeclare = previousNeedsDeclare;
            }
            if ((node as ts.Node) === input) {
                return node;
            }
            return node && ts.setOriginalNode(preserveJsDoc(node, input), input);
        }
    }
    function transformVariableStatement(input: ts.VariableStatement) {
        if (!ts.forEach(input.declarationList.declarations, getBindingNameVisible))
            return;
        const nodes = ts.visitNodes(input.declarationList.declarations, visitDeclarationSubtree);
        if (!ts.length(nodes))
            return;
        return ts.updateVariableStatement(input, ts.createNodeArray(ensureModifiers(input)), ts.updateVariableDeclarationList(input.declarationList, nodes));
    }
    function recreateBindingPattern(d: ts.BindingPattern): ts.VariableDeclaration[] {
        return ts.flatten<ts.VariableDeclaration>(ts.mapDefined(d.elements, e => recreateBindingElement(e)));
    }
    function recreateBindingElement(e: ts.ArrayBindingElement) {
        if (e.kind === ts.SyntaxKind.OmittedExpression) {
            return;
        }
        if (e.name) {
            if (!getBindingNameVisible(e))
                return;
            if (ts.isBindingPattern(e.name)) {
                return recreateBindingPattern(e.name);
            }
            else {
                return ts.createVariableDeclaration(e.name, ensureType(e, /*type*/ undefined), /*initializer*/ undefined);
            }
        }
    }
    function checkName(node: ts.DeclarationDiagnosticProducing) {
        let oldDiag: typeof getSymbolAccessibilityDiagnostic | undefined;
        if (!suppressNewDiagnosticContexts) {
            oldDiag = getSymbolAccessibilityDiagnostic;
            getSymbolAccessibilityDiagnostic = ts.createGetSymbolAccessibilityDiagnosticForNodeName(node);
        }
        errorNameNode = (node as ts.NamedDeclaration).name;
        ts.Debug.assert(resolver.isLateBound((ts.getParseTreeNode(node) as ts.Declaration))); // Should only be called with dynamic names
        const decl = (node as ts.NamedDeclaration as ts.LateBoundDeclaration);
        const entityName = decl.name.expression;
        checkEntityNameVisibility(entityName, enclosingDeclaration);
        if (!suppressNewDiagnosticContexts) {
            getSymbolAccessibilityDiagnostic = oldDiag!;
        }
        errorNameNode = undefined;
    }
    function shouldStripInternal(node: ts.Node) {
        return !!stripInternal && !!node && isInternalDeclaration(node, currentSourceFile);
    }
    function isScopeMarker(node: ts.Node) {
        return ts.isExportAssignment(node) || ts.isExportDeclaration(node);
    }
    function hasScopeMarker(statements: readonly ts.Statement[]) {
        return ts.some(statements, isScopeMarker);
    }
    function ensureModifiers(node: ts.Node): readonly ts.Modifier[] | undefined {
        const currentFlags = ts.getModifierFlags(node);
        const newFlags = ensureModifierFlags(node);
        if (currentFlags === newFlags) {
            return node.modifiers;
        }
        return ts.createModifiersFromModifierFlags(newFlags);
    }
    function ensureModifierFlags(node: ts.Node): ts.ModifierFlags {
        let mask = ts.ModifierFlags.All ^ (ts.ModifierFlags.Public | ts.ModifierFlags.Async); // No async modifiers in declaration files
        let additions = (needsDeclare && !isAlwaysType(node)) ? ts.ModifierFlags.Ambient : ts.ModifierFlags.None;
        const parentIsFile = node.parent.kind === ts.SyntaxKind.SourceFile;
        if (!parentIsFile || (isBundledEmit && parentIsFile && ts.isExternalModule((node.parent as ts.SourceFile)))) {
            mask ^= ts.ModifierFlags.Ambient;
            additions = ts.ModifierFlags.None;
        }
        return maskModifierFlags(node, mask, additions);
    }
    function getTypeAnnotationFromAllAccessorDeclarations(node: ts.AccessorDeclaration, accessors: ts.AllAccessorDeclarations) {
        let accessorType = getTypeAnnotationFromAccessor(node);
        if (!accessorType && node !== accessors.firstAccessor) {
            accessorType = getTypeAnnotationFromAccessor(accessors.firstAccessor);
            // If we end up pulling the type from the second accessor, we also need to change the diagnostic context to get the expected error message
            getSymbolAccessibilityDiagnostic = ts.createGetSymbolAccessibilityDiagnosticForNode(accessors.firstAccessor);
        }
        if (!accessorType && accessors.secondAccessor && node !== accessors.secondAccessor) {
            accessorType = getTypeAnnotationFromAccessor(accessors.secondAccessor);
            // If we end up pulling the type from the second accessor, we also need to change the diagnostic context to get the expected error message
            getSymbolAccessibilityDiagnostic = ts.createGetSymbolAccessibilityDiagnosticForNode(accessors.secondAccessor);
        }
        return accessorType;
    }
    function transformHeritageClauses(nodes: ts.NodeArray<ts.HeritageClause> | undefined) {
        return ts.createNodeArray(ts.filter(ts.map(nodes, clause => ts.updateHeritageClause(clause, ts.visitNodes(ts.createNodeArray(ts.filter(clause.types, t => {
            return ts.isEntityNameExpression(t.expression) || (clause.token === ts.SyntaxKind.ExtendsKeyword && t.expression.kind === ts.SyntaxKind.NullKeyword);
        })), visitDeclarationSubtree))), clause => clause.types && !!clause.types.length));
    }
}
/* @internal */
function isAlwaysType(node: ts.Node) {
    if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
        return true;
    }
    return false;
}
// Elide "public" modifier, as it is the default
/* @internal */
function maskModifiers(node: ts.Node, modifierMask?: ts.ModifierFlags, modifierAdditions?: ts.ModifierFlags): ts.Modifier[] {
    return ts.createModifiersFromModifierFlags(maskModifierFlags(node, modifierMask, modifierAdditions));
}
/* @internal */
function maskModifierFlags(node: ts.Node, modifierMask: ts.ModifierFlags = ts.ModifierFlags.All ^ ts.ModifierFlags.Public, modifierAdditions: ts.ModifierFlags = ts.ModifierFlags.None): ts.ModifierFlags {
    let flags = (ts.getModifierFlags(node) & modifierMask) | modifierAdditions;
    if (flags & ts.ModifierFlags.Default && !(flags & ts.ModifierFlags.Export)) {
        // A non-exported default is a nonsequitor - we usually try to remove all export modifiers
        // from statements in ambient declarations; but a default export must retain its export modifier to be syntactically valid
        flags ^= ts.ModifierFlags.Export;
    }
    if (flags & ts.ModifierFlags.Default && flags & ts.ModifierFlags.Ambient) {
        flags ^= ts.ModifierFlags.Ambient; // `declare` is never required alongside `default` (and would be an error if printed)
    }
    return flags;
}
/* @internal */
function getTypeAnnotationFromAccessor(accessor: ts.AccessorDeclaration): ts.TypeNode | undefined {
    if (accessor) {
        return accessor.kind === ts.SyntaxKind.GetAccessor
            ? accessor.type // Getter - return type
            : accessor.parameters.length > 0
                ? accessor.parameters[0].type // Setter parameter type
                : undefined;
    }
}
/* @internal */
type CanHaveLiteralInitializer = ts.VariableDeclaration | ts.PropertyDeclaration | ts.PropertySignature | ts.ParameterDeclaration;
/* @internal */
function canHaveLiteralInitializer(node: ts.Node): boolean {
    switch (node.kind) {
        case ts.SyntaxKind.PropertyDeclaration:
        case ts.SyntaxKind.PropertySignature:
            return !ts.hasModifier(node, ts.ModifierFlags.Private);
        case ts.SyntaxKind.Parameter:
        case ts.SyntaxKind.VariableDeclaration:
            return true;
    }
    return false;
}
/* @internal */
type ProcessedDeclarationStatement = ts.FunctionDeclaration | ts.ModuleDeclaration | ts.ImportEqualsDeclaration | ts.InterfaceDeclaration | ts.ClassDeclaration | ts.TypeAliasDeclaration | ts.EnumDeclaration | ts.VariableStatement | ts.ImportDeclaration | ts.ExportDeclaration | ts.ExportAssignment;
/* @internal */
function isPreservedDeclarationStatement(node: ts.Node): node is ProcessedDeclarationStatement {
    switch (node.kind) {
        case ts.SyntaxKind.FunctionDeclaration:
        case ts.SyntaxKind.ModuleDeclaration:
        case ts.SyntaxKind.ImportEqualsDeclaration:
        case ts.SyntaxKind.InterfaceDeclaration:
        case ts.SyntaxKind.ClassDeclaration:
        case ts.SyntaxKind.TypeAliasDeclaration:
        case ts.SyntaxKind.EnumDeclaration:
        case ts.SyntaxKind.VariableStatement:
        case ts.SyntaxKind.ImportDeclaration:
        case ts.SyntaxKind.ExportDeclaration:
        case ts.SyntaxKind.ExportAssignment:
            return true;
    }
    return false;
}
/* @internal */
type ProcessedComponent = ts.ConstructSignatureDeclaration | ts.ConstructorDeclaration | ts.MethodDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration | ts.PropertyDeclaration | ts.PropertySignature | ts.MethodSignature | ts.CallSignatureDeclaration | ts.IndexSignatureDeclaration | ts.VariableDeclaration | ts.TypeParameterDeclaration | ts.ExpressionWithTypeArguments | ts.TypeReferenceNode | ts.ConditionalTypeNode | ts.FunctionTypeNode | ts.ConstructorTypeNode | ts.ImportTypeNode;
/* @internal */
function isProcessedComponent(node: ts.Node): node is ProcessedComponent {
    switch (node.kind) {
        case ts.SyntaxKind.ConstructSignature:
        case ts.SyntaxKind.Constructor:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.GetAccessor:
        case ts.SyntaxKind.SetAccessor:
        case ts.SyntaxKind.PropertyDeclaration:
        case ts.SyntaxKind.PropertySignature:
        case ts.SyntaxKind.MethodSignature:
        case ts.SyntaxKind.CallSignature:
        case ts.SyntaxKind.IndexSignature:
        case ts.SyntaxKind.VariableDeclaration:
        case ts.SyntaxKind.TypeParameter:
        case ts.SyntaxKind.ExpressionWithTypeArguments:
        case ts.SyntaxKind.TypeReference:
        case ts.SyntaxKind.ConditionalType:
        case ts.SyntaxKind.FunctionType:
        case ts.SyntaxKind.ConstructorType:
        case ts.SyntaxKind.ImportType:
            return true;
    }
    return false;
}
