//// [tests/cases/conformance/lint/rules/no-unassigned-vars/noUnassignedVarsScopeB.ts] ////

//// [input.ts]
let read;
use(read);
let unused;
let written;
written = 1;
use(written);
let iterated;
for (iterated of values) use(iterated);
let updated;
updated++;
let shorthand;
const object = { shorthand };
declare let ambient;
use(ambient);
declare namespace Ambient { let value: string; }

//// [input.ts]
let read;
use(read);
let unused;
let written;
written = 1;
use(written);
let iterated;
for (iterated of values) use(iterated);
let updated;
updated++;
let shorthand;
const object = { shorthand };
declare let ambient;
use(ambient);
declare namespace Ambient { let value: string; }
