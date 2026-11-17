//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesComputedStringSetterCase2.ts] ////

//// [input.ts]
type C = { get value(): number; set ["value"](v: string); };
export {};

//// [input.ts]
type C = { get value(): number; set ["value"](v: string); };
export {};
