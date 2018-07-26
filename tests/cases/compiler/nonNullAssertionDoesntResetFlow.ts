// @strict: true
type Foo = {
    foo: string;
};
function isFoo(arg?: any): arg is Foo | undefined {
    return true;
}
function logic(arg?: object) {
    if (isFoo(arg)) {
        arg!.foo;
    }
}
