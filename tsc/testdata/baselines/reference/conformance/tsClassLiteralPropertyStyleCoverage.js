//// [tests/cases/conformance/lint/rules/class-literal-property-style/tsClassLiteralPropertyStyleCoverage.ts] ////

//// [input.ts]
class LiteralGetters {
    get label() { return "fixed"; }
    get count() { return 1; }
    readonly validLabel = "fixed";
    readonly validCount = 1;
    private stored = 0;
    get mutable() { return 1; }
    set mutable(value: number) { this.stored = value; }
    get computed() { return this.stored + 1; }
}
export {};

//// [input.ts]
class LiteralGetters {
    get label() { return "fixed"; }
    get count() { return 1; }
    readonly validLabel = "fixed";
    readonly validCount = 1;
    private stored = 0;
    get mutable() { return 1; }
    set mutable(value: number) { this.stored = value; }
    get computed() { return this.stored + 1; }
}
export {};
