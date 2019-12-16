import * as ts from "./ts";
/* @internal */
declare global {
    /* @internal */ // Don't expose that we use this
    // Based on lib.es6.d.ts
    interface PromiseConstructor {
        new <T>(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void): Promise<T>;
        reject(reason: any): Promise<never>;
        all<T>(values: (T | PromiseLike<T>)[]): Promise<T[]>;
    }
}
/* @internal */
declare global {
    /* @internal */
    var Promise: PromiseConstructor; // eslint-disable-line no-var
}
/* @internal */
// These utilities are common to multiple language service features.
//#region
export const scanner: ts.Scanner = ts.createScanner(ts.ScriptTarget.Latest, /*skipTrivia*/ true);
/* @internal */
export const enum SemanticMeaning {
    None = 0x0,
    Value = 0x1,
    Type = 0x2,
    Namespace = 0x4,
    All = Value | Type | Namespace
}
/* @internal */
export function getMeaningFromDeclaration(node: ts.Node): SemanticMeaning {
    switch (node.kind) {
        case ts.SyntaxKind.VariableDeclaration:
            return ts.isInJSFile(node) && ts.getJSDocEnumTag(node) ? SemanticMeaning.All : SemanticMeaning.Value;
        case ts.SyntaxKind.Parameter:
        case ts.SyntaxKind.BindingElement:
        case ts.SyntaxKind.PropertyDeclaration:
        case ts.SyntaxKind.PropertySignature:
        case ts.SyntaxKind.PropertyAssignment:
        case ts.SyntaxKind.ShorthandPropertyAssignment:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.MethodSignature:
        case ts.SyntaxKind.Constructor:
        case ts.SyntaxKind.GetAccessor:
        case ts.SyntaxKind.SetAccessor:
        case ts.SyntaxKind.FunctionDeclaration:
        case ts.SyntaxKind.FunctionExpression:
        case ts.SyntaxKind.ArrowFunction:
        case ts.SyntaxKind.CatchClause:
        case ts.SyntaxKind.JsxAttribute:
            return SemanticMeaning.Value;
        case ts.SyntaxKind.TypeParameter:
        case ts.SyntaxKind.InterfaceDeclaration:
        case ts.SyntaxKind.TypeAliasDeclaration:
        case ts.SyntaxKind.TypeLiteral:
            return SemanticMeaning.Type;
        case ts.SyntaxKind.JSDocTypedefTag:
            // If it has no name node, it shares the name with the value declaration below it.
            return (node as ts.JSDocTypedefTag).name === undefined ? SemanticMeaning.Value | SemanticMeaning.Type : SemanticMeaning.Type;
        case ts.SyntaxKind.EnumMember:
        case ts.SyntaxKind.ClassDeclaration:
            return SemanticMeaning.Value | SemanticMeaning.Type;
        case ts.SyntaxKind.ModuleDeclaration:
            if (ts.isAmbientModule((<ts.ModuleDeclaration>node))) {
                return SemanticMeaning.Namespace | SemanticMeaning.Value;
            }
            else if (ts.getModuleInstanceState((node as ts.ModuleDeclaration)) === ts.ModuleInstanceState.Instantiated) {
                return SemanticMeaning.Namespace | SemanticMeaning.Value;
            }
            else {
                return SemanticMeaning.Namespace;
            }
        case ts.SyntaxKind.EnumDeclaration:
        case ts.SyntaxKind.NamedImports:
        case ts.SyntaxKind.ImportSpecifier:
        case ts.SyntaxKind.ImportEqualsDeclaration:
        case ts.SyntaxKind.ImportDeclaration:
        case ts.SyntaxKind.ExportAssignment:
        case ts.SyntaxKind.ExportDeclaration:
            return SemanticMeaning.All;
        // An external module can be a Value
        case ts.SyntaxKind.SourceFile:
            return SemanticMeaning.Namespace | SemanticMeaning.Value;
    }
    return SemanticMeaning.All;
}
/* @internal */
export function getMeaningFromLocation(node: ts.Node): SemanticMeaning {
    if (node.kind === ts.SyntaxKind.SourceFile) {
        return SemanticMeaning.Value;
    }
    else if (node.parent.kind === ts.SyntaxKind.ExportAssignment || node.parent.kind === ts.SyntaxKind.ExternalModuleReference) {
        return SemanticMeaning.All;
    }
    else if (isInRightSideOfInternalImportEqualsDeclaration(node)) {
        return getMeaningFromRightHandSideOfImportEquals((node as ts.Identifier));
    }
    else if (ts.isDeclarationName(node)) {
        return getMeaningFromDeclaration(node.parent);
    }
    else if (isTypeReference(node)) {
        return SemanticMeaning.Type;
    }
    else if (isNamespaceReference(node)) {
        return SemanticMeaning.Namespace;
    }
    else if (ts.isTypeParameterDeclaration(node.parent)) {
        ts.Debug.assert(ts.isJSDocTemplateTag(node.parent.parent)); // Else would be handled by isDeclarationName
        return SemanticMeaning.Type;
    }
    else if (ts.isLiteralTypeNode(node.parent)) {
        // This might be T["name"], which is actually referencing a property and not a type. So allow both meanings.
        return SemanticMeaning.Type | SemanticMeaning.Value;
    }
    else {
        return SemanticMeaning.Value;
    }
}
/* @internal */
function getMeaningFromRightHandSideOfImportEquals(node: ts.Node): SemanticMeaning {
    //     import a = |b|; // Namespace
    //     import a = |b.c|; // Value, type, namespace
    //     import a = |b.c|.d; // Namespace
    const name = node.kind === ts.SyntaxKind.QualifiedName ? node : ts.isQualifiedName(node.parent) && node.parent.right === node ? node.parent : undefined;
    return name && name.parent.kind === ts.SyntaxKind.ImportEqualsDeclaration ? SemanticMeaning.All : SemanticMeaning.Namespace;
}
/* @internal */
export function isInRightSideOfInternalImportEqualsDeclaration(node: ts.Node) {
    while (node.parent.kind === ts.SyntaxKind.QualifiedName) {
        node = node.parent;
    }
    return ts.isInternalModuleImportEqualsDeclaration(node.parent) && node.parent.moduleReference === node;
}
/* @internal */
function isNamespaceReference(node: ts.Node): boolean {
    return isQualifiedNameNamespaceReference(node) || isPropertyAccessNamespaceReference(node);
}
/* @internal */
function isQualifiedNameNamespaceReference(node: ts.Node): boolean {
    let root = node;
    let isLastClause = true;
    if (root.parent.kind === ts.SyntaxKind.QualifiedName) {
        while (root.parent && root.parent.kind === ts.SyntaxKind.QualifiedName) {
            root = root.parent;
        }
        isLastClause = (<ts.QualifiedName>root).right === node;
    }
    return root.parent.kind === ts.SyntaxKind.TypeReference && !isLastClause;
}
/* @internal */
function isPropertyAccessNamespaceReference(node: ts.Node): boolean {
    let root = node;
    let isLastClause = true;
    if (root.parent.kind === ts.SyntaxKind.PropertyAccessExpression) {
        while (root.parent && root.parent.kind === ts.SyntaxKind.PropertyAccessExpression) {
            root = root.parent;
        }
        isLastClause = (<ts.PropertyAccessExpression>root).name === node;
    }
    if (!isLastClause && root.parent.kind === ts.SyntaxKind.ExpressionWithTypeArguments && root.parent.parent.kind === ts.SyntaxKind.HeritageClause) {
        const decl = root.parent.parent.parent;
        return (decl.kind === ts.SyntaxKind.ClassDeclaration && (<ts.HeritageClause>root.parent.parent).token === ts.SyntaxKind.ImplementsKeyword) ||
            (decl.kind === ts.SyntaxKind.InterfaceDeclaration && (<ts.HeritageClause>root.parent.parent).token === ts.SyntaxKind.ExtendsKeyword);
    }
    return false;
}
/* @internal */
function isTypeReference(node: ts.Node): boolean {
    if (ts.isRightSideOfQualifiedNameOrPropertyAccess(node)) {
        node = node.parent;
    }
    switch (node.kind) {
        case ts.SyntaxKind.ThisKeyword:
            return !ts.isExpressionNode(node);
        case ts.SyntaxKind.ThisType:
            return true;
    }
    switch (node.parent.kind) {
        case ts.SyntaxKind.TypeReference:
            return true;
        case ts.SyntaxKind.ImportType:
            return !(node.parent as ts.ImportTypeNode).isTypeOf;
        case ts.SyntaxKind.ExpressionWithTypeArguments:
            return !ts.isExpressionWithTypeArgumentsInClassExtendsClause((<ts.ExpressionWithTypeArguments>node.parent));
    }
    return false;
}
/* @internal */
export function isCallExpressionTarget(node: ts.Node): boolean {
    return isCallOrNewExpressionTargetWorker(node, ts.isCallExpression);
}
/* @internal */
export function isNewExpressionTarget(node: ts.Node): boolean {
    return isCallOrNewExpressionTargetWorker(node, ts.isNewExpression);
}
/* @internal */
export function isCallOrNewExpressionTarget(node: ts.Node): boolean {
    return isCallOrNewExpressionTargetWorker(node, ts.isCallOrNewExpression);
}
/* @internal */
function isCallOrNewExpressionTargetWorker<T extends ts.CallExpression | ts.NewExpression>(node: ts.Node, pred: (node: ts.Node) => node is T): boolean {
    const target = climbPastPropertyAccess(node);
    return !!target && !!target.parent && pred(target.parent) && target.parent.expression === target;
}
/* @internal */
export function climbPastPropertyAccess(node: ts.Node) {
    return isRightSideOfPropertyAccess(node) ? node.parent : node;
}
/* @internal */
export function getTargetLabel(referenceNode: ts.Node, labelName: string): ts.Identifier | undefined {
    while (referenceNode) {
        if (referenceNode.kind === ts.SyntaxKind.LabeledStatement && (<ts.LabeledStatement>referenceNode).label.escapedText === labelName) {
            return (<ts.LabeledStatement>referenceNode).label;
        }
        referenceNode = referenceNode.parent;
    }
    return undefined;
}
/* @internal */
export function hasPropertyAccessExpressionWithName(node: ts.CallExpression, funcName: string): boolean {
    if (!ts.isPropertyAccessExpression(node.expression)) {
        return false;
    }
    return node.expression.name.text === funcName;
}
/* @internal */
export function isJumpStatementTarget(node: ts.Node): node is ts.Identifier & {
    parent: ts.BreakOrContinueStatement;
} {
    return node.kind === ts.SyntaxKind.Identifier && ts.isBreakOrContinueStatement(node.parent) && node.parent.label === node;
}
/* @internal */
export function isLabelOfLabeledStatement(node: ts.Node): node is ts.Identifier {
    return node.kind === ts.SyntaxKind.Identifier && ts.isLabeledStatement(node.parent) && node.parent.label === node;
}
/* @internal */
export function isLabelName(node: ts.Node): boolean {
    return isLabelOfLabeledStatement(node) || isJumpStatementTarget(node);
}
/* @internal */
export function isTagName(node: ts.Node): boolean {
    return ts.isJSDocTag(node.parent) && node.parent.tagName === node;
}
/* @internal */
export function isRightSideOfQualifiedName(node: ts.Node) {
    return node.parent.kind === ts.SyntaxKind.QualifiedName && (<ts.QualifiedName>node.parent).right === node;
}
/* @internal */
export function isRightSideOfPropertyAccess(node: ts.Node) {
    return node && node.parent && node.parent.kind === ts.SyntaxKind.PropertyAccessExpression && (<ts.PropertyAccessExpression>node.parent).name === node;
}
/* @internal */
export function isNameOfModuleDeclaration(node: ts.Node) {
    return node.parent.kind === ts.SyntaxKind.ModuleDeclaration && (<ts.ModuleDeclaration>node.parent).name === node;
}
/* @internal */
export function isNameOfFunctionDeclaration(node: ts.Node): boolean {
    return node.kind === ts.SyntaxKind.Identifier &&
        ts.isFunctionLike(node.parent) && (<ts.FunctionLikeDeclaration>node.parent).name === node;
}
/* @internal */
export function isLiteralNameOfPropertyDeclarationOrIndexAccess(node: ts.StringLiteral | ts.NumericLiteral | ts.NoSubstitutionTemplateLiteral): boolean {
    switch (node.parent.kind) {
        case ts.SyntaxKind.PropertyDeclaration:
        case ts.SyntaxKind.PropertySignature:
        case ts.SyntaxKind.PropertyAssignment:
        case ts.SyntaxKind.EnumMember:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.MethodSignature:
        case ts.SyntaxKind.GetAccessor:
        case ts.SyntaxKind.SetAccessor:
        case ts.SyntaxKind.ModuleDeclaration:
            return ts.getNameOfDeclaration((<ts.Declaration>node.parent)) === node;
        case ts.SyntaxKind.ElementAccessExpression:
            return (<ts.ElementAccessExpression>node.parent).argumentExpression === node;
        case ts.SyntaxKind.ComputedPropertyName:
            return true;
        case ts.SyntaxKind.LiteralType:
            return node.parent.parent.kind === ts.SyntaxKind.IndexedAccessType;
        default:
            return false;
    }
}
/* @internal */
export function isExpressionOfExternalModuleImportEqualsDeclaration(node: ts.Node) {
    return ts.isExternalModuleImportEqualsDeclaration(node.parent.parent) &&
        ts.getExternalModuleImportEqualsDeclarationExpression(node.parent.parent) === node;
}
/* @internal */
export function getContainerNode(node: ts.Node): ts.Declaration | undefined {
    if (ts.isJSDocTypeAlias(node)) {
        // This doesn't just apply to the node immediately under the comment, but to everything in its parent's scope.
        // node.parent = the JSDoc comment, node.parent.parent = the node having the comment.
        // Then we get parent again in the loop.
        node = node.parent.parent;
    }
    while (true) {
        node = node.parent;
        if (!node) {
            return undefined;
        }
        switch (node.kind) {
            case ts.SyntaxKind.SourceFile:
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.MethodSignature:
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
            case ts.SyntaxKind.ClassDeclaration:
            case ts.SyntaxKind.InterfaceDeclaration:
            case ts.SyntaxKind.EnumDeclaration:
            case ts.SyntaxKind.ModuleDeclaration:
                return <ts.Declaration>node;
        }
    }
}
/* @internal */
export function getNodeKind(node: ts.Node): ts.ScriptElementKind {
    switch (node.kind) {
        case ts.SyntaxKind.SourceFile:
            return ts.isExternalModule((<ts.SourceFile>node)) ? ts.ScriptElementKind.moduleElement : ts.ScriptElementKind.scriptElement;
        case ts.SyntaxKind.ModuleDeclaration:
            return ts.ScriptElementKind.moduleElement;
        case ts.SyntaxKind.ClassDeclaration:
        case ts.SyntaxKind.ClassExpression:
            return ts.ScriptElementKind.classElement;
        case ts.SyntaxKind.InterfaceDeclaration: return ts.ScriptElementKind.interfaceElement;
        case ts.SyntaxKind.TypeAliasDeclaration:
        case ts.SyntaxKind.JSDocCallbackTag:
        case ts.SyntaxKind.JSDocTypedefTag:
            return ts.ScriptElementKind.typeElement;
        case ts.SyntaxKind.EnumDeclaration: return ts.ScriptElementKind.enumElement;
        case ts.SyntaxKind.VariableDeclaration:
            return getKindOfVariableDeclaration((<ts.VariableDeclaration>node));
        case ts.SyntaxKind.BindingElement:
            return getKindOfVariableDeclaration((<ts.VariableDeclaration>ts.getRootDeclaration(node)));
        case ts.SyntaxKind.ArrowFunction:
        case ts.SyntaxKind.FunctionDeclaration:
        case ts.SyntaxKind.FunctionExpression:
            return ts.ScriptElementKind.functionElement;
        case ts.SyntaxKind.GetAccessor: return ts.ScriptElementKind.memberGetAccessorElement;
        case ts.SyntaxKind.SetAccessor: return ts.ScriptElementKind.memberSetAccessorElement;
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.MethodSignature:
            return ts.ScriptElementKind.memberFunctionElement;
        case ts.SyntaxKind.PropertyAssignment:
            const { initializer } = (node as ts.PropertyAssignment);
            return ts.isFunctionLike(initializer) ? ts.ScriptElementKind.memberFunctionElement : ts.ScriptElementKind.memberVariableElement;
        case ts.SyntaxKind.PropertyDeclaration:
        case ts.SyntaxKind.PropertySignature:
        case ts.SyntaxKind.ShorthandPropertyAssignment:
        case ts.SyntaxKind.SpreadAssignment:
            return ts.ScriptElementKind.memberVariableElement;
        case ts.SyntaxKind.IndexSignature: return ts.ScriptElementKind.indexSignatureElement;
        case ts.SyntaxKind.ConstructSignature: return ts.ScriptElementKind.constructSignatureElement;
        case ts.SyntaxKind.CallSignature: return ts.ScriptElementKind.callSignatureElement;
        case ts.SyntaxKind.Constructor: return ts.ScriptElementKind.constructorImplementationElement;
        case ts.SyntaxKind.TypeParameter: return ts.ScriptElementKind.typeParameterElement;
        case ts.SyntaxKind.EnumMember: return ts.ScriptElementKind.enumMemberElement;
        case ts.SyntaxKind.Parameter: return ts.hasModifier(node, ts.ModifierFlags.ParameterPropertyModifier) ? ts.ScriptElementKind.memberVariableElement : ts.ScriptElementKind.parameterElement;
        case ts.SyntaxKind.ImportEqualsDeclaration:
        case ts.SyntaxKind.ImportSpecifier:
        case ts.SyntaxKind.ExportSpecifier:
        case ts.SyntaxKind.NamespaceImport:
            return ts.ScriptElementKind.alias;
        case ts.SyntaxKind.BinaryExpression:
            const kind = ts.getAssignmentDeclarationKind((node as ts.BinaryExpression));
            const { right } = (node as ts.BinaryExpression);
            switch (kind) {
                case ts.AssignmentDeclarationKind.ObjectDefinePropertyValue:
                case ts.AssignmentDeclarationKind.ObjectDefinePropertyExports:
                case ts.AssignmentDeclarationKind.ObjectDefinePrototypeProperty:
                case ts.AssignmentDeclarationKind.None:
                    return ts.ScriptElementKind.unknown;
                case ts.AssignmentDeclarationKind.ExportsProperty:
                case ts.AssignmentDeclarationKind.ModuleExports:
                    const rightKind = getNodeKind(right);
                    return rightKind === ts.ScriptElementKind.unknown ? ts.ScriptElementKind.constElement : rightKind;
                case ts.AssignmentDeclarationKind.PrototypeProperty:
                    return ts.isFunctionExpression(right) ? ts.ScriptElementKind.memberFunctionElement : ts.ScriptElementKind.memberVariableElement;
                case ts.AssignmentDeclarationKind.ThisProperty:
                    return ts.ScriptElementKind.memberVariableElement; // property
                case ts.AssignmentDeclarationKind.Property:
                    // static method / property
                    return ts.isFunctionExpression(right) ? ts.ScriptElementKind.memberFunctionElement : ts.ScriptElementKind.memberVariableElement;
                case ts.AssignmentDeclarationKind.Prototype:
                    return ts.ScriptElementKind.localClassElement;
                default: {
                    ts.assertType<never>(kind);
                    return ts.ScriptElementKind.unknown;
                }
            }
        case ts.SyntaxKind.Identifier:
            return ts.isImportClause(node.parent) ? ts.ScriptElementKind.alias : ts.ScriptElementKind.unknown;
        default:
            return ts.ScriptElementKind.unknown;
    }
    function getKindOfVariableDeclaration(v: ts.VariableDeclaration): ts.ScriptElementKind {
        return ts.isVarConst(v)
            ? ts.ScriptElementKind.constElement
            : ts.isLet(v)
                ? ts.ScriptElementKind.letElement
                : ts.ScriptElementKind.variableElement;
    }
}
/* @internal */
export function isThis(node: ts.Node): boolean {
    switch (node.kind) {
        case ts.SyntaxKind.ThisKeyword:
            // case SyntaxKind.ThisType: TODO: GH#9267
            return true;
        case ts.SyntaxKind.Identifier:
            // 'this' as a parameter
            return ts.identifierIsThisKeyword((node as ts.Identifier)) && node.parent.kind === ts.SyntaxKind.Parameter;
        default:
            return false;
    }
}
// Matches the beginning of a triple slash directive
/* @internal */
const tripleSlashDirectivePrefixRegex = /^\/\/\/\s*</;
/* @internal */
export interface ListItemInfo {
    listItemIndex: number;
    list: ts.Node;
}
/* @internal */
export function getLineStartPositionForPosition(position: number, sourceFile: ts.SourceFileLike): number {
    const lineStarts = ts.getLineStarts(sourceFile);
    const line = sourceFile.getLineAndCharacterOfPosition(position).line;
    return lineStarts[line];
}
/* @internal */
export function rangeContainsRange(r1: ts.TextRange, r2: ts.TextRange): boolean {
    return startEndContainsRange(r1.pos, r1.end, r2);
}
/* @internal */
export function rangeContainsRangeExclusive(r1: ts.TextRange, r2: ts.TextRange): boolean {
    return rangeContainsPositionExclusive(r1, r2.pos) && rangeContainsPositionExclusive(r1, r2.end);
}
/* @internal */
export function rangeContainsPosition(r: ts.TextRange, pos: number): boolean {
    return r.pos <= pos && pos <= r.end;
}
/* @internal */
export function rangeContainsPositionExclusive(r: ts.TextRange, pos: number) {
    return r.pos < pos && pos < r.end;
}
/* @internal */
export function startEndContainsRange(start: number, end: number, range: ts.TextRange): boolean {
    return start <= range.pos && end >= range.end;
}
/* @internal */
export function rangeContainsStartEnd(range: ts.TextRange, start: number, end: number): boolean {
    return range.pos <= start && range.end >= end;
}
/* @internal */
export function rangeOverlapsWithStartEnd(r1: ts.TextRange, start: number, end: number) {
    return startEndOverlapsWithStartEnd(r1.pos, r1.end, start, end);
}
/* @internal */
export function nodeOverlapsWithStartEnd(node: ts.Node, sourceFile: ts.SourceFile, start: number, end: number) {
    return startEndOverlapsWithStartEnd(node.getStart(sourceFile), node.end, start, end);
}
/* @internal */
export function startEndOverlapsWithStartEnd(start1: number, end1: number, start2: number, end2: number) {
    const start = Math.max(start1, start2);
    const end = Math.min(end1, end2);
    return start < end;
}
/**
 * Assumes `candidate.start <= position` holds.
 */
