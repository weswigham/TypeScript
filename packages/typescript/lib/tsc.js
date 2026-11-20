#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import getExePath from "./getExePath.js";

const exe = getExePath();
const args = [
    "--internal-lint-host",
    process.execPath,
    fileURLToPath(new URL("../dist/lint/shim.js", import.meta.url)),
    ...process.argv.slice(2),
];

if (process.platform !== "win32" && typeof process.execve === "function") {
    // > v22.15.0
    try {
        process.execve(exe, [exe, ...args]);
    }
    catch {
        // may not be available, ignore the error and fallback
    }
}

try {
    execFileSync(exe, args, { stdio: "inherit" });
}
catch (e) {
    if (e.status) {
        process.exitCode = e.status;
    }
    else {
        throw e;
    }
}
