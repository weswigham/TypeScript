/* @internal */
namespace ts.codefix {
    ts.codefix.registerCodeFix({
        errorCodes: [ts.Diagnostics.File_is_a_CommonJS_module_it_may_be_converted_to_an_ES6_module.code],
        getCodeActions(context) {
            const { sourceFile, program, preferences } = context;
            const changes = ts.textChanges.ChangeTracker.with(context, changes => {
                const moduleExportsChangedToDefault = convertFileToEs6Module(sourceFile, program.getTypeChecker(), changes, (program.getCompilerOptions().target!), ts.getQuotePreference(sourceFile, preferences));
                if (moduleExportsChangedToDefault) {
                    for (const importingFile of program.getSourceFiles()) {
                        fixImportOfModuleExports(importingFile, sourceFile, changes, ts.getQuotePreference(importingFile, preferences));
                    }
                }
            });
            // No support for fix-all since this applies to the whole file at once anyway.
            return [ts.codefix.createCodeFixActionNoFixId("convertToEs6Module", changes, ts.Diagnostics.Convert_to_ES6_module)];
        },
    });
    function fixImportOfModuleExports(importingFile: ts.SourceFile, exportingFile: ts.SourceFile, changes: ts.textChanges.ChangeTracker, quotePreference: ts.QuotePreference) {
        for (const moduleSpecifier of importingFile.imports) {
            const imported = ts.getResolvedModule(importingFile, moduleSpecifier.text);
            if (!imported || imported.resolvedFileName !== exportingFile.fileName) {
                continue;
            }
            const importNode = ts.importFromModuleSpecifier(moduleSpecifier);
            switch (importNode.kind) {
                case ts.SyntaxKind.ImportEqualsDeclaration:
                    changes.replaceNode(importingFile, importNode, ts.makeImport(importNode.name, /*namedImports*/ undefined, moduleSpecifier, quotePreference));
                    break;
                case ts.SyntaxKind.CallExpression:
                    if (ts.isRequireCall(importNode, /*checkArgumentIsStringLiteralLike*/ false)) {
                        changes.replaceNode(importingFile, importNode, ts.createPropertyAccess(ts.getSynthesizedDeepClone(importNode), "default"));
                    }
                    break;
            }
        }
    }
    /** @returns Whether we converted a `module.exports =` to a default export. */
    function convertFileToEs6Module(sourceFile: ts.SourceFile, checker: ts.TypeChecker, changes: ts.textChanges.ChangeTracker, target: ts.ScriptTarget, quotePreference: ts.QuotePreference): ModuleExportsChanged {
        const identifiers: Identifiers = { original: collectFreeIdentifiers(sourceFile), additional: ts.createMap<true>() };
        const exports = collectExportRenames(sourceFile, checker, identifiers);
        convertExportsAccesses(sourceFile, exports, changes);
        let moduleExportsChangedToDefault = false;
        for (const statement of sourceFile.statements) {
            const moduleExportsChanged = convertStatement(sourceFile, statement, checker, changes, identifiers, target, exports, quotePreference);
            moduleExportsChangedToDefault = moduleExportsChangedToDefault || moduleExportsChanged;
        }
        return moduleExportsChangedToDefault;
    }
    /**
     * Contains an entry for each renamed export.
     * This is necessary because `exports.x = 0;` does not declare a local variable.
     * Converting this to `export const x = 0;` would declare a local, so we must be careful to avoid shadowing.
     * If there would be shadowing at either the declaration or at any reference to `exports.x` (now just `x`), we must convert to:
     *     const _x = 0;
     *     export { _x as x };
     * This conversion also must place if the exported name is not a valid identifier, e.g. `exports.class = 0;`.
     */
    type ExportRenames = ts.ReadonlyMap<string>;
    function collectExportRenames(sourceFile: ts.SourceFile, checker: ts.TypeChecker, identifiers: Identifiers): ExportRenames {
        const res = ts.createMap<string>();
        forEachExportReference(sourceFile, node => {
            const { text, originalKeywordKind } = node.name;
            if (!res.has(text) && (originalKeywordKind !== undefined && ts.isNonContextualKeyword(originalKeywordKind)
                || checker.resolveName(node.name.text, node, ts.SymbolFlags.Value, /*excludeGlobals*/ true))) {
                // Unconditionally add an underscore in case `text` is a keyword.
                res.set(text, makeUniqueName(`_${text}`, identifiers));
            }
        });
        return res;
    }
    function convertExportsAccesses(sourceFile: ts.SourceFile, exports: ExportRenames, changes: ts.textChanges.ChangeTracker): void {
        forEachExportReference(sourceFile, (node, isAssignmentLhs) => {
            if (isAssignmentLhs) {
                return;
            }
            const { text } = node.name;
            changes.replaceNode(sourceFile, node, ts.createIdentifier(exports.get(text) || text));
        });
    }
    function forEachExportReference(sourceFile: ts.SourceFile, cb: (node: ts.PropertyAccessExpression, isAssignmentLhs: boolean) => void): void {
        sourceFile.forEachChild(function recur(node) {
            if (ts.isPropertyAccessExpression(node) && ts.isExportsOrModuleExportsOrAlias(sourceFile, node.expression)) {
                const { parent } = node;
                cb(node, ts.isBinaryExpression(parent) && parent.left === node && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken);
            }
            node.forEachChild(recur);
        });
    }
    /** Whether `module.exports =` was changed to `export default` */
    type ModuleExportsChanged = boolean;
    function convertStatement(sourceFile: ts.SourceFile, statement: ts.Statement, checker: ts.TypeChecker, changes: ts.textChanges.ChangeTracker, identifiers: Identifiers, target: ts.ScriptTarget, exports: ExportRenames, quotePreference: ts.QuotePreference): ModuleExportsChanged {
        switch (statement.kind) {
            case ts.SyntaxKind.VariableStatement:
                convertVariableStatement(sourceFile, (statement as ts.VariableStatement), changes, checker, identifiers, target, quotePreference);
                return false;
            case ts.SyntaxKind.ExpressionStatement: {
                const { expression } = (statement as ts.ExpressionStatement);
                switch (expression.kind) {
                    case ts.SyntaxKind.CallExpression: {
                        if (ts.isRequireCall(expression, /*checkArgumentIsStringLiteralLike*/ true)) {
                            // For side-effecting require() call, just make a side-effecting import.
                            changes.replaceNode(sourceFile, statement, ts.makeImport(/*name*/ undefined, /*namedImports*/ undefined, expression.arguments[0], quotePreference));
                        }
                        return false;
                    }
                    case ts.SyntaxKind.BinaryExpression: {
                        const { operatorToken } = (expression as ts.BinaryExpression);
                        return operatorToken.kind === ts.SyntaxKind.EqualsToken && convertAssignment(sourceFile, checker, (expression as ts.BinaryExpression), changes, exports);
                    }
                }
            }
            // falls through
            default:
                return false;
        }
    }
    function convertVariableStatement(sourceFile: ts.SourceFile, statement: ts.VariableStatement, changes: ts.textChanges.ChangeTracker, checker: ts.TypeChecker, identifiers: Identifiers, target: ts.ScriptTarget, quotePreference: ts.QuotePreference): void {
        const { declarationList } = statement;
        let foundImport = false;
        const newNodes = ts.flatMap(declarationList.declarations, decl => {
            const { name, initializer } = decl;
            if (initializer) {
                if (ts.isExportsOrModuleExportsOrAlias(sourceFile, initializer)) {
                    // `const alias = module.exports;` can be removed.
                    foundImport = true;
                    return [];
                }
                else if (ts.isRequireCall(initializer, /*checkArgumentIsStringLiteralLike*/ true)) {
                    foundImport = true;
                    return convertSingleImport(sourceFile, name, initializer.arguments[0], changes, checker, identifiers, target, quotePreference);
                }
                else if (ts.isPropertyAccessExpression(initializer) && ts.isRequireCall(initializer.expression, /*checkArgumentIsStringLiteralLike*/ true)) {
                    foundImport = true;
                    return convertPropertyAccessImport(name, initializer.name.text, initializer.expression.arguments[0], identifiers, quotePreference);
                }
            }
            // Move it out to its own variable statement. (This will not be used if `!foundImport`)
            return ts.createVariableStatement(/*modifiers*/ undefined, ts.createVariableDeclarationList([decl], declarationList.flags));
        });
        if (foundImport) {
            // useNonAdjustedEndPosition to ensure we don't eat the newline after the statement.
            changes.replaceNodeWithNodes(sourceFile, statement, newNodes);
        }
    }
    /** Converts `const name = require("moduleSpecifier").propertyName` */
    function convertPropertyAccessImport(name: ts.BindingName, propertyName: string, moduleSpecifier: ts.StringLiteralLike, identifiers: Identifiers, quotePreference: ts.QuotePreference): readonly ts.Node[] {
        switch (name.kind) {
            case ts.SyntaxKind.ObjectBindingPattern:
            case ts.SyntaxKind.ArrayBindingPattern: {
                // `const [a, b] = require("c").d` --> `import { d } from "c"; const [a, b] = d;`
                const tmp = makeUniqueName(propertyName, identifiers);
                return [
                    makeSingleImport(tmp, propertyName, moduleSpecifier, quotePreference),
                    makeConst(/*modifiers*/ undefined, name, ts.createIdentifier(tmp)),
                ];
            }
            case ts.SyntaxKind.Identifier:
                // `const a = require("b").c` --> `import { c as a } from "./b";
                return [makeSingleImport(name.text, propertyName, moduleSpecifier, quotePreference)];
            default:
                return ts.Debug.assertNever(name, `Convert to ES6 module got invalid syntax form ${(name as ts.BindingName).kind}`);
        }
    }
    function convertAssignment(sourceFile: ts.SourceFile, checker: ts.TypeChecker, assignment: ts.BinaryExpression, changes: ts.textChanges.ChangeTracker, exports: ExportRenames): ModuleExportsChanged {
        const { left, right } = assignment;
        if (!ts.isPropertyAccessExpression(left)) {
            return false;
        }
        if (ts.isExportsOrModuleExportsOrAlias(sourceFile, left)) {
            if (ts.isExportsOrModuleExportsOrAlias(sourceFile, right)) {
                // `const alias = module.exports;` or `module.exports = alias;` can be removed.
                changes.delete(sourceFile, assignment.parent);
            }
            else {
                const replacement = ts.isObjectLiteralExpression(right) ? tryChangeModuleExportsObject(right)
                    : ts.isRequireCall(right, /*checkArgumentIsStringLiteralLike*/ true) ? convertReExportAll(right.arguments[0], checker)
                        : undefined;
                if (replacement) {
                    changes.replaceNodeWithNodes(sourceFile, assignment.parent, replacement[0]);
                    return replacement[1];
                }
                else {
                    changes.replaceRangeWithText(sourceFile, ts.createRange(left.getStart(sourceFile), right.pos), "export default");
                    return true;
                }
            }
        }
        else if (ts.isExportsOrModuleExportsOrAlias(sourceFile, left.expression)) {
            convertNamedExport(sourceFile, (assignment as ts.BinaryExpression & {
                left: ts.PropertyAccessExpression;
            }), changes, exports);
        }
        return false;
    }
    /**
     * Convert `module.exports = { ... }` to individual exports..
     * We can't always do this if the module has interesting members -- then it will be a default export instead.
     */
    function tryChangeModuleExportsObject(object: ts.ObjectLiteralExpression): [readonly ts.Statement[], ModuleExportsChanged] | undefined {
        const statements = ts.mapAllOrFail(object.properties, prop => {
            switch (prop.kind) {
                case ts.SyntaxKind.GetAccessor:
                case ts.SyntaxKind.SetAccessor:
                // TODO: Maybe we should handle this? See fourslash test `refactorConvertToEs6Module_export_object_shorthand.ts`.
                // falls through
                case ts.SyntaxKind.ShorthandPropertyAssignment:
                case ts.SyntaxKind.SpreadAssignment:
                    return undefined;
                case ts.SyntaxKind.PropertyAssignment:
                    return !ts.isIdentifier(prop.name) ? undefined : convertExportsDotXEquals_replaceNode(prop.name.text, prop.initializer);
                case ts.SyntaxKind.MethodDeclaration:
                    return !ts.isIdentifier(prop.name) ? undefined : functionExpressionToDeclaration(prop.name.text, [ts.createToken(ts.SyntaxKind.ExportKeyword)], prop);
                default:
                    ts.Debug.assertNever(prop, `Convert to ES6 got invalid prop kind ${(prop as ts.ObjectLiteralElementLike).kind}`);
            }
        });
        return statements && [statements, false];
    }
    function convertNamedExport(sourceFile: ts.SourceFile, assignment: ts.BinaryExpression & {
        left: ts.PropertyAccessExpression;
    }, changes: ts.textChanges.ChangeTracker, exports: ExportRenames): void {
        // If "originalKeywordKind" was set, this is e.g. `exports.
        const { text } = assignment.left.name;
        const rename = exports.get(text);
        if (rename !== undefined) {
            /*
            const _class = 0;
            export { _class as class };
            */
            const newNodes = [
                makeConst(/*modifiers*/ undefined, rename, assignment.right),
                makeExportDeclaration([ts.createExportSpecifier(rename, text)]),
            ];
            changes.replaceNodeWithNodes(sourceFile, assignment.parent, newNodes);
        }
        else {
            convertExportsPropertyAssignment(assignment, sourceFile, changes);
        }
    }
    function convertReExportAll(reExported: ts.StringLiteralLike, checker: ts.TypeChecker): [readonly ts.Statement[], ModuleExportsChanged] {
        // `module.exports = require("x");` ==> `export * from "x"; export { default } from "x";`
        const moduleSpecifier = reExported.text;
        const moduleSymbol = checker.getSymbolAtLocation(reExported);
        const exports = moduleSymbol ? moduleSymbol.exports! : ts.emptyUnderscoreEscapedMap;
        return exports.has(("export=" as ts.__String)) ? [[reExportDefault(moduleSpecifier)], true] :
            !exports.has(("default" as ts.__String)) ? [[reExportStar(moduleSpecifier)], false] :
                // If there's some non-default export, must include both `export *` and `export default`.
                exports.size > 1 ? [[reExportStar(moduleSpecifier), reExportDefault(moduleSpecifier)], true] : [[reExportDefault(moduleSpecifier)], true];
    }
    function reExportStar(moduleSpecifier: string): ts.ExportDeclaration {
        return makeExportDeclaration(/*exportClause*/ undefined, moduleSpecifier);
    }
    function reExportDefault(moduleSpecifier: string): ts.ExportDeclaration {
        return makeExportDeclaration([ts.createExportSpecifier(/*propertyName*/ undefined, "default")], moduleSpecifier);
    }
    function convertExportsPropertyAssignment({ left, right, parent }: ts.BinaryExpression & {
        left: ts.PropertyAccessExpression;
    }, sourceFile: ts.SourceFile, changes: ts.textChanges.ChangeTracker): void {
        const name = left.name.text;
        if ((ts.isFunctionExpression(right) || ts.isArrowFunction(right) || ts.isClassExpression(right)) && (!right.name || right.name.text === name)) {
            // `exports.f = function() {}` -> `export function f() {}` -- Replace `exports.f = ` with `export `, and insert the name after `function`.
            changes.replaceRange(sourceFile, { pos: left.getStart(sourceFile), end: right.getStart(sourceFile) }, ts.createToken(ts.SyntaxKind.ExportKeyword), { suffix: " " });
            if (!right.name)
                changes.insertName(sourceFile, right, name);
            const semi = ts.findChildOfKind(parent, ts.SyntaxKind.SemicolonToken, sourceFile);
            if (semi)
                changes.delete(sourceFile, semi);
        }
        else {
            // `exports.f = function g() {}` -> `export const f = function g() {}` -- just replace `exports.` with `export const `
            changes.replaceNodeRangeWithNodes(sourceFile, left.expression, (ts.findChildOfKind(left, ts.SyntaxKind.DotToken, sourceFile)!), [ts.createToken(ts.SyntaxKind.ExportKeyword), ts.createToken(ts.SyntaxKind.ConstKeyword)], { joiner: " ", suffix: " " });
        }
    }
    // TODO: GH#22492 this will cause an error if a change has been made inside the body of the node.
    function convertExportsDotXEquals_replaceNode(name: string | undefined, exported: ts.Expression): ts.Statement {
        const modifiers = [ts.createToken(ts.SyntaxKind.ExportKeyword)];
        switch (exported.kind) {
            case ts.SyntaxKind.FunctionExpression: {
                const { name: expressionName } = (exported as ts.FunctionExpression);
                if (expressionName && expressionName.text !== name) {
                    // `exports.f = function g() {}` -> `export const f = function g() {}`
                    return exportConst();
                }
            }
            // falls through
            case ts.SyntaxKind.ArrowFunction:
                // `exports.f = function() {}` --> `export function f() {}`
                return functionExpressionToDeclaration(name, modifiers, (exported as ts.FunctionExpression | ts.ArrowFunction));
            case ts.SyntaxKind.ClassExpression:
                // `exports.C = class {}` --> `export class C {}`
                return classExpressionToDeclaration(name, modifiers, (exported as ts.ClassExpression));
            default:
                return exportConst();
        }
        function exportConst() {
            // `exports.x = 0;` --> `export const x = 0;`
            return makeConst(modifiers, ts.createIdentifier((name!)), exported); // TODO: GH#18217
        }
    }
    /**
     * Converts `const <<name>> = require("x");`.
     * Returns nodes that will replace the variable declaration for the commonjs import.
     * May also make use `changes` to remove qualifiers at the use sites of imports, to change `mod.x` to `x`.
     */
    function convertSingleImport(file: ts.SourceFile, name: ts.BindingName, moduleSpecifier: ts.StringLiteralLike, changes: ts.textChanges.ChangeTracker, checker: ts.TypeChecker, identifiers: Identifiers, target: ts.ScriptTarget, quotePreference: ts.QuotePreference): readonly ts.Node[] {
        switch (name.kind) {
            case ts.SyntaxKind.ObjectBindingPattern: {
                const importSpecifiers = ts.mapAllOrFail(name.elements, e => e.dotDotDotToken || e.initializer || e.propertyName && !ts.isIdentifier(e.propertyName) || !ts.isIdentifier(e.name)
                    ? undefined
                    // (TODO: GH#18217)
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                    : makeImportSpecifier(e.propertyName && (e.propertyName as ts.Identifier).text, e.name.text));
                if (importSpecifiers) {
                    return [ts.makeImport(/*name*/ undefined, importSpecifiers, moduleSpecifier, quotePreference)];
                }
            }
            // falls through -- object destructuring has an interesting pattern and must be a variable declaration
            case ts.SyntaxKind.ArrayBindingPattern: {
                /*
                import x from "x";
                const [a, b, c] = x;
                */
                const tmp = makeUniqueName(ts.codefix.moduleSpecifierToValidIdentifier(moduleSpecifier.text, target), identifiers);
                return [
                    ts.makeImport(ts.createIdentifier(tmp), /*namedImports*/ undefined, moduleSpecifier, quotePreference),
                    makeConst(/*modifiers*/ undefined, ts.getSynthesizedDeepClone(name), ts.createIdentifier(tmp)),
                ];
            }
            case ts.SyntaxKind.Identifier:
                return convertSingleIdentifierImport(file, name, moduleSpecifier, changes, checker, identifiers, quotePreference);
            default:
                return ts.Debug.assertNever(name, `Convert to ES6 module got invalid name kind ${(name as ts.BindingName).kind}`);
        }
    }
    /**
     * Convert `import x = require("x").`
     * Also converts uses like `x.y()` to `y()` and uses a named import.
     */
    function convertSingleIdentifierImport(file: ts.SourceFile, name: ts.Identifier, moduleSpecifier: ts.StringLiteralLike, changes: ts.textChanges.ChangeTracker, checker: ts.TypeChecker, identifiers: Identifiers, quotePreference: ts.QuotePreference): readonly ts.Node[] {
        const nameSymbol = checker.getSymbolAtLocation(name);
        // Maps from module property name to name actually used. (The same if there isn't shadowing.)
        const namedBindingsNames = ts.createMap<string>();
        // True if there is some non-property use like `x()` or `f(x)`.
        let needDefaultImport = false;
        for (const use of identifiers.original.get(name.text)!) {
            if (checker.getSymbolAtLocation(use) !== nameSymbol || use === name) {
                // This was a use of a different symbol with the same name, due to shadowing. Ignore.
                continue;
            }
            const { parent } = use;
            if (ts.isPropertyAccessExpression(parent)) {
                const { expression, name: { text: propertyName } } = parent;
                ts.Debug.assert(expression === use, "Didn't expect expression === use"); // Else shouldn't have been in `collectIdentifiers`
                let idName = namedBindingsNames.get(propertyName);
                if (idName === undefined) {
                    idName = makeUniqueName(propertyName, identifiers);
                    namedBindingsNames.set(propertyName, idName);
                }
                changes.replaceNode(file, parent, ts.createIdentifier(idName));
            }
            else {
                needDefaultImport = true;
            }
        }
        const namedBindings = namedBindingsNames.size === 0 ? undefined : ts.arrayFrom(ts.mapIterator(namedBindingsNames.entries(), ([propertyName, idName]) => ts.createImportSpecifier(propertyName === idName ? undefined : ts.createIdentifier(propertyName), ts.createIdentifier(idName))));
        if (!namedBindings) {
            // If it was unused, ensure that we at least import *something*.
            needDefaultImport = true;
        }
        return [ts.makeImport(needDefaultImport ? ts.getSynthesizedDeepClone(name) : undefined, namedBindings, moduleSpecifier, quotePreference)];
    }
    // Identifiers helpers
    function makeUniqueName(name: string, identifiers: Identifiers): string {
        while (identifiers.original.has(name) || identifiers.additional.has(name)) {
            name = `_${name}`;
        }
        identifiers.additional.set(name, true);
        return name;
    }
    /**
     * Helps us create unique identifiers.
     * `original` refers to the local variable names in the original source file.
     * `additional` is any new unique identifiers we've generated. (e.g., we'll generate `_x`, then `__x`.)
     */
    interface Identifiers {
        readonly original: FreeIdentifiers;
        // Additional identifiers we've added. Mutable!
        readonly additional: ts.Map<true>;
    }
    type FreeIdentifiers = ts.ReadonlyMap<readonly ts.Identifier[]>;
    function collectFreeIdentifiers(file: ts.SourceFile): FreeIdentifiers {
        const map = ts.createMultiMap<ts.Identifier>();
        forEachFreeIdentifier(file, id => map.add(id.text, id));
        return map;
    }
    /**
     * A free identifier is an identifier that can be accessed through name lookup as a local variable.
     * In the expression `x.y`, `x` is a free identifier, but `y` is not.
     */
    function forEachFreeIdentifier(node: ts.Node, cb: (id: ts.Identifier) => void): void {
        if (ts.isIdentifier(node) && isFreeIdentifier(node))
            cb(node);
        node.forEachChild(child => forEachFreeIdentifier(child, cb));
    }
    function isFreeIdentifier(node: ts.Identifier): boolean {
        const { parent } = node;
        switch (parent.kind) {
            case ts.SyntaxKind.PropertyAccessExpression:
                return (parent as ts.PropertyAccessExpression).name !== node;
            case ts.SyntaxKind.BindingElement:
                return (parent as ts.BindingElement).propertyName !== node;
            case ts.SyntaxKind.ImportSpecifier:
                return (parent as ts.ImportSpecifier).propertyName !== node;
            default:
                return true;
        }
    }
    // Node helpers
    function functionExpressionToDeclaration(name: string | undefined, additionalModifiers: readonly ts.Modifier[], fn: ts.FunctionExpression | ts.ArrowFunction | ts.MethodDeclaration): ts.FunctionDeclaration {
        return ts.createFunctionDeclaration(ts.getSynthesizedDeepClones(fn.decorators), // TODO: GH#19915 Don't think this is even legal.
        ts.concatenate(additionalModifiers, ts.getSynthesizedDeepClones(fn.modifiers)), ts.getSynthesizedDeepClone(fn.asteriskToken), name, ts.getSynthesizedDeepClones(fn.typeParameters), ts.getSynthesizedDeepClones(fn.parameters), ts.getSynthesizedDeepClone(fn.type), ts.convertToFunctionBody(ts.getSynthesizedDeepClone((fn.body!))));
    }
    function classExpressionToDeclaration(name: string | undefined, additionalModifiers: readonly ts.Modifier[], cls: ts.ClassExpression): ts.ClassDeclaration {
        return ts.createClassDeclaration(ts.getSynthesizedDeepClones(cls.decorators), // TODO: GH#19915 Don't think this is even legal.
        ts.concatenate(additionalModifiers, ts.getSynthesizedDeepClones(cls.modifiers)), name, ts.getSynthesizedDeepClones(cls.typeParameters), ts.getSynthesizedDeepClones(cls.heritageClauses), ts.getSynthesizedDeepClones(cls.members));
    }
    function makeSingleImport(localName: string, propertyName: string, moduleSpecifier: ts.StringLiteralLike, quotePreference: ts.QuotePreference): ts.ImportDeclaration {
        return propertyName === "default"
            ? ts.makeImport(ts.createIdentifier(localName), /*namedImports*/ undefined, moduleSpecifier, quotePreference)
            : ts.makeImport(/*name*/ undefined, [makeImportSpecifier(propertyName, localName)], moduleSpecifier, quotePreference);
    }
    function makeImportSpecifier(propertyName: string | undefined, name: string): ts.ImportSpecifier {
        return ts.createImportSpecifier(propertyName !== undefined && propertyName !== name ? ts.createIdentifier(propertyName) : undefined, ts.createIdentifier(name));
    }
    function makeConst(modifiers: readonly ts.Modifier[] | undefined, name: string | ts.BindingName, init: ts.Expression): ts.VariableStatement {
        return ts.createVariableStatement(modifiers, ts.createVariableDeclarationList([ts.createVariableDeclaration(name, /*type*/ undefined, init)], ts.NodeFlags.Const));
    }
    function makeExportDeclaration(exportSpecifiers: ts.ExportSpecifier[] | undefined, moduleSpecifier?: string): ts.ExportDeclaration {
        return ts.createExportDeclaration(
        /*decorators*/ undefined, 
        /*modifiers*/ undefined, exportSpecifiers && ts.createNamedExports(exportSpecifiers), moduleSpecifier === undefined ? undefined : ts.createLiteral(moduleSpecifier));
    }
}
