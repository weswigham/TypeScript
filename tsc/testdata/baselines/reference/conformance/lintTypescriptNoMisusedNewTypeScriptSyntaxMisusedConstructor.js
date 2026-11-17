//// [tests/cases/conformance/lint/rules/no-misused-new/lintTypescriptNoMisusedNewTypeScriptSyntaxMisusedConstructor.ts] ////

//// [input.ts]
interface Value { new(): Value; constructor(): void; }

//// [input.ts]
interface Value { new(): Value; constructor(): void; }
