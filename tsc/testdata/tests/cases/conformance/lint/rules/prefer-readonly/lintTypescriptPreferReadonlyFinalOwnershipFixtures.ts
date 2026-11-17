// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalOwnershipFixtures/prefer-readonly (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/prefer-readonly": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts

class Owner {
    private stable = 1;
    private nested = { count: 0 };
    #stable = 1;
    private [Symbol.iterator] = () => 1;
    private updated = 1;
    private captured = 1;
    private static updated = 1;
    constructor(private parameter = 1) {
        this.stable = 2;
        Owner.updated++;
        const self = this;
        (() => self.captured++)();
    }
    update(other: { stable: number }) {
        other.stable++;
        this.nested.count++;
        this['updated']++;
        return this.#stable + this.parameter;
    }
}