//// [negatedTypesSimplifyInIntersections.ts]
type A = boolean & ~true;   // false
type B = "w" & ~string;     // never


//// [negatedTypesSimplifyInIntersections.js]
