//// [tests/cases/conformance/lint/rules/no-misused-new/lintTypescriptNoMisusedNewTypeScriptSyntaxNewBodyAllowed.ts] ////

//// [input.ts]
class Value { new(): Value { return this; } }

//// [input.ts]
class Value { new(): Value { return this; } }
