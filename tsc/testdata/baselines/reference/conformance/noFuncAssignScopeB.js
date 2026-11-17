//// [tests/cases/conformance/lint/rules/no-func-assign/noFuncAssignScopeB.ts] ////

//// [input.ts]
function task() {}
task = replacement;
[task] = tasks;
({ task } = source);
const callback = function named() { named++; };
function shadow(task) { task = replacement; }
function local() { var local; local = replacement; }
let expression = function() {};
expression = replacement;

//// [input.ts]
function task() {}
task = replacement;
[task] = tasks;
({ task } = source);
const callback = function named() { named++; };
function shadow(task) { task = replacement; }
function local() { var local; local = replacement; }
let expression = function() {};
expression = replacement;
