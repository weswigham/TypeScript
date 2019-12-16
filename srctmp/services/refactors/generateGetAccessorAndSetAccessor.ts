import * as ts from "../ts";
/* @internal */
const actionName = "Generate 'get' and 'set' accessors";
/* @internal */
const actionDescription = ts.Diagnostics.Generate_get_and_set_accessors.message;
/* @internal */
ts.refactor.registerRefactor(actionName, { getEditsForAction, getAvailableActions });
/* @internal */
type AcceptedDeclaration = ts.ParameterPropertyDeclaration | ts.PropertyDeclaration | ts.PropertyAssignment;
/* @internal */
type AcceptedNameType = ts.Identifier | ts.StringLiteral;
/* @internal */
type ContainerDeclaration = ts.ClassLikeDeclaration | ts.ObjectLiteralExpression;
/* @internal */
interface Info {
    readonly container: ContainerDeclaration;
    readonly isStatic: boolean;
    readonly isReadonly: boolean;
    readonly type: ts.TypeNode | undefined;
    readonly declaration: AcceptedDeclaration;
    readonly fieldName: AcceptedNameType;
    readonly accessorName: AcceptedNameType;
    readonly originalName: string;
    readonly renameAccessor: boolean;
}
/* @internal */
function getAvailableActions(context: ts.RefactorContext): readonly ts.ApplicableRefactorInfo[] {
    if (!getConvertibleFieldAtPosition(context))
        return ts.emptyArray;
    return [{
            name: actionName,
            description: actionDescription,
            actions: [
                {
                    name: actionName,
                    description: actionDescription
                }
            ]
        }];
}
/* @internal */
function getEditsForAction(context: ts.RefactorContext, _actionName: string): ts.RefactorEditInfo | undefined {
    const { file } = context;
    const fieldInfo = getConvertibleFieldAtPosition(context);
    if (!fieldInfo)
        return undefined;
    const isJS = ts.isSourceFileJS(file);
    const changeTracker = ts.textChanges.ChangeTracker.fromContext(context);
    const { isStatic, isReadonly, fieldName, accessorName, originalName, type, container, declaration, renameAccessor } = fieldInfo;
    ts.suppressLeadingAndTrailingTrivia(fieldName);
    ts.suppressLeadingAndTrailingTrivia(declaration);
    ts.suppressLeadingAndTrailingTrivia(container);
    const isInClassLike = ts.isClassLike(container);
    // avoid Readonly modifier because it will convert to get accessor
    const modifierFlags = ts.getModifierFlags(declaration) & ~ts.ModifierFlags.Readonly;
    const accessorModifiers = isInClassLike
        ? !modifierFlags || modifierFlags & ts.ModifierFlags.Private
            ? getModifiers(isJS, isStatic, ts.SyntaxKind.PublicKeyword)
            : ts.createNodeArray(ts.createModifiersFromModifierFlags(modifierFlags))
        : undefined;
    const fieldModifiers = isInClassLike ? getModifiers(isJS, isStatic, ts.SyntaxKind.PrivateKeyword) : undefined;
    updateFieldDeclaration(changeTracker, file, declaration, fieldName, fieldModifiers);
    const getAccessor = generateGetAccessor(fieldName, accessorName, type, accessorModifiers, isStatic, container);
    ts.suppressLeadingAndTrailingTrivia(getAccessor);
    insertAccessor(changeTracker, file, getAccessor, declaration, container);
    if (isReadonly) {
        // readonly modifier only existed in classLikeDeclaration
        const constructor = ts.getFirstConstructorWithBody((<ts.ClassLikeDeclaration>container));
        if (constructor) {
            updateReadonlyPropertyInitializerStatementConstructor(changeTracker, file, constructor, fieldName.text, originalName);
        }
    }
    else {
        const setAccessor = generateSetAccessor(fieldName, accessorName, type, accessorModifiers, isStatic, container);
        ts.suppressLeadingAndTrailingTrivia(setAccessor);
        insertAccessor(changeTracker, file, setAccessor, declaration, container);
    }
    const edits = changeTracker.getChanges();
    const renameFilename = file.fileName;
    const nameNeedRename = renameAccessor ? accessorName : fieldName;
    const renameLocationOffset = ts.isIdentifier(nameNeedRename) ? 0 : -1;
    const renameLocation = renameLocationOffset + ts.getRenameLocation(edits, renameFilename, nameNeedRename.text, /*preferLastLocation*/ ts.isParameter(declaration));
    return { renameFilename, renameLocation, edits };
}
/* @internal */
function isConvertibleName(name: ts.DeclarationName): name is AcceptedNameType {
    return ts.isIdentifier(name) || ts.isStringLiteral(name);
}
/* @internal */
function isAcceptedDeclaration(node: ts.Node): node is AcceptedDeclaration {
    return ts.isParameterPropertyDeclaration(node, node.parent) || ts.isPropertyDeclaration(node) || ts.isPropertyAssignment(node);
}
/* @internal */
function createPropertyName(name: string, originalName: AcceptedNameType) {
    return ts.isIdentifier(originalName) ? ts.createIdentifier(name) : ts.createLiteral(name);
}
/* @internal */
function createAccessorAccessExpression(fieldName: AcceptedNameType, isStatic: boolean, container: ContainerDeclaration) {
    const leftHead = isStatic ? (<ts.ClassLikeDeclaration>container).name! : ts.createThis(); // TODO: GH#18217
    return ts.isIdentifier(fieldName) ? ts.createPropertyAccess(leftHead, fieldName) : ts.createElementAccess(leftHead, ts.createLiteral(fieldName));
}
/* @internal */
function getModifiers(isJS: boolean, isStatic: boolean, accessModifier: ts.SyntaxKind.PublicKeyword | ts.SyntaxKind.PrivateKeyword): ts.NodeArray<ts.Modifier> | undefined {
    const modifiers = ts.append<ts.Modifier>(!isJS ? [(ts.createToken(accessModifier) as ts.Token<ts.SyntaxKind.PublicKeyword> | ts.Token<ts.SyntaxKind.PrivateKeyword>)] : undefined, isStatic ? ts.createToken(ts.SyntaxKind.StaticKeyword) : undefined);
    return modifiers && ts.createNodeArray(modifiers);
}
/* @internal */
function startsWithUnderscore(name: string): boolean {
    return name.charCodeAt(0) === ts.CharacterCodes._;
}
/* @internal */
function getConvertibleFieldAtPosition(context: ts.RefactorContext): Info | undefined {
    const { file, startPosition, endPosition } = context;
    const node = ts.getTokenAtPosition(file, startPosition);
    const declaration = ts.findAncestor(node.parent, isAcceptedDeclaration);
    // make sure declaration have AccessibilityModifier or Static Modifier or Readonly Modifier
    const meaning = ts.ModifierFlags.AccessibilityModifier | ts.ModifierFlags.Static | ts.ModifierFlags.Readonly;
    if (!declaration || !ts.nodeOverlapsWithStartEnd(declaration.name, file, startPosition, (endPosition!)) // TODO: GH#18217
        || !isConvertibleName(declaration.name) || (ts.getModifierFlags(declaration) | meaning) !== meaning)
        return undefined;
    const name = declaration.name.text;
    const startWithUnderscore = startsWithUnderscore(name);
    const fieldName = createPropertyName(startWithUnderscore ? name : ts.getUniqueName(`_${name}`, file), declaration.name);
    const accessorName = createPropertyName(startWithUnderscore ? ts.getUniqueName(name.substring(1), file) : name, declaration.name);
    return {
        isStatic: ts.hasStaticModifier(declaration),
        isReadonly: ts.hasReadonlyModifier(declaration),
        type: ts.getTypeAnnotationNode(declaration),
        container: declaration.kind === ts.SyntaxKind.Parameter ? declaration.parent.parent : declaration.parent,
        originalName: (<AcceptedNameType>declaration.name).text,
        declaration,
        fieldName,
        accessorName,
        renameAccessor: startWithUnderscore
    };
}
/* @internal */
function generateGetAccessor(fieldName: AcceptedNameType, accessorName: AcceptedNameType, type: ts.TypeNode | undefined, modifiers: ts.ModifiersArray | undefined, isStatic: boolean, container: ContainerDeclaration) {
    return ts.createGetAccessor(
    /*decorators*/ undefined, modifiers, accessorName, 
    /*parameters*/ (undefined!), // TODO: GH#18217
    type, ts.createBlock([
        ts.createReturn(createAccessorAccessExpression(fieldName, isStatic, container))
    ], /*multiLine*/ true));
}
/* @internal */
function generateSetAccessor(fieldName: AcceptedNameType, accessorName: AcceptedNameType, type: ts.TypeNode | undefined, modifiers: ts.ModifiersArray | undefined, isStatic: boolean, container: ContainerDeclaration) {
    return ts.createSetAccessor(
    /*decorators*/ undefined, modifiers, accessorName, [ts.createParameter(
        /*decorators*/ undefined, 
        /*modifiers*/ undefined, 
        /*dotDotDotToken*/ undefined, ts.createIdentifier("value"), 
        /*questionToken*/ undefined, type)], ts.createBlock([
        ts.createStatement(ts.createAssignment(createAccessorAccessExpression(fieldName, isStatic, container), ts.createIdentifier("value")))
    ], /*multiLine*/ true));
}
/* @internal */
function updatePropertyDeclaration(changeTracker: ts.textChanges.ChangeTracker, file: ts.SourceFile, declaration: ts.PropertyDeclaration, fieldName: AcceptedNameType, modifiers: ts.ModifiersArray | undefined) {
    const property = ts.updateProperty(declaration, declaration.decorators, modifiers, fieldName, declaration.questionToken || declaration.exclamationToken, declaration.type, declaration.initializer);
    changeTracker.replaceNode(file, declaration, property);
}
/* @internal */
function updatePropertyAssignmentDeclaration(changeTracker: ts.textChanges.ChangeTracker, file: ts.SourceFile, declaration: ts.PropertyAssignment, fieldName: AcceptedNameType) {
    const assignment = ts.updatePropertyAssignment(declaration, fieldName, declaration.initializer);
    changeTracker.replacePropertyAssignment(file, declaration, assignment);
}
/* @internal */
function updateFieldDeclaration(changeTracker: ts.textChanges.ChangeTracker, file: ts.SourceFile, declaration: AcceptedDeclaration, fieldName: AcceptedNameType, modifiers: ts.ModifiersArray | undefined) {
    if (ts.isPropertyDeclaration(declaration)) {
        updatePropertyDeclaration(changeTracker, file, declaration, fieldName, modifiers);
    }
    else if (ts.isPropertyAssignment(declaration)) {
        updatePropertyAssignmentDeclaration(changeTracker, file, declaration, fieldName);
    }
    else {
        changeTracker.replaceNode(file, declaration, ts.updateParameter(declaration, declaration.decorators, modifiers, declaration.dotDotDotToken, ts.cast(fieldName, ts.isIdentifier), declaration.questionToken, declaration.type, declaration.initializer));
    }
}
/* @internal */
function insertAccessor(changeTracker: ts.textChanges.ChangeTracker, file: ts.SourceFile, accessor: ts.AccessorDeclaration, declaration: AcceptedDeclaration, container: ContainerDeclaration) {
    ts.isParameterPropertyDeclaration(declaration, declaration.parent) ? changeTracker.insertNodeAtClassStart(file, (<ts.ClassLikeDeclaration>container), accessor) :
        ts.isPropertyAssignment(declaration) ? changeTracker.insertNodeAfterComma(file, declaration, accessor) :
            changeTracker.insertNodeAfter(file, declaration, accessor);
}
/* @internal */
function updateReadonlyPropertyInitializerStatementConstructor(changeTracker: ts.textChanges.ChangeTracker, file: ts.SourceFile, constructor: ts.ConstructorDeclaration, fieldName: string, originalName: string) {
    if (!constructor.body)
        return;
    constructor.body.forEachChild(function recur(node) {
        if (ts.isElementAccessExpression(node) &&
            node.expression.kind === ts.SyntaxKind.ThisKeyword &&
            ts.isStringLiteral(node.argumentExpression) &&
            node.argumentExpression.text === originalName &&
            ts.isWriteAccess(node)) {
            changeTracker.replaceNode(file, node.argumentExpression, ts.createStringLiteral(fieldName));
        }
        if (ts.isPropertyAccessExpression(node) && node.expression.kind === ts.SyntaxKind.ThisKeyword && node.name.text === originalName && ts.isWriteAccess(node)) {
            changeTracker.replaceNode(file, node.name, ts.createIdentifier(fieldName));
        }
        if (!ts.isFunctionLike(node) && !ts.isClassLike(node)) {
            node.forEachChild(recur);
        }
    });
}
