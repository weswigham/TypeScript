//// [tests/cases/conformance/lint/rules/no-return-assign/noReturnAssignCoreAlways.ts] ////

//// [input.ts]
function first() { return (result = a * b); }
function second() { return result || (result = a * b); }
const arrow = () => (result = a * b);
function nested() { return function() { result = a * b; }; }

//// [input.ts]
function first() { return (result = a * b); }
function second() { return result || (result = a * b); }
const arrow = () => (result = a * b);
function nested() { return function() { result = a * b; }; }
