type Cond<T, U> = T extends U ? true : false;

type Shapes = 
    | { kind: "circle", radius: number }
    | { kind: "square", side: number }
    | { kind: "parallelogram", major: number, minor: number };

declare function isSquare<T extends Shapes>(s: T): Cond<T, { kind: "square" }>;

const a = isSquare({ kind: "circle", radius: 12 });
const b = isSquare({ kind: "square", side: 12 });
const c = isSquare(Math.random() > 0.5 ? { kind: "circle", radius: 12 } : { kind: "square", side: 12 });

declare function objHasField<F extends string>(a: F): Cond<{x: number, y: number}, {[K in F]: any}>;
const d = objHasField("x");
const e = objHasField("z");


// return type should reduce to `false`
declare function f2<F extends string>(a: F): Cond<{x: number, y: number}, {y: F}>;

// return type should reduce to `true`
declare function f3<F extends string>(a: F): Cond<{x: number, y: number, z: any}, {x: number, y: number, z: F}>;

// return type should reduce to `false`
declare function f4<F extends string>(a: F): Cond<{x: F}, {x: number, y: number}>;

// return type should reduce to `true`
declare function f5<F extends string>(a: F): Cond<{x: number, y: number, z: F}, {x: number, y: number}>;
