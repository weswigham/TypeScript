// The class to constrain to in the generic types
class MyClass {
    constructor(public name: string) { }

    protected fn(): this {
        return this;
    }
}

// A generic type with a type argument constrained to MyClass
type MyGenericType<T extends MyClass> = T;

// Conditional type with a generic constrained to either MyClass or something else
type ConditionalType<T extends MyClass | string> =
    T extends MyClass ? MyGenericType<T> : T;