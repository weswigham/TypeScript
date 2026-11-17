//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesCompatibleTypesCase1.ts] ////

//// [input.ts]
interface C { get ['value'](): string; set value(v: string | number); }
export {};

//// [input.ts]
interface C { get ['value'](): string; set value(v: string | number); }
export {};
