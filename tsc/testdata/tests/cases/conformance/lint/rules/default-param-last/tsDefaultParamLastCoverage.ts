// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "preserve", "strict": true },
    "lint": { "rules": { "@typescript-eslint/default-param-last": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
function invalidDefault(first = 0, second: number) { return first + second; }
const invalidArrow = (first = 0, second: number) => first + second;
class InvalidConstructor {
    constructor(public first = 0, public second: number) {}
}
function validDefault(first: number, second = 0) { return first + second; }
function validOptional(first: number, second?: number) { return first + (second ?? 0); }
function validRest(first = 0, ...rest: number[]) { return first + rest.length; }
export {};