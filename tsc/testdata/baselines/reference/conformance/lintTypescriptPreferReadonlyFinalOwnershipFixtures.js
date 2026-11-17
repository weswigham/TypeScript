//// [tests/cases/conformance/lint/rules/prefer-readonly/lintTypescriptPreferReadonlyFinalOwnershipFixtures.ts] ////

//// [input.ts]

class Owner {
    private stable = 1;
    private nested = { count: 0 };
    #stable = 1;
    private [Symbol.iterator] = () => 1;
    private updated = 1;
    private captured = 1;
    private static updated = 1;
    constructor(private parameter = 1) {
        this.stable = 2;
        Owner.updated++;
        const self = this;
        (() => self.captured++)();
    }
    update(other: { stable: number }) {
        other.stable++;
        this.nested.count++;
        this['updated']++;
        return this.#stable + this.parameter;
    }
}

//// [input.ts]

class Owner {
    private readonly stable: number = 1;
    private readonly nested = { count: 0 };
    readonly #stable = 1;
    private readonly [Symbol.iterator] = () => 1;
    private updated = 1;
    private captured = 1;
    private static updated = 1;
    constructor(private readonly parameter = 1) {
        this.stable = 2;
        Owner.updated++;
        const self = this;
        (() => self.captured++)();
    }
    update(other: { stable: number }) {
        other.stable++;
        this.nested.count++;
        this['updated']++;
        return this.#stable + this.parameter;
    }
}
