//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesCompatibleTypesCase2.ts] ////

//// [input.ts]
type C = { get ['value'](): string; set value(v: string | number); };
export {};

//// [input.ts]
type C = { get ['value'](): string; set value(v: string | number); };
export {};
