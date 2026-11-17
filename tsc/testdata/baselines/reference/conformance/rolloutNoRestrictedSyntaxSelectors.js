//// [tests/cases/conformance/lint/rules/no-restricted-syntax/rolloutNoRestrictedSyntaxSelectors.ts] ////

//// [input.ts]
function tooMany(a, b, c) { eval(a); }
function small(a, b) { safe(a); }
const object = { foo: 1, "bar": 2 };
outer: for (;;) { break outer; }
for (;;) { break; }
const regex = /value/i;
const plain = /value/;
object?.foo?.();
{ using resource = acquire(); }
async function task() { await using resource = acquire(); }

//// [input.ts]
function tooMany(a, b, c) { eval(a); }
function small(a, b) { safe(a); }
const object = { foo: 1, "bar": 2 };
outer: for (;;) { break outer; }
for (;;) { break; }
const regex = /value/i;
const plain = /value/;
object?.foo?.();
{ using resource = acquire(); }
async function task() { await using resource = acquire(); }
