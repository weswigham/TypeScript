import * as ts from "../ts";
/*@internal*/
interface FlattenContext {
    context: ts.TransformationContext;
    level: FlattenLevel;
    downlevelIteration: boolean;
    hoistTempVariables: boolean;
    emitExpression: (value: ts.Expression) => void;
    emitBindingOrAssignment: (target: ts.BindingOrAssignmentElementTarget, value: ts.Expression, location: ts.TextRange, original: ts.Node | undefined) => void;
    createArrayBindingOrAssignmentPattern: (elements: ts.BindingOrAssignmentElement[]) => ts.ArrayBindingOrAssignmentPattern;
    createObjectBindingOrAssignmentPattern: (elements: ts.BindingOrAssignmentElement[]) => ts.ObjectBindingOrAssignmentPattern;
    createArrayBindingOrAssignmentElement: (node: ts.Identifier) => ts.BindingOrAssignmentElement;
    visitor?: (node: ts.Node) => ts.VisitResult<ts.Node>;
}
/* @internal */
export const enum FlattenLevel {
    All,
    ObjectRest
}
/**
 * Flattens a DestructuringAssignment or a VariableDeclaration to an expression.
 *
 * @param node The node to flatten.
 * @param visitor An optional visitor used to visit initializers.
 * @param context The transformation context.
 * @param level Indicates the extent to which flattening should occur.
 * @param needsValue An optional value indicating whether the value from the right-hand-side of
 * the destructuring assignment is needed as part of a larger expression.
 * @param createAssignmentCallback An optional callback used to create the assignment expression.
 */
