//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesBigintLiteralCase3.ts] ////

//// [input.ts]
declare class C { get [0x10n](): number; set ['16'](v: string); }
export {};

//// [input.ts]
declare class C { get [0x10n](): number; set ['16'](v: string); }
export {};
