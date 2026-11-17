//// [tests/cases/conformance/lint/rules/no-duplicate-case/lintNoDuplicateCaseDefaultCase9.ts] ////

//// [input.ts]
switch (value) { case 'text': break; case "text": break; }

//// [input.ts]
switch (value) { case 'text': break; case "text": break; }