/* @internal */
export function flattenDestructuringAssignment(node: ts.VariableDeclaration | ts.DestructuringAssignment, visitor: ((node: ts.Node) => ts.VisitResult<ts.Node>) | undefined, context: ts.TransformationContext, level: FlattenLevel, needsValue?: boolean, createAssignmentCallback?: (name: ts.Identifier, value: ts.Expression, location?: ts.TextRange) => ts.Expression): ts.Expression {
    let location: ts.TextRange = node;
    let value: ts.Expression | undefined;
    if (ts.isDestructuringAssignment(node)) {
        value = node.right;
        while (ts.isEmptyArrayLiteral(node.left) || ts.isEmptyObjectLiteral(node.left)) {
            if (ts.isDestructuringAssignment(value)) {
                location = node = value;
                value = node.right;
            }
            else {
                return ts.visitNode(value, visitor, ts.isExpression);
            }
        }
    }
    let expressions: ts.Expression[] | undefined;
    const flattenContext: FlattenContext = {
        context,
        level,
        downlevelIteration: !!context.getCompilerOptions().downlevelIteration,
        hoistTempVariables: true,
        emitExpression,
        emitBindingOrAssignment,
        createArrayBindingOrAssignmentPattern: makeArrayAssignmentPattern,
        createObjectBindingOrAssignmentPattern: makeObjectAssignmentPattern,
        createArrayBindingOrAssignmentElement: makeAssignmentElement,
        visitor
    };
    if (value) {
        value = ts.visitNode(value, visitor, ts.isExpression);
        if (ts.isIdentifier(value) && bindingOrAssignmentElementAssignsToName(node, value.escapedText) ||
            bindingOrAssignmentElementContainsNonLiteralComputedName(node)) {
            // If the right-hand value of the assignment is also an assignment target then
            // we need to cache the right-hand value.
            value = ensureIdentifier(flattenContext, value, /*reuseIdentifierExpressions*/ false, location);
        }
        else if (needsValue) {
            // If the right-hand value of the destructuring assignment needs to be preserved (as
            // is the case when the destructuring assignment is part of a larger expression),
            // then we need to cache the right-hand value.
            //
            // The source map location for the assignment should point to the entire binary
            // expression.
            value = ensureIdentifier(flattenContext, value, /*reuseIdentifierExpressions*/ true, location);
        }
        else if (ts.nodeIsSynthesized(node)) {
            // Generally, the source map location for a destructuring assignment is the root
            // expression.
            //
            // However, if the root expression is synthesized (as in the case
            // of the initializer when transforming a ForOfStatement), then the source map
            // location should point to the right-hand value of the expression.
            location = value;
        }
    }
    flattenBindingOrAssignmentElement(flattenContext, node, value, location, /*skipInitializer*/ ts.isDestructuringAssignment(node));
    if (value && needsValue) {
        if (!ts.some(expressions)) {
            return value;
        }
        expressions.push(value);
    }
    return ts.aggregateTransformFlags(ts.inlineExpressions((expressions!))) || ts.createOmittedExpression();
    function emitExpression(expression: ts.Expression) {
        // NOTE: this completely disables source maps, but aligns with the behavior of
        //       `emitAssignment` in the old emitter.
        ts.setEmitFlags(expression, ts.EmitFlags.NoNestedSourceMaps);
        ts.aggregateTransformFlags(expression);
        expressions = ts.append(expressions, expression);
    }
    function emitBindingOrAssignment(target: ts.BindingOrAssignmentElementTarget, value: ts.Expression, location: ts.TextRange, original: ts.Node) {
        ts.Debug.assertNode(target, createAssignmentCallback ? ts.isIdentifier : ts.isExpression);
        const expression = createAssignmentCallback
            ? createAssignmentCallback((<ts.Identifier>target), value, location)
            : ts.setTextRange(ts.createAssignment(ts.visitNode((<ts.Expression>target), visitor, ts.isExpression), value), location);
        expression.original = original;
        emitExpression(expression);
    }
}
/* @internal */
function bindingOrAssignmentElementAssignsToName(element: ts.BindingOrAssignmentElement, escapedName: ts.__String): boolean {
    const target = (ts.getTargetOfBindingOrAssignmentElement(element)!); // TODO: GH#18217
    if (ts.isBindingOrAssignmentPattern(target)) {
        return bindingOrAssignmentPatternAssignsToName(target, escapedName);
    }
    else if (ts.isIdentifier(target)) {
        return target.escapedText === escapedName;
    }
    return false;
}
/* @internal */
function bindingOrAssignmentPatternAssignsToName(pattern: ts.BindingOrAssignmentPattern, escapedName: ts.__String): boolean {
    const elements = ts.getElementsOfBindingOrAssignmentPattern(pattern);
    for (const element of elements) {
        if (bindingOrAssignmentElementAssignsToName(element, escapedName)) {
            return true;
        }
    }
    return false;
}
/* @internal */
function bindingOrAssignmentElementContainsNonLiteralComputedName(element: ts.BindingOrAssignmentElement): boolean {
    const propertyName = ts.tryGetPropertyNameOfBindingOrAssignmentElement(element);
    if (propertyName && ts.isComputedPropertyName(propertyName) && !ts.isLiteralExpression(propertyName.expression)) {
        return true;
    }
    const target = ts.getTargetOfBindingOrAssignmentElement(element);
    return !!target && ts.isBindingOrAssignmentPattern(target) && bindingOrAssignmentPatternContainsNonLiteralComputedName(target);
}
/* @internal */
function bindingOrAssignmentPatternContainsNonLiteralComputedName(pattern: ts.BindingOrAssignmentPattern): boolean {
    return !!ts.forEach(ts.getElementsOfBindingOrAssignmentPattern(pattern), bindingOrAssignmentElementContainsNonLiteralComputedName);
}
/**
 * Flattens a VariableDeclaration or ParameterDeclaration to one or more variable declarations.
 *
 * @param node The node to flatten.
 * @param visitor An optional visitor used to visit initializers.
 * @param context The transformation context.
 * @param boundValue The value bound to the declaration.
 * @param skipInitializer A value indicating whether to ignore the initializer of `node`.
 * @param hoistTempVariables Indicates whether temporary variables should not be recorded in-line.
 * @param level Indicates the extent to which flattening should occur.
 */
