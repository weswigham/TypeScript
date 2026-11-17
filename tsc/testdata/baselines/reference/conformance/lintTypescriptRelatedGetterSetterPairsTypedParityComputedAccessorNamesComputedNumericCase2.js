//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesComputedNumericCase2.ts] ////

//// [input.ts]
type C = { get [0x10](): number; set 16(v: string); };
export {};

//// [input.ts]
type C = { get [0x10](): number; set 16(v: string); };
export {};