/* @internal */
export function positionBelongsToNode(candidate: ts.Node, position: number, sourceFile: ts.SourceFile): boolean {
    ts.Debug.assert(candidate.pos <= position);
    return position < candidate.end || !isCompletedNode(candidate, sourceFile);
}
/* @internal */
function isCompletedNode(n: ts.Node | undefined, sourceFile: ts.SourceFile): boolean {
    if (n === undefined || ts.nodeIsMissing(n)) {
        return false;
    }
    switch (n.kind) {
        case ts.SyntaxKind.ClassDeclaration:
        case ts.SyntaxKind.InterfaceDeclaration:
        case ts.SyntaxKind.EnumDeclaration:
        case ts.SyntaxKind.ObjectLiteralExpression:
        case ts.SyntaxKind.ObjectBindingPattern:
        case ts.SyntaxKind.TypeLiteral:
        case ts.SyntaxKind.Block:
        case ts.SyntaxKind.ModuleBlock:
        case ts.SyntaxKind.CaseBlock:
        case ts.SyntaxKind.NamedImports:
        case ts.SyntaxKind.NamedExports:
            return nodeEndsWith(n, ts.SyntaxKind.CloseBraceToken, sourceFile);
        case ts.SyntaxKind.CatchClause:
            return isCompletedNode((<ts.CatchClause>n).block, sourceFile);
        case ts.SyntaxKind.NewExpression:
            if (!(<ts.NewExpression>n).arguments) {
                return true;
            }
        // falls through
        case ts.SyntaxKind.CallExpression:
        case ts.SyntaxKind.ParenthesizedExpression:
        case ts.SyntaxKind.ParenthesizedType:
            return nodeEndsWith(n, ts.SyntaxKind.CloseParenToken, sourceFile);
        case ts.SyntaxKind.FunctionType:
        case ts.SyntaxKind.ConstructorType:
            return isCompletedNode((<ts.SignatureDeclaration>n).type, sourceFile);
        case ts.SyntaxKind.Constructor:
        case ts.SyntaxKind.GetAccessor:
        case ts.SyntaxKind.SetAccessor:
        case ts.SyntaxKind.FunctionDeclaration:
        case ts.SyntaxKind.FunctionExpression:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.MethodSignature:
        case ts.SyntaxKind.ConstructSignature:
        case ts.SyntaxKind.CallSignature:
        case ts.SyntaxKind.ArrowFunction:
            if ((<ts.FunctionLikeDeclaration>n).body) {
                return isCompletedNode((<ts.FunctionLikeDeclaration>n).body, sourceFile);
            }
            if ((<ts.FunctionLikeDeclaration>n).type) {
                return isCompletedNode((<ts.FunctionLikeDeclaration>n).type, sourceFile);
            }
            // Even though type parameters can be unclosed, we can get away with
            // having at least a closing paren.
            return hasChildOfKind(n, ts.SyntaxKind.CloseParenToken, sourceFile);
        case ts.SyntaxKind.ModuleDeclaration:
            return !!(<ts.ModuleDeclaration>n).body && isCompletedNode((<ts.ModuleDeclaration>n).body, sourceFile);
        case ts.SyntaxKind.IfStatement:
            if ((<ts.IfStatement>n).elseStatement) {
                return isCompletedNode((<ts.IfStatement>n).elseStatement, sourceFile);
            }
            return isCompletedNode((<ts.IfStatement>n).thenStatement, sourceFile);
        case ts.SyntaxKind.ExpressionStatement:
            return isCompletedNode((<ts.ExpressionStatement>n).expression, sourceFile) ||
                hasChildOfKind(n, ts.SyntaxKind.SemicolonToken, sourceFile);
        case ts.SyntaxKind.ArrayLiteralExpression:
        case ts.SyntaxKind.ArrayBindingPattern:
        case ts.SyntaxKind.ElementAccessExpression:
        case ts.SyntaxKind.ComputedPropertyName:
        case ts.SyntaxKind.TupleType:
            return nodeEndsWith(n, ts.SyntaxKind.CloseBracketToken, sourceFile);
        case ts.SyntaxKind.IndexSignature:
            if ((<ts.IndexSignatureDeclaration>n).type) {
                return isCompletedNode((<ts.IndexSignatureDeclaration>n).type, sourceFile);
            }
            return hasChildOfKind(n, ts.SyntaxKind.CloseBracketToken, sourceFile);
        case ts.SyntaxKind.CaseClause:
        case ts.SyntaxKind.DefaultClause:
            // there is no such thing as terminator token for CaseClause/DefaultClause so for simplicity always consider them non-completed
            return false;
        case ts.SyntaxKind.ForStatement:
        case ts.SyntaxKind.ForInStatement:
        case ts.SyntaxKind.ForOfStatement:
        case ts.SyntaxKind.WhileStatement:
            return isCompletedNode((<ts.IterationStatement>n).statement, sourceFile);
        case ts.SyntaxKind.DoStatement:
            // rough approximation: if DoStatement has While keyword - then if node is completed is checking the presence of ')';
            return hasChildOfKind(n, ts.SyntaxKind.WhileKeyword, sourceFile)
                ? nodeEndsWith(n, ts.SyntaxKind.CloseParenToken, sourceFile)
                : isCompletedNode((<ts.DoStatement>n).statement, sourceFile);
        case ts.SyntaxKind.TypeQuery:
            return isCompletedNode((<ts.TypeQueryNode>n).exprName, sourceFile);
        case ts.SyntaxKind.TypeOfExpression:
        case ts.SyntaxKind.DeleteExpression:
        case ts.SyntaxKind.VoidExpression:
        case ts.SyntaxKind.YieldExpression:
        case ts.SyntaxKind.SpreadElement:
            const unaryWordExpression = (n as (ts.TypeOfExpression | ts.DeleteExpression | ts.VoidExpression | ts.YieldExpression | ts.SpreadElement));
            return isCompletedNode(unaryWordExpression.expression, sourceFile);
        case ts.SyntaxKind.TaggedTemplateExpression:
            return isCompletedNode((<ts.TaggedTemplateExpression>n).template, sourceFile);
        case ts.SyntaxKind.TemplateExpression:
            const lastSpan = ts.lastOrUndefined((<ts.TemplateExpression>n).templateSpans);
            return isCompletedNode(lastSpan, sourceFile);
        case ts.SyntaxKind.TemplateSpan:
            return ts.nodeIsPresent((<ts.TemplateSpan>n).literal);
        case ts.SyntaxKind.ExportDeclaration:
        case ts.SyntaxKind.ImportDeclaration:
            return ts.nodeIsPresent((<ts.ExportDeclaration | ts.ImportDeclaration>n).moduleSpecifier);
        case ts.SyntaxKind.PrefixUnaryExpression:
            return isCompletedNode((<ts.PrefixUnaryExpression>n).operand, sourceFile);
        case ts.SyntaxKind.BinaryExpression:
            return isCompletedNode((<ts.BinaryExpression>n).right, sourceFile);
        case ts.SyntaxKind.ConditionalExpression:
            return isCompletedNode((<ts.ConditionalExpression>n).whenFalse, sourceFile);
        default:
            return true;
    }
}
/*
 * Checks if node ends with 'expectedLastToken'.
 * If child at position 'length - 1' is 'SemicolonToken' it is skipped and 'expectedLastToken' is compared with child at position 'length - 2'.
 */
