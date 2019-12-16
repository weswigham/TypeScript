import * as ts from "./ts";
/* @internal */
export const enum ModuleInstanceState {
    NonInstantiated = 0,
    Instantiated = 1,
    ConstEnumOnly = 2
}
/* @internal */
interface ActiveLabel {
    next: ActiveLabel | undefined;
    name: ts.__String;
    breakTarget: ts.FlowLabel;
    continueTarget: ts.FlowLabel | undefined;
    referenced: boolean;
}
/* @internal */
export function getModuleInstanceState(node: ts.ModuleDeclaration, visited?: ts.Map<ModuleInstanceState | undefined>): ModuleInstanceState {
    if (node.body && !node.body.parent) {
        // getModuleInstanceStateForAliasTarget needs to walk up the parent chain, so parent pointers must be set on this tree already
        setParentPointers(node, node.body);
    }
    return node.body ? getModuleInstanceStateCached(node.body, visited) : ModuleInstanceState.Instantiated;
}
/* @internal */
function getModuleInstanceStateCached(node: ts.Node, visited = ts.createMap<ModuleInstanceState | undefined>()) {
    const nodeId = "" + ts.getNodeId(node);
    if (visited.has(nodeId)) {
        return visited.get(nodeId) || ModuleInstanceState.NonInstantiated;
    }
    visited.set(nodeId, undefined);
    const result = getModuleInstanceStateWorker(node, visited);
    visited.set(nodeId, result);
    return result;
}
/* @internal */
function getModuleInstanceStateWorker(node: ts.Node, visited: ts.Map<ModuleInstanceState | undefined>): ModuleInstanceState {
    // A module is uninstantiated if it contains only
    switch (node.kind) {
        // 1. interface declarations, type alias declarations
        case ts.SyntaxKind.InterfaceDeclaration:
        case ts.SyntaxKind.TypeAliasDeclaration:
            return ModuleInstanceState.NonInstantiated;
        // 2. const enum declarations
        case ts.SyntaxKind.EnumDeclaration:
            if (ts.isEnumConst((node as ts.EnumDeclaration))) {
                return ModuleInstanceState.ConstEnumOnly;
            }
            break;
        // 3. non-exported import declarations
        case ts.SyntaxKind.ImportDeclaration:
        case ts.SyntaxKind.ImportEqualsDeclaration:
            if (!(ts.hasModifier(node, ts.ModifierFlags.Export))) {
                return ModuleInstanceState.NonInstantiated;
            }
            break;
        // 4. Export alias declarations pointing at only uninstantiated modules or things uninstantiated modules contain
        case ts.SyntaxKind.ExportDeclaration:
            if (!(node as ts.ExportDeclaration).moduleSpecifier && !!(node as ts.ExportDeclaration).exportClause) {
                let state = ModuleInstanceState.NonInstantiated;
                for (const specifier of (node as ts.ExportDeclaration).exportClause!.elements) {
                    const specifierState = getModuleInstanceStateForAliasTarget(specifier, visited);
                    if (specifierState > state) {
                        state = specifierState;
                    }
                    if (state === ModuleInstanceState.Instantiated) {
                        return state;
                    }
                }
                return state;
            }
            break;
        // 5. other uninstantiated module declarations.
        case ts.SyntaxKind.ModuleBlock: {
            let state = ModuleInstanceState.NonInstantiated;
            ts.forEachChild(node, n => {
                const childState = getModuleInstanceStateCached(n, visited);
                switch (childState) {
                    case ModuleInstanceState.NonInstantiated:
                        // child is non-instantiated - continue searching
                        return;
                    case ModuleInstanceState.ConstEnumOnly:
                        // child is const enum only - record state and continue searching
                        state = ModuleInstanceState.ConstEnumOnly;
                        return;
                    case ModuleInstanceState.Instantiated:
                        // child is instantiated - record state and stop
                        state = ModuleInstanceState.Instantiated;
                        return true;
                    default:
                        ts.Debug.assertNever(childState);
                }
            });
            return state;
        }
        case ts.SyntaxKind.ModuleDeclaration:
            return getModuleInstanceState((node as ts.ModuleDeclaration), visited);
        case ts.SyntaxKind.Identifier:
            // Only jsdoc typedef definition can exist in jsdoc namespace, and it should
            // be considered the same as type alias
            if ((<ts.Identifier>node).isInJSDocNamespace) {
                return ModuleInstanceState.NonInstantiated;
            }
    }
    return ModuleInstanceState.Instantiated;
}
/* @internal */
function getModuleInstanceStateForAliasTarget(specifier: ts.ExportSpecifier, visited: ts.Map<ModuleInstanceState | undefined>) {
    const name = specifier.propertyName || specifier.name;
    let p: ts.Node | undefined = specifier.parent;
    while (p) {
        if (ts.isBlock(p) || ts.isModuleBlock(p) || ts.isSourceFile(p)) {
            const statements = p.statements;
            let found: ModuleInstanceState | undefined;
            for (const statement of statements) {
                if (ts.nodeHasName(statement, name)) {
                    if (!statement.parent) {
                        setParentPointers(p, statement);
                    }
                    const state = getModuleInstanceStateCached(statement, visited);
                    if (found === undefined || state > found) {
                        found = state;
                    }
                    if (found === ModuleInstanceState.Instantiated) {
                        return found;
                    }
                }
            }
            if (found !== undefined) {
                return found;
            }
        }
        p = p.parent;
    }
    return ModuleInstanceState.Instantiated; // Couldn't locate, assume could refer to a value
}
/* @internal */
const enum ContainerFlags {
    // The current node is not a container, and no container manipulation should happen before
    // recursing into it.
    None = 0,
    // The current node is a container.  It should be set as the current container (and block-
    // container) before recursing into it.  The current node does not have locals.  Examples:
    //
    //      Classes, ObjectLiterals, TypeLiterals, Interfaces...
    IsContainer = 1 << 0,
    // The current node is a block-scoped-container.  It should be set as the current block-
    // container before recursing into it.  Examples:
    //
    //      Blocks (when not parented by functions), Catch clauses, For/For-in/For-of statements...
    IsBlockScopedContainer = 1 << 1,
    // The current node is the container of a control flow path. The current control flow should
    // be saved and restored, and a new control flow initialized within the container.
    IsControlFlowContainer = 1 << 2,
    IsFunctionLike = 1 << 3,
    IsFunctionExpression = 1 << 4,
    HasLocals = 1 << 5,
    IsInterface = 1 << 6,
    IsObjectLiteralOrClassExpressionMethod = 1 << 7
}
/* @internal */
function initFlowNode<T extends ts.FlowNode>(node: T) {
    ts.Debug.attachFlowNodeDebugInfo(node);
    return node;
}
/* @internal */
const binder = createBinder();
/* @internal */
export function bindSourceFile(file: ts.SourceFile, options: ts.CompilerOptions) {
    ts.performance.mark("beforeBind");
    ts.perfLogger.logStartBindFile("" + file.fileName);
    binder(file, options);
    ts.perfLogger.logStopBindFile();
    ts.performance.mark("afterBind");
    ts.performance.measure("Bind", "beforeBind", "afterBind");
}
/* @internal */
function createBinder(): (file: ts.SourceFile, options: ts.CompilerOptions) => void {
    let file: ts.SourceFile;
    let options: ts.CompilerOptions;
    let languageVersion: ts.ScriptTarget;
    let parent: ts.Node;
    let container: ts.Node;
    let thisParentContainer: ts.Node; // Container one level up
    let blockScopeContainer: ts.Node;
    let lastContainer: ts.Node;
    let delayedTypeAliases: (ts.JSDocTypedefTag | ts.JSDocCallbackTag | ts.JSDocEnumTag)[];
    let seenThisKeyword: boolean;
    // state used by control flow analysis
    let currentFlow: ts.FlowNode;
    let currentBreakTarget: ts.FlowLabel | undefined;
    let currentContinueTarget: ts.FlowLabel | undefined;
    let currentReturnTarget: ts.FlowLabel | undefined;
    let currentTrueTarget: ts.FlowLabel | undefined;
    let currentFalseTarget: ts.FlowLabel | undefined;
    let currentExceptionTarget: ts.FlowLabel | undefined;
    let preSwitchCaseFlow: ts.FlowNode | undefined;
    let activeLabelList: ActiveLabel | undefined;
    let hasExplicitReturn: boolean;
    // state used for emit helpers
    let emitFlags: ts.NodeFlags;
    // If this file is an external module, then it is automatically in strict-mode according to
    // ES6.  If it is not an external module, then we'll determine if it is in strict mode or
    // not depending on if we see "use strict" in certain places or if we hit a class/namespace
    // or if compiler options contain alwaysStrict.
    let inStrictMode: boolean;
    let symbolCount = 0;
    let Symbol: new (flags: ts.SymbolFlags, name: ts.__String) => ts.Symbol;
    let classifiableNames: ts.UnderscoreEscapedMap<true>;
    const unreachableFlow: ts.FlowNode = { flags: ts.FlowFlags.Unreachable };
    const reportedUnreachableFlow: ts.FlowNode = { flags: ts.FlowFlags.Unreachable };
    // state used to aggregate transform flags during bind.
    let subtreeTransformFlags: ts.TransformFlags = ts.TransformFlags.None;
    let skipTransformFlagAggregation: boolean;
    /**
     * Inside the binder, we may create a diagnostic for an as-yet unbound node (with potentially no parent pointers, implying no accessible source file)
     * If so, the node _must_ be in the current file (as that's the only way anything could have traversed to it to yield it as the error node)
     * This version of `createDiagnosticForNode` uses the binder's context to account for this, and always yields correct diagnostics even in these situations.
     */
    function createDiagnosticForNode(node: ts.Node, message: ts.DiagnosticMessage, arg0?: string | number, arg1?: string | number, arg2?: string | number): ts.DiagnosticWithLocation {
        return ts.createDiagnosticForNodeInSourceFile(ts.getSourceFileOfNode(node) || file, node, message, arg0, arg1, arg2);
    }
    function bindSourceFile(f: ts.SourceFile, opts: ts.CompilerOptions) {
        file = f;
        options = opts;
        languageVersion = ts.getEmitScriptTarget(options);
        inStrictMode = bindInStrictMode(file, opts);
        classifiableNames = ts.createUnderscoreEscapedMap<true>();
        symbolCount = 0;
        skipTransformFlagAggregation = file.isDeclarationFile;
        Symbol = ts.objectAllocator.getSymbolConstructor();
        // Attach debugging information if necessary
        ts.Debug.attachFlowNodeDebugInfo(unreachableFlow);
        ts.Debug.attachFlowNodeDebugInfo(reportedUnreachableFlow);
        if (!file.locals) {
            bind(file);
            file.symbolCount = symbolCount;
            file.classifiableNames = classifiableNames;
            delayedBindJSDocTypedefTag();
        }
        file = undefined!;
        options = undefined!;
        languageVersion = undefined!;
        parent = undefined!;
        container = undefined!;
        thisParentContainer = undefined!;
        blockScopeContainer = undefined!;
        lastContainer = undefined!;
        delayedTypeAliases = undefined!;
        seenThisKeyword = false;
        currentFlow = undefined!;
        currentBreakTarget = undefined;
        currentContinueTarget = undefined;
        currentReturnTarget = undefined;
        currentTrueTarget = undefined;
        currentFalseTarget = undefined;
        currentExceptionTarget = undefined;
        activeLabelList = undefined;
        hasExplicitReturn = false;
        emitFlags = ts.NodeFlags.None;
        subtreeTransformFlags = ts.TransformFlags.None;
    }
    return bindSourceFile;
    function bindInStrictMode(file: ts.SourceFile, opts: ts.CompilerOptions): boolean {
        if (ts.getStrictOptionValue(opts, "alwaysStrict") && !file.isDeclarationFile) {
            // bind in strict mode source files with alwaysStrict option
            return true;
        }
        else {
            return !!file.externalModuleIndicator;
        }
    }
    function createSymbol(flags: ts.SymbolFlags, name: ts.__String): ts.Symbol {
        symbolCount++;
        return new Symbol(flags, name);
    }
    function addDeclarationToSymbol(symbol: ts.Symbol, node: ts.Declaration, symbolFlags: ts.SymbolFlags) {
        symbol.flags |= symbolFlags;
        node.symbol = symbol;
        symbol.declarations = ts.appendIfUnique(symbol.declarations, node);
        if (symbolFlags & (ts.SymbolFlags.Class | ts.SymbolFlags.Enum | ts.SymbolFlags.Module | ts.SymbolFlags.Variable) && !symbol.exports) {
            symbol.exports = ts.createSymbolTable();
        }
        if (symbolFlags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface | ts.SymbolFlags.TypeLiteral | ts.SymbolFlags.ObjectLiteral) && !symbol.members) {
            symbol.members = ts.createSymbolTable();
        }
        // On merge of const enum module with class or function, reset const enum only flag (namespaces will already recalculate)
        if (symbol.constEnumOnlyModule && (symbol.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Class | ts.SymbolFlags.RegularEnum))) {
            symbol.constEnumOnlyModule = false;
        }
        if (symbolFlags & ts.SymbolFlags.Value) {
            setValueDeclaration(symbol, node);
        }
    }
    function setValueDeclaration(symbol: ts.Symbol, node: ts.Declaration): void {
        const { valueDeclaration } = symbol;
        if (!valueDeclaration ||
            (ts.isAssignmentDeclaration(valueDeclaration) && !ts.isAssignmentDeclaration(node)) ||
            (valueDeclaration.kind !== node.kind && ts.isEffectiveModuleDeclaration(valueDeclaration))) {
            // other kinds of value declarations take precedence over modules and assignment declarations
            symbol.valueDeclaration = node;
        }
    }
    // Should not be called on a declaration with a computed property name,
    // unless it is a well known Symbol.
    function getDeclarationName(node: ts.Declaration): ts.__String | undefined {
        if (node.kind === ts.SyntaxKind.ExportAssignment) {
            return (<ts.ExportAssignment>node).isExportEquals ? ts.InternalSymbolName.ExportEquals : ts.InternalSymbolName.Default;
        }
        const name = ts.getNameOfDeclaration(node);
        if (name) {
            if (ts.isAmbientModule(node)) {
                const moduleName = ts.getTextOfIdentifierOrLiteral((name as ts.Identifier | ts.StringLiteral));
                return (ts.isGlobalScopeAugmentation((<ts.ModuleDeclaration>node)) ? "__global" : `"${moduleName}"`) as ts.__String;
            }
            if (name.kind === ts.SyntaxKind.ComputedPropertyName) {
                const nameExpression = name.expression;
                // treat computed property names where expression is string/numeric literal as just string/numeric literal
                if (ts.isStringOrNumericLiteralLike(nameExpression)) {
                    return ts.escapeLeadingUnderscores(nameExpression.text);
                }
                if (ts.isSignedNumericLiteral(nameExpression)) {
                    return ts.tokenToString(nameExpression.operator) + nameExpression.operand.text as ts.__String;
                }
                ts.Debug.assert(ts.isWellKnownSymbolSyntactically(nameExpression));
                return ts.getPropertyNameForKnownSymbolName(ts.idText((<ts.PropertyAccessExpression>nameExpression).name));
            }
            if (ts.isWellKnownSymbolSyntactically(name)) {
                return ts.getPropertyNameForKnownSymbolName(ts.idText(name.name));
            }
            return ts.isPropertyNameLiteral(name) ? ts.getEscapedTextOfIdentifierOrLiteral(name) : undefined;
        }
        switch (node.kind) {
            case ts.SyntaxKind.Constructor:
                return ts.InternalSymbolName.Constructor;
            case ts.SyntaxKind.FunctionType:
            case ts.SyntaxKind.CallSignature:
            case ts.SyntaxKind.JSDocSignature:
                return ts.InternalSymbolName.Call;
            case ts.SyntaxKind.ConstructorType:
            case ts.SyntaxKind.ConstructSignature:
                return ts.InternalSymbolName.New;
            case ts.SyntaxKind.IndexSignature:
                return ts.InternalSymbolName.Index;
            case ts.SyntaxKind.ExportDeclaration:
                return ts.InternalSymbolName.ExportStar;
            case ts.SyntaxKind.SourceFile:
                // json file should behave as
                // module.exports = ...
                return ts.InternalSymbolName.ExportEquals;
            case ts.SyntaxKind.BinaryExpression:
                if (ts.getAssignmentDeclarationKind((node as ts.BinaryExpression)) === ts.AssignmentDeclarationKind.ModuleExports) {
                    // module.exports = ...
                    return ts.InternalSymbolName.ExportEquals;
                }
                ts.Debug.fail("Unknown binary declaration kind");
                break;
            case ts.SyntaxKind.JSDocFunctionType:
                return (ts.isJSDocConstructSignature(node) ? ts.InternalSymbolName.New : ts.InternalSymbolName.Call);
            case ts.SyntaxKind.Parameter:
                // Parameters with names are handled at the top of this function.  Parameters
                // without names can only come from JSDocFunctionTypes.
                ts.Debug.assert(node.parent.kind === ts.SyntaxKind.JSDocFunctionType, "Impossible parameter parent kind", () => `parent is: ${(ts as any).SyntaxKind ? (ts as any).SyntaxKind[node.parent.kind] : node.parent.kind}, expected JSDocFunctionType`);
                const functionType = (<ts.JSDocFunctionType>node.parent);
                const index = functionType.parameters.indexOf((node as ts.ParameterDeclaration));
                return "arg" + index as ts.__String;
        }
    }
    function getDisplayName(node: ts.Declaration): string {
        return ts.isNamedDeclaration(node) ? ts.declarationNameToString(node.name) : ts.unescapeLeadingUnderscores(ts.Debug.assertDefined(getDeclarationName(node)));
    }
    /**
     * Declares a Symbol for the node and adds it to symbols. Reports errors for conflicting identifier names.
     * @param symbolTable - The symbol table which node will be added to.
     * @param parent - node's parent declaration.
     * @param node - The declaration to be added to the symbol table
     * @param includes - The SymbolFlags that node has in addition to its declaration type (eg: export, ambient, etc.)
     * @param excludes - The flags which node cannot be declared alongside in a symbol table. Used to report forbidden declarations.
     */
    function declareSymbol(symbolTable: ts.SymbolTable, parent: ts.Symbol | undefined, node: ts.Declaration, includes: ts.SymbolFlags, excludes: ts.SymbolFlags, isReplaceableByMethod?: boolean): ts.Symbol {
        ts.Debug.assert(!ts.hasDynamicName(node));
        const isDefaultExport = ts.hasModifier(node, ts.ModifierFlags.Default);
        // The exported symbol for an export default function/class node is always named "default"
        const name = isDefaultExport && parent ? ts.InternalSymbolName.Default : getDeclarationName(node);
        let symbol: ts.Symbol | undefined;
        if (name === undefined) {
            symbol = createSymbol(ts.SymbolFlags.None, ts.InternalSymbolName.Missing);
        }
        else {
            // Check and see if the symbol table already has a symbol with this name.  If not,
            // create a new symbol with this name and add it to the table.  Note that we don't
            // give the new symbol any flags *yet*.  This ensures that it will not conflict
            // with the 'excludes' flags we pass in.
            //
            // If we do get an existing symbol, see if it conflicts with the new symbol we're
            // creating.  For example, a 'var' symbol and a 'class' symbol will conflict within
            // the same symbol table.  If we have a conflict, report the issue on each
            // declaration we have for this symbol, and then create a new symbol for this
            // declaration.
            //
            // Note that when properties declared in Javascript constructors
            // (marked by isReplaceableByMethod) conflict with another symbol, the property loses.
            // Always. This allows the common Javascript pattern of overwriting a prototype method
            // with an bound instance method of the same type: `this.method = this.method.bind(this)`
            //
            // If we created a new symbol, either because we didn't have a symbol with this name
            // in the symbol table, or we conflicted with an existing symbol, then just add this
            // node as the sole declaration of the new symbol.
            //
            // Otherwise, we'll be merging into a compatible existing symbol (for example when
            // you have multiple 'vars' with the same name in the same container).  In this case
            // just add this node into the declarations list of the symbol.
            symbol = symbolTable.get(name);
            if (includes & ts.SymbolFlags.Classifiable) {
                classifiableNames.set(name, true);
            }
            if (!symbol) {
                symbolTable.set(name, symbol = createSymbol(ts.SymbolFlags.None, name));
                if (isReplaceableByMethod)
                    symbol.isReplaceableByMethod = true;
            }
            else if (isReplaceableByMethod && !symbol.isReplaceableByMethod) {
                // A symbol already exists, so don't add this as a declaration.
                return symbol;
            }
            else if (symbol.flags & excludes) {
                if (symbol.isReplaceableByMethod) {
                    // Javascript constructor-declared symbols can be discarded in favor of
                    // prototype symbols like methods.
                    symbolTable.set(name, symbol = createSymbol(ts.SymbolFlags.None, name));
                }
                else if (!(includes & ts.SymbolFlags.Variable && symbol.flags & ts.SymbolFlags.Assignment)) {
                    // Assignment declarations are allowed to merge with variables, no matter what other flags they have.
                    if (ts.isNamedDeclaration(node)) {
                        node.name.parent = node;
                    }
                    // Report errors every position with duplicate declaration
                    // Report errors on previous encountered declarations
                    let message = symbol.flags & ts.SymbolFlags.BlockScopedVariable
                        ? ts.Diagnostics.Cannot_redeclare_block_scoped_variable_0
                        : ts.Diagnostics.Duplicate_identifier_0;
                    let messageNeedsName = true;
                    if (symbol.flags & ts.SymbolFlags.Enum || includes & ts.SymbolFlags.Enum) {
                        message = ts.Diagnostics.Enum_declarations_can_only_merge_with_namespace_or_other_enum_declarations;
                        messageNeedsName = false;
                    }
                    let multipleDefaultExports = false;
                    if (ts.length(symbol.declarations)) {
                        // If the current node is a default export of some sort, then check if
                        // there are any other default exports that we need to error on.
                        // We'll know whether we have other default exports depending on if `symbol` already has a declaration list set.
                        if (isDefaultExport) {
                            message = ts.Diagnostics.A_module_cannot_have_multiple_default_exports;
                            messageNeedsName = false;
                            multipleDefaultExports = true;
                        }
                        else {
                            // This is to properly report an error in the case "export default { }" is after export default of class declaration or function declaration.
                            // Error on multiple export default in the following case:
                            // 1. multiple export default of class declaration or function declaration by checking NodeFlags.Default
                            // 2. multiple export default of export assignment. This one doesn't have NodeFlags.Default on (as export default doesn't considered as modifiers)
                            if (symbol.declarations && symbol.declarations.length &&
                                (node.kind === ts.SyntaxKind.ExportAssignment && !(<ts.ExportAssignment>node).isExportEquals)) {
                                message = ts.Diagnostics.A_module_cannot_have_multiple_default_exports;
                                messageNeedsName = false;
                                multipleDefaultExports = true;
                            }
                        }
                    }
                    const declarationName = ts.getNameOfDeclaration(node) || node;
                    const relatedInformation: ts.DiagnosticRelatedInformation[] = [];
                    ts.forEach(symbol.declarations, (declaration, index) => {
                        const decl = ts.getNameOfDeclaration(declaration) || declaration;
                        const diag = createDiagnosticForNode(decl, message, messageNeedsName ? getDisplayName(declaration) : undefined);
                        file.bindDiagnostics.push(multipleDefaultExports ? ts.addRelatedInfo(diag, createDiagnosticForNode(declarationName, index === 0 ? ts.Diagnostics.Another_export_default_is_here : ts.Diagnostics.and_here)) : diag);
                        if (multipleDefaultExports) {
                            relatedInformation.push(createDiagnosticForNode(decl, ts.Diagnostics.The_first_export_default_is_here));
                        }
                    });
                    const diag = createDiagnosticForNode(declarationName, message, messageNeedsName ? getDisplayName(node) : undefined);
                    file.bindDiagnostics.push(multipleDefaultExports ? ts.addRelatedInfo(diag, ...relatedInformation) : diag);
                    symbol = createSymbol(ts.SymbolFlags.None, name);
                }
            }
        }
        addDeclarationToSymbol(symbol, node, includes);
        if (symbol.parent) {
            ts.Debug.assert(symbol.parent === parent, "Existing symbol parent should match new one");
        }
        else {
            symbol.parent = parent;
        }
        return symbol;
    }
    function declareModuleMember(node: ts.Declaration, symbolFlags: ts.SymbolFlags, symbolExcludes: ts.SymbolFlags): ts.Symbol {
        const hasExportModifier = ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export;
        if (symbolFlags & ts.SymbolFlags.Alias) {
            if (node.kind === ts.SyntaxKind.ExportSpecifier || (node.kind === ts.SyntaxKind.ImportEqualsDeclaration && hasExportModifier)) {
                return declareSymbol(container.symbol.exports!, container.symbol, node, symbolFlags, symbolExcludes);
            }
            else {
                return declareSymbol(container.locals!, /*parent*/ undefined, node, symbolFlags, symbolExcludes);
            }
        }
        else {
            // Exported module members are given 2 symbols: A local symbol that is classified with an ExportValue flag,
            // and an associated export symbol with all the correct flags set on it. There are 2 main reasons:
            //
            //   1. We treat locals and exports of the same name as mutually exclusive within a container.
            //      That means the binder will issue a Duplicate Identifier error if you mix locals and exports
            //      with the same name in the same container.
            //      TODO: Make this a more specific error and decouple it from the exclusion logic.
            //   2. When we checkIdentifier in the checker, we set its resolved symbol to the local symbol,
            //      but return the export symbol (by calling getExportSymbolOfValueSymbolIfExported). That way
            //      when the emitter comes back to it, it knows not to qualify the name if it was found in a containing scope.
            // NOTE: Nested ambient modules always should go to to 'locals' table to prevent their automatic merge
            //       during global merging in the checker. Why? The only case when ambient module is permitted inside another module is module augmentation
            //       and this case is specially handled. Module augmentations should only be merged with original module definition
            //       and should never be merged directly with other augmentation, and the latter case would be possible if automatic merge is allowed.
            if (ts.isJSDocTypeAlias(node))
                ts.Debug.assert(ts.isInJSFile(node)); // We shouldn't add symbols for JSDoc nodes if not in a JS file.
            if ((!ts.isAmbientModule(node) && (hasExportModifier || container.flags & ts.NodeFlags.ExportContext)) || ts.isJSDocTypeAlias(node)) {
                if (!container.locals || (ts.hasModifier(node, ts.ModifierFlags.Default) && !getDeclarationName(node))) {
                    return declareSymbol(container.symbol.exports!, container.symbol, node, symbolFlags, symbolExcludes); // No local symbol for an unnamed default!
                }
                const exportKind = symbolFlags & ts.SymbolFlags.Value ? ts.SymbolFlags.ExportValue : 0;
                const local = declareSymbol(container.locals, /*parent*/ undefined, node, exportKind, symbolExcludes);
                local.exportSymbol = declareSymbol(container.symbol.exports!, container.symbol, node, symbolFlags, symbolExcludes);
                node.localSymbol = local;
                return local;
            }
            else {
                return declareSymbol(container.locals!, /*parent*/ undefined, node, symbolFlags, symbolExcludes);
            }
        }
    }
    // All container nodes are kept on a linked list in declaration order. This list is used by
    // the getLocalNameOfContainer function in the type checker to validate that the local name
    // used for a container is unique.
    function bindContainer(node: ts.Node, containerFlags: ContainerFlags) {
        // Before we recurse into a node's children, we first save the existing parent, container
        // and block-container.  Then after we pop out of processing the children, we restore
        // these saved values.
        const saveContainer = container;
        const saveThisParentContainer = thisParentContainer;
        const savedBlockScopeContainer = blockScopeContainer;
        // Depending on what kind of node this is, we may have to adjust the current container
        // and block-container.   If the current node is a container, then it is automatically
        // considered the current block-container as well.  Also, for containers that we know
        // may contain locals, we eagerly initialize the .locals field. We do this because
        // it's highly likely that the .locals will be needed to place some child in (for example,
        // a parameter, or variable declaration).
        //
        // However, we do not proactively create the .locals for block-containers because it's
        // totally normal and common for block-containers to never actually have a block-scoped
        // variable in them.  We don't want to end up allocating an object for every 'block' we
        // run into when most of them won't be necessary.
        //
        // Finally, if this is a block-container, then we clear out any existing .locals object
        // it may contain within it.  This happens in incremental scenarios.  Because we can be
        // reusing a node from a previous compilation, that node may have had 'locals' created
        // for it.  We must clear this so we don't accidentally move any stale data forward from
        // a previous compilation.
        if (containerFlags & ContainerFlags.IsContainer) {
            if (node.kind !== ts.SyntaxKind.ArrowFunction) {
                thisParentContainer = container;
            }
            container = blockScopeContainer = node;
            if (containerFlags & ContainerFlags.HasLocals) {
                container.locals = ts.createSymbolTable();
            }
            addToContainerChain(container);
        }
        else if (containerFlags & ContainerFlags.IsBlockScopedContainer) {
            blockScopeContainer = node;
            blockScopeContainer.locals = undefined;
        }
        if (containerFlags & ContainerFlags.IsControlFlowContainer) {
            const saveCurrentFlow = currentFlow;
            const saveBreakTarget = currentBreakTarget;
            const saveContinueTarget = currentContinueTarget;
            const saveReturnTarget = currentReturnTarget;
            const saveExceptionTarget = currentExceptionTarget;
            const saveActiveLabelList = activeLabelList;
            const saveHasExplicitReturn = hasExplicitReturn;
            const isIIFE = containerFlags & ContainerFlags.IsFunctionExpression && !ts.hasModifier(node, ts.ModifierFlags.Async) &&
                !(<ts.FunctionLikeDeclaration>node).asteriskToken && !!ts.getImmediatelyInvokedFunctionExpression(node);
            // A non-async, non-generator IIFE is considered part of the containing control flow. Return statements behave
            // similarly to break statements that exit to a label just past the statement body.
            if (!isIIFE) {
                currentFlow = initFlowNode({ flags: ts.FlowFlags.Start });
                if (containerFlags & (ContainerFlags.IsFunctionExpression | ContainerFlags.IsObjectLiteralOrClassExpressionMethod)) {
                    currentFlow.node = (<ts.FunctionExpression | ts.ArrowFunction | ts.MethodDeclaration>node);
                }
            }
            // We create a return control flow graph for IIFEs and constructors. For constructors
            // we use the return control flow graph in strict property initialization checks.
            currentReturnTarget = isIIFE || node.kind === ts.SyntaxKind.Constructor ? createBranchLabel() : undefined;
            currentExceptionTarget = undefined;
            currentBreakTarget = undefined;
            currentContinueTarget = undefined;
            activeLabelList = undefined;
            hasExplicitReturn = false;
            bindChildren(node);
            // Reset all reachability check related flags on node (for incremental scenarios)
            node.flags &= ~ts.NodeFlags.ReachabilityAndEmitFlags;
            if (!(currentFlow.flags & ts.FlowFlags.Unreachable) && containerFlags & ContainerFlags.IsFunctionLike && ts.nodeIsPresent((<ts.FunctionLikeDeclaration>node).body)) {
                node.flags |= ts.NodeFlags.HasImplicitReturn;
                if (hasExplicitReturn)
                    node.flags |= ts.NodeFlags.HasExplicitReturn;
                (<ts.FunctionLikeDeclaration>node).endFlowNode = currentFlow;
            }
            if (node.kind === ts.SyntaxKind.SourceFile) {
                node.flags |= emitFlags;
            }
            if (currentReturnTarget) {
                addAntecedent(currentReturnTarget, currentFlow);
                currentFlow = finishFlowLabel(currentReturnTarget);
                if (node.kind === ts.SyntaxKind.Constructor) {
                    (<ts.ConstructorDeclaration>node).returnFlowNode = currentFlow;
                }
            }
            if (!isIIFE) {
                currentFlow = saveCurrentFlow;
            }
            currentBreakTarget = saveBreakTarget;
            currentContinueTarget = saveContinueTarget;
            currentReturnTarget = saveReturnTarget;
            currentExceptionTarget = saveExceptionTarget;
            activeLabelList = saveActiveLabelList;
            hasExplicitReturn = saveHasExplicitReturn;
        }
        else if (containerFlags & ContainerFlags.IsInterface) {
            seenThisKeyword = false;
            bindChildren(node);
            node.flags = seenThisKeyword ? node.flags | ts.NodeFlags.ContainsThis : node.flags & ~ts.NodeFlags.ContainsThis;
        }
        else {
            bindChildren(node);
        }
        container = saveContainer;
        thisParentContainer = saveThisParentContainer;
        blockScopeContainer = savedBlockScopeContainer;
    }
    function bindChildren(node: ts.Node): void {
        if (skipTransformFlagAggregation) {
            bindChildrenWorker(node);
        }
        else if (node.transformFlags & ts.TransformFlags.HasComputedFlags) {
            skipTransformFlagAggregation = true;
            bindChildrenWorker(node);
            skipTransformFlagAggregation = false;
            subtreeTransformFlags |= node.transformFlags & ~getTransformFlagsSubtreeExclusions(node.kind);
        }
        else {
            const savedSubtreeTransformFlags = subtreeTransformFlags;
            subtreeTransformFlags = 0;
            bindChildrenWorker(node);
            subtreeTransformFlags = savedSubtreeTransformFlags | computeTransformFlagsForNode(node, subtreeTransformFlags);
        }
    }
    function bindEachFunctionsFirst(nodes: ts.NodeArray<ts.Node> | undefined): void {
        bindEach(nodes, n => n.kind === ts.SyntaxKind.FunctionDeclaration ? bind(n) : undefined);
        bindEach(nodes, n => n.kind !== ts.SyntaxKind.FunctionDeclaration ? bind(n) : undefined);
    }
    function bindEach(nodes: ts.NodeArray<ts.Node> | undefined, bindFunction: (node: ts.Node) => void = bind): void {
        if (nodes === undefined) {
            return;
        }
        if (skipTransformFlagAggregation) {
            ts.forEach(nodes, bindFunction);
        }
        else {
            const savedSubtreeTransformFlags = subtreeTransformFlags;
            subtreeTransformFlags = ts.TransformFlags.None;
            let nodeArrayFlags = ts.TransformFlags.None;
            for (const node of nodes) {
                bindFunction(node);
                nodeArrayFlags |= node.transformFlags & ~ts.TransformFlags.HasComputedFlags;
            }
            nodes.transformFlags = nodeArrayFlags | ts.TransformFlags.HasComputedFlags;
            subtreeTransformFlags |= savedSubtreeTransformFlags;
        }
    }
    function bindEachChild(node: ts.Node) {
        ts.forEachChild(node, bind, bindEach);
    }
    function bindChildrenWorker(node: ts.Node): void {
        if (checkUnreachable(node)) {
            bindEachChild(node);
            bindJSDoc(node);
            return;
        }
        if (node.kind >= ts.SyntaxKind.FirstStatement && node.kind <= ts.SyntaxKind.LastStatement && !options.allowUnreachableCode) {
            node.flowNode = currentFlow;
        }
        switch (node.kind) {
            case ts.SyntaxKind.WhileStatement:
                bindWhileStatement((<ts.WhileStatement>node));
                break;
            case ts.SyntaxKind.DoStatement:
                bindDoStatement((<ts.DoStatement>node));
                break;
            case ts.SyntaxKind.ForStatement:
                bindForStatement((<ts.ForStatement>node));
                break;
            case ts.SyntaxKind.ForInStatement:
            case ts.SyntaxKind.ForOfStatement:
                bindForInOrForOfStatement((<ts.ForInOrOfStatement>node));
                break;
            case ts.SyntaxKind.IfStatement:
                bindIfStatement((<ts.IfStatement>node));
                break;
            case ts.SyntaxKind.ReturnStatement:
            case ts.SyntaxKind.ThrowStatement:
                bindReturnOrThrow((<ts.ReturnStatement | ts.ThrowStatement>node));
                break;
            case ts.SyntaxKind.BreakStatement:
            case ts.SyntaxKind.ContinueStatement:
                bindBreakOrContinueStatement((<ts.BreakOrContinueStatement>node));
                break;
            case ts.SyntaxKind.TryStatement:
                bindTryStatement((<ts.TryStatement>node));
                break;
            case ts.SyntaxKind.SwitchStatement:
                bindSwitchStatement((<ts.SwitchStatement>node));
                break;
            case ts.SyntaxKind.CaseBlock:
                bindCaseBlock((<ts.CaseBlock>node));
                break;
            case ts.SyntaxKind.CaseClause:
                bindCaseClause((<ts.CaseClause>node));
                break;
            case ts.SyntaxKind.ExpressionStatement:
                bindExpressionStatement((<ts.ExpressionStatement>node));
                break;
            case ts.SyntaxKind.LabeledStatement:
                bindLabeledStatement((<ts.LabeledStatement>node));
                break;
            case ts.SyntaxKind.PrefixUnaryExpression:
                bindPrefixUnaryExpressionFlow((<ts.PrefixUnaryExpression>node));
                break;
            case ts.SyntaxKind.PostfixUnaryExpression:
                bindPostfixUnaryExpressionFlow((<ts.PostfixUnaryExpression>node));
                break;
            case ts.SyntaxKind.BinaryExpression:
                bindBinaryExpressionFlow((<ts.BinaryExpression>node));
                break;
            case ts.SyntaxKind.DeleteExpression:
                bindDeleteExpressionFlow((<ts.DeleteExpression>node));
                break;
            case ts.SyntaxKind.ConditionalExpression:
                bindConditionalExpressionFlow((<ts.ConditionalExpression>node));
                break;
            case ts.SyntaxKind.VariableDeclaration:
                bindVariableDeclarationFlow((<ts.VariableDeclaration>node));
                break;
            case ts.SyntaxKind.PropertyAccessExpression:
            case ts.SyntaxKind.ElementAccessExpression:
                bindAccessExpressionFlow((<ts.AccessExpression>node));
                break;
            case ts.SyntaxKind.CallExpression:
                bindCallExpressionFlow((<ts.CallExpression>node));
                break;
            case ts.SyntaxKind.JSDocTypedefTag:
            case ts.SyntaxKind.JSDocCallbackTag:
            case ts.SyntaxKind.JSDocEnumTag:
                bindJSDocTypeAlias((node as ts.JSDocTypedefTag | ts.JSDocCallbackTag | ts.JSDocEnumTag));
                break;
            // In source files and blocks, bind functions first to match hoisting that occurs at runtime
            case ts.SyntaxKind.SourceFile: {
                bindEachFunctionsFirst((node as ts.SourceFile).statements);
                bind((node as ts.SourceFile).endOfFileToken);
                break;
            }
            case ts.SyntaxKind.Block:
            case ts.SyntaxKind.ModuleBlock:
                bindEachFunctionsFirst((node as ts.Block).statements);
                break;
            default:
                bindEachChild(node);
                break;
        }
        bindJSDoc(node);
    }
    function isNarrowingExpression(expr: ts.Expression): boolean {
        switch (expr.kind) {
            case ts.SyntaxKind.Identifier:
            case ts.SyntaxKind.ThisKeyword:
            case ts.SyntaxKind.PropertyAccessExpression:
            case ts.SyntaxKind.ElementAccessExpression:
                return isNarrowableReference(expr);
            case ts.SyntaxKind.CallExpression:
                return hasNarrowableArgument((<ts.CallExpression>expr));
            case ts.SyntaxKind.ParenthesizedExpression:
                return isNarrowingExpression((<ts.ParenthesizedExpression>expr).expression);
            case ts.SyntaxKind.BinaryExpression:
                return isNarrowingBinaryExpression((<ts.BinaryExpression>expr));
            case ts.SyntaxKind.PrefixUnaryExpression:
                return (<ts.PrefixUnaryExpression>expr).operator === ts.SyntaxKind.ExclamationToken && isNarrowingExpression((<ts.PrefixUnaryExpression>expr).operand);
            case ts.SyntaxKind.TypeOfExpression:
                return isNarrowingExpression((<ts.TypeOfExpression>expr).expression);
        }
        return false;
    }
    function isNarrowableReference(expr: ts.Expression): boolean {
        return expr.kind === ts.SyntaxKind.Identifier || expr.kind === ts.SyntaxKind.ThisKeyword || expr.kind === ts.SyntaxKind.SuperKeyword ||
            (ts.isPropertyAccessExpression(expr) || ts.isNonNullExpression(expr) || ts.isParenthesizedExpression(expr)) && isNarrowableReference(expr.expression) ||
            ts.isElementAccessExpression(expr) && ts.isStringOrNumericLiteralLike(expr.argumentExpression) && isNarrowableReference(expr.expression) ||
            ts.isOptionalChain(expr);
    }
    function hasNarrowableArgument(expr: ts.CallExpression) {
        if (expr.arguments) {
            for (const argument of expr.arguments) {
                if (isNarrowableReference(argument)) {
                    return true;
                }
            }
        }
        if (expr.expression.kind === ts.SyntaxKind.PropertyAccessExpression &&
            isNarrowableReference((<ts.PropertyAccessExpression>expr.expression).expression)) {
            return true;
        }
        return false;
    }
    function isNarrowingTypeofOperands(expr1: ts.Expression, expr2: ts.Expression) {
        return ts.isTypeOfExpression(expr1) && isNarrowableOperand(expr1.expression) && ts.isStringLiteralLike(expr2);
    }
    function isNarrowableInOperands(left: ts.Expression, right: ts.Expression) {
        return ts.isStringLiteralLike(left) && isNarrowingExpression(right);
    }
    function isNarrowingBinaryExpression(expr: ts.BinaryExpression) {
        switch (expr.operatorToken.kind) {
            case ts.SyntaxKind.EqualsToken:
                return isNarrowableReference(expr.left);
            case ts.SyntaxKind.EqualsEqualsToken:
            case ts.SyntaxKind.ExclamationEqualsToken:
            case ts.SyntaxKind.EqualsEqualsEqualsToken:
            case ts.SyntaxKind.ExclamationEqualsEqualsToken:
                return isNarrowableOperand(expr.left) || isNarrowableOperand(expr.right) ||
                    isNarrowingTypeofOperands(expr.right, expr.left) || isNarrowingTypeofOperands(expr.left, expr.right);
            case ts.SyntaxKind.InstanceOfKeyword:
                return isNarrowableOperand(expr.left);
            case ts.SyntaxKind.InKeyword:
                return isNarrowableInOperands(expr.left, expr.right);
            case ts.SyntaxKind.CommaToken:
                return isNarrowingExpression(expr.right);
        }
        return false;
    }
    function isNarrowableOperand(expr: ts.Expression): boolean {
        switch (expr.kind) {
            case ts.SyntaxKind.ParenthesizedExpression:
                return isNarrowableOperand((<ts.ParenthesizedExpression>expr).expression);
            case ts.SyntaxKind.BinaryExpression:
                switch ((<ts.BinaryExpression>expr).operatorToken.kind) {
                    case ts.SyntaxKind.EqualsToken:
                        return isNarrowableOperand((<ts.BinaryExpression>expr).left);
                    case ts.SyntaxKind.CommaToken:
                        return isNarrowableOperand((<ts.BinaryExpression>expr).right);
                }
        }
        return isNarrowableReference(expr);
    }
    function createBranchLabel(): ts.FlowLabel {
        return initFlowNode({ flags: ts.FlowFlags.BranchLabel, antecedents: undefined });
    }
    function createLoopLabel(): ts.FlowLabel {
        return initFlowNode({ flags: ts.FlowFlags.LoopLabel, antecedents: undefined });
    }
    function setFlowNodeReferenced(flow: ts.FlowNode) {
        // On first reference we set the Referenced flag, thereafter we set the Shared flag
        flow.flags |= flow.flags & ts.FlowFlags.Referenced ? ts.FlowFlags.Shared : ts.FlowFlags.Referenced;
    }
    function addAntecedent(label: ts.FlowLabel, antecedent: ts.FlowNode): void {
        if (!(antecedent.flags & ts.FlowFlags.Unreachable) && !ts.contains(label.antecedents, antecedent)) {
            (label.antecedents || (label.antecedents = [])).push(antecedent);
            setFlowNodeReferenced(antecedent);
        }
    }
    function createFlowCondition(flags: ts.FlowFlags, antecedent: ts.FlowNode, expression: ts.Expression | undefined): ts.FlowNode {
        if (antecedent.flags & ts.FlowFlags.Unreachable) {
            return antecedent;
        }
        if (!expression) {
            return flags & ts.FlowFlags.TrueCondition ? antecedent : unreachableFlow;
        }
        if ((expression.kind === ts.SyntaxKind.TrueKeyword && flags & ts.FlowFlags.FalseCondition ||
            expression.kind === ts.SyntaxKind.FalseKeyword && flags & ts.FlowFlags.TrueCondition) &&
            !ts.isExpressionOfOptionalChainRoot(expression) && !ts.isNullishCoalesce(expression.parent)) {
            return unreachableFlow;
        }
        if (!isNarrowingExpression(expression)) {
            return antecedent;
        }
        setFlowNodeReferenced(antecedent);
        return initFlowNode({ flags, antecedent, node: expression });
    }
    function createFlowSwitchClause(antecedent: ts.FlowNode, switchStatement: ts.SwitchStatement, clauseStart: number, clauseEnd: number): ts.FlowNode {
        setFlowNodeReferenced(antecedent);
        return initFlowNode({ flags: ts.FlowFlags.SwitchClause, antecedent, switchStatement, clauseStart, clauseEnd });
    }
    function createFlowMutation(flags: ts.FlowFlags, antecedent: ts.FlowNode, node: ts.Node): ts.FlowNode {
        setFlowNodeReferenced(antecedent);
        const result = initFlowNode({ flags, antecedent, node });
        if (currentExceptionTarget) {
            addAntecedent(currentExceptionTarget, result);
        }
        return result;
    }
    function createFlowCall(antecedent: ts.FlowNode, node: ts.CallExpression): ts.FlowNode {
        setFlowNodeReferenced(antecedent);
        return initFlowNode({ flags: ts.FlowFlags.Call, antecedent, node });
    }
    function finishFlowLabel(flow: ts.FlowLabel): ts.FlowNode {
        const antecedents = flow.antecedents;
        if (!antecedents) {
            return unreachableFlow;
        }
        if (antecedents.length === 1) {
            return antecedents[0];
        }
        return flow;
    }
    function isStatementCondition(node: ts.Node) {
        const parent = node.parent;
        switch (parent.kind) {
            case ts.SyntaxKind.IfStatement:
            case ts.SyntaxKind.WhileStatement:
            case ts.SyntaxKind.DoStatement:
                return (<ts.IfStatement | ts.WhileStatement | ts.DoStatement>parent).expression === node;
            case ts.SyntaxKind.ForStatement:
            case ts.SyntaxKind.ConditionalExpression:
                return (<ts.ForStatement | ts.ConditionalExpression>parent).condition === node;
        }
        return false;
    }
    function isLogicalExpression(node: ts.Node) {
        while (true) {
            if (node.kind === ts.SyntaxKind.ParenthesizedExpression) {
                node = (<ts.ParenthesizedExpression>node).expression;
            }
            else if (node.kind === ts.SyntaxKind.PrefixUnaryExpression && (<ts.PrefixUnaryExpression>node).operator === ts.SyntaxKind.ExclamationToken) {
                node = (<ts.PrefixUnaryExpression>node).operand;
            }
            else {
                return node.kind === ts.SyntaxKind.BinaryExpression && ((<ts.BinaryExpression>node).operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
                    (<ts.BinaryExpression>node).operatorToken.kind === ts.SyntaxKind.BarBarToken ||
                    (<ts.BinaryExpression>node).operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken);
            }
        }
    }
    function isTopLevelLogicalExpression(node: ts.Node): boolean {
        while (ts.isParenthesizedExpression(node.parent) ||
            ts.isPrefixUnaryExpression(node.parent) && node.parent.operator === ts.SyntaxKind.ExclamationToken) {
            node = node.parent;
        }
        return !isStatementCondition(node) &&
            !isLogicalExpression(node.parent) &&
            !(ts.isOptionalChain(node.parent) && node.parent.expression === node);
    }
    function doWithConditionalBranches<T>(action: (value: T) => void, value: T, trueTarget: ts.FlowLabel, falseTarget: ts.FlowLabel) {
        const savedTrueTarget = currentTrueTarget;
        const savedFalseTarget = currentFalseTarget;
        currentTrueTarget = trueTarget;
        currentFalseTarget = falseTarget;
        action(value);
        currentTrueTarget = savedTrueTarget;
        currentFalseTarget = savedFalseTarget;
    }
    function bindCondition(node: ts.Expression | undefined, trueTarget: ts.FlowLabel, falseTarget: ts.FlowLabel) {
        doWithConditionalBranches(bind, node, trueTarget, falseTarget);
        if (!node || !isLogicalExpression(node) && !(ts.isOptionalChain(node) && ts.isOutermostOptionalChain(node))) {
            addAntecedent(trueTarget, createFlowCondition(ts.FlowFlags.TrueCondition, currentFlow, node));
            addAntecedent(falseTarget, createFlowCondition(ts.FlowFlags.FalseCondition, currentFlow, node));
        }
    }
    function bindIterativeStatement(node: ts.Statement, breakTarget: ts.FlowLabel, continueTarget: ts.FlowLabel): void {
        const saveBreakTarget = currentBreakTarget;
        const saveContinueTarget = currentContinueTarget;
        currentBreakTarget = breakTarget;
        currentContinueTarget = continueTarget;
        bind(node);
        currentBreakTarget = saveBreakTarget;
        currentContinueTarget = saveContinueTarget;
    }
    function setContinueTarget(node: ts.Node, target: ts.FlowLabel) {
        let label = activeLabelList;
        while (label && node.parent.kind === ts.SyntaxKind.LabeledStatement) {
            label.continueTarget = target;
            label = label.next;
            node = node.parent;
        }
        return target;
    }
    function bindWhileStatement(node: ts.WhileStatement): void {
        const preWhileLabel = setContinueTarget(node, createLoopLabel());
        const preBodyLabel = createBranchLabel();
        const postWhileLabel = createBranchLabel();
        addAntecedent(preWhileLabel, currentFlow);
        currentFlow = preWhileLabel;
        bindCondition(node.expression, preBodyLabel, postWhileLabel);
        currentFlow = finishFlowLabel(preBodyLabel);
        bindIterativeStatement(node.statement, postWhileLabel, preWhileLabel);
        addAntecedent(preWhileLabel, currentFlow);
        currentFlow = finishFlowLabel(postWhileLabel);
    }
    function bindDoStatement(node: ts.DoStatement): void {
        const preDoLabel = createLoopLabel();
        const preConditionLabel = setContinueTarget(node, createBranchLabel());
        const postDoLabel = createBranchLabel();
        addAntecedent(preDoLabel, currentFlow);
        currentFlow = preDoLabel;
        bindIterativeStatement(node.statement, postDoLabel, preConditionLabel);
        addAntecedent(preConditionLabel, currentFlow);
        currentFlow = finishFlowLabel(preConditionLabel);
        bindCondition(node.expression, preDoLabel, postDoLabel);
        currentFlow = finishFlowLabel(postDoLabel);
    }
    function bindForStatement(node: ts.ForStatement): void {
        const preLoopLabel = setContinueTarget(node, createLoopLabel());
        const preBodyLabel = createBranchLabel();
        const postLoopLabel = createBranchLabel();
        bind(node.initializer);
        addAntecedent(preLoopLabel, currentFlow);
        currentFlow = preLoopLabel;
        bindCondition(node.condition, preBodyLabel, postLoopLabel);
        currentFlow = finishFlowLabel(preBodyLabel);
        bindIterativeStatement(node.statement, postLoopLabel, preLoopLabel);
        bind(node.incrementor);
        addAntecedent(preLoopLabel, currentFlow);
        currentFlow = finishFlowLabel(postLoopLabel);
    }
    function bindForInOrForOfStatement(node: ts.ForInOrOfStatement): void {
        const preLoopLabel = setContinueTarget(node, createLoopLabel());
        const postLoopLabel = createBranchLabel();
        bind(node.expression);
        addAntecedent(preLoopLabel, currentFlow);
        currentFlow = preLoopLabel;
        if (node.kind === ts.SyntaxKind.ForOfStatement) {
            bind(node.awaitModifier);
        }
        addAntecedent(postLoopLabel, currentFlow);
        bind(node.initializer);
        if (node.initializer.kind !== ts.SyntaxKind.VariableDeclarationList) {
            bindAssignmentTargetFlow(node.initializer);
        }
        bindIterativeStatement(node.statement, postLoopLabel, preLoopLabel);
        addAntecedent(preLoopLabel, currentFlow);
        currentFlow = finishFlowLabel(postLoopLabel);
    }
    function bindIfStatement(node: ts.IfStatement): void {
        const thenLabel = createBranchLabel();
        const elseLabel = createBranchLabel();
        const postIfLabel = createBranchLabel();
        bindCondition(node.expression, thenLabel, elseLabel);
        currentFlow = finishFlowLabel(thenLabel);
        bind(node.thenStatement);
        addAntecedent(postIfLabel, currentFlow);
        currentFlow = finishFlowLabel(elseLabel);
        bind(node.elseStatement);
        addAntecedent(postIfLabel, currentFlow);
        currentFlow = finishFlowLabel(postIfLabel);
    }
    function bindReturnOrThrow(node: ts.ReturnStatement | ts.ThrowStatement): void {
        bind(node.expression);
        if (node.kind === ts.SyntaxKind.ReturnStatement) {
            hasExplicitReturn = true;
            if (currentReturnTarget) {
                addAntecedent(currentReturnTarget, currentFlow);
            }
        }
        currentFlow = unreachableFlow;
    }
    function findActiveLabel(name: ts.__String) {
        for (let label = activeLabelList; label; label = label.next) {
            if (label.name === name) {
                return label;
            }
        }
        return undefined;
    }
    function bindBreakOrContinueFlow(node: ts.BreakOrContinueStatement, breakTarget: ts.FlowLabel | undefined, continueTarget: ts.FlowLabel | undefined) {
        const flowLabel = node.kind === ts.SyntaxKind.BreakStatement ? breakTarget : continueTarget;
        if (flowLabel) {
            addAntecedent(flowLabel, currentFlow);
            currentFlow = unreachableFlow;
        }
    }
    function bindBreakOrContinueStatement(node: ts.BreakOrContinueStatement): void {
        bind(node.label);
        if (node.label) {
            const activeLabel = findActiveLabel(node.label.escapedText);
            if (activeLabel) {
                activeLabel.referenced = true;
                bindBreakOrContinueFlow(node, activeLabel.breakTarget, activeLabel.continueTarget);
            }
        }
        else {
            bindBreakOrContinueFlow(node, currentBreakTarget, currentContinueTarget);
        }
    }
    function bindTryStatement(node: ts.TryStatement): void {
        const preFinallyLabel = createBranchLabel();
        // We conservatively assume that *any* code in the try block can cause an exception, but we only need
        // to track code that causes mutations (because only mutations widen the possible control flow type of
        // a variable). The currentExceptionTarget is the target label for control flows that result from
        // exceptions. We add all mutation flow nodes as antecedents of this label such that we can analyze them
        // as possible antecedents of the start of catch or finally blocks. Furthermore, we add the current
        // control flow to represent exceptions that occur before any mutations.
        const saveExceptionTarget = currentExceptionTarget;
        currentExceptionTarget = createBranchLabel();
        addAntecedent(currentExceptionTarget, currentFlow);
        bind(node.tryBlock);
        addAntecedent(preFinallyLabel, currentFlow);
        const flowAfterTry = currentFlow;
        let flowAfterCatch = unreachableFlow;
        if (node.catchClause) {
            // Start of catch clause is the target of exceptions from try block.
            currentFlow = finishFlowLabel(currentExceptionTarget);
            // The currentExceptionTarget now represents control flows from exceptions in the catch clause.
            // Effectively, in a try-catch-finally, if an exception occurs in the try block, the catch block
            // acts like a second try block.
            currentExceptionTarget = createBranchLabel();
            addAntecedent(currentExceptionTarget, currentFlow);
            bind(node.catchClause);
            addAntecedent(preFinallyLabel, currentFlow);
            flowAfterCatch = currentFlow;
        }
        const exceptionTarget = finishFlowLabel(currentExceptionTarget);
        currentExceptionTarget = saveExceptionTarget;
        if (node.finallyBlock) {
            // Possible ways control can reach the finally block:
            // 1) Normal completion of try block of a try-finally or try-catch-finally
            // 2) Normal completion of catch block (following exception in try block) of a try-catch-finally
            // 3) Exception in try block of a try-finally
            // 4) Exception in catch block of a try-catch-finally
            // When analyzing a control flow graph that starts inside a finally block we want to consider all
            // four possibilities above. However, when analyzing a control flow graph that starts outside (past)
            // the finally block, we only want to consider the first two (if we're past a finally block then it
            // must have completed normally). To make this possible, we inject two extra nodes into the control
            // flow graph: An after-finally with an antecedent of the control flow at the end of the finally
            // block, and a pre-finally with an antecedent that represents all exceptional control flows. The
            // 'lock' property of the pre-finally references the after-finally, and the after-finally has a
            // boolean 'locked' property that we set to true when analyzing a control flow that contained the
            // the after-finally node. When the lock associated with a pre-finally is locked, the antecedent of
            // the pre-finally (i.e. the exceptional control flows) are skipped.
            const preFinallyFlow: ts.PreFinallyFlow = initFlowNode({ flags: ts.FlowFlags.PreFinally, antecedent: exceptionTarget, lock: {} });
            addAntecedent(preFinallyLabel, preFinallyFlow);
            currentFlow = finishFlowLabel(preFinallyLabel);
            bind(node.finallyBlock);
            // If the end of the finally block is reachable, but the end of the try and catch blocks are not,
            // convert the current flow to unreachable. For example, 'try { return 1; } finally { ... }' should
            // result in an unreachable current control flow.
            if (!(currentFlow.flags & ts.FlowFlags.Unreachable)) {
                if ((flowAfterTry.flags & ts.FlowFlags.Unreachable) && (flowAfterCatch.flags & ts.FlowFlags.Unreachable)) {
                    currentFlow = flowAfterTry === reportedUnreachableFlow || flowAfterCatch === reportedUnreachableFlow
                        ? reportedUnreachableFlow
                        : unreachableFlow;
                }
            }
            if (!(currentFlow.flags & ts.FlowFlags.Unreachable)) {
                const afterFinallyFlow: ts.AfterFinallyFlow = initFlowNode({ flags: ts.FlowFlags.AfterFinally, antecedent: currentFlow });
                preFinallyFlow.lock = afterFinallyFlow;
                currentFlow = afterFinallyFlow;
            }
        }
        else {
            currentFlow = finishFlowLabel(preFinallyLabel);
        }
    }
    function bindSwitchStatement(node: ts.SwitchStatement): void {
        const postSwitchLabel = createBranchLabel();
        bind(node.expression);
        const saveBreakTarget = currentBreakTarget;
        const savePreSwitchCaseFlow = preSwitchCaseFlow;
        currentBreakTarget = postSwitchLabel;
        preSwitchCaseFlow = currentFlow;
        bind(node.caseBlock);
        addAntecedent(postSwitchLabel, currentFlow);
        const hasDefault = ts.forEach(node.caseBlock.clauses, c => c.kind === ts.SyntaxKind.DefaultClause);
        // We mark a switch statement as possibly exhaustive if it has no default clause and if all
        // case clauses have unreachable end points (e.g. they all return). Note, we no longer need
        // this property in control flow analysis, it's there only for backwards compatibility.
        node.possiblyExhaustive = !hasDefault && !postSwitchLabel.antecedents;
        if (!hasDefault) {
            addAntecedent(postSwitchLabel, createFlowSwitchClause(preSwitchCaseFlow, node, 0, 0));
        }
        currentBreakTarget = saveBreakTarget;
        preSwitchCaseFlow = savePreSwitchCaseFlow;
        currentFlow = finishFlowLabel(postSwitchLabel);
    }
    function bindCaseBlock(node: ts.CaseBlock): void {
        const savedSubtreeTransformFlags = subtreeTransformFlags;
        subtreeTransformFlags = 0;
        const clauses = node.clauses;
        const isNarrowingSwitch = isNarrowingExpression(node.parent.expression);
        let fallthroughFlow = unreachableFlow;
        for (let i = 0; i < clauses.length; i++) {
            const clauseStart = i;
            while (!clauses[i].statements.length && i + 1 < clauses.length) {
                bind(clauses[i]);
                i++;
            }
            const preCaseLabel = createBranchLabel();
            addAntecedent(preCaseLabel, isNarrowingSwitch ? createFlowSwitchClause(preSwitchCaseFlow!, node.parent, clauseStart, i + 1) : preSwitchCaseFlow!);
            addAntecedent(preCaseLabel, fallthroughFlow);
            currentFlow = finishFlowLabel(preCaseLabel);
            const clause = clauses[i];
            bind(clause);
            fallthroughFlow = currentFlow;
            if (!(currentFlow.flags & ts.FlowFlags.Unreachable) && i !== clauses.length - 1 && options.noFallthroughCasesInSwitch) {
                clause.fallthroughFlowNode = currentFlow;
            }
        }
        clauses.transformFlags = subtreeTransformFlags | ts.TransformFlags.HasComputedFlags;
        subtreeTransformFlags |= savedSubtreeTransformFlags;
    }
    function bindCaseClause(node: ts.CaseClause): void {
        const saveCurrentFlow = currentFlow;
        currentFlow = preSwitchCaseFlow!;
        bind(node.expression);
        currentFlow = saveCurrentFlow;
        bindEach(node.statements);
    }
    function bindExpressionStatement(node: ts.ExpressionStatement): void {
        bind(node.expression);
        // A top level call expression with a dotted function name and at least one argument
        // is potentially an assertion and is therefore included in the control flow.
        if (node.expression.kind === ts.SyntaxKind.CallExpression) {
            const call = (<ts.CallExpression>node.expression);
            if (ts.isDottedName(call.expression)) {
                currentFlow = createFlowCall(currentFlow, call);
            }
        }
    }
    function bindLabeledStatement(node: ts.LabeledStatement): void {
        const postStatementLabel = createBranchLabel();
        activeLabelList = {
            next: activeLabelList,
            name: node.label.escapedText,
            breakTarget: postStatementLabel,
            continueTarget: undefined,
            referenced: false
        };
        bind(node.label);
        bind(node.statement);
        if (!activeLabelList.referenced && !options.allowUnusedLabels) {
            errorOrSuggestionOnNode(ts.unusedLabelIsError(options), node.label, ts.Diagnostics.Unused_label);
        }
        activeLabelList = activeLabelList.next;
        addAntecedent(postStatementLabel, currentFlow);
        currentFlow = finishFlowLabel(postStatementLabel);
    }
    function bindDestructuringTargetFlow(node: ts.Expression) {
        if (node.kind === ts.SyntaxKind.BinaryExpression && (<ts.BinaryExpression>node).operatorToken.kind === ts.SyntaxKind.EqualsToken) {
            bindAssignmentTargetFlow((<ts.BinaryExpression>node).left);
        }
        else {
            bindAssignmentTargetFlow(node);
        }
    }
    function bindAssignmentTargetFlow(node: ts.Expression) {
        if (isNarrowableReference(node)) {
            currentFlow = createFlowMutation(ts.FlowFlags.Assignment, currentFlow, node);
        }
        else if (node.kind === ts.SyntaxKind.ArrayLiteralExpression) {
            for (const e of (<ts.ArrayLiteralExpression>node).elements) {
                if (e.kind === ts.SyntaxKind.SpreadElement) {
                    bindAssignmentTargetFlow((<ts.SpreadElement>e).expression);
                }
                else {
                    bindDestructuringTargetFlow(e);
                }
            }
        }
        else if (node.kind === ts.SyntaxKind.ObjectLiteralExpression) {
            for (const p of (<ts.ObjectLiteralExpression>node).properties) {
                if (p.kind === ts.SyntaxKind.PropertyAssignment) {
                    bindDestructuringTargetFlow(p.initializer);
                }
                else if (p.kind === ts.SyntaxKind.ShorthandPropertyAssignment) {
                    bindAssignmentTargetFlow(p.name);
                }
                else if (p.kind === ts.SyntaxKind.SpreadAssignment) {
                    bindAssignmentTargetFlow(p.expression);
                }
            }
        }
    }
    function bindLogicalExpression(node: ts.BinaryExpression, trueTarget: ts.FlowLabel, falseTarget: ts.FlowLabel) {
        const preRightLabel = createBranchLabel();
        if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
            bindCondition(node.left, preRightLabel, falseTarget);
        }
        else {
            bindCondition(node.left, trueTarget, preRightLabel);
        }
        currentFlow = finishFlowLabel(preRightLabel);
        bind(node.operatorToken);
        bindCondition(node.right, trueTarget, falseTarget);
    }
    function bindPrefixUnaryExpressionFlow(node: ts.PrefixUnaryExpression) {
        if (node.operator === ts.SyntaxKind.ExclamationToken) {
            const saveTrueTarget = currentTrueTarget;
            currentTrueTarget = currentFalseTarget;
            currentFalseTarget = saveTrueTarget;
            bindEachChild(node);
            currentFalseTarget = currentTrueTarget;
            currentTrueTarget = saveTrueTarget;
        }
        else {
            bindEachChild(node);
            if (node.operator === ts.SyntaxKind.PlusPlusToken || node.operator === ts.SyntaxKind.MinusMinusToken) {
                bindAssignmentTargetFlow(node.operand);
            }
        }
    }
    function bindPostfixUnaryExpressionFlow(node: ts.PostfixUnaryExpression) {
        bindEachChild(node);
        if (node.operator === ts.SyntaxKind.PlusPlusToken || node.operator === ts.SyntaxKind.MinusMinusToken) {
            bindAssignmentTargetFlow(node.operand);
        }
    }
    function bindBinaryExpressionFlow(node: ts.BinaryExpression) {
        const operator = node.operatorToken.kind;
        if (operator === ts.SyntaxKind.AmpersandAmpersandToken || operator === ts.SyntaxKind.BarBarToken || operator === ts.SyntaxKind.QuestionQuestionToken) {
            if (isTopLevelLogicalExpression(node)) {
                const postExpressionLabel = createBranchLabel();
                bindLogicalExpression(node, postExpressionLabel, postExpressionLabel);
                currentFlow = finishFlowLabel(postExpressionLabel);
            }
            else {
                bindLogicalExpression(node, currentTrueTarget!, currentFalseTarget!);
            }
        }
        else {
            bindEachChild(node);
            if (ts.isAssignmentOperator(operator) && !ts.isAssignmentTarget(node)) {
                bindAssignmentTargetFlow(node.left);
                if (operator === ts.SyntaxKind.EqualsToken && node.left.kind === ts.SyntaxKind.ElementAccessExpression) {
                    const elementAccess = (<ts.ElementAccessExpression>node.left);
                    if (isNarrowableOperand(elementAccess.expression)) {
                        currentFlow = createFlowMutation(ts.FlowFlags.ArrayMutation, currentFlow, node);
                    }
                }
            }
        }
    }
    function bindDeleteExpressionFlow(node: ts.DeleteExpression) {
        bindEachChild(node);
        if (node.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
            bindAssignmentTargetFlow(node.expression);
        }
    }
    function bindConditionalExpressionFlow(node: ts.ConditionalExpression) {
        const trueLabel = createBranchLabel();
        const falseLabel = createBranchLabel();
        const postExpressionLabel = createBranchLabel();
        bindCondition(node.condition, trueLabel, falseLabel);
        currentFlow = finishFlowLabel(trueLabel);
        bind(node.questionToken);
        bind(node.whenTrue);
        addAntecedent(postExpressionLabel, currentFlow);
        currentFlow = finishFlowLabel(falseLabel);
        bind(node.colonToken);
        bind(node.whenFalse);
        addAntecedent(postExpressionLabel, currentFlow);
        currentFlow = finishFlowLabel(postExpressionLabel);
    }
    function bindInitializedVariableFlow(node: ts.VariableDeclaration | ts.ArrayBindingElement) {
        const name = !ts.isOmittedExpression(node) ? node.name : undefined;
        if (ts.isBindingPattern(name)) {
            for (const child of name.elements) {
                bindInitializedVariableFlow(child);
            }
        }
        else {
            currentFlow = createFlowMutation(ts.FlowFlags.Assignment, currentFlow, node);
        }
    }
    function bindVariableDeclarationFlow(node: ts.VariableDeclaration) {
        bindEachChild(node);
        if (node.initializer || ts.isForInOrOfStatement(node.parent.parent)) {
            bindInitializedVariableFlow(node);
        }
    }
    function bindJSDocTypeAlias(node: ts.JSDocTypedefTag | ts.JSDocCallbackTag | ts.JSDocEnumTag) {
        node.tagName.parent = node;
        if (node.kind !== ts.SyntaxKind.JSDocEnumTag && node.fullName) {
            setParentPointers(node, node.fullName);
        }
    }
    function bindJSDocClassTag(node: ts.JSDocClassTag) {
        bindEachChild(node);
        const host = ts.getHostSignatureFromJSDoc(node);
        if (host && host.kind !== ts.SyntaxKind.MethodDeclaration) {
            addDeclarationToSymbol(host.symbol, host, ts.SymbolFlags.Class);
        }
    }
    function bindOptionalExpression(node: ts.Expression, trueTarget: ts.FlowLabel, falseTarget: ts.FlowLabel) {
        doWithConditionalBranches(bind, node, trueTarget, falseTarget);
        if (!ts.isOptionalChain(node) || ts.isOutermostOptionalChain(node)) {
            addAntecedent(trueTarget, createFlowCondition(ts.FlowFlags.TrueCondition, currentFlow, node));
            addAntecedent(falseTarget, createFlowCondition(ts.FlowFlags.FalseCondition, currentFlow, node));
        }
    }
    function bindOptionalChainRest(node: ts.OptionalChain) {
        bind(node.questionDotToken);
        switch (node.kind) {
            case ts.SyntaxKind.PropertyAccessExpression:
                bind(node.name);
                break;
            case ts.SyntaxKind.ElementAccessExpression:
                bind(node.argumentExpression);
                break;
            case ts.SyntaxKind.CallExpression:
                bindEach(node.typeArguments);
                bindEach(node.arguments);
                break;
        }
    }
    function bindOptionalChain(node: ts.OptionalChain, trueTarget: ts.FlowLabel, falseTarget: ts.FlowLabel) {
        // For an optional chain, we emulate the behavior of a logical expression:
        //
        // a?.b         -> a && a.b
        // a?.b.c       -> a && a.b.c
        // a?.b?.c      -> a && a.b && a.b.c
        // a?.[x = 1]   -> a && a[x = 1]
        //
        // To do this we descend through the chain until we reach the root of a chain (the expression with a `?.`)
        // and build it's CFA graph as if it were the first condition (`a && ...`). Then we bind the rest
        // of the node as part of the "true" branch, and continue to do so as we ascend back up to the outermost
        // chain node. We then treat the entire node as the right side of the expression.
        const preChainLabel = node.questionDotToken ? createBranchLabel() : undefined;
        bindOptionalExpression(node.expression, preChainLabel || trueTarget, falseTarget);
        if (preChainLabel) {
            currentFlow = finishFlowLabel(preChainLabel);
        }
        doWithConditionalBranches(bindOptionalChainRest, node, trueTarget, falseTarget);
        if (ts.isOutermostOptionalChain(node)) {
            addAntecedent(trueTarget, createFlowCondition(ts.FlowFlags.TrueCondition, currentFlow, node));
            addAntecedent(falseTarget, createFlowCondition(ts.FlowFlags.FalseCondition, currentFlow, node));
        }
    }
    function bindOptionalChainFlow(node: ts.OptionalChain) {
        if (isTopLevelLogicalExpression(node)) {
            const postExpressionLabel = createBranchLabel();
            bindOptionalChain(node, postExpressionLabel, postExpressionLabel);
            currentFlow = finishFlowLabel(postExpressionLabel);
        }
        else {
            bindOptionalChain(node, currentTrueTarget!, currentFalseTarget!);
        }
    }
    function bindAccessExpressionFlow(node: ts.AccessExpression) {
        if (ts.isOptionalChain(node)) {
            bindOptionalChainFlow(node);
        }
        else {
            bindEachChild(node);
        }
    }
    function bindCallExpressionFlow(node: ts.CallExpression) {
        if (ts.isOptionalChain(node)) {
            bindOptionalChainFlow(node);
        }
        else {
            // If the target of the call expression is a function expression or arrow function we have
            // an immediately invoked function expression (IIFE). Initialize the flowNode property to
            // the current control flow (which includes evaluation of the IIFE arguments).
            const expr = ts.skipParentheses(node.expression);
            if (expr.kind === ts.SyntaxKind.FunctionExpression || expr.kind === ts.SyntaxKind.ArrowFunction) {
                bindEach(node.typeArguments);
                bindEach(node.arguments);
                bind(node.expression);
            }
            else {
                bindEachChild(node);
            }
        }
        if (node.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
            const propertyAccess = (<ts.PropertyAccessExpression>node.expression);
            if (isNarrowableOperand(propertyAccess.expression) && ts.isPushOrUnshiftIdentifier(propertyAccess.name)) {
                currentFlow = createFlowMutation(ts.FlowFlags.ArrayMutation, currentFlow, node);
            }
        }
    }
    function getContainerFlags(node: ts.Node): ContainerFlags {
        switch (node.kind) {
            case ts.SyntaxKind.ClassExpression:
            case ts.SyntaxKind.ClassDeclaration:
            case ts.SyntaxKind.EnumDeclaration:
            case ts.SyntaxKind.ObjectLiteralExpression:
            case ts.SyntaxKind.TypeLiteral:
            case ts.SyntaxKind.JSDocTypeLiteral:
            case ts.SyntaxKind.JsxAttributes:
                return ContainerFlags.IsContainer;
            case ts.SyntaxKind.InterfaceDeclaration:
                return ContainerFlags.IsContainer | ContainerFlags.IsInterface;
            case ts.SyntaxKind.ModuleDeclaration:
            case ts.SyntaxKind.TypeAliasDeclaration:
            case ts.SyntaxKind.MappedType:
                return ContainerFlags.IsContainer | ContainerFlags.HasLocals;
            case ts.SyntaxKind.SourceFile:
                return ContainerFlags.IsContainer | ContainerFlags.IsControlFlowContainer | ContainerFlags.HasLocals;
            case ts.SyntaxKind.MethodDeclaration:
                if (ts.isObjectLiteralOrClassExpressionMethod(node)) {
                    return ContainerFlags.IsContainer | ContainerFlags.IsControlFlowContainer | ContainerFlags.HasLocals | ContainerFlags.IsFunctionLike | ContainerFlags.IsObjectLiteralOrClassExpressionMethod;
                }
            // falls through
            case ts.SyntaxKind.Constructor:
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.MethodSignature:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
            case ts.SyntaxKind.CallSignature:
            case ts.SyntaxKind.JSDocSignature:
            case ts.SyntaxKind.JSDocFunctionType:
            case ts.SyntaxKind.FunctionType:
            case ts.SyntaxKind.ConstructSignature:
            case ts.SyntaxKind.IndexSignature:
            case ts.SyntaxKind.ConstructorType:
                return ContainerFlags.IsContainer | ContainerFlags.IsControlFlowContainer | ContainerFlags.HasLocals | ContainerFlags.IsFunctionLike;
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.ArrowFunction:
                return ContainerFlags.IsContainer | ContainerFlags.IsControlFlowContainer | ContainerFlags.HasLocals | ContainerFlags.IsFunctionLike | ContainerFlags.IsFunctionExpression;
            case ts.SyntaxKind.ModuleBlock:
                return ContainerFlags.IsControlFlowContainer;
            case ts.SyntaxKind.PropertyDeclaration:
                return (<ts.PropertyDeclaration>node).initializer ? ContainerFlags.IsControlFlowContainer : 0;
            case ts.SyntaxKind.CatchClause:
            case ts.SyntaxKind.ForStatement:
            case ts.SyntaxKind.ForInStatement:
            case ts.SyntaxKind.ForOfStatement:
            case ts.SyntaxKind.CaseBlock:
                return ContainerFlags.IsBlockScopedContainer;
            case ts.SyntaxKind.Block:
                // do not treat blocks directly inside a function as a block-scoped-container.
                // Locals that reside in this block should go to the function locals. Otherwise 'x'
                // would not appear to be a redeclaration of a block scoped local in the following
                // example:
                //
                //      function foo() {
                //          var x;
                //          let x;
                //      }
                //
                // If we placed 'var x' into the function locals and 'let x' into the locals of
                // the block, then there would be no collision.
                //
                // By not creating a new block-scoped-container here, we ensure that both 'var x'
                // and 'let x' go into the Function-container's locals, and we do get a collision
                // conflict.
                return ts.isFunctionLike(node.parent) ? ContainerFlags.None : ContainerFlags.IsBlockScopedContainer;
        }
        return ContainerFlags.None;
    }
    function addToContainerChain(next: ts.Node) {
        if (lastContainer) {
            lastContainer.nextContainer = next;
        }
        lastContainer = next;
    }
    function declareSymbolAndAddToSymbolTable(node: ts.Declaration, symbolFlags: ts.SymbolFlags, symbolExcludes: ts.SymbolFlags): ts.Symbol | undefined {
        switch (container.kind) {
            // Modules, source files, and classes need specialized handling for how their
            // members are declared (for example, a member of a class will go into a specific
            // symbol table depending on if it is static or not). We defer to specialized
            // handlers to take care of declaring these child members.
            case ts.SyntaxKind.ModuleDeclaration:
                return declareModuleMember(node, symbolFlags, symbolExcludes);
            case ts.SyntaxKind.SourceFile:
                return declareSourceFileMember(node, symbolFlags, symbolExcludes);
            case ts.SyntaxKind.ClassExpression:
            case ts.SyntaxKind.ClassDeclaration:
                return declareClassMember(node, symbolFlags, symbolExcludes);
            case ts.SyntaxKind.EnumDeclaration:
                return declareSymbol(container.symbol.exports!, container.symbol, node, symbolFlags, symbolExcludes);
            case ts.SyntaxKind.TypeLiteral:
            case ts.SyntaxKind.JSDocTypeLiteral:
            case ts.SyntaxKind.ObjectLiteralExpression:
            case ts.SyntaxKind.InterfaceDeclaration:
            case ts.SyntaxKind.JsxAttributes:
                // Interface/Object-types always have their children added to the 'members' of
                // their container. They are only accessible through an instance of their
                // container, and are never in scope otherwise (even inside the body of the
                // object / type / interface declaring them). An exception is type parameters,
                // which are in scope without qualification (similar to 'locals').
                return declareSymbol(container.symbol.members!, container.symbol, node, symbolFlags, symbolExcludes);
            case ts.SyntaxKind.FunctionType:
            case ts.SyntaxKind.ConstructorType:
            case ts.SyntaxKind.CallSignature:
            case ts.SyntaxKind.ConstructSignature:
            case ts.SyntaxKind.JSDocSignature:
            case ts.SyntaxKind.IndexSignature:
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.MethodSignature:
            case ts.SyntaxKind.Constructor:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.ArrowFunction:
            case ts.SyntaxKind.JSDocFunctionType:
            case ts.SyntaxKind.JSDocTypedefTag:
            case ts.SyntaxKind.JSDocCallbackTag:
            case ts.SyntaxKind.TypeAliasDeclaration:
            case ts.SyntaxKind.MappedType:
                // All the children of these container types are never visible through another
                // symbol (i.e. through another symbol's 'exports' or 'members').  Instead,
                // they're only accessed 'lexically' (i.e. from code that exists underneath
                // their container in the tree). To accomplish this, we simply add their declared
                // symbol to the 'locals' of the container.  These symbols can then be found as
                // the type checker walks up the containers, checking them for matching names.
                return declareSymbol(container.locals!, /*parent*/ undefined, node, symbolFlags, symbolExcludes);
        }
    }
    function declareClassMember(node: ts.Declaration, symbolFlags: ts.SymbolFlags, symbolExcludes: ts.SymbolFlags) {
        return ts.hasModifier(node, ts.ModifierFlags.Static)
            ? declareSymbol(container.symbol.exports!, container.symbol, node, symbolFlags, symbolExcludes)
            : declareSymbol(container.symbol.members!, container.symbol, node, symbolFlags, symbolExcludes);
    }
    function declareSourceFileMember(node: ts.Declaration, symbolFlags: ts.SymbolFlags, symbolExcludes: ts.SymbolFlags) {
        return ts.isExternalModule(file)
            ? declareModuleMember(node, symbolFlags, symbolExcludes)
            : declareSymbol(file.locals!, /*parent*/ undefined, node, symbolFlags, symbolExcludes);
    }
    function hasExportDeclarations(node: ts.ModuleDeclaration | ts.SourceFile): boolean {
        const body = ts.isSourceFile(node) ? node : ts.tryCast(node.body, ts.isModuleBlock);
        return !!body && body.statements.some(s => ts.isExportDeclaration(s) || ts.isExportAssignment(s));
    }
    function setExportContextFlag(node: ts.ModuleDeclaration | ts.SourceFile) {
        // A declaration source file or ambient module declaration that contains no export declarations (but possibly regular
        // declarations with export modifiers) is an export context in which declarations are implicitly exported.
        if (node.flags & ts.NodeFlags.Ambient && !hasExportDeclarations(node)) {
            node.flags |= ts.NodeFlags.ExportContext;
        }
        else {
            node.flags &= ~ts.NodeFlags.ExportContext;
        }
    }
    function bindModuleDeclaration(node: ts.ModuleDeclaration) {
        setExportContextFlag(node);
        if (ts.isAmbientModule(node)) {
            if (ts.hasModifier(node, ts.ModifierFlags.Export)) {
                errorOnFirstToken(node, ts.Diagnostics.export_modifier_cannot_be_applied_to_ambient_modules_and_module_augmentations_since_they_are_always_visible);
            }
            if (ts.isModuleAugmentationExternal(node)) {
                declareModuleSymbol(node);
            }
            else {
                let pattern: ts.Pattern | undefined;
                if (node.name.kind === ts.SyntaxKind.StringLiteral) {
                    const { text } = node.name;
                    if (ts.hasZeroOrOneAsteriskCharacter(text)) {
                        pattern = ts.tryParsePattern(text);
                    }
                    else {
                        errorOnFirstToken(node.name, ts.Diagnostics.Pattern_0_can_have_at_most_one_Asterisk_character, text);
                    }
                }
                const symbol = (declareSymbolAndAddToSymbolTable(node, ts.SymbolFlags.ValueModule, ts.SymbolFlags.ValueModuleExcludes)!);
                file.patternAmbientModules = ts.append<ts.PatternAmbientModule>(file.patternAmbientModules, pattern && { pattern, symbol });
            }
        }
        else {
            const state = declareModuleSymbol(node);
            if (state !== ModuleInstanceState.NonInstantiated) {
                const { symbol } = node;
                // if module was already merged with some function, class or non-const enum, treat it as non-const-enum-only
                symbol.constEnumOnlyModule = (!(symbol.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Class | ts.SymbolFlags.RegularEnum)))
                    // Current must be `const enum` only
                    && state === ModuleInstanceState.ConstEnumOnly
                    // Can't have been set to 'false' in a previous merged symbol. ('undefined' OK)
                    && symbol.constEnumOnlyModule !== false;
            }
        }
    }
    function declareModuleSymbol(node: ts.ModuleDeclaration): ModuleInstanceState {
        const state = getModuleInstanceState(node);
        const instantiated = state !== ModuleInstanceState.NonInstantiated;
        declareSymbolAndAddToSymbolTable(node, instantiated ? ts.SymbolFlags.ValueModule : ts.SymbolFlags.NamespaceModule, instantiated ? ts.SymbolFlags.ValueModuleExcludes : ts.SymbolFlags.NamespaceModuleExcludes);
        return state;
    }
    function bindFunctionOrConstructorType(node: ts.SignatureDeclaration | ts.JSDocSignature): void {
        // For a given function symbol "<...>(...) => T" we want to generate a symbol identical
        // to the one we would get for: { <...>(...): T }
        //
        // We do that by making an anonymous type literal symbol, and then setting the function
        // symbol as its sole member. To the rest of the system, this symbol will be indistinguishable
        // from an actual type literal symbol you would have gotten had you used the long form.
        const symbol = createSymbol(ts.SymbolFlags.Signature, (getDeclarationName(node)!)); // TODO: GH#18217
        addDeclarationToSymbol(symbol, node, ts.SymbolFlags.Signature);
        const typeLiteralSymbol = createSymbol(ts.SymbolFlags.TypeLiteral, ts.InternalSymbolName.Type);
        addDeclarationToSymbol(typeLiteralSymbol, node, ts.SymbolFlags.TypeLiteral);
        typeLiteralSymbol.members = ts.createSymbolTable();
        typeLiteralSymbol.members.set(symbol.escapedName, symbol);
    }
    function bindObjectLiteralExpression(node: ts.ObjectLiteralExpression) {
        const enum ElementKind {
            Property = 1,
            Accessor = 2
        }
        if (inStrictMode) {
            const seen = ts.createUnderscoreEscapedMap<ElementKind>();
            for (const prop of node.properties) {
                if (prop.kind === ts.SyntaxKind.SpreadAssignment || prop.name.kind !== ts.SyntaxKind.Identifier) {
                    continue;
                }
                const identifier = prop.name;
                // ECMA-262 11.1.5 Object Initializer
                // If previous is not undefined then throw a SyntaxError exception if any of the following conditions are true
                // a.This production is contained in strict code and IsDataDescriptor(previous) is true and
                // IsDataDescriptor(propId.descriptor) is true.
                //    b.IsDataDescriptor(previous) is true and IsAccessorDescriptor(propId.descriptor) is true.
                //    c.IsAccessorDescriptor(previous) is true and IsDataDescriptor(propId.descriptor) is true.
                //    d.IsAccessorDescriptor(previous) is true and IsAccessorDescriptor(propId.descriptor) is true
                // and either both previous and propId.descriptor have[[Get]] fields or both previous and propId.descriptor have[[Set]] fields
                const currentKind = prop.kind === ts.SyntaxKind.PropertyAssignment || prop.kind === ts.SyntaxKind.ShorthandPropertyAssignment || prop.kind === ts.SyntaxKind.MethodDeclaration
                    ? ElementKind.Property
                    : ElementKind.Accessor;
                const existingKind = seen.get(identifier.escapedText);
                if (!existingKind) {
                    seen.set(identifier.escapedText, currentKind);
                    continue;
                }
                if (currentKind === ElementKind.Property && existingKind === ElementKind.Property) {
                    const span = ts.getErrorSpanForNode(file, identifier);
                    file.bindDiagnostics.push(ts.createFileDiagnostic(file, span.start, span.length, ts.Diagnostics.An_object_literal_cannot_have_multiple_properties_with_the_same_name_in_strict_mode));
                }
            }
        }
        return bindAnonymousDeclaration(node, ts.SymbolFlags.ObjectLiteral, ts.InternalSymbolName.Object);
    }
    function bindJsxAttributes(node: ts.JsxAttributes) {
        return bindAnonymousDeclaration(node, ts.SymbolFlags.ObjectLiteral, ts.InternalSymbolName.JSXAttributes);
    }
    function bindJsxAttribute(node: ts.JsxAttribute, symbolFlags: ts.SymbolFlags, symbolExcludes: ts.SymbolFlags) {
        return declareSymbolAndAddToSymbolTable(node, symbolFlags, symbolExcludes);
    }
    function bindAnonymousDeclaration(node: ts.Declaration, symbolFlags: ts.SymbolFlags, name: ts.__String) {
        const symbol = createSymbol(symbolFlags, name);
        if (symbolFlags & (ts.SymbolFlags.EnumMember | ts.SymbolFlags.ClassMember)) {
            symbol.parent = container.symbol;
        }
        addDeclarationToSymbol(symbol, node, symbolFlags);
        return symbol;
    }
    function bindBlockScopedDeclaration(node: ts.Declaration, symbolFlags: ts.SymbolFlags, symbolExcludes: ts.SymbolFlags) {
        switch (blockScopeContainer.kind) {
            case ts.SyntaxKind.ModuleDeclaration:
                declareModuleMember(node, symbolFlags, symbolExcludes);
                break;
            case ts.SyntaxKind.SourceFile:
                if (ts.isExternalOrCommonJsModule((<ts.SourceFile>container))) {
                    declareModuleMember(node, symbolFlags, symbolExcludes);
                    break;
                }
            // falls through
            default:
                if (!blockScopeContainer.locals) {
                    blockScopeContainer.locals = ts.createSymbolTable();
                    addToContainerChain(blockScopeContainer);
                }
                declareSymbol(blockScopeContainer.locals, /*parent*/ undefined, node, symbolFlags, symbolExcludes);
        }
    }
    function delayedBindJSDocTypedefTag() {
        if (!delayedTypeAliases) {
            return;
        }
        const saveContainer = container;
        const saveLastContainer = lastContainer;
        const saveBlockScopeContainer = blockScopeContainer;
        const saveParent = parent;
        const saveCurrentFlow = currentFlow;
        for (const typeAlias of delayedTypeAliases) {
            const host = ts.getJSDocHost(typeAlias);
            container = ts.findAncestor(host.parent, n => !!(getContainerFlags(n) & ContainerFlags.IsContainer)) || file;
            blockScopeContainer = ts.getEnclosingBlockScopeContainer(host) || file;
            currentFlow = initFlowNode({ flags: ts.FlowFlags.Start });
            parent = typeAlias;
            bind(typeAlias.typeExpression);
            const declName = ts.getNameOfDeclaration(typeAlias);
            if ((ts.isJSDocEnumTag(typeAlias) || !typeAlias.fullName) && declName && ts.isPropertyAccessEntityNameExpression(declName.parent)) {
                // typedef anchored to an A.B.C assignment - we need to bind into B's namespace under name C
                const isTopLevel = isTopLevelNamespaceAssignment(declName.parent);
                if (isTopLevel) {
                    bindPotentiallyMissingNamespaces(file.symbol, declName.parent, isTopLevel, !!ts.findAncestor(declName, d => ts.isPropertyAccessExpression(d) && d.name.escapedText === "prototype"), /*containerIsClass*/ false);
                    const oldContainer = container;
                    switch (ts.getAssignmentDeclarationPropertyAccessKind(declName.parent)) {
                        case ts.AssignmentDeclarationKind.ExportsProperty:
                        case ts.AssignmentDeclarationKind.ModuleExports:
                            if (!ts.isExternalOrCommonJsModule(file)) {
                                container = undefined!;
                            }
                            else {
                                container = file;
                            }
                            break;
                        case ts.AssignmentDeclarationKind.ThisProperty:
                            container = declName.parent.expression;
                            break;
                        case ts.AssignmentDeclarationKind.PrototypeProperty:
                            container = (declName.parent.expression as ts.PropertyAccessExpression).name;
                            break;
                        case ts.AssignmentDeclarationKind.Property:
                            container = ts.isPropertyAccessExpression(declName.parent.expression) ? declName.parent.expression.name : declName.parent.expression;
                            break;
                        case ts.AssignmentDeclarationKind.None:
                            return ts.Debug.fail("Shouldn't have detected typedef or enum on non-assignment declaration");
                    }
                    if (container) {
                        declareModuleMember(typeAlias, ts.SymbolFlags.TypeAlias, ts.SymbolFlags.TypeAliasExcludes);
                    }
                    container = oldContainer;
                }
            }
            else if (ts.isJSDocEnumTag(typeAlias) || !typeAlias.fullName || typeAlias.fullName.kind === ts.SyntaxKind.Identifier) {
                parent = typeAlias.parent;
                bindBlockScopedDeclaration(typeAlias, ts.SymbolFlags.TypeAlias, ts.SymbolFlags.TypeAliasExcludes);
            }
            else {
                bind(typeAlias.fullName);
            }
        }
        container = saveContainer;
        lastContainer = saveLastContainer;
        blockScopeContainer = saveBlockScopeContainer;
        parent = saveParent;
        currentFlow = saveCurrentFlow;
    }
    // The binder visits every node in the syntax tree so it is a convenient place to perform a single localized
    // check for reserved words used as identifiers in strict mode code.
    function checkStrictModeIdentifier(node: ts.Identifier) {
        if (inStrictMode &&
            (node.originalKeywordKind!) >= ts.SyntaxKind.FirstFutureReservedWord &&
            (node.originalKeywordKind!) <= ts.SyntaxKind.LastFutureReservedWord &&
            !ts.isIdentifierName(node) &&
            !(node.flags & ts.NodeFlags.Ambient) &&
            !(node.flags & ts.NodeFlags.JSDoc)) {
            // Report error only if there are no parse errors in file
            if (!file.parseDiagnostics.length) {
                file.bindDiagnostics.push(createDiagnosticForNode(node, getStrictModeIdentifierMessage(node), ts.declarationNameToString(node)));
            }
        }
    }
    function getStrictModeIdentifierMessage(node: ts.Node) {
        // Provide specialized messages to help the user understand why we think they're in
        // strict mode.
        if (ts.getContainingClass(node)) {
            return ts.Diagnostics.Identifier_expected_0_is_a_reserved_word_in_strict_mode_Class_definitions_are_automatically_in_strict_mode;
        }
        if (file.externalModuleIndicator) {
            return ts.Diagnostics.Identifier_expected_0_is_a_reserved_word_in_strict_mode_Modules_are_automatically_in_strict_mode;
        }
        return ts.Diagnostics.Identifier_expected_0_is_a_reserved_word_in_strict_mode;
    }
    function checkStrictModeBinaryExpression(node: ts.BinaryExpression) {
        if (inStrictMode && ts.isLeftHandSideExpression(node.left) && ts.isAssignmentOperator(node.operatorToken.kind)) {
            // ECMA 262 (Annex C) The identifier eval or arguments may not appear as the LeftHandSideExpression of an
            // Assignment operator(11.13) or of a PostfixExpression(11.3)
            checkStrictModeEvalOrArguments(node, (<ts.Identifier>node.left));
        }
    }
    function checkStrictModeCatchClause(node: ts.CatchClause) {
        // It is a SyntaxError if a TryStatement with a Catch occurs within strict code and the Identifier of the
        // Catch production is eval or arguments
        if (inStrictMode && node.variableDeclaration) {
            checkStrictModeEvalOrArguments(node, node.variableDeclaration.name);
        }
    }
    function checkStrictModeDeleteExpression(node: ts.DeleteExpression) {
        // Grammar checking
        if (inStrictMode && node.expression.kind === ts.SyntaxKind.Identifier) {
            // When a delete operator occurs within strict mode code, a SyntaxError is thrown if its
            // UnaryExpression is a direct reference to a variable, function argument, or function name
            const span = ts.getErrorSpanForNode(file, node.expression);
            file.bindDiagnostics.push(ts.createFileDiagnostic(file, span.start, span.length, ts.Diagnostics.delete_cannot_be_called_on_an_identifier_in_strict_mode));
        }
    }
    function isEvalOrArgumentsIdentifier(node: ts.Node): boolean {
        return ts.isIdentifier(node) && (node.escapedText === "eval" || node.escapedText === "arguments");
    }
    function checkStrictModeEvalOrArguments(contextNode: ts.Node, name: ts.Node | undefined) {
        if (name && name.kind === ts.SyntaxKind.Identifier) {
            const identifier = (<ts.Identifier>name);
            if (isEvalOrArgumentsIdentifier(identifier)) {
                // We check first if the name is inside class declaration or class expression; if so give explicit message
                // otherwise report generic error message.
                const span = ts.getErrorSpanForNode(file, name);
                file.bindDiagnostics.push(ts.createFileDiagnostic(file, span.start, span.length, getStrictModeEvalOrArgumentsMessage(contextNode), ts.idText(identifier)));
            }
        }
    }
    function getStrictModeEvalOrArgumentsMessage(node: ts.Node) {
        // Provide specialized messages to help the user understand why we think they're in
        // strict mode.
        if (ts.getContainingClass(node)) {
            return ts.Diagnostics.Invalid_use_of_0_Class_definitions_are_automatically_in_strict_mode;
        }
        if (file.externalModuleIndicator) {
            return ts.Diagnostics.Invalid_use_of_0_Modules_are_automatically_in_strict_mode;
        }
        return ts.Diagnostics.Invalid_use_of_0_in_strict_mode;
    }
    function checkStrictModeFunctionName(node: ts.FunctionLikeDeclaration) {
        if (inStrictMode) {
            // It is a SyntaxError if the identifier eval or arguments appears within a FormalParameterList of a strict mode FunctionDeclaration or FunctionExpression (13.1))
            checkStrictModeEvalOrArguments(node, node.name);
        }
    }
    function getStrictModeBlockScopeFunctionDeclarationMessage(node: ts.Node) {
        // Provide specialized messages to help the user understand why we think they're in
        // strict mode.
        if (ts.getContainingClass(node)) {
            return ts.Diagnostics.Function_declarations_are_not_allowed_inside_blocks_in_strict_mode_when_targeting_ES3_or_ES5_Class_definitions_are_automatically_in_strict_mode;
        }
        if (file.externalModuleIndicator) {
            return ts.Diagnostics.Function_declarations_are_not_allowed_inside_blocks_in_strict_mode_when_targeting_ES3_or_ES5_Modules_are_automatically_in_strict_mode;
        }
        return ts.Diagnostics.Function_declarations_are_not_allowed_inside_blocks_in_strict_mode_when_targeting_ES3_or_ES5;
    }
    function checkStrictModeFunctionDeclaration(node: ts.FunctionDeclaration) {
        if (languageVersion < ts.ScriptTarget.ES2015) {
            // Report error if function is not top level function declaration
            if (blockScopeContainer.kind !== ts.SyntaxKind.SourceFile &&
                blockScopeContainer.kind !== ts.SyntaxKind.ModuleDeclaration &&
                !ts.isFunctionLike(blockScopeContainer)) {
                // We check first if the name is inside class declaration or class expression; if so give explicit message
                // otherwise report generic error message.
                const errorSpan = ts.getErrorSpanForNode(file, node);
                file.bindDiagnostics.push(ts.createFileDiagnostic(file, errorSpan.start, errorSpan.length, getStrictModeBlockScopeFunctionDeclarationMessage(node)));
            }
        }
    }
    function checkStrictModeNumericLiteral(node: ts.NumericLiteral) {
        if (inStrictMode && node.numericLiteralFlags & ts.TokenFlags.Octal) {
            file.bindDiagnostics.push(createDiagnosticForNode(node, ts.Diagnostics.Octal_literals_are_not_allowed_in_strict_mode));
        }
    }
    function checkStrictModePostfixUnaryExpression(node: ts.PostfixUnaryExpression) {
        // Grammar checking
        // The identifier eval or arguments may not appear as the LeftHandSideExpression of an
        // Assignment operator(11.13) or of a PostfixExpression(11.3) or as the UnaryExpression
        // operated upon by a Prefix Increment(11.4.4) or a Prefix Decrement(11.4.5) operator.
        if (inStrictMode) {
            checkStrictModeEvalOrArguments(node, (<ts.Identifier>node.operand));
        }
    }
    function checkStrictModePrefixUnaryExpression(node: ts.PrefixUnaryExpression) {
        // Grammar checking
        if (inStrictMode) {
            if (node.operator === ts.SyntaxKind.PlusPlusToken || node.operator === ts.SyntaxKind.MinusMinusToken) {
                checkStrictModeEvalOrArguments(node, (<ts.Identifier>node.operand));
            }
        }
    }
    function checkStrictModeWithStatement(node: ts.WithStatement) {
        // Grammar checking for withStatement
        if (inStrictMode) {
            errorOnFirstToken(node, ts.Diagnostics.with_statements_are_not_allowed_in_strict_mode);
        }
    }
    function checkStrictModeLabeledStatement(node: ts.LabeledStatement) {
        // Grammar checking for labeledStatement
        if (inStrictMode && (options.target!) >= ts.ScriptTarget.ES2015) {
            if (ts.isDeclarationStatement(node.statement) || ts.isVariableStatement(node.statement)) {
                errorOnFirstToken(node.label, ts.Diagnostics.A_label_is_not_allowed_here);
            }
        }
    }
    function errorOnFirstToken(node: ts.Node, message: ts.DiagnosticMessage, arg0?: any, arg1?: any, arg2?: any) {
        const span = ts.getSpanOfTokenAtPosition(file, node.pos);
        file.bindDiagnostics.push(ts.createFileDiagnostic(file, span.start, span.length, message, arg0, arg1, arg2));
    }
    function errorOrSuggestionOnNode(isError: boolean, node: ts.Node, message: ts.DiagnosticMessage): void {
        errorOrSuggestionOnRange(isError, node, node, message);
    }
    function errorOrSuggestionOnRange(isError: boolean, startNode: ts.Node, endNode: ts.Node, message: ts.DiagnosticMessage): void {
        addErrorOrSuggestionDiagnostic(isError, { pos: ts.getTokenPosOfNode(startNode, file), end: endNode.end }, message);
    }
    function addErrorOrSuggestionDiagnostic(isError: boolean, range: ts.TextRange, message: ts.DiagnosticMessage): void {
        const diag = ts.createFileDiagnostic(file, range.pos, range.end - range.pos, message);
        if (isError) {
            file.bindDiagnostics.push(diag);
        }
        else {
            file.bindSuggestionDiagnostics = ts.append(file.bindSuggestionDiagnostics, { ...diag, category: ts.DiagnosticCategory.Suggestion });
        }
    }
    function bind(node: ts.Node | undefined): void {
        if (!node) {
            return;
        }
        node.parent = parent;
        const saveInStrictMode = inStrictMode;
        // Even though in the AST the jsdoc @typedef node belongs to the current node,
        // its symbol might be in the same scope with the current node's symbol. Consider:
        //
        //     /** @typedef {string | number} MyType */
        //     function foo();
        //
        // Here the current node is "foo", which is a container, but the scope of "MyType" should
        // not be inside "foo". Therefore we always bind @typedef before bind the parent node,
        // and skip binding this tag later when binding all the other jsdoc tags.
        // First we bind declaration nodes to a symbol if possible. We'll both create a symbol
        // and then potentially add the symbol to an appropriate symbol table. Possible
        // destination symbol tables are:
        //
        //  1) The 'exports' table of the current container's symbol.
        //  2) The 'members' table of the current container's symbol.
        //  3) The 'locals' table of the current container.
        //
        // However, not all symbols will end up in any of these tables. 'Anonymous' symbols
        // (like TypeLiterals for example) will not be put in any table.
        bindWorker(node);
        // Then we recurse into the children of the node to bind them as well. For certain
        // symbols we do specialized work when we recurse. For example, we'll keep track of
        // the current 'container' node when it changes. This helps us know which symbol table
        // a local should go into for example. Since terminal nodes are known not to have
        // children, as an optimization we don't process those.
        if (node.kind > ts.SyntaxKind.LastToken) {
            const saveParent = parent;
            parent = node;
            const containerFlags = getContainerFlags(node);
            if (containerFlags === ContainerFlags.None) {
                bindChildren(node);
            }
            else {
                bindContainer(node, containerFlags);
            }
            parent = saveParent;
        }
        else if (!skipTransformFlagAggregation && (node.transformFlags & ts.TransformFlags.HasComputedFlags) === 0) {
            subtreeTransformFlags |= computeTransformFlagsForNode(node, 0);
            const saveParent = parent;
            if (node.kind === ts.SyntaxKind.EndOfFileToken)
                parent = node;
            bindJSDoc(node);
            parent = saveParent;
        }
        inStrictMode = saveInStrictMode;
    }
    function bindJSDoc(node: ts.Node) {
        if (ts.hasJSDocNodes(node)) {
            if (ts.isInJSFile(node)) {
                for (const j of node.jsDoc!) {
                    bind(j);
                }
            }
            else {
                for (const j of node.jsDoc!) {
                    setParentPointers(node, j);
                }
            }
        }
    }
    function updateStrictModeStatementList(statements: ts.NodeArray<ts.Statement>) {
        if (!inStrictMode) {
            for (const statement of statements) {
                if (!ts.isPrologueDirective(statement)) {
                    return;
                }
                if (isUseStrictPrologueDirective((<ts.ExpressionStatement>statement))) {
                    inStrictMode = true;
                    return;
                }
            }
        }
    }
    /// Should be called only on prologue directives (isPrologueDirective(node) should be true)
    function isUseStrictPrologueDirective(node: ts.ExpressionStatement): boolean {
        const nodeText = ts.getSourceTextOfNodeFromSourceFile(file, node.expression);
        // Note: the node text must be exactly "use strict" or 'use strict'.  It is not ok for the
        // string to contain unicode escapes (as per ES5).
        return nodeText === '"use strict"' || nodeText === "'use strict'";
    }
    function bindWorker(node: ts.Node) {
        switch (node.kind) {
            /* Strict mode checks */
            case ts.SyntaxKind.Identifier:
                // for typedef type names with namespaces, bind the new jsdoc type symbol here
                // because it requires all containing namespaces to be in effect, namely the
                // current "blockScopeContainer" needs to be set to its immediate namespace parent.
                if ((<ts.Identifier>node).isInJSDocNamespace) {
                    let parentNode = node.parent;
                    while (parentNode && !ts.isJSDocTypeAlias(parentNode)) {
                        parentNode = parentNode.parent;
                    }
                    bindBlockScopedDeclaration((parentNode as ts.Declaration), ts.SymbolFlags.TypeAlias, ts.SymbolFlags.TypeAliasExcludes);
                    break;
                }
            // falls through
            case ts.SyntaxKind.ThisKeyword:
                if (currentFlow && (ts.isExpression(node) || parent.kind === ts.SyntaxKind.ShorthandPropertyAssignment)) {
                    node.flowNode = currentFlow;
                }
                return checkStrictModeIdentifier((<ts.Identifier>node));
            case ts.SyntaxKind.PropertyAccessExpression:
            case ts.SyntaxKind.ElementAccessExpression:
                const expr = (node as ts.PropertyAccessExpression | ts.ElementAccessExpression);
                if (currentFlow && isNarrowableReference(expr)) {
                    expr.flowNode = currentFlow;
                }
                if (ts.isSpecialPropertyDeclaration(expr)) {
                    bindSpecialPropertyDeclaration(expr);
                }
                if (ts.isInJSFile(expr) &&
                    file.commonJsModuleIndicator &&
                    ts.isModuleExportsAccessExpression(expr) &&
                    !lookupSymbolForNameWorker(blockScopeContainer, ("module" as ts.__String))) {
                    declareSymbol((file.locals!), /*parent*/ undefined, expr.expression, ts.SymbolFlags.FunctionScopedVariable | ts.SymbolFlags.ModuleExports, ts.SymbolFlags.FunctionScopedVariableExcludes);
                }
                break;
            case ts.SyntaxKind.BinaryExpression:
                const specialKind = ts.getAssignmentDeclarationKind((node as ts.BinaryExpression));
                switch (specialKind) {
                    case ts.AssignmentDeclarationKind.ExportsProperty:
                        bindExportsPropertyAssignment((node as ts.BindableStaticPropertyAssignmentExpression));
                        break;
                    case ts.AssignmentDeclarationKind.ModuleExports:
                        bindModuleExportsAssignment((node as ts.BindablePropertyAssignmentExpression));
                        break;
                    case ts.AssignmentDeclarationKind.PrototypeProperty:
                        bindPrototypePropertyAssignment((node as ts.BindableStaticPropertyAssignmentExpression).left, node);
                        break;
                    case ts.AssignmentDeclarationKind.Prototype:
                        bindPrototypeAssignment((node as ts.BindableStaticPropertyAssignmentExpression));
                        break;
                    case ts.AssignmentDeclarationKind.ThisProperty:
                        bindThisPropertyAssignment((node as ts.BindablePropertyAssignmentExpression));
                        break;
                    case ts.AssignmentDeclarationKind.Property:
                        bindSpecialPropertyAssignment((node as ts.BindablePropertyAssignmentExpression));
                        break;
                    case ts.AssignmentDeclarationKind.None:
                        // Nothing to do
                        break;
                    default:
                        ts.Debug.fail("Unknown binary expression special property assignment kind");
                }
                return checkStrictModeBinaryExpression((<ts.BinaryExpression>node));
            case ts.SyntaxKind.CatchClause:
                return checkStrictModeCatchClause((<ts.CatchClause>node));
            case ts.SyntaxKind.DeleteExpression:
                return checkStrictModeDeleteExpression((<ts.DeleteExpression>node));
            case ts.SyntaxKind.NumericLiteral:
                return checkStrictModeNumericLiteral((<ts.NumericLiteral>node));
            case ts.SyntaxKind.PostfixUnaryExpression:
                return checkStrictModePostfixUnaryExpression((<ts.PostfixUnaryExpression>node));
            case ts.SyntaxKind.PrefixUnaryExpression:
                return checkStrictModePrefixUnaryExpression((<ts.PrefixUnaryExpression>node));
            case ts.SyntaxKind.WithStatement:
                return checkStrictModeWithStatement((<ts.WithStatement>node));
            case ts.SyntaxKind.LabeledStatement:
                return checkStrictModeLabeledStatement((<ts.LabeledStatement>node));
            case ts.SyntaxKind.ThisType:
                seenThisKeyword = true;
                return;
            case ts.SyntaxKind.TypePredicate:
                break; // Binding the children will handle everything
            case ts.SyntaxKind.TypeParameter:
                return bindTypeParameter((node as ts.TypeParameterDeclaration));
            case ts.SyntaxKind.Parameter:
                return bindParameter((<ts.ParameterDeclaration>node));
            case ts.SyntaxKind.VariableDeclaration:
                return bindVariableDeclarationOrBindingElement((<ts.VariableDeclaration>node));
            case ts.SyntaxKind.BindingElement:
                node.flowNode = currentFlow;
                return bindVariableDeclarationOrBindingElement((<ts.BindingElement>node));
            case ts.SyntaxKind.PropertyDeclaration:
            case ts.SyntaxKind.PropertySignature:
                return bindPropertyWorker((node as ts.PropertyDeclaration | ts.PropertySignature));
            case ts.SyntaxKind.PropertyAssignment:
            case ts.SyntaxKind.ShorthandPropertyAssignment:
                return bindPropertyOrMethodOrAccessor((<ts.Declaration>node), ts.SymbolFlags.Property, ts.SymbolFlags.PropertyExcludes);
            case ts.SyntaxKind.EnumMember:
                return bindPropertyOrMethodOrAccessor((<ts.Declaration>node), ts.SymbolFlags.EnumMember, ts.SymbolFlags.EnumMemberExcludes);
            case ts.SyntaxKind.CallSignature:
            case ts.SyntaxKind.ConstructSignature:
            case ts.SyntaxKind.IndexSignature:
                return declareSymbolAndAddToSymbolTable((<ts.Declaration>node), ts.SymbolFlags.Signature, ts.SymbolFlags.None);
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.MethodSignature:
                // If this is an ObjectLiteralExpression method, then it sits in the same space
                // as other properties in the object literal.  So we use SymbolFlags.PropertyExcludes
                // so that it will conflict with any other object literal members with the same
                // name.
                return bindPropertyOrMethodOrAccessor((<ts.Declaration>node), ts.SymbolFlags.Method | ((<ts.MethodDeclaration>node).questionToken ? ts.SymbolFlags.Optional : ts.SymbolFlags.None), ts.isObjectLiteralMethod(node) ? ts.SymbolFlags.PropertyExcludes : ts.SymbolFlags.MethodExcludes);
            case ts.SyntaxKind.FunctionDeclaration:
                return bindFunctionDeclaration((<ts.FunctionDeclaration>node));
            case ts.SyntaxKind.Constructor:
                return declareSymbolAndAddToSymbolTable((<ts.Declaration>node), ts.SymbolFlags.Constructor, /*symbolExcludes:*/ ts.SymbolFlags.None);
            case ts.SyntaxKind.GetAccessor:
                return bindPropertyOrMethodOrAccessor((<ts.Declaration>node), ts.SymbolFlags.GetAccessor, ts.SymbolFlags.GetAccessorExcludes);
            case ts.SyntaxKind.SetAccessor:
                return bindPropertyOrMethodOrAccessor((<ts.Declaration>node), ts.SymbolFlags.SetAccessor, ts.SymbolFlags.SetAccessorExcludes);
            case ts.SyntaxKind.FunctionType:
            case ts.SyntaxKind.JSDocFunctionType:
            case ts.SyntaxKind.JSDocSignature:
            case ts.SyntaxKind.ConstructorType:
                return bindFunctionOrConstructorType((<ts.SignatureDeclaration | ts.JSDocSignature>node));
            case ts.SyntaxKind.TypeLiteral:
            case ts.SyntaxKind.JSDocTypeLiteral:
            case ts.SyntaxKind.MappedType:
                return bindAnonymousTypeWorker((node as ts.TypeLiteralNode | ts.MappedTypeNode | ts.JSDocTypeLiteral));
            case ts.SyntaxKind.JSDocClassTag:
                return bindJSDocClassTag((node as ts.JSDocClassTag));
            case ts.SyntaxKind.ObjectLiteralExpression:
                return bindObjectLiteralExpression((<ts.ObjectLiteralExpression>node));
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.ArrowFunction:
                return bindFunctionExpression((<ts.FunctionExpression>node));
            case ts.SyntaxKind.CallExpression:
                const assignmentKind = ts.getAssignmentDeclarationKind((node as ts.CallExpression));
                switch (assignmentKind) {
                    case ts.AssignmentDeclarationKind.ObjectDefinePropertyValue:
                        return bindObjectDefinePropertyAssignment((node as ts.BindableObjectDefinePropertyCall));
                    case ts.AssignmentDeclarationKind.ObjectDefinePropertyExports:
                        return bindObjectDefinePropertyExport((node as ts.BindableObjectDefinePropertyCall));
                    case ts.AssignmentDeclarationKind.ObjectDefinePrototypeProperty:
                        return bindObjectDefinePrototypeProperty((node as ts.BindableObjectDefinePropertyCall));
                    case ts.AssignmentDeclarationKind.None:
                        break; // Nothing to do
                    default:
                        return ts.Debug.fail("Unknown call expression assignment declaration kind");
                }
                if (ts.isInJSFile(node)) {
                    bindCallExpression((<ts.CallExpression>node));
                }
                break;
            // Members of classes, interfaces, and modules
            case ts.SyntaxKind.ClassExpression:
            case ts.SyntaxKind.ClassDeclaration:
                // All classes are automatically in strict mode in ES6.
                inStrictMode = true;
                return bindClassLikeDeclaration((<ts.ClassLikeDeclaration>node));
            case ts.SyntaxKind.InterfaceDeclaration:
                return bindBlockScopedDeclaration((<ts.Declaration>node), ts.SymbolFlags.Interface, ts.SymbolFlags.InterfaceExcludes);
            case ts.SyntaxKind.TypeAliasDeclaration:
                return bindBlockScopedDeclaration((<ts.Declaration>node), ts.SymbolFlags.TypeAlias, ts.SymbolFlags.TypeAliasExcludes);
            case ts.SyntaxKind.EnumDeclaration:
                return bindEnumDeclaration((<ts.EnumDeclaration>node));
            case ts.SyntaxKind.ModuleDeclaration:
                return bindModuleDeclaration((<ts.ModuleDeclaration>node));
            // Jsx-attributes
            case ts.SyntaxKind.JsxAttributes:
                return bindJsxAttributes((<ts.JsxAttributes>node));
            case ts.SyntaxKind.JsxAttribute:
                return bindJsxAttribute((<ts.JsxAttribute>node), ts.SymbolFlags.Property, ts.SymbolFlags.PropertyExcludes);
            // Imports and exports
            case ts.SyntaxKind.ImportEqualsDeclaration:
            case ts.SyntaxKind.NamespaceImport:
            case ts.SyntaxKind.ImportSpecifier:
            case ts.SyntaxKind.ExportSpecifier:
                return declareSymbolAndAddToSymbolTable((<ts.Declaration>node), ts.SymbolFlags.Alias, ts.SymbolFlags.AliasExcludes);
            case ts.SyntaxKind.NamespaceExportDeclaration:
                return bindNamespaceExportDeclaration((<ts.NamespaceExportDeclaration>node));
            case ts.SyntaxKind.ImportClause:
                return bindImportClause((<ts.ImportClause>node));
            case ts.SyntaxKind.ExportDeclaration:
                return bindExportDeclaration((<ts.ExportDeclaration>node));
            case ts.SyntaxKind.ExportAssignment:
                return bindExportAssignment((<ts.ExportAssignment>node));
            case ts.SyntaxKind.SourceFile:
                updateStrictModeStatementList((<ts.SourceFile>node).statements);
                return bindSourceFileIfExternalModule();
            case ts.SyntaxKind.Block:
                if (!ts.isFunctionLike(node.parent)) {
                    return;
                }
            // falls through
            case ts.SyntaxKind.ModuleBlock:
                return updateStrictModeStatementList((<ts.Block | ts.ModuleBlock>node).statements);
            case ts.SyntaxKind.JSDocParameterTag:
                if (node.parent.kind === ts.SyntaxKind.JSDocSignature) {
                    return bindParameter((node as ts.JSDocParameterTag));
                }
                if (node.parent.kind !== ts.SyntaxKind.JSDocTypeLiteral) {
                    break;
                }
            // falls through
            case ts.SyntaxKind.JSDocPropertyTag:
                const propTag = (node as ts.JSDocPropertyLikeTag);
                const flags = propTag.isBracketed || propTag.typeExpression && propTag.typeExpression.type.kind === ts.SyntaxKind.JSDocOptionalType ?
                    ts.SymbolFlags.Property | ts.SymbolFlags.Optional :
                    ts.SymbolFlags.Property;
                return declareSymbolAndAddToSymbolTable(propTag, flags, ts.SymbolFlags.PropertyExcludes);
            case ts.SyntaxKind.JSDocTypedefTag:
            case ts.SyntaxKind.JSDocCallbackTag:
            case ts.SyntaxKind.JSDocEnumTag:
                return (delayedTypeAliases || (delayedTypeAliases = [])).push((node as ts.JSDocTypedefTag | ts.JSDocCallbackTag | ts.JSDocEnumTag));
        }
    }
    function bindPropertyWorker(node: ts.PropertyDeclaration | ts.PropertySignature) {
        return bindPropertyOrMethodOrAccessor(node, ts.SymbolFlags.Property | (node.questionToken ? ts.SymbolFlags.Optional : ts.SymbolFlags.None), ts.SymbolFlags.PropertyExcludes);
    }
    function bindAnonymousTypeWorker(node: ts.TypeLiteralNode | ts.MappedTypeNode | ts.JSDocTypeLiteral) {
        return bindAnonymousDeclaration((<ts.Declaration>node), ts.SymbolFlags.TypeLiteral, ts.InternalSymbolName.Type);
    }
    function bindSourceFileIfExternalModule() {
        setExportContextFlag(file);
        if (ts.isExternalModule(file)) {
            bindSourceFileAsExternalModule();
        }
        else if (ts.isJsonSourceFile(file)) {
            bindSourceFileAsExternalModule();
            // Create symbol equivalent for the module.exports = {}
            const originalSymbol = file.symbol;
            declareSymbol((file.symbol.exports!), file.symbol, file, ts.SymbolFlags.Property, ts.SymbolFlags.All);
            file.symbol = originalSymbol;
        }
    }
    function bindSourceFileAsExternalModule() {
        bindAnonymousDeclaration(file, ts.SymbolFlags.ValueModule, (`"${ts.removeFileExtension(file.fileName)}"` as ts.__String));
    }
    function bindExportAssignment(node: ts.ExportAssignment) {
        if (!container.symbol || !container.symbol.exports) {
            // Export assignment in some sort of block construct
            bindAnonymousDeclaration(node, ts.SymbolFlags.Alias, (getDeclarationName(node)!));
        }
        else {
            const flags = ts.exportAssignmentIsAlias(node)
                // An export default clause with an EntityNameExpression or a class expression exports all meanings of that identifier or expression;
                ? ts.SymbolFlags.Alias
                // An export default clause with any other expression exports a value
                : ts.SymbolFlags.Property;
            // If there is an `export default x;` alias declaration, can't `export default` anything else.
            // (In contrast, you can still have `export default function f() {}` and `export default interface I {}`.)
            const symbol = declareSymbol(container.symbol.exports, container.symbol, node, flags, ts.SymbolFlags.All);
            if (node.isExportEquals) {
                // Will be an error later, since the module already has other exports. Just make sure this has a valueDeclaration set.
                setValueDeclaration(symbol, node);
            }
        }
    }
    function bindNamespaceExportDeclaration(node: ts.NamespaceExportDeclaration) {
        if (node.modifiers && node.modifiers.length) {
            file.bindDiagnostics.push(createDiagnosticForNode(node, ts.Diagnostics.Modifiers_cannot_appear_here));
        }
        const diag = !ts.isSourceFile(node.parent) ? ts.Diagnostics.Global_module_exports_may_only_appear_at_top_level
            : !ts.isExternalModule(node.parent) ? ts.Diagnostics.Global_module_exports_may_only_appear_in_module_files
                : !node.parent.isDeclarationFile ? ts.Diagnostics.Global_module_exports_may_only_appear_in_declaration_files
                    : undefined;
        if (diag) {
            file.bindDiagnostics.push(createDiagnosticForNode(node, diag));
        }
        else {
            file.symbol.globalExports = file.symbol.globalExports || ts.createSymbolTable();
            declareSymbol(file.symbol.globalExports, file.symbol, node, ts.SymbolFlags.Alias, ts.SymbolFlags.AliasExcludes);
        }
    }
    function bindExportDeclaration(node: ts.ExportDeclaration) {
        if (!container.symbol || !container.symbol.exports) {
            // Export * in some sort of block construct
            bindAnonymousDeclaration(node, ts.SymbolFlags.ExportStar, (getDeclarationName(node)!));
        }
        else if (!node.exportClause) {
            // All export * declarations are collected in an __export symbol
            declareSymbol(container.symbol.exports, container.symbol, node, ts.SymbolFlags.ExportStar, ts.SymbolFlags.None);
        }
    }
    function bindImportClause(node: ts.ImportClause) {
        if (node.name) {
            declareSymbolAndAddToSymbolTable(node, ts.SymbolFlags.Alias, ts.SymbolFlags.AliasExcludes);
        }
    }
    function setCommonJsModuleIndicator(node: ts.Node) {
        if (file.externalModuleIndicator) {
            return false;
        }
        if (!file.commonJsModuleIndicator) {
            file.commonJsModuleIndicator = node;
            bindSourceFileAsExternalModule();
        }
        return true;
    }
    function bindObjectDefinePropertyExport(node: ts.BindableObjectDefinePropertyCall) {
        if (!setCommonJsModuleIndicator(node)) {
            return;
        }
        const symbol = forEachIdentifierInEntityName(node.arguments[0], /*parent*/ undefined, (id, symbol) => {
            if (symbol) {
                addDeclarationToSymbol(symbol, id, ts.SymbolFlags.Module | ts.SymbolFlags.Assignment);
            }
            return symbol;
        });
        if (symbol) {
            const flags = ts.SymbolFlags.Property | ts.SymbolFlags.ExportValue;
            declareSymbol((symbol.exports!), symbol, node, flags, ts.SymbolFlags.None);
        }
    }
    function bindExportsPropertyAssignment(node: ts.BindableStaticPropertyAssignmentExpression) {
        // When we create a property via 'exports.foo = bar', the 'exports.foo' property access
        // expression is the declaration
        if (!setCommonJsModuleIndicator(node)) {
            return;
        }
        const symbol = forEachIdentifierInEntityName(node.left.expression, /*parent*/ undefined, (id, symbol) => {
            if (symbol) {
                addDeclarationToSymbol(symbol, id, ts.SymbolFlags.Module | ts.SymbolFlags.Assignment);
            }
            return symbol;
        });
        if (symbol) {
            const flags = ts.isClassExpression(node.right) ?
                ts.SymbolFlags.Property | ts.SymbolFlags.ExportValue | ts.SymbolFlags.Class :
                ts.SymbolFlags.Property | ts.SymbolFlags.ExportValue;
            declareSymbol((symbol.exports!), symbol, node.left, flags, ts.SymbolFlags.None);
        }
    }
    function bindModuleExportsAssignment(node: ts.BindablePropertyAssignmentExpression) {
        // A common practice in node modules is to set 'export = module.exports = {}', this ensures that 'exports'
        // is still pointing to 'module.exports'.
        // We do not want to consider this as 'export=' since a module can have only one of these.
        // Similarly we do not want to treat 'module.exports = exports' as an 'export='.
        if (!setCommonJsModuleIndicator(node)) {
            return;
        }
        const assignedExpression = ts.getRightMostAssignedExpression(node.right);
        if (ts.isEmptyObjectLiteral(assignedExpression) || container === file && isExportsOrModuleExportsOrAlias(file, assignedExpression)) {
            return;
        }
        // 'module.exports = expr' assignment
        const flags = ts.exportAssignmentIsAlias(node)
            ? ts.SymbolFlags.Alias // An export= with an EntityNameExpression or a ClassExpression exports all meanings of that identifier or class
            : ts.SymbolFlags.Property | ts.SymbolFlags.ExportValue | ts.SymbolFlags.ValueModule;
        const symbol = declareSymbol((file.symbol.exports!), file.symbol, node, flags | ts.SymbolFlags.Assignment, ts.SymbolFlags.None);
        setValueDeclaration(symbol, node);
    }
    function bindThisPropertyAssignment(node: ts.BindablePropertyAssignmentExpression | ts.PropertyAccessExpression | ts.LiteralLikeElementAccessExpression) {
        ts.Debug.assert(ts.isInJSFile(node));
        const thisContainer = ts.getThisContainer(node, /*includeArrowFunctions*/ false);
        switch (thisContainer.kind) {
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.FunctionExpression:
                let constructorSymbol: ts.Symbol | undefined = thisContainer.symbol;
                // For `f.prototype.m = function() { this.x = 0; }`, `this.x = 0` should modify `f`'s members, not the function expression.
                if (ts.isBinaryExpression(thisContainer.parent) && thisContainer.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
                    const l = thisContainer.parent.left;
                    if (ts.isBindableStaticAccessExpression(l) && ts.isPrototypeAccess(l.expression)) {
                        constructorSymbol = lookupSymbolForPropertyAccess(l.expression.expression, thisParentContainer);
                    }
                }
                if (constructorSymbol && constructorSymbol.valueDeclaration) {
                    // Declare a 'member' if the container is an ES5 class or ES6 constructor
                    constructorSymbol.members = constructorSymbol.members || ts.createSymbolTable();
                    // It's acceptable for multiple 'this' assignments of the same identifier to occur
                    if (ts.hasDynamicName(node)) {
                        bindDynamicallyNamedThisPropertyAssignment(node, constructorSymbol);
                    }
                    else {
                        declareSymbol(constructorSymbol.members, constructorSymbol, node, ts.SymbolFlags.Property | ts.SymbolFlags.Assignment, ts.SymbolFlags.PropertyExcludes & ~ts.SymbolFlags.Property);
                    }
                    addDeclarationToSymbol(constructorSymbol, constructorSymbol.valueDeclaration, ts.SymbolFlags.Class);
                }
                break;
            case ts.SyntaxKind.Constructor:
            case ts.SyntaxKind.PropertyDeclaration:
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
                // this.foo assignment in a JavaScript class
                // Bind this property to the containing class
                const containingClass = thisContainer.parent;
                const symbolTable = ts.hasModifier(thisContainer, ts.ModifierFlags.Static) ? containingClass.symbol.exports! : containingClass.symbol.members!;
                if (ts.hasDynamicName(node)) {
                    bindDynamicallyNamedThisPropertyAssignment(node, containingClass.symbol);
                }
                else {
                    declareSymbol(symbolTable, containingClass.symbol, node, ts.SymbolFlags.Property | ts.SymbolFlags.Assignment, ts.SymbolFlags.None, /*isReplaceableByMethod*/ true);
                }
                break;
            case ts.SyntaxKind.SourceFile:
                // this.property = assignment in a source file -- declare symbol in exports for a module, in locals for a script
                if (ts.hasDynamicName(node)) {
                    break;
                }
                else if ((thisContainer as ts.SourceFile).commonJsModuleIndicator) {
                    declareSymbol((thisContainer.symbol.exports!), thisContainer.symbol, node, ts.SymbolFlags.Property | ts.SymbolFlags.ExportValue, ts.SymbolFlags.None);
                }
                else {
                    declareSymbolAndAddToSymbolTable(node, ts.SymbolFlags.FunctionScopedVariable, ts.SymbolFlags.FunctionScopedVariableExcludes);
                }
                break;
            default:
                ts.Debug.failBadSyntaxKind(thisContainer);
        }
    }
    function bindDynamicallyNamedThisPropertyAssignment(node: ts.BinaryExpression | ts.DynamicNamedDeclaration, symbol: ts.Symbol) {
        bindAnonymousDeclaration(node, ts.SymbolFlags.Property, ts.InternalSymbolName.Computed);
        addLateBoundAssignmentDeclarationToSymbol(node, symbol);
    }
    function addLateBoundAssignmentDeclarationToSymbol(node: ts.BinaryExpression | ts.DynamicNamedDeclaration, symbol: ts.Symbol | undefined) {
        if (symbol) {
            const members = symbol.assignmentDeclarationMembers || (symbol.assignmentDeclarationMembers = ts.createMap());
            members.set("" + ts.getNodeId(node), node);
        }
    }
    function bindSpecialPropertyDeclaration(node: ts.PropertyAccessExpression | ts.LiteralLikeElementAccessExpression) {
        if (node.expression.kind === ts.SyntaxKind.ThisKeyword) {
            bindThisPropertyAssignment(node);
        }
        else if (ts.isBindableStaticAccessExpression(node) && node.parent.parent.kind === ts.SyntaxKind.SourceFile) {
            if (ts.isPrototypeAccess(node.expression)) {
                bindPrototypePropertyAssignment(node, node.parent);
            }
            else {
                bindStaticPropertyAssignment(node);
            }
        }
    }
    /** For `x.prototype = { p, ... }`, declare members p,... if `x` is function/class/{}, or not declared. */
    function bindPrototypeAssignment(node: ts.BindableStaticPropertyAssignmentExpression) {
        node.left.parent = node;
        node.right.parent = node;
        bindPropertyAssignment(node.left.expression, node.left, /*isPrototypeProperty*/ false, /*containerIsClass*/ true);
    }
    function bindObjectDefinePrototypeProperty(node: ts.BindableObjectDefinePropertyCall) {
        const namespaceSymbol = lookupSymbolForPropertyAccess(((node.arguments[0] as ts.PropertyAccessExpression).expression as ts.EntityNameExpression));
        if (namespaceSymbol && namespaceSymbol.valueDeclaration) {
            // Ensure the namespace symbol becomes class-like
            addDeclarationToSymbol(namespaceSymbol, namespaceSymbol.valueDeclaration, ts.SymbolFlags.Class);
        }
        bindPotentiallyNewExpandoMemberToNamespace(node, namespaceSymbol, /*isPrototypeProperty*/ true);
    }
    /**
     * For `x.prototype.y = z`, declare a member `y` on `x` if `x` is a function or class, or not declared.
     * Note that jsdoc preceding an ExpressionStatement like `x.prototype.y;` is also treated as a declaration.
     */
    function bindPrototypePropertyAssignment(lhs: ts.BindableStaticAccessExpression, parent: ts.Node) {
        // Look up the function in the local scope, since prototype assignments should
        // follow the function declaration
        const classPrototype = (lhs.expression as ts.BindableStaticAccessExpression);
        const constructorFunction = classPrototype.expression;
        // Fix up parent pointers since we're going to use these nodes before we bind into them
        lhs.parent = parent;
        constructorFunction.parent = classPrototype;
        classPrototype.parent = lhs;
        bindPropertyAssignment(constructorFunction, lhs, /*isPrototypeProperty*/ true, /*containerIsClass*/ true);
    }
    function bindObjectDefinePropertyAssignment(node: ts.BindableObjectDefinePropertyCall) {
        let namespaceSymbol = lookupSymbolForPropertyAccess(node.arguments[0]);
        const isToplevel = node.parent.parent.kind === ts.SyntaxKind.SourceFile;
        namespaceSymbol = bindPotentiallyMissingNamespaces(namespaceSymbol, node.arguments[0], isToplevel, /*isPrototypeProperty*/ false, /*containerIsClass*/ false);
        bindPotentiallyNewExpandoMemberToNamespace(node, namespaceSymbol, /*isPrototypeProperty*/ false);
    }
    function bindSpecialPropertyAssignment(node: ts.BindablePropertyAssignmentExpression) {
        // Class declarations in Typescript do not allow property declarations
        const parentSymbol = lookupSymbolForPropertyAccess(node.left.expression);
        if (!ts.isInJSFile(node) && !ts.isFunctionSymbol(parentSymbol)) {
            return;
        }
        // Fix up parent pointers since we're going to use these nodes before we bind into them
        node.left.parent = node;
        node.right.parent = node;
        if (ts.isIdentifier(node.left.expression) && container === file && isExportsOrModuleExportsOrAlias(file, node.left.expression)) {
            // This can be an alias for the 'exports' or 'module.exports' names, e.g.
            //    var util = module.exports;
            //    util.property = function ...
            bindExportsPropertyAssignment((node as ts.BindableStaticPropertyAssignmentExpression));
        }
        else {
            if (ts.hasDynamicName(node)) {
                bindAnonymousDeclaration(node, ts.SymbolFlags.Property | ts.SymbolFlags.Assignment, ts.InternalSymbolName.Computed);
                const sym = bindPotentiallyMissingNamespaces(parentSymbol, node.left.expression, isTopLevelNamespaceAssignment(node.left), /*isPrototype*/ false, /*containerIsClass*/ false);
                addLateBoundAssignmentDeclarationToSymbol(node, sym);
            }
            else {
                bindStaticPropertyAssignment(ts.cast(node.left, ts.isBindableStaticAccessExpression));
            }
        }
    }
    /**
     * For nodes like `x.y = z`, declare a member 'y' on 'x' if x is a function (or IIFE) or class or {}, or not declared.
     * Also works for expression statements preceded by JSDoc, like / ** @type number * / x.y;
     */
    function bindStaticPropertyAssignment(node: ts.BindableStaticAccessExpression) {
        node.expression.parent = node;
        bindPropertyAssignment(node.expression, node, /*isPrototypeProperty*/ false, /*containerIsClass*/ false);
    }
    function bindPotentiallyMissingNamespaces(namespaceSymbol: ts.Symbol | undefined, entityName: ts.BindableStaticNameExpression, isToplevel: boolean, isPrototypeProperty: boolean, containerIsClass: boolean) {
        if (isToplevel && !isPrototypeProperty) {
            // make symbols or add declarations for intermediate containers
            const flags = ts.SymbolFlags.Module | ts.SymbolFlags.Assignment;
            const excludeFlags = ts.SymbolFlags.ValueModuleExcludes & ~ts.SymbolFlags.Assignment;
            namespaceSymbol = forEachIdentifierInEntityName(entityName, namespaceSymbol, (id, symbol, parent) => {
                if (symbol) {
                    addDeclarationToSymbol(symbol, id, flags);
                    return symbol;
                }
                else {
                    const table = parent ? parent.exports! :
                        file.jsGlobalAugmentations || (file.jsGlobalAugmentations = ts.createSymbolTable());
                    return declareSymbol(table, parent, id, flags, excludeFlags);
                }
            });
        }
        if (containerIsClass && namespaceSymbol && namespaceSymbol.valueDeclaration) {
            addDeclarationToSymbol(namespaceSymbol, namespaceSymbol.valueDeclaration, ts.SymbolFlags.Class);
        }
        return namespaceSymbol;
    }
    function bindPotentiallyNewExpandoMemberToNamespace(declaration: ts.BindableStaticAccessExpression | ts.CallExpression, namespaceSymbol: ts.Symbol | undefined, isPrototypeProperty: boolean) {
        if (!namespaceSymbol || !isExpandoSymbol(namespaceSymbol)) {
            return;
        }
        // Set up the members collection if it doesn't exist already
        const symbolTable = isPrototypeProperty ?
            (namespaceSymbol.members || (namespaceSymbol.members = ts.createSymbolTable())) :
            (namespaceSymbol.exports || (namespaceSymbol.exports = ts.createSymbolTable()));
        let includes = ts.SymbolFlags.None;
        let excludes = ts.SymbolFlags.None;
        // Method-like
        if (ts.isFunctionLikeDeclaration((ts.getAssignedExpandoInitializer(declaration)!))) {
            includes = ts.SymbolFlags.Method;
            excludes = ts.SymbolFlags.MethodExcludes;
        }
        // Maybe accessor-like
        else if (ts.isCallExpression(declaration) && ts.isBindableObjectDefinePropertyCall(declaration)) {
            if (ts.some(declaration.arguments[2].properties, p => {
                const id = ts.getNameOfDeclaration(p);
                return !!id && ts.isIdentifier(id) && ts.idText(id) === "set";
            })) {
                // We mix in `SymbolFLags.Property` so in the checker `getTypeOfVariableParameterOrProperty` is used for this
                // symbol, instead of `getTypeOfAccessor` (which will assert as there is no real accessor declaration)
                includes |= ts.SymbolFlags.SetAccessor | ts.SymbolFlags.Property;
                excludes |= ts.SymbolFlags.SetAccessorExcludes;
            }
            if (ts.some(declaration.arguments[2].properties, p => {
                const id = ts.getNameOfDeclaration(p);
                return !!id && ts.isIdentifier(id) && ts.idText(id) === "get";
            })) {
                includes |= ts.SymbolFlags.GetAccessor | ts.SymbolFlags.Property;
                excludes |= ts.SymbolFlags.GetAccessorExcludes;
            }
        }
        if (includes === ts.SymbolFlags.None) {
            includes = ts.SymbolFlags.Property;
            excludes = ts.SymbolFlags.PropertyExcludes;
        }
        declareSymbol(symbolTable, namespaceSymbol, declaration, includes | ts.SymbolFlags.Assignment, excludes & ~ts.SymbolFlags.Assignment);
    }
    function isTopLevelNamespaceAssignment(propertyAccess: ts.BindableAccessExpression) {
        return ts.isBinaryExpression(propertyAccess.parent)
            ? getParentOfBinaryExpression(propertyAccess.parent).parent.kind === ts.SyntaxKind.SourceFile
            : propertyAccess.parent.parent.kind === ts.SyntaxKind.SourceFile;
    }
    function bindPropertyAssignment(name: ts.BindableStaticNameExpression, propertyAccess: ts.BindableStaticAccessExpression, isPrototypeProperty: boolean, containerIsClass: boolean) {
        let namespaceSymbol = lookupSymbolForPropertyAccess(name);
        const isToplevel = isTopLevelNamespaceAssignment(propertyAccess);
        namespaceSymbol = bindPotentiallyMissingNamespaces(namespaceSymbol, propertyAccess.expression, isToplevel, isPrototypeProperty, containerIsClass);
        bindPotentiallyNewExpandoMemberToNamespace(propertyAccess, namespaceSymbol, isPrototypeProperty);
    }
    /**
     * Javascript expando values are:
     * - Functions
     * - classes
     * - namespaces
     * - variables initialized with function expressions
     * -                       with class expressions
     * -                       with empty object literals
     * -                       with non-empty object literals if assigned to the prototype property
     */
    function isExpandoSymbol(symbol: ts.Symbol): boolean {
        if (symbol.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Class | ts.SymbolFlags.NamespaceModule)) {
            return true;
        }
        const node = symbol.valueDeclaration;
        if (node && ts.isCallExpression(node)) {
            return !!ts.getAssignedExpandoInitializer(node);
        }
        let init = !node ? undefined :
            ts.isVariableDeclaration(node) ? node.initializer :
                ts.isBinaryExpression(node) ? node.right :
                    ts.isPropertyAccessExpression(node) && ts.isBinaryExpression(node.parent) ? node.parent.right :
                        undefined;
        init = init && ts.getRightMostAssignedExpression(init);
        if (init) {
            const isPrototypeAssignment = ts.isPrototypeAccess(ts.isVariableDeclaration(node) ? node.name : ts.isBinaryExpression(node) ? node.left : node);
            return !!ts.getExpandoInitializer(ts.isBinaryExpression(init) && (init.operatorToken.kind === ts.SyntaxKind.BarBarToken || init.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) ? init.right : init, isPrototypeAssignment);
        }
        return false;
    }
    function getParentOfBinaryExpression(expr: ts.Node) {
        while (ts.isBinaryExpression(expr.parent)) {
            expr = expr.parent;
        }
        return expr.parent;
    }
    function lookupSymbolForPropertyAccess(node: ts.BindableStaticNameExpression, lookupContainer: ts.Node = container): ts.Symbol | undefined {
        if (ts.isIdentifier(node)) {
            return lookupSymbolForNameWorker(lookupContainer, node.escapedText);
        }
        else {
            const symbol = lookupSymbolForPropertyAccess(node.expression);
            return symbol && symbol.exports && symbol.exports.get(ts.getElementOrPropertyAccessName(node));
        }
    }
    function forEachIdentifierInEntityName(e: ts.BindableStaticNameExpression, parent: ts.Symbol | undefined, action: (e: ts.Declaration, symbol: ts.Symbol | undefined, parent: ts.Symbol | undefined) => ts.Symbol | undefined): ts.Symbol | undefined {
        if (isExportsOrModuleExportsOrAlias(file, e)) {
            return file.symbol;
        }
        else if (ts.isIdentifier(e)) {
            return action(e, lookupSymbolForPropertyAccess(e), parent);
        }
        else {
            const s = forEachIdentifierInEntityName(e.expression, parent, action);
            return action(ts.getNameOrArgument(e), s && s.exports && s.exports.get(ts.getElementOrPropertyAccessName(e)), s);
        }
    }
    function bindCallExpression(node: ts.CallExpression) {
        // We're only inspecting call expressions to detect CommonJS modules, so we can skip
        // this check if we've already seen the module indicator
        if (!file.commonJsModuleIndicator && ts.isRequireCall(node, /*checkArgumentIsStringLiteralLike*/ false)) {
            setCommonJsModuleIndicator(node);
        }
    }
    function bindClassLikeDeclaration(node: ts.ClassLikeDeclaration) {
        if (node.kind === ts.SyntaxKind.ClassDeclaration) {
            bindBlockScopedDeclaration(node, ts.SymbolFlags.Class, ts.SymbolFlags.ClassExcludes);
        }
        else {
            const bindingName = node.name ? node.name.escapedText : ts.InternalSymbolName.Class;
            bindAnonymousDeclaration(node, ts.SymbolFlags.Class, bindingName);
            // Add name of class expression into the map for semantic classifier
            if (node.name) {
                classifiableNames.set(node.name.escapedText, true);
            }
        }
        const { symbol } = node;
        // TypeScript 1.0 spec (April 2014): 8.4
        // Every class automatically contains a static property member named 'prototype', the
        // type of which is an instantiation of the class type with type Any supplied as a type
        // argument for each type parameter. It is an error to explicitly declare a static
        // property member with the name 'prototype'.
        //
        // Note: we check for this here because this class may be merging into a module.  The
        // module might have an exported variable called 'prototype'.  We can't allow that as
        // that would clash with the built-in 'prototype' for the class.
        const prototypeSymbol = createSymbol(ts.SymbolFlags.Property | ts.SymbolFlags.Prototype, ("prototype" as ts.__String));
        const symbolExport = symbol.exports!.get(prototypeSymbol.escapedName);
        if (symbolExport) {
            if (node.name) {
                node.name.parent = node;
            }
            file.bindDiagnostics.push(createDiagnosticForNode(symbolExport.declarations[0], ts.Diagnostics.Duplicate_identifier_0, ts.symbolName(prototypeSymbol)));
        }
        symbol.exports!.set(prototypeSymbol.escapedName, prototypeSymbol);
        prototypeSymbol.parent = symbol;
    }
    function bindEnumDeclaration(node: ts.EnumDeclaration) {
        return ts.isEnumConst(node)
            ? bindBlockScopedDeclaration(node, ts.SymbolFlags.ConstEnum, ts.SymbolFlags.ConstEnumExcludes)
            : bindBlockScopedDeclaration(node, ts.SymbolFlags.RegularEnum, ts.SymbolFlags.RegularEnumExcludes);
    }
    function bindVariableDeclarationOrBindingElement(node: ts.VariableDeclaration | ts.BindingElement) {
        if (inStrictMode) {
            checkStrictModeEvalOrArguments(node, node.name);
        }
        if (!ts.isBindingPattern(node.name)) {
            if (ts.isBlockOrCatchScoped(node)) {
                bindBlockScopedDeclaration(node, ts.SymbolFlags.BlockScopedVariable, ts.SymbolFlags.BlockScopedVariableExcludes);
            }
            else if (ts.isParameterDeclaration(node)) {
                // It is safe to walk up parent chain to find whether the node is a destructuring parameter declaration
                // because its parent chain has already been set up, since parents are set before descending into children.
                //
                // If node is a binding element in parameter declaration, we need to use ParameterExcludes.
                // Using ParameterExcludes flag allows the compiler to report an error on duplicate identifiers in Parameter Declaration
                // For example:
                //      function foo([a,a]) {} // Duplicate Identifier error
                //      function bar(a,a) {}   // Duplicate Identifier error, parameter declaration in this case is handled in bindParameter
                //                             // which correctly set excluded symbols
                declareSymbolAndAddToSymbolTable(node, ts.SymbolFlags.FunctionScopedVariable, ts.SymbolFlags.ParameterExcludes);
            }
            else {
                declareSymbolAndAddToSymbolTable(node, ts.SymbolFlags.FunctionScopedVariable, ts.SymbolFlags.FunctionScopedVariableExcludes);
            }
        }
    }
    function bindParameter(node: ts.ParameterDeclaration | ts.JSDocParameterTag) {
        if (node.kind === ts.SyntaxKind.JSDocParameterTag && container.kind !== ts.SyntaxKind.JSDocSignature) {
            return;
        }
        if (inStrictMode && !(node.flags & ts.NodeFlags.Ambient)) {
            // It is a SyntaxError if the identifier eval or arguments appears within a FormalParameterList of a
            // strict mode FunctionLikeDeclaration or FunctionExpression(13.1)
            checkStrictModeEvalOrArguments(node, node.name);
        }
        if (ts.isBindingPattern(node.name)) {
            bindAnonymousDeclaration(node, ts.SymbolFlags.FunctionScopedVariable, ("__" + (node as ts.ParameterDeclaration).parent.parameters.indexOf((node as ts.ParameterDeclaration)) as ts.__String));
        }
        else {
            declareSymbolAndAddToSymbolTable(node, ts.SymbolFlags.FunctionScopedVariable, ts.SymbolFlags.ParameterExcludes);
        }
        // If this is a property-parameter, then also declare the property symbol into the
        // containing class.
        if (ts.isParameterPropertyDeclaration(node, node.parent)) {
            const classDeclaration = (<ts.ClassLikeDeclaration>node.parent.parent);
            declareSymbol((classDeclaration.symbol.members!), classDeclaration.symbol, node, ts.SymbolFlags.Property | (node.questionToken ? ts.SymbolFlags.Optional : ts.SymbolFlags.None), ts.SymbolFlags.PropertyExcludes);
        }
    }
    function bindFunctionDeclaration(node: ts.FunctionDeclaration) {
        if (!file.isDeclarationFile && !(node.flags & ts.NodeFlags.Ambient)) {
            if (ts.isAsyncFunction(node)) {
                emitFlags |= ts.NodeFlags.HasAsyncFunctions;
            }
        }
        checkStrictModeFunctionName(node);
        if (inStrictMode) {
            checkStrictModeFunctionDeclaration(node);
            bindBlockScopedDeclaration(node, ts.SymbolFlags.Function, ts.SymbolFlags.FunctionExcludes);
        }
        else {
            declareSymbolAndAddToSymbolTable(node, ts.SymbolFlags.Function, ts.SymbolFlags.FunctionExcludes);
        }
    }
    function bindFunctionExpression(node: ts.FunctionExpression) {
        if (!file.isDeclarationFile && !(node.flags & ts.NodeFlags.Ambient)) {
            if (ts.isAsyncFunction(node)) {
                emitFlags |= ts.NodeFlags.HasAsyncFunctions;
            }
        }
        if (currentFlow) {
            node.flowNode = currentFlow;
        }
        checkStrictModeFunctionName(node);
        const bindingName = node.name ? node.name.escapedText : ts.InternalSymbolName.Function;
        return bindAnonymousDeclaration(node, ts.SymbolFlags.Function, bindingName);
    }
    function bindPropertyOrMethodOrAccessor(node: ts.Declaration, symbolFlags: ts.SymbolFlags, symbolExcludes: ts.SymbolFlags) {
        if (!file.isDeclarationFile && !(node.flags & ts.NodeFlags.Ambient) && ts.isAsyncFunction(node)) {
            emitFlags |= ts.NodeFlags.HasAsyncFunctions;
        }
        if (currentFlow && ts.isObjectLiteralOrClassExpressionMethod(node)) {
            node.flowNode = currentFlow;
        }
        return ts.hasDynamicName(node)
            ? bindAnonymousDeclaration(node, symbolFlags, ts.InternalSymbolName.Computed)
            : declareSymbolAndAddToSymbolTable(node, symbolFlags, symbolExcludes);
    }
    function getInferTypeContainer(node: ts.Node): ts.ConditionalTypeNode | undefined {
        const extendsType = ts.findAncestor(node, n => n.parent && ts.isConditionalTypeNode(n.parent) && n.parent.extendsType === n);
        return extendsType && (extendsType.parent as ts.ConditionalTypeNode);
    }
    function bindTypeParameter(node: ts.TypeParameterDeclaration) {
        if (ts.isJSDocTemplateTag(node.parent)) {
            const container = ts.find(((node.parent.parent as ts.JSDoc).tags!), ts.isJSDocTypeAlias) || ts.getHostSignatureFromJSDoc(node.parent); // TODO: GH#18217
            if (container) {
                if (!container.locals) {
                    container.locals = ts.createSymbolTable();
                }
                declareSymbol(container.locals, /*parent*/ undefined, node, ts.SymbolFlags.TypeParameter, ts.SymbolFlags.TypeParameterExcludes);
            }
            else {
                declareSymbolAndAddToSymbolTable(node, ts.SymbolFlags.TypeParameter, ts.SymbolFlags.TypeParameterExcludes);
            }
        }
        else if (node.parent.kind === ts.SyntaxKind.InferType) {
            const container = getInferTypeContainer(node.parent);
            if (container) {
                if (!container.locals) {
                    container.locals = ts.createSymbolTable();
                }
                declareSymbol(container.locals, /*parent*/ undefined, node, ts.SymbolFlags.TypeParameter, ts.SymbolFlags.TypeParameterExcludes);
            }
            else {
                bindAnonymousDeclaration(node, ts.SymbolFlags.TypeParameter, (getDeclarationName(node)!)); // TODO: GH#18217
            }
        }
        else {
            declareSymbolAndAddToSymbolTable(node, ts.SymbolFlags.TypeParameter, ts.SymbolFlags.TypeParameterExcludes);
        }
    }
    // reachability checks
    function shouldReportErrorOnModuleDeclaration(node: ts.ModuleDeclaration): boolean {
        const instanceState = getModuleInstanceState(node);
        return instanceState === ModuleInstanceState.Instantiated || (instanceState === ModuleInstanceState.ConstEnumOnly && !!options.preserveConstEnums);
    }
    function checkUnreachable(node: ts.Node): boolean {
        if (!(currentFlow.flags & ts.FlowFlags.Unreachable)) {
            return false;
        }
        if (currentFlow === unreachableFlow) {
            const reportError = 
            // report error on all statements except empty ones
            (ts.isStatementButNotDeclaration(node) && node.kind !== ts.SyntaxKind.EmptyStatement) ||
                // report error on class declarations
                node.kind === ts.SyntaxKind.ClassDeclaration ||
                // report error on instantiated modules or const-enums only modules if preserveConstEnums is set
                (node.kind === ts.SyntaxKind.ModuleDeclaration && shouldReportErrorOnModuleDeclaration((<ts.ModuleDeclaration>node)));
            if (reportError) {
                currentFlow = reportedUnreachableFlow;
                if (!options.allowUnreachableCode) {
                    // unreachable code is reported if
                    // - user has explicitly asked about it AND
                    // - statement is in not ambient context (statements in ambient context is already an error
                    //   so we should not report extras) AND
                    //   - node is not variable statement OR
                    //   - node is block scoped variable statement OR
                    //   - node is not block scoped variable statement and at least one variable declaration has initializer
                    //   Rationale: we don't want to report errors on non-initialized var's since they are hoisted
                    //   On the other side we do want to report errors on non-initialized 'lets' because of TDZ
                    const isError = ts.unreachableCodeIsError(options) &&
                        !(node.flags & ts.NodeFlags.Ambient) &&
                        (!ts.isVariableStatement(node) ||
                            !!(ts.getCombinedNodeFlags(node.declarationList) & ts.NodeFlags.BlockScoped) ||
                            node.declarationList.declarations.some(d => !!d.initializer));
                    eachUnreachableRange(node, (start, end) => errorOrSuggestionOnRange(isError, start, end, ts.Diagnostics.Unreachable_code_detected));
                }
            }
        }
        return true;
    }
}
/* @internal */
function eachUnreachableRange(node: ts.Node, cb: (start: ts.Node, last: ts.Node) => void): void {
    if (ts.isStatement(node) && isExecutableStatement(node) && ts.isBlock(node.parent)) {
        const { statements } = node.parent;
        const slice = ts.sliceAfter(statements, node);
        ts.getRangesWhere(slice, isExecutableStatement, (start, afterEnd) => cb(slice[start], slice[afterEnd - 1]));
    }
    else {
        cb(node, node);
    }
}
// As opposed to a pure declaration like an `interface`
/* @internal */
function isExecutableStatement(s: ts.Statement): boolean {
    // Don't remove statements that can validly be used before they appear.
    return !ts.isFunctionDeclaration(s) && !isPurelyTypeDeclaration(s) && !ts.isEnumDeclaration(s) &&
        // `var x;` may declare a variable used above
        !(ts.isVariableStatement(s) && !(ts.getCombinedNodeFlags(s) & (ts.NodeFlags.Let | ts.NodeFlags.Const)) && s.declarationList.declarations.some(d => !d.initializer));
}
/* @internal */
function isPurelyTypeDeclaration(s: ts.Statement): boolean {
    switch (s.kind) {
        case ts.SyntaxKind.InterfaceDeclaration:
        case ts.SyntaxKind.TypeAliasDeclaration:
            return true;
        case ts.SyntaxKind.ModuleDeclaration:
            return getModuleInstanceState((s as ts.ModuleDeclaration)) !== ModuleInstanceState.Instantiated;
        case ts.SyntaxKind.EnumDeclaration:
            return ts.hasModifier(s, ts.ModifierFlags.Const);
        default:
            return false;
    }
}
/* @internal */
export function isExportsOrModuleExportsOrAlias(sourceFile: ts.SourceFile, node: ts.Expression): boolean {
    let i = 0;
    const q = [node];
    while (q.length && i < 100) {
        i++;
        node = q.shift()!;
        if (ts.isExportsIdentifier(node) || ts.isModuleExportsAccessExpression(node)) {
            return true;
        }
        else if (ts.isIdentifier(node)) {
            const symbol = lookupSymbolForNameWorker(sourceFile, node.escapedText);
            if (!!symbol && !!symbol.valueDeclaration && ts.isVariableDeclaration(symbol.valueDeclaration) && !!symbol.valueDeclaration.initializer) {
                const init = symbol.valueDeclaration.initializer;
                q.push(init);
                if (ts.isAssignmentExpression(init, /*excludeCompoundAssignment*/ true)) {
                    q.push(init.left);
                    q.push(init.right);
                }
            }
        }
    }
    return false;
}
/* @internal */
function lookupSymbolForNameWorker(container: ts.Node, name: ts.__String): ts.Symbol | undefined {
    const local = container.locals && container.locals.get(name);
    if (local) {
        return local.exportSymbol || local;
    }
    if (ts.isSourceFile(container) && container.jsGlobalAugmentations && container.jsGlobalAugmentations.has(name)) {
        return container.jsGlobalAugmentations.get(name);
    }
    return container.symbol && container.symbol.exports && container.symbol.exports.get(name);
}
/**
 * Computes the transform flags for a node, given the transform flags of its subtree
 *
 * @param node The node to analyze
 * @param subtreeFlags Transform flags computed for this node's subtree
 */
