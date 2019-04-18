// @strict: false
// @allowJs: true
// @checkJs: true
// @noEmit: true
// @target: es6
// @filename: iter.js

var chunks = /** @type {{ modulesIterable: { chunksIterable: { getNumberOfModules(): number }[] }[], getNumberOfModules(): number, hasRuntime(): boolean }[]} */(/** @type {*} */(null));
const notDuplicates = new Set();

for (const chunk of chunks) {
    let possibleDuplicates;
    for (const module of chunk.modulesIterable) {
        if (possibleDuplicates === undefined) {
            for (const dup of module.chunksIterable) {
                if (
                    dup !== chunk &&
                    chunk.getNumberOfModules() === dup.getNumberOfModules() &&
                    !notDuplicates.has(dup)
                ) {
                    if (possibleDuplicates === undefined) {
                        possibleDuplicates = new Set();
                    }
                    possibleDuplicates.add(dup);
                }
            }
            if (possibleDuplicates === undefined) break;
        } else {
            for (const dup of possibleDuplicates) {
                if (!dup.containsModule(module)) {
                    possibleDuplicates.delete(dup);
                }
            }
            if (possibleDuplicates.size === 0) break;
        }
    }

    if (
        possibleDuplicates !== undefined &&
        possibleDuplicates.size > 0
    ) {
        for (const otherChunk of possibleDuplicates) {
            if (otherChunk.hasRuntime() !== chunk.hasRuntime()) continue;
        }
    }

    notDuplicates.add(chunk);
}