//// [tests/cases/conformance/lint/rules/prefer-return-this-type/tsPreferReturnThisTypeTypedC.ts] ////

//// [input.ts]
class Example<T> {
    method(): Example<T> {
        return this;
    }
    arrow = (): Example<T> => this;
    explicit(this: Example<T>): Example<T> {
        return this;
    }
    construct(): Example<T> {
        return new Example<T>();
    }
}

//// [input.ts]
class Example<T> {
    method(): Example<T> {
        return this;
    }
    arrow = (): Example<T> => this;
    explicit(this: Example<T>): Example<T> {
        return this;
    }
    construct(): Example<T> {
        return new Example<T>();
    }
}
