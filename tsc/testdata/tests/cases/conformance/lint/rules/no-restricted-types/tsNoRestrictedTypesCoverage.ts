// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext","module":"preserve"},"lint":{"rules":{"@typescript-eslint/no-restricted-types":["error",{"types":{"Bad":{"message":"Use Good.","fixWith":"Good"},"Forbidden":true,"Legacy":{"suggest":["Good","Other"]},"Banned< string >":true}}]}},"files":["input.ts"]}
// @filename: input.ts
export {};
type Bad = string;
type Forbidden = number;
type Legacy = string;
type Banned<T> = T[];
type Good = string;
type Other = number;
let needsFix: Bad;
let reportOnly: Forbidden;
let suggestionOnly: Legacy;
type RestrictedGeneric = Banned<string>;
let allowed: Good;
let primitive: string;
let unrestrictedGeneric: Banned<number>;