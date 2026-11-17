//// [tests/cases/conformance/lint/rules/no-shadow/rolloutNoShadow.ts] ////

//// [input.ts]
let outer;
function shadowed(outer, Object) {}
function before() { let later; }
function later() {}
const named = function named() {};
const wrapped = wrap(function wrapped() {});
type TypeName = string;
function independent() { const TypeName = 1; }

//// [input.ts]
let outer;
function shadowed(outer, Object) {}
function before() { let later; }
function later() {}
const named = function named() {};
const wrapped = wrap(function wrapped() {});
type TypeName = string;
function independent() { const TypeName = 1; }