/* @internal */
function nodeEndsWith(n: ts.Node, expectedLastToken: ts.SyntaxKind, sourceFile: ts.SourceFile): boolean {
    const children = n.getChildren(sourceFile);
    if (children.length) {
        const lastChild = ts.last(children);
        if (lastChild.kind === expectedLastToken) {
            return true;
        }
        else if (lastChild.kind === ts.SyntaxKind.SemicolonToken && children.length !== 1) {
            return children[children.length - 2].kind === expectedLastToken;
        }
    }
    return false;
}
/* @internal */
export function findListItemInfo(node: ts.Node): ListItemInfo | undefined {
    const list = findContainingList(node);
    // It is possible at this point for syntaxList to be undefined, either if
    // node.parent had no list child, or if none of its list children contained
    // the span of node. If this happens, return undefined. The caller should
    // handle this case.
    if (!list) {
        return undefined;
    }
    const children = list.getChildren();
    const listItemIndex = ts.indexOfNode(children, node);
    return {
        listItemIndex,
        list
    };
}
/* @internal */
export function hasChildOfKind(n: ts.Node, kind: ts.SyntaxKind, sourceFile: ts.SourceFile): boolean {
    return !!findChildOfKind(n, kind, sourceFile);
}
/* @internal */
export function findChildOfKind<T extends ts.Node>(n: ts.Node, kind: T["kind"], sourceFile: ts.SourceFileLike): T | undefined {
    return ts.find(n.getChildren(sourceFile), (c): c is T => c.kind === kind);
}
/* @internal */
export function findContainingList(node: ts.Node): ts.SyntaxList | undefined {
    // The node might be a list element (nonsynthetic) or a comma (synthetic). Either way, it will
    // be parented by the container of the SyntaxList, not the SyntaxList itself.
    // In order to find the list item index, we first need to locate SyntaxList itself and then search
    // for the position of the relevant node (or comma).
    const syntaxList = ts.find(node.parent.getChildren(), (c): c is ts.SyntaxList => ts.isSyntaxList(c) && rangeContainsRange(c, node));
    // Either we didn't find an appropriate list, or the list must contain us.
    ts.Debug.assert(!syntaxList || ts.contains(syntaxList.getChildren(), node));
    return syntaxList;
}
/**
 * Gets the token whose text has range [start, end) and
 * position >= start and (position < end or (position === end && token is literal or keyword or identifier))
 */
/* @internal */
export function getTouchingPropertyName(sourceFile: ts.SourceFile, position: number): ts.Node {
    return getTouchingToken(sourceFile, position, n => ts.isPropertyNameLiteral(n) || ts.isKeyword(n.kind));
}
/**
 * Returns the token if position is in [start, end).
 * If position === end, returns the preceding token if includeItemAtEndPosition(previousToken) === true
 */
/* @internal */
export function getTouchingToken(sourceFile: ts.SourceFile, position: number, includePrecedingTokenAtEndPosition?: (n: ts.Node) => boolean): ts.Node {
    return getTokenAtPositionWorker(sourceFile, position, /*allowPositionInLeadingTrivia*/ false, includePrecedingTokenAtEndPosition, /*includeEndPosition*/ false);
}
/** Returns a token if position is in [start-of-leading-trivia, end) */
/* @internal */
export function getTokenAtPosition(sourceFile: ts.SourceFile, position: number): ts.Node {
    return getTokenAtPositionWorker(sourceFile, position, /*allowPositionInLeadingTrivia*/ true, /*includePrecedingTokenAtEndPosition*/ undefined, /*includeEndPosition*/ false);
}
/** Get the token whose text contains the position */
/* @internal */
function getTokenAtPositionWorker(sourceFile: ts.SourceFile, position: number, allowPositionInLeadingTrivia: boolean, includePrecedingTokenAtEndPosition: ((n: ts.Node) => boolean) | undefined, includeEndPosition: boolean): ts.Node {
    let current: ts.Node = sourceFile;
    outer: while (true) {
        // find the child that contains 'position'
        for (const child of current.getChildren(sourceFile)) {
            const start = allowPositionInLeadingTrivia ? child.getFullStart() : child.getStart(sourceFile, /*includeJsDoc*/ true);
            if (start > position) {
                // If this child begins after position, then all subsequent children will as well.
                break;
            }
            const end = child.getEnd();
            if (position < end || (position === end && (child.kind === ts.SyntaxKind.EndOfFileToken || includeEndPosition))) {
                current = child;
                continue outer;
            }
            else if (includePrecedingTokenAtEndPosition && end === position) {
                const previousToken = findPrecedingToken(position, sourceFile, child);
                if (previousToken && includePrecedingTokenAtEndPosition(previousToken)) {
                    return previousToken;
                }
            }
        }
        return current;
    }
}
/**
 * The token on the left of the position is the token that strictly includes the position
 * or sits to the left of the cursor if it is on a boundary. For example
 *
 *   fo|o               -> will return foo
 *   foo <comment> |bar -> will return foo
 *
 */
/* @internal */
export function findTokenOnLeftOfPosition(file: ts.SourceFile, position: number): ts.Node | undefined {
    // Ideally, getTokenAtPosition should return a token. However, it is currently
    // broken, so we do a check to make sure the result was indeed a token.
    const tokenAtPosition = getTokenAtPosition(file, position);
    if (ts.isToken(tokenAtPosition) && position > tokenAtPosition.getStart(file) && position < tokenAtPosition.getEnd()) {
        return tokenAtPosition;
    }
    return findPrecedingToken(position, file);
}
/* @internal */
export function findNextToken(previousToken: ts.Node, parent: ts.Node, sourceFile: ts.SourceFileLike): ts.Node | undefined {
    return find(parent);
    function find(n: ts.Node): ts.Node | undefined {
        if (ts.isToken(n) && n.pos === previousToken.end) {
            // this is token that starts at the end of previous token - return it
            return n;
        }
        return ts.firstDefined(n.getChildren(sourceFile), child => {
            const shouldDiveInChildNode = 
            // previous token is enclosed somewhere in the child
            (child.pos <= previousToken.pos && child.end > previousToken.end) ||
                // previous token ends exactly at the beginning of child
                (child.pos === previousToken.end);
            return shouldDiveInChildNode && nodeHasTokens(child, sourceFile) ? find(child) : undefined;
        });
    }
}
/**
 * Finds the rightmost token satisfying `token.end <= position`,
 * excluding `JsxText` tokens containing only whitespace.
 */
/* @internal */
export function findPrecedingToken(position: number, sourceFile: ts.SourceFile, startNode?: ts.Node, excludeJsdoc?: boolean): ts.Node | undefined {
    const result = find(startNode || sourceFile);
    ts.Debug.assert(!(result && isWhiteSpaceOnlyJsxText(result)));
    return result;
    function find(n: ts.Node): ts.Node | undefined {
        if (isNonWhitespaceToken(n) && n.kind !== ts.SyntaxKind.EndOfFileToken) {
            return n;
        }
        const children = n.getChildren(sourceFile);
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            // Note that the span of a node's tokens is [node.getStart(...), node.end).
            // Given that `position < child.end` and child has constituent tokens, we distinguish these cases:
            // 1) `position` precedes `child`'s tokens or `child` has no tokens (ie: in a comment or whitespace preceding `child`):
            // we need to find the last token in a previous child.
            // 2) `position` is within the same span: we recurse on `child`.
            if (position < child.end) {
                const start = child.getStart(sourceFile, /*includeJsDoc*/ !excludeJsdoc);
                const lookInPreviousChild = (start >= position) || // cursor in the leading trivia
                    !nodeHasTokens(child, sourceFile) ||
                    isWhiteSpaceOnlyJsxText(child);
                if (lookInPreviousChild) {
                    // actual start of the node is past the position - previous token should be at the end of previous child
                    const candidate = findRightmostChildNodeWithTokens(children, /*exclusiveStartPosition*/ i, sourceFile);
                    return candidate && findRightmostToken(candidate, sourceFile);
                }
                else {
                    // candidate should be in this node
                    return find(child);
                }
            }
        }
        ts.Debug.assert(startNode !== undefined || n.kind === ts.SyntaxKind.SourceFile || n.kind === ts.SyntaxKind.EndOfFileToken || ts.isJSDocCommentContainingNode(n));
        // Here we know that none of child token nodes embrace the position,
        // the only known case is when position is at the end of the file.
        // Try to find the rightmost token in the file without filtering.
        // Namely we are skipping the check: 'position < node.end'
        const candidate = findRightmostChildNodeWithTokens(children, /*exclusiveStartPosition*/ children.length, sourceFile);
        return candidate && findRightmostToken(candidate, sourceFile);
    }
}
/* @internal */
function isNonWhitespaceToken(n: ts.Node): boolean {
    return ts.isToken(n) && !isWhiteSpaceOnlyJsxText(n);
}
/* @internal */
function findRightmostToken(n: ts.Node, sourceFile: ts.SourceFile): ts.Node | undefined {
    if (isNonWhitespaceToken(n)) {
        return n;
    }
    const children = n.getChildren(sourceFile);
    const candidate = findRightmostChildNodeWithTokens(children, /*exclusiveStartPosition*/ children.length, sourceFile);
    return candidate && findRightmostToken(candidate, sourceFile);
}
/**
 * Finds the rightmost child to the left of `children[exclusiveStartPosition]` which is a non-all-whitespace token or has constituent tokens.
 */
