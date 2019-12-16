/* @internal */
namespace ts {
    function getModuleTransformer(moduleKind: ts.ModuleKind): ts.TransformerFactory<ts.SourceFile | ts.Bundle> {
        switch (moduleKind) {
            case ts.ModuleKind.ESNext:
            case ts.ModuleKind.ES2015:
                return ts.transformES2015Module;
            case ts.ModuleKind.System:
                return ts.transformSystemModule;
            default:
                return ts.transformModule;
        }
    }
    const enum TransformationState {
        Uninitialized,
        Initialized,
        Completed,
        Disposed
    }
    const enum SyntaxKindFeatureFlags {
        Substitution = 1 << 0,
        EmitNotifications = 1 << 1
    }
    export const noTransformers: ts.EmitTransformers = { scriptTransformers: ts.emptyArray, declarationTransformers: ts.emptyArray };
    export function getTransformers(compilerOptions: ts.CompilerOptions, customTransformers?: ts.CustomTransformers, emitOnlyDtsFiles?: boolean): ts.EmitTransformers {
        return {
            scriptTransformers: getScriptTransformers(compilerOptions, customTransformers, emitOnlyDtsFiles),
            declarationTransformers: getDeclarationTransformers(customTransformers),
        };
    }
    function getScriptTransformers(compilerOptions: ts.CompilerOptions, customTransformers?: ts.CustomTransformers, emitOnlyDtsFiles?: boolean) {
        if (emitOnlyDtsFiles)
            return ts.emptyArray;
        const jsx = compilerOptions.jsx;
        const languageVersion = ts.getEmitScriptTarget(compilerOptions);
        const moduleKind = ts.getEmitModuleKind(compilerOptions);
        const transformers: ts.TransformerFactory<ts.SourceFile | ts.Bundle>[] = [];
        ts.addRange(transformers, customTransformers && ts.map(customTransformers.before, wrapScriptTransformerFactory));
        transformers.push(ts.transformTypeScript);
        transformers.push(ts.transformClassFields);
        if (jsx === ts.JsxEmit.React) {
            transformers.push(ts.transformJsx);
        }
        if (languageVersion < ts.ScriptTarget.ESNext) {
            transformers.push(ts.transformESNext);
        }
        if (languageVersion < ts.ScriptTarget.ES2019) {
            transformers.push(ts.transformES2019);
        }
        if (languageVersion < ts.ScriptTarget.ES2018) {
            transformers.push(ts.transformES2018);
        }
        if (languageVersion < ts.ScriptTarget.ES2017) {
            transformers.push(ts.transformES2017);
        }
        if (languageVersion < ts.ScriptTarget.ES2016) {
            transformers.push(ts.transformES2016);
        }
        if (languageVersion < ts.ScriptTarget.ES2015) {
            transformers.push(ts.transformES2015);
            transformers.push(ts.transformGenerators);
        }
        transformers.push(getModuleTransformer(moduleKind));
        // The ES5 transformer is last so that it can substitute expressions like `exports.default`
        // for ES3.
        if (languageVersion < ts.ScriptTarget.ES5) {
            transformers.push(ts.transformES5);
        }
        ts.addRange(transformers, customTransformers && ts.map(customTransformers.after, wrapScriptTransformerFactory));
        return transformers;
    }
    function getDeclarationTransformers(customTransformers?: ts.CustomTransformers) {
        const transformers: ts.TransformerFactory<ts.SourceFile | ts.Bundle>[] = [];
        transformers.push(ts.transformDeclarations);
        ts.addRange(transformers, customTransformers && ts.map(customTransformers.afterDeclarations, wrapDeclarationTransformerFactory));
        return transformers;
    }
    /**
     * Wrap a custom script or declaration transformer object in a `Transformer` callback with fallback support for transforming bundles.
     */
    function wrapCustomTransformer(transformer: ts.CustomTransformer): ts.Transformer<ts.Bundle | ts.SourceFile> {
        return node => ts.isBundle(node) ? transformer.transformBundle(node) : transformer.transformSourceFile(node);
    }
    /**
     * Wrap a transformer factory that may return a custom script or declaration transformer object.
     */
    function wrapCustomTransformerFactory<T extends ts.SourceFile | ts.Bundle>(transformer: ts.TransformerFactory<T> | ts.CustomTransformerFactory, handleDefault: (node: ts.Transformer<T>) => ts.Transformer<ts.Bundle | ts.SourceFile>): ts.TransformerFactory<ts.Bundle | ts.SourceFile> {
        return context => {
            const customTransformer = transformer(context);
            return typeof customTransformer === "function"
                ? handleDefault(customTransformer)
                : wrapCustomTransformer(customTransformer);
        };
    }
    function wrapScriptTransformerFactory(transformer: ts.TransformerFactory<ts.SourceFile> | ts.CustomTransformerFactory): ts.TransformerFactory<ts.Bundle | ts.SourceFile> {
        return wrapCustomTransformerFactory(transformer, ts.chainBundle);
    }
    function wrapDeclarationTransformerFactory(transformer: ts.TransformerFactory<ts.Bundle | ts.SourceFile> | ts.CustomTransformerFactory): ts.TransformerFactory<ts.Bundle | ts.SourceFile> {
        return wrapCustomTransformerFactory(transformer, ts.identity);
    }
    export function noEmitSubstitution(_hint: ts.EmitHint, node: ts.Node) {
        return node;
    }
    export function noEmitNotification(hint: ts.EmitHint, node: ts.Node, callback: (hint: ts.EmitHint, node: ts.Node) => void) {
        callback(hint, node);
    }
    /**
     * Transforms an array of SourceFiles by passing them through each transformer.
     *
     * @param resolver The emit resolver provided by the checker.
     * @param host The emit host object used to interact with the file system.
     * @param options Compiler options to surface in the `TransformationContext`.
     * @param nodes An array of nodes to transform.
     * @param transforms An array of `TransformerFactory` callbacks.
     * @param allowDtsFiles A value indicating whether to allow the transformation of .d.ts files.
     */
    export function transformNodes<T extends ts.Node>(resolver: ts.EmitResolver | undefined, host: ts.EmitHost | undefined, options: ts.CompilerOptions, nodes: readonly T[], transformers: readonly ts.TransformerFactory<T>[], allowDtsFiles: boolean): ts.TransformationResult<T> {
        const enabledSyntaxKindFeatures = new Array<SyntaxKindFeatureFlags>(ts.SyntaxKind.Count);
        let lexicalEnvironmentVariableDeclarations: ts.VariableDeclaration[];
        let lexicalEnvironmentFunctionDeclarations: ts.FunctionDeclaration[];
        let lexicalEnvironmentVariableDeclarationsStack: ts.VariableDeclaration[][] = [];
        let lexicalEnvironmentFunctionDeclarationsStack: ts.FunctionDeclaration[][] = [];
        let lexicalEnvironmentStackOffset = 0;
        let lexicalEnvironmentSuspended = false;
        let emitHelpers: ts.EmitHelper[] | undefined;
        let onSubstituteNode: ts.TransformationContext["onSubstituteNode"] = noEmitSubstitution;
        let onEmitNode: ts.TransformationContext["onEmitNode"] = noEmitNotification;
        let state = TransformationState.Uninitialized;
        const diagnostics: ts.DiagnosticWithLocation[] = [];
        // The transformation context is provided to each transformer as part of transformer
        // initialization.
        const context: ts.TransformationContext = {
            getCompilerOptions: () => options,
            getEmitResolver: () => resolver!,
            getEmitHost: () => host!,
            startLexicalEnvironment,
            suspendLexicalEnvironment,
            resumeLexicalEnvironment,
            endLexicalEnvironment,
            hoistVariableDeclaration,
            hoistFunctionDeclaration,
            requestEmitHelper,
            readEmitHelpers,
            enableSubstitution,
            enableEmitNotification,
            isSubstitutionEnabled,
            isEmitNotificationEnabled,
            get onSubstituteNode() { return onSubstituteNode; },
            set onSubstituteNode(value) {
                ts.Debug.assert(state < TransformationState.Initialized, "Cannot modify transformation hooks after initialization has completed.");
                ts.Debug.assert(value !== undefined, "Value must not be 'undefined'");
                onSubstituteNode = value;
            },
            get onEmitNode() { return onEmitNode; },
            set onEmitNode(value) {
                ts.Debug.assert(state < TransformationState.Initialized, "Cannot modify transformation hooks after initialization has completed.");
                ts.Debug.assert(value !== undefined, "Value must not be 'undefined'");
                onEmitNode = value;
            },
            addDiagnostic(diag) {
                diagnostics.push(diag);
            }
        };
        // Ensure the parse tree is clean before applying transformations
        for (const node of nodes) {
            ts.disposeEmitNodes(ts.getSourceFileOfNode(ts.getParseTreeNode(node)));
        }
        ts.performance.mark("beforeTransform");
        // Chain together and initialize each transformer.
        const transformersWithContext = transformers.map(t => t(context));
        const transformation = (node: T): T => {
            for (const transform of transformersWithContext) {
                node = transform(node);
            }
            return node;
        };
        // prevent modification of transformation hooks.
        state = TransformationState.Initialized;
        // Transform each node.
        const transformed = ts.map(nodes, allowDtsFiles ? transformation : transformRoot);
        // prevent modification of the lexical environment.
        state = TransformationState.Completed;
        ts.performance.mark("afterTransform");
        ts.performance.measure("transformTime", "beforeTransform", "afterTransform");
        return {
            transformed,
            substituteNode,
            emitNodeWithNotification,
            dispose,
            diagnostics
        };
        function transformRoot(node: T) {
            return node && (!ts.isSourceFile(node) || !node.isDeclarationFile) ? transformation(node) : node;
        }
        /**
         * Enables expression substitutions in the pretty printer for the provided SyntaxKind.
         */
        function enableSubstitution(kind: ts.SyntaxKind) {
            ts.Debug.assert(state < TransformationState.Completed, "Cannot modify the transformation context after transformation has completed.");
            enabledSyntaxKindFeatures[kind] |= SyntaxKindFeatureFlags.Substitution;
        }
        /**
         * Determines whether expression substitutions are enabled for the provided node.
         */
        function isSubstitutionEnabled(node: ts.Node) {
            return (enabledSyntaxKindFeatures[node.kind] & SyntaxKindFeatureFlags.Substitution) !== 0
                && (ts.getEmitFlags(node) & ts.EmitFlags.NoSubstitution) === 0;
        }
        /**
         * Emits a node with possible substitution.
         *
         * @param hint A hint as to the intended usage of the node.
         * @param node The node to emit.
         * @param emitCallback The callback used to emit the node or its substitute.
         */
        function substituteNode(hint: ts.EmitHint, node: ts.Node) {
            ts.Debug.assert(state < TransformationState.Disposed, "Cannot substitute a node after the result is disposed.");
            return node && isSubstitutionEnabled(node) && onSubstituteNode(hint, node) || node;
        }
        /**
         * Enables before/after emit notifications in the pretty printer for the provided SyntaxKind.
         */
        function enableEmitNotification(kind: ts.SyntaxKind) {
            ts.Debug.assert(state < TransformationState.Completed, "Cannot modify the transformation context after transformation has completed.");
            enabledSyntaxKindFeatures[kind] |= SyntaxKindFeatureFlags.EmitNotifications;
        }
        /**
         * Determines whether before/after emit notifications should be raised in the pretty
         * printer when it emits a node.
         */
        function isEmitNotificationEnabled(node: ts.Node) {
            return (enabledSyntaxKindFeatures[node.kind] & SyntaxKindFeatureFlags.EmitNotifications) !== 0
                || (ts.getEmitFlags(node) & ts.EmitFlags.AdviseOnEmitNode) !== 0;
        }
        /**
         * Emits a node with possible emit notification.
         *
         * @param hint A hint as to the intended usage of the node.
         * @param node The node to emit.
         * @param emitCallback The callback used to emit the node.
         */
        function emitNodeWithNotification(hint: ts.EmitHint, node: ts.Node, emitCallback: (hint: ts.EmitHint, node: ts.Node) => void) {
            ts.Debug.assert(state < TransformationState.Disposed, "Cannot invoke TransformationResult callbacks after the result is disposed.");
            if (node) {
                if (isEmitNotificationEnabled(node)) {
                    onEmitNode(hint, node, emitCallback);
                }
                else {
                    emitCallback(hint, node);
                }
            }
        }
        /**
         * Records a hoisted variable declaration for the provided name within a lexical environment.
         */
        function hoistVariableDeclaration(name: ts.Identifier): void {
            ts.Debug.assert(state > TransformationState.Uninitialized, "Cannot modify the lexical environment during initialization.");
            ts.Debug.assert(state < TransformationState.Completed, "Cannot modify the lexical environment after transformation has completed.");
            const decl = ts.setEmitFlags(ts.createVariableDeclaration(name), ts.EmitFlags.NoNestedSourceMaps);
            if (!lexicalEnvironmentVariableDeclarations) {
                lexicalEnvironmentVariableDeclarations = [decl];
            }
            else {
                lexicalEnvironmentVariableDeclarations.push(decl);
            }
        }
        /**
         * Records a hoisted function declaration within a lexical environment.
         */
        function hoistFunctionDeclaration(func: ts.FunctionDeclaration): void {
            ts.Debug.assert(state > TransformationState.Uninitialized, "Cannot modify the lexical environment during initialization.");
            ts.Debug.assert(state < TransformationState.Completed, "Cannot modify the lexical environment after transformation has completed.");
            if (!lexicalEnvironmentFunctionDeclarations) {
                lexicalEnvironmentFunctionDeclarations = [func];
            }
            else {
                lexicalEnvironmentFunctionDeclarations.push(func);
            }
        }
        /**
         * Starts a new lexical environment. Any existing hoisted variable or function declarations
         * are pushed onto a stack, and the related storage variables are reset.
         */
        function startLexicalEnvironment(): void {
            ts.Debug.assert(state > TransformationState.Uninitialized, "Cannot modify the lexical environment during initialization.");
            ts.Debug.assert(state < TransformationState.Completed, "Cannot modify the lexical environment after transformation has completed.");
            ts.Debug.assert(!lexicalEnvironmentSuspended, "Lexical environment is suspended.");
            // Save the current lexical environment. Rather than resizing the array we adjust the
            // stack size variable. This allows us to reuse existing array slots we've
            // already allocated between transformations to avoid allocation and GC overhead during
            // transformation.
            lexicalEnvironmentVariableDeclarationsStack[lexicalEnvironmentStackOffset] = lexicalEnvironmentVariableDeclarations;
            lexicalEnvironmentFunctionDeclarationsStack[lexicalEnvironmentStackOffset] = lexicalEnvironmentFunctionDeclarations;
            lexicalEnvironmentStackOffset++;
            lexicalEnvironmentVariableDeclarations = undefined!;
            lexicalEnvironmentFunctionDeclarations = undefined!;
        }
        /** Suspends the current lexical environment, usually after visiting a parameter list. */
        function suspendLexicalEnvironment(): void {
            ts.Debug.assert(state > TransformationState.Uninitialized, "Cannot modify the lexical environment during initialization.");
            ts.Debug.assert(state < TransformationState.Completed, "Cannot modify the lexical environment after transformation has completed.");
            ts.Debug.assert(!lexicalEnvironmentSuspended, "Lexical environment is already suspended.");
            lexicalEnvironmentSuspended = true;
        }
        /** Resumes a suspended lexical environment, usually before visiting a function body. */
        function resumeLexicalEnvironment(): void {
            ts.Debug.assert(state > TransformationState.Uninitialized, "Cannot modify the lexical environment during initialization.");
            ts.Debug.assert(state < TransformationState.Completed, "Cannot modify the lexical environment after transformation has completed.");
            ts.Debug.assert(lexicalEnvironmentSuspended, "Lexical environment is not suspended.");
            lexicalEnvironmentSuspended = false;
        }
        /**
         * Ends a lexical environment. The previous set of hoisted declarations are restored and
         * any hoisted declarations added in this environment are returned.
         */
        function endLexicalEnvironment(): ts.Statement[] | undefined {
            ts.Debug.assert(state > TransformationState.Uninitialized, "Cannot modify the lexical environment during initialization.");
            ts.Debug.assert(state < TransformationState.Completed, "Cannot modify the lexical environment after transformation has completed.");
            ts.Debug.assert(!lexicalEnvironmentSuspended, "Lexical environment is suspended.");
            let statements: ts.Statement[] | undefined;
            if (lexicalEnvironmentVariableDeclarations || lexicalEnvironmentFunctionDeclarations) {
                if (lexicalEnvironmentFunctionDeclarations) {
                    statements = [...lexicalEnvironmentFunctionDeclarations];
                }
                if (lexicalEnvironmentVariableDeclarations) {
                    const statement = ts.createVariableStatement(
                    /*modifiers*/ undefined, ts.createVariableDeclarationList(lexicalEnvironmentVariableDeclarations));
                    ts.setEmitFlags(statement, ts.EmitFlags.CustomPrologue);
                    if (!statements) {
                        statements = [statement];
                    }
                    else {
                        statements.push(statement);
                    }
                }
            }
            // Restore the previous lexical environment.
            lexicalEnvironmentStackOffset--;
            lexicalEnvironmentVariableDeclarations = lexicalEnvironmentVariableDeclarationsStack[lexicalEnvironmentStackOffset];
            lexicalEnvironmentFunctionDeclarations = lexicalEnvironmentFunctionDeclarationsStack[lexicalEnvironmentStackOffset];
            if (lexicalEnvironmentStackOffset === 0) {
                lexicalEnvironmentVariableDeclarationsStack = [];
                lexicalEnvironmentFunctionDeclarationsStack = [];
            }
            return statements;
        }
        function requestEmitHelper(helper: ts.EmitHelper): void {
            ts.Debug.assert(state > TransformationState.Uninitialized, "Cannot modify the transformation context during initialization.");
            ts.Debug.assert(state < TransformationState.Completed, "Cannot modify the transformation context after transformation has completed.");
            ts.Debug.assert(!helper.scoped, "Cannot request a scoped emit helper.");
            emitHelpers = ts.append(emitHelpers, helper);
        }
        function readEmitHelpers(): ts.EmitHelper[] | undefined {
            ts.Debug.assert(state > TransformationState.Uninitialized, "Cannot modify the transformation context during initialization.");
            ts.Debug.assert(state < TransformationState.Completed, "Cannot modify the transformation context after transformation has completed.");
            const helpers = emitHelpers;
            emitHelpers = undefined;
            return helpers;
        }
        function dispose() {
            if (state < TransformationState.Disposed) {
                // Clean up emit nodes on parse tree
                for (const node of nodes) {
                    ts.disposeEmitNodes(ts.getSourceFileOfNode(ts.getParseTreeNode(node)));
                }
                // Release references to external entries for GC purposes.
                lexicalEnvironmentVariableDeclarations = undefined!;
                lexicalEnvironmentVariableDeclarationsStack = undefined!;
                lexicalEnvironmentFunctionDeclarations = undefined!;
                lexicalEnvironmentFunctionDeclarationsStack = undefined!;
                onSubstituteNode = undefined!;
                onEmitNode = undefined!;
                emitHelpers = undefined;
                // Prevent further use of the transformation result.
                state = TransformationState.Disposed;
            }
        }
    }
}
