import * as ts from "./ts";
/* @internal */
const jsDocTagNames = [
    "abstract",
    "access",
    "alias",
    "argument",
    "async",
    "augments",
    "author",
    "borrows",
    "callback",
    "class",
    "classdesc",
    "constant",
    "constructor",
    "constructs",
    "copyright",
    "default",
    "deprecated",
    "description",
    "emits",
    "enum",
    "event",
    "example",
    "exports",
    "extends",
    "external",
    "field",
    "file",
    "fileoverview",
    "fires",
    "function",
    "generator",
    "global",
    "hideconstructor",
    "host",
    "ignore",
    "implements",
    "inheritdoc",
    "inner",
    "instance",
    "interface",
    "kind",
    "lends",
    "license",
    "listens",
    "member",
    "memberof",
    "method",
    "mixes",
    "module",
    "name",
    "namespace",
    "override",
    "package",
    "param",
    "private",
    "property",
    "protected",
    "public",
    "readonly",
    "requires",
    "returns",
    "see",
    "since",
    "static",
    "summary",
    "template",
    "this",
    "throws",
    "todo",
    "tutorial",
    "type",
    "typedef",
    "var",
    "variation",
    "version",
    "virtual",
    "yields"
];
/* @internal */
let jsDocTagNameCompletionEntries: ts.CompletionEntry[];
/* @internal */
let jsDocTagCompletionEntries: ts.CompletionEntry[];
/* @internal */
export function getJsDocCommentsFromDeclarations(declarations: readonly ts.Declaration[]): ts.SymbolDisplayPart[] {
    // Only collect doc comments from duplicate declarations once:
    // In case of a union property there might be same declaration multiple times
    // which only varies in type parameter
    // Eg. const a: Array<string> | Array<number>; a.length
    // The property length will have two declarations of property length coming
    // from Array<T> - Array<string> and Array<number>
    const documentationComment: ts.SymbolDisplayPart[] = [];
    ts.forEachUnique(declarations, declaration => {
        for (const { comment } of getCommentHavingNodes(declaration)) {
            if (comment === undefined)
                continue;
            if (documentationComment.length) {
                documentationComment.push(ts.lineBreakPart());
            }
            documentationComment.push(ts.textPart(comment));
        }
    });
    return documentationComment;
}
/* @internal */
function getCommentHavingNodes(declaration: ts.Declaration): readonly (ts.JSDoc | ts.JSDocTag)[] {
    switch (declaration.kind) {
        case ts.SyntaxKind.JSDocParameterTag:
        case ts.SyntaxKind.JSDocPropertyTag:
            return [(declaration as ts.JSDocPropertyTag)];
        case ts.SyntaxKind.JSDocCallbackTag:
        case ts.SyntaxKind.JSDocTypedefTag:
            return [(declaration as ts.JSDocTypedefTag), (declaration as ts.JSDocTypedefTag).parent];
        default:
            return ts.getJSDocCommentsAndTags(declaration);
    }
}
/* @internal */
export function getJsDocTagsFromDeclarations(declarations?: ts.Declaration[]): ts.JSDocTagInfo[] {
    // Only collect doc comments from duplicate declarations once.
    const tags: ts.JSDocTagInfo[] = [];
    ts.forEachUnique(declarations, declaration => {
        for (const tag of ts.getJSDocTags(declaration)) {
            tags.push({ name: tag.tagName.text, text: getCommentText(tag) });
        }
    });
    return tags;
}
/* @internal */
function getCommentText(tag: ts.JSDocTag): string | undefined {
    const { comment } = tag;
    switch (tag.kind) {
        case ts.SyntaxKind.JSDocAugmentsTag:
            return withNode((tag as ts.JSDocAugmentsTag).class);
        case ts.SyntaxKind.JSDocTemplateTag:
            return withList((tag as ts.JSDocTemplateTag).typeParameters);
        case ts.SyntaxKind.JSDocTypeTag:
            return withNode((tag as ts.JSDocTypeTag).typeExpression);
        case ts.SyntaxKind.JSDocTypedefTag:
        case ts.SyntaxKind.JSDocCallbackTag:
        case ts.SyntaxKind.JSDocPropertyTag:
        case ts.SyntaxKind.JSDocParameterTag:
            const { name } = (tag as ts.JSDocTypedefTag | ts.JSDocPropertyTag | ts.JSDocParameterTag);
            return name ? withNode(name) : comment;
        default:
            return comment;
    }
    function withNode(node: ts.Node) {
        return addComment(node.getText());
    }
    function withList(list: ts.NodeArray<ts.Node>): string {
        return addComment(list.map(x => x.getText()).join(", "));
    }
    function addComment(s: string) {
        return comment === undefined ? s : `${s} ${comment}`;
    }
}
/* @internal */
export function getJSDocTagNameCompletions(): ts.CompletionEntry[] {
    return jsDocTagNameCompletionEntries || (jsDocTagNameCompletionEntries = ts.map(jsDocTagNames, tagName => {
        return {
            name: tagName,
            kind: ts.ScriptElementKind.keyword,
            kindModifiers: "",
            sortText: "0",
        };
    }));
}
/* @internal */
export const getJSDocTagNameCompletionDetails = getJSDocTagCompletionDetails;
/* @internal */
export function getJSDocTagCompletions(): ts.CompletionEntry[] {
    return jsDocTagCompletionEntries || (jsDocTagCompletionEntries = ts.map(jsDocTagNames, tagName => {
        return {
            name: `@${tagName}`,
            kind: ts.ScriptElementKind.keyword,
            kindModifiers: "",
            sortText: "0"
        };
    }));
}
/* @internal */
export function getJSDocTagCompletionDetails(name: string): ts.CompletionEntryDetails {
    return {
        name,
        kind: ts.ScriptElementKind.unknown,
        kindModifiers: "",
        displayParts: [ts.textPart(name)],
        documentation: ts.emptyArray,
        tags: undefined,
        codeActions: undefined,
    };
}
/* @internal */
export function getJSDocParameterNameCompletions(tag: ts.JSDocParameterTag): ts.CompletionEntry[] {
    if (!ts.isIdentifier(tag.name)) {
        return ts.emptyArray;
    }
    const nameThusFar = tag.name.text;
    const jsdoc = tag.parent;
    const fn = jsdoc.parent;
    if (!ts.isFunctionLike(fn))
        return [];
    return ts.mapDefined(fn.parameters, param => {
        if (!ts.isIdentifier(param.name))
            return undefined;
        const name = param.name.text;
        if (jsdoc.tags!.some(t => t !== tag && ts.isJSDocParameterTag(t) && ts.isIdentifier(t.name) && t.name.escapedText === name) // TODO: GH#18217
            || nameThusFar !== undefined && !ts.startsWith(name, nameThusFar)) {
            return undefined;
        }
        return { name, kind: ts.ScriptElementKind.parameterElement, kindModifiers: "", sortText: "0" };
    });
}
/* @internal */
export function getJSDocParameterNameCompletionDetails(name: string): ts.CompletionEntryDetails {
    return {
        name,
        kind: ts.ScriptElementKind.parameterElement,
        kindModifiers: "",
        displayParts: [ts.textPart(name)],
        documentation: ts.emptyArray,
        tags: undefined,
        codeActions: undefined,
    };
}
/**
 * Checks if position points to a valid position to add JSDoc comments, and if so,
 * returns the appropriate template. Otherwise returns an empty string.
 * Valid positions are
 *      - outside of comments, statements, and expressions, and
 *      - preceding a:
 *          - function/constructor/method declaration
 *          - class declarations
 *          - variable statements
 *          - namespace declarations
 *          - interface declarations
 *          - method signatures
 *          - type alias declarations
 *
 * Hosts should ideally check that:
 * - The line is all whitespace up to 'position' before performing the insertion.
 * - If the keystroke sequence "/\*\*" induced the call, we also check that the next
 * non-whitespace character is '*', which (approximately) indicates whether we added
 * the second '*' to complete an existing (JSDoc) comment.
 * @param fileName The file in which to perform the check.
 * @param position The (character-indexed) position in the file where the check should
 * be performed.
 */
