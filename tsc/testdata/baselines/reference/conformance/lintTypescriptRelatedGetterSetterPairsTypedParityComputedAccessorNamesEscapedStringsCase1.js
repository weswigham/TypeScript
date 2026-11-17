//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesEscapedStringsCase1.ts] ////

//// [input.ts]
interface C { get ['v\u0061lue'](): number; set ['value'](v: string); }
export {};

//// [input.ts]
interface C { get ['v\u0061lue'](): number; set ['value'](v: string); }
export {};
