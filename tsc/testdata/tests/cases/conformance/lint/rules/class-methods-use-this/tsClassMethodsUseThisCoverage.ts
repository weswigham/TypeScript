// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "preserve", "strict": true },
    "lint": { "rules": { "@typescript-eslint/class-methods-use-this": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
class InstanceMethods {
    value = 1;
    unusedInstance() { return 2; }
    unusedArrow = () => 3;
    usedInstance() { return this.value; }
    lexicalInstance() { return () => this.value; }
    usedArrow = () => this.value;
    static validStatic() { return 4; }
}
export {};