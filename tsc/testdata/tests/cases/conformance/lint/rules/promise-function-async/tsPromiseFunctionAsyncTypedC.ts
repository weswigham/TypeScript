// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "strict": true },
    "lint": { "rules": { "@typescript-eslint/promise-function-async": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts

function promised() {
    return Promise.resolve(1);
}
function hybrid(flag: boolean) {
    return flag ? Promise.resolve(1) : 1;
}
function annotated(flag: boolean): Promise<number> | number {
    return flag ? Promise.resolve(1) : 1;
}
class Example {
    get value() {
        return Promise.resolve(1);
    }
    method() {
        return Promise.resolve(1);
    }
}