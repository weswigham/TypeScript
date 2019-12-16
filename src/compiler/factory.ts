/* @internal */
namespace ts {
    export const nullTransformationContext: ts.TransformationContext = {
        enableEmitNotification: ts.noop,
        enableSubstitution: ts.noop,
        endLexicalEnvironment: ts.returnUndefined,
        getCompilerOptions: ts.notImplemented,
        getEmitHost: ts.notImplemented,
        getEmitResolver: ts.notImplemented,
        hoistFunctionDeclaration: ts.noop,
        hoistVariableDeclaration: ts.noop,
        isEmitNotificationEnabled: ts.notImplemented,
        isSubstitutionEnabled: ts.notImplemented,
        onEmitNode: ts.noop,
        onSubstituteNode: ts.notImplemented,
        readEmitHelpers: ts.notImplemented,
        requestEmitHelper: ts.noop,
        resumeLexicalEnvironment: ts.noop,
        startLexicalEnvironment: ts.noop,
        suspendLexicalEnvironment: ts.noop,
        addDiagnostic: ts.noop,
    };
    // Compound nodes
    export type TypeOfTag = "undefined" | "number" | "boolean" | "string" | "symbol" | "object" | "function";
    export function createTypeCheck(value: ts.Expression, tag: TypeOfTag) {
        return tag === "undefined"
            ? ts.createStrictEquality(value, ts.createVoidZero())
            : ts.createStrictEquality(ts.createTypeOf(value), ts.createLiteral(tag));
    }
    export function createMemberAccessForPropertyName(target: ts.Expression, memberName: ts.PropertyName, location?: ts.TextRange): ts.MemberExpression {
        if (ts.isComputedPropertyName(memberName)) {
            return ts.setTextRange(ts.createElementAccess(target, memberName.expression), location);
        }
        else {
            const expression = ts.setTextRange(ts.isIdentifier(memberName)
                ? ts.createPropertyAccess(target, memberName)
                : ts.createElementAccess(target, memberName), memberName);
            ts.getOrCreateEmitNode(expression).flags |= ts.EmitFlags.NoNestedSourceMaps;
            return expression;
        }
    }
    export function createFunctionCall(func: ts.Expression, thisArg: ts.Expression, argumentsList: readonly ts.Expression[], location?: ts.TextRange) {
        return ts.setTextRange(ts.createCall(ts.createPropertyAccess(func, "call"), 
        /*typeArguments*/ undefined, [
            thisArg,
            ...argumentsList
        ]), location);
    }
    export function createFunctionApply(func: ts.Expression, thisArg: ts.Expression, argumentsExpression: ts.Expression, location?: ts.TextRange) {
        return ts.setTextRange(ts.createCall(ts.createPropertyAccess(func, "apply"), 
        /*typeArguments*/ undefined, [
            thisArg,
            argumentsExpression
        ]), location);
    }
    export function createArraySlice(array: ts.Expression, start?: number | ts.Expression) {
        const argumentsList: ts.Expression[] = [];
        if (start !== undefined) {
            argumentsList.push(typeof start === "number" ? ts.createLiteral(start) : start);
        }
        return ts.createCall(ts.createPropertyAccess(array, "slice"), /*typeArguments*/ undefined, argumentsList);
    }
    export function createArrayConcat(array: ts.Expression, values: readonly ts.Expression[]) {
        return ts.createCall(ts.createPropertyAccess(array, "concat"), 
        /*typeArguments*/ undefined, values);
    }
    export function createMathPow(left: ts.Expression, right: ts.Expression, location?: ts.TextRange) {
        return ts.setTextRange(ts.createCall(ts.createPropertyAccess(ts.createIdentifier("Math"), "pow"), 
        /*typeArguments*/ undefined, [left, right]), location);
    }
    function createReactNamespace(reactNamespace: string, parent: ts.JsxOpeningLikeElement | ts.JsxOpeningFragment) {
        // To ensure the emit resolver can properly resolve the namespace, we need to
        // treat this identifier as if it were a source tree node by clearing the `Synthesized`
        // flag and setting a parent node.
        const react = ts.createIdentifier(reactNamespace || "React");
        react.flags &= ~ts.NodeFlags.Synthesized;
        // Set the parent that is in parse tree
        // this makes sure that parent chain is intact for checker to traverse complete scope tree
        react.parent = ts.getParseTreeNode(parent);
        return react;
    }
    function createJsxFactoryExpressionFromEntityName(jsxFactory: ts.EntityName, parent: ts.JsxOpeningLikeElement | ts.JsxOpeningFragment): ts.Expression {
        if (ts.isQualifiedName(jsxFactory)) {
            const left = createJsxFactoryExpressionFromEntityName(jsxFactory.left, parent);
            const right = ts.createIdentifier(ts.idText(jsxFactory.right));
            right.escapedText = jsxFactory.right.escapedText;
            return ts.createPropertyAccess(left, right);
        }
        else {
            return createReactNamespace(ts.idText(jsxFactory), parent);
        }
    }
    function createJsxFactoryExpression(jsxFactoryEntity: ts.EntityName | undefined, reactNamespace: string, parent: ts.JsxOpeningLikeElement | ts.JsxOpeningFragment): ts.Expression {
        return jsxFactoryEntity ?
            createJsxFactoryExpressionFromEntityName(jsxFactoryEntity, parent) :
            ts.createPropertyAccess(createReactNamespace(reactNamespace, parent), "createElement");
    }
    export function createExpressionForJsxElement(jsxFactoryEntity: ts.EntityName | undefined, reactNamespace: string, tagName: ts.Expression, props: ts.Expression, children: readonly ts.Expression[], parentElement: ts.JsxOpeningLikeElement, location: ts.TextRange): ts.LeftHandSideExpression {
        const argumentsList = [tagName];
        if (props) {
            argumentsList.push(props);
        }
        if (children && children.length > 0) {
            if (!props) {
                argumentsList.push(ts.createNull());
            }
            if (children.length > 1) {
                for (const child of children) {
                    startOnNewLine(child);
                    argumentsList.push(child);
                }
            }
            else {
                argumentsList.push(children[0]);
            }
        }
        return ts.setTextRange(ts.createCall(createJsxFactoryExpression(jsxFactoryEntity, reactNamespace, parentElement), 
        /*typeArguments*/ undefined, argumentsList), location);
    }
    export function createExpressionForJsxFragment(jsxFactoryEntity: ts.EntityName | undefined, reactNamespace: string, children: readonly ts.Expression[], parentElement: ts.JsxOpeningFragment, location: ts.TextRange): ts.LeftHandSideExpression {
        const tagName = ts.createPropertyAccess(createReactNamespace(reactNamespace, parentElement), "Fragment");
        const argumentsList = [(<ts.Expression>tagName)];
        argumentsList.push(ts.createNull());
        if (children && children.length > 0) {
            if (children.length > 1) {
                for (const child of children) {
                    startOnNewLine(child);
                    argumentsList.push(child);
                }
            }
            else {
                argumentsList.push(children[0]);
            }
        }
        return ts.setTextRange(ts.createCall(createJsxFactoryExpression(jsxFactoryEntity, reactNamespace, parentElement), 
        /*typeArguments*/ undefined, argumentsList), location);
    }
    // Helpers
    /**
     * Gets an identifier for the name of an *unscoped* emit helper.
     */
    export function getUnscopedHelperName(name: string) {
        return ts.setEmitFlags(ts.createIdentifier(name), ts.EmitFlags.HelperName | ts.EmitFlags.AdviseOnEmitNode);
    }
    export const valuesHelper: ts.UnscopedEmitHelper = {
        name: "typescript:values",
        importName: "__values",
        scoped: false,
        text: `
            var __values = (this && this.__values) || function(o) {
                var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
                if (m) return m.call(o);
                if (o && typeof o.length === "number") return {
                    next: function () {
                        if (o && i >= o.length) o = void 0;
                        return { value: o && o[i++], done: !o };
                    }
                };
                throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
            };`
    };
    export function createValuesHelper(context: ts.TransformationContext, expression: ts.Expression, location?: ts.TextRange) {
        context.requestEmitHelper(valuesHelper);
        return ts.setTextRange(ts.createCall(getUnscopedHelperName("__values"), 
        /*typeArguments*/ undefined, [expression]), location);
    }
    export const readHelper: ts.UnscopedEmitHelper = {
        name: "typescript:read",
        importName: "__read",
        scoped: false,
        text: `
            var __read = (this && this.__read) || function (o, n) {
                var m = typeof Symbol === "function" && o[Symbol.iterator];
                if (!m) return o;
                var i = m.call(o), r, ar = [], e;
                try {
                    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
                }
                catch (error) { e = { error: error }; }
                finally {
                    try {
                        if (r && !r.done && (m = i["return"])) m.call(i);
                    }
                    finally { if (e) throw e.error; }
                }
                return ar;
            };`
    };
    export function createReadHelper(context: ts.TransformationContext, iteratorRecord: ts.Expression, count: number | undefined, location?: ts.TextRange) {
        context.requestEmitHelper(readHelper);
        return ts.setTextRange(ts.createCall(getUnscopedHelperName("__read"), 
        /*typeArguments*/ undefined, count !== undefined
            ? [iteratorRecord, ts.createLiteral(count)]
            : [iteratorRecord]), location);
    }
    export const spreadHelper: ts.UnscopedEmitHelper = {
        name: "typescript:spread",
        importName: "__spread",
        scoped: false,
        text: `
            var __spread = (this && this.__spread) || function () {
                for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
                return ar;
            };`
    };
    export function createSpreadHelper(context: ts.TransformationContext, argumentList: readonly ts.Expression[], location?: ts.TextRange) {
        context.requestEmitHelper(readHelper);
        context.requestEmitHelper(spreadHelper);
        return ts.setTextRange(ts.createCall(getUnscopedHelperName("__spread"), 
        /*typeArguments*/ undefined, argumentList), location);
    }
    export const spreadArraysHelper: ts.UnscopedEmitHelper = {
        name: "typescript:spreadArrays",
        importName: "__spreadArrays",
        scoped: false,
        text: `
            var __spreadArrays = (this && this.__spreadArrays) || function () {
                for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
                for (var r = Array(s), k = 0, i = 0; i < il; i++)
                    for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                        r[k] = a[j];
                return r;
            };`
    };
    export function createSpreadArraysHelper(context: ts.TransformationContext, argumentList: readonly ts.Expression[], location?: ts.TextRange) {
        context.requestEmitHelper(spreadArraysHelper);
        return ts.setTextRange(ts.createCall(getUnscopedHelperName("__spreadArrays"), 
        /*typeArguments*/ undefined, argumentList), location);
    }
    // Utilities
    export function createForOfBindingStatement(node: ts.ForInitializer, boundValue: ts.Expression): ts.Statement {
        if (ts.isVariableDeclarationList(node)) {
            const firstDeclaration = ts.first(node.declarations);
            const updatedDeclaration = ts.updateVariableDeclaration(firstDeclaration, firstDeclaration.name, 
            /*typeNode*/ undefined, boundValue);
            return ts.setTextRange(ts.createVariableStatement(
            /*modifiers*/ undefined, ts.updateVariableDeclarationList(node, [updatedDeclaration])), 
            /*location*/ node);
        }
        else {
            const updatedExpression = ts.setTextRange(ts.createAssignment(node, boundValue), /*location*/ node);
            return ts.setTextRange(ts.createStatement(updatedExpression), /*location*/ node);
        }
    }
    export function insertLeadingStatement(dest: ts.Statement, source: ts.Statement) {
        if (ts.isBlock(dest)) {
            return ts.updateBlock(dest, ts.setTextRange(ts.createNodeArray([source, ...dest.statements]), dest.statements));
        }
        else {
            return ts.createBlock(ts.createNodeArray([dest, source]), /*multiLine*/ true);
        }
    }
    export function restoreEnclosingLabel(node: ts.Statement, outermostLabeledStatement: ts.LabeledStatement | undefined, afterRestoreLabelCallback?: (node: ts.LabeledStatement) => void): ts.Statement {
        if (!outermostLabeledStatement) {
            return node;
        }
        const updated = ts.updateLabel(outermostLabeledStatement, outermostLabeledStatement.label, outermostLabeledStatement.statement.kind === ts.SyntaxKind.LabeledStatement
            ? restoreEnclosingLabel(node, (<ts.LabeledStatement>outermostLabeledStatement.statement))
            : node);
        if (afterRestoreLabelCallback) {
            afterRestoreLabelCallback(outermostLabeledStatement);
        }
        return updated;
    }
    export interface CallBinding {
        target: ts.LeftHandSideExpression;
        thisArg: ts.Expression;
    }
    function shouldBeCapturedInTempVariable(node: ts.Expression, cacheIdentifiers: boolean): boolean {
        const target = ts.skipParentheses(node);
        switch (target.kind) {
            case ts.SyntaxKind.Identifier:
                return cacheIdentifiers;
            case ts.SyntaxKind.ThisKeyword:
            case ts.SyntaxKind.NumericLiteral:
            case ts.SyntaxKind.BigIntLiteral:
            case ts.SyntaxKind.StringLiteral:
                return false;
            case ts.SyntaxKind.ArrayLiteralExpression:
                const elements = (<ts.ArrayLiteralExpression>target).elements;
                if (elements.length === 0) {
                    return false;
                }
                return true;
            case ts.SyntaxKind.ObjectLiteralExpression:
                return (<ts.ObjectLiteralExpression>target).properties.length > 0;
            default:
                return true;
        }
    }
    export function createCallBinding(expression: ts.Expression, recordTempVariable: (temp: ts.Identifier) => void, languageVersion?: ts.ScriptTarget, cacheIdentifiers = false): CallBinding {
        const callee = skipOuterExpressions(expression, OuterExpressionKinds.All);
        let thisArg: ts.Expression;
        let target: ts.LeftHandSideExpression;
        if (ts.isSuperProperty(callee)) {
            thisArg = ts.createThis();
            target = callee;
        }
        else if (callee.kind === ts.SyntaxKind.SuperKeyword) {
            thisArg = ts.createThis();
            target = (languageVersion!) < ts.ScriptTarget.ES2015
                ? ts.setTextRange(ts.createIdentifier("_super"), callee)
                : <ts.PrimaryExpression>callee;
        }
        else if (ts.getEmitFlags(callee) & ts.EmitFlags.HelperName) {
            thisArg = ts.createVoidZero();
            target = parenthesizeForAccess(callee);
        }
        else {
            switch (callee.kind) {
                case ts.SyntaxKind.PropertyAccessExpression: {
                    if (shouldBeCapturedInTempVariable((<ts.PropertyAccessExpression>callee).expression, cacheIdentifiers)) {
                        // for `a.b()` target is `(_a = a).b` and thisArg is `_a`
                        thisArg = ts.createTempVariable(recordTempVariable);
                        target = ts.createPropertyAccess(ts.setTextRange(ts.createAssignment(thisArg, (<ts.PropertyAccessExpression>callee).expression), (<ts.PropertyAccessExpression>callee).expression), (<ts.PropertyAccessExpression>callee).name);
                        ts.setTextRange(target, callee);
                    }
                    else {
                        thisArg = (<ts.PropertyAccessExpression>callee).expression;
                        target = (<ts.PropertyAccessExpression>callee);
                    }
                    break;
                }
                case ts.SyntaxKind.ElementAccessExpression: {
                    if (shouldBeCapturedInTempVariable((<ts.ElementAccessExpression>callee).expression, cacheIdentifiers)) {
                        // for `a[b]()` target is `(_a = a)[b]` and thisArg is `_a`
                        thisArg = ts.createTempVariable(recordTempVariable);
                        target = ts.createElementAccess(ts.setTextRange(ts.createAssignment(thisArg, (<ts.ElementAccessExpression>callee).expression), (<ts.ElementAccessExpression>callee).expression), (<ts.ElementAccessExpression>callee).argumentExpression);
                        ts.setTextRange(target, callee);
                    }
                    else {
                        thisArg = (<ts.ElementAccessExpression>callee).expression;
                        target = (<ts.ElementAccessExpression>callee);
                    }
                    break;
                }
                default: {
                    // for `a()` target is `a` and thisArg is `void 0`
                    thisArg = ts.createVoidZero();
                    target = parenthesizeForAccess(expression);
                    break;
                }
            }
        }
        return { target, thisArg };
    }
    export function inlineExpressions(expressions: readonly ts.Expression[]) {
        // Avoid deeply nested comma expressions as traversing them during emit can result in "Maximum call
        // stack size exceeded" errors.
        return expressions.length > 10
            ? ts.createCommaList(expressions)
            : ts.reduceLeft(expressions, ts.createComma)!;
    }
    export function createExpressionFromEntityName(node: ts.EntityName | ts.Expression): ts.Expression {
        if (ts.isQualifiedName(node)) {
            const left = createExpressionFromEntityName(node.left);
            const right = ts.getMutableClone(node.right);
            return ts.setTextRange(ts.createPropertyAccess(left, right), node);
        }
        else {
            return ts.getMutableClone(node);
        }
    }
    export function createExpressionForPropertyName(memberName: ts.PropertyName): ts.Expression {
        if (ts.isIdentifier(memberName)) {
            return ts.createLiteral(memberName);
        }
        else if (ts.isComputedPropertyName(memberName)) {
            return ts.getMutableClone(memberName.expression);
        }
        else {
            return ts.getMutableClone(memberName);
        }
    }
    export function createExpressionForObjectLiteralElementLike(node: ts.ObjectLiteralExpression, property: ts.ObjectLiteralElementLike, receiver: ts.Expression): ts.Expression | undefined {
        switch (property.kind) {
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
                return createExpressionForAccessorDeclaration(node.properties, property, receiver, !!node.multiLine);
            case ts.SyntaxKind.PropertyAssignment:
                return createExpressionForPropertyAssignment(property, receiver);
            case ts.SyntaxKind.ShorthandPropertyAssignment:
                return createExpressionForShorthandPropertyAssignment(property, receiver);
            case ts.SyntaxKind.MethodDeclaration:
                return createExpressionForMethodDeclaration(property, receiver);
        }
    }
    function createExpressionForAccessorDeclaration(properties: ts.NodeArray<ts.Declaration>, property: ts.AccessorDeclaration, receiver: ts.Expression, multiLine: boolean) {
        const { firstAccessor, getAccessor, setAccessor } = ts.getAllAccessorDeclarations(properties, property);
        if (property === firstAccessor) {
            const properties: ts.ObjectLiteralElementLike[] = [];
            if (getAccessor) {
                const getterFunction = ts.createFunctionExpression(getAccessor.modifiers, 
                /*asteriskToken*/ undefined, 
                /*name*/ undefined, 
                /*typeParameters*/ undefined, getAccessor.parameters, 
                /*type*/ undefined, (getAccessor.body!) // TODO: GH#18217
                );
                ts.setTextRange(getterFunction, getAccessor);
                ts.setOriginalNode(getterFunction, getAccessor);
                const getter = ts.createPropertyAssignment("get", getterFunction);
                properties.push(getter);
            }
            if (setAccessor) {
                const setterFunction = ts.createFunctionExpression(setAccessor.modifiers, 
                /*asteriskToken*/ undefined, 
                /*name*/ undefined, 
                /*typeParameters*/ undefined, setAccessor.parameters, 
                /*type*/ undefined, (setAccessor.body!) // TODO: GH#18217
                );
                ts.setTextRange(setterFunction, setAccessor);
                ts.setOriginalNode(setterFunction, setAccessor);
                const setter = ts.createPropertyAssignment("set", setterFunction);
                properties.push(setter);
            }
            properties.push(ts.createPropertyAssignment("enumerable", ts.createTrue()));
            properties.push(ts.createPropertyAssignment("configurable", ts.createTrue()));
            const expression = ts.setTextRange(ts.createCall(ts.createPropertyAccess(ts.createIdentifier("Object"), "defineProperty"), 
            /*typeArguments*/ undefined, [
                receiver,
                createExpressionForPropertyName(property.name),
                ts.createObjectLiteral(properties, multiLine)
            ]), 
            /*location*/ firstAccessor);
            return ts.aggregateTransformFlags(expression);
        }
        return undefined;
    }
    function createExpressionForPropertyAssignment(property: ts.PropertyAssignment, receiver: ts.Expression) {
        return ts.aggregateTransformFlags(ts.setOriginalNode(ts.setTextRange(ts.createAssignment(createMemberAccessForPropertyName(receiver, property.name, /*location*/ property.name), property.initializer), property), property));
    }
    function createExpressionForShorthandPropertyAssignment(property: ts.ShorthandPropertyAssignment, receiver: ts.Expression) {
        return ts.aggregateTransformFlags(ts.setOriginalNode(ts.setTextRange(ts.createAssignment(createMemberAccessForPropertyName(receiver, property.name, /*location*/ property.name), ts.getSynthesizedClone(property.name)), 
        /*location*/ property), 
        /*original*/ property));
    }
    function createExpressionForMethodDeclaration(method: ts.MethodDeclaration, receiver: ts.Expression) {
        return ts.aggregateTransformFlags(ts.setOriginalNode(ts.setTextRange(ts.createAssignment(createMemberAccessForPropertyName(receiver, method.name, /*location*/ method.name), ts.setOriginalNode(ts.setTextRange(ts.createFunctionExpression(method.modifiers, method.asteriskToken, 
        /*name*/ undefined, 
        /*typeParameters*/ undefined, method.parameters, 
        /*type*/ undefined, (method.body!) // TODO: GH#18217
        ), 
        /*location*/ method), 
        /*original*/ method)), 
        /*location*/ method), 
        /*original*/ method));
    }
    /**
     * Gets the internal name of a declaration. This is primarily used for declarations that can be
     * referred to by name in the body of an ES5 class function body. An internal name will *never*
     * be prefixed with an module or namespace export modifier like "exports." when emitted as an
     * expression. An internal name will also *never* be renamed due to a collision with a block
     * scoped variable.
     *
     * @param node The declaration.
     * @param allowComments A value indicating whether comments may be emitted for the name.
     * @param allowSourceMaps A value indicating whether source maps may be emitted for the name.
     */
    export function getInternalName(node: ts.Declaration, allowComments?: boolean, allowSourceMaps?: boolean) {
        return getName(node, allowComments, allowSourceMaps, ts.EmitFlags.LocalName | ts.EmitFlags.InternalName);
    }
    /**
     * Gets whether an identifier should only be referred to by its internal name.
     */
    export function isInternalName(node: ts.Identifier) {
        return (ts.getEmitFlags(node) & ts.EmitFlags.InternalName) !== 0;
    }
    /**
     * Gets the local name of a declaration. This is primarily used for declarations that can be
     * referred to by name in the declaration's immediate scope (classes, enums, namespaces). A
     * local name will *never* be prefixed with an module or namespace export modifier like
     * "exports." when emitted as an expression.
     *
     * @param node The declaration.
     * @param allowComments A value indicating whether comments may be emitted for the name.
     * @param allowSourceMaps A value indicating whether source maps may be emitted for the name.
     */
    export function getLocalName(node: ts.Declaration, allowComments?: boolean, allowSourceMaps?: boolean) {
        return getName(node, allowComments, allowSourceMaps, ts.EmitFlags.LocalName);
    }
    /**
     * Gets whether an identifier should only be referred to by its local name.
     */
    export function isLocalName(node: ts.Identifier) {
        return (ts.getEmitFlags(node) & ts.EmitFlags.LocalName) !== 0;
    }
    /**
     * Gets the export name of a declaration. This is primarily used for declarations that can be
     * referred to by name in the declaration's immediate scope (classes, enums, namespaces). An
     * export name will *always* be prefixed with an module or namespace export modifier like
     * `"exports."` when emitted as an expression if the name points to an exported symbol.
     *
     * @param node The declaration.
     * @param allowComments A value indicating whether comments may be emitted for the name.
     * @param allowSourceMaps A value indicating whether source maps may be emitted for the name.
     */
    export function getExportName(node: ts.Declaration, allowComments?: boolean, allowSourceMaps?: boolean): ts.Identifier {
        return getName(node, allowComments, allowSourceMaps, ts.EmitFlags.ExportName);
    }
    /**
     * Gets whether an identifier should only be referred to by its export representation if the
     * name points to an exported symbol.
     */
    export function isExportName(node: ts.Identifier) {
        return (ts.getEmitFlags(node) & ts.EmitFlags.ExportName) !== 0;
    }
    /**
     * Gets the name of a declaration for use in declarations.
     *
     * @param node The declaration.
     * @param allowComments A value indicating whether comments may be emitted for the name.
     * @param allowSourceMaps A value indicating whether source maps may be emitted for the name.
     */
    export function getDeclarationName(node: ts.Declaration, allowComments?: boolean, allowSourceMaps?: boolean) {
        return getName(node, allowComments, allowSourceMaps);
    }
    function getName(node: ts.Declaration, allowComments?: boolean, allowSourceMaps?: boolean, emitFlags: ts.EmitFlags = 0) {
        const nodeName = ts.getNameOfDeclaration(node);
        if (nodeName && ts.isIdentifier(nodeName) && !ts.isGeneratedIdentifier(nodeName)) {
            const name = ts.getMutableClone(nodeName);
            emitFlags |= ts.getEmitFlags(nodeName);
            if (!allowSourceMaps)
                emitFlags |= ts.EmitFlags.NoSourceMap;
            if (!allowComments)
                emitFlags |= ts.EmitFlags.NoComments;
            if (emitFlags)
                ts.setEmitFlags(name, emitFlags);
            return name;
        }
        return ts.getGeneratedNameForNode(node);
    }
    /**
     * Gets the exported name of a declaration for use in expressions.
     *
     * An exported name will *always* be prefixed with an module or namespace export modifier like
     * "exports." if the name points to an exported symbol.
     *
     * @param ns The namespace identifier.
     * @param node The declaration.
     * @param allowComments A value indicating whether comments may be emitted for the name.
     * @param allowSourceMaps A value indicating whether source maps may be emitted for the name.
     */
    export function getExternalModuleOrNamespaceExportName(ns: ts.Identifier | undefined, node: ts.Declaration, allowComments?: boolean, allowSourceMaps?: boolean): ts.Identifier | ts.PropertyAccessExpression {
        if (ns && ts.hasModifier(node, ts.ModifierFlags.Export)) {
            return getNamespaceMemberName(ns, getName(node), allowComments, allowSourceMaps);
        }
        return getExportName(node, allowComments, allowSourceMaps);
    }
    /**
     * Gets a namespace-qualified name for use in expressions.
     *
     * @param ns The namespace identifier.
     * @param name The name.
     * @param allowComments A value indicating whether comments may be emitted for the name.
     * @param allowSourceMaps A value indicating whether source maps may be emitted for the name.
     */
    export function getNamespaceMemberName(ns: ts.Identifier, name: ts.Identifier, allowComments?: boolean, allowSourceMaps?: boolean): ts.PropertyAccessExpression {
        const qualifiedName = ts.createPropertyAccess(ns, ts.nodeIsSynthesized(name) ? name : ts.getSynthesizedClone(name));
        ts.setTextRange(qualifiedName, name);
        let emitFlags: ts.EmitFlags = 0;
        if (!allowSourceMaps)
            emitFlags |= ts.EmitFlags.NoSourceMap;
        if (!allowComments)
            emitFlags |= ts.EmitFlags.NoComments;
        if (emitFlags)
            ts.setEmitFlags(qualifiedName, emitFlags);
        return qualifiedName;
    }
    export function convertToFunctionBody(node: ts.ConciseBody, multiLine?: boolean): ts.Block {
        return ts.isBlock(node) ? node : ts.setTextRange(ts.createBlock([ts.setTextRange(ts.createReturn(node), node)], multiLine), node);
    }
    export function convertFunctionDeclarationToExpression(node: ts.FunctionDeclaration) {
        if (!node.body)
            return ts.Debug.fail();
        const updated = ts.createFunctionExpression(node.modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type, node.body);
        ts.setOriginalNode(updated, node);
        ts.setTextRange(updated, node);
        if (ts.getStartsOnNewLine(node)) {
            ts.setStartsOnNewLine(updated, /*newLine*/ true);
        }
        ts.aggregateTransformFlags(updated);
        return updated;
    }
    function isUseStrictPrologue(node: ts.ExpressionStatement): boolean {
        return ts.isStringLiteral(node.expression) && node.expression.text === "use strict";
    }
    /**
     * Add any necessary prologue-directives into target statement-array.
     * The function needs to be called during each transformation step.
     * This function needs to be called whenever we transform the statement
     * list of a source file, namespace, or function-like body.
     *
     * @param target: result statements array
     * @param source: origin statements array
     * @param ensureUseStrict: boolean determining whether the function need to add prologue-directives
     * @param visitor: Optional callback used to visit any custom prologue directives.
     */
    export function addPrologue(target: ts.Statement[], source: readonly ts.Statement[], ensureUseStrict?: boolean, visitor?: (node: ts.Node) => ts.VisitResult<ts.Node>): number {
        const offset = addStandardPrologue(target, source, ensureUseStrict);
        return addCustomPrologue(target, source, offset, visitor);
    }
    /**
     * Add just the standard (string-expression) prologue-directives into target statement-array.
     * The function needs to be called during each transformation step.
     * This function needs to be called whenever we transform the statement
     * list of a source file, namespace, or function-like body.
     */
    export function addStandardPrologue(target: ts.Statement[], source: readonly ts.Statement[], ensureUseStrict?: boolean): number {
        ts.Debug.assert(target.length === 0, "Prologue directives should be at the first statement in the target statements array");
        let foundUseStrict = false;
        let statementOffset = 0;
        const numStatements = source.length;
        while (statementOffset < numStatements) {
            const statement = source[statementOffset];
            if (ts.isPrologueDirective(statement)) {
                if (isUseStrictPrologue(statement)) {
                    foundUseStrict = true;
                }
                target.push(statement);
            }
            else {
                break;
            }
            statementOffset++;
        }
        if (ensureUseStrict && !foundUseStrict) {
            target.push(startOnNewLine(ts.createStatement(ts.createLiteral("use strict"))));
        }
        return statementOffset;
    }
    /**
     * Add just the custom prologue-directives into target statement-array.
     * The function needs to be called during each transformation step.
     * This function needs to be called whenever we transform the statement
     * list of a source file, namespace, or function-like body.
     */
    export function addCustomPrologue(target: ts.Statement[], source: readonly ts.Statement[], statementOffset: number, visitor?: (node: ts.Node) => ts.VisitResult<ts.Node>): number;
    export function addCustomPrologue(target: ts.Statement[], source: readonly ts.Statement[], statementOffset: number | undefined, visitor?: (node: ts.Node) => ts.VisitResult<ts.Node>): number | undefined;
    export function addCustomPrologue(target: ts.Statement[], source: readonly ts.Statement[], statementOffset: number | undefined, visitor?: (node: ts.Node) => ts.VisitResult<ts.Node>): number | undefined {
        const numStatements = source.length;
        while (statementOffset !== undefined && statementOffset < numStatements) {
            const statement = source[statementOffset];
            if (ts.getEmitFlags(statement) & ts.EmitFlags.CustomPrologue) {
                ts.append(target, visitor ? ts.visitNode(statement, visitor, ts.isStatement) : statement);
            }
            else {
                break;
            }
            statementOffset++;
        }
        return statementOffset;
    }
    export function findUseStrictPrologue(statements: readonly ts.Statement[]): ts.Statement | undefined {
        for (const statement of statements) {
            if (ts.isPrologueDirective(statement)) {
                if (isUseStrictPrologue(statement)) {
                    return statement;
                }
            }
            else {
                break;
            }
        }
        return undefined;
    }
    export function startsWithUseStrict(statements: readonly ts.Statement[]) {
        const firstStatement = ts.firstOrUndefined(statements);
        return firstStatement !== undefined
            && ts.isPrologueDirective(firstStatement)
            && isUseStrictPrologue(firstStatement);
    }
    /**
     * Ensures "use strict" directive is added
     *
     * @param statements An array of statements
     */
    export function ensureUseStrict(statements: ts.NodeArray<ts.Statement>): ts.NodeArray<ts.Statement> {
        const foundUseStrict = findUseStrictPrologue(statements);
        if (!foundUseStrict) {
            return ts.setTextRange(ts.createNodeArray<ts.Statement>([
                startOnNewLine(ts.createStatement(ts.createLiteral("use strict"))),
                ...statements
            ]), statements);
        }
        return statements;
    }
    /**
     * Wraps the operand to a BinaryExpression in parentheses if they are needed to preserve the intended
     * order of operations.
     *
     * @param binaryOperator The operator for the BinaryExpression.
     * @param operand The operand for the BinaryExpression.
     * @param isLeftSideOfBinary A value indicating whether the operand is the left side of the
     *                           BinaryExpression.
     */
    export function parenthesizeBinaryOperand(binaryOperator: ts.SyntaxKind, operand: ts.Expression, isLeftSideOfBinary: boolean, leftOperand?: ts.Expression) {
        const skipped = ts.skipPartiallyEmittedExpressions(operand);
        // If the resulting expression is already parenthesized, we do not need to do any further processing.
        if (skipped.kind === ts.SyntaxKind.ParenthesizedExpression) {
            return operand;
        }
        return binaryOperandNeedsParentheses(binaryOperator, operand, isLeftSideOfBinary, leftOperand)
            ? ts.createParen(operand)
            : operand;
    }
    /**
     * Determines whether the operand to a BinaryExpression needs to be parenthesized.
     *
     * @param binaryOperator The operator for the BinaryExpression.
     * @param operand The operand for the BinaryExpression.
     * @param isLeftSideOfBinary A value indicating whether the operand is the left side of the
     *                           BinaryExpression.
     */
    function binaryOperandNeedsParentheses(binaryOperator: ts.SyntaxKind, operand: ts.Expression, isLeftSideOfBinary: boolean, leftOperand: ts.Expression | undefined) {
        // If the operand has lower precedence, then it needs to be parenthesized to preserve the
        // intent of the expression. For example, if the operand is `a + b` and the operator is
        // `*`, then we need to parenthesize the operand to preserve the intended order of
        // operations: `(a + b) * x`.
        //
        // If the operand has higher precedence, then it does not need to be parenthesized. For
        // example, if the operand is `a * b` and the operator is `+`, then we do not need to
        // parenthesize to preserve the intended order of operations: `a * b + x`.
        //
        // If the operand has the same precedence, then we need to check the associativity of
        // the operator based on whether this is the left or right operand of the expression.
        //
        // For example, if `a / d` is on the right of operator `*`, we need to parenthesize
        // to preserve the intended order of operations: `x * (a / d)`
        //
        // If `a ** d` is on the left of operator `**`, we need to parenthesize to preserve
        // the intended order of operations: `(a ** b) ** c`
        const binaryOperatorPrecedence = ts.getOperatorPrecedence(ts.SyntaxKind.BinaryExpression, binaryOperator);
        const binaryOperatorAssociativity = ts.getOperatorAssociativity(ts.SyntaxKind.BinaryExpression, binaryOperator);
        const emittedOperand = ts.skipPartiallyEmittedExpressions(operand);
        if (!isLeftSideOfBinary && operand.kind === ts.SyntaxKind.ArrowFunction && binaryOperatorPrecedence > 3) {
            // We need to parenthesize arrow functions on the right side to avoid it being
            // parsed as parenthesized expression: `a && (() => {})`
            return true;
        }
        const operandPrecedence = ts.getExpressionPrecedence(emittedOperand);
        switch (ts.compareValues(operandPrecedence, binaryOperatorPrecedence)) {
            case ts.Comparison.LessThan:
                // If the operand is the right side of a right-associative binary operation
                // and is a yield expression, then we do not need parentheses.
                if (!isLeftSideOfBinary
                    && binaryOperatorAssociativity === ts.Associativity.Right
                    && operand.kind === ts.SyntaxKind.YieldExpression) {
                    return false;
                }
                return true;
            case ts.Comparison.GreaterThan:
                return false;
            case ts.Comparison.EqualTo:
                if (isLeftSideOfBinary) {
                    // No need to parenthesize the left operand when the binary operator is
                    // left associative:
                    //  (a*b)/x    -> a*b/x
                    //  (a**b)/x   -> a**b/x
                    //
                    // Parentheses are needed for the left operand when the binary operator is
                    // right associative:
                    //  (a/b)**x   -> (a/b)**x
                    //  (a**b)**x  -> (a**b)**x
                    return binaryOperatorAssociativity === ts.Associativity.Right;
                }
                else {
                    if (ts.isBinaryExpression(emittedOperand)
                        && emittedOperand.operatorToken.kind === binaryOperator) {
                        // No need to parenthesize the right operand when the binary operator and
                        // operand are the same and one of the following:
                        //  x*(a*b)     => x*a*b
                        //  x|(a|b)     => x|a|b
                        //  x&(a&b)     => x&a&b
                        //  x^(a^b)     => x^a^b
                        if (operatorHasAssociativeProperty(binaryOperator)) {
                            return false;
                        }
                        // No need to parenthesize the right operand when the binary operator
                        // is plus (+) if both the left and right operands consist solely of either
                        // literals of the same kind or binary plus (+) expressions for literals of
                        // the same kind (recursively).
                        //  "a"+(1+2)       => "a"+(1+2)
                        //  "a"+("b"+"c")   => "a"+"b"+"c"
                        if (binaryOperator === ts.SyntaxKind.PlusToken) {
                            const leftKind = leftOperand ? getLiteralKindOfBinaryPlusOperand(leftOperand) : ts.SyntaxKind.Unknown;
                            if (ts.isLiteralKind(leftKind) && leftKind === getLiteralKindOfBinaryPlusOperand(emittedOperand)) {
                                return false;
                            }
                        }
                    }
                    // No need to parenthesize the right operand when the operand is right
                    // associative:
                    //  x/(a**b)    -> x/a**b
                    //  x**(a**b)   -> x**a**b
                    //
                    // Parentheses are needed for the right operand when the operand is left
                    // associative:
                    //  x/(a*b)     -> x/(a*b)
                    //  x**(a/b)    -> x**(a/b)
                    const operandAssociativity = ts.getExpressionAssociativity(emittedOperand);
                    return operandAssociativity === ts.Associativity.Left;
                }
        }
    }
    /**
     * Determines whether a binary operator is mathematically associative.
     *
     * @param binaryOperator The binary operator.
     */
    function operatorHasAssociativeProperty(binaryOperator: ts.SyntaxKind) {
        // The following operators are associative in JavaScript:
        //  (a*b)*c     -> a*(b*c)  -> a*b*c
        //  (a|b)|c     -> a|(b|c)  -> a|b|c
        //  (a&b)&c     -> a&(b&c)  -> a&b&c
        //  (a^b)^c     -> a^(b^c)  -> a^b^c
        //
        // While addition is associative in mathematics, JavaScript's `+` is not
        // guaranteed to be associative as it is overloaded with string concatenation.
        return binaryOperator === ts.SyntaxKind.AsteriskToken
            || binaryOperator === ts.SyntaxKind.BarToken
            || binaryOperator === ts.SyntaxKind.AmpersandToken
            || binaryOperator === ts.SyntaxKind.CaretToken;
    }
    interface BinaryPlusExpression extends ts.BinaryExpression {
        cachedLiteralKind: ts.SyntaxKind;
    }
    /**
     * This function determines whether an expression consists of a homogeneous set of
     * literal expressions or binary plus expressions that all share the same literal kind.
     * It is used to determine whether the right-hand operand of a binary plus expression can be
     * emitted without parentheses.
     */
    function getLiteralKindOfBinaryPlusOperand(node: ts.Expression): ts.SyntaxKind {
        node = ts.skipPartiallyEmittedExpressions(node);
        if (ts.isLiteralKind(node.kind)) {
            return node.kind;
        }
        if (node.kind === ts.SyntaxKind.BinaryExpression && (<ts.BinaryExpression>node).operatorToken.kind === ts.SyntaxKind.PlusToken) {
            if ((<BinaryPlusExpression>node).cachedLiteralKind !== undefined) {
                return (<BinaryPlusExpression>node).cachedLiteralKind;
            }
            const leftKind = getLiteralKindOfBinaryPlusOperand((<ts.BinaryExpression>node).left);
            const literalKind = ts.isLiteralKind(leftKind) && leftKind === getLiteralKindOfBinaryPlusOperand((<ts.BinaryExpression>node).right) ? leftKind :
                ts.SyntaxKind.Unknown;
            (<BinaryPlusExpression>node).cachedLiteralKind = literalKind;
            return literalKind;
        }
        return ts.SyntaxKind.Unknown;
    }
    export function parenthesizeForConditionalHead(condition: ts.Expression) {
        const conditionalPrecedence = ts.getOperatorPrecedence(ts.SyntaxKind.ConditionalExpression, ts.SyntaxKind.QuestionToken);
        const emittedCondition = ts.skipPartiallyEmittedExpressions(condition);
        const conditionPrecedence = ts.getExpressionPrecedence(emittedCondition);
        if (ts.compareValues(conditionPrecedence, conditionalPrecedence) !== ts.Comparison.GreaterThan) {
            return ts.createParen(condition);
        }
        return condition;
    }
    export function parenthesizeSubexpressionOfConditionalExpression(e: ts.Expression): ts.Expression {
        // per ES grammar both 'whenTrue' and 'whenFalse' parts of conditional expression are assignment expressions
        // so in case when comma expression is introduced as a part of previous transformations
        // if should be wrapped in parens since comma operator has the lowest precedence
        const emittedExpression = ts.skipPartiallyEmittedExpressions(e);
        return isCommaSequence(emittedExpression)
            ? ts.createParen(e)
            : e;
    }
    /**
     *  [Per the spec](https://tc39.github.io/ecma262/#prod-ExportDeclaration), `export default` accepts _AssigmentExpression_ but
     *  has a lookahead restriction for `function`, `async function`, and `class`.
     *
     * Basically, that means we need to parenthesize in the following cases:
     *
     * - BinaryExpression of CommaToken
     * - CommaList (synthetic list of multiple comma expressions)
     * - FunctionExpression
     * - ClassExpression
     */
    export function parenthesizeDefaultExpression(e: ts.Expression) {
        const check = ts.skipPartiallyEmittedExpressions(e);
        let needsParens = isCommaSequence(check);
        if (!needsParens) {
            switch (getLeftmostExpression(check, /*stopAtCallExpression*/ false).kind) {
                case ts.SyntaxKind.ClassExpression:
                case ts.SyntaxKind.FunctionExpression:
                    needsParens = true;
            }
        }
        return needsParens ? ts.createParen(e) : e;
    }
    /**
     * Wraps an expression in parentheses if it is needed in order to use the expression
     * as the expression of a NewExpression node.
     *
     * @param expression The Expression node.
     */
    export function parenthesizeForNew(expression: ts.Expression): ts.LeftHandSideExpression {
        const leftmostExpr = getLeftmostExpression(expression, /*stopAtCallExpressions*/ true);
        switch (leftmostExpr.kind) {
            case ts.SyntaxKind.CallExpression:
                return ts.createParen(expression);
            case ts.SyntaxKind.NewExpression:
                return !(leftmostExpr as ts.NewExpression).arguments
                    ? ts.createParen(expression)
                    : <ts.LeftHandSideExpression>expression;
        }
        return parenthesizeForAccess(expression);
    }
    /**
     * Wraps an expression in parentheses if it is needed in order to use the expression for
     * property or element access.
     *
     * @param expr The expression node.
     */
    export function parenthesizeForAccess(expression: ts.Expression): ts.LeftHandSideExpression {
        // isLeftHandSideExpression is almost the correct criterion for when it is not necessary
        // to parenthesize the expression before a dot. The known exception is:
        //
        //    NewExpression:
        //       new C.x        -> not the same as (new C).x
        //
        const emittedExpression = ts.skipPartiallyEmittedExpressions(expression);
        if (ts.isLeftHandSideExpression(emittedExpression)
            && (emittedExpression.kind !== ts.SyntaxKind.NewExpression || (<ts.NewExpression>emittedExpression).arguments)) {
            return <ts.LeftHandSideExpression>expression;
        }
        return ts.setTextRange(ts.createParen(expression), expression);
    }
    export function parenthesizePostfixOperand(operand: ts.Expression) {
        return ts.isLeftHandSideExpression(operand)
            ? operand
            : ts.setTextRange(ts.createParen(operand), operand);
    }
    export function parenthesizePrefixOperand(operand: ts.Expression) {
        return ts.isUnaryExpression(operand)
            ? operand
            : ts.setTextRange(ts.createParen(operand), operand);
    }
    export function parenthesizeListElements(elements: ts.NodeArray<ts.Expression>) {
        let result: ts.Expression[] | undefined;
        for (let i = 0; i < elements.length; i++) {
            const element = parenthesizeExpressionForList(elements[i]);
            if (result !== undefined || element !== elements[i]) {
                if (result === undefined) {
                    result = elements.slice(0, i);
                }
                result.push(element);
            }
        }
        if (result !== undefined) {
            return ts.setTextRange(ts.createNodeArray(result, elements.hasTrailingComma), elements);
        }
        return elements;
    }
    export function parenthesizeExpressionForList(expression: ts.Expression) {
        const emittedExpression = ts.skipPartiallyEmittedExpressions(expression);
        const expressionPrecedence = ts.getExpressionPrecedence(emittedExpression);
        const commaPrecedence = ts.getOperatorPrecedence(ts.SyntaxKind.BinaryExpression, ts.SyntaxKind.CommaToken);
        return expressionPrecedence > commaPrecedence
            ? expression
            : ts.setTextRange(ts.createParen(expression), expression);
    }
    export function parenthesizeExpressionForExpressionStatement(expression: ts.Expression) {
        const emittedExpression = ts.skipPartiallyEmittedExpressions(expression);
        if (ts.isCallExpression(emittedExpression)) {
            const callee = emittedExpression.expression;
            const kind = ts.skipPartiallyEmittedExpressions(callee).kind;
            if (kind === ts.SyntaxKind.FunctionExpression || kind === ts.SyntaxKind.ArrowFunction) {
                const mutableCall = ts.getMutableClone(emittedExpression);
                mutableCall.expression = ts.setTextRange(ts.createParen(callee), callee);
                return recreateOuterExpressions(expression, mutableCall, OuterExpressionKinds.PartiallyEmittedExpressions);
            }
        }
        const leftmostExpressionKind = getLeftmostExpression(emittedExpression, /*stopAtCallExpressions*/ false).kind;
        if (leftmostExpressionKind === ts.SyntaxKind.ObjectLiteralExpression || leftmostExpressionKind === ts.SyntaxKind.FunctionExpression) {
            return ts.setTextRange(ts.createParen(expression), expression);
        }
        return expression;
    }
    export function parenthesizeConditionalTypeMember(member: ts.TypeNode) {
        return member.kind === ts.SyntaxKind.ConditionalType ? ts.createParenthesizedType(member) : member;
    }
    export function parenthesizeElementTypeMember(member: ts.TypeNode) {
        switch (member.kind) {
            case ts.SyntaxKind.UnionType:
            case ts.SyntaxKind.IntersectionType:
            case ts.SyntaxKind.FunctionType:
            case ts.SyntaxKind.ConstructorType:
                return ts.createParenthesizedType(member);
        }
        return parenthesizeConditionalTypeMember(member);
    }
    export function parenthesizeArrayTypeMember(member: ts.TypeNode) {
        switch (member.kind) {
            case ts.SyntaxKind.TypeQuery:
            case ts.SyntaxKind.TypeOperator:
            case ts.SyntaxKind.InferType:
                return ts.createParenthesizedType(member);
        }
        return parenthesizeElementTypeMember(member);
    }
    export function parenthesizeElementTypeMembers(members: readonly ts.TypeNode[]) {
        return ts.createNodeArray(ts.sameMap(members, parenthesizeElementTypeMember));
    }
    export function parenthesizeTypeParameters(typeParameters: readonly ts.TypeNode[] | undefined) {
        if (ts.some(typeParameters)) {
            const params: ts.TypeNode[] = [];
            for (let i = 0; i < typeParameters.length; ++i) {
                const entry = typeParameters[i];
                params.push(i === 0 && ts.isFunctionOrConstructorTypeNode(entry) && entry.typeParameters ?
                    ts.createParenthesizedType(entry) :
                    entry);
            }
            return ts.createNodeArray(params);
        }
    }
    export function getLeftmostExpression(node: ts.Expression, stopAtCallExpressions: boolean) {
        while (true) {
            switch (node.kind) {
                case ts.SyntaxKind.PostfixUnaryExpression:
                    node = (<ts.PostfixUnaryExpression>node).operand;
                    continue;
                case ts.SyntaxKind.BinaryExpression:
                    node = (<ts.BinaryExpression>node).left;
                    continue;
                case ts.SyntaxKind.ConditionalExpression:
                    node = (<ts.ConditionalExpression>node).condition;
                    continue;
                case ts.SyntaxKind.TaggedTemplateExpression:
                    node = (<ts.TaggedTemplateExpression>node).tag;
                    continue;
                case ts.SyntaxKind.CallExpression:
                    if (stopAtCallExpressions) {
                        return node;
                    }
                // falls through
                case ts.SyntaxKind.AsExpression:
                case ts.SyntaxKind.ElementAccessExpression:
                case ts.SyntaxKind.PropertyAccessExpression:
                case ts.SyntaxKind.NonNullExpression:
                case ts.SyntaxKind.PartiallyEmittedExpression:
                    node = (<ts.CallExpression | ts.PropertyAccessExpression | ts.ElementAccessExpression | ts.AsExpression | ts.NonNullExpression | ts.PartiallyEmittedExpression>node).expression;
                    continue;
            }
            return node;
        }
    }
    export function parenthesizeConciseBody(body: ts.ConciseBody): ts.ConciseBody {
        if (!ts.isBlock(body) && (isCommaSequence(body) || getLeftmostExpression(body, /*stopAtCallExpressions*/ false).kind === ts.SyntaxKind.ObjectLiteralExpression)) {
            return ts.setTextRange(ts.createParen(body), body);
        }
        return body;
    }
    export function isCommaSequence(node: ts.Expression): node is (ts.BinaryExpression & {
        operatorToken: ts.Token<ts.SyntaxKind.CommaToken>;
    }) | ts.CommaListExpression {
        return node.kind === ts.SyntaxKind.BinaryExpression && (<ts.BinaryExpression>node).operatorToken.kind === ts.SyntaxKind.CommaToken ||
            node.kind === ts.SyntaxKind.CommaListExpression;
    }
    export const enum OuterExpressionKinds {
        Parentheses = 1 << 0,
        Assertions = 1 << 1,
        PartiallyEmittedExpressions = 1 << 2,
        All = Parentheses | Assertions | PartiallyEmittedExpressions
    }
    export type OuterExpression = ts.ParenthesizedExpression | ts.TypeAssertion | ts.AsExpression | ts.NonNullExpression | ts.PartiallyEmittedExpression;
    export function isOuterExpression(node: ts.Node, kinds = OuterExpressionKinds.All): node is OuterExpression {
        switch (node.kind) {
            case ts.SyntaxKind.ParenthesizedExpression:
                return (kinds & OuterExpressionKinds.Parentheses) !== 0;
            case ts.SyntaxKind.TypeAssertionExpression:
            case ts.SyntaxKind.AsExpression:
            case ts.SyntaxKind.NonNullExpression:
                return (kinds & OuterExpressionKinds.Assertions) !== 0;
            case ts.SyntaxKind.PartiallyEmittedExpression:
                return (kinds & OuterExpressionKinds.PartiallyEmittedExpressions) !== 0;
        }
        return false;
    }
    export function skipOuterExpressions(node: ts.Expression, kinds?: OuterExpressionKinds): ts.Expression;
    export function skipOuterExpressions(node: ts.Node, kinds?: OuterExpressionKinds): ts.Node;
    export function skipOuterExpressions(node: ts.Node, kinds = OuterExpressionKinds.All) {
        let previousNode: ts.Node;
        do {
            previousNode = node;
            if (kinds & OuterExpressionKinds.Parentheses) {
                node = ts.skipParentheses(node);
            }
            if (kinds & OuterExpressionKinds.Assertions) {
                node = skipAssertions(node);
            }
            if (kinds & OuterExpressionKinds.PartiallyEmittedExpressions) {
                node = ts.skipPartiallyEmittedExpressions(node);
            }
        } while (previousNode !== node);
        return node;
    }
    export function skipAssertions(node: ts.Expression): ts.Expression;
    export function skipAssertions(node: ts.Node): ts.Node;
    export function skipAssertions(node: ts.Node): ts.Node {
        while (ts.isAssertionExpression(node) || node.kind === ts.SyntaxKind.NonNullExpression) {
            node = (<ts.AssertionExpression | ts.NonNullExpression>node).expression;
        }
        return node;
    }
    function updateOuterExpression(outerExpression: OuterExpression, expression: ts.Expression) {
        switch (outerExpression.kind) {
            case ts.SyntaxKind.ParenthesizedExpression: return ts.updateParen(outerExpression, expression);
            case ts.SyntaxKind.TypeAssertionExpression: return ts.updateTypeAssertion(outerExpression, outerExpression.type, expression);
            case ts.SyntaxKind.AsExpression: return ts.updateAsExpression(outerExpression, expression, outerExpression.type);
            case ts.SyntaxKind.NonNullExpression: return ts.updateNonNullExpression(outerExpression, expression);
            case ts.SyntaxKind.PartiallyEmittedExpression: return ts.updatePartiallyEmittedExpression(outerExpression, expression);
        }
    }
    /**
     * Determines whether a node is a parenthesized expression that can be ignored when recreating outer expressions.
     *
     * A parenthesized expression can be ignored when all of the following are true:
     *
     * - It's `pos` and `end` are not -1
     * - It does not have a custom source map range
     * - It does not have a custom comment range
     * - It does not have synthetic leading or trailing comments
     *
     * If an outermost parenthesized expression is ignored, but the containing expression requires a parentheses around
     * the expression to maintain precedence, a new parenthesized expression should be created automatically when
     * the containing expression is created/updated.
     */
    function isIgnorableParen(node: ts.Expression) {
        return node.kind === ts.SyntaxKind.ParenthesizedExpression
            && ts.nodeIsSynthesized(node)
            && ts.nodeIsSynthesized(ts.getSourceMapRange(node))
            && ts.nodeIsSynthesized(ts.getCommentRange(node))
            && !ts.some(ts.getSyntheticLeadingComments(node))
            && !ts.some(ts.getSyntheticTrailingComments(node));
    }
    export function recreateOuterExpressions(outerExpression: ts.Expression | undefined, innerExpression: ts.Expression, kinds = OuterExpressionKinds.All): ts.Expression {
        if (outerExpression && isOuterExpression(outerExpression, kinds) && !isIgnorableParen(outerExpression)) {
            return updateOuterExpression(outerExpression, recreateOuterExpressions(outerExpression.expression, innerExpression));
        }
        return innerExpression;
    }
    export function startOnNewLine<T extends ts.Node>(node: T): T {
        return ts.setStartsOnNewLine(node, /*newLine*/ true);
    }
    export function getExternalHelpersModuleName(node: ts.SourceFile) {
        const parseNode = ts.getOriginalNode(node, ts.isSourceFile);
        const emitNode = parseNode && parseNode.emitNode;
        return emitNode && emitNode.externalHelpersModuleName;
    }
    export function hasRecordedExternalHelpers(sourceFile: ts.SourceFile) {
        const parseNode = ts.getOriginalNode(sourceFile, ts.isSourceFile);
        const emitNode = parseNode && parseNode.emitNode;
        return !!emitNode && (!!emitNode.externalHelpersModuleName || !!emitNode.externalHelpers);
    }
    export function createExternalHelpersImportDeclarationIfNeeded(sourceFile: ts.SourceFile, compilerOptions: ts.CompilerOptions, hasExportStarsToExportValues?: boolean, hasImportStar?: boolean, hasImportDefault?: boolean) {
        if (compilerOptions.importHelpers && ts.isEffectiveExternalModule(sourceFile, compilerOptions)) {
            let namedBindings: ts.NamedImportBindings | undefined;
            const moduleKind = ts.getEmitModuleKind(compilerOptions);
            if (moduleKind >= ts.ModuleKind.ES2015 && moduleKind <= ts.ModuleKind.ESNext) {
                // use named imports
                const helpers = ts.getEmitHelpers(sourceFile);
                if (helpers) {
                    const helperNames: string[] = [];
                    for (const helper of helpers) {
                        if (!helper.scoped) {
                            const importName = (helper as ts.UnscopedEmitHelper).importName;
                            if (importName) {
                                ts.pushIfUnique(helperNames, importName);
                            }
                        }
                    }
                    if (ts.some(helperNames)) {
                        helperNames.sort(ts.compareStringsCaseSensitive);
                        // Alias the imports if the names are used somewhere in the file.
                        // NOTE: We don't need to care about global import collisions as this is a module.
                        namedBindings = ts.createNamedImports(ts.map(helperNames, name => ts.isFileLevelUniqueName(sourceFile, name)
                            ? ts.createImportSpecifier(/*propertyName*/ undefined, ts.createIdentifier(name))
                            : ts.createImportSpecifier(ts.createIdentifier(name), getUnscopedHelperName(name))));
                        const parseNode = ts.getOriginalNode(sourceFile, ts.isSourceFile);
                        const emitNode = ts.getOrCreateEmitNode(parseNode);
                        emitNode.externalHelpers = true;
                    }
                }
            }
            else {
                // use a namespace import
                const externalHelpersModuleName = getOrCreateExternalHelpersModuleNameIfNeeded(sourceFile, compilerOptions, hasExportStarsToExportValues, hasImportStar || hasImportDefault);
                if (externalHelpersModuleName) {
                    namedBindings = ts.createNamespaceImport(externalHelpersModuleName);
                }
            }
            if (namedBindings) {
                const externalHelpersImportDeclaration = ts.createImportDeclaration(
                /*decorators*/ undefined, 
                /*modifiers*/ undefined, ts.createImportClause(/*name*/ undefined, namedBindings), ts.createLiteral(ts.externalHelpersModuleNameText));
                ts.addEmitFlags(externalHelpersImportDeclaration, ts.EmitFlags.NeverApplyImportHelper);
                return externalHelpersImportDeclaration;
            }
        }
    }
    export function getOrCreateExternalHelpersModuleNameIfNeeded(node: ts.SourceFile, compilerOptions: ts.CompilerOptions, hasExportStarsToExportValues?: boolean, hasImportStarOrImportDefault?: boolean) {
        if (compilerOptions.importHelpers && ts.isEffectiveExternalModule(node, compilerOptions)) {
            const externalHelpersModuleName = getExternalHelpersModuleName(node);
            if (externalHelpersModuleName) {
                return externalHelpersModuleName;
            }
            const moduleKind = ts.getEmitModuleKind(compilerOptions);
            let create = (hasExportStarsToExportValues || (compilerOptions.esModuleInterop && hasImportStarOrImportDefault))
                && moduleKind !== ts.ModuleKind.System
                && moduleKind !== ts.ModuleKind.ES2015
                && moduleKind !== ts.ModuleKind.ESNext;
            if (!create) {
                const helpers = ts.getEmitHelpers(node);
                if (helpers) {
                    for (const helper of helpers) {
                        if (!helper.scoped) {
                            create = true;
                            break;
                        }
                    }
                }
            }
            if (create) {
                const parseNode = ts.getOriginalNode(node, ts.isSourceFile);
                const emitNode = ts.getOrCreateEmitNode(parseNode);
                return emitNode.externalHelpersModuleName || (emitNode.externalHelpersModuleName = ts.createUniqueName(ts.externalHelpersModuleNameText));
            }
        }
    }
    /**
     * Get the name of that target module from an import or export declaration
     */
    export function getLocalNameForExternalImport(node: ts.ImportDeclaration | ts.ExportDeclaration | ts.ImportEqualsDeclaration, sourceFile: ts.SourceFile): ts.Identifier | undefined {
        const namespaceDeclaration = ts.getNamespaceDeclarationNode(node);
        if (namespaceDeclaration && !ts.isDefaultImport(node)) {
            const name = namespaceDeclaration.name;
            return ts.isGeneratedIdentifier(name) ? name : ts.createIdentifier(ts.getSourceTextOfNodeFromSourceFile(sourceFile, name) || ts.idText(name));
        }
        if (node.kind === ts.SyntaxKind.ImportDeclaration && node.importClause) {
            return ts.getGeneratedNameForNode(node);
        }
        if (node.kind === ts.SyntaxKind.ExportDeclaration && node.moduleSpecifier) {
            return ts.getGeneratedNameForNode(node);
        }
        return undefined;
    }
    /**
     * Get the name of a target module from an import/export declaration as should be written in the emitted output.
     * The emitted output name can be different from the input if:
     *  1. The module has a /// <amd-module name="<new name>" />
     *  2. --out or --outFile is used, making the name relative to the rootDir
     *  3- The containing SourceFile has an entry in renamedDependencies for the import as requested by some module loaders (e.g. System).
     * Otherwise, a new StringLiteral node representing the module name will be returned.
     */
    export function getExternalModuleNameLiteral(importNode: ts.ImportDeclaration | ts.ExportDeclaration | ts.ImportEqualsDeclaration, sourceFile: ts.SourceFile, host: ts.EmitHost, resolver: ts.EmitResolver, compilerOptions: ts.CompilerOptions) {
        const moduleName = (ts.getExternalModuleName(importNode)!); // TODO: GH#18217
        if (moduleName.kind === ts.SyntaxKind.StringLiteral) {
            return tryGetModuleNameFromDeclaration(importNode, host, resolver, compilerOptions)
                || tryRenameExternalModule((<ts.StringLiteral>moduleName), sourceFile)
                || ts.getSynthesizedClone((<ts.StringLiteral>moduleName));
        }
        return undefined;
    }
    /**
     * Some bundlers (SystemJS builder) sometimes want to rename dependencies.
     * Here we check if alternative name was provided for a given moduleName and return it if possible.
     */
    function tryRenameExternalModule(moduleName: ts.LiteralExpression, sourceFile: ts.SourceFile) {
        const rename = sourceFile.renamedDependencies && sourceFile.renamedDependencies.get(moduleName.text);
        return rename && ts.createLiteral(rename);
    }
    /**
     * Get the name of a module as should be written in the emitted output.
     * The emitted output name can be different from the input if:
     *  1. The module has a /// <amd-module name="<new name>" />
     *  2. --out or --outFile is used, making the name relative to the rootDir
     * Otherwise, a new StringLiteral node representing the module name will be returned.
     */
    export function tryGetModuleNameFromFile(file: ts.SourceFile | undefined, host: ts.EmitHost, options: ts.CompilerOptions): ts.StringLiteral | undefined {
        if (!file) {
            return undefined;
        }
        if (file.moduleName) {
            return ts.createLiteral(file.moduleName);
        }
        if (!file.isDeclarationFile && (options.out || options.outFile)) {
            return ts.createLiteral(ts.getExternalModuleNameFromPath(host, file.fileName));
        }
        return undefined;
    }
    function tryGetModuleNameFromDeclaration(declaration: ts.ImportEqualsDeclaration | ts.ImportDeclaration | ts.ExportDeclaration, host: ts.EmitHost, resolver: ts.EmitResolver, compilerOptions: ts.CompilerOptions) {
        return tryGetModuleNameFromFile(resolver.getExternalModuleFileFromDeclaration(declaration), host, compilerOptions);
    }
    /**
     * Gets the initializer of an BindingOrAssignmentElement.
     */
    export function getInitializerOfBindingOrAssignmentElement(bindingElement: ts.BindingOrAssignmentElement): ts.Expression | undefined {
        if (ts.isDeclarationBindingElement(bindingElement)) {
            // `1` in `let { a = 1 } = ...`
            // `1` in `let { a: b = 1 } = ...`
            // `1` in `let { a: {b} = 1 } = ...`
            // `1` in `let { a: [b] = 1 } = ...`
            // `1` in `let [a = 1] = ...`
            // `1` in `let [{a} = 1] = ...`
            // `1` in `let [[a] = 1] = ...`
            return bindingElement.initializer;
        }
        if (ts.isPropertyAssignment(bindingElement)) {
            // `1` in `({ a: b = 1 } = ...)`
            // `1` in `({ a: {b} = 1 } = ...)`
            // `1` in `({ a: [b] = 1 } = ...)`
            const initializer = bindingElement.initializer;
            return ts.isAssignmentExpression(initializer, /*excludeCompoundAssignment*/ true)
                ? initializer.right
                : undefined;
        }
        if (ts.isShorthandPropertyAssignment(bindingElement)) {
            // `1` in `({ a = 1 } = ...)`
            return bindingElement.objectAssignmentInitializer;
        }
        if (ts.isAssignmentExpression(bindingElement, /*excludeCompoundAssignment*/ true)) {
            // `1` in `[a = 1] = ...`
            // `1` in `[{a} = 1] = ...`
            // `1` in `[[a] = 1] = ...`
            return bindingElement.right;
        }
        if (ts.isSpreadElement(bindingElement)) {
            // Recovery consistent with existing emit.
            return getInitializerOfBindingOrAssignmentElement((<ts.BindingOrAssignmentElement>bindingElement.expression));
        }
    }
    /**
     * Gets the name of an BindingOrAssignmentElement.
     */
    export function getTargetOfBindingOrAssignmentElement(bindingElement: ts.BindingOrAssignmentElement): ts.BindingOrAssignmentElementTarget | undefined {
        if (ts.isDeclarationBindingElement(bindingElement)) {
            // `a` in `let { a } = ...`
            // `a` in `let { a = 1 } = ...`
            // `b` in `let { a: b } = ...`
            // `b` in `let { a: b = 1 } = ...`
            // `a` in `let { ...a } = ...`
            // `{b}` in `let { a: {b} } = ...`
            // `{b}` in `let { a: {b} = 1 } = ...`
            // `[b]` in `let { a: [b] } = ...`
            // `[b]` in `let { a: [b] = 1 } = ...`
            // `a` in `let [a] = ...`
            // `a` in `let [a = 1] = ...`
            // `a` in `let [...a] = ...`
            // `{a}` in `let [{a}] = ...`
            // `{a}` in `let [{a} = 1] = ...`
            // `[a]` in `let [[a]] = ...`
            // `[a]` in `let [[a] = 1] = ...`
            return bindingElement.name;
        }
        if (ts.isObjectLiteralElementLike(bindingElement)) {
            switch (bindingElement.kind) {
                case ts.SyntaxKind.PropertyAssignment:
                    // `b` in `({ a: b } = ...)`
                    // `b` in `({ a: b = 1 } = ...)`
                    // `{b}` in `({ a: {b} } = ...)`
                    // `{b}` in `({ a: {b} = 1 } = ...)`
                    // `[b]` in `({ a: [b] } = ...)`
                    // `[b]` in `({ a: [b] = 1 } = ...)`
                    // `b.c` in `({ a: b.c } = ...)`
                    // `b.c` in `({ a: b.c = 1 } = ...)`
                    // `b[0]` in `({ a: b[0] } = ...)`
                    // `b[0]` in `({ a: b[0] = 1 } = ...)`
                    return getTargetOfBindingOrAssignmentElement((<ts.BindingOrAssignmentElement>bindingElement.initializer));
                case ts.SyntaxKind.ShorthandPropertyAssignment:
                    // `a` in `({ a } = ...)`
                    // `a` in `({ a = 1 } = ...)`
                    return bindingElement.name;
                case ts.SyntaxKind.SpreadAssignment:
                    // `a` in `({ ...a } = ...)`
                    return getTargetOfBindingOrAssignmentElement((<ts.BindingOrAssignmentElement>bindingElement.expression));
            }
            // no target
            return undefined;
        }
        if (ts.isAssignmentExpression(bindingElement, /*excludeCompoundAssignment*/ true)) {
            // `a` in `[a = 1] = ...`
            // `{a}` in `[{a} = 1] = ...`
            // `[a]` in `[[a] = 1] = ...`
            // `a.b` in `[a.b = 1] = ...`
            // `a[0]` in `[a[0] = 1] = ...`
            return getTargetOfBindingOrAssignmentElement((<ts.BindingOrAssignmentElement>bindingElement.left));
        }
        if (ts.isSpreadElement(bindingElement)) {
            // `a` in `[...a] = ...`
            return getTargetOfBindingOrAssignmentElement((<ts.BindingOrAssignmentElement>bindingElement.expression));
        }
        // `a` in `[a] = ...`
        // `{a}` in `[{a}] = ...`
        // `[a]` in `[[a]] = ...`
        // `a.b` in `[a.b] = ...`
        // `a[0]` in `[a[0]] = ...`
        return bindingElement;
    }
    /**
     * Determines whether an BindingOrAssignmentElement is a rest element.
     */
    export function getRestIndicatorOfBindingOrAssignmentElement(bindingElement: ts.BindingOrAssignmentElement): ts.BindingOrAssignmentElementRestIndicator | undefined {
        switch (bindingElement.kind) {
            case ts.SyntaxKind.Parameter:
            case ts.SyntaxKind.BindingElement:
                // `...` in `let [...a] = ...`
                return bindingElement.dotDotDotToken;
            case ts.SyntaxKind.SpreadElement:
            case ts.SyntaxKind.SpreadAssignment:
                // `...` in `[...a] = ...`
                return bindingElement;
        }
        return undefined;
    }
    /**
     * Gets the property name of a BindingOrAssignmentElement
     */
    export function getPropertyNameOfBindingOrAssignmentElement(bindingElement: ts.BindingOrAssignmentElement): ts.PropertyName | undefined {
        const propertyName = tryGetPropertyNameOfBindingOrAssignmentElement(bindingElement);
        ts.Debug.assert(!!propertyName || ts.isSpreadAssignment(bindingElement), "Invalid property name for binding element.");
        return propertyName;
    }
    export function tryGetPropertyNameOfBindingOrAssignmentElement(bindingElement: ts.BindingOrAssignmentElement): ts.PropertyName | undefined {
        switch (bindingElement.kind) {
            case ts.SyntaxKind.BindingElement:
                // `a` in `let { a: b } = ...`
                // `[a]` in `let { [a]: b } = ...`
                // `"a"` in `let { "a": b } = ...`
                // `1` in `let { 1: b } = ...`
                if (bindingElement.propertyName) {
                    const propertyName = bindingElement.propertyName;
                    return ts.isComputedPropertyName(propertyName) && isStringOrNumericLiteral(propertyName.expression)
                        ? propertyName.expression
                        : propertyName;
                }
                break;
            case ts.SyntaxKind.PropertyAssignment:
                // `a` in `({ a: b } = ...)`
                // `[a]` in `({ [a]: b } = ...)`
                // `"a"` in `({ "a": b } = ...)`
                // `1` in `({ 1: b } = ...)`
                if (bindingElement.name) {
                    const propertyName = bindingElement.name;
                    return ts.isComputedPropertyName(propertyName) && isStringOrNumericLiteral(propertyName.expression)
                        ? propertyName.expression
                        : propertyName;
                }
                break;
            case ts.SyntaxKind.SpreadAssignment:
                // `a` in `({ ...a } = ...)`
                return bindingElement.name;
        }
        const target = getTargetOfBindingOrAssignmentElement(bindingElement);
        if (target && ts.isPropertyName(target)) {
            return ts.isComputedPropertyName(target) && isStringOrNumericLiteral(target.expression)
                ? target.expression
                : target;
        }
    }
    function isStringOrNumericLiteral(node: ts.Node): node is ts.StringLiteral | ts.NumericLiteral {
        const kind = node.kind;
        return kind === ts.SyntaxKind.StringLiteral
            || kind === ts.SyntaxKind.NumericLiteral;
    }
    /**
     * Gets the elements of a BindingOrAssignmentPattern
     */
    export function getElementsOfBindingOrAssignmentPattern(name: ts.BindingOrAssignmentPattern): readonly ts.BindingOrAssignmentElement[] {
        switch (name.kind) {
            case ts.SyntaxKind.ObjectBindingPattern:
            case ts.SyntaxKind.ArrayBindingPattern:
            case ts.SyntaxKind.ArrayLiteralExpression:
                // `a` in `{a}`
                // `a` in `[a]`
                return <readonly ts.BindingOrAssignmentElement[]>name.elements;
            case ts.SyntaxKind.ObjectLiteralExpression:
                // `a` in `{a}`
                return <readonly ts.BindingOrAssignmentElement[]>name.properties;
        }
    }
    export function convertToArrayAssignmentElement(element: ts.BindingOrAssignmentElement) {
        if (ts.isBindingElement(element)) {
            if (element.dotDotDotToken) {
                ts.Debug.assertNode(element.name, ts.isIdentifier);
                return ts.setOriginalNode(ts.setTextRange(ts.createSpread((<ts.Identifier>element.name)), element), element);
            }
            const expression = convertToAssignmentElementTarget(element.name);
            return element.initializer
                ? ts.setOriginalNode(ts.setTextRange(ts.createAssignment(expression, element.initializer), element), element)
                : expression;
        }
        ts.Debug.assertNode(element, ts.isExpression);
        return <ts.Expression>element;
    }
    export function convertToObjectAssignmentElement(element: ts.BindingOrAssignmentElement) {
        if (ts.isBindingElement(element)) {
            if (element.dotDotDotToken) {
                ts.Debug.assertNode(element.name, ts.isIdentifier);
                return ts.setOriginalNode(ts.setTextRange(ts.createSpreadAssignment((<ts.Identifier>element.name)), element), element);
            }
            if (element.propertyName) {
                const expression = convertToAssignmentElementTarget(element.name);
                return ts.setOriginalNode(ts.setTextRange(ts.createPropertyAssignment(element.propertyName, element.initializer ? ts.createAssignment(expression, element.initializer) : expression), element), element);
            }
            ts.Debug.assertNode(element.name, ts.isIdentifier);
            return ts.setOriginalNode(ts.setTextRange(ts.createShorthandPropertyAssignment((<ts.Identifier>element.name), element.initializer), element), element);
        }
        ts.Debug.assertNode(element, ts.isObjectLiteralElementLike);
        return <ts.ObjectLiteralElementLike>element;
    }
    export function convertToAssignmentPattern(node: ts.BindingOrAssignmentPattern): ts.AssignmentPattern {
        switch (node.kind) {
            case ts.SyntaxKind.ArrayBindingPattern:
            case ts.SyntaxKind.ArrayLiteralExpression:
                return convertToArrayAssignmentPattern(node);
            case ts.SyntaxKind.ObjectBindingPattern:
            case ts.SyntaxKind.ObjectLiteralExpression:
                return convertToObjectAssignmentPattern(node);
        }
    }
    export function convertToObjectAssignmentPattern(node: ts.ObjectBindingOrAssignmentPattern) {
        if (ts.isObjectBindingPattern(node)) {
            return ts.setOriginalNode(ts.setTextRange(ts.createObjectLiteral(ts.map(node.elements, convertToObjectAssignmentElement)), node), node);
        }
        ts.Debug.assertNode(node, ts.isObjectLiteralExpression);
        return node;
    }
    export function convertToArrayAssignmentPattern(node: ts.ArrayBindingOrAssignmentPattern) {
        if (ts.isArrayBindingPattern(node)) {
            return ts.setOriginalNode(ts.setTextRange(ts.createArrayLiteral(ts.map(node.elements, convertToArrayAssignmentElement)), node), node);
        }
        ts.Debug.assertNode(node, ts.isArrayLiteralExpression);
        return node;
    }
    export function convertToAssignmentElementTarget(node: ts.BindingOrAssignmentElementTarget): ts.Expression {
        if (ts.isBindingPattern(node)) {
            return convertToAssignmentPattern(node);
        }
        ts.Debug.assertNode(node, ts.isExpression);
        return node;
    }
}
