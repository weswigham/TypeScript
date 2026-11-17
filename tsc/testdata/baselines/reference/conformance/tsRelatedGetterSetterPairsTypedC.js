//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/tsRelatedGetterSetterPairsTypedC.ts] ////

//// [input.ts]
interface InvalidPair {
    get value(): number;
    set value(value: string);
}
interface ValidPair {
    get value(): string;
    set value(value: string | undefined);
}

//// [input.ts]
interface InvalidPair {
    get value(): number;
    set value(value: string);
}
interface ValidPair {
    get value(): string;
    set value(value: string | undefined);
}
