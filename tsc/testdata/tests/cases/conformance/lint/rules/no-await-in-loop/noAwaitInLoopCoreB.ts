// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-await-in-loop":"error"}},"files":["main.ts"]}
// @filename: main.ts
async function run(values: AsyncIterable<number>, ready: Promise<boolean>) {
    for (let index = await ready; await ready; index = await ready) {
        await ready;
        const deferred = async () => await ready;
    }
    for await (const value of values) {
        await ready;
        while (value) await ready;
    }
    for (const value of await Promise.resolve([1])) await ready;
    do { await ready; } while (await ready);
    while (true) { await using resource = acquire(); }
}
declare function acquire(): AsyncDisposable;