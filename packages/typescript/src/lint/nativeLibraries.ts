import type {
    ImplicitLibVariableOptions,
    LibDefinition,
} from "@typescript-eslint/scope-manager";

interface NativeLibraryDefinition {
    libs: readonly string[];
    variables: LibDefinition["variables"];
}

const typeOnly: ImplicitLibVariableOptions = {
    eslintImplicitGlobalSetting: "readonly",
    isTypeVariable: true,
    isValueVariable: false,
};

const fullLibraries = ["dom", "webworker.importscripts", "scripthost", "dom.iterable", "dom.asynciterable"];

/**
 * Scope definitions for additions in tsc/internal/bundled/libs not modeled by the
 * installed scope-manager. Aliases below have identical global names and flags;
 * umbrella references follow the compiler libraries rather than widening to ESNext.
 */
export const nativeLibraryDefinitions: Readonly<Record<string, NativeLibraryDefinition>> = {
    "es2026": {
        libs: ["es2025", "es2026.array", "es2026.collection", "es2026.error", "es2026.iterator", "es2026.json", "es2026.math", "es2026.typedarrays"],
        variables: [],
    },
    "es2026.full": { libs: ["es2026", ...fullLibraries], variables: [] },
    "es2026.array": { libs: ["esnext.array"], variables: [] },
    "es2026.collection": { libs: ["esnext.collection"], variables: [] },
    "es2026.error": { libs: ["esnext.error"], variables: [] },
    "es2026.iterator": { libs: ["es2025.iterator"], variables: [["IteratorConstructor", typeOnly]] },
    "es2026.json": { libs: [], variables: [["RawJSON", typeOnly], ["JSON", typeOnly]] },
    "es2026.math": { libs: ["es2015.iterable"], variables: [["Math", typeOnly]] },
    "es2026.typedarrays": { libs: ["esnext.typedarrays"], variables: [] },
    "esnext": {
        libs: ["es2026", "esnext.intl", "esnext.decorators", "esnext.disposable", "esnext.sharedmemory", "esnext.temporal", "esnext.date", "esnext.iterator", "esnext.modulesource", "esnext.promise"],
        variables: [],
    },
    "esnext.full": { libs: ["esnext", ...fullLibraries], variables: [] },
    "esnext.iterator": { libs: ["es2026.iterator"], variables: [["IteratorObject", typeOnly], ["IteratorConstructor", typeOnly]] },
    "esnext.modulesource": { libs: ["es2015.symbol.wellknown"], variables: [["AbstractModuleSource", typeOnly]] },
    "esnext.promise": { libs: ["es2020.promise", "es2025.promise"], variables: [["PromiseConstructor", typeOnly]] },
};
