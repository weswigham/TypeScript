//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesDifferentNamesCase2.ts] ////

//// [input.ts]
type C = { get ['first'](): number; set second(v: string); };
export {};

//// [input.ts]
type C = { get ['first'](): number; set second(v: string); };
export {};
