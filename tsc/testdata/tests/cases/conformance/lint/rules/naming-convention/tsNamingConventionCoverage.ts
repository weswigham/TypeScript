// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "preserve", "strict": true },
    "lint": { "rules": { "@typescript-eslint/naming-convention": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
const bad_name = 1;
function validFunction(BadParameter: number): number { return BadParameter; }
interface bad_interface { value: number; }
class bad_class { value = 1; }
const goodName = 1;
const GOOD_NAME = 2;
interface GoodInterface { value: number; }
class GoodClass { value = 1; }
function goodFunction(goodParameter: number): number { return goodParameter; }
export {};