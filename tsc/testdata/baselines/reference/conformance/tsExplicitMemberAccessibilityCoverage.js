//// [tests/cases/conformance/lint/rules/explicit-member-accessibility/tsExplicitMemberAccessibilityCoverage.ts] ////

//// [input.ts]
class Accessibility {
    value = 1;
    run(): number { return this.value; }
    get inferred(): number { return this.value; }
    public constructor() {}
    public validField = 2;
    public validMethod(): number { return this.validField; }
    protected protectedField = 3;
    private privateField = 4;
    #nativePrivate = 5;
}
export {};

//// [input.ts]
class Accessibility {
    value = 1;
    run(): number { return this.value; }
    get inferred(): number { return this.value; }
    public constructor() {}
    public validField = 2;
    public validMethod(): number { return this.validField; }
    protected protectedField = 3;
    private privateField = 4;
    #nativePrivate = 5;
}
export {};
