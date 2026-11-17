//// [tests/cases/conformance/lint/rules/accessor-pairs/accessorPairsCore.ts] ////

//// [input.ts]
const missingGetter = { set value(value: number) {} };
const missingSetter = { get value() { return 1; } };
const valid = { get value() { return 1; }, set value(value: number) {} };
class Example { static get value() { return 1; } set value(value: number) {} }
interface Contract { set value(value: number); }
Object.defineProperty(valid, "other", { set(value: number) {} });

//// [input.ts]
const missingGetter = { set value(value: number) {} };
const missingSetter = { get value() { return 1; } };
const valid = { get value() { return 1; }, set value(value: number) {} };
class Example { static get value() { return 1; } set value(value: number) {} }
interface Contract { set value(value: number); }
Object.defineProperty(valid, "other", { set(value: number) {} });
