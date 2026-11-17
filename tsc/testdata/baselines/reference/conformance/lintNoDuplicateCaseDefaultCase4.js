//// [tests/cases/conformance/lint/rules/no-duplicate-case/lintNoDuplicateCaseDefaultCase4.ts] ////

//// [input.ts]
switch (value) { case call(value + 1).property: break; case call(value+1) .property: break; }

//// [input.ts]
switch (value) { case call(value + 1).property: break; case call(value+1) .property: break; }
