/* @internal */
namespace ts {
    const visitedNestedConvertibleFunctions = ts.createMap<true>();
    export function computeSuggestionDiagnostics(sourceFile: ts.SourceFile, program: ts.Program, cancellationToken: ts.CancellationToken): ts.DiagnosticWithLocation[] {
        program.getSemanticDiagnostics(sourceFile, cancellationToken);
        const diags: ts.DiagnosticWithLocation[] = [];
        const checker = program.getTypeChecker();
        if (sourceFile.commonJsModuleIndicator &&
            (ts.programContainsEs6Modules(program) || ts.compilerOptionsIndicateEs6Modules(program.getCompilerOptions())) &&
            containsTopLevelCommonjs(sourceFile)) {
            diags.push(ts.createDiagnosticForNode(getErrorNodeFromCommonJsIndicator(sourceFile.commonJsModuleIndicator), ts.Diagnostics.File_is_a_CommonJS_module_it_may_be_converted_to_an_ES6_module));
        }
        const isJsFile = ts.isSourceFileJS(sourceFile);
        visitedNestedConvertibleFunctions.clear();
        check(sourceFile);
        if (ts.getAllowSyntheticDefaultImports(program.getCompilerOptions())) {
            for (const moduleSpecifier of sourceFile.imports) {
                const importNode = ts.importFromModuleSpecifier(moduleSpecifier);
                const name = importNameForConvertToDefaultImport(importNode);
                if (!name)
                    continue;
                const module = ts.getResolvedModule(sourceFile, moduleSpecifier.text);
                const resolvedFile = module && program.getSourceFile(module.resolvedFileName);
                if (resolvedFile && resolvedFile.externalModuleIndicator && ts.isExportAssignment(resolvedFile.externalModuleIndicator) && resolvedFile.externalModuleIndicator.isExportEquals) {
                    diags.push(ts.createDiagnosticForNode(name, ts.Diagnostics.Import_may_be_converted_to_a_default_import));
                }
            }
        }
        ts.addRange(diags, sourceFile.bindSuggestionDiagnostics);
        ts.addRange(diags, program.getSuggestionDiagnostics(sourceFile, cancellationToken));
        return diags.sort((d1, d2) => d1.start - d2.start);
        function check(node: ts.Node) {
            if (isJsFile) {
                switch (node.kind) {
                    case ts.SyntaxKind.FunctionExpression:
                        const decl = ts.getDeclarationOfExpando(node);
                        if (decl) {
                            const symbol = decl.symbol;
                            if (symbol && (symbol.exports && symbol.exports.size || symbol.members && symbol.members.size)) {
                                diags.push(ts.createDiagnosticForNode(ts.isVariableDeclaration(node.parent) ? node.parent.name : node, ts.Diagnostics.This_constructor_function_may_be_converted_to_a_class_declaration));
                                break;
                            }
                        }
                    // falls through if no diagnostic was created
                    case ts.SyntaxKind.FunctionDeclaration:
                        const symbol = node.symbol;
                        if (symbol.members && (symbol.members.size > 0)) {
                            diags.push(ts.createDiagnosticForNode(ts.isVariableDeclaration(node.parent) ? node.parent.name : node, ts.Diagnostics.This_constructor_function_may_be_converted_to_a_class_declaration));
                        }
                        break;
                }
            }
            else {
                if (ts.isVariableStatement(node) &&
                    node.parent === sourceFile &&
                    node.declarationList.flags & ts.NodeFlags.Const &&
                    node.declarationList.declarations.length === 1) {
                    const init = node.declarationList.declarations[0].initializer;
                    if (init && ts.isRequireCall(init, /*checkArgumentIsStringLiteralLike*/ true)) {
                        diags.push(ts.createDiagnosticForNode(init, ts.Diagnostics.require_call_may_be_converted_to_an_import));
                    }
                }
                if (ts.codefix.parameterShouldGetTypeFromJSDoc(node)) {
                    diags.push(ts.createDiagnosticForNode(node.name || node, ts.Diagnostics.JSDoc_types_may_be_moved_to_TypeScript_types));
                }
            }
            if (ts.isFunctionLikeDeclaration(node)) {
                addConvertToAsyncFunctionDiagnostics(node, checker, diags);
            }
            node.forEachChild(check);
        }
    }
    // convertToEs6Module only works on top-level, so don't trigger it if commonjs code only appears in nested scopes.
    function containsTopLevelCommonjs(sourceFile: ts.SourceFile): boolean {
        return sourceFile.statements.some(statement => {
            switch (statement.kind) {
                case ts.SyntaxKind.VariableStatement:
                    return (statement as ts.VariableStatement).declarationList.declarations.some(decl => !!decl.initializer && ts.isRequireCall(propertyAccessLeftHandSide(decl.initializer), /*checkArgumentIsStringLiteralLike*/ true));
                case ts.SyntaxKind.ExpressionStatement: {
                    const { expression } = (statement as ts.ExpressionStatement);
                    if (!ts.isBinaryExpression(expression))
                        return ts.isRequireCall(expression, /*checkArgumentIsStringLiteralLike*/ true);
                    const kind = ts.getAssignmentDeclarationKind(expression);
                    return kind === ts.AssignmentDeclarationKind.ExportsProperty || kind === ts.AssignmentDeclarationKind.ModuleExports;
                }
                default:
                    return false;
            }
        });
    }
    function propertyAccessLeftHandSide(node: ts.Expression): ts.Expression {
        return ts.isPropertyAccessExpression(node) ? propertyAccessLeftHandSide(node.expression) : node;
    }
    function importNameForConvertToDefaultImport(node: ts.AnyValidImportOrReExport): ts.Identifier | undefined {
        switch (node.kind) {
            case ts.SyntaxKind.ImportDeclaration:
                const { importClause, moduleSpecifier } = node;
                return importClause && !importClause.name && importClause.namedBindings && importClause.namedBindings.kind === ts.SyntaxKind.NamespaceImport && ts.isStringLiteral(moduleSpecifier)
                    ? importClause.namedBindings.name
                    : undefined;
            case ts.SyntaxKind.ImportEqualsDeclaration:
                return node.name;
            default:
                return undefined;
        }
    }
    function addConvertToAsyncFunctionDiagnostics(node: ts.FunctionLikeDeclaration, checker: ts.TypeChecker, diags: ts.Push<ts.DiagnosticWithLocation>): void {
        // need to check function before checking map so that deeper levels of nested callbacks are checked
        if (isConvertibleFunction(node, checker) && !visitedNestedConvertibleFunctions.has(getKeyFromNode(node))) {
            diags.push(ts.createDiagnosticForNode(!node.name && ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name) ? node.parent.name : node, ts.Diagnostics.This_may_be_converted_to_an_async_function));
        }
    }
    function isConvertibleFunction(node: ts.FunctionLikeDeclaration, checker: ts.TypeChecker) {
        return !ts.isAsyncFunction(node) &&
            node.body &&
            ts.isBlock(node.body) &&
            hasReturnStatementWithPromiseHandler(node.body) &&
            returnsPromise(node, checker);
    }
    function returnsPromise(node: ts.FunctionLikeDeclaration, checker: ts.TypeChecker): boolean {
        const functionType = checker.getTypeAtLocation(node);
        const callSignatures = checker.getSignaturesOfType(functionType, ts.SignatureKind.Call);
        const returnType = callSignatures.length ? checker.getReturnTypeOfSignature(callSignatures[0]) : undefined;
        return !!returnType && !!checker.getPromisedTypeOfPromise(returnType);
    }
    function getErrorNodeFromCommonJsIndicator(commonJsModuleIndicator: ts.Node): ts.Node {
        return ts.isBinaryExpression(commonJsModuleIndicator) ? commonJsModuleIndicator.left : commonJsModuleIndicator;
    }
    function hasReturnStatementWithPromiseHandler(body: ts.Block): boolean {
        return !!ts.forEachReturnStatement(body, isReturnStatementWithFixablePromiseHandler);
    }
    export function isReturnStatementWithFixablePromiseHandler(node: ts.Node): node is ts.ReturnStatement {
        return ts.isReturnStatement(node) && !!node.expression && isFixablePromiseHandler(node.expression);
    }
    // Should be kept up to date with transformExpression in convertToAsyncFunction.ts
    export function isFixablePromiseHandler(node: ts.Node): boolean {
        // ensure outermost call exists and is a promise handler
        if (!isPromiseHandler(node) || !node.arguments.every(isFixablePromiseArgument)) {
            return false;
        }
        // ensure all chained calls are valid
        let currentNode = node.expression;
        while (isPromiseHandler(currentNode) || ts.isPropertyAccessExpression(currentNode)) {
            if (ts.isCallExpression(currentNode) && !currentNode.arguments.every(isFixablePromiseArgument)) {
                return false;
            }
            currentNode = currentNode.expression;
        }
        return true;
    }
    function isPromiseHandler(node: ts.Node): node is ts.CallExpression {
        return ts.isCallExpression(node) && (ts.hasPropertyAccessExpressionWithName(node, "then") || ts.hasPropertyAccessExpressionWithName(node, "catch"));
    }
    // should be kept up to date with getTransformationBody in convertToAsyncFunction.ts
    function isFixablePromiseArgument(arg: ts.Expression): boolean {
        switch (arg.kind) {
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.ArrowFunction:
                visitedNestedConvertibleFunctions.set(getKeyFromNode((arg as ts.FunctionLikeDeclaration)), true);
            // falls through
            case ts.SyntaxKind.NullKeyword:
            case ts.SyntaxKind.Identifier: // identifier includes undefined
                return true;
            default:
                return false;
        }
    }
    function getKeyFromNode(exp: ts.FunctionLikeDeclaration) {
        return `${exp.pos.toString()}:${exp.end.toString()}`;
    }
}
