declare function testConstraints1<A extends B, B extends string>(arg?: { a?: A[], b?: B[] }): { a: A[], b: B[] }
const expectError1 = testConstraints1<*, "z"> ({ a: ["x", "y"] });

declare function testConstraints2<A extends string, B extends A>(arg?: { a?: A[], b?: B[] }): { a: A[], b: B[] }
const expectAllowed1 = testConstraints2<*, "x"> ({ a: ["x", "y"] }); // OK { a: string[], b: "x"[] }
const expectAllowed2 = testConstraints2<"x" | "y", *> ({ b: ["x"] }); // OK { a: ("x" | "y")[], b: ("x" | "y")[] }
const expectAllowed3 = testConstraints2<*, "z"> ({ a: ["x", "y"] }); // OK - inference fails, but that just makes A = string, which still passes
const expectError2 = testConstraints2<"x" | "y", *> ({ b: ["x", "y", "z"] }); // error "z" not in "x" | "y"

declare function complexConstraints<A extends string, B extends A, C extends B>(arg: { a?: A[], b?: B[], c?: C[] }): { a: A[], b: B[], c: C[] };
const expectAllowed4 = complexConstraints<"x" | "y" | "z", *, *> ({ a: ["x"], c: ["x", "y"] }); // OK { a: ("x" | "y" | "z")[], b: ("x" | "y" | "z")[], c: ("x" | "y")[] }
// OK because B inferred to be "x" but that conflicts with C as "x" | "y" so inference fails - A and C are provided,
// B becomes its constraint, A, or "x" | "y" | "z", and the call successfully resolves
const expectAlllowed5 = complexConstraints<"x" | "y" | "z", *, "x" | "y">({b: ["x"]});
const expectError3 = complexConstraints<"x", *, *>({c: ["y"]}); // error "y" does not extend "x"

