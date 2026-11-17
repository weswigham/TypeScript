//// [tests/cases/conformance/lint/rules/no-restricted-globals/lintNoRestrictedGlobalsCoreScopeBRestrictedGlobalsLegacy.ts] ////

//// [input.ts]
event; const object = {event}; object.event; function run(event) { return event; } let type: Event;

//// [input.ts]
event; const object = {event}; object.event; function run(event) { return event; } let type: Event;
