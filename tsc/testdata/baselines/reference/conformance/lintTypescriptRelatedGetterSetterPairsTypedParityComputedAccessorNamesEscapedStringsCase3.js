//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesEscapedStringsCase3.ts] ////

//// [input.ts]
declare class C { get ['v\u0061lue'](): number; set ['value'](v: string); }
export {};

//// [input.ts]
declare class C { get ['v\u0061lue'](): number; set ['value'](v: string); }
export {};
