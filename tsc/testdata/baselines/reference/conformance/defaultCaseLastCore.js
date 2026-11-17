//// [tests/cases/conformance/lint/rules/default-case-last/defaultCaseLastCore.ts] ////

//// [input.ts]
switch (value) { default: break; case 1: break; }
switch (value) { case 1: break; default: break; }

//// [input.ts]
switch (value) { default: break; case 1: break; }
switch (value) { case 1: break; default: break; }