/* @internal */
function findRightmostChildNodeWithTokens(children: ts.Node[], exclusiveStartPosition: number, sourceFile: ts.SourceFile): ts.Node | undefined {
    for (let i = exclusiveStartPosition - 1; i >= 0; i--) {
        const child = children[i];
        if (isWhiteSpaceOnlyJsxText(child)) {
            ts.Debug.assert(i > 0, "`JsxText` tokens should not be the first child of `JsxElement | JsxSelfClosingElement`");
        }
        else if (nodeHasTokens(children[i], sourceFile)) {
            return children[i];
        }
    }
}
/* @internal */
export function isInString(sourceFile: ts.SourceFile, position: number, previousToken = findPrecedingToken(position, sourceFile)): boolean {
    if (previousToken && ts.isStringTextContainingNode(previousToken)) {
        const start = previousToken.getStart(sourceFile);
        const end = previousToken.getEnd();
        // To be "in" one of these literals, the position has to be:
        //   1. entirely within the token text.
        //   2. at the end position of an unterminated token.
        //   3. at the end of a regular expression (due to trailing flags like '/foo/g').
        if (start < position && position < end) {
            return true;
        }
        if (position === end) {
            return !!(<ts.LiteralExpression>previousToken).isUnterminated;
        }
    }
    return false;
}
/**
 * returns true if the position is in between the open and close elements of an JSX expression.
 */
/* @internal */
export function isInsideJsxElementOrAttribute(sourceFile: ts.SourceFile, position: number) {
    const token = getTokenAtPosition(sourceFile, position);
    if (!token) {
        return false;
    }
    if (token.kind === ts.SyntaxKind.JsxText) {
        return true;
    }
    // <div>Hello |</div>
    if (token.kind === ts.SyntaxKind.LessThanToken && token.parent.kind === ts.SyntaxKind.JsxText) {
        return true;
    }
    // <div> { | </div> or <div a={| </div>
    if (token.kind === ts.SyntaxKind.LessThanToken && token.parent.kind === ts.SyntaxKind.JsxExpression) {
        return true;
    }
    // <div> {
    // |
    // } < /div>
    if (token && token.kind === ts.SyntaxKind.CloseBraceToken && token.parent.kind === ts.SyntaxKind.JsxExpression) {
        return true;
    }
    // <div>|</div>
    if (token.kind === ts.SyntaxKind.LessThanToken && token.parent.kind === ts.SyntaxKind.JsxClosingElement) {
        return true;
    }
    return false;
}
/* @internal */
function isWhiteSpaceOnlyJsxText(node: ts.Node): boolean {
    return ts.isJsxText(node) && node.containsOnlyTriviaWhiteSpaces;
}
/* @internal */
export function isInTemplateString(sourceFile: ts.SourceFile, position: number) {
    const token = getTokenAtPosition(sourceFile, position);
    return ts.isTemplateLiteralKind(token.kind) && position > token.getStart(sourceFile);
}
/* @internal */
export function isInJSXText(sourceFile: ts.SourceFile, position: number) {
    const token = getTokenAtPosition(sourceFile, position);
    if (ts.isJsxText(token)) {
        return true;
    }
    if (token.kind === ts.SyntaxKind.OpenBraceToken && ts.isJsxExpression(token.parent) && ts.isJsxElement(token.parent.parent)) {
        return true;
    }
    if (token.kind === ts.SyntaxKind.LessThanToken && ts.isJsxOpeningLikeElement(token.parent) && ts.isJsxElement(token.parent.parent)) {
        return true;
    }
    return false;
}
/* @internal */
export function findPrecedingMatchingToken(token: ts.Node, matchingTokenKind: ts.SyntaxKind, sourceFile: ts.SourceFile) {
    const tokenKind = token.kind;
    let remainingMatchingTokens = 0;
    while (true) {
        const preceding = findPrecedingToken(token.getFullStart(), sourceFile);
        if (!preceding) {
            return undefined;
        }
        token = preceding;
        if (token.kind === matchingTokenKind) {
            if (remainingMatchingTokens === 0) {
                return token;
            }
            remainingMatchingTokens--;
        }
        else if (token.kind === tokenKind) {
            remainingMatchingTokens++;
        }
    }
}
/* @internal */
export function removeOptionality(type: ts.Type, isOptionalExpression: boolean, isOptionalChain: boolean) {
    return isOptionalExpression ? type.getNonNullableType() :
        isOptionalChain ? type.getNonOptionalType() :
            type;
}
/* @internal */
export function isPossiblyTypeArgumentPosition(token: ts.Node, sourceFile: ts.SourceFile, checker: ts.TypeChecker): boolean {
    const info = getPossibleTypeArgumentsInfo(token, sourceFile);
    return info !== undefined && (ts.isPartOfTypeNode(info.called) ||
        getPossibleGenericSignatures(info.called, info.nTypeArguments, checker).length !== 0 ||
        isPossiblyTypeArgumentPosition(info.called, sourceFile, checker));
}
/* @internal */
export function getPossibleGenericSignatures(called: ts.Expression, typeArgumentCount: number, checker: ts.TypeChecker): readonly ts.Signature[] {
    let type = checker.getTypeAtLocation(called);
    if (ts.isOptionalChain(called.parent)) {
        type = removeOptionality(type, !!called.parent.questionDotToken, /*isOptionalChain*/ true);
    }
    const signatures = ts.isNewExpression(called.parent) ? type.getConstructSignatures() : type.getCallSignatures();
    return signatures.filter(candidate => !!candidate.typeParameters && candidate.typeParameters.length >= typeArgumentCount);
}
/* @internal */
export interface PossibleTypeArgumentInfo {
    readonly called: ts.Identifier;
    readonly nTypeArguments: number;
}
/* @internal */
export interface PossibleProgramFileInfo {
    ProgramFiles?: string[];
}
// Get info for an expression like `f <` that may be the start of type arguments.
/* @internal */
export function getPossibleTypeArgumentsInfo(tokenIn: ts.Node, sourceFile: ts.SourceFile): PossibleTypeArgumentInfo | undefined {
    let token: ts.Node | undefined = tokenIn;
    // This function determines if the node could be type argument position
    // Since during editing, when type argument list is not complete,
    // the tree could be of any shape depending on the tokens parsed before current node,
    // scanning of the previous identifier followed by "<" before current node would give us better result
    // Note that we also balance out the already provided type arguments, arrays, object literals while doing so
    let remainingLessThanTokens = 0;
    let nTypeArguments = 0;
    while (token) {
        switch (token.kind) {
            case ts.SyntaxKind.LessThanToken:
                // Found the beginning of the generic argument expression
                token = findPrecedingToken(token.getFullStart(), sourceFile);
                if (token && token.kind === ts.SyntaxKind.QuestionDotToken) {
                    token = findPrecedingToken(token.getFullStart(), sourceFile);
                }
                if (!token || !ts.isIdentifier(token))
                    return undefined;
                if (!remainingLessThanTokens) {
                    return ts.isDeclarationName(token) ? undefined : { called: token, nTypeArguments };
                }
                remainingLessThanTokens--;
                break;
            case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
                remainingLessThanTokens = +3;
                break;
            case ts.SyntaxKind.GreaterThanGreaterThanToken:
                remainingLessThanTokens = +2;
                break;
            case ts.SyntaxKind.GreaterThanToken:
                remainingLessThanTokens++;
                break;
            case ts.SyntaxKind.CloseBraceToken:
                // This can be object type, skip until we find the matching open brace token
                // Skip until the matching open brace token
                token = findPrecedingMatchingToken(token, ts.SyntaxKind.OpenBraceToken, sourceFile);
                if (!token)
                    return undefined;
                break;
            case ts.SyntaxKind.CloseParenToken:
                // This can be object type, skip until we find the matching open brace token
                // Skip until the matching open brace token
                token = findPrecedingMatchingToken(token, ts.SyntaxKind.OpenParenToken, sourceFile);
                if (!token)
                    return undefined;
                break;
            case ts.SyntaxKind.CloseBracketToken:
                // This can be object type, skip until we find the matching open brace token
                // Skip until the matching open brace token
                token = findPrecedingMatchingToken(token, ts.SyntaxKind.OpenBracketToken, sourceFile);
                if (!token)
                    return undefined;
                break;
            // Valid tokens in a type name. Skip.
            case ts.SyntaxKind.CommaToken:
                nTypeArguments++;
                break;
            case ts.SyntaxKind.EqualsGreaterThanToken:
            // falls through
            case ts.SyntaxKind.Identifier:
            case ts.SyntaxKind.StringLiteral:
            case ts.SyntaxKind.NumericLiteral:
            case ts.SyntaxKind.BigIntLiteral:
            case ts.SyntaxKind.TrueKeyword:
            case ts.SyntaxKind.FalseKeyword:
            // falls through
            case ts.SyntaxKind.TypeOfKeyword:
            case ts.SyntaxKind.ExtendsKeyword:
            case ts.SyntaxKind.KeyOfKeyword:
            case ts.SyntaxKind.DotToken:
            case ts.SyntaxKind.BarToken:
            case ts.SyntaxKind.QuestionToken:
            case ts.SyntaxKind.ColonToken:
                break;
            default:
                if (ts.isTypeNode(token)) {
                    break;
                }
                // Invalid token in type
                return undefined;
        }
        token = findPrecedingToken(token.getFullStart(), sourceFile);
    }
    return undefined;
}
/**
 * Returns true if the cursor at position in sourceFile is within a comment.
 *
 * @param tokenAtPosition Must equal `getTokenAtPosition(sourceFile, position)
 * @param predicate Additional predicate to test on the comment range.
 */
