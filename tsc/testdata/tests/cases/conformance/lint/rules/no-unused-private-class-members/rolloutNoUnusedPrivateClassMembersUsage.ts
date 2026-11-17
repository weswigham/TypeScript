// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "no-unused-private-class-members": "error" } }
}
// @filename: input.ts
export class Box {
    #unused = 1;
    #writeOnly = 0;
    #read = 1;
    set #accessor(value: number) {}
    method() {
        this.#writeOnly++;
        this.#accessor = 1;
        return this.#read;
    }
    nested() {
        return class {
            #read = 1;
            method() {
                return this.#read;
            }
        };
    }
}