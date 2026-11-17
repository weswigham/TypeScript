//// [tests/cases/conformance/lint/rules/no-case-declarations/lintNoCaseDeclarationsCoreSyntaxBCaseLexical.ts] ////

//// [input.ts]
switch (value) { case 0: let local; const fixed = 1; function nested() {} class Item {} var hoisted; break; default: { let valid; } }

//// [input.ts]
switch (value) { case 0: let local; const fixed = 1; function nested() {} class Item {} var hoisted; break; default: { let valid; } }