/* @internal */
export function isInComment(sourceFile: ts.SourceFile, position: number, tokenAtPosition?: ts.Node): ts.CommentRange | undefined {
    return ts.formatting.getRangeOfEnclosingComment(sourceFile, position, /*precedingToken*/ undefined, tokenAtPosition);
}
/* @internal */
export function hasDocComment(sourceFile: ts.SourceFile, position: number): boolean {
    const token = getTokenAtPosition(sourceFile, position);
    return !!ts.findAncestor(token, ts.isJSDoc);
}
/* @internal */
function nodeHasTokens(n: ts.Node, sourceFile: ts.SourceFileLike): boolean {
    // If we have a token or node that has a non-zero width, it must have tokens.
    // Note: getWidth() does not take trivia into account.
    return n.kind === ts.SyntaxKind.EndOfFileToken ? !!(n as ts.EndOfFileToken).jsDoc : n.getWidth(sourceFile) !== 0;
}
/* @internal */
export function getNodeModifiers(node: ts.Node): string {
    const flags = ts.isDeclaration(node) ? ts.getCombinedModifierFlags(node) : ts.ModifierFlags.None;
    const result: string[] = [];
    if (flags & ts.ModifierFlags.Private)
        result.push(ts.ScriptElementKindModifier.privateMemberModifier);
    if (flags & ts.ModifierFlags.Protected)
        result.push(ts.ScriptElementKindModifier.protectedMemberModifier);
    if (flags & ts.ModifierFlags.Public)
        result.push(ts.ScriptElementKindModifier.publicMemberModifier);
    if (flags & ts.ModifierFlags.Static)
        result.push(ts.ScriptElementKindModifier.staticModifier);
    if (flags & ts.ModifierFlags.Abstract)
        result.push(ts.ScriptElementKindModifier.abstractModifier);
    if (flags & ts.ModifierFlags.Export)
        result.push(ts.ScriptElementKindModifier.exportedModifier);
    if (node.flags & ts.NodeFlags.Ambient)
        result.push(ts.ScriptElementKindModifier.ambientModifier);
    return result.length > 0 ? result.join(",") : ts.ScriptElementKindModifier.none;
}
/* @internal */
export function getTypeArgumentOrTypeParameterList(node: ts.Node): ts.NodeArray<ts.Node> | undefined {
    if (node.kind === ts.SyntaxKind.TypeReference || node.kind === ts.SyntaxKind.CallExpression) {
        return (<ts.CallExpression>node).typeArguments;
    }
    if (ts.isFunctionLike(node) || node.kind === ts.SyntaxKind.ClassDeclaration || node.kind === ts.SyntaxKind.InterfaceDeclaration) {
        return (<ts.FunctionLikeDeclaration>node).typeParameters;
    }
    return undefined;
}
/* @internal */
export function isComment(kind: ts.SyntaxKind): boolean {
    return kind === ts.SyntaxKind.SingleLineCommentTrivia || kind === ts.SyntaxKind.MultiLineCommentTrivia;
}
/* @internal */
export function isStringOrRegularExpressionOrTemplateLiteral(kind: ts.SyntaxKind): boolean {
    if (kind === ts.SyntaxKind.StringLiteral
        || kind === ts.SyntaxKind.RegularExpressionLiteral
        || ts.isTemplateLiteralKind(kind)) {
        return true;
    }
    return false;
}
/* @internal */
export function isPunctuation(kind: ts.SyntaxKind): boolean {
    return ts.SyntaxKind.FirstPunctuation <= kind && kind <= ts.SyntaxKind.LastPunctuation;
}
/* @internal */
export function isInsideTemplateLiteral(node: ts.TemplateLiteralToken, position: number, sourceFile: ts.SourceFile): boolean {
    return ts.isTemplateLiteralKind(node.kind)
        && (node.getStart(sourceFile) < position && position < node.end) || (!!node.isUnterminated && position === node.end);
}
/* @internal */
export function isAccessibilityModifier(kind: ts.SyntaxKind) {
    switch (kind) {
        case ts.SyntaxKind.PublicKeyword:
        case ts.SyntaxKind.PrivateKeyword:
        case ts.SyntaxKind.ProtectedKeyword:
            return true;
    }
    return false;
}
/* @internal */
export function cloneCompilerOptions(options: ts.CompilerOptions): ts.CompilerOptions {
    const result = ts.clone(options);
    ts.setConfigFileInOptions(result, options && options.configFile);
    return result;
}
/* @internal */
export function isArrayLiteralOrObjectLiteralDestructuringPattern(node: ts.Node) {
    if (node.kind === ts.SyntaxKind.ArrayLiteralExpression ||
        node.kind === ts.SyntaxKind.ObjectLiteralExpression) {
        // [a,b,c] from:
        // [a, b, c] = someExpression;
        if (node.parent.kind === ts.SyntaxKind.BinaryExpression &&
            (<ts.BinaryExpression>node.parent).left === node &&
            (<ts.BinaryExpression>node.parent).operatorToken.kind === ts.SyntaxKind.EqualsToken) {
            return true;
        }
        // [a, b, c] from:
        // for([a, b, c] of expression)
        if (node.parent.kind === ts.SyntaxKind.ForOfStatement &&
            (<ts.ForOfStatement>node.parent).initializer === node) {
            return true;
        }
        // [a, b, c] of
        // [x, [a, b, c] ] = someExpression
        // or
        // {x, a: {a, b, c} } = someExpression
        if (isArrayLiteralOrObjectLiteralDestructuringPattern(node.parent.kind === ts.SyntaxKind.PropertyAssignment ? node.parent.parent : node.parent)) {
            return true;
        }
    }
    return false;
}
/* @internal */
export function isInReferenceComment(sourceFile: ts.SourceFile, position: number): boolean {
    return isInReferenceCommentWorker(sourceFile, position, /*shouldBeReference*/ true);
}
/* @internal */
export function isInNonReferenceComment(sourceFile: ts.SourceFile, position: number): boolean {
    return isInReferenceCommentWorker(sourceFile, position, /*shouldBeReference*/ false);
}
/* @internal */
function isInReferenceCommentWorker(sourceFile: ts.SourceFile, position: number, shouldBeReference: boolean): boolean {
    const range = isInComment(sourceFile, position, /*tokenAtPosition*/ undefined);
    return !!range && shouldBeReference === tripleSlashDirectivePrefixRegex.test(sourceFile.text.substring(range.pos, range.end));
}
/* @internal */
export function createTextSpanFromNode(node: ts.Node, sourceFile?: ts.SourceFile, endNode?: ts.Node): ts.TextSpan {
    return ts.createTextSpanFromBounds(node.getStart(sourceFile), (endNode || node).getEnd());
}
/* @internal */
export function createTextRangeFromNode(node: ts.Node, sourceFile: ts.SourceFile): ts.TextRange {
    return ts.createRange(node.getStart(sourceFile), node.end);
}
/* @internal */
export function createTextSpanFromRange(range: ts.TextRange): ts.TextSpan {
    return ts.createTextSpanFromBounds(range.pos, range.end);
}
/* @internal */
export function createTextRangeFromSpan(span: ts.TextSpan): ts.TextRange {
    return ts.createRange(span.start, span.start + span.length);
}
/* @internal */
export function createTextChangeFromStartLength(start: number, length: number, newText: string): ts.TextChange {
    return createTextChange(ts.createTextSpan(start, length), newText);
}
/* @internal */
export function createTextChange(span: ts.TextSpan, newText: string): ts.TextChange {
    return { span, newText };
}
/* @internal */
export const typeKeywords: readonly ts.SyntaxKind[] = [
    ts.SyntaxKind.AnyKeyword,
    ts.SyntaxKind.BigIntKeyword,
    ts.SyntaxKind.BooleanKeyword,
    ts.SyntaxKind.FalseKeyword,
    ts.SyntaxKind.KeyOfKeyword,
    ts.SyntaxKind.NeverKeyword,
    ts.SyntaxKind.NullKeyword,
    ts.SyntaxKind.NumberKeyword,
    ts.SyntaxKind.ObjectKeyword,
    ts.SyntaxKind.ReadonlyKeyword,
    ts.SyntaxKind.StringKeyword,
    ts.SyntaxKind.SymbolKeyword,
    ts.SyntaxKind.TrueKeyword,
    ts.SyntaxKind.VoidKeyword,
    ts.SyntaxKind.UndefinedKeyword,
    ts.SyntaxKind.UniqueKeyword,
    ts.SyntaxKind.UnknownKeyword,
];
/* @internal */
export function isTypeKeyword(kind: ts.SyntaxKind): boolean {
    return ts.contains(typeKeywords, kind);
}
/** True if the symbol is for an external module, as opposed to a namespace. */
/* @internal */
export function isExternalModuleSymbol(moduleSymbol: ts.Symbol): boolean {
    return !!(moduleSymbol.flags & ts.SymbolFlags.Module) && moduleSymbol.name.charCodeAt(0) === ts.CharacterCodes.doubleQuote;
}
/** Returns `true` the first time it encounters a node and `false` afterwards. */
/* @internal */
export type NodeSeenTracker<T = ts.Node> = (node: T) => boolean;
/* @internal */
export function nodeSeenTracker<T extends ts.Node>(): NodeSeenTracker<T> {
    const seen: true[] = [];
    return node => {
        const id = ts.getNodeId(node);
        return !seen[id] && (seen[id] = true);
    };
}
/* @internal */
export function getSnapshotText(snap: ts.IScriptSnapshot): string {
    return snap.getText(0, snap.getLength());
}
/* @internal */
export function repeatString(str: string, count: number): string {
    let result = "";
    for (let i = 0; i < count; i++) {
        result += str;
    }
    return result;
}
/* @internal */
export function skipConstraint(type: ts.Type): ts.Type {
    return type.isTypeParameter() ? type.getConstraint() || type : type;
}
/* @internal */
export function getNameFromPropertyName(name: ts.PropertyName): string | undefined {
    return name.kind === ts.SyntaxKind.ComputedPropertyName
        // treat computed property names where expression is string/numeric literal as just string/numeric literal
        ? ts.isStringOrNumericLiteralLike(name.expression) ? name.expression.text : undefined
        : ts.getTextOfIdentifierOrLiteral(name);
}
/* @internal */
export function programContainsEs6Modules(program: ts.Program): boolean {
    return program.getSourceFiles().some(s => !s.isDeclarationFile && !program.isSourceFileFromExternalLibrary(s) && !!s.externalModuleIndicator);
}
/* @internal */
export function compilerOptionsIndicateEs6Modules(compilerOptions: ts.CompilerOptions): boolean {
    return !!compilerOptions.module || (compilerOptions.target!) >= ts.ScriptTarget.ES2015 || !!compilerOptions.noEmit;
}
/* @internal */
export function hostUsesCaseSensitiveFileNames(host: {
    useCaseSensitiveFileNames?(): boolean;
}): boolean {
    return host.useCaseSensitiveFileNames ? host.useCaseSensitiveFileNames() : false;
}
/* @internal */
export function hostGetCanonicalFileName(host: {
    useCaseSensitiveFileNames?(): boolean;
}): ts.GetCanonicalFileName {
    return ts.createGetCanonicalFileName(hostUsesCaseSensitiveFileNames(host));
}
/* @internal */
export function makeImportIfNecessary(defaultImport: ts.Identifier | undefined, namedImports: readonly ts.ImportSpecifier[] | undefined, moduleSpecifier: string, quotePreference: QuotePreference): ts.ImportDeclaration | undefined {
    return defaultImport || namedImports && namedImports.length ? makeImport(defaultImport, namedImports, moduleSpecifier, quotePreference) : undefined;
}
/* @internal */
export function makeImport(defaultImport: ts.Identifier | undefined, namedImports: readonly ts.ImportSpecifier[] | undefined, moduleSpecifier: string | ts.Expression, quotePreference: QuotePreference): ts.ImportDeclaration {
    return ts.createImportDeclaration(
    /*decorators*/ undefined, 
    /*modifiers*/ undefined, defaultImport || namedImports
        ? ts.createImportClause(defaultImport, namedImports && namedImports.length ? ts.createNamedImports(namedImports) : undefined)
        : undefined, typeof moduleSpecifier === "string" ? makeStringLiteral(moduleSpecifier, quotePreference) : moduleSpecifier);
}
/* @internal */
export function makeStringLiteral(text: string, quotePreference: QuotePreference): ts.StringLiteral {
    return ts.createLiteral(text, quotePreference === QuotePreference.Single);
}
/* @internal */
export const enum QuotePreference {
    Single,
    Double
}
/* @internal */
export function quotePreferenceFromString(str: ts.StringLiteral, sourceFile: ts.SourceFile): QuotePreference {
    return ts.isStringDoubleQuoted(str, sourceFile) ? QuotePreference.Double : QuotePreference.Single;
}
/* @internal */
export function getQuotePreference(sourceFile: ts.SourceFile, preferences: ts.UserPreferences): QuotePreference {
    if (preferences.quotePreference && preferences.quotePreference !== "auto") {
        return preferences.quotePreference === "single" ? QuotePreference.Single : QuotePreference.Double;
    }
    else {
        const firstModuleSpecifier = sourceFile.imports && ts.find(sourceFile.imports, ts.isStringLiteral);
        return firstModuleSpecifier ? quotePreferenceFromString(firstModuleSpecifier, sourceFile) : QuotePreference.Double;
    }
}
/* @internal */
export function getQuoteFromPreference(qp: QuotePreference): string {
    switch (qp) {
        case QuotePreference.Single: return "'";
        case QuotePreference.Double: return '"';
        default: return ts.Debug.assertNever(qp);
    }
}
/* @internal */
export function symbolNameNoDefault(symbol: ts.Symbol): string | undefined {
    const escaped = symbolEscapedNameNoDefault(symbol);
    return escaped === undefined ? undefined : ts.unescapeLeadingUnderscores(escaped);
}
/* @internal */
export function symbolEscapedNameNoDefault(symbol: ts.Symbol): ts.__String | undefined {
    if (symbol.escapedName !== ts.InternalSymbolName.Default) {
        return symbol.escapedName;
    }
    return ts.firstDefined(symbol.declarations, decl => {
        const name = ts.getNameOfDeclaration(decl);
        return name && name.kind === ts.SyntaxKind.Identifier ? name.escapedText : undefined;
    });
}
/* @internal */
export type ObjectBindingElementWithoutPropertyName = ts.BindingElement & {
    name: ts.Identifier;
};
/* @internal */
export function isObjectBindingElementWithoutPropertyName(bindingElement: ts.Node): bindingElement is ObjectBindingElementWithoutPropertyName {
    return ts.isBindingElement(bindingElement) &&
        ts.isObjectBindingPattern(bindingElement.parent) &&
        ts.isIdentifier(bindingElement.name) &&
        !bindingElement.propertyName;
}
/* @internal */
export function getPropertySymbolFromBindingElement(checker: ts.TypeChecker, bindingElement: ObjectBindingElementWithoutPropertyName): ts.Symbol | undefined {
    const typeOfPattern = checker.getTypeAtLocation(bindingElement.parent);
    return typeOfPattern && checker.getPropertyOfType(typeOfPattern, bindingElement.name.text);
}
/**
 * Find symbol of the given property-name and add the symbol to the given result array
 * @param symbol a symbol to start searching for the given propertyName
 * @param propertyName a name of property to search for
 * @param result an array of symbol of found property symbols
 * @param previousIterationSymbolsCache a cache of symbol from previous iterations of calling this function to prevent infinite revisiting of the same symbol.
 *                                The value of previousIterationSymbol is undefined when the function is first called.
 */
