//// [tests/cases/conformance/lint/rules/default-case/defaultCaseCore.ts] ////

//// [input.ts]
switch (value) { case 1: break; }
switch (value) { case 1: break; /* no default */ }
switch (value) { case 1: break; default: break; }
switch (value) {}

//// [input.ts]
switch (value) { case 1: break; }
switch (value) { case 1: break; /* no default */ }
switch (value) { case 1: break; default: break; }
switch (value) {}
