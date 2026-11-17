//// [tests/cases/conformance/lint/rules/grouped-accessor-pairs/groupedAccessorPairsCore.ts] ////

//// [input.ts]
const separated = { get value() { return 1; }, other: 1, set value(value: number) {} };
class WrongOrder { set value(value: number) {} get value() { return 1; } }
class Valid { get value() { return 1; } set value(value: number) {} }
interface Contract { set value(value: number); get value(): number; }

//// [input.ts]
const separated = { get value() { return 1; }, other: 1, set value(value: number) {} };
class WrongOrder { set value(value: number) {} get value() { return 1; } }
class Valid { get value() { return 1; } set value(value: number) {} }
interface Contract { set value(value: number); get value(): number; }
