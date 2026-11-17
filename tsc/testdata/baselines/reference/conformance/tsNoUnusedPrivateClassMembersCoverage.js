//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/tsNoUnusedPrivateClassMembersCoverage.ts] ////

//// [input.ts]
export class Box {
    private unused = 1;
    #unused = 2;
    private used = 3;
    #used = 4;

    read(): number {
        return this.used + this.#used;
    }
}

//// [input.ts]
export class Box {
    private unused = 1;
    #unused = 2;
    private used = 3;
    #used = 4;

    read(): number {
        return this.used + this.#used;
    }
}
