//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesDifferentNamesCase3.ts] ////

//// [input.ts]
declare class C { get ['first'](): number; set second(v: string); }
export {};

//// [input.ts]
declare class C { get ['first'](): number; set second(v: string); }
export {};
