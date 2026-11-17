// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "preserve", "strict": true },
    "lint": { "rules": { "@typescript-eslint/no-array-constructor": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
const emptyViolation = Array();
const newViolation = new Array(1, 2);
const callViolation = Array("first", "second");
const commentViolation = Array(/* retained element comment */ 1, 2);
const validLength = Array(3);
const validNewLength = new Array(3);
const validTyped = Array<number>();
const validNewTyped = new Array<number>(1, 2);
const validLiteral = [1, 2];
function validFactory(factory: () => number[]): number[] { return factory(); }
export {};