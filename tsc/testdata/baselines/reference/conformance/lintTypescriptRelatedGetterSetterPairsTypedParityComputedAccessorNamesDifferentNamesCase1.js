//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesDifferentNamesCase1.ts] ////

//// [input.ts]
interface C { get ['first'](): number; set second(v: string); }
export {};

//// [input.ts]
interface C { get ['first'](): number; set second(v: string); }
export {};
