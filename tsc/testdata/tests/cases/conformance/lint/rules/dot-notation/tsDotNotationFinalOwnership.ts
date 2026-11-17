// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "strict": true },
    "lint": { "rules": { "@typescript-eslint/dot-notation": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
class Owner {
    private value = 1;
    protected count = 2;
    read() { return this['value'] + this['count']; }
}
declare const object: { value: number } | null;
object?.['value'];
declare const record: Record<string, number>;
record['other'];
record['not an identifier'];