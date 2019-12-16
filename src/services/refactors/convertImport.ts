/* @internal */
namespace ts.refactor {
    const refactorName = "Convert import";
    const actionNameNamespaceToNamed = "Convert namespace import to named imports";
    const actionNameNamedToNamespace = "Convert named imports to namespace import";
    ts.refactor.registerRefactor(refactorName, {
        getAvailableActions(context): readonly ts.ApplicableRefactorInfo[] {
            const i = getImportToConvert(context);
            if (!i)
                return ts.emptyArray;
            const description = i.kind === ts.SyntaxKind.NamespaceImport ? ts.Diagnostics.Convert_namespace_import_to_named_imports.message : ts.Diagnostics.Convert_named_imports_to_namespace_import.message;
            const actionName = i.kind === ts.SyntaxKind.NamespaceImport ? actionNameNamespaceToNamed : actionNameNamedToNamespace;
            return [{ name: refactorName, description, actions: [{ name: actionName, description }] }];
        },
        getEditsForAction(context, actionName): ts.RefactorEditInfo {
            ts.Debug.assert(actionName === actionNameNamespaceToNamed || actionName === actionNameNamedToNamespace, "Unexpected action name");
            const edits = ts.textChanges.ChangeTracker.with(context, t => doChange(context.file, context.program, t, ts.Debug.assertDefined(getImportToConvert(context), "Context must provide an import to convert")));
            return { edits, renameFilename: undefined, renameLocation: undefined };
        }
    });
    // Can convert imports of the form `import * as m from "m";` or `import d, { x, y } from "m";`.
    function getImportToConvert(context: ts.RefactorContext): ts.NamedImportBindings | undefined {
        const { file } = context;
        const span = ts.getRefactorContextSpan(context);
        const token = ts.getTokenAtPosition(file, span.start);
        const importDecl = ts.getParentNodeInSpan(token, file, span);
        if (!importDecl || !ts.isImportDeclaration(importDecl))
            return undefined;
        const { importClause } = importDecl;
        return importClause && importClause.namedBindings;
    }
    function doChange(sourceFile: ts.SourceFile, program: ts.Program, changes: ts.textChanges.ChangeTracker, toConvert: ts.NamedImportBindings): void {
        const checker = program.getTypeChecker();
        if (toConvert.kind === ts.SyntaxKind.NamespaceImport) {
            doChangeNamespaceToNamed(sourceFile, checker, changes, toConvert, ts.getAllowSyntheticDefaultImports(program.getCompilerOptions()));
        }
        else {
            doChangeNamedToNamespace(sourceFile, checker, changes, toConvert);
        }
    }
    function doChangeNamespaceToNamed(sourceFile: ts.SourceFile, checker: ts.TypeChecker, changes: ts.textChanges.ChangeTracker, toConvert: ts.NamespaceImport, allowSyntheticDefaultImports: boolean): void {
        let usedAsNamespaceOrDefault = false;
        const nodesToReplace: ts.PropertyAccessExpression[] = [];
        const conflictingNames = ts.createMap<true>();
        ts.FindAllReferences.Core.eachSymbolReferenceInFile(toConvert.name, checker, sourceFile, id => {
            if (!ts.isPropertyAccessExpression(id.parent)) {
                usedAsNamespaceOrDefault = true;
            }
            else {
                const parent = ts.cast(id.parent, ts.isPropertyAccessExpression);
                const exportName = parent.name.text;
                if (checker.resolveName(exportName, id, ts.SymbolFlags.All, /*excludeGlobals*/ true)) {
                    conflictingNames.set(exportName, true);
                }
                ts.Debug.assert(parent.expression === id, "Parent expression should match id");
                nodesToReplace.push(parent);
            }
        });
        // We may need to change `mod.x` to `_x` to avoid a name conflict.
        const exportNameToImportName = ts.createMap<string>();
        for (const propertyAccess of nodesToReplace) {
            const exportName = propertyAccess.name.text;
            let importName = exportNameToImportName.get(exportName);
            if (importName === undefined) {
                exportNameToImportName.set(exportName, importName = conflictingNames.has(exportName) ? ts.getUniqueName(exportName, sourceFile) : exportName);
            }
            changes.replaceNode(sourceFile, propertyAccess, ts.createIdentifier(importName));
        }
        const importSpecifiers: ts.ImportSpecifier[] = [];
        exportNameToImportName.forEach((name, propertyName) => {
            importSpecifiers.push(ts.createImportSpecifier(name === propertyName ? undefined : ts.createIdentifier(propertyName), ts.createIdentifier(name)));
        });
        const importDecl = toConvert.parent.parent;
        if (usedAsNamespaceOrDefault && !allowSyntheticDefaultImports) {
            // Need to leave the namespace import alone
            changes.insertNodeAfter(sourceFile, importDecl, updateImport(importDecl, /*defaultImportName*/ undefined, importSpecifiers));
        }
        else {
            changes.replaceNode(sourceFile, importDecl, updateImport(importDecl, usedAsNamespaceOrDefault ? ts.createIdentifier(toConvert.name.text) : undefined, importSpecifiers));
        }
    }
    function doChangeNamedToNamespace(sourceFile: ts.SourceFile, checker: ts.TypeChecker, changes: ts.textChanges.ChangeTracker, toConvert: ts.NamedImports): void {
        const importDecl = toConvert.parent.parent;
        const { moduleSpecifier } = importDecl;
        const preferredName = moduleSpecifier && ts.isStringLiteral(moduleSpecifier) ? ts.codefix.moduleSpecifierToValidIdentifier(moduleSpecifier.text, ts.ScriptTarget.ESNext) : "module";
        const namespaceNameConflicts = toConvert.elements.some(element => ts.FindAllReferences.Core.eachSymbolReferenceInFile(element.name, checker, sourceFile, id => !!checker.resolveName(preferredName, id, ts.SymbolFlags.All, /*excludeGlobals*/ true)) || false);
        const namespaceImportName = namespaceNameConflicts ? ts.getUniqueName(preferredName, sourceFile) : preferredName;
        const neededNamedImports: ts.ImportSpecifier[] = [];
        for (const element of toConvert.elements) {
            const propertyName = (element.propertyName || element.name).text;
            ts.FindAllReferences.Core.eachSymbolReferenceInFile(element.name, checker, sourceFile, id => {
                const access = ts.createPropertyAccess(ts.createIdentifier(namespaceImportName), propertyName);
                if (ts.isShorthandPropertyAssignment(id.parent)) {
                    changes.replaceNode(sourceFile, id.parent, ts.createPropertyAssignment(id.text, access));
                }
                else if (ts.isExportSpecifier(id.parent) && !id.parent.propertyName) {
                    if (!neededNamedImports.some(n => n.name === element.name)) {
                        neededNamedImports.push(ts.createImportSpecifier(element.propertyName && ts.createIdentifier(element.propertyName.text), ts.createIdentifier(element.name.text)));
                    }
                }
                else {
                    changes.replaceNode(sourceFile, id, access);
                }
            });
        }
        changes.replaceNode(sourceFile, toConvert, ts.createNamespaceImport(ts.createIdentifier(namespaceImportName)));
        if (neededNamedImports.length) {
            changes.insertNodeAfter(sourceFile, toConvert.parent.parent, updateImport(importDecl, /*defaultImportName*/ undefined, neededNamedImports));
        }
    }
    function updateImport(old: ts.ImportDeclaration, defaultImportName: ts.Identifier | undefined, elements: readonly ts.ImportSpecifier[] | undefined): ts.ImportDeclaration {
        return ts.createImportDeclaration(/*decorators*/ undefined, /*modifiers*/ undefined, ts.createImportClause(defaultImportName, elements && elements.length ? ts.createNamedImports(elements) : undefined), old.moduleSpecifier);
    }
}
