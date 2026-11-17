// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoSparseArrays/const_value_=_[1,2,];_const_[,a]_=_value;_[,b]_=_value; (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-sparse-arrays": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const value = [1,2,]; const [,a] = value; [,b] = value;