/* @internal */
export function flattenDestructuringBinding(node: ts.VariableDeclaration | ts.ParameterDeclaration, visitor: (node: ts.Node) => ts.VisitResult<ts.Node>, context: ts.TransformationContext, level: FlattenLevel, rval?: ts.Expression, hoistTempVariables = false, skipInitializer?: boolean): ts.VariableDeclaration[] {
    let pendingExpressions: ts.Expression[] | undefined;
    const pendingDeclarations: {
        pendingExpressions?: ts.Expression[];
        name: ts.BindingName;
        value: ts.Expression;
        location?: ts.TextRange;
        original?: ts.Node;
    }[] = [];
    const declarations: ts.VariableDeclaration[] = [];
    const flattenContext: FlattenContext = {
        context,
        level,
        downlevelIteration: !!context.getCompilerOptions().downlevelIteration,
        hoistTempVariables,
        emitExpression,
        emitBindingOrAssignment,
        createArrayBindingOrAssignmentPattern: makeArrayBindingPattern,
        createObjectBindingOrAssignmentPattern: makeObjectBindingPattern,
        createArrayBindingOrAssignmentElement: makeBindingElement,
        visitor
    };
    if (ts.isVariableDeclaration(node)) {
        let initializer = ts.getInitializerOfBindingOrAssignmentElement(node);
        if (initializer && (ts.isIdentifier(initializer) && bindingOrAssignmentElementAssignsToName(node, initializer.escapedText) ||
            bindingOrAssignmentElementContainsNonLiteralComputedName(node))) {
            // If the right-hand value of the assignment is also an assignment target then
            // we need to cache the right-hand value.
            initializer = ensureIdentifier(flattenContext, initializer, /*reuseIdentifierExpressions*/ false, initializer);
            node = ts.updateVariableDeclaration(node, node.name, node.type, initializer);
        }
    }
    flattenBindingOrAssignmentElement(flattenContext, node, rval, node, skipInitializer);
    if (pendingExpressions) {
        const temp = ts.createTempVariable(/*recordTempVariable*/ undefined);
        if (hoistTempVariables) {
            const value = ts.inlineExpressions(pendingExpressions);
            pendingExpressions = undefined;
            emitBindingOrAssignment(temp, value, /*location*/ undefined, /*original*/ undefined);
        }
        else {
            context.hoistVariableDeclaration(temp);
            const pendingDeclaration = ts.last(pendingDeclarations);
            pendingDeclaration.pendingExpressions = ts.append(pendingDeclaration.pendingExpressions, ts.createAssignment(temp, pendingDeclaration.value));
            ts.addRange(pendingDeclaration.pendingExpressions, pendingExpressions);
            pendingDeclaration.value = temp;
        }
    }
    for (const { pendingExpressions, name, value, location, original } of pendingDeclarations) {
        const variable = ts.createVariableDeclaration(name, 
        /*type*/ undefined, pendingExpressions ? ts.inlineExpressions(ts.append(pendingExpressions, value)) : value);
        variable.original = original;
        ts.setTextRange(variable, location);
        if (ts.isIdentifier(name)) {
            ts.setEmitFlags(variable, ts.EmitFlags.NoNestedSourceMaps);
        }
        ts.aggregateTransformFlags(variable);
        declarations.push(variable);
    }
    return declarations;
    function emitExpression(value: ts.Expression) {
        pendingExpressions = ts.append(pendingExpressions, value);
    }
    function emitBindingOrAssignment(target: ts.BindingOrAssignmentElementTarget, value: ts.Expression, location: ts.TextRange | undefined, original: ts.Node | undefined) {
        ts.Debug.assertNode(target, ts.isBindingName);
        if (pendingExpressions) {
            value = ts.inlineExpressions(ts.append(pendingExpressions, value));
            pendingExpressions = undefined;
        }
        pendingDeclarations.push({ pendingExpressions, name: (<ts.BindingName>target), value, location, original });
    }
}
/**
 * Flattens a BindingOrAssignmentElement into zero or more bindings or assignments.
 *
 * @param flattenContext Options used to control flattening.
 * @param element The element to flatten.
 * @param value The current RHS value to assign to the element.
 * @param location The location to use for source maps and comments.
 * @param skipInitializer An optional value indicating whether to include the initializer
 * for the element.
 */
