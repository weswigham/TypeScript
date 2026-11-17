//// [tests/cases/conformance/lint/rules/no-inner-declarations/lintNoInnerDeclarationsCoreScopeBInnerOptions.ts] ////

//// [input.ts]
export {}; if (ready) { function nested() {} var item; let lexical; } class Item { static { if (ready) { var nested; } } }

//// [input.ts]
export {}; if (ready) { function nested() {} var item; let lexical; } class Item { static { if (ready) { var nested; } } }