/* @internal */
export function getPropertySymbolsFromBaseTypes<T>(symbol: ts.Symbol, propertyName: string, checker: ts.TypeChecker, cb: (symbol: ts.Symbol) => T | undefined): T | undefined {
    const seen = ts.createMap<true>();
    return recur(symbol);
    function recur(symbol: ts.Symbol): T | undefined {
        // Use `addToSeen` to ensure we don't infinitely recurse in this situation:
        //      interface C extends C {
        //          /*findRef*/propName: string;
        //      }
        if (!(symbol.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface)) || !ts.addToSeen(seen, ts.getSymbolId(symbol)))
            return;
        return ts.firstDefined(symbol.declarations, declaration => ts.firstDefined(ts.getAllSuperTypeNodes(declaration), typeReference => {
            const type = checker.getTypeAtLocation(typeReference);
            const propertySymbol = type && type.symbol && checker.getPropertyOfType(type, propertyName);
            // Visit the typeReference as well to see if it directly or indirectly uses that property
            return type && propertySymbol && (ts.firstDefined(checker.getRootSymbols(propertySymbol), cb) || recur(type.symbol));
        }));
    }
}
/* @internal */
export function isMemberSymbolInBaseType(memberSymbol: ts.Symbol, checker: ts.TypeChecker): boolean {
    return getPropertySymbolsFromBaseTypes(memberSymbol.parent!, memberSymbol.name, checker, _ => true) || false;
}
/* @internal */
export function getParentNodeInSpan(node: ts.Node | undefined, file: ts.SourceFile, span: ts.TextSpan): ts.Node | undefined {
    if (!node)
        return undefined;
    while (node.parent) {
        if (ts.isSourceFile(node.parent) || !spanContainsNode(span, node.parent, file)) {
            return node;
        }
        node = node.parent;
    }
}
/* @internal */
function spanContainsNode(span: ts.TextSpan, node: ts.Node, file: ts.SourceFile): boolean {
    return ts.textSpanContainsPosition(span, node.getStart(file)) &&
        node.getEnd() <= ts.textSpanEnd(span);
}
/* @internal */
export function findModifier(node: ts.Node, kind: ts.Modifier["kind"]): ts.Modifier | undefined {
    return node.modifiers && ts.find(node.modifiers, m => m.kind === kind);
}
/* @internal */
export function insertImport(changes: ts.textChanges.ChangeTracker, sourceFile: ts.SourceFile, importDecl: ts.Statement): void {
    const lastImportDeclaration = ts.findLast(sourceFile.statements, ts.isAnyImportSyntax);
    if (lastImportDeclaration) {
        changes.insertNodeAfter(sourceFile, lastImportDeclaration, importDecl);
    }
    else {
        changes.insertNodeAtTopOfFile(sourceFile, importDecl, /*blankLineBetween*/ true);
    }
}
/* @internal */
export function textSpansEqual(a: ts.TextSpan | undefined, b: ts.TextSpan | undefined): boolean {
    return !!a && !!b && a.start === b.start && a.length === b.length;
}
/* @internal */
export function documentSpansEqual(a: ts.DocumentSpan, b: ts.DocumentSpan): boolean {
    return a.fileName === b.fileName && textSpansEqual(a.textSpan, b.textSpan);
}
/**
 * Iterates through 'array' by index and performs the callback on each element of array until the callback
 * returns a truthy value, then returns that value.
 * If no such value is found, the callback is applied to each element of array and undefined is returned.
 */
/* @internal */
export function forEachUnique<T, U>(array: readonly T[] | undefined, callback: (element: T, index: number) => U): U | undefined {
    if (array) {
        for (let i = 0; i < array.length; i++) {
            if (array.indexOf(array[i]) === i) {
                const result = callback(array[i], i);
                if (result) {
                    return result;
                }
            }
        }
    }
    return undefined;
}
// #endregion
// Display-part writer helpers
// #region
/* @internal */
export function isFirstDeclarationOfSymbolParameter(symbol: ts.Symbol) {
    return symbol.declarations && symbol.declarations.length > 0 && symbol.declarations[0].kind === ts.SyntaxKind.Parameter;
}
/* @internal */
const displayPartWriter = getDisplayPartWriter();
/* @internal */
function getDisplayPartWriter(): ts.DisplayPartsSymbolWriter {
    const absoluteMaximumLength = ts.defaultMaximumTruncationLength * 10; // A hard cutoff to avoid overloading the messaging channel in worst-case scenarios
    let displayParts: ts.SymbolDisplayPart[];
    let lineStart: boolean;
    let indent: number;
    let length: number;
    resetWriter();
    const unknownWrite = (text: string) => writeKind(text, ts.SymbolDisplayPartKind.text);
    return {
        displayParts: () => {
            const finalText = displayParts.length && displayParts[displayParts.length - 1].text;
            if (length > absoluteMaximumLength && finalText && finalText !== "...") {
                if (!ts.isWhiteSpaceLike(finalText.charCodeAt(finalText.length - 1))) {
                    displayParts.push(displayPart(" ", ts.SymbolDisplayPartKind.space));
                }
                displayParts.push(displayPart("...", ts.SymbolDisplayPartKind.punctuation));
            }
            return displayParts;
        },
        writeKeyword: text => writeKind(text, ts.SymbolDisplayPartKind.keyword),
        writeOperator: text => writeKind(text, ts.SymbolDisplayPartKind.operator),
        writePunctuation: text => writeKind(text, ts.SymbolDisplayPartKind.punctuation),
        writeTrailingSemicolon: text => writeKind(text, ts.SymbolDisplayPartKind.punctuation),
        writeSpace: text => writeKind(text, ts.SymbolDisplayPartKind.space),
        writeStringLiteral: text => writeKind(text, ts.SymbolDisplayPartKind.stringLiteral),
        writeParameter: text => writeKind(text, ts.SymbolDisplayPartKind.parameterName),
        writeProperty: text => writeKind(text, ts.SymbolDisplayPartKind.propertyName),
        writeLiteral: text => writeKind(text, ts.SymbolDisplayPartKind.stringLiteral),
        writeSymbol,
        writeLine,
        write: unknownWrite,
        writeComment: unknownWrite,
        getText: () => "",
        getTextPos: () => 0,
        getColumn: () => 0,
        getLine: () => 0,
        isAtStartOfLine: () => false,
        hasTrailingWhitespace: () => false,
        hasTrailingComment: () => false,
        rawWrite: ts.notImplemented,
        getIndent: () => indent,
        increaseIndent: () => { indent++; },
        decreaseIndent: () => { indent--; },
        clear: resetWriter,
        trackSymbol: ts.noop,
        reportInaccessibleThisError: ts.noop,
        reportInaccessibleUniqueSymbolError: ts.noop,
        reportPrivateInBaseOfClassExpression: ts.noop,
    };
    function writeIndent() {
        if (length > absoluteMaximumLength)
            return;
        if (lineStart) {
            const indentString = ts.getIndentString(indent);
            if (indentString) {
                length += indentString.length;
                displayParts.push(displayPart(indentString, ts.SymbolDisplayPartKind.space));
            }
            lineStart = false;
        }
    }
    function writeKind(text: string, kind: ts.SymbolDisplayPartKind) {
        if (length > absoluteMaximumLength)
            return;
        writeIndent();
        length += text.length;
        displayParts.push(displayPart(text, kind));
    }
    function writeSymbol(text: string, symbol: ts.Symbol) {
        if (length > absoluteMaximumLength)
            return;
        writeIndent();
        length += text.length;
        displayParts.push(symbolPart(text, symbol));
    }
    function writeLine() {
        if (length > absoluteMaximumLength)
            return;
        length += 1;
        displayParts.push(lineBreakPart());
        lineStart = true;
    }
    function resetWriter() {
        displayParts = [];
        lineStart = true;
        indent = 0;
        length = 0;
    }
}
/* @internal */
export function symbolPart(text: string, symbol: ts.Symbol) {
    return displayPart(text, displayPartKind(symbol));
    function displayPartKind(symbol: ts.Symbol): ts.SymbolDisplayPartKind {
        const flags = symbol.flags;
        if (flags & ts.SymbolFlags.Variable) {
            return isFirstDeclarationOfSymbolParameter(symbol) ? ts.SymbolDisplayPartKind.parameterName : ts.SymbolDisplayPartKind.localName;
        }
        else if (flags & ts.SymbolFlags.Property) {
            return ts.SymbolDisplayPartKind.propertyName;
        }
        else if (flags & ts.SymbolFlags.GetAccessor) {
            return ts.SymbolDisplayPartKind.propertyName;
        }
        else if (flags & ts.SymbolFlags.SetAccessor) {
            return ts.SymbolDisplayPartKind.propertyName;
        }
        else if (flags & ts.SymbolFlags.EnumMember) {
            return ts.SymbolDisplayPartKind.enumMemberName;
        }
        else if (flags & ts.SymbolFlags.Function) {
            return ts.SymbolDisplayPartKind.functionName;
        }
        else if (flags & ts.SymbolFlags.Class) {
            return ts.SymbolDisplayPartKind.className;
        }
        else if (flags & ts.SymbolFlags.Interface) {
            return ts.SymbolDisplayPartKind.interfaceName;
        }
        else if (flags & ts.SymbolFlags.Enum) {
            return ts.SymbolDisplayPartKind.enumName;
        }
        else if (flags & ts.SymbolFlags.Module) {
            return ts.SymbolDisplayPartKind.moduleName;
        }
        else if (flags & ts.SymbolFlags.Method) {
            return ts.SymbolDisplayPartKind.methodName;
        }
        else if (flags & ts.SymbolFlags.TypeParameter) {
            return ts.SymbolDisplayPartKind.typeParameterName;
        }
        else if (flags & ts.SymbolFlags.TypeAlias) {
            return ts.SymbolDisplayPartKind.aliasName;
        }
        else if (flags & ts.SymbolFlags.Alias) {
            return ts.SymbolDisplayPartKind.aliasName;
        }
        return ts.SymbolDisplayPartKind.text;
    }
}
/* @internal */
export function displayPart(text: string, kind: ts.SymbolDisplayPartKind): ts.SymbolDisplayPart {
    return { text, kind: ts.SymbolDisplayPartKind[kind] };
}
/* @internal */
export function spacePart() {
    return displayPart(" ", ts.SymbolDisplayPartKind.space);
}
/* @internal */
export function keywordPart(kind: ts.SyntaxKind) {
    return displayPart((ts.tokenToString(kind)!), ts.SymbolDisplayPartKind.keyword);
}
/* @internal */
export function punctuationPart(kind: ts.SyntaxKind) {
    return displayPart((ts.tokenToString(kind)!), ts.SymbolDisplayPartKind.punctuation);
}
/* @internal */
export function operatorPart(kind: ts.SyntaxKind) {
    return displayPart((ts.tokenToString(kind)!), ts.SymbolDisplayPartKind.operator);
}
/* @internal */
export function textOrKeywordPart(text: string) {
    const kind = ts.stringToToken(text);
    return kind === undefined
        ? textPart(text)
        : keywordPart(kind);
}
/* @internal */
export function textPart(text: string) {
    return displayPart(text, ts.SymbolDisplayPartKind.text);
}
/* @internal */
const carriageReturnLineFeed = "\r\n";
/**
 * The default is CRLF.
 */
/* @internal */
export function getNewLineOrDefaultFromHost(host: ts.LanguageServiceHost | ts.LanguageServiceShimHost, formatSettings?: ts.FormatCodeSettings) {
    return (formatSettings && formatSettings.newLineCharacter) ||
        (host.getNewLine && host.getNewLine()) ||
        carriageReturnLineFeed;
}
/* @internal */
export function lineBreakPart() {
    return displayPart("\n", ts.SymbolDisplayPartKind.lineBreak);
}
/* @internal */
export function mapToDisplayParts(writeDisplayParts: (writer: ts.DisplayPartsSymbolWriter) => void): ts.SymbolDisplayPart[] {
    try {
        writeDisplayParts(displayPartWriter);
        return displayPartWriter.displayParts();
    }
    finally {
        displayPartWriter.clear();
    }
}
/* @internal */
export function typeToDisplayParts(typechecker: ts.TypeChecker, type: ts.Type, enclosingDeclaration?: ts.Node, flags: ts.TypeFormatFlags = ts.TypeFormatFlags.None): ts.SymbolDisplayPart[] {
    return mapToDisplayParts(writer => {
        typechecker.writeType(type, enclosingDeclaration, flags | ts.TypeFormatFlags.MultilineObjectLiterals | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope, writer);
    });
}
/* @internal */
export function symbolToDisplayParts(typeChecker: ts.TypeChecker, symbol: ts.Symbol, enclosingDeclaration?: ts.Node, meaning?: ts.SymbolFlags, flags: ts.SymbolFormatFlags = ts.SymbolFormatFlags.None): ts.SymbolDisplayPart[] {
    return mapToDisplayParts(writer => {
        typeChecker.writeSymbol(symbol, enclosingDeclaration, meaning, flags | ts.SymbolFormatFlags.UseAliasDefinedOutsideCurrentScope, writer);
    });
}
/* @internal */
export function signatureToDisplayParts(typechecker: ts.TypeChecker, signature: ts.Signature, enclosingDeclaration?: ts.Node, flags: ts.TypeFormatFlags = ts.TypeFormatFlags.None): ts.SymbolDisplayPart[] {
    flags |= ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope | ts.TypeFormatFlags.MultilineObjectLiterals | ts.TypeFormatFlags.WriteTypeArgumentsOfSignature | ts.TypeFormatFlags.OmitParameterModifiers;
    return mapToDisplayParts(writer => {
        typechecker.writeSignature(signature, enclosingDeclaration, flags, /*signatureKind*/ undefined, writer);
    });
}
/* @internal */
export function isImportOrExportSpecifierName(location: ts.Node): location is ts.Identifier {
    return !!location.parent && ts.isImportOrExportSpecifier(location.parent) && location.parent.propertyName === location;
}
/* @internal */
export function scriptKindIs(fileName: string, host: ts.LanguageServiceHost, ...scriptKinds: ts.ScriptKind[]): boolean {
    const scriptKind = getScriptKind(fileName, host);
    return ts.some(scriptKinds, k => k === scriptKind);
}
/* @internal */
export function getScriptKind(fileName: string, host?: ts.LanguageServiceHost): ts.ScriptKind {
    // First check to see if the script kind was specified by the host. Chances are the host
    // may override the default script kind for the file extension.
    return ts.ensureScriptKind(fileName, host && host.getScriptKind && host.getScriptKind(fileName));
}
/* @internal */
export function getSymbolTarget(symbol: ts.Symbol, checker: ts.TypeChecker): ts.Symbol {
    let next: ts.Symbol = symbol;
    while (isAliasSymbol(next) || (isTransientSymbol(next) && next.target)) {
        if (isTransientSymbol(next) && next.target) {
            next = next.target;
        }
        else {
            next = ts.skipAlias(next, checker);
        }
    }
    return next;
}
/* @internal */
function isTransientSymbol(symbol: ts.Symbol): symbol is ts.TransientSymbol {
    return (symbol.flags & ts.SymbolFlags.Transient) !== 0;
}
/* @internal */
function isAliasSymbol(symbol: ts.Symbol): boolean {
    return (symbol.flags & ts.SymbolFlags.Alias) !== 0;
}
/* @internal */
export function getUniqueSymbolId(symbol: ts.Symbol, checker: ts.TypeChecker) {
    return ts.getSymbolId(ts.skipAlias(symbol, checker));
}
/* @internal */
export function getFirstNonSpaceCharacterPosition(text: string, position: number) {
    while (ts.isWhiteSpaceLike(text.charCodeAt(position))) {
        position += 1;
    }
    return position;
}
/* @internal */
export function getPrecedingNonSpaceCharacterPosition(text: string, position: number) {
    while (position > -1 && ts.isWhiteSpaceSingleLine(text.charCodeAt(position))) {
        position -= 1;
    }
    return position + 1;
}
/**
 * Creates a deep, memberwise clone of a node with no source map location.
 *
 * WARNING: This is an expensive operation and is only intended to be used in refactorings
 * and code fixes (because those are triggered by explicit user actions).
 */
