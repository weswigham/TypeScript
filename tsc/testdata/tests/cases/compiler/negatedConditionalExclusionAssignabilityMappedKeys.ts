// @strict: true
// @noEmit: true

function filteredStringKeys<T>(value: keyof T & string & not "_key"): keyof {
    [K in keyof T & string as K extends "_key" ? never : K]: T[K];
} {
    return value;
}

function filteredNumberKeys<T>(value: keyof T & number & not 0): keyof {
    [K in keyof T & number as K extends 0 ? never : K]: T[K];
} {
    return value;
}

declare const hiddenKey: unique symbol;

function filteredSymbolKeys<T>(value: keyof T & symbol & not typeof hiddenKey): keyof {
    [K in keyof T & symbol as K extends typeof hiddenKey ? never : K]: T[K];
} {
    return value;
}

function multipleExcludedKeys<T>(value: keyof T & not ("first" | "second")): keyof {
    [K in keyof T & {} as K extends "first" | "second" ? never : K]: T[K];
} {
    return value;
}

type FilteredKeys<T, U> = keyof {
    [K in keyof T & string as K extends U ? never : K]: T[K];
};

function genericFilteredKeys<T, U>(value: keyof T & string & not U): FilteredKeys<T, U> {
    return value;
}

function unfilteredKeys<T>(value: keyof T & string): FilteredKeys<T, "_key"> {
    return value;
}

function excludedKey<T>(value: keyof T & "_key"): FilteredKeys<T, "_key"> {
    return value;
}

type ChildPaths<T> = [PathTuples<T>] extends [never] ? [] : PathTuples<T>;
type PathTuples<T> = T extends object ? {
    [K in keyof T & string as K extends "_key" ? never : K]:
        [PathTuples<T[K]>] extends [never] ? never : readonly [K, ...ChildPaths<T[K]>];
}[keyof T & string & not "_key"] : [];

const nestedPath: PathTuples<{ _key: string; child: { value: number } }> = ["child", "value"];
const excludedPath: PathTuples<{ _key: string; child: { value: number } }> = ["_key"];

type RecursivePaths<T> = {
    [K in keyof T & string as K extends "_key" ? never : K]:
        T[K] extends object ? readonly [K, ...RecursivePaths<T[K]>] : readonly [K];
}[keyof T & string & not "_key"];

const recursivePath: RecursivePaths<{ _key: string; child: { value: number } }> = ["child", "value"];
const recursiveExcludedPath: RecursivePaths<{ _key: string; child: { value: number } }> = ["_key"];
