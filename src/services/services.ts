namespace ts {
    /** The version of the language service API */
    export const servicesVersion = "0.8";
    function createNode<TKind extends ts.SyntaxKind>(kind: TKind, pos: number, end: number, parent: ts.Node): NodeObject | TokenObject<TKind> | IdentifierObject {
        const node = ts.isNodeKind(kind) ? new NodeObject(kind, pos, end) :
            kind === ts.SyntaxKind.Identifier ? new IdentifierObject(ts.SyntaxKind.Identifier, pos, end) :
                new TokenObject(kind, pos, end);
        node.parent = parent;
        node.flags = parent.flags & ts.NodeFlags.ContextFlags;
        return node;
    }
    class NodeObject implements ts.Node {
        public kind: ts.SyntaxKind;
        public pos: number;
        public end: number;
        public flags: ts.NodeFlags;
        public modifierFlagsCache: ts.ModifierFlags;
        public transformFlags: ts.TransformFlags;
        public parent: ts.Node;
        public symbol!: ts.Symbol; // Actually optional, but it was too annoying to access `node.symbol!` everywhere since in many cases we know it must be defined
        public jsDoc?: ts.JSDoc[];
        public original?: ts.Node;
        private _children: ts.Node[] | undefined;
        constructor(kind: ts.SyntaxKind, pos: number, end: number) {
            this.pos = pos;
            this.end = end;
            this.flags = ts.NodeFlags.None;
            this.modifierFlagsCache = ts.ModifierFlags.None;
            this.transformFlags = ts.TransformFlags.None;
            this.parent = undefined!;
            this.kind = kind;
        }
        private assertHasRealPosition(message?: string) {
            // eslint-disable-next-line debug-assert
            ts.Debug.assert(!ts.positionIsSynthesized(this.pos) && !ts.positionIsSynthesized(this.end), message || "Node must have a real position for this operation");
        }
        public getSourceFile(): ts.SourceFile {
            return ts.getSourceFileOfNode(this);
        }
        public getStart(sourceFile?: ts.SourceFileLike, includeJsDocComment?: boolean): number {
            this.assertHasRealPosition();
            return ts.getTokenPosOfNode(this, sourceFile, includeJsDocComment);
        }
        public getFullStart(): number {
            this.assertHasRealPosition();
            return this.pos;
        }
        public getEnd(): number {
            this.assertHasRealPosition();
            return this.end;
        }
        public getWidth(sourceFile?: ts.SourceFile): number {
            this.assertHasRealPosition();
            return this.getEnd() - this.getStart(sourceFile);
        }
        public getFullWidth(): number {
            this.assertHasRealPosition();
            return this.end - this.pos;
        }
        public getLeadingTriviaWidth(sourceFile?: ts.SourceFile): number {
            this.assertHasRealPosition();
            return this.getStart(sourceFile) - this.pos;
        }
        public getFullText(sourceFile?: ts.SourceFile): string {
            this.assertHasRealPosition();
            return (sourceFile || this.getSourceFile()).text.substring(this.pos, this.end);
        }
        public getText(sourceFile?: ts.SourceFile): string {
            this.assertHasRealPosition();
            if (!sourceFile) {
                sourceFile = this.getSourceFile();
            }
            return sourceFile.text.substring(this.getStart(sourceFile), this.getEnd());
        }
        public getChildCount(sourceFile?: ts.SourceFile): number {
            return this.getChildren(sourceFile).length;
        }
        public getChildAt(index: number, sourceFile?: ts.SourceFile): ts.Node {
            return this.getChildren(sourceFile)[index];
        }
        public getChildren(sourceFile?: ts.SourceFileLike): ts.Node[] {
            this.assertHasRealPosition("Node without a real position cannot be scanned and thus has no token nodes - use forEachChild and collect the result if that's fine");
            return this._children || (this._children = createChildren(this, sourceFile));
        }
        public getFirstToken(sourceFile?: ts.SourceFileLike): ts.Node | undefined {
            this.assertHasRealPosition();
            const children = this.getChildren(sourceFile);
            if (!children.length) {
                return undefined;
            }
            const child = (ts.find(children, kid => kid.kind < ts.SyntaxKind.FirstJSDocNode || kid.kind > ts.SyntaxKind.LastJSDocNode)!);
            return child.kind < ts.SyntaxKind.FirstNode ?
                child :
                child.getFirstToken(sourceFile);
        }
        public getLastToken(sourceFile?: ts.SourceFileLike): ts.Node | undefined {
            this.assertHasRealPosition();
            const children = this.getChildren(sourceFile);
            const child = ts.lastOrUndefined(children);
            if (!child) {
                return undefined;
            }
            return child.kind < ts.SyntaxKind.FirstNode ? child : child.getLastToken(sourceFile);
        }
        public forEachChild<T>(cbNode: (node: ts.Node) => T, cbNodeArray?: (nodes: ts.NodeArray<ts.Node>) => T): T | undefined {
            return ts.forEachChild(this, cbNode, cbNodeArray);
        }
    }
    function createChildren(node: ts.Node, sourceFile: ts.SourceFileLike | undefined): ts.Node[] {
        if (!ts.isNodeKind(node.kind)) {
            return ts.emptyArray;
        }
        const children: ts.Node[] = [];
        if (ts.isJSDocCommentContainingNode(node)) {
            /** Don't add trivia for "tokens" since this is in a comment. */
            node.forEachChild(child => { children.push(child); });
            return children;
        }
        ts.scanner.setText((sourceFile || node.getSourceFile()).text);
        let pos = node.pos;
        const processNode = (child: ts.Node) => {
            addSyntheticNodes(children, pos, child.pos, node);
            children.push(child);
            pos = child.end;
        };
        const processNodes = (nodes: ts.NodeArray<ts.Node>) => {
            addSyntheticNodes(children, pos, nodes.pos, node);
            children.push(createSyntaxList(nodes, node));
            pos = nodes.end;
        };
        // jsDocComments need to be the first children
        ts.forEach((node as ts.JSDocContainer).jsDoc, processNode);
        // For syntactic classifications, all trivia are classified together, including jsdoc comments.
        // For that to work, the jsdoc comments should still be the leading trivia of the first child.
        // Restoring the scanner position ensures that.
        pos = node.pos;
        node.forEachChild(processNode, processNodes);
        addSyntheticNodes(children, pos, node.end, node);
        ts.scanner.setText(undefined);
        return children;
    }
    function addSyntheticNodes(nodes: ts.Push<ts.Node>, pos: number, end: number, parent: ts.Node): void {
        ts.scanner.setTextPos(pos);
        while (pos < end) {
            const token = ts.scanner.scan();
            const textPos = ts.scanner.getTextPos();
            if (textPos <= end) {
                if (token === ts.SyntaxKind.Identifier) {
                    ts.Debug.fail(`Did not expect ${ts.Debug.formatSyntaxKind(parent.kind)} to have an Identifier in its trivia`);
                }
                nodes.push(createNode(token, pos, textPos, parent));
            }
            pos = textPos;
            if (token === ts.SyntaxKind.EndOfFileToken) {
                break;
            }
        }
    }
    function createSyntaxList(nodes: ts.NodeArray<ts.Node>, parent: ts.Node): ts.Node {
        const list = (createNode(ts.SyntaxKind.SyntaxList, nodes.pos, nodes.end, parent) as any as ts.SyntaxList);
        list._children = [];
        let pos = nodes.pos;
        for (const node of nodes) {
            addSyntheticNodes(list._children, pos, node.pos, parent);
            list._children.push(node);
            pos = node.end;
        }
        addSyntheticNodes(list._children, pos, nodes.end, parent);
        return list;
    }
    class TokenOrIdentifierObject implements ts.Node {
        public kind!: ts.SyntaxKind;
        public pos: number;
        public end: number;
        public flags: ts.NodeFlags;
        public modifierFlagsCache: ts.ModifierFlags;
        public transformFlags: ts.TransformFlags;
        public parent: ts.Node;
        public symbol!: ts.Symbol;
        public jsDocComments?: ts.JSDoc[];
        constructor(pos: number, end: number) {
            // Set properties in same order as NodeObject
            this.pos = pos;
            this.end = end;
            this.flags = ts.NodeFlags.None;
            this.modifierFlagsCache = ts.ModifierFlags.None;
            this.transformFlags = ts.TransformFlags.None;
            this.parent = undefined!;
        }
        public getSourceFile(): ts.SourceFile {
            return ts.getSourceFileOfNode(this);
        }
        public getStart(sourceFile?: ts.SourceFileLike, includeJsDocComment?: boolean): number {
            return ts.getTokenPosOfNode(this, sourceFile, includeJsDocComment);
        }
        public getFullStart(): number {
            return this.pos;
        }
        public getEnd(): number {
            return this.end;
        }
        public getWidth(sourceFile?: ts.SourceFile): number {
            return this.getEnd() - this.getStart(sourceFile);
        }
        public getFullWidth(): number {
            return this.end - this.pos;
        }
        public getLeadingTriviaWidth(sourceFile?: ts.SourceFile): number {
            return this.getStart(sourceFile) - this.pos;
        }
        public getFullText(sourceFile?: ts.SourceFile): string {
            return (sourceFile || this.getSourceFile()).text.substring(this.pos, this.end);
        }
        public getText(sourceFile?: ts.SourceFile): string {
            if (!sourceFile) {
                sourceFile = this.getSourceFile();
            }
            return sourceFile.text.substring(this.getStart(sourceFile), this.getEnd());
        }
        public getChildCount(): number {
            return 0;
        }
        public getChildAt(): ts.Node {
            return undefined!; // TODO: GH#18217
        }
        public getChildren(): ts.Node[] {
            return this.kind === ts.SyntaxKind.EndOfFileToken ? (this as ts.EndOfFileToken).jsDoc || ts.emptyArray : ts.emptyArray;
        }
        public getFirstToken(): ts.Node | undefined {
            return undefined;
        }
        public getLastToken(): ts.Node | undefined {
            return undefined;
        }
        public forEachChild<T>(): T | undefined {
            return undefined;
        }
    }
    class SymbolObject implements ts.Symbol {
        flags: ts.SymbolFlags;
        escapedName: ts.__String;
        declarations!: ts.Declaration[];
        valueDeclaration!: ts.Declaration;
        // Undefined is used to indicate the value has not been computed. If, after computing, the
        // symbol has no doc comment, then the empty array will be returned.
        documentationComment?: ts.SymbolDisplayPart[];
        // Undefined is used to indicate the value has not been computed. If, after computing, the
        // symbol has no JSDoc tags, then the empty array will be returned.
        tags?: ts.JSDocTagInfo[];
        constructor(flags: ts.SymbolFlags, name: ts.__String) {
            this.flags = flags;
            this.escapedName = name;
        }
        getFlags(): ts.SymbolFlags {
            return this.flags;
        }
        get name(): string {
            return ts.symbolName(this);
        }
        getEscapedName(): ts.__String {
            return this.escapedName;
        }
        getName(): string {
            return this.name;
        }
        getDeclarations(): ts.Declaration[] | undefined {
            return this.declarations;
        }
        getDocumentationComment(checker: ts.TypeChecker | undefined): ts.SymbolDisplayPart[] {
            if (!this.documentationComment) {
                this.documentationComment = ts.emptyArray; // Set temporarily to avoid an infinite loop finding inherited docs
                this.documentationComment = getDocumentationComment(this.declarations, checker);
            }
            return this.documentationComment;
        }
        getJsDocTags(): ts.JSDocTagInfo[] {
            if (this.tags === undefined) {
                this.tags = ts.JsDoc.getJsDocTagsFromDeclarations(this.declarations);
            }
            return this.tags;
        }
    }
    class TokenObject<TKind extends ts.SyntaxKind> extends TokenOrIdentifierObject implements ts.Token<TKind> {
        public kind: TKind;
        constructor(kind: TKind, pos: number, end: number) {
            super(pos, end);
            this.kind = kind;
        }
    }
    class IdentifierObject extends TokenOrIdentifierObject implements ts.Identifier {
        public kind: ts.SyntaxKind.Identifier = ts.SyntaxKind.Identifier;
        public escapedText!: ts.__String;
        public autoGenerateFlags!: ts.GeneratedIdentifierFlags;
        _primaryExpressionBrand: any;
        _memberExpressionBrand: any;
        _leftHandSideExpressionBrand: any;
        _updateExpressionBrand: any;
        _unaryExpressionBrand: any;
        _expressionBrand: any;
        _declarationBrand: any;
        /*@internal*/ typeArguments!: ts.NodeArray<ts.TypeNode>;
        constructor(_kind: ts.SyntaxKind.Identifier, pos: number, end: number) {
            super(pos, end);
        }
        get text(): string {
            return ts.idText(this);
        }
    }
    IdentifierObject.prototype.kind = ts.SyntaxKind.Identifier;
    class TypeObject implements ts.Type {
        checker: ts.TypeChecker;
        flags: ts.TypeFlags;
        objectFlags?: ts.ObjectFlags;
        id!: number;
        symbol!: ts.Symbol;
        constructor(checker: ts.TypeChecker, flags: ts.TypeFlags) {
            this.checker = checker;
            this.flags = flags;
        }
        getFlags(): ts.TypeFlags {
            return this.flags;
        }
        getSymbol(): ts.Symbol | undefined {
            return this.symbol;
        }
        getProperties(): ts.Symbol[] {
            return this.checker.getPropertiesOfType(this);
        }
        getProperty(propertyName: string): ts.Symbol | undefined {
            return this.checker.getPropertyOfType(this, propertyName);
        }
        getApparentProperties(): ts.Symbol[] {
            return this.checker.getAugmentedPropertiesOfType(this);
        }
        getCallSignatures(): readonly ts.Signature[] {
            return this.checker.getSignaturesOfType(this, ts.SignatureKind.Call);
        }
        getConstructSignatures(): readonly ts.Signature[] {
            return this.checker.getSignaturesOfType(this, ts.SignatureKind.Construct);
        }
        getStringIndexType(): ts.Type | undefined {
            return this.checker.getIndexTypeOfType(this, ts.IndexKind.String);
        }
        getNumberIndexType(): ts.Type | undefined {
            return this.checker.getIndexTypeOfType(this, ts.IndexKind.Number);
        }
        getBaseTypes(): ts.BaseType[] | undefined {
            return this.isClassOrInterface() ? this.checker.getBaseTypes(this) : undefined;
        }
        isNullableType(): boolean {
            return this.checker.isNullableType(this);
        }
        getNonNullableType(): ts.Type {
            return this.checker.getNonNullableType(this);
        }
        getNonOptionalType(): ts.Type {
            return this.checker.getNonOptionalType(this);
        }
        getConstraint(): ts.Type | undefined {
            return this.checker.getBaseConstraintOfType(this);
        }
        getDefault(): ts.Type | undefined {
            return this.checker.getDefaultFromTypeParameter(this);
        }
        isUnion(): this is ts.UnionType {
            return !!(this.flags & ts.TypeFlags.Union);
        }
        isIntersection(): this is ts.IntersectionType {
            return !!(this.flags & ts.TypeFlags.Intersection);
        }
        isUnionOrIntersection(): this is ts.UnionOrIntersectionType {
            return !!(this.flags & ts.TypeFlags.UnionOrIntersection);
        }
        isLiteral(): this is ts.LiteralType {
            return !!(this.flags & ts.TypeFlags.StringOrNumberLiteral);
        }
        isStringLiteral(): this is ts.StringLiteralType {
            return !!(this.flags & ts.TypeFlags.StringLiteral);
        }
        isNumberLiteral(): this is ts.NumberLiteralType {
            return !!(this.flags & ts.TypeFlags.NumberLiteral);
        }
        isTypeParameter(): this is ts.TypeParameter {
            return !!(this.flags & ts.TypeFlags.TypeParameter);
        }
        isClassOrInterface(): this is ts.InterfaceType {
            return !!(ts.getObjectFlags(this) & ts.ObjectFlags.ClassOrInterface);
        }
        isClass(): this is ts.InterfaceType {
            return !!(ts.getObjectFlags(this) & ts.ObjectFlags.Class);
        }
        /**
         * This polyfills `referenceType.typeArguments` for API consumers
         */
        get typeArguments() {
            if (ts.getObjectFlags(this) & ts.ObjectFlags.Reference) {
                return this.checker.getTypeArguments((this as ts.Type as ts.TypeReference));
            }
            return undefined;
        }
    }
    class SignatureObject implements ts.Signature {
        flags: ts.SignatureFlags;
        checker: ts.TypeChecker;
        declaration!: ts.SignatureDeclaration;
        typeParameters?: ts.TypeParameter[];
        parameters!: ts.Symbol[];
        thisParameter!: ts.Symbol;
        resolvedReturnType!: ts.Type;
        resolvedTypePredicate: ts.TypePredicate | undefined;
        minTypeArgumentCount!: number;
        minArgumentCount!: number;
        // Undefined is used to indicate the value has not been computed. If, after computing, the
        // symbol has no doc comment, then the empty array will be returned.
        documentationComment?: ts.SymbolDisplayPart[];
        // Undefined is used to indicate the value has not been computed. If, after computing, the
        // symbol has no doc comment, then the empty array will be returned.
        jsDocTags?: ts.JSDocTagInfo[];
        constructor(checker: ts.TypeChecker, flags: ts.SignatureFlags) {
            this.checker = checker;
            this.flags = flags;
        }
        getDeclaration(): ts.SignatureDeclaration {
            return this.declaration;
        }
        getTypeParameters(): ts.TypeParameter[] | undefined {
            return this.typeParameters;
        }
        getParameters(): ts.Symbol[] {
            return this.parameters;
        }
        getReturnType(): ts.Type {
            return this.checker.getReturnTypeOfSignature(this);
        }
        getDocumentationComment(): ts.SymbolDisplayPart[] {
            return this.documentationComment || (this.documentationComment = getDocumentationComment(ts.singleElementArray(this.declaration), this.checker));
        }
        getJsDocTags(): ts.JSDocTagInfo[] {
            if (this.jsDocTags === undefined) {
                this.jsDocTags = this.declaration ? ts.JsDoc.getJsDocTagsFromDeclarations([this.declaration]) : [];
            }
            return this.jsDocTags;
        }
    }
    /**
     * Returns whether or not the given node has a JSDoc "inheritDoc" tag on it.
     * @param node the Node in question.
     * @returns `true` if `node` has a JSDoc "inheritDoc" tag on it, otherwise `false`.
     */
    function hasJSDocInheritDocTag(node: ts.Node) {
        return ts.getJSDocTags(node).some(tag => tag.tagName.text === "inheritDoc");
    }
    function getDocumentationComment(declarations: readonly ts.Declaration[] | undefined, checker: ts.TypeChecker | undefined): ts.SymbolDisplayPart[] {
        if (!declarations)
            return ts.emptyArray;
        let doc = ts.JsDoc.getJsDocCommentsFromDeclarations(declarations);
        if (doc.length === 0 || declarations.some(hasJSDocInheritDocTag)) {
            ts.forEachUnique(declarations, declaration => {
                const inheritedDocs = findInheritedJSDocComments(declaration, declaration.symbol.name, checker!); // TODO: GH#18217
                // TODO: GH#16312 Return a ReadonlyArray, avoid copying inheritedDocs
                if (inheritedDocs)
                    doc = doc.length === 0 ? inheritedDocs.slice() : inheritedDocs.concat(ts.lineBreakPart(), doc);
            });
        }
        return doc;
    }
    /**
     * Attempts to find JSDoc comments for possibly-inherited properties.  Checks superclasses then traverses
     * implemented interfaces until a symbol is found with the same name and with documentation.
     * @param declaration The possibly-inherited declaration to find comments for.
     * @param propertyName The name of the possibly-inherited property.
     * @param typeChecker A TypeChecker, used to find inherited properties.
     * @returns A filled array of documentation comments if any were found, otherwise an empty array.
     */
    function findInheritedJSDocComments(declaration: ts.Declaration, propertyName: string, typeChecker: ts.TypeChecker): readonly ts.SymbolDisplayPart[] | undefined {
        return ts.firstDefined(declaration.parent ? ts.getAllSuperTypeNodes(declaration.parent) : ts.emptyArray, superTypeNode => {
            const superType = typeChecker.getTypeAtLocation(superTypeNode);
            const baseProperty = superType && typeChecker.getPropertyOfType(superType, propertyName);
            const inheritedDocs = baseProperty && baseProperty.getDocumentationComment(typeChecker);
            return inheritedDocs && inheritedDocs.length ? inheritedDocs : undefined;
        });
    }
    class SourceFileObject extends NodeObject implements ts.SourceFile {
        public kind: ts.SyntaxKind.SourceFile = ts.SyntaxKind.SourceFile;
        public _declarationBrand: any;
        public fileName!: string;
        public path!: ts.Path;
        public resolvedPath!: ts.Path;
        public originalFileName!: string;
        public text!: string;
        public scriptSnapshot!: ts.IScriptSnapshot;
        public lineMap!: readonly number[];
        public statements!: ts.NodeArray<ts.Statement>;
        public endOfFileToken!: ts.Token<ts.SyntaxKind.EndOfFileToken>;
        public amdDependencies!: {
            name: string;
            path: string;
        }[];
        public moduleName!: string;
        public referencedFiles!: ts.FileReference[];
        public typeReferenceDirectives!: ts.FileReference[];
        public libReferenceDirectives!: ts.FileReference[];
        public syntacticDiagnostics!: ts.DiagnosticWithLocation[];
        public parseDiagnostics!: ts.DiagnosticWithLocation[];
        public bindDiagnostics!: ts.DiagnosticWithLocation[];
        public bindSuggestionDiagnostics?: ts.DiagnosticWithLocation[];
        public isDeclarationFile!: boolean;
        public isDefaultLib!: boolean;
        public hasNoDefaultLib!: boolean;
        public externalModuleIndicator!: ts.Node; // The first node that causes this file to be an external module
        public commonJsModuleIndicator!: ts.Node; // The first node that causes this file to be a CommonJS module
        public nodeCount!: number;
        public identifierCount!: number;
        public symbolCount!: number;
        public version!: string;
        public scriptKind!: ts.ScriptKind;
        public languageVersion!: ts.ScriptTarget;
        public languageVariant!: ts.LanguageVariant;
        public identifiers!: ts.Map<string>;
        public nameTable: ts.UnderscoreEscapedMap<number> | undefined;
        public resolvedModules: ts.Map<ts.ResolvedModuleFull> | undefined;
        public resolvedTypeReferenceDirectiveNames!: ts.Map<ts.ResolvedTypeReferenceDirective>;
        public imports!: readonly ts.StringLiteralLike[];
        public moduleAugmentations!: ts.StringLiteral[];
        private namedDeclarations: ts.Map<ts.Declaration[]> | undefined;
        public ambientModuleNames!: string[];
        public checkJsDirective: ts.CheckJsDirective | undefined;
        public possiblyContainDynamicImport?: boolean;
        public pragmas!: ts.PragmaMap;
        public localJsxFactory: ts.EntityName | undefined;
        public localJsxNamespace: ts.__String | undefined;
        constructor(kind: ts.SyntaxKind, pos: number, end: number) {
            super(kind, pos, end);
        }
        public update(newText: string, textChangeRange: ts.TextChangeRange): ts.SourceFile {
            return ts.updateSourceFile(this, newText, textChangeRange);
        }
        public getLineAndCharacterOfPosition(position: number): ts.LineAndCharacter {
            return ts.getLineAndCharacterOfPosition(this, position);
        }
        public getLineStarts(): readonly number[] {
            return ts.getLineStarts(this);
        }
        public getPositionOfLineAndCharacter(line: number, character: number, allowEdits?: true): number {
            return ts.computePositionOfLineAndCharacter(ts.getLineStarts(this), line, character, this.text, allowEdits);
        }
        public getLineEndOfPosition(pos: number): number {
            const { line } = this.getLineAndCharacterOfPosition(pos);
            const lineStarts = this.getLineStarts();
            let lastCharPos: number | undefined;
            if (line + 1 >= lineStarts.length) {
                lastCharPos = this.getEnd();
            }
            if (!lastCharPos) {
                lastCharPos = lineStarts[line + 1] - 1;
            }
            const fullText = this.getFullText();
            // if the new line is "\r\n", we should return the last non-new-line-character position
            return fullText[lastCharPos] === "\n" && fullText[lastCharPos - 1] === "\r" ? lastCharPos - 1 : lastCharPos;
        }
        public getNamedDeclarations(): ts.Map<ts.Declaration[]> {
            if (!this.namedDeclarations) {
                this.namedDeclarations = this.computeNamedDeclarations();
            }
            return this.namedDeclarations;
        }
        private computeNamedDeclarations(): ts.Map<ts.Declaration[]> {
            const result = ts.createMultiMap<ts.Declaration>();
            this.forEachChild(visit);
            return result;
            function addDeclaration(declaration: ts.Declaration) {
                const name = getDeclarationName(declaration);
                if (name) {
                    result.add(name, declaration);
                }
            }
            function getDeclarations(name: string) {
                let declarations = result.get(name);
                if (!declarations) {
                    result.set(name, declarations = []);
                }
                return declarations;
            }
            function getDeclarationName(declaration: ts.Declaration) {
                const name = ts.getNonAssignedNameOfDeclaration(declaration);
                return name && (ts.isComputedPropertyName(name) && ts.isPropertyAccessExpression(name.expression) ? name.expression.name.text
                    : ts.isPropertyName(name) ? ts.getNameFromPropertyName(name) : undefined);
            }
            function visit(node: ts.Node): void {
                switch (node.kind) {
                    case ts.SyntaxKind.FunctionDeclaration:
                    case ts.SyntaxKind.FunctionExpression:
                    case ts.SyntaxKind.MethodDeclaration:
                    case ts.SyntaxKind.MethodSignature:
                        const functionDeclaration = (<ts.FunctionLikeDeclaration>node);
                        const declarationName = getDeclarationName(functionDeclaration);
                        if (declarationName) {
                            const declarations = getDeclarations(declarationName);
                            const lastDeclaration = ts.lastOrUndefined(declarations);
                            // Check whether this declaration belongs to an "overload group".
                            if (lastDeclaration && functionDeclaration.parent === lastDeclaration.parent && functionDeclaration.symbol === lastDeclaration.symbol) {
                                // Overwrite the last declaration if it was an overload
                                // and this one is an implementation.
                                if (functionDeclaration.body && !(<ts.FunctionLikeDeclaration>lastDeclaration).body) {
                                    declarations[declarations.length - 1] = functionDeclaration;
                                }
                            }
                            else {
                                declarations.push(functionDeclaration);
                            }
                        }
                        ts.forEachChild(node, visit);
                        break;
                    case ts.SyntaxKind.ClassDeclaration:
                    case ts.SyntaxKind.ClassExpression:
                    case ts.SyntaxKind.InterfaceDeclaration:
                    case ts.SyntaxKind.TypeAliasDeclaration:
                    case ts.SyntaxKind.EnumDeclaration:
                    case ts.SyntaxKind.ModuleDeclaration:
                    case ts.SyntaxKind.ImportEqualsDeclaration:
                    case ts.SyntaxKind.ExportSpecifier:
                    case ts.SyntaxKind.ImportSpecifier:
                    case ts.SyntaxKind.ImportClause:
                    case ts.SyntaxKind.NamespaceImport:
                    case ts.SyntaxKind.GetAccessor:
                    case ts.SyntaxKind.SetAccessor:
                    case ts.SyntaxKind.TypeLiteral:
                        addDeclaration((<ts.Declaration>node));
                        ts.forEachChild(node, visit);
                        break;
                    case ts.SyntaxKind.Parameter:
                        // Only consider parameter properties
                        if (!ts.hasModifier(node, ts.ModifierFlags.ParameterPropertyModifier)) {
                            break;
                        }
                    // falls through
                    case ts.SyntaxKind.VariableDeclaration:
                    case ts.SyntaxKind.BindingElement: {
                        const decl = (<ts.VariableDeclaration>node);
                        if (ts.isBindingPattern(decl.name)) {
                            ts.forEachChild(decl.name, visit);
                            break;
                        }
                        if (decl.initializer) {
                            visit(decl.initializer);
                        }
                    }
                    // falls through
                    case ts.SyntaxKind.EnumMember:
                    case ts.SyntaxKind.PropertyDeclaration:
                    case ts.SyntaxKind.PropertySignature:
                        addDeclaration((<ts.Declaration>node));
                        break;
                    case ts.SyntaxKind.ExportDeclaration:
                        // Handle named exports case e.g.:
                        //    export {a, b as B} from "mod";
                        if ((<ts.ExportDeclaration>node).exportClause) {
                            ts.forEach((<ts.ExportDeclaration>node).exportClause!.elements, visit);
                        }
                        break;
                    case ts.SyntaxKind.ImportDeclaration:
                        const importClause = (<ts.ImportDeclaration>node).importClause;
                        if (importClause) {
                            // Handle default import case e.g.:
                            //    import d from "mod";
                            if (importClause.name) {
                                addDeclaration(importClause.name);
                            }
                            // Handle named bindings in imports e.g.:
                            //    import * as NS from "mod";
                            //    import {a, b as B} from "mod";
                            if (importClause.namedBindings) {
                                if (importClause.namedBindings.kind === ts.SyntaxKind.NamespaceImport) {
                                    addDeclaration(importClause.namedBindings);
                                }
                                else {
                                    ts.forEach(importClause.namedBindings.elements, visit);
                                }
                            }
                        }
                        break;
                    case ts.SyntaxKind.BinaryExpression:
                        if (ts.getAssignmentDeclarationKind((node as ts.BinaryExpression)) !== ts.AssignmentDeclarationKind.None) {
                            addDeclaration((node as ts.BinaryExpression));
                        }
                    // falls through
                    default:
                        ts.forEachChild(node, visit);
                }
            }
        }
    }
    class SourceMapSourceObject implements ts.SourceMapSource {
        lineMap!: number[];
        constructor(public fileName: string, public text: string, public skipTrivia?: (pos: number) => number) { }
        public getLineAndCharacterOfPosition(pos: number): ts.LineAndCharacter {
            return ts.getLineAndCharacterOfPosition(this, pos);
        }
    }
    function getServicesObjectAllocator(): ts.ObjectAllocator {
        return {
            getNodeConstructor: () => NodeObject,
            getTokenConstructor: () => TokenObject,
            getIdentifierConstructor: () => IdentifierObject,
            getSourceFileConstructor: () => SourceFileObject,
            getSymbolConstructor: () => SymbolObject,
            getTypeConstructor: () => TypeObject,
            getSignatureConstructor: () => SignatureObject,
            getSourceMapSourceConstructor: () => SourceMapSourceObject,
        };
    }
    /// Language Service
    // Information about a specific host file.
    interface HostFileInformation {
        hostFileName: string;
        version: string;
        scriptSnapshot: ts.IScriptSnapshot;
        scriptKind: ts.ScriptKind;
    }
    /* @internal */
    export interface DisplayPartsSymbolWriter extends ts.EmitTextWriter {
        displayParts(): ts.SymbolDisplayPart[];
    }
    /* @internal */
    export function toEditorSettings(options: ts.FormatCodeOptions | ts.FormatCodeSettings): ts.FormatCodeSettings;
    export function toEditorSettings(options: ts.EditorOptions | ts.EditorSettings): ts.EditorSettings;
    export function toEditorSettings(optionsAsMap: ts.MapLike<any>): ts.MapLike<any> {
        let allPropertiesAreCamelCased = true;
        for (const key in optionsAsMap) {
            if (ts.hasProperty(optionsAsMap, key) && !isCamelCase(key)) {
                allPropertiesAreCamelCased = false;
                break;
            }
        }
        if (allPropertiesAreCamelCased) {
            return optionsAsMap;
        }
        const settings: ts.MapLike<any> = {};
        for (const key in optionsAsMap) {
            if (ts.hasProperty(optionsAsMap, key)) {
                const newKey = isCamelCase(key) ? key : key.charAt(0).toLowerCase() + key.substr(1);
                settings[newKey] = optionsAsMap[key];
            }
        }
        return settings;
    }
    function isCamelCase(s: string) {
        return !s.length || s.charAt(0) === s.charAt(0).toLowerCase();
    }
    export function displayPartsToString(displayParts: ts.SymbolDisplayPart[] | undefined) {
        if (displayParts) {
            return ts.map(displayParts, displayPart => displayPart.text).join("");
        }
        return "";
    }
    export function getDefaultCompilerOptions(): ts.CompilerOptions {
        // Always default to "ScriptTarget.ES5" for the language service
        return {
            target: ts.ScriptTarget.ES5,
            jsx: ts.JsxEmit.Preserve
        };
    }
    export function getSupportedCodeFixes() {
        return ts.codefix.getSupportedErrorCodes();
    }
    // Either it will be file name if host doesnt have file or it will be the host's file information
    type CachedHostFileInformation = HostFileInformation | string;
    // Cache host information about script Should be refreshed
    // at each language service public entry point, since we don't know when
    // the set of scripts handled by the host changes.
    class HostCache {
        private fileNameToEntry: ts.Map<CachedHostFileInformation>;
        private _compilationSettings: ts.CompilerOptions;
        private currentDirectory: string;
        constructor(private host: ts.LanguageServiceHost, getCanonicalFileName: ts.GetCanonicalFileName) {
            // script id => script index
            this.currentDirectory = host.getCurrentDirectory();
            this.fileNameToEntry = ts.createMap<CachedHostFileInformation>();
            // Initialize the list with the root file names
            const rootFileNames = host.getScriptFileNames();
            for (const fileName of rootFileNames) {
                this.createEntry(fileName, ts.toPath(fileName, this.currentDirectory, getCanonicalFileName));
            }
            // store the compilation settings
            this._compilationSettings = host.getCompilationSettings() || getDefaultCompilerOptions();
        }
        public compilationSettings() {
            return this._compilationSettings;
        }
        public getProjectReferences(): readonly ts.ProjectReference[] | undefined {
            return this.host.getProjectReferences && this.host.getProjectReferences();
        }
        private createEntry(fileName: string, path: ts.Path) {
            let entry: CachedHostFileInformation;
            const scriptSnapshot = this.host.getScriptSnapshot(fileName);
            if (scriptSnapshot) {
                entry = {
                    hostFileName: fileName,
                    version: this.host.getScriptVersion(fileName),
                    scriptSnapshot,
                    scriptKind: ts.getScriptKind(fileName, this.host)
                };
            }
            else {
                entry = fileName;
            }
            this.fileNameToEntry.set(path, entry);
            return entry;
        }
        public getEntryByPath(path: ts.Path): CachedHostFileInformation | undefined {
            return this.fileNameToEntry.get(path);
        }
        public getHostFileInformation(path: ts.Path): HostFileInformation | undefined {
            const entry = this.fileNameToEntry.get(path);
            return !ts.isString(entry) ? entry : undefined;
        }
        public getOrCreateEntryByPath(fileName: string, path: ts.Path): HostFileInformation {
            const info = this.getEntryByPath(path) || this.createEntry(fileName, path);
            return ts.isString(info) ? undefined! : info; // TODO: GH#18217
        }
        public getRootFileNames(): string[] {
            const names: string[] = [];
            this.fileNameToEntry.forEach(entry => {
                if (ts.isString(entry)) {
                    names.push(entry);
                }
                else {
                    names.push(entry.hostFileName);
                }
            });
            return names;
        }
        public getVersion(path: ts.Path): string {
            const file = this.getHostFileInformation(path);
            return (file && file.version)!; // TODO: GH#18217
        }
        public getScriptSnapshot(path: ts.Path): ts.IScriptSnapshot {
            const file = this.getHostFileInformation(path);
            return (file && file.scriptSnapshot)!; // TODO: GH#18217
        }
    }
    class SyntaxTreeCache {
        // For our syntactic only features, we also keep a cache of the syntax tree for the
        // currently edited file.
        private currentFileName: string | undefined;
        private currentFileVersion: string | undefined;
        private currentFileScriptSnapshot: ts.IScriptSnapshot | undefined;
        private currentSourceFile: ts.SourceFile | undefined;
        constructor(private host: ts.LanguageServiceHost) {
        }
        public getCurrentSourceFile(fileName: string): ts.SourceFile {
            const scriptSnapshot = this.host.getScriptSnapshot(fileName);
            if (!scriptSnapshot) {
                // The host does not know about this file.
                throw new Error("Could not find file: '" + fileName + "'.");
            }
            const scriptKind = ts.getScriptKind(fileName, this.host);
            const version = this.host.getScriptVersion(fileName);
            let sourceFile: ts.SourceFile | undefined;
            if (this.currentFileName !== fileName) {
                // This is a new file, just parse it
                sourceFile = createLanguageServiceSourceFile(fileName, scriptSnapshot, ts.ScriptTarget.Latest, version, /*setNodeParents*/ true, scriptKind);
            }
            else if (this.currentFileVersion !== version) {
                // This is the same file, just a newer version. Incrementally parse the file.
                const editRange = scriptSnapshot.getChangeRange(this.currentFileScriptSnapshot!);
                sourceFile = updateLanguageServiceSourceFile(this.currentSourceFile!, scriptSnapshot, version, editRange);
            }
            if (sourceFile) {
                // All done, ensure state is up to date
                this.currentFileVersion = version;
                this.currentFileName = fileName;
                this.currentFileScriptSnapshot = scriptSnapshot;
                this.currentSourceFile = sourceFile;
            }
            return this.currentSourceFile!;
        }
    }
    function setSourceFileFields(sourceFile: ts.SourceFile, scriptSnapshot: ts.IScriptSnapshot, version: string) {
        sourceFile.version = version;
        sourceFile.scriptSnapshot = scriptSnapshot;
    }
    export function createLanguageServiceSourceFile(fileName: string, scriptSnapshot: ts.IScriptSnapshot, scriptTarget: ts.ScriptTarget, version: string, setNodeParents: boolean, scriptKind?: ts.ScriptKind): ts.SourceFile {
        const sourceFile = ts.createSourceFile(fileName, ts.getSnapshotText(scriptSnapshot), scriptTarget, setNodeParents, scriptKind);
        setSourceFileFields(sourceFile, scriptSnapshot, version);
        return sourceFile;
    }
    export function updateLanguageServiceSourceFile(sourceFile: ts.SourceFile, scriptSnapshot: ts.IScriptSnapshot, version: string, textChangeRange: ts.TextChangeRange | undefined, aggressiveChecks?: boolean): ts.SourceFile {
        // If we were given a text change range, and our version or open-ness changed, then
        // incrementally parse this file.
        if (textChangeRange) {
            if (version !== sourceFile.version) {
                let newText: string;
                // grab the fragment from the beginning of the original text to the beginning of the span
                const prefix = textChangeRange.span.start !== 0
                    ? sourceFile.text.substr(0, textChangeRange.span.start)
                    : "";
                // grab the fragment from the end of the span till the end of the original text
                const suffix = ts.textSpanEnd(textChangeRange.span) !== sourceFile.text.length
                    ? sourceFile.text.substr(ts.textSpanEnd(textChangeRange.span))
                    : "";
                if (textChangeRange.newLength === 0) {
                    // edit was a deletion - just combine prefix and suffix
                    newText = prefix && suffix ? prefix + suffix : prefix || suffix;
                }
                else {
                    // it was actual edit, fetch the fragment of new text that correspond to new span
                    const changedText = scriptSnapshot.getText(textChangeRange.span.start, textChangeRange.span.start + textChangeRange.newLength);
                    // combine prefix, changed text and suffix
                    newText = prefix && suffix
                        ? prefix + changedText + suffix
                        : prefix
                            ? (prefix + changedText)
                            : (changedText + suffix);
                }
                const newSourceFile = ts.updateSourceFile(sourceFile, newText, textChangeRange, aggressiveChecks);
                setSourceFileFields(newSourceFile, scriptSnapshot, version);
                // after incremental parsing nameTable might not be up-to-date
                // drop it so it can be lazily recreated later
                newSourceFile.nameTable = undefined;
                // dispose all resources held by old script snapshot
                if (sourceFile !== newSourceFile && sourceFile.scriptSnapshot) {
                    if (sourceFile.scriptSnapshot.dispose) {
                        sourceFile.scriptSnapshot.dispose();
                    }
                    sourceFile.scriptSnapshot = undefined;
                }
                return newSourceFile;
            }
        }
        // Otherwise, just create a new source file.
        return createLanguageServiceSourceFile(sourceFile.fileName, scriptSnapshot, sourceFile.languageVersion, version, /*setNodeParents*/ true, sourceFile.scriptKind);
    }
    class CancellationTokenObject implements ts.CancellationToken {
        constructor(private cancellationToken: ts.HostCancellationToken | undefined) {
        }
        public isCancellationRequested(): boolean {
            return !!this.cancellationToken && this.cancellationToken.isCancellationRequested();
        }
        public throwIfCancellationRequested(): void {
            if (this.isCancellationRequested()) {
                throw new ts.OperationCanceledException();
            }
        }
    }
    /* @internal */
    /** A cancellation that throttles calls to the host */
    export class ThrottledCancellationToken implements ts.CancellationToken {
        // Store when we last tried to cancel.  Checking cancellation can be expensive (as we have
        // to marshall over to the host layer).  So we only bother actually checking once enough
        // time has passed.
        private lastCancellationCheckTime = 0;
        constructor(private hostCancellationToken: ts.HostCancellationToken, private readonly throttleWaitMilliseconds = 20) {
        }
        public isCancellationRequested(): boolean {
            const time = ts.timestamp();
            const duration = Math.abs(time - this.lastCancellationCheckTime);
            if (duration >= this.throttleWaitMilliseconds) {
                // Check no more than once every throttle wait milliseconds
                this.lastCancellationCheckTime = time;
                return this.hostCancellationToken.isCancellationRequested();
            }
            return false;
        }
        public throwIfCancellationRequested(): void {
            if (this.isCancellationRequested()) {
                throw new ts.OperationCanceledException();
            }
        }
    }
    export function createLanguageService(host: ts.LanguageServiceHost, documentRegistry: ts.DocumentRegistry = ts.createDocumentRegistry(host.useCaseSensitiveFileNames && host.useCaseSensitiveFileNames(), host.getCurrentDirectory()), syntaxOnly = false): ts.LanguageService {
        const syntaxTreeCache: SyntaxTreeCache = new SyntaxTreeCache(host);
        let program: ts.Program;
        let lastProjectVersion: string;
        let lastTypesRootVersion = 0;
        const cancellationToken = new CancellationTokenObject(host.getCancellationToken && host.getCancellationToken());
        const currentDirectory = host.getCurrentDirectory();
        // Check if the localized messages json is set, otherwise query the host for it
        if (!ts.localizedDiagnosticMessages && host.getLocalizedDiagnosticMessages) {
            ts.setLocalizedDiagnosticMessages(host.getLocalizedDiagnosticMessages());
        }
        function log(message: string) {
            if (host.log) {
                host.log(message);
            }
        }
        const useCaseSensitiveFileNames = ts.hostUsesCaseSensitiveFileNames(host);
        const getCanonicalFileName = ts.createGetCanonicalFileName(useCaseSensitiveFileNames);
        const sourceMapper = ts.getSourceMapper({
            useCaseSensitiveFileNames: () => useCaseSensitiveFileNames,
            getCurrentDirectory: () => currentDirectory,
            getProgram,
            fileExists: ts.maybeBind(host, host.fileExists),
            readFile: ts.maybeBind(host, host.readFile),
            getDocumentPositionMapper: ts.maybeBind(host, host.getDocumentPositionMapper),
            getSourceFileLike: ts.maybeBind(host, host.getSourceFileLike),
            log
        });
        function getValidSourceFile(fileName: string): ts.SourceFile {
            const sourceFile = program.getSourceFile(fileName);
            if (!sourceFile) {
                const error: Error & ts.PossibleProgramFileInfo = new Error(`Could not find source file: '${fileName}'.`);
                // We've been having trouble debugging this, so attach sidecar data for the tsserver log.
                // See https://github.com/microsoft/TypeScript/issues/30180.
                error.ProgramFiles = program.getSourceFiles().map(f => f.fileName);
                throw error;
            }
            return sourceFile;
        }
        function synchronizeHostData(): void {
            ts.Debug.assert(!syntaxOnly);
            // perform fast check if host supports it
            if (host.getProjectVersion) {
                const hostProjectVersion = host.getProjectVersion();
                if (hostProjectVersion) {
                    if (lastProjectVersion === hostProjectVersion && !host.hasChangedAutomaticTypeDirectiveNames) {
                        return;
                    }
                    lastProjectVersion = hostProjectVersion;
                }
            }
            const typeRootsVersion = host.getTypeRootsVersion ? host.getTypeRootsVersion() : 0;
            if (lastTypesRootVersion !== typeRootsVersion) {
                log("TypeRoots version has changed; provide new program");
                program = undefined!; // TODO: GH#18217
                lastTypesRootVersion = typeRootsVersion;
            }
            // Get a fresh cache of the host information
            let hostCache: HostCache | undefined = new HostCache(host, getCanonicalFileName);
            const rootFileNames = hostCache.getRootFileNames();
            const hasInvalidatedResolution: ts.HasInvalidatedResolution = host.hasInvalidatedResolution || ts.returnFalse;
            const projectReferences = hostCache.getProjectReferences();
            // If the program is already up-to-date, we can reuse it
            if (ts.isProgramUptoDate(program, rootFileNames, hostCache.compilationSettings(), path => hostCache!.getVersion(path), fileExists, hasInvalidatedResolution, !!host.hasChangedAutomaticTypeDirectiveNames, projectReferences)) {
                return;
            }
            // IMPORTANT - It is critical from this moment onward that we do not check
            // cancellation tokens.  We are about to mutate source files from a previous program
            // instance.  If we cancel midway through, we may end up in an inconsistent state where
            // the program points to old source files that have been invalidated because of
            // incremental parsing.
            const newSettings = hostCache.compilationSettings();
            // Now create a new compiler
            const compilerHost: ts.CompilerHost = {
                getSourceFile: getOrCreateSourceFile,
                getSourceFileByPath: getOrCreateSourceFileByPath,
                getCancellationToken: () => cancellationToken,
                getCanonicalFileName,
                useCaseSensitiveFileNames: () => useCaseSensitiveFileNames,
                getNewLine: () => ts.getNewLineCharacter(newSettings, () => ts.getNewLineOrDefaultFromHost(host)),
                getDefaultLibFileName: (options) => host.getDefaultLibFileName(options),
                writeFile: ts.noop,
                getCurrentDirectory: () => currentDirectory,
                fileExists,
                readFile,
                realpath: host.realpath && (path => host.realpath!(path)),
                directoryExists: directoryName => {
                    return ts.directoryProbablyExists(directoryName, host);
                },
                getDirectories: path => {
                    return host.getDirectories ? host.getDirectories(path) : [];
                },
                readDirectory(path, extensions, exclude, include, depth) {
                    ts.Debug.assertDefined(host.readDirectory, "'LanguageServiceHost.readDirectory' must be implemented to correctly process 'projectReferences'");
                    return host.readDirectory!(path, extensions, exclude, include, depth);
                },
                onReleaseOldSourceFile,
                hasInvalidatedResolution,
                hasChangedAutomaticTypeDirectiveNames: host.hasChangedAutomaticTypeDirectiveNames
            };
            if (host.trace) {
                compilerHost.trace = message => host.trace!(message);
            }
            if (host.resolveModuleNames) {
                compilerHost.resolveModuleNames = (...args) => host.resolveModuleNames!(...args);
            }
            if (host.resolveTypeReferenceDirectives) {
                compilerHost.resolveTypeReferenceDirectives = (...args) => host.resolveTypeReferenceDirectives!(...args);
            }
            if (host.setResolvedProjectReferenceCallbacks) {
                compilerHost.setResolvedProjectReferenceCallbacks = callbacks => host.setResolvedProjectReferenceCallbacks!(callbacks);
            }
            if (host.useSourceOfProjectReferenceRedirect) {
                compilerHost.useSourceOfProjectReferenceRedirect = () => host.useSourceOfProjectReferenceRedirect!();
            }
            const documentRegistryBucketKey = documentRegistry.getKeyForCompilationSettings(newSettings);
            const options: ts.CreateProgramOptions = {
                rootNames: rootFileNames,
                options: newSettings,
                host: compilerHost,
                oldProgram: program,
                projectReferences
            };
            program = ts.createProgram(options);
            // hostCache is captured in the closure for 'getOrCreateSourceFile' but it should not be used past this point.
            // It needs to be cleared to allow all collected snapshots to be released
            hostCache = undefined;
            // We reset this cache on structure invalidation so we don't hold on to outdated files for long; however we can't use the `compilerHost` above,
            // Because it only functions until `hostCache` is cleared, while we'll potentially need the functionality to lazily read sourcemap files during
            // the course of whatever called `synchronizeHostData`
            sourceMapper.clearCache();
            // Make sure all the nodes in the program are both bound, and have their parent
            // pointers set property.
            program.getTypeChecker();
            return;
            function fileExists(fileName: string): boolean {
                const path = ts.toPath(fileName, currentDirectory, getCanonicalFileName);
                const entry = hostCache && hostCache.getEntryByPath(path);
                return entry ?
                    !ts.isString(entry) :
                    (!!host.fileExists && host.fileExists(fileName));
            }
            function readFile(fileName: string) {
                // stub missing host functionality
                const path = ts.toPath(fileName, currentDirectory, getCanonicalFileName);
                const entry = hostCache && hostCache.getEntryByPath(path);
                if (entry) {
                    return ts.isString(entry) ? undefined : ts.getSnapshotText(entry.scriptSnapshot);
                }
                return host.readFile && host.readFile(fileName);
            }
            // Release any files we have acquired in the old program but are
            // not part of the new program.
            function onReleaseOldSourceFile(oldSourceFile: ts.SourceFile, oldOptions: ts.CompilerOptions) {
                const oldSettingsKey = documentRegistry.getKeyForCompilationSettings(oldOptions);
                documentRegistry.releaseDocumentWithKey(oldSourceFile.resolvedPath, oldSettingsKey);
            }
            function getOrCreateSourceFile(fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void, shouldCreateNewSourceFile?: boolean): ts.SourceFile | undefined {
                return getOrCreateSourceFileByPath(fileName, ts.toPath(fileName, currentDirectory, getCanonicalFileName), languageVersion, onError, shouldCreateNewSourceFile);
            }
            function getOrCreateSourceFileByPath(fileName: string, path: ts.Path, _languageVersion: ts.ScriptTarget, _onError?: (message: string) => void, shouldCreateNewSourceFile?: boolean): ts.SourceFile | undefined {
                ts.Debug.assert(hostCache !== undefined, "getOrCreateSourceFileByPath called after typical CompilerHost lifetime, check the callstack something with a reference to an old host.");
                // The program is asking for this file, check first if the host can locate it.
                // If the host can not locate the file, then it does not exist. return undefined
                // to the program to allow reporting of errors for missing files.
                const hostFileInformation = hostCache && hostCache.getOrCreateEntryByPath(fileName, path);
                if (!hostFileInformation) {
                    return undefined;
                }
                // Check if the language version has changed since we last created a program; if they are the same,
                // it is safe to reuse the sourceFiles; if not, then the shape of the AST can change, and the oldSourceFile
                // can not be reused. we have to dump all syntax trees and create new ones.
                if (!shouldCreateNewSourceFile) {
                    // Check if the old program had this file already
                    const oldSourceFile = program && program.getSourceFileByPath(path);
                    if (oldSourceFile) {
                        // We already had a source file for this file name.  Go to the registry to
                        // ensure that we get the right up to date version of it.  We need this to
                        // address the following race-condition.  Specifically, say we have the following:
                        //
                        //      LS1
                        //          \
                        //           DocumentRegistry
                        //          /
                        //      LS2
                        //
                        // Each LS has a reference to file 'foo.ts' at version 1.  LS2 then updates
                        // it's version of 'foo.ts' to version 2.  This will cause LS2 and the
                        // DocumentRegistry to have version 2 of the document.  HOwever, LS1 will
                        // have version 1.  And *importantly* this source file will be *corrupt*.
                        // The act of creating version 2 of the file irrevocably damages the version
                        // 1 file.
                        //
                        // So, later when we call into LS1, we need to make sure that it doesn't use
                        // it's source file any more, and instead defers to DocumentRegistry to get
                        // either version 1, version 2 (or some other version) depending on what the
                        // host says should be used.
                        // We do not support the scenario where a host can modify a registered
                        // file's script kind, i.e. in one project some file is treated as ".ts"
                        // and in another as ".js"
                        ts.Debug.assertEqual(hostFileInformation.scriptKind, oldSourceFile.scriptKind, "Registered script kind should match new script kind.", path);
                        return documentRegistry.updateDocumentWithKey(fileName, path, newSettings, documentRegistryBucketKey, hostFileInformation.scriptSnapshot, hostFileInformation.version, hostFileInformation.scriptKind);
                    }
                    // We didn't already have the file.  Fall through and acquire it from the registry.
                }
                // Could not find this file in the old program, create a new SourceFile for it.
                return documentRegistry.acquireDocumentWithKey(fileName, path, newSettings, documentRegistryBucketKey, hostFileInformation.scriptSnapshot, hostFileInformation.version, hostFileInformation.scriptKind);
            }
        }
        // TODO: GH#18217 frequently asserted as defined
        function getProgram(): ts.Program | undefined {
            if (syntaxOnly) {
                ts.Debug.assert(program === undefined);
                return undefined;
            }
            synchronizeHostData();
            return program;
        }
        function cleanupSemanticCache(): void {
            program = undefined!; // TODO: GH#18217
        }
        function dispose(): void {
            if (program) {
                ts.forEach(program.getSourceFiles(), f => documentRegistry.releaseDocument(f.fileName, program.getCompilerOptions()));
                program = undefined!; // TODO: GH#18217
            }
            host = undefined!;
        }
        /// Diagnostics
        function getSyntacticDiagnostics(fileName: string): ts.DiagnosticWithLocation[] {
            synchronizeHostData();
            return program.getSyntacticDiagnostics(getValidSourceFile(fileName), cancellationToken).slice();
        }
        /**
         * getSemanticDiagnostics return array of Diagnostics. If '-d' is not enabled, only report semantic errors
         * If '-d' enabled, report both semantic and emitter errors
         */
        function getSemanticDiagnostics(fileName: string): ts.Diagnostic[] {
            synchronizeHostData();
            const targetSourceFile = getValidSourceFile(fileName);
            // Only perform the action per file regardless of '-out' flag as LanguageServiceHost is expected to call this function per file.
            // Therefore only get diagnostics for given file.
            const semanticDiagnostics = program.getSemanticDiagnostics(targetSourceFile, cancellationToken);
            if (!ts.getEmitDeclarations(program.getCompilerOptions())) {
                return semanticDiagnostics.slice();
            }
            // If '-d' is enabled, check for emitter error. One example of emitter error is export class implements non-export interface
            const declarationDiagnostics = program.getDeclarationDiagnostics(targetSourceFile, cancellationToken);
            return [...semanticDiagnostics, ...declarationDiagnostics];
        }
        function getSuggestionDiagnostics(fileName: string): ts.DiagnosticWithLocation[] {
            synchronizeHostData();
            return ts.computeSuggestionDiagnostics(getValidSourceFile(fileName), program, cancellationToken);
        }
        function getCompilerOptionsDiagnostics() {
            synchronizeHostData();
            return [...program.getOptionsDiagnostics(cancellationToken), ...program.getGlobalDiagnostics(cancellationToken)];
        }
        function getCompletionsAtPosition(fileName: string, position: number, options: ts.GetCompletionsAtPositionOptions = ts.emptyOptions): ts.CompletionInfo | undefined {
            // Convert from deprecated options names to new names
            const fullPreferences: ts.UserPreferences = {
                ...ts.identity<ts.UserPreferences>(options),
                includeCompletionsForModuleExports: options.includeCompletionsForModuleExports || options.includeExternalModuleExports,
                includeCompletionsWithInsertText: options.includeCompletionsWithInsertText || options.includeInsertTextCompletions,
            };
            synchronizeHostData();
            return ts.Completions.getCompletionsAtPosition(host, program, log, getValidSourceFile(fileName), position, fullPreferences, options.triggerCharacter);
        }
        function getCompletionEntryDetails(fileName: string, position: number, name: string, formattingOptions: ts.FormatCodeSettings | undefined, source: string | undefined, preferences: ts.UserPreferences = ts.emptyOptions): ts.CompletionEntryDetails | undefined {
            synchronizeHostData();
            return ts.Completions.getCompletionEntryDetails(program, log, getValidSourceFile(fileName), position, { name, source }, host, ((formattingOptions && ts.formatting.getFormatContext(formattingOptions))!), // TODO: GH#18217
            preferences, cancellationToken);
        }
        function getCompletionEntrySymbol(fileName: string, position: number, name: string, source?: string): ts.Symbol | undefined {
            synchronizeHostData();
            return ts.Completions.getCompletionEntrySymbol(program, log, getValidSourceFile(fileName), position, { name, source }, host);
        }
        function getQuickInfoAtPosition(fileName: string, position: number): ts.QuickInfo | undefined {
            synchronizeHostData();
            const sourceFile = getValidSourceFile(fileName);
            const node = ts.getTouchingPropertyName(sourceFile, position);
            if (node === sourceFile) {
                // Avoid giving quickInfo for the sourceFile as a whole.
                return undefined;
            }
            const typeChecker = program.getTypeChecker();
            const nodeForQuickInfo = getNodeForQuickInfo(node);
            const symbol = getSymbolAtLocationForQuickInfo(nodeForQuickInfo, typeChecker);
            if (!symbol || typeChecker.isUnknownSymbol(symbol)) {
                const type = shouldGetType(sourceFile, nodeForQuickInfo, position) ? typeChecker.getTypeAtLocation(nodeForQuickInfo) : undefined;
                return type && {
                    kind: ts.ScriptElementKind.unknown,
                    kindModifiers: ts.ScriptElementKindModifier.none,
                    textSpan: ts.createTextSpanFromNode(nodeForQuickInfo, sourceFile),
                    displayParts: typeChecker.runWithCancellationToken(cancellationToken, typeChecker => ts.typeToDisplayParts(typeChecker, type, ts.getContainerNode(nodeForQuickInfo))),
                    documentation: type.symbol ? type.symbol.getDocumentationComment(typeChecker) : undefined,
                    tags: type.symbol ? type.symbol.getJsDocTags() : undefined
                };
            }
            const { symbolKind, displayParts, documentation, tags } = typeChecker.runWithCancellationToken(cancellationToken, typeChecker => ts.SymbolDisplay.getSymbolDisplayPartsDocumentationAndSymbolKind(typeChecker, symbol, sourceFile, ts.getContainerNode(nodeForQuickInfo), nodeForQuickInfo));
            return {
                kind: symbolKind,
                kindModifiers: ts.SymbolDisplay.getSymbolModifiers(symbol),
                textSpan: ts.createTextSpanFromNode(nodeForQuickInfo, sourceFile),
                displayParts,
                documentation,
                tags,
            };
        }
        function getNodeForQuickInfo(node: ts.Node): ts.Node {
            if (ts.isNewExpression(node.parent) && node.pos === node.parent.pos) {
                return node.parent.expression;
            }
            return node;
        }
        function shouldGetType(sourceFile: ts.SourceFile, node: ts.Node, position: number): boolean {
            switch (node.kind) {
                case ts.SyntaxKind.Identifier:
                    return !ts.isLabelName(node) && !ts.isTagName(node);
                case ts.SyntaxKind.PropertyAccessExpression:
                case ts.SyntaxKind.QualifiedName:
                    // Don't return quickInfo if inside the comment in `a/**/.b`
                    return !ts.isInComment(sourceFile, position);
                case ts.SyntaxKind.ThisKeyword:
                case ts.SyntaxKind.ThisType:
                case ts.SyntaxKind.SuperKeyword:
                    return true;
                default:
                    return false;
            }
        }
        /// Goto definition
        function getDefinitionAtPosition(fileName: string, position: number): readonly ts.DefinitionInfo[] | undefined {
            synchronizeHostData();
            return ts.GoToDefinition.getDefinitionAtPosition(program, getValidSourceFile(fileName), position);
        }
        function getDefinitionAndBoundSpan(fileName: string, position: number): ts.DefinitionInfoAndBoundSpan | undefined {
            synchronizeHostData();
            return ts.GoToDefinition.getDefinitionAndBoundSpan(program, getValidSourceFile(fileName), position);
        }
        function getTypeDefinitionAtPosition(fileName: string, position: number): readonly ts.DefinitionInfo[] | undefined {
            synchronizeHostData();
            return ts.GoToDefinition.getTypeDefinitionAtPosition(program.getTypeChecker(), getValidSourceFile(fileName), position);
        }
        /// Goto implementation
        function getImplementationAtPosition(fileName: string, position: number): ts.ImplementationLocation[] | undefined {
            synchronizeHostData();
            return ts.FindAllReferences.getImplementationsAtPosition(program, cancellationToken, program.getSourceFiles(), getValidSourceFile(fileName), position);
        }
        /// References and Occurrences
        function getOccurrencesAtPosition(fileName: string, position: number): readonly ts.ReferenceEntry[] | undefined {
            return ts.flatMap(getDocumentHighlights(fileName, position, [fileName]), entry => entry.highlightSpans.map<ts.ReferenceEntry>(highlightSpan => ({
                fileName: entry.fileName,
                textSpan: highlightSpan.textSpan,
                isWriteAccess: highlightSpan.kind === ts.HighlightSpanKind.writtenReference,
                isDefinition: false,
                ...highlightSpan.isInString && { isInString: true },
                ...highlightSpan.contextSpan && { contextSpan: highlightSpan.contextSpan }
            })));
        }
        function getDocumentHighlights(fileName: string, position: number, filesToSearch: readonly string[]): ts.DocumentHighlights[] | undefined {
            const normalizedFileName = ts.normalizePath(fileName);
            ts.Debug.assert(filesToSearch.some(f => ts.normalizePath(f) === normalizedFileName));
            synchronizeHostData();
            const sourceFilesToSearch = ts.mapDefined(filesToSearch, fileName => program.getSourceFile(fileName));
            const sourceFile = getValidSourceFile(fileName);
            return ts.DocumentHighlights.getDocumentHighlights(program, cancellationToken, sourceFile, position, sourceFilesToSearch);
        }
        function findRenameLocations(fileName: string, position: number, findInStrings: boolean, findInComments: boolean, providePrefixAndSuffixTextForRename?: boolean): ts.RenameLocation[] | undefined {
            synchronizeHostData();
            const sourceFile = getValidSourceFile(fileName);
            const node = ts.getTouchingPropertyName(sourceFile, position);
            if (ts.isIdentifier(node) && (ts.isJsxOpeningElement(node.parent) || ts.isJsxClosingElement(node.parent)) && ts.isIntrinsicJsxName(node.escapedText)) {
                const { openingElement, closingElement } = node.parent.parent;
                return [openingElement, closingElement].map((node): ts.RenameLocation => {
                    const textSpan = ts.createTextSpanFromNode(node.tagName, sourceFile);
                    return {
                        fileName: sourceFile.fileName,
                        textSpan,
                        ...ts.FindAllReferences.toContextSpan(textSpan, sourceFile, node.parent)
                    };
                });
            }
            else {
                return getReferencesWorker(node, position, { findInStrings, findInComments, providePrefixAndSuffixTextForRename, isForRename: true }, (entry, originalNode, checker) => ts.FindAllReferences.toRenameLocation(entry, originalNode, checker, providePrefixAndSuffixTextForRename || false));
            }
        }
        function getReferencesAtPosition(fileName: string, position: number): ts.ReferenceEntry[] | undefined {
            synchronizeHostData();
            return getReferencesWorker(ts.getTouchingPropertyName(getValidSourceFile(fileName), position), position, {}, ts.FindAllReferences.toReferenceEntry);
        }
        function getReferencesWorker<T>(node: ts.Node, position: number, options: ts.FindAllReferences.Options, cb: ts.FindAllReferences.ToReferenceOrRenameEntry<T>): T[] | undefined {
            synchronizeHostData();
            // Exclude default library when renaming as commonly user don't want to change that file.
            const sourceFiles = options && options.isForRename
                ? program.getSourceFiles().filter(sourceFile => !program.isSourceFileDefaultLibrary(sourceFile))
                : program.getSourceFiles();
            return ts.FindAllReferences.findReferenceOrRenameEntries(program, cancellationToken, sourceFiles, node, position, options, cb);
        }
        function findReferences(fileName: string, position: number): ts.ReferencedSymbol[] | undefined {
            synchronizeHostData();
            return ts.FindAllReferences.findReferencedSymbols(program, cancellationToken, program.getSourceFiles(), getValidSourceFile(fileName), position);
        }
        function getNavigateToItems(searchValue: string, maxResultCount?: number, fileName?: string, excludeDtsFiles = false): ts.NavigateToItem[] {
            synchronizeHostData();
            const sourceFiles = fileName ? [getValidSourceFile(fileName)] : program.getSourceFiles();
            return ts.NavigateTo.getNavigateToItems(sourceFiles, program.getTypeChecker(), cancellationToken, searchValue, maxResultCount, excludeDtsFiles);
        }
        function getEmitOutput(fileName: string, emitOnlyDtsFiles?: boolean, forceDtsEmit?: boolean) {
            synchronizeHostData();
            const sourceFile = getValidSourceFile(fileName);
            const customTransformers = host.getCustomTransformers && host.getCustomTransformers();
            return ts.getFileEmitOutput(program, sourceFile, !!emitOnlyDtsFiles, cancellationToken, customTransformers, forceDtsEmit);
        }
        // Signature help
        /**
         * This is a semantic operation.
         */
        function getSignatureHelpItems(fileName: string, position: number, { triggerReason }: ts.SignatureHelpItemsOptions = ts.emptyOptions): ts.SignatureHelpItems | undefined {
            synchronizeHostData();
            const sourceFile = getValidSourceFile(fileName);
            return ts.SignatureHelp.getSignatureHelpItems(program, sourceFile, position, triggerReason, cancellationToken);
        }
        /// Syntactic features
        function getNonBoundSourceFile(fileName: string): ts.SourceFile {
            return syntaxTreeCache.getCurrentSourceFile(fileName);
        }
        function getNameOrDottedNameSpan(fileName: string, startPos: number, _endPos: number): ts.TextSpan | undefined {
            const sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            // Get node at the location
            const node = ts.getTouchingPropertyName(sourceFile, startPos);
            if (node === sourceFile) {
                return undefined;
            }
            switch (node.kind) {
                case ts.SyntaxKind.PropertyAccessExpression:
                case ts.SyntaxKind.QualifiedName:
                case ts.SyntaxKind.StringLiteral:
                case ts.SyntaxKind.FalseKeyword:
                case ts.SyntaxKind.TrueKeyword:
                case ts.SyntaxKind.NullKeyword:
                case ts.SyntaxKind.SuperKeyword:
                case ts.SyntaxKind.ThisKeyword:
                case ts.SyntaxKind.ThisType:
                case ts.SyntaxKind.Identifier:
                    break;
                // Cant create the text span
                default:
                    return undefined;
            }
            let nodeForStartPos = node;
            while (true) {
                if (ts.isRightSideOfPropertyAccess(nodeForStartPos) || ts.isRightSideOfQualifiedName(nodeForStartPos)) {
                    // If on the span is in right side of the the property or qualified name, return the span from the qualified name pos to end of this node
                    nodeForStartPos = nodeForStartPos.parent;
                }
                else if (ts.isNameOfModuleDeclaration(nodeForStartPos)) {
                    // If this is name of a module declarations, check if this is right side of dotted module name
                    // If parent of the module declaration which is parent of this node is module declaration and its body is the module declaration that this node is name of
                    // Then this name is name from dotted module
                    if (nodeForStartPos.parent.parent.kind === ts.SyntaxKind.ModuleDeclaration &&
                        (<ts.ModuleDeclaration>nodeForStartPos.parent.parent).body === nodeForStartPos.parent) {
                        // Use parent module declarations name for start pos
                        nodeForStartPos = (<ts.ModuleDeclaration>nodeForStartPos.parent.parent).name;
                    }
                    else {
                        // We have to use this name for start pos
                        break;
                    }
                }
                else {
                    // Is not a member expression so we have found the node for start pos
                    break;
                }
            }
            return ts.createTextSpanFromBounds(nodeForStartPos.getStart(), node.getEnd());
        }
        function getBreakpointStatementAtPosition(fileName: string, position: number): ts.TextSpan | undefined {
            // doesn't use compiler - no need to synchronize with host
            const sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            return ts.BreakpointResolver.spanInSourceFileAtLocation(sourceFile, position);
        }
        function getNavigationBarItems(fileName: string): ts.NavigationBarItem[] {
            return ts.NavigationBar.getNavigationBarItems(syntaxTreeCache.getCurrentSourceFile(fileName), cancellationToken);
        }
        function getNavigationTree(fileName: string): ts.NavigationTree {
            return ts.NavigationBar.getNavigationTree(syntaxTreeCache.getCurrentSourceFile(fileName), cancellationToken);
        }
        function isTsOrTsxFile(fileName: string): boolean {
            const kind = ts.getScriptKind(fileName, host);
            return kind === ts.ScriptKind.TS || kind === ts.ScriptKind.TSX;
        }
        function getSemanticClassifications(fileName: string, span: ts.TextSpan): ts.ClassifiedSpan[] {
            if (!isTsOrTsxFile(fileName)) {
                // do not run semantic classification on non-ts-or-tsx files
                return [];
            }
            synchronizeHostData();
            return ts.getSemanticClassifications(program.getTypeChecker(), cancellationToken, getValidSourceFile(fileName), program.getClassifiableNames(), span);
        }
        function getEncodedSemanticClassifications(fileName: string, span: ts.TextSpan): ts.Classifications {
            if (!isTsOrTsxFile(fileName)) {
                // do not run semantic classification on non-ts-or-tsx files
                return { spans: [], endOfLineState: ts.EndOfLineState.None };
            }
            synchronizeHostData();
            return ts.getEncodedSemanticClassifications(program.getTypeChecker(), cancellationToken, getValidSourceFile(fileName), program.getClassifiableNames(), span);
        }
        function getSyntacticClassifications(fileName: string, span: ts.TextSpan): ts.ClassifiedSpan[] {
            // doesn't use compiler - no need to synchronize with host
            return ts.getSyntacticClassifications(cancellationToken, syntaxTreeCache.getCurrentSourceFile(fileName), span);
        }
        function getEncodedSyntacticClassifications(fileName: string, span: ts.TextSpan): ts.Classifications {
            // doesn't use compiler - no need to synchronize with host
            return ts.getEncodedSyntacticClassifications(cancellationToken, syntaxTreeCache.getCurrentSourceFile(fileName), span);
        }
        function getOutliningSpans(fileName: string): ts.OutliningSpan[] {
            // doesn't use compiler - no need to synchronize with host
            const sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            return ts.OutliningElementsCollector.collectElements(sourceFile, cancellationToken);
        }
        const braceMatching = ts.createMapFromTemplate({
            [ts.SyntaxKind.OpenBraceToken]: ts.SyntaxKind.CloseBraceToken,
            [ts.SyntaxKind.OpenParenToken]: ts.SyntaxKind.CloseParenToken,
            [ts.SyntaxKind.OpenBracketToken]: ts.SyntaxKind.CloseBracketToken,
            [ts.SyntaxKind.GreaterThanToken]: ts.SyntaxKind.LessThanToken,
        });
        braceMatching.forEach((value, key) => braceMatching.set(value.toString(), (Number(key) as ts.SyntaxKind)));
        function getBraceMatchingAtPosition(fileName: string, position: number): ts.TextSpan[] {
            const sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            const token = ts.getTouchingToken(sourceFile, position);
            const matchKind = token.getStart(sourceFile) === position ? braceMatching.get(token.kind.toString()) : undefined;
            const match = matchKind && ts.findChildOfKind(token.parent, matchKind, sourceFile);
            // We want to order the braces when we return the result.
            return match ? [ts.createTextSpanFromNode(token, sourceFile), ts.createTextSpanFromNode(match, sourceFile)].sort((a, b) => a.start - b.start) : ts.emptyArray;
        }
        function getIndentationAtPosition(fileName: string, position: number, editorOptions: ts.EditorOptions | ts.EditorSettings) {
            let start = ts.timestamp();
            const settings = toEditorSettings(editorOptions);
            const sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            log("getIndentationAtPosition: getCurrentSourceFile: " + (ts.timestamp() - start));
            start = ts.timestamp();
            const result = ts.formatting.SmartIndenter.getIndentation(position, sourceFile, settings);
            log("getIndentationAtPosition: computeIndentation  : " + (ts.timestamp() - start));
            return result;
        }
        function getFormattingEditsForRange(fileName: string, start: number, end: number, options: ts.FormatCodeOptions | ts.FormatCodeSettings): ts.TextChange[] {
            const sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            return ts.formatting.formatSelection(start, end, sourceFile, ts.formatting.getFormatContext(toEditorSettings(options)));
        }
        function getFormattingEditsForDocument(fileName: string, options: ts.FormatCodeOptions | ts.FormatCodeSettings): ts.TextChange[] {
            return ts.formatting.formatDocument(syntaxTreeCache.getCurrentSourceFile(fileName), ts.formatting.getFormatContext(toEditorSettings(options)));
        }
        function getFormattingEditsAfterKeystroke(fileName: string, position: number, key: string, options: ts.FormatCodeOptions | ts.FormatCodeSettings): ts.TextChange[] {
            const sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            const formatContext = ts.formatting.getFormatContext(toEditorSettings(options));
            if (!ts.isInComment(sourceFile, position)) {
                switch (key) {
                    case "{":
                        return ts.formatting.formatOnOpeningCurly(position, sourceFile, formatContext);
                    case "}":
                        return ts.formatting.formatOnClosingCurly(position, sourceFile, formatContext);
                    case ";":
                        return ts.formatting.formatOnSemicolon(position, sourceFile, formatContext);
                    case "\n":
                        return ts.formatting.formatOnEnter(position, sourceFile, formatContext);
                }
            }
            return [];
        }
        function getCodeFixesAtPosition(fileName: string, start: number, end: number, errorCodes: readonly number[], formatOptions: ts.FormatCodeSettings, preferences: ts.UserPreferences = ts.emptyOptions): readonly ts.CodeFixAction[] {
            synchronizeHostData();
            const sourceFile = getValidSourceFile(fileName);
            const span = ts.createTextSpanFromBounds(start, end);
            const formatContext = ts.formatting.getFormatContext(formatOptions);
            return ts.flatMap(ts.deduplicate<number>(errorCodes, ts.equateValues, ts.compareValues), errorCode => {
                cancellationToken.throwIfCancellationRequested();
                return ts.codefix.getFixes({ errorCode, sourceFile, span, program, host, cancellationToken, formatContext, preferences });
            });
        }
        function getCombinedCodeFix(scope: ts.CombinedCodeFixScope, fixId: {}, formatOptions: ts.FormatCodeSettings, preferences: ts.UserPreferences = ts.emptyOptions): ts.CombinedCodeActions {
            synchronizeHostData();
            ts.Debug.assert(scope.type === "file");
            const sourceFile = getValidSourceFile(scope.fileName);
            const formatContext = ts.formatting.getFormatContext(formatOptions);
            return ts.codefix.getAllFixes({ fixId, sourceFile, program, host, cancellationToken, formatContext, preferences });
        }
        function organizeImports(scope: ts.OrganizeImportsScope, formatOptions: ts.FormatCodeSettings, preferences: ts.UserPreferences = ts.emptyOptions): readonly ts.FileTextChanges[] {
            synchronizeHostData();
            ts.Debug.assert(scope.type === "file");
            const sourceFile = getValidSourceFile(scope.fileName);
            const formatContext = ts.formatting.getFormatContext(formatOptions);
            return ts.OrganizeImports.organizeImports(sourceFile, formatContext, host, program, preferences);
        }
        function getEditsForFileRename(oldFilePath: string, newFilePath: string, formatOptions: ts.FormatCodeSettings, preferences: ts.UserPreferences = ts.emptyOptions): readonly ts.FileTextChanges[] {
            return ts.getEditsForFileRename((getProgram()!), oldFilePath, newFilePath, host, ts.formatting.getFormatContext(formatOptions), preferences, sourceMapper);
        }
        function applyCodeActionCommand(action: ts.CodeActionCommand, formatSettings?: ts.FormatCodeSettings): Promise<ts.ApplyCodeActionCommandResult>;
        function applyCodeActionCommand(action: ts.CodeActionCommand[], formatSettings?: ts.FormatCodeSettings): Promise<ts.ApplyCodeActionCommandResult[]>;
        function applyCodeActionCommand(action: ts.CodeActionCommand | ts.CodeActionCommand[], formatSettings?: ts.FormatCodeSettings): Promise<ts.ApplyCodeActionCommandResult | ts.ApplyCodeActionCommandResult[]>;
        function applyCodeActionCommand(fileName: ts.Path, action: ts.CodeActionCommand): Promise<ts.ApplyCodeActionCommandResult>;
        function applyCodeActionCommand(fileName: ts.Path, action: ts.CodeActionCommand[]): Promise<ts.ApplyCodeActionCommandResult[]>;
        function applyCodeActionCommand(fileName: ts.Path | ts.CodeActionCommand | ts.CodeActionCommand[], actionOrFormatSettingsOrUndefined?: ts.CodeActionCommand | ts.CodeActionCommand[] | ts.FormatCodeSettings): Promise<ts.ApplyCodeActionCommandResult | ts.ApplyCodeActionCommandResult[]> {
            const action = typeof fileName === "string" ? actionOrFormatSettingsOrUndefined as ts.CodeActionCommand | ts.CodeActionCommand[] : fileName as ts.CodeActionCommand[];
            return ts.isArray(action) ? Promise.all(action.map(a => applySingleCodeActionCommand(a))) : applySingleCodeActionCommand(action);
        }
        function applySingleCodeActionCommand(action: ts.CodeActionCommand): Promise<ts.ApplyCodeActionCommandResult> {
            const getPath = (path: string): ts.Path => ts.toPath(path, currentDirectory, getCanonicalFileName);
            ts.Debug.assertEqual(action.type, "install package");
            return host.installPackage
                ? host.installPackage({ fileName: getPath(action.file), packageName: action.packageName })
                : Promise.reject("Host does not implement `installPackage`");
        }
        function getDocCommentTemplateAtPosition(fileName: string, position: number): ts.TextInsertion | undefined {
            return ts.JsDoc.getDocCommentTemplateAtPosition(ts.getNewLineOrDefaultFromHost(host), syntaxTreeCache.getCurrentSourceFile(fileName), position);
        }
        function isValidBraceCompletionAtPosition(fileName: string, position: number, openingBrace: number): boolean {
            // '<' is currently not supported, figuring out if we're in a Generic Type vs. a comparison is too
            // expensive to do during typing scenarios
            // i.e. whether we're dealing with:
            //      var x = new foo<| ( with class foo<T>{} )
            // or
            //      var y = 3 <|
            if (openingBrace === ts.CharacterCodes.lessThan) {
                return false;
            }
            const sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            // Check if in a context where we don't want to perform any insertion
            if (ts.isInString(sourceFile, position)) {
                return false;
            }
            if (ts.isInsideJsxElementOrAttribute(sourceFile, position)) {
                return openingBrace === ts.CharacterCodes.openBrace;
            }
            if (ts.isInTemplateString(sourceFile, position)) {
                return false;
            }
            switch (openingBrace) {
                case ts.CharacterCodes.singleQuote:
                case ts.CharacterCodes.doubleQuote:
                case ts.CharacterCodes.backtick:
                    return !ts.isInComment(sourceFile, position);
            }
            return true;
        }
        function getJsxClosingTagAtPosition(fileName: string, position: number): ts.JsxClosingTagInfo | undefined {
            const sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            const token = ts.findPrecedingToken(position, sourceFile);
            if (!token)
                return undefined;
            const element = token.kind === ts.SyntaxKind.GreaterThanToken && ts.isJsxOpeningElement(token.parent) ? token.parent.parent
                : ts.isJsxText(token) ? token.parent : undefined;
            if (element && isUnclosedTag(element)) {
                return { newText: `</${element.openingElement.tagName.getText(sourceFile)}>` };
            }
        }
        function isUnclosedTag({ openingElement, closingElement, parent }: ts.JsxElement): boolean {
            return !ts.tagNamesAreEquivalent(openingElement.tagName, closingElement.tagName) ||
                ts.isJsxElement(parent) && ts.tagNamesAreEquivalent(openingElement.tagName, parent.openingElement.tagName) && isUnclosedTag(parent);
        }
        function getSpanOfEnclosingComment(fileName: string, position: number, onlyMultiLine: boolean): ts.TextSpan | undefined {
            const sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            const range = ts.formatting.getRangeOfEnclosingComment(sourceFile, position);
            return range && (!onlyMultiLine || range.kind === ts.SyntaxKind.MultiLineCommentTrivia) ? ts.createTextSpanFromRange(range) : undefined;
        }
        function getTodoComments(fileName: string, descriptors: ts.TodoCommentDescriptor[]): ts.TodoComment[] {
            // Note: while getting todo comments seems like a syntactic operation, we actually
            // treat it as a semantic operation here.  This is because we expect our host to call
            // this on every single file.  If we treat this syntactically, then that will cause
            // us to populate and throw away the tree in our syntax tree cache for each file.  By
            // treating this as a semantic operation, we can access any tree without throwing
            // anything away.
            synchronizeHostData();
            const sourceFile = getValidSourceFile(fileName);
            cancellationToken.throwIfCancellationRequested();
            const fileContents = sourceFile.text;
            const result: ts.TodoComment[] = [];
            // Exclude node_modules files as we don't want to show the todos of external libraries.
            if (descriptors.length > 0 && !isNodeModulesFile(sourceFile.fileName)) {
                const regExp = getTodoCommentsRegExp();
                let matchArray: RegExpExecArray | null;
                while (matchArray = regExp.exec(fileContents)) {
                    cancellationToken.throwIfCancellationRequested();
                    // If we got a match, here is what the match array will look like.  Say the source text is:
                    //
                    //      "    // hack   1"
                    //
                    // The result array with the regexp:    will be:
                    //
                    //      ["// hack   1", "// ", "hack   1", undefined, "hack"]
                    //
                    // Here are the relevant capture groups:
                    //  0) The full match for the entire regexp.
                    //  1) The preamble to the message portion.
                    //  2) The message portion.
                    //  3...N) The descriptor that was matched - by index.  'undefined' for each
                    //         descriptor that didn't match.  an actual value if it did match.
                    //
                    //  i.e. 'undefined' in position 3 above means TODO(jason) didn't match.
                    //       "hack"      in position 4 means HACK did match.
                    const firstDescriptorCaptureIndex = 3;
                    ts.Debug.assert(matchArray.length === descriptors.length + firstDescriptorCaptureIndex);
                    const preamble = matchArray[1];
                    const matchPosition = matchArray.index + preamble.length;
                    // OK, we have found a match in the file.  This is only an acceptable match if
                    // it is contained within a comment.
                    if (!ts.isInComment(sourceFile, matchPosition)) {
                        continue;
                    }
                    let descriptor: ts.TodoCommentDescriptor | undefined;
                    for (let i = 0; i < descriptors.length; i++) {
                        if (matchArray[i + firstDescriptorCaptureIndex]) {
                            descriptor = descriptors[i];
                        }
                    }
                    if (descriptor === undefined)
                        return ts.Debug.fail();
                    // We don't want to match something like 'TODOBY', so we make sure a non
                    // letter/digit follows the match.
                    if (isLetterOrDigit(fileContents.charCodeAt(matchPosition + descriptor.text.length))) {
                        continue;
                    }
                    const message = matchArray[2];
                    result.push({ descriptor, message, position: matchPosition });
                }
            }
            return result;
            function escapeRegExp(str: string): string {
                return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            }
            function getTodoCommentsRegExp(): RegExp {
                // NOTE: `?:` means 'non-capture group'.  It allows us to have groups without having to
                // filter them out later in the final result array.
                // TODO comments can appear in one of the following forms:
                //
                //  1)      // TODO     or  /////////// TODO
                //
                //  2)      /* TODO     or  /********** TODO
                //
                //  3)      /*
                //           *   TODO
                //           */
                //
                // The following three regexps are used to match the start of the text up to the TODO
                // comment portion.
                const singleLineCommentStart = /(?:\/\/+\s*)/.source;
                const multiLineCommentStart = /(?:\/\*+\s*)/.source;
                const anyNumberOfSpacesAndAsterisksAtStartOfLine = /(?:^(?:\s|\*)*)/.source;
                // Match any of the above three TODO comment start regexps.
                // Note that the outermost group *is* a capture group.  We want to capture the preamble
                // so that we can determine the starting position of the TODO comment match.
                const preamble = "(" + anyNumberOfSpacesAndAsterisksAtStartOfLine + "|" + singleLineCommentStart + "|" + multiLineCommentStart + ")";
                // Takes the descriptors and forms a regexp that matches them as if they were literals.
                // For example, if the descriptors are "TODO(jason)" and "HACK", then this will be:
                //
                //      (?:(TODO\(jason\))|(HACK))
                //
                // Note that the outermost group is *not* a capture group, but the innermost groups
                // *are* capture groups.  By capturing the inner literals we can determine after
                // matching which descriptor we are dealing with.
                const literals = "(?:" + ts.map(descriptors, d => "(" + escapeRegExp(d.text) + ")").join("|") + ")";
                // After matching a descriptor literal, the following regexp matches the rest of the
                // text up to the end of the line (or */).
                const endOfLineOrEndOfComment = /(?:$|\*\/)/.source;
                const messageRemainder = /(?:.*?)/.source;
                // This is the portion of the match we'll return as part of the TODO comment result. We
                // match the literal portion up to the end of the line or end of comment.
                const messagePortion = "(" + literals + messageRemainder + ")";
                const regExpString = preamble + messagePortion + endOfLineOrEndOfComment;
                // The final regexp will look like this:
                // /((?:\/\/+\s*)|(?:\/\*+\s*)|(?:^(?:\s|\*)*))((?:(TODO\(jason\))|(HACK))(?:.*?))(?:$|\*\/)/gim
                // The flags of the regexp are important here.
                //  'g' is so that we are doing a global search and can find matches several times
                //  in the input.
                //
                //  'i' is for case insensitivity (We do this to match C# TODO comment code).
                //
                //  'm' is so we can find matches in a multi-line input.
                return new RegExp(regExpString, "gim");
            }
            function isLetterOrDigit(char: number): boolean {
                return (char >= ts.CharacterCodes.a && char <= ts.CharacterCodes.z) ||
                    (char >= ts.CharacterCodes.A && char <= ts.CharacterCodes.Z) ||
                    (char >= ts.CharacterCodes._0 && char <= ts.CharacterCodes._9);
            }
            function isNodeModulesFile(path: string): boolean {
                return ts.stringContains(path, "/node_modules/");
            }
        }
        function getRenameInfo(fileName: string, position: number, options?: ts.RenameInfoOptions): ts.RenameInfo {
            synchronizeHostData();
            return ts.Rename.getRenameInfo(program, getValidSourceFile(fileName), position, options);
        }
        function getRefactorContext(file: ts.SourceFile, positionOrRange: number | ts.TextRange, preferences: ts.UserPreferences, formatOptions?: ts.FormatCodeSettings): ts.RefactorContext {
            const [startPosition, endPosition] = typeof positionOrRange === "number" ? [positionOrRange, undefined] : [positionOrRange.pos, positionOrRange.end];
            return {
                file,
                startPosition,
                endPosition,
                program: getProgram()!,
                host,
                formatContext: ts.formatting.getFormatContext((formatOptions!)),
                cancellationToken,
                preferences,
            };
        }
        function getSmartSelectionRange(fileName: string, position: number): ts.SelectionRange {
            return ts.SmartSelectionRange.getSmartSelectionRange(position, syntaxTreeCache.getCurrentSourceFile(fileName));
        }
        function getApplicableRefactors(fileName: string, positionOrRange: number | ts.TextRange, preferences: ts.UserPreferences = ts.emptyOptions): ts.ApplicableRefactorInfo[] {
            synchronizeHostData();
            const file = getValidSourceFile(fileName);
            return ts.refactor.getApplicableRefactors(getRefactorContext(file, positionOrRange, preferences));
        }
        function getEditsForRefactor(fileName: string, formatOptions: ts.FormatCodeSettings, positionOrRange: number | ts.TextRange, refactorName: string, actionName: string, preferences: ts.UserPreferences = ts.emptyOptions): ts.RefactorEditInfo | undefined {
            synchronizeHostData();
            const file = getValidSourceFile(fileName);
            return ts.refactor.getEditsForRefactor(getRefactorContext(file, positionOrRange, preferences, formatOptions), refactorName, actionName);
        }
        return {
            dispose,
            cleanupSemanticCache,
            getSyntacticDiagnostics,
            getSemanticDiagnostics,
            getSuggestionDiagnostics,
            getCompilerOptionsDiagnostics,
            getSyntacticClassifications,
            getSemanticClassifications,
            getEncodedSyntacticClassifications,
            getEncodedSemanticClassifications,
            getCompletionsAtPosition,
            getCompletionEntryDetails,
            getCompletionEntrySymbol,
            getSignatureHelpItems,
            getQuickInfoAtPosition,
            getDefinitionAtPosition,
            getDefinitionAndBoundSpan,
            getImplementationAtPosition,
            getTypeDefinitionAtPosition,
            getReferencesAtPosition,
            findReferences,
            getOccurrencesAtPosition,
            getDocumentHighlights,
            getNameOrDottedNameSpan,
            getBreakpointStatementAtPosition,
            getNavigateToItems,
            getRenameInfo,
            getSmartSelectionRange,
            findRenameLocations,
            getNavigationBarItems,
            getNavigationTree,
            getOutliningSpans,
            getTodoComments,
            getBraceMatchingAtPosition,
            getIndentationAtPosition,
            getFormattingEditsForRange,
            getFormattingEditsForDocument,
            getFormattingEditsAfterKeystroke,
            getDocCommentTemplateAtPosition,
            isValidBraceCompletionAtPosition,
            getJsxClosingTagAtPosition,
            getSpanOfEnclosingComment,
            getCodeFixesAtPosition,
            getCombinedCodeFix,
            applyCodeActionCommand,
            organizeImports,
            getEditsForFileRename,
            getEmitOutput,
            getNonBoundSourceFile,
            getProgram,
            getApplicableRefactors,
            getEditsForRefactor,
            toLineColumnOffset: sourceMapper.toLineColumnOffset,
            getSourceMapper: () => sourceMapper,
        };
    }
    /* @internal */
    /** Names in the name table are escaped, so an identifier `__foo` will have a name table entry `___foo`. */
    export function getNameTable(sourceFile: ts.SourceFile): ts.UnderscoreEscapedMap<number> {
        if (!sourceFile.nameTable) {
            initializeNameTable(sourceFile);
        }
        return sourceFile.nameTable!; // TODO: GH#18217
    }
    function initializeNameTable(sourceFile: ts.SourceFile): void {
        const nameTable = sourceFile.nameTable = ts.createUnderscoreEscapedMap<number>();
        sourceFile.forEachChild(function walk(node) {
            if (ts.isIdentifier(node) && !ts.isTagName(node) && node.escapedText || ts.isStringOrNumericLiteralLike(node) && literalIsName(node)) {
                const text = ts.getEscapedTextOfIdentifierOrLiteral(node);
                nameTable.set(text, nameTable.get(text) === undefined ? node.pos : -1);
            }
            ts.forEachChild(node, walk);
            if (ts.hasJSDocNodes(node)) {
                for (const jsDoc of node.jsDoc!) {
                    ts.forEachChild(jsDoc, walk);
                }
            }
        });
    }
    /**
     * We want to store any numbers/strings if they were a name that could be
     * related to a declaration.  So, if we have 'import x = require("something")'
     * then we want 'something' to be in the name table.  Similarly, if we have
     * "a['propname']" then we want to store "propname" in the name table.
     */
    function literalIsName(node: ts.StringLiteralLike | ts.NumericLiteral): boolean {
        return ts.isDeclarationName(node) ||
            node.parent.kind === ts.SyntaxKind.ExternalModuleReference ||
            isArgumentOfElementAccessExpression(node) ||
            ts.isLiteralComputedPropertyDeclarationName(node);
    }
    /**
     * Returns the containing object literal property declaration given a possible name node, e.g. "a" in x = { "a": 1 }
     */
    /* @internal */
    export function getContainingObjectLiteralElement(node: ts.Node): ObjectLiteralElementWithName | undefined {
        const element = getContainingObjectLiteralElementWorker(node);
        return element && (ts.isObjectLiteralExpression(element.parent) || ts.isJsxAttributes(element.parent)) ? element as ObjectLiteralElementWithName : undefined;
    }
    function getContainingObjectLiteralElementWorker(node: ts.Node): ts.ObjectLiteralElement | undefined {
        switch (node.kind) {
            case ts.SyntaxKind.StringLiteral:
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
            case ts.SyntaxKind.NumericLiteral:
                if (node.parent.kind === ts.SyntaxKind.ComputedPropertyName) {
                    return ts.isObjectLiteralElement(node.parent.parent) ? node.parent.parent : undefined;
                }
            // falls through
            case ts.SyntaxKind.Identifier:
                return ts.isObjectLiteralElement(node.parent) &&
                    (node.parent.parent.kind === ts.SyntaxKind.ObjectLiteralExpression || node.parent.parent.kind === ts.SyntaxKind.JsxAttributes) &&
                    node.parent.name === node ? node.parent : undefined;
        }
        return undefined;
    }
    /* @internal */
    export type ObjectLiteralElementWithName = ts.ObjectLiteralElement & {
        name: ts.PropertyName;
        parent: ts.ObjectLiteralExpression | ts.JsxAttributes;
    };
    function getSymbolAtLocationForQuickInfo(node: ts.Node, checker: ts.TypeChecker): ts.Symbol | undefined {
        const object = getContainingObjectLiteralElement(node);
        if (object) {
            const contextualType = checker.getContextualType(object.parent);
            const properties = contextualType && getPropertySymbolsFromContextualType(object, checker, contextualType, /*unionSymbolOk*/ false);
            if (properties && properties.length === 1) {
                return ts.first(properties);
            }
        }
        return checker.getSymbolAtLocation(node);
    }
    /** Gets all symbols for one property. Does not get symbols for every property. */
    /* @internal */
    export function getPropertySymbolsFromContextualType(node: ObjectLiteralElementWithName, checker: ts.TypeChecker, contextualType: ts.Type, unionSymbolOk: boolean): readonly ts.Symbol[] {
        const name = ts.getNameFromPropertyName(node.name);
        if (!name)
            return ts.emptyArray;
        if (!contextualType.isUnion()) {
            const symbol = contextualType.getProperty(name);
            return symbol ? [symbol] : ts.emptyArray;
        }
        const discriminatedPropertySymbols = ts.mapDefined(contextualType.types, t => ts.isObjectLiteralExpression(node.parent) && checker.isTypeInvalidDueToUnionDiscriminant(t, node.parent) ? undefined : t.getProperty(name));
        if (unionSymbolOk && (discriminatedPropertySymbols.length === 0 || discriminatedPropertySymbols.length === contextualType.types.length)) {
            const symbol = contextualType.getProperty(name);
            if (symbol)
                return [symbol];
        }
        if (discriminatedPropertySymbols.length === 0) {
            // Bad discriminant -- do again without discriminating
            return ts.mapDefined(contextualType.types, t => t.getProperty(name));
        }
        return discriminatedPropertySymbols;
    }
    function isArgumentOfElementAccessExpression(node: ts.Node) {
        return node &&
            node.parent &&
            node.parent.kind === ts.SyntaxKind.ElementAccessExpression &&
            (<ts.ElementAccessExpression>node.parent).argumentExpression === node;
    }
    /// getDefaultLibraryFilePath
    declare const __dirname: string;
    /**
     * Get the path of the default library files (lib.d.ts) as distributed with the typescript
     * node package.
     * The functionality is not supported if the ts module is consumed outside of a node module.
     */
    export function getDefaultLibFilePath(options: ts.CompilerOptions): string {
        // Check __dirname is defined and that we are on a node.js system.
        if (typeof __dirname !== "undefined") {
            return __dirname + ts.directorySeparator + ts.getDefaultLibFileName(options);
        }
        throw new Error("getDefaultLibFilePath is only supported when consumed as a node module. ");
    }
    ts.setObjectAllocator(getServicesObjectAllocator());
}
