//// [tests/cases/conformance/lint/rules/no-case-declarations/noCaseDeclarationsCoreB.ts] ////

//// [input.ts]
switch (value) {
    case 0: let local; const fixed = 1; function nested() {} class Item {} break;
    case 1: var hoisted; break;
    default: { let valid; }
}

//// [input.ts]
switch (value) {
    case 0: let local; const fixed = 1; function nested() {} class Item {} break;
    case 1: var hoisted; break;
    default: { let valid; }
}
