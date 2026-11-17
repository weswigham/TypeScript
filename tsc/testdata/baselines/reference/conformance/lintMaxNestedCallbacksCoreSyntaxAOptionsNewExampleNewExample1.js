//// [tests/cases/conformance/lint/rules/max-nested-callbacks/lintMaxNestedCallbacksCoreSyntaxAOptionsNewExampleNewExample1.ts] ////

//// [input.ts]
new Example(() => { new Example(() => 1); });

//// [input.ts]
new Example(() => { new Example(() => 1); });
