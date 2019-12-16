namespace ts {
    describe("unittests:: TransformAPI", () => {
        function replaceUndefinedWithVoid0(context: ts.TransformationContext) {
            const previousOnSubstituteNode = context.onSubstituteNode;
            context.enableSubstitution(ts.SyntaxKind.Identifier);
            context.onSubstituteNode = (hint, node) => {
                node = previousOnSubstituteNode(hint, node);
                if (hint === ts.EmitHint.Expression && ts.isIdentifier(node) && node.escapedText === "undefined") {
                    node = ts.createPartiallyEmittedExpression(ts.addSyntheticTrailingComment(ts.setTextRange(ts.createVoidZero(), node), ts.SyntaxKind.MultiLineCommentTrivia, "undefined"));
                }
                return node;
            };
            return (file: ts.SourceFile) => file;
        }
        function replaceNumberWith2(context: ts.TransformationContext) {
            function visitor(node: ts.Node): ts.Node {
                if (ts.isNumericLiteral(node)) {
                    return ts.createNumericLiteral("2");
                }
                return ts.visitEachChild(node, visitor, context);
            }
            return (file: ts.SourceFile) => ts.visitNode(file, visitor);
        }
        function replaceIdentifiersNamedOldNameWithNewName(context: ts.TransformationContext) {
            const previousOnSubstituteNode = context.onSubstituteNode;
            context.enableSubstitution(ts.SyntaxKind.Identifier);
            context.onSubstituteNode = (hint, node) => {
                node = previousOnSubstituteNode(hint, node);
                if (ts.isIdentifier(node) && node.escapedText === "oldName") {
                    node = ts.setTextRange(ts.createIdentifier("newName"), node);
                }
                return node;
            };
            return (file: ts.SourceFile) => file;
        }
        function replaceIdentifiersNamedOldNameWithNewName2(context: ts.TransformationContext) {
            const visitor: ts.Visitor = (node) => {
                if (ts.isIdentifier(node) && node.text === "oldName") {
                    return ts.createIdentifier("newName");
                }
                return ts.visitEachChild(node, visitor, context);
            };
            return (node: ts.SourceFile) => ts.visitNode(node, visitor);
        }
        function transformSourceFile(sourceText: string, transformers: ts.TransformerFactory<ts.SourceFile>[]) {
            const transformed = ts.transform(ts.createSourceFile("source.ts", sourceText, ts.ScriptTarget.ES2015), transformers);
            const printer = ts.createPrinter({ newLine: ts.NewLineKind.CarriageReturnLineFeed }, {
                onEmitNode: transformed.emitNodeWithNotification,
                substituteNode: transformed.substituteNode
            });
            const result = printer.printBundle(ts.createBundle(transformed.transformed));
            transformed.dispose();
            return result;
        }
        function testBaseline(testName: string, test: () => string) {
            it(testName, () => {
                Harness.Baseline.runBaseline(`transformApi/transformsCorrectly.${testName}.js`, test());
            });
        }
        function testBaselineAndEvaluate(testName: string, test: () => string, onEvaluate: (exports: any) => void) {
            describe(testName, () => {
                let sourceText!: string;
                before(() => {
                    sourceText = test();
                });
                after(() => {
                    sourceText = undefined!;
                });
                it("compare baselines", () => {
                    Harness.Baseline.runBaseline(`transformApi/transformsCorrectly.${testName}.js`, sourceText);
                });
                it("evaluate", () => {
                    onEvaluate(evaluator.evaluateJavaScript(sourceText));
                });
            });
        }
        testBaseline("substitution", () => {
            return transformSourceFile(`var a = undefined;`, [replaceUndefinedWithVoid0]);
        });
        testBaseline("types", () => {
            return transformSourceFile(`let a: () => void`, [
                context => file => ts.visitNode(file, function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
                    return ts.visitEachChild(node, visitor, context);
                })
            ]);
        });
        testBaseline("transformDefiniteAssignmentAssertions", () => {
            return transformSourceFile(`let a!: () => void`, [
                context => file => ts.visitNode(file, function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
                    if (node.kind === ts.SyntaxKind.VoidKeyword) {
                        return ts.createIdentifier("undefined");
                    }
                    return ts.visitEachChild(node, visitor, context);
                })
            ]);
        });
        testBaseline("fromTranspileModule", () => {
            return ts.transpileModule(`var oldName = undefined;`, {
                transformers: {
                    before: [replaceUndefinedWithVoid0],
                    after: [replaceIdentifiersNamedOldNameWithNewName]
                },
                compilerOptions: {
                    newLine: ts.NewLineKind.CarriageReturnLineFeed
                }
            }).outputText;
        });
        testBaseline("issue27854", () => {
            return ts.transpileModule(`oldName<{ a: string; }>\` ... \`;`, {
                transformers: {
                    before: [replaceIdentifiersNamedOldNameWithNewName2]
                },
                compilerOptions: {
                    newLine: ts.NewLineKind.CarriageReturnLineFeed,
                    target: ts.ScriptTarget.Latest
                }
            }).outputText;
        });
        testBaseline("rewrittenNamespace", () => {
            return ts.transpileModule(`namespace Reflect { const x = 1; }`, {
                transformers: {
                    before: [forceNamespaceRewrite],
                },
                compilerOptions: {
                    newLine: ts.NewLineKind.CarriageReturnLineFeed,
                }
            }).outputText;
        });
        testBaseline("rewrittenNamespaceFollowingClass", () => {
            return ts.transpileModule(`
            class C { foo = 10; static bar = 20 }
            namespace C { export let x = 10; }
            `, {
                transformers: {
                    before: [forceNamespaceRewrite],
                },
                compilerOptions: {
                    target: ts.ScriptTarget.ESNext,
                    newLine: ts.NewLineKind.CarriageReturnLineFeed,
                }
            }).outputText;
        });
        testBaseline("transformTypesInExportDefault", () => {
            return ts.transpileModule(`
            export default (foo: string) => { return 1; }
            `, {
                transformers: {
                    before: [replaceNumberWith2],
                },
                compilerOptions: {
                    target: ts.ScriptTarget.ESNext,
                    newLine: ts.NewLineKind.CarriageReturnLineFeed,
                }
            }).outputText;
        });
        testBaseline("synthesizedClassAndNamespaceCombination", () => {
            return ts.transpileModule("", {
                transformers: {
                    before: [replaceWithClassAndNamespace],
                },
                compilerOptions: {
                    target: ts.ScriptTarget.ESNext,
                    newLine: ts.NewLineKind.CarriageReturnLineFeed,
                }
            }).outputText;
            function replaceWithClassAndNamespace() {
                return (sourceFile: ts.SourceFile) => {
                    const result = ts.getMutableClone(sourceFile);
                    result.statements = ts.createNodeArray([
                        ts.createClassDeclaration(/*decorators*/ undefined, /*modifiers*/ undefined, "Foo", /*typeParameters*/ undefined, /*heritageClauses*/ undefined, /*members*/ (undefined!)),
                        ts.createModuleDeclaration(/*decorators*/ undefined, /*modifiers*/ undefined, ts.createIdentifier("Foo"), ts.createModuleBlock([ts.createEmptyStatement()]))
                    ]);
                    return result;
                };
            }
        });
        function forceNamespaceRewrite(context: ts.TransformationContext) {
            return (sourceFile: ts.SourceFile): ts.SourceFile => {
                return visitNode(sourceFile);
                function visitNode<T extends ts.Node>(node: T): T {
                    if (node.kind === ts.SyntaxKind.ModuleBlock) {
                        const block = (node as T & ts.ModuleBlock);
                        const statements = ts.createNodeArray([...block.statements]);
                        return ts.updateModuleBlock(block, statements) as typeof block;
                    }
                    return ts.visitEachChild(node, visitNode, context);
                }
            };
        }
        testBaseline("transformAwayExportStar", () => {
            return ts.transpileModule("export * from './helper';", {
                transformers: {
                    before: [expandExportStar],
                },
                compilerOptions: {
                    target: ts.ScriptTarget.ESNext,
                    newLine: ts.NewLineKind.CarriageReturnLineFeed,
                }
            }).outputText;
            function expandExportStar(context: ts.TransformationContext) {
                return (sourceFile: ts.SourceFile): ts.SourceFile => {
                    return visitNode(sourceFile);
                    function visitNode<T extends ts.Node>(node: T): T {
                        if (node.kind === ts.SyntaxKind.ExportDeclaration) {
                            const ed = (node as ts.Node as ts.ExportDeclaration);
                            const exports = [{ name: "x" }];
                            const exportSpecifiers = exports.map(e => ts.createExportSpecifier(e.name, e.name));
                            const exportClause = ts.createNamedExports(exportSpecifiers);
                            const newEd = ts.updateExportDeclaration(ed, ed.decorators, ed.modifiers, exportClause, ed.moduleSpecifier);
                            return newEd as ts.Node as T;
                        }
                        return ts.visitEachChild(node, visitNode, context);
                    }
                };
            }
        });
        // https://github.com/Microsoft/TypeScript/issues/19618
        testBaseline("transformAddImportStar", () => {
            return ts.transpileModule("", {
                transformers: {
                    before: [transformAddImportStar],
                },
                compilerOptions: {
                    target: ts.ScriptTarget.ES5,
                    module: ts.ModuleKind.System,
                    newLine: ts.NewLineKind.CarriageReturnLineFeed,
                }
            }).outputText;
            function transformAddImportStar(_context: ts.TransformationContext) {
                return (sourceFile: ts.SourceFile): ts.SourceFile => {
                    return visitNode(sourceFile);
                };
                function visitNode(sf: ts.SourceFile) {
                    // produce `import * as i0 from './comp';
                    const importStar = ts.createImportDeclaration(
                    /*decorators*/ undefined, 
                    /*modifiers*/ undefined, 
                    /*importClause*/ ts.createImportClause(
                    /*name*/ undefined, ts.createNamespaceImport(ts.createIdentifier("i0"))), 
                    /*moduleSpecifier*/ ts.createLiteral("./comp1"));
                    return ts.updateSourceFileNode(sf, [importStar]);
                }
            }
        });
        // https://github.com/Microsoft/TypeScript/issues/17384
        testBaseline("transformAddDecoratedNode", () => {
            return ts.transpileModule("", {
                transformers: {
                    before: [transformAddDecoratedNode],
                },
                compilerOptions: {
                    target: ts.ScriptTarget.ES5,
                    newLine: ts.NewLineKind.CarriageReturnLineFeed,
                }
            }).outputText;
            function transformAddDecoratedNode(_context: ts.TransformationContext) {
                return (sourceFile: ts.SourceFile): ts.SourceFile => {
                    return visitNode(sourceFile);
                };
                function visitNode(sf: ts.SourceFile) {
                    // produce `class Foo { @Bar baz() {} }`;
                    const classDecl = ts.createClassDeclaration([], [], "Foo", /*typeParameters*/ undefined, /*heritageClauses*/ undefined, [
                        ts.createMethod([ts.createDecorator(ts.createIdentifier("Bar"))], [], /**/ undefined, "baz", /**/ undefined, /**/ undefined, [], /**/ undefined, ts.createBlock([]))
                    ]);
                    return ts.updateSourceFileNode(sf, [classDecl]);
                }
            }
        });
        testBaseline("transformDeclarationFile", () => {
            return baselineDeclarationTransform(`var oldName = undefined;`, {
                transformers: {
                    afterDeclarations: [replaceIdentifiersNamedOldNameWithNewName]
                },
                compilerOptions: {
                    newLine: ts.NewLineKind.CarriageReturnLineFeed,
                    declaration: true
                }
            });
        });
        // https://github.com/microsoft/TypeScript/issues/33295
        testBaseline("transformParameterProperty", () => {
            return ts.transpileModule("", {
                transformers: {
                    before: [transformAddParameterProperty],
                },
                compilerOptions: {
                    target: ts.ScriptTarget.ES5,
                    newLine: ts.NewLineKind.CarriageReturnLineFeed,
                }
            }).outputText;
            function transformAddParameterProperty(_context: ts.TransformationContext) {
                return (sourceFile: ts.SourceFile): ts.SourceFile => {
                    return visitNode(sourceFile);
                };
                function visitNode(sf: ts.SourceFile) {
                    // produce `class Foo { constructor(@Dec private x) {} }`;
                    // The decorator is required to trigger ts.ts transformations.
                    const classDecl = ts.createClassDeclaration([], [], "Foo", /*typeParameters*/ undefined, /*heritageClauses*/ undefined, [
                        ts.createConstructor(/*decorators*/ undefined, /*modifiers*/ undefined, [
                            ts.createParameter(/*decorators*/ [ts.createDecorator(ts.createIdentifier("Dec"))], /*modifiers*/ [ts.createModifier(ts.SyntaxKind.PrivateKeyword)], /*dotDotDotToken*/ undefined, "x")
                        ], ts.createBlock([]))
                    ]);
                    return ts.updateSourceFileNode(sf, [classDecl]);
                }
            }
        });
        function baselineDeclarationTransform(text: string, opts: ts.TranspileOptions) {
            const fs = vfs.createFromFileSystem(Harness.IO, /*caseSensitive*/ true, { documents: [new documents.TextDocument("/.src/index.ts", text)] });
            const host = new fakes.CompilerHost(fs, opts.compilerOptions);
            const program = ts.createProgram(["/.src/index.ts"], (opts.compilerOptions!), host);
            program.emit(program.getSourceFile("/.src/index.ts"), (p, s, bom) => host.writeFile(p, s, bom), /*cancellationToken*/ undefined, /*onlyDts*/ true, opts.transformers);
            return fs.readFileSync("/.src/index.d.ts").toString();
        }
        function addSyntheticComment(nodeFilter: (node: ts.Node) => boolean) {
            return (context: ts.TransformationContext) => {
                return (sourceFile: ts.SourceFile): ts.SourceFile => {
                    return ts.visitNode(sourceFile, rootTransform, ts.isSourceFile);
                };
                function rootTransform<T extends ts.Node>(node: T): ts.VisitResult<T> {
                    if (nodeFilter(node)) {
                        ts.setEmitFlags(node, ts.EmitFlags.NoLeadingComments);
                        ts.setSyntheticLeadingComments(node, [{ kind: ts.SyntaxKind.MultiLineCommentTrivia, text: "comment", pos: -1, end: -1, hasTrailingNewLine: true }]);
                    }
                    return ts.visitEachChild(node, rootTransform, context);
                }
            };
        }
        // https://github.com/Microsoft/TypeScript/issues/24096
        testBaseline("transformAddCommentToArrowReturnValue", () => {
            return ts.transpileModule(`const foo = () =>
    void 0
`, {
                transformers: {
                    before: [addSyntheticComment(ts.isVoidExpression)],
                },
                compilerOptions: {
                    target: ts.ScriptTarget.ES5,
                    newLine: ts.NewLineKind.CarriageReturnLineFeed,
                }
            }).outputText;
        });
        // https://github.com/Microsoft/TypeScript/issues/17594
        testBaseline("transformAddCommentToExportedVar", () => {
            return ts.transpileModule(`export const exportedDirectly = 1;
const exportedSeparately = 2;
export {exportedSeparately};
`, {
                transformers: {
                    before: [addSyntheticComment(ts.isVariableStatement)],
                },
                compilerOptions: {
                    target: ts.ScriptTarget.ES5,
                    newLine: ts.NewLineKind.CarriageReturnLineFeed,
                }
            }).outputText;
        });
        // https://github.com/Microsoft/TypeScript/issues/17594
        testBaseline("transformAddCommentToImport", () => {
            return ts.transpileModule(`
// Previous comment on import.
import {Value} from 'somewhere';
import * as X from 'somewhere';
// Previous comment on export.
export { /* specifier comment */ X, Y} from 'somewhere';
export * from 'somewhere';
export {Value};
`, {
                transformers: {
                    before: [addSyntheticComment(n => ts.isImportDeclaration(n) || ts.isExportDeclaration(n) || ts.isImportSpecifier(n) || ts.isExportSpecifier(n))],
                },
                compilerOptions: {
                    target: ts.ScriptTarget.ES5,
                    newLine: ts.NewLineKind.CarriageReturnLineFeed,
                }
            }).outputText;
        });
        // https://github.com/Microsoft/TypeScript/issues/17594
        testBaseline("transformAddCommentToProperties", () => {
            return ts.transpileModule(`
// class comment.
class Clazz {
    // original comment 1.
    static staticProp: number = 1;
    // original comment 2.
    instanceProp: number = 2;
    // original comment 3.
    constructor(readonly field = 1) {}
}
`, {
                transformers: {
                    before: [addSyntheticComment(n => ts.isPropertyDeclaration(n) || ts.isParameterPropertyDeclaration(n, n.parent) || ts.isClassDeclaration(n) || ts.isConstructorDeclaration(n))],
                },
                compilerOptions: {
                    target: ts.ScriptTarget.ES2015,
                    newLine: ts.NewLineKind.CarriageReturnLineFeed,
                }
            }).outputText;
        });
        testBaseline("transformAddCommentToNamespace", () => {
            return ts.transpileModule(`
// namespace comment.
namespace Foo {
    export const x = 1;
}
// another comment.
namespace Foo {
    export const y = 1;
}
`, {
                transformers: {
                    before: [addSyntheticComment(n => ts.isModuleDeclaration(n))],
                },
                compilerOptions: {
                    target: ts.ScriptTarget.ES2015,
                    newLine: ts.NewLineKind.CarriageReturnLineFeed,
                }
            }).outputText;
        });
        testBaseline("transformUpdateModuleMember", () => {
            return ts.transpileModule(`
module MyModule {
    const myVariable = 1;
    function foo(param: string) {}
}
`, {
                transformers: {
                    before: [renameVariable],
                },
                compilerOptions: {
                    target: ts.ScriptTarget.ES2015,
                    newLine: ts.NewLineKind.CarriageReturnLineFeed,
                }
            }).outputText;
            function renameVariable(context: ts.TransformationContext) {
                return (sourceFile: ts.SourceFile): ts.SourceFile => {
                    return ts.visitNode(sourceFile, rootTransform, ts.isSourceFile);
                };
                function rootTransform<T extends ts.Node>(node: T): ts.Node {
                    if (ts.isVariableDeclaration(node)) {
                        return ts.updateVariableDeclaration(node, ts.createIdentifier("newName"), /* type */ undefined, node.initializer);
                    }
                    return ts.visitEachChild(node, rootTransform, context);
                }
            }
        });
        // https://github.com/Microsoft/TypeScript/issues/24709
        testBaseline("issue24709", () => {
            const fs = vfs.createFromFileSystem(Harness.IO, /*caseSensitive*/ true);
            const transformed = ts.transform(ts.createSourceFile("source.ts", "class X { echo(x: string) { return x; } }", ts.ScriptTarget.ES3), [transformSourceFile]);
            const transformedSourceFile = transformed.transformed[0];
            transformed.dispose();
            const host = new fakes.CompilerHost(fs);
            host.getSourceFile = () => transformedSourceFile;
            const program = ts.createProgram(["source.ts"], {
                target: ts.ScriptTarget.ES3,
                module: ts.ModuleKind.None,
                noLib: true
            }, host);
            program.emit(transformedSourceFile, (_p, s, b) => host.writeFile("source.js", s, b));
            return host.readFile("source.js")!.toString();
            function transformSourceFile(context: ts.TransformationContext) {
                const visitor: ts.Visitor = (node) => {
                    if (ts.isMethodDeclaration(node)) {
                        return ts.updateMethod(node, node.decorators, node.modifiers, node.asteriskToken, ts.createIdentifier("foobar"), node.questionToken, node.typeParameters, node.parameters, node.type, node.body);
                    }
                    return ts.visitEachChild(node, visitor, context);
                };
                return (node: ts.SourceFile) => ts.visitNode(node, visitor);
            }
        });
        testBaselineAndEvaluate("templateSpans", () => {
            return ts.transpileModule("const x = String.raw`\n\nhello`; exports.stringLength = x.trim().length;", {
                compilerOptions: {
                    target: ts.ScriptTarget.ESNext,
                    newLine: ts.NewLineKind.CarriageReturnLineFeed,
                },
                transformers: {
                    before: [transformSourceFile]
                }
            }).outputText;
            function transformSourceFile(context: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
                function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
                    if (ts.isNoSubstitutionTemplateLiteral(node)) {
                        return ts.createNoSubstitutionTemplateLiteral(node.text, node.rawText);
                    }
                    else {
                        return ts.visitEachChild(node, visitor, context);
                    }
                }
                return sourceFile => ts.visitNode(sourceFile, visitor, ts.isSourceFile);
            }
        }, exports => {
            assert.equal(exports.stringLength, 5);
        });
    });
}
