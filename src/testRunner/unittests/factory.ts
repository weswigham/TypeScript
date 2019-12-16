namespace ts {
    describe("unittests:: FactoryAPI", () => {
        function assertSyntaxKind(node: ts.Node, expected: ts.SyntaxKind) {
            assert.strictEqual(node.kind, expected, `Actual: ${ts.Debug.formatSyntaxKind(node.kind)} Expected: ${ts.Debug.formatSyntaxKind(expected)}`);
        }
        describe("createExportAssignment", () => {
            it("parenthesizes default export if necessary", () => {
                function checkExpression(expression: ts.Expression) {
                    const node = ts.createExportAssignment(
                    /*decorators*/ undefined, 
                    /*modifiers*/ undefined, 
                    /*isExportEquals*/ false, expression);
                    assertSyntaxKind(node.expression, ts.SyntaxKind.ParenthesizedExpression);
                }
                const clazz = ts.createClassExpression(/*modifiers*/ undefined, "C", /*typeParameters*/ undefined, /*heritageClauses*/ undefined, [
                    ts.createProperty(/*decorators*/ undefined, [ts.createToken(ts.SyntaxKind.StaticKeyword)], "prop", /*questionOrExclamationToken*/ undefined, /*type*/ undefined, ts.createLiteral("1")),
                ]);
                checkExpression(clazz);
                checkExpression(ts.createPropertyAccess(clazz, "prop"));
                const func = ts.createFunctionExpression(/*modifiers*/ undefined, /*asteriskToken*/ undefined, "fn", /*typeParameters*/ undefined, /*parameters*/ undefined, /*type*/ undefined, ts.createBlock([]));
                checkExpression(func);
                checkExpression(ts.createCall(func, /*typeArguments*/ undefined, /*argumentsArray*/ undefined));
                checkExpression(ts.createTaggedTemplate(func, ts.createNoSubstitutionTemplateLiteral("")));
                checkExpression(ts.createBinary(ts.createLiteral("a"), ts.SyntaxKind.CommaToken, ts.createLiteral("b")));
                checkExpression(ts.createCommaList([ts.createLiteral("a"), ts.createLiteral("b")]));
            });
        });
        describe("createArrowFunction", () => {
            it("parenthesizes concise body if necessary", () => {
                function checkBody(body: ts.ConciseBody) {
                    const node = ts.createArrowFunction(
                    /*modifiers*/ undefined, 
                    /*typeParameters*/ undefined, [], 
                    /*type*/ undefined, 
                    /*equalsGreaterThanToken*/ undefined, body);
                    assertSyntaxKind(node.body, ts.SyntaxKind.ParenthesizedExpression);
                }
                checkBody(ts.createObjectLiteral());
                checkBody(ts.createPropertyAccess(ts.createObjectLiteral(), "prop"));
                checkBody(ts.createAsExpression(ts.createPropertyAccess(ts.createObjectLiteral(), "prop"), ts.createTypeReferenceNode("T", /*typeArguments*/ undefined)));
                checkBody(ts.createNonNullExpression(ts.createPropertyAccess(ts.createObjectLiteral(), "prop")));
                checkBody(ts.createCommaList([ts.createLiteral("a"), ts.createLiteral("b")]));
                checkBody(ts.createBinary(ts.createLiteral("a"), ts.SyntaxKind.CommaToken, ts.createLiteral("b")));
            });
        });
        describe("createBinaryExpression", () => {
            it("parenthesizes arrow function in RHS if necessary", () => {
                const lhs = ts.createIdentifier("foo");
                const rhs = ts.createArrowFunction(
                /*modifiers*/ undefined, 
                /*typeParameters*/ undefined, [], 
                /*type*/ undefined, 
                /*equalsGreaterThanToken*/ undefined, ts.createBlock([]));
                function checkRhs(operator: ts.BinaryOperator, expectParens: boolean) {
                    const node = ts.createBinary(lhs, operator, rhs);
                    assertSyntaxKind(node.right, expectParens ? ts.SyntaxKind.ParenthesizedExpression : ts.SyntaxKind.ArrowFunction);
                }
                checkRhs(ts.SyntaxKind.CommaToken, /*expectParens*/ false);
                checkRhs(ts.SyntaxKind.EqualsToken, /*expectParens*/ false);
                checkRhs(ts.SyntaxKind.PlusEqualsToken, /*expectParens*/ false);
                checkRhs(ts.SyntaxKind.BarBarToken, /*expectParens*/ true);
                checkRhs(ts.SyntaxKind.AmpersandAmpersandToken, /*expectParens*/ true);
                checkRhs(ts.SyntaxKind.QuestionQuestionToken, /*expectParens*/ true);
                checkRhs(ts.SyntaxKind.EqualsEqualsToken, /*expectParens*/ true);
            });
        });
    });
}
