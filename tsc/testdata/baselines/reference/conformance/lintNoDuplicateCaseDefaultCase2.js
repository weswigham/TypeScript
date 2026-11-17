//// [tests/cases/conformance/lint/rules/no-duplicate-case/lintNoDuplicateCaseDefaultCase2.ts] ////

//// [input.ts]
switch (value) { case (value): break; case value: break; }

//// [input.ts]
switch (value) { case (value): break; case value: break; }
