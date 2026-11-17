// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "strict": true },
    "lint": { "rules": { "@typescript-eslint/prefer-return-this-type": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts

class Example<T> {
    method(): Example<T> {
        return this;
    }
    arrow = (): Example<T> => this;
    explicit(this: Example<T>): Example<T> {
        return this;
    }
    construct(): Example<T> {
        return new Example<T>();
    }
}