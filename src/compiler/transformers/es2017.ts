/*@internal*/
namespace ts {
    type SuperContainer = ts.ClassDeclaration | ts.MethodDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration | ts.ConstructorDeclaration;
    const enum ES2017SubstitutionFlags {
        /** Enables substitutions for async methods with `super` calls. */
        AsyncMethodsWithSuper = 1 << 0
    }
    export function transformES2017(context: ts.TransformationContext) {
        const { resumeLexicalEnvironment, endLexicalEnvironment, hoistVariableDeclaration } = context;
        const resolver = context.getEmitResolver();
        const compilerOptions = context.getCompilerOptions();
        const languageVersion = ts.getEmitScriptTarget(compilerOptions);
        /**
         * Keeps track of whether expression substitution has been enabled for specific edge cases.
         * They are persisted between each SourceFile transformation and should not be reset.
         */
        let enabledSubstitutions: ES2017SubstitutionFlags;
        /**
         * This keeps track of containers where `super` is valid, for use with
         * just-in-time substitution for `super` expressions inside of async methods.
         */
        let enclosingSuperContainerFlags: ts.NodeCheckFlags = 0;
        let enclosingFunctionParameterNames: ts.UnderscoreEscapedMap<true>;
        /**
         * Keeps track of property names accessed on super (`super.x`) within async functions.
         */
        let capturedSuperProperties: ts.UnderscoreEscapedMap<true>;
        /** Whether the async function contains an element access on super (`super[x]`). */
        let hasSuperElementAccess: boolean;
        /** A set of node IDs for generated super accessors (variable statements). */
        const substitutedSuperAccessors: boolean[] = [];
        let topLevel: boolean;
        // Save the previous transformation hooks.
        const previousOnEmitNode = context.onEmitNode;
        const previousOnSubstituteNode = context.onSubstituteNode;
        // Set new transformation hooks.
        context.onEmitNode = onEmitNode;
        context.onSubstituteNode = onSubstituteNode;
        return ts.chainBundle(transformSourceFile);
        function transformSourceFile(node: ts.SourceFile) {
            if (node.isDeclarationFile) {
                return node;
            }
            topLevel = ts.isEffectiveStrictModeSourceFile(node, compilerOptions);
            const visited = ts.visitEachChild(node, visitor, context);
            ts.addEmitHelpers(visited, context.readEmitHelpers());
            return visited;
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
        function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
            if ((node.transformFlags & ts.TransformFlags.ContainsES2017) === 0) {
                return node;
            }
            switch (node.kind) {
                case ts.SyntaxKind.AsyncKeyword:
                    // ES2017 async modifier should be elided for targets < ES2017
                    return undefined;
                case ts.SyntaxKind.AwaitExpression:
                    return visitAwaitExpression((<ts.AwaitExpression>node));
                case ts.SyntaxKind.MethodDeclaration:
                    return doOutsideOfTopLevel(visitMethodDeclaration, (<ts.MethodDeclaration>node));
                case ts.SyntaxKind.FunctionDeclaration:
                    return doOutsideOfTopLevel(visitFunctionDeclaration, (<ts.FunctionDeclaration>node));
                case ts.SyntaxKind.FunctionExpression:
                    return doOutsideOfTopLevel(visitFunctionExpression, (<ts.FunctionExpression>node));
                case ts.SyntaxKind.ArrowFunction:
                    return visitArrowFunction((<ts.ArrowFunction>node));
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
                case ts.SyntaxKind.GetAccessor:
                case ts.SyntaxKind.SetAccessor:
                case ts.SyntaxKind.Constructor:
                case ts.SyntaxKind.ClassDeclaration:
                case ts.SyntaxKind.ClassExpression:
                    return doOutsideOfTopLevel(visitDefault, node);
                default:
                    return ts.visitEachChild(node, visitor, context);
            }
        }
        function asyncBodyVisitor(node: ts.Node): ts.VisitResult<ts.Node> {
            if (ts.isNodeWithPossibleHoistedDeclaration(node)) {
                switch (node.kind) {
                    case ts.SyntaxKind.VariableStatement:
                        return visitVariableStatementInAsyncBody(node);
                    case ts.SyntaxKind.ForStatement:
                        return visitForStatementInAsyncBody(node);
                    case ts.SyntaxKind.ForInStatement:
                        return visitForInStatementInAsyncBody(node);
                    case ts.SyntaxKind.ForOfStatement:
                        return visitForOfStatementInAsyncBody(node);
                    case ts.SyntaxKind.CatchClause:
                        return visitCatchClauseInAsyncBody(node);
                    case ts.SyntaxKind.Block:
                    case ts.SyntaxKind.SwitchStatement:
                    case ts.SyntaxKind.CaseBlock:
                    case ts.SyntaxKind.CaseClause:
                    case ts.SyntaxKind.DefaultClause:
                    case ts.SyntaxKind.TryStatement:
                    case ts.SyntaxKind.DoStatement:
                    case ts.SyntaxKind.WhileStatement:
                    case ts.SyntaxKind.IfStatement:
                    case ts.SyntaxKind.WithStatement:
                    case ts.SyntaxKind.LabeledStatement:
                        return ts.visitEachChild(node, asyncBodyVisitor, context);
                    default:
                        return ts.Debug.assertNever(node, "Unhandled node.");
                }
            }
            return visitor(node);
        }
        function visitCatchClauseInAsyncBody(node: ts.CatchClause) {
            const catchClauseNames = ts.createUnderscoreEscapedMap<true>();
            recordDeclarationName(node.variableDeclaration!, catchClauseNames); // TODO: GH#18217
            // names declared in a catch variable are block scoped
            let catchClauseUnshadowedNames: ts.UnderscoreEscapedMap<true> | undefined;
            catchClauseNames.forEach((_, escapedName) => {
                if (enclosingFunctionParameterNames.has(escapedName)) {
                    if (!catchClauseUnshadowedNames) {
                        catchClauseUnshadowedNames = ts.cloneMap(enclosingFunctionParameterNames);
                    }
                    catchClauseUnshadowedNames.delete(escapedName);
                }
            });
            if (catchClauseUnshadowedNames) {
                const savedEnclosingFunctionParameterNames = enclosingFunctionParameterNames;
                enclosingFunctionParameterNames = catchClauseUnshadowedNames;
                const result = ts.visitEachChild(node, asyncBodyVisitor, context);
                enclosingFunctionParameterNames = savedEnclosingFunctionParameterNames;
                return result;
            }
            else {
                return ts.visitEachChild(node, asyncBodyVisitor, context);
            }
        }
        function visitVariableStatementInAsyncBody(node: ts.VariableStatement) {
            if (isVariableDeclarationListWithCollidingName(node.declarationList)) {
                const expression = visitVariableDeclarationListWithCollidingNames(node.declarationList, /*hasReceiver*/ false);
                return expression ? ts.createExpressionStatement(expression) : undefined;
            }
            return ts.visitEachChild(node, visitor, context);
        }
        function visitForInStatementInAsyncBody(node: ts.ForInStatement) {
            return ts.updateForIn(node, isVariableDeclarationListWithCollidingName(node.initializer)
                ? visitVariableDeclarationListWithCollidingNames(node.initializer, /*hasReceiver*/ true)!
                : ts.visitNode(node.initializer, visitor, ts.isForInitializer), ts.visitNode(node.expression, visitor, ts.isExpression), ts.visitNode(node.statement, asyncBodyVisitor, ts.isStatement, ts.liftToBlock));
        }
        function visitForOfStatementInAsyncBody(node: ts.ForOfStatement) {
            return ts.updateForOf(node, ts.visitNode(node.awaitModifier, visitor, ts.isToken), isVariableDeclarationListWithCollidingName(node.initializer)
                ? visitVariableDeclarationListWithCollidingNames(node.initializer, /*hasReceiver*/ true)!
                : ts.visitNode(node.initializer, visitor, ts.isForInitializer), ts.visitNode(node.expression, visitor, ts.isExpression), ts.visitNode(node.statement, asyncBodyVisitor, ts.isStatement, ts.liftToBlock));
        }
        function visitForStatementInAsyncBody(node: ts.ForStatement) {
            const initializer = node.initializer!; // TODO: GH#18217
            return ts.updateFor(node, isVariableDeclarationListWithCollidingName(initializer)
                ? visitVariableDeclarationListWithCollidingNames(initializer, /*hasReceiver*/ false)
                : ts.visitNode(node.initializer, visitor, ts.isForInitializer), ts.visitNode(node.condition, visitor, ts.isExpression), ts.visitNode(node.incrementor, visitor, ts.isExpression), ts.visitNode(node.statement, asyncBodyVisitor, ts.isStatement, ts.liftToBlock));
        }
        /**
         * Visits an AwaitExpression node.
         *
         * This function will be called any time a ES2017 await expression is encountered.
         *
         * @param node The node to visit.
         */
        function visitAwaitExpression(node: ts.AwaitExpression): ts.Expression {
            return ts.setOriginalNode(ts.setTextRange(ts.createYield(
            /*asteriskToken*/ undefined, ts.visitNode(node.expression, visitor, ts.isExpression)), node), node);
        }
        /**
         * Visits a MethodDeclaration node.
         *
         * This function will be called when one of the following conditions are met:
         * - The node is marked as async
         *
         * @param node The node to visit.
         */
        function visitMethodDeclaration(node: ts.MethodDeclaration) {
            return ts.updateMethod(node, 
            /*decorators*/ undefined, ts.visitNodes(node.modifiers, visitor, ts.isModifier), node.asteriskToken, node.name, 
            /*questionToken*/ undefined, 
            /*typeParameters*/ undefined, ts.visitParameterList(node.parameters, visitor, context), 
            /*type*/ undefined, ts.getFunctionFlags(node) & ts.FunctionFlags.Async
                ? transformAsyncFunctionBody(node)
                : ts.visitFunctionBody(node.body, visitor, context));
        }
        /**
         * Visits a FunctionDeclaration node.
         *
         * This function will be called when one of the following conditions are met:
         * - The node is marked async
         *
         * @param node The node to visit.
         */
        function visitFunctionDeclaration(node: ts.FunctionDeclaration): ts.VisitResult<ts.Statement> {
            return ts.updateFunctionDeclaration(node, 
            /*decorators*/ undefined, ts.visitNodes(node.modifiers, visitor, ts.isModifier), node.asteriskToken, node.name, 
            /*typeParameters*/ undefined, ts.visitParameterList(node.parameters, visitor, context), 
            /*type*/ undefined, ts.getFunctionFlags(node) & ts.FunctionFlags.Async
                ? transformAsyncFunctionBody(node)
                : ts.visitFunctionBody(node.body, visitor, context));
        }
        /**
         * Visits a FunctionExpression node.
         *
         * This function will be called when one of the following conditions are met:
         * - The node is marked async
         *
         * @param node The node to visit.
         */
        function visitFunctionExpression(node: ts.FunctionExpression): ts.Expression {
            return ts.updateFunctionExpression(node, ts.visitNodes(node.modifiers, visitor, ts.isModifier), node.asteriskToken, node.name, 
            /*typeParameters*/ undefined, ts.visitParameterList(node.parameters, visitor, context), 
            /*type*/ undefined, ts.getFunctionFlags(node) & ts.FunctionFlags.Async
                ? transformAsyncFunctionBody(node)
                : ts.visitFunctionBody(node.body, visitor, context));
        }
        /**
         * Visits an ArrowFunction.
         *
         * This function will be called when one of the following conditions are met:
         * - The node is marked async
         *
         * @param node The node to visit.
         */
        function visitArrowFunction(node: ts.ArrowFunction) {
            return ts.updateArrowFunction(node, ts.visitNodes(node.modifiers, visitor, ts.isModifier), 
            /*typeParameters*/ undefined, ts.visitParameterList(node.parameters, visitor, context), 
            /*type*/ undefined, node.equalsGreaterThanToken, ts.getFunctionFlags(node) & ts.FunctionFlags.Async
                ? transformAsyncFunctionBody(node)
                : ts.visitFunctionBody(node.body, visitor, context));
        }
        function recordDeclarationName({ name }: ts.ParameterDeclaration | ts.VariableDeclaration | ts.BindingElement, names: ts.UnderscoreEscapedMap<true>) {
            if (ts.isIdentifier(name)) {
                names.set(name.escapedText, true);
            }
            else {
                for (const element of name.elements) {
                    if (!ts.isOmittedExpression(element)) {
                        recordDeclarationName(element, names);
                    }
                }
            }
        }
        function isVariableDeclarationListWithCollidingName(node: ts.ForInitializer): node is ts.VariableDeclarationList {
            return !!node
                && ts.isVariableDeclarationList(node)
                && !(node.flags & ts.NodeFlags.BlockScoped)
                && node.declarations.some(collidesWithParameterName);
        }
        function visitVariableDeclarationListWithCollidingNames(node: ts.VariableDeclarationList, hasReceiver: boolean) {
            hoistVariableDeclarationList(node);
            const variables = ts.getInitializedVariables(node);
            if (variables.length === 0) {
                if (hasReceiver) {
                    return ts.visitNode(ts.convertToAssignmentElementTarget(node.declarations[0].name), visitor, ts.isExpression);
                }
                return undefined;
            }
            return ts.inlineExpressions(ts.map(variables, transformInitializedVariable));
        }
        function hoistVariableDeclarationList(node: ts.VariableDeclarationList) {
            ts.forEach(node.declarations, hoistVariable);
        }
        function hoistVariable({ name }: ts.VariableDeclaration | ts.BindingElement) {
            if (ts.isIdentifier(name)) {
                hoistVariableDeclaration(name);
            }
            else {
                for (const element of name.elements) {
                    if (!ts.isOmittedExpression(element)) {
                        hoistVariable(element);
                    }
                }
            }
        }
        function transformInitializedVariable(node: ts.VariableDeclaration) {
            const converted = ts.setSourceMapRange(ts.createAssignment(ts.convertToAssignmentElementTarget(node.name), (node.initializer!)), node);
            return ts.visitNode(converted, visitor, ts.isExpression);
        }
        function collidesWithParameterName({ name }: ts.VariableDeclaration | ts.BindingElement): boolean {
            if (ts.isIdentifier(name)) {
                return enclosingFunctionParameterNames.has(name.escapedText);
            }
            else {
                for (const element of name.elements) {
                    if (!ts.isOmittedExpression(element) && collidesWithParameterName(element)) {
                        return true;
                    }
                }
            }
            return false;
        }
        function transformAsyncFunctionBody(node: ts.MethodDeclaration | ts.AccessorDeclaration | ts.FunctionDeclaration | ts.FunctionExpression): ts.FunctionBody;
        function transformAsyncFunctionBody(node: ts.ArrowFunction): ts.ConciseBody;
        function transformAsyncFunctionBody(node: ts.FunctionLikeDeclaration): ts.ConciseBody {
            resumeLexicalEnvironment();
            const original = ts.getOriginalNode(node, ts.isFunctionLike);
            const nodeType = original.type;
            const promiseConstructor = languageVersion < ts.ScriptTarget.ES2015 ? getPromiseConstructor(nodeType) : undefined;
            const isArrowFunction = node.kind === ts.SyntaxKind.ArrowFunction;
            const hasLexicalArguments = (resolver.getNodeCheckFlags(node) & ts.NodeCheckFlags.CaptureArguments) !== 0;
            // An async function is emit as an outer function that calls an inner
            // generator function. To preserve lexical bindings, we pass the current
            // `this` and `arguments` objects to `__awaiter`. The generator function
            // passed to `__awaiter` is executed inside of the callback to the
            // promise constructor.
            const savedEnclosingFunctionParameterNames = enclosingFunctionParameterNames;
            enclosingFunctionParameterNames = ts.createUnderscoreEscapedMap<true>();
            for (const parameter of node.parameters) {
                recordDeclarationName(parameter, enclosingFunctionParameterNames);
            }
            const savedCapturedSuperProperties = capturedSuperProperties;
            const savedHasSuperElementAccess = hasSuperElementAccess;
            if (!isArrowFunction) {
                capturedSuperProperties = ts.createUnderscoreEscapedMap<true>();
                hasSuperElementAccess = false;
            }
            let result: ts.ConciseBody;
            if (!isArrowFunction) {
                const statements: ts.Statement[] = [];
                const statementOffset = ts.addPrologue(statements, (<ts.Block>node.body).statements, /*ensureUseStrict*/ false, visitor);
                statements.push(ts.createReturn(createAwaiterHelper(context, !topLevel, hasLexicalArguments, promiseConstructor, transformAsyncFunctionBodyWorker((<ts.Block>node.body), statementOffset))));
                ts.insertStatementsAfterStandardPrologue(statements, endLexicalEnvironment());
                // Minor optimization, emit `_super` helper to capture `super` access in an arrow.
                // This step isn't needed if we eventually transform this to ES5.
                const emitSuperHelpers = languageVersion >= ts.ScriptTarget.ES2015 && resolver.getNodeCheckFlags(node) & (ts.NodeCheckFlags.AsyncMethodWithSuperBinding | ts.NodeCheckFlags.AsyncMethodWithSuper);
                if (emitSuperHelpers) {
                    enableSubstitutionForAsyncMethodsWithSuper();
                    if (ts.hasEntries(capturedSuperProperties)) {
                        const variableStatement = createSuperAccessVariableStatement(resolver, node, capturedSuperProperties);
                        substitutedSuperAccessors[ts.getNodeId(variableStatement)] = true;
                        ts.insertStatementsAfterStandardPrologue(statements, [variableStatement]);
                    }
                }
                const block = ts.createBlock(statements, /*multiLine*/ true);
                ts.setTextRange(block, node.body);
                if (emitSuperHelpers && hasSuperElementAccess) {
                    // Emit helpers for super element access expressions (`super[x]`).
                    if (resolver.getNodeCheckFlags(node) & ts.NodeCheckFlags.AsyncMethodWithSuperBinding) {
                        ts.addEmitHelper(block, advancedAsyncSuperHelper);
                    }
                    else if (resolver.getNodeCheckFlags(node) & ts.NodeCheckFlags.AsyncMethodWithSuper) {
                        ts.addEmitHelper(block, asyncSuperHelper);
                    }
                }
                result = block;
            }
            else {
                const expression = createAwaiterHelper(context, !topLevel, hasLexicalArguments, promiseConstructor, transformAsyncFunctionBodyWorker(node.body!));
                const declarations = endLexicalEnvironment();
                if (ts.some(declarations)) {
                    const block = ts.convertToFunctionBody(expression);
                    result = ts.updateBlock(block, ts.setTextRange(ts.createNodeArray(ts.concatenate(declarations, block.statements)), block.statements));
                }
                else {
                    result = expression;
                }
            }
            enclosingFunctionParameterNames = savedEnclosingFunctionParameterNames;
            if (!isArrowFunction) {
                capturedSuperProperties = savedCapturedSuperProperties;
                hasSuperElementAccess = savedHasSuperElementAccess;
            }
            return result;
        }
        function transformAsyncFunctionBodyWorker(body: ts.ConciseBody, start?: number) {
            if (ts.isBlock(body)) {
                return ts.updateBlock(body, ts.visitNodes(body.statements, asyncBodyVisitor, ts.isStatement, start));
            }
            else {
                return ts.convertToFunctionBody(ts.visitNode(body, asyncBodyVisitor, ts.isConciseBody));
            }
        }
        function getPromiseConstructor(type: ts.TypeNode | undefined) {
            const typeName = type && ts.getEntityNameFromTypeNode(type);
            if (typeName && ts.isEntityName(typeName)) {
                const serializationKind = resolver.getTypeReferenceSerializationKind(typeName);
                if (serializationKind === ts.TypeReferenceSerializationKind.TypeWithConstructSignatureAndValue
                    || serializationKind === ts.TypeReferenceSerializationKind.Unknown) {
                    return typeName;
                }
            }
            return undefined;
        }
        function enableSubstitutionForAsyncMethodsWithSuper() {
            if ((enabledSubstitutions & ES2017SubstitutionFlags.AsyncMethodsWithSuper) === 0) {
                enabledSubstitutions |= ES2017SubstitutionFlags.AsyncMethodsWithSuper;
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
         * Hook for node emit.
         *
         * @param hint A hint as to the intended usage of the node.
         * @param node The node to emit.
         * @param emit A callback used to emit the node in the printer.
         */
        function onEmitNode(hint: ts.EmitHint, node: ts.Node, emitCallback: (hint: ts.EmitHint, node: ts.Node) => void): void {
            // If we need to support substitutions for `super` in an async method,
            // we should track it here.
            if (enabledSubstitutions & ES2017SubstitutionFlags.AsyncMethodsWithSuper && isSuperContainer(node)) {
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
                enclosingSuperContainerFlags = 0;
                previousOnEmitNode(hint, node, emitCallback);
                enclosingSuperContainerFlags = savedEnclosingSuperContainerFlags;
                return;
            }
            previousOnEmitNode(hint, node, emitCallback);
        }
        /**
         * Hooks node substitutions.
         *
         * @param hint A hint as to the intended usage of the node.
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
        function isSuperContainer(node: ts.Node): node is SuperContainer {
            const kind = node.kind;
            return kind === ts.SyntaxKind.ClassDeclaration
                || kind === ts.SyntaxKind.Constructor
                || kind === ts.SyntaxKind.MethodDeclaration
                || kind === ts.SyntaxKind.GetAccessor
                || kind === ts.SyntaxKind.SetAccessor;
        }
        function createSuperElementAccessInAsyncMethod(argumentExpression: ts.Expression, location: ts.TextRange): ts.LeftHandSideExpression {
            if (enclosingSuperContainerFlags & ts.NodeCheckFlags.AsyncMethodWithSuperBinding) {
                return ts.setTextRange(ts.createPropertyAccess(ts.createCall(ts.createFileLevelUniqueName("_superIndex"), 
                /*typeArguments*/ undefined, [argumentExpression]), "value"), location);
            }
            else {
                return ts.setTextRange(ts.createCall(ts.createFileLevelUniqueName("_superIndex"), 
                /*typeArguments*/ undefined, [argumentExpression]), location);
            }
        }
    }
    /** Creates a variable named `_super` with accessor properties for the given property names. */
    export function createSuperAccessVariableStatement(resolver: ts.EmitResolver, node: ts.FunctionLikeDeclaration, names: ts.UnderscoreEscapedMap<true>) {
        // Create a variable declaration with a getter/setter (if binding) definition for each name:
        //   const _super = Object.create(null, { x: { get: () => super.x, set: (v) => super.x = v }, ... });
        const hasBinding = (resolver.getNodeCheckFlags(node) & ts.NodeCheckFlags.AsyncMethodWithSuperBinding) !== 0;
        const accessors: ts.PropertyAssignment[] = [];
        names.forEach((_, key) => {
            const name = ts.unescapeLeadingUnderscores(key);
            const getterAndSetter: ts.PropertyAssignment[] = [];
            getterAndSetter.push(ts.createPropertyAssignment("get", ts.createArrowFunction(
            /* modifiers */ undefined, 
            /* typeParameters */ undefined, 
            /* parameters */ [], 
            /* type */ undefined, 
            /* equalsGreaterThanToken */ undefined, ts.setEmitFlags(ts.createPropertyAccess(ts.setEmitFlags(ts.createSuper(), ts.EmitFlags.NoSubstitution), name), ts.EmitFlags.NoSubstitution))));
            if (hasBinding) {
                getterAndSetter.push(ts.createPropertyAssignment("set", ts.createArrowFunction(
                /* modifiers */ undefined, 
                /* typeParameters */ undefined, 
                /* parameters */ [
                    ts.createParameter(
                    /* decorators */ undefined, 
                    /* modifiers */ undefined, 
                    /* dotDotDotToken */ undefined, "v", 
                    /* questionToken */ undefined, 
                    /* type */ undefined, 
                    /* initializer */ undefined)
                ], 
                /* type */ undefined, 
                /* equalsGreaterThanToken */ undefined, ts.createAssignment(ts.setEmitFlags(ts.createPropertyAccess(ts.setEmitFlags(ts.createSuper(), ts.EmitFlags.NoSubstitution), name), ts.EmitFlags.NoSubstitution), ts.createIdentifier("v")))));
            }
            accessors.push(ts.createPropertyAssignment(name, ts.createObjectLiteral(getterAndSetter)));
        });
        return ts.createVariableStatement(
        /* modifiers */ undefined, ts.createVariableDeclarationList([
            ts.createVariableDeclaration(ts.createFileLevelUniqueName("_super"), 
            /* type */ undefined, ts.createCall(ts.createPropertyAccess(ts.createIdentifier("Object"), "create"), 
            /* typeArguments */ undefined, [
                ts.createNull(),
                ts.createObjectLiteral(accessors, /* multiline */ true)
            ]))
        ], ts.NodeFlags.Const));
    }
    export const awaiterHelper: ts.UnscopedEmitHelper = {
        name: "typescript:awaiter",
        importName: "__awaiter",
        scoped: false,
        priority: 5,
        text: `
            var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
                function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
                return new (P || (P = Promise))(function (resolve, reject) {
                    function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
                    function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
                    function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
                    step((generator = generator.apply(thisArg, _arguments || [])).next());
                });
            };`
    };
    function createAwaiterHelper(context: ts.TransformationContext, hasLexicalThis: boolean, hasLexicalArguments: boolean, promiseConstructor: ts.EntityName | ts.Expression | undefined, body: ts.Block) {
        context.requestEmitHelper(awaiterHelper);
        const generatorFunc = ts.createFunctionExpression(
        /*modifiers*/ undefined, ts.createToken(ts.SyntaxKind.AsteriskToken), 
        /*name*/ undefined, 
        /*typeParameters*/ undefined, 
        /*parameters*/ [], 
        /*type*/ undefined, body);
        // Mark this node as originally an async function
        (generatorFunc.emitNode || (generatorFunc.emitNode = ({} as ts.EmitNode))).flags |= ts.EmitFlags.AsyncFunctionBody | ts.EmitFlags.ReuseTempVariableScope;
        return ts.createCall(ts.getUnscopedHelperName("__awaiter"), 
        /*typeArguments*/ undefined, [
            hasLexicalThis ? ts.createThis() : ts.createVoidZero(),
            hasLexicalArguments ? ts.createIdentifier("arguments") : ts.createVoidZero(),
            promiseConstructor ? ts.createExpressionFromEntityName(promiseConstructor) : ts.createVoidZero(),
            generatorFunc
        ]);
    }
    export const asyncSuperHelper: ts.EmitHelper = {
        name: "typescript:async-super",
        scoped: true,
        text: ts.helperString `
            const ${"_superIndex"} = name => super[name];`
    };
    export const advancedAsyncSuperHelper: ts.EmitHelper = {
        name: "typescript:advanced-async-super",
        scoped: true,
        text: ts.helperString `
            const ${"_superIndex"} = (function (geti, seti) {
                const cache = Object.create(null);
                return name => cache[name] || (cache[name] = { get value() { return geti(name); }, set value(v) { seti(name, v); } });
            })(name => super[name], (name, value) => super[name] = value);`
    };
}
