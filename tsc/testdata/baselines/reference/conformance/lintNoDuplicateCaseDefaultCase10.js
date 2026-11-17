//// [tests/cases/conformance/lint/rules/no-duplicate-case/lintNoDuplicateCaseDefaultCase10.ts] ////

//// [input.ts]
switch (value) { case call(value + 1): break; case call((value + 1)): break; }

//// [input.ts]
switch (value) { case call(value + 1): break; case call((value + 1)): break; }
