//// [tests/cases/conformance/lint/rules/no-dupe-class-members/tsNoDupeClassMembersCoverage.ts] ////

//// [input.ts]
class DuplicateMembers {
    // @ts-expect-error
    value() {}
    // @ts-expect-error
    ["value"]() {}
    // @ts-expect-error
    value() {}
}

class DistinctMembers {
    static value = 1;
    value = 2;

    get item(): number {
        return this.value;
    }
    set item(value: number) {
        this.value = value;
    }

    convert(value: string): string;
    convert(value: number): number;
    convert(value: string | number): string | number {
        return value;
    }
}

//// [input.ts]
class DuplicateMembers {
    // @ts-expect-error
    value() {}
    // @ts-expect-error
    ["value"]() {}
    // @ts-expect-error
    value() {}
}

class DistinctMembers {
    static value = 1;
    value = 2;

    get item(): number {
        return this.value;
    }
    set item(value: number) {
        this.value = value;
    }

    convert(value: string): string;
    convert(value: number): number;
    convert(value: string | number): string | number {
        return value;
    }
}
