// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "strict": true, "target": "esnext", "module": "preserve" },
    "lint": { "rules": { "@typescript-eslint/no-unused-private-class-members": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
export class Box {
    private unused = 1;
    #unused = 2;
    private used = 3;
    #used = 4;

    read(): number {
        return this.used + this.#used;
    }
}