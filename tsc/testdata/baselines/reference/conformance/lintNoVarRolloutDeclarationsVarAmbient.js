//// [tests/cases/conformance/lint/rules/no-var/lintNoVarRolloutDeclarationsVarAmbient.ts] ////

//// [input.ts]
declare namespace N { var x: number; }

//// [input.ts]
declare namespace N { let x: number; }
