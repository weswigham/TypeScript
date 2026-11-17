//// [tests/cases/conformance/lint/rules/new-cap/newCapCore.ts] ////

//// [input.ts]
new lower();
Upper();
new Upper();
lower();
new allowed();
Allowed();
Array();
Date.UTC(2000, 0);
object.Upper();
function shadow(Array: Function) { Array(); }

//// [input.ts]
new lower();
Upper();
new Upper();
lower();
new allowed();
Allowed();
Array();
Date.UTC(2000, 0);
object.Upper();
function shadow(Array: Function) { Array(); }