/* @internal */
function flattenBindingOrAssignmentElement(flattenContext: FlattenContext, element: ts.BindingOrAssignmentElement, value: ts.Expression | undefined, location: ts.TextRange, skipInitializer?: boolean) {
    if (!skipInitializer) {
        const initializer = ts.visitNode(ts.getInitializerOfBindingOrAssignmentElement(element), flattenContext.visitor, ts.isExpression);
        if (initializer) {
            // Combine value and initializer
            value = value ? createDefaultValueCheck(flattenContext, value, initializer, location) : initializer;
        }
        else if (!value) {
            // Use 'void 0' in absence of value and initializer
            value = ts.createVoidZero();
        }
    }
    const bindingTarget = (ts.getTargetOfBindingOrAssignmentElement(element)!); // TODO: GH#18217
    if (ts.isObjectBindingOrAssignmentPattern(bindingTarget)) {
        flattenObjectBindingOrAssignmentPattern(flattenContext, element, bindingTarget, value!, location);
    }
    else if (ts.isArrayBindingOrAssignmentPattern(bindingTarget)) {
        flattenArrayBindingOrAssignmentPattern(flattenContext, element, bindingTarget, value!, location);
    }
    else {
        flattenContext.emitBindingOrAssignment(bindingTarget, value!, location, /*original*/ element); // TODO: GH#18217
    }
}
/**
 * Flattens an ObjectBindingOrAssignmentPattern into zero or more bindings or assignments.
 *
 * @param flattenContext Options used to control flattening.
 * @param parent The parent element of the pattern.
 * @param pattern The ObjectBindingOrAssignmentPattern to flatten.
 * @param value The current RHS value to assign to the element.
 * @param location The location to use for source maps and comments.
 */
/* @internal */
function flattenObjectBindingOrAssignmentPattern(flattenContext: FlattenContext, parent: ts.BindingOrAssignmentElement, pattern: ts.ObjectBindingOrAssignmentPattern, value: ts.Expression, location: ts.TextRange) {
    const elements = ts.getElementsOfBindingOrAssignmentPattern(pattern);
    const numElements = elements.length;
    if (numElements !== 1) {
        // For anything other than a single-element destructuring we need to generate a temporary
        // to ensure value is evaluated exactly once. Additionally, if we have zero elements
        // we need to emit *something* to ensure that in case a 'var' keyword was already emitted,
        // so in that case, we'll intentionally create that temporary.
        const reuseIdentifierExpressions = !ts.isDeclarationBindingElement(parent) || numElements !== 0;
        value = ensureIdentifier(flattenContext, value, reuseIdentifierExpressions, location);
    }
    let bindingElements: ts.BindingOrAssignmentElement[] | undefined;
    let computedTempVariables: ts.Expression[] | undefined;
    for (let i = 0; i < numElements; i++) {
        const element = elements[i];
        if (!ts.getRestIndicatorOfBindingOrAssignmentElement(element)) {
            const propertyName = (ts.getPropertyNameOfBindingOrAssignmentElement(element)!);
            if (flattenContext.level >= FlattenLevel.ObjectRest
                && !(element.transformFlags & (ts.TransformFlags.ContainsRestOrSpread | ts.TransformFlags.ContainsObjectRestOrSpread))
                && !(ts.getTargetOfBindingOrAssignmentElement(element)!.transformFlags & (ts.TransformFlags.ContainsRestOrSpread | ts.TransformFlags.ContainsObjectRestOrSpread))
                && !ts.isComputedPropertyName(propertyName)) {
                bindingElements = ts.append(bindingElements, element);
            }
            else {
                if (bindingElements) {
                    flattenContext.emitBindingOrAssignment(flattenContext.createObjectBindingOrAssignmentPattern(bindingElements), value, location, pattern);
                    bindingElements = undefined;
                }
                const rhsValue = createDestructuringPropertyAccess(flattenContext, value, propertyName);
                if (ts.isComputedPropertyName(propertyName)) {
                    computedTempVariables = ts.append<ts.Expression>(computedTempVariables, (rhsValue as ts.ElementAccessExpression).argumentExpression);
                }
                flattenBindingOrAssignmentElement(flattenContext, element, rhsValue, /*location*/ element);
            }
        }
        else if (i === numElements - 1) {
            if (bindingElements) {
                flattenContext.emitBindingOrAssignment(flattenContext.createObjectBindingOrAssignmentPattern(bindingElements), value, location, pattern);
                bindingElements = undefined;
            }
            const rhsValue = createRestCall(flattenContext.context, value, elements, computedTempVariables!, pattern); // TODO: GH#18217
            flattenBindingOrAssignmentElement(flattenContext, element, rhsValue, element);
        }
    }
    if (bindingElements) {
        flattenContext.emitBindingOrAssignment(flattenContext.createObjectBindingOrAssignmentPattern(bindingElements), value, location, pattern);
    }
}
/**
 * Flattens an ArrayBindingOrAssignmentPattern into zero or more bindings or assignments.
 *
 * @param flattenContext Options used to control flattening.
 * @param parent The parent element of the pattern.
 * @param pattern The ArrayBindingOrAssignmentPattern to flatten.
 * @param value The current RHS value to assign to the element.
 * @param location The location to use for source maps and comments.
 */
