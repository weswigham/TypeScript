/* @internal */
namespace ts.codefix {
    const fixId = "fixSpelling";
    const errorCodes = [
        ts.Diagnostics.Property_0_does_not_exist_on_type_1_Did_you_mean_2.code,
        ts.Diagnostics.Cannot_find_name_0_Did_you_mean_1.code,
        ts.Diagnostics.Cannot_find_name_0_Did_you_mean_the_instance_member_this_0.code,
        ts.Diagnostics.Cannot_find_name_0_Did_you_mean_the_static_member_1_0.code,
        ts.Diagnostics.Module_0_has_no_exported_member_1_Did_you_mean_2.code,
    ];
    ts.codefix.registerCodeFix({
        errorCodes,
        getCodeActions(context) {
            const { sourceFile } = context;
            const info = getInfo(sourceFile, context.span.start, context);
            if (!info)
                return undefined;
            const { node, suggestion } = info;
            const { target } = context.host.getCompilationSettings();
            const changes = ts.textChanges.ChangeTracker.with(context, t => doChange(t, sourceFile, node, suggestion, target!));
            return [ts.codefix.createCodeFixAction("spelling", changes, [ts.Diagnostics.Change_spelling_to_0, suggestion], fixId, ts.Diagnostics.Fix_all_detected_spelling_errors)];
        },
        fixIds: [fixId],
        getAllCodeActions: context => ts.codefix.codeFixAll(context, errorCodes, (changes, diag) => {
            const info = getInfo(diag.file, diag.start, context);
            const { target } = context.host.getCompilationSettings();
            if (info)
                doChange(changes, context.sourceFile, info.node, info.suggestion, target!);
        }),
    });
    function getInfo(sourceFile: ts.SourceFile, pos: number, context: ts.CodeFixContextBase): {
        node: ts.Node;
        suggestion: string;
    } | undefined {
        // This is the identifier of the misspelled word. eg:
        // this.speling = 1;
        //      ^^^^^^^
        const node = ts.getTokenAtPosition(sourceFile, pos);
        const checker = context.program.getTypeChecker();
        let suggestion: string | undefined;
        if (ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) {
            ts.Debug.assert(node.kind === ts.SyntaxKind.Identifier, "Expected an identifier for spelling (property access)");
            let containingType = checker.getTypeAtLocation(node.parent.expression);
            if (node.parent.flags & ts.NodeFlags.OptionalChain) {
                containingType = checker.getNonNullableType(containingType);
            }
            suggestion = checker.getSuggestionForNonexistentProperty((node as ts.Identifier), containingType);
        }
        else if (ts.isImportSpecifier(node.parent) && node.parent.name === node) {
            ts.Debug.assert(node.kind === ts.SyntaxKind.Identifier, "Expected an identifier for spelling (import)");
            const importDeclaration = (ts.findAncestor(node, ts.isImportDeclaration)!);
            const resolvedSourceFile = getResolvedSourceFileFromImportDeclaration(sourceFile, context, importDeclaration);
            if (resolvedSourceFile && resolvedSourceFile.symbol) {
                suggestion = checker.getSuggestionForNonexistentExport((node as ts.Identifier), resolvedSourceFile.symbol);
            }
        }
        else {
            const meaning = ts.getMeaningFromLocation(node);
            const name = ts.getTextOfNode(node);
            ts.Debug.assert(name !== undefined, "name should be defined");
            suggestion = checker.getSuggestionForNonexistentSymbol(node, name, convertSemanticMeaningToSymbolFlags(meaning));
        }
        return suggestion === undefined ? undefined : { node, suggestion };
    }
    function doChange(changes: ts.textChanges.ChangeTracker, sourceFile: ts.SourceFile, node: ts.Node, suggestion: string, target: ts.ScriptTarget) {
        if (!ts.isIdentifierText(suggestion, target) && ts.isPropertyAccessExpression(node.parent)) {
            changes.replaceNode(sourceFile, node.parent, ts.createElementAccess(node.parent.expression, ts.createLiteral(suggestion)));
        }
        else {
            changes.replaceNode(sourceFile, node, ts.createIdentifier(suggestion));
        }
    }
    function convertSemanticMeaningToSymbolFlags(meaning: ts.SemanticMeaning): ts.SymbolFlags {
        let flags = 0;
        if (meaning & ts.SemanticMeaning.Namespace) {
            flags |= ts.SymbolFlags.Namespace;
        }
        if (meaning & ts.SemanticMeaning.Type) {
            flags |= ts.SymbolFlags.Type;
        }
        if (meaning & ts.SemanticMeaning.Value) {
            flags |= ts.SymbolFlags.Value;
        }
        return flags;
    }
    function getResolvedSourceFileFromImportDeclaration(sourceFile: ts.SourceFile, context: ts.CodeFixContextBase, importDeclaration: ts.ImportDeclaration): ts.SourceFile | undefined {
        if (!importDeclaration || !ts.isStringLiteralLike(importDeclaration.moduleSpecifier))
            return undefined;
        const resolvedModule = ts.getResolvedModule(sourceFile, importDeclaration.moduleSpecifier.text);
        if (!resolvedModule)
            return undefined;
        return context.program.getSourceFile(resolvedModule.resolvedFileName);
    }
}
