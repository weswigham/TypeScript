//// [tests/cases/conformance/lint/rules/no-global-assign/rolloutNoGlobalAssign.ts] ////

//// [input.ts]
/* global custom:readonly, writable:true */
Array = 1;
String++;
({ Math = 0 } = source);
for (JSON of values) {}
custom = 1;
writable = 1;
Object = 1;
function shadow(Array) { Array = 1; }

//// [input.ts]
/* global custom:readonly, writable:true */
Array = 1;
String++;
({ Math = 0 } = source);
for (JSON of values) {}
custom = 1;
writable = 1;
Object = 1;
function shadow(Array) { Array = 1; }
