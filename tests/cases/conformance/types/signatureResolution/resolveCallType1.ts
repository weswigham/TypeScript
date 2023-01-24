// declare function f(x: string, y: number): 1;
// declare function f(x: string, y: string): 2;
// declare function f(x: string, y: string | number): 3;

// type A = ResolveCall<typeof f, [string, string | number]>;

//declare function sfc<T>(props: { x: T, y: T }): 1;
declare function sfc<const T>(props: { a: T, b: T }): T;
//declare function sfc<T>(props: { q: T, t: T }): 3;

declare function factory<T, TProps>(tag: T, props: TProps, key?: string): ResolveCall<T, [TProps]>;

const result = factory(sfc, {a: 0, b: 0});