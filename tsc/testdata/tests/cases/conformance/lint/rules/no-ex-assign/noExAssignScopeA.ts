// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-ex-assign": "error" } },
    "files": ["input.ts"]
}
// @filename: input.ts
try {} catch (error) {
    error = 1;
    [error] = values;
    error.message = "allowed";
    function shadow(error: number) { error = 1; }
}
try {} catch ({ message }) {
    ({ key: message = 0 } = value);
}