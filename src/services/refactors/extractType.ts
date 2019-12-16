/* @internal */
namespace ts.refactor {
    const refactorName = "Extract type";
    const extractToTypeAlias = "Extract to type alias";
    const extractToInterface = "Extract to interface";
    const extractToTypeDef = "Extract to typedef";
    ts.refactor.registerRefactor(refactorName, {
        getAvailableActions(context): readonly ts.ApplicableRefactorInfo[] {
            const info = getRangeToExtract(context);
            if (!info)
                return ts.emptyArray;
            return [{
                    name: refactorName,
                    description: ts.getLocaleSpecificMessage(ts.Diagnostics.Extract_type),
                    actions: info.isJS ? [{
                            name: extractToTypeDef, description: ts.getLocaleSpecificMessage(ts.Diagnostics.Extract_to_typedef)
                        }] : ts.append([{
                            name: extractToTypeAlias, description: ts.getLocaleSpecificMessage(ts.Diagnostics.Extract_to_type_alias)
                        }], info.typeElements && {
                        name: extractToInterface, description: ts.getLocaleSpecificMessage(ts.Diagnostics.Extract_to_interface)
                    })
                }];
        },
        getEditsForAction(context, actionName): ts.RefactorEditInfo {
            const { file } = context;
            const info = ts.Debug.assertDefined(getRangeToExtract(context), "Expected to find a range to extract");
            const name = ts.getUniqueName("NewType", file);
            const edits = ts.textChanges.ChangeTracker.with(context, changes => {
                switch (actionName) {
                    case extractToTypeAlias:
                        ts.Debug.assert(!info.isJS, "Invalid actionName/JS combo");
                        return doTypeAliasChange(changes, file, name, info);
                    case extractToTypeDef:
                        ts.Debug.assert(info.isJS, "Invalid actionName/JS combo");
                        return doTypedefChange(changes, file, name, info);
                    case extractToInterface:
                        ts.Debug.assert(!info.isJS && !!info.typeElements, "Invalid actionName/JS combo");
                        return doInterfaceChange(changes, file, name, info as InterfaceInfo);
                    default:
                        ts.Debug.fail("Unexpected action name");
                }
            });
            const renameFilename = file.fileName;
            const renameLocation = ts.getRenameLocation(edits, renameFilename, name, /*preferLastLocation*/ false);
            return { edits, renameFilename, renameLocation };
        }
    });
    interface TypeAliasInfo {
        isJS: boolean;
        selection: ts.TypeNode;
        firstStatement: ts.Statement;
        typeParameters: readonly ts.TypeParameterDeclaration[];
        typeElements?: readonly ts.TypeElement[];
    }
    interface InterfaceInfo {
        isJS: boolean;
        selection: ts.TypeNode;
        firstStatement: ts.Statement;
        typeParameters: readonly ts.TypeParameterDeclaration[];
        typeElements: readonly ts.TypeElement[];
    }
    type Info = TypeAliasInfo | InterfaceInfo;
    function getRangeToExtract(context: ts.RefactorContext): Info | undefined {
        const { file, startPosition } = context;
        const isJS = ts.isSourceFileJS(file);
        const current = ts.getTokenAtPosition(file, startPosition);
        const range = ts.createTextRangeFromSpan(ts.getRefactorContextSpan(context));
        const selection = ts.findAncestor(current, (node => node.parent && rangeContainsSkipTrivia(range, node, file) && !rangeContainsSkipTrivia(range, node.parent, file)));
        if (!selection || !ts.isTypeNode(selection))
            return undefined;
        const checker = context.program.getTypeChecker();
        const firstStatement = ts.Debug.assertDefined(ts.findAncestor(selection, ts.isStatement), "Should find a statement");
        const typeParameters = collectTypeParameters(checker, selection, firstStatement, file);
        if (!typeParameters)
            return undefined;
        const typeElements = flattenTypeLiteralNodeReference(checker, selection);
        return { isJS, selection, firstStatement, typeParameters, typeElements };
    }
    function flattenTypeLiteralNodeReference(checker: ts.TypeChecker, node: ts.TypeNode | undefined): readonly ts.TypeElement[] | undefined {
        if (!node)
            return undefined;
        if (ts.isIntersectionTypeNode(node)) {
            const result: ts.TypeElement[] = [];
            const seen = ts.createMap<true>();
            for (const type of node.types) {
                const flattenedTypeMembers = flattenTypeLiteralNodeReference(checker, type);
                if (!flattenedTypeMembers || !flattenedTypeMembers.every(type => type.name && ts.addToSeen(seen, (ts.getNameFromPropertyName(type.name) as string)))) {
                    return undefined;
                }
                ts.addRange(result, flattenedTypeMembers);
            }
            return result;
        }
        else if (ts.isParenthesizedTypeNode(node)) {
            return flattenTypeLiteralNodeReference(checker, node.type);
        }
        else if (ts.isTypeLiteralNode(node)) {
            return node.members;
        }
        return undefined;
    }
    function rangeContainsSkipTrivia(r1: ts.TextRange, node: ts.Node, file: ts.SourceFile): boolean {
        return ts.rangeContainsStartEnd(r1, ts.skipTrivia(file.text, node.pos), node.end);
    }
    function collectTypeParameters(checker: ts.TypeChecker, selection: ts.TypeNode, statement: ts.Statement, file: ts.SourceFile): ts.TypeParameterDeclaration[] | undefined {
        const result: ts.TypeParameterDeclaration[] = [];
        return visitor(selection) ? undefined : result;
        function visitor(node: ts.Node): true | undefined {
            if (ts.isTypeReferenceNode(node)) {
                if (ts.isIdentifier(node.typeName)) {
                    const symbol = checker.resolveName(node.typeName.text, node.typeName, ts.SymbolFlags.TypeParameter, /* excludeGlobals */ true);
                    if (symbol) {
                        const declaration = ts.cast(ts.first(symbol.declarations), ts.isTypeParameterDeclaration);
                        if (rangeContainsSkipTrivia(statement, declaration, file) && !rangeContainsSkipTrivia(selection, declaration, file)) {
                            result.push(declaration);
                        }
                    }
                }
            }
            else if (ts.isInferTypeNode(node)) {
                const conditionalTypeNode = ts.findAncestor(node, n => ts.isConditionalTypeNode(n) && rangeContainsSkipTrivia(n.extendsType, node, file));
                if (!conditionalTypeNode || !rangeContainsSkipTrivia(selection, conditionalTypeNode, file)) {
                    return true;
                }
            }
            else if ((ts.isTypePredicateNode(node) || ts.isThisTypeNode(node))) {
                const functionLikeNode = ts.findAncestor(node.parent, ts.isFunctionLike);
                if (functionLikeNode && functionLikeNode.type && rangeContainsSkipTrivia(functionLikeNode.type, node, file) && !rangeContainsSkipTrivia(selection, functionLikeNode, file)) {
                    return true;
                }
            }
            else if (ts.isTypeQueryNode(node)) {
                if (ts.isIdentifier(node.exprName)) {
                    const symbol = checker.resolveName(node.exprName.text, node.exprName, ts.SymbolFlags.Value, /* excludeGlobals */ false);
                    if (symbol && rangeContainsSkipTrivia(statement, symbol.valueDeclaration, file) && !rangeContainsSkipTrivia(selection, symbol.valueDeclaration, file)) {
                        return true;
                    }
                }
                else {
                    if (ts.isThisIdentifier(node.exprName.left) && !rangeContainsSkipTrivia(selection, node.parent, file)) {
                        return true;
                    }
                }
            }
            return ts.forEachChild(node, visitor);
        }
    }
    function doTypeAliasChange(changes: ts.textChanges.ChangeTracker, file: ts.SourceFile, name: string, info: TypeAliasInfo) {
        const { firstStatement, selection, typeParameters } = info;
        const newTypeNode = ts.createTypeAliasDeclaration(
        /* decorators */ undefined, 
        /* modifiers */ undefined, name, typeParameters.map(id => ts.updateTypeParameterDeclaration(id, id.name, id.constraint, /* defaultType */ undefined)), selection);
        changes.insertNodeBefore(file, firstStatement, newTypeNode, /* blankLineBetween */ true);
        changes.replaceNode(file, selection, ts.createTypeReferenceNode(name, typeParameters.map(id => ts.createTypeReferenceNode(id.name, /* typeArguments */ undefined))));
    }
    function doInterfaceChange(changes: ts.textChanges.ChangeTracker, file: ts.SourceFile, name: string, info: InterfaceInfo) {
        const { firstStatement, selection, typeParameters, typeElements } = info;
        const newTypeNode = ts.createInterfaceDeclaration(
        /* decorators */ undefined, 
        /* modifiers */ undefined, name, typeParameters, 
        /* heritageClauses */ undefined, typeElements);
        changes.insertNodeBefore(file, firstStatement, newTypeNode, /* blankLineBetween */ true);
        changes.replaceNode(file, selection, ts.createTypeReferenceNode(name, typeParameters.map(id => ts.createTypeReferenceNode(id.name, /* typeArguments */ undefined))));
    }
    function doTypedefChange(changes: ts.textChanges.ChangeTracker, file: ts.SourceFile, name: string, info: Info) {
        const { firstStatement, selection, typeParameters } = info;
        const node = (<ts.JSDocTypedefTag>ts.createNode(ts.SyntaxKind.JSDocTypedefTag));
        node.tagName = ts.createIdentifier("typedef"); // TODO: jsdoc factory https://github.com/Microsoft/TypeScript/pull/29539
        node.fullName = ts.createIdentifier(name);
        node.name = node.fullName;
        node.typeExpression = ts.createJSDocTypeExpression(selection);
        const templates: ts.JSDocTemplateTag[] = [];
        ts.forEach(typeParameters, typeParameter => {
            const constraint = ts.getEffectiveConstraintOfTypeParameter(typeParameter);
            const template = (<ts.JSDocTemplateTag>ts.createNode(ts.SyntaxKind.JSDocTemplateTag));
            template.tagName = ts.createIdentifier("template");
            template.constraint = constraint && ts.cast(constraint, ts.isJSDocTypeExpression);
            const parameter = (<ts.TypeParameterDeclaration>ts.createNode(ts.SyntaxKind.TypeParameter));
            parameter.name = typeParameter.name;
            template.typeParameters = ts.createNodeArray([parameter]);
            templates.push(template);
        });
        changes.insertNodeBefore(file, firstStatement, ts.createJSDocComment(/* comment */ undefined, ts.createNodeArray(ts.concatenate<ts.JSDocTag>(templates, [node]))), /* blankLineBetween */ true);
        changes.replaceNode(file, selection, ts.createTypeReferenceNode(name, typeParameters.map(id => ts.createTypeReferenceNode(id.name, /* typeArguments */ undefined))));
    }
}
