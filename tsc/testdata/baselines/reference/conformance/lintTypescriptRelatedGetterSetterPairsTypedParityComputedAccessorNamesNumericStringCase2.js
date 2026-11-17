//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesNumericStringCase2.ts] ////

//// [input.ts]
type C = { get ['16'](): number; set [16](v: string); };
export {};

//// [input.ts]
type C = { get ['16'](): number; set [16](v: string); };
export {};
