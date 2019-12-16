namespace ts {
    describe("unittests:: PrinterAPI", () => {
        function makePrintsCorrectly(prefix: string) {
            return function printsCorrectly(name: string, options: ts.PrinterOptions, printCallback: (printer: ts.Printer) => string) {
                it(name, () => {
                    Harness.Baseline.runBaseline(`printerApi/${prefix}.${name}.js`, printCallback(ts.createPrinter({ newLine: ts.NewLineKind.CarriageReturnLineFeed, ...options })));
                });
            };
        }
        describe("printFile", () => {
            const printsCorrectly = makePrintsCorrectly("printsFileCorrectly");
            // Avoid eagerly creating the sourceFile so that `createSourceFile` doesn't run unless one of these tests is run.
            let sourceFile: ts.SourceFile;
            before(() => {
                sourceFile = ts.createSourceFile("source.ts", `
                    interface A<T> {
                        // comment1
                        readonly prop?: T;

                        // comment2
                        method(): void;

                        // comment3
                        new <T>(): A<T>;

                        // comment4
                        <T>(): A<T>;
                    }

                    // comment5
                    type B = number | string | object;
                    type C = A<number> & { x: string; }; // comment6

                    // comment7
                    enum E1 {
                        // comment8
                        first
                    }

                    const enum E2 {
                        second
                    }

                    // comment9
                    console.log(1 + 2);

                    // comment10
                    function functionWithDefaultArgValue(argument: string = "defaultValue"): void { }
                `, ts.ScriptTarget.ES2015);
            });
            printsCorrectly("default", {}, printer => printer.printFile(sourceFile));
            printsCorrectly("removeComments", { removeComments: true }, printer => printer.printFile(sourceFile));
            // github #14948
            // eslint-disable-next-line no-template-curly-in-string
            printsCorrectly("templateLiteral", {}, printer => printer.printFile(ts.createSourceFile("source.ts", "let greeting = `Hi ${name}, how are you?`;", ts.ScriptTarget.ES2017)));
            // github #18071
            printsCorrectly("regularExpressionLiteral", {}, printer => printer.printFile(ts.createSourceFile("source.ts", "let regex = /abc/;", ts.ScriptTarget.ES2017)));
            // github #22239
            printsCorrectly("importStatementRemoveComments", { removeComments: true }, printer => printer.printFile(ts.createSourceFile("source.ts", "import {foo} from 'foo';", ts.ScriptTarget.ESNext)));
            printsCorrectly("classHeritageClauses", {}, printer => printer.printFile(ts.createSourceFile("source.ts", `class A extends B implements C implements D {}`, ts.ScriptTarget.ES2017)));
            // github #35093
            printsCorrectly("definiteAssignmentAssertions", {}, printer => printer.printFile(ts.createSourceFile("source.ts", `class A {
                    prop!: string;
                }
                
                let x!: string;`, ts.ScriptTarget.ES2017)));
        });
        describe("printBundle", () => {
            const printsCorrectly = makePrintsCorrectly("printsBundleCorrectly");
            let bundle: ts.Bundle;
            before(() => {
                bundle = ts.createBundle([
                    ts.createSourceFile("a.ts", `
                        /*! [a.ts] */

                        // comment0
                        const a = 1;
                    `, ts.ScriptTarget.ES2015),
                    ts.createSourceFile("b.ts", `
                        /*! [b.ts] */

                        // comment1
                        const b = 2;
                    `, ts.ScriptTarget.ES2015)
                ]);
            });
            printsCorrectly("default", {}, printer => printer.printBundle(bundle));
            printsCorrectly("removeComments", { removeComments: true }, printer => printer.printBundle(bundle));
        });
        describe("printNode", () => {
            const printsCorrectly = makePrintsCorrectly("printsNodeCorrectly");
            printsCorrectly("class", {}, printer => printer.printNode(ts.EmitHint.Unspecified, ts.createClassDeclaration(
            /*decorators*/ undefined, 
            /*modifiers*/ undefined, 
            /*name*/ ts.createIdentifier("C"), 
            /*typeParameters*/ undefined, 
            /*heritageClauses*/ undefined, [ts.createProperty(
                /*decorators*/ undefined, ts.createNodeArray([ts.createToken(ts.SyntaxKind.PublicKeyword)]), ts.createIdentifier("prop"), 
                /*questionToken*/ undefined, 
                /*type*/ undefined, 
                /*initializer*/ undefined)]), ts.createSourceFile("source.ts", "", ts.ScriptTarget.ES2015)));
            printsCorrectly("namespaceExportDeclaration", {}, printer => printer.printNode(ts.EmitHint.Unspecified, ts.createNamespaceExportDeclaration("B"), ts.createSourceFile("source.ts", "", ts.ScriptTarget.ES2015)));
            printsCorrectly("newExpressionWithPropertyAccessOnCallExpression", {}, printer => printer.printNode(ts.EmitHint.Unspecified, ts.createNew(ts.createPropertyAccess(ts.createCall(ts.createIdentifier("f"), /*typeArguments*/ undefined, /*argumentsArray*/ undefined), "x"), 
            /*typeArguments*/ undefined, 
            /*argumentsArray*/ undefined), ts.createSourceFile("source.ts", "", ts.ScriptTarget.ESNext)));
            printsCorrectly("newExpressionOnConditionalExpression", {}, printer => printer.printNode(ts.EmitHint.Unspecified, ts.createNew(ts.createConditional(ts.createIdentifier("x"), ts.createToken(ts.SyntaxKind.QuestionToken), ts.createIdentifier("y"), ts.createToken(ts.SyntaxKind.ColonToken), ts.createIdentifier("z")), 
            /*typeArguments*/ undefined, 
            /*argumentsArray*/ undefined), ts.createSourceFile("source.ts", "", ts.ScriptTarget.ESNext)));
            printsCorrectly("emptyGlobalAugmentation", {}, printer => printer.printNode(ts.EmitHint.Unspecified, ts.createModuleDeclaration(
            /*decorators*/ undefined, 
            /*modifiers*/ [ts.createToken(ts.SyntaxKind.DeclareKeyword)], ts.createIdentifier("global"), ts.createModuleBlock(ts.emptyArray), ts.NodeFlags.GlobalAugmentation), ts.createSourceFile("source.ts", "", ts.ScriptTarget.ES2015)));
            printsCorrectly("emptyGlobalAugmentationWithNoDeclareKeyword", {}, printer => printer.printNode(ts.EmitHint.Unspecified, ts.createModuleDeclaration(
            /*decorators*/ undefined, 
            /*modifiers*/ undefined, ts.createIdentifier("global"), ts.createModuleBlock(ts.emptyArray), ts.NodeFlags.GlobalAugmentation), ts.createSourceFile("source.ts", "", ts.ScriptTarget.ES2015)));
            // https://github.com/Microsoft/TypeScript/issues/15971
            printsCorrectly("classWithOptionalMethodAndProperty", {}, printer => printer.printNode(ts.EmitHint.Unspecified, ts.createClassDeclaration(
            /*decorators*/ undefined, 
            /*modifiers*/ [ts.createToken(ts.SyntaxKind.DeclareKeyword)], 
            /*name*/ ts.createIdentifier("X"), 
            /*typeParameters*/ undefined, 
            /*heritageClauses*/ undefined, [
                ts.createMethod(
                /*decorators*/ undefined, 
                /*modifiers*/ undefined, 
                /*asteriskToken*/ undefined, 
                /*name*/ ts.createIdentifier("method"), 
                /*questionToken*/ ts.createToken(ts.SyntaxKind.QuestionToken), 
                /*typeParameters*/ undefined, [], 
                /*type*/ ts.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword), 
                /*body*/ undefined),
                ts.createProperty(
                /*decorators*/ undefined, 
                /*modifiers*/ undefined, 
                /*name*/ ts.createIdentifier("property"), 
                /*questionToken*/ ts.createToken(ts.SyntaxKind.QuestionToken), 
                /*type*/ ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword), 
                /*initializer*/ undefined),
            ]), ts.createSourceFile("source.ts", "", ts.ScriptTarget.ES2015)));
            // https://github.com/Microsoft/TypeScript/issues/15651
            printsCorrectly("functionTypes", {}, printer => printer.printNode(ts.EmitHint.Unspecified, ts.createTupleTypeNode([
                ts.createFunctionTypeNode(
                /*typeArguments*/ undefined, [ts.createParameter(
                    /*decorators*/ undefined, 
                    /*modifiers*/ undefined, 
                    /*dotDotDotToken*/ undefined, ts.createIdentifier("args"))], ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)),
                ts.createFunctionTypeNode([ts.createTypeParameterDeclaration("T")], [ts.createParameter(
                    /*decorators*/ undefined, 
                    /*modifiers*/ undefined, 
                    /*dotDotDotToken*/ undefined, ts.createIdentifier("args"))], ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)),
                ts.createFunctionTypeNode(
                /*typeArguments*/ undefined, [ts.createParameter(
                    /*decorators*/ undefined, 
                    /*modifiers*/ undefined, ts.createToken(ts.SyntaxKind.DotDotDotToken), ts.createIdentifier("args"))], ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)),
                ts.createFunctionTypeNode(
                /*typeArguments*/ undefined, [ts.createParameter(
                    /*decorators*/ undefined, 
                    /*modifiers*/ undefined, 
                    /*dotDotDotToken*/ undefined, ts.createIdentifier("args"), ts.createToken(ts.SyntaxKind.QuestionToken))], ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)),
                ts.createFunctionTypeNode(
                /*typeArguments*/ undefined, [ts.createParameter(
                    /*decorators*/ undefined, 
                    /*modifiers*/ undefined, 
                    /*dotDotDotToken*/ undefined, ts.createIdentifier("args"), 
                    /*questionToken*/ undefined, ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword))], ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)),
                ts.createFunctionTypeNode(
                /*typeArguments*/ undefined, [ts.createParameter(
                    /*decorators*/ undefined, 
                    /*modifiers*/ undefined, 
                    /*dotDotDotToken*/ undefined, ts.createObjectBindingPattern([]))], ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)),
            ]), ts.createSourceFile("source.ts", "", ts.ScriptTarget.ES2015)));
        });
    });
}
