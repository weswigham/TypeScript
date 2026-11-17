// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-unsafe-negation": ["warn", { "enforceForOrderingRelations": true }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
declare const value: any, object: any;
!value in object;
!value instanceof Object;
!value < object;
(!value) in object;