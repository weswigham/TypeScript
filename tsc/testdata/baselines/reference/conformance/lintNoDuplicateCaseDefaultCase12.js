//// [tests/cases/conformance/lint/rules/no-duplicate-case/lintNoDuplicateCaseDefaultCase12.ts] ////

//// [input.ts]
switch (value) { case 1: switch (value) { case 1: break; } }

//// [input.ts]
switch (value) { case 1: switch (value) { case 1: break; } }
