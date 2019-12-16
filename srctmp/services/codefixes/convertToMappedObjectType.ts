import * as ts from "../ts";
/* @internal */
const fixIdAddMissingTypeof = "fixConvertToMappedObjectType";
/* @internal */
const fixId = fixIdAddMissingTypeof;
/* @internal */
const errorCodes = [ts.Diagnostics.An_index_signature_parameter_type_cannot_be_a_union_type_Consider_using_a_mapped_object_type_instead.code];
/* @internal */
type FixableDeclaration = ts.InterfaceDeclaration | ts.TypeAliasDeclaration;
/* @internal */
ts.codefix.registerCodeFix({
    errorCodes,
    getCodeActions: context => {
        const { sourceFile, span } = context;
        const info = getInfo(sourceFile, span.start);
        if (!info)
            return undefined;
        const changes = ts.textChanges.ChangeTracker.with(context, t => doChange(t, sourceFile, info));
        const name = ts.idText(info.container.name);
        return [ts.codefix.createCodeFixAction(fixId, changes, [ts.Diagnostics.Convert_0_to_mapped_object_type, name], fixId, [ts.Diagnostics.Convert_0_to_mapped_object_type, name])];
    },
    fixIds: [fixId],
    getAllCodeActions: context => ts.codefix.codeFixAll(context, errorCodes, (changes, diag) => {
        const info = getInfo(diag.file, diag.start);
        if (info)
            doChange(changes, diag.file, info);
    })
});
/* @internal */
interface Info {
    readonly indexSignature: ts.IndexSignatureDeclaration;
    readonly container: FixableDeclaration;
}
/* @internal */
function getInfo(sourceFile: ts.SourceFile, pos: number): Info | undefined {
    const token = ts.getTokenAtPosition(sourceFile, pos);
    const indexSignature = ts.cast(token.parent.parent, ts.isIndexSignatureDeclaration);
    if (ts.isClassDeclaration(indexSignature.parent))
        return undefined;
    const container = ts.isInterfaceDeclaration(indexSignature.parent) ? indexSignature.parent : ts.cast(indexSignature.parent.parent, ts.isTypeAliasDeclaration);
    return { indexSignature, container };
}
/* @internal */
function createTypeAliasFromInterface(declaration: FixableDeclaration, type: ts.TypeNode): ts.TypeAliasDeclaration {
    return ts.createTypeAliasDeclaration(declaration.decorators, declaration.modifiers, declaration.name, declaration.typeParameters, type);
}
/* @internal */
function doChange(changes: ts.textChanges.ChangeTracker, sourceFile: ts.SourceFile, { indexSignature, container }: Info): void {
    const members = ts.isInterfaceDeclaration(container) ? container.members : (<ts.TypeLiteralNode>container.type).members;
    const otherMembers = members.filter(member => !ts.isIndexSignatureDeclaration(member));
    const parameter = ts.first(indexSignature.parameters);
    const mappedTypeParameter = ts.createTypeParameterDeclaration(ts.cast(parameter.name, ts.isIdentifier), parameter.type);
    const mappedIntersectionType = ts.createMappedTypeNode(ts.hasReadonlyModifier(indexSignature) ? ts.createModifier(ts.SyntaxKind.ReadonlyKeyword) : undefined, mappedTypeParameter, indexSignature.questionToken, indexSignature.type);
    const intersectionType = ts.createIntersectionTypeNode([
        ...ts.getAllSuperTypeNodes(container),
        mappedIntersectionType,
        ...(otherMembers.length ? [ts.createTypeLiteralNode(otherMembers)] : ts.emptyArray),
    ]);
    changes.replaceNode(sourceFile, container, createTypeAliasFromInterface(container, intersectionType));
}
