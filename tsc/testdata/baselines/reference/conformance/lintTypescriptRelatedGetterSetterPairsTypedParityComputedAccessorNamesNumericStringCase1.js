//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesNumericStringCase1.ts] ////

//// [input.ts]
interface C { get ['16'](): number; set [16](v: string); }
export {};

//// [input.ts]
interface C { get ['16'](): number; set [16](v: string); }
export {};
