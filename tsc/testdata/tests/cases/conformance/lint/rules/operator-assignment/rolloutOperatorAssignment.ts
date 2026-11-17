// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "operator-assignment": "warn" } },
    "files": ["input.ts"]
}
// @filename: input.ts
declare let value: number, other: number, object: any, key: any;
value = value + other;
value = other * value;
object[key] = object[key] + other;
object.key = object.key ** other;
value = /* keep */ value + other;