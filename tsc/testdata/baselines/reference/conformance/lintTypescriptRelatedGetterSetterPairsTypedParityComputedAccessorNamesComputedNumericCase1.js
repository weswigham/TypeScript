//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesComputedNumericCase1.ts] ////

//// [input.ts]
interface C { get [0x10](): number; set 16(v: string); }
export {};

//// [input.ts]
interface C { get [0x10](): number; set 16(v: string); }
export {};