/* @internal */
export function getSynthesizedDeepClone<T extends ts.Node | undefined>(node: T, includeTrivia = true): T {
    const clone = node && getSynthesizedDeepCloneWorker(node as NonNullable<T>);
    if (clone && !includeTrivia)
        suppressLeadingAndTrailingTrivia(clone);
    return clone;
}
/* @internal */
export function getSynthesizedDeepCloneWithRenames<T extends ts.Node>(node: T, includeTrivia = true, renameMap?: ts.Map<ts.Identifier>, checker?: ts.TypeChecker, callback?: (originalNode: ts.Node, clone: ts.Node) => any): T {
    let clone;
    if (renameMap && checker && ts.isBindingElement(node) && ts.isIdentifier(node.name) && ts.isObjectBindingPattern(node.parent)) {
        const symbol = checker.getSymbolAtLocation(node.name);
        const renameInfo = symbol && renameMap.get(String(ts.getSymbolId(symbol)));
        if (renameInfo && renameInfo.text !== (node.name || node.propertyName).getText()) {
            clone = ts.createBindingElement(node.dotDotDotToken, node.propertyName || node.name, renameInfo, node.initializer);
        }
    }
    else if (renameMap && checker && ts.isIdentifier(node)) {
        const symbol = checker.getSymbolAtLocation(node);
        const renameInfo = symbol && renameMap.get(String(ts.getSymbolId(symbol)));
        if (renameInfo) {
            clone = ts.createIdentifier(renameInfo.text);
        }
    }
    if (!clone) {
        clone = getSynthesizedDeepCloneWorker(node as NonNullable<T>, renameMap, checker, callback);
    }
    if (clone && !includeTrivia)
        suppressLeadingAndTrailingTrivia(clone);
    if (callback && clone)
        callback(node, clone);
    return clone as T;
}
/* @internal */
function getSynthesizedDeepCloneWorker<T extends ts.Node>(node: T, renameMap?: ts.Map<ts.Identifier>, checker?: ts.TypeChecker, callback?: (originalNode: ts.Node, clone: ts.Node) => any): T {
    const visited = (renameMap || checker || callback) ?
        ts.visitEachChild(node, wrapper, ts.nullTransformationContext) :
        ts.visitEachChild(node, getSynthesizedDeepClone, ts.nullTransformationContext);
    if (visited === node) {
        // This only happens for leaf nodes - internal nodes always see their children change.
        const clone = ts.getSynthesizedClone(node);
        if (ts.isStringLiteral(clone)) {
            clone.textSourceNode = node as any;
        }
        else if (ts.isNumericLiteral(clone)) {
            clone.numericLiteralFlags = (node as any).numericLiteralFlags;
        }
        return ts.setTextRange(clone, node);
    }
    // PERF: As an optimization, rather than calling getSynthesizedClone, we'll update
    // the new node created by visitEachChild with the extra changes getSynthesizedClone
    // would have made.
    visited.parent = undefined!;
    return visited;
    function wrapper(node: T) {
        return getSynthesizedDeepCloneWithRenames(node, /*includeTrivia*/ true, renameMap, checker, callback);
    }
}
/* @internal */
export function getSynthesizedDeepClones<T extends ts.Node>(nodes: ts.NodeArray<T>, includeTrivia?: boolean): ts.NodeArray<T>;
/* @internal */
export function getSynthesizedDeepClones<T extends ts.Node>(nodes: ts.NodeArray<T> | undefined, includeTrivia?: boolean): ts.NodeArray<T> | undefined;
/* @internal */
export function getSynthesizedDeepClones<T extends ts.Node>(nodes: ts.NodeArray<T> | undefined, includeTrivia = true): ts.NodeArray<T> | undefined {
    return nodes && ts.createNodeArray(nodes.map(n => getSynthesizedDeepClone(n, includeTrivia)), nodes.hasTrailingComma);
}
/**
 * Sets EmitFlags to suppress leading and trailing trivia on the node.
 */
/* @internal */
export function suppressLeadingAndTrailingTrivia(node: ts.Node) {
    suppressLeadingTrivia(node);
    suppressTrailingTrivia(node);
}
/**
 * Sets EmitFlags to suppress leading trivia on the node.
 */
/* @internal */
export function suppressLeadingTrivia(node: ts.Node) {
    addEmitFlagsRecursively(node, ts.EmitFlags.NoLeadingComments, getFirstChild);
}
/**
 * Sets EmitFlags to suppress trailing trivia on the node.
 */
/* @internal */
export function suppressTrailingTrivia(node: ts.Node) {
    addEmitFlagsRecursively(node, ts.EmitFlags.NoTrailingComments, ts.getLastChild);
}
/* @internal */
function addEmitFlagsRecursively(node: ts.Node, flag: ts.EmitFlags, getChild: (n: ts.Node) => ts.Node | undefined) {
    ts.addEmitFlags(node, flag);
    const child = getChild(node);
    if (child)
        addEmitFlagsRecursively(child, flag, getChild);
}
/* @internal */
function getFirstChild(node: ts.Node): ts.Node | undefined {
    return node.forEachChild(child => child);
}
/* @internal */
export function getUniqueName(baseName: string, sourceFile: ts.SourceFile): string {
    let nameText = baseName;
    for (let i = 1; !ts.isFileLevelUniqueName(sourceFile, nameText); i++) {
        nameText = `${baseName}_${i}`;
    }
    return nameText;
}
/**
 * @return The index of the (only) reference to the extracted symbol.  We want the cursor
 * to be on the reference, rather than the declaration, because it's closer to where the
 * user was before extracting it.
 */
/* @internal */
export function getRenameLocation(edits: readonly ts.FileTextChanges[], renameFilename: string, name: string, preferLastLocation: boolean): number {
    let delta = 0;
    let lastPos = -1;
    for (const { fileName, textChanges } of edits) {
        ts.Debug.assert(fileName === renameFilename);
        for (const change of textChanges) {
            const { span, newText } = change;
            const index = indexInTextChange(newText, name);
            if (index !== -1) {
                lastPos = span.start + delta + index;
                // If the reference comes first, return immediately.
                if (!preferLastLocation) {
                    return lastPos;
                }
            }
            delta += newText.length - span.length;
        }
    }
    // If the declaration comes first, return the position of the last occurrence.
    ts.Debug.assert(preferLastLocation);
    ts.Debug.assert(lastPos >= 0);
    return lastPos;
}
/* @internal */
export function copyLeadingComments(sourceNode: ts.Node, targetNode: ts.Node, sourceFile: ts.SourceFile, commentKind?: ts.CommentKind, hasTrailingNewLine?: boolean) {
    ts.forEachLeadingCommentRange(sourceFile.text, sourceNode.pos, getAddCommentsFunction(targetNode, sourceFile, commentKind, hasTrailingNewLine, ts.addSyntheticLeadingComment));
}
/* @internal */
export function copyTrailingComments(sourceNode: ts.Node, targetNode: ts.Node, sourceFile: ts.SourceFile, commentKind?: ts.CommentKind, hasTrailingNewLine?: boolean) {
    ts.forEachTrailingCommentRange(sourceFile.text, sourceNode.end, getAddCommentsFunction(targetNode, sourceFile, commentKind, hasTrailingNewLine, ts.addSyntheticTrailingComment));
}
/**
 * This function copies the trailing comments for the token that comes before `sourceNode`, as leading comments of `targetNode`.
 * This is useful because sometimes a comment that refers to `sourceNode` will be a leading comment for `sourceNode`, according to the
 * notion of trivia ownership, and instead will be a trailing comment for the token before `sourceNode`, e.g.:
 * `function foo(\* not leading comment for a *\ a: string) {}`
 * The comment refers to `a` but belongs to the `(` token, but we might want to copy it.
 */
