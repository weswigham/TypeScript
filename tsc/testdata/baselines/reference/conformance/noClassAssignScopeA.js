//// [tests/cases/conformance/lint/rules/no-class-assign/noClassAssignScopeA.ts] ////

//// [input.ts]
class Example {}
Example = 0;
({ Example } = value);
({ key: Example = 0 } = value);
const Expression = class Named {
    method() { Named = 1; }
};
function shadow(Example: number) { Example++; }

//// [input.ts]
class Example {}
Example = 0;
({ Example } = value);
({ key: Example = 0 } = value);
const Expression = class Named {
    method() { Named = 1; }
};
function shadow(Example: number) { Example++; }
