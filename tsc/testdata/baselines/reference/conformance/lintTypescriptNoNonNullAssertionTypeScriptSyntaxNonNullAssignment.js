//// [tests/cases/conformance/lint/rules/no-non-null-assertion/lintTypescriptNoNonNullAssertionTypeScriptSyntaxNonNullAssignment.ts] ////

//// [input.ts]
value!.property = 1; value!.property++; delete value!.property; (value!.property as number)++;

//// [input.ts]
value!.property = 1; value!.property++; delete value!.property; (value!.property as number)++;
