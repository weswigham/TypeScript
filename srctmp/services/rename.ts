import * as ts from "./ts";
/* @internal */
export function getRenameInfo(program: ts.Program, sourceFile: ts.SourceFile, position: number, options?: ts.RenameInfoOptions): ts.RenameInfo {
    const node = ts.getTouchingPropertyName(sourceFile, position);
    const renameInfo = node && nodeIsEligibleForRename(node)
        ? getRenameInfoForNode(node, program.getTypeChecker(), sourceFile, declaration => program.isSourceFileDefaultLibrary(declaration.getSourceFile()), options)
        : undefined;
    return renameInfo || getRenameInfoError(ts.Diagnostics.You_cannot_rename_this_element);
}
/* @internal */
function getRenameInfoForNode(node: ts.Node, typeChecker: ts.TypeChecker, sourceFile: ts.SourceFile, isDefinedInLibraryFile: (declaration: ts.Node) => boolean, options?: ts.RenameInfoOptions): ts.RenameInfo | undefined {
    const symbol = typeChecker.getSymbolAtLocation(node);
    if (!symbol)
        return;
    // Only allow a symbol to be renamed if it actually has at least one declaration.
    const { declarations } = symbol;
    if (!declarations || declarations.length === 0)
        return;
    // Disallow rename for elements that are defined in the standard TypeScript library.
    if (declarations.some(isDefinedInLibraryFile)) {
        return getRenameInfoError(ts.Diagnostics.You_cannot_rename_elements_that_are_defined_in_the_standard_TypeScript_library);
    }
    // Cannot rename `default` as in `import { default as foo } from "./someModule";
    if (ts.isIdentifier(node) && node.originalKeywordKind === ts.SyntaxKind.DefaultKeyword && symbol.parent!.flags & ts.SymbolFlags.Module) {
        return undefined;
    }
    if (ts.isStringLiteralLike(node) && ts.tryGetImportFromModuleSpecifier(node)) {
        return options && options.allowRenameOfImportPath ? getRenameInfoForModule(node, sourceFile, symbol) : undefined;
    }
    const kind = ts.SymbolDisplay.getSymbolKind(typeChecker, symbol, node);
    const specifierName = (ts.isImportOrExportSpecifierName(node) || ts.isStringOrNumericLiteralLike(node) && node.parent.kind === ts.SyntaxKind.ComputedPropertyName)
        ? ts.stripQuotes(ts.getTextOfIdentifierOrLiteral(node))
        : undefined;
    const displayName = specifierName || typeChecker.symbolToString(symbol);
    const fullDisplayName = specifierName || typeChecker.getFullyQualifiedName(symbol);
    return getRenameInfoSuccess(displayName, fullDisplayName, kind, ts.SymbolDisplay.getSymbolModifiers(symbol), node, sourceFile);
}
/* @internal */
function getRenameInfoForModule(node: ts.StringLiteralLike, sourceFile: ts.SourceFile, moduleSymbol: ts.Symbol): ts.RenameInfo | undefined {
    if (!ts.isExternalModuleNameRelative(node.text)) {
        return getRenameInfoError(ts.Diagnostics.You_cannot_rename_a_module_via_a_global_import);
    }
    const moduleSourceFile = ts.find(moduleSymbol.declarations, ts.isSourceFile);
    if (!moduleSourceFile)
        return undefined;
    const withoutIndex = ts.endsWith(node.text, "/index") || ts.endsWith(node.text, "/index.js") ? undefined : ts.tryRemoveSuffix(ts.removeFileExtension(moduleSourceFile.fileName), "/index");
    const name = withoutIndex === undefined ? moduleSourceFile.fileName : withoutIndex;
    const kind = withoutIndex === undefined ? ts.ScriptElementKind.moduleElement : ts.ScriptElementKind.directory;
    const indexAfterLastSlash = node.text.lastIndexOf("/") + 1;
    // Span should only be the last component of the path. + 1 to account for the quote character.
    const triggerSpan = ts.createTextSpan(node.getStart(sourceFile) + 1 + indexAfterLastSlash, node.text.length - indexAfterLastSlash);
    return {
        canRename: true,
        fileToRename: name,
        kind,
        displayName: name,
        fullDisplayName: name,
        kindModifiers: ts.ScriptElementKindModifier.none,
        triggerSpan,
    };
}
/* @internal */
function getRenameInfoSuccess(displayName: string, fullDisplayName: string, kind: ts.ScriptElementKind, kindModifiers: string, node: ts.Node, sourceFile: ts.SourceFile): ts.RenameInfoSuccess {
    return {
        canRename: true,
        fileToRename: undefined,
        kind,
        displayName,
        fullDisplayName,
        kindModifiers,
        triggerSpan: createTriggerSpanForNode(node, sourceFile)
    };
}
/* @internal */
function getRenameInfoError(diagnostic: ts.DiagnosticMessage): ts.RenameInfoFailure {
    return { canRename: false, localizedErrorMessage: ts.getLocaleSpecificMessage(diagnostic) };
}
/* @internal */
function createTriggerSpanForNode(node: ts.Node, sourceFile: ts.SourceFile) {
    let start = node.getStart(sourceFile);
    let width = node.getWidth(sourceFile);
    if (ts.isStringLiteralLike(node)) {
        // Exclude the quotes
        start += 1;
        width -= 2;
    }
    return ts.createTextSpan(start, width);
}
/* @internal */
function nodeIsEligibleForRename(node: ts.Node): boolean {
    switch (node.kind) {
        case ts.SyntaxKind.Identifier:
        case ts.SyntaxKind.StringLiteral:
        case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
        case ts.SyntaxKind.ThisKeyword:
            return true;
        case ts.SyntaxKind.NumericLiteral:
            return ts.isLiteralNameOfPropertyDeclarationOrIndexAccess((node as ts.NumericLiteral));
        default:
            return false;
    }
}
