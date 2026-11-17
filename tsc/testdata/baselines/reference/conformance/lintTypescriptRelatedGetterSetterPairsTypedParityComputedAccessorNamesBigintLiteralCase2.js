//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesBigintLiteralCase2.ts] ////

//// [input.ts]
type C = { get [0x10n](): number; set ['16'](v: string); };
export {};

//// [input.ts]
type C = { get [0x10n](): number; set ['16'](v: string); };
export {};
