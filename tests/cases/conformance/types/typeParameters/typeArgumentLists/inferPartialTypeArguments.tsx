// @jsx: react
declare module JSX {
    interface Element {}
}
declare namespace React {
    export function createElement(x: any, p: any, ...children: any[]): JSX.Element;
}
 class Foo<T, U> {
    constructor(public prop1: T, public prop2: U) {}
}
 function foo<T, U>(x: T, y: U): [T, U] { return [x, y]; }
 function tag<T, U>(x: TemplateStringsArray, ...args: (T | U)[]) { return args; }
 interface ComponentProps<T, U> {
    x: T;
    y: U;
    cb(props: this): void;
}
 function Component<T, U>(x: ComponentProps<T, U>) {
    return <h></h>;
}

const instance1 = new Foo<number, infer>(0, "");
const result1 = foo<number, infer>(0, "");
// const tagged1 = tag<number, infer>`tags ${12} ${""}`; // Because of how union inference works, this won't actually work
const jsx1 = <Component<number, infer> x={12} y="" cb={props => void (props.x.toFixed() + props.y.toUpperCase())} />;

const instance2 = new Foo<infer, string>(0, "");
const result2 = foo<infer, string>(0, "");
const tagged2 = tag<infer, string>`tags ${12} ${""}`; // this will, though! Just because the `infer` comes first!
const jsx2 = <Component<infer, string> x={12} y="" cb={props => void (props.x.toFixed() + props.y.toUpperCase())} />;

const instance3 = new Foo<infer, infer>(0, "");
const result3 = foo<infer, infer>(0, "");
const tagged3 = tag<infer, infer>`tags ${12} ${""}`;
const jsx3 = <Component<infer, infer> x={12} y="" cb={props => void (props.x.toFixed() + props.y.toUpperCase())} />;

declare function stillDefaultsIfNoInference<X, A = string, B = number, C = boolean>(arg: { a?: A, b?: B, c?: C, x?: X}): { a: A, b: B, c: C, x: X };
const result4 = stillDefaultsIfNoInference<infer, infer, infer, object> ({ b: "test" }); // expect result1 type is {a: string, b: string, c: object, x: {}

class Foo2<A extends {x: string} = {x: string, y: number}, B = number> {
    constructor(public a?: A, public b?: B) {}
}
const x = new Foo2<infer, string>();
x.a.x;
x.a.y;
x.b;
