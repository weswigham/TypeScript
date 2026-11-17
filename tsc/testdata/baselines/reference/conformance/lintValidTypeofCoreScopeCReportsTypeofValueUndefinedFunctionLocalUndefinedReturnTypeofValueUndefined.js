//// [tests/cases/conformance/lint/rules/valid-typeof/lintValidTypeofCoreScopeCReportsTypeofValueUndefinedFunctionLocalUndefinedReturnTypeofValueUndefined.ts] ////

//// [input.ts]
typeof value === undefined; function local(undefined) { return typeof value === undefined; }

//// [input.ts]
typeof value === undefined; function local(undefined) { return typeof value === undefined; }
