import { LoadHook } from "module";
import { fileURLToPath } from "url";
import * as ts from "../typescript/typescript.js";

function getContextualHookLocationFor(url: string): string | undefined {
    try {
        // TODO: Export map hooks to `/hooks` directly (dtsBundler.mjs doesn't like us having an export map)
        return require.resolve("typescript/lib/hooks.js", { paths: require.resolve.paths(url) ?? undefined });
    }
    catch {
        return undefined;
    }
}

// TODO: This is not run for the root entrypoint for some reason.
// The example given in the docs is:
// node --import 'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register(pathToFileURL("./coffeescript-hooks.mjs"));' ./main.coffee
// Equivalently, we expect to be able to write
// node --require typescript/lib/register.js ./index.ts
// But it just doesn't work! This hook file never executes.
// Meanwhile, if you write a `indirect.js` containing `import("./index.ts")` it does!
// Maybe this differs in a type: module scope, but that seems *very* odd.
// Maybe we need a `require.extensions` handler on the main thread for that, but that's deprecated, so...

const load: LoadHook = async (url, context, next) => {
    if (ts.hasTSFileExtension(url)) {
        // TODO: Verify this correctly defers to nested hooks in real (non-linked) installations
        const contextualHookLocation = getContextualHookLocationFor(url);
        if (!contextualHookLocation || ts.comparePaths(contextualHookLocation, __filename)) {
            return await loadTSWithoutChecks(url, context, next);
        }
        else {
            const hookModule = require(contextualHookLocation);
            return await hookModule.loadTSWithoutChecks(url, context, next);
        }
    }
    return next(url);
};

const loadTSWithoutChecks: LoadHook = async (url, context, next) => {
    // TODO: Lots
    // TODO: Error on `.d.ts` or fast-path to an empty module?
    // What to do when a.ts -> b.d.ts -> c.ts ?
    // TODO: Sync with tsconfig options (via persistent LS?)
    // TODO: Why is there no package format lookup helper builtin to reuse the system package json cache?
    // TODO: Lookup compilerOptions for file (in LS?)
    // TODO: Cache (in LS? on disk? conditionally?)
    // TODO: What's a good error experience for a loader?

    const tsFormat = ts.getImpliedNodeFormatForFile(url, /*cache*/ undefined, ts.sys, { module: ts.ModuleKind.NodeNext });
    const format = tsFormat === ts.ModuleKind.ESNext ? "module" : "commonjs";
    const result = await next(url, {...context, format });
    let content = result.source?.toString(); // `source` is only present if the next loader in the chain provided it, it seems?
    if (!content) {
        content = ts.sys.readFile(fileURLToPath(url));
        if (!content) {
            return result;
        }
    }

    const compiled = ts.transpileModule(
        content,
        {
            fileName: url,
            compilerOptions: {
                module: tsFormat || ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ESNext,
                inlineSourceMap: true, // would prefer if it wasn't
            },
        },
    );

    return {
        // TODO: Does this need to short circuit? Why would it?
        source: compiled.outputText,
        format,
        // TODO: Set source map more directly..?
    };
};


export { load, loadTSWithoutChecks };

// TODO: `resolve` hook to allow non-exact path matches? Does that matter for esm?
// Seems like it only matters for cjs, which this doesn't seem to work for.

// TODO: Ignore deprecation warning and add a `require.extensions` helper to `register.js` to
// enable cjs entrypoints, since there's no replacement?
