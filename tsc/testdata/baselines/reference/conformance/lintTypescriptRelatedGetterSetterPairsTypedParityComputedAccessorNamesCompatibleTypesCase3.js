//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesCompatibleTypesCase3.ts] ////

//// [input.ts]
declare class C { get ['value'](): string; set value(v: string | number); }
export {};

//// [input.ts]
declare class C { get ['value'](): string; set value(v: string | number); }
export {};
