import * as ts from "../../ts";
/*@internal*/
export function transformModule(context: ts.TransformationContext) {
    interface AsynchronousDependencies {
        aliasedModuleNames: ts.Expression[];
        unaliasedModuleNames: ts.Expression[];
        importAliasNames: ts.ParameterDeclaration[];
    }
    function getTransformModuleDelegate(moduleKind: ts.ModuleKind): (node: ts.SourceFile) => ts.SourceFile {
        switch (moduleKind) {
            case ts.ModuleKind.AMD: return transformAMDModule;
            case ts.ModuleKind.UMD: return transformUMDModule;
            default: return transformCommonJSModule;
        }
    }
    const { startLexicalEnvironment, endLexicalEnvironment, hoistVariableDeclaration } = context;
    const compilerOptions = context.getCompilerOptions();
    const resolver = context.getEmitResolver();
    const host = context.getEmitHost();
    const languageVersion = ts.getEmitScriptTarget(compilerOptions);
    const moduleKind = ts.getEmitModuleKind(compilerOptions);
    const previousOnSubstituteNode = context.onSubstituteNode;
    const previousOnEmitNode = context.onEmitNode;
    context.onSubstituteNode = onSubstituteNode;
    context.onEmitNode = onEmitNode;
    context.enableSubstitution(ts.SyntaxKind.Identifier); // Substitutes expression identifiers with imported/exported symbols.
    context.enableSubstitution(ts.SyntaxKind.BinaryExpression); // Substitutes assignments to exported symbols.
    context.enableSubstitution(ts.SyntaxKind.PrefixUnaryExpression); // Substitutes updates to exported symbols.
    context.enableSubstitution(ts.SyntaxKind.PostfixUnaryExpression); // Substitutes updates to exported symbols.
    context.enableSubstitution(ts.SyntaxKind.ShorthandPropertyAssignment); // Substitutes shorthand property assignments for imported/exported symbols.
    context.enableEmitNotification(ts.SyntaxKind.SourceFile); // Restore state when substituting nodes in a file.
    const moduleInfoMap: ts.ExternalModuleInfo[] = []; // The ExternalModuleInfo for each file.
    const deferredExports: (ts.Statement[] | undefined)[] = []; // Exports to defer until an EndOfDeclarationMarker is found.
    let currentSourceFile: ts.SourceFile; // The current file.
    let currentModuleInfo: ts.ExternalModuleInfo; // The ExternalModuleInfo for the current file.
    let noSubstitution: boolean[]; // Set of nodes for which substitution rules should be ignored.
    let needUMDDynamicImportHelper: boolean;
    return ts.chainBundle(transformSourceFile);
    /**
     * Transforms the module aspects of a SourceFile.
     *
     * @param node The SourceFile node.
     */
    function transformSourceFile(node: ts.SourceFile) {
        if (node.isDeclarationFile ||
            !(ts.isEffectiveExternalModule(node, compilerOptions) ||
                node.transformFlags & ts.TransformFlags.ContainsDynamicImport ||
                (ts.isJsonSourceFile(node) && ts.hasJsonModuleEmitEnabled(compilerOptions) && (compilerOptions.out || compilerOptions.outFile)))) {
            return node;
        }
        currentSourceFile = node;
        currentModuleInfo = ts.collectExternalModuleInfo(node, resolver, compilerOptions);
        moduleInfoMap[ts.getOriginalNodeId(node)] = currentModuleInfo;
        // Perform the transformation.
        const transformModule = getTransformModuleDelegate(moduleKind);
        const updated = transformModule(node);
        currentSourceFile = undefined!;
        currentModuleInfo = undefined!;
        needUMDDynamicImportHelper = false;
        return ts.aggregateTransformFlags(updated);
    }
    function shouldEmitUnderscoreUnderscoreESModule() {
        if (!currentModuleInfo.exportEquals && ts.isExternalModule(currentSourceFile)) {
            return true;
        }
        return false;
    }
    /**
     * Transforms a SourceFile into a CommonJS module.
     *
     * @param node The SourceFile node.
     */
    function transformCommonJSModule(node: ts.SourceFile) {
        startLexicalEnvironment();
        const statements: ts.Statement[] = [];
        const ensureUseStrict = ts.getStrictOptionValue(compilerOptions, "alwaysStrict") || (!compilerOptions.noImplicitUseStrict && ts.isExternalModule(currentSourceFile));
        const statementOffset = ts.addPrologue(statements, node.statements, ensureUseStrict, sourceElementVisitor);
        if (shouldEmitUnderscoreUnderscoreESModule()) {
            ts.append(statements, createUnderscoreUnderscoreESModule());
        }
        ts.append(statements, ts.visitNode(currentModuleInfo.externalHelpersImportDeclaration, sourceElementVisitor, ts.isStatement));
        ts.addRange(statements, ts.visitNodes(node.statements, sourceElementVisitor, ts.isStatement, statementOffset));
        addExportEqualsIfNeeded(statements, /*emitAsReturn*/ false);
        ts.insertStatementsAfterStandardPrologue(statements, endLexicalEnvironment());
        const updated = ts.updateSourceFileNode(node, ts.setTextRange(ts.createNodeArray(statements), node.statements));
        if (currentModuleInfo.hasExportStarsToExportValues && !compilerOptions.importHelpers) {
            // If we have any `export * from ...` declarations
            // we need to inform the emitter to add the __export helper.
            ts.addEmitHelper(updated, exportStarHelper);
        }
        ts.addEmitHelpers(updated, context.readEmitHelpers());
        return updated;
    }
    /**
     * Transforms a SourceFile into an AMD module.
     *
     * @param node The SourceFile node.
     */
    function transformAMDModule(node: ts.SourceFile) {
        const define = ts.createIdentifier("define");
        const moduleName = ts.tryGetModuleNameFromFile(node, host, compilerOptions);
        const jsonSourceFile = ts.isJsonSourceFile(node) && node;
        // An AMD define function has the following shape:
        //
        //     define(id?, dependencies?, factory);
        //
        // This has the shape of the following:
        //
        //     define(name, ["module1", "module2"], function (module1Alias) { ... }
        //
        // The location of the alias in the parameter list in the factory function needs to
        // match the position of the module name in the dependency list.
        //
        // To ensure this is true in cases of modules with no aliases, e.g.:
        //
        //     import "module"
        //
        // or
        //
        //     /// <amd-dependency path= "a.css" />
        //
        // we need to add modules without alias names to the end of the dependencies list
        const { aliasedModuleNames, unaliasedModuleNames, importAliasNames } = collectAsynchronousDependencies(node, /*includeNonAmdDependencies*/ true);
        // Create an updated SourceFile:
        //
        //     define(moduleName?, ["module1", "module2"], function ...
        const updated = ts.updateSourceFileNode(node, ts.setTextRange(ts.createNodeArray([
            ts.createExpressionStatement(ts.createCall(define, 
            /*typeArguments*/ undefined, [
                // Add the module name (if provided).
                ...(moduleName ? [moduleName] : []),
                // Add the dependency array argument:
                //
                //     ["require", "exports", module1", "module2", ...]
                ts.createArrayLiteral(jsonSourceFile ? ts.emptyArray : [
                    ts.createLiteral("require"),
                    ts.createLiteral("exports"),
                    ...aliasedModuleNames,
                    ...unaliasedModuleNames
                ]),
                // Add the module body function argument:
                //
                //     function (require, exports, module1, module2) ...
                jsonSourceFile ?
                    jsonSourceFile.statements.length ? jsonSourceFile.statements[0].expression : ts.createObjectLiteral() :
                    ts.createFunctionExpression(
                    /*modifiers*/ undefined, 
                    /*asteriskToken*/ undefined, 
                    /*name*/ undefined, 
                    /*typeParameters*/ undefined, [
                        ts.createParameter(/*decorators*/ undefined, /*modifiers*/ undefined, /*dotDotDotToken*/ undefined, "require"),
                        ts.createParameter(/*decorators*/ undefined, /*modifiers*/ undefined, /*dotDotDotToken*/ undefined, "exports"),
                        ...importAliasNames
                    ], 
                    /*type*/ undefined, transformAsynchronousModuleBody(node))
            ]))
        ]), 
        /*location*/ node.statements));
        ts.addEmitHelpers(updated, context.readEmitHelpers());
        return updated;
    }
    /**
     * Transforms a SourceFile into a UMD module.
     *
     * @param node The SourceFile node.
     */
    function transformUMDModule(node: ts.SourceFile) {
        const { aliasedModuleNames, unaliasedModuleNames, importAliasNames } = collectAsynchronousDependencies(node, /*includeNonAmdDependencies*/ false);
        const moduleName = ts.tryGetModuleNameFromFile(node, host, compilerOptions);
        const umdHeader = ts.createFunctionExpression(
        /*modifiers*/ undefined, 
        /*asteriskToken*/ undefined, 
        /*name*/ undefined, 
        /*typeParameters*/ undefined, [ts.createParameter(/*decorators*/ undefined, /*modifiers*/ undefined, /*dotDotDotToken*/ undefined, "factory")], 
        /*type*/ undefined, ts.setTextRange(ts.createBlock([
            ts.createIf(ts.createLogicalAnd(ts.createTypeCheck(ts.createIdentifier("module"), "object"), ts.createTypeCheck(ts.createPropertyAccess(ts.createIdentifier("module"), "exports"), "object")), ts.createBlock([
                ts.createVariableStatement(
                /*modifiers*/ undefined, [
                    ts.createVariableDeclaration("v", 
                    /*type*/ undefined, ts.createCall(ts.createIdentifier("factory"), 
                    /*typeArguments*/ undefined, [
                        ts.createIdentifier("require"),
                        ts.createIdentifier("exports")
                    ]))
                ]),
                ts.setEmitFlags(ts.createIf(ts.createStrictInequality(ts.createIdentifier("v"), ts.createIdentifier("undefined")), ts.createExpressionStatement(ts.createAssignment(ts.createPropertyAccess(ts.createIdentifier("module"), "exports"), ts.createIdentifier("v")))), ts.EmitFlags.SingleLine)
            ]), ts.createIf(ts.createLogicalAnd(ts.createTypeCheck(ts.createIdentifier("define"), "function"), ts.createPropertyAccess(ts.createIdentifier("define"), "amd")), ts.createBlock([
                ts.createExpressionStatement(ts.createCall(ts.createIdentifier("define"), 
                /*typeArguments*/ undefined, [
                    // Add the module name (if provided).
                    ...(moduleName ? [moduleName] : []),
                    ts.createArrayLiteral([
                        ts.createLiteral("require"),
                        ts.createLiteral("exports"),
                        ...aliasedModuleNames,
                        ...unaliasedModuleNames
                    ]),
                    ts.createIdentifier("factory")
                ]))
            ])))
        ], 
        /*multiLine*/ true), 
        /*location*/ undefined));
        // Create an updated SourceFile:
        //
        //  (function (factory) {
        //      if (typeof module === "object" && typeof module.exports === "object") {
        //          var v = factory(require, exports);
        //          if (v !== undefined) module.exports = v;
        //      }
        //      else if (typeof define === 'function' && define.amd) {
        //          define(["require", "exports"], factory);
        //      }
        //  })(function ...)
        const updated = ts.updateSourceFileNode(node, ts.setTextRange(ts.createNodeArray([
            ts.createExpressionStatement(ts.createCall(umdHeader, 
            /*typeArguments*/ undefined, [
                // Add the module body function argument:
                //
                //     function (require, exports) ...
                ts.createFunctionExpression(
                /*modifiers*/ undefined, 
                /*asteriskToken*/ undefined, 
                /*name*/ undefined, 
                /*typeParameters*/ undefined, [
                    ts.createParameter(/*decorators*/ undefined, /*modifiers*/ undefined, /*dotDotDotToken*/ undefined, "require"),
                    ts.createParameter(/*decorators*/ undefined, /*modifiers*/ undefined, /*dotDotDotToken*/ undefined, "exports"),
                    ...importAliasNames
                ], 
                /*type*/ undefined, transformAsynchronousModuleBody(node))
            ]))
        ]), 
        /*location*/ node.statements));
        ts.addEmitHelpers(updated, context.readEmitHelpers());
        return updated;
    }
    /**
     * Collect the additional asynchronous dependencies for the module.
     *
     * @param node The source file.
     * @param includeNonAmdDependencies A value indicating whether to include non-AMD dependencies.
     */
    function collectAsynchronousDependencies(node: ts.SourceFile, includeNonAmdDependencies: boolean): AsynchronousDependencies {
        // names of modules with corresponding parameter in the factory function
        const aliasedModuleNames: ts.Expression[] = [];
        // names of modules with no corresponding parameters in factory function
        const unaliasedModuleNames: ts.Expression[] = [];
        // names of the parameters in the factory function; these
        // parameters need to match the indexes of the corresponding
        // module names in aliasedModuleNames.
        const importAliasNames: ts.ParameterDeclaration[] = [];
        // Fill in amd-dependency tags
        for (const amdDependency of node.amdDependencies) {
            if (amdDependency.name) {
                aliasedModuleNames.push(ts.createLiteral(amdDependency.path));
                importAliasNames.push(ts.createParameter(/*decorators*/ undefined, /*modifiers*/ undefined, /*dotDotDotToken*/ undefined, amdDependency.name));
            }
            else {
                unaliasedModuleNames.push(ts.createLiteral(amdDependency.path));
            }
        }
        for (const importNode of currentModuleInfo.externalImports) {
            // Find the name of the external module
            const externalModuleName = ts.getExternalModuleNameLiteral(importNode, currentSourceFile, host, resolver, compilerOptions);
            // Find the name of the module alias, if there is one
            const importAliasName = ts.getLocalNameForExternalImport(importNode, currentSourceFile);
            // It is possible that externalModuleName is undefined if it is not string literal.
            // This can happen in the invalid import syntax.
            // E.g : "import * from alias from 'someLib';"
            if (externalModuleName) {
                if (includeNonAmdDependencies && importAliasName) {
                    // Set emitFlags on the name of the classDeclaration
                    // This is so that when printer will not substitute the identifier
                    ts.setEmitFlags(importAliasName, ts.EmitFlags.NoSubstitution);
                    aliasedModuleNames.push(externalModuleName);
                    importAliasNames.push(ts.createParameter(/*decorators*/ undefined, /*modifiers*/ undefined, /*dotDotDotToken*/ undefined, importAliasName));
                }
                else {
                    unaliasedModuleNames.push(externalModuleName);
                }
            }
        }
        return { aliasedModuleNames, unaliasedModuleNames, importAliasNames };
    }
    function getAMDImportExpressionForImport(node: ts.ImportDeclaration | ts.ExportDeclaration | ts.ImportEqualsDeclaration) {
        if (ts.isImportEqualsDeclaration(node) || ts.isExportDeclaration(node) || !ts.getExternalModuleNameLiteral(node, currentSourceFile, host, resolver, compilerOptions)) {
            return undefined;
        }
        const name = (ts.getLocalNameForExternalImport(node, currentSourceFile)!); // TODO: GH#18217
        const expr = getHelperExpressionForImport(node, name);
        if (expr === name) {
            return undefined;
        }
        return ts.createExpressionStatement(ts.createAssignment(name, expr));
    }
    /**
     * Transforms a SourceFile into an AMD or UMD module body.
     *
     * @param node The SourceFile node.
     */
    function transformAsynchronousModuleBody(node: ts.SourceFile) {
        startLexicalEnvironment();
        const statements: ts.Statement[] = [];
        const statementOffset = ts.addPrologue(statements, node.statements, /*ensureUseStrict*/ !compilerOptions.noImplicitUseStrict, sourceElementVisitor);
        if (shouldEmitUnderscoreUnderscoreESModule()) {
            ts.append(statements, createUnderscoreUnderscoreESModule());
        }
        // Visit each statement of the module body.
        ts.append(statements, ts.visitNode(currentModuleInfo.externalHelpersImportDeclaration, sourceElementVisitor, ts.isStatement));
        if (moduleKind === ts.ModuleKind.AMD) {
            ts.addRange(statements, ts.mapDefined(currentModuleInfo.externalImports, getAMDImportExpressionForImport));
        }
        ts.addRange(statements, ts.visitNodes(node.statements, sourceElementVisitor, ts.isStatement, statementOffset));
        // Append the 'export =' statement if provided.
        addExportEqualsIfNeeded(statements, /*emitAsReturn*/ true);
        // End the lexical environment for the module body
        // and merge any new lexical declarations.
        ts.insertStatementsAfterStandardPrologue(statements, endLexicalEnvironment());
        const body = ts.createBlock(statements, /*multiLine*/ true);
        if (currentModuleInfo.hasExportStarsToExportValues && !compilerOptions.importHelpers) {
            // If we have any `export * from ...` declarations
            // we need to inform the emitter to add the __export helper.
            ts.addEmitHelper(body, exportStarHelper);
        }
        if (needUMDDynamicImportHelper) {
            ts.addEmitHelper(body, dynamicImportUMDHelper);
        }
        return body;
    }
    /**
     * Adds the down-level representation of `export=` to the statement list if one exists
     * in the source file.
     *
     * @param statements The Statement list to modify.
     * @param emitAsReturn A value indicating whether to emit the `export=` statement as a
     * return statement.
     */
    function addExportEqualsIfNeeded(statements: ts.Statement[], emitAsReturn: boolean) {
        if (currentModuleInfo.exportEquals) {
            const expressionResult = ts.visitNode(currentModuleInfo.exportEquals.expression, moduleExpressionElementVisitor);
            if (expressionResult) {
                if (emitAsReturn) {
                    const statement = ts.createReturn(expressionResult);
                    ts.setTextRange(statement, currentModuleInfo.exportEquals);
                    ts.setEmitFlags(statement, ts.EmitFlags.NoTokenSourceMaps | ts.EmitFlags.NoComments);
                    statements.push(statement);
                }
                else {
                    const statement = ts.createExpressionStatement(ts.createAssignment(ts.createPropertyAccess(ts.createIdentifier("module"), "exports"), expressionResult));
                    ts.setTextRange(statement, currentModuleInfo.exportEquals);
                    ts.setEmitFlags(statement, ts.EmitFlags.NoComments);
                    statements.push(statement);
                }
            }
        }
    }
    //
    // Top-Level Source Element Visitors
    //
    /**
     * Visits a node at the top level of the source file.
     *
     * @param node The node to visit.
     */
    function sourceElementVisitor(node: ts.Node): ts.VisitResult<ts.Node> {
        switch (node.kind) {
            case ts.SyntaxKind.ImportDeclaration:
                return visitImportDeclaration((<ts.ImportDeclaration>node));
            case ts.SyntaxKind.ImportEqualsDeclaration:
                return visitImportEqualsDeclaration((<ts.ImportEqualsDeclaration>node));
            case ts.SyntaxKind.ExportDeclaration:
                return visitExportDeclaration((<ts.ExportDeclaration>node));
            case ts.SyntaxKind.ExportAssignment:
                return visitExportAssignment((<ts.ExportAssignment>node));
            case ts.SyntaxKind.VariableStatement:
                return visitVariableStatement((<ts.VariableStatement>node));
            case ts.SyntaxKind.FunctionDeclaration:
                return visitFunctionDeclaration((<ts.FunctionDeclaration>node));
            case ts.SyntaxKind.ClassDeclaration:
                return visitClassDeclaration((<ts.ClassDeclaration>node));
            case ts.SyntaxKind.MergeDeclarationMarker:
                return visitMergeDeclarationMarker((<ts.MergeDeclarationMarker>node));
            case ts.SyntaxKind.EndOfDeclarationMarker:
                return visitEndOfDeclarationMarker((<ts.EndOfDeclarationMarker>node));
            default:
                return ts.visitEachChild(node, moduleExpressionElementVisitor, context);
        }
    }
    function moduleExpressionElementVisitor(node: ts.Expression): ts.VisitResult<ts.Expression> {
        // This visitor does not need to descend into the tree if there is no dynamic import or destructuring assignment,
        // as export/import statements are only transformed at the top level of a file.
        if (!(node.transformFlags & ts.TransformFlags.ContainsDynamicImport) && !(node.transformFlags & ts.TransformFlags.ContainsDestructuringAssignment)) {
            return node;
        }
        if (ts.isImportCall(node)) {
            return visitImportCallExpression(node);
        }
        else if (ts.isDestructuringAssignment(node)) {
            return visitDestructuringAssignment(node);
        }
        else {
            return ts.visitEachChild(node, moduleExpressionElementVisitor, context);
        }
    }
    function destructuringNeedsFlattening(node: ts.Expression): boolean {
        if (ts.isObjectLiteralExpression(node)) {
            for (const elem of node.properties) {
                switch (elem.kind) {
                    case ts.SyntaxKind.PropertyAssignment:
                        if (destructuringNeedsFlattening(elem.initializer)) {
                            return true;
                        }
                        break;
                    case ts.SyntaxKind.ShorthandPropertyAssignment:
                        if (destructuringNeedsFlattening(elem.name)) {
                            return true;
                        }
                        break;
                    case ts.SyntaxKind.SpreadAssignment:
                        if (destructuringNeedsFlattening(elem.expression)) {
                            return true;
                        }
                        break;
                    case ts.SyntaxKind.MethodDeclaration:
                    case ts.SyntaxKind.GetAccessor:
                    case ts.SyntaxKind.SetAccessor:
                        return false;
                    default: ts.Debug.assertNever(elem, "Unhandled object member kind");
                }
            }
        }
        else if (ts.isArrayLiteralExpression(node)) {
            for (const elem of node.elements) {
                if (ts.isSpreadElement(elem)) {
                    if (destructuringNeedsFlattening(elem.expression)) {
                        return true;
                    }
                }
                else if (destructuringNeedsFlattening(elem)) {
                    return true;
                }
            }
        }
        else if (ts.isIdentifier(node)) {
            return ts.length(getExports(node)) > (ts.isExportName(node) ? 1 : 0);
        }
        return false;
    }
    function visitDestructuringAssignment(node: ts.DestructuringAssignment): ts.Expression {
        if (destructuringNeedsFlattening(node.left)) {
            return ts.flattenDestructuringAssignment(node, moduleExpressionElementVisitor, context, ts.FlattenLevel.All, /*needsValue*/ false, createAllExportExpressions);
        }
        return ts.visitEachChild(node, moduleExpressionElementVisitor, context);
    }
    function visitImportCallExpression(node: ts.ImportCall): ts.Expression {
        const argument = ts.visitNode(ts.firstOrUndefined(node.arguments), moduleExpressionElementVisitor);
        const containsLexicalThis = !!(node.transformFlags & ts.TransformFlags.ContainsLexicalThis);
        switch (compilerOptions.module) {
            case ts.ModuleKind.AMD:
                return createImportCallExpressionAMD(argument, containsLexicalThis);
            case ts.ModuleKind.UMD:
                return createImportCallExpressionUMD(argument, containsLexicalThis);
            case ts.ModuleKind.CommonJS:
            default:
                return createImportCallExpressionCommonJS(argument, containsLexicalThis);
        }
    }
    function createImportCallExpressionUMD(arg: ts.Expression, containsLexicalThis: boolean): ts.Expression {
        // (function (factory) {
        //      ... (regular UMD)
        // }
        // })(function (require, exports, useSyncRequire) {
        //      "use strict";
        //      Object.defineProperty(exports, "__esModule", { value: true });
        //      var __syncRequire = typeof module === "object" && typeof module.exports === "object";
        //      var __resolved = new Promise(function (resolve) { resolve(); });
        //      .....
        //      __syncRequire
        //          ? __resolved.then(function () { return require(x); }) /*CommonJs Require*/
        //          : new Promise(function (_a, _b) { require([x], _a, _b); }); /*Amd Require*/
        // });
        needUMDDynamicImportHelper = true;
        if (ts.isSimpleCopiableExpression(arg)) {
            const argClone = ts.isGeneratedIdentifier(arg) ? arg : ts.isStringLiteral(arg) ? ts.createLiteral(arg) : ts.setEmitFlags(ts.setTextRange(ts.getSynthesizedClone(arg), arg), ts.EmitFlags.NoComments);
            return ts.createConditional(
            /*condition*/ ts.createIdentifier("__syncRequire"), 
            /*whenTrue*/ createImportCallExpressionCommonJS(arg, containsLexicalThis), 
            /*whenFalse*/ createImportCallExpressionAMD(argClone, containsLexicalThis));
        }
        else {
            const temp = ts.createTempVariable(hoistVariableDeclaration);
            return ts.createComma(ts.createAssignment(temp, arg), ts.createConditional(
            /*condition*/ ts.createIdentifier("__syncRequire"), 
            /*whenTrue*/ createImportCallExpressionCommonJS(temp, containsLexicalThis), 
            /*whenFalse*/ createImportCallExpressionAMD(temp, containsLexicalThis)));
        }
    }
    function createImportCallExpressionAMD(arg: ts.Expression | undefined, containsLexicalThis: boolean): ts.Expression {
        // improt("./blah")
        // emit as
        // define(["require", "exports", "blah"], function (require, exports) {
        //     ...
        //     new Promise(function (_a, _b) { require([x], _a, _b); }); /*Amd Require*/
        // });
        const resolve = ts.createUniqueName("resolve");
        const reject = ts.createUniqueName("reject");
        const parameters = [
            ts.createParameter(/*decorator*/ undefined, /*modifiers*/ undefined, /*dotDotDotToken*/ undefined, /*name*/ resolve),
            ts.createParameter(/*decorator*/ undefined, /*modifiers*/ undefined, /*dotDotDotToken*/ undefined, /*name*/ reject)
        ];
        const body = ts.createBlock([
            ts.createExpressionStatement(ts.createCall(ts.createIdentifier("require"), 
            /*typeArguments*/ undefined, [ts.createArrayLiteral([arg || ts.createOmittedExpression()]), resolve, reject]))
        ]);
        let func: ts.FunctionExpression | ts.ArrowFunction;
        if (languageVersion >= ts.ScriptTarget.ES2015) {
            func = ts.createArrowFunction(
            /*modifiers*/ undefined, 
            /*typeParameters*/ undefined, parameters, 
            /*type*/ undefined, 
            /*equalsGreaterThanToken*/ undefined, body);
        }
        else {
            func = ts.createFunctionExpression(
            /*modifiers*/ undefined, 
            /*asteriskToken*/ undefined, 
            /*name*/ undefined, 
            /*typeParameters*/ undefined, parameters, 
            /*type*/ undefined, body);
            // if there is a lexical 'this' in the import call arguments, ensure we indicate
            // that this new function expression indicates it captures 'this' so that the
            // es2015 transformer will properly substitute 'this' with '_this'.
            if (containsLexicalThis) {
                ts.setEmitFlags(func, ts.EmitFlags.CapturesThis);
            }
        }
        const promise = ts.createNew(ts.createIdentifier("Promise"), /*typeArguments*/ undefined, [func]);
        if (compilerOptions.esModuleInterop) {
            context.requestEmitHelper(importStarHelper);
            return ts.createCall(ts.createPropertyAccess(promise, ts.createIdentifier("then")), /*typeArguments*/ undefined, [ts.getUnscopedHelperName("__importStar")]);
        }
        return promise;
    }
    function createImportCallExpressionCommonJS(arg: ts.Expression | undefined, containsLexicalThis: boolean): ts.Expression {
        // import("./blah")
        // emit as
        // Promise.resolve().then(function () { return require(x); }) /*CommonJs Require*/
        // We have to wrap require in then callback so that require is done in asynchronously
        // if we simply do require in resolve callback in Promise constructor. We will execute the loading immediately
        const promiseResolveCall = ts.createCall(ts.createPropertyAccess(ts.createIdentifier("Promise"), "resolve"), /*typeArguments*/ undefined, /*argumentsArray*/ []);
        let requireCall = ts.createCall(ts.createIdentifier("require"), /*typeArguments*/ undefined, arg ? [arg] : []);
        if (compilerOptions.esModuleInterop) {
            context.requestEmitHelper(importStarHelper);
            requireCall = ts.createCall(ts.getUnscopedHelperName("__importStar"), /*typeArguments*/ undefined, [requireCall]);
        }
        let func: ts.FunctionExpression | ts.ArrowFunction;
        if (languageVersion >= ts.ScriptTarget.ES2015) {
            func = ts.createArrowFunction(
            /*modifiers*/ undefined, 
            /*typeParameters*/ undefined, 
            /*parameters*/ [], 
            /*type*/ undefined, 
            /*equalsGreaterThanToken*/ undefined, requireCall);
        }
        else {
            func = ts.createFunctionExpression(
            /*modifiers*/ undefined, 
            /*asteriskToken*/ undefined, 
            /*name*/ undefined, 
            /*typeParameters*/ undefined, 
            /*parameters*/ [], 
            /*type*/ undefined, ts.createBlock([ts.createReturn(requireCall)]));
            // if there is a lexical 'this' in the import call arguments, ensure we indicate
            // that this new function expression indicates it captures 'this' so that the
            // es2015 transformer will properly substitute 'this' with '_this'.
            if (containsLexicalThis) {
                ts.setEmitFlags(func, ts.EmitFlags.CapturesThis);
            }
        }
        return ts.createCall(ts.createPropertyAccess(promiseResolveCall, "then"), /*typeArguments*/ undefined, [func]);
    }
    function getHelperExpressionForImport(node: ts.ImportDeclaration, innerExpr: ts.Expression) {
        if (!compilerOptions.esModuleInterop || ts.getEmitFlags(node) & ts.EmitFlags.NeverApplyImportHelper) {
            return innerExpr;
        }
        if (ts.getImportNeedsImportStarHelper(node)) {
            context.requestEmitHelper(importStarHelper);
            return ts.createCall(ts.getUnscopedHelperName("__importStar"), /*typeArguments*/ undefined, [innerExpr]);
        }
        if (ts.getImportNeedsImportDefaultHelper(node)) {
            context.requestEmitHelper(importDefaultHelper);
            return ts.createCall(ts.getUnscopedHelperName("__importDefault"), /*typeArguments*/ undefined, [innerExpr]);
        }
        return innerExpr;
    }
    /**
     * Visits an ImportDeclaration node.
     *
     * @param node The node to visit.
     */
    function visitImportDeclaration(node: ts.ImportDeclaration): ts.VisitResult<ts.Statement> {
        let statements: ts.Statement[] | undefined;
        const namespaceDeclaration = ts.getNamespaceDeclarationNode(node);
        if (moduleKind !== ts.ModuleKind.AMD) {
            if (!node.importClause) {
                // import "mod";
                return ts.setOriginalNode(ts.setTextRange(ts.createExpressionStatement(createRequireCall(node)), node), node);
            }
            else {
                const variables: ts.VariableDeclaration[] = [];
                if (namespaceDeclaration && !ts.isDefaultImport(node)) {
                    // import * as n from "mod";
                    variables.push(ts.createVariableDeclaration(ts.getSynthesizedClone(namespaceDeclaration.name), 
                    /*type*/ undefined, getHelperExpressionForImport(node, createRequireCall(node))));
                }
                else {
                    // import d from "mod";
                    // import { x, y } from "mod";
                    // import d, { x, y } from "mod";
                    // import d, * as n from "mod";
                    variables.push(ts.createVariableDeclaration(ts.getGeneratedNameForNode(node), 
                    /*type*/ undefined, getHelperExpressionForImport(node, createRequireCall(node))));
                    if (namespaceDeclaration && ts.isDefaultImport(node)) {
                        variables.push(ts.createVariableDeclaration(ts.getSynthesizedClone(namespaceDeclaration.name), 
                        /*type*/ undefined, ts.getGeneratedNameForNode(node)));
                    }
                }
                statements = ts.append(statements, ts.setOriginalNode(ts.setTextRange(ts.createVariableStatement(
                /*modifiers*/ undefined, ts.createVariableDeclarationList(variables, languageVersion >= ts.ScriptTarget.ES2015 ? ts.NodeFlags.Const : ts.NodeFlags.None)), 
                /*location*/ node), 
                /*original*/ node));
            }
        }
        else if (namespaceDeclaration && ts.isDefaultImport(node)) {
            // import d, * as n from "mod";
            statements = ts.append(statements, ts.createVariableStatement(
            /*modifiers*/ undefined, ts.createVariableDeclarationList([
                ts.setOriginalNode(ts.setTextRange(ts.createVariableDeclaration(ts.getSynthesizedClone(namespaceDeclaration.name), 
                /*type*/ undefined, ts.getGeneratedNameForNode(node)), 
                /*location*/ node), 
                /*original*/ node)
            ], languageVersion >= ts.ScriptTarget.ES2015 ? ts.NodeFlags.Const : ts.NodeFlags.None)));
        }
        if (hasAssociatedEndOfDeclarationMarker(node)) {
            // Defer exports until we encounter an EndOfDeclarationMarker node
            const id = ts.getOriginalNodeId(node);
            deferredExports[id] = appendExportsOfImportDeclaration(deferredExports[id], node);
        }
        else {
            statements = appendExportsOfImportDeclaration(statements, node);
        }
        return ts.singleOrMany(statements);
    }
    /**
     * Creates a `require()` call to import an external module.
     *
     * @param importNode The declararation to import.
     */
    function createRequireCall(importNode: ts.ImportDeclaration | ts.ImportEqualsDeclaration | ts.ExportDeclaration) {
        const moduleName = ts.getExternalModuleNameLiteral(importNode, currentSourceFile, host, resolver, compilerOptions);
        const args: ts.Expression[] = [];
        if (moduleName) {
            args.push(moduleName);
        }
        return ts.createCall(ts.createIdentifier("require"), /*typeArguments*/ undefined, args);
    }
    /**
     * Visits an ImportEqualsDeclaration node.
     *
     * @param node The node to visit.
     */
    function visitImportEqualsDeclaration(node: ts.ImportEqualsDeclaration): ts.VisitResult<ts.Statement> {
        ts.Debug.assert(ts.isExternalModuleImportEqualsDeclaration(node), "import= for internal module references should be handled in an earlier transformer.");
        let statements: ts.Statement[] | undefined;
        if (moduleKind !== ts.ModuleKind.AMD) {
            if (ts.hasModifier(node, ts.ModifierFlags.Export)) {
                statements = ts.append(statements, ts.setOriginalNode(ts.setTextRange(ts.createExpressionStatement(createExportExpression(node.name, createRequireCall(node))), node), node));
            }
            else {
                statements = ts.append(statements, ts.setOriginalNode(ts.setTextRange(ts.createVariableStatement(
                /*modifiers*/ undefined, ts.createVariableDeclarationList([
                    ts.createVariableDeclaration(ts.getSynthesizedClone(node.name), 
                    /*type*/ undefined, createRequireCall(node))
                ], 
                /*flags*/ languageVersion >= ts.ScriptTarget.ES2015 ? ts.NodeFlags.Const : ts.NodeFlags.None)), node), node));
            }
        }
        else {
            if (ts.hasModifier(node, ts.ModifierFlags.Export)) {
                statements = ts.append(statements, ts.setOriginalNode(ts.setTextRange(ts.createExpressionStatement(createExportExpression(ts.getExportName(node), ts.getLocalName(node))), node), node));
            }
        }
        if (hasAssociatedEndOfDeclarationMarker(node)) {
            // Defer exports until we encounter an EndOfDeclarationMarker node
            const id = ts.getOriginalNodeId(node);
            deferredExports[id] = appendExportsOfImportEqualsDeclaration(deferredExports[id], node);
        }
        else {
            statements = appendExportsOfImportEqualsDeclaration(statements, node);
        }
        return ts.singleOrMany(statements);
    }
    /**
     * Visits an ExportDeclaration node.
     *
     * @param The node to visit.
     */
    function visitExportDeclaration(node: ts.ExportDeclaration): ts.VisitResult<ts.Statement> {
        if (!node.moduleSpecifier) {
            // Elide export declarations with no module specifier as they are handled
            // elsewhere.
            return undefined;
        }
        const generatedName = ts.getGeneratedNameForNode(node);
        if (node.exportClause) {
            const statements: ts.Statement[] = [];
            // export { x, y } from "mod";
            if (moduleKind !== ts.ModuleKind.AMD) {
                statements.push(ts.setOriginalNode(ts.setTextRange(ts.createVariableStatement(
                /*modifiers*/ undefined, ts.createVariableDeclarationList([
                    ts.createVariableDeclaration(generatedName, 
                    /*type*/ undefined, createRequireCall(node))
                ])), 
                /*location*/ node), 
                /* original */ node));
            }
            for (const specifier of node.exportClause.elements) {
                const exportedValue = ts.createPropertyAccess(generatedName, specifier.propertyName || specifier.name);
                statements.push(ts.setOriginalNode(ts.setTextRange(ts.createExpressionStatement(createExportExpression(ts.getExportName(specifier), exportedValue)), specifier), specifier));
            }
            return ts.singleOrMany(statements);
        }
        else {
            // export * from "mod";
            return ts.setOriginalNode(ts.setTextRange(ts.createExpressionStatement(createExportStarHelper(context, moduleKind !== ts.ModuleKind.AMD ? createRequireCall(node) : generatedName)), node), node);
        }
    }
    /**
     * Visits an ExportAssignment node.
     *
     * @param node The node to visit.
     */
    function visitExportAssignment(node: ts.ExportAssignment): ts.VisitResult<ts.Statement> {
        if (node.isExportEquals) {
            return undefined;
        }
        let statements: ts.Statement[] | undefined;
        const original = node.original;
        if (original && hasAssociatedEndOfDeclarationMarker(original)) {
            // Defer exports until we encounter an EndOfDeclarationMarker node
            const id = ts.getOriginalNodeId(node);
            deferredExports[id] = appendExportStatement(deferredExports[id], ts.createIdentifier("default"), ts.visitNode(node.expression, moduleExpressionElementVisitor), /*location*/ node, /*allowComments*/ true);
        }
        else {
            statements = appendExportStatement(statements, ts.createIdentifier("default"), ts.visitNode(node.expression, moduleExpressionElementVisitor), /*location*/ node, /*allowComments*/ true);
        }
        return ts.singleOrMany(statements);
    }
    /**
     * Visits a FunctionDeclaration node.
     *
     * @param node The node to visit.
     */
    function visitFunctionDeclaration(node: ts.FunctionDeclaration): ts.VisitResult<ts.Statement> {
        let statements: ts.Statement[] | undefined;
        if (ts.hasModifier(node, ts.ModifierFlags.Export)) {
            statements = ts.append(statements, ts.setOriginalNode(ts.setTextRange(ts.createFunctionDeclaration(
            /*decorators*/ undefined, ts.visitNodes(node.modifiers, modifierVisitor, ts.isModifier), node.asteriskToken, ts.getDeclarationName(node, /*allowComments*/ true, /*allowSourceMaps*/ true), 
            /*typeParameters*/ undefined, ts.visitNodes(node.parameters, moduleExpressionElementVisitor), 
            /*type*/ undefined, ts.visitEachChild(node.body, moduleExpressionElementVisitor, context)), 
            /*location*/ node), 
            /*original*/ node));
        }
        else {
            statements = ts.append(statements, ts.visitEachChild(node, moduleExpressionElementVisitor, context));
        }
        if (hasAssociatedEndOfDeclarationMarker(node)) {
            // Defer exports until we encounter an EndOfDeclarationMarker node
            const id = ts.getOriginalNodeId(node);
            deferredExports[id] = appendExportsOfHoistedDeclaration(deferredExports[id], node);
        }
        else {
            statements = appendExportsOfHoistedDeclaration(statements, node);
        }
        return ts.singleOrMany(statements);
    }
    /**
     * Visits a ClassDeclaration node.
     *
     * @param node The node to visit.
     */
    function visitClassDeclaration(node: ts.ClassDeclaration): ts.VisitResult<ts.Statement> {
        let statements: ts.Statement[] | undefined;
        if (ts.hasModifier(node, ts.ModifierFlags.Export)) {
            statements = ts.append(statements, ts.setOriginalNode(ts.setTextRange(ts.createClassDeclaration(
            /*decorators*/ undefined, ts.visitNodes(node.modifiers, modifierVisitor, ts.isModifier), ts.getDeclarationName(node, /*allowComments*/ true, /*allowSourceMaps*/ true), 
            /*typeParameters*/ undefined, ts.visitNodes(node.heritageClauses, moduleExpressionElementVisitor), ts.visitNodes(node.members, moduleExpressionElementVisitor)), node), node));
        }
        else {
            statements = ts.append(statements, ts.visitEachChild(node, moduleExpressionElementVisitor, context));
        }
        if (hasAssociatedEndOfDeclarationMarker(node)) {
            // Defer exports until we encounter an EndOfDeclarationMarker node
            const id = ts.getOriginalNodeId(node);
            deferredExports[id] = appendExportsOfHoistedDeclaration(deferredExports[id], node);
        }
        else {
            statements = appendExportsOfHoistedDeclaration(statements, node);
        }
        return ts.singleOrMany(statements);
    }
    /**
     * Visits a VariableStatement node.
     *
     * @param node The node to visit.
     */
    function visitVariableStatement(node: ts.VariableStatement): ts.VisitResult<ts.Statement> {
        let statements: ts.Statement[] | undefined;
        let variables: ts.VariableDeclaration[] | undefined;
        let expressions: ts.Expression[] | undefined;
        if (ts.hasModifier(node, ts.ModifierFlags.Export)) {
            let modifiers: ts.NodeArray<ts.Modifier> | undefined;
            // If we're exporting these variables, then these just become assignments to 'exports.x'.
            // We only want to emit assignments for variables with initializers.
            for (const variable of node.declarationList.declarations) {
                if (ts.isIdentifier(variable.name) && ts.isLocalName(variable.name)) {
                    if (!modifiers) {
                        modifiers = ts.visitNodes(node.modifiers, modifierVisitor, ts.isModifier);
                    }
                    variables = ts.append(variables, variable);
                }
                else if (variable.initializer) {
                    expressions = ts.append(expressions, transformInitializedVariable(variable));
                }
            }
            if (variables) {
                statements = ts.append(statements, ts.updateVariableStatement(node, modifiers, ts.updateVariableDeclarationList(node.declarationList, variables)));
            }
            if (expressions) {
                statements = ts.append(statements, ts.setOriginalNode(ts.setTextRange(ts.createExpressionStatement(ts.inlineExpressions(expressions)), node), node));
            }
        }
        else {
            statements = ts.append(statements, ts.visitEachChild(node, moduleExpressionElementVisitor, context));
        }
        if (hasAssociatedEndOfDeclarationMarker(node)) {
            // Defer exports until we encounter an EndOfDeclarationMarker node
            const id = ts.getOriginalNodeId(node);
            deferredExports[id] = appendExportsOfVariableStatement(deferredExports[id], node);
        }
        else {
            statements = appendExportsOfVariableStatement(statements, node);
        }
        return ts.singleOrMany(statements);
    }
    function createAllExportExpressions(name: ts.Identifier, value: ts.Expression, location?: ts.TextRange) {
        const exportedNames = getExports(name);
        if (exportedNames) {
            // For each additional export of the declaration, apply an export assignment.
            let expression: ts.Expression = ts.isExportName(name) ? value : ts.createAssignment(name, value);
            for (const exportName of exportedNames) {
                // Mark the node to prevent triggering substitution.
                ts.setEmitFlags(expression, ts.EmitFlags.NoSubstitution);
                expression = createExportExpression(exportName, expression, /*location*/ location);
            }
            return expression;
        }
        return ts.createAssignment(name, value);
    }
    /**
     * Transforms an exported variable with an initializer into an expression.
     *
     * @param node The node to transform.
     */
    function transformInitializedVariable(node: ts.VariableDeclaration): ts.Expression {
        if (ts.isBindingPattern(node.name)) {
            return ts.flattenDestructuringAssignment(ts.visitNode(node, moduleExpressionElementVisitor), 
            /*visitor*/ undefined, context, ts.FlattenLevel.All, 
            /*needsValue*/ false, createAllExportExpressions);
        }
        else {
            return ts.createAssignment(ts.setTextRange(ts.createPropertyAccess(ts.createIdentifier("exports"), node.name), 
            /*location*/ node.name), ts.visitNode(node.initializer, moduleExpressionElementVisitor));
        }
    }
    /**
     * Visits a MergeDeclarationMarker used as a placeholder for the beginning of a merged
     * and transformed declaration.
     *
     * @param node The node to visit.
     */
    function visitMergeDeclarationMarker(node: ts.MergeDeclarationMarker): ts.VisitResult<ts.Statement> {
        // For an EnumDeclaration or ModuleDeclaration that merges with a preceeding
        // declaration we do not emit a leading variable declaration. To preserve the
        // begin/end semantics of the declararation and to properly handle exports
        // we wrapped the leading variable declaration in a `MergeDeclarationMarker`.
        //
        // To balance the declaration, add the exports of the elided variable
        // statement.
        if (hasAssociatedEndOfDeclarationMarker(node) && node.original!.kind === ts.SyntaxKind.VariableStatement) {
            const id = ts.getOriginalNodeId(node);
            deferredExports[id] = appendExportsOfVariableStatement(deferredExports[id], (<ts.VariableStatement>node.original));
        }
        return node;
    }
    /**
     * Determines whether a node has an associated EndOfDeclarationMarker.
     *
     * @param node The node to test.
     */
    function hasAssociatedEndOfDeclarationMarker(node: ts.Node) {
        return (ts.getEmitFlags(node) & ts.EmitFlags.HasEndOfDeclarationMarker) !== 0;
    }
    /**
     * Visits a DeclarationMarker used as a placeholder for the end of a transformed
     * declaration.
     *
     * @param node The node to visit.
     */
    function visitEndOfDeclarationMarker(node: ts.EndOfDeclarationMarker): ts.VisitResult<ts.Statement> {
        // For some transformations we emit an `EndOfDeclarationMarker` to mark the actual
        // end of the transformed declaration. We use this marker to emit any deferred exports
        // of the declaration.
        const id = ts.getOriginalNodeId(node);
        const statements = deferredExports[id];
        if (statements) {
            delete deferredExports[id];
            return ts.append(statements, node);
        }
        return node;
    }
    /**
     * Appends the exports of an ImportDeclaration to a statement list, returning the
     * statement list.
     *
     * @param statements A statement list to which the down-level export statements are to be
     * appended. If `statements` is `undefined`, a new array is allocated if statements are
     * appended.
     * @param decl The declaration whose exports are to be recorded.
     */
    function appendExportsOfImportDeclaration(statements: ts.Statement[] | undefined, decl: ts.ImportDeclaration): ts.Statement[] | undefined {
        if (currentModuleInfo.exportEquals) {
            return statements;
        }
        const importClause = decl.importClause;
        if (!importClause) {
            return statements;
        }
        if (importClause.name) {
            statements = appendExportsOfDeclaration(statements, importClause);
        }
        const namedBindings = importClause.namedBindings;
        if (namedBindings) {
            switch (namedBindings.kind) {
                case ts.SyntaxKind.NamespaceImport:
                    statements = appendExportsOfDeclaration(statements, namedBindings);
                    break;
                case ts.SyntaxKind.NamedImports:
                    for (const importBinding of namedBindings.elements) {
                        statements = appendExportsOfDeclaration(statements, importBinding);
                    }
                    break;
            }
        }
        return statements;
    }
    /**
     * Appends the exports of an ImportEqualsDeclaration to a statement list, returning the
     * statement list.
     *
     * @param statements A statement list to which the down-level export statements are to be
     * appended. If `statements` is `undefined`, a new array is allocated if statements are
     * appended.
     * @param decl The declaration whose exports are to be recorded.
     */
    function appendExportsOfImportEqualsDeclaration(statements: ts.Statement[] | undefined, decl: ts.ImportEqualsDeclaration): ts.Statement[] | undefined {
        if (currentModuleInfo.exportEquals) {
            return statements;
        }
        return appendExportsOfDeclaration(statements, decl);
    }
    /**
     * Appends the exports of a VariableStatement to a statement list, returning the statement
     * list.
     *
     * @param statements A statement list to which the down-level export statements are to be
     * appended. If `statements` is `undefined`, a new array is allocated if statements are
     * appended.
     * @param node The VariableStatement whose exports are to be recorded.
     */
    function appendExportsOfVariableStatement(statements: ts.Statement[] | undefined, node: ts.VariableStatement): ts.Statement[] | undefined {
        if (currentModuleInfo.exportEquals) {
            return statements;
        }
        for (const decl of node.declarationList.declarations) {
            statements = appendExportsOfBindingElement(statements, decl);
        }
        return statements;
    }
    /**
     * Appends the exports of a VariableDeclaration or BindingElement to a statement list,
     * returning the statement list.
     *
     * @param statements A statement list to which the down-level export statements are to be
     * appended. If `statements` is `undefined`, a new array is allocated if statements are
     * appended.
     * @param decl The declaration whose exports are to be recorded.
     */
    function appendExportsOfBindingElement(statements: ts.Statement[] | undefined, decl: ts.VariableDeclaration | ts.BindingElement): ts.Statement[] | undefined {
        if (currentModuleInfo.exportEquals) {
            return statements;
        }
        if (ts.isBindingPattern(decl.name)) {
            for (const element of decl.name.elements) {
                if (!ts.isOmittedExpression(element)) {
                    statements = appendExportsOfBindingElement(statements, element);
                }
            }
        }
        else if (!ts.isGeneratedIdentifier(decl.name)) {
            statements = appendExportsOfDeclaration(statements, decl);
        }
        return statements;
    }
    /**
     * Appends the exports of a ClassDeclaration or FunctionDeclaration to a statement list,
     * returning the statement list.
     *
     * @param statements A statement list to which the down-level export statements are to be
     * appended. If `statements` is `undefined`, a new array is allocated if statements are
     * appended.
     * @param decl The declaration whose exports are to be recorded.
     */
    function appendExportsOfHoistedDeclaration(statements: ts.Statement[] | undefined, decl: ts.ClassDeclaration | ts.FunctionDeclaration): ts.Statement[] | undefined {
        if (currentModuleInfo.exportEquals) {
            return statements;
        }
        if (ts.hasModifier(decl, ts.ModifierFlags.Export)) {
            const exportName = ts.hasModifier(decl, ts.ModifierFlags.Default) ? ts.createIdentifier("default") : ts.getDeclarationName(decl);
            statements = appendExportStatement(statements, exportName, ts.getLocalName(decl), /*location*/ decl);
        }
        if (decl.name) {
            statements = appendExportsOfDeclaration(statements, decl);
        }
        return statements;
    }
    /**
     * Appends the exports of a declaration to a statement list, returning the statement list.
     *
     * @param statements A statement list to which the down-level export statements are to be
     * appended. If `statements` is `undefined`, a new array is allocated if statements are
     * appended.
     * @param decl The declaration to export.
     */
    function appendExportsOfDeclaration(statements: ts.Statement[] | undefined, decl: ts.Declaration): ts.Statement[] | undefined {
        const name = ts.getDeclarationName(decl);
        const exportSpecifiers = currentModuleInfo.exportSpecifiers.get(ts.idText(name));
        if (exportSpecifiers) {
            for (const exportSpecifier of exportSpecifiers) {
                statements = appendExportStatement(statements, exportSpecifier.name, name, /*location*/ exportSpecifier.name);
            }
        }
        return statements;
    }
    /**
     * Appends the down-level representation of an export to a statement list, returning the
     * statement list.
     *
     * @param statements A statement list to which the down-level export statements are to be
     * appended. If `statements` is `undefined`, a new array is allocated if statements are
     * appended.
     * @param exportName The name of the export.
     * @param expression The expression to export.
     * @param location The location to use for source maps and comments for the export.
     * @param allowComments Whether to allow comments on the export.
     */
    function appendExportStatement(statements: ts.Statement[] | undefined, exportName: ts.Identifier, expression: ts.Expression, location?: ts.TextRange, allowComments?: boolean): ts.Statement[] | undefined {
        statements = ts.append(statements, createExportStatement(exportName, expression, location, allowComments));
        return statements;
    }
    function createUnderscoreUnderscoreESModule() {
        let statement: ts.Statement;
        if (languageVersion === ts.ScriptTarget.ES3) {
            statement = ts.createExpressionStatement(createExportExpression(ts.createIdentifier("__esModule"), ts.createLiteral(/*value*/ true)));
        }
        else {
            statement = ts.createExpressionStatement(ts.createCall(ts.createPropertyAccess(ts.createIdentifier("Object"), "defineProperty"), 
            /*typeArguments*/ undefined, [
                ts.createIdentifier("exports"),
                ts.createLiteral("__esModule"),
                ts.createObjectLiteral([
                    ts.createPropertyAssignment("value", ts.createLiteral(/*value*/ true))
                ])
            ]));
        }
        ts.setEmitFlags(statement, ts.EmitFlags.CustomPrologue);
        return statement;
    }
    /**
     * Creates a call to the current file's export function to export a value.
     *
     * @param name The bound name of the export.
     * @param value The exported value.
     * @param location The location to use for source maps and comments for the export.
     * @param allowComments An optional value indicating whether to emit comments for the statement.
     */
    function createExportStatement(name: ts.Identifier, value: ts.Expression, location?: ts.TextRange, allowComments?: boolean) {
        const statement = ts.setTextRange(ts.createExpressionStatement(createExportExpression(name, value)), location);
        ts.startOnNewLine(statement);
        if (!allowComments) {
            ts.setEmitFlags(statement, ts.EmitFlags.NoComments);
        }
        return statement;
    }
    /**
     * Creates a call to the current file's export function to export a value.
     *
     * @param name The bound name of the export.
     * @param value The exported value.
     * @param location The location to use for source maps and comments for the export.
     */
    function createExportExpression(name: ts.Identifier, value: ts.Expression, location?: ts.TextRange) {
        return ts.setTextRange(ts.createAssignment(ts.createPropertyAccess(ts.createIdentifier("exports"), ts.getSynthesizedClone(name)), value), location);
    }
    //
    // Modifier Visitors
    //
    /**
     * Visit nodes to elide module-specific modifiers.
     *
     * @param node The node to visit.
     */
    function modifierVisitor(node: ts.Node): ts.VisitResult<ts.Node> {
        // Elide module-specific modifiers.
        switch (node.kind) {
            case ts.SyntaxKind.ExportKeyword:
            case ts.SyntaxKind.DefaultKeyword:
                return undefined;
        }
        return node;
    }
    //
    // Emit Notification
    //
    /**
     * Hook for node emit notifications.
     *
     * @param hint A hint as to the intended usage of the node.
     * @param node The node to emit.
     * @param emit A callback used to emit the node in the printer.
     */
    function onEmitNode(hint: ts.EmitHint, node: ts.Node, emitCallback: (hint: ts.EmitHint, node: ts.Node) => void): void {
        if (node.kind === ts.SyntaxKind.SourceFile) {
            currentSourceFile = (<ts.SourceFile>node);
            currentModuleInfo = moduleInfoMap[ts.getOriginalNodeId(currentSourceFile)];
            noSubstitution = [];
            previousOnEmitNode(hint, node, emitCallback);
            currentSourceFile = undefined!;
            currentModuleInfo = undefined!;
            noSubstitution = undefined!;
        }
        else {
            previousOnEmitNode(hint, node, emitCallback);
        }
    }
    //
    // Substitutions
    //
    /**
     * Hooks node substitutions.
     *
     * @param hint A hint as to the intended usage of the node.
     * @param node The node to substitute.
     */
    function onSubstituteNode(hint: ts.EmitHint, node: ts.Node) {
        node = previousOnSubstituteNode(hint, node);
        if (node.id && noSubstitution[node.id]) {
            return node;
        }
        if (hint === ts.EmitHint.Expression) {
            return substituteExpression((<ts.Expression>node));
        }
        else if (ts.isShorthandPropertyAssignment(node)) {
            return substituteShorthandPropertyAssignment(node);
        }
        return node;
    }
    /**
     * Substitution for a ShorthandPropertyAssignment whose declaration name is an imported
     * or exported symbol.
     *
     * @param node The node to substitute.
     */
    function substituteShorthandPropertyAssignment(node: ts.ShorthandPropertyAssignment): ts.ObjectLiteralElementLike {
        const name = node.name;
        const exportedOrImportedName = substituteExpressionIdentifier(name);
        if (exportedOrImportedName !== name) {
            // A shorthand property with an assignment initializer is probably part of a
            // destructuring assignment
            if (node.objectAssignmentInitializer) {
                const initializer = ts.createAssignment(exportedOrImportedName, node.objectAssignmentInitializer);
                return ts.setTextRange(ts.createPropertyAssignment(name, initializer), node);
            }
            return ts.setTextRange(ts.createPropertyAssignment(name, exportedOrImportedName), node);
        }
        return node;
    }
    /**
     * Substitution for an Expression that may contain an imported or exported symbol.
     *
     * @param node The node to substitute.
     */
    function substituteExpression(node: ts.Expression) {
        switch (node.kind) {
            case ts.SyntaxKind.Identifier:
                return substituteExpressionIdentifier((<ts.Identifier>node));
            case ts.SyntaxKind.BinaryExpression:
                return substituteBinaryExpression((<ts.BinaryExpression>node));
            case ts.SyntaxKind.PostfixUnaryExpression:
            case ts.SyntaxKind.PrefixUnaryExpression:
                return substituteUnaryExpression((<ts.PrefixUnaryExpression | ts.PostfixUnaryExpression>node));
        }
        return node;
    }
    /**
     * Substitution for an Identifier expression that may contain an imported or exported
     * symbol.
     *
     * @param node The node to substitute.
     */
    function substituteExpressionIdentifier(node: ts.Identifier): ts.Expression {
        if (ts.getEmitFlags(node) & ts.EmitFlags.HelperName) {
            const externalHelpersModuleName = ts.getExternalHelpersModuleName(currentSourceFile);
            if (externalHelpersModuleName) {
                return ts.createPropertyAccess(externalHelpersModuleName, node);
            }
            return node;
        }
        if (!ts.isGeneratedIdentifier(node) && !ts.isLocalName(node)) {
            const exportContainer = resolver.getReferencedExportContainer(node, ts.isExportName(node));
            if (exportContainer && exportContainer.kind === ts.SyntaxKind.SourceFile) {
                return ts.setTextRange(ts.createPropertyAccess(ts.createIdentifier("exports"), ts.getSynthesizedClone(node)), 
                /*location*/ node);
            }
            const importDeclaration = resolver.getReferencedImportDeclaration(node);
            if (importDeclaration) {
                if (ts.isImportClause(importDeclaration)) {
                    return ts.setTextRange(ts.createPropertyAccess(ts.getGeneratedNameForNode(importDeclaration.parent), ts.createIdentifier("default")), 
                    /*location*/ node);
                }
                else if (ts.isImportSpecifier(importDeclaration)) {
                    const name = importDeclaration.propertyName || importDeclaration.name;
                    return ts.setTextRange(ts.createPropertyAccess(ts.getGeneratedNameForNode(importDeclaration.parent.parent.parent), ts.getSynthesizedClone(name)), 
                    /*location*/ node);
                }
            }
        }
        return node;
    }
    /**
     * Substitution for a BinaryExpression that may contain an imported or exported symbol.
     *
     * @param node The node to substitute.
     */
    function substituteBinaryExpression(node: ts.BinaryExpression): ts.Expression {
        // When we see an assignment expression whose left-hand side is an exported symbol,
        // we should ensure all exports of that symbol are updated with the correct value.
        //
        // - We do not substitute generated identifiers for any reason.
        // - We do not substitute identifiers tagged with the LocalName flag.
        // - We do not substitute identifiers that were originally the name of an enum or
        //   namespace due to how they are transformed in TypeScript.
        // - We only substitute identifiers that are exported at the top level.
        if (ts.isAssignmentOperator(node.operatorToken.kind)
            && ts.isIdentifier(node.left)
            && !ts.isGeneratedIdentifier(node.left)
            && !ts.isLocalName(node.left)
            && !ts.isDeclarationNameOfEnumOrNamespace(node.left)) {
            const exportedNames = getExports(node.left);
            if (exportedNames) {
                // For each additional export of the declaration, apply an export assignment.
                let expression: ts.Expression = node;
                for (const exportName of exportedNames) {
                    // Mark the node to prevent triggering this rule again.
                    noSubstitution[ts.getNodeId(expression)] = true;
                    expression = createExportExpression(exportName, expression, /*location*/ node);
                }
                return expression;
            }
        }
        return node;
    }
    /**
     * Substitution for a UnaryExpression that may contain an imported or exported symbol.
     *
     * @param node The node to substitute.
     */
    function substituteUnaryExpression(node: ts.PrefixUnaryExpression | ts.PostfixUnaryExpression): ts.Expression {
        // When we see a prefix or postfix increment expression whose operand is an exported
        // symbol, we should ensure all exports of that symbol are updated with the correct
        // value.
        //
        // - We do not substitute generated identifiers for any reason.
        // - We do not substitute identifiers tagged with the LocalName flag.
        // - We do not substitute identifiers that were originally the name of an enum or
        //   namespace due to how they are transformed in TypeScript.
        // - We only substitute identifiers that are exported at the top level.
        if ((node.operator === ts.SyntaxKind.PlusPlusToken || node.operator === ts.SyntaxKind.MinusMinusToken)
            && ts.isIdentifier(node.operand)
            && !ts.isGeneratedIdentifier(node.operand)
            && !ts.isLocalName(node.operand)
            && !ts.isDeclarationNameOfEnumOrNamespace(node.operand)) {
            const exportedNames = getExports(node.operand);
            if (exportedNames) {
                let expression: ts.Expression = node.kind === ts.SyntaxKind.PostfixUnaryExpression
                    ? ts.setTextRange(ts.createBinary(node.operand, ts.createToken(node.operator === ts.SyntaxKind.PlusPlusToken ? ts.SyntaxKind.PlusEqualsToken : ts.SyntaxKind.MinusEqualsToken), ts.createLiteral(1)), 
                    /*location*/ node)
                    : node;
                for (const exportName of exportedNames) {
                    // Mark the node to prevent triggering this rule again.
                    noSubstitution[ts.getNodeId(expression)] = true;
                    expression = createExportExpression(exportName, expression);
                }
                return expression;
            }
        }
        return node;
    }
    /**
     * Gets the additional exports of a name.
     *
     * @param name The name.
     */
    function getExports(name: ts.Identifier): ts.Identifier[] | undefined {
        if (!ts.isGeneratedIdentifier(name)) {
            const valueDeclaration = resolver.getReferencedImportDeclaration(name)
                || resolver.getReferencedValueDeclaration(name);
            if (valueDeclaration) {
                return currentModuleInfo
                    && currentModuleInfo.exportedBindings[ts.getOriginalNodeId(valueDeclaration)];
            }
        }
    }
}
// emit output for the __export helper function
/* @internal */
const exportStarHelper: ts.EmitHelper = {
    name: "typescript:export-star",
    scoped: true,
    text: `
            function __export(m) {
                for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
            }`
};
/* @internal */
function createExportStarHelper(context: ts.TransformationContext, module: ts.Expression) {
    const compilerOptions = context.getCompilerOptions();
    return compilerOptions.importHelpers
        ? ts.createCall(ts.getUnscopedHelperName("__exportStar"), /*typeArguments*/ undefined, [module, ts.createIdentifier("exports")])
        : ts.createCall(ts.createIdentifier("__export"), /*typeArguments*/ undefined, [module]);
}
// emit helper for dynamic import
/* @internal */
const dynamicImportUMDHelper: ts.EmitHelper = {
    name: "typescript:dynamicimport-sync-require",
    scoped: true,
    text: `
            var __syncRequire = typeof module === "object" && typeof module.exports === "object";`
};
// emit helper for `import * as Name from "foo"`
/* @internal */
export const importStarHelper: ts.UnscopedEmitHelper = {
    name: "typescript:commonjsimportstar",
    importName: "__importStar",
    scoped: false,
    text: `
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};`
};
// emit helper for `import Name from "foo"`
/* @internal */
export const importDefaultHelper: ts.UnscopedEmitHelper = {
    name: "typescript:commonjsimportdefault",
    importName: "__importDefault",
    scoped: false,
    text: `
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};`
};
