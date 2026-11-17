//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesNumericStringCase3.ts] ////

//// [input.ts]
declare class C { get ['16'](): number; set [16](v: string); }
export {};

//// [input.ts]
declare class C { get ['16'](): number; set [16](v: string); }
export {};
