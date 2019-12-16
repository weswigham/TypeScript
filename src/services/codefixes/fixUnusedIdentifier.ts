/* @internal */
namespace ts.codefix {
    const fixName = "unusedIdentifier";
    const fixIdPrefix = "unusedIdentifier_prefix";
    const fixIdDelete = "unusedIdentifier_delete";
    const fixIdInfer = "unusedIdentifier_infer";
    const errorCodes = [
        ts.Diagnostics._0_is_declared_but_its_value_is_never_read.code,
        ts.Diagnostics._0_is_declared_but_never_used.code,
        ts.Diagnostics.Property_0_is_declared_but_its_value_is_never_read.code,
        ts.Diagnostics.All_imports_in_import_declaration_are_unused.code,
        ts.Diagnostics.All_destructured_elements_are_unused.code,
        ts.Diagnostics.All_variables_are_unused.code,
        ts.Diagnostics.All_type_parameters_are_unused.code,
    ];
    ts.codefix.registerCodeFix({
        errorCodes,
        getCodeActions(context) {
            const { errorCode, sourceFile, program } = context;
            const checker = program.getTypeChecker();
            const sourceFiles = program.getSourceFiles();
            const token = ts.getTokenAtPosition(sourceFile, context.span.start);
            if (ts.isJSDocTemplateTag(token)) {
                return [createDeleteFix(ts.textChanges.ChangeTracker.with(context, t => t.delete(sourceFile, token)), ts.Diagnostics.Remove_template_tag)];
            }
            if (token.kind === ts.SyntaxKind.LessThanToken) {
                const changes = ts.textChanges.ChangeTracker.with(context, t => deleteTypeParameters(t, sourceFile, token));
                return [createDeleteFix(changes, ts.Diagnostics.Remove_type_parameters)];
            }
            const importDecl = tryGetFullImport(token);
            if (importDecl) {
                const changes = ts.textChanges.ChangeTracker.with(context, t => t.delete(sourceFile, importDecl));
                return [createDeleteFix(changes, [ts.Diagnostics.Remove_import_from_0, ts.showModuleSpecifier(importDecl)])];
            }
            const delDestructure = ts.textChanges.ChangeTracker.with(context, t => tryDeleteFullDestructure(token, t, sourceFile, checker, sourceFiles, /*isFixAll*/ false));
            if (delDestructure.length) {
                return [createDeleteFix(delDestructure, ts.Diagnostics.Remove_destructuring)];
            }
            const delVar = ts.textChanges.ChangeTracker.with(context, t => tryDeleteFullVariableStatement(sourceFile, token, t));
            if (delVar.length) {
                return [createDeleteFix(delVar, ts.Diagnostics.Remove_variable_statement)];
            }
            const result: ts.CodeFixAction[] = [];
            if (token.kind === ts.SyntaxKind.InferKeyword) {
                const changes = ts.textChanges.ChangeTracker.with(context, t => changeInferToUnknown(t, sourceFile, token));
                const name = ts.cast(token.parent, ts.isInferTypeNode).typeParameter.name.text;
                result.push(ts.codefix.createCodeFixAction(fixName, changes, [ts.Diagnostics.Replace_infer_0_with_unknown, name], fixIdInfer, ts.Diagnostics.Replace_all_unused_infer_with_unknown));
            }
            else {
                const deletion = ts.textChanges.ChangeTracker.with(context, t => tryDeleteDeclaration(sourceFile, token, t, checker, sourceFiles, /*isFixAll*/ false));
                if (deletion.length) {
                    const name = ts.isComputedPropertyName(token.parent) ? token.parent : token;
                    result.push(createDeleteFix(deletion, [ts.Diagnostics.Remove_declaration_for_Colon_0, name.getText(sourceFile)]));
                }
            }
            const prefix = ts.textChanges.ChangeTracker.with(context, t => tryPrefixDeclaration(t, errorCode, sourceFile, token));
            if (prefix.length) {
                result.push(ts.codefix.createCodeFixAction(fixName, prefix, [ts.Diagnostics.Prefix_0_with_an_underscore, token.getText(sourceFile)], fixIdPrefix, ts.Diagnostics.Prefix_all_unused_declarations_with_where_possible));
            }
            return result;
        },
        fixIds: [fixIdPrefix, fixIdDelete, fixIdInfer],
        getAllCodeActions: context => {
            const { sourceFile, program } = context;
            const checker = program.getTypeChecker();
            const sourceFiles = program.getSourceFiles();
            return ts.codefix.codeFixAll(context, errorCodes, (changes, diag) => {
                const token = ts.getTokenAtPosition(sourceFile, diag.start);
                switch (context.fixId) {
                    case fixIdPrefix:
                        tryPrefixDeclaration(changes, diag.code, sourceFile, token);
                        break;
                    case fixIdDelete: {
                        if (token.kind === ts.SyntaxKind.InferKeyword)
                            break; // Can't delete
                        const importDecl = tryGetFullImport(token);
                        if (importDecl) {
                            changes.delete(sourceFile, importDecl);
                        }
                        else if (ts.isJSDocTemplateTag(token)) {
                            changes.delete(sourceFile, token);
                        }
                        else if (token.kind === ts.SyntaxKind.LessThanToken) {
                            deleteTypeParameters(changes, sourceFile, token);
                        }
                        else if (!tryDeleteFullDestructure(token, changes, sourceFile, checker, sourceFiles, /*isFixAll*/ true) &&
                            !tryDeleteFullVariableStatement(sourceFile, token, changes)) {
                            tryDeleteDeclaration(sourceFile, token, changes, checker, sourceFiles, /*isFixAll*/ true);
                        }
                        break;
                    }
                    case fixIdInfer:
                        if (token.kind === ts.SyntaxKind.InferKeyword) {
                            changeInferToUnknown(changes, sourceFile, token);
                        }
                        break;
                    default:
                        ts.Debug.fail(JSON.stringify(context.fixId));
                }
            });
        },
    });
    function changeInferToUnknown(changes: ts.textChanges.ChangeTracker, sourceFile: ts.SourceFile, token: ts.Node): void {
        changes.replaceNode(sourceFile, token.parent, ts.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword));
    }
    function createDeleteFix(changes: ts.FileTextChanges[], diag: ts.codefix.DiagnosticAndArguments): ts.CodeFixAction {
        return ts.codefix.createCodeFixAction(fixName, changes, diag, fixIdDelete, ts.Diagnostics.Delete_all_unused_declarations);
    }
    function deleteTypeParameters(changes: ts.textChanges.ChangeTracker, sourceFile: ts.SourceFile, token: ts.Node): void {
        changes.delete(sourceFile, ts.Debug.assertDefined(ts.cast(token.parent, ts.isDeclarationWithTypeParameterChildren).typeParameters, "The type parameter to delete should exist"));
    }
    // Sometimes the diagnostic span is an entire ImportDeclaration, so we should remove the whole thing.
    function tryGetFullImport(token: ts.Node): ts.ImportDeclaration | undefined {
        return token.kind === ts.SyntaxKind.ImportKeyword ? ts.tryCast(token.parent, ts.isImportDeclaration) : undefined;
    }
    function tryDeleteFullDestructure(token: ts.Node, changes: ts.textChanges.ChangeTracker, sourceFile: ts.SourceFile, checker: ts.TypeChecker, sourceFiles: readonly ts.SourceFile[], isFixAll: boolean): boolean {
        if (token.kind !== ts.SyntaxKind.OpenBraceToken || !ts.isObjectBindingPattern(token.parent))
            return false;
        const decl = token.parent.parent;
        if (decl.kind === ts.SyntaxKind.Parameter) {
            tryDeleteParameter(changes, sourceFile, decl, checker, sourceFiles, isFixAll);
        }
        else {
            changes.delete(sourceFile, decl);
        }
        return true;
    }
    function tryDeleteFullVariableStatement(sourceFile: ts.SourceFile, token: ts.Node, changes: ts.textChanges.ChangeTracker): boolean {
        const declarationList = ts.tryCast(token.parent, ts.isVariableDeclarationList);
        if (declarationList && declarationList.getChildren(sourceFile)[0] === token) {
            changes.delete(sourceFile, declarationList.parent.kind === ts.SyntaxKind.VariableStatement ? declarationList.parent : declarationList);
            return true;
        }
        return false;
    }
    function tryPrefixDeclaration(changes: ts.textChanges.ChangeTracker, errorCode: number, sourceFile: ts.SourceFile, token: ts.Node): void {
        // Don't offer to prefix a property.
        if (errorCode === ts.Diagnostics.Property_0_is_declared_but_its_value_is_never_read.code)
            return;
        if (token.kind === ts.SyntaxKind.InferKeyword) {
            token = ts.cast(token.parent, ts.isInferTypeNode).typeParameter.name;
        }
        if (ts.isIdentifier(token) && canPrefix(token)) {
            changes.replaceNode(sourceFile, token, ts.createIdentifier(`_${token.text}`));
        }
    }
    function canPrefix(token: ts.Identifier): boolean {
        switch (token.parent.kind) {
            case ts.SyntaxKind.Parameter:
            case ts.SyntaxKind.TypeParameter:
                return true;
            case ts.SyntaxKind.VariableDeclaration: {
                const varDecl = (token.parent as ts.VariableDeclaration);
                switch (varDecl.parent.parent.kind) {
                    case ts.SyntaxKind.ForOfStatement:
                    case ts.SyntaxKind.ForInStatement:
                        return true;
                }
            }
        }
        return false;
    }
    function tryDeleteDeclaration(sourceFile: ts.SourceFile, token: ts.Node, changes: ts.textChanges.ChangeTracker, checker: ts.TypeChecker, sourceFiles: readonly ts.SourceFile[], isFixAll: boolean) {
        tryDeleteDeclarationWorker(token, changes, sourceFile, checker, sourceFiles, isFixAll);
        if (ts.isIdentifier(token))
            deleteAssignments(changes, sourceFile, token, checker);
    }
    function deleteAssignments(changes: ts.textChanges.ChangeTracker, sourceFile: ts.SourceFile, token: ts.Identifier, checker: ts.TypeChecker) {
        ts.FindAllReferences.Core.eachSymbolReferenceInFile(token, checker, sourceFile, (ref: ts.Node) => {
            if (ts.isPropertyAccessExpression(ref.parent) && ref.parent.name === ref)
                ref = ref.parent;
            if (ts.isBinaryExpression(ref.parent) && ts.isExpressionStatement(ref.parent.parent) && ref.parent.left === ref) {
                changes.delete(sourceFile, ref.parent.parent);
            }
        });
    }
    function tryDeleteDeclarationWorker(token: ts.Node, changes: ts.textChanges.ChangeTracker, sourceFile: ts.SourceFile, checker: ts.TypeChecker, sourceFiles: readonly ts.SourceFile[], isFixAll: boolean): void {
        const { parent } = token;
        if (ts.isParameter(parent)) {
            tryDeleteParameter(changes, sourceFile, parent, checker, sourceFiles, isFixAll);
        }
        else {
            changes.delete(sourceFile, ts.isImportClause(parent) ? token : ts.isComputedPropertyName(parent) ? parent.parent : parent);
        }
    }
    function tryDeleteParameter(changes: ts.textChanges.ChangeTracker, sourceFile: ts.SourceFile, p: ts.ParameterDeclaration, checker: ts.TypeChecker, sourceFiles: readonly ts.SourceFile[], isFixAll: boolean): void {
        if (mayDeleteParameter(p, checker, isFixAll)) {
            if (p.modifiers && p.modifiers.length > 0
                && (!ts.isIdentifier(p.name) || ts.FindAllReferences.Core.isSymbolReferencedInFile(p.name, checker, sourceFile))) {
                p.modifiers.forEach(modifier => {
                    changes.deleteModifier(sourceFile, modifier);
                });
            }
            else {
                changes.delete(sourceFile, p);
                deleteUnusedArguments(changes, sourceFile, p, sourceFiles, checker);
            }
        }
    }
    function mayDeleteParameter(p: ts.ParameterDeclaration, checker: ts.TypeChecker, isFixAll: boolean): boolean {
        const { parent } = p;
        switch (parent.kind) {
            case ts.SyntaxKind.MethodDeclaration:
                // Don't remove a parameter if this overrides something.
                const symbol = checker.getSymbolAtLocation(parent.name)!;
                if (ts.isMemberSymbolInBaseType(symbol, checker))
                    return false;
            // falls through
            case ts.SyntaxKind.Constructor:
            case ts.SyntaxKind.FunctionDeclaration:
                return true;
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.ArrowFunction: {
                // Can't remove a non-last parameter in a callback. Can remove a parameter in code-fix-all if future parameters are also unused.
                const { parameters } = parent;
                const index = parameters.indexOf(p);
                ts.Debug.assert(index !== -1, "The parameter should already be in the list");
                return isFixAll
                    ? parameters.slice(index + 1).every(p => p.name.kind === ts.SyntaxKind.Identifier && !p.symbol.isReferenced)
                    : index === parameters.length - 1;
            }
            case ts.SyntaxKind.SetAccessor:
                // Setter must have a parameter
                return false;
            default:
                return ts.Debug.failBadSyntaxKind(parent);
        }
    }
    function deleteUnusedArguments(changes: ts.textChanges.ChangeTracker, sourceFile: ts.SourceFile, deletedParameter: ts.ParameterDeclaration, sourceFiles: readonly ts.SourceFile[], checker: ts.TypeChecker): void {
        ts.FindAllReferences.Core.eachSignatureCall(deletedParameter.parent, sourceFiles, checker, call => {
            const index = deletedParameter.parent.parameters.indexOf(deletedParameter);
            if (call.arguments.length > index) { // Just in case the call didn't provide enough arguments.
                changes.delete(sourceFile, call.arguments[index]);
            }
        });
    }
}
