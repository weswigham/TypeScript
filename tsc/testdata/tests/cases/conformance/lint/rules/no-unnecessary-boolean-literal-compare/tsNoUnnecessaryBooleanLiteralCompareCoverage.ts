// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext","module":"preserve"},"lint":{"rules":{"@typescript-eslint/no-unnecessary-boolean-literal-compare":["error",{"allowComparingNullableBooleansToTrue":false}]}},"files":["input.ts"]}
// @filename: input.ts
export {};
declare const flag: boolean;
flag === true;
flag !== false;
declare const nullable: boolean | undefined;
nullable === true;
declare const unknownValue: unknown;
unknownValue === true;
function constrained<T extends boolean>(value: T) { return value !== false; }
function unconstrained<T>(value: T) { return value !== false; }
flag;