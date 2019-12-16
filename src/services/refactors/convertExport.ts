/* @internal */
namespace ts.refactor {
    const refactorName = "Convert export";
    const actionNameDefaultToNamed = "Convert default export to named export";
    const actionNameNamedToDefault = "Convert named export to default export";
    ts.refactor.registerRefactor(refactorName, {
        getAvailableActions(context): readonly ts.ApplicableRefactorInfo[] {
            const info = getInfo(context);
            if (!info)
                return ts.emptyArray;
            const description = info.wasDefault ? ts.Diagnostics.Convert_default_export_to_named_export.message : ts.Diagnostics.Convert_named_export_to_default_export.message;
            const actionName = info.wasDefault ? actionNameDefaultToNamed : actionNameNamedToDefault;
            return [{ name: refactorName, description, actions: [{ name: actionName, description }] }];
        },
        getEditsForAction(context, actionName): ts.RefactorEditInfo {
            ts.Debug.assert(actionName === actionNameDefaultToNamed || actionName === actionNameNamedToDefault, "Unexpected action name");
            const edits = ts.textChanges.ChangeTracker.with(context, t => doChange(context.file, context.program, ts.Debug.assertDefined(getInfo(context), "context must have info"), t, context.cancellationToken));
            return { edits, renameFilename: undefined, renameLocation: undefined };
        },
    });
    // If a VariableStatement, will have exactly one VariableDeclaration, with an Identifier for a name.
    type ExportToConvert = ts.FunctionDeclaration | ts.ClassDeclaration | ts.InterfaceDeclaration | ts.EnumDeclaration | ts.NamespaceDeclaration | ts.TypeAliasDeclaration | ts.VariableStatement;
    interface Info {
        readonly exportNode: ExportToConvert;
        readonly exportName: ts.Identifier; // This is exportNode.name except for VariableStatement_s.
        readonly wasDefault: boolean;
        readonly exportingModuleSymbol: ts.Symbol;
    }
    function getInfo(context: ts.RefactorContext): Info | undefined {
        const { file } = context;
        const span = ts.getRefactorContextSpan(context);
        const token = ts.getTokenAtPosition(file, span.start);
        const exportNode = ts.getParentNodeInSpan(token, file, span);
        if (!exportNode || (!ts.isSourceFile(exportNode.parent) && !(ts.isModuleBlock(exportNode.parent) && ts.isAmbientModule(exportNode.parent.parent)))) {
            return undefined;
        }
        const exportingModuleSymbol = ts.isSourceFile(exportNode.parent) ? exportNode.parent.symbol : exportNode.parent.parent.symbol;
        const flags = ts.getModifierFlags(exportNode);
        const wasDefault = !!(flags & ts.ModifierFlags.Default);
        // If source file already has a default export, don't offer refactor.
        if (!(flags & ts.ModifierFlags.Export) || !wasDefault && exportingModuleSymbol.exports!.has(ts.InternalSymbolName.Default)) {
            return undefined;
        }
        switch (exportNode.kind) {
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.ClassDeclaration:
            case ts.SyntaxKind.InterfaceDeclaration:
            case ts.SyntaxKind.EnumDeclaration:
            case ts.SyntaxKind.TypeAliasDeclaration:
            case ts.SyntaxKind.ModuleDeclaration: {
                const node = (exportNode as ts.FunctionDeclaration | ts.ClassDeclaration | ts.InterfaceDeclaration | ts.EnumDeclaration | ts.TypeAliasDeclaration | ts.NamespaceDeclaration);
                return node.name && ts.isIdentifier(node.name) ? { exportNode: node, exportName: node.name, wasDefault, exportingModuleSymbol } : undefined;
            }
            case ts.SyntaxKind.VariableStatement: {
                const vs = (exportNode as ts.VariableStatement);
                // Must be `export const x = something;`.
                if (!(vs.declarationList.flags & ts.NodeFlags.Const) || vs.declarationList.declarations.length !== 1) {
                    return undefined;
                }
                const decl = ts.first(vs.declarationList.declarations);
                if (!decl.initializer)
                    return undefined;
                ts.Debug.assert(!wasDefault, "Can't have a default flag here");
                return ts.isIdentifier(decl.name) ? { exportNode: vs, exportName: decl.name, wasDefault, exportingModuleSymbol } : undefined;
            }
            default:
                return undefined;
        }
    }
    function doChange(exportingSourceFile: ts.SourceFile, program: ts.Program, info: Info, changes: ts.textChanges.ChangeTracker, cancellationToken: ts.CancellationToken | undefined): void {
        changeExport(exportingSourceFile, info, changes, program.getTypeChecker());
        changeImports(program, info, changes, cancellationToken);
    }
    function changeExport(exportingSourceFile: ts.SourceFile, { wasDefault, exportNode, exportName }: Info, changes: ts.textChanges.ChangeTracker, checker: ts.TypeChecker): void {
        if (wasDefault) {
            changes.delete(exportingSourceFile, ts.Debug.assertDefined(ts.findModifier(exportNode, ts.SyntaxKind.DefaultKeyword), "Should find a default keyword in modifier list"));
        }
        else {
            const exportKeyword = ts.Debug.assertDefined(ts.findModifier(exportNode, ts.SyntaxKind.ExportKeyword), "Should find an export keyword in modifier list");
            switch (exportNode.kind) {
                case ts.SyntaxKind.FunctionDeclaration:
                case ts.SyntaxKind.ClassDeclaration:
                case ts.SyntaxKind.InterfaceDeclaration:
                    changes.insertNodeAfter(exportingSourceFile, exportKeyword, ts.createToken(ts.SyntaxKind.DefaultKeyword));
                    break;
                case ts.SyntaxKind.VariableStatement:
                    // If 'x' isn't used in this file, `export const x = 0;` --> `export default 0;`
                    if (!ts.FindAllReferences.Core.isSymbolReferencedInFile(exportName, checker, exportingSourceFile)) {
                        // We checked in `getInfo` that an initializer exists.
                        changes.replaceNode(exportingSourceFile, exportNode, ts.createExportDefault(ts.Debug.assertDefined(ts.first(exportNode.declarationList.declarations).initializer, "Initializer was previously known to be present")));
                        break;
                    }
                // falls through
                case ts.SyntaxKind.EnumDeclaration:
                case ts.SyntaxKind.TypeAliasDeclaration:
                case ts.SyntaxKind.ModuleDeclaration:
                    // `export type T = number;` -> `type T = number; export default T;`
                    changes.deleteModifier(exportingSourceFile, exportKeyword);
                    changes.insertNodeAfter(exportingSourceFile, exportNode, ts.createExportDefault(ts.createIdentifier(exportName.text)));
                    break;
                default:
                    ts.Debug.assertNever(exportNode, `Unexpected exportNode kind ${(exportNode as ExportToConvert).kind}`);
            }
        }
    }
    function changeImports(program: ts.Program, { wasDefault, exportName, exportingModuleSymbol }: Info, changes: ts.textChanges.ChangeTracker, cancellationToken: ts.CancellationToken | undefined): void {
        const checker = program.getTypeChecker();
        const exportSymbol = ts.Debug.assertDefined(checker.getSymbolAtLocation(exportName), "Export name should resolve to a symbol");
        ts.FindAllReferences.Core.eachExportReference(program.getSourceFiles(), checker, cancellationToken, exportSymbol, exportingModuleSymbol, exportName.text, wasDefault, ref => {
            const importingSourceFile = ref.getSourceFile();
            if (wasDefault) {
                changeDefaultToNamedImport(importingSourceFile, ref, changes, exportName.text);
            }
            else {
                changeNamedToDefaultImport(importingSourceFile, ref, changes);
            }
        });
    }
    function changeDefaultToNamedImport(importingSourceFile: ts.SourceFile, ref: ts.Identifier, changes: ts.textChanges.ChangeTracker, exportName: string): void {
        const { parent } = ref;
        switch (parent.kind) {
            case ts.SyntaxKind.PropertyAccessExpression:
                // `a.default` --> `a.foo`
                changes.replaceNode(importingSourceFile, ref, ts.createIdentifier(exportName));
                break;
            case ts.SyntaxKind.ImportSpecifier:
            case ts.SyntaxKind.ExportSpecifier: {
                const spec = (parent as ts.ImportSpecifier | ts.ExportSpecifier);
                // `default as foo` --> `foo`, `default as bar` --> `foo as bar`
                changes.replaceNode(importingSourceFile, spec, makeImportSpecifier(exportName, spec.name.text));
                break;
            }
            case ts.SyntaxKind.ImportClause: {
                const clause = (parent as ts.ImportClause);
                ts.Debug.assert(clause.name === ref, "Import clause name should match provided ref");
                const spec = makeImportSpecifier(exportName, ref.text);
                const { namedBindings } = clause;
                if (!namedBindings) {
                    // `import foo from "./a";` --> `import { foo } from "./a";`
                    changes.replaceNode(importingSourceFile, ref, ts.createNamedImports([spec]));
                }
                else if (namedBindings.kind === ts.SyntaxKind.NamespaceImport) {
                    // `import foo, * as a from "./a";` --> `import * as a from ".a/"; import { foo } from "./a";`
                    changes.deleteRange(importingSourceFile, { pos: ref.getStart(importingSourceFile), end: namedBindings.getStart(importingSourceFile) });
                    const quotePreference = ts.isStringLiteral(clause.parent.moduleSpecifier) ? ts.quotePreferenceFromString(clause.parent.moduleSpecifier, importingSourceFile) : ts.QuotePreference.Double;
                    const newImport = ts.makeImport(/*default*/ undefined, [makeImportSpecifier(exportName, ref.text)], clause.parent.moduleSpecifier, quotePreference);
                    changes.insertNodeAfter(importingSourceFile, clause.parent, newImport);
                }
                else {
                    // `import foo, { bar } from "./a"` --> `import { bar, foo } from "./a";`
                    changes.delete(importingSourceFile, ref);
                    changes.insertNodeAtEndOfList(importingSourceFile, namedBindings.elements, spec);
                }
                break;
            }
            default:
                ts.Debug.failBadSyntaxKind(parent);
        }
    }
    function changeNamedToDefaultImport(importingSourceFile: ts.SourceFile, ref: ts.Identifier, changes: ts.textChanges.ChangeTracker): void {
        const parent = (ref.parent as ts.PropertyAccessExpression | ts.ImportSpecifier | ts.ExportSpecifier);
        switch (parent.kind) {
            case ts.SyntaxKind.PropertyAccessExpression:
                // `a.foo` --> `a.default`
                changes.replaceNode(importingSourceFile, ref, ts.createIdentifier("default"));
                break;
            case ts.SyntaxKind.ImportSpecifier: {
                // `import { foo } from "./a";` --> `import foo from "./a";`
                // `import { foo as bar } from "./a";` --> `import bar from "./a";`
                const defaultImport = ts.createIdentifier(parent.name.text);
                if (parent.parent.elements.length === 1) {
                    changes.replaceNode(importingSourceFile, parent.parent, defaultImport);
                }
                else {
                    changes.delete(importingSourceFile, parent);
                    changes.insertNodeBefore(importingSourceFile, parent.parent, defaultImport);
                }
                break;
            }
            case ts.SyntaxKind.ExportSpecifier: {
                // `export { foo } from "./a";` --> `export { default as foo } from "./a";`
                // `export { foo as bar } from "./a";` --> `export { default as bar } from "./a";`
                // `export { foo as default } from "./a";` --> `export { default } from "./a";`
                // (Because `export foo from "./a";` isn't valid syntax.)
                changes.replaceNode(importingSourceFile, parent, makeExportSpecifier("default", parent.name.text));
                break;
            }
            default:
                ts.Debug.assertNever(parent, `Unexpected parent kind ${(parent as ts.Node).kind}`);
        }
    }
    function makeImportSpecifier(propertyName: string, name: string): ts.ImportSpecifier {
        return ts.createImportSpecifier(propertyName === name ? undefined : ts.createIdentifier(propertyName), ts.createIdentifier(name));
    }
    function makeExportSpecifier(propertyName: string, name: string): ts.ExportSpecifier {
        return ts.createExportSpecifier(propertyName === name ? undefined : ts.createIdentifier(propertyName), ts.createIdentifier(name));
    }
}
