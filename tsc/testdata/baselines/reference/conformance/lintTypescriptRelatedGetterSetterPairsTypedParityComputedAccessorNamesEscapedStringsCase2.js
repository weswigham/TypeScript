//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesEscapedStringsCase2.ts] ////

//// [input.ts]
type C = { get ['v\u0061lue'](): number; set ['value'](v: string); };
export {};

//// [input.ts]
type C = { get ['v\u0061lue'](): number; set ['value'](v: string); };
export {};
