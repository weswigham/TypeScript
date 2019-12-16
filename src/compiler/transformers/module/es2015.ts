/*@internal*/
namespace ts {
    export function transformES2015Module(context: ts.TransformationContext) {
        const compilerOptions = context.getCompilerOptions();
        const previousOnEmitNode = context.onEmitNode;
        const previousOnSubstituteNode = context.onSubstituteNode;
        context.onEmitNode = onEmitNode;
        context.onSubstituteNode = onSubstituteNode;
        context.enableEmitNotification(ts.SyntaxKind.SourceFile);
        context.enableSubstitution(ts.SyntaxKind.Identifier);
        let helperNameSubstitutions: ts.Map<ts.Identifier> | undefined;
        return ts.chainBundle(transformSourceFile);
        function transformSourceFile(node: ts.SourceFile) {
            if (node.isDeclarationFile) {
                return node;
            }
            if (ts.isExternalModule(node) || compilerOptions.isolatedModules) {
                const externalHelpersImportDeclaration = ts.createExternalHelpersImportDeclarationIfNeeded(node, compilerOptions);
                if (externalHelpersImportDeclaration) {
                    const statements: ts.Statement[] = [];
                    const statementOffset = ts.addPrologue(statements, node.statements);
                    ts.append(statements, externalHelpersImportDeclaration);
                    ts.addRange(statements, ts.visitNodes(node.statements, visitor, ts.isStatement, statementOffset));
                    return ts.updateSourceFileNode(node, ts.setTextRange(ts.createNodeArray(statements), node.statements));
                }
                else {
                    return ts.visitEachChild(node, visitor, context);
                }
            }
            return node;
        }
        function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
            switch (node.kind) {
                case ts.SyntaxKind.ImportEqualsDeclaration:
                    // Elide `import=` as it is not legal with --module ES6
                    return undefined;
                case ts.SyntaxKind.ExportAssignment:
                    return visitExportAssignment((<ts.ExportAssignment>node));
            }
            return node;
        }
        function visitExportAssignment(node: ts.ExportAssignment): ts.VisitResult<ts.ExportAssignment> {
            // Elide `export=` as it is not legal with --module ES6
            return node.isExportEquals ? undefined : node;
        }
        //
        // Emit Notification
        //
        /**
         * Hook for node emit.
         *
         * @param hint A hint as to the intended usage of the node.
         * @param node The node to emit.
         * @param emit A callback used to emit the node in the printer.
         */
        function onEmitNode(hint: ts.EmitHint, node: ts.Node, emitCallback: (hint: ts.EmitHint, node: ts.Node) => void): void {
            if (ts.isSourceFile(node)) {
                helperNameSubstitutions = ts.createMap<ts.Identifier>();
                previousOnEmitNode(hint, node, emitCallback);
                helperNameSubstitutions = undefined;
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
            if (helperNameSubstitutions && ts.isIdentifier(node) && ts.getEmitFlags(node) & ts.EmitFlags.HelperName) {
                return substituteHelperName(node);
            }
            return node;
        }
        function substituteHelperName(node: ts.Identifier): ts.Expression {
            const name = ts.idText(node);
            let substitution = helperNameSubstitutions!.get(name);
            if (!substitution) {
                helperNameSubstitutions!.set(name, substitution = ts.createFileLevelUniqueName(name));
            }
            return substitution;
        }
    }
}
