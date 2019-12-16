namespace ts {
    export function isExternalModuleNameRelative(moduleName: string): boolean {
        // TypeScript 1.0 spec (April 2014): 11.2.1
        // An external module name is "relative" if the first term is "." or "..".
        // Update: We also consider a path like `C:\foo.ts` "relative" because we do not search for it in `node_modules` or treat it as an ambient module.
        return ts.pathIsRelative(moduleName) || ts.isRootedDiskPath(moduleName);
    }
    export function sortAndDeduplicateDiagnostics<T extends ts.Diagnostic>(diagnostics: readonly T[]): ts.SortedReadonlyArray<T> {
        return ts.sortAndDeduplicate<T>(diagnostics, ts.compareDiagnostics);
    }
    export function getDefaultLibFileName(options: ts.CompilerOptions): string {
        switch (options.target) {
            case ts.ScriptTarget.ESNext:
                return "lib.esnext.full.d.ts";
            case ts.ScriptTarget.ES2020:
                return "lib.es2020.full.d.ts";
            case ts.ScriptTarget.ES2019:
                return "lib.es2019.full.d.ts";
            case ts.ScriptTarget.ES2018:
                return "lib.es2018.full.d.ts";
            case ts.ScriptTarget.ES2017:
                return "lib.es2017.full.d.ts";
            case ts.ScriptTarget.ES2016:
                return "lib.es2016.full.d.ts";
            case ts.ScriptTarget.ES2015:
                return "lib.es6.d.ts"; // We don't use lib.es2015.full.d.ts due to breaking change.
            default:
                return "lib.d.ts";
        }
    }
    export function textSpanEnd(span: ts.TextSpan) {
        return span.start + span.length;
    }
    export function textSpanIsEmpty(span: ts.TextSpan) {
        return span.length === 0;
    }
    export function textSpanContainsPosition(span: ts.TextSpan, position: number) {
        return position >= span.start && position < textSpanEnd(span);
    }
    /* @internal */
    export function textRangeContainsPositionInclusive(span: ts.TextRange, position: number): boolean {
        return position >= span.pos && position <= span.end;
    }
    // Returns true if 'span' contains 'other'.
    export function textSpanContainsTextSpan(span: ts.TextSpan, other: ts.TextSpan) {
        return other.start >= span.start && textSpanEnd(other) <= textSpanEnd(span);
    }
    export function textSpanOverlapsWith(span: ts.TextSpan, other: ts.TextSpan) {
        return textSpanOverlap(span, other) !== undefined;
    }
    export function textSpanOverlap(span1: ts.TextSpan, span2: ts.TextSpan): ts.TextSpan | undefined {
        const overlap = textSpanIntersection(span1, span2);
        return overlap && overlap.length === 0 ? undefined : overlap;
    }
    export function textSpanIntersectsWithTextSpan(span: ts.TextSpan, other: ts.TextSpan) {
        return decodedTextSpanIntersectsWith(span.start, span.length, other.start, other.length);
    }
    export function textSpanIntersectsWith(span: ts.TextSpan, start: number, length: number) {
        return decodedTextSpanIntersectsWith(span.start, span.length, start, length);
    }
    export function decodedTextSpanIntersectsWith(start1: number, length1: number, start2: number, length2: number) {
        const end1 = start1 + length1;
        const end2 = start2 + length2;
        return start2 <= end1 && end2 >= start1;
    }
    export function textSpanIntersectsWithPosition(span: ts.TextSpan, position: number) {
        return position <= textSpanEnd(span) && position >= span.start;
    }
    export function textSpanIntersection(span1: ts.TextSpan, span2: ts.TextSpan): ts.TextSpan | undefined {
        const start = Math.max(span1.start, span2.start);
        const end = Math.min(textSpanEnd(span1), textSpanEnd(span2));
        return start <= end ? createTextSpanFromBounds(start, end) : undefined;
    }
    export function createTextSpan(start: number, length: number): ts.TextSpan {
        if (start < 0) {
            throw new Error("start < 0");
        }
        if (length < 0) {
            throw new Error("length < 0");
        }
        return { start, length };
    }
    export function createTextSpanFromBounds(start: number, end: number) {
        return createTextSpan(start, end - start);
    }
    export function textChangeRangeNewSpan(range: ts.TextChangeRange) {
        return createTextSpan(range.span.start, range.newLength);
    }
    export function textChangeRangeIsUnchanged(range: ts.TextChangeRange) {
        return textSpanIsEmpty(range.span) && range.newLength === 0;
    }
    export function createTextChangeRange(span: ts.TextSpan, newLength: number): ts.TextChangeRange {
        if (newLength < 0) {
            throw new Error("newLength < 0");
        }
        return { span, newLength };
    }
    export let unchangedTextChangeRange = createTextChangeRange(createTextSpan(0, 0), 0); // eslint-disable-line prefer-const
    /**
     * Called to merge all the changes that occurred across several versions of a script snapshot
     * into a single change.  i.e. if a user keeps making successive edits to a script we will
     * have a text change from V1 to V2, V2 to V3, ..., Vn.
     *
     * This function will then merge those changes into a single change range valid between V1 and
     * Vn.
     */
    export function collapseTextChangeRangesAcrossMultipleVersions(changes: readonly ts.TextChangeRange[]): ts.TextChangeRange {
        if (changes.length === 0) {
            return unchangedTextChangeRange;
        }
        if (changes.length === 1) {
            return changes[0];
        }
        // We change from talking about { { oldStart, oldLength }, newLength } to { oldStart, oldEnd, newEnd }
        // as it makes things much easier to reason about.
        const change0 = changes[0];
        let oldStartN = change0.span.start;
        let oldEndN = textSpanEnd(change0.span);
        let newEndN = oldStartN + change0.newLength;
        for (let i = 1; i < changes.length; i++) {
            const nextChange = changes[i];
            // Consider the following case:
            // i.e. two edits.  The first represents the text change range { { 10, 50 }, 30 }.  i.e. The span starting
            // at 10, with length 50 is reduced to length 30.  The second represents the text change range { { 30, 30 }, 40 }.
            // i.e. the span starting at 30 with length 30 is increased to length 40.
            //
            //      0         10        20        30        40        50        60        70        80        90        100
            //      -------------------------------------------------------------------------------------------------------
            //                |                                                 /
            //                |                                            /----
            //  T1            |                                       /----
            //                |                                  /----
            //                |                             /----
            //      -------------------------------------------------------------------------------------------------------
            //                                     |                            \
            //                                     |                               \
            //   T2                                |                                 \
            //                                     |                                   \
            //                                     |                                      \
            //      -------------------------------------------------------------------------------------------------------
            //
            // Merging these turns out to not be too difficult.  First, determining the new start of the change is trivial
            // it's just the min of the old and new starts.  i.e.:
            //
            //      0         10        20        30        40        50        60        70        80        90        100
            //      ------------------------------------------------------------*------------------------------------------
            //                |                                                 /
            //                |                                            /----
            //  T1            |                                       /----
            //                |                                  /----
            //                |                             /----
            //      ----------------------------------------$-------------------$------------------------------------------
            //                .                    |                            \
            //                .                    |                               \
            //   T2           .                    |                                 \
            //                .                    |                                   \
            //                .                    |                                      \
            //      ----------------------------------------------------------------------*--------------------------------
            //
            // (Note the dots represent the newly inferred start.
            // Determining the new and old end is also pretty simple.  Basically it boils down to paying attention to the
            // absolute positions at the asterisks, and the relative change between the dollar signs. Basically, we see
            // which if the two $'s precedes the other, and we move that one forward until they line up.  in this case that
            // means:
            //
            //      0         10        20        30        40        50        60        70        80        90        100
            //      --------------------------------------------------------------------------------*----------------------
            //                |                                                                     /
            //                |                                                                /----
            //  T1            |                                                           /----
            //                |                                                      /----
            //                |                                                 /----
            //      ------------------------------------------------------------$------------------------------------------
            //                .                    |                            \
            //                .                    |                               \
            //   T2           .                    |                                 \
            //                .                    |                                   \
            //                .                    |                                      \
            //      ----------------------------------------------------------------------*--------------------------------
            //
            // In other words (in this case), we're recognizing that the second edit happened after where the first edit
            // ended with a delta of 20 characters (60 - 40).  Thus, if we go back in time to where the first edit started
            // that's the same as if we started at char 80 instead of 60.
            //
            // As it so happens, the same logic applies if the second edit precedes the first edit.  In that case rather
            // than pushing the first edit forward to match the second, we'll push the second edit forward to match the
            // first.
            //
            // In this case that means we have { oldStart: 10, oldEnd: 80, newEnd: 70 } or, in TextChangeRange
            // semantics: { { start: 10, length: 70 }, newLength: 60 }
            //
            // The math then works out as follows.
            // If we have { oldStart1, oldEnd1, newEnd1 } and { oldStart2, oldEnd2, newEnd2 } then we can compute the
            // final result like so:
            //
            // {
            //      oldStart3: Min(oldStart1, oldStart2),
            //      oldEnd3: Max(oldEnd1, oldEnd1 + (oldEnd2 - newEnd1)),
            //      newEnd3: Max(newEnd2, newEnd2 + (newEnd1 - oldEnd2))
            // }
            const oldStart1 = oldStartN;
            const oldEnd1 = oldEndN;
            const newEnd1 = newEndN;
            const oldStart2 = nextChange.span.start;
            const oldEnd2 = textSpanEnd(nextChange.span);
            const newEnd2 = oldStart2 + nextChange.newLength;
            oldStartN = Math.min(oldStart1, oldStart2);
            oldEndN = Math.max(oldEnd1, oldEnd1 + (oldEnd2 - newEnd1));
            newEndN = Math.max(newEnd2, newEnd2 + (newEnd1 - oldEnd2));
        }
        return createTextChangeRange(createTextSpanFromBounds(oldStartN, oldEndN), /*newLength*/ newEndN - oldStartN);
    }
    export function getTypeParameterOwner(d: ts.Declaration): ts.Declaration | undefined {
        if (d && d.kind === ts.SyntaxKind.TypeParameter) {
            for (let current: ts.Node = d; current; current = current.parent) {
                if (isFunctionLike(current) || isClassLike(current) || current.kind === ts.SyntaxKind.InterfaceDeclaration) {
                    return <ts.Declaration>current;
                }
            }
        }
    }
    export type ParameterPropertyDeclaration = ts.ParameterDeclaration & {
        parent: ts.ConstructorDeclaration;
        name: ts.Identifier;
    };
    export function isParameterPropertyDeclaration(node: ts.Node, parent: ts.Node): node is ParameterPropertyDeclaration {
        return ts.hasModifier(node, ts.ModifierFlags.ParameterPropertyModifier) && parent.kind === ts.SyntaxKind.Constructor;
    }
    export function isEmptyBindingPattern(node: ts.BindingName): node is ts.BindingPattern {
        if (isBindingPattern(node)) {
            return ts.every(node.elements, isEmptyBindingElement);
        }
        return false;
    }
    export function isEmptyBindingElement(node: ts.BindingElement): boolean {
        if (isOmittedExpression(node)) {
            return true;
        }
        return isEmptyBindingPattern(node.name);
    }
    export function walkUpBindingElementsAndPatterns(binding: ts.BindingElement): ts.VariableDeclaration | ts.ParameterDeclaration {
        let node = binding.parent;
        while (isBindingElement(node.parent)) {
            node = node.parent.parent;
        }
        return node.parent;
    }
    function getCombinedFlags(node: ts.Node, getFlags: (n: ts.Node) => number): number {
        if (isBindingElement(node)) {
            node = walkUpBindingElementsAndPatterns(node);
        }
        let flags = getFlags(node);
        if (node.kind === ts.SyntaxKind.VariableDeclaration) {
            node = node.parent;
        }
        if (node && node.kind === ts.SyntaxKind.VariableDeclarationList) {
            flags |= getFlags(node);
            node = node.parent;
        }
        if (node && node.kind === ts.SyntaxKind.VariableStatement) {
            flags |= getFlags(node);
        }
        return flags;
    }
    export function getCombinedModifierFlags(node: ts.Declaration): ts.ModifierFlags {
        return getCombinedFlags(node, ts.getModifierFlags);
    }
    // Returns the node flags for this node and all relevant parent nodes.  This is done so that
    // nodes like variable declarations and binding elements can returned a view of their flags
    // that includes the modifiers from their container.  i.e. flags like export/declare aren't
    // stored on the variable declaration directly, but on the containing variable statement
    // (if it has one).  Similarly, flags for let/const are store on the variable declaration
    // list.  By calling this function, all those flags are combined so that the client can treat
    // the node as if it actually had those flags.
    export function getCombinedNodeFlags(node: ts.Node): ts.NodeFlags {
        return getCombinedFlags(node, n => n.flags);
    }
    /**
     * Checks to see if the locale is in the appropriate format,
     * and if it is, attempts to set the appropriate language.
     */
    export function validateLocaleAndSetLanguage(locale: string, sys: {
        getExecutingFilePath(): string;
        resolvePath(path: string): string;
        fileExists(fileName: string): boolean;
        readFile(fileName: string): string | undefined;
    }, errors?: ts.Push<ts.Diagnostic>) {
        const matchResult = /^([a-z]+)([_\-]([a-z]+))?$/.exec(locale.toLowerCase());
        if (!matchResult) {
            if (errors) {
                errors.push(ts.createCompilerDiagnostic(ts.Diagnostics.Locale_must_be_of_the_form_language_or_language_territory_For_example_0_or_1, "en", "ja-jp"));
            }
            return;
        }
        const language = matchResult[1];
        const territory = matchResult[3];
        // First try the entire locale, then fall back to just language if that's all we have.
        // Either ways do not fail, and fallback to the English diagnostic strings.
        if (!trySetLanguageAndTerritory(language, territory, errors)) {
            trySetLanguageAndTerritory(language, /*territory*/ undefined, errors);
        }
        // Set the UI locale for string collation
        ts.setUILocale(locale);
        function trySetLanguageAndTerritory(language: string, territory: string | undefined, errors?: ts.Push<ts.Diagnostic>): boolean {
            const compilerFilePath = ts.normalizePath(sys.getExecutingFilePath());
            const containingDirectoryPath = ts.getDirectoryPath(compilerFilePath);
            let filePath = ts.combinePaths(containingDirectoryPath, language);
            if (territory) {
                filePath = filePath + "-" + territory;
            }
            filePath = sys.resolvePath(ts.combinePaths(filePath, "diagnosticMessages.generated.json"));
            if (!sys.fileExists(filePath)) {
                return false;
            }
            // TODO: Add codePage support for readFile?
            let fileContents: string | undefined = "";
            try {
                fileContents = sys.readFile(filePath);
            }
            catch (e) {
                if (errors) {
                    errors.push(ts.createCompilerDiagnostic(ts.Diagnostics.Unable_to_open_file_0, filePath));
                }
                return false;
            }
            try {
                // this is a global mutation (or live binding update)!
                ts.setLocalizedDiagnosticMessages(JSON.parse(fileContents!));
            }
            catch {
                if (errors) {
                    errors.push(ts.createCompilerDiagnostic(ts.Diagnostics.Corrupted_locale_file_0, filePath));
                }
                return false;
            }
            return true;
        }
    }
    export function getOriginalNode(node: ts.Node): ts.Node;
    export function getOriginalNode<T extends ts.Node>(node: ts.Node, nodeTest: (node: ts.Node) => node is T): T;
    export function getOriginalNode(node: ts.Node | undefined): ts.Node | undefined;
    export function getOriginalNode<T extends ts.Node>(node: ts.Node | undefined, nodeTest: (node: ts.Node | undefined) => node is T): T | undefined;
    export function getOriginalNode(node: ts.Node | undefined, nodeTest?: (node: ts.Node | undefined) => boolean): ts.Node | undefined {
        if (node) {
            while (node.original !== undefined) {
                node = node.original;
            }
        }
        return !nodeTest || nodeTest(node) ? node : undefined;
    }
    /**
     * Gets a value indicating whether a node originated in the parse tree.
     *
     * @param node The node to test.
     */
    export function isParseTreeNode(node: ts.Node): boolean {
        return (node.flags & ts.NodeFlags.Synthesized) === 0;
    }
    /**
     * Gets the original parse tree node for a node.
     *
     * @param node The original node.
     * @returns The original parse tree node if found; otherwise, undefined.
     */
    export function getParseTreeNode(node: ts.Node): ts.Node;
    /**
     * Gets the original parse tree node for a node.
     *
     * @param node The original node.
     * @param nodeTest A callback used to ensure the correct type of parse tree node is returned.
     * @returns The original parse tree node if found; otherwise, undefined.
     */
    export function getParseTreeNode<T extends ts.Node>(node: ts.Node | undefined, nodeTest?: (node: ts.Node) => node is T): T | undefined;
    export function getParseTreeNode(node: ts.Node | undefined, nodeTest?: (node: ts.Node) => boolean): ts.Node | undefined {
        if (node === undefined || isParseTreeNode(node)) {
            return node;
        }
        node = getOriginalNode(node);
        if (isParseTreeNode(node) && (!nodeTest || nodeTest(node))) {
            return node;
        }
        return undefined;
    }
    /** Add an extra underscore to identifiers that start with two underscores to avoid issues with magic names like '__proto__' */
    export function escapeLeadingUnderscores(identifier: string): ts.__String {
        return (identifier.length >= 2 && identifier.charCodeAt(0) === ts.CharacterCodes._ && identifier.charCodeAt(1) === ts.CharacterCodes._ ? "_" + identifier : identifier) as ts.__String;
    }
    /**
     * Remove extra underscore from escaped identifier text content.
     *
     * @param identifier The escaped identifier text.
     * @returns The unescaped identifier text.
     */
    export function unescapeLeadingUnderscores(identifier: ts.__String): string {
        const id = identifier as string;
        return id.length >= 3 && id.charCodeAt(0) === ts.CharacterCodes._ && id.charCodeAt(1) === ts.CharacterCodes._ && id.charCodeAt(2) === ts.CharacterCodes._ ? id.substr(1) : id;
    }
    export function idText(identifier: ts.Identifier): string {
        return unescapeLeadingUnderscores(identifier.escapedText);
    }
    export function symbolName(symbol: ts.Symbol): string {
        return unescapeLeadingUnderscores(symbol.escapedName);
    }
    /**
     * A JSDocTypedef tag has an _optional_ name field - if a name is not directly present, we should
     * attempt to draw the name from the node the declaration is on (as that declaration is what its' symbol
     * will be merged with)
     */
    function nameForNamelessJSDocTypedef(declaration: ts.JSDocTypedefTag | ts.JSDocEnumTag): ts.Identifier | undefined {
        const hostNode = declaration.parent.parent;
        if (!hostNode) {
            return undefined;
        }
        // Covers classes, functions - any named declaration host node
        if (isDeclaration(hostNode)) {
            return getDeclarationIdentifier(hostNode);
        }
        // Covers remaining cases (returning undefined if none match).
        switch (hostNode.kind) {
            case ts.SyntaxKind.VariableStatement:
                if (hostNode.declarationList && hostNode.declarationList.declarations[0]) {
                    return getDeclarationIdentifier(hostNode.declarationList.declarations[0]);
                }
                break;
            case ts.SyntaxKind.ExpressionStatement:
                let expr = hostNode.expression;
                if (expr.kind === ts.SyntaxKind.BinaryExpression && (expr as ts.BinaryExpression).operatorToken.kind === ts.SyntaxKind.EqualsToken) {
                    expr = (expr as ts.BinaryExpression).left;
                }
                switch (expr.kind) {
                    case ts.SyntaxKind.PropertyAccessExpression:
                        return (expr as ts.PropertyAccessExpression).name;
                    case ts.SyntaxKind.ElementAccessExpression:
                        const arg = (expr as ts.ElementAccessExpression).argumentExpression;
                        if (isIdentifier(arg)) {
                            return arg;
                        }
                }
                break;
            case ts.SyntaxKind.ParenthesizedExpression: {
                return getDeclarationIdentifier(hostNode.expression);
            }
            case ts.SyntaxKind.LabeledStatement: {
                if (isDeclaration(hostNode.statement) || isExpression(hostNode.statement)) {
                    return getDeclarationIdentifier(hostNode.statement);
                }
                break;
            }
        }
    }
    function getDeclarationIdentifier(node: ts.Declaration | ts.Expression): ts.Identifier | undefined {
        const name = getNameOfDeclaration(node);
        return name && isIdentifier(name) ? name : undefined;
    }
    /** @internal */
    export function nodeHasName(statement: ts.Node, name: ts.Identifier) {
        if (isNamedDeclaration(statement) && isIdentifier(statement.name) && idText((statement.name as ts.Identifier)) === idText(name)) {
            return true;
        }
        if (isVariableStatement(statement) && ts.some(statement.declarationList.declarations, d => nodeHasName(d, name))) {
            return true;
        }
        return false;
    }
    export function getNameOfJSDocTypedef(declaration: ts.JSDocTypedefTag): ts.Identifier | undefined {
        return declaration.name || nameForNamelessJSDocTypedef(declaration);
    }
    /** @internal */
    export function isNamedDeclaration(node: ts.Node): node is ts.NamedDeclaration & {
        name: ts.DeclarationName;
    } {
        return !!(node as ts.NamedDeclaration).name; // A 'name' property should always be a DeclarationName.
    }
    /** @internal */
    export function getNonAssignedNameOfDeclaration(declaration: ts.Declaration | ts.Expression): ts.DeclarationName | undefined {
        switch (declaration.kind) {
            case ts.SyntaxKind.Identifier:
                return declaration as ts.Identifier;
            case ts.SyntaxKind.JSDocPropertyTag:
            case ts.SyntaxKind.JSDocParameterTag: {
                const { name } = (declaration as ts.JSDocPropertyLikeTag);
                if (name.kind === ts.SyntaxKind.QualifiedName) {
                    return name.right;
                }
                break;
            }
            case ts.SyntaxKind.CallExpression:
            case ts.SyntaxKind.BinaryExpression: {
                const expr = (declaration as ts.BinaryExpression | ts.CallExpression);
                switch (ts.getAssignmentDeclarationKind(expr)) {
                    case ts.AssignmentDeclarationKind.ExportsProperty:
                    case ts.AssignmentDeclarationKind.ThisProperty:
                    case ts.AssignmentDeclarationKind.Property:
                    case ts.AssignmentDeclarationKind.PrototypeProperty:
                        return ts.getElementOrPropertyAccessArgumentExpressionOrName(((expr as ts.BinaryExpression).left as ts.AccessExpression));
                    case ts.AssignmentDeclarationKind.ObjectDefinePropertyValue:
                    case ts.AssignmentDeclarationKind.ObjectDefinePropertyExports:
                    case ts.AssignmentDeclarationKind.ObjectDefinePrototypeProperty:
                        return (expr as ts.BindableObjectDefinePropertyCall).arguments[1];
                    default:
                        return undefined;
                }
            }
            case ts.SyntaxKind.JSDocTypedefTag:
                return getNameOfJSDocTypedef((declaration as ts.JSDocTypedefTag));
            case ts.SyntaxKind.JSDocEnumTag:
                return nameForNamelessJSDocTypedef((declaration as ts.JSDocEnumTag));
            case ts.SyntaxKind.ExportAssignment: {
                const { expression } = (declaration as ts.ExportAssignment);
                return isIdentifier(expression) ? expression : undefined;
            }
            case ts.SyntaxKind.ElementAccessExpression:
                const expr = (declaration as ts.ElementAccessExpression);
                if (ts.isBindableStaticElementAccessExpression(expr)) {
                    return expr.argumentExpression;
                }
        }
        return (declaration as ts.NamedDeclaration).name;
    }
    export function getNameOfDeclaration(declaration: ts.Declaration | ts.Expression): ts.DeclarationName | undefined {
        if (declaration === undefined)
            return undefined;
        return getNonAssignedNameOfDeclaration(declaration) ||
            (isFunctionExpression(declaration) || isClassExpression(declaration) ? getAssignedName(declaration) : undefined);
    }
    function getAssignedName(node: ts.Node): ts.DeclarationName | undefined {
        if (!node.parent) {
            return undefined;
        }
        else if (isPropertyAssignment(node.parent) || isBindingElement(node.parent)) {
            return node.parent.name;
        }
        else if (isBinaryExpression(node.parent) && node === node.parent.right) {
            if (isIdentifier(node.parent.left)) {
                return node.parent.left;
            }
            else if (ts.isAccessExpression(node.parent.left)) {
                return ts.getElementOrPropertyAccessArgumentExpressionOrName(node.parent.left);
            }
        }
        else if (isVariableDeclaration(node.parent) && isIdentifier(node.parent.name)) {
            return node.parent.name;
        }
    }
    /**
     * Gets the JSDoc parameter tags for the node if present.
     *
     * @remarks Returns any JSDoc param tag whose name matches the provided
     * parameter, whether a param tag on a containing function
     * expression, or a param tag on a variable declaration whose
     * initializer is the containing function. The tags closest to the
     * node are returned first, so in the previous example, the param
     * tag on the containing function expression would be first.
     *
     * For binding patterns, parameter tags are matched by position.
     */
    export function getJSDocParameterTags(param: ts.ParameterDeclaration): readonly ts.JSDocParameterTag[] {
        if (param.name) {
            if (isIdentifier(param.name)) {
                const name = param.name.escapedText;
                return getJSDocTags(param.parent).filter((tag): tag is ts.JSDocParameterTag => isJSDocParameterTag(tag) && isIdentifier(tag.name) && tag.name.escapedText === name);
            }
            else {
                const i = param.parent.parameters.indexOf(param);
                ts.Debug.assert(i > -1, "Parameters should always be in their parents' parameter list");
                const paramTags = getJSDocTags(param.parent).filter(isJSDocParameterTag);
                if (i < paramTags.length) {
                    return [paramTags[i]];
                }
            }
        }
        // return empty array for: out-of-order binding patterns and JSDoc function syntax, which has un-named parameters
        return ts.emptyArray;
    }
    /**
     * Gets the JSDoc type parameter tags for the node if present.
     *
     * @remarks Returns any JSDoc template tag whose names match the provided
     * parameter, whether a template tag on a containing function
     * expression, or a template tag on a variable declaration whose
     * initializer is the containing function. The tags closest to the
     * node are returned first, so in the previous example, the template
     * tag on the containing function expression would be first.
     */
    export function getJSDocTypeParameterTags(param: ts.TypeParameterDeclaration): readonly ts.JSDocTemplateTag[] {
        const name = param.name.escapedText;
        return getJSDocTags(param.parent).filter((tag): tag is ts.JSDocTemplateTag => isJSDocTemplateTag(tag) && tag.typeParameters.some(tp => tp.name.escapedText === name));
    }
    /**
     * Return true if the node has JSDoc parameter tags.
     *
     * @remarks Includes parameter tags that are not directly on the node,
     * for example on a variable declaration whose initializer is a function expression.
     */
    export function hasJSDocParameterTags(node: ts.FunctionLikeDeclaration | ts.SignatureDeclaration): boolean {
        return !!getFirstJSDocTag(node, isJSDocParameterTag);
    }
    /** Gets the JSDoc augments tag for the node if present */
    export function getJSDocAugmentsTag(node: ts.Node): ts.JSDocAugmentsTag | undefined {
        return getFirstJSDocTag(node, isJSDocAugmentsTag);
    }
    /** Gets the JSDoc class tag for the node if present */
    export function getJSDocClassTag(node: ts.Node): ts.JSDocClassTag | undefined {
        return getFirstJSDocTag(node, isJSDocClassTag);
    }
    /** Gets the JSDoc enum tag for the node if present */
    export function getJSDocEnumTag(node: ts.Node): ts.JSDocEnumTag | undefined {
        return getFirstJSDocTag(node, isJSDocEnumTag);
    }
    /** Gets the JSDoc this tag for the node if present */
    export function getJSDocThisTag(node: ts.Node): ts.JSDocThisTag | undefined {
        return getFirstJSDocTag(node, isJSDocThisTag);
    }
    /** Gets the JSDoc return tag for the node if present */
    export function getJSDocReturnTag(node: ts.Node): ts.JSDocReturnTag | undefined {
        return getFirstJSDocTag(node, isJSDocReturnTag);
    }
    /** Gets the JSDoc template tag for the node if present */
    export function getJSDocTemplateTag(node: ts.Node): ts.JSDocTemplateTag | undefined {
        return getFirstJSDocTag(node, isJSDocTemplateTag);
    }
    /** Gets the JSDoc type tag for the node if present and valid */
    export function getJSDocTypeTag(node: ts.Node): ts.JSDocTypeTag | undefined {
        // We should have already issued an error if there were multiple type jsdocs, so just use the first one.
        const tag = getFirstJSDocTag(node, isJSDocTypeTag);
        if (tag && tag.typeExpression && tag.typeExpression.type) {
            return tag;
        }
        return undefined;
    }
    /**
     * Gets the type node for the node if provided via JSDoc.
     *
     * @remarks The search includes any JSDoc param tag that relates
     * to the provided parameter, for example a type tag on the
     * parameter itself, or a param tag on a containing function
     * expression, or a param tag on a variable declaration whose
     * initializer is the containing function. The tags closest to the
     * node are examined first, so in the previous example, the type
     * tag directly on the node would be returned.
     */
    export function getJSDocType(node: ts.Node): ts.TypeNode | undefined {
        let tag: ts.JSDocTypeTag | ts.JSDocParameterTag | undefined = getFirstJSDocTag(node, isJSDocTypeTag);
        if (!tag && isParameter(node)) {
            tag = ts.find(getJSDocParameterTags(node), tag => !!tag.typeExpression);
        }
        return tag && tag.typeExpression && tag.typeExpression.type;
    }
    /**
     * Gets the return type node for the node if provided via JSDoc return tag or type tag.
     *
     * @remarks `getJSDocReturnTag` just gets the whole JSDoc tag. This function
     * gets the type from inside the braces, after the fat arrow, etc.
     */
    export function getJSDocReturnType(node: ts.Node): ts.TypeNode | undefined {
        const returnTag = getJSDocReturnTag(node);
        if (returnTag && returnTag.typeExpression) {
            return returnTag.typeExpression.type;
        }
        const typeTag = getJSDocTypeTag(node);
        if (typeTag && typeTag.typeExpression) {
            const type = typeTag.typeExpression.type;
            if (isTypeLiteralNode(type)) {
                const sig = ts.find(type.members, isCallSignatureDeclaration);
                return sig && sig.type;
            }
            if (isFunctionTypeNode(type)) {
                return type.type;
            }
        }
    }
    /** Get all JSDoc tags related to a node, including those on parent nodes. */
    export function getJSDocTags(node: ts.Node): readonly ts.JSDocTag[] {
        let tags = (node as ts.JSDocContainer).jsDocCache;
        // If cache is 'null', that means we did the work of searching for JSDoc tags and came up with nothing.
        if (tags === undefined) {
            const comments = ts.getJSDocCommentsAndTags(node);
            ts.Debug.assert(comments.length < 2 || comments[0] !== comments[1]);
            (node as ts.JSDocContainer).jsDocCache = tags = ts.flatMap(comments, j => isJSDoc(j) ? j.tags : j);
        }
        return tags;
    }
    /** Get the first JSDoc tag of a specified kind, or undefined if not present. */
    function getFirstJSDocTag<T extends ts.JSDocTag>(node: ts.Node, predicate: (tag: ts.JSDocTag) => tag is T): T | undefined {
        return ts.find(getJSDocTags(node), predicate);
    }
    /** Gets all JSDoc tags of a specified kind, or undefined if not present. */
    export function getAllJSDocTagsOfKind(node: ts.Node, kind: ts.SyntaxKind): readonly ts.JSDocTag[] {
        return getJSDocTags(node).filter(doc => doc.kind === kind);
    }
    /**
     * Gets the effective type parameters. If the node was parsed in a
     * JavaScript file, gets the type parameters from the `@template` tag from JSDoc.
     */
    export function getEffectiveTypeParameterDeclarations(node: ts.DeclarationWithTypeParameters): readonly ts.TypeParameterDeclaration[] {
        if (isJSDocSignature(node)) {
            return ts.emptyArray;
        }
        if (ts.isJSDocTypeAlias(node)) {
            ts.Debug.assert(node.parent.kind === ts.SyntaxKind.JSDocComment);
            return ts.flatMap(node.parent.tags, tag => isJSDocTemplateTag(tag) ? tag.typeParameters : undefined);
        }
        if (node.typeParameters) {
            return node.typeParameters;
        }
        if (ts.isInJSFile(node)) {
            const decls = ts.getJSDocTypeParameterDeclarations(node);
            if (decls.length) {
                return decls;
            }
            const typeTag = getJSDocType(node);
            if (typeTag && isFunctionTypeNode(typeTag) && typeTag.typeParameters) {
                return typeTag.typeParameters;
            }
        }
        return ts.emptyArray;
    }
    export function getEffectiveConstraintOfTypeParameter(node: ts.TypeParameterDeclaration): ts.TypeNode | undefined {
        return node.constraint ? node.constraint :
            isJSDocTemplateTag(node.parent) && node === node.parent.typeParameters[0] ? node.parent.constraint :
                undefined;
    }
    // #region
    // Simple node tests of the form `node.kind === SyntaxKind.Foo`.
    // Literals
    export function isNumericLiteral(node: ts.Node): node is ts.NumericLiteral {
        return node.kind === ts.SyntaxKind.NumericLiteral;
    }
    export function isBigIntLiteral(node: ts.Node): node is ts.BigIntLiteral {
        return node.kind === ts.SyntaxKind.BigIntLiteral;
    }
    export function isStringLiteral(node: ts.Node): node is ts.StringLiteral {
        return node.kind === ts.SyntaxKind.StringLiteral;
    }
    export function isJsxText(node: ts.Node): node is ts.JsxText {
        return node.kind === ts.SyntaxKind.JsxText;
    }
    export function isRegularExpressionLiteral(node: ts.Node): node is ts.RegularExpressionLiteral {
        return node.kind === ts.SyntaxKind.RegularExpressionLiteral;
    }
    export function isNoSubstitutionTemplateLiteral(node: ts.Node): node is ts.NoSubstitutionTemplateLiteral {
        return node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral;
    }
    // Pseudo-literals
    export function isTemplateHead(node: ts.Node): node is ts.TemplateHead {
        return node.kind === ts.SyntaxKind.TemplateHead;
    }
    export function isTemplateMiddle(node: ts.Node): node is ts.TemplateMiddle {
        return node.kind === ts.SyntaxKind.TemplateMiddle;
    }
    export function isTemplateTail(node: ts.Node): node is ts.TemplateTail {
        return node.kind === ts.SyntaxKind.TemplateTail;
    }
    export function isIdentifier(node: ts.Node): node is ts.Identifier {
        return node.kind === ts.SyntaxKind.Identifier;
    }
    // Names
    export function isQualifiedName(node: ts.Node): node is ts.QualifiedName {
        return node.kind === ts.SyntaxKind.QualifiedName;
    }
    export function isComputedPropertyName(node: ts.Node): node is ts.ComputedPropertyName {
        return node.kind === ts.SyntaxKind.ComputedPropertyName;
    }
    // Signature elements
    export function isTypeParameterDeclaration(node: ts.Node): node is ts.TypeParameterDeclaration {
        return node.kind === ts.SyntaxKind.TypeParameter;
    }
    export function isParameter(node: ts.Node): node is ts.ParameterDeclaration {
        return node.kind === ts.SyntaxKind.Parameter;
    }
    export function isDecorator(node: ts.Node): node is ts.Decorator {
        return node.kind === ts.SyntaxKind.Decorator;
    }
    // TypeMember
    export function isPropertySignature(node: ts.Node): node is ts.PropertySignature {
        return node.kind === ts.SyntaxKind.PropertySignature;
    }
    export function isPropertyDeclaration(node: ts.Node): node is ts.PropertyDeclaration {
        return node.kind === ts.SyntaxKind.PropertyDeclaration;
    }
    export function isMethodSignature(node: ts.Node): node is ts.MethodSignature {
        return node.kind === ts.SyntaxKind.MethodSignature;
    }
    export function isMethodDeclaration(node: ts.Node): node is ts.MethodDeclaration {
        return node.kind === ts.SyntaxKind.MethodDeclaration;
    }
    export function isConstructorDeclaration(node: ts.Node): node is ts.ConstructorDeclaration {
        return node.kind === ts.SyntaxKind.Constructor;
    }
    export function isGetAccessorDeclaration(node: ts.Node): node is ts.GetAccessorDeclaration {
        return node.kind === ts.SyntaxKind.GetAccessor;
    }
    export function isSetAccessorDeclaration(node: ts.Node): node is ts.SetAccessorDeclaration {
        return node.kind === ts.SyntaxKind.SetAccessor;
    }
    export function isCallSignatureDeclaration(node: ts.Node): node is ts.CallSignatureDeclaration {
        return node.kind === ts.SyntaxKind.CallSignature;
    }
    export function isConstructSignatureDeclaration(node: ts.Node): node is ts.ConstructSignatureDeclaration {
        return node.kind === ts.SyntaxKind.ConstructSignature;
    }
    export function isIndexSignatureDeclaration(node: ts.Node): node is ts.IndexSignatureDeclaration {
        return node.kind === ts.SyntaxKind.IndexSignature;
    }
    /* @internal */
    export function isGetOrSetAccessorDeclaration(node: ts.Node): node is ts.AccessorDeclaration {
        return node.kind === ts.SyntaxKind.SetAccessor || node.kind === ts.SyntaxKind.GetAccessor;
    }
    // Type
    export function isTypePredicateNode(node: ts.Node): node is ts.TypePredicateNode {
        return node.kind === ts.SyntaxKind.TypePredicate;
    }
    export function isTypeReferenceNode(node: ts.Node): node is ts.TypeReferenceNode {
        return node.kind === ts.SyntaxKind.TypeReference;
    }
    export function isFunctionTypeNode(node: ts.Node): node is ts.FunctionTypeNode {
        return node.kind === ts.SyntaxKind.FunctionType;
    }
    export function isConstructorTypeNode(node: ts.Node): node is ts.ConstructorTypeNode {
        return node.kind === ts.SyntaxKind.ConstructorType;
    }
    export function isTypeQueryNode(node: ts.Node): node is ts.TypeQueryNode {
        return node.kind === ts.SyntaxKind.TypeQuery;
    }
    export function isTypeLiteralNode(node: ts.Node): node is ts.TypeLiteralNode {
        return node.kind === ts.SyntaxKind.TypeLiteral;
    }
    export function isArrayTypeNode(node: ts.Node): node is ts.ArrayTypeNode {
        return node.kind === ts.SyntaxKind.ArrayType;
    }
    export function isTupleTypeNode(node: ts.Node): node is ts.TupleTypeNode {
        return node.kind === ts.SyntaxKind.TupleType;
    }
    export function isUnionTypeNode(node: ts.Node): node is ts.UnionTypeNode {
        return node.kind === ts.SyntaxKind.UnionType;
    }
    export function isIntersectionTypeNode(node: ts.Node): node is ts.IntersectionTypeNode {
        return node.kind === ts.SyntaxKind.IntersectionType;
    }
    export function isConditionalTypeNode(node: ts.Node): node is ts.ConditionalTypeNode {
        return node.kind === ts.SyntaxKind.ConditionalType;
    }
    export function isInferTypeNode(node: ts.Node): node is ts.InferTypeNode {
        return node.kind === ts.SyntaxKind.InferType;
    }
    export function isParenthesizedTypeNode(node: ts.Node): node is ts.ParenthesizedTypeNode {
        return node.kind === ts.SyntaxKind.ParenthesizedType;
    }
    export function isThisTypeNode(node: ts.Node): node is ts.ThisTypeNode {
        return node.kind === ts.SyntaxKind.ThisType;
    }
    export function isTypeOperatorNode(node: ts.Node): node is ts.TypeOperatorNode {
        return node.kind === ts.SyntaxKind.TypeOperator;
    }
    export function isIndexedAccessTypeNode(node: ts.Node): node is ts.IndexedAccessTypeNode {
        return node.kind === ts.SyntaxKind.IndexedAccessType;
    }
    export function isMappedTypeNode(node: ts.Node): node is ts.MappedTypeNode {
        return node.kind === ts.SyntaxKind.MappedType;
    }
    export function isLiteralTypeNode(node: ts.Node): node is ts.LiteralTypeNode {
        return node.kind === ts.SyntaxKind.LiteralType;
    }
    export function isImportTypeNode(node: ts.Node): node is ts.ImportTypeNode {
        return node.kind === ts.SyntaxKind.ImportType;
    }
    // Binding patterns
    export function isObjectBindingPattern(node: ts.Node): node is ts.ObjectBindingPattern {
        return node.kind === ts.SyntaxKind.ObjectBindingPattern;
    }
    export function isArrayBindingPattern(node: ts.Node): node is ts.ArrayBindingPattern {
        return node.kind === ts.SyntaxKind.ArrayBindingPattern;
    }
    export function isBindingElement(node: ts.Node): node is ts.BindingElement {
        return node.kind === ts.SyntaxKind.BindingElement;
    }
    // Expression
    export function isArrayLiteralExpression(node: ts.Node): node is ts.ArrayLiteralExpression {
        return node.kind === ts.SyntaxKind.ArrayLiteralExpression;
    }
    export function isObjectLiteralExpression(node: ts.Node): node is ts.ObjectLiteralExpression {
        return node.kind === ts.SyntaxKind.ObjectLiteralExpression;
    }
    export function isPropertyAccessExpression(node: ts.Node): node is ts.PropertyAccessExpression {
        return node.kind === ts.SyntaxKind.PropertyAccessExpression;
    }
    export function isPropertyAccessChain(node: ts.Node): node is ts.PropertyAccessChain {
        return isPropertyAccessExpression(node) && !!(node.flags & ts.NodeFlags.OptionalChain);
    }
    export function isElementAccessExpression(node: ts.Node): node is ts.ElementAccessExpression {
        return node.kind === ts.SyntaxKind.ElementAccessExpression;
    }
    export function isElementAccessChain(node: ts.Node): node is ts.ElementAccessChain {
        return isElementAccessExpression(node) && !!(node.flags & ts.NodeFlags.OptionalChain);
    }
    export function isCallExpression(node: ts.Node): node is ts.CallExpression {
        return node.kind === ts.SyntaxKind.CallExpression;
    }
    export function isCallChain(node: ts.Node): node is ts.CallChain {
        return isCallExpression(node) && !!(node.flags & ts.NodeFlags.OptionalChain);
    }
    export function isOptionalChain(node: ts.Node): node is ts.PropertyAccessChain | ts.ElementAccessChain | ts.CallChain {
        const kind = node.kind;
        return !!(node.flags & ts.NodeFlags.OptionalChain) &&
            (kind === ts.SyntaxKind.PropertyAccessExpression
                || kind === ts.SyntaxKind.ElementAccessExpression
                || kind === ts.SyntaxKind.CallExpression);
    }
    /* @internal */
    export function isOptionalChainRoot(node: ts.Node): node is ts.OptionalChainRoot {
        return isOptionalChain(node) && !!node.questionDotToken;
    }
    /**
     * Determines whether a node is the expression preceding an optional chain (i.e. `a` in `a?.b`).
     */
    /* @internal */
    export function isExpressionOfOptionalChainRoot(node: ts.Node): node is ts.Expression & {
        parent: ts.OptionalChainRoot;
    } {
        return isOptionalChainRoot(node.parent) && node.parent.expression === node;
    }
    /**
     * Determines whether a node is the outermost `OptionalChain` in an ECMAScript `OptionalExpression`:
     *
     * 1. For `a?.b.c`, the outermost chain is `a?.b.c` (`c` is the end of the chain starting at `a?.`)
     * 2. For `(a?.b.c).d`, the outermost chain is `a?.b.c` (`c` is the end of the chain starting at `a?.` since parens end the chain)
     * 3. For `a?.b.c?.d`, both `a?.b.c` and `a?.b.c?.d` are outermost (`c` is the end of the chain starting at `a?.`, and `d` is
     *   the end of the chain starting at `c?.`)
     * 4. For `a?.(b?.c).d`, both `b?.c` and `a?.(b?.c)d` are outermost (`c` is the end of the chain starting at `b`, and `d` is
     *   the end of the chain starting at `a?.`)
     */
    /* @internal */
    export function isOutermostOptionalChain(node: ts.OptionalChain) {
        return !isOptionalChain(node.parent) // cases 1 and 2
            || isOptionalChainRoot(node.parent) // case 3
            || node !== node.parent.expression; // case 4
    }
    export function isNullishCoalesce(node: ts.Node) {
        return node.kind === ts.SyntaxKind.BinaryExpression && (<ts.BinaryExpression>node).operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken;
    }
    export function isNewExpression(node: ts.Node): node is ts.NewExpression {
        return node.kind === ts.SyntaxKind.NewExpression;
    }
    export function isTaggedTemplateExpression(node: ts.Node): node is ts.TaggedTemplateExpression {
        return node.kind === ts.SyntaxKind.TaggedTemplateExpression;
    }
    export function isTypeAssertion(node: ts.Node): node is ts.TypeAssertion {
        return node.kind === ts.SyntaxKind.TypeAssertionExpression;
    }
    export function isConstTypeReference(node: ts.Node) {
        return isTypeReferenceNode(node) && isIdentifier(node.typeName) &&
            node.typeName.escapedText === "const" && !node.typeArguments;
    }
    export function isParenthesizedExpression(node: ts.Node): node is ts.ParenthesizedExpression {
        return node.kind === ts.SyntaxKind.ParenthesizedExpression;
    }
    export function skipPartiallyEmittedExpressions(node: ts.Expression): ts.Expression;
    export function skipPartiallyEmittedExpressions(node: ts.Node): ts.Node;
    export function skipPartiallyEmittedExpressions(node: ts.Node) {
        while (node.kind === ts.SyntaxKind.PartiallyEmittedExpression) {
            node = (<ts.PartiallyEmittedExpression>node).expression;
        }
        return node;
    }
    export function isFunctionExpression(node: ts.Node): node is ts.FunctionExpression {
        return node.kind === ts.SyntaxKind.FunctionExpression;
    }
    export function isArrowFunction(node: ts.Node): node is ts.ArrowFunction {
        return node.kind === ts.SyntaxKind.ArrowFunction;
    }
    export function isDeleteExpression(node: ts.Node): node is ts.DeleteExpression {
        return node.kind === ts.SyntaxKind.DeleteExpression;
    }
    export function isTypeOfExpression(node: ts.Node): node is ts.TypeOfExpression {
        return node.kind === ts.SyntaxKind.TypeOfExpression;
    }
    export function isVoidExpression(node: ts.Node): node is ts.VoidExpression {
        return node.kind === ts.SyntaxKind.VoidExpression;
    }
    export function isAwaitExpression(node: ts.Node): node is ts.AwaitExpression {
        return node.kind === ts.SyntaxKind.AwaitExpression;
    }
    export function isPrefixUnaryExpression(node: ts.Node): node is ts.PrefixUnaryExpression {
        return node.kind === ts.SyntaxKind.PrefixUnaryExpression;
    }
    export function isPostfixUnaryExpression(node: ts.Node): node is ts.PostfixUnaryExpression {
        return node.kind === ts.SyntaxKind.PostfixUnaryExpression;
    }
    export function isBinaryExpression(node: ts.Node): node is ts.BinaryExpression {
        return node.kind === ts.SyntaxKind.BinaryExpression;
    }
    export function isConditionalExpression(node: ts.Node): node is ts.ConditionalExpression {
        return node.kind === ts.SyntaxKind.ConditionalExpression;
    }
    export function isTemplateExpression(node: ts.Node): node is ts.TemplateExpression {
        return node.kind === ts.SyntaxKind.TemplateExpression;
    }
    export function isYieldExpression(node: ts.Node): node is ts.YieldExpression {
        return node.kind === ts.SyntaxKind.YieldExpression;
    }
    export function isSpreadElement(node: ts.Node): node is ts.SpreadElement {
        return node.kind === ts.SyntaxKind.SpreadElement;
    }
    export function isClassExpression(node: ts.Node): node is ts.ClassExpression {
        return node.kind === ts.SyntaxKind.ClassExpression;
    }
    export function isOmittedExpression(node: ts.Node): node is ts.OmittedExpression {
        return node.kind === ts.SyntaxKind.OmittedExpression;
    }
    export function isExpressionWithTypeArguments(node: ts.Node): node is ts.ExpressionWithTypeArguments {
        return node.kind === ts.SyntaxKind.ExpressionWithTypeArguments;
    }
    export function isAsExpression(node: ts.Node): node is ts.AsExpression {
        return node.kind === ts.SyntaxKind.AsExpression;
    }
    export function isNonNullExpression(node: ts.Node): node is ts.NonNullExpression {
        return node.kind === ts.SyntaxKind.NonNullExpression;
    }
    export function isMetaProperty(node: ts.Node): node is ts.MetaProperty {
        return node.kind === ts.SyntaxKind.MetaProperty;
    }
    // Misc
    export function isTemplateSpan(node: ts.Node): node is ts.TemplateSpan {
        return node.kind === ts.SyntaxKind.TemplateSpan;
    }
    export function isSemicolonClassElement(node: ts.Node): node is ts.SemicolonClassElement {
        return node.kind === ts.SyntaxKind.SemicolonClassElement;
    }
    // Block
    export function isBlock(node: ts.Node): node is ts.Block {
        return node.kind === ts.SyntaxKind.Block;
    }
    export function isVariableStatement(node: ts.Node): node is ts.VariableStatement {
        return node.kind === ts.SyntaxKind.VariableStatement;
    }
    export function isEmptyStatement(node: ts.Node): node is ts.EmptyStatement {
        return node.kind === ts.SyntaxKind.EmptyStatement;
    }
    export function isExpressionStatement(node: ts.Node): node is ts.ExpressionStatement {
        return node.kind === ts.SyntaxKind.ExpressionStatement;
    }
    export function isIfStatement(node: ts.Node): node is ts.IfStatement {
        return node.kind === ts.SyntaxKind.IfStatement;
    }
    export function isDoStatement(node: ts.Node): node is ts.DoStatement {
        return node.kind === ts.SyntaxKind.DoStatement;
    }
    export function isWhileStatement(node: ts.Node): node is ts.WhileStatement {
        return node.kind === ts.SyntaxKind.WhileStatement;
    }
    export function isForStatement(node: ts.Node): node is ts.ForStatement {
        return node.kind === ts.SyntaxKind.ForStatement;
    }
    export function isForInStatement(node: ts.Node): node is ts.ForInStatement {
        return node.kind === ts.SyntaxKind.ForInStatement;
    }
    export function isForOfStatement(node: ts.Node): node is ts.ForOfStatement {
        return node.kind === ts.SyntaxKind.ForOfStatement;
    }
    export function isContinueStatement(node: ts.Node): node is ts.ContinueStatement {
        return node.kind === ts.SyntaxKind.ContinueStatement;
    }
    export function isBreakStatement(node: ts.Node): node is ts.BreakStatement {
        return node.kind === ts.SyntaxKind.BreakStatement;
    }
    export function isBreakOrContinueStatement(node: ts.Node): node is ts.BreakOrContinueStatement {
        return node.kind === ts.SyntaxKind.BreakStatement || node.kind === ts.SyntaxKind.ContinueStatement;
    }
    export function isReturnStatement(node: ts.Node): node is ts.ReturnStatement {
        return node.kind === ts.SyntaxKind.ReturnStatement;
    }
    export function isWithStatement(node: ts.Node): node is ts.WithStatement {
        return node.kind === ts.SyntaxKind.WithStatement;
    }
    export function isSwitchStatement(node: ts.Node): node is ts.SwitchStatement {
        return node.kind === ts.SyntaxKind.SwitchStatement;
    }
    export function isLabeledStatement(node: ts.Node): node is ts.LabeledStatement {
        return node.kind === ts.SyntaxKind.LabeledStatement;
    }
    export function isThrowStatement(node: ts.Node): node is ts.ThrowStatement {
        return node.kind === ts.SyntaxKind.ThrowStatement;
    }
    export function isTryStatement(node: ts.Node): node is ts.TryStatement {
        return node.kind === ts.SyntaxKind.TryStatement;
    }
    export function isDebuggerStatement(node: ts.Node): node is ts.DebuggerStatement {
        return node.kind === ts.SyntaxKind.DebuggerStatement;
    }
    export function isVariableDeclaration(node: ts.Node): node is ts.VariableDeclaration {
        return node.kind === ts.SyntaxKind.VariableDeclaration;
    }
    export function isVariableDeclarationList(node: ts.Node): node is ts.VariableDeclarationList {
        return node.kind === ts.SyntaxKind.VariableDeclarationList;
    }
    export function isFunctionDeclaration(node: ts.Node): node is ts.FunctionDeclaration {
        return node.kind === ts.SyntaxKind.FunctionDeclaration;
    }
    export function isClassDeclaration(node: ts.Node): node is ts.ClassDeclaration {
        return node.kind === ts.SyntaxKind.ClassDeclaration;
    }
    export function isInterfaceDeclaration(node: ts.Node): node is ts.InterfaceDeclaration {
        return node.kind === ts.SyntaxKind.InterfaceDeclaration;
    }
    export function isTypeAliasDeclaration(node: ts.Node): node is ts.TypeAliasDeclaration {
        return node.kind === ts.SyntaxKind.TypeAliasDeclaration;
    }
    export function isEnumDeclaration(node: ts.Node): node is ts.EnumDeclaration {
        return node.kind === ts.SyntaxKind.EnumDeclaration;
    }
    export function isModuleDeclaration(node: ts.Node): node is ts.ModuleDeclaration {
        return node.kind === ts.SyntaxKind.ModuleDeclaration;
    }
    export function isModuleBlock(node: ts.Node): node is ts.ModuleBlock {
        return node.kind === ts.SyntaxKind.ModuleBlock;
    }
    export function isCaseBlock(node: ts.Node): node is ts.CaseBlock {
        return node.kind === ts.SyntaxKind.CaseBlock;
    }
    export function isNamespaceExportDeclaration(node: ts.Node): node is ts.NamespaceExportDeclaration {
        return node.kind === ts.SyntaxKind.NamespaceExportDeclaration;
    }
    export function isImportEqualsDeclaration(node: ts.Node): node is ts.ImportEqualsDeclaration {
        return node.kind === ts.SyntaxKind.ImportEqualsDeclaration;
    }
    export function isImportDeclaration(node: ts.Node): node is ts.ImportDeclaration {
        return node.kind === ts.SyntaxKind.ImportDeclaration;
    }
    export function isImportClause(node: ts.Node): node is ts.ImportClause {
        return node.kind === ts.SyntaxKind.ImportClause;
    }
    export function isNamespaceImport(node: ts.Node): node is ts.NamespaceImport {
        return node.kind === ts.SyntaxKind.NamespaceImport;
    }
    export function isNamedImports(node: ts.Node): node is ts.NamedImports {
        return node.kind === ts.SyntaxKind.NamedImports;
    }
    export function isImportSpecifier(node: ts.Node): node is ts.ImportSpecifier {
        return node.kind === ts.SyntaxKind.ImportSpecifier;
    }
    export function isExportAssignment(node: ts.Node): node is ts.ExportAssignment {
        return node.kind === ts.SyntaxKind.ExportAssignment;
    }
    export function isExportDeclaration(node: ts.Node): node is ts.ExportDeclaration {
        return node.kind === ts.SyntaxKind.ExportDeclaration;
    }
    export function isNamedExports(node: ts.Node): node is ts.NamedExports {
        return node.kind === ts.SyntaxKind.NamedExports;
    }
    export function isExportSpecifier(node: ts.Node): node is ts.ExportSpecifier {
        return node.kind === ts.SyntaxKind.ExportSpecifier;
    }
    export function isMissingDeclaration(node: ts.Node): node is ts.MissingDeclaration {
        return node.kind === ts.SyntaxKind.MissingDeclaration;
    }
    // Module References
    export function isExternalModuleReference(node: ts.Node): node is ts.ExternalModuleReference {
        return node.kind === ts.SyntaxKind.ExternalModuleReference;
    }
    // JSX
    export function isJsxElement(node: ts.Node): node is ts.JsxElement {
        return node.kind === ts.SyntaxKind.JsxElement;
    }
    export function isJsxSelfClosingElement(node: ts.Node): node is ts.JsxSelfClosingElement {
        return node.kind === ts.SyntaxKind.JsxSelfClosingElement;
    }
    export function isJsxOpeningElement(node: ts.Node): node is ts.JsxOpeningElement {
        return node.kind === ts.SyntaxKind.JsxOpeningElement;
    }
    export function isJsxClosingElement(node: ts.Node): node is ts.JsxClosingElement {
        return node.kind === ts.SyntaxKind.JsxClosingElement;
    }
    export function isJsxFragment(node: ts.Node): node is ts.JsxFragment {
        return node.kind === ts.SyntaxKind.JsxFragment;
    }
    export function isJsxOpeningFragment(node: ts.Node): node is ts.JsxOpeningFragment {
        return node.kind === ts.SyntaxKind.JsxOpeningFragment;
    }
    export function isJsxClosingFragment(node: ts.Node): node is ts.JsxClosingFragment {
        return node.kind === ts.SyntaxKind.JsxClosingFragment;
    }
    export function isJsxAttribute(node: ts.Node): node is ts.JsxAttribute {
        return node.kind === ts.SyntaxKind.JsxAttribute;
    }
    export function isJsxAttributes(node: ts.Node): node is ts.JsxAttributes {
        return node.kind === ts.SyntaxKind.JsxAttributes;
    }
    export function isJsxSpreadAttribute(node: ts.Node): node is ts.JsxSpreadAttribute {
        return node.kind === ts.SyntaxKind.JsxSpreadAttribute;
    }
    export function isJsxExpression(node: ts.Node): node is ts.JsxExpression {
        return node.kind === ts.SyntaxKind.JsxExpression;
    }
    // Clauses
    export function isCaseClause(node: ts.Node): node is ts.CaseClause {
        return node.kind === ts.SyntaxKind.CaseClause;
    }
    export function isDefaultClause(node: ts.Node): node is ts.DefaultClause {
        return node.kind === ts.SyntaxKind.DefaultClause;
    }
    export function isHeritageClause(node: ts.Node): node is ts.HeritageClause {
        return node.kind === ts.SyntaxKind.HeritageClause;
    }
    export function isCatchClause(node: ts.Node): node is ts.CatchClause {
        return node.kind === ts.SyntaxKind.CatchClause;
    }
    // Property assignments
    export function isPropertyAssignment(node: ts.Node): node is ts.PropertyAssignment {
        return node.kind === ts.SyntaxKind.PropertyAssignment;
    }
    export function isShorthandPropertyAssignment(node: ts.Node): node is ts.ShorthandPropertyAssignment {
        return node.kind === ts.SyntaxKind.ShorthandPropertyAssignment;
    }
    export function isSpreadAssignment(node: ts.Node): node is ts.SpreadAssignment {
        return node.kind === ts.SyntaxKind.SpreadAssignment;
    }
    // Enum
    export function isEnumMember(node: ts.Node): node is ts.EnumMember {
        return node.kind === ts.SyntaxKind.EnumMember;
    }
    // Top-level nodes
    export function isSourceFile(node: ts.Node): node is ts.SourceFile {
        return node.kind === ts.SyntaxKind.SourceFile;
    }
    export function isBundle(node: ts.Node): node is ts.Bundle {
        return node.kind === ts.SyntaxKind.Bundle;
    }
    export function isUnparsedSource(node: ts.Node): node is ts.UnparsedSource {
        return node.kind === ts.SyntaxKind.UnparsedSource;
    }
    export function isUnparsedPrepend(node: ts.Node): node is ts.UnparsedPrepend {
        return node.kind === ts.SyntaxKind.UnparsedPrepend;
    }
    export function isUnparsedTextLike(node: ts.Node): node is ts.UnparsedTextLike {
        switch (node.kind) {
            case ts.SyntaxKind.UnparsedText:
            case ts.SyntaxKind.UnparsedInternalText:
                return true;
            default:
                return false;
        }
    }
    export function isUnparsedNode(node: ts.Node): node is ts.UnparsedNode {
        return isUnparsedTextLike(node) ||
            node.kind === ts.SyntaxKind.UnparsedPrologue ||
            node.kind === ts.SyntaxKind.UnparsedSyntheticReference;
    }
    // JSDoc
    export function isJSDocTypeExpression(node: ts.Node): node is ts.JSDocTypeExpression {
        return node.kind === ts.SyntaxKind.JSDocTypeExpression;
    }
    export function isJSDocAllType(node: ts.Node): node is ts.JSDocAllType {
        return node.kind === ts.SyntaxKind.JSDocAllType;
    }
    export function isJSDocUnknownType(node: ts.Node): node is ts.JSDocUnknownType {
        return node.kind === ts.SyntaxKind.JSDocUnknownType;
    }
    export function isJSDocNullableType(node: ts.Node): node is ts.JSDocNullableType {
        return node.kind === ts.SyntaxKind.JSDocNullableType;
    }
    export function isJSDocNonNullableType(node: ts.Node): node is ts.JSDocNonNullableType {
        return node.kind === ts.SyntaxKind.JSDocNonNullableType;
    }
    export function isJSDocOptionalType(node: ts.Node): node is ts.JSDocOptionalType {
        return node.kind === ts.SyntaxKind.JSDocOptionalType;
    }
    export function isJSDocFunctionType(node: ts.Node): node is ts.JSDocFunctionType {
        return node.kind === ts.SyntaxKind.JSDocFunctionType;
    }
    export function isJSDocVariadicType(node: ts.Node): node is ts.JSDocVariadicType {
        return node.kind === ts.SyntaxKind.JSDocVariadicType;
    }
    export function isJSDoc(node: ts.Node): node is ts.JSDoc {
        return node.kind === ts.SyntaxKind.JSDocComment;
    }
    export function isJSDocAuthorTag(node: ts.Node): node is ts.JSDocAuthorTag {
        return node.kind === ts.SyntaxKind.JSDocAuthorTag;
    }
    export function isJSDocAugmentsTag(node: ts.Node): node is ts.JSDocAugmentsTag {
        return node.kind === ts.SyntaxKind.JSDocAugmentsTag;
    }
    export function isJSDocClassTag(node: ts.Node): node is ts.JSDocClassTag {
        return node.kind === ts.SyntaxKind.JSDocClassTag;
    }
    export function isJSDocEnumTag(node: ts.Node): node is ts.JSDocEnumTag {
        return node.kind === ts.SyntaxKind.JSDocEnumTag;
    }
    export function isJSDocThisTag(node: ts.Node): node is ts.JSDocThisTag {
        return node.kind === ts.SyntaxKind.JSDocThisTag;
    }
    export function isJSDocParameterTag(node: ts.Node): node is ts.JSDocParameterTag {
        return node.kind === ts.SyntaxKind.JSDocParameterTag;
    }
    export function isJSDocReturnTag(node: ts.Node): node is ts.JSDocReturnTag {
        return node.kind === ts.SyntaxKind.JSDocReturnTag;
    }
    export function isJSDocTypeTag(node: ts.Node): node is ts.JSDocTypeTag {
        return node.kind === ts.SyntaxKind.JSDocTypeTag;
    }
    export function isJSDocTemplateTag(node: ts.Node): node is ts.JSDocTemplateTag {
        return node.kind === ts.SyntaxKind.JSDocTemplateTag;
    }
    export function isJSDocTypedefTag(node: ts.Node): node is ts.JSDocTypedefTag {
        return node.kind === ts.SyntaxKind.JSDocTypedefTag;
    }
    export function isJSDocPropertyTag(node: ts.Node): node is ts.JSDocPropertyTag {
        return node.kind === ts.SyntaxKind.JSDocPropertyTag;
    }
    export function isJSDocPropertyLikeTag(node: ts.Node): node is ts.JSDocPropertyLikeTag {
        return node.kind === ts.SyntaxKind.JSDocPropertyTag || node.kind === ts.SyntaxKind.JSDocParameterTag;
    }
    export function isJSDocTypeLiteral(node: ts.Node): node is ts.JSDocTypeLiteral {
        return node.kind === ts.SyntaxKind.JSDocTypeLiteral;
    }
    export function isJSDocCallbackTag(node: ts.Node): node is ts.JSDocCallbackTag {
        return node.kind === ts.SyntaxKind.JSDocCallbackTag;
    }
    export function isJSDocSignature(node: ts.Node): node is ts.JSDocSignature {
        return node.kind === ts.SyntaxKind.JSDocSignature;
    }
    // #endregion
    // #region
    // Node tests
    //
    // All node tests in the following list should *not* reference parent pointers so that
    // they may be used with transformations.
    /* @internal */
    export function isSyntaxList(n: ts.Node): n is ts.SyntaxList {
        return n.kind === ts.SyntaxKind.SyntaxList;
    }
    /* @internal */
    export function isNode(node: ts.Node) {
        return isNodeKind(node.kind);
    }
    /* @internal */
    export function isNodeKind(kind: ts.SyntaxKind) {
        return kind >= ts.SyntaxKind.FirstNode;
    }
    /**
     * True if node is of some token syntax kind.
     * For example, this is true for an IfKeyword but not for an IfStatement.
     * Literals are considered tokens, except TemplateLiteral, but does include TemplateHead/Middle/Tail.
     */
    export function isToken(n: ts.Node): boolean {
        return n.kind >= ts.SyntaxKind.FirstToken && n.kind <= ts.SyntaxKind.LastToken;
    }
    // Node Arrays
    /* @internal */
    export function isNodeArray<T extends ts.Node>(array: readonly T[]): array is ts.NodeArray<T> {
        return array.hasOwnProperty("pos") && array.hasOwnProperty("end");
    }
    // Literals
    /* @internal */
    export function isLiteralKind(kind: ts.SyntaxKind): boolean {
        return ts.SyntaxKind.FirstLiteralToken <= kind && kind <= ts.SyntaxKind.LastLiteralToken;
    }
    export function isLiteralExpression(node: ts.Node): node is ts.LiteralExpression {
        return isLiteralKind(node.kind);
    }
    // Pseudo-literals
    /* @internal */
    export function isTemplateLiteralKind(kind: ts.SyntaxKind): boolean {
        return ts.SyntaxKind.FirstTemplateToken <= kind && kind <= ts.SyntaxKind.LastTemplateToken;
    }
    export type TemplateLiteralToken = ts.NoSubstitutionTemplateLiteral | ts.TemplateHead | ts.TemplateMiddle | ts.TemplateTail;
    export function isTemplateLiteralToken(node: ts.Node): node is TemplateLiteralToken {
        return isTemplateLiteralKind(node.kind);
    }
    export function isTemplateMiddleOrTemplateTail(node: ts.Node): node is ts.TemplateMiddle | ts.TemplateTail {
        const kind = node.kind;
        return kind === ts.SyntaxKind.TemplateMiddle
            || kind === ts.SyntaxKind.TemplateTail;
    }
    export function isImportOrExportSpecifier(node: ts.Node): node is ts.ImportSpecifier | ts.ExportSpecifier {
        return isImportSpecifier(node) || isExportSpecifier(node);
    }
    export function isStringTextContainingNode(node: ts.Node): node is ts.StringLiteral | TemplateLiteralToken {
        return node.kind === ts.SyntaxKind.StringLiteral || isTemplateLiteralKind(node.kind);
    }
    // Identifiers
    /* @internal */
    export function isGeneratedIdentifier(node: ts.Node): node is ts.GeneratedIdentifier {
        return isIdentifier(node) && ((node.autoGenerateFlags!) & ts.GeneratedIdentifierFlags.KindMask) > ts.GeneratedIdentifierFlags.None;
    }
    // Keywords
    /* @internal */
    export function isModifierKind(token: ts.SyntaxKind): token is ts.Modifier["kind"] {
        switch (token) {
            case ts.SyntaxKind.AbstractKeyword:
            case ts.SyntaxKind.AsyncKeyword:
            case ts.SyntaxKind.ConstKeyword:
            case ts.SyntaxKind.DeclareKeyword:
            case ts.SyntaxKind.DefaultKeyword:
            case ts.SyntaxKind.ExportKeyword:
            case ts.SyntaxKind.PublicKeyword:
            case ts.SyntaxKind.PrivateKeyword:
            case ts.SyntaxKind.ProtectedKeyword:
            case ts.SyntaxKind.ReadonlyKeyword:
            case ts.SyntaxKind.StaticKeyword:
                return true;
        }
        return false;
    }
    /* @internal */
    export function isParameterPropertyModifier(kind: ts.SyntaxKind): boolean {
        return !!(ts.modifierToFlag(kind) & ts.ModifierFlags.ParameterPropertyModifier);
    }
    /* @internal */
    export function isClassMemberModifier(idToken: ts.SyntaxKind): boolean {
        return isParameterPropertyModifier(idToken) || idToken === ts.SyntaxKind.StaticKeyword;
    }
    export function isModifier(node: ts.Node): node is ts.Modifier {
        return isModifierKind(node.kind);
    }
    export function isEntityName(node: ts.Node): node is ts.EntityName {
        const kind = node.kind;
        return kind === ts.SyntaxKind.QualifiedName
            || kind === ts.SyntaxKind.Identifier;
    }
    export function isPropertyName(node: ts.Node): node is ts.PropertyName {
        const kind = node.kind;
        return kind === ts.SyntaxKind.Identifier
            || kind === ts.SyntaxKind.StringLiteral
            || kind === ts.SyntaxKind.NumericLiteral
            || kind === ts.SyntaxKind.ComputedPropertyName;
    }
    export function isBindingName(node: ts.Node): node is ts.BindingName {
        const kind = node.kind;
        return kind === ts.SyntaxKind.Identifier
            || kind === ts.SyntaxKind.ObjectBindingPattern
            || kind === ts.SyntaxKind.ArrayBindingPattern;
    }
    // Functions
    export function isFunctionLike(node: ts.Node): node is ts.SignatureDeclaration {
        return node && isFunctionLikeKind(node.kind);
    }
    /* @internal */
    export function isFunctionLikeDeclaration(node: ts.Node): node is ts.FunctionLikeDeclaration {
        return node && isFunctionLikeDeclarationKind(node.kind);
    }
    function isFunctionLikeDeclarationKind(kind: ts.SyntaxKind): boolean {
        switch (kind) {
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.Constructor:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.ArrowFunction:
                return true;
            default:
                return false;
        }
    }
    /* @internal */
    export function isFunctionLikeKind(kind: ts.SyntaxKind): boolean {
        switch (kind) {
            case ts.SyntaxKind.MethodSignature:
            case ts.SyntaxKind.CallSignature:
            case ts.SyntaxKind.JSDocSignature:
            case ts.SyntaxKind.ConstructSignature:
            case ts.SyntaxKind.IndexSignature:
            case ts.SyntaxKind.FunctionType:
            case ts.SyntaxKind.JSDocFunctionType:
            case ts.SyntaxKind.ConstructorType:
                return true;
            default:
                return isFunctionLikeDeclarationKind(kind);
        }
    }
    /* @internal */
    export function isFunctionOrModuleBlock(node: ts.Node): boolean {
        return isSourceFile(node) || isModuleBlock(node) || isBlock(node) && isFunctionLike(node.parent);
    }
    // Classes
    export function isClassElement(node: ts.Node): node is ts.ClassElement {
        const kind = node.kind;
        return kind === ts.SyntaxKind.Constructor
            || kind === ts.SyntaxKind.PropertyDeclaration
            || kind === ts.SyntaxKind.MethodDeclaration
            || kind === ts.SyntaxKind.GetAccessor
            || kind === ts.SyntaxKind.SetAccessor
            || kind === ts.SyntaxKind.IndexSignature
            || kind === ts.SyntaxKind.SemicolonClassElement;
    }
    export function isClassLike(node: ts.Node): node is ts.ClassLikeDeclaration {
        return node && (node.kind === ts.SyntaxKind.ClassDeclaration || node.kind === ts.SyntaxKind.ClassExpression);
    }
    export function isAccessor(node: ts.Node): node is ts.AccessorDeclaration {
        return node && (node.kind === ts.SyntaxKind.GetAccessor || node.kind === ts.SyntaxKind.SetAccessor);
    }
    /* @internal */
    export function isMethodOrAccessor(node: ts.Node): node is ts.MethodDeclaration | ts.AccessorDeclaration {
        switch (node.kind) {
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
                return true;
            default:
                return false;
        }
    }
    // Type members
    export function isTypeElement(node: ts.Node): node is ts.TypeElement {
        const kind = node.kind;
        return kind === ts.SyntaxKind.ConstructSignature
            || kind === ts.SyntaxKind.CallSignature
            || kind === ts.SyntaxKind.PropertySignature
            || kind === ts.SyntaxKind.MethodSignature
            || kind === ts.SyntaxKind.IndexSignature;
    }
    export function isClassOrTypeElement(node: ts.Node): node is ts.ClassElement | ts.TypeElement {
        return isTypeElement(node) || isClassElement(node);
    }
    export function isObjectLiteralElementLike(node: ts.Node): node is ts.ObjectLiteralElementLike {
        const kind = node.kind;
        return kind === ts.SyntaxKind.PropertyAssignment
            || kind === ts.SyntaxKind.ShorthandPropertyAssignment
            || kind === ts.SyntaxKind.SpreadAssignment
            || kind === ts.SyntaxKind.MethodDeclaration
            || kind === ts.SyntaxKind.GetAccessor
            || kind === ts.SyntaxKind.SetAccessor;
    }
    // Type
    /**
     * Node test that determines whether a node is a valid type node.
     * This differs from the `isPartOfTypeNode` function which determines whether a node is *part*
     * of a TypeNode.
     */
    export function isTypeNode(node: ts.Node): node is ts.TypeNode {
        return ts.isTypeNodeKind(node.kind);
    }
    export function isFunctionOrConstructorTypeNode(node: ts.Node): node is ts.FunctionTypeNode | ts.ConstructorTypeNode {
        switch (node.kind) {
            case ts.SyntaxKind.FunctionType:
            case ts.SyntaxKind.ConstructorType:
                return true;
        }
        return false;
    }
    // Binding patterns
    /* @internal */
    export function isBindingPattern(node: ts.Node | undefined): node is ts.BindingPattern {
        if (node) {
            const kind = node.kind;
            return kind === ts.SyntaxKind.ArrayBindingPattern
                || kind === ts.SyntaxKind.ObjectBindingPattern;
        }
        return false;
    }
    /* @internal */
    export function isAssignmentPattern(node: ts.Node): node is ts.AssignmentPattern {
        const kind = node.kind;
        return kind === ts.SyntaxKind.ArrayLiteralExpression
            || kind === ts.SyntaxKind.ObjectLiteralExpression;
    }
    /* @internal */
    export function isArrayBindingElement(node: ts.Node): node is ts.ArrayBindingElement {
        const kind = node.kind;
        return kind === ts.SyntaxKind.BindingElement
            || kind === ts.SyntaxKind.OmittedExpression;
    }
    /**
     * Determines whether the BindingOrAssignmentElement is a BindingElement-like declaration
     */
    /* @internal */
    export function isDeclarationBindingElement(bindingElement: ts.BindingOrAssignmentElement): bindingElement is ts.VariableDeclaration | ts.ParameterDeclaration | ts.BindingElement {
        switch (bindingElement.kind) {
            case ts.SyntaxKind.VariableDeclaration:
            case ts.SyntaxKind.Parameter:
            case ts.SyntaxKind.BindingElement:
                return true;
        }
        return false;
    }
    /**
     * Determines whether a node is a BindingOrAssignmentPattern
     */
    /* @internal */
    export function isBindingOrAssignmentPattern(node: ts.BindingOrAssignmentElementTarget): node is ts.BindingOrAssignmentPattern {
        return isObjectBindingOrAssignmentPattern(node)
            || isArrayBindingOrAssignmentPattern(node);
    }
    /**
     * Determines whether a node is an ObjectBindingOrAssignmentPattern
     */
    /* @internal */
    export function isObjectBindingOrAssignmentPattern(node: ts.BindingOrAssignmentElementTarget): node is ts.ObjectBindingOrAssignmentPattern {
        switch (node.kind) {
            case ts.SyntaxKind.ObjectBindingPattern:
            case ts.SyntaxKind.ObjectLiteralExpression:
                return true;
        }
        return false;
    }
    /**
     * Determines whether a node is an ArrayBindingOrAssignmentPattern
     */
    /* @internal */
    export function isArrayBindingOrAssignmentPattern(node: ts.BindingOrAssignmentElementTarget): node is ts.ArrayBindingOrAssignmentPattern {
        switch (node.kind) {
            case ts.SyntaxKind.ArrayBindingPattern:
            case ts.SyntaxKind.ArrayLiteralExpression:
                return true;
        }
        return false;
    }
    /* @internal */
    export function isPropertyAccessOrQualifiedNameOrImportTypeNode(node: ts.Node): node is ts.PropertyAccessExpression | ts.QualifiedName | ts.ImportTypeNode {
        const kind = node.kind;
        return kind === ts.SyntaxKind.PropertyAccessExpression
            || kind === ts.SyntaxKind.QualifiedName
            || kind === ts.SyntaxKind.ImportType;
    }
    // Expression
    export function isPropertyAccessOrQualifiedName(node: ts.Node): node is ts.PropertyAccessExpression | ts.QualifiedName {
        const kind = node.kind;
        return kind === ts.SyntaxKind.PropertyAccessExpression
            || kind === ts.SyntaxKind.QualifiedName;
    }
    export function isCallLikeExpression(node: ts.Node): node is ts.CallLikeExpression {
        switch (node.kind) {
            case ts.SyntaxKind.JsxOpeningElement:
            case ts.SyntaxKind.JsxSelfClosingElement:
            case ts.SyntaxKind.CallExpression:
            case ts.SyntaxKind.NewExpression:
            case ts.SyntaxKind.TaggedTemplateExpression:
            case ts.SyntaxKind.Decorator:
                return true;
            default:
                return false;
        }
    }
    export function isCallOrNewExpression(node: ts.Node): node is ts.CallExpression | ts.NewExpression {
        return node.kind === ts.SyntaxKind.CallExpression || node.kind === ts.SyntaxKind.NewExpression;
    }
    export function isTemplateLiteral(node: ts.Node): node is ts.TemplateLiteral {
        const kind = node.kind;
        return kind === ts.SyntaxKind.TemplateExpression
            || kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral;
    }
    /* @internal */
    export function isLeftHandSideExpression(node: ts.Node): node is ts.LeftHandSideExpression {
        return isLeftHandSideExpressionKind(skipPartiallyEmittedExpressions(node).kind);
    }
    function isLeftHandSideExpressionKind(kind: ts.SyntaxKind): boolean {
        switch (kind) {
            case ts.SyntaxKind.PropertyAccessExpression:
            case ts.SyntaxKind.ElementAccessExpression:
            case ts.SyntaxKind.NewExpression:
            case ts.SyntaxKind.CallExpression:
            case ts.SyntaxKind.JsxElement:
            case ts.SyntaxKind.JsxSelfClosingElement:
            case ts.SyntaxKind.JsxFragment:
            case ts.SyntaxKind.TaggedTemplateExpression:
            case ts.SyntaxKind.ArrayLiteralExpression:
            case ts.SyntaxKind.ParenthesizedExpression:
            case ts.SyntaxKind.ObjectLiteralExpression:
            case ts.SyntaxKind.ClassExpression:
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.Identifier:
            case ts.SyntaxKind.RegularExpressionLiteral:
            case ts.SyntaxKind.NumericLiteral:
            case ts.SyntaxKind.BigIntLiteral:
            case ts.SyntaxKind.StringLiteral:
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
            case ts.SyntaxKind.TemplateExpression:
            case ts.SyntaxKind.FalseKeyword:
            case ts.SyntaxKind.NullKeyword:
            case ts.SyntaxKind.ThisKeyword:
            case ts.SyntaxKind.TrueKeyword:
            case ts.SyntaxKind.SuperKeyword:
            case ts.SyntaxKind.NonNullExpression:
            case ts.SyntaxKind.MetaProperty:
            case ts.SyntaxKind.ImportKeyword: // technically this is only an Expression if it's in a CallExpression
                return true;
            default:
                return false;
        }
    }
    /* @internal */
    export function isUnaryExpression(node: ts.Node): node is ts.UnaryExpression {
        return isUnaryExpressionKind(skipPartiallyEmittedExpressions(node).kind);
    }
    function isUnaryExpressionKind(kind: ts.SyntaxKind): boolean {
        switch (kind) {
            case ts.SyntaxKind.PrefixUnaryExpression:
            case ts.SyntaxKind.PostfixUnaryExpression:
            case ts.SyntaxKind.DeleteExpression:
            case ts.SyntaxKind.TypeOfExpression:
            case ts.SyntaxKind.VoidExpression:
            case ts.SyntaxKind.AwaitExpression:
            case ts.SyntaxKind.TypeAssertionExpression:
                return true;
            default:
                return isLeftHandSideExpressionKind(kind);
        }
    }
    /* @internal */
    export function isUnaryExpressionWithWrite(expr: ts.Node): expr is ts.PrefixUnaryExpression | ts.PostfixUnaryExpression {
        switch (expr.kind) {
            case ts.SyntaxKind.PostfixUnaryExpression:
                return true;
            case ts.SyntaxKind.PrefixUnaryExpression:
                return (<ts.PrefixUnaryExpression>expr).operator === ts.SyntaxKind.PlusPlusToken ||
                    (<ts.PrefixUnaryExpression>expr).operator === ts.SyntaxKind.MinusMinusToken;
            default:
                return false;
        }
    }
    /* @internal */
    /**
     * Determines whether a node is an expression based only on its kind.
     * Use `isExpressionNode` if not in transforms.
     */
    export function isExpression(node: ts.Node): node is ts.Expression {
        return isExpressionKind(skipPartiallyEmittedExpressions(node).kind);
    }
    function isExpressionKind(kind: ts.SyntaxKind): boolean {
        switch (kind) {
            case ts.SyntaxKind.ConditionalExpression:
            case ts.SyntaxKind.YieldExpression:
            case ts.SyntaxKind.ArrowFunction:
            case ts.SyntaxKind.BinaryExpression:
            case ts.SyntaxKind.SpreadElement:
            case ts.SyntaxKind.AsExpression:
            case ts.SyntaxKind.OmittedExpression:
            case ts.SyntaxKind.CommaListExpression:
            case ts.SyntaxKind.PartiallyEmittedExpression:
                return true;
            default:
                return isUnaryExpressionKind(kind);
        }
    }
    export function isAssertionExpression(node: ts.Node): node is ts.AssertionExpression {
        const kind = node.kind;
        return kind === ts.SyntaxKind.TypeAssertionExpression
            || kind === ts.SyntaxKind.AsExpression;
    }
    /* @internal */
    export function isPartiallyEmittedExpression(node: ts.Node): node is ts.PartiallyEmittedExpression {
        return node.kind === ts.SyntaxKind.PartiallyEmittedExpression;
    }
    /* @internal */
    export function isNotEmittedStatement(node: ts.Node): node is ts.NotEmittedStatement {
        return node.kind === ts.SyntaxKind.NotEmittedStatement;
    }
    /* @internal */
    export function isSyntheticReference(node: ts.Node): node is ts.SyntheticReferenceExpression {
        return node.kind === ts.SyntaxKind.SyntheticReferenceExpression;
    }
    /* @internal */
    export function isNotEmittedOrPartiallyEmittedNode(node: ts.Node): node is ts.NotEmittedStatement | ts.PartiallyEmittedExpression {
        return isNotEmittedStatement(node)
            || isPartiallyEmittedExpression(node);
    }
    // Statement
    export function isIterationStatement(node: ts.Node, lookInLabeledStatements: false): node is ts.IterationStatement;
    export function isIterationStatement(node: ts.Node, lookInLabeledStatements: boolean): node is ts.IterationStatement | ts.LabeledStatement;
    export function isIterationStatement(node: ts.Node, lookInLabeledStatements: boolean): node is ts.IterationStatement {
        switch (node.kind) {
            case ts.SyntaxKind.ForStatement:
            case ts.SyntaxKind.ForInStatement:
            case ts.SyntaxKind.ForOfStatement:
            case ts.SyntaxKind.DoStatement:
            case ts.SyntaxKind.WhileStatement:
                return true;
            case ts.SyntaxKind.LabeledStatement:
                return lookInLabeledStatements && isIterationStatement((<ts.LabeledStatement>node).statement, lookInLabeledStatements);
        }
        return false;
    }
    /* @internal */
    export function isScopeMarker(node: ts.Node) {
        return isExportAssignment(node) || isExportDeclaration(node);
    }
    /* @internal */
    export function hasScopeMarker(statements: readonly ts.Statement[]) {
        return ts.some(statements, isScopeMarker);
    }
    /* @internal */
    export function needsScopeMarker(result: ts.Statement) {
        return !ts.isAnyImportOrReExport(result) && !isExportAssignment(result) && !ts.hasModifier(result, ts.ModifierFlags.Export) && !ts.isAmbientModule(result);
    }
    /* @internal */
    export function isExternalModuleIndicator(result: ts.Statement) {
        // Exported top-level member indicates moduleness
        return ts.isAnyImportOrReExport(result) || isExportAssignment(result) || ts.hasModifier(result, ts.ModifierFlags.Export);
    }
    /* @internal */
    export function isForInOrOfStatement(node: ts.Node): node is ts.ForInOrOfStatement {
        return node.kind === ts.SyntaxKind.ForInStatement || node.kind === ts.SyntaxKind.ForOfStatement;
    }
    // Element
    /* @internal */
    export function isConciseBody(node: ts.Node): node is ts.ConciseBody {
        return isBlock(node)
            || isExpression(node);
    }
    /* @internal */
    export function isFunctionBody(node: ts.Node): node is ts.FunctionBody {
        return isBlock(node);
    }
    /* @internal */
    export function isForInitializer(node: ts.Node): node is ts.ForInitializer {
        return isVariableDeclarationList(node)
            || isExpression(node);
    }
    /* @internal */
    export function isModuleBody(node: ts.Node): node is ts.ModuleBody {
        const kind = node.kind;
        return kind === ts.SyntaxKind.ModuleBlock
            || kind === ts.SyntaxKind.ModuleDeclaration
            || kind === ts.SyntaxKind.Identifier;
    }
    /* @internal */
    export function isNamespaceBody(node: ts.Node): node is ts.NamespaceBody {
        const kind = node.kind;
        return kind === ts.SyntaxKind.ModuleBlock
            || kind === ts.SyntaxKind.ModuleDeclaration;
    }
    /* @internal */
    export function isJSDocNamespaceBody(node: ts.Node): node is ts.JSDocNamespaceBody {
        const kind = node.kind;
        return kind === ts.SyntaxKind.Identifier
            || kind === ts.SyntaxKind.ModuleDeclaration;
    }
    /* @internal */
    export function isNamedImportBindings(node: ts.Node): node is ts.NamedImportBindings {
        const kind = node.kind;
        return kind === ts.SyntaxKind.NamedImports
            || kind === ts.SyntaxKind.NamespaceImport;
    }
    /* @internal */
    export function isModuleOrEnumDeclaration(node: ts.Node): node is ts.ModuleDeclaration | ts.EnumDeclaration {
        return node.kind === ts.SyntaxKind.ModuleDeclaration || node.kind === ts.SyntaxKind.EnumDeclaration;
    }
    function isDeclarationKind(kind: ts.SyntaxKind) {
        return kind === ts.SyntaxKind.ArrowFunction
            || kind === ts.SyntaxKind.BindingElement
            || kind === ts.SyntaxKind.ClassDeclaration
            || kind === ts.SyntaxKind.ClassExpression
            || kind === ts.SyntaxKind.Constructor
            || kind === ts.SyntaxKind.EnumDeclaration
            || kind === ts.SyntaxKind.EnumMember
            || kind === ts.SyntaxKind.ExportSpecifier
            || kind === ts.SyntaxKind.FunctionDeclaration
            || kind === ts.SyntaxKind.FunctionExpression
            || kind === ts.SyntaxKind.GetAccessor
            || kind === ts.SyntaxKind.ImportClause
            || kind === ts.SyntaxKind.ImportEqualsDeclaration
            || kind === ts.SyntaxKind.ImportSpecifier
            || kind === ts.SyntaxKind.InterfaceDeclaration
            || kind === ts.SyntaxKind.JsxAttribute
            || kind === ts.SyntaxKind.MethodDeclaration
            || kind === ts.SyntaxKind.MethodSignature
            || kind === ts.SyntaxKind.ModuleDeclaration
            || kind === ts.SyntaxKind.NamespaceExportDeclaration
            || kind === ts.SyntaxKind.NamespaceImport
            || kind === ts.SyntaxKind.Parameter
            || kind === ts.SyntaxKind.PropertyAssignment
            || kind === ts.SyntaxKind.PropertyDeclaration
            || kind === ts.SyntaxKind.PropertySignature
            || kind === ts.SyntaxKind.SetAccessor
            || kind === ts.SyntaxKind.ShorthandPropertyAssignment
            || kind === ts.SyntaxKind.TypeAliasDeclaration
            || kind === ts.SyntaxKind.TypeParameter
            || kind === ts.SyntaxKind.VariableDeclaration
            || kind === ts.SyntaxKind.JSDocTypedefTag
            || kind === ts.SyntaxKind.JSDocCallbackTag
            || kind === ts.SyntaxKind.JSDocPropertyTag;
    }
    function isDeclarationStatementKind(kind: ts.SyntaxKind) {
        return kind === ts.SyntaxKind.FunctionDeclaration
            || kind === ts.SyntaxKind.MissingDeclaration
            || kind === ts.SyntaxKind.ClassDeclaration
            || kind === ts.SyntaxKind.InterfaceDeclaration
            || kind === ts.SyntaxKind.TypeAliasDeclaration
            || kind === ts.SyntaxKind.EnumDeclaration
            || kind === ts.SyntaxKind.ModuleDeclaration
            || kind === ts.SyntaxKind.ImportDeclaration
            || kind === ts.SyntaxKind.ImportEqualsDeclaration
            || kind === ts.SyntaxKind.ExportDeclaration
            || kind === ts.SyntaxKind.ExportAssignment
            || kind === ts.SyntaxKind.NamespaceExportDeclaration;
    }
    function isStatementKindButNotDeclarationKind(kind: ts.SyntaxKind) {
        return kind === ts.SyntaxKind.BreakStatement
            || kind === ts.SyntaxKind.ContinueStatement
            || kind === ts.SyntaxKind.DebuggerStatement
            || kind === ts.SyntaxKind.DoStatement
            || kind === ts.SyntaxKind.ExpressionStatement
            || kind === ts.SyntaxKind.EmptyStatement
            || kind === ts.SyntaxKind.ForInStatement
            || kind === ts.SyntaxKind.ForOfStatement
            || kind === ts.SyntaxKind.ForStatement
            || kind === ts.SyntaxKind.IfStatement
            || kind === ts.SyntaxKind.LabeledStatement
            || kind === ts.SyntaxKind.ReturnStatement
            || kind === ts.SyntaxKind.SwitchStatement
            || kind === ts.SyntaxKind.ThrowStatement
            || kind === ts.SyntaxKind.TryStatement
            || kind === ts.SyntaxKind.VariableStatement
            || kind === ts.SyntaxKind.WhileStatement
            || kind === ts.SyntaxKind.WithStatement
            || kind === ts.SyntaxKind.NotEmittedStatement
            || kind === ts.SyntaxKind.EndOfDeclarationMarker
            || kind === ts.SyntaxKind.MergeDeclarationMarker;
    }
    /* @internal */
    export function isDeclaration(node: ts.Node): node is ts.NamedDeclaration {
        if (node.kind === ts.SyntaxKind.TypeParameter) {
            return (node.parent && node.parent.kind !== ts.SyntaxKind.JSDocTemplateTag) || ts.isInJSFile(node);
        }
        return isDeclarationKind(node.kind);
    }
    /* @internal */
    export function isDeclarationStatement(node: ts.Node): node is ts.DeclarationStatement {
        return isDeclarationStatementKind(node.kind);
    }
    /**
     * Determines whether the node is a statement that is not also a declaration
     */
    /* @internal */
    export function isStatementButNotDeclaration(node: ts.Node): node is ts.Statement {
        return isStatementKindButNotDeclarationKind(node.kind);
    }
    /* @internal */
    export function isStatement(node: ts.Node): node is ts.Statement {
        const kind = node.kind;
        return isStatementKindButNotDeclarationKind(kind)
            || isDeclarationStatementKind(kind)
            || isBlockStatement(node);
    }
    function isBlockStatement(node: ts.Node): node is ts.Block {
        if (node.kind !== ts.SyntaxKind.Block)
            return false;
        if (node.parent !== undefined) {
            if (node.parent.kind === ts.SyntaxKind.TryStatement || node.parent.kind === ts.SyntaxKind.CatchClause) {
                return false;
            }
        }
        return !ts.isFunctionBlock(node);
    }
    // Module references
    /* @internal */
    export function isModuleReference(node: ts.Node): node is ts.ModuleReference {
        const kind = node.kind;
        return kind === ts.SyntaxKind.ExternalModuleReference
            || kind === ts.SyntaxKind.QualifiedName
            || kind === ts.SyntaxKind.Identifier;
    }
    // JSX
    /* @internal */
    export function isJsxTagNameExpression(node: ts.Node): node is ts.JsxTagNameExpression {
        const kind = node.kind;
        return kind === ts.SyntaxKind.ThisKeyword
            || kind === ts.SyntaxKind.Identifier
            || kind === ts.SyntaxKind.PropertyAccessExpression;
    }
    /* @internal */
    export function isJsxChild(node: ts.Node): node is ts.JsxChild {
        const kind = node.kind;
        return kind === ts.SyntaxKind.JsxElement
            || kind === ts.SyntaxKind.JsxExpression
            || kind === ts.SyntaxKind.JsxSelfClosingElement
            || kind === ts.SyntaxKind.JsxText
            || kind === ts.SyntaxKind.JsxFragment;
    }
    /* @internal */
    export function isJsxAttributeLike(node: ts.Node): node is ts.JsxAttributeLike {
        const kind = node.kind;
        return kind === ts.SyntaxKind.JsxAttribute
            || kind === ts.SyntaxKind.JsxSpreadAttribute;
    }
    /* @internal */
    export function isStringLiteralOrJsxExpression(node: ts.Node): node is ts.StringLiteral | ts.JsxExpression {
        const kind = node.kind;
        return kind === ts.SyntaxKind.StringLiteral
            || kind === ts.SyntaxKind.JsxExpression;
    }
    export function isJsxOpeningLikeElement(node: ts.Node): node is ts.JsxOpeningLikeElement {
        const kind = node.kind;
        return kind === ts.SyntaxKind.JsxOpeningElement
            || kind === ts.SyntaxKind.JsxSelfClosingElement;
    }
    // Clauses
    export function isCaseOrDefaultClause(node: ts.Node): node is ts.CaseOrDefaultClause {
        const kind = node.kind;
        return kind === ts.SyntaxKind.CaseClause
            || kind === ts.SyntaxKind.DefaultClause;
    }
    // JSDoc
    /** True if node is of some JSDoc syntax kind. */
    /* @internal */
    export function isJSDocNode(node: ts.Node): boolean {
        return node.kind >= ts.SyntaxKind.FirstJSDocNode && node.kind <= ts.SyntaxKind.LastJSDocNode;
    }
    /** True if node is of a kind that may contain comment text. */
    export function isJSDocCommentContainingNode(node: ts.Node): boolean {
        return node.kind === ts.SyntaxKind.JSDocComment || isJSDocTag(node) || isJSDocTypeLiteral(node) || isJSDocSignature(node);
    }
    // TODO: determine what this does before making it public.
    /* @internal */
    export function isJSDocTag(node: ts.Node): node is ts.JSDocTag {
        return node.kind >= ts.SyntaxKind.FirstJSDocTagNode && node.kind <= ts.SyntaxKind.LastJSDocTagNode;
    }
    export function isSetAccessor(node: ts.Node): node is ts.SetAccessorDeclaration {
        return node.kind === ts.SyntaxKind.SetAccessor;
    }
    export function isGetAccessor(node: ts.Node): node is ts.GetAccessorDeclaration {
        return node.kind === ts.SyntaxKind.GetAccessor;
    }
    /** True if has jsdoc nodes attached to it. */
    /* @internal */
    // TODO: GH#19856 Would like to return `node is Node & { jsDoc: JSDoc[] }` but it causes long compile times
    export function hasJSDocNodes(node: ts.Node): node is ts.HasJSDoc {
        const { jsDoc } = (node as ts.JSDocContainer);
        return !!jsDoc && jsDoc.length > 0;
    }
    /** True if has type node attached to it. */
    /* @internal */
    export function hasType(node: ts.Node): node is ts.HasType {
        return !!(node as ts.HasType).type;
    }
    /** True if has initializer node attached to it. */
    /* @internal */
    export function hasInitializer(node: ts.Node): node is ts.HasInitializer {
        return !!(node as ts.HasInitializer).initializer;
    }
    /** True if has initializer node attached to it. */
    /* @internal */
    export function hasOnlyExpressionInitializer(node: ts.Node): node is ts.HasExpressionInitializer {
        return hasInitializer(node) && !isForStatement(node) && !isForInStatement(node) && !isForOfStatement(node) && !isJsxAttribute(node);
    }
    export function isObjectLiteralElement(node: ts.Node): node is ts.ObjectLiteralElement {
        return node.kind === ts.SyntaxKind.JsxAttribute || node.kind === ts.SyntaxKind.JsxSpreadAttribute || isObjectLiteralElementLike(node);
    }
    /* @internal */
    export function isTypeReferenceType(node: ts.Node): node is ts.TypeReferenceType {
        return node.kind === ts.SyntaxKind.TypeReference || node.kind === ts.SyntaxKind.ExpressionWithTypeArguments;
    }
    const MAX_SMI_X86 = 1073741823;
    /* @internal */
    export function guessIndentation(lines: string[]) {
        let indentation = MAX_SMI_X86;
        for (const line of lines) {
            if (!line.length) {
                continue;
            }
            let i = 0;
            for (; i < line.length && i < indentation; i++) {
                if (!ts.isWhiteSpaceLike(line.charCodeAt(i))) {
                    break;
                }
            }
            if (i < indentation) {
                indentation = i;
            }
            if (indentation === 0) {
                return 0;
            }
        }
        return indentation === MAX_SMI_X86 ? undefined : indentation;
    }
    export function isStringLiteralLike(node: ts.Node): node is ts.StringLiteralLike {
        return node.kind === ts.SyntaxKind.StringLiteral || node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral;
    }
    // #endregion
}