/* @internal */
export function getDocCommentTemplateAtPosition(newLine: string, sourceFile: ts.SourceFile, position: number): ts.TextInsertion | undefined {
    const tokenAtPos = ts.getTokenAtPosition(sourceFile, position);
    const existingDocComment = ts.findAncestor(tokenAtPos, ts.isJSDoc);
    if (existingDocComment && (existingDocComment.comment !== undefined || ts.length(existingDocComment.tags))) {
        // Non-empty comment already exists.
        return undefined;
    }
    const tokenStart = tokenAtPos.getStart(sourceFile);
    // Don't provide a doc comment template based on a *previous* node. (But an existing empty jsdoc comment will likely start before `position`.)
    if (!existingDocComment && tokenStart < position) {
        return undefined;
    }
    const commentOwnerInfo = getCommentOwnerInfo(tokenAtPos);
    if (!commentOwnerInfo) {
        return undefined;
    }
    const { commentOwner, parameters } = commentOwnerInfo;
    if (commentOwner.getStart(sourceFile) < position) {
        return undefined;
    }
    if (!parameters || parameters.length === 0) {
        // if there are no parameters, just complete to a single line JSDoc comment
        const singleLineResult = "/** */";
        return { newText: singleLineResult, caretOffset: 3 };
    }
    const indentationStr = getIndentationStringAtPosition(sourceFile, position);
    // A doc comment consists of the following
    // * The opening comment line
    // * the first line (without a param) for the object's untagged info (this is also where the caret ends up)
    // * the '@param'-tagged lines
    // * TODO: other tags.
    // * the closing comment line
    // * if the caret was directly in front of the object, then we add an extra line and indentation.
    const preamble = "/**" + newLine + indentationStr + " * ";
    const result = preamble + newLine +
        parameterDocComments(parameters, ts.hasJSFileExtension(sourceFile.fileName), indentationStr, newLine) +
        indentationStr + " */" +
        (tokenStart === position ? newLine + indentationStr : "");
    return { newText: result, caretOffset: preamble.length };
}
/* @internal */
function getIndentationStringAtPosition(sourceFile: ts.SourceFile, position: number): string {
    const { text } = sourceFile;
    const lineStart = ts.getLineStartPositionForPosition(position, sourceFile);
    let pos = lineStart;
    for (; pos <= position && ts.isWhiteSpaceSingleLine(text.charCodeAt(pos)); pos++)
        ;
    return text.slice(lineStart, pos);
}
/* @internal */
function parameterDocComments(parameters: readonly ts.ParameterDeclaration[], isJavaScriptFile: boolean, indentationStr: string, newLine: string): string {
    return parameters.map(({ name, dotDotDotToken }, i) => {
        const paramName = name.kind === ts.SyntaxKind.Identifier ? name.text : "param" + i;
        const type = isJavaScriptFile ? (dotDotDotToken ? "{...any} " : "{any} ") : "";
        return `${indentationStr} * @param ${type}${paramName}${newLine}`;
    }).join("");
}
/* @internal */
interface CommentOwnerInfo {
    readonly commentOwner: ts.Node;
    readonly parameters?: readonly ts.ParameterDeclaration[];
}
/* @internal */
function getCommentOwnerInfo(tokenAtPos: ts.Node): CommentOwnerInfo | undefined {
    return ts.forEachAncestor(tokenAtPos, getCommentOwnerInfoWorker);
}
/* @internal */
function getCommentOwnerInfoWorker(commentOwner: ts.Node): CommentOwnerInfo | undefined | "quit" {
    switch (commentOwner.kind) {
        case ts.SyntaxKind.FunctionDeclaration:
        case ts.SyntaxKind.FunctionExpression:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.Constructor:
        case ts.SyntaxKind.MethodSignature:
            const { parameters } = (commentOwner as ts.FunctionDeclaration | ts.MethodDeclaration | ts.ConstructorDeclaration | ts.MethodSignature);
            return { commentOwner, parameters };
        case ts.SyntaxKind.PropertyAssignment:
            return getCommentOwnerInfoWorker((commentOwner as ts.PropertyAssignment).initializer);
        case ts.SyntaxKind.ClassDeclaration:
        case ts.SyntaxKind.InterfaceDeclaration:
        case ts.SyntaxKind.PropertySignature:
        case ts.SyntaxKind.EnumDeclaration:
        case ts.SyntaxKind.EnumMember:
        case ts.SyntaxKind.TypeAliasDeclaration:
            return { commentOwner };
        case ts.SyntaxKind.VariableStatement: {
            const varStatement = (<ts.VariableStatement>commentOwner);
            const varDeclarations = varStatement.declarationList.declarations;
            const parameters = varDeclarations.length === 1 && varDeclarations[0].initializer
                ? getParametersFromRightHandSideOfAssignment(varDeclarations[0].initializer)
                : undefined;
            return { commentOwner, parameters };
        }
        case ts.SyntaxKind.SourceFile:
            return "quit";
        case ts.SyntaxKind.ModuleDeclaration:
            // If in walking up the tree, we hit a a nested namespace declaration,
            // then we must be somewhere within a dotted namespace name; however we don't
            // want to give back a JSDoc template for the 'b' or 'c' in 'namespace a.b.c { }'.
            return commentOwner.parent.kind === ts.SyntaxKind.ModuleDeclaration ? undefined : { commentOwner };
        case ts.SyntaxKind.BinaryExpression: {
            const be = (commentOwner as ts.BinaryExpression);
            if (ts.getAssignmentDeclarationKind(be) === ts.AssignmentDeclarationKind.None) {
                return "quit";
            }
            const parameters = ts.isFunctionLike(be.right) ? be.right.parameters : ts.emptyArray;
            return { commentOwner, parameters };
        }
    }
}
/**
 * Digs into an an initializer or RHS operand of an assignment operation
 * to get the parameters of an apt signature corresponding to a
 * function expression or a class expression.
 *
 * @param rightHandSide the expression which may contain an appropriate set of parameters
 * @returns the parameters of a signature found on the RHS if one exists; otherwise 'emptyArray'.
 */
/* @internal */
function getParametersFromRightHandSideOfAssignment(rightHandSide: ts.Expression): readonly ts.ParameterDeclaration[] {
    while (rightHandSide.kind === ts.SyntaxKind.ParenthesizedExpression) {
        rightHandSide = (<ts.ParenthesizedExpression>rightHandSide).expression;
    }
    switch (rightHandSide.kind) {
        case ts.SyntaxKind.FunctionExpression:
        case ts.SyntaxKind.ArrowFunction:
            return (<ts.FunctionExpression>rightHandSide).parameters;
        case ts.SyntaxKind.ClassExpression: {
            const ctr = ts.find((rightHandSide as ts.ClassExpression).members, ts.isConstructorDeclaration);
            return ctr ? ctr.parameters : ts.emptyArray;
        }
    }
    return ts.emptyArray;
}
