namespace ts {
    describe("unittests:: tsbuild:: when tsconfig extends the missing file", () => {
        let projFs: vfs.FileSystem;
        before(() => {
            projFs = ts.loadProjectFromDisk("tests/projects/missingExtendedConfig");
        });
        after(() => {
            projFs = undefined!;
        });
        ts.verifyTsc({
            scenario: "missingExtendedConfig",
            subScenario: "when tsconfig extends the missing file",
            fs: () => projFs,
            commandLineArgs: ["--b", "/src/tsconfig.json"],
        });
    });
}
