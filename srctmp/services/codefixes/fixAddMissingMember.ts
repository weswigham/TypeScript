import * as ts from "../ts";
/* @internal */
const fixName = "addMissingMember";
/* @internal */
const errorCodes = [
    ts.Diagnostics.Property_0_does_not_exist_on_type_1.code,
    ts.Diagnostics.Property_0_does_not_exist_on_type_1_Did_you_mean_2.code,
    ts.Diagnostics.Property_0_is_missing_in_type_1_but_required_in_type_2.code,
    ts.Diagnostics.Type_0_is_missing_the_following_properties_from_type_1_Colon_2.code,
    ts.Diagnostics.Type_0_is_missing_the_following_properties_from_type_1_Colon_2_and_3_more.code
];
/* @internal */
const fixId = "addMissingMember";
/* @internal */
ts.codefix.registerCodeFix({
    errorCodes,
    getCodeActions(context) {
        const info = getInfo(context.sourceFile, context.span.start, context.program.getTypeChecker(), context.program);
        if (!info)
            return undefined;
        if (info.kind === InfoKind.Enum) {
            const { token, parentDeclaration } = info;
            const changes = ts.textChanges.ChangeTracker.with(context, t => addEnumMemberDeclaration(t, context.program.getTypeChecker(), token, parentDeclaration));
            return [ts.codefix.createCodeFixAction(fixName, changes, [ts.Diagnostics.Add_missing_enum_member_0, token.text], fixId, ts.Diagnostics.Add_all_missing_members)];
        }
        const { parentDeclaration, declSourceFile, inJs, makeStatic, token, call } = info;
        const methodCodeAction = call && getActionForMethodDeclaration(context, declSourceFile, parentDeclaration, token, call, makeStatic, inJs, context.preferences);
        const addMember = inJs && !ts.isInterfaceDeclaration(parentDeclaration) ?
            ts.singleElementArray(getActionsForAddMissingMemberInJavascriptFile(context, declSourceFile, parentDeclaration, token.text, makeStatic)) :
            getActionsForAddMissingMemberInTypeScriptFile(context, declSourceFile, parentDeclaration, token, makeStatic);
        return ts.concatenate(ts.singleElementArray(methodCodeAction), addMember);
    },
    fixIds: [fixId],
    getAllCodeActions: context => {
        const { program, preferences } = context;
        const checker = program.getTypeChecker();
        const seen = ts.createMap<true>();
        const typeDeclToMembers = new ts.NodeMap<ClassOrInterface, ClassOrInterfaceInfo[]>();
        return ts.codefix.createCombinedCodeActions(ts.textChanges.ChangeTracker.with(context, changes => {
            ts.codefix.eachDiagnostic(context, errorCodes, diag => {
                const info = getInfo(diag.file, diag.start, checker, context.program);
                if (!info || !ts.addToSeen(seen, ts.getNodeId(info.parentDeclaration) + "#" + info.token.text)) {
                    return;
                }
                if (info.kind === InfoKind.Enum) {
                    const { token, parentDeclaration } = info;
                    addEnumMemberDeclaration(changes, checker, token, parentDeclaration);
                }
                else {
                    const { parentDeclaration, token } = info;
                    const infos = typeDeclToMembers.getOrUpdate(parentDeclaration, () => []);
                    if (!infos.some(i => i.token.text === token.text))
                        infos.push(info);
                }
            });
            typeDeclToMembers.forEach((infos, classDeclaration) => {
                const supers = getAllSupers(classDeclaration, checker);
                for (const info of infos) {
                    // If some superclass added this property, don't add it again.
                    if (supers.some(superClassOrInterface => {
                        const superInfos = typeDeclToMembers.get(superClassOrInterface);
                        return !!superInfos && superInfos.some(({ token }) => token.text === info.token.text);
                    }))
                        continue;
                    const { parentDeclaration, declSourceFile, inJs, makeStatic, token, call } = info;
                    // Always prefer to add a method declaration if possible.
                    if (call) {
                        addMethodDeclaration(context, changes, declSourceFile, parentDeclaration, token, call, makeStatic, inJs, preferences);
                    }
                    else {
                        if (inJs && !ts.isInterfaceDeclaration(parentDeclaration)) {
                            addMissingMemberInJs(changes, declSourceFile, parentDeclaration, token.text, makeStatic);
                        }
                        else {
                            const typeNode = getTypeNode(program.getTypeChecker(), parentDeclaration, token);
                            addPropertyDeclaration(changes, declSourceFile, parentDeclaration, token.text, typeNode, makeStatic);
                        }
                    }
                }
            });
        }));
    },
});
/* @internal */
function getAllSupers(decl: ClassOrInterface | undefined, checker: ts.TypeChecker): readonly ClassOrInterface[] {
    const res: ts.ClassLikeDeclaration[] = [];
    while (decl) {
        const superElement = ts.getClassExtendsHeritageElement(decl);
        const superSymbol = superElement && checker.getSymbolAtLocation(superElement.expression);
        const superDecl = superSymbol && ts.find(superSymbol.declarations, ts.isClassLike);
        if (superDecl) {
            res.push(superDecl);
        }
        decl = superDecl;
    }
    return res;
}
/* @internal */
type ClassOrInterface = ts.ClassLikeDeclaration | ts.InterfaceDeclaration;
/* @internal */
const enum InfoKind {
    Enum,
    ClassOrInterface
}
/* @internal */
interface EnumInfo {
    readonly kind: InfoKind.Enum;
    readonly token: ts.Identifier;
    readonly parentDeclaration: ts.EnumDeclaration;
}
/* @internal */
interface ClassOrInterfaceInfo {
    readonly kind: InfoKind.ClassOrInterface;
    readonly token: ts.Identifier;
    readonly parentDeclaration: ClassOrInterface;
    readonly makeStatic: boolean;
    readonly declSourceFile: ts.SourceFile;
    readonly inJs: boolean;
    readonly call: ts.CallExpression | undefined;
}
/* @internal */
type Info = EnumInfo | ClassOrInterfaceInfo;
/* @internal */
function getInfo(tokenSourceFile: ts.SourceFile, tokenPos: number, checker: ts.TypeChecker, program: ts.Program): Info | undefined {
    // The identifier of the missing property. eg:
    // this.missing = 1;
    //      ^^^^^^^
    const token = ts.getTokenAtPosition(tokenSourceFile, tokenPos);
    if (!ts.isIdentifier(token)) {
        return undefined;
    }
    const { parent } = token;
    if (!ts.isPropertyAccessExpression(parent))
        return undefined;
    const leftExpressionType = ts.skipConstraint(checker.getTypeAtLocation(parent.expression));
    const { symbol } = leftExpressionType;
    if (!symbol || !symbol.declarations)
        return undefined;
    // Prefer to change the class instead of the interface if they are merged
    const classOrInterface = ts.find(symbol.declarations, ts.isClassLike) || ts.find(symbol.declarations, ts.isInterfaceDeclaration);
    if (classOrInterface && !program.isSourceFileFromExternalLibrary(classOrInterface.getSourceFile())) {
        const makeStatic = ((leftExpressionType as ts.TypeReference).target || leftExpressionType) !== checker.getDeclaredTypeOfSymbol(symbol);
        const declSourceFile = classOrInterface.getSourceFile();
        const inJs = ts.isSourceFileJS(declSourceFile);
        const call = ts.tryCast(parent.parent, ts.isCallExpression);
        return { kind: InfoKind.ClassOrInterface, token, parentDeclaration: classOrInterface, makeStatic, declSourceFile, inJs, call };
    }
    const enumDeclaration = ts.find(symbol.declarations, ts.isEnumDeclaration);
    if (enumDeclaration && !program.isSourceFileFromExternalLibrary(enumDeclaration.getSourceFile())) {
        return { kind: InfoKind.Enum, token, parentDeclaration: enumDeclaration };
    }
    return undefined;
}
/* @internal */
function getActionsForAddMissingMemberInJavascriptFile(context: ts.CodeFixContext, declSourceFile: ts.SourceFile, classDeclaration: ts.ClassLikeDeclaration, tokenName: string, makeStatic: boolean): ts.CodeFixAction | undefined {
    const changes = ts.textChanges.ChangeTracker.with(context, t => addMissingMemberInJs(t, declSourceFile, classDeclaration, tokenName, makeStatic));
    return changes.length === 0 ? undefined
        : ts.codefix.createCodeFixAction(fixName, changes, [makeStatic ? ts.Diagnostics.Initialize_static_property_0 : ts.Diagnostics.Initialize_property_0_in_the_constructor, tokenName], fixId, ts.Diagnostics.Add_all_missing_members);
}
/* @internal */
function addMissingMemberInJs(changeTracker: ts.textChanges.ChangeTracker, declSourceFile: ts.SourceFile, classDeclaration: ts.ClassLikeDeclaration, tokenName: string, makeStatic: boolean): void {
    if (makeStatic) {
        if (classDeclaration.kind === ts.SyntaxKind.ClassExpression) {
            return;
        }
        const className = classDeclaration.name!.getText();
        const staticInitialization = initializePropertyToUndefined(ts.createIdentifier(className), tokenName);
        changeTracker.insertNodeAfter(declSourceFile, classDeclaration, staticInitialization);
    }
    else {
        const classConstructor = ts.getFirstConstructorWithBody(classDeclaration);
        if (!classConstructor) {
            return;
        }
        const propertyInitialization = initializePropertyToUndefined(ts.createThis(), tokenName);
        changeTracker.insertNodeAtConstructorEnd(declSourceFile, classConstructor, propertyInitialization);
    }
}
/* @internal */
function initializePropertyToUndefined(obj: ts.Expression, propertyName: string) {
    return ts.createStatement(ts.createAssignment(ts.createPropertyAccess(obj, propertyName), ts.createIdentifier("undefined")));
}
/* @internal */
function getActionsForAddMissingMemberInTypeScriptFile(context: ts.CodeFixContext, declSourceFile: ts.SourceFile, classDeclaration: ClassOrInterface, token: ts.Identifier, makeStatic: boolean): ts.CodeFixAction[] | undefined {
    const typeNode = getTypeNode(context.program.getTypeChecker(), classDeclaration, token);
    const addProp = createAddPropertyDeclarationAction(context, declSourceFile, classDeclaration, makeStatic, token.text, typeNode);
    return makeStatic ? [addProp] : [addProp, createAddIndexSignatureAction(context, declSourceFile, classDeclaration, token.text, typeNode)];
}
/* @internal */
function getTypeNode(checker: ts.TypeChecker, classDeclaration: ClassOrInterface, token: ts.Node) {
    let typeNode: ts.TypeNode | undefined;
    if (token.parent.parent.kind === ts.SyntaxKind.BinaryExpression) {
        const binaryExpression = (token.parent.parent as ts.BinaryExpression);
        const otherExpression = token.parent === binaryExpression.left ? binaryExpression.right : binaryExpression.left;
        const widenedType = checker.getWidenedType(checker.getBaseTypeOfLiteralType(checker.getTypeAtLocation(otherExpression)));
        typeNode = checker.typeToTypeNode(widenedType, classDeclaration);
    }
    else {
        const contextualType = checker.getContextualType((token.parent as ts.Expression));
        typeNode = contextualType ? checker.typeToTypeNode(contextualType) : undefined;
    }
    return typeNode || ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
}
/* @internal */
function createAddPropertyDeclarationAction(context: ts.CodeFixContext, declSourceFile: ts.SourceFile, classDeclaration: ClassOrInterface, makeStatic: boolean, tokenName: string, typeNode: ts.TypeNode): ts.CodeFixAction {
    const changes = ts.textChanges.ChangeTracker.with(context, t => addPropertyDeclaration(t, declSourceFile, classDeclaration, tokenName, typeNode, makeStatic));
    return ts.codefix.createCodeFixAction(fixName, changes, [makeStatic ? ts.Diagnostics.Declare_static_property_0 : ts.Diagnostics.Declare_property_0, tokenName], fixId, ts.Diagnostics.Add_all_missing_members);
}
/* @internal */
function addPropertyDeclaration(changeTracker: ts.textChanges.ChangeTracker, declSourceFile: ts.SourceFile, classDeclaration: ClassOrInterface, tokenName: string, typeNode: ts.TypeNode, makeStatic: boolean): void {
    const property = ts.createProperty(
    /*decorators*/ undefined, 
    /*modifiers*/ makeStatic ? [ts.createToken(ts.SyntaxKind.StaticKeyword)] : undefined, tokenName, 
    /*questionToken*/ undefined, typeNode, 
    /*initializer*/ undefined);
    const lastProp = getNodeToInsertPropertyAfter(classDeclaration);
    if (lastProp) {
        changeTracker.insertNodeAfter(declSourceFile, lastProp, property);
    }
    else {
        changeTracker.insertNodeAtClassStart(declSourceFile, classDeclaration, property);
    }
}
// Gets the last of the first run of PropertyDeclarations, or undefined if the class does not start with a PropertyDeclaration.
/* @internal */
function getNodeToInsertPropertyAfter(cls: ClassOrInterface): ts.PropertyDeclaration | undefined {
    let res: ts.PropertyDeclaration | undefined;
    for (const member of cls.members) {
        if (!ts.isPropertyDeclaration(member))
            break;
        res = member;
    }
    return res;
}
/* @internal */
function createAddIndexSignatureAction(context: ts.CodeFixContext, declSourceFile: ts.SourceFile, classDeclaration: ClassOrInterface, tokenName: string, typeNode: ts.TypeNode): ts.CodeFixAction {
    // Index signatures cannot have the static modifier.
    const stringTypeNode = ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
    const indexingParameter = ts.createParameter(
    /*decorators*/ undefined, 
    /*modifiers*/ undefined, 
    /*dotDotDotToken*/ undefined, "x", 
    /*questionToken*/ undefined, stringTypeNode, 
    /*initializer*/ undefined);
    const indexSignature = ts.createIndexSignature(
    /*decorators*/ undefined, 
    /*modifiers*/ undefined, [indexingParameter], typeNode);
    const changes = ts.textChanges.ChangeTracker.with(context, t => t.insertNodeAtClassStart(declSourceFile, classDeclaration, indexSignature));
    // No fixId here because code-fix-all currently only works on adding individual named properties.
    return ts.codefix.createCodeFixActionNoFixId(fixName, changes, [ts.Diagnostics.Add_index_signature_for_property_0, tokenName]);
}
/* @internal */
function getActionForMethodDeclaration(context: ts.CodeFixContext, declSourceFile: ts.SourceFile, classDeclaration: ClassOrInterface, token: ts.Identifier, callExpression: ts.CallExpression, makeStatic: boolean, inJs: boolean, preferences: ts.UserPreferences): ts.CodeFixAction | undefined {
    const changes = ts.textChanges.ChangeTracker.with(context, t => addMethodDeclaration(context, t, declSourceFile, classDeclaration, token, callExpression, makeStatic, inJs, preferences));
    return ts.codefix.createCodeFixAction(fixName, changes, [makeStatic ? ts.Diagnostics.Declare_static_method_0 : ts.Diagnostics.Declare_method_0, token.text], fixId, ts.Diagnostics.Add_all_missing_members);
}
/* @internal */
function addMethodDeclaration(context: ts.CodeFixContextBase, changeTracker: ts.textChanges.ChangeTracker, declSourceFile: ts.SourceFile, typeDecl: ClassOrInterface, token: ts.Identifier, callExpression: ts.CallExpression, makeStatic: boolean, inJs: boolean, preferences: ts.UserPreferences): void {
    const methodDeclaration = ts.codefix.createMethodFromCallExpression(context, callExpression, token.text, inJs, makeStatic, preferences, typeDecl);
    const containingMethodDeclaration = ts.getAncestor(callExpression, ts.SyntaxKind.MethodDeclaration);
    if (containingMethodDeclaration && containingMethodDeclaration.parent === typeDecl) {
        changeTracker.insertNodeAfter(declSourceFile, containingMethodDeclaration, methodDeclaration);
    }
    else {
        changeTracker.insertNodeAtClassStart(declSourceFile, typeDecl, methodDeclaration);
    }
}
/* @internal */
function addEnumMemberDeclaration(changes: ts.textChanges.ChangeTracker, checker: ts.TypeChecker, token: ts.Identifier, enumDeclaration: ts.EnumDeclaration) {
    /**
     * create initializer only literal enum that has string initializer.
     * value of initializer is a string literal that equal to name of enum member.
     * numeric enum or empty enum will not create initializer.
     */
    const hasStringInitializer = ts.some(enumDeclaration.members, member => {
        const type = checker.getTypeAtLocation(member);
        return !!(type && type.flags & ts.TypeFlags.StringLike);
    });
    const enumMember = ts.createEnumMember(token, hasStringInitializer ? ts.createStringLiteral(token.text) : undefined);
    changes.replaceNode(enumDeclaration.getSourceFile(), enumDeclaration, ts.updateEnumDeclaration(enumDeclaration, enumDeclaration.decorators, enumDeclaration.modifiers, enumDeclaration.name, ts.concatenate(enumDeclaration.members, ts.singleElementArray(enumMember))));
}