/* @internal */
function flattenArrayBindingOrAssignmentPattern(flattenContext: FlattenContext, parent: ts.BindingOrAssignmentElement, pattern: ts.ArrayBindingOrAssignmentPattern, value: ts.Expression, location: ts.TextRange) {
    const elements = ts.getElementsOfBindingOrAssignmentPattern(pattern);
    const numElements = elements.length;
    if (flattenContext.level < FlattenLevel.ObjectRest && flattenContext.downlevelIteration) {
        // Read the elements of the iterable into an array
        value = ensureIdentifier(flattenContext, ts.createReadHelper(flattenContext.context, value, numElements > 0 && ts.getRestIndicatorOfBindingOrAssignmentElement(elements[numElements - 1])
            ? undefined
            : numElements, location), 
        /*reuseIdentifierExpressions*/ false, location);
    }
    else if (numElements !== 1 && (flattenContext.level < FlattenLevel.ObjectRest || numElements === 0)
        || ts.every(elements, ts.isOmittedExpression)) {
        // For anything other than a single-element destructuring we need to generate a temporary
        // to ensure value is evaluated exactly once. Additionally, if we have zero elements
        // we need to emit *something* to ensure that in case a 'var' keyword was already emitted,
        // so in that case, we'll intentionally create that temporary.
        // Or all the elements of the binding pattern are omitted expression such as "var [,] = [1,2]",
        // then we will create temporary variable.
        const reuseIdentifierExpressions = !ts.isDeclarationBindingElement(parent) || numElements !== 0;
        value = ensureIdentifier(flattenContext, value, reuseIdentifierExpressions, location);
    }
    let bindingElements: ts.BindingOrAssignmentElement[] | undefined;
    let restContainingElements: [ts.Identifier, ts.BindingOrAssignmentElement][] | undefined;
    for (let i = 0; i < numElements; i++) {
        const element = elements[i];
        if (flattenContext.level >= FlattenLevel.ObjectRest) {
            // If an array pattern contains an ObjectRest, we must cache the result so that we
            // can perform the ObjectRest destructuring in a different declaration
            if (element.transformFlags & ts.TransformFlags.ContainsObjectRestOrSpread) {
                const temp = ts.createTempVariable(/*recordTempVariable*/ undefined);
                if (flattenContext.hoistTempVariables) {
                    flattenContext.context.hoistVariableDeclaration(temp);
                }
                restContainingElements = ts.append(restContainingElements, (<[ts.Identifier, ts.BindingOrAssignmentElement]>[temp, element]));
                bindingElements = ts.append(bindingElements, flattenContext.createArrayBindingOrAssignmentElement(temp));
            }
            else {
                bindingElements = ts.append(bindingElements, element);
            }
        }
        else if (ts.isOmittedExpression(element)) {
            continue;
        }
        else if (!ts.getRestIndicatorOfBindingOrAssignmentElement(element)) {
            const rhsValue = ts.createElementAccess(value, i);
            flattenBindingOrAssignmentElement(flattenContext, element, rhsValue, /*location*/ element);
        }
        else if (i === numElements - 1) {
            const rhsValue = ts.createArraySlice(value, i);
            flattenBindingOrAssignmentElement(flattenContext, element, rhsValue, /*location*/ element);
        }
    }
    if (bindingElements) {
        flattenContext.emitBindingOrAssignment(flattenContext.createArrayBindingOrAssignmentPattern(bindingElements), value, location, pattern);
    }
    if (restContainingElements) {
        for (const [id, element] of restContainingElements) {
            flattenBindingOrAssignmentElement(flattenContext, element, id, element);
        }
    }
}
/**
 * Creates an expression used to provide a default value if a value is `undefined` at runtime.
 *
 * @param flattenContext Options used to control flattening.
 * @param value The RHS value to test.
 * @param defaultValue The default value to use if `value` is `undefined` at runtime.
 * @param location The location to use for source maps and comments.
 */
