//// [tests/cases/conformance/lint/rules/no-useless-constructor/tsNoUselessConstructorCoverage.ts] ////

//// [input.ts]
class Empty {
    constructor() {}
}

class PublicEmpty {
    public constructor() {}
}

class Base {
    constructor(value: number) {
        void value;
    }
}
class Forwarding extends Base {
    constructor(value: number) {
        super(value);
    }
}

class Restricted {
    private constructor() {}
}
class WithProperty {
    constructor(public value: number) {}
}

//// [input.ts]
class Empty {
    constructor() {}
}

class PublicEmpty {
    public constructor() {}
}

class Base {
    constructor(value: number) {
        void value;
    }
}
class Forwarding extends Base {
    constructor(value: number) {
        super(value);
    }
}

class Restricted {
    private constructor() {}
}
class WithProperty {
    constructor(public value: number) {}
}
