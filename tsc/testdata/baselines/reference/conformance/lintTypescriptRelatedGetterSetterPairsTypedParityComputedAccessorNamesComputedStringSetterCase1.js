//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesComputedStringSetterCase1.ts] ////

//// [input.ts]
interface C { get value(): number; set ["value"](v: string); }
export {};

//// [input.ts]
interface C { get value(): number; set ["value"](v: string); }
export {};