/* @internal */
function createDefaultValueCheck(flattenContext: FlattenContext, value: ts.Expression, defaultValue: ts.Expression, location: ts.TextRange): ts.Expression {
    value = ensureIdentifier(flattenContext, value, /*reuseIdentifierExpressions*/ true, location);
    return ts.createConditional(ts.createTypeCheck(value, "undefined"), defaultValue, value);
}
/**
 * Creates either a PropertyAccessExpression or an ElementAccessExpression for the
 * right-hand side of a transformed destructuring assignment.
 *
 * @link https://tc39.github.io/ecma262/#sec-runtime-semantics-keyeddestructuringassignmentevaluation
 *
 * @param flattenContext Options used to control flattening.
 * @param value The RHS value that is the source of the property.
 * @param propertyName The destructuring property name.
 */
/* @internal */
function createDestructuringPropertyAccess(flattenContext: FlattenContext, value: ts.Expression, propertyName: ts.PropertyName): ts.LeftHandSideExpression {
    if (ts.isComputedPropertyName(propertyName)) {
        const argumentExpression = ensureIdentifier(flattenContext, ts.visitNode(propertyName.expression, flattenContext.visitor), /*reuseIdentifierExpressions*/ false, /*location*/ propertyName);
        return ts.createElementAccess(value, argumentExpression);
    }
    else if (ts.isStringOrNumericLiteralLike(propertyName)) {
        const argumentExpression = ts.getSynthesizedClone(propertyName);
        argumentExpression.text = argumentExpression.text;
        return ts.createElementAccess(value, argumentExpression);
    }
    else {
        const name = ts.createIdentifier(ts.idText(propertyName));
        return ts.createPropertyAccess(value, name);
    }
}
/**
 * Ensures that there exists a declared identifier whose value holds the given expression.
 * This function is useful to ensure that the expression's value can be read from in subsequent expressions.
 * Unless 'reuseIdentifierExpressions' is false, 'value' will be returned if it is just an identifier.
 *
 * @param flattenContext Options used to control flattening.
 * @param value the expression whose value needs to be bound.
 * @param reuseIdentifierExpressions true if identifier expressions can simply be returned;
 * false if it is necessary to always emit an identifier.
 * @param location The location to use for source maps and comments.
 */
