import * as ts from "../ts";
/* @internal */
export function getOriginalNodeId(node: ts.Node) {
    node = ts.getOriginalNode(node);
    return node ? ts.getNodeId(node) : 0;
}
/* @internal */
export interface ExternalModuleInfo {
    externalImports: (ts.ImportDeclaration | ts.ImportEqualsDeclaration | ts.ExportDeclaration)[]; // imports of other external modules
    externalHelpersImportDeclaration: ts.ImportDeclaration | undefined; // import of external helpers
    exportSpecifiers: ts.Map<ts.ExportSpecifier[]>; // export specifiers by name
    exportedBindings: ts.Identifier[][]; // exported names of local declarations
    exportedNames: ts.Identifier[] | undefined; // all exported names local to module
    exportEquals: ts.ExportAssignment | undefined; // an export= declaration if one was present
    hasExportStarsToExportValues: boolean; // whether this module contains export*
}
/* @internal */
function containsDefaultReference(node: ts.NamedImportBindings | undefined) {
    if (!node)
        return false;
    if (!ts.isNamedImports(node))
        return false;
    return ts.some(node.elements, isNamedDefaultReference);
}
/* @internal */
function isNamedDefaultReference(e: ts.ImportSpecifier): boolean {
    return e.propertyName !== undefined && e.propertyName.escapedText === ts.InternalSymbolName.Default;
}
/* @internal */
export function chainBundle(transformSourceFile: (x: ts.SourceFile) => ts.SourceFile): (x: ts.SourceFile | ts.Bundle) => ts.SourceFile | ts.Bundle {
    return transformSourceFileOrBundle;
    function transformSourceFileOrBundle(node: ts.SourceFile | ts.Bundle) {
        return node.kind === ts.SyntaxKind.SourceFile ? transformSourceFile(node) : transformBundle(node);
    }
    function transformBundle(node: ts.Bundle) {
        return ts.createBundle(ts.map(node.sourceFiles, transformSourceFile), node.prepends);
    }
}
/* @internal */
export function getImportNeedsImportStarHelper(node: ts.ImportDeclaration): boolean {
    if (!!ts.getNamespaceDeclarationNode(node)) {
        return true;
    }
    const bindings = node.importClause && node.importClause.namedBindings;
    if (!bindings) {
        return false;
    }
    if (!ts.isNamedImports(bindings))
        return false;
    let defaultRefCount = 0;
    for (const binding of bindings.elements) {
        if (isNamedDefaultReference(binding)) {
            defaultRefCount++;
        }
    }
    // Import star is required if there's default named refs mixed with non-default refs, or if theres non-default refs and it has a default import
    return (defaultRefCount > 0 && defaultRefCount !== bindings.elements.length) || (!!(bindings.elements.length - defaultRefCount) && ts.isDefaultImport(node));
}
/* @internal */
export function getImportNeedsImportDefaultHelper(node: ts.ImportDeclaration): boolean {
    // Import default is needed if there's a default import or a default ref and no other refs (meaning an import star helper wasn't requested)
    return !getImportNeedsImportStarHelper(node) && (ts.isDefaultImport(node) || (!!node.importClause && ts.isNamedImports((node.importClause.namedBindings!)) && containsDefaultReference(node.importClause.namedBindings))); // TODO: GH#18217
}
/* @internal */
export function collectExternalModuleInfo(sourceFile: ts.SourceFile, resolver: ts.EmitResolver, compilerOptions: ts.CompilerOptions): ExternalModuleInfo {
    const externalImports: (ts.ImportDeclaration | ts.ImportEqualsDeclaration | ts.ExportDeclaration)[] = [];
    const exportSpecifiers = ts.createMultiMap<ts.ExportSpecifier>();
    const exportedBindings: ts.Identifier[][] = [];
    const uniqueExports = ts.createMap<boolean>();
    let exportedNames: ts.Identifier[] | undefined;
    let hasExportDefault = false;
    let exportEquals: ts.ExportAssignment | undefined;
    let hasExportStarsToExportValues = false;
    let hasImportStar = false;
    let hasImportDefault = false;
    for (const node of sourceFile.statements) {
        switch (node.kind) {
            case ts.SyntaxKind.ImportDeclaration:
                // import "mod"
                // import x from "mod"
                // import * as x from "mod"
                // import { x, y } from "mod"
                externalImports.push((<ts.ImportDeclaration>node));
                if (!hasImportStar && getImportNeedsImportStarHelper((<ts.ImportDeclaration>node))) {
                    hasImportStar = true;
                }
                if (!hasImportDefault && getImportNeedsImportDefaultHelper((<ts.ImportDeclaration>node))) {
                    hasImportDefault = true;
                }
                break;
            case ts.SyntaxKind.ImportEqualsDeclaration:
                if ((<ts.ImportEqualsDeclaration>node).moduleReference.kind === ts.SyntaxKind.ExternalModuleReference) {
                    // import x = require("mod")
                    externalImports.push((<ts.ImportEqualsDeclaration>node));
                }
                break;
            case ts.SyntaxKind.ExportDeclaration:
                if ((<ts.ExportDeclaration>node).moduleSpecifier) {
                    if (!(<ts.ExportDeclaration>node).exportClause) {
                        // export * from "mod"
                        externalImports.push((<ts.ExportDeclaration>node));
                        hasExportStarsToExportValues = true;
                    }
                    else {
                        // export { x, y } from "mod"
                        externalImports.push((<ts.ExportDeclaration>node));
                    }
                }
                else {
                    // export { x, y }
                    for (const specifier of (<ts.ExportDeclaration>node).exportClause!.elements) {
                        if (!uniqueExports.get(ts.idText(specifier.name))) {
                            const name = specifier.propertyName || specifier.name;
                            exportSpecifiers.add(ts.idText(name), specifier);
                            const decl = resolver.getReferencedImportDeclaration(name)
                                || resolver.getReferencedValueDeclaration(name);
                            if (decl) {
                                multiMapSparseArrayAdd(exportedBindings, getOriginalNodeId(decl), specifier.name);
                            }
                            uniqueExports.set(ts.idText(specifier.name), true);
                            exportedNames = ts.append(exportedNames, specifier.name);
                        }
                    }
                }
                break;
            case ts.SyntaxKind.ExportAssignment:
                if ((<ts.ExportAssignment>node).isExportEquals && !exportEquals) {
                    // export = x
                    exportEquals = (<ts.ExportAssignment>node);
                }
                break;
            case ts.SyntaxKind.VariableStatement:
                if (ts.hasModifier(node, ts.ModifierFlags.Export)) {
                    for (const decl of (<ts.VariableStatement>node).declarationList.declarations) {
                        exportedNames = collectExportedVariableInfo(decl, uniqueExports, exportedNames);
                    }
                }
                break;
            case ts.SyntaxKind.FunctionDeclaration:
                if (ts.hasModifier(node, ts.ModifierFlags.Export)) {
                    if (ts.hasModifier(node, ts.ModifierFlags.Default)) {
                        // export default function() { }
                        if (!hasExportDefault) {
                            multiMapSparseArrayAdd(exportedBindings, getOriginalNodeId(node), ts.getDeclarationName((<ts.FunctionDeclaration>node)));
                            hasExportDefault = true;
                        }
                    }
                    else {
                        // export function x() { }
                        const name = ((<ts.FunctionDeclaration>node).name!);
                        if (!uniqueExports.get(ts.idText(name))) {
                            multiMapSparseArrayAdd(exportedBindings, getOriginalNodeId(node), name);
                            uniqueExports.set(ts.idText(name), true);
                            exportedNames = ts.append(exportedNames, name);
                        }
                    }
                }
                break;
            case ts.SyntaxKind.ClassDeclaration:
                if (ts.hasModifier(node, ts.ModifierFlags.Export)) {
                    if (ts.hasModifier(node, ts.ModifierFlags.Default)) {
                        // export default class { }
                        if (!hasExportDefault) {
                            multiMapSparseArrayAdd(exportedBindings, getOriginalNodeId(node), ts.getDeclarationName((<ts.ClassDeclaration>node)));
                            hasExportDefault = true;
                        }
                    }
                    else {
                        // export class x { }
                        const name = (<ts.ClassDeclaration>node).name;
                        if (name && !uniqueExports.get(ts.idText(name))) {
                            multiMapSparseArrayAdd(exportedBindings, getOriginalNodeId(node), name);
                            uniqueExports.set(ts.idText(name), true);
                            exportedNames = ts.append(exportedNames, name);
                        }
                    }
                }
                break;
        }
    }
    const externalHelpersImportDeclaration = ts.createExternalHelpersImportDeclarationIfNeeded(sourceFile, compilerOptions, hasExportStarsToExportValues, hasImportStar, hasImportDefault);
    if (externalHelpersImportDeclaration) {
        externalImports.unshift(externalHelpersImportDeclaration);
    }
    return { externalImports, exportSpecifiers, exportEquals, hasExportStarsToExportValues, exportedBindings, exportedNames, externalHelpersImportDeclaration };
}
/* @internal */
function collectExportedVariableInfo(decl: ts.VariableDeclaration | ts.BindingElement, uniqueExports: ts.Map<boolean>, exportedNames: ts.Identifier[] | undefined) {
    if (ts.isBindingPattern(decl.name)) {
        for (const element of decl.name.elements) {
            if (!ts.isOmittedExpression(element)) {
                exportedNames = collectExportedVariableInfo(element, uniqueExports, exportedNames);
            }
        }
    }
    else if (!ts.isGeneratedIdentifier(decl.name)) {
        const text = ts.idText(decl.name);
        if (!uniqueExports.get(text)) {
            uniqueExports.set(text, true);
            exportedNames = ts.append(exportedNames, decl.name);
        }
    }
    return exportedNames;
}
/** Use a sparse array as a multi-map. */
/* @internal */
function multiMapSparseArrayAdd<V>(map: V[][], key: number, value: V): V[] {
    let values = map[key];
    if (values) {
        values.push(value);
    }
    else {
        map[key] = values = [value];
    }
    return values;
}
/**
 * Used in the module transformer to check if an expression is reasonably without sideeffect,
 *  and thus better to copy into multiple places rather than to cache in a temporary variable
 *  - this is mostly subjective beyond the requirement that the expression not be sideeffecting
 */
