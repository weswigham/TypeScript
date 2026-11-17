//// [tests/cases/conformance/lint/rules/method-signature-style/lintTypescriptMethodSignatureStyleTypeScriptSyntaxMethodToProperty.ts] ////

//// [input.ts]
interface Item { run(value: number): void; }

//// [input.ts]
interface Item { run: (value: number) => void; }
