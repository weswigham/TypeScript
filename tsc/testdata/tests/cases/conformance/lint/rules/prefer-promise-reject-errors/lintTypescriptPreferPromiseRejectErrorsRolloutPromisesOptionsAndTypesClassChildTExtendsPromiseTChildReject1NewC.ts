// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutPromisesOptionsAndTypes/prefer-promise-reject-errors/class_Child<T>_extends_Promise<T>_{}_Child.reject(1);_new_Child((resolve,_reject)_=>_reject(1)); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "lib": [
            "esnext",
            "dom"
        ],
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/prefer-promise-reject-errors": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class Child<T> extends Promise<T> {} Child.reject(1); new Child((resolve, reject) => reject(1));
export {};