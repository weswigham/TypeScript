//// [tests/cases/conformance/lint/rules/no-const-assign/lintNoConstAssignCoreScopeABindingWritesForConstXOfValuesUseXForConstXInValueUseX.ts] ////

//// [input.ts]
for (const x of values) { use(x); } for (const x in value) { use(x); }

//// [input.ts]
for (const x of values) { use(x); } for (const x in value) { use(x); }
