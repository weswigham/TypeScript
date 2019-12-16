/*@internal*/
namespace ts {
    const enum ESNextSubstitutionFlags {
        /** Enables substitutions for async methods with `super` calls. */
        AsyncMethodsWithSuper = 1 << 0
    }
    export function transformES2018(context: ts.TransformationContext) {
        const { resumeLexicalEnvironment, endLexicalEnvironment, hoistVariableDeclaration } = context;
        const resolver = context.getEmitResolver();
        const compilerOptions = context.getCompilerOptions();
        const languageVersion = ts.getEmitScriptTarget(compilerOptions);
        const previousOnEmitNode = context.onEmitNode;
        context.onEmitNode = onEmitNode;
        const previousOnSubstituteNode = context.onSubstituteNode;
        context.onSubstituteNode = onSubstituteNode;
        let exportedVariableStatement = false;
        let enabledSubstitutions: ESNextSubstitutionFlags;
        let enclosingFunctionFlags: ts.FunctionFlags;
        let enclosingSuperContainerFlags: ts.NodeCheckFlags = 0;
        let topLevel: boolean;
        /** Keeps track of property names accessed on super (`super.x`) within async functions. */
        let capturedSuperProperties: ts.UnderscoreEscapedMap<true>;
        /** Whether the async function contains an element access on super (`super[x]`). */
        let hasSuperElementAccess: boolean;
        /** A set of node IDs for generated super accessors. */
        const substitutedSuperAccessors: boolean[] = [];
        return ts.chainBundle(transformSourceFile);
        function transformSourceFile(node: ts.SourceFile) {
            if (node.isDeclarationFile) {
                return node;
            }
            exportedVariableStatement = false;
            topLevel = ts.isEffectiveStrictModeSourceFile(node, compilerOptions);
            const visited = ts.visitEachChild(node, visitor, context);
            ts.addEmitHelpers(visited, context.readEmitHelpers());
            return visited;
        }
        function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
            return visitorWorker(node, /*noDestructuringValue*/ false);
        }
        function visitorNoDestructuringValue(node: ts.Node): ts.VisitResult<ts.Node> {
            return visitorWorker(node, /*noDestructuringValue*/ true);
        }
        function visitorNoAsyncModifier(node: ts.Node): ts.VisitResult<ts.Node> {
            if (node.kind === ts.SyntaxKind.AsyncKeyword) {
                return undefined;
            }
            return node;
        }
        function doOutsideOfTopLevel<T, U>(cb: (value: T) => U, value: T) {
            if (topLevel) {
                topLevel = false;
                const result = cb(value);
                topLevel = true;
                return result;
            }
            return cb(value);
        }
        function visitDefault(node: ts.Node): ts.VisitResult<ts.Node> {
            return ts.visitEachChild(node, visitor, context);
        }
        function visitorWorker(node: ts.Node, noDestructuringValue: boolean): ts.VisitResult<ts.Node> {
            if ((node.transformFlags & ts.TransformFlags.ContainsES2018) === 0) {
                return node;
            }
            switch (node.kind) {
                case ts.SyntaxKind.AwaitExpression:
                    return visitAwaitExpression((node as ts.AwaitExpression));
                case ts.SyntaxKind.YieldExpression:
                    return visitYieldExpression((node as ts.YieldExpression));
                case ts.SyntaxKind.ReturnStatement:
                    return visitReturnStatement((node as ts.ReturnStatement));
                case ts.SyntaxKind.LabeledStatement:
                    return visitLabeledStatement((node as ts.LabeledStatement));
                case ts.SyntaxKind.ObjectLiteralExpression:
                    return visitObjectLiteralExpression((node as ts.ObjectLiteralExpression));
                case ts.SyntaxKind.BinaryExpression:
                    return visitBinaryExpression((node as ts.BinaryExpression), noDestructuringValue);
                case ts.SyntaxKind.CatchClause:
                    return visitCatchClause((node as ts.CatchClause));
                case ts.SyntaxKind.VariableStatement:
                    return visitVariableStatement((node as ts.VariableStatement));
                case ts.SyntaxKind.VariableDeclaration:
                    return visitVariableDeclaration((node as ts.VariableDeclaration));
                case ts.SyntaxKind.ForOfStatement:
                    return visitForOfStatement((node as ts.ForOfStatement), /*outermostLabeledStatement*/ undefined);
                case ts.SyntaxKind.ForStatement:
                    return visitForStatement((node as ts.ForStatement));
                case ts.SyntaxKind.VoidExpression:
                    return visitVoidExpression((node as ts.VoidExpression));
                case ts.SyntaxKind.Constructor:
                    return doOutsideOfTopLevel(visitConstructorDeclaration, (node as ts.ConstructorDeclaration));
                case ts.SyntaxKind.MethodDeclaration:
                    return doOutsideOfTopLevel(visitMethodDeclaration, (node as ts.MethodDeclaration));
                case ts.SyntaxKind.GetAccessor:
                    return doOutsideOfTopLevel(visitGetAccessorDeclaration, (node as ts.GetAccessorDeclaration));
                case ts.SyntaxKind.SetAccessor:
                    return doOutsideOfTopLevel(visitSetAccessorDeclaration, (node as ts.SetAccessorDeclaration));
                case ts.SyntaxKind.FunctionDeclaration:
                    return doOutsideOfTopLevel(visitFunctionDeclaration, (node as ts.FunctionDeclaration));
                case ts.SyntaxKind.FunctionExpression:
                    return doOutsideOfTopLevel(visitFunctionExpression, (node as ts.FunctionExpression));
                case ts.SyntaxKind.ArrowFunction:
                    return visitArrowFunction((node as ts.ArrowFunction));
                case ts.SyntaxKind.Parameter:
                    return visitParameter((node as ts.ParameterDeclaration));
                case ts.SyntaxKind.ExpressionStatement:
                    return visitExpressionStatement((node as ts.ExpressionStatement));
                case ts.SyntaxKind.ParenthesizedExpression:
                    return visitParenthesizedExpression((node as ts.ParenthesizedExpression), noDestructuringValue);
                case ts.SyntaxKind.PropertyAccessExpression:
                    if (capturedSuperProperties && ts.isPropertyAccessExpression(node) && node.expression.kind === ts.SyntaxKind.SuperKeyword) {
                        capturedSuperProperties.set(node.name.escapedText, true);
                    }
                    return ts.visitEachChild(node, visitor, context);
                case ts.SyntaxKind.ElementAccessExpression:
                    if (capturedSuperProperties && (<ts.ElementAccessExpression>node).expression.kind === ts.SyntaxKind.SuperKeyword) {
                        hasSuperElementAccess = true;
                    }
                    return ts.visitEachChild(node, visitor, context);
                case ts.SyntaxKind.ClassDeclaration:
                case ts.SyntaxKind.ClassExpression:
                    return doOutsideOfTopLevel(visitDefault, node);
                default:
                    return ts.visitEachChild(node, visitor, context);
            }
        }
        function visitAwaitExpression(node: ts.AwaitExpression): ts.Expression {
            if (enclosingFunctionFlags & ts.FunctionFlags.Async && enclosingFunctionFlags & ts.FunctionFlags.Generator) {
                return ts.setOriginalNode(ts.setTextRange(ts.createYield(createAwaitHelper(context, ts.visitNode(node.expression, visitor, ts.isExpression))), 
                /*location*/ node), node);
            }
            return ts.visitEachChild(node, visitor, context);
        }
        function visitYieldExpression(node: ts.YieldExpression) {
            if (enclosingFunctionFlags & ts.FunctionFlags.Async && enclosingFunctionFlags & ts.FunctionFlags.Generator) {
                if (node.asteriskToken) {
                    const expression = ts.visitNode(node.expression, visitor, ts.isExpression);
                    return ts.setOriginalNode(ts.setTextRange(ts.createYield(createAwaitHelper(context, ts.updateYield(node, node.asteriskToken, createAsyncDelegatorHelper(context, createAsyncValuesHelper(context, expression, expression), expression)))), node), node);
                }
                return ts.setOriginalNode(ts.setTextRange(ts.createYield(createDownlevelAwait(node.expression
                    ? ts.visitNode(node.expression, visitor, ts.isExpression)
                    : ts.createVoidZero())), node), node);
            }
            return ts.visitEachChild(node, visitor, context);
        }
        function visitReturnStatement(node: ts.ReturnStatement) {
            if (enclosingFunctionFlags & ts.FunctionFlags.Async && enclosingFunctionFlags & ts.FunctionFlags.Generator) {
                return ts.updateReturn(node, createDownlevelAwait(node.expression ? ts.visitNode(node.expression, visitor, ts.isExpression) : ts.createVoidZero()));
            }
            return ts.visitEachChild(node, visitor, context);
        }
        function visitLabeledStatement(node: ts.LabeledStatement) {
            if (enclosingFunctionFlags & ts.FunctionFlags.Async) {
                const statement = ts.unwrapInnermostStatementOfLabel(node);
                if (statement.kind === ts.SyntaxKind.ForOfStatement && (<ts.ForOfStatement>statement).awaitModifier) {
                    return visitForOfStatement((<ts.ForOfStatement>statement), node);
                }
                return ts.restoreEnclosingLabel(ts.visitEachChild(statement, visitor, context), node);
            }
            return ts.visitEachChild(node, visitor, context);
        }
        function chunkObjectLiteralElements(elements: readonly ts.ObjectLiteralElementLike[]): ts.Expression[] {
            let chunkObject: ts.ObjectLiteralElementLike[] | undefined;
            const objects: ts.Expression[] = [];
            for (const e of elements) {
                if (e.kind === ts.SyntaxKind.SpreadAssignment) {
                    if (chunkObject) {
                        objects.push(ts.createObjectLiteral(chunkObject));
                        chunkObject = undefined;
                    }
                    const target = e.expression;
                    objects.push(ts.visitNode(target, visitor, ts.isExpression));
                }
                else {
                    chunkObject = ts.append(chunkObject, e.kind === ts.SyntaxKind.PropertyAssignment
                        ? ts.createPropertyAssignment(e.name, ts.visitNode(e.initializer, visitor, ts.isExpression))
                        : ts.visitNode(e, visitor, ts.isObjectLiteralElementLike));
                }
            }
            if (chunkObject) {
                objects.push(ts.createObjectLiteral(chunkObject));
            }
            return objects;
        }
        function visitObjectLiteralExpression(node: ts.ObjectLiteralExpression): ts.Expression {
            if (node.transformFlags & ts.TransformFlags.ContainsObjectRestOrSpread) {
                // spread elements emit like so:
                // non-spread elements are chunked together into object literals, and then all are passed to __assign:
                //     { a, ...o, b } => __assign(__assign({a}, o), {b});
                // If the first element is a spread element, then the first argument to __assign is {}:
                //     { ...o, a, b, ...o2 } => __assign(__assign(__assign({}, o), {a, b}), o2)
                //
                // We cannot call __assign with more than two elements, since any element could cause side effects. For
                // example:
                //      var k = { a: 1, b: 2 };
                //      var o = { a: 3, ...k, b: k.a++ };
                //      // expected: { a: 1, b: 1 }
                // If we translate the above to `__assign({ a: 3 }, k, { b: k.a++ })`, the `k.a++` will evaluate before
                // `k` is spread and we end up with `{ a: 2, b: 1 }`.
                //
                // This also occurs for spread elements, not just property assignments:
                //      var k = { a: 1, get b() { l = { z: 9 }; return 2; } };
                //      var l = { c: 3 };
                //      var o = { ...k, ...l };
                //      // expected: { a: 1, b: 2, z: 9 }
                // If we translate the above to `__assign({}, k, l)`, the `l` will evaluate before `k` is spread and we
                // end up with `{ a: 1, b: 2, c: 3 }`
                const objects = chunkObjectLiteralElements(node.properties);
                if (objects.length && objects[0].kind !== ts.SyntaxKind.ObjectLiteralExpression) {
                    objects.unshift(ts.createObjectLiteral());
                }
                let expression: ts.Expression = objects[0];
                if (objects.length > 1) {
                    for (let i = 1; i < objects.length; i++) {
                        expression = createAssignHelper(context, [expression, objects[i]]);
                    }
                    return expression;
                }
                else {
                    return createAssignHelper(context, objects);
                }
            }
            return ts.visitEachChild(node, visitor, context);
        }
        function visitExpressionStatement(node: ts.ExpressionStatement): ts.ExpressionStatement {
            return ts.visitEachChild(node, visitorNoDestructuringValue, context);
        }
        function visitParenthesizedExpression(node: ts.ParenthesizedExpression, noDestructuringValue: boolean): ts.ParenthesizedExpression {
            return ts.visitEachChild(node, noDestructuringValue ? visitorNoDestructuringValue : visitor, context);
        }
        /**
         * Visits a BinaryExpression that contains a destructuring assignment.
         *
         * @param node A BinaryExpression node.
         */
        function visitBinaryExpression(node: ts.BinaryExpression, noDestructuringValue: boolean): ts.Expression {
            if (ts.isDestructuringAssignment(node) && node.left.transformFlags & ts.TransformFlags.ContainsObjectRestOrSpread) {
                return ts.flattenDestructuringAssignment(node, visitor, context, ts.FlattenLevel.ObjectRest, !noDestructuringValue);
            }
            else if (node.operatorToken.kind === ts.SyntaxKind.CommaToken) {
                return ts.updateBinary(node, ts.visitNode(node.left, visitorNoDestructuringValue, ts.isExpression), ts.visitNode(node.right, noDestructuringValue ? visitorNoDestructuringValue : visitor, ts.isExpression));
            }
            return ts.visitEachChild(node, visitor, context);
        }
        function visitCatchClause(node: ts.CatchClause) {
            if (node.variableDeclaration &&
                ts.isBindingPattern(node.variableDeclaration.name) &&
                node.variableDeclaration.name.transformFlags & ts.TransformFlags.ContainsObjectRestOrSpread) {
                const name = ts.getGeneratedNameForNode(node.variableDeclaration.name);
                const updatedDecl = ts.updateVariableDeclaration(node.variableDeclaration, node.variableDeclaration.name, /*type*/ undefined, name);
                const visitedBindings = ts.flattenDestructuringBinding(updatedDecl, visitor, context, ts.FlattenLevel.ObjectRest);
                let block = ts.visitNode(node.block, visitor, ts.isBlock);
                if (ts.some(visitedBindings)) {
                    block = ts.updateBlock(block, [
                        ts.createVariableStatement(/*modifiers*/ undefined, visitedBindings),
                        ...block.statements,
                    ]);
                }
                return ts.updateCatchClause(node, ts.updateVariableDeclaration(node.variableDeclaration, name, /*type*/ undefined, /*initializer*/ undefined), block);
            }
            return ts.visitEachChild(node, visitor, context);
        }
        function visitVariableStatement(node: ts.VariableStatement): ts.VisitResult<ts.VariableStatement> {
            if (ts.hasModifier(node, ts.ModifierFlags.Export)) {
                const savedExportedVariableStatement = exportedVariableStatement;
                exportedVariableStatement = true;
                const visited = ts.visitEachChild(node, visitor, context);
                exportedVariableStatement = savedExportedVariableStatement;
                return visited;
            }
            return ts.visitEachChild(node, visitor, context);
        }
        /**
         * Visits a VariableDeclaration node with a binding pattern.
         *
         * @param node A VariableDeclaration node.
         */
        function visitVariableDeclaration(node: ts.VariableDeclaration): ts.VisitResult<ts.VariableDeclaration> {
            if (exportedVariableStatement) {
                const savedExportedVariableStatement = exportedVariableStatement;
                exportedVariableStatement = false;
                const visited = visitVariableDeclarationWorker(node, /*exportedVariableStatement*/ true);
                exportedVariableStatement = savedExportedVariableStatement;
                return visited;
            }
            return visitVariableDeclarationWorker(node, /*exportedVariableStatement*/ false);
        }
        function visitVariableDeclarationWorker(node: ts.VariableDeclaration, exportedVariableStatement: boolean): ts.VisitResult<ts.VariableDeclaration> {
            // If we are here it is because the name contains a binding pattern with a rest somewhere in it.
            if (ts.isBindingPattern(node.name) && node.name.transformFlags & ts.TransformFlags.ContainsObjectRestOrSpread) {
                return ts.flattenDestructuringBinding(node, visitor, context, ts.FlattenLevel.ObjectRest, 
                /*rval*/ undefined, exportedVariableStatement);
            }
            return ts.visitEachChild(node, visitor, context);
        }
        function visitForStatement(node: ts.ForStatement): ts.VisitResult<ts.Statement> {
            return ts.updateFor(node, ts.visitNode(node.initializer, visitorNoDestructuringValue, ts.isForInitializer), ts.visitNode(node.condition, visitor, ts.isExpression), ts.visitNode(node.incrementor, visitor, ts.isExpression), ts.visitNode(node.statement, visitor, ts.isStatement));
        }
        function visitVoidExpression(node: ts.VoidExpression) {
            return ts.visitEachChild(node, visitorNoDestructuringValue, context);
        }
        /**
         * Visits a ForOfStatement and converts it into a ES2015-compatible ForOfStatement.
         *
         * @param node A ForOfStatement.
         */
        function visitForOfStatement(node: ts.ForOfStatement, outermostLabeledStatement: ts.LabeledStatement | undefined): ts.VisitResult<ts.Statement> {
            if (node.initializer.transformFlags & ts.TransformFlags.ContainsObjectRestOrSpread) {
                node = transformForOfStatementWithObjectRest(node);
            }
            if (node.awaitModifier) {
                return transformForAwaitOfStatement(node, outermostLabeledStatement);
            }
            else {
                return ts.restoreEnclosingLabel(ts.visitEachChild(node, visitor, context), outermostLabeledStatement);
            }
        }
        function transformForOfStatementWithObjectRest(node: ts.ForOfStatement) {
            const initializerWithoutParens = (ts.skipParentheses(node.initializer) as ts.ForInitializer);
            if (ts.isVariableDeclarationList(initializerWithoutParens) || ts.isAssignmentPattern(initializerWithoutParens)) {
                let bodyLocation: ts.TextRange | undefined;
                let statementsLocation: ts.TextRange | undefined;
                const temp = ts.createTempVariable(/*recordTempVariable*/ undefined);
                const statements: ts.Statement[] = [ts.createForOfBindingStatement(initializerWithoutParens, temp)];
                if (ts.isBlock(node.statement)) {
                    ts.addRange(statements, node.statement.statements);
                    bodyLocation = node.statement;
                    statementsLocation = node.statement.statements;
                }
                else if (node.statement) {
                    ts.append(statements, node.statement);
                    bodyLocation = node.statement;
                    statementsLocation = node.statement;
                }
                return ts.updateForOf(node, node.awaitModifier, ts.setTextRange(ts.createVariableDeclarationList([
                    ts.setTextRange(ts.createVariableDeclaration(temp), node.initializer)
                ], ts.NodeFlags.Let), node.initializer), node.expression, ts.setTextRange(ts.createBlock(ts.setTextRange(ts.createNodeArray(statements), statementsLocation), 
                /*multiLine*/ true), bodyLocation));
            }
            return node;
        }
        function convertForOfStatementHead(node: ts.ForOfStatement, boundValue: ts.Expression) {
            const binding = ts.createForOfBindingStatement(node.initializer, boundValue);
            let bodyLocation: ts.TextRange | undefined;
            let statementsLocation: ts.TextRange | undefined;
            const statements: ts.Statement[] = [ts.visitNode(binding, visitor, ts.isStatement)];
            const statement = ts.visitNode(node.statement, visitor, ts.isStatement);
            if (ts.isBlock(statement)) {
                ts.addRange(statements, statement.statements);
                bodyLocation = statement;
                statementsLocation = statement.statements;
            }
            else {
                statements.push(statement);
            }
            return ts.setEmitFlags(ts.setTextRange(ts.createBlock(ts.setTextRange(ts.createNodeArray(statements), statementsLocation), 
            /*multiLine*/ true), bodyLocation), ts.EmitFlags.NoSourceMap | ts.EmitFlags.NoTokenSourceMaps);
        }
        function createDownlevelAwait(expression: ts.Expression) {
            return enclosingFunctionFlags & ts.FunctionFlags.Generator
                ? ts.createYield(/*asteriskToken*/ undefined, createAwaitHelper(context, expression))
                : ts.createAwait(expression);
        }
        function transformForAwaitOfStatement(node: ts.ForOfStatement, outermostLabeledStatement: ts.LabeledStatement | undefined) {
            const expression = ts.visitNode(node.expression, visitor, ts.isExpression);
            const iterator = ts.isIdentifier(expression) ? ts.getGeneratedNameForNode(expression) : ts.createTempVariable(/*recordTempVariable*/ undefined);
            const result = ts.isIdentifier(expression) ? ts.getGeneratedNameForNode(iterator) : ts.createTempVariable(/*recordTempVariable*/ undefined);
            const errorRecord = ts.createUniqueName("e");
            const catchVariable = ts.getGeneratedNameForNode(errorRecord);
            const returnMethod = ts.createTempVariable(/*recordTempVariable*/ undefined);
            const callValues = createAsyncValuesHelper(context, expression, /*location*/ node.expression);
            const callNext = ts.createCall(ts.createPropertyAccess(iterator, "next"), /*typeArguments*/ undefined, []);
            const getDone = ts.createPropertyAccess(result, "done");
            const getValue = ts.createPropertyAccess(result, "value");
            const callReturn = ts.createFunctionCall(returnMethod, iterator, []);
            hoistVariableDeclaration(errorRecord);
            hoistVariableDeclaration(returnMethod);
            const forStatement = ts.setEmitFlags(ts.setTextRange(ts.createFor(
            /*initializer*/ ts.setEmitFlags(ts.setTextRange(ts.createVariableDeclarationList([
                ts.setTextRange(ts.createVariableDeclaration(iterator, /*type*/ undefined, callValues), node.expression),
                ts.createVariableDeclaration(result)
            ]), node.expression), ts.EmitFlags.NoHoisting), 
            /*condition*/ ts.createComma(ts.createAssignment(result, createDownlevelAwait(callNext)), ts.createLogicalNot(getDone)), 
            /*incrementor*/ undefined, 
            /*statement*/ convertForOfStatementHead(node, getValue)), 
            /*location*/ node), ts.EmitFlags.NoTokenTrailingSourceMaps);
            return ts.createTry(ts.createBlock([
                ts.restoreEnclosingLabel(forStatement, outermostLabeledStatement)
            ]), ts.createCatchClause(ts.createVariableDeclaration(catchVariable), ts.setEmitFlags(ts.createBlock([
                ts.createExpressionStatement(ts.createAssignment(errorRecord, ts.createObjectLiteral([
                    ts.createPropertyAssignment("error", catchVariable)
                ])))
            ]), ts.EmitFlags.SingleLine)), ts.createBlock([
                ts.createTry(
                /*tryBlock*/ ts.createBlock([
                    ts.setEmitFlags(ts.createIf(ts.createLogicalAnd(ts.createLogicalAnd(result, ts.createLogicalNot(getDone)), ts.createAssignment(returnMethod, ts.createPropertyAccess(iterator, "return"))), ts.createExpressionStatement(createDownlevelAwait(callReturn))), ts.EmitFlags.SingleLine)
                ]), 
                /*catchClause*/ undefined, 
                /*finallyBlock*/ ts.setEmitFlags(ts.createBlock([
                    ts.setEmitFlags(ts.createIf(errorRecord, ts.createThrow(ts.createPropertyAccess(errorRecord, "error"))), ts.EmitFlags.SingleLine)
                ]), ts.EmitFlags.SingleLine))
            ]));
        }
        function visitParameter(node: ts.ParameterDeclaration): ts.ParameterDeclaration {
            if (node.transformFlags & ts.TransformFlags.ContainsObjectRestOrSpread) {
                // Binding patterns are converted into a generated name and are
                // evaluated inside the function body.
                return ts.updateParameter(node, 
                /*decorators*/ undefined, 
                /*modifiers*/ undefined, node.dotDotDotToken, ts.getGeneratedNameForNode(node), 
                /*questionToken*/ undefined, 
                /*type*/ undefined, ts.visitNode(node.initializer, visitor, ts.isExpression));
            }
            return ts.visitEachChild(node, visitor, context);
        }
        function visitConstructorDeclaration(node: ts.ConstructorDeclaration) {
            const savedEnclosingFunctionFlags = enclosingFunctionFlags;
            enclosingFunctionFlags = ts.FunctionFlags.Normal;
            const updated = ts.updateConstructor(node, 
            /*decorators*/ undefined, node.modifiers, ts.visitParameterList(node.parameters, visitor, context), transformFunctionBody(node));
            enclosingFunctionFlags = savedEnclosingFunctionFlags;
            return updated;
        }
        function visitGetAccessorDeclaration(node: ts.GetAccessorDeclaration) {
            const savedEnclosingFunctionFlags = enclosingFunctionFlags;
            enclosingFunctionFlags = ts.FunctionFlags.Normal;
            const updated = ts.updateGetAccessor(node, 
            /*decorators*/ undefined, node.modifiers, ts.visitNode(node.name, visitor, ts.isPropertyName), ts.visitParameterList(node.parameters, visitor, context), 
            /*type*/ undefined, transformFunctionBody(node));
            enclosingFunctionFlags = savedEnclosingFunctionFlags;
            return updated;
        }
        function visitSetAccessorDeclaration(node: ts.SetAccessorDeclaration) {
            const savedEnclosingFunctionFlags = enclosingFunctionFlags;
            enclosingFunctionFlags = ts.FunctionFlags.Normal;
            const updated = ts.updateSetAccessor(node, 
            /*decorators*/ undefined, node.modifiers, ts.visitNode(node.name, visitor, ts.isPropertyName), ts.visitParameterList(node.parameters, visitor, context), transformFunctionBody(node));
            enclosingFunctionFlags = savedEnclosingFunctionFlags;
            return updated;
        }
        function visitMethodDeclaration(node: ts.MethodDeclaration) {
            const savedEnclosingFunctionFlags = enclosingFunctionFlags;
            enclosingFunctionFlags = ts.getFunctionFlags(node);
            const updated = ts.updateMethod(node, 
            /*decorators*/ undefined, enclosingFunctionFlags & ts.FunctionFlags.Generator
                ? ts.visitNodes(node.modifiers, visitorNoAsyncModifier, ts.isModifier)
                : node.modifiers, enclosingFunctionFlags & ts.FunctionFlags.Async
                ? undefined
                : node.asteriskToken, ts.visitNode(node.name, visitor, ts.isPropertyName), ts.visitNode<ts.Token<ts.SyntaxKind.QuestionToken>>(/*questionToken*/ undefined, visitor, ts.isToken), 
            /*typeParameters*/ undefined, ts.visitParameterList(node.parameters, visitor, context), 
            /*type*/ undefined, enclosingFunctionFlags & ts.FunctionFlags.Async && enclosingFunctionFlags & ts.FunctionFlags.Generator
                ? transformAsyncGeneratorFunctionBody(node)
                : transformFunctionBody(node));
            enclosingFunctionFlags = savedEnclosingFunctionFlags;
            return updated;
        }
        function visitFunctionDeclaration(node: ts.FunctionDeclaration) {
            const savedEnclosingFunctionFlags = enclosingFunctionFlags;
            enclosingFunctionFlags = ts.getFunctionFlags(node);
            const updated = ts.updateFunctionDeclaration(node, 
            /*decorators*/ undefined, enclosingFunctionFlags & ts.FunctionFlags.Generator
                ? ts.visitNodes(node.modifiers, visitorNoAsyncModifier, ts.isModifier)
                : node.modifiers, enclosingFunctionFlags & ts.FunctionFlags.Async
                ? undefined
                : node.asteriskToken, node.name, 
            /*typeParameters*/ undefined, ts.visitParameterList(node.parameters, visitor, context), 
            /*type*/ undefined, enclosingFunctionFlags & ts.FunctionFlags.Async && enclosingFunctionFlags & ts.FunctionFlags.Generator
                ? transformAsyncGeneratorFunctionBody(node)
                : transformFunctionBody(node));
            enclosingFunctionFlags = savedEnclosingFunctionFlags;
            return updated;
        }
        function visitArrowFunction(node: ts.ArrowFunction) {
            const savedEnclosingFunctionFlags = enclosingFunctionFlags;
            enclosingFunctionFlags = ts.getFunctionFlags(node);
            const updated = ts.updateArrowFunction(node, node.modifiers, 
            /*typeParameters*/ undefined, ts.visitParameterList(node.parameters, visitor, context), 
            /*type*/ undefined, node.equalsGreaterThanToken, transformFunctionBody(node));
            enclosingFunctionFlags = savedEnclosingFunctionFlags;
            return updated;
        }
        function visitFunctionExpression(node: ts.FunctionExpression) {
            const savedEnclosingFunctionFlags = enclosingFunctionFlags;
            enclosingFunctionFlags = ts.getFunctionFlags(node);
            const updated = ts.updateFunctionExpression(node, enclosingFunctionFlags & ts.FunctionFlags.Generator
                ? ts.visitNodes(node.modifiers, visitorNoAsyncModifier, ts.isModifier)
                : node.modifiers, enclosingFunctionFlags & ts.FunctionFlags.Async
                ? undefined
                : node.asteriskToken, node.name, 
            /*typeParameters*/ undefined, ts.visitParameterList(node.parameters, visitor, context), 
            /*type*/ undefined, enclosingFunctionFlags & ts.FunctionFlags.Async && enclosingFunctionFlags & ts.FunctionFlags.Generator
                ? transformAsyncGeneratorFunctionBody(node)
                : transformFunctionBody(node));
            enclosingFunctionFlags = savedEnclosingFunctionFlags;
            return updated;
        }
        function transformAsyncGeneratorFunctionBody(node: ts.MethodDeclaration | ts.AccessorDeclaration | ts.FunctionDeclaration | ts.FunctionExpression): ts.FunctionBody {
            resumeLexicalEnvironment();
            const statements: ts.Statement[] = [];
            const statementOffset = ts.addPrologue(statements, node.body!.statements, /*ensureUseStrict*/ false, visitor);
            appendObjectRestAssignmentsIfNeeded(statements, node);
            const savedCapturedSuperProperties = capturedSuperProperties;
            const savedHasSuperElementAccess = hasSuperElementAccess;
            capturedSuperProperties = ts.createUnderscoreEscapedMap<true>();
            hasSuperElementAccess = false;
            const returnStatement = ts.createReturn(createAsyncGeneratorHelper(context, ts.createFunctionExpression(
            /*modifiers*/ undefined, ts.createToken(ts.SyntaxKind.AsteriskToken), node.name && ts.getGeneratedNameForNode(node.name), 
            /*typeParameters*/ undefined, 
            /*parameters*/ [], 
            /*type*/ undefined, ts.updateBlock((node.body!), ts.visitLexicalEnvironment(node.body!.statements, visitor, context, statementOffset))), !topLevel));
            // Minor optimization, emit `_super` helper to capture `super` access in an arrow.
            // This step isn't needed if we eventually transform this to ES5.
            const emitSuperHelpers = languageVersion >= ts.ScriptTarget.ES2015 && resolver.getNodeCheckFlags(node) & (ts.NodeCheckFlags.AsyncMethodWithSuperBinding | ts.NodeCheckFlags.AsyncMethodWithSuper);
            if (emitSuperHelpers) {
                enableSubstitutionForAsyncMethodsWithSuper();
                const variableStatement = ts.createSuperAccessVariableStatement(resolver, node, capturedSuperProperties);
                substitutedSuperAccessors[ts.getNodeId(variableStatement)] = true;
                ts.insertStatementsAfterStandardPrologue(statements, [variableStatement]);
            }
            statements.push(returnStatement);
            ts.insertStatementsAfterStandardPrologue(statements, endLexicalEnvironment());
            const block = ts.updateBlock((node.body!), statements);
            if (emitSuperHelpers && hasSuperElementAccess) {
                if (resolver.getNodeCheckFlags(node) & ts.NodeCheckFlags.AsyncMethodWithSuperBinding) {
                    ts.addEmitHelper(block, ts.advancedAsyncSuperHelper);
                }
                else if (resolver.getNodeCheckFlags(node) & ts.NodeCheckFlags.AsyncMethodWithSuper) {
                    ts.addEmitHelper(block, ts.asyncSuperHelper);
                }
            }
            capturedSuperProperties = savedCapturedSuperProperties;
            hasSuperElementAccess = savedHasSuperElementAccess;
            return block;
        }
        function transformFunctionBody(node: ts.FunctionDeclaration | ts.FunctionExpression | ts.ConstructorDeclaration | ts.MethodDeclaration | ts.AccessorDeclaration): ts.FunctionBody;
        function transformFunctionBody(node: ts.ArrowFunction): ts.ConciseBody;
        function transformFunctionBody(node: ts.FunctionLikeDeclaration): ts.ConciseBody {
            resumeLexicalEnvironment();
            let statementOffset = 0;
            const statements: ts.Statement[] = [];
            const body = ts.visitNode(node.body, visitor, ts.isConciseBody);
            if (ts.isBlock(body)) {
                statementOffset = ts.addPrologue(statements, body.statements, /*ensureUseStrict*/ false, visitor);
            }
            ts.addRange(statements, appendObjectRestAssignmentsIfNeeded(/*statements*/ undefined, node));
            const leadingStatements = endLexicalEnvironment();
            if (statementOffset > 0 || ts.some(statements) || ts.some(leadingStatements)) {
                const block = ts.convertToFunctionBody(body, /*multiLine*/ true);
                ts.insertStatementsAfterStandardPrologue(statements, leadingStatements);
                ts.addRange(statements, block.statements.slice(statementOffset));
                return ts.updateBlock(block, ts.setTextRange(ts.createNodeArray(statements), block.statements));
            }
            return body;
        }
        function appendObjectRestAssignmentsIfNeeded(statements: ts.Statement[] | undefined, node: ts.FunctionLikeDeclaration): ts.Statement[] | undefined {
            for (const parameter of node.parameters) {
                if (parameter.transformFlags & ts.TransformFlags.ContainsObjectRestOrSpread) {
                    const temp = ts.getGeneratedNameForNode(parameter);
                    const declarations = ts.flattenDestructuringBinding(parameter, visitor, context, ts.FlattenLevel.ObjectRest, temp, 
                    /*doNotRecordTempVariablesInLine*/ false, 
                    /*skipInitializer*/ true);
                    if (ts.some(declarations)) {
                        const statement = ts.createVariableStatement(
                        /*modifiers*/ undefined, ts.createVariableDeclarationList(declarations));
                        ts.setEmitFlags(statement, ts.EmitFlags.CustomPrologue);
                        statements = ts.append(statements, statement);
                    }
                }
            }
            return statements;
        }
        function enableSubstitutionForAsyncMethodsWithSuper() {
            if ((enabledSubstitutions & ESNextSubstitutionFlags.AsyncMethodsWithSuper) === 0) {
                enabledSubstitutions |= ESNextSubstitutionFlags.AsyncMethodsWithSuper;
                // We need to enable substitutions for call, property access, and element access
                // if we need to rewrite super calls.
                context.enableSubstitution(ts.SyntaxKind.CallExpression);
                context.enableSubstitution(ts.SyntaxKind.PropertyAccessExpression);
                context.enableSubstitution(ts.SyntaxKind.ElementAccessExpression);
                // We need to be notified when entering and exiting declarations that bind super.
                context.enableEmitNotification(ts.SyntaxKind.ClassDeclaration);
                context.enableEmitNotification(ts.SyntaxKind.MethodDeclaration);
                context.enableEmitNotification(ts.SyntaxKind.GetAccessor);
                context.enableEmitNotification(ts.SyntaxKind.SetAccessor);
                context.enableEmitNotification(ts.SyntaxKind.Constructor);
                // We need to be notified when entering the generated accessor arrow functions.
                context.enableEmitNotification(ts.SyntaxKind.VariableStatement);
            }
        }
        /**
         * Called by the printer just before a node is printed.
         *
         * @param hint A hint as to the intended usage of the node.
         * @param node The node to be printed.
         * @param emitCallback The callback used to emit the node.
         */
        function onEmitNode(hint: ts.EmitHint, node: ts.Node, emitCallback: (hint: ts.EmitHint, node: ts.Node) => void) {
            // If we need to support substitutions for `super` in an async method,
            // we should track it here.
            if (enabledSubstitutions & ESNextSubstitutionFlags.AsyncMethodsWithSuper && isSuperContainer(node)) {
                const superContainerFlags = resolver.getNodeCheckFlags(node) & (ts.NodeCheckFlags.AsyncMethodWithSuper | ts.NodeCheckFlags.AsyncMethodWithSuperBinding);
                if (superContainerFlags !== enclosingSuperContainerFlags) {
                    const savedEnclosingSuperContainerFlags = enclosingSuperContainerFlags;
                    enclosingSuperContainerFlags = superContainerFlags;
                    previousOnEmitNode(hint, node, emitCallback);
                    enclosingSuperContainerFlags = savedEnclosingSuperContainerFlags;
                    return;
                }
            }
            // Disable substitution in the generated super accessor itself.
            else if (enabledSubstitutions && substitutedSuperAccessors[ts.getNodeId(node)]) {
                const savedEnclosingSuperContainerFlags = enclosingSuperContainerFlags;
                enclosingSuperContainerFlags = (0 as ts.NodeCheckFlags);
                previousOnEmitNode(hint, node, emitCallback);
                enclosingSuperContainerFlags = savedEnclosingSuperContainerFlags;
                return;
            }
            previousOnEmitNode(hint, node, emitCallback);
        }
        /**
         * Hooks node substitutions.
         *
         * @param hint The context for the emitter.
         * @param node The node to substitute.
         */
        function onSubstituteNode(hint: ts.EmitHint, node: ts.Node) {
            node = previousOnSubstituteNode(hint, node);
            if (hint === ts.EmitHint.Expression && enclosingSuperContainerFlags) {
                return substituteExpression((<ts.Expression>node));
            }
            return node;
        }
        function substituteExpression(node: ts.Expression) {
            switch (node.kind) {
                case ts.SyntaxKind.PropertyAccessExpression:
                    return substitutePropertyAccessExpression((<ts.PropertyAccessExpression>node));
                case ts.SyntaxKind.ElementAccessExpression:
                    return substituteElementAccessExpression((<ts.ElementAccessExpression>node));
                case ts.SyntaxKind.CallExpression:
                    return substituteCallExpression((<ts.CallExpression>node));
            }
            return node;
        }
        function substitutePropertyAccessExpression(node: ts.PropertyAccessExpression) {
            if (node.expression.kind === ts.SyntaxKind.SuperKeyword) {
                return ts.setTextRange(ts.createPropertyAccess(ts.createFileLevelUniqueName("_super"), node.name), node);
            }
            return node;
        }
        function substituteElementAccessExpression(node: ts.ElementAccessExpression) {
            if (node.expression.kind === ts.SyntaxKind.SuperKeyword) {
                return createSuperElementAccessInAsyncMethod(node.argumentExpression, node);
            }
            return node;
        }
        function substituteCallExpression(node: ts.CallExpression): ts.Expression {
            const expression = node.expression;
            if (ts.isSuperProperty(expression)) {
                const argumentExpression = ts.isPropertyAccessExpression(expression)
                    ? substitutePropertyAccessExpression(expression)
                    : substituteElementAccessExpression(expression);
                return ts.createCall(ts.createPropertyAccess(argumentExpression, "call"), 
                /*typeArguments*/ undefined, [
                    ts.createThis(),
                    ...node.arguments
                ]);
            }
            return node;
        }
        function isSuperContainer(node: ts.Node) {
            const kind = node.kind;
            return kind === ts.SyntaxKind.ClassDeclaration
                || kind === ts.SyntaxKind.Constructor
                || kind === ts.SyntaxKind.MethodDeclaration
                || kind === ts.SyntaxKind.GetAccessor
                || kind === ts.SyntaxKind.SetAccessor;
        }
        function createSuperElementAccessInAsyncMethod(argumentExpression: ts.Expression, location: ts.TextRange): ts.LeftHandSideExpression {
            if (enclosingSuperContainerFlags & ts.NodeCheckFlags.AsyncMethodWithSuperBinding) {
                return ts.setTextRange(ts.createPropertyAccess(ts.createCall(ts.createIdentifier("_superIndex"), 
                /*typeArguments*/ undefined, [argumentExpression]), "value"), location);
            }
            else {
                return ts.setTextRange(ts.createCall(ts.createIdentifier("_superIndex"), 
                /*typeArguments*/ undefined, [argumentExpression]), location);
            }
        }
    }
    export const assignHelper: ts.UnscopedEmitHelper = {
        name: "typescript:assign",
        importName: "__assign",
        scoped: false,
        priority: 1,
        text: `
            var __assign = (this && this.__assign) || function () {
                __assign = Object.assign || function(t) {
                    for (var s, i = 1, n = arguments.length; i < n; i++) {
                        s = arguments[i];
                        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                            t[p] = s[p];
                    }
                    return t;
                };
                return __assign.apply(this, arguments);
            };`
    };
    export function createAssignHelper(context: ts.TransformationContext, attributesSegments: ts.Expression[]) {
        if ((context.getCompilerOptions().target!) >= ts.ScriptTarget.ES2015) {
            return ts.createCall(ts.createPropertyAccess(ts.createIdentifier("Object"), "assign"), /*typeArguments*/ undefined, attributesSegments);
        }
        context.requestEmitHelper(assignHelper);
        return ts.createCall(ts.getUnscopedHelperName("__assign"), 
        /*typeArguments*/ undefined, attributesSegments);
    }
    export const awaitHelper: ts.UnscopedEmitHelper = {
        name: "typescript:await",
        importName: "__await",
        scoped: false,
        text: `
            var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }`
    };
    function createAwaitHelper(context: ts.TransformationContext, expression: ts.Expression) {
        context.requestEmitHelper(awaitHelper);
        return ts.createCall(ts.getUnscopedHelperName("__await"), /*typeArguments*/ undefined, [expression]);
    }
    export const asyncGeneratorHelper: ts.UnscopedEmitHelper = {
        name: "typescript:asyncGenerator",
        importName: "__asyncGenerator",
        scoped: false,
        text: `
            var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
                if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
                var g = generator.apply(thisArg, _arguments || []), i, q = [];
                return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
                function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
                function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
                function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
                function fulfill(value) { resume("next", value); }
                function reject(value) { resume("throw", value); }
                function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
            };`
    };
    function createAsyncGeneratorHelper(context: ts.TransformationContext, generatorFunc: ts.FunctionExpression, hasLexicalThis: boolean) {
        context.requestEmitHelper(awaitHelper);
        context.requestEmitHelper(asyncGeneratorHelper);
        // Mark this node as originally an async function
        (generatorFunc.emitNode || (generatorFunc.emitNode = ({} as ts.EmitNode))).flags |= ts.EmitFlags.AsyncFunctionBody;
        return ts.createCall(ts.getUnscopedHelperName("__asyncGenerator"), 
        /*typeArguments*/ undefined, [
            hasLexicalThis ? ts.createThis() : ts.createVoidZero(),
            ts.createIdentifier("arguments"),
            generatorFunc
        ]);
    }
    export const asyncDelegator: ts.UnscopedEmitHelper = {
        name: "typescript:asyncDelegator",
        importName: "__asyncDelegator",
        scoped: false,
        text: `
            var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
                var i, p;
                return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
                function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
            };`
    };
    function createAsyncDelegatorHelper(context: ts.TransformationContext, expression: ts.Expression, location?: ts.TextRange) {
        context.requestEmitHelper(awaitHelper);
        context.requestEmitHelper(asyncDelegator);
        return ts.setTextRange(ts.createCall(ts.getUnscopedHelperName("__asyncDelegator"), 
        /*typeArguments*/ undefined, [expression]), location);
    }
    export const asyncValues: ts.UnscopedEmitHelper = {
        name: "typescript:asyncValues",
        importName: "__asyncValues",
        scoped: false,
        text: `
            var __asyncValues = (this && this.__asyncValues) || function (o) {
                if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
                var m = o[Symbol.asyncIterator], i;
                return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
                function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
                function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
            };`
    };
    function createAsyncValuesHelper(context: ts.TransformationContext, expression: ts.Expression, location?: ts.TextRange) {
        context.requestEmitHelper(asyncValues);
        return ts.setTextRange(ts.createCall(ts.getUnscopedHelperName("__asyncValues"), 
        /*typeArguments*/ undefined, [expression]), location);
    }
}
