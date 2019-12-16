/* @internal */
namespace ts.textChanges {
    /**
     * Currently for simplicity we store recovered positions on the node itself.
     * It can be changed to side-table later if we decide that current design is too invasive.
     */
    function getPos(n: ts.TextRange): number {
        const result = (<any>n).__pos;
        ts.Debug.assert(typeof result === "number");
        return result;
    }
    function setPos(n: ts.TextRange, pos: number): void {
        ts.Debug.assert(typeof pos === "number");
        (<any>n).__pos = pos;
    }
    function getEnd(n: ts.TextRange): number {
        const result = (<any>n).__end;
        ts.Debug.assert(typeof result === "number");
        return result;
    }
    function setEnd(n: ts.TextRange, end: number): void {
        ts.Debug.assert(typeof end === "number");
        (<any>n).__end = end;
    }
    export interface ConfigurableStart {
        leadingTriviaOption?: LeadingTriviaOption;
    }
    export interface ConfigurableEnd {
        trailingTriviaOption?: TrailingTriviaOption;
    }
    export enum LeadingTriviaOption {
        /** Exclude all leading trivia (use getStart()) */
        Exclude,
        /** Include leading trivia and,
         * if there are no line breaks between the node and the previous token,
         * include all trivia between the node and the previous token
         */
        IncludeAll
    }
    export enum TrailingTriviaOption {
        /** Exclude all trailing trivia (use getEnd()) */
        Exclude,
        /** Include trailing trivia */
        Include
    }
    function skipWhitespacesAndLineBreaks(text: string, start: number) {
        return ts.skipTrivia(text, start, /*stopAfterLineBreak*/ false, /*stopAtComments*/ true);
    }
    function hasCommentsBeforeLineBreak(text: string, start: number) {
        let i = start;
        while (i < text.length) {
            const ch = text.charCodeAt(i);
            if (ts.isWhiteSpaceSingleLine(ch)) {
                i++;
                continue;
            }
            return ch === ts.CharacterCodes.slash;
        }
        return false;
    }
    /**
     * Usually node.pos points to a position immediately after the previous token.
     * If this position is used as a beginning of the span to remove - it might lead to removing the trailing trivia of the previous node, i.e:
     * const x; // this is x
     *        ^ - pos for the next variable declaration will point here
     * const y; // this is y
     *        ^ - end for previous variable declaration
     * Usually leading trivia of the variable declaration 'y' should not include trailing trivia (whitespace, comment 'this is x' and newline) from the preceding
     * variable declaration and trailing trivia for 'y' should include (whitespace, comment 'this is y', newline).
     * By default when removing nodes we adjust start and end positions to respect specification of the trivia above.
     * If pos\end should be interpreted literally (that is, withouth including leading and trailing trivia), `leadingTriviaOption` should be set to `LeadingTriviaOption.Exclude`
     * and `trailingTriviaOption` to `TrailingTriviaOption.Exclude`.
     */
    export interface ConfigurableStartEnd extends ConfigurableStart, ConfigurableEnd {
    }
    const useNonAdjustedPositions: ConfigurableStartEnd = {
        leadingTriviaOption: LeadingTriviaOption.Exclude,
        trailingTriviaOption: TrailingTriviaOption.Exclude,
    };
    export interface InsertNodeOptions {
        /**
         * Text to be inserted before the new node
         */
        prefix?: string;
        /**
         * Text to be inserted after the new node
         */
        suffix?: string;
        /**
         * Text of inserted node will be formatted with this indentation, otherwise indentation will be inferred from the old node
         */
        indentation?: number;
        /**
         * Text of inserted node will be formatted with this delta, otherwise delta will be inferred from the new node kind
         */
        delta?: number;
        /**
         * Do not trim leading white spaces in the edit range
         */
        preserveLeadingWhitespace?: boolean;
    }
    export interface ReplaceWithMultipleNodesOptions extends InsertNodeOptions {
        readonly joiner?: string;
    }
    enum ChangeKind {
        Remove,
        ReplaceWithSingleNode,
        ReplaceWithMultipleNodes,
        Text
    }
    type Change = ReplaceWithSingleNode | ReplaceWithMultipleNodes | RemoveNode | ChangeText;
    interface BaseChange {
        readonly sourceFile: ts.SourceFile;
        readonly range: ts.TextRange;
    }
    export interface ChangeNodeOptions extends ConfigurableStartEnd, InsertNodeOptions {
    }
    interface ReplaceWithSingleNode extends BaseChange {
        readonly kind: ChangeKind.ReplaceWithSingleNode;
        readonly node: ts.Node;
        readonly options?: InsertNodeOptions;
    }
    interface RemoveNode extends BaseChange {
        readonly kind: ChangeKind.Remove;
        readonly node?: never;
        readonly options?: never;
    }
    interface ReplaceWithMultipleNodes extends BaseChange {
        readonly kind: ChangeKind.ReplaceWithMultipleNodes;
        readonly nodes: readonly ts.Node[];
        readonly options?: ReplaceWithMultipleNodesOptions;
    }
    interface ChangeText extends BaseChange {
        readonly kind: ChangeKind.Text;
        readonly text: string;
    }
    function getAdjustedRange(sourceFile: ts.SourceFile, startNode: ts.Node, endNode: ts.Node, options: ConfigurableStartEnd): ts.TextRange {
        return { pos: getAdjustedStartPosition(sourceFile, startNode, options), end: getAdjustedEndPosition(sourceFile, endNode, options) };
    }
    function getAdjustedStartPosition(sourceFile: ts.SourceFile, node: ts.Node, options: ConfigurableStart) {
        const { leadingTriviaOption } = options;
        if (leadingTriviaOption === LeadingTriviaOption.Exclude) {
            return node.getStart(sourceFile);
        }
        const fullStart = node.getFullStart();
        const start = node.getStart(sourceFile);
        if (fullStart === start) {
            return start;
        }
        const fullStartLine = ts.getLineStartPositionForPosition(fullStart, sourceFile);
        const startLine = ts.getLineStartPositionForPosition(start, sourceFile);
        if (startLine === fullStartLine) {
            // full start and start of the node are on the same line
            //   a,     b;
            //    ^     ^
            //    |   start
            // fullstart
            // when b is replaced - we usually want to keep the leading trvia
            // when b is deleted - we delete it
            return leadingTriviaOption === LeadingTriviaOption.IncludeAll ? fullStart : start;
        }
        // get start position of the line following the line that contains fullstart position
        // (but only if the fullstart isn't the very beginning of the file)
        const nextLineStart = fullStart > 0 ? 1 : 0;
        let adjustedStartPosition = ts.getStartPositionOfLine(ts.getLineOfLocalPosition(sourceFile, fullStartLine) + nextLineStart, sourceFile);
        // skip whitespaces/newlines
        adjustedStartPosition = skipWhitespacesAndLineBreaks(sourceFile.text, adjustedStartPosition);
        return ts.getStartPositionOfLine(ts.getLineOfLocalPosition(sourceFile, adjustedStartPosition), sourceFile);
    }
    function getAdjustedEndPosition(sourceFile: ts.SourceFile, node: ts.Node, options: ConfigurableEnd) {
        const { end } = node;
        const { trailingTriviaOption } = options;
        if (trailingTriviaOption === TrailingTriviaOption.Exclude || (ts.isExpression(node) && trailingTriviaOption !== TrailingTriviaOption.Include)) {
            return end;
        }
        const newEnd = ts.skipTrivia(sourceFile.text, end, /*stopAfterLineBreak*/ true);
        return newEnd !== end && (trailingTriviaOption === TrailingTriviaOption.Include || ts.isLineBreak(sourceFile.text.charCodeAt(newEnd - 1)))
            ? newEnd
            : end;
    }
    /**
     * Checks if 'candidate' argument is a legal separator in the list that contains 'node' as an element
     */
    function isSeparator(node: ts.Node, candidate: ts.Node | undefined): candidate is ts.Token<ts.SyntaxKind.CommaToken | ts.SyntaxKind.SemicolonToken> {
        return !!candidate && !!node.parent && (candidate.kind === ts.SyntaxKind.CommaToken || (candidate.kind === ts.SyntaxKind.SemicolonToken && node.parent.kind === ts.SyntaxKind.ObjectLiteralExpression));
    }
    function spaces(count: number) {
        let s = "";
        for (let i = 0; i < count; i++) {
            s += " ";
        }
        return s;
    }
    export interface TextChangesContext {
        host: ts.LanguageServiceHost;
        formatContext: ts.formatting.FormatContext;
        preferences: ts.UserPreferences;
    }
    export type TypeAnnotatable = ts.SignatureDeclaration | ts.VariableDeclaration | ts.ParameterDeclaration | ts.PropertyDeclaration | ts.PropertySignature;
    export type ThisTypeAnnotatable = ts.FunctionDeclaration | ts.FunctionExpression;
    export function isThisTypeAnnotatable(containingFunction: ts.FunctionLike): containingFunction is ThisTypeAnnotatable {
        return ts.isFunctionExpression(containingFunction) || ts.isFunctionDeclaration(containingFunction);
    }
    export class ChangeTracker {
        private readonly changes: Change[] = [];
        private readonly newFiles: {
            readonly oldFile: ts.SourceFile | undefined;
            readonly fileName: string;
            readonly statements: readonly ts.Statement[];
        }[] = [];
        private readonly classesWithNodesInsertedAtStart = ts.createMap<{
            readonly node: ts.ClassDeclaration | ts.InterfaceDeclaration | ts.ObjectLiteralExpression;
            readonly sourceFile: ts.SourceFile;
        }>(); // Set<ClassDeclaration> implemented as Map<node id, ClassDeclaration>
        private readonly deletedNodes: {
            readonly sourceFile: ts.SourceFile;
            readonly node: ts.Node | ts.NodeArray<ts.TypeParameterDeclaration>;
        }[] = [];
        public static fromContext(context: TextChangesContext): ChangeTracker {
            return new ChangeTracker(ts.getNewLineOrDefaultFromHost(context.host, context.formatContext.options), context.formatContext);
        }
        public static with(context: TextChangesContext, cb: (tracker: ChangeTracker) => void): ts.FileTextChanges[] {
            const tracker = ChangeTracker.fromContext(context);
            cb(tracker);
            return tracker.getChanges();
        }
        /** Public for tests only. Other callers should use `ChangeTracker.with`. */
        constructor(private readonly newLineCharacter: string, private readonly formatContext: ts.formatting.FormatContext) { }
        public pushRaw(sourceFile: ts.SourceFile, change: ts.FileTextChanges) {
            ts.Debug.assertEqual(sourceFile.fileName, change.fileName);
            for (const c of change.textChanges) {
                this.changes.push({
                    kind: ChangeKind.Text,
                    sourceFile,
                    text: c.newText,
                    range: ts.createTextRangeFromSpan(c.span),
                });
            }
        }
        public deleteRange(sourceFile: ts.SourceFile, range: ts.TextRange): void {
            this.changes.push({ kind: ChangeKind.Remove, sourceFile, range });
        }
        delete(sourceFile: ts.SourceFile, node: ts.Node | ts.NodeArray<ts.TypeParameterDeclaration>): void {
            this.deletedNodes.push({ sourceFile, node });
        }
        public deleteModifier(sourceFile: ts.SourceFile, modifier: ts.Modifier): void {
            this.deleteRange(sourceFile, { pos: modifier.getStart(sourceFile), end: ts.skipTrivia(sourceFile.text, modifier.end, /*stopAfterLineBreak*/ true) });
        }
        public deleteNodeRange(sourceFile: ts.SourceFile, startNode: ts.Node, endNode: ts.Node, options: ConfigurableStartEnd = { leadingTriviaOption: LeadingTriviaOption.IncludeAll }): void {
            const startPosition = getAdjustedStartPosition(sourceFile, startNode, options);
            const endPosition = getAdjustedEndPosition(sourceFile, endNode, options);
            this.deleteRange(sourceFile, { pos: startPosition, end: endPosition });
        }
        public deleteNodeRangeExcludingEnd(sourceFile: ts.SourceFile, startNode: ts.Node, afterEndNode: ts.Node | undefined, options: ConfigurableStartEnd = { leadingTriviaOption: LeadingTriviaOption.IncludeAll }): void {
            const startPosition = getAdjustedStartPosition(sourceFile, startNode, options);
            const endPosition = afterEndNode === undefined ? sourceFile.text.length : getAdjustedStartPosition(sourceFile, afterEndNode, options);
            this.deleteRange(sourceFile, { pos: startPosition, end: endPosition });
        }
        public replaceRange(sourceFile: ts.SourceFile, range: ts.TextRange, newNode: ts.Node, options: InsertNodeOptions = {}): void {
            this.changes.push({ kind: ChangeKind.ReplaceWithSingleNode, sourceFile, range, options, node: newNode });
        }
        public replaceNode(sourceFile: ts.SourceFile, oldNode: ts.Node, newNode: ts.Node, options: ChangeNodeOptions = useNonAdjustedPositions): void {
            this.replaceRange(sourceFile, getAdjustedRange(sourceFile, oldNode, oldNode, options), newNode, options);
        }
        public replaceNodeRange(sourceFile: ts.SourceFile, startNode: ts.Node, endNode: ts.Node, newNode: ts.Node, options: ChangeNodeOptions = useNonAdjustedPositions): void {
            this.replaceRange(sourceFile, getAdjustedRange(sourceFile, startNode, endNode, options), newNode, options);
        }
        private replaceRangeWithNodes(sourceFile: ts.SourceFile, range: ts.TextRange, newNodes: readonly ts.Node[], options: ReplaceWithMultipleNodesOptions & ConfigurableStartEnd = {}): void {
            this.changes.push({ kind: ChangeKind.ReplaceWithMultipleNodes, sourceFile, range, options, nodes: newNodes });
        }
        public replaceNodeWithNodes(sourceFile: ts.SourceFile, oldNode: ts.Node, newNodes: readonly ts.Node[], options: ChangeNodeOptions = useNonAdjustedPositions): void {
            this.replaceRangeWithNodes(sourceFile, getAdjustedRange(sourceFile, oldNode, oldNode, options), newNodes, options);
        }
        public replaceNodeWithText(sourceFile: ts.SourceFile, oldNode: ts.Node, text: string): void {
            this.replaceRangeWithText(sourceFile, getAdjustedRange(sourceFile, oldNode, oldNode, useNonAdjustedPositions), text);
        }
        public replaceNodeRangeWithNodes(sourceFile: ts.SourceFile, startNode: ts.Node, endNode: ts.Node, newNodes: readonly ts.Node[], options: ReplaceWithMultipleNodesOptions & ConfigurableStartEnd = useNonAdjustedPositions): void {
            this.replaceRangeWithNodes(sourceFile, getAdjustedRange(sourceFile, startNode, endNode, options), newNodes, options);
        }
        private nextCommaToken(sourceFile: ts.SourceFile, node: ts.Node): ts.Node | undefined {
            const next = ts.findNextToken(node, node.parent, sourceFile);
            return next && next.kind === ts.SyntaxKind.CommaToken ? next : undefined;
        }
        public replacePropertyAssignment(sourceFile: ts.SourceFile, oldNode: ts.PropertyAssignment, newNode: ts.PropertyAssignment): void {
            const suffix = this.nextCommaToken(sourceFile, oldNode) ? "" : ("," + this.newLineCharacter);
            this.replaceNode(sourceFile, oldNode, newNode, { suffix });
        }
        public insertNodeAt(sourceFile: ts.SourceFile, pos: number, newNode: ts.Node, options: InsertNodeOptions = {}): void {
            this.replaceRange(sourceFile, ts.createRange(pos), newNode, options);
        }
        private insertNodesAt(sourceFile: ts.SourceFile, pos: number, newNodes: readonly ts.Node[], options: ReplaceWithMultipleNodesOptions = {}): void {
            this.replaceRangeWithNodes(sourceFile, ts.createRange(pos), newNodes, options);
        }
        public insertNodeAtTopOfFile(sourceFile: ts.SourceFile, newNode: ts.Statement, blankLineBetween: boolean): void {
            const pos = getInsertionPositionAtSourceFileTop(sourceFile);
            this.insertNodeAt(sourceFile, pos, newNode, {
                prefix: pos === 0 ? undefined : this.newLineCharacter,
                suffix: (ts.isLineBreak(sourceFile.text.charCodeAt(pos)) ? "" : this.newLineCharacter) + (blankLineBetween ? this.newLineCharacter : ""),
            });
        }
        public insertNodeBefore(sourceFile: ts.SourceFile, before: ts.Node, newNode: ts.Node, blankLineBetween = false): void {
            this.insertNodeAt(sourceFile, getAdjustedStartPosition(sourceFile, before, {}), newNode, this.getOptionsForInsertNodeBefore(before, blankLineBetween));
        }
        public insertModifierBefore(sourceFile: ts.SourceFile, modifier: ts.SyntaxKind, before: ts.Node): void {
            const pos = before.getStart(sourceFile);
            this.insertNodeAt(sourceFile, pos, ts.createToken(modifier), { suffix: " " });
        }
        public insertLastModifierBefore(sourceFile: ts.SourceFile, modifier: ts.SyntaxKind, before: ts.Node): void {
            if (!before.modifiers) {
                this.insertModifierBefore(sourceFile, modifier, before);
                return;
            }
            const pos = before.modifiers.end;
            this.insertNodeAt(sourceFile, pos, ts.createToken(modifier), { prefix: " " });
        }
        public insertCommentBeforeLine(sourceFile: ts.SourceFile, lineNumber: number, position: number, commentText: string): void {
            const lineStartPosition = ts.getStartPositionOfLine(lineNumber, sourceFile);
            const startPosition = ts.getFirstNonSpaceCharacterPosition(sourceFile.text, lineStartPosition);
            // First try to see if we can put the comment on the previous line.
            // We need to make sure that we are not in the middle of a string literal or a comment.
            // If so, we do not want to separate the node from its comment if we can.
            // Otherwise, add an extra new line immediately before the error span.
            const insertAtLineStart = isValidLocationToAddComment(sourceFile, startPosition);
            const token = ts.getTouchingToken(sourceFile, insertAtLineStart ? startPosition : position);
            const indent = sourceFile.text.slice(lineStartPosition, startPosition);
            const text = `${insertAtLineStart ? "" : this.newLineCharacter}//${commentText}${this.newLineCharacter}${indent}`;
            this.insertText(sourceFile, token.getStart(sourceFile), text);
        }
        public insertJsdocCommentBefore(sourceFile: ts.SourceFile, node: ts.HasJSDoc, tag: ts.JSDoc): void {
            const fnStart = node.getStart(sourceFile);
            if (node.jsDoc) {
                for (const jsdoc of node.jsDoc) {
                    this.deleteRange(sourceFile, {
                        pos: ts.getLineStartPositionForPosition(jsdoc.getStart(sourceFile), sourceFile),
                        end: getAdjustedEndPosition(sourceFile, jsdoc, /*options*/ {})
                    });
                }
            }
            const startPosition = ts.getPrecedingNonSpaceCharacterPosition(sourceFile.text, fnStart - 1);
            const indent = sourceFile.text.slice(startPosition, fnStart);
            this.insertNodeAt(sourceFile, fnStart, tag, { preserveLeadingWhitespace: false, suffix: this.newLineCharacter + indent });
        }
        public replaceRangeWithText(sourceFile: ts.SourceFile, range: ts.TextRange, text: string): void {
            this.changes.push({ kind: ChangeKind.Text, sourceFile, range, text });
        }
        public insertText(sourceFile: ts.SourceFile, pos: number, text: string): void {
            this.replaceRangeWithText(sourceFile, ts.createRange(pos), text);
        }
        /** Prefer this over replacing a node with another that has a type annotation, as it avoids reformatting the other parts of the node. */
        public tryInsertTypeAnnotation(sourceFile: ts.SourceFile, node: TypeAnnotatable, type: ts.TypeNode): boolean {
            let endNode: ts.Node | undefined;
            if (ts.isFunctionLike(node)) {
                endNode = ts.findChildOfKind(node, ts.SyntaxKind.CloseParenToken, sourceFile);
                if (!endNode) {
                    if (!ts.isArrowFunction(node))
                        return false; // Function missing parentheses, give up
                    // If no `)`, is an arrow function `x => x`, so use the end of the first parameter
                    endNode = ts.first(node.parameters);
                }
            }
            else {
                endNode = node.kind !== ts.SyntaxKind.VariableDeclaration && node.questionToken ? node.questionToken : node.name;
            }
            this.insertNodeAt(sourceFile, endNode.end, type, { prefix: ": " });
            return true;
        }
        public tryInsertThisTypeAnnotation(sourceFile: ts.SourceFile, node: ThisTypeAnnotatable, type: ts.TypeNode): void {
            const start = ts.findChildOfKind(node, ts.SyntaxKind.OpenParenToken, sourceFile)!.getStart(sourceFile) + 1;
            const suffix = node.parameters.length ? ", " : "";
            this.insertNodeAt(sourceFile, start, type, { prefix: "this: ", suffix });
        }
        public insertTypeParameters(sourceFile: ts.SourceFile, node: ts.SignatureDeclaration, typeParameters: readonly ts.TypeParameterDeclaration[]): void {
            // If no `(`, is an arrow function `x => x`, so use the pos of the first parameter
            const start = (ts.findChildOfKind(node, ts.SyntaxKind.OpenParenToken, sourceFile) || ts.first(node.parameters)).getStart(sourceFile);
            this.insertNodesAt(sourceFile, start, typeParameters, { prefix: "<", suffix: ">" });
        }
        private getOptionsForInsertNodeBefore(before: ts.Node, doubleNewlines: boolean): InsertNodeOptions {
            if (ts.isStatement(before) || ts.isClassElement(before)) {
                return { suffix: doubleNewlines ? this.newLineCharacter + this.newLineCharacter : this.newLineCharacter };
            }
            else if (ts.isVariableDeclaration(before)) { // insert `x = 1, ` into `const x = 1, y = 2;
                return { suffix: ", " };
            }
            else if (ts.isParameter(before)) {
                return {};
            }
            else if (ts.isStringLiteral(before) && ts.isImportDeclaration(before.parent) || ts.isNamedImports(before)) {
                return { suffix: ", " };
            }
            return ts.Debug.failBadSyntaxKind(before); // We haven't handled this kind of node yet -- add it
        }
        public insertNodeAtConstructorStart(sourceFile: ts.SourceFile, ctr: ts.ConstructorDeclaration, newStatement: ts.Statement): void {
            const firstStatement = ts.firstOrUndefined(ctr.body!.statements);
            if (!firstStatement || !ctr.body!.multiLine) {
                this.replaceConstructorBody(sourceFile, ctr, [newStatement, ...ctr.body!.statements]);
            }
            else {
                this.insertNodeBefore(sourceFile, firstStatement, newStatement);
            }
        }
        public insertNodeAtConstructorEnd(sourceFile: ts.SourceFile, ctr: ts.ConstructorDeclaration, newStatement: ts.Statement): void {
            const lastStatement = ts.lastOrUndefined(ctr.body!.statements);
            if (!lastStatement || !ctr.body!.multiLine) {
                this.replaceConstructorBody(sourceFile, ctr, [...ctr.body!.statements, newStatement]);
            }
            else {
                this.insertNodeAfter(sourceFile, lastStatement, newStatement);
            }
        }
        private replaceConstructorBody(sourceFile: ts.SourceFile, ctr: ts.ConstructorDeclaration, statements: readonly ts.Statement[]): void {
            this.replaceNode(sourceFile, (ctr.body!), ts.createBlock(statements, /*multiLine*/ true));
        }
        public insertNodeAtEndOfScope(sourceFile: ts.SourceFile, scope: ts.Node, newNode: ts.Node): void {
            const pos = getAdjustedStartPosition(sourceFile, scope.getLastToken()!, {});
            this.insertNodeAt(sourceFile, pos, newNode, {
                prefix: ts.isLineBreak(sourceFile.text.charCodeAt(scope.getLastToken()!.pos)) ? this.newLineCharacter : this.newLineCharacter + this.newLineCharacter,
                suffix: this.newLineCharacter
            });
        }
        public insertNodeAtClassStart(sourceFile: ts.SourceFile, cls: ts.ClassLikeDeclaration | ts.InterfaceDeclaration, newElement: ts.ClassElement): void {
            this.insertNodeAtStartWorker(sourceFile, cls, newElement);
        }
        public insertNodeAtObjectStart(sourceFile: ts.SourceFile, obj: ts.ObjectLiteralExpression, newElement: ts.ObjectLiteralElementLike): void {
            this.insertNodeAtStartWorker(sourceFile, obj, newElement);
        }
        private insertNodeAtStartWorker(sourceFile: ts.SourceFile, cls: ts.ClassLikeDeclaration | ts.InterfaceDeclaration | ts.ObjectLiteralExpression, newElement: ts.ClassElement | ts.ObjectLiteralElementLike): void {
            const clsStart = cls.getStart(sourceFile);
            const indentation = ts.formatting.SmartIndenter.findFirstNonWhitespaceColumn(ts.getLineStartPositionForPosition(clsStart, sourceFile), clsStart, sourceFile, this.formatContext.options)
                + (this.formatContext.options.indentSize!);
            this.insertNodeAt(sourceFile, getMembersOrProperties(cls).pos, newElement, { indentation, ...this.getInsertNodeAtStartPrefixSuffix(sourceFile, cls) });
        }
        private getInsertNodeAtStartPrefixSuffix(sourceFile: ts.SourceFile, cls: ts.ClassLikeDeclaration | ts.InterfaceDeclaration | ts.ObjectLiteralExpression): {
            prefix: string;
            suffix: string;
        } {
            const comma = ts.isObjectLiteralExpression(cls) ? "," : "";
            if (getMembersOrProperties(cls).length === 0) {
                if (ts.addToSeen(this.classesWithNodesInsertedAtStart, ts.getNodeId(cls), { node: cls, sourceFile })) {
                    // For `class C {\n}`, don't add the trailing "\n"
                    const shouldSuffix = (ts.positionsAreOnSameLine as any)(...getClassOrObjectBraceEnds(cls, sourceFile), sourceFile); // TODO: GH#4130 remove 'as any'
                    return { prefix: this.newLineCharacter, suffix: comma + (shouldSuffix ? this.newLineCharacter : "") };
                }
                else {
                    return { prefix: "", suffix: comma + this.newLineCharacter };
                }
            }
            else {
                return { prefix: this.newLineCharacter, suffix: comma };
            }
        }
        public insertNodeAfterComma(sourceFile: ts.SourceFile, after: ts.Node, newNode: ts.Node): void {
            const endPosition = this.insertNodeAfterWorker(sourceFile, this.nextCommaToken(sourceFile, after) || after, newNode);
            this.insertNodeAt(sourceFile, endPosition, newNode, this.getInsertNodeAfterOptions(sourceFile, after));
        }
        public insertNodeAfter(sourceFile: ts.SourceFile, after: ts.Node, newNode: ts.Node): void {
            const endPosition = this.insertNodeAfterWorker(sourceFile, after, newNode);
            this.insertNodeAt(sourceFile, endPosition, newNode, this.getInsertNodeAfterOptions(sourceFile, after));
        }
        public insertNodeAtEndOfList(sourceFile: ts.SourceFile, list: ts.NodeArray<ts.Node>, newNode: ts.Node): void {
            this.insertNodeAt(sourceFile, list.end, newNode, { prefix: ", " });
        }
        public insertNodesAfter(sourceFile: ts.SourceFile, after: ts.Node, newNodes: readonly ts.Node[]): void {
            const endPosition = this.insertNodeAfterWorker(sourceFile, after, ts.first(newNodes));
            this.insertNodesAt(sourceFile, endPosition, newNodes, this.getInsertNodeAfterOptions(sourceFile, after));
        }
        private insertNodeAfterWorker(sourceFile: ts.SourceFile, after: ts.Node, newNode: ts.Node): number {
            if (needSemicolonBetween(after, newNode)) {
                // check if previous statement ends with semicolon
                // if not - insert semicolon to preserve the code from changing the meaning due to ASI
                if (sourceFile.text.charCodeAt(after.end - 1) !== ts.CharacterCodes.semicolon) {
                    this.replaceRange(sourceFile, ts.createRange(after.end), ts.createToken(ts.SyntaxKind.SemicolonToken));
                }
            }
            const endPosition = getAdjustedEndPosition(sourceFile, after, {});
            return endPosition;
        }
        private getInsertNodeAfterOptions(sourceFile: ts.SourceFile, after: ts.Node): InsertNodeOptions {
            const options = this.getInsertNodeAfterOptionsWorker(after);
            return {
                ...options,
                prefix: after.end === sourceFile.end && ts.isStatement(after) ? (options.prefix ? `\n${options.prefix}` : "\n") : options.prefix,
            };
        }
        private getInsertNodeAfterOptionsWorker(node: ts.Node): InsertNodeOptions {
            switch (node.kind) {
                case ts.SyntaxKind.ClassDeclaration:
                case ts.SyntaxKind.ModuleDeclaration:
                    return { prefix: this.newLineCharacter, suffix: this.newLineCharacter };
                case ts.SyntaxKind.VariableDeclaration:
                case ts.SyntaxKind.StringLiteral:
                case ts.SyntaxKind.Identifier:
                    return { prefix: ", " };
                case ts.SyntaxKind.PropertyAssignment:
                    return { suffix: "," + this.newLineCharacter };
                case ts.SyntaxKind.ExportKeyword:
                    return { prefix: " " };
                case ts.SyntaxKind.Parameter:
                    return {};
                default:
                    ts.Debug.assert(ts.isStatement(node) || ts.isClassOrTypeElement(node)); // Else we haven't handled this kind of node yet -- add it
                    return { suffix: this.newLineCharacter };
            }
        }
        public insertName(sourceFile: ts.SourceFile, node: ts.FunctionExpression | ts.ClassExpression | ts.ArrowFunction, name: string): void {
            ts.Debug.assert(!node.name);
            if (node.kind === ts.SyntaxKind.ArrowFunction) {
                const arrow = (ts.findChildOfKind(node, ts.SyntaxKind.EqualsGreaterThanToken, sourceFile)!);
                const lparen = ts.findChildOfKind(node, ts.SyntaxKind.OpenParenToken, sourceFile);
                if (lparen) {
                    // `() => {}` --> `function f() {}`
                    this.insertNodesAt(sourceFile, lparen.getStart(sourceFile), [ts.createToken(ts.SyntaxKind.FunctionKeyword), ts.createIdentifier(name)], { joiner: " " });
                    deleteNode(this, sourceFile, arrow);
                }
                else {
                    // `x => {}` -> `function f(x) {}`
                    this.insertText(sourceFile, ts.first(node.parameters).getStart(sourceFile), `function ${name}(`);
                    // Replacing full range of arrow to get rid of the leading space -- replace ` =>` with `)`
                    this.replaceRange(sourceFile, arrow, ts.createToken(ts.SyntaxKind.CloseParenToken));
                }
                if (node.body.kind !== ts.SyntaxKind.Block) {
                    // `() => 0` => `function f() { return 0; }`
                    this.insertNodesAt(sourceFile, node.body.getStart(sourceFile), [ts.createToken(ts.SyntaxKind.OpenBraceToken), ts.createToken(ts.SyntaxKind.ReturnKeyword)], { joiner: " ", suffix: " " });
                    this.insertNodesAt(sourceFile, node.body.end, [ts.createToken(ts.SyntaxKind.SemicolonToken), ts.createToken(ts.SyntaxKind.CloseBraceToken)], { joiner: " " });
                }
            }
            else {
                const pos = ts.findChildOfKind(node, node.kind === ts.SyntaxKind.FunctionExpression ? ts.SyntaxKind.FunctionKeyword : ts.SyntaxKind.ClassKeyword, sourceFile)!.end;
                this.insertNodeAt(sourceFile, pos, ts.createIdentifier(name), { prefix: " " });
            }
        }
        public insertExportModifier(sourceFile: ts.SourceFile, node: ts.DeclarationStatement | ts.VariableStatement): void {
            this.insertText(sourceFile, node.getStart(sourceFile), "export ");
        }
        /**
         * This function should be used to insert nodes in lists when nodes don't carry separators as the part of the node range,
         * i.e. arguments in arguments lists, parameters in parameter lists etc.
         * Note that separators are part of the node in statements and class elements.
         */
        public insertNodeInListAfter(sourceFile: ts.SourceFile, after: ts.Node, newNode: ts.Node, containingList = ts.formatting.SmartIndenter.getContainingList(after, sourceFile)): void {
            if (!containingList) {
                ts.Debug.fail("node is not a list element");
                return;
            }
            const index = ts.indexOfNode(containingList, after);
            if (index < 0) {
                return;
            }
            const end = after.getEnd();
            if (index !== containingList.length - 1) {
                // any element except the last one
                // use next sibling as an anchor
                const nextToken = ts.getTokenAtPosition(sourceFile, after.end);
                if (nextToken && isSeparator(after, nextToken)) {
                    // for list
                    // a, b, c
                    // create change for adding 'e' after 'a' as
                    // - find start of next element after a (it is b)
                    // - use this start as start and end position in final change
                    // - build text of change by formatting the text of node + separator + whitespace trivia of b
                    // in multiline case it will work as
                    //   a,
                    //   b,
                    //   c,
                    // result - '*' denotes leading trivia that will be inserted after new text (displayed as '#')
                    //   a,*
                    // ***insertedtext<separator>#
                    // ###b,
                    //   c,
                    // find line and character of the next element
                    const lineAndCharOfNextElement = ts.getLineAndCharacterOfPosition(sourceFile, skipWhitespacesAndLineBreaks(sourceFile.text, containingList[index + 1].getFullStart()));
                    // find line and character of the token that precedes next element (usually it is separator)
                    const lineAndCharOfNextToken = ts.getLineAndCharacterOfPosition(sourceFile, nextToken.end);
                    let prefix: string | undefined;
                    let startPos: number;
                    if (lineAndCharOfNextToken.line === lineAndCharOfNextElement.line) {
                        // next element is located on the same line with separator:
                        // a,$$$$b
                        //  ^    ^
                        //  |    |-next element
                        //  |-separator
                        // where $$$ is some leading trivia
                        // for a newly inserted node we'll maintain the same relative position comparing to separator and replace leading trivia with spaces
                        // a,    x,$$$$b
                        //  ^    ^     ^
                        //  |    |     |-next element
                        //  |    |-new inserted node padded with spaces
                        //  |-separator
                        startPos = nextToken.end;
                        prefix = spaces(lineAndCharOfNextElement.character - lineAndCharOfNextToken.character);
                    }
                    else {
                        // next element is located on different line that separator
                        // let insert position be the beginning of the line that contains next element
                        startPos = ts.getStartPositionOfLine(lineAndCharOfNextElement.line, sourceFile);
                    }
                    // write separator and leading trivia of the next element as suffix
                    const suffix = `${ts.tokenToString(nextToken.kind)}${sourceFile.text.substring(nextToken.end, containingList[index + 1].getStart(sourceFile))}`;
                    this.replaceRange(sourceFile, ts.createRange(startPos, containingList[index + 1].getStart(sourceFile)), newNode, { prefix, suffix });
                }
            }
            else {
                const afterStart = after.getStart(sourceFile);
                const afterStartLinePosition = ts.getLineStartPositionForPosition(afterStart, sourceFile);
                let separator: ts.SyntaxKind.CommaToken | ts.SyntaxKind.SemicolonToken | undefined;
                let multilineList = false;
                // insert element after the last element in the list that has more than one item
                // pick the element preceding the after element to:
                // - pick the separator
                // - determine if list is a multiline
                if (containingList.length === 1) {
                    // if list has only one element then we'll format is as multiline if node has comment in trailing trivia, or as singleline otherwise
                    // i.e. var x = 1 // this is x
                    //     | new element will be inserted at this position
                    separator = ts.SyntaxKind.CommaToken;
                }
                else {
                    // element has more than one element, pick separator from the list
                    const tokenBeforeInsertPosition = ts.findPrecedingToken(after.pos, sourceFile);
                    separator = isSeparator(after, tokenBeforeInsertPosition) ? tokenBeforeInsertPosition.kind : ts.SyntaxKind.CommaToken;
                    // determine if list is multiline by checking lines of after element and element that precedes it.
                    const afterMinusOneStartLinePosition = ts.getLineStartPositionForPosition(containingList[index - 1].getStart(sourceFile), sourceFile);
                    multilineList = afterMinusOneStartLinePosition !== afterStartLinePosition;
                }
                if (hasCommentsBeforeLineBreak(sourceFile.text, after.end)) {
                    // in this case we'll always treat containing list as multiline
                    multilineList = true;
                }
                if (multilineList) {
                    // insert separator immediately following the 'after' node to preserve comments in trailing trivia
                    this.replaceRange(sourceFile, ts.createRange(end), ts.createToken(separator));
                    // use the same indentation as 'after' item
                    const indentation = ts.formatting.SmartIndenter.findFirstNonWhitespaceColumn(afterStartLinePosition, afterStart, sourceFile, this.formatContext.options);
                    // insert element before the line break on the line that contains 'after' element
                    let insertPos = ts.skipTrivia(sourceFile.text, end, /*stopAfterLineBreak*/ true, /*stopAtComments*/ false);
                    if (insertPos !== end && ts.isLineBreak(sourceFile.text.charCodeAt(insertPos - 1))) {
                        insertPos--;
                    }
                    this.replaceRange(sourceFile, ts.createRange(insertPos), newNode, { indentation, prefix: this.newLineCharacter });
                }
                else {
                    this.replaceRange(sourceFile, ts.createRange(end), newNode, { prefix: `${ts.tokenToString(separator)} ` });
                }
            }
        }
        public parenthesizeExpression(sourceFile: ts.SourceFile, expression: ts.Expression) {
            this.replaceRange(sourceFile, ts.rangeOfNode(expression), ts.createParen(expression));
        }
        private finishClassesWithNodesInsertedAtStart(): void {
            this.classesWithNodesInsertedAtStart.forEach(({ node, sourceFile }) => {
                const [openBraceEnd, closeBraceEnd] = getClassOrObjectBraceEnds(node, sourceFile);
                // For `class C { }` remove the whitespace inside the braces.
                if (ts.positionsAreOnSameLine(openBraceEnd, closeBraceEnd, sourceFile) && openBraceEnd !== closeBraceEnd - 1) {
                    this.deleteRange(sourceFile, ts.createRange(openBraceEnd, closeBraceEnd - 1));
                }
            });
        }
        private finishDeleteDeclarations(): void {
            const deletedNodesInLists = new ts.NodeSet(); // Stores nodes in lists that we already deleted. Used to avoid deleting `, ` twice in `a, b`.
            for (const { sourceFile, node } of this.deletedNodes) {
                if (!this.deletedNodes.some(d => d.sourceFile === sourceFile && ts.rangeContainsRangeExclusive(d.node, node))) {
                    if (ts.isArray(node)) {
                        this.deleteRange(sourceFile, ts.rangeOfTypeParameters(node));
                    }
                    else {
                        deleteDeclaration.deleteDeclaration(this, deletedNodesInLists, sourceFile, node);
                    }
                }
            }
            deletedNodesInLists.forEach(node => {
                const sourceFile = node.getSourceFile();
                const list = (ts.formatting.SmartIndenter.getContainingList(node, sourceFile)!);
                if (node !== ts.last(list))
                    return;
                const lastNonDeletedIndex = ts.findLastIndex(list, n => !deletedNodesInLists.has(n), list.length - 2);
                if (lastNonDeletedIndex !== -1) {
                    this.deleteRange(sourceFile, { pos: list[lastNonDeletedIndex].end, end: startPositionToDeleteNodeInList(sourceFile, list[lastNonDeletedIndex + 1]) });
                }
            });
        }
        /**
         * Note: after calling this, the TextChanges object must be discarded!
         * @param validate only for tests
         *    The reason we must validate as part of this method is that `getNonFormattedText` changes the node's positions,
         *    so we can only call this once and can't get the non-formatted text separately.
         */
        public getChanges(validate?: ValidateNonFormattedText): ts.FileTextChanges[] {
            this.finishDeleteDeclarations();
            this.finishClassesWithNodesInsertedAtStart();
            const changes = changesToText.getTextChangesFromChanges(this.changes, this.newLineCharacter, this.formatContext, validate);
            for (const { oldFile, fileName, statements } of this.newFiles) {
                changes.push(changesToText.newFileChanges(oldFile, fileName, statements, this.newLineCharacter, this.formatContext));
            }
            return changes;
        }
        public createNewFile(oldFile: ts.SourceFile | undefined, fileName: string, statements: readonly ts.Statement[]): void {
            this.newFiles.push({ oldFile, fileName, statements });
        }
    }
    // find first non-whitespace position in the leading trivia of the node
    function startPositionToDeleteNodeInList(sourceFile: ts.SourceFile, node: ts.Node): number {
        return ts.skipTrivia(sourceFile.text, getAdjustedStartPosition(sourceFile, node, { leadingTriviaOption: LeadingTriviaOption.IncludeAll }), /*stopAfterLineBreak*/ false, /*stopAtComments*/ true);
    }
    function getClassOrObjectBraceEnds(cls: ts.ClassLikeDeclaration | ts.InterfaceDeclaration | ts.ObjectLiteralExpression, sourceFile: ts.SourceFile): [number, number] {
        return [ts.findChildOfKind(cls, ts.SyntaxKind.OpenBraceToken, sourceFile)!.end, ts.findChildOfKind(cls, ts.SyntaxKind.CloseBraceToken, sourceFile)!.end];
    }
    function getMembersOrProperties(cls: ts.ClassLikeDeclaration | ts.InterfaceDeclaration | ts.ObjectLiteralExpression): ts.NodeArray<ts.Node> {
        return ts.isObjectLiteralExpression(cls) ? cls.properties : cls.members;
    }
    export type ValidateNonFormattedText = (node: ts.Node, text: string) => void;
    export function getNewFileText(statements: readonly ts.Statement[], scriptKind: ts.ScriptKind, newLineCharacter: string, formatContext: ts.formatting.FormatContext): string {
        return changesToText.newFileChangesWorker(/*oldFile*/ undefined, scriptKind, statements, newLineCharacter, formatContext);
    }
    namespace changesToText {
        export function getTextChangesFromChanges(changes: readonly Change[], newLineCharacter: string, formatContext: ts.formatting.FormatContext, validate: ValidateNonFormattedText | undefined): ts.FileTextChanges[] {
            return ts.group(changes, c => c.sourceFile.path).map(changesInFile => {
                const sourceFile = changesInFile[0].sourceFile;
                // order changes by start position
                // If the start position is the same, put the shorter range first, since an empty range (x, x) may precede (x, y) but not vice-versa.
                const normalized = ts.stableSort(changesInFile, (a, b) => (a.range.pos - b.range.pos) || (a.range.end - b.range.end));
                // verify that change intervals do not overlap, except possibly at end points.
                for (let i = 0; i < normalized.length - 1; i++) {
                    ts.Debug.assert(normalized[i].range.end <= normalized[i + 1].range.pos, "Changes overlap", () => `${JSON.stringify(normalized[i].range)} and ${JSON.stringify(normalized[i + 1].range)}`);
                }
                const textChanges = normalized.map(c => ts.createTextChange(ts.createTextSpanFromRange(c.range), computeNewText(c, sourceFile, newLineCharacter, formatContext, validate)));
                return { fileName: sourceFile.fileName, textChanges };
            });
        }
        export function newFileChanges(oldFile: ts.SourceFile | undefined, fileName: string, statements: readonly ts.Statement[], newLineCharacter: string, formatContext: ts.formatting.FormatContext): ts.FileTextChanges {
            const text = newFileChangesWorker(oldFile, ts.getScriptKindFromFileName(fileName), statements, newLineCharacter, formatContext);
            return { fileName, textChanges: [ts.createTextChange(ts.createTextSpan(0, 0), text)], isNewFile: true };
        }
        export function newFileChangesWorker(oldFile: ts.SourceFile | undefined, scriptKind: ts.ScriptKind, statements: readonly ts.Statement[], newLineCharacter: string, formatContext: ts.formatting.FormatContext): string {
            // TODO: this emits the file, parses it back, then formats it that -- may be a less roundabout way to do this
            const nonFormattedText = statements.map(s => getNonformattedText(s, oldFile, newLineCharacter).text).join(newLineCharacter);
            const sourceFile = ts.createSourceFile("any file name", nonFormattedText, ts.ScriptTarget.ESNext, /*setParentNodes*/ true, scriptKind);
            const changes = ts.formatting.formatDocument(sourceFile, formatContext);
            return applyChanges(nonFormattedText, changes) + newLineCharacter;
        }
        function computeNewText(change: Change, sourceFile: ts.SourceFile, newLineCharacter: string, formatContext: ts.formatting.FormatContext, validate: ValidateNonFormattedText | undefined): string {
            if (change.kind === ChangeKind.Remove) {
                return "";
            }
            if (change.kind === ChangeKind.Text) {
                return change.text;
            }
            const { options = {}, range: { pos } } = change;
            const format = (n: ts.Node) => getFormattedTextOfNode(n, sourceFile, pos, options, newLineCharacter, formatContext, validate);
            const text = change.kind === ChangeKind.ReplaceWithMultipleNodes
                ? change.nodes.map(n => ts.removeSuffix(format(n), newLineCharacter)).join(change.options!.joiner || newLineCharacter) // TODO: GH#18217
                : format(change.node);
            // strip initial indentation (spaces or tabs) if text will be inserted in the middle of the line
            const noIndent = (options.preserveLeadingWhitespace || options.indentation !== undefined || ts.getLineStartPositionForPosition(pos, sourceFile) === pos) ? text : text.replace(/^\s+/, "");
            return (options.prefix || "") + noIndent + (options.suffix || "");
        }
        function getFormatCodeSettingsForWriting({ options }: ts.formatting.FormatContext, sourceFile: ts.SourceFile): ts.FormatCodeSettings {
            const shouldAutoDetectSemicolonPreference = !options.semicolons || options.semicolons === ts.SemicolonPreference.Ignore;
            const shouldRemoveSemicolons = options.semicolons === ts.SemicolonPreference.Remove || shouldAutoDetectSemicolonPreference && !ts.probablyUsesSemicolons(sourceFile);
            return {
                ...options,
                semicolons: shouldRemoveSemicolons ? ts.SemicolonPreference.Remove : ts.SemicolonPreference.Ignore,
            };
        }
        /** Note: this may mutate `nodeIn`. */
        function getFormattedTextOfNode(nodeIn: ts.Node, sourceFile: ts.SourceFile, pos: number, { indentation, prefix, delta }: InsertNodeOptions, newLineCharacter: string, formatContext: ts.formatting.FormatContext, validate: ValidateNonFormattedText | undefined): string {
            const { node, text } = getNonformattedText(nodeIn, sourceFile, newLineCharacter);
            if (validate)
                validate(node, text);
            const formatOptions = getFormatCodeSettingsForWriting(formatContext, sourceFile);
            const initialIndentation = indentation !== undefined
                ? indentation
                : ts.formatting.SmartIndenter.getIndentation(pos, sourceFile, formatOptions, prefix === newLineCharacter || ts.getLineStartPositionForPosition(pos, sourceFile) === pos);
            if (delta === undefined) {
                delta = ts.formatting.SmartIndenter.shouldIndentChildNode(formatOptions, nodeIn) ? (formatOptions.indentSize || 0) : 0;
            }
            const file: ts.SourceFileLike = { text, getLineAndCharacterOfPosition(pos) { return ts.getLineAndCharacterOfPosition(this, pos); } };
            const changes = ts.formatting.formatNodeGivenIndentation(node, file, sourceFile.languageVariant, initialIndentation, delta, { ...formatContext, options: formatOptions });
            return applyChanges(text, changes);
        }
        /** Note: output node may be mutated input node. */
        export function getNonformattedText(node: ts.Node, sourceFile: ts.SourceFile | undefined, newLineCharacter: string): {
            text: string;
            node: ts.Node;
        } {
            const writer = createWriter(newLineCharacter);
            const newLine = newLineCharacter === "\n" ? ts.NewLineKind.LineFeed : ts.NewLineKind.CarriageReturnLineFeed;
            ts.createPrinter({ newLine, neverAsciiEscape: true }, writer).writeNode(ts.EmitHint.Unspecified, node, sourceFile, writer);
            return { text: writer.getText(), node: assignPositionsToNode(node) };
        }
    }
    export function applyChanges(text: string, changes: readonly ts.TextChange[]): string {
        for (let i = changes.length - 1; i >= 0; i--) {
            const { span, newText } = changes[i];
            text = `${text.substring(0, span.start)}${newText}${text.substring(ts.textSpanEnd(span))}`;
        }
        return text;
    }
    function isTrivia(s: string) {
        return ts.skipTrivia(s, 0) === s.length;
    }
    function assignPositionsToNode(node: ts.Node): ts.Node {
        const visited = (ts.visitEachChild(node, assignPositionsToNode, ts.nullTransformationContext, assignPositionsToNodeArray, assignPositionsToNode)!); // TODO: GH#18217
        // create proxy node for non synthesized nodes
        const newNode = ts.nodeIsSynthesized(visited) ? visited : Object.create(visited) as ts.Node;
        newNode.pos = getPos(node);
        newNode.end = getEnd(node);
        return newNode;
    }
    function assignPositionsToNodeArray(nodes: ts.NodeArray<any>, visitor: ts.Visitor, test?: (node: ts.Node) => boolean, start?: number, count?: number) {
        const visited = ts.visitNodes(nodes, visitor, test, start, count);
        if (!visited) {
            return visited;
        }
        // clone nodearray if necessary
        const nodeArray = visited === nodes ? ts.createNodeArray(visited.slice(0)) : visited;
        nodeArray.pos = getPos(nodes);
        nodeArray.end = getEnd(nodes);
        return nodeArray;
    }
    interface TextChangesWriter extends ts.EmitTextWriter, ts.PrintHandlers {
    }
    function createWriter(newLine: string): TextChangesWriter {
        let lastNonTriviaPosition = 0;
        const writer = ts.createTextWriter(newLine);
        const onEmitNode: ts.PrintHandlers["onEmitNode"] = (hint, node, printCallback) => {
            if (node) {
                setPos(node, lastNonTriviaPosition);
            }
            printCallback(hint, node);
            if (node) {
                setEnd(node, lastNonTriviaPosition);
            }
        };
        const onBeforeEmitNodeArray: ts.PrintHandlers["onBeforeEmitNodeArray"] = nodes => {
            if (nodes) {
                setPos(nodes, lastNonTriviaPosition);
            }
        };
        const onAfterEmitNodeArray: ts.PrintHandlers["onAfterEmitNodeArray"] = nodes => {
            if (nodes) {
                setEnd(nodes, lastNonTriviaPosition);
            }
        };
        const onBeforeEmitToken: ts.PrintHandlers["onBeforeEmitToken"] = node => {
            if (node) {
                setPos(node, lastNonTriviaPosition);
            }
        };
        const onAfterEmitToken: ts.PrintHandlers["onAfterEmitToken"] = node => {
            if (node) {
                setEnd(node, lastNonTriviaPosition);
            }
        };
        function setLastNonTriviaPosition(s: string, force: boolean) {
            if (force || !isTrivia(s)) {
                lastNonTriviaPosition = writer.getTextPos();
                let i = 0;
                while (ts.isWhiteSpaceLike(s.charCodeAt(s.length - i - 1))) {
                    i++;
                }
                // trim trailing whitespaces
                lastNonTriviaPosition -= i;
            }
        }
        function write(s: string): void {
            writer.write(s);
            setLastNonTriviaPosition(s, /*force*/ false);
        }
        function writeComment(s: string): void {
            writer.writeComment(s);
        }
        function writeKeyword(s: string): void {
            writer.writeKeyword(s);
            setLastNonTriviaPosition(s, /*force*/ false);
        }
        function writeOperator(s: string): void {
            writer.writeOperator(s);
            setLastNonTriviaPosition(s, /*force*/ false);
        }
        function writePunctuation(s: string): void {
            writer.writePunctuation(s);
            setLastNonTriviaPosition(s, /*force*/ false);
        }
        function writeTrailingSemicolon(s: string): void {
            writer.writeTrailingSemicolon(s);
            setLastNonTriviaPosition(s, /*force*/ false);
        }
        function writeParameter(s: string): void {
            writer.writeParameter(s);
            setLastNonTriviaPosition(s, /*force*/ false);
        }
        function writeProperty(s: string): void {
            writer.writeProperty(s);
            setLastNonTriviaPosition(s, /*force*/ false);
        }
        function writeSpace(s: string): void {
            writer.writeSpace(s);
            setLastNonTriviaPosition(s, /*force*/ false);
        }
        function writeStringLiteral(s: string): void {
            writer.writeStringLiteral(s);
            setLastNonTriviaPosition(s, /*force*/ false);
        }
        function writeSymbol(s: string, sym: ts.Symbol): void {
            writer.writeSymbol(s, sym);
            setLastNonTriviaPosition(s, /*force*/ false);
        }
        function writeLine(): void {
            writer.writeLine();
        }
        function increaseIndent(): void {
            writer.increaseIndent();
        }
        function decreaseIndent(): void {
            writer.decreaseIndent();
        }
        function getText(): string {
            return writer.getText();
        }
        function rawWrite(s: string): void {
            writer.rawWrite(s);
            setLastNonTriviaPosition(s, /*force*/ false);
        }
        function writeLiteral(s: string): void {
            writer.writeLiteral(s);
            setLastNonTriviaPosition(s, /*force*/ true);
        }
        function getTextPos(): number {
            return writer.getTextPos();
        }
        function getLine(): number {
            return writer.getLine();
        }
        function getColumn(): number {
            return writer.getColumn();
        }
        function getIndent(): number {
            return writer.getIndent();
        }
        function isAtStartOfLine(): boolean {
            return writer.isAtStartOfLine();
        }
        function clear(): void {
            writer.clear();
            lastNonTriviaPosition = 0;
        }
        return {
            onEmitNode,
            onBeforeEmitNodeArray,
            onAfterEmitNodeArray,
            onBeforeEmitToken,
            onAfterEmitToken,
            write,
            writeComment,
            writeKeyword,
            writeOperator,
            writePunctuation,
            writeTrailingSemicolon,
            writeParameter,
            writeProperty,
            writeSpace,
            writeStringLiteral,
            writeSymbol,
            writeLine,
            increaseIndent,
            decreaseIndent,
            getText,
            rawWrite,
            writeLiteral,
            getTextPos,
            getLine,
            getColumn,
            getIndent,
            isAtStartOfLine,
            hasTrailingComment: () => writer.hasTrailingComment(),
            hasTrailingWhitespace: () => writer.hasTrailingWhitespace(),
            clear
        };
    }
    function getInsertionPositionAtSourceFileTop(sourceFile: ts.SourceFile): number {
        let lastPrologue: ts.PrologueDirective | undefined;
        for (const node of sourceFile.statements) {
            if (ts.isPrologueDirective(node)) {
                lastPrologue = node;
            }
            else {
                break;
            }
        }
        let position = 0;
        const text = sourceFile.text;
        if (lastPrologue) {
            position = lastPrologue.end;
            advancePastLineBreak();
            return position;
        }
        const shebang = ts.getShebang(text);
        if (shebang !== undefined) {
            position = shebang.length;
            advancePastLineBreak();
        }
        // For a source file, it is possible there are detached comments we should not skip
        let ranges = ts.getLeadingCommentRanges(text, position);
        if (!ranges)
            return position;
        // However we should still skip a pinned comment at the top
        if (ranges.length && ranges[0].kind === ts.SyntaxKind.MultiLineCommentTrivia && ts.isPinnedComment(text, ranges[0].pos)) {
            position = ranges[0].end;
            advancePastLineBreak();
            ranges = ranges.slice(1);
        }
        // As well as any triple slash references
        for (const range of ranges) {
            if (range.kind === ts.SyntaxKind.SingleLineCommentTrivia && ts.isRecognizedTripleSlashComment(text, range.pos, range.end)) {
                position = range.end;
                advancePastLineBreak();
                continue;
            }
            break;
        }
        return position;
        function advancePastLineBreak() {
            if (position < text.length) {
                const charCode = text.charCodeAt(position);
                if (ts.isLineBreak(charCode)) {
                    position++;
                    if (position < text.length && charCode === ts.CharacterCodes.carriageReturn && text.charCodeAt(position) === ts.CharacterCodes.lineFeed) {
                        position++;
                    }
                }
            }
        }
    }
    export function isValidLocationToAddComment(sourceFile: ts.SourceFile, position: number) {
        return !ts.isInComment(sourceFile, position) && !ts.isInString(sourceFile, position) && !ts.isInTemplateString(sourceFile, position) && !ts.isInJSXText(sourceFile, position);
    }
    function needSemicolonBetween(a: ts.Node, b: ts.Node): boolean {
        return (ts.isPropertySignature(a) || ts.isPropertyDeclaration(a)) && ts.isClassOrTypeElement(b) && b.name!.kind === ts.SyntaxKind.ComputedPropertyName
            || ts.isStatementButNotDeclaration(a) && ts.isStatementButNotDeclaration(b); // TODO: only if b would start with a `(` or `[`
    }
    namespace deleteDeclaration {
        export function deleteDeclaration(changes: ChangeTracker, deletedNodesInLists: ts.NodeSet<ts.Node>, sourceFile: ts.SourceFile, node: ts.Node): void {
            switch (node.kind) {
                case ts.SyntaxKind.Parameter: {
                    const oldFunction = node.parent;
                    if (ts.isArrowFunction(oldFunction) &&
                        oldFunction.parameters.length === 1 &&
                        !ts.findChildOfKind(oldFunction, ts.SyntaxKind.OpenParenToken, sourceFile)) {
                        // Lambdas with exactly one parameter are special because, after removal, there
                        // must be an empty parameter list (i.e. `()`) and this won't necessarily be the
                        // case if the parameter is simply removed (e.g. in `x => 1`).
                        changes.replaceNodeWithText(sourceFile, node, "()");
                    }
                    else {
                        deleteNodeInList(changes, deletedNodesInLists, sourceFile, node);
                    }
                    break;
                }
                case ts.SyntaxKind.ImportDeclaration:
                    deleteNode(changes, sourceFile, node, 
                    // For first import, leave header comment in place
                    node === sourceFile.imports[0].parent ? { leadingTriviaOption: LeadingTriviaOption.Exclude } : undefined);
                    break;
                case ts.SyntaxKind.BindingElement:
                    const pattern = (node as ts.BindingElement).parent;
                    const preserveComma = pattern.kind === ts.SyntaxKind.ArrayBindingPattern && node !== ts.last(pattern.elements);
                    if (preserveComma) {
                        deleteNode(changes, sourceFile, node);
                    }
                    else {
                        deleteNodeInList(changes, deletedNodesInLists, sourceFile, node);
                    }
                    break;
                case ts.SyntaxKind.VariableDeclaration:
                    deleteVariableDeclaration(changes, deletedNodesInLists, sourceFile, (node as ts.VariableDeclaration));
                    break;
                case ts.SyntaxKind.TypeParameter:
                    deleteNodeInList(changes, deletedNodesInLists, sourceFile, node);
                    break;
                case ts.SyntaxKind.ImportSpecifier:
                    const namedImports = (node as ts.ImportSpecifier).parent;
                    if (namedImports.elements.length === 1) {
                        deleteImportBinding(changes, sourceFile, namedImports);
                    }
                    else {
                        deleteNodeInList(changes, deletedNodesInLists, sourceFile, node);
                    }
                    break;
                case ts.SyntaxKind.NamespaceImport:
                    deleteImportBinding(changes, sourceFile, (node as ts.NamespaceImport));
                    break;
                default:
                    if (ts.isImportClause(node.parent) && node.parent.name === node) {
                        deleteDefaultImport(changes, sourceFile, node.parent);
                    }
                    else if (ts.isCallLikeExpression(node.parent)) {
                        deleteNodeInList(changes, deletedNodesInLists, sourceFile, node);
                    }
                    else {
                        deleteNode(changes, sourceFile, node, node.kind === ts.SyntaxKind.SemicolonToken ? { trailingTriviaOption: TrailingTriviaOption.Exclude } : undefined);
                    }
            }
        }
        function deleteDefaultImport(changes: ChangeTracker, sourceFile: ts.SourceFile, importClause: ts.ImportClause): void {
            if (!importClause.namedBindings) {
                // Delete the whole import
                deleteNode(changes, sourceFile, importClause.parent);
            }
            else {
                // import |d,| * as ns from './file'
                const start = importClause.name!.getStart(sourceFile);
                const nextToken = ts.getTokenAtPosition(sourceFile, importClause.name!.end);
                if (nextToken && nextToken.kind === ts.SyntaxKind.CommaToken) {
                    // shift first non-whitespace position after comma to the start position of the node
                    const end = ts.skipTrivia(sourceFile.text, nextToken.end, /*stopAfterLineBreaks*/ false, /*stopAtComments*/ true);
                    changes.deleteRange(sourceFile, { pos: start, end });
                }
                else {
                    deleteNode(changes, sourceFile, importClause.name!);
                }
            }
        }
        function deleteImportBinding(changes: ChangeTracker, sourceFile: ts.SourceFile, node: ts.NamedImportBindings): void {
            if (node.parent.name) {
                // Delete named imports while preserving the default import
                // import d|, * as ns| from './file'
                // import d|, { a }| from './file'
                const previousToken = ts.Debug.assertDefined(ts.getTokenAtPosition(sourceFile, node.pos - 1));
                changes.deleteRange(sourceFile, { pos: previousToken.getStart(sourceFile), end: node.end });
            }
            else {
                // Delete the entire import declaration
                // |import * as ns from './file'|
                // |import { a } from './file'|
                const importDecl = (ts.getAncestor(node, ts.SyntaxKind.ImportDeclaration)!);
                deleteNode(changes, sourceFile, importDecl);
            }
        }
        function deleteVariableDeclaration(changes: ChangeTracker, deletedNodesInLists: ts.NodeSet<ts.Node>, sourceFile: ts.SourceFile, node: ts.VariableDeclaration): void {
            const { parent } = node;
            if (parent.kind === ts.SyntaxKind.CatchClause) {
                // TODO: There's currently no unused diagnostic for this, could be a suggestion
                changes.deleteNodeRange(sourceFile, (ts.findChildOfKind(parent, ts.SyntaxKind.OpenParenToken, sourceFile)!), (ts.findChildOfKind(parent, ts.SyntaxKind.CloseParenToken, sourceFile)!));
                return;
            }
            if (parent.declarations.length !== 1) {
                deleteNodeInList(changes, deletedNodesInLists, sourceFile, node);
                return;
            }
            const gp = parent.parent;
            switch (gp.kind) {
                case ts.SyntaxKind.ForOfStatement:
                case ts.SyntaxKind.ForInStatement:
                    changes.replaceNode(sourceFile, node, ts.createObjectLiteral());
                    break;
                case ts.SyntaxKind.ForStatement:
                    deleteNode(changes, sourceFile, parent);
                    break;
                case ts.SyntaxKind.VariableStatement:
                    deleteNode(changes, sourceFile, gp);
                    break;
                default:
                    ts.Debug.assertNever(gp);
            }
        }
    }
    /** Warning: This deletes comments too. See `copyComments` in `convertFunctionToEs6Class`. */
    // Exported for tests only! (TODO: improve tests to not need this)
    export function deleteNode(changes: ChangeTracker, sourceFile: ts.SourceFile, node: ts.Node, options: ConfigurableStartEnd = { leadingTriviaOption: LeadingTriviaOption.IncludeAll }): void {
        const startPosition = getAdjustedStartPosition(sourceFile, node, options);
        const endPosition = getAdjustedEndPosition(sourceFile, node, options);
        changes.deleteRange(sourceFile, { pos: startPosition, end: endPosition });
    }
    function deleteNodeInList(changes: ChangeTracker, deletedNodesInLists: ts.NodeSet<ts.Node>, sourceFile: ts.SourceFile, node: ts.Node): void {
        const containingList = ts.Debug.assertDefined(ts.formatting.SmartIndenter.getContainingList(node, sourceFile));
        const index = ts.indexOfNode(containingList, node);
        ts.Debug.assert(index !== -1);
        if (containingList.length === 1) {
            deleteNode(changes, sourceFile, node);
            return;
        }
        // Note: We will only delete a comma *after* a node. This will leave a trailing comma if we delete the last node.
        // That's handled in the end by `finishTrailingCommaAfterDeletingNodesInList`.
        ts.Debug.assert(!deletedNodesInLists.has(node), "Deleting a node twice");
        deletedNodesInLists.add(node);
        changes.deleteRange(sourceFile, {
            pos: startPositionToDeleteNodeInList(sourceFile, node),
            end: index === containingList.length - 1 ? getAdjustedEndPosition(sourceFile, node, {}) : startPositionToDeleteNodeInList(sourceFile, containingList[index + 1]),
        });
    }
}
