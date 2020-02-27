import { TransformationContext, TaggedTemplateExpression, Node, VisitResult, SourceFile, Identifier, visitNode, isExpression, Expression, hasInvalidEscape, isNoSubstitutionTemplateLiteral, createArrayLiteral, isExternalModule, createUniqueName, createLogicalOr, createAssignment, createCall, TemplateHead, TemplateMiddle, TemplateTail, NoSubstitutionTemplateLiteral, createIdentifier, createLiteral, LiteralLikeNode, getSourceTextOfNodeFromSourceFile, SyntaxKind, setTextRange, ArrayLiteralExpression, getUnscopedHelperName, UnscopedEmitHelper } from "../ts";
/*@internal*/
export enum ProcessLevel {
    LiftRestriction,
    All
}
/* @internal */
export function processTaggedTemplateExpression(context: TransformationContext, node: TaggedTemplateExpression, visitor: ((node: Node) => VisitResult<Node>) | undefined, currentSourceFile: SourceFile, recordTaggedTemplateString: (temp: Identifier) => void, level: ProcessLevel) {
    // Visit the tag expression
    const tag = visitNode(node.tag, visitor, isExpression);
    // Build up the template arguments and the raw and cooked strings for the template.
    // We start out with 'undefined' for the first argument and revisit later
    // to avoid walking over the template string twice and shifting all our arguments over after the fact.
    const templateArguments: Expression[] = [undefined!];
    const cookedStrings: Expression[] = [];
    const rawStrings: Expression[] = [];
    const template = node.template;
    if (level === ProcessLevel.LiftRestriction && !hasInvalidEscape(template))
        return node;
    if (isNoSubstitutionTemplateLiteral(template)) {
        cookedStrings.push(createTemplateCooked(template));
        rawStrings.push(getRawLiteral(template, currentSourceFile));
    }
    else {
        cookedStrings.push(createTemplateCooked(template.head));
        rawStrings.push(getRawLiteral(template.head, currentSourceFile));
        for (const templateSpan of template.templateSpans) {
            cookedStrings.push(createTemplateCooked(templateSpan.literal));
            rawStrings.push(getRawLiteral(templateSpan.literal, currentSourceFile));
            templateArguments.push(visitNode(templateSpan.expression, visitor, isExpression));
        }
    }
    const helperCall = createTemplateObjectHelper(context, createArrayLiteral(cookedStrings), createArrayLiteral(rawStrings));
    // Create a variable to cache the template object if we're in a module.
    // Do not do this in the global scope, as any variable we currently generate could conflict with
    // variables from outside of the current compilation. In the future, we can revisit this behavior.
    if (isExternalModule(currentSourceFile)) {
        const tempVar = createUniqueName("templateObject");
        recordTaggedTemplateString(tempVar);
        templateArguments[0] = createLogicalOr(tempVar, createAssignment(tempVar, helperCall));
    }
    else {
        templateArguments[0] = helperCall;
    }
    return createCall(tag, /*typeArguments*/ undefined, templateArguments);
}
/* @internal */
function createTemplateCooked(template: TemplateHead | TemplateMiddle | TemplateTail | NoSubstitutionTemplateLiteral) {
    return template.templateFlags ? createIdentifier("undefined") : createLiteral(template.text);
}
/**
 * Creates an ES5 compatible literal from an ES6 template literal.
 *
 * @param node The ES6 template literal.
 */
/* @internal */
function getRawLiteral(node: LiteralLikeNode, currentSourceFile: SourceFile) {
    // Find original source text, since we need to emit the raw strings of the tagged template.
    // The raw strings contain the (escaped) strings of what the user wrote.
    // Examples: `\n` is converted to "\\n", a template string with a newline to "\n".
    let text = getSourceTextOfNodeFromSourceFile(currentSourceFile, node);
    // text contains the original source, it will also contain quotes ("`"), dolar signs and braces ("${" and "}"),
    // thus we need to remove those characters.
    // First template piece starts with "`", others with "}"
    // Last template piece ends with "`", others with "${"
    const isLast = node.kind === SyntaxKind.NoSubstitutionTemplateLiteral || node.kind === SyntaxKind.TemplateTail;
    text = text.substring(1, text.length - (isLast ? 1 : 2));
    // Newline normalization:
    // ES6 Spec 11.8.6.1 - Static Semantics of TV's and TRV's
    // <CR><LF> and <CR> LineTerminatorSequences are normalized to <LF> for both TV and TRV.
    text = text.replace(/\r\n?/g, "\n");
    return setTextRange(createLiteral(text), node);
}
/* @internal */
function createTemplateObjectHelper(context: TransformationContext, cooked: ArrayLiteralExpression, raw: ArrayLiteralExpression) {
    context.requestEmitHelper(templateObjectHelper);
    return createCall(getUnscopedHelperName("__makeTemplateObject"), 
    /*typeArguments*/ undefined, [
        cooked,
        raw
    ]);
}
/* @internal */
export const templateObjectHelper: UnscopedEmitHelper = {
    name: "typescript:makeTemplateObject",
    importName: "__makeTemplateObject",
    scoped: false,
    priority: 0,
    text: `
            var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
                if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
                return cooked;
            };`
};