/* @internal */
export function isSimpleCopiableExpression(expression: ts.Expression) {
    return ts.isStringLiteralLike(expression) ||
        expression.kind === ts.SyntaxKind.NumericLiteral ||
        ts.isKeyword(expression.kind) ||
        ts.isIdentifier(expression);
}
/**
 * A simple inlinable expression is an expression which can be copied into multiple locations
 * without risk of repeating any sideeffects and whose value could not possibly change between
 * any such locations
 */
/* @internal */
export function isSimpleInlineableExpression(expression: ts.Expression) {
    return !ts.isIdentifier(expression) && isSimpleCopiableExpression(expression) ||
        ts.isWellKnownSymbolSyntactically(expression);
}
/**
 * Adds super call and preceding prologue directives into the list of statements.
 *
 * @param ctor The constructor node.
 * @param result The list of statements.
 * @param visitor The visitor to apply to each node added to the result array.
 * @returns index of the statement that follows super call
 */
/* @internal */
export function addPrologueDirectivesAndInitialSuperCall(ctor: ts.ConstructorDeclaration, result: ts.Statement[], visitor: ts.Visitor): number {
    if (ctor.body) {
        const statements = ctor.body.statements;
        // add prologue directives to the list (if any)
        const index = ts.addPrologue(result, statements, /*ensureUseStrict*/ false, visitor);
        if (index === statements.length) {
            // list contains nothing but prologue directives (or empty) - exit
            return index;
        }
        const statement = statements[index];
        if (statement.kind === ts.SyntaxKind.ExpressionStatement && ts.isSuperCall((<ts.ExpressionStatement>statement).expression)) {
            result.push(ts.visitNode(statement, visitor, ts.isStatement));
            return index + 1;
        }
        return index;
    }
    return 0;
}
/**
 * @param input Template string input strings
 * @param args Names which need to be made file-level unique
 */
