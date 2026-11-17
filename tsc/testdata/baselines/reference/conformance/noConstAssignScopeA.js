//// [tests/cases/conformance/lint/rules/no-const-assign/noConstAssignScopeA.ts] ////

//// [input.ts]
const constant = 0;
constant++;
({ constant } = value);
({ key: constant = 1 } = value);
[...constant] = value;
using resource = createResource();
resource = value;
for (const key of values) { use(key); }
function shadow(constant: number) { constant = 1; }

//// [input.ts]
const constant = 0;
constant++;
({ constant } = value);
({ key: constant = 1 } = value);
[...constant] = value;
using resource = createResource();
resource = value;
for (const key of values) { use(key); }
function shadow(constant: number) { constant = 1; }
