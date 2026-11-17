//// [tests/cases/conformance/lint/rules/no-unassigned-vars/lintNoUnassignedVarsCoreScopeBUnassignedReads.ts] ////

//// [input.ts]
let read; use(read); let unused; let written; written = 1; use(written); declare let ambient; use(ambient);

//// [input.ts]
let read; use(read); let unused; let written; written = 1; use(written); declare let ambient; use(ambient);
