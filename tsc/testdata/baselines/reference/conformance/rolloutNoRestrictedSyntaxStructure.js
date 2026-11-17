//// [tests/cases/conformance/lint/rules/no-restricted-syntax/rolloutNoRestrictedSyntaxStructure.ts] ////

//// [input.tsx]
function task() { eval("first"); eval("second"); }
let missingValue;
let absent;
const values = [1, 2, 3];
first();
second();
const elements = [<div />, <span />];
object.denied;

//// [input.tsx]
function task() { eval("first"); eval("second"); }
let missingValue;
let absent;
const values = [1, 2, 3];
first();
second();
const elements = [<div />, <span />];
object.denied;
