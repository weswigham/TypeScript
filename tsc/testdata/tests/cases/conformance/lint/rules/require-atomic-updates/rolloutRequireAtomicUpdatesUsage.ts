// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "require-atomic-updates": "error" } }
}
// @filename: input.ts
let shared = 0;
declare function work(): Promise<number>;
export async function update(object: { value: number }) {
    shared += await work();
    shared = (await work()) + shared;
    if (object.value) {
        object.value = await work();
    }
    let local = 0;
    local += await work();
    return local;
}