/* @internal */
function ensureIdentifier(flattenContext: FlattenContext, value: ts.Expression, reuseIdentifierExpressions: boolean, location: ts.TextRange) {
    if (ts.isIdentifier(value) && reuseIdentifierExpressions) {
        return value;
    }
    else {
        const temp = ts.createTempVariable(/*recordTempVariable*/ undefined);
        if (flattenContext.hoistTempVariables) {
            flattenContext.context.hoistVariableDeclaration(temp);
            flattenContext.emitExpression(ts.setTextRange(ts.createAssignment(temp, value), location));
        }
        else {
            flattenContext.emitBindingOrAssignment(temp, value, location, /*original*/ undefined);
        }
        return temp;
    }
}
/* @internal */
function makeArrayBindingPattern(elements: ts.BindingOrAssignmentElement[]) {
    ts.Debug.assertEachNode(elements, ts.isArrayBindingElement);
    return ts.createArrayBindingPattern((<ts.ArrayBindingElement[]>elements));
}
/* @internal */
function makeArrayAssignmentPattern(elements: ts.BindingOrAssignmentElement[]) {
    return ts.createArrayLiteral(ts.map(elements, ts.convertToArrayAssignmentElement));
}
/* @internal */
function makeObjectBindingPattern(elements: ts.BindingOrAssignmentElement[]) {
    ts.Debug.assertEachNode(elements, ts.isBindingElement);
    return ts.createObjectBindingPattern((<ts.BindingElement[]>elements));
}
/* @internal */
function makeObjectAssignmentPattern(elements: ts.BindingOrAssignmentElement[]) {
    return ts.createObjectLiteral(ts.map(elements, ts.convertToObjectAssignmentElement));
}
/* @internal */
function makeBindingElement(name: ts.Identifier) {
    return ts.createBindingElement(/*dotDotDotToken*/ undefined, /*propertyName*/ undefined, name);
}
/* @internal */
function makeAssignmentElement(name: ts.Identifier) {
    return name;
}
/* @internal */
export const restHelper: ts.UnscopedEmitHelper = {
    name: "typescript:rest",
    importName: "__rest",
    scoped: false,
    text: `
            var __rest = (this && this.__rest) || function (s, e) {
                var t = {};
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
                    t[p] = s[p];
                if (s != null && typeof Object.getOwnPropertySymbols === "function")
                    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                            t[p[i]] = s[p[i]];
                    }
                return t;
            };`
};
/** Given value: o, propName: p, pattern: { a, b, ...p } from the original statement
 * `{ a, b, ...p } = o`, create `p = __rest(o, ["a", "b"]);`
 */
/* @internal */
function createRestCall(context: ts.TransformationContext, value: ts.Expression, elements: readonly ts.BindingOrAssignmentElement[], computedTempVariables: readonly ts.Expression[], location: ts.TextRange): ts.Expression {
    context.requestEmitHelper(restHelper);
    const propertyNames: ts.Expression[] = [];
    let computedTempVariableOffset = 0;
    for (let i = 0; i < elements.length - 1; i++) {
        const propertyName = ts.getPropertyNameOfBindingOrAssignmentElement(elements[i]);
        if (propertyName) {
            if (ts.isComputedPropertyName(propertyName)) {
                const temp = computedTempVariables[computedTempVariableOffset];
                computedTempVariableOffset++;
                // typeof _tmp === "symbol" ? _tmp : _tmp + ""
                propertyNames.push(ts.createConditional(ts.createTypeCheck(temp, "symbol"), temp, ts.createAdd(temp, ts.createLiteral(""))));
            }
            else {
                propertyNames.push(ts.createLiteral(propertyName));
            }
        }
    }
    return ts.createCall(ts.getUnscopedHelperName("__rest"), 
    /*typeArguments*/ undefined, [
        value,
        ts.setTextRange(ts.createArrayLiteral(propertyNames), location)
    ]);
}
