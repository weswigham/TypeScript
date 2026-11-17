//// [tests/cases/conformance/lint/rules/no-label-var/lintNoLabelVarCoreScopeBLabelBinding.ts] ////

//// [input.ts]
let outer; function run(item) { outer: while (true) break outer; item: {} unused: {} }

//// [input.ts]
let outer; function run(item) { outer: while (true) break outer; item: {} unused: {} }
