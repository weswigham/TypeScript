//// [tests/cases/conformance/lint/rules/no-throw-literal/lintNoThrowLiteralCoreCThrowErrorThrowUndefinedThrowFooLiteralThrow.ts] ////

//// [input.ts]
throw 'error'; throw undefined; throw foo && 'literal'; throw {};

//// [input.ts]
throw 'error'; throw undefined; throw foo && 'literal'; throw {};