/* @internal */
export function copyTrailingAsLeadingComments(sourceNode: ts.Node, targetNode: ts.Node, sourceFile: ts.SourceFile, commentKind?: ts.CommentKind, hasTrailingNewLine?: boolean) {
    ts.forEachTrailingCommentRange(sourceFile.text, sourceNode.pos, getAddCommentsFunction(targetNode, sourceFile, commentKind, hasTrailingNewLine, ts.addSyntheticLeadingComment));
}
/* @internal */
function getAddCommentsFunction(targetNode: ts.Node, sourceFile: ts.SourceFile, commentKind: ts.CommentKind | undefined, hasTrailingNewLine: boolean | undefined, cb: (node: ts.Node, kind: ts.CommentKind, text: string, hasTrailingNewLine?: boolean) => void) {
    return (pos: number, end: number, kind: ts.CommentKind, htnl: boolean) => {
        if (kind === ts.SyntaxKind.MultiLineCommentTrivia) {
            // Remove leading /*
            pos += 2;
            // Remove trailing */
            end -= 2;
        }
        else {
            // Remove leading //
            pos += 2;
        }
        cb(targetNode, commentKind || kind, sourceFile.text.slice(pos, end), hasTrailingNewLine !== undefined ? hasTrailingNewLine : htnl);
    };
}
/* @internal */
function indexInTextChange(change: string, name: string): number {
    if (ts.startsWith(change, name))
        return 0;
    // Add a " " to avoid references inside words
    let idx = change.indexOf(" " + name);
    if (idx === -1)
        idx = change.indexOf("." + name);
    if (idx === -1)
        idx = change.indexOf('"' + name);
    return idx === -1 ? -1 : idx + 1;
}
/* @internal */
export function getContextualTypeFromParent(node: ts.Expression, checker: ts.TypeChecker): ts.Type | undefined {
    const { parent } = node;
    switch (parent.kind) {
        case ts.SyntaxKind.NewExpression:
            return checker.getContextualType((parent as ts.NewExpression));
        case ts.SyntaxKind.BinaryExpression: {
            const { left, operatorToken, right } = (parent as ts.BinaryExpression);
            return isEqualityOperatorKind(operatorToken.kind)
                ? checker.getTypeAtLocation(node === right ? left : right)
                : checker.getContextualType(node);
        }
        case ts.SyntaxKind.CaseClause:
            return (parent as ts.CaseClause).expression === node ? getSwitchedType((parent as ts.CaseClause), checker) : undefined;
        default:
            return checker.getContextualType(node);
    }
}
/* @internal */
export function quote(text: string, preferences: ts.UserPreferences): string {
    if (/^\d+$/.test(text)) {
        return text;
    }
    // Editors can pass in undefined or empty string - we want to infer the preference in those cases.
    const quotePreference = preferences.quotePreference || "auto";
    const quoted = JSON.stringify(text);
    switch (quotePreference) {
        // TODO use getQuotePreference to infer the actual quote style.
        case "auto":
        case "double":
            return quoted;
        case "single":
            return `'${ts.stripQuotes(quoted).replace("'", "\\'").replace('\\"', '"')}'`;
        default:
            return ts.Debug.assertNever(quotePreference);
    }
}
/* @internal */
export function isEqualityOperatorKind(kind: ts.SyntaxKind): kind is ts.EqualityOperator {
    switch (kind) {
        case ts.SyntaxKind.EqualsEqualsEqualsToken:
        case ts.SyntaxKind.EqualsEqualsToken:
        case ts.SyntaxKind.ExclamationEqualsEqualsToken:
        case ts.SyntaxKind.ExclamationEqualsToken:
            return true;
        default:
            return false;
    }
}
/* @internal */
export function isStringLiteralOrTemplate(node: ts.Node): node is ts.StringLiteralLike | ts.TemplateExpression | ts.TaggedTemplateExpression {
    switch (node.kind) {
        case ts.SyntaxKind.StringLiteral:
        case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
        case ts.SyntaxKind.TemplateExpression:
        case ts.SyntaxKind.TaggedTemplateExpression:
            return true;
        default:
            return false;
    }
}
/* @internal */
export function hasIndexSignature(type: ts.Type): boolean {
    return !!type.getStringIndexType() || !!type.getNumberIndexType();
}
/* @internal */
export function getSwitchedType(caseClause: ts.CaseClause, checker: ts.TypeChecker): ts.Type | undefined {
    return checker.getTypeAtLocation(caseClause.parent.parent.expression);
}
/* @internal */
export function getTypeNodeIfAccessible(type: ts.Type, enclosingScope: ts.Node, program: ts.Program, host: ts.LanguageServiceHost): ts.TypeNode | undefined {
    const checker = program.getTypeChecker();
    let typeIsAccessible = true;
    const notAccessible = () => { typeIsAccessible = false; };
    const res = checker.typeToTypeNode(type, enclosingScope, /*flags*/ undefined, {
        trackSymbol: (symbol, declaration, meaning) => {
            typeIsAccessible = typeIsAccessible && checker.isSymbolAccessible(symbol, declaration, meaning, /*shouldComputeAliasToMarkVisible*/ false).accessibility === ts.SymbolAccessibility.Accessible;
        },
        reportInaccessibleThisError: notAccessible,
        reportPrivateInBaseOfClassExpression: notAccessible,
        reportInaccessibleUniqueSymbolError: notAccessible,
        moduleResolverHost: {
            readFile: host.readFile,
            fileExists: host.fileExists,
            directoryExists: host.directoryExists,
            getSourceFiles: program.getSourceFiles,
            getCurrentDirectory: program.getCurrentDirectory,
            getCommonSourceDirectory: program.getCommonSourceDirectory,
        }
    });
    return typeIsAccessible ? res : undefined;
}
/* @internal */
export function syntaxRequiresTrailingCommaOrSemicolonOrASI(kind: ts.SyntaxKind) {
    return kind === ts.SyntaxKind.CallSignature
        || kind === ts.SyntaxKind.ConstructSignature
        || kind === ts.SyntaxKind.IndexSignature
        || kind === ts.SyntaxKind.PropertySignature
        || kind === ts.SyntaxKind.MethodSignature;
}
/* @internal */
export function syntaxRequiresTrailingFunctionBlockOrSemicolonOrASI(kind: ts.SyntaxKind) {
    return kind === ts.SyntaxKind.FunctionDeclaration
        || kind === ts.SyntaxKind.Constructor
        || kind === ts.SyntaxKind.MethodDeclaration
        || kind === ts.SyntaxKind.GetAccessor
        || kind === ts.SyntaxKind.SetAccessor;
}
/* @internal */
export function syntaxRequiresTrailingModuleBlockOrSemicolonOrASI(kind: ts.SyntaxKind) {
    return kind === ts.SyntaxKind.ModuleDeclaration;
}
/* @internal */
export function syntaxRequiresTrailingSemicolonOrASI(kind: ts.SyntaxKind) {
    return kind === ts.SyntaxKind.VariableStatement
        || kind === ts.SyntaxKind.ExpressionStatement
        || kind === ts.SyntaxKind.DoStatement
        || kind === ts.SyntaxKind.ContinueStatement
        || kind === ts.SyntaxKind.BreakStatement
        || kind === ts.SyntaxKind.ReturnStatement
        || kind === ts.SyntaxKind.ThrowStatement
        || kind === ts.SyntaxKind.DebuggerStatement
        || kind === ts.SyntaxKind.PropertyDeclaration
        || kind === ts.SyntaxKind.TypeAliasDeclaration
        || kind === ts.SyntaxKind.ImportDeclaration
        || kind === ts.SyntaxKind.ImportEqualsDeclaration
        || kind === ts.SyntaxKind.ExportDeclaration
        || kind === ts.SyntaxKind.NamespaceExportDeclaration
        || kind === ts.SyntaxKind.ExportAssignment;
}
/* @internal */
export const syntaxMayBeASICandidate = ts.or(syntaxRequiresTrailingCommaOrSemicolonOrASI, syntaxRequiresTrailingFunctionBlockOrSemicolonOrASI, syntaxRequiresTrailingModuleBlockOrSemicolonOrASI, syntaxRequiresTrailingSemicolonOrASI);
/* @internal */
function nodeIsASICandidate(node: ts.Node, sourceFile: ts.SourceFileLike): boolean {
    const lastToken = node.getLastToken(sourceFile);
    if (lastToken && lastToken.kind === ts.SyntaxKind.SemicolonToken) {
        return false;
    }
    if (syntaxRequiresTrailingCommaOrSemicolonOrASI(node.kind)) {
        if (lastToken && lastToken.kind === ts.SyntaxKind.CommaToken) {
            return false;
        }
    }
    else if (syntaxRequiresTrailingModuleBlockOrSemicolonOrASI(node.kind)) {
        const lastChild = ts.last(node.getChildren(sourceFile));
        if (lastChild && ts.isModuleBlock(lastChild)) {
            return false;
        }
    }
    else if (syntaxRequiresTrailingFunctionBlockOrSemicolonOrASI(node.kind)) {
        const lastChild = ts.last(node.getChildren(sourceFile));
        if (lastChild && ts.isFunctionBlock(lastChild)) {
            return false;
        }
    }
    else if (!syntaxRequiresTrailingSemicolonOrASI(node.kind)) {
        return false;
    }
    // See comment in parser’s `parseDoStatement`
    if (node.kind === ts.SyntaxKind.DoStatement) {
        return true;
    }
    const topNode = (ts.findAncestor(node, ancestor => !ancestor.parent)!);
    const nextToken = findNextToken(node, topNode, sourceFile);
    if (!nextToken || nextToken.kind === ts.SyntaxKind.CloseBraceToken) {
        return true;
    }
    const startLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line;
    const endLine = sourceFile.getLineAndCharacterOfPosition(nextToken.getStart(sourceFile)).line;
    return startLine !== endLine;
}
/* @internal */
export function positionIsASICandidate(pos: number, context: ts.Node, sourceFile: ts.SourceFileLike): boolean {
    const contextAncestor = ts.findAncestor(context, ancestor => {
        if (ancestor.end !== pos) {
            return "quit";
        }
        return syntaxMayBeASICandidate(ancestor.kind);
    });
    return !!contextAncestor && nodeIsASICandidate(contextAncestor, sourceFile);
}
/* @internal */
export function probablyUsesSemicolons(sourceFile: ts.SourceFile): boolean {
    let withSemicolon = 0;
    let withoutSemicolon = 0;
    const nStatementsToObserve = 5;
    ts.forEachChild(sourceFile, function visit(node): boolean | undefined {
        if (syntaxRequiresTrailingSemicolonOrASI(node.kind)) {
            const lastToken = node.getLastToken(sourceFile);
            if (lastToken && lastToken.kind === ts.SyntaxKind.SemicolonToken) {
                withSemicolon++;
            }
            else {
                withoutSemicolon++;
            }
        }
        if (withSemicolon + withoutSemicolon >= nStatementsToObserve) {
            return true;
        }
        return ts.forEachChild(node, visit);
    });
    // One statement missing a semicolon isn’t sufficient evidence to say the user
    // doesn’t want semicolons, because they may not even be done writing that statement.
    if (withSemicolon === 0 && withoutSemicolon <= 1) {
        return true;
    }
    // If even 2/5 places have a semicolon, the user probably wants semicolons
    return withSemicolon / withoutSemicolon > 1 / nStatementsToObserve;
}
/* @internal */
export function tryGetDirectories(host: Pick<ts.LanguageServiceHost, "getDirectories">, directoryName: string): string[] {
    return tryIOAndConsumeErrors(host, host.getDirectories, directoryName) || [];
}
/* @internal */
export function tryReadDirectory(host: Pick<ts.LanguageServiceHost, "readDirectory">, path: string, extensions?: readonly string[], exclude?: readonly string[], include?: readonly string[]): readonly string[] {
    return tryIOAndConsumeErrors(host, host.readDirectory, path, extensions, exclude, include) || ts.emptyArray;
}
/* @internal */
export function tryFileExists(host: Pick<ts.LanguageServiceHost, "fileExists">, path: string): boolean {
    return tryIOAndConsumeErrors(host, host.fileExists, path);
}
/* @internal */
export function tryDirectoryExists(host: ts.LanguageServiceHost, path: string): boolean {
    return tryAndIgnoreErrors(() => ts.directoryProbablyExists(path, host)) || false;
}
/* @internal */
export function tryAndIgnoreErrors<T>(cb: () => T): T | undefined {
    try {
        return cb();
    }
    catch {
        return undefined;
    }
}
/* @internal */
export function tryIOAndConsumeErrors<T>(host: unknown, toApply: ((...a: any[]) => T) | undefined, ...args: any[]) {
    return tryAndIgnoreErrors(() => toApply && toApply.apply(host, args));
}
/* @internal */
export function findPackageJsons(startDirectory: string, host: Pick<ts.LanguageServiceHost, "fileExists">, stopDirectory?: string): string[] {
    const paths: string[] = [];
    ts.forEachAncestorDirectory(startDirectory, ancestor => {
        if (ancestor === stopDirectory) {
            return true;
        }
        const currentConfigPath = ts.combinePaths(ancestor, "package.json");
        if (tryFileExists(host, currentConfigPath)) {
            paths.push(currentConfigPath);
        }
    });
    return paths;
}
/* @internal */
export function findPackageJson(directory: string, host: ts.LanguageServiceHost): string | undefined {
    let packageJson: string | undefined;
    ts.forEachAncestorDirectory(directory, ancestor => {
        if (ancestor === "node_modules")
            return true;
        packageJson = ts.findConfigFile(ancestor, (f) => tryFileExists(host, f), "package.json");
        if (packageJson) {
            return true; // break out
        }
    });
    return packageJson;
}
/* @internal */
export function getPackageJsonsVisibleToFile(fileName: string, host: ts.LanguageServiceHost): readonly ts.PackageJsonInfo[] {
    if (!host.fileExists) {
        return [];
    }
    const packageJsons: ts.PackageJsonInfo[] = [];
    ts.forEachAncestorDirectory(ts.getDirectoryPath(fileName), ancestor => {
        const packageJsonFileName = ts.combinePaths(ancestor, "package.json");
        if (host.fileExists!(packageJsonFileName)) {
            const info = createPackageJsonInfo(packageJsonFileName, host);
            if (info) {
                packageJsons.push(info);
            }
        }
    });
    return packageJsons;
}
/* @internal */
export function createPackageJsonInfo(fileName: string, host: ts.LanguageServiceHost): ts.PackageJsonInfo | false | undefined {
    if (!host.readFile) {
        return undefined;
    }
    type PackageJsonRaw = Record<typeof dependencyKeys[number], Record<string, string> | undefined>;
    const dependencyKeys = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"] as const;
    const stringContent = host.readFile(fileName);
    if (!stringContent)
        return undefined;
    const content = tryParseJson(stringContent) as PackageJsonRaw;
    if (!content)
        return false;
    const info: Pick<ts.PackageJsonInfo, typeof dependencyKeys[number]> = {};
    for (const key of dependencyKeys) {
        const dependencies = content[key];
        if (!dependencies) {
            continue;
        }
        const dependencyMap = ts.createMap<string>();
        for (const packageName in dependencies) {
            dependencyMap.set(packageName, dependencies[packageName]);
        }
        info[key] = dependencyMap;
    }
    const dependencyGroups = ([
        [ts.PackageJsonDependencyGroup.Dependencies, info.dependencies],
        [ts.PackageJsonDependencyGroup.DevDependencies, info.devDependencies],
        [ts.PackageJsonDependencyGroup.OptionalDependencies, info.optionalDependencies],
        [ts.PackageJsonDependencyGroup.PeerDependencies, info.peerDependencies],
    ] as const);
    return {
        ...info,
        fileName,
        get,
        has(dependencyName, inGroups) {
            return !!get(dependencyName, inGroups);
        },
    };
    function get(dependencyName: string, inGroups = ts.PackageJsonDependencyGroup.All) {
        for (const [group, deps] of dependencyGroups) {
            if (deps && (inGroups & group)) {
                const dep = deps.get(dependencyName);
                if (dep !== undefined) {
                    return dep;
                }
            }
        }
    }
}
/* @internal */
function tryParseJson(text: string) {
    try {
        return JSON.parse(text);
    }
    catch {
        return undefined;
    }
}
/* @internal */
export function consumesNodeCoreModules(sourceFile: ts.SourceFile): boolean {
    return ts.some(sourceFile.imports, ({ text }) => ts.JsTyping.nodeCoreModules.has(text));
}
/* @internal */
export function isInsideNodeModules(fileOrDirectory: string): boolean {
    return ts.contains(ts.getPathComponents(fileOrDirectory), "node_modules");
}
// #endregion
/* @internal */
/* @internal */
export function getRefactorContextSpan({ startPosition, endPosition }: ts.RefactorContext): ts.TextSpan {
    return ts.createTextSpanFromBounds(startPosition, endPosition === undefined ? startPosition : endPosition);
}
