//// [tests/cases/conformance/lint/rules/no-throw-literal/lintNoThrowLiteralCoreCThrowNewErrorThrowFooLiteralThrowFooLiteralNewError.ts] ////

//// [input.ts]
throw new Error(); throw foo ||= 'literal'; throw foo ? 'literal' : new Error();

//// [input.ts]
throw new Error(); throw foo ||= 'literal'; throw foo ? 'literal' : new Error();
