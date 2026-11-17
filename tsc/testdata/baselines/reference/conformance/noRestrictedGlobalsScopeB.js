//// [tests/cases/conformance/lint/rules/no-restricted-globals/noRestrictedGlobalsScopeB.ts] ////

//// [input.ts]
event;
const object = { event };
object.event;
missing();
function shadow(event) { return event; }
let type: event;

//// [input.ts]
event;
const object = { event };
object.event;
missing();
function shadow(event) { return event; }
let type: event;
