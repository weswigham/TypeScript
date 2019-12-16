/*@internal*/
namespace ts {
    const enum ES2015SubstitutionFlags {
        /** Enables substitutions for captured `this` */
        CapturedThis = 1 << 0,
        /** Enables substitutions for block-scoped bindings. */
        BlockScopedBindings = 1 << 1
    }
    /**
     * If loop contains block scoped binding captured in some function then loop body is converted to a function.
     * Lexical bindings declared in loop initializer will be passed into the loop body function as parameters,
     * however if this binding is modified inside the body - this new value should be propagated back to the original binding.
     * This is done by declaring new variable (out parameter holder) outside of the loop for every binding that is reassigned inside the body.
     * On every iteration this variable is initialized with value of corresponding binding.
     * At every point where control flow leaves the loop either explicitly (break/continue) or implicitly (at the end of loop body)
     * we copy the value inside the loop to the out parameter holder.
     *
     * for (let x;;) {
     *     let a = 1;
     *     let b = () => a;
     *     x++
     *     if (...) break;
     *     ...
     * }
     *
     * will be converted to
     *
     * var out_x;
     * var loop = function(x) {
     *     var a = 1;
     *     var b = function() { return a; }
     *     x++;
     *     if (...) return out_x = x, "break";
     *     ...
     *     out_x = x;
     * }
     * for (var x;;) {
     *     out_x = x;
     *     var state = loop(x);
     *     x = out_x;
     *     if (state === "break") break;
     * }
     *
     * NOTE: values to out parameters are not copies if loop is abrupted with 'return' - in this case this will end the entire enclosing function
     * so nobody can observe this new value.
     */
    interface LoopOutParameter {
        flags: LoopOutParameterFlags;
        originalName: ts.Identifier;
        outParamName: ts.Identifier;
    }
    const enum LoopOutParameterFlags {
        Body = 1 << 0,
        Initializer = 1 << 1
    }
    const enum CopyDirection {
        ToOriginal,
        ToOutParameter
    }
    const enum Jump {
        Break = 1 << 1,
        Continue = 1 << 2,
        Return = 1 << 3
    }
    interface ConvertedLoopState {
        /*
         * set of labels that occurred inside the converted loop
         * used to determine if labeled jump can be emitted as is or it should be dispatched to calling code
         */
        labels?: ts.Map<boolean>;
        /*
         * collection of labeled jumps that transfer control outside the converted loop.
         * maps store association 'label -> labelMarker' where
         * - label - value of label as it appear in code
         * - label marker - return value that should be interpreted by calling code as 'jump to <label>'
         */
        labeledNonLocalBreaks?: ts.Map<string>;
        labeledNonLocalContinues?: ts.Map<string>;
        /*
         * set of non-labeled jumps that transfer control outside the converted loop
         * used to emit dispatching logic in the caller of converted loop
         */
        nonLocalJumps?: Jump;
        /*
         * set of non-labeled jumps that should be interpreted as local
         * i.e. if converted loop contains normal loop or switch statement then inside this loop break should be treated as local jump
         */
        allowedNonLabeledJumps?: Jump;
        /*
         * alias for 'arguments' object from the calling code stack frame
         * i.e.
         * for (let x;;) <statement that captures x in closure and uses 'arguments'>
         * should be converted to
         * var loop = function(x) { <code where 'arguments' is replaced with 'arguments_1'> }
         * var arguments_1 = arguments
         * for (var x;;) loop(x);
         * otherwise semantics of the code will be different since 'arguments' inside converted loop body
         * will refer to function that holds converted loop.
         * This value is set on demand.
         */
        argumentsName?: ts.Identifier;
        /*
         * alias for 'this' from the calling code stack frame in case if this was used inside the converted loop
         */
        thisName?: ts.Identifier;
        /*
         * set to true if node contains lexical 'this' so we can mark function that wraps convered loop body as 'CapturedThis' for subsequent substitution.
         */
        containsLexicalThis?: boolean;
        /*
         * list of non-block scoped variable declarations that appear inside converted loop
         * such variable declarations should be moved outside the loop body
         * for (let x;;) {
         *     var y = 1;
         *     ...
         * }
         * should be converted to
         * var loop = function(x) {
         *    y = 1;
         *    ...
         * }
         * var y;
         * for (var x;;) loop(x);
         */
        hoistedLocalVariables?: ts.Identifier[];
        conditionVariable?: ts.Identifier;
        loopParameters: ts.ParameterDeclaration[];
        /**
         * List of loop out parameters - detailed descripion can be found in the comment to LoopOutParameter
         */
        loopOutParameters: LoopOutParameter[];
    }
    type LoopConverter = (node: ts.IterationStatement, outermostLabeledStatement: ts.LabeledStatement | undefined, convertedLoopBodyStatements: ts.Statement[] | undefined, ancestorFacts: HierarchyFacts) => ts.Statement;
    // Facts we track as we traverse the tree
    const enum HierarchyFacts {
        None = 0,
        //
        // Ancestor facts
        //
        Function = 1 << 0,
        ArrowFunction = 1 << 1,
        AsyncFunctionBody = 1 << 2,
        NonStaticClassElement = 1 << 3,
        CapturesThis = 1 << 4,
        ExportedVariableStatement = 1 << 5,
        TopLevel = 1 << 6,
        Block = 1 << 7,
        IterationStatement = 1 << 8,
        IterationStatementBlock = 1 << 9,
        IterationContainer = 1 << 10,
        ForStatement = 1 << 11,
        ForInOrForOfStatement = 1 << 12,
        ConstructorWithCapturedSuper = 1 << 13,
        // NOTE: do not add more ancestor flags without also updating AncestorFactsMask below.
        // NOTE: when adding a new ancestor flag, be sure to update the subtree flags below.
        //
        // Ancestor masks
        //
        AncestorFactsMask = (ConstructorWithCapturedSuper << 1) - 1,
        // We are always in *some* kind of block scope, but only specific block-scope containers are
        // top-level or Blocks.
        BlockScopeIncludes = None,
        BlockScopeExcludes = TopLevel | Block | IterationStatement | IterationStatementBlock | ForStatement | ForInOrForOfStatement,
        // A source file is a top-level block scope.
        SourceFileIncludes = TopLevel,
        SourceFileExcludes = BlockScopeExcludes & ~TopLevel | IterationContainer,
        // Functions, methods, and accessors are both new lexical scopes and new block scopes.
        FunctionIncludes = Function | TopLevel,
        FunctionExcludes = BlockScopeExcludes & ~TopLevel | ArrowFunction | AsyncFunctionBody | CapturesThis | NonStaticClassElement | ConstructorWithCapturedSuper | IterationContainer,
        AsyncFunctionBodyIncludes = FunctionIncludes | AsyncFunctionBody,
        AsyncFunctionBodyExcludes = FunctionExcludes & ~NonStaticClassElement,
        // Arrow functions are lexically scoped to their container, but are new block scopes.
        ArrowFunctionIncludes = ArrowFunction | TopLevel,
        ArrowFunctionExcludes = BlockScopeExcludes & ~TopLevel | ConstructorWithCapturedSuper,
        // Constructors are both new lexical scopes and new block scopes. Constructors are also
        // always considered non-static members of a class.
        ConstructorIncludes = FunctionIncludes | NonStaticClassElement,
        ConstructorExcludes = FunctionExcludes & ~NonStaticClassElement,
        // 'do' and 'while' statements are not block scopes. We track that the subtree is contained
        // within an IterationStatement to indicate whether the embedded statement is an
        // IterationStatementBlock.
        DoOrWhileStatementIncludes = IterationStatement | IterationContainer,
        DoOrWhileStatementExcludes = None,
        // 'for' statements are new block scopes and have special handling for 'let' declarations.
        ForStatementIncludes = IterationStatement | ForStatement | IterationContainer,
        ForStatementExcludes = BlockScopeExcludes & ~ForStatement,
        // 'for-in' and 'for-of' statements are new block scopes and have special handling for
        // 'let' declarations.
        ForInOrForOfStatementIncludes = IterationStatement | ForInOrForOfStatement | IterationContainer,
        ForInOrForOfStatementExcludes = BlockScopeExcludes & ~ForInOrForOfStatement,
        // Blocks (other than function bodies) are new block scopes.
        BlockIncludes = Block,
        BlockExcludes = BlockScopeExcludes & ~Block,
        IterationStatementBlockIncludes = IterationStatementBlock,
        IterationStatementBlockExcludes = BlockScopeExcludes,
        //
        // Subtree facts
        //
        NewTarget = 1 << 14,
        CapturedLexicalThis = 1 << 15,
        //
        // Subtree masks
        //
        SubtreeFactsMask = ~AncestorFactsMask,
        ArrowFunctionSubtreeExcludes = None,
        FunctionSubtreeExcludes = NewTarget | CapturedLexicalThis
    }
    export function transformES2015(context: ts.TransformationContext) {
        const { startLexicalEnvironment, resumeLexicalEnvironment, endLexicalEnvironment, hoistVariableDeclaration, } = context;
        const compilerOptions = context.getCompilerOptions();
        const resolver = context.getEmitResolver();
        const previousOnSubstituteNode = context.onSubstituteNode;
        const previousOnEmitNode = context.onEmitNode;
        context.onEmitNode = onEmitNode;
        context.onSubstituteNode = onSubstituteNode;
        let currentSourceFile: ts.SourceFile;
        let currentText: string;
        let hierarchyFacts: HierarchyFacts;
        let taggedTemplateStringDeclarations: ts.VariableDeclaration[];
        function recordTaggedTemplateString(temp: ts.Identifier) {
            taggedTemplateStringDeclarations = ts.append(taggedTemplateStringDeclarations, ts.createVariableDeclaration(temp));
        }
        /**
         * Used to track if we are emitting body of the converted loop
         */
        let convertedLoopState: ConvertedLoopState | undefined;
        /**
         * Keeps track of whether substitutions have been enabled for specific cases.
         * They are persisted between each SourceFile transformation and should not
         * be reset.
         */
        let enabledSubstitutions: ES2015SubstitutionFlags;
        return ts.chainBundle(transformSourceFile);
        function transformSourceFile(node: ts.SourceFile) {
            if (node.isDeclarationFile) {
                return node;
            }
            currentSourceFile = node;
            currentText = node.text;
            const visited = visitSourceFile(node);
            ts.addEmitHelpers(visited, context.readEmitHelpers());
            currentSourceFile = undefined!;
            currentText = undefined!;
            taggedTemplateStringDeclarations = undefined!;
            hierarchyFacts = HierarchyFacts.None;
            return visited;
        }
        /**
         * Sets the `HierarchyFacts` for this node prior to visiting this node's subtree, returning the facts set prior to modification.
         * @param excludeFacts The existing `HierarchyFacts` to reset before visiting the subtree.
         * @param includeFacts The new `HierarchyFacts` to set before visiting the subtree.
         */
        function enterSubtree(excludeFacts: HierarchyFacts, includeFacts: HierarchyFacts) {
            const ancestorFacts = hierarchyFacts;
            hierarchyFacts = (hierarchyFacts & ~excludeFacts | includeFacts) & HierarchyFacts.AncestorFactsMask;
            return ancestorFacts;
        }
        /**
         * Restores the `HierarchyFacts` for this node's ancestor after visiting this node's
         * subtree, propagating specific facts from the subtree.
         * @param ancestorFacts The `HierarchyFacts` of the ancestor to restore after visiting the subtree.
         * @param excludeFacts The existing `HierarchyFacts` of the subtree that should not be propagated.
         * @param includeFacts The new `HierarchyFacts` of the subtree that should be propagated.
         */
        function exitSubtree(ancestorFacts: HierarchyFacts, excludeFacts: HierarchyFacts, includeFacts: HierarchyFacts) {
            hierarchyFacts = (hierarchyFacts & ~excludeFacts | includeFacts) & HierarchyFacts.SubtreeFactsMask | ancestorFacts;
        }
        function isReturnVoidStatementInConstructorWithCapturedSuper(node: ts.Node): boolean {
            return (hierarchyFacts & HierarchyFacts.ConstructorWithCapturedSuper) !== 0
                && node.kind === ts.SyntaxKind.ReturnStatement
                && !(<ts.ReturnStatement>node).expression;
        }
        function shouldVisitNode(node: ts.Node): boolean {
            return (node.transformFlags & ts.TransformFlags.ContainsES2015) !== 0
                || convertedLoopState !== undefined
                || (hierarchyFacts & HierarchyFacts.ConstructorWithCapturedSuper && (ts.isStatement(node) || (node.kind === ts.SyntaxKind.Block)))
                || (ts.isIterationStatement(node, /*lookInLabeledStatements*/ false) && shouldConvertIterationStatement(node))
                || (ts.getEmitFlags(node) & ts.EmitFlags.TypeScriptClassWrapper) !== 0;
        }
        function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
            if (shouldVisitNode(node)) {
                return visitJavaScript(node);
            }
            else {
                return node;
            }
        }
        function callExpressionVisitor(node: ts.Node): ts.VisitResult<ts.Node> {
            if (node.kind === ts.SyntaxKind.SuperKeyword) {
                return visitSuperKeyword(/*isExpressionOfCall*/ true);
            }
            return visitor(node);
        }
        function visitJavaScript(node: ts.Node): ts.VisitResult<ts.Node> {
            switch (node.kind) {
                case ts.SyntaxKind.StaticKeyword:
                    return undefined; // elide static keyword
                case ts.SyntaxKind.ClassDeclaration:
                    return visitClassDeclaration((<ts.ClassDeclaration>node));
                case ts.SyntaxKind.ClassExpression:
                    return visitClassExpression((<ts.ClassExpression>node));
                case ts.SyntaxKind.Parameter:
                    return visitParameter((<ts.ParameterDeclaration>node));
                case ts.SyntaxKind.FunctionDeclaration:
                    return visitFunctionDeclaration((<ts.FunctionDeclaration>node));
                case ts.SyntaxKind.ArrowFunction:
                    return visitArrowFunction((<ts.ArrowFunction>node));
                case ts.SyntaxKind.FunctionExpression:
                    return visitFunctionExpression((<ts.FunctionExpression>node));
                case ts.SyntaxKind.VariableDeclaration:
                    return visitVariableDeclaration((<ts.VariableDeclaration>node));
                case ts.SyntaxKind.Identifier:
                    return visitIdentifier((<ts.Identifier>node));
                case ts.SyntaxKind.VariableDeclarationList:
                    return visitVariableDeclarationList((<ts.VariableDeclarationList>node));
                case ts.SyntaxKind.SwitchStatement:
                    return visitSwitchStatement((<ts.SwitchStatement>node));
                case ts.SyntaxKind.CaseBlock:
                    return visitCaseBlock((<ts.CaseBlock>node));
                case ts.SyntaxKind.Block:
                    return visitBlock((<ts.Block>node), /*isFunctionBody*/ false);
                case ts.SyntaxKind.BreakStatement:
                case ts.SyntaxKind.ContinueStatement:
                    return visitBreakOrContinueStatement((<ts.BreakOrContinueStatement>node));
                case ts.SyntaxKind.LabeledStatement:
                    return visitLabeledStatement((<ts.LabeledStatement>node));
                case ts.SyntaxKind.DoStatement:
                case ts.SyntaxKind.WhileStatement:
                    return visitDoOrWhileStatement((<ts.DoStatement | ts.WhileStatement>node), /*outermostLabeledStatement*/ undefined);
                case ts.SyntaxKind.ForStatement:
                    return visitForStatement((<ts.ForStatement>node), /*outermostLabeledStatement*/ undefined);
                case ts.SyntaxKind.ForInStatement:
                    return visitForInStatement((<ts.ForInStatement>node), /*outermostLabeledStatement*/ undefined);
                case ts.SyntaxKind.ForOfStatement:
                    return visitForOfStatement((<ts.ForOfStatement>node), /*outermostLabeledStatement*/ undefined);
                case ts.SyntaxKind.ExpressionStatement:
                    return visitExpressionStatement((<ts.ExpressionStatement>node));
                case ts.SyntaxKind.ObjectLiteralExpression:
                    return visitObjectLiteralExpression((<ts.ObjectLiteralExpression>node));
                case ts.SyntaxKind.CatchClause:
                    return visitCatchClause((<ts.CatchClause>node));
                case ts.SyntaxKind.ShorthandPropertyAssignment:
                    return visitShorthandPropertyAssignment((<ts.ShorthandPropertyAssignment>node));
                case ts.SyntaxKind.ComputedPropertyName:
                    return visitComputedPropertyName((<ts.ComputedPropertyName>node));
                case ts.SyntaxKind.ArrayLiteralExpression:
                    return visitArrayLiteralExpression((<ts.ArrayLiteralExpression>node));
                case ts.SyntaxKind.CallExpression:
                    return visitCallExpression((<ts.CallExpression>node));
                case ts.SyntaxKind.NewExpression:
                    return visitNewExpression((<ts.NewExpression>node));
                case ts.SyntaxKind.ParenthesizedExpression:
                    return visitParenthesizedExpression((<ts.ParenthesizedExpression>node), /*needsDestructuringValue*/ true);
                case ts.SyntaxKind.BinaryExpression:
                    return visitBinaryExpression((<ts.BinaryExpression>node), /*needsDestructuringValue*/ true);
                case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
                case ts.SyntaxKind.TemplateHead:
                case ts.SyntaxKind.TemplateMiddle:
                case ts.SyntaxKind.TemplateTail:
                    return visitTemplateLiteral((<ts.LiteralExpression>node));
                case ts.SyntaxKind.StringLiteral:
                    return visitStringLiteral((<ts.StringLiteral>node));
                case ts.SyntaxKind.NumericLiteral:
                    return visitNumericLiteral((<ts.NumericLiteral>node));
                case ts.SyntaxKind.TaggedTemplateExpression:
                    return visitTaggedTemplateExpression((<ts.TaggedTemplateExpression>node));
                case ts.SyntaxKind.TemplateExpression:
                    return visitTemplateExpression((<ts.TemplateExpression>node));
                case ts.SyntaxKind.YieldExpression:
                    return visitYieldExpression((<ts.YieldExpression>node));
                case ts.SyntaxKind.SpreadElement:
                    return visitSpreadElement((<ts.SpreadElement>node));
                case ts.SyntaxKind.SuperKeyword:
                    return visitSuperKeyword(/*isExpressionOfCall*/ false);
                case ts.SyntaxKind.ThisKeyword:
                    return visitThisKeyword(node);
                case ts.SyntaxKind.MetaProperty:
                    return visitMetaProperty((<ts.MetaProperty>node));
                case ts.SyntaxKind.MethodDeclaration:
                    return visitMethodDeclaration((<ts.MethodDeclaration>node));
                case ts.SyntaxKind.GetAccessor:
                case ts.SyntaxKind.SetAccessor:
                    return visitAccessorDeclaration((<ts.AccessorDeclaration>node));
                case ts.SyntaxKind.VariableStatement:
                    return visitVariableStatement((<ts.VariableStatement>node));
                case ts.SyntaxKind.ReturnStatement:
                    return visitReturnStatement((<ts.ReturnStatement>node));
                default:
                    return ts.visitEachChild(node, visitor, context);
            }
        }
        function visitSourceFile(node: ts.SourceFile): ts.SourceFile {
            const ancestorFacts = enterSubtree(HierarchyFacts.SourceFileExcludes, HierarchyFacts.SourceFileIncludes);
            const prologue: ts.Statement[] = [];
            const statements: ts.Statement[] = [];
            startLexicalEnvironment();
            let statementOffset = ts.addStandardPrologue(prologue, node.statements, /*ensureUseStrict*/ false);
            statementOffset = ts.addCustomPrologue(prologue, node.statements, statementOffset, visitor);
            ts.addRange(statements, ts.visitNodes(node.statements, visitor, ts.isStatement, statementOffset));
            if (taggedTemplateStringDeclarations) {
                statements.push(ts.createVariableStatement(/*modifiers*/ undefined, ts.createVariableDeclarationList(taggedTemplateStringDeclarations)));
            }
            ts.mergeLexicalEnvironment(prologue, endLexicalEnvironment());
            insertCaptureThisForNodeIfNeeded(prologue, node);
            exitSubtree(ancestorFacts, HierarchyFacts.None, HierarchyFacts.None);
            return ts.updateSourceFileNode(node, ts.setTextRange(ts.createNodeArray(ts.concatenate(prologue, statements)), node.statements));
        }
        function visitSwitchStatement(node: ts.SwitchStatement): ts.SwitchStatement {
            if (convertedLoopState !== undefined) {
                const savedAllowedNonLabeledJumps = convertedLoopState.allowedNonLabeledJumps;
                // for switch statement allow only non-labeled break
                convertedLoopState.allowedNonLabeledJumps! |= Jump.Break;
                const result = ts.visitEachChild(node, visitor, context);
                convertedLoopState.allowedNonLabeledJumps = savedAllowedNonLabeledJumps;
                return result;
            }
            return ts.visitEachChild(node, visitor, context);
        }
        function visitCaseBlock(node: ts.CaseBlock): ts.CaseBlock {
            const ancestorFacts = enterSubtree(HierarchyFacts.BlockScopeExcludes, HierarchyFacts.BlockScopeIncludes);
            const updated = ts.visitEachChild(node, visitor, context);
            exitSubtree(ancestorFacts, HierarchyFacts.None, HierarchyFacts.None);
            return updated;
        }
        function returnCapturedThis(node: ts.Node): ts.ReturnStatement {
            return ts.setOriginalNode(ts.createReturn(ts.createFileLevelUniqueName("_this")), node);
        }
        function visitReturnStatement(node: ts.ReturnStatement): ts.Statement {
            if (convertedLoopState) {
                convertedLoopState.nonLocalJumps! |= Jump.Return;
                if (isReturnVoidStatementInConstructorWithCapturedSuper(node)) {
                    node = returnCapturedThis(node);
                }
                return ts.createReturn(ts.createObjectLiteral([
                    ts.createPropertyAssignment(ts.createIdentifier("value"), node.expression
                        ? ts.visitNode(node.expression, visitor, ts.isExpression)
                        : ts.createVoidZero())
                ]));
            }
            else if (isReturnVoidStatementInConstructorWithCapturedSuper(node)) {
                return returnCapturedThis(node);
            }
            return ts.visitEachChild(node, visitor, context);
        }
        function visitThisKeyword(node: ts.Node): ts.Node {
            if (hierarchyFacts & HierarchyFacts.ArrowFunction) {
                hierarchyFacts |= HierarchyFacts.CapturedLexicalThis;
            }
            if (convertedLoopState) {
                if (hierarchyFacts & HierarchyFacts.ArrowFunction) {
                    // if the enclosing function is an ArrowFunction then we use the captured 'this' keyword.
                    convertedLoopState.containsLexicalThis = true;
                    return node;
                }
                return convertedLoopState.thisName || (convertedLoopState.thisName = ts.createUniqueName("this"));
            }
            return node;
        }
        function visitIdentifier(node: ts.Identifier): ts.Identifier {
            if (!convertedLoopState) {
                return node;
            }
            if (ts.isGeneratedIdentifier(node)) {
                return node;
            }
            if (node.escapedText !== "arguments" || !resolver.isArgumentsLocalBinding(node)) {
                return node;
            }
            return convertedLoopState.argumentsName || (convertedLoopState.argumentsName = ts.createUniqueName("arguments"));
        }
        function visitBreakOrContinueStatement(node: ts.BreakOrContinueStatement): ts.Statement {
            if (convertedLoopState) {
                // check if we can emit break/continue as is
                // it is possible if either
                //   - break/continue is labeled and label is located inside the converted loop
                //   - break/continue is non-labeled and located in non-converted loop/switch statement
                const jump = node.kind === ts.SyntaxKind.BreakStatement ? Jump.Break : Jump.Continue;
                const canUseBreakOrContinue = (node.label && convertedLoopState.labels && convertedLoopState.labels.get(ts.idText(node.label))) ||
                    (!node.label && (convertedLoopState.allowedNonLabeledJumps! & jump));
                if (!canUseBreakOrContinue) {
                    let labelMarker: string;
                    const label = node.label;
                    if (!label) {
                        if (node.kind === ts.SyntaxKind.BreakStatement) {
                            convertedLoopState.nonLocalJumps! |= Jump.Break;
                            labelMarker = "break";
                        }
                        else {
                            convertedLoopState.nonLocalJumps! |= Jump.Continue;
                            // note: return value is emitted only to simplify debugging, call to converted loop body does not do any dispatching on it.
                            labelMarker = "continue";
                        }
                    }
                    else {
                        if (node.kind === ts.SyntaxKind.BreakStatement) {
                            labelMarker = `break-${label.escapedText}`;
                            setLabeledJump(convertedLoopState, /*isBreak*/ true, ts.idText(label), labelMarker);
                        }
                        else {
                            labelMarker = `continue-${label.escapedText}`;
                            setLabeledJump(convertedLoopState, /*isBreak*/ false, ts.idText(label), labelMarker);
                        }
                    }
                    let returnExpression: ts.Expression = ts.createLiteral(labelMarker);
                    if (convertedLoopState.loopOutParameters.length) {
                        const outParams = convertedLoopState.loopOutParameters;
                        let expr: ts.Expression | undefined;
                        for (let i = 0; i < outParams.length; i++) {
                            const copyExpr = copyOutParameter(outParams[i], CopyDirection.ToOutParameter);
                            if (i === 0) {
                                expr = copyExpr;
                            }
                            else {
                                expr = ts.createBinary((expr!), ts.SyntaxKind.CommaToken, copyExpr);
                            }
                        }
                        returnExpression = ts.createBinary((expr!), ts.SyntaxKind.CommaToken, returnExpression);
                    }
                    return ts.createReturn(returnExpression);
                }
            }
            return ts.visitEachChild(node, visitor, context);
        }
        /**
         * Visits a ClassDeclaration and transforms it into a variable statement.
         *
         * @param node A ClassDeclaration node.
         */
        function visitClassDeclaration(node: ts.ClassDeclaration): ts.VisitResult<ts.Statement> {
            // [source]
            //      class C { }
            //
            // [output]
            //      var C = (function () {
            //          function C() {
            //          }
            //          return C;
            //      }());
            const variable = ts.createVariableDeclaration(ts.getLocalName(node, /*allowComments*/ true), 
            /*type*/ undefined, transformClassLikeDeclarationToExpression(node));
            ts.setOriginalNode(variable, node);
            const statements: ts.Statement[] = [];
            const statement = ts.createVariableStatement(/*modifiers*/ undefined, ts.createVariableDeclarationList([variable]));
            ts.setOriginalNode(statement, node);
            ts.setTextRange(statement, node);
            ts.startOnNewLine(statement);
            statements.push(statement);
            // Add an `export default` statement for default exports (for `--target es5 --module es6`)
            if (ts.hasModifier(node, ts.ModifierFlags.Export)) {
                const exportStatement = ts.hasModifier(node, ts.ModifierFlags.Default)
                    ? ts.createExportDefault(ts.getLocalName(node))
                    : ts.createExternalModuleExport(ts.getLocalName(node));
                ts.setOriginalNode(exportStatement, statement);
                statements.push(exportStatement);
            }
            const emitFlags = ts.getEmitFlags(node);
            if ((emitFlags & ts.EmitFlags.HasEndOfDeclarationMarker) === 0) {
                // Add a DeclarationMarker as a marker for the end of the declaration
                statements.push(ts.createEndOfDeclarationMarker(node));
                ts.setEmitFlags(statement, emitFlags | ts.EmitFlags.HasEndOfDeclarationMarker);
            }
            return ts.singleOrMany(statements);
        }
        /**
         * Visits a ClassExpression and transforms it into an expression.
         *
         * @param node A ClassExpression node.
         */
        function visitClassExpression(node: ts.ClassExpression): ts.Expression {
            // [source]
            //      C = class { }
            //
            // [output]
            //      C = (function () {
            //          function class_1() {
            //          }
            //          return class_1;
            //      }())
            return transformClassLikeDeclarationToExpression(node);
        }
        /**
         * Transforms a ClassExpression or ClassDeclaration into an expression.
         *
         * @param node A ClassExpression or ClassDeclaration node.
         */
        function transformClassLikeDeclarationToExpression(node: ts.ClassExpression | ts.ClassDeclaration): ts.Expression {
            // [source]
            //      class C extends D {
            //          constructor() {}
            //          method() {}
            //          get prop() {}
            //          set prop(v) {}
            //      }
            //
            // [output]
            //      (function (_super) {
            //          __extends(C, _super);
            //          function C() {
            //          }
            //          C.prototype.method = function () {}
            //          Object.defineProperty(C.prototype, "prop", {
            //              get: function() {},
            //              set: function() {},
            //              enumerable: true,
            //              configurable: true
            //          });
            //          return C;
            //      }(D))
            if (node.name) {
                enableSubstitutionsForBlockScopedBindings();
            }
            const extendsClauseElement = ts.getClassExtendsHeritageElement(node);
            const classFunction = ts.createFunctionExpression(
            /*modifiers*/ undefined, 
            /*asteriskToken*/ undefined, 
            /*name*/ undefined, 
            /*typeParameters*/ undefined, extendsClauseElement ? [ts.createParameter(/*decorators*/ undefined, /*modifiers*/ undefined, /*dotDotDotToken*/ undefined, ts.createFileLevelUniqueName("_super"))] : [], 
            /*type*/ undefined, transformClassBody(node, extendsClauseElement));
            // To preserve the behavior of the old emitter, we explicitly indent
            // the body of the function here if it was requested in an earlier
            // transformation.
            ts.setEmitFlags(classFunction, (ts.getEmitFlags(node) & ts.EmitFlags.Indented) | ts.EmitFlags.ReuseTempVariableScope);
            // "inner" and "outer" below are added purely to preserve source map locations from
            // the old emitter
            const inner = ts.createPartiallyEmittedExpression(classFunction);
            inner.end = node.end;
            ts.setEmitFlags(inner, ts.EmitFlags.NoComments);
            const outer = ts.createPartiallyEmittedExpression(inner);
            outer.end = ts.skipTrivia(currentText, node.pos);
            ts.setEmitFlags(outer, ts.EmitFlags.NoComments);
            const result = ts.createParen(ts.createCall(outer, 
            /*typeArguments*/ undefined, extendsClauseElement
                ? [ts.visitNode(extendsClauseElement.expression, visitor, ts.isExpression)]
                : []));
            ts.addSyntheticLeadingComment(result, ts.SyntaxKind.MultiLineCommentTrivia, "* @class ");
            return result;
        }
        /**
         * Transforms a ClassExpression or ClassDeclaration into a function body.
         *
         * @param node A ClassExpression or ClassDeclaration node.
         * @param extendsClauseElement The expression for the class `extends` clause.
         */
        function transformClassBody(node: ts.ClassExpression | ts.ClassDeclaration, extendsClauseElement: ts.ExpressionWithTypeArguments | undefined): ts.Block {
            const statements: ts.Statement[] = [];
            startLexicalEnvironment();
            addExtendsHelperIfNeeded(statements, node, extendsClauseElement);
            addConstructor(statements, node, extendsClauseElement);
            addClassMembers(statements, node);
            // Create a synthetic text range for the return statement.
            const closingBraceLocation = ts.createTokenRange(ts.skipTrivia(currentText, node.members.end), ts.SyntaxKind.CloseBraceToken);
            const localName = ts.getInternalName(node);
            // The following partially-emitted expression exists purely to align our sourcemap
            // emit with the original emitter.
            const outer = ts.createPartiallyEmittedExpression(localName);
            outer.end = closingBraceLocation.end;
            ts.setEmitFlags(outer, ts.EmitFlags.NoComments);
            const statement = ts.createReturn(outer);
            statement.pos = closingBraceLocation.pos;
            ts.setEmitFlags(statement, ts.EmitFlags.NoComments | ts.EmitFlags.NoTokenSourceMaps);
            statements.push(statement);
            ts.insertStatementsAfterStandardPrologue(statements, endLexicalEnvironment());
            const block = ts.createBlock(ts.setTextRange(ts.createNodeArray(statements), /*location*/ node.members), /*multiLine*/ true);
            ts.setEmitFlags(block, ts.EmitFlags.NoComments);
            return block;
        }
        /**
         * Adds a call to the `__extends` helper if needed for a class.
         *
         * @param statements The statements of the class body function.
         * @param node The ClassExpression or ClassDeclaration node.
         * @param extendsClauseElement The expression for the class `extends` clause.
         */
        function addExtendsHelperIfNeeded(statements: ts.Statement[], node: ts.ClassExpression | ts.ClassDeclaration, extendsClauseElement: ts.ExpressionWithTypeArguments | undefined): void {
            if (extendsClauseElement) {
                statements.push(ts.setTextRange(ts.createExpressionStatement(createExtendsHelper(context, ts.getInternalName(node))), 
                /*location*/ extendsClauseElement));
            }
        }
        /**
         * Adds the constructor of the class to a class body function.
         *
         * @param statements The statements of the class body function.
         * @param node The ClassExpression or ClassDeclaration node.
         * @param extendsClauseElement The expression for the class `extends` clause.
         */
        function addConstructor(statements: ts.Statement[], node: ts.ClassExpression | ts.ClassDeclaration, extendsClauseElement: ts.ExpressionWithTypeArguments | undefined): void {
            const savedConvertedLoopState = convertedLoopState;
            convertedLoopState = undefined;
            const ancestorFacts = enterSubtree(HierarchyFacts.ConstructorExcludes, HierarchyFacts.ConstructorIncludes);
            const constructor = ts.getFirstConstructorWithBody(node);
            const hasSynthesizedSuper = hasSynthesizedDefaultSuperCall(constructor, extendsClauseElement !== undefined);
            const constructorFunction = ts.createFunctionDeclaration(
            /*decorators*/ undefined, 
            /*modifiers*/ undefined, 
            /*asteriskToken*/ undefined, ts.getInternalName(node), 
            /*typeParameters*/ undefined, transformConstructorParameters(constructor, hasSynthesizedSuper), 
            /*type*/ undefined, transformConstructorBody(constructor, node, extendsClauseElement, hasSynthesizedSuper));
            ts.setTextRange(constructorFunction, constructor || node);
            if (extendsClauseElement) {
                ts.setEmitFlags(constructorFunction, ts.EmitFlags.CapturesThis);
            }
            statements.push(constructorFunction);
            exitSubtree(ancestorFacts, HierarchyFacts.FunctionSubtreeExcludes, HierarchyFacts.None);
            convertedLoopState = savedConvertedLoopState;
        }
        /**
         * Transforms the parameters of the constructor declaration of a class.
         *
         * @param constructor The constructor for the class.
         * @param hasSynthesizedSuper A value indicating whether the constructor starts with a
         *                            synthesized `super` call.
         */
        function transformConstructorParameters(constructor: ts.ConstructorDeclaration | undefined, hasSynthesizedSuper: boolean) {
            // If the TypeScript transformer needed to synthesize a constructor for property
            // initializers, it would have also added a synthetic `...args` parameter and
            // `super` call.
            // If this is the case, we do not include the synthetic `...args` parameter and
            // will instead use the `arguments` object in ES5/3.
            return ts.visitParameterList(constructor && !hasSynthesizedSuper ? constructor.parameters : undefined, visitor, context)
                || (<ts.ParameterDeclaration[]>[]);
        }
        function createDefaultConstructorBody(node: ts.ClassDeclaration | ts.ClassExpression, isDerivedClass: boolean) {
            // We must be here because the user didn't write a constructor
            // but we needed to call 'super(...args)' anyway as per 14.5.14 of the ES2016 spec.
            // If that's the case we can just immediately return the result of a 'super()' call.
            const statements: ts.Statement[] = [];
            resumeLexicalEnvironment();
            ts.mergeLexicalEnvironment(statements, endLexicalEnvironment());
            if (isDerivedClass) {
                // return _super !== null && _super.apply(this, arguments) || this;
                statements.push(ts.createReturn(createDefaultSuperCallOrThis()));
            }
            const statementsArray = ts.createNodeArray(statements);
            ts.setTextRange(statementsArray, node.members);
            const block = ts.createBlock(statementsArray, /*multiLine*/ true);
            ts.setTextRange(block, node);
            ts.setEmitFlags(block, ts.EmitFlags.NoComments);
            return block;
        }
        /**
         * Transforms the body of a constructor declaration of a class.
         *
         * @param constructor The constructor for the class.
         * @param node The node which contains the constructor.
         * @param extendsClauseElement The expression for the class `extends` clause.
         * @param hasSynthesizedSuper A value indicating whether the constructor starts with a
         *                            synthesized `super` call.
         */
        function transformConstructorBody(constructor: (ts.ConstructorDeclaration & {
            body: ts.FunctionBody;
        }) | undefined, node: ts.ClassDeclaration | ts.ClassExpression, extendsClauseElement: ts.ExpressionWithTypeArguments | undefined, hasSynthesizedSuper: boolean) {
            // determine whether the class is known syntactically to be a derived class (e.g. a
            // class that extends a value that is not syntactically known to be `null`).
            const isDerivedClass = !!extendsClauseElement && ts.skipOuterExpressions(extendsClauseElement.expression).kind !== ts.SyntaxKind.NullKeyword;
            // When the subclass does not have a constructor, we synthesize a *default* constructor using the following
            // representation:
            //
            // ```
            // // es2015 (source)
            // class C extends Base { }
            //
            // // es5 (transformed)
            // var C = (function (_super) {
            //     function C() {
            //         return _super.apply(this, arguments) || this;
            //     }
            //     return C;
            // })(Base);
            // ```
            if (!constructor)
                return createDefaultConstructorBody(node, isDerivedClass);
            // The prologue will contain all leading standard and custom prologue statements added by this transform
            const prologue: ts.Statement[] = [];
            const statements: ts.Statement[] = [];
            resumeLexicalEnvironment();
            // If a super call has already been synthesized,
            // we're going to assume that we should just transform everything after that.
            // The assumption is that no prior step in the pipeline has added any prologue directives.
            let statementOffset = 0;
            if (!hasSynthesizedSuper)
                statementOffset = ts.addStandardPrologue(prologue, constructor.body.statements, /*ensureUseStrict*/ false);
            addDefaultValueAssignmentsIfNeeded(statements, constructor);
            addRestParameterIfNeeded(statements, constructor, hasSynthesizedSuper);
            if (!hasSynthesizedSuper)
                statementOffset = ts.addCustomPrologue(statements, constructor.body.statements, statementOffset, visitor);
            // If the first statement is a call to `super()`, visit the statement directly
            let superCallExpression: ts.Expression | undefined;
            if (hasSynthesizedSuper) {
                superCallExpression = createDefaultSuperCallOrThis();
            }
            else if (isDerivedClass && statementOffset < constructor.body.statements.length) {
                const firstStatement = constructor.body.statements[statementOffset];
                if (ts.isExpressionStatement(firstStatement) && ts.isSuperCall(firstStatement.expression)) {
                    superCallExpression = visitImmediateSuperCallInBody(firstStatement.expression);
                }
            }
            if (superCallExpression) {
                hierarchyFacts |= HierarchyFacts.ConstructorWithCapturedSuper;
                statementOffset++; // skip this statement, we will add it after visiting the rest of the body.
            }
            // visit the remaining statements
            ts.addRange(statements, ts.visitNodes(constructor.body.statements, visitor, ts.isStatement, /*start*/ statementOffset));
            ts.mergeLexicalEnvironment(prologue, endLexicalEnvironment());
            insertCaptureNewTargetIfNeeded(prologue, constructor, /*copyOnWrite*/ false);
            if (isDerivedClass) {
                if (superCallExpression && statementOffset === constructor.body.statements.length && !(constructor.body.transformFlags & ts.TransformFlags.ContainsLexicalThis)) {
                    // If the subclass constructor does *not* contain `this` and *ends* with a `super()` call, we will use the
                    // following representation:
                    //
                    // ```
                    // // es2015 (source)
                    // class C extends Base {
                    //     constructor() {
                    //         super("foo");
                    //     }
                    // }
                    //
                    // // es5 (transformed)
                    // var C = (function (_super) {
                    //     function C() {
                    //         return _super.call(this, "foo") || this;
                    //     }
                    //     return C;
                    // })(Base);
                    // ```
                    const superCall = ts.cast(ts.cast(superCallExpression, ts.isBinaryExpression).left, ts.isCallExpression);
                    const returnStatement = ts.createReturn(superCallExpression);
                    ts.setCommentRange(returnStatement, ts.getCommentRange(superCall));
                    ts.setEmitFlags(superCall, ts.EmitFlags.NoComments);
                    statements.push(returnStatement);
                }
                else {
                    // Otherwise, we will use the following transformed representation for calls to `super()` in a constructor:
                    //
                    // ```
                    // // es2015 (source)
                    // class C extends Base {
                    //     constructor() {
                    //         super("foo");
                    //         this.x = 1;
                    //     }
                    // }
                    //
                    // // es5 (transformed)
                    // var C = (function (_super) {
                    //     function C() {
                    //         var _this = _super.call(this, "foo") || this;
                    //         _this.x = 1;
                    //         return _this;
                    //     }
                    //     return C;
                    // })(Base);
                    // ```
                    // Since the `super()` call was the first statement, we insert the `this` capturing call to
                    // `super()` at the top of the list of `statements` (after any pre-existing custom prologues).
                    insertCaptureThisForNode(statements, constructor, superCallExpression || createActualThis());
                    if (!isSufficientlyCoveredByReturnStatements(constructor.body)) {
                        statements.push(ts.createReturn(ts.createFileLevelUniqueName("_this")));
                    }
                }
            }
            else {
                // If a class is not derived from a base class or does not have a call to `super()`, `this` is only
                // captured when necessitated by an arrow function capturing the lexical `this`:
                //
                // ```
                // // es2015
                // class C {}
                //
                // // es5
                // var C = (function () {
                //     function C() {
                //     }
                //     return C;
                // })();
                // ```
                insertCaptureThisForNodeIfNeeded(prologue, constructor);
            }
            const block = ts.createBlock(ts.setTextRange(ts.createNodeArray(ts.concatenate(prologue, statements)), 
            /*location*/ constructor.body.statements), 
            /*multiLine*/ true);
            ts.setTextRange(block, constructor.body);
            return block;
        }
        /**
         * We want to try to avoid emitting a return statement in certain cases if a user already returned something.
         * It would generate obviously dead code, so we'll try to make things a little bit prettier
         * by doing a minimal check on whether some common patterns always explicitly return.
         */
        function isSufficientlyCoveredByReturnStatements(statement: ts.Statement): boolean {
            // A return statement is considered covered.
            if (statement.kind === ts.SyntaxKind.ReturnStatement) {
                return true;
            }
            // An if-statement with two covered branches is covered.
            else if (statement.kind === ts.SyntaxKind.IfStatement) {
                const ifStatement = (statement as ts.IfStatement);
                if (ifStatement.elseStatement) {
                    return isSufficientlyCoveredByReturnStatements(ifStatement.thenStatement) &&
                        isSufficientlyCoveredByReturnStatements(ifStatement.elseStatement);
                }
            }
            // A block is covered if it has a last statement which is covered.
            else if (statement.kind === ts.SyntaxKind.Block) {
                const lastStatement = ts.lastOrUndefined((statement as ts.Block).statements);
                if (lastStatement && isSufficientlyCoveredByReturnStatements(lastStatement)) {
                    return true;
                }
            }
            return false;
        }
        function createActualThis() {
            return ts.setEmitFlags(ts.createThis(), ts.EmitFlags.NoSubstitution);
        }
        function createDefaultSuperCallOrThis() {
            return ts.createLogicalOr(ts.createLogicalAnd(ts.createStrictInequality(ts.createFileLevelUniqueName("_super"), ts.createNull()), ts.createFunctionApply(ts.createFileLevelUniqueName("_super"), createActualThis(), ts.createIdentifier("arguments"))), createActualThis());
        }
        /**
         * Visits a parameter declaration.
         *
         * @param node A ParameterDeclaration node.
         */
        function visitParameter(node: ts.ParameterDeclaration): ts.ParameterDeclaration | undefined {
            if (node.dotDotDotToken) {
                // rest parameters are elided
                return undefined;
            }
            else if (ts.isBindingPattern(node.name)) {
                // Binding patterns are converted into a generated name and are
                // evaluated inside the function body.
                return ts.setOriginalNode(ts.setTextRange(ts.createParameter(
                /*decorators*/ undefined, 
                /*modifiers*/ undefined, 
                /*dotDotDotToken*/ undefined, ts.getGeneratedNameForNode(node), 
                /*questionToken*/ undefined, 
                /*type*/ undefined, 
                /*initializer*/ undefined), 
                /*location*/ node), 
                /*original*/ node);
            }
            else if (node.initializer) {
                // Initializers are elided
                return ts.setOriginalNode(ts.setTextRange(ts.createParameter(
                /*decorators*/ undefined, 
                /*modifiers*/ undefined, 
                /*dotDotDotToken*/ undefined, node.name, 
                /*questionToken*/ undefined, 
                /*type*/ undefined, 
                /*initializer*/ undefined), 
                /*location*/ node), 
                /*original*/ node);
            }
            else {
                return node;
            }
        }
        function hasDefaultValueOrBindingPattern(node: ts.ParameterDeclaration) {
            return node.initializer !== undefined
                || ts.isBindingPattern(node.name);
        }
        /**
         * Adds statements to the body of a function-like node if it contains parameters with
         * binding patterns or initializers.
         *
         * @param statements The statements for the new function body.
         * @param node A function-like node.
         */
        function addDefaultValueAssignmentsIfNeeded(statements: ts.Statement[], node: ts.FunctionLikeDeclaration): boolean {
            if (!ts.some(node.parameters, hasDefaultValueOrBindingPattern)) {
                return false;
            }
            let added = false;
            for (const parameter of node.parameters) {
                const { name, initializer, dotDotDotToken } = parameter;
                // A rest parameter cannot have a binding pattern or an initializer,
                // so let's just ignore it.
                if (dotDotDotToken) {
                    continue;
                }
                if (ts.isBindingPattern(name)) {
                    added = insertDefaultValueAssignmentForBindingPattern(statements, parameter, name, initializer) || added;
                }
                else if (initializer) {
                    insertDefaultValueAssignmentForInitializer(statements, parameter, name, initializer);
                    added = true;
                }
            }
            return added;
        }
        /**
         * Adds statements to the body of a function-like node for parameters with binding patterns
         *
         * @param statements The statements for the new function body.
         * @param parameter The parameter for the function.
         * @param name The name of the parameter.
         * @param initializer The initializer for the parameter.
         */
        function insertDefaultValueAssignmentForBindingPattern(statements: ts.Statement[], parameter: ts.ParameterDeclaration, name: ts.BindingPattern, initializer: ts.Expression | undefined): boolean {
            // In cases where a binding pattern is simply '[]' or '{}',
            // we usually don't want to emit a var declaration; however, in the presence
            // of an initializer, we must emit that expression to preserve side effects.
            if (name.elements.length > 0) {
                ts.insertStatementAfterCustomPrologue(statements, ts.setEmitFlags(ts.createVariableStatement(
                /*modifiers*/ undefined, ts.createVariableDeclarationList(ts.flattenDestructuringBinding(parameter, visitor, context, ts.FlattenLevel.All, ts.getGeneratedNameForNode(parameter)))), ts.EmitFlags.CustomPrologue));
                return true;
            }
            else if (initializer) {
                ts.insertStatementAfterCustomPrologue(statements, ts.setEmitFlags(ts.createExpressionStatement(ts.createAssignment(ts.getGeneratedNameForNode(parameter), ts.visitNode(initializer, visitor, ts.isExpression))), ts.EmitFlags.CustomPrologue));
                return true;
            }
            return false;
        }
        /**
         * Adds statements to the body of a function-like node for parameters with initializers.
         *
         * @param statements The statements for the new function body.
         * @param parameter The parameter for the function.
         * @param name The name of the parameter.
         * @param initializer The initializer for the parameter.
         */
        function insertDefaultValueAssignmentForInitializer(statements: ts.Statement[], parameter: ts.ParameterDeclaration, name: ts.Identifier, initializer: ts.Expression): void {
            initializer = ts.visitNode(initializer, visitor, ts.isExpression);
            const statement = ts.createIf(ts.createTypeCheck(ts.getSynthesizedClone(name), "undefined"), ts.setEmitFlags(ts.setTextRange(ts.createBlock([
                ts.createExpressionStatement(ts.setEmitFlags(ts.setTextRange(ts.createAssignment(ts.setEmitFlags(ts.getMutableClone(name), ts.EmitFlags.NoSourceMap), ts.setEmitFlags(initializer, ts.EmitFlags.NoSourceMap | ts.getEmitFlags(initializer) | ts.EmitFlags.NoComments)), parameter), ts.EmitFlags.NoComments))
            ]), parameter), ts.EmitFlags.SingleLine | ts.EmitFlags.NoTrailingSourceMap | ts.EmitFlags.NoTokenSourceMaps | ts.EmitFlags.NoComments));
            ts.startOnNewLine(statement);
            ts.setTextRange(statement, parameter);
            ts.setEmitFlags(statement, ts.EmitFlags.NoTokenSourceMaps | ts.EmitFlags.NoTrailingSourceMap | ts.EmitFlags.CustomPrologue | ts.EmitFlags.NoComments);
            ts.insertStatementAfterCustomPrologue(statements, statement);
        }
        /**
         * Gets a value indicating whether we need to add statements to handle a rest parameter.
         *
         * @param node A ParameterDeclaration node.
         * @param inConstructorWithSynthesizedSuper A value indicating whether the parameter is
         *                                          part of a constructor declaration with a
         *                                          synthesized call to `super`
         */
        function shouldAddRestParameter(node: ts.ParameterDeclaration | undefined, inConstructorWithSynthesizedSuper: boolean): node is ts.ParameterDeclaration {
            return !!(node && node.dotDotDotToken && !inConstructorWithSynthesizedSuper);
        }
        /**
         * Adds statements to the body of a function-like node if it contains a rest parameter.
         *
         * @param statements The statements for the new function body.
         * @param node A function-like node.
         * @param inConstructorWithSynthesizedSuper A value indicating whether the parameter is
         *                                          part of a constructor declaration with a
         *                                          synthesized call to `super`
         */
        function addRestParameterIfNeeded(statements: ts.Statement[], node: ts.FunctionLikeDeclaration, inConstructorWithSynthesizedSuper: boolean): boolean {
            const prologueStatements: ts.Statement[] = [];
            const parameter = ts.lastOrUndefined(node.parameters);
            if (!shouldAddRestParameter(parameter, inConstructorWithSynthesizedSuper)) {
                return false;
            }
            // `declarationName` is the name of the local declaration for the parameter.
            const declarationName = parameter.name.kind === ts.SyntaxKind.Identifier ? ts.getMutableClone(parameter.name) : ts.createTempVariable(/*recordTempVariable*/ undefined);
            ts.setEmitFlags(declarationName, ts.EmitFlags.NoSourceMap);
            // `expressionName` is the name of the parameter used in expressions.
            const expressionName = parameter.name.kind === ts.SyntaxKind.Identifier ? ts.getSynthesizedClone(parameter.name) : declarationName;
            const restIndex = node.parameters.length - 1;
            const temp = ts.createLoopVariable();
            // var param = [];
            prologueStatements.push(ts.setEmitFlags(ts.setTextRange(ts.createVariableStatement(
            /*modifiers*/ undefined, ts.createVariableDeclarationList([
                ts.createVariableDeclaration(declarationName, 
                /*type*/ undefined, ts.createArrayLiteral([]))
            ])), 
            /*location*/ parameter), ts.EmitFlags.CustomPrologue));
            // for (var _i = restIndex; _i < arguments.length; _i++) {
            //   param[_i - restIndex] = arguments[_i];
            // }
            const forStatement = ts.createFor(ts.setTextRange(ts.createVariableDeclarationList([
                ts.createVariableDeclaration(temp, /*type*/ undefined, ts.createLiteral(restIndex))
            ]), parameter), ts.setTextRange(ts.createLessThan(temp, ts.createPropertyAccess(ts.createIdentifier("arguments"), "length")), parameter), ts.setTextRange(ts.createPostfixIncrement(temp), parameter), ts.createBlock([
                ts.startOnNewLine(ts.setTextRange(ts.createExpressionStatement(ts.createAssignment(ts.createElementAccess(expressionName, restIndex === 0
                    ? temp
                    : ts.createSubtract(temp, ts.createLiteral(restIndex))), ts.createElementAccess(ts.createIdentifier("arguments"), temp))), 
                /*location*/ parameter))
            ]));
            ts.setEmitFlags(forStatement, ts.EmitFlags.CustomPrologue);
            ts.startOnNewLine(forStatement);
            prologueStatements.push(forStatement);
            if (parameter.name.kind !== ts.SyntaxKind.Identifier) {
                // do the actual destructuring of the rest parameter if necessary
                prologueStatements.push(ts.setEmitFlags(ts.setTextRange(ts.createVariableStatement(
                /*modifiers*/ undefined, ts.createVariableDeclarationList(ts.flattenDestructuringBinding(parameter, visitor, context, ts.FlattenLevel.All, expressionName))), parameter), ts.EmitFlags.CustomPrologue));
            }
            ts.insertStatementsAfterCustomPrologue(statements, prologueStatements);
            return true;
        }
        /**
         * Adds a statement to capture the `this` of a function declaration if it is needed.
         * NOTE: This must be executed *after* the subtree has been visited.
         *
         * @param statements The statements for the new function body.
         * @param node A node.
         */
        function insertCaptureThisForNodeIfNeeded(statements: ts.Statement[], node: ts.Node): boolean {
            if (hierarchyFacts & HierarchyFacts.CapturedLexicalThis && node.kind !== ts.SyntaxKind.ArrowFunction) {
                insertCaptureThisForNode(statements, node, ts.createThis());
                return true;
            }
            return false;
        }
        function insertCaptureThisForNode(statements: ts.Statement[], node: ts.Node, initializer: ts.Expression | undefined): void {
            enableSubstitutionsForCapturedThis();
            const captureThisStatement = ts.createVariableStatement(
            /*modifiers*/ undefined, ts.createVariableDeclarationList([
                ts.createVariableDeclaration(ts.createFileLevelUniqueName("_this"), 
                /*type*/ undefined, initializer)
            ]));
            ts.setEmitFlags(captureThisStatement, ts.EmitFlags.NoComments | ts.EmitFlags.CustomPrologue);
            ts.setSourceMapRange(captureThisStatement, node);
            ts.insertStatementAfterCustomPrologue(statements, captureThisStatement);
        }
        function insertCaptureNewTargetIfNeeded(statements: ts.Statement[], node: ts.FunctionLikeDeclaration, copyOnWrite: boolean): ts.Statement[] {
            if (hierarchyFacts & HierarchyFacts.NewTarget) {
                let newTarget: ts.Expression;
                switch (node.kind) {
                    case ts.SyntaxKind.ArrowFunction:
                        return statements;
                    case ts.SyntaxKind.MethodDeclaration:
                    case ts.SyntaxKind.GetAccessor:
                    case ts.SyntaxKind.SetAccessor:
                        // Methods and accessors cannot be constructors, so 'new.target' will
                        // always return 'undefined'.
                        newTarget = ts.createVoidZero();
                        break;
                    case ts.SyntaxKind.Constructor:
                        // Class constructors can only be called with `new`, so `this.constructor`
                        // should be relatively safe to use.
                        newTarget = ts.createPropertyAccess(ts.setEmitFlags(ts.createThis(), ts.EmitFlags.NoSubstitution), "constructor");
                        break;
                    case ts.SyntaxKind.FunctionDeclaration:
                    case ts.SyntaxKind.FunctionExpression:
                        // Functions can be called or constructed, and may have a `this` due to
                        // being a member or when calling an imported function via `other_1.f()`.
                        newTarget = ts.createConditional(ts.createLogicalAnd(ts.setEmitFlags(ts.createThis(), ts.EmitFlags.NoSubstitution), ts.createBinary(ts.setEmitFlags(ts.createThis(), ts.EmitFlags.NoSubstitution), ts.SyntaxKind.InstanceOfKeyword, ts.getLocalName(node))), ts.createPropertyAccess(ts.setEmitFlags(ts.createThis(), ts.EmitFlags.NoSubstitution), "constructor"), ts.createVoidZero());
                        break;
                    default:
                        return ts.Debug.failBadSyntaxKind(node);
                }
                const captureNewTargetStatement = ts.createVariableStatement(
                /*modifiers*/ undefined, ts.createVariableDeclarationList([
                    ts.createVariableDeclaration(ts.createFileLevelUniqueName("_newTarget"), 
                    /*type*/ undefined, newTarget)
                ]));
                ts.setEmitFlags(captureNewTargetStatement, ts.EmitFlags.NoComments | ts.EmitFlags.CustomPrologue);
                if (copyOnWrite) {
                    statements = statements.slice();
                }
                ts.insertStatementAfterCustomPrologue(statements, captureNewTargetStatement);
            }
            return statements;
        }
        /**
         * Adds statements to the class body function for a class to define the members of the
         * class.
         *
         * @param statements The statements for the class body function.
         * @param node The ClassExpression or ClassDeclaration node.
         */
        function addClassMembers(statements: ts.Statement[], node: ts.ClassExpression | ts.ClassDeclaration): void {
            for (const member of node.members) {
                switch (member.kind) {
                    case ts.SyntaxKind.SemicolonClassElement:
                        statements.push(transformSemicolonClassElementToStatement((<ts.SemicolonClassElement>member)));
                        break;
                    case ts.SyntaxKind.MethodDeclaration:
                        statements.push(transformClassMethodDeclarationToStatement(getClassMemberPrefix(node, member), (<ts.MethodDeclaration>member), node));
                        break;
                    case ts.SyntaxKind.GetAccessor:
                    case ts.SyntaxKind.SetAccessor:
                        const accessors = ts.getAllAccessorDeclarations(node.members, (<ts.AccessorDeclaration>member));
                        if (member === accessors.firstAccessor) {
                            statements.push(transformAccessorsToStatement(getClassMemberPrefix(node, member), accessors, node));
                        }
                        break;
                    case ts.SyntaxKind.Constructor:
                        // Constructors are handled in visitClassExpression/visitClassDeclaration
                        break;
                    default:
                        ts.Debug.failBadSyntaxKind(member, currentSourceFile && currentSourceFile.fileName);
                        break;
                }
            }
        }
        /**
         * Transforms a SemicolonClassElement into a statement for a class body function.
         *
         * @param member The SemicolonClassElement node.
         */
        function transformSemicolonClassElementToStatement(member: ts.SemicolonClassElement) {
            return ts.setTextRange(ts.createEmptyStatement(), member);
        }
        /**
         * Transforms a MethodDeclaration into a statement for a class body function.
         *
         * @param receiver The receiver for the member.
         * @param member The MethodDeclaration node.
         */
        function transformClassMethodDeclarationToStatement(receiver: ts.LeftHandSideExpression, member: ts.MethodDeclaration, container: ts.Node) {
            const commentRange = ts.getCommentRange(member);
            const sourceMapRange = ts.getSourceMapRange(member);
            const memberFunction = transformFunctionLikeToExpression(member, /*location*/ member, /*name*/ undefined, container);
            let e: ts.Expression;
            if (context.getCompilerOptions().useDefineForClassFields) {
                const propertyName = ts.visitNode(member.name, visitor, ts.isPropertyName);
                const name = ts.isComputedPropertyName(propertyName) ? propertyName.expression
                    : ts.isIdentifier(propertyName) ? ts.createStringLiteral(ts.unescapeLeadingUnderscores(propertyName.escapedText))
                        : propertyName;
                e = ts.createObjectDefinePropertyCall(receiver, name, ts.createPropertyDescriptor({ value: memberFunction, enumerable: false, writable: true, configurable: true }));
            }
            else {
                const memberName = ts.createMemberAccessForPropertyName(receiver, ts.visitNode(member.name, visitor, ts.isPropertyName), /*location*/ member.name);
                e = ts.createAssignment(memberName, memberFunction);
            }
            ts.setEmitFlags(memberFunction, ts.EmitFlags.NoComments);
            ts.setSourceMapRange(memberFunction, sourceMapRange);
            const statement = ts.setTextRange(ts.createExpressionStatement(e), /*location*/ member);
            ts.setOriginalNode(statement, member);
            ts.setCommentRange(statement, commentRange);
            // The location for the statement is used to emit comments only.
            // No source map should be emitted for this statement to align with the
            // old emitter.
            ts.setEmitFlags(statement, ts.EmitFlags.NoSourceMap);
            return statement;
        }
        /**
         * Transforms a set of related of get/set accessors into a statement for a class body function.
         *
         * @param receiver The receiver for the member.
         * @param accessors The set of related get/set accessors.
         */
        function transformAccessorsToStatement(receiver: ts.LeftHandSideExpression, accessors: ts.AllAccessorDeclarations, container: ts.Node): ts.Statement {
            const statement = ts.createExpressionStatement(transformAccessorsToExpression(receiver, accessors, container, /*startsOnNewLine*/ false));
            // The location for the statement is used to emit source maps only.
            // No comments should be emitted for this statement to align with the
            // old emitter.
            ts.setEmitFlags(statement, ts.EmitFlags.NoComments);
            ts.setSourceMapRange(statement, ts.getSourceMapRange(accessors.firstAccessor));
            return statement;
        }
        /**
         * Transforms a set of related get/set accessors into an expression for either a class
         * body function or an ObjectLiteralExpression with computed properties.
         *
         * @param receiver The receiver for the member.
         */
        function transformAccessorsToExpression(receiver: ts.LeftHandSideExpression, { firstAccessor, getAccessor, setAccessor }: ts.AllAccessorDeclarations, container: ts.Node, startsOnNewLine: boolean): ts.Expression {
            // To align with source maps in the old emitter, the receiver and property name
            // arguments are both mapped contiguously to the accessor name.
            const target = ts.getMutableClone(receiver);
            ts.setEmitFlags(target, ts.EmitFlags.NoComments | ts.EmitFlags.NoTrailingSourceMap);
            ts.setSourceMapRange(target, firstAccessor.name);
            const propertyName = ts.createExpressionForPropertyName(ts.visitNode(firstAccessor.name, visitor, ts.isPropertyName));
            ts.setEmitFlags(propertyName, ts.EmitFlags.NoComments | ts.EmitFlags.NoLeadingSourceMap);
            ts.setSourceMapRange(propertyName, firstAccessor.name);
            const properties: ts.ObjectLiteralElementLike[] = [];
            if (getAccessor) {
                const getterFunction = transformFunctionLikeToExpression(getAccessor, /*location*/ undefined, /*name*/ undefined, container);
                ts.setSourceMapRange(getterFunction, ts.getSourceMapRange(getAccessor));
                ts.setEmitFlags(getterFunction, ts.EmitFlags.NoLeadingComments);
                const getter = ts.createPropertyAssignment("get", getterFunction);
                ts.setCommentRange(getter, ts.getCommentRange(getAccessor));
                properties.push(getter);
            }
            if (setAccessor) {
                const setterFunction = transformFunctionLikeToExpression(setAccessor, /*location*/ undefined, /*name*/ undefined, container);
                ts.setSourceMapRange(setterFunction, ts.getSourceMapRange(setAccessor));
                ts.setEmitFlags(setterFunction, ts.EmitFlags.NoLeadingComments);
                const setter = ts.createPropertyAssignment("set", setterFunction);
                ts.setCommentRange(setter, ts.getCommentRange(setAccessor));
                properties.push(setter);
            }
            properties.push(ts.createPropertyAssignment("enumerable", ts.createTrue()), ts.createPropertyAssignment("configurable", ts.createTrue()));
            const call = ts.createCall(ts.createPropertyAccess(ts.createIdentifier("Object"), "defineProperty"), 
            /*typeArguments*/ undefined, [
                target,
                propertyName,
                ts.createObjectLiteral(properties, /*multiLine*/ true)
            ]);
            if (startsOnNewLine) {
                ts.startOnNewLine(call);
            }
            return call;
        }
        /**
         * Visits an ArrowFunction and transforms it into a FunctionExpression.
         *
         * @param node An ArrowFunction node.
         */
        function visitArrowFunction(node: ts.ArrowFunction) {
            if (node.transformFlags & ts.TransformFlags.ContainsLexicalThis) {
                hierarchyFacts |= HierarchyFacts.CapturedLexicalThis;
            }
            const savedConvertedLoopState = convertedLoopState;
            convertedLoopState = undefined;
            const ancestorFacts = enterSubtree(HierarchyFacts.ArrowFunctionExcludes, HierarchyFacts.ArrowFunctionIncludes);
            const func = ts.createFunctionExpression(
            /*modifiers*/ undefined, 
            /*asteriskToken*/ undefined, 
            /*name*/ undefined, 
            /*typeParameters*/ undefined, ts.visitParameterList(node.parameters, visitor, context), 
            /*type*/ undefined, transformFunctionBody(node));
            ts.setTextRange(func, node);
            ts.setOriginalNode(func, node);
            ts.setEmitFlags(func, ts.EmitFlags.CapturesThis);
            if (hierarchyFacts & HierarchyFacts.CapturedLexicalThis) {
                enableSubstitutionsForCapturedThis();
            }
            // If an arrow function contains
            exitSubtree(ancestorFacts, HierarchyFacts.ArrowFunctionSubtreeExcludes, HierarchyFacts.None);
            convertedLoopState = savedConvertedLoopState;
            return func;
        }
        /**
         * Visits a FunctionExpression node.
         *
         * @param node a FunctionExpression node.
         */
        function visitFunctionExpression(node: ts.FunctionExpression): ts.Expression {
            const ancestorFacts = ts.getEmitFlags(node) & ts.EmitFlags.AsyncFunctionBody
                ? enterSubtree(HierarchyFacts.AsyncFunctionBodyExcludes, HierarchyFacts.AsyncFunctionBodyIncludes)
                : enterSubtree(HierarchyFacts.FunctionExcludes, HierarchyFacts.FunctionIncludes);
            const savedConvertedLoopState = convertedLoopState;
            convertedLoopState = undefined;
            const parameters = ts.visitParameterList(node.parameters, visitor, context);
            const body = transformFunctionBody(node);
            const name = hierarchyFacts & HierarchyFacts.NewTarget
                ? ts.getLocalName(node)
                : node.name;
            exitSubtree(ancestorFacts, HierarchyFacts.FunctionSubtreeExcludes, HierarchyFacts.None);
            convertedLoopState = savedConvertedLoopState;
            return ts.updateFunctionExpression(node, 
            /*modifiers*/ undefined, node.asteriskToken, name, 
            /*typeParameters*/ undefined, parameters, 
            /*type*/ undefined, body);
        }
        /**
         * Visits a FunctionDeclaration node.
         *
         * @param node a FunctionDeclaration node.
         */
        function visitFunctionDeclaration(node: ts.FunctionDeclaration): ts.FunctionDeclaration {
            const savedConvertedLoopState = convertedLoopState;
            convertedLoopState = undefined;
            const ancestorFacts = enterSubtree(HierarchyFacts.FunctionExcludes, HierarchyFacts.FunctionIncludes);
            const parameters = ts.visitParameterList(node.parameters, visitor, context);
            const body = transformFunctionBody(node);
            const name = hierarchyFacts & HierarchyFacts.NewTarget
                ? ts.getLocalName(node)
                : node.name;
            exitSubtree(ancestorFacts, HierarchyFacts.FunctionSubtreeExcludes, HierarchyFacts.None);
            convertedLoopState = savedConvertedLoopState;
            return ts.updateFunctionDeclaration(node, 
            /*decorators*/ undefined, ts.visitNodes(node.modifiers, visitor, ts.isModifier), node.asteriskToken, name, 
            /*typeParameters*/ undefined, parameters, 
            /*type*/ undefined, body);
        }
        /**
         * Transforms a function-like node into a FunctionExpression.
         *
         * @param node The function-like node to transform.
         * @param location The source-map location for the new FunctionExpression.
         * @param name The name of the new FunctionExpression.
         */
        function transformFunctionLikeToExpression(node: ts.FunctionLikeDeclaration, location: ts.TextRange | undefined, name: ts.Identifier | undefined, container: ts.Node | undefined): ts.FunctionExpression {
            const savedConvertedLoopState = convertedLoopState;
            convertedLoopState = undefined;
            const ancestorFacts = container && ts.isClassLike(container) && !ts.hasModifier(node, ts.ModifierFlags.Static)
                ? enterSubtree(HierarchyFacts.FunctionExcludes, HierarchyFacts.FunctionIncludes | HierarchyFacts.NonStaticClassElement)
                : enterSubtree(HierarchyFacts.FunctionExcludes, HierarchyFacts.FunctionIncludes);
            const parameters = ts.visitParameterList(node.parameters, visitor, context);
            const body = transformFunctionBody(node);
            if (hierarchyFacts & HierarchyFacts.NewTarget && !name && (node.kind === ts.SyntaxKind.FunctionDeclaration || node.kind === ts.SyntaxKind.FunctionExpression)) {
                name = ts.getGeneratedNameForNode(node);
            }
            exitSubtree(ancestorFacts, HierarchyFacts.FunctionSubtreeExcludes, HierarchyFacts.None);
            convertedLoopState = savedConvertedLoopState;
            return ts.setOriginalNode(ts.setTextRange(ts.createFunctionExpression(
            /*modifiers*/ undefined, node.asteriskToken, name, 
            /*typeParameters*/ undefined, parameters, 
            /*type*/ undefined, body), location), 
            /*original*/ node);
        }
        /**
         * Transforms the body of a function-like node.
         *
         * @param node A function-like node.
         */
        function transformFunctionBody(node: ts.FunctionLikeDeclaration) {
            let multiLine = false; // indicates whether the block *must* be emitted as multiple lines
            let singleLine = false; // indicates whether the block *may* be emitted as a single line
            let statementsLocation: ts.TextRange;
            let closeBraceLocation: ts.TextRange | undefined;
            const prologue: ts.Statement[] = [];
            const statements: ts.Statement[] = [];
            const body = node.body!;
            let statementOffset: number | undefined;
            resumeLexicalEnvironment();
            if (ts.isBlock(body)) {
                // ensureUseStrict is false because no new prologue-directive should be added.
                // addStandardPrologue will put already-existing directives at the beginning of the target statement-array
                statementOffset = ts.addStandardPrologue(prologue, body.statements, /*ensureUseStrict*/ false);
            }
            multiLine = addDefaultValueAssignmentsIfNeeded(statements, node) || multiLine;
            multiLine = addRestParameterIfNeeded(statements, node, /*inConstructorWithSynthesizedSuper*/ false) || multiLine;
            if (ts.isBlock(body)) {
                // addCustomPrologue puts already-existing directives at the beginning of the target statement-array
                statementOffset = ts.addCustomPrologue(statements, body.statements, statementOffset, visitor);
                statementsLocation = body.statements;
                ts.addRange(statements, ts.visitNodes(body.statements, visitor, ts.isStatement, statementOffset));
                // If the original body was a multi-line block, this must be a multi-line block.
                if (!multiLine && body.multiLine) {
                    multiLine = true;
                }
            }
            else {
                ts.Debug.assert(node.kind === ts.SyntaxKind.ArrowFunction);
                // To align with the old emitter, we use a synthetic end position on the location
                // for the statement list we synthesize when we down-level an arrow function with
                // an expression function body. This prevents both comments and source maps from
                // being emitted for the end position only.
                statementsLocation = ts.moveRangeEnd(body, -1);
                const equalsGreaterThanToken = (<ts.ArrowFunction>node).equalsGreaterThanToken;
                if (!ts.nodeIsSynthesized(equalsGreaterThanToken) && !ts.nodeIsSynthesized(body)) {
                    if (ts.rangeEndIsOnSameLineAsRangeStart(equalsGreaterThanToken, body, currentSourceFile)) {
                        singleLine = true;
                    }
                    else {
                        multiLine = true;
                    }
                }
                const expression = ts.visitNode(body, visitor, ts.isExpression);
                const returnStatement = ts.createReturn(expression);
                ts.setTextRange(returnStatement, body);
                ts.moveSyntheticComments(returnStatement, body);
                ts.setEmitFlags(returnStatement, ts.EmitFlags.NoTokenSourceMaps | ts.EmitFlags.NoTrailingSourceMap | ts.EmitFlags.NoTrailingComments);
                statements.push(returnStatement);
                // To align with the source map emit for the old emitter, we set a custom
                // source map location for the close brace.
                closeBraceLocation = body;
            }
            ts.mergeLexicalEnvironment(prologue, endLexicalEnvironment());
            insertCaptureNewTargetIfNeeded(prologue, node, /*copyOnWrite*/ false);
            insertCaptureThisForNodeIfNeeded(prologue, node);
            // If we added any final generated statements, this must be a multi-line block
            if (ts.some(prologue)) {
                multiLine = true;
            }
            statements.unshift(...prologue);
            if (ts.isBlock(body) && ts.arrayIsEqualTo(statements, body.statements)) {
                // no changes were made, preserve the tree
                return body;
            }
            const block = ts.createBlock(ts.setTextRange(ts.createNodeArray(statements), statementsLocation), multiLine);
            ts.setTextRange(block, node.body);
            if (!multiLine && singleLine) {
                ts.setEmitFlags(block, ts.EmitFlags.SingleLine);
            }
            if (closeBraceLocation) {
                ts.setTokenSourceMapRange(block, ts.SyntaxKind.CloseBraceToken, closeBraceLocation);
            }
            ts.setOriginalNode(block, node.body);
            return block;
        }
        function visitBlock(node: ts.Block, isFunctionBody: boolean): ts.Block {
            if (isFunctionBody) {
                // A function body is not a block scope.
                return ts.visitEachChild(node, visitor, context);
            }
            const ancestorFacts = hierarchyFacts & HierarchyFacts.IterationStatement
                ? enterSubtree(HierarchyFacts.IterationStatementBlockExcludes, HierarchyFacts.IterationStatementBlockIncludes)
                : enterSubtree(HierarchyFacts.BlockExcludes, HierarchyFacts.BlockIncludes);
            const updated = ts.visitEachChild(node, visitor, context);
            exitSubtree(ancestorFacts, HierarchyFacts.None, HierarchyFacts.None);
            return updated;
        }
        /**
         * Visits an ExpressionStatement that contains a destructuring assignment.
         *
         * @param node An ExpressionStatement node.
         */
        function visitExpressionStatement(node: ts.ExpressionStatement): ts.Statement {
            // If we are here it is most likely because our expression is a destructuring assignment.
            switch (node.expression.kind) {
                case ts.SyntaxKind.ParenthesizedExpression:
                    return ts.updateExpressionStatement(node, visitParenthesizedExpression((<ts.ParenthesizedExpression>node.expression), /*needsDestructuringValue*/ false));
                case ts.SyntaxKind.BinaryExpression:
                    return ts.updateExpressionStatement(node, visitBinaryExpression((<ts.BinaryExpression>node.expression), /*needsDestructuringValue*/ false));
            }
            return ts.visitEachChild(node, visitor, context);
        }
        /**
         * Visits a ParenthesizedExpression that may contain a destructuring assignment.
         *
         * @param node A ParenthesizedExpression node.
         * @param needsDestructuringValue A value indicating whether we need to hold onto the rhs
         *                                of a destructuring assignment.
         */
        function visitParenthesizedExpression(node: ts.ParenthesizedExpression, needsDestructuringValue: boolean): ts.ParenthesizedExpression {
            // If we are here it is most likely because our expression is a destructuring assignment.
            if (!needsDestructuringValue) {
                // By default we always emit the RHS at the end of a flattened destructuring
                // expression. If we are in a state where we do not need the destructuring value,
                // we pass that information along to the children that care about it.
                switch (node.expression.kind) {
                    case ts.SyntaxKind.ParenthesizedExpression:
                        return ts.updateParen(node, visitParenthesizedExpression((<ts.ParenthesizedExpression>node.expression), /*needsDestructuringValue*/ false));
                    case ts.SyntaxKind.BinaryExpression:
                        return ts.updateParen(node, visitBinaryExpression((<ts.BinaryExpression>node.expression), /*needsDestructuringValue*/ false));
                }
            }
            return ts.visitEachChild(node, visitor, context);
        }
        /**
         * Visits a BinaryExpression that contains a destructuring assignment.
         *
         * @param node A BinaryExpression node.
         * @param needsDestructuringValue A value indicating whether we need to hold onto the rhs
         *                                of a destructuring assignment.
         */
        function visitBinaryExpression(node: ts.BinaryExpression, needsDestructuringValue: boolean): ts.Expression {
            // If we are here it is because this is a destructuring assignment.
            if (ts.isDestructuringAssignment(node)) {
                return ts.flattenDestructuringAssignment(node, visitor, context, ts.FlattenLevel.All, needsDestructuringValue);
            }
            return ts.visitEachChild(node, visitor, context);
        }
        function visitVariableStatement(node: ts.VariableStatement): ts.Statement | undefined {
            const ancestorFacts = enterSubtree(HierarchyFacts.None, ts.hasModifier(node, ts.ModifierFlags.Export) ? HierarchyFacts.ExportedVariableStatement : HierarchyFacts.None);
            let updated: ts.Statement | undefined;
            if (convertedLoopState && (node.declarationList.flags & ts.NodeFlags.BlockScoped) === 0) {
                // we are inside a converted loop - hoist variable declarations
                let assignments: ts.Expression[] | undefined;
                for (const decl of node.declarationList.declarations) {
                    hoistVariableDeclarationDeclaredInConvertedLoop(convertedLoopState, decl);
                    if (decl.initializer) {
                        let assignment: ts.Expression;
                        if (ts.isBindingPattern(decl.name)) {
                            assignment = ts.flattenDestructuringAssignment(decl, visitor, context, ts.FlattenLevel.All);
                        }
                        else {
                            assignment = ts.createBinary(decl.name, ts.SyntaxKind.EqualsToken, ts.visitNode(decl.initializer, visitor, ts.isExpression));
                            ts.setTextRange(assignment, decl);
                        }
                        assignments = ts.append(assignments, assignment);
                    }
                }
                if (assignments) {
                    updated = ts.setTextRange(ts.createExpressionStatement(ts.inlineExpressions(assignments)), node);
                }
                else {
                    // none of declarations has initializer - the entire variable statement can be deleted
                    updated = undefined;
                }
            }
            else {
                updated = ts.visitEachChild(node, visitor, context);
            }
            exitSubtree(ancestorFacts, HierarchyFacts.None, HierarchyFacts.None);
            return updated;
        }
        /**
         * Visits a VariableDeclarationList that is block scoped (e.g. `let` or `const`).
         *
         * @param node A VariableDeclarationList node.
         */
        function visitVariableDeclarationList(node: ts.VariableDeclarationList): ts.VariableDeclarationList {
            if (node.flags & ts.NodeFlags.BlockScoped || node.transformFlags & ts.TransformFlags.ContainsBindingPattern) {
                if (node.flags & ts.NodeFlags.BlockScoped) {
                    enableSubstitutionsForBlockScopedBindings();
                }
                const declarations = ts.flatMap(node.declarations, node.flags & ts.NodeFlags.Let
                    ? visitVariableDeclarationInLetDeclarationList
                    : visitVariableDeclaration);
                const declarationList = ts.createVariableDeclarationList(declarations);
                ts.setOriginalNode(declarationList, node);
                ts.setTextRange(declarationList, node);
                ts.setCommentRange(declarationList, node);
                // If the first or last declaration is a binding pattern, we need to modify
                // the source map range for the declaration list.
                if (node.transformFlags & ts.TransformFlags.ContainsBindingPattern
                    && (ts.isBindingPattern(node.declarations[0].name) || ts.isBindingPattern(ts.last(node.declarations).name))) {
                    ts.setSourceMapRange(declarationList, getRangeUnion(declarations));
                }
                return declarationList;
            }
            return ts.visitEachChild(node, visitor, context);
        }
        function getRangeUnion(declarations: readonly ts.Node[]): ts.TextRange {
            // declarations may not be sorted by position.
            // pos should be the minimum* position over all nodes (that's not -1), end should be the maximum end over all nodes.
            let pos = -1, end = -1;
            for (const node of declarations) {
                pos = pos === -1 ? node.pos : node.pos === -1 ? pos : Math.min(pos, node.pos);
                end = Math.max(end, node.end);
            }
            return ts.createRange(pos, end);
        }
        /**
         * Gets a value indicating whether we should emit an explicit initializer for a variable
         * declaration in a `let` declaration list.
         *
         * @param node A VariableDeclaration node.
         */
        function shouldEmitExplicitInitializerForLetDeclaration(node: ts.VariableDeclaration) {
            // Nested let bindings might need to be initialized explicitly to preserve
            // ES6 semantic:
            //
            //  { let x = 1; }
            //  { let x; } // x here should be undefined. not 1
            //
            // Top level bindings never collide with anything and thus don't require
            // explicit initialization. As for nested let bindings there are two cases:
            //
            // - Nested let bindings that were not renamed definitely should be
            //   initialized explicitly:
            //
            //    { let x = 1; }
            //    { let x; if (some-condition) { x = 1}; if (x) { /*1*/ } }
            //
            //   Without explicit initialization code in /*1*/ can be executed even if
            //   some-condition is evaluated to false.
            //
            // - Renaming introduces fresh name that should not collide with any
            //   existing names, however renamed bindings sometimes also should be
            //   explicitly initialized. One particular case: non-captured binding
            //   declared inside loop body (but not in loop initializer):
            //
            //    let x;
            //    for (;;) {
            //        let x;
            //    }
            //
            //   In downlevel codegen inner 'x' will be renamed so it won't collide
            //   with outer 'x' however it will should be reset on every iteration as
            //   if it was declared anew.
            //
            //   * Why non-captured binding?
            //     - Because if loop contains block scoped binding captured in some
            //       function then loop body will be rewritten to have a fresh scope
            //       on every iteration so everything will just work.
            //
            //   * Why loop initializer is excluded?
            //     - Since we've introduced a fresh name it already will be undefined.
            const flags = resolver.getNodeCheckFlags(node);
            const isCapturedInFunction = flags & ts.NodeCheckFlags.CapturedBlockScopedBinding;
            const isDeclaredInLoop = flags & ts.NodeCheckFlags.BlockScopedBindingInLoop;
            const emittedAsTopLevel = (hierarchyFacts & HierarchyFacts.TopLevel) !== 0
                || (isCapturedInFunction
                    && isDeclaredInLoop
                    && (hierarchyFacts & HierarchyFacts.IterationStatementBlock) !== 0);
            const emitExplicitInitializer = !emittedAsTopLevel
                && (hierarchyFacts & HierarchyFacts.ForInOrForOfStatement) === 0
                && (!resolver.isDeclarationWithCollidingName(node)
                    || (isDeclaredInLoop
                        && !isCapturedInFunction
                        && (hierarchyFacts & (HierarchyFacts.ForStatement | HierarchyFacts.ForInOrForOfStatement)) === 0));
            return emitExplicitInitializer;
        }
        /**
         * Visits a VariableDeclaration in a `let` declaration list.
         *
         * @param node A VariableDeclaration node.
         */
        function visitVariableDeclarationInLetDeclarationList(node: ts.VariableDeclaration) {
            // For binding pattern names that lack initializers there is no point to emit
            // explicit initializer since downlevel codegen for destructuring will fail
            // in the absence of initializer so all binding elements will say uninitialized
            const name = node.name;
            if (ts.isBindingPattern(name)) {
                return visitVariableDeclaration(node);
            }
            if (!node.initializer && shouldEmitExplicitInitializerForLetDeclaration(node)) {
                const clone = ts.getMutableClone(node);
                clone.initializer = ts.createVoidZero();
                return clone;
            }
            return ts.visitEachChild(node, visitor, context);
        }
        /**
         * Visits a VariableDeclaration node with a binding pattern.
         *
         * @param node A VariableDeclaration node.
         */
        function visitVariableDeclaration(node: ts.VariableDeclaration): ts.VisitResult<ts.VariableDeclaration> {
            const ancestorFacts = enterSubtree(HierarchyFacts.ExportedVariableStatement, HierarchyFacts.None);
            let updated: ts.VisitResult<ts.VariableDeclaration>;
            if (ts.isBindingPattern(node.name)) {
                updated = ts.flattenDestructuringBinding(node, visitor, context, ts.FlattenLevel.All, 
                /*value*/ undefined, (ancestorFacts & HierarchyFacts.ExportedVariableStatement) !== 0);
            }
            else {
                updated = ts.visitEachChild(node, visitor, context);
            }
            exitSubtree(ancestorFacts, HierarchyFacts.None, HierarchyFacts.None);
            return updated;
        }
        function recordLabel(node: ts.LabeledStatement) {
            convertedLoopState!.labels!.set(ts.idText(node.label), true);
        }
        function resetLabel(node: ts.LabeledStatement) {
            convertedLoopState!.labels!.set(ts.idText(node.label), false);
        }
        function visitLabeledStatement(node: ts.LabeledStatement): ts.VisitResult<ts.Statement> {
            if (convertedLoopState && !convertedLoopState.labels) {
                convertedLoopState.labels = ts.createMap<boolean>();
            }
            const statement = ts.unwrapInnermostStatementOfLabel(node, convertedLoopState && recordLabel);
            return ts.isIterationStatement(statement, /*lookInLabeledStatements*/ false)
                ? visitIterationStatement(statement, /*outermostLabeledStatement*/ node)
                : ts.restoreEnclosingLabel(ts.visitNode(statement, visitor, ts.isStatement, ts.liftToBlock), node, convertedLoopState && resetLabel);
        }
        function visitIterationStatement(node: ts.IterationStatement, outermostLabeledStatement: ts.LabeledStatement) {
            switch (node.kind) {
                case ts.SyntaxKind.DoStatement:
                case ts.SyntaxKind.WhileStatement:
                    return visitDoOrWhileStatement((<ts.DoStatement | ts.WhileStatement>node), outermostLabeledStatement);
                case ts.SyntaxKind.ForStatement:
                    return visitForStatement((<ts.ForStatement>node), outermostLabeledStatement);
                case ts.SyntaxKind.ForInStatement:
                    return visitForInStatement((<ts.ForInStatement>node), outermostLabeledStatement);
                case ts.SyntaxKind.ForOfStatement:
                    return visitForOfStatement((<ts.ForOfStatement>node), outermostLabeledStatement);
            }
        }
        function visitIterationStatementWithFacts(excludeFacts: HierarchyFacts, includeFacts: HierarchyFacts, node: ts.IterationStatement, outermostLabeledStatement: ts.LabeledStatement | undefined, convert?: LoopConverter) {
            const ancestorFacts = enterSubtree(excludeFacts, includeFacts);
            const updated = convertIterationStatementBodyIfNecessary(node, outermostLabeledStatement, ancestorFacts, convert);
            exitSubtree(ancestorFacts, HierarchyFacts.None, HierarchyFacts.None);
            return updated;
        }
        function visitDoOrWhileStatement(node: ts.DoStatement | ts.WhileStatement, outermostLabeledStatement: ts.LabeledStatement | undefined) {
            return visitIterationStatementWithFacts(HierarchyFacts.DoOrWhileStatementExcludes, HierarchyFacts.DoOrWhileStatementIncludes, node, outermostLabeledStatement);
        }
        function visitForStatement(node: ts.ForStatement, outermostLabeledStatement: ts.LabeledStatement | undefined) {
            return visitIterationStatementWithFacts(HierarchyFacts.ForStatementExcludes, HierarchyFacts.ForStatementIncludes, node, outermostLabeledStatement);
        }
        function visitForInStatement(node: ts.ForInStatement, outermostLabeledStatement: ts.LabeledStatement | undefined) {
            return visitIterationStatementWithFacts(HierarchyFacts.ForInOrForOfStatementExcludes, HierarchyFacts.ForInOrForOfStatementIncludes, node, outermostLabeledStatement);
        }
        function visitForOfStatement(node: ts.ForOfStatement, outermostLabeledStatement: ts.LabeledStatement | undefined): ts.VisitResult<ts.Statement> {
            return visitIterationStatementWithFacts(HierarchyFacts.ForInOrForOfStatementExcludes, HierarchyFacts.ForInOrForOfStatementIncludes, node, outermostLabeledStatement, compilerOptions.downlevelIteration ? convertForOfStatementForIterable : convertForOfStatementForArray);
        }
        function convertForOfStatementHead(node: ts.ForOfStatement, boundValue: ts.Expression, convertedLoopBodyStatements: ts.Statement[]) {
            const statements: ts.Statement[] = [];
            const initializer = node.initializer;
            if (ts.isVariableDeclarationList(initializer)) {
                if (node.initializer.flags & ts.NodeFlags.BlockScoped) {
                    enableSubstitutionsForBlockScopedBindings();
                }
                const firstOriginalDeclaration = ts.firstOrUndefined(initializer.declarations);
                if (firstOriginalDeclaration && ts.isBindingPattern(firstOriginalDeclaration.name)) {
                    // This works whether the declaration is a var, let, or const.
                    // It will use rhsIterationValue _a[_i] as the initializer.
                    const declarations = ts.flattenDestructuringBinding(firstOriginalDeclaration, visitor, context, ts.FlattenLevel.All, boundValue);
                    const declarationList = ts.setTextRange(ts.createVariableDeclarationList(declarations), node.initializer);
                    ts.setOriginalNode(declarationList, node.initializer);
                    // Adjust the source map range for the first declaration to align with the old
                    // emitter.
                    ts.setSourceMapRange(declarationList, ts.createRange(declarations[0].pos, ts.last(declarations).end));
                    statements.push(ts.createVariableStatement(
                    /*modifiers*/ undefined, declarationList));
                }
                else {
                    // The following call does not include the initializer, so we have
                    // to emit it separately.
                    statements.push(ts.setTextRange(ts.createVariableStatement(
                    /*modifiers*/ undefined, ts.setOriginalNode(ts.setTextRange(ts.createVariableDeclarationList([
                        ts.createVariableDeclaration(firstOriginalDeclaration ? firstOriginalDeclaration.name : ts.createTempVariable(/*recordTempVariable*/ undefined), 
                        /*type*/ undefined, boundValue)
                    ]), ts.moveRangePos(initializer, -1)), initializer)), ts.moveRangeEnd(initializer, -1)));
                }
            }
            else {
                // Initializer is an expression. Emit the expression in the body, so that it's
                // evaluated on every iteration.
                const assignment = ts.createAssignment(initializer, boundValue);
                if (ts.isDestructuringAssignment(assignment)) {
                    ts.aggregateTransformFlags(assignment);
                    statements.push(ts.createExpressionStatement(visitBinaryExpression(assignment, /*needsDestructuringValue*/ false)));
                }
                else {
                    assignment.end = initializer.end;
                    statements.push(ts.setTextRange(ts.createExpressionStatement(ts.visitNode(assignment, visitor, ts.isExpression)), ts.moveRangeEnd(initializer, -1)));
                }
            }
            if (convertedLoopBodyStatements) {
                return createSyntheticBlockForConvertedStatements(ts.addRange(statements, convertedLoopBodyStatements));
            }
            else {
                const statement = ts.visitNode(node.statement, visitor, ts.isStatement, ts.liftToBlock);
                if (ts.isBlock(statement)) {
                    return ts.updateBlock(statement, ts.setTextRange(ts.createNodeArray(ts.concatenate(statements, statement.statements)), statement.statements));
                }
                else {
                    statements.push(statement);
                    return createSyntheticBlockForConvertedStatements(statements);
                }
            }
        }
        function createSyntheticBlockForConvertedStatements(statements: ts.Statement[]) {
            return ts.setEmitFlags(ts.createBlock(ts.createNodeArray(statements), 
            /*multiLine*/ true), ts.EmitFlags.NoSourceMap | ts.EmitFlags.NoTokenSourceMaps);
        }
        function convertForOfStatementForArray(node: ts.ForOfStatement, outermostLabeledStatement: ts.LabeledStatement, convertedLoopBodyStatements: ts.Statement[]): ts.Statement {
            // The following ES6 code:
            //
            //    for (let v of expr) { }
            //
            // should be emitted as
            //
            //    for (var _i = 0, _a = expr; _i < _a.length; _i++) {
            //        var v = _a[_i];
            //    }
            //
            // where _a and _i are temps emitted to capture the RHS and the counter,
            // respectively.
            // When the left hand side is an expression instead of a let declaration,
            // the "let v" is not emitted.
            // When the left hand side is a let/const, the v is renamed if there is
            // another v in scope.
            // Note that all assignments to the LHS are emitted in the body, including
            // all destructuring.
            // Note also that because an extra statement is needed to assign to the LHS,
            // for-of bodies are always emitted as blocks.
            const expression = ts.visitNode(node.expression, visitor, ts.isExpression);
            // In the case where the user wrote an identifier as the RHS, like this:
            //
            //     for (let v of arr) { }
            //
            // we don't want to emit a temporary variable for the RHS, just use it directly.
            const counter = ts.createLoopVariable();
            const rhsReference = ts.isIdentifier(expression) ? ts.getGeneratedNameForNode(expression) : ts.createTempVariable(/*recordTempVariable*/ undefined);
            // The old emitter does not emit source maps for the expression
            ts.setEmitFlags(expression, ts.EmitFlags.NoSourceMap | ts.getEmitFlags(expression));
            const forStatement = ts.setTextRange(ts.createFor(
            /*initializer*/ ts.setEmitFlags(ts.setTextRange(ts.createVariableDeclarationList([
                ts.setTextRange(ts.createVariableDeclaration(counter, /*type*/ undefined, ts.createLiteral(0)), ts.moveRangePos(node.expression, -1)),
                ts.setTextRange(ts.createVariableDeclaration(rhsReference, /*type*/ undefined, expression), node.expression)
            ]), node.expression), ts.EmitFlags.NoHoisting), 
            /*condition*/ ts.setTextRange(ts.createLessThan(counter, ts.createPropertyAccess(rhsReference, "length")), node.expression), 
            /*incrementor*/ ts.setTextRange(ts.createPostfixIncrement(counter), node.expression), 
            /*statement*/ convertForOfStatementHead(node, ts.createElementAccess(rhsReference, counter), convertedLoopBodyStatements)), 
            /*location*/ node);
            // Disable trailing source maps for the OpenParenToken to align source map emit with the old emitter.
            ts.setEmitFlags(forStatement, ts.EmitFlags.NoTokenTrailingSourceMaps);
            ts.setTextRange(forStatement, node);
            return ts.restoreEnclosingLabel(forStatement, outermostLabeledStatement, convertedLoopState && resetLabel);
        }
        function convertForOfStatementForIterable(node: ts.ForOfStatement, outermostLabeledStatement: ts.LabeledStatement, convertedLoopBodyStatements: ts.Statement[], ancestorFacts: HierarchyFacts): ts.Statement {
            const expression = ts.visitNode(node.expression, visitor, ts.isExpression);
            const iterator = ts.isIdentifier(expression) ? ts.getGeneratedNameForNode(expression) : ts.createTempVariable(/*recordTempVariable*/ undefined);
            const result = ts.isIdentifier(expression) ? ts.getGeneratedNameForNode(iterator) : ts.createTempVariable(/*recordTempVariable*/ undefined);
            const errorRecord = ts.createUniqueName("e");
            const catchVariable = ts.getGeneratedNameForNode(errorRecord);
            const returnMethod = ts.createTempVariable(/*recordTempVariable*/ undefined);
            const values = ts.createValuesHelper(context, expression, node.expression);
            const next = ts.createCall(ts.createPropertyAccess(iterator, "next"), /*typeArguments*/ undefined, []);
            hoistVariableDeclaration(errorRecord);
            hoistVariableDeclaration(returnMethod);
            // if we are enclosed in an outer loop ensure we reset 'errorRecord' per each iteration
            const initializer = ancestorFacts & HierarchyFacts.IterationContainer
                ? ts.inlineExpressions([ts.createAssignment(errorRecord, ts.createVoidZero()), values])
                : values;
            const forStatement = ts.setEmitFlags(ts.setTextRange(ts.createFor(
            /*initializer*/ ts.setEmitFlags(ts.setTextRange(ts.createVariableDeclarationList([
                ts.setTextRange(ts.createVariableDeclaration(iterator, /*type*/ undefined, initializer), node.expression),
                ts.createVariableDeclaration(result, /*type*/ undefined, next)
            ]), node.expression), ts.EmitFlags.NoHoisting), 
            /*condition*/ ts.createLogicalNot(ts.createPropertyAccess(result, "done")), 
            /*incrementor*/ ts.createAssignment(result, next), 
            /*statement*/ convertForOfStatementHead(node, ts.createPropertyAccess(result, "value"), convertedLoopBodyStatements)), 
            /*location*/ node), ts.EmitFlags.NoTokenTrailingSourceMaps);
            return ts.createTry(ts.createBlock([
                ts.restoreEnclosingLabel(forStatement, outermostLabeledStatement, convertedLoopState && resetLabel)
            ]), ts.createCatchClause(ts.createVariableDeclaration(catchVariable), ts.setEmitFlags(ts.createBlock([
                ts.createExpressionStatement(ts.createAssignment(errorRecord, ts.createObjectLiteral([
                    ts.createPropertyAssignment("error", catchVariable)
                ])))
            ]), ts.EmitFlags.SingleLine)), ts.createBlock([
                ts.createTry(
                /*tryBlock*/ ts.createBlock([
                    ts.setEmitFlags(ts.createIf(ts.createLogicalAnd(ts.createLogicalAnd(result, ts.createLogicalNot(ts.createPropertyAccess(result, "done"))), ts.createAssignment(returnMethod, ts.createPropertyAccess(iterator, "return"))), ts.createExpressionStatement(ts.createFunctionCall(returnMethod, iterator, []))), ts.EmitFlags.SingleLine),
                ]), 
                /*catchClause*/ undefined, 
                /*finallyBlock*/ ts.setEmitFlags(ts.createBlock([
                    ts.setEmitFlags(ts.createIf(errorRecord, ts.createThrow(ts.createPropertyAccess(errorRecord, "error"))), ts.EmitFlags.SingleLine)
                ]), ts.EmitFlags.SingleLine))
            ]));
        }
        /**
         * Visits an ObjectLiteralExpression with computed property names.
         *
         * @param node An ObjectLiteralExpression node.
         */
        function visitObjectLiteralExpression(node: ts.ObjectLiteralExpression): ts.Expression {
            // We are here because a ComputedPropertyName was used somewhere in the expression.
            const properties = node.properties;
            const numProperties = properties.length;
            // Find the first computed property.
            // Everything until that point can be emitted as part of the initial object literal.
            let numInitialProperties = numProperties;
            let numInitialPropertiesWithoutYield = numProperties;
            for (let i = 0; i < numProperties; i++) {
                const property = properties[i];
                if ((property.transformFlags & ts.TransformFlags.ContainsYield && hierarchyFacts & HierarchyFacts.AsyncFunctionBody)
                    && i < numInitialPropertiesWithoutYield) {
                    numInitialPropertiesWithoutYield = i;
                }
                if (property.name!.kind === ts.SyntaxKind.ComputedPropertyName) {
                    numInitialProperties = i;
                    break;
                }
            }
            if (numInitialProperties !== numProperties) {
                if (numInitialPropertiesWithoutYield < numInitialProperties) {
                    numInitialProperties = numInitialPropertiesWithoutYield;
                }
                // For computed properties, we need to create a unique handle to the object
                // literal so we can modify it without risking internal assignments tainting the object.
                const temp = ts.createTempVariable(hoistVariableDeclaration);
                // Write out the first non-computed properties, then emit the rest through indexing on the temp variable.
                const expressions: ts.Expression[] = [];
                const assignment = ts.createAssignment(temp, ts.setEmitFlags(ts.createObjectLiteral(ts.visitNodes(properties, visitor, ts.isObjectLiteralElementLike, 0, numInitialProperties), node.multiLine), ts.EmitFlags.Indented));
                if (node.multiLine) {
                    ts.startOnNewLine(assignment);
                }
                expressions.push(assignment);
                addObjectLiteralMembers(expressions, node, temp, numInitialProperties);
                // We need to clone the temporary identifier so that we can write it on a
                // new line
                expressions.push(node.multiLine ? ts.startOnNewLine(ts.getMutableClone(temp)) : temp);
                return ts.inlineExpressions(expressions);
            }
            return ts.visitEachChild(node, visitor, context);
        }
        interface ForStatementWithConvertibleInitializer extends ts.ForStatement {
            initializer: ts.VariableDeclarationList;
        }
        interface ForStatementWithConvertibleCondition extends ts.ForStatement {
            condition: ts.Expression;
        }
        interface ForStatementWithConvertibleIncrementor extends ts.ForStatement {
            incrementor: ts.Expression;
        }
        function shouldConvertPartOfIterationStatement(node: ts.Node) {
            return (resolver.getNodeCheckFlags(node) & ts.NodeCheckFlags.ContainsCapturedBlockScopeBinding) !== 0;
        }
        function shouldConvertInitializerOfForStatement(node: ts.IterationStatement): node is ForStatementWithConvertibleInitializer {
            return ts.isForStatement(node) && !!node.initializer && shouldConvertPartOfIterationStatement(node.initializer);
        }
        function shouldConvertConditionOfForStatement(node: ts.IterationStatement): node is ForStatementWithConvertibleCondition {
            return ts.isForStatement(node) && !!node.condition && shouldConvertPartOfIterationStatement(node.condition);
        }
        function shouldConvertIncrementorOfForStatement(node: ts.IterationStatement): node is ForStatementWithConvertibleIncrementor {
            return ts.isForStatement(node) && !!node.incrementor && shouldConvertPartOfIterationStatement(node.incrementor);
        }
        function shouldConvertIterationStatement(node: ts.IterationStatement) {
            return shouldConvertBodyOfIterationStatement(node)
                || shouldConvertInitializerOfForStatement(node);
        }
        function shouldConvertBodyOfIterationStatement(node: ts.IterationStatement): boolean {
            return (resolver.getNodeCheckFlags(node) & ts.NodeCheckFlags.LoopWithCapturedBlockScopedBinding) !== 0;
        }
        /**
         * Records constituents of name for the given variable to be hoisted in the outer scope.
         */
        function hoistVariableDeclarationDeclaredInConvertedLoop(state: ConvertedLoopState, node: ts.VariableDeclaration): void {
            if (!state.hoistedLocalVariables) {
                state.hoistedLocalVariables = [];
            }
            visit(node.name);
            function visit(node: ts.Identifier | ts.BindingPattern) {
                if (node.kind === ts.SyntaxKind.Identifier) {
                    state.hoistedLocalVariables!.push(node);
                }
                else {
                    for (const element of node.elements) {
                        if (!ts.isOmittedExpression(element)) {
                            visit(element.name);
                        }
                    }
                }
            }
        }
        function convertIterationStatementBodyIfNecessary(node: ts.IterationStatement, outermostLabeledStatement: ts.LabeledStatement | undefined, ancestorFacts: HierarchyFacts, convert?: LoopConverter): ts.VisitResult<ts.Statement> {
            if (!shouldConvertIterationStatement(node)) {
                let saveAllowedNonLabeledJumps: Jump | undefined;
                if (convertedLoopState) {
                    // we get here if we are trying to emit normal loop loop inside converted loop
                    // set allowedNonLabeledJumps to Break | Continue to mark that break\continue inside the loop should be emitted as is
                    saveAllowedNonLabeledJumps = convertedLoopState.allowedNonLabeledJumps;
                    convertedLoopState.allowedNonLabeledJumps = Jump.Break | Jump.Continue;
                }
                const result = convert
                    ? convert(node, outermostLabeledStatement, /*convertedLoopBodyStatements*/ undefined, ancestorFacts)
                    : ts.restoreEnclosingLabel(ts.visitEachChild(node, visitor, context), outermostLabeledStatement, convertedLoopState && resetLabel);
                if (convertedLoopState) {
                    convertedLoopState.allowedNonLabeledJumps = saveAllowedNonLabeledJumps;
                }
                return result;
            }
            const currentState = createConvertedLoopState(node);
            const statements: ts.Statement[] = [];
            const outerConvertedLoopState = convertedLoopState;
            convertedLoopState = currentState;
            const initializerFunction = shouldConvertInitializerOfForStatement(node) ? createFunctionForInitializerOfForStatement(node, currentState) : undefined;
            const bodyFunction = shouldConvertBodyOfIterationStatement(node) ? createFunctionForBodyOfIterationStatement(node, currentState, outerConvertedLoopState) : undefined;
            convertedLoopState = outerConvertedLoopState;
            if (initializerFunction)
                statements.push(initializerFunction.functionDeclaration);
            if (bodyFunction)
                statements.push(bodyFunction.functionDeclaration);
            addExtraDeclarationsForConvertedLoop(statements, currentState, outerConvertedLoopState);
            if (initializerFunction) {
                statements.push(generateCallToConvertedLoopInitializer(initializerFunction.functionName, initializerFunction.containsYield));
            }
            let loop: ts.Statement;
            if (bodyFunction) {
                if (convert) {
                    loop = convert(node, outermostLabeledStatement, bodyFunction.part, ancestorFacts);
                }
                else {
                    const clone = convertIterationStatementCore(node, initializerFunction, ts.createBlock(bodyFunction.part, /*multiLine*/ true));
                    ts.aggregateTransformFlags(clone);
                    loop = ts.restoreEnclosingLabel(clone, outermostLabeledStatement, convertedLoopState && resetLabel);
                }
            }
            else {
                const clone = convertIterationStatementCore(node, initializerFunction, ts.visitNode(node.statement, visitor, ts.isStatement, ts.liftToBlock));
                ts.aggregateTransformFlags(clone);
                loop = ts.restoreEnclosingLabel(clone, outermostLabeledStatement, convertedLoopState && resetLabel);
            }
            statements.push(loop);
            return statements;
        }
        function convertIterationStatementCore(node: ts.IterationStatement, initializerFunction: IterationStatementPartFunction<ts.VariableDeclarationList> | undefined, convertedLoopBody: ts.Statement) {
            switch (node.kind) {
                case ts.SyntaxKind.ForStatement: return convertForStatement((node as ts.ForStatement), initializerFunction, convertedLoopBody);
                case ts.SyntaxKind.ForInStatement: return convertForInStatement((node as ts.ForInStatement), convertedLoopBody);
                case ts.SyntaxKind.ForOfStatement: return convertForOfStatement((node as ts.ForOfStatement), convertedLoopBody);
                case ts.SyntaxKind.DoStatement: return convertDoStatement((node as ts.DoStatement), convertedLoopBody);
                case ts.SyntaxKind.WhileStatement: return convertWhileStatement((node as ts.WhileStatement), convertedLoopBody);
                default: return ts.Debug.failBadSyntaxKind(node, "IterationStatement expected");
            }
        }
        function convertForStatement(node: ts.ForStatement, initializerFunction: IterationStatementPartFunction<ts.VariableDeclarationList> | undefined, convertedLoopBody: ts.Statement) {
            const shouldConvertCondition = node.condition && shouldConvertPartOfIterationStatement(node.condition);
            const shouldConvertIncrementor = shouldConvertCondition || node.incrementor && shouldConvertPartOfIterationStatement(node.incrementor);
            return ts.updateFor(node, ts.visitNode(initializerFunction ? initializerFunction.part : node.initializer, visitor, ts.isForInitializer), ts.visitNode(shouldConvertCondition ? undefined : node.condition, visitor, ts.isExpression), ts.visitNode(shouldConvertIncrementor ? undefined : node.incrementor, visitor, ts.isExpression), convertedLoopBody);
        }
        function convertForOfStatement(node: ts.ForOfStatement, convertedLoopBody: ts.Statement) {
            return ts.updateForOf(node, 
            /*awaitModifier*/ undefined, ts.visitNode(node.initializer, visitor, ts.isForInitializer), ts.visitNode(node.expression, visitor, ts.isExpression), convertedLoopBody);
        }
        function convertForInStatement(node: ts.ForInStatement, convertedLoopBody: ts.Statement) {
            return ts.updateForIn(node, ts.visitNode(node.initializer, visitor, ts.isForInitializer), ts.visitNode(node.expression, visitor, ts.isExpression), convertedLoopBody);
        }
        function convertDoStatement(node: ts.DoStatement, convertedLoopBody: ts.Statement) {
            return ts.updateDo(node, convertedLoopBody, ts.visitNode(node.expression, visitor, ts.isExpression));
        }
        function convertWhileStatement(node: ts.WhileStatement, convertedLoopBody: ts.Statement) {
            return ts.updateWhile(node, ts.visitNode(node.expression, visitor, ts.isExpression), convertedLoopBody);
        }
        function createConvertedLoopState(node: ts.IterationStatement) {
            let loopInitializer: ts.VariableDeclarationList | undefined;
            switch (node.kind) {
                case ts.SyntaxKind.ForStatement:
                case ts.SyntaxKind.ForInStatement:
                case ts.SyntaxKind.ForOfStatement:
                    const initializer = (<ts.ForStatement | ts.ForInStatement | ts.ForOfStatement>node).initializer;
                    if (initializer && initializer.kind === ts.SyntaxKind.VariableDeclarationList) {
                        loopInitializer = (<ts.VariableDeclarationList>initializer);
                    }
                    break;
            }
            // variables that will be passed to the loop as parameters
            const loopParameters: ts.ParameterDeclaration[] = [];
            // variables declared in the loop initializer that will be changed inside the loop
            const loopOutParameters: LoopOutParameter[] = [];
            if (loopInitializer && (ts.getCombinedNodeFlags(loopInitializer) & ts.NodeFlags.BlockScoped)) {
                const hasCapturedBindingsInForInitializer = shouldConvertInitializerOfForStatement(node);
                for (const decl of loopInitializer.declarations) {
                    processLoopVariableDeclaration(node, decl, loopParameters, loopOutParameters, hasCapturedBindingsInForInitializer);
                }
            }
            const currentState: ConvertedLoopState = { loopParameters, loopOutParameters };
            if (convertedLoopState) {
                // convertedOuterLoopState !== undefined means that this converted loop is nested in another converted loop.
                // if outer converted loop has already accumulated some state - pass it through
                if (convertedLoopState.argumentsName) {
                    // outer loop has already used 'arguments' so we've already have some name to alias it
                    // use the same name in all nested loops
                    currentState.argumentsName = convertedLoopState.argumentsName;
                }
                if (convertedLoopState.thisName) {
                    // outer loop has already used 'this' so we've already have some name to alias it
                    // use the same name in all nested loops
                    currentState.thisName = convertedLoopState.thisName;
                }
                if (convertedLoopState.hoistedLocalVariables) {
                    // we've already collected some non-block scoped variable declarations in enclosing loop
                    // use the same storage in nested loop
                    currentState.hoistedLocalVariables = convertedLoopState.hoistedLocalVariables;
                }
            }
            return currentState;
        }
        function addExtraDeclarationsForConvertedLoop(statements: ts.Statement[], state: ConvertedLoopState, outerState: ConvertedLoopState | undefined) {
            let extraVariableDeclarations: ts.VariableDeclaration[] | undefined;
            // propagate state from the inner loop to the outer loop if necessary
            if (state.argumentsName) {
                // if alias for arguments is set
                if (outerState) {
                    // pass it to outer converted loop
                    outerState.argumentsName = state.argumentsName;
                }
                else {
                    // this is top level converted loop and we need to create an alias for 'arguments' object
                    (extraVariableDeclarations || (extraVariableDeclarations = [])).push(ts.createVariableDeclaration(state.argumentsName, 
                    /*type*/ undefined, ts.createIdentifier("arguments")));
                }
            }
            if (state.thisName) {
                // if alias for this is set
                if (outerState) {
                    // pass it to outer converted loop
                    outerState.thisName = state.thisName;
                }
                else {
                    // this is top level converted loop so we need to create an alias for 'this' here
                    // NOTE:
                    // if converted loops were all nested in arrow function then we'll always emit '_this' so convertedLoopState.thisName will not be set.
                    // If it is set this means that all nested loops are not nested in arrow function and it is safe to capture 'this'.
                    (extraVariableDeclarations || (extraVariableDeclarations = [])).push(ts.createVariableDeclaration(state.thisName, 
                    /*type*/ undefined, ts.createIdentifier("this")));
                }
            }
            if (state.hoistedLocalVariables) {
                // if hoistedLocalVariables !== undefined this means that we've possibly collected some variable declarations to be hoisted later
                if (outerState) {
                    // pass them to outer converted loop
                    outerState.hoistedLocalVariables = state.hoistedLocalVariables;
                }
                else {
                    if (!extraVariableDeclarations) {
                        extraVariableDeclarations = [];
                    }
                    // hoist collected variable declarations
                    for (const identifier of state.hoistedLocalVariables) {
                        extraVariableDeclarations.push(ts.createVariableDeclaration(identifier));
                    }
                }
            }
            // add extra variables to hold out parameters if necessary
            if (state.loopOutParameters.length) {
                if (!extraVariableDeclarations) {
                    extraVariableDeclarations = [];
                }
                for (const outParam of state.loopOutParameters) {
                    extraVariableDeclarations.push(ts.createVariableDeclaration(outParam.outParamName));
                }
            }
            if (state.conditionVariable) {
                if (!extraVariableDeclarations) {
                    extraVariableDeclarations = [];
                }
                extraVariableDeclarations.push(ts.createVariableDeclaration(state.conditionVariable, /*type*/ undefined, ts.createFalse()));
            }
            // create variable statement to hold all introduced variable declarations
            if (extraVariableDeclarations) {
                statements.push(ts.createVariableStatement(
                /*modifiers*/ undefined, ts.createVariableDeclarationList(extraVariableDeclarations)));
            }
        }
        interface IterationStatementPartFunction<T> {
            functionName: ts.Identifier;
            functionDeclaration: ts.Statement;
            containsYield: boolean;
            part: T;
        }
        function createOutVariable(p: LoopOutParameter) {
            return ts.createVariableDeclaration(p.originalName, /*type*/ undefined, p.outParamName);
        }
        /**
         * Creates a `_loop_init` function for a `ForStatement` with a block-scoped initializer
         * that is captured in a closure inside of the initializer. The `_loop_init` function is
         * used to preserve the per-iteration environment semantics of
         * [13.7.4.8 RS: ForBodyEvaluation](https://tc39.github.io/ecma262/#sec-forbodyevaluation).
         */
        function createFunctionForInitializerOfForStatement(node: ForStatementWithConvertibleInitializer, currentState: ConvertedLoopState): IterationStatementPartFunction<ts.VariableDeclarationList> {
            const functionName = ts.createUniqueName("_loop_init");
            const containsYield = (node.initializer.transformFlags & ts.TransformFlags.ContainsYield) !== 0;
            let emitFlags = ts.EmitFlags.None;
            if (currentState.containsLexicalThis)
                emitFlags |= ts.EmitFlags.CapturesThis;
            if (containsYield && hierarchyFacts & HierarchyFacts.AsyncFunctionBody)
                emitFlags |= ts.EmitFlags.AsyncFunctionBody;
            const statements: ts.Statement[] = [];
            statements.push(ts.createVariableStatement(/*modifiers*/ undefined, node.initializer));
            copyOutParameters(currentState.loopOutParameters, LoopOutParameterFlags.Initializer, CopyDirection.ToOutParameter, statements);
            // This transforms the following ES2015 syntax:
            //
            //  for (let i = (setImmediate(() => console.log(i)), 0); i < 2; i++) {
            //      // loop body
            //  }
            //
            // Into the following ES5 syntax:
            //
            //  var _loop_init_1 = function () {
            //      var i = (setImmediate(() => console.log(i)), 0);
            //      out_i_1 = i;
            //  };
            //  var out_i_1;
            //  _loop_init_1();
            //  for (var i = out_i_1; i < 2; i++) {
            //      // loop body
            //  }
            //
            // Which prevents mutations to `i` in the per-iteration environment of the body
            // from affecting the initial value for `i` outside of the per-iteration environment.
            const functionDeclaration = ts.createVariableStatement(
            /*modifiers*/ undefined, ts.setEmitFlags(ts.createVariableDeclarationList([
                ts.createVariableDeclaration(functionName, 
                /*type*/ undefined, ts.setEmitFlags(ts.createFunctionExpression(
                /*modifiers*/ undefined, containsYield ? ts.createToken(ts.SyntaxKind.AsteriskToken) : undefined, 
                /*name*/ undefined, 
                /*typeParameters*/ undefined, 
                /*parameters*/ undefined, 
                /*type*/ undefined, ts.visitNode(ts.createBlock(statements, /*multiLine*/ true), visitor, ts.isBlock)), emitFlags))
            ]), ts.EmitFlags.NoHoisting));
            const part = ts.createVariableDeclarationList(ts.map(currentState.loopOutParameters, createOutVariable));
            return { functionName, containsYield, functionDeclaration, part };
        }
        /**
         * Creates a `_loop` function for an `IterationStatement` with a block-scoped initializer
         * that is captured in a closure inside of the loop body. The `_loop` function is used to
         * preserve the per-iteration environment semantics of
         * [13.7.4.8 RS: ForBodyEvaluation](https://tc39.github.io/ecma262/#sec-forbodyevaluation).
         */
        function createFunctionForBodyOfIterationStatement(node: ts.IterationStatement, currentState: ConvertedLoopState, outerState: ConvertedLoopState | undefined): IterationStatementPartFunction<ts.Statement[]> {
            const functionName = ts.createUniqueName("_loop");
            startLexicalEnvironment();
            const statement = ts.visitNode(node.statement, visitor, ts.isStatement, ts.liftToBlock);
            const lexicalEnvironment = endLexicalEnvironment();
            const statements: ts.Statement[] = [];
            if (shouldConvertConditionOfForStatement(node) || shouldConvertIncrementorOfForStatement(node)) {
                // If a block-scoped variable declared in the initializer of `node` is captured in
                // the condition or incrementor, we must move the condition and incrementor into
                // the body of the for loop.
                //
                // This transforms the following ES2015 syntax:
                //
                //  for (let i = 0; setImmediate(() => console.log(i)), i < 2; setImmediate(() => console.log(i)), i++) {
                //      // loop body
                //  }
                //
                // Into the following ES5 syntax:
                //
                //  var _loop_1 = function (i) {
                //      if (inc_1)
                //          setImmediate(() => console.log(i)), i++;
                //      else
                //          inc_1 = true;
                //      if (!(setImmediate(() => console.log(i)), i < 2))
                //          return out_i_1 = i, "break";
                //      // loop body
                //      out_i_1 = i;
                //  }
                //  var out_i_1, inc_1 = false;
                //  for (var i = 0;;) {
                //      var state_1 = _loop_1(i);
                //      i = out_i_1;
                //      if (state_1 === "break")
                //          break;
                //  }
                //
                // Which prevents mutations to `i` in the per-iteration environment of the body
                // from affecting the value of `i` in the previous per-iteration environment.
                //
                // Note that the incrementor of a `for` loop is evaluated in a *new* per-iteration
                // environment that is carried over to the next iteration of the loop. As a result,
                // we must indicate whether this is the first evaluation of the loop body so that
                // we only evaluate the incrementor on subsequent evaluations.
                currentState.conditionVariable = ts.createUniqueName("inc");
                statements.push(ts.createIf(currentState.conditionVariable, ts.createStatement(ts.visitNode(node.incrementor, visitor, ts.isExpression)), ts.createStatement(ts.createAssignment(currentState.conditionVariable, ts.createTrue()))));
                if (shouldConvertConditionOfForStatement(node)) {
                    statements.push(ts.createIf(ts.createPrefix(ts.SyntaxKind.ExclamationToken, ts.visitNode(node.condition, visitor, ts.isExpression)), ts.visitNode(ts.createBreak(), visitor, ts.isStatement)));
                }
            }
            if (ts.isBlock(statement)) {
                ts.addRange(statements, statement.statements);
            }
            else {
                statements.push(statement);
            }
            copyOutParameters(currentState.loopOutParameters, LoopOutParameterFlags.Body, CopyDirection.ToOutParameter, statements);
            ts.insertStatementsAfterStandardPrologue(statements, lexicalEnvironment);
            const loopBody = ts.createBlock(statements, /*multiLine*/ true);
            if (ts.isBlock(statement))
                ts.setOriginalNode(loopBody, statement);
            const containsYield = (node.statement.transformFlags & ts.TransformFlags.ContainsYield) !== 0;
            let emitFlags: ts.EmitFlags = 0;
            if (currentState.containsLexicalThis)
                emitFlags |= ts.EmitFlags.CapturesThis;
            if (containsYield && (hierarchyFacts & HierarchyFacts.AsyncFunctionBody) !== 0)
                emitFlags |= ts.EmitFlags.AsyncFunctionBody;
            // This transforms the following ES2015 syntax (in addition to other variations):
            //
            //  for (let i = 0; i < 2; i++) {
            //      setImmediate(() => console.log(i));
            //  }
            //
            // Into the following ES5 syntax:
            //
            //  var _loop_1 = function (i) {
            //      setImmediate(() => console.log(i));
            //  };
            //  for (var i = 0; i < 2; i++) {
            //      _loop_1(i);
            //  }
            const functionDeclaration = ts.createVariableStatement(
            /*modifiers*/ undefined, ts.setEmitFlags(ts.createVariableDeclarationList([
                ts.createVariableDeclaration(functionName, 
                /*type*/ undefined, ts.setEmitFlags(ts.createFunctionExpression(
                /*modifiers*/ undefined, containsYield ? ts.createToken(ts.SyntaxKind.AsteriskToken) : undefined, 
                /*name*/ undefined, 
                /*typeParameters*/ undefined, currentState.loopParameters, 
                /*type*/ undefined, loopBody), emitFlags))
            ]), ts.EmitFlags.NoHoisting));
            const part = generateCallToConvertedLoop(functionName, currentState, outerState, containsYield);
            return { functionName, containsYield, functionDeclaration, part };
        }
        function copyOutParameter(outParam: LoopOutParameter, copyDirection: CopyDirection): ts.BinaryExpression {
            const source = copyDirection === CopyDirection.ToOriginal ? outParam.outParamName : outParam.originalName;
            const target = copyDirection === CopyDirection.ToOriginal ? outParam.originalName : outParam.outParamName;
            return ts.createBinary(target, ts.SyntaxKind.EqualsToken, source);
        }
        function copyOutParameters(outParams: LoopOutParameter[], partFlags: LoopOutParameterFlags, copyDirection: CopyDirection, statements: ts.Statement[]): void {
            for (const outParam of outParams) {
                if (outParam.flags & partFlags) {
                    statements.push(ts.createExpressionStatement(copyOutParameter(outParam, copyDirection)));
                }
            }
        }
        function generateCallToConvertedLoopInitializer(initFunctionExpressionName: ts.Identifier, containsYield: boolean): ts.Statement {
            const call = ts.createCall(initFunctionExpressionName, /*typeArguments*/ undefined, []);
            const callResult = containsYield
                ? ts.createYield(ts.createToken(ts.SyntaxKind.AsteriskToken), ts.setEmitFlags(call, ts.EmitFlags.Iterator))
                : call;
            return ts.createStatement(callResult);
        }
        function generateCallToConvertedLoop(loopFunctionExpressionName: ts.Identifier, state: ConvertedLoopState, outerState: ConvertedLoopState | undefined, containsYield: boolean): ts.Statement[] {
            const statements: ts.Statement[] = [];
            // loop is considered simple if it does not have any return statements or break\continue that transfer control outside of the loop
            // simple loops are emitted as just 'loop()';
            // NOTE: if loop uses only 'continue' it still will be emitted as simple loop
            const isSimpleLoop = !(state.nonLocalJumps! & ~Jump.Continue) &&
                !state.labeledNonLocalBreaks &&
                !state.labeledNonLocalContinues;
            const call = ts.createCall(loopFunctionExpressionName, /*typeArguments*/ undefined, ts.map(state.loopParameters, p => <ts.Identifier>p.name));
            const callResult = containsYield
                ? ts.createYield(ts.createToken(ts.SyntaxKind.AsteriskToken), ts.setEmitFlags(call, ts.EmitFlags.Iterator))
                : call;
            if (isSimpleLoop) {
                statements.push(ts.createExpressionStatement(callResult));
                copyOutParameters(state.loopOutParameters, LoopOutParameterFlags.Body, CopyDirection.ToOriginal, statements);
            }
            else {
                const loopResultName = ts.createUniqueName("state");
                const stateVariable = ts.createVariableStatement(
                /*modifiers*/ undefined, ts.createVariableDeclarationList([ts.createVariableDeclaration(loopResultName, /*type*/ undefined, callResult)]));
                statements.push(stateVariable);
                copyOutParameters(state.loopOutParameters, LoopOutParameterFlags.Body, CopyDirection.ToOriginal, statements);
                if (state.nonLocalJumps! & Jump.Return) {
                    let returnStatement: ts.ReturnStatement;
                    if (outerState) {
                        outerState.nonLocalJumps! |= Jump.Return;
                        returnStatement = ts.createReturn(loopResultName);
                    }
                    else {
                        returnStatement = ts.createReturn(ts.createPropertyAccess(loopResultName, "value"));
                    }
                    statements.push(ts.createIf(ts.createBinary(ts.createTypeOf(loopResultName), ts.SyntaxKind.EqualsEqualsEqualsToken, ts.createLiteral("object")), returnStatement));
                }
                if (state.nonLocalJumps! & Jump.Break) {
                    statements.push(ts.createIf(ts.createBinary(loopResultName, ts.SyntaxKind.EqualsEqualsEqualsToken, ts.createLiteral("break")), ts.createBreak()));
                }
                if (state.labeledNonLocalBreaks || state.labeledNonLocalContinues) {
                    const caseClauses: ts.CaseClause[] = [];
                    processLabeledJumps(state.labeledNonLocalBreaks!, /*isBreak*/ true, loopResultName, outerState, caseClauses);
                    processLabeledJumps(state.labeledNonLocalContinues!, /*isBreak*/ false, loopResultName, outerState, caseClauses);
                    statements.push(ts.createSwitch(loopResultName, ts.createCaseBlock(caseClauses)));
                }
            }
            return statements;
        }
        function setLabeledJump(state: ConvertedLoopState, isBreak: boolean, labelText: string, labelMarker: string): void {
            if (isBreak) {
                if (!state.labeledNonLocalBreaks) {
                    state.labeledNonLocalBreaks = ts.createMap<string>();
                }
                state.labeledNonLocalBreaks.set(labelText, labelMarker);
            }
            else {
                if (!state.labeledNonLocalContinues) {
                    state.labeledNonLocalContinues = ts.createMap<string>();
                }
                state.labeledNonLocalContinues.set(labelText, labelMarker);
            }
        }
        function processLabeledJumps(table: ts.Map<string>, isBreak: boolean, loopResultName: ts.Identifier, outerLoop: ConvertedLoopState | undefined, caseClauses: ts.CaseClause[]): void {
            if (!table) {
                return;
            }
            table.forEach((labelMarker, labelText) => {
                const statements: ts.Statement[] = [];
                // if there are no outer converted loop or outer label in question is located inside outer converted loop
                // then emit labeled break\continue
                // otherwise propagate pair 'label -> marker' to outer converted loop and emit 'return labelMarker' so outer loop can later decide what to do
                if (!outerLoop || (outerLoop.labels && outerLoop.labels.get(labelText))) {
                    const label = ts.createIdentifier(labelText);
                    statements.push(isBreak ? ts.createBreak(label) : ts.createContinue(label));
                }
                else {
                    setLabeledJump(outerLoop, isBreak, labelText, labelMarker);
                    statements.push(ts.createReturn(loopResultName));
                }
                caseClauses.push(ts.createCaseClause(ts.createLiteral(labelMarker), statements));
            });
        }
        function processLoopVariableDeclaration(container: ts.IterationStatement, decl: ts.VariableDeclaration | ts.BindingElement, loopParameters: ts.ParameterDeclaration[], loopOutParameters: LoopOutParameter[], hasCapturedBindingsInForInitializer: boolean) {
            const name = decl.name;
            if (ts.isBindingPattern(name)) {
                for (const element of name.elements) {
                    if (!ts.isOmittedExpression(element)) {
                        processLoopVariableDeclaration(container, element, loopParameters, loopOutParameters, hasCapturedBindingsInForInitializer);
                    }
                }
            }
            else {
                loopParameters.push(ts.createParameter(/*decorators*/ undefined, /*modifiers*/ undefined, /*dotDotDotToken*/ undefined, name));
                const checkFlags = resolver.getNodeCheckFlags(decl);
                if (checkFlags & ts.NodeCheckFlags.NeedsLoopOutParameter || hasCapturedBindingsInForInitializer) {
                    const outParamName = ts.createUniqueName("out_" + ts.idText(name));
                    let flags: LoopOutParameterFlags = 0;
                    if (checkFlags & ts.NodeCheckFlags.NeedsLoopOutParameter) {
                        flags |= LoopOutParameterFlags.Body;
                    }
                    if (ts.isForStatement(container) && container.initializer && resolver.isBindingCapturedByNode(container.initializer, decl)) {
                        flags |= LoopOutParameterFlags.Initializer;
                    }
                    loopOutParameters.push({ flags, originalName: name, outParamName });
                }
            }
        }
        /**
         * Adds the members of an object literal to an array of expressions.
         *
         * @param expressions An array of expressions.
         * @param node An ObjectLiteralExpression node.
         * @param receiver The receiver for members of the ObjectLiteralExpression.
         * @param numInitialNonComputedProperties The number of initial properties without
         *                                        computed property names.
         */
        function addObjectLiteralMembers(expressions: ts.Expression[], node: ts.ObjectLiteralExpression, receiver: ts.Identifier, start: number) {
            const properties = node.properties;
            const numProperties = properties.length;
            for (let i = start; i < numProperties; i++) {
                const property = properties[i];
                switch (property.kind) {
                    case ts.SyntaxKind.GetAccessor:
                    case ts.SyntaxKind.SetAccessor:
                        const accessors = ts.getAllAccessorDeclarations(node.properties, property);
                        if (property === accessors.firstAccessor) {
                            expressions.push(transformAccessorsToExpression(receiver, accessors, node, !!node.multiLine));
                        }
                        break;
                    case ts.SyntaxKind.MethodDeclaration:
                        expressions.push(transformObjectLiteralMethodDeclarationToExpression(property, receiver, node, node.multiLine!));
                        break;
                    case ts.SyntaxKind.PropertyAssignment:
                        expressions.push(transformPropertyAssignmentToExpression(property, receiver, node.multiLine!));
                        break;
                    case ts.SyntaxKind.ShorthandPropertyAssignment:
                        expressions.push(transformShorthandPropertyAssignmentToExpression(property, receiver, node.multiLine!));
                        break;
                    default:
                        ts.Debug.failBadSyntaxKind(node);
                        break;
                }
            }
        }
        /**
         * Transforms a PropertyAssignment node into an expression.
         *
         * @param node The ObjectLiteralExpression that contains the PropertyAssignment.
         * @param property The PropertyAssignment node.
         * @param receiver The receiver for the assignment.
         */
        function transformPropertyAssignmentToExpression(property: ts.PropertyAssignment, receiver: ts.Expression, startsOnNewLine: boolean) {
            const expression = ts.createAssignment(ts.createMemberAccessForPropertyName(receiver, ts.visitNode(property.name, visitor, ts.isPropertyName)), ts.visitNode(property.initializer, visitor, ts.isExpression));
            ts.setTextRange(expression, property);
            if (startsOnNewLine) {
                ts.startOnNewLine(expression);
            }
            return expression;
        }
        /**
         * Transforms a ShorthandPropertyAssignment node into an expression.
         *
         * @param node The ObjectLiteralExpression that contains the ShorthandPropertyAssignment.
         * @param property The ShorthandPropertyAssignment node.
         * @param receiver The receiver for the assignment.
         */
        function transformShorthandPropertyAssignmentToExpression(property: ts.ShorthandPropertyAssignment, receiver: ts.Expression, startsOnNewLine: boolean) {
            const expression = ts.createAssignment(ts.createMemberAccessForPropertyName(receiver, ts.visitNode(property.name, visitor, ts.isPropertyName)), ts.getSynthesizedClone(property.name));
            ts.setTextRange(expression, property);
            if (startsOnNewLine) {
                ts.startOnNewLine(expression);
            }
            return expression;
        }
        /**
         * Transforms a MethodDeclaration of an ObjectLiteralExpression into an expression.
         *
         * @param node The ObjectLiteralExpression that contains the MethodDeclaration.
         * @param method The MethodDeclaration node.
         * @param receiver The receiver for the assignment.
         */
        function transformObjectLiteralMethodDeclarationToExpression(method: ts.MethodDeclaration, receiver: ts.Expression, container: ts.Node, startsOnNewLine: boolean) {
            const expression = ts.createAssignment(ts.createMemberAccessForPropertyName(receiver, ts.visitNode(method.name, visitor, ts.isPropertyName)), transformFunctionLikeToExpression(method, /*location*/ method, /*name*/ undefined, container));
            ts.setTextRange(expression, method);
            if (startsOnNewLine) {
                ts.startOnNewLine(expression);
            }
            return expression;
        }
        function visitCatchClause(node: ts.CatchClause): ts.CatchClause {
            const ancestorFacts = enterSubtree(HierarchyFacts.BlockScopeExcludes, HierarchyFacts.BlockScopeIncludes);
            let updated: ts.CatchClause;
            ts.Debug.assert(!!node.variableDeclaration, "Catch clause variable should always be present when downleveling ES2015.");
            if (ts.isBindingPattern(node.variableDeclaration!.name)) {
                const temp = ts.createTempVariable(/*recordTempVariable*/ undefined);
                const newVariableDeclaration = ts.createVariableDeclaration(temp);
                ts.setTextRange(newVariableDeclaration, node.variableDeclaration);
                const vars = ts.flattenDestructuringBinding((node.variableDeclaration!), visitor, context, ts.FlattenLevel.All, temp);
                const list = ts.createVariableDeclarationList(vars);
                ts.setTextRange(list, node.variableDeclaration);
                const destructure = ts.createVariableStatement(/*modifiers*/ undefined, list);
                updated = ts.updateCatchClause(node, newVariableDeclaration, addStatementToStartOfBlock(node.block, destructure));
            }
            else {
                updated = ts.visitEachChild(node, visitor, context);
            }
            exitSubtree(ancestorFacts, HierarchyFacts.None, HierarchyFacts.None);
            return updated;
        }
        function addStatementToStartOfBlock(block: ts.Block, statement: ts.Statement): ts.Block {
            const transformedStatements = ts.visitNodes(block.statements, visitor, ts.isStatement);
            return ts.updateBlock(block, [statement, ...transformedStatements]);
        }
        /**
         * Visits a MethodDeclaration of an ObjectLiteralExpression and transforms it into a
         * PropertyAssignment.
         *
         * @param node A MethodDeclaration node.
         */
        function visitMethodDeclaration(node: ts.MethodDeclaration): ts.ObjectLiteralElementLike {
            // We should only get here for methods on an object literal with regular identifier names.
            // Methods on classes are handled in visitClassDeclaration/visitClassExpression.
            // Methods with computed property names are handled in visitObjectLiteralExpression.
            ts.Debug.assert(!ts.isComputedPropertyName(node.name));
            const functionExpression = transformFunctionLikeToExpression(node, /*location*/ ts.moveRangePos(node, -1), /*name*/ undefined, /*container*/ undefined);
            ts.setEmitFlags(functionExpression, ts.EmitFlags.NoLeadingComments | ts.getEmitFlags(functionExpression));
            return ts.setTextRange(ts.createPropertyAssignment(node.name, functionExpression), 
            /*location*/ node);
        }
        /**
         * Visits an AccessorDeclaration of an ObjectLiteralExpression.
         *
         * @param node An AccessorDeclaration node.
         */
        function visitAccessorDeclaration(node: ts.AccessorDeclaration): ts.AccessorDeclaration {
            ts.Debug.assert(!ts.isComputedPropertyName(node.name));
            const savedConvertedLoopState = convertedLoopState;
            convertedLoopState = undefined;
            const ancestorFacts = enterSubtree(HierarchyFacts.FunctionExcludes, HierarchyFacts.FunctionIncludes);
            let updated: ts.AccessorDeclaration;
            const parameters = ts.visitParameterList(node.parameters, visitor, context);
            const body = transformFunctionBody(node);
            if (node.kind === ts.SyntaxKind.GetAccessor) {
                updated = ts.updateGetAccessor(node, node.decorators, node.modifiers, node.name, parameters, node.type, body);
            }
            else {
                updated = ts.updateSetAccessor(node, node.decorators, node.modifiers, node.name, parameters, body);
            }
            exitSubtree(ancestorFacts, HierarchyFacts.FunctionSubtreeExcludes, HierarchyFacts.None);
            convertedLoopState = savedConvertedLoopState;
            return updated;
        }
        /**
         * Visits a ShorthandPropertyAssignment and transforms it into a PropertyAssignment.
         *
         * @param node A ShorthandPropertyAssignment node.
         */
        function visitShorthandPropertyAssignment(node: ts.ShorthandPropertyAssignment): ts.ObjectLiteralElementLike {
            return ts.setTextRange(ts.createPropertyAssignment(node.name, ts.getSynthesizedClone(node.name)), 
            /*location*/ node);
        }
        function visitComputedPropertyName(node: ts.ComputedPropertyName) {
            return ts.visitEachChild(node, visitor, context);
        }
        /**
         * Visits a YieldExpression node.
         *
         * @param node A YieldExpression node.
         */
        function visitYieldExpression(node: ts.YieldExpression): ts.Expression {
            // `yield` expressions are transformed using the generators transformer.
            return ts.visitEachChild(node, visitor, context);
        }
        /**
         * Visits an ArrayLiteralExpression that contains a spread element.
         *
         * @param node An ArrayLiteralExpression node.
         */
        function visitArrayLiteralExpression(node: ts.ArrayLiteralExpression): ts.Expression {
            if (ts.some(node.elements, ts.isSpreadElement)) {
                // We are here because we contain a SpreadElementExpression.
                return transformAndSpreadElements(node.elements, /*needsUniqueCopy*/ true, !!node.multiLine, /*hasTrailingComma*/ !!node.elements.hasTrailingComma);
            }
            return ts.visitEachChild(node, visitor, context);
        }
        /**
         * Visits a CallExpression that contains either a spread element or `super`.
         *
         * @param node a CallExpression.
         */
        function visitCallExpression(node: ts.CallExpression) {
            if (ts.getEmitFlags(node) & ts.EmitFlags.TypeScriptClassWrapper) {
                return visitTypeScriptClassWrapper(node);
            }
            const expression = ts.skipOuterExpressions(node.expression);
            if (expression.kind === ts.SyntaxKind.SuperKeyword ||
                ts.isSuperProperty(expression) ||
                ts.some(node.arguments, ts.isSpreadElement)) {
                return visitCallExpressionWithPotentialCapturedThisAssignment(node, /*assignToCapturedThis*/ true);
            }
            return ts.updateCall(node, ts.visitNode(node.expression, callExpressionVisitor, ts.isExpression), 
            /*typeArguments*/ undefined, ts.visitNodes(node.arguments, visitor, ts.isExpression));
        }
        function visitTypeScriptClassWrapper(node: ts.CallExpression) {
            // This is a call to a class wrapper function (an IIFE) created by the 'ts' transformer.
            // The wrapper has a form similar to:
            //
            //  (function() {
            //      class C { // 1
            //      }
            //      C.x = 1; // 2
            //      return C;
            //  }())
            //
            // When we transform the class, we end up with something like this:
            //
            //  (function () {
            //      var C = (function () { // 3
            //          function C() {
            //          }
            //          return C; // 4
            //      }());
            //      C.x = 1;
            //      return C;
            //  }())
            //
            // We want to simplify the two nested IIFEs to end up with something like this:
            //
            //  (function () {
            //      function C() {
            //      }
            //      C.x = 1;
            //      return C;
            //  }())
            // We skip any outer expressions in a number of places to get to the innermost
            // expression, but we will restore them later to preserve comments and source maps.
            const body = ts.cast(ts.cast(ts.skipOuterExpressions(node.expression), ts.isArrowFunction).body, ts.isBlock);
            // The class statements are the statements generated by visiting the first statement with initializer of the
            // body (1), while all other statements are added to remainingStatements (2)
            const isVariableStatementWithInitializer = (stmt: ts.Statement) => ts.isVariableStatement(stmt) && !!ts.first(stmt.declarationList.declarations).initializer;
            const bodyStatements = ts.visitNodes(body.statements, visitor, ts.isStatement);
            const classStatements = ts.filter(bodyStatements, isVariableStatementWithInitializer);
            const remainingStatements = ts.filter(bodyStatements, stmt => !isVariableStatementWithInitializer(stmt));
            const varStatement = ts.cast(ts.first(classStatements), ts.isVariableStatement);
            // We know there is only one variable declaration here as we verified this in an
            // earlier call to isTypeScriptClassWrapper
            const variable = varStatement.declarationList.declarations[0];
            const initializer = ts.skipOuterExpressions((variable.initializer!));
            // Under certain conditions, the 'ts' transformer may introduce a class alias, which
            // we see as an assignment, for example:
            //
            //  (function () {
            //      var C_1;
            //      var C = C_1 = (function () {
            //          function C() {
            //          }
            //          C.x = function () { return C_1; }
            //          return C;
            //      }());
            //      C = C_1 = __decorate([dec], C);
            //      return C;
            //  }())
            //
            const aliasAssignment = ts.tryCast(initializer, ts.isAssignmentExpression);
            // The underlying call (3) is another IIFE that may contain a '_super' argument.
            const call = ts.cast(aliasAssignment ? ts.skipOuterExpressions(aliasAssignment.right) : initializer, ts.isCallExpression);
            const func = ts.cast(ts.skipOuterExpressions(call.expression), ts.isFunctionExpression);
            const funcStatements = func.body.statements;
            let classBodyStart = 0;
            let classBodyEnd = -1;
            const statements: ts.Statement[] = [];
            if (aliasAssignment) {
                // If we have a class alias assignment, we need to move it to the down-level constructor
                // function we generated for the class.
                const extendsCall = ts.tryCast(funcStatements[classBodyStart], ts.isExpressionStatement);
                if (extendsCall) {
                    statements.push(extendsCall);
                    classBodyStart++;
                }
                // The next statement is the function declaration.
                statements.push(funcStatements[classBodyStart]);
                classBodyStart++;
                // Add the class alias following the declaration.
                statements.push(ts.createExpressionStatement(ts.createAssignment(aliasAssignment.left, ts.cast(variable.name, ts.isIdentifier))));
            }
            // Find the trailing 'return' statement (4)
            while (!ts.isReturnStatement((ts.elementAt(funcStatements, classBodyEnd)!))) {
                classBodyEnd--;
            }
            // When we extract the statements of the inner IIFE, we exclude the 'return' statement (4)
            // as we already have one that has been introduced by the 'ts' transformer.
            ts.addRange(statements, funcStatements, classBodyStart, classBodyEnd);
            if (classBodyEnd < -1) {
                // If there were any hoisted declarations following the return statement, we should
                // append them.
                ts.addRange(statements, funcStatements, classBodyEnd + 1);
            }
            // Add the remaining statements of the outer wrapper.
            ts.addRange(statements, remainingStatements);
            // The 'es2015' class transform may add an end-of-declaration marker. If so we will add it
            // after the remaining statements from the 'ts' transformer.
            ts.addRange(statements, classStatements, /*start*/ 1);
            // Recreate any outer parentheses or partially-emitted expressions to preserve source map
            // and comment locations.
            return ts.recreateOuterExpressions(node.expression, ts.recreateOuterExpressions(variable.initializer, ts.recreateOuterExpressions(aliasAssignment && aliasAssignment.right, ts.updateCall(call, ts.recreateOuterExpressions(call.expression, ts.updateFunctionExpression(func, 
            /*modifiers*/ undefined, 
            /*asteriskToken*/ undefined, 
            /*name*/ undefined, 
            /*typeParameters*/ undefined, func.parameters, 
            /*type*/ undefined, ts.updateBlock(func.body, statements))), 
            /*typeArguments*/ undefined, call.arguments))));
        }
        function visitImmediateSuperCallInBody(node: ts.CallExpression) {
            return visitCallExpressionWithPotentialCapturedThisAssignment(node, /*assignToCapturedThis*/ false);
        }
        function visitCallExpressionWithPotentialCapturedThisAssignment(node: ts.CallExpression, assignToCapturedThis: boolean): ts.CallExpression | ts.BinaryExpression {
            // We are here either because SuperKeyword was used somewhere in the expression, or
            // because we contain a SpreadElementExpression.
            if (node.transformFlags & ts.TransformFlags.ContainsRestOrSpread ||
                node.expression.kind === ts.SyntaxKind.SuperKeyword ||
                ts.isSuperProperty(ts.skipOuterExpressions(node.expression))) {
                const { target, thisArg } = ts.createCallBinding(node.expression, hoistVariableDeclaration);
                if (node.expression.kind === ts.SyntaxKind.SuperKeyword) {
                    ts.setEmitFlags(thisArg, ts.EmitFlags.NoSubstitution);
                }
                let resultingCall: ts.CallExpression | ts.BinaryExpression;
                if (node.transformFlags & ts.TransformFlags.ContainsRestOrSpread) {
                    // [source]
                    //      f(...a, b)
                    //      x.m(...a, b)
                    //      super(...a, b)
                    //      super.m(...a, b) // in static
                    //      super.m(...a, b) // in instance
                    //
                    // [output]
                    //      f.apply(void 0, a.concat([b]))
                    //      (_a = x).m.apply(_a, a.concat([b]))
                    //      _super.apply(this, a.concat([b]))
                    //      _super.m.apply(this, a.concat([b]))
                    //      _super.prototype.m.apply(this, a.concat([b]))
                    resultingCall = ts.createFunctionApply(ts.visitNode(target, callExpressionVisitor, ts.isExpression), node.expression.kind === ts.SyntaxKind.SuperKeyword ? thisArg : ts.visitNode(thisArg, visitor, ts.isExpression), transformAndSpreadElements(node.arguments, /*needsUniqueCopy*/ false, /*multiLine*/ false, /*hasTrailingComma*/ false));
                }
                else {
                    // [source]
                    //      super(a)
                    //      super.m(a) // in static
                    //      super.m(a) // in instance
                    //
                    // [output]
                    //      _super.call(this, a)
                    //      _super.m.call(this, a)
                    //      _super.prototype.m.call(this, a)
                    resultingCall = ts.createFunctionCall(ts.visitNode(target, callExpressionVisitor, ts.isExpression), node.expression.kind === ts.SyntaxKind.SuperKeyword ? thisArg : ts.visitNode(thisArg, visitor, ts.isExpression), ts.visitNodes(node.arguments, visitor, ts.isExpression), 
                    /*location*/ node);
                }
                if (node.expression.kind === ts.SyntaxKind.SuperKeyword) {
                    const initializer = ts.createLogicalOr(resultingCall, createActualThis());
                    resultingCall = assignToCapturedThis
                        ? ts.createAssignment(ts.createFileLevelUniqueName("_this"), initializer)
                        : initializer;
                }
                return ts.setOriginalNode(resultingCall, node);
            }
            return ts.visitEachChild(node, visitor, context);
        }
        /**
         * Visits a NewExpression that contains a spread element.
         *
         * @param node A NewExpression node.
         */
        function visitNewExpression(node: ts.NewExpression): ts.LeftHandSideExpression {
            if (ts.some(node.arguments, ts.isSpreadElement)) {
                // We are here because we contain a SpreadElementExpression.
                // [source]
                //      new C(...a)
                //
                // [output]
                //      new ((_a = C).bind.apply(_a, [void 0].concat(a)))()
                const { target, thisArg } = ts.createCallBinding(ts.createPropertyAccess(node.expression, "bind"), hoistVariableDeclaration);
                return ts.createNew(ts.createFunctionApply(ts.visitNode(target, visitor, ts.isExpression), thisArg, transformAndSpreadElements(ts.createNodeArray([ts.createVoidZero(), ...node.arguments!]), /*needsUniqueCopy*/ false, /*multiLine*/ false, /*hasTrailingComma*/ false)), 
                /*typeArguments*/ undefined, []);
            }
            return ts.visitEachChild(node, visitor, context);
        }
        /**
         * Transforms an array of Expression nodes that contains a SpreadExpression.
         *
         * @param elements The array of Expression nodes.
         * @param needsUniqueCopy A value indicating whether to ensure that the result is a fresh array.
         * @param multiLine A value indicating whether the result should be emitted on multiple lines.
         */
        function transformAndSpreadElements(elements: ts.NodeArray<ts.Expression>, needsUniqueCopy: boolean, multiLine: boolean, hasTrailingComma: boolean): ts.Expression {
            // [source]
            //      [a, ...b, c]
            //
            // [output (downlevelIteration)]
            //      __spread([a], b, [c])
            //
            // [output]
            //      __spreadArrays([a], b, [c])
            // Map spans of spread expressions into their expressions and spans of other
            // expressions into an array literal.
            const numElements = elements.length;
            const segments = ts.flatten<ts.Expression>(ts.spanMap(elements, partitionSpread, (partition, visitPartition, _start, end) => visitPartition(partition, multiLine, hasTrailingComma && end === numElements)));
            if (compilerOptions.downlevelIteration) {
                if (segments.length === 1) {
                    const firstSegment = segments[0];
                    if (isCallToHelper(firstSegment, ("___spread" as ts.__String))) {
                        return segments[0];
                    }
                }
                return ts.createSpreadHelper(context, segments);
            }
            else {
                if (segments.length === 1) {
                    const firstSegment = segments[0];
                    if (!needsUniqueCopy
                        || isPackedArrayLiteral(firstSegment)
                        || isCallToHelper(firstSegment, ("___spreadArrays" as ts.__String))) {
                        return segments[0];
                    }
                }
                return ts.createSpreadArraysHelper(context, segments);
            }
        }
        function isPackedElement(node: ts.Expression) {
            return !ts.isOmittedExpression(node);
        }
        function isPackedArrayLiteral(node: ts.Expression) {
            return ts.isArrayLiteralExpression(node) && ts.every(node.elements, isPackedElement);
        }
        function isCallToHelper(firstSegment: ts.Expression, helperName: ts.__String) {
            return ts.isCallExpression(firstSegment)
                && ts.isIdentifier(firstSegment.expression)
                && (ts.getEmitFlags(firstSegment.expression) & ts.EmitFlags.HelperName)
                && firstSegment.expression.escapedText === helperName;
        }
        function partitionSpread(node: ts.Expression) {
            return ts.isSpreadElement(node)
                ? visitSpanOfSpreads
                : visitSpanOfNonSpreads;
        }
        function visitSpanOfSpreads(chunk: ts.Expression[]): ts.VisitResult<ts.Expression> {
            return ts.map(chunk, visitExpressionOfSpread);
        }
        function visitSpanOfNonSpreads(chunk: ts.Expression[], multiLine: boolean, hasTrailingComma: boolean): ts.VisitResult<ts.Expression> {
            return ts.createArrayLiteral(ts.visitNodes(ts.createNodeArray(chunk, hasTrailingComma), visitor, ts.isExpression), multiLine);
        }
        function visitSpreadElement(node: ts.SpreadElement) {
            return ts.visitNode(node.expression, visitor, ts.isExpression);
        }
        /**
         * Transforms the expression of a SpreadExpression node.
         *
         * @param node A SpreadExpression node.
         */
        function visitExpressionOfSpread(node: ts.SpreadElement) {
            return ts.visitNode(node.expression, visitor, ts.isExpression);
        }
        /**
         * Visits a template literal.
         *
         * @param node A template literal.
         */
        function visitTemplateLiteral(node: ts.LiteralExpression): ts.LeftHandSideExpression {
            return ts.setTextRange(ts.createLiteral(node.text), node);
        }
        /**
         * Visits a string literal with an extended unicode escape.
         *
         * @param node A string literal.
         */
        function visitStringLiteral(node: ts.StringLiteral) {
            if (node.hasExtendedUnicodeEscape) {
                return ts.setTextRange(ts.createLiteral(node.text), node);
            }
            return node;
        }
        /**
         * Visits a binary or octal (ES6) numeric literal.
         *
         * @param node A string literal.
         */
        function visitNumericLiteral(node: ts.NumericLiteral) {
            if (node.numericLiteralFlags & ts.TokenFlags.BinaryOrOctalSpecifier) {
                return ts.setTextRange(ts.createNumericLiteral(node.text), node);
            }
            return node;
        }
        /**
         * Visits a TaggedTemplateExpression node.
         *
         * @param node A TaggedTemplateExpression node.
         */
        function visitTaggedTemplateExpression(node: ts.TaggedTemplateExpression) {
            // Visit the tag expression
            const tag = ts.visitNode(node.tag, visitor, ts.isExpression);
            // Build up the template arguments and the raw and cooked strings for the template.
            // We start out with 'undefined' for the first argument and revisit later
            // to avoid walking over the template string twice and shifting all our arguments over after the fact.
            const templateArguments: ts.Expression[] = [undefined!];
            const cookedStrings: ts.Expression[] = [];
            const rawStrings: ts.Expression[] = [];
            const template = node.template;
            if (ts.isNoSubstitutionTemplateLiteral(template)) {
                cookedStrings.push(ts.createLiteral(template.text));
                rawStrings.push(getRawLiteral(template));
            }
            else {
                cookedStrings.push(ts.createLiteral(template.head.text));
                rawStrings.push(getRawLiteral(template.head));
                for (const templateSpan of template.templateSpans) {
                    cookedStrings.push(ts.createLiteral(templateSpan.literal.text));
                    rawStrings.push(getRawLiteral(templateSpan.literal));
                    templateArguments.push(ts.visitNode(templateSpan.expression, visitor, ts.isExpression));
                }
            }
            const helperCall = createTemplateObjectHelper(context, ts.createArrayLiteral(cookedStrings), ts.createArrayLiteral(rawStrings));
            // Create a variable to cache the template object if we're in a module.
            // Do not do this in the global scope, as any variable we currently generate could conflict with
            // variables from outside of the current compilation. In the future, we can revisit this behavior.
            if (ts.isExternalModule(currentSourceFile)) {
                const tempVar = ts.createUniqueName("templateObject");
                recordTaggedTemplateString(tempVar);
                templateArguments[0] = ts.createLogicalOr(tempVar, ts.createAssignment(tempVar, helperCall));
            }
            else {
                templateArguments[0] = helperCall;
            }
            return ts.createCall(tag, /*typeArguments*/ undefined, templateArguments);
        }
        /**
         * Creates an ES5 compatible literal from an ES6 template literal.
         *
         * @param node The ES6 template literal.
         */
        function getRawLiteral(node: ts.TemplateLiteralLikeNode) {
            // Find original source text, since we need to emit the raw strings of the tagged template.
            // The raw strings contain the (escaped) strings of what the user wrote.
            // Examples: `\n` is converted to "\\n", a template string with a newline to "\n".
            let text = node.rawText;
            if (text === undefined) {
                text = ts.getSourceTextOfNodeFromSourceFile(currentSourceFile, node);
                // text contains the original source, it will also contain quotes ("`"), dolar signs and braces ("${" and "}"),
                // thus we need to remove those characters.
                // First template piece starts with "`", others with "}"
                // Last template piece ends with "`", others with "${"
                const isLast = node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral || node.kind === ts.SyntaxKind.TemplateTail;
                text = text.substring(1, text.length - (isLast ? 1 : 2));
            }
            // Newline normalization:
            // ES6 Spec 11.8.6.1 - Static Semantics of TV's and TRV's
            // <CR><LF> and <CR> LineTerminatorSequences are normalized to <LF> for both TV and TRV.
            text = text.replace(/\r\n?/g, "\n");
            return ts.setTextRange(ts.createLiteral(text), node);
        }
        /**
         * Visits a TemplateExpression node.
         *
         * @param node A TemplateExpression node.
         */
        function visitTemplateExpression(node: ts.TemplateExpression): ts.Expression {
            const expressions: ts.Expression[] = [];
            addTemplateHead(expressions, node);
            addTemplateSpans(expressions, node);
            // createAdd will check if each expression binds less closely than binary '+'.
            // If it does, it wraps the expression in parentheses. Otherwise, something like
            //    `abc${ 1 << 2 }`
            // becomes
            //    "abc" + 1 << 2 + ""
            // which is really
            //    ("abc" + 1) << (2 + "")
            // rather than
            //    "abc" + (1 << 2) + ""
            const expression = (ts.reduceLeft(expressions, ts.createAdd)!);
            if (ts.nodeIsSynthesized(expression)) {
                expression.pos = node.pos;
                expression.end = node.end;
            }
            return expression;
        }
        /**
         * Gets a value indicating whether we need to include the head of a TemplateExpression.
         *
         * @param node A TemplateExpression node.
         */
        function shouldAddTemplateHead(node: ts.TemplateExpression) {
            // If this expression has an empty head literal and the first template span has a non-empty
            // literal, then emitting the empty head literal is not necessary.
            //     `${ foo } and ${ bar }`
            // can be emitted as
            //     foo + " and " + bar
            // This is because it is only required that one of the first two operands in the emit
            // output must be a string literal, so that the other operand and all following operands
            // are forced into strings.
            //
            // If the first template span has an empty literal, then the head must still be emitted.
            //     `${ foo }${ bar }`
            // must still be emitted as
            //     "" + foo + bar
            // There is always atleast one templateSpan in this code path, since
            // NoSubstitutionTemplateLiterals are directly emitted via emitLiteral()
            ts.Debug.assert(node.templateSpans.length !== 0);
            return node.head.text.length !== 0 || node.templateSpans[0].literal.text.length === 0;
        }
        /**
         * Adds the head of a TemplateExpression to an array of expressions.
         *
         * @param expressions An array of expressions.
         * @param node A TemplateExpression node.
         */
        function addTemplateHead(expressions: ts.Expression[], node: ts.TemplateExpression): void {
            if (!shouldAddTemplateHead(node)) {
                return;
            }
            expressions.push(ts.createLiteral(node.head.text));
        }
        /**
         * Visits and adds the template spans of a TemplateExpression to an array of expressions.
         *
         * @param expressions An array of expressions.
         * @param node A TemplateExpression node.
         */
        function addTemplateSpans(expressions: ts.Expression[], node: ts.TemplateExpression): void {
            for (const span of node.templateSpans) {
                expressions.push(ts.visitNode(span.expression, visitor, ts.isExpression));
                // Only emit if the literal is non-empty.
                // The binary '+' operator is left-associative, so the first string concatenation
                // with the head will force the result up to this point to be a string.
                // Emitting a '+ ""' has no semantic effect for middles and tails.
                if (span.literal.text.length !== 0) {
                    expressions.push(ts.createLiteral(span.literal.text));
                }
            }
        }
        /**
         * Visits the `super` keyword
         */
        function visitSuperKeyword(isExpressionOfCall: boolean): ts.LeftHandSideExpression {
            return hierarchyFacts & HierarchyFacts.NonStaticClassElement && !isExpressionOfCall ? ts.createPropertyAccess(ts.createFileLevelUniqueName("_super"), "prototype") :
                ts.createFileLevelUniqueName("_super");
        }
        function visitMetaProperty(node: ts.MetaProperty) {
            if (node.keywordToken === ts.SyntaxKind.NewKeyword && node.name.escapedText === "target") {
                hierarchyFacts |= HierarchyFacts.NewTarget;
                return ts.createFileLevelUniqueName("_newTarget");
            }
            return node;
        }
        /**
         * Called by the printer just before a node is printed.
         *
         * @param hint A hint as to the intended usage of the node.
         * @param node The node to be printed.
         * @param emitCallback The callback used to emit the node.
         */
        function onEmitNode(hint: ts.EmitHint, node: ts.Node, emitCallback: (hint: ts.EmitHint, node: ts.Node) => void) {
            if (enabledSubstitutions & ES2015SubstitutionFlags.CapturedThis && ts.isFunctionLike(node)) {
                // If we are tracking a captured `this`, keep track of the enclosing function.
                const ancestorFacts = enterSubtree(HierarchyFacts.FunctionExcludes, ts.getEmitFlags(node) & ts.EmitFlags.CapturesThis
                    ? HierarchyFacts.FunctionIncludes | HierarchyFacts.CapturesThis
                    : HierarchyFacts.FunctionIncludes);
                previousOnEmitNode(hint, node, emitCallback);
                exitSubtree(ancestorFacts, HierarchyFacts.None, HierarchyFacts.None);
                return;
            }
            previousOnEmitNode(hint, node, emitCallback);
        }
        /**
         * Enables a more costly code path for substitutions when we determine a source file
         * contains block-scoped bindings (e.g. `let` or `const`).
         */
        function enableSubstitutionsForBlockScopedBindings() {
            if ((enabledSubstitutions & ES2015SubstitutionFlags.BlockScopedBindings) === 0) {
                enabledSubstitutions |= ES2015SubstitutionFlags.BlockScopedBindings;
                context.enableSubstitution(ts.SyntaxKind.Identifier);
            }
        }
        /**
         * Enables a more costly code path for substitutions when we determine a source file
         * contains a captured `this`.
         */
        function enableSubstitutionsForCapturedThis() {
            if ((enabledSubstitutions & ES2015SubstitutionFlags.CapturedThis) === 0) {
                enabledSubstitutions |= ES2015SubstitutionFlags.CapturedThis;
                context.enableSubstitution(ts.SyntaxKind.ThisKeyword);
                context.enableEmitNotification(ts.SyntaxKind.Constructor);
                context.enableEmitNotification(ts.SyntaxKind.MethodDeclaration);
                context.enableEmitNotification(ts.SyntaxKind.GetAccessor);
                context.enableEmitNotification(ts.SyntaxKind.SetAccessor);
                context.enableEmitNotification(ts.SyntaxKind.ArrowFunction);
                context.enableEmitNotification(ts.SyntaxKind.FunctionExpression);
                context.enableEmitNotification(ts.SyntaxKind.FunctionDeclaration);
            }
        }
        /**
         * Hooks node substitutions.
         *
         * @param hint The context for the emitter.
         * @param node The node to substitute.
         */
        function onSubstituteNode(hint: ts.EmitHint, node: ts.Node) {
            node = previousOnSubstituteNode(hint, node);
            if (hint === ts.EmitHint.Expression) {
                return substituteExpression(node);
            }
            if (ts.isIdentifier(node)) {
                return substituteIdentifier(node);
            }
            return node;
        }
        /**
         * Hooks substitutions for non-expression identifiers.
         */
        function substituteIdentifier(node: ts.Identifier) {
            // Only substitute the identifier if we have enabled substitutions for block-scoped
            // bindings.
            if (enabledSubstitutions & ES2015SubstitutionFlags.BlockScopedBindings && !ts.isInternalName(node)) {
                const original = ts.getParseTreeNode(node, ts.isIdentifier);
                if (original && isNameOfDeclarationWithCollidingName(original)) {
                    return ts.setTextRange(ts.getGeneratedNameForNode(original), node);
                }
            }
            return node;
        }
        /**
         * Determines whether a name is the name of a declaration with a colliding name.
         * NOTE: This function expects to be called with an original source tree node.
         *
         * @param node An original source tree node.
         */
        function isNameOfDeclarationWithCollidingName(node: ts.Identifier) {
            switch (node.parent.kind) {
                case ts.SyntaxKind.BindingElement:
                case ts.SyntaxKind.ClassDeclaration:
                case ts.SyntaxKind.EnumDeclaration:
                case ts.SyntaxKind.VariableDeclaration:
                    return (<ts.NamedDeclaration>node.parent).name === node
                        && resolver.isDeclarationWithCollidingName((<ts.Declaration>node.parent));
            }
            return false;
        }
        /**
         * Substitutes an expression.
         *
         * @param node An Expression node.
         */
        function substituteExpression(node: ts.Node) {
            switch (node.kind) {
                case ts.SyntaxKind.Identifier:
                    return substituteExpressionIdentifier((<ts.Identifier>node));
                case ts.SyntaxKind.ThisKeyword:
                    return substituteThisKeyword((<ts.PrimaryExpression>node));
            }
            return node;
        }
        /**
         * Substitutes an expression identifier.
         *
         * @param node An Identifier node.
         */
        function substituteExpressionIdentifier(node: ts.Identifier): ts.Identifier {
            if (enabledSubstitutions & ES2015SubstitutionFlags.BlockScopedBindings && !ts.isInternalName(node)) {
                const declaration = resolver.getReferencedDeclarationWithCollidingName(node);
                if (declaration && !(ts.isClassLike(declaration) && isPartOfClassBody(declaration, node))) {
                    return ts.setTextRange(ts.getGeneratedNameForNode(ts.getNameOfDeclaration(declaration)), node);
                }
            }
            return node;
        }
        function isPartOfClassBody(declaration: ts.ClassLikeDeclaration, node: ts.Identifier) {
            let currentNode: ts.Node | undefined = ts.getParseTreeNode(node);
            if (!currentNode || currentNode === declaration || currentNode.end <= declaration.pos || currentNode.pos >= declaration.end) {
                // if the node has no correlation to a parse tree node, its definitely not
                // part of the body.
                // if the node is outside of the document range of the declaration, its
                // definitely not part of the body.
                return false;
            }
            const blockScope = ts.getEnclosingBlockScopeContainer(declaration);
            while (currentNode) {
                if (currentNode === blockScope || currentNode === declaration) {
                    // if we are in the enclosing block scope of the declaration, we are definitely
                    // not inside the class body.
                    return false;
                }
                if (ts.isClassElement(currentNode) && currentNode.parent === declaration) {
                    return true;
                }
                currentNode = currentNode.parent;
            }
            return false;
        }
        /**
         * Substitutes `this` when contained within an arrow function.
         *
         * @param node The ThisKeyword node.
         */
        function substituteThisKeyword(node: ts.PrimaryExpression): ts.PrimaryExpression {
            if (enabledSubstitutions & ES2015SubstitutionFlags.CapturedThis
                && hierarchyFacts & HierarchyFacts.CapturesThis) {
                return ts.setTextRange(ts.createFileLevelUniqueName("_this"), node);
            }
            return node;
        }
        function getClassMemberPrefix(node: ts.ClassExpression | ts.ClassDeclaration, member: ts.ClassElement) {
            return ts.hasModifier(member, ts.ModifierFlags.Static)
                ? ts.getInternalName(node)
                : ts.createPropertyAccess(ts.getInternalName(node), "prototype");
        }
        function hasSynthesizedDefaultSuperCall(constructor: ts.ConstructorDeclaration | undefined, hasExtendsClause: boolean) {
            if (!constructor || !hasExtendsClause) {
                return false;
            }
            if (ts.some(constructor.parameters)) {
                return false;
            }
            const statement = ts.firstOrUndefined(constructor.body!.statements);
            if (!statement || !ts.nodeIsSynthesized(statement) || statement.kind !== ts.SyntaxKind.ExpressionStatement) {
                return false;
            }
            const statementExpression = (<ts.ExpressionStatement>statement).expression;
            if (!ts.nodeIsSynthesized(statementExpression) || statementExpression.kind !== ts.SyntaxKind.CallExpression) {
                return false;
            }
            const callTarget = (<ts.CallExpression>statementExpression).expression;
            if (!ts.nodeIsSynthesized(callTarget) || callTarget.kind !== ts.SyntaxKind.SuperKeyword) {
                return false;
            }
            const callArgument = ts.singleOrUndefined((<ts.CallExpression>statementExpression).arguments);
            if (!callArgument || !ts.nodeIsSynthesized(callArgument) || callArgument.kind !== ts.SyntaxKind.SpreadElement) {
                return false;
            }
            const expression = (<ts.SpreadElement>callArgument).expression;
            return ts.isIdentifier(expression) && expression.escapedText === "arguments";
        }
    }
    function createExtendsHelper(context: ts.TransformationContext, name: ts.Identifier) {
        context.requestEmitHelper(extendsHelper);
        return ts.createCall(ts.getUnscopedHelperName("__extends"), 
        /*typeArguments*/ undefined, [
            name,
            ts.createFileLevelUniqueName("_super")
        ]);
    }
    function createTemplateObjectHelper(context: ts.TransformationContext, cooked: ts.ArrayLiteralExpression, raw: ts.ArrayLiteralExpression) {
        context.requestEmitHelper(templateObjectHelper);
        return ts.createCall(ts.getUnscopedHelperName("__makeTemplateObject"), 
        /*typeArguments*/ undefined, [
            cooked,
            raw
        ]);
    }
    export const extendsHelper: ts.UnscopedEmitHelper = {
        name: "typescript:extends",
        importName: "__extends",
        scoped: false,
        priority: 0,
        text: `
            var __extends = (this && this.__extends) || (function () {
                var extendStatics = function (d, b) {
                    extendStatics = Object.setPrototypeOf ||
                        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
                    return extendStatics(d, b);
                };

                return function (d, b) {
                    extendStatics(d, b);
                    function __() { this.constructor = d; }
                    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
                };
            })();`
    };
    export const templateObjectHelper: ts.UnscopedEmitHelper = {
        name: "typescript:makeTemplateObject",
        importName: "__makeTemplateObject",
        scoped: false,
        priority: 0,
        text: `
            var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
                if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
                return cooked;
            };`
    };
}
