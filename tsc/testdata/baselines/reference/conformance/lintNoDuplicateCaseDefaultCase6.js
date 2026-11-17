//// [tests/cases/conformance/lint/rules/no-duplicate-case/lintNoDuplicateCaseDefaultCase6.ts] ////

//// [input.ts]
switch (value) { case `value${value}`: break; case `value${value}`: break; }

//// [input.ts]
switch (value) { case `value${value}`: break; case `value${value}`: break; }
