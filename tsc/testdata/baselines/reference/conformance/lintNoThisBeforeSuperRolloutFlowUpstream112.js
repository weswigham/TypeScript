//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream112.ts] ////

//// [input.ts]
class A extends B { constructor(a) { for (const b of a) { foo(b); } super(); } }

//// [input.ts]
class A extends B { constructor(a) { for (const b of a) { foo(b); } super(); } }
