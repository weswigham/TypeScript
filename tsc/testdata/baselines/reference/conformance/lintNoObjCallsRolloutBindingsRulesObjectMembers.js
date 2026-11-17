//// [tests/cases/conformance/lint/rules/no-obj-calls/lintNoObjCallsRolloutBindingsRulesObjectMembers.ts] ////

//// [input.ts]
globalThis.Math(); globalThis['JSON'](); Math.random(); new Intl.Segmenter(); foo.Math();

//// [input.ts]
globalThis.Math(); globalThis['JSON'](); Math.random(); new Intl.Segmenter(); foo.Math();