/* @internal */
export function computeTransformFlagsForNode(node: ts.Node, subtreeFlags: ts.TransformFlags): ts.TransformFlags {
    const kind = node.kind;
    switch (kind) {
        case ts.SyntaxKind.CallExpression:
            return computeCallExpression((<ts.CallExpression>node), subtreeFlags);
        case ts.SyntaxKind.NewExpression:
            return computeNewExpression((<ts.NewExpression>node), subtreeFlags);
        case ts.SyntaxKind.ModuleDeclaration:
            return computeModuleDeclaration((<ts.ModuleDeclaration>node), subtreeFlags);
        case ts.SyntaxKind.ParenthesizedExpression:
            return computeParenthesizedExpression((<ts.ParenthesizedExpression>node), subtreeFlags);
        case ts.SyntaxKind.BinaryExpression:
            return computeBinaryExpression((<ts.BinaryExpression>node), subtreeFlags);
        case ts.SyntaxKind.ExpressionStatement:
            return computeExpressionStatement((<ts.ExpressionStatement>node), subtreeFlags);
        case ts.SyntaxKind.Parameter:
            return computeParameter((<ts.ParameterDeclaration>node), subtreeFlags);
        case ts.SyntaxKind.ArrowFunction:
            return computeArrowFunction((<ts.ArrowFunction>node), subtreeFlags);
        case ts.SyntaxKind.FunctionExpression:
            return computeFunctionExpression((<ts.FunctionExpression>node), subtreeFlags);
        case ts.SyntaxKind.FunctionDeclaration:
            return computeFunctionDeclaration((<ts.FunctionDeclaration>node), subtreeFlags);
        case ts.SyntaxKind.VariableDeclaration:
            return computeVariableDeclaration((<ts.VariableDeclaration>node), subtreeFlags);
        case ts.SyntaxKind.VariableDeclarationList:
            return computeVariableDeclarationList((<ts.VariableDeclarationList>node), subtreeFlags);
        case ts.SyntaxKind.VariableStatement:
            return computeVariableStatement((<ts.VariableStatement>node), subtreeFlags);
        case ts.SyntaxKind.LabeledStatement:
            return computeLabeledStatement((<ts.LabeledStatement>node), subtreeFlags);
        case ts.SyntaxKind.ClassDeclaration:
            return computeClassDeclaration((<ts.ClassDeclaration>node), subtreeFlags);
        case ts.SyntaxKind.ClassExpression:
            return computeClassExpression((<ts.ClassExpression>node), subtreeFlags);
        case ts.SyntaxKind.HeritageClause:
            return computeHeritageClause((<ts.HeritageClause>node), subtreeFlags);
        case ts.SyntaxKind.CatchClause:
            return computeCatchClause((<ts.CatchClause>node), subtreeFlags);
        case ts.SyntaxKind.ExpressionWithTypeArguments:
            return computeExpressionWithTypeArguments((<ts.ExpressionWithTypeArguments>node), subtreeFlags);
        case ts.SyntaxKind.Constructor:
            return computeConstructor((<ts.ConstructorDeclaration>node), subtreeFlags);
        case ts.SyntaxKind.PropertyDeclaration:
            return computePropertyDeclaration((<ts.PropertyDeclaration>node), subtreeFlags);
        case ts.SyntaxKind.MethodDeclaration:
            return computeMethod((<ts.MethodDeclaration>node), subtreeFlags);
        case ts.SyntaxKind.GetAccessor:
        case ts.SyntaxKind.SetAccessor:
            return computeAccessor((<ts.AccessorDeclaration>node), subtreeFlags);
        case ts.SyntaxKind.ImportEqualsDeclaration:
            return computeImportEquals((<ts.ImportEqualsDeclaration>node), subtreeFlags);
        case ts.SyntaxKind.PropertyAccessExpression:
            return computePropertyAccess((<ts.PropertyAccessExpression>node), subtreeFlags);
        case ts.SyntaxKind.ElementAccessExpression:
            return computeElementAccess((<ts.ElementAccessExpression>node), subtreeFlags);
        default:
            return computeOther(node, kind, subtreeFlags);
    }
}
/* @internal */
function computeCallExpression(node: ts.CallExpression, subtreeFlags: ts.TransformFlags) {
    let transformFlags = subtreeFlags;
    const callee = ts.skipOuterExpressions(node.expression);
    const expression = node.expression;
    if (node.flags & ts.NodeFlags.OptionalChain) {
        transformFlags |= ts.TransformFlags.ContainsESNext;
    }
    if (node.typeArguments) {
        transformFlags |= ts.TransformFlags.AssertTypeScript;
    }
    if (subtreeFlags & ts.TransformFlags.ContainsRestOrSpread || ts.isSuperOrSuperProperty(callee)) {
        // If the this node contains a SpreadExpression, or is a super call, then it is an ES6
        // node.
        transformFlags |= ts.TransformFlags.AssertES2015;
        if (ts.isSuperProperty(callee)) {
            transformFlags |= ts.TransformFlags.ContainsLexicalThis;
        }
    }
    if (expression.kind === ts.SyntaxKind.ImportKeyword) {
        transformFlags |= ts.TransformFlags.ContainsDynamicImport;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.ArrayLiteralOrCallOrNewExcludes;
}
/* @internal */
function computeNewExpression(node: ts.NewExpression, subtreeFlags: ts.TransformFlags) {
    let transformFlags = subtreeFlags;
    if (node.typeArguments) {
        transformFlags |= ts.TransformFlags.AssertTypeScript;
    }
    if (subtreeFlags & ts.TransformFlags.ContainsRestOrSpread) {
        // If the this node contains a SpreadElementExpression then it is an ES6
        // node.
        transformFlags |= ts.TransformFlags.AssertES2015;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.ArrayLiteralOrCallOrNewExcludes;
}
/* @internal */
function computeBinaryExpression(node: ts.BinaryExpression, subtreeFlags: ts.TransformFlags) {
    let transformFlags = subtreeFlags;
    const operatorTokenKind = node.operatorToken.kind;
    const leftKind = node.left.kind;
    if (operatorTokenKind === ts.SyntaxKind.QuestionQuestionToken) {
        transformFlags |= ts.TransformFlags.AssertESNext;
    }
    else if (operatorTokenKind === ts.SyntaxKind.EqualsToken && leftKind === ts.SyntaxKind.ObjectLiteralExpression) {
        // Destructuring object assignments with are ES2015 syntax
        // and possibly ES2018 if they contain rest
        transformFlags |= ts.TransformFlags.AssertES2018 | ts.TransformFlags.AssertES2015 | ts.TransformFlags.AssertDestructuringAssignment;
    }
    else if (operatorTokenKind === ts.SyntaxKind.EqualsToken && leftKind === ts.SyntaxKind.ArrayLiteralExpression) {
        // Destructuring assignments are ES2015 syntax.
        transformFlags |= ts.TransformFlags.AssertES2015 | ts.TransformFlags.AssertDestructuringAssignment;
    }
    else if (operatorTokenKind === ts.SyntaxKind.AsteriskAsteriskToken
        || operatorTokenKind === ts.SyntaxKind.AsteriskAsteriskEqualsToken) {
        // Exponentiation is ES2016 syntax.
        transformFlags |= ts.TransformFlags.AssertES2016;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.NodeExcludes;
}
/* @internal */
function computeParameter(node: ts.ParameterDeclaration, subtreeFlags: ts.TransformFlags) {
    let transformFlags = subtreeFlags;
    const name = node.name;
    const initializer = node.initializer;
    const dotDotDotToken = node.dotDotDotToken;
    // The '?' token, type annotations, decorators, and 'this' parameters are TypeSCript
    // syntax.
    if (node.questionToken
        || node.type
        || (subtreeFlags & ts.TransformFlags.ContainsTypeScriptClassSyntax && ts.some(node.decorators))
        || ts.isThisIdentifier(name)) {
        transformFlags |= ts.TransformFlags.AssertTypeScript;
    }
    // If a parameter has an accessibility modifier, then it is TypeScript syntax.
    if (ts.hasModifier(node, ts.ModifierFlags.ParameterPropertyModifier)) {
        transformFlags |= ts.TransformFlags.AssertTypeScript | ts.TransformFlags.ContainsTypeScriptClassSyntax;
    }
    // parameters with object rest destructuring are ES2018 syntax
    if (subtreeFlags & ts.TransformFlags.ContainsObjectRestOrSpread) {
        transformFlags |= ts.TransformFlags.AssertES2018;
    }
    // If a parameter has an initializer, a binding pattern or a dotDotDot token, then
    // it is ES6 syntax and its container must emit default value assignments or parameter destructuring downlevel.
    if (subtreeFlags & ts.TransformFlags.ContainsBindingPattern || initializer || dotDotDotToken) {
        transformFlags |= ts.TransformFlags.AssertES2015;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.ParameterExcludes;
}
/* @internal */
function computeParenthesizedExpression(node: ts.ParenthesizedExpression, subtreeFlags: ts.TransformFlags) {
    let transformFlags = subtreeFlags;
    const expression = node.expression;
    const expressionKind = expression.kind;
    // If the node is synthesized, it means the emitter put the parentheses there,
    // not the user. If we didn't want them, the emitter would not have put them
    // there.
    if (expressionKind === ts.SyntaxKind.AsExpression
        || expressionKind === ts.SyntaxKind.TypeAssertionExpression) {
        transformFlags |= ts.TransformFlags.AssertTypeScript;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.OuterExpressionExcludes;
}
/* @internal */
function computeClassDeclaration(node: ts.ClassDeclaration, subtreeFlags: ts.TransformFlags) {
    let transformFlags: ts.TransformFlags;
    if (ts.hasModifier(node, ts.ModifierFlags.Ambient)) {
        // An ambient declaration is TypeScript syntax.
        transformFlags = ts.TransformFlags.AssertTypeScript;
    }
    else {
        // A ClassDeclaration is ES6 syntax.
        transformFlags = subtreeFlags | ts.TransformFlags.AssertES2015;
        // A class with a parameter property assignment or decorator is TypeScript syntax.
        // An exported declaration may be TypeScript syntax, but is handled by the visitor
        // for a namespace declaration.
        if ((subtreeFlags & ts.TransformFlags.ContainsTypeScriptClassSyntax)
            || node.typeParameters) {
            transformFlags |= ts.TransformFlags.AssertTypeScript;
        }
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.ClassExcludes;
}
/* @internal */
function computeClassExpression(node: ts.ClassExpression, subtreeFlags: ts.TransformFlags) {
    // A ClassExpression is ES6 syntax.
    let transformFlags = subtreeFlags | ts.TransformFlags.AssertES2015;
    // A class with a parameter property assignment or decorator is TypeScript syntax.
    if (subtreeFlags & ts.TransformFlags.ContainsTypeScriptClassSyntax
        || node.typeParameters) {
        transformFlags |= ts.TransformFlags.AssertTypeScript;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.ClassExcludes;
}
/* @internal */
function computeHeritageClause(node: ts.HeritageClause, subtreeFlags: ts.TransformFlags) {
    let transformFlags = subtreeFlags;
    switch (node.token) {
        case ts.SyntaxKind.ExtendsKeyword:
            // An `extends` HeritageClause is ES6 syntax.
            transformFlags |= ts.TransformFlags.AssertES2015;
            break;
        case ts.SyntaxKind.ImplementsKeyword:
            // An `implements` HeritageClause is TypeScript syntax.
            transformFlags |= ts.TransformFlags.AssertTypeScript;
            break;
        default:
            ts.Debug.fail("Unexpected token for heritage clause");
            break;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.NodeExcludes;
}
/* @internal */
function computeCatchClause(node: ts.CatchClause, subtreeFlags: ts.TransformFlags) {
    let transformFlags = subtreeFlags;
    if (!node.variableDeclaration) {
        transformFlags |= ts.TransformFlags.AssertES2019;
    }
    else if (ts.isBindingPattern(node.variableDeclaration.name)) {
        transformFlags |= ts.TransformFlags.AssertES2015;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.CatchClauseExcludes;
}
/* @internal */
function computeExpressionWithTypeArguments(node: ts.ExpressionWithTypeArguments, subtreeFlags: ts.TransformFlags) {
    // An ExpressionWithTypeArguments is ES6 syntax, as it is used in the
    // extends clause of a class.
    let transformFlags = subtreeFlags | ts.TransformFlags.AssertES2015;
    // If an ExpressionWithTypeArguments contains type arguments, then it
    // is TypeScript syntax.
    if (node.typeArguments) {
        transformFlags |= ts.TransformFlags.AssertTypeScript;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.NodeExcludes;
}
/* @internal */
function computeConstructor(node: ts.ConstructorDeclaration, subtreeFlags: ts.TransformFlags) {
    let transformFlags = subtreeFlags;
    // TypeScript-specific modifiers and overloads are TypeScript syntax
    if (ts.hasModifier(node, ts.ModifierFlags.TypeScriptModifier)
        || !node.body) {
        transformFlags |= ts.TransformFlags.AssertTypeScript;
    }
    // function declarations with object rest destructuring are ES2018 syntax
    if (subtreeFlags & ts.TransformFlags.ContainsObjectRestOrSpread) {
        transformFlags |= ts.TransformFlags.AssertES2018;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.ConstructorExcludes;
}
/* @internal */
function computeMethod(node: ts.MethodDeclaration, subtreeFlags: ts.TransformFlags) {
    // A MethodDeclaration is ES6 syntax.
    let transformFlags = subtreeFlags | ts.TransformFlags.AssertES2015;
    // Decorators, TypeScript-specific modifiers, type parameters, type annotations, and
    // overloads are TypeScript syntax.
    if (node.decorators
        || ts.hasModifier(node, ts.ModifierFlags.TypeScriptModifier)
        || node.typeParameters
        || node.type
        || !node.body
        || node.questionToken) {
        transformFlags |= ts.TransformFlags.AssertTypeScript;
    }
    // function declarations with object rest destructuring are ES2018 syntax
    if (subtreeFlags & ts.TransformFlags.ContainsObjectRestOrSpread) {
        transformFlags |= ts.TransformFlags.AssertES2018;
    }
    // An async method declaration is ES2017 syntax.
    if (ts.hasModifier(node, ts.ModifierFlags.Async)) {
        transformFlags |= node.asteriskToken ? ts.TransformFlags.AssertES2018 : ts.TransformFlags.AssertES2017;
    }
    if (node.asteriskToken) {
        transformFlags |= ts.TransformFlags.AssertGenerator;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return propagatePropertyNameFlags(node.name, transformFlags & ~ts.TransformFlags.MethodOrAccessorExcludes);
}
/* @internal */
function computeAccessor(node: ts.AccessorDeclaration, subtreeFlags: ts.TransformFlags) {
    let transformFlags = subtreeFlags;
    // Decorators, TypeScript-specific modifiers, type annotations, and overloads are
    // TypeScript syntax.
    if (node.decorators
        || ts.hasModifier(node, ts.ModifierFlags.TypeScriptModifier)
        || node.type
        || !node.body) {
        transformFlags |= ts.TransformFlags.AssertTypeScript;
    }
    // function declarations with object rest destructuring are ES2018 syntax
    if (subtreeFlags & ts.TransformFlags.ContainsObjectRestOrSpread) {
        transformFlags |= ts.TransformFlags.AssertES2018;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return propagatePropertyNameFlags(node.name, transformFlags & ~ts.TransformFlags.MethodOrAccessorExcludes);
}
/* @internal */
function computePropertyDeclaration(node: ts.PropertyDeclaration, subtreeFlags: ts.TransformFlags) {
    let transformFlags = subtreeFlags | ts.TransformFlags.ContainsClassFields;
    // Decorators, TypeScript-specific modifiers, and type annotations are TypeScript syntax.
    if (ts.some(node.decorators) || ts.hasModifier(node, ts.ModifierFlags.TypeScriptModifier) || node.type || node.questionToken || node.exclamationToken) {
        transformFlags |= ts.TransformFlags.AssertTypeScript;
    }
    // Hoisted variables related to class properties should live within the TypeScript class wrapper.
    if (ts.isComputedPropertyName(node.name) || (ts.hasStaticModifier(node) && node.initializer)) {
        transformFlags |= ts.TransformFlags.ContainsTypeScriptClassSyntax;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return propagatePropertyNameFlags(node.name, transformFlags & ~ts.TransformFlags.PropertyExcludes);
}
/* @internal */
function computeFunctionDeclaration(node: ts.FunctionDeclaration, subtreeFlags: ts.TransformFlags) {
    let transformFlags: ts.TransformFlags;
    const modifierFlags = ts.getModifierFlags(node);
    const body = node.body;
    if (!body || (modifierFlags & ts.ModifierFlags.Ambient)) {
        // An ambient declaration is TypeScript syntax.
        // A FunctionDeclaration without a body is an overload and is TypeScript syntax.
        transformFlags = ts.TransformFlags.AssertTypeScript;
    }
    else {
        transformFlags = subtreeFlags | ts.TransformFlags.ContainsHoistedDeclarationOrCompletion;
        // TypeScript-specific modifiers, type parameters, and type annotations are TypeScript
        // syntax.
        if (modifierFlags & ts.ModifierFlags.TypeScriptModifier
            || node.typeParameters
            || node.type) {
            transformFlags |= ts.TransformFlags.AssertTypeScript;
        }
        // An async function declaration is ES2017 syntax.
        if (modifierFlags & ts.ModifierFlags.Async) {
            transformFlags |= node.asteriskToken ? ts.TransformFlags.AssertES2018 : ts.TransformFlags.AssertES2017;
        }
        // function declarations with object rest destructuring are ES2018 syntax
        if (subtreeFlags & ts.TransformFlags.ContainsObjectRestOrSpread) {
            transformFlags |= ts.TransformFlags.AssertES2018;
        }
        // If a FunctionDeclaration is generator function and is the body of a
        // transformed async function, then this node can be transformed to a
        // down-level generator.
        // Currently we do not support transforming any other generator functions
        // down level.
        if (node.asteriskToken) {
            transformFlags |= ts.TransformFlags.AssertGenerator;
        }
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.FunctionExcludes;
}
/* @internal */
function computeFunctionExpression(node: ts.FunctionExpression, subtreeFlags: ts.TransformFlags) {
    let transformFlags = subtreeFlags;
    // TypeScript-specific modifiers, type parameters, and type annotations are TypeScript
    // syntax.
    if (ts.hasModifier(node, ts.ModifierFlags.TypeScriptModifier)
        || node.typeParameters
        || node.type) {
        transformFlags |= ts.TransformFlags.AssertTypeScript;
    }
    // An async function expression is ES2017 syntax.
    if (ts.hasModifier(node, ts.ModifierFlags.Async)) {
        transformFlags |= node.asteriskToken ? ts.TransformFlags.AssertES2018 : ts.TransformFlags.AssertES2017;
    }
    // function expressions with object rest destructuring are ES2018 syntax
    if (subtreeFlags & ts.TransformFlags.ContainsObjectRestOrSpread) {
        transformFlags |= ts.TransformFlags.AssertES2018;
    }
    // If a FunctionExpression is generator function and is the body of a
    // transformed async function, then this node can be transformed to a
    // down-level generator.
    if (node.asteriskToken) {
        transformFlags |= ts.TransformFlags.AssertGenerator;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.FunctionExcludes;
}
/* @internal */
function computeArrowFunction(node: ts.ArrowFunction, subtreeFlags: ts.TransformFlags) {
    // An ArrowFunction is ES6 syntax, and excludes markers that should not escape the scope of an ArrowFunction.
    let transformFlags = subtreeFlags | ts.TransformFlags.AssertES2015;
    // TypeScript-specific modifiers, type parameters, and type annotations are TypeScript
    // syntax.
    if (ts.hasModifier(node, ts.ModifierFlags.TypeScriptModifier)
        || node.typeParameters
        || node.type) {
        transformFlags |= ts.TransformFlags.AssertTypeScript;
    }
    // An async arrow function is ES2017 syntax.
    if (ts.hasModifier(node, ts.ModifierFlags.Async)) {
        transformFlags |= ts.TransformFlags.AssertES2017;
    }
    // arrow functions with object rest destructuring are ES2018 syntax
    if (subtreeFlags & ts.TransformFlags.ContainsObjectRestOrSpread) {
        transformFlags |= ts.TransformFlags.AssertES2018;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.ArrowFunctionExcludes;
}
/* @internal */
function computePropertyAccess(node: ts.PropertyAccessExpression, subtreeFlags: ts.TransformFlags) {
    let transformFlags = subtreeFlags;
    if (node.flags & ts.NodeFlags.OptionalChain) {
        transformFlags |= ts.TransformFlags.ContainsESNext;
    }
    // If a PropertyAccessExpression starts with a super keyword, then it is
    // ES6 syntax, and requires a lexical `this` binding.
    if (node.expression.kind === ts.SyntaxKind.SuperKeyword) {
        // super inside of an async function requires hoisting the super access (ES2017).
        // same for super inside of an async generator, which is ES2018.
        transformFlags |= ts.TransformFlags.ContainsES2017 | ts.TransformFlags.ContainsES2018;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.PropertyAccessExcludes;
}
/* @internal */
function computeElementAccess(node: ts.ElementAccessExpression, subtreeFlags: ts.TransformFlags) {
    let transformFlags = subtreeFlags;
    if (node.flags & ts.NodeFlags.OptionalChain) {
        transformFlags |= ts.TransformFlags.ContainsESNext;
    }
    // If an ElementAccessExpression starts with a super keyword, then it is
    // ES6 syntax, and requires a lexical `this` binding.
    if (node.expression.kind === ts.SyntaxKind.SuperKeyword) {
        // super inside of an async function requires hoisting the super access (ES2017).
        // same for super inside of an async generator, which is ES2018.
        transformFlags |= ts.TransformFlags.ContainsES2017 | ts.TransformFlags.ContainsES2018;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.PropertyAccessExcludes;
}
/* @internal */
function computeVariableDeclaration(node: ts.VariableDeclaration, subtreeFlags: ts.TransformFlags) {
    let transformFlags = subtreeFlags;
    transformFlags |= ts.TransformFlags.AssertES2015 | ts.TransformFlags.ContainsBindingPattern; // TODO(rbuckton): Why are these set unconditionally?
    // A VariableDeclaration containing ObjectRest is ES2018 syntax
    if (subtreeFlags & ts.TransformFlags.ContainsObjectRestOrSpread) {
        transformFlags |= ts.TransformFlags.AssertES2018;
    }
    // Type annotations are TypeScript syntax.
    if (node.type || node.exclamationToken) {
        transformFlags |= ts.TransformFlags.AssertTypeScript;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.NodeExcludes;
}
/* @internal */
function computeVariableStatement(node: ts.VariableStatement, subtreeFlags: ts.TransformFlags) {
    let transformFlags: ts.TransformFlags;
    const declarationListTransformFlags = node.declarationList.transformFlags;
    // An ambient declaration is TypeScript syntax.
    if (ts.hasModifier(node, ts.ModifierFlags.Ambient)) {
        transformFlags = ts.TransformFlags.AssertTypeScript;
    }
    else {
        transformFlags = subtreeFlags;
        if (declarationListTransformFlags & ts.TransformFlags.ContainsBindingPattern) {
            transformFlags |= ts.TransformFlags.AssertES2015;
        }
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.NodeExcludes;
}
/* @internal */
function computeLabeledStatement(node: ts.LabeledStatement, subtreeFlags: ts.TransformFlags) {
    let transformFlags = subtreeFlags;
    // A labeled statement containing a block scoped binding *may* need to be transformed from ES6.
    if (subtreeFlags & ts.TransformFlags.ContainsBlockScopedBinding
        && ts.isIterationStatement(node, /*lookInLabeledStatements*/ true)) {
        transformFlags |= ts.TransformFlags.AssertES2015;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.NodeExcludes;
}
/* @internal */
function computeImportEquals(node: ts.ImportEqualsDeclaration, subtreeFlags: ts.TransformFlags) {
    let transformFlags = subtreeFlags;
    // An ImportEqualsDeclaration with a namespace reference is TypeScript.
    if (!ts.isExternalModuleImportEqualsDeclaration(node)) {
        transformFlags |= ts.TransformFlags.AssertTypeScript;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.NodeExcludes;
}
/* @internal */
function computeExpressionStatement(node: ts.ExpressionStatement, subtreeFlags: ts.TransformFlags) {
    const transformFlags = subtreeFlags;
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.NodeExcludes;
}
/* @internal */
function computeModuleDeclaration(node: ts.ModuleDeclaration, subtreeFlags: ts.TransformFlags) {
    let transformFlags = ts.TransformFlags.AssertTypeScript;
    const modifierFlags = ts.getModifierFlags(node);
    if ((modifierFlags & ts.ModifierFlags.Ambient) === 0) {
        transformFlags |= subtreeFlags;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.ModuleExcludes;
}
/* @internal */
function computeVariableDeclarationList(node: ts.VariableDeclarationList, subtreeFlags: ts.TransformFlags) {
    let transformFlags = subtreeFlags | ts.TransformFlags.ContainsHoistedDeclarationOrCompletion;
    if (subtreeFlags & ts.TransformFlags.ContainsBindingPattern) {
        transformFlags |= ts.TransformFlags.AssertES2015;
    }
    // If a VariableDeclarationList is `let` or `const`, then it is ES6 syntax.
    if (node.flags & ts.NodeFlags.BlockScoped) {
        transformFlags |= ts.TransformFlags.AssertES2015 | ts.TransformFlags.ContainsBlockScopedBinding;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~ts.TransformFlags.VariableDeclarationListExcludes;
}
/* @internal */
function computeOther(node: ts.Node, kind: ts.SyntaxKind, subtreeFlags: ts.TransformFlags) {
    // Mark transformations needed for each node
    let transformFlags = subtreeFlags;
    let excludeFlags = ts.TransformFlags.NodeExcludes;
    switch (kind) {
        case ts.SyntaxKind.AsyncKeyword:
        case ts.SyntaxKind.AwaitExpression:
            // async/await is ES2017 syntax, but may be ES2018 syntax (for async generators)
            transformFlags |= ts.TransformFlags.AssertES2018 | ts.TransformFlags.AssertES2017;
            break;
        case ts.SyntaxKind.TypeAssertionExpression:
        case ts.SyntaxKind.AsExpression:
        case ts.SyntaxKind.PartiallyEmittedExpression:
            // These nodes are TypeScript syntax.
            transformFlags |= ts.TransformFlags.AssertTypeScript;
            excludeFlags = ts.TransformFlags.OuterExpressionExcludes;
            break;
        case ts.SyntaxKind.PublicKeyword:
        case ts.SyntaxKind.PrivateKeyword:
        case ts.SyntaxKind.ProtectedKeyword:
        case ts.SyntaxKind.AbstractKeyword:
        case ts.SyntaxKind.DeclareKeyword:
        case ts.SyntaxKind.ConstKeyword:
        case ts.SyntaxKind.EnumDeclaration:
        case ts.SyntaxKind.EnumMember:
        case ts.SyntaxKind.NonNullExpression:
        case ts.SyntaxKind.ReadonlyKeyword:
            // These nodes are TypeScript syntax.
            transformFlags |= ts.TransformFlags.AssertTypeScript;
            break;
        case ts.SyntaxKind.JsxElement:
        case ts.SyntaxKind.JsxSelfClosingElement:
        case ts.SyntaxKind.JsxOpeningElement:
        case ts.SyntaxKind.JsxText:
        case ts.SyntaxKind.JsxClosingElement:
        case ts.SyntaxKind.JsxFragment:
        case ts.SyntaxKind.JsxOpeningFragment:
        case ts.SyntaxKind.JsxClosingFragment:
        case ts.SyntaxKind.JsxAttribute:
        case ts.SyntaxKind.JsxAttributes:
        case ts.SyntaxKind.JsxSpreadAttribute:
        case ts.SyntaxKind.JsxExpression:
            // These nodes are Jsx syntax.
            transformFlags |= ts.TransformFlags.AssertJsx;
            break;
        case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
        case ts.SyntaxKind.TemplateHead:
        case ts.SyntaxKind.TemplateMiddle:
        case ts.SyntaxKind.TemplateTail:
        case ts.SyntaxKind.TemplateExpression:
        case ts.SyntaxKind.TaggedTemplateExpression:
        case ts.SyntaxKind.ShorthandPropertyAssignment:
        case ts.SyntaxKind.StaticKeyword:
        case ts.SyntaxKind.MetaProperty:
            // These nodes are ES6 syntax.
            transformFlags |= ts.TransformFlags.AssertES2015;
            break;
        case ts.SyntaxKind.StringLiteral:
            if ((<ts.StringLiteral>node).hasExtendedUnicodeEscape) {
                transformFlags |= ts.TransformFlags.AssertES2015;
            }
            break;
        case ts.SyntaxKind.NumericLiteral:
            if ((<ts.NumericLiteral>node).numericLiteralFlags & ts.TokenFlags.BinaryOrOctalSpecifier) {
                transformFlags |= ts.TransformFlags.AssertES2015;
            }
            break;
        case ts.SyntaxKind.BigIntLiteral:
            transformFlags |= ts.TransformFlags.AssertESNext;
            break;
        case ts.SyntaxKind.ForOfStatement:
            // This node is either ES2015 syntax or ES2017 syntax (if it is a for-await-of).
            if ((<ts.ForOfStatement>node).awaitModifier) {
                transformFlags |= ts.TransformFlags.AssertES2018;
            }
            transformFlags |= ts.TransformFlags.AssertES2015;
            break;
        case ts.SyntaxKind.YieldExpression:
            // This node is either ES2015 syntax (in a generator) or ES2017 syntax (in an async
            // generator).
            transformFlags |= ts.TransformFlags.AssertES2018 | ts.TransformFlags.AssertES2015 | ts.TransformFlags.ContainsYield;
            break;
        case ts.SyntaxKind.AnyKeyword:
        case ts.SyntaxKind.NumberKeyword:
        case ts.SyntaxKind.BigIntKeyword:
        case ts.SyntaxKind.NeverKeyword:
        case ts.SyntaxKind.ObjectKeyword:
        case ts.SyntaxKind.StringKeyword:
        case ts.SyntaxKind.BooleanKeyword:
        case ts.SyntaxKind.SymbolKeyword:
        case ts.SyntaxKind.VoidKeyword:
        case ts.SyntaxKind.TypeParameter:
        case ts.SyntaxKind.PropertySignature:
        case ts.SyntaxKind.MethodSignature:
        case ts.SyntaxKind.CallSignature:
        case ts.SyntaxKind.ConstructSignature:
        case ts.SyntaxKind.IndexSignature:
        case ts.SyntaxKind.TypePredicate:
        case ts.SyntaxKind.TypeReference:
        case ts.SyntaxKind.FunctionType:
        case ts.SyntaxKind.ConstructorType:
        case ts.SyntaxKind.TypeQuery:
        case ts.SyntaxKind.TypeLiteral:
        case ts.SyntaxKind.ArrayType:
        case ts.SyntaxKind.TupleType:
        case ts.SyntaxKind.OptionalType:
        case ts.SyntaxKind.RestType:
        case ts.SyntaxKind.UnionType:
        case ts.SyntaxKind.IntersectionType:
        case ts.SyntaxKind.ConditionalType:
        case ts.SyntaxKind.InferType:
        case ts.SyntaxKind.ParenthesizedType:
        case ts.SyntaxKind.InterfaceDeclaration:
        case ts.SyntaxKind.TypeAliasDeclaration:
        case ts.SyntaxKind.ThisType:
        case ts.SyntaxKind.TypeOperator:
        case ts.SyntaxKind.IndexedAccessType:
        case ts.SyntaxKind.MappedType:
        case ts.SyntaxKind.LiteralType:
        case ts.SyntaxKind.NamespaceExportDeclaration:
            // Types and signatures are TypeScript syntax, and exclude all other facts.
            transformFlags = ts.TransformFlags.AssertTypeScript;
            excludeFlags = ts.TransformFlags.TypeExcludes;
            break;
        case ts.SyntaxKind.ComputedPropertyName:
            // Even though computed property names are ES6, we don't treat them as such.
            // This is so that they can flow through PropertyName transforms unaffected.
            // Instead, we mark the container as ES6, so that it can properly handle the transform.
            transformFlags |= ts.TransformFlags.ContainsComputedPropertyName;
            break;
        case ts.SyntaxKind.SpreadElement:
            transformFlags |= ts.TransformFlags.AssertES2015 | ts.TransformFlags.ContainsRestOrSpread;
            break;
        case ts.SyntaxKind.SpreadAssignment:
            transformFlags |= ts.TransformFlags.AssertES2018 | ts.TransformFlags.ContainsObjectRestOrSpread;
            break;
        case ts.SyntaxKind.SuperKeyword:
            // This node is ES6 syntax.
            transformFlags |= ts.TransformFlags.AssertES2015;
            excludeFlags = ts.TransformFlags.OuterExpressionExcludes; // must be set to persist `Super`
            break;
        case ts.SyntaxKind.ThisKeyword:
            // Mark this node and its ancestors as containing a lexical `this` keyword.
            transformFlags |= ts.TransformFlags.ContainsLexicalThis;
            break;
        case ts.SyntaxKind.ObjectBindingPattern:
            transformFlags |= ts.TransformFlags.AssertES2015 | ts.TransformFlags.ContainsBindingPattern;
            if (subtreeFlags & ts.TransformFlags.ContainsRestOrSpread) {
                transformFlags |= ts.TransformFlags.AssertES2018 | ts.TransformFlags.ContainsObjectRestOrSpread;
            }
            excludeFlags = ts.TransformFlags.BindingPatternExcludes;
            break;
        case ts.SyntaxKind.ArrayBindingPattern:
            transformFlags |= ts.TransformFlags.AssertES2015 | ts.TransformFlags.ContainsBindingPattern;
            excludeFlags = ts.TransformFlags.BindingPatternExcludes;
            break;
        case ts.SyntaxKind.BindingElement:
            transformFlags |= ts.TransformFlags.AssertES2015;
            if ((<ts.BindingElement>node).dotDotDotToken) {
                transformFlags |= ts.TransformFlags.ContainsRestOrSpread;
            }
            break;
        case ts.SyntaxKind.Decorator:
            // This node is TypeScript syntax, and marks its container as also being TypeScript syntax.
            transformFlags |= ts.TransformFlags.AssertTypeScript | ts.TransformFlags.ContainsTypeScriptClassSyntax;
            break;
        case ts.SyntaxKind.ObjectLiteralExpression:
            excludeFlags = ts.TransformFlags.ObjectLiteralExcludes;
            if (subtreeFlags & ts.TransformFlags.ContainsComputedPropertyName) {
                // If an ObjectLiteralExpression contains a ComputedPropertyName, then it
                // is an ES6 node.
                transformFlags |= ts.TransformFlags.AssertES2015;
            }
            if (subtreeFlags & ts.TransformFlags.ContainsObjectRestOrSpread) {
                // If an ObjectLiteralExpression contains a spread element, then it
                // is an ES2018 node.
                transformFlags |= ts.TransformFlags.AssertES2018;
            }
            break;
        case ts.SyntaxKind.ArrayLiteralExpression:
            excludeFlags = ts.TransformFlags.ArrayLiteralOrCallOrNewExcludes;
            break;
        case ts.SyntaxKind.DoStatement:
        case ts.SyntaxKind.WhileStatement:
        case ts.SyntaxKind.ForStatement:
        case ts.SyntaxKind.ForInStatement:
            // A loop containing a block scoped binding *may* need to be transformed from ES6.
            if (subtreeFlags & ts.TransformFlags.ContainsBlockScopedBinding) {
                transformFlags |= ts.TransformFlags.AssertES2015;
            }
            break;
        case ts.SyntaxKind.SourceFile:
            break;
        case ts.SyntaxKind.ReturnStatement:
            // Return statements may require an `await` in ES2018.
            transformFlags |= ts.TransformFlags.ContainsHoistedDeclarationOrCompletion | ts.TransformFlags.AssertES2018;
            break;
        case ts.SyntaxKind.ContinueStatement:
        case ts.SyntaxKind.BreakStatement:
            transformFlags |= ts.TransformFlags.ContainsHoistedDeclarationOrCompletion;
            break;
    }
    node.transformFlags = transformFlags | ts.TransformFlags.HasComputedFlags;
    return transformFlags & ~excludeFlags;
}
/* @internal */
function propagatePropertyNameFlags(node: ts.PropertyName, transformFlags: ts.TransformFlags) {
    return transformFlags | (node.transformFlags & ts.TransformFlags.PropertyNamePropagatingFlags);
}
/**
 * Gets the transform flags to exclude when unioning the transform flags of a subtree.
 *
 * NOTE: This needs to be kept up-to-date with the exclusions used in `computeTransformFlagsForNode`.
 *       For performance reasons, `computeTransformFlagsForNode` uses local constant values rather
 *       than calling this function.
 */
/* @internal */
export function getTransformFlagsSubtreeExclusions(kind: ts.SyntaxKind) {
    if (kind >= ts.SyntaxKind.FirstTypeNode && kind <= ts.SyntaxKind.LastTypeNode) {
        return ts.TransformFlags.TypeExcludes;
    }
    switch (kind) {
        case ts.SyntaxKind.CallExpression:
        case ts.SyntaxKind.NewExpression:
        case ts.SyntaxKind.ArrayLiteralExpression:
            return ts.TransformFlags.ArrayLiteralOrCallOrNewExcludes;
        case ts.SyntaxKind.ModuleDeclaration:
            return ts.TransformFlags.ModuleExcludes;
        case ts.SyntaxKind.Parameter:
            return ts.TransformFlags.ParameterExcludes;
        case ts.SyntaxKind.ArrowFunction:
            return ts.TransformFlags.ArrowFunctionExcludes;
        case ts.SyntaxKind.FunctionExpression:
        case ts.SyntaxKind.FunctionDeclaration:
            return ts.TransformFlags.FunctionExcludes;
        case ts.SyntaxKind.VariableDeclarationList:
            return ts.TransformFlags.VariableDeclarationListExcludes;
        case ts.SyntaxKind.ClassDeclaration:
        case ts.SyntaxKind.ClassExpression:
            return ts.TransformFlags.ClassExcludes;
        case ts.SyntaxKind.Constructor:
            return ts.TransformFlags.ConstructorExcludes;
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.GetAccessor:
        case ts.SyntaxKind.SetAccessor:
            return ts.TransformFlags.MethodOrAccessorExcludes;
        case ts.SyntaxKind.AnyKeyword:
        case ts.SyntaxKind.NumberKeyword:
        case ts.SyntaxKind.BigIntKeyword:
        case ts.SyntaxKind.NeverKeyword:
        case ts.SyntaxKind.StringKeyword:
        case ts.SyntaxKind.ObjectKeyword:
        case ts.SyntaxKind.BooleanKeyword:
        case ts.SyntaxKind.SymbolKeyword:
        case ts.SyntaxKind.VoidKeyword:
        case ts.SyntaxKind.TypeParameter:
        case ts.SyntaxKind.PropertySignature:
        case ts.SyntaxKind.MethodSignature:
        case ts.SyntaxKind.CallSignature:
        case ts.SyntaxKind.ConstructSignature:
        case ts.SyntaxKind.IndexSignature:
        case ts.SyntaxKind.InterfaceDeclaration:
        case ts.SyntaxKind.TypeAliasDeclaration:
            return ts.TransformFlags.TypeExcludes;
        case ts.SyntaxKind.ObjectLiteralExpression:
            return ts.TransformFlags.ObjectLiteralExcludes;
        case ts.SyntaxKind.CatchClause:
            return ts.TransformFlags.CatchClauseExcludes;
        case ts.SyntaxKind.ObjectBindingPattern:
        case ts.SyntaxKind.ArrayBindingPattern:
            return ts.TransformFlags.BindingPatternExcludes;
        case ts.SyntaxKind.TypeAssertionExpression:
        case ts.SyntaxKind.AsExpression:
        case ts.SyntaxKind.PartiallyEmittedExpression:
        case ts.SyntaxKind.ParenthesizedExpression:
        case ts.SyntaxKind.SuperKeyword:
            return ts.TransformFlags.OuterExpressionExcludes;
        case ts.SyntaxKind.PropertyAccessExpression:
        case ts.SyntaxKind.ElementAccessExpression:
            return ts.TransformFlags.PropertyAccessExcludes;
        default:
            return ts.TransformFlags.NodeExcludes;
    }
}
/**
 * "Binds" JSDoc nodes in TypeScript code.
 * Since we will never create symbols for JSDoc, we just set parent pointers instead.
 */
/* @internal */
function setParentPointers(parent: ts.Node, child: ts.Node): void {
    child.parent = parent;
    ts.forEachChild(child, grandchild => setParentPointers(child, grandchild));
}