/* @internal */
export function helperString(input: TemplateStringsArray, ...args: string[]) {
    return (uniqueName: ts.EmitHelperUniqueNameCallback) => {
        let result = "";
        for (let i = 0; i < args.length; i++) {
            result += input[i];
            result += uniqueName(args[i]);
        }
        result += input[input.length - 1];
        return result;
    };
}
/**
 * Gets all the static or all the instance property declarations of a class
 *
 * @param node The class node.
 * @param isStatic A value indicating whether to get properties from the static or instance side of the class.
 */
/* @internal */
export function getProperties(node: ts.ClassExpression | ts.ClassDeclaration, requireInitializer: boolean, isStatic: boolean): readonly ts.PropertyDeclaration[] {
    return ts.filter(node.members, m => isInitializedOrStaticProperty(m, requireInitializer, isStatic)) as ts.PropertyDeclaration[];
}
/**
 * Is a class element either a static or an instance property declaration with an initializer?
 *
 * @param member The class element node.
 * @param isStatic A value indicating whether the member should be a static or instance member.
 */
/* @internal */
function isInitializedOrStaticProperty(member: ts.ClassElement, requireInitializer: boolean, isStatic: boolean) {
    return ts.isPropertyDeclaration(member)
        && (!!member.initializer || !requireInitializer)
        && ts.hasStaticModifier(member) === isStatic;
}
/* @internal */
export function isInitializedProperty(member: ts.ClassElement, requireInitializer: boolean): member is ts.PropertyDeclaration {
    return ts.isPropertyDeclaration(member) && (!!member.initializer || !requireInitializer);
}
