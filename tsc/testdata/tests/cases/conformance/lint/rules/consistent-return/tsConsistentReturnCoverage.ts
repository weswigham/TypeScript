// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "preserve", "strict": true },
    "lint": { "rules": { "@typescript-eslint/consistent-return": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
function fallsThrough(flag: boolean) {
    if (flag) return 1;
}
function mixedReturns(flag: boolean): any {
    if (flag) return 1;
    return;
}
function validReturns(flag: boolean) {
    if (flag) return 1;
    return 2;
}
function validThrow(flag: boolean) {
    if (flag) return 1;
    throw new Error("not available");
}
declare function sideEffect(): void;
function validVoid(flag: boolean): void {
    if (flag) return sideEffect();
    return;
}
async function validAsyncVoid(flag: boolean): Promise<void> {
    if (flag) return Promise.resolve();
    return;
}
export {};