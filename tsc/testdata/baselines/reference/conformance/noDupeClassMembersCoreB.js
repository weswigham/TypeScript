//// [tests/cases/conformance/lint/rules/no-dupe-class-members/noDupeClassMembersCoreB.ts] ////

//// [input.ts]
class Item {
    value;
    ['value']() {}
    static value() {}
    get pair() { return 1; }
    set pair(value) {}
    get pair() { return 2; }
    method(value: string): void;
    method(value: any) {}
    #value;
    constructor() {}
    ['constructor']() {}
}

//// [input.ts]
class Item {
    value;
    ['value']() {}
    static value() {}
    get pair() { return 1; }
    set pair(value) {}
    get pair() { return 2; }
    method(value: string): void;
    method(value: any) {}
    #value;
    constructor() {}
    ['constructor']() {}
}
