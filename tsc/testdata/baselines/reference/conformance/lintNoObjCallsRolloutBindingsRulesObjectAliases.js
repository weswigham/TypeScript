//// [tests/cases/conformance/lint/rules/no-obj-calls/lintNoObjCallsRolloutBindingsRulesObjectAliases.ts] ////

//// [input.ts]
const alias = Math; const second = alias; alias(); new second; const {JSON: json} = globalThis; json();

//// [input.ts]
const alias = Math; const second = alias; alias(); new second; const {JSON: json} = globalThis; json();
