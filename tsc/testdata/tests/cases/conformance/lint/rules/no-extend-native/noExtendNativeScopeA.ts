// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-extend-native": ["error", { "exceptions": ["Array"] }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
Object.prototype.method = value;
Object.defineProperty(String.prototype, "method", { value });
Object?.defineProperties(Number?.prototype, {});
Array.prototype.method = value;
delete Object.prototype.method;
function shadow(Object: any) { Object.prototype.method = value; }