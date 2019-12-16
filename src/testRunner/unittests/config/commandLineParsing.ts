namespace ts {
    describe("unittests:: config:: commandLineParsing:: parseCommandLine", () => {
        function assertParseResult(commandLine: string[], expectedParsedCommandLine: ts.ParsedCommandLine) {
            const parsed = ts.parseCommandLine(commandLine);
            const parsedCompilerOptions = JSON.stringify(parsed.options);
            const expectedCompilerOptions = JSON.stringify(expectedParsedCommandLine.options);
            assert.equal(parsedCompilerOptions, expectedCompilerOptions);
            assert.deepEqual(parsed.watchOptions, expectedParsedCommandLine.watchOptions);
            const parsedErrors = parsed.errors;
            const expectedErrors = expectedParsedCommandLine.errors;
            assert.isTrue(parsedErrors.length === expectedErrors.length, `Expected error: ${JSON.stringify(expectedErrors)}. Actual error: ${JSON.stringify(parsedErrors)}.`);
            for (let i = 0; i < parsedErrors.length; i++) {
                const parsedError = parsedErrors[i];
                const expectedError = expectedErrors[i];
                assert.equal(parsedError.code, expectedError.code);
                assert.equal(parsedError.category, expectedError.category);
                assert.equal(parsedError.messageText, expectedError.messageText);
            }
            const parsedFileNames = parsed.fileNames;
            const expectedFileNames = expectedParsedCommandLine.fileNames;
            assert.isTrue(parsedFileNames.length === expectedFileNames.length, `Expected fileNames: [${JSON.stringify(expectedFileNames)}]. Actual fileNames: [${JSON.stringify(parsedFileNames)}].`);
            for (let i = 0; i < parsedFileNames.length; i++) {
                const parsedFileName = parsedFileNames[i];
                const expectedFileName = expectedFileNames[i];
                assert.equal(parsedFileName, expectedFileName);
            }
        }
        it("Parse single option of library flag ", () => {
            // --lib es6 0.ts
            assertParseResult(["--lib", "es6", "0.ts"], {
                errors: [],
                fileNames: ["0.ts"],
                options: {
                    lib: ["lib.es2015.d.ts"]
                }
            });
        });
        it("Handles 'did you mean?' for misspelt flags", () => {
            // --declarations --allowTS
            assertParseResult(["--declarations", "--allowTS"], {
                errors: [
                    {
                        messageText: "Unknown compiler option '--declarations'. Did you mean 'declaration'?",
                        category: ts.Diagnostics.Unknown_compiler_option_0_Did_you_mean_1.category,
                        code: ts.Diagnostics.Unknown_compiler_option_0_Did_you_mean_1.code,
                        file: undefined,
                        start: undefined,
                        length: undefined
                    },
                    {
                        messageText: "Unknown compiler option '--allowTS'. Did you mean 'allowJs'?",
                        category: ts.Diagnostics.Unknown_compiler_option_0_Did_you_mean_1.category,
                        code: ts.Diagnostics.Unknown_compiler_option_0_Did_you_mean_1.code,
                        file: undefined,
                        start: undefined,
                        length: undefined
                    }
                ],
                fileNames: [],
                options: {}
            });
        });
        it("Parse multiple options of library flags ", () => {
            // --lib es5,es2015.symbol.wellknown 0.ts
            assertParseResult(["--lib", "es5,es2015.symbol.wellknown", "0.ts"], {
                errors: [],
                fileNames: ["0.ts"],
                options: {
                    lib: ["lib.es5.d.ts", "lib.es2015.symbol.wellknown.d.ts"]
                }
            });
        });
        it("Parse invalid option of library flags ", () => {
            // --lib es5,invalidOption 0.ts
            assertParseResult(["--lib", "es5,invalidOption", "0.ts"], {
                errors: [{
                        messageText: "Argument for '--lib' option must be: 'es5', 'es6', 'es2015', 'es7', 'es2016', 'es2017', 'es2018', 'es2019', 'es2020', 'esnext', 'dom', 'dom.iterable', 'webworker', 'webworker.importscripts', 'scripthost', 'es2015.core', 'es2015.collection', 'es2015.generator', 'es2015.iterable', 'es2015.promise', 'es2015.proxy', 'es2015.reflect', 'es2015.symbol', 'es2015.symbol.wellknown', 'es2016.array.include', 'es2017.object', 'es2017.sharedmemory', 'es2017.string', 'es2017.intl', 'es2017.typedarrays', 'es2018.asyncgenerator', 'es2018.asynciterable', 'es2018.intl', 'es2018.promise', 'es2018.regexp', 'es2019.array', 'es2019.object', 'es2019.string', 'es2019.symbol', 'es2020.string', 'es2020.symbol.wellknown', 'esnext.array', 'esnext.symbol', 'esnext.asynciterable', 'esnext.intl', 'esnext.bigint'.",
                        category: ts.Diagnostics.Argument_for_0_option_must_be_Colon_1.category,
                        code: ts.Diagnostics.Argument_for_0_option_must_be_Colon_1.code,
                        file: undefined,
                        start: undefined,
                        length: undefined,
                    }],
                fileNames: ["0.ts"],
                options: {
                    lib: ["lib.es5.d.ts"]
                }
            });
        });
        it("Parse empty options of --jsx ", () => {
            // 0.ts --jsx
            assertParseResult(["0.ts", "--jsx"], {
                errors: [{
                        messageText: "Compiler option 'jsx' expects an argument.",
                        category: ts.Diagnostics.Compiler_option_0_expects_an_argument.category,
                        code: ts.Diagnostics.Compiler_option_0_expects_an_argument.code,
                        file: undefined,
                        start: undefined,
                        length: undefined,
                    }, {
                        messageText: "Argument for '--jsx' option must be: 'preserve', 'react-native', 'react'.",
                        category: ts.Diagnostics.Argument_for_0_option_must_be_Colon_1.category,
                        code: ts.Diagnostics.Argument_for_0_option_must_be_Colon_1.code,
                        file: undefined,
                        start: undefined,
                        length: undefined,
                    }],
                fileNames: ["0.ts"],
                options: {}
            });
        });
        it("Parse empty options of --module ", () => {
            // 0.ts --
            assertParseResult(["0.ts", "--module"], {
                errors: [{
                        messageText: "Compiler option 'module' expects an argument.",
                        category: ts.Diagnostics.Compiler_option_0_expects_an_argument.category,
                        code: ts.Diagnostics.Compiler_option_0_expects_an_argument.code,
                        file: undefined,
                        start: undefined,
                        length: undefined,
                    }, {
                        messageText: "Argument for '--module' option must be: 'none', 'commonjs', 'amd', 'system', 'umd', 'es6', 'es2015', 'esnext'.",
                        category: ts.Diagnostics.Argument_for_0_option_must_be_Colon_1.category,
                        code: ts.Diagnostics.Argument_for_0_option_must_be_Colon_1.code,
                        file: undefined,
                        start: undefined,
                        length: undefined,
                    }],
                fileNames: ["0.ts"],
                options: {}
            });
        });
        it("Parse empty options of --newLine ", () => {
            // 0.ts --newLine
            assertParseResult(["0.ts", "--newLine"], {
                errors: [{
                        messageText: "Compiler option 'newLine' expects an argument.",
                        category: ts.Diagnostics.Compiler_option_0_expects_an_argument.category,
                        code: ts.Diagnostics.Compiler_option_0_expects_an_argument.code,
                        file: undefined,
                        start: undefined,
                        length: undefined,
                    }, {
                        messageText: "Argument for '--newLine' option must be: 'crlf', 'lf'.",
                        category: ts.Diagnostics.Argument_for_0_option_must_be_Colon_1.category,
                        code: ts.Diagnostics.Argument_for_0_option_must_be_Colon_1.code,
                        file: undefined,
                        start: undefined,
                        length: undefined,
                    }],
                fileNames: ["0.ts"],
                options: {}
            });
        });
        it("Parse empty options of --target ", () => {
            // 0.ts --target
            assertParseResult(["0.ts", "--target"], {
                errors: [{
                        messageText: "Compiler option 'target' expects an argument.",
                        category: ts.Diagnostics.Compiler_option_0_expects_an_argument.category,
                        code: ts.Diagnostics.Compiler_option_0_expects_an_argument.code,
                        file: undefined,
                        start: undefined,
                        length: undefined,
                    }, {
                        messageText: "Argument for '--target' option must be: 'es3', 'es5', 'es6', 'es2015', 'es2016', 'es2017', 'es2018', 'es2019', 'es2020', 'esnext'.",
                        category: ts.Diagnostics.Argument_for_0_option_must_be_Colon_1.category,
                        code: ts.Diagnostics.Argument_for_0_option_must_be_Colon_1.code,
                        file: undefined,
                        start: undefined,
                        length: undefined,
                    }],
                fileNames: ["0.ts"],
                options: {}
            });
        });
        it("Parse empty options of --moduleResolution ", () => {
            // 0.ts --moduleResolution
            assertParseResult(["0.ts", "--moduleResolution"], {
                errors: [{
                        messageText: "Compiler option 'moduleResolution' expects an argument.",
                        category: ts.Diagnostics.Compiler_option_0_expects_an_argument.category,
                        code: ts.Diagnostics.Compiler_option_0_expects_an_argument.code,
                        file: undefined,
                        start: undefined,
                        length: undefined,
                    }, {
                        messageText: "Argument for '--moduleResolution' option must be: 'node', 'classic'.",
                        category: ts.Diagnostics.Argument_for_0_option_must_be_Colon_1.category,
                        code: ts.Diagnostics.Argument_for_0_option_must_be_Colon_1.code,
                        file: undefined,
                        start: undefined,
                        length: undefined,
                    }],
                fileNames: ["0.ts"],
                options: {}
            });
        });
        it("Parse empty options of --lib ", () => {
            // 0.ts --lib
            assertParseResult(["0.ts", "--lib"], {
                errors: [{
                        messageText: "Compiler option 'lib' expects an argument.",
                        category: ts.Diagnostics.Compiler_option_0_expects_an_argument.category,
                        code: ts.Diagnostics.Compiler_option_0_expects_an_argument.code,
                        file: undefined,
                        start: undefined,
                        length: undefined,
                    }],
                fileNames: ["0.ts"],
                options: {
                    lib: []
                }
            });
        });
        it("Parse empty string of --lib ", () => {
            // 0.ts --lib
            // This test is an error because the empty string is falsey
            assertParseResult(["0.ts", "--lib", ""], {
                errors: [{
                        messageText: "Compiler option 'lib' expects an argument.",
                        category: ts.Diagnostics.Compiler_option_0_expects_an_argument.category,
                        code: ts.Diagnostics.Compiler_option_0_expects_an_argument.code,
                        file: undefined,
                        start: undefined,
                        length: undefined,
                    }],
                fileNames: ["0.ts"],
                options: {
                    lib: []
                }
            });
        });
        it("Parse immediately following command line argument of --lib ", () => {
            // 0.ts --lib
            assertParseResult(["0.ts", "--lib", "--sourcemap"], {
                errors: [],
                fileNames: ["0.ts"],
                options: {
                    lib: [],
                    sourceMap: true
                }
            });
        });
        it("Parse --lib option with extra comma ", () => {
            // --lib es5, es7 0.ts
            assertParseResult(["--lib", "es5,", "es7", "0.ts"], {
                errors: [{
                        messageText: "Argument for '--lib' option must be: 'es5', 'es6', 'es2015', 'es7', 'es2016', 'es2017', 'es2018', 'es2019', 'es2020', 'esnext', 'dom', 'dom.iterable', 'webworker', 'webworker.importscripts', 'scripthost', 'es2015.core', 'es2015.collection', 'es2015.generator', 'es2015.iterable', 'es2015.promise', 'es2015.proxy', 'es2015.reflect', 'es2015.symbol', 'es2015.symbol.wellknown', 'es2016.array.include', 'es2017.object', 'es2017.sharedmemory', 'es2017.string', 'es2017.intl', 'es2017.typedarrays', 'es2018.asyncgenerator', 'es2018.asynciterable', 'es2018.intl', 'es2018.promise', 'es2018.regexp', 'es2019.array', 'es2019.object', 'es2019.string', 'es2019.symbol', 'es2020.string', 'es2020.symbol.wellknown', 'esnext.array', 'esnext.symbol', 'esnext.asynciterable', 'esnext.intl', 'esnext.bigint'.",
                        category: ts.Diagnostics.Argument_for_0_option_must_be_Colon_1.category,
                        code: ts.Diagnostics.Argument_for_0_option_must_be_Colon_1.code,
                        file: undefined,
                        start: undefined,
                        length: undefined,
                    }],
                fileNames: ["es7", "0.ts"],
                options: {
                    lib: ["lib.es5.d.ts"]
                }
            });
        });
        it("Parse --lib option with trailing white-space ", () => {
            // --lib es5, es7 0.ts
            assertParseResult(["--lib", "es5, ", "es7", "0.ts"], {
                errors: [{
                        messageText: "Argument for '--lib' option must be: 'es5', 'es6', 'es2015', 'es7', 'es2016', 'es2017', 'es2018', 'es2019', 'es2020', 'esnext', 'dom', 'dom.iterable', 'webworker', 'webworker.importscripts', 'scripthost', 'es2015.core', 'es2015.collection', 'es2015.generator', 'es2015.iterable', 'es2015.promise', 'es2015.proxy', 'es2015.reflect', 'es2015.symbol', 'es2015.symbol.wellknown', 'es2016.array.include', 'es2017.object', 'es2017.sharedmemory', 'es2017.string', 'es2017.intl', 'es2017.typedarrays', 'es2018.asyncgenerator', 'es2018.asynciterable', 'es2018.intl', 'es2018.promise', 'es2018.regexp', 'es2019.array', 'es2019.object', 'es2019.string', 'es2019.symbol', 'es2020.string', 'es2020.symbol.wellknown', 'esnext.array', 'esnext.symbol', 'esnext.asynciterable', 'esnext.intl', 'esnext.bigint'.",
                        category: ts.Diagnostics.Argument_for_0_option_must_be_Colon_1.category,
                        code: ts.Diagnostics.Argument_for_0_option_must_be_Colon_1.code,
                        file: undefined,
                        start: undefined,
                        length: undefined,
                    }],
                fileNames: ["es7", "0.ts"],
                options: {
                    lib: ["lib.es5.d.ts"]
                }
            });
        });
        it("Parse multiple compiler flags with input files at the end", () => {
            // --lib es5,es2015.symbol.wellknown --target es5 0.ts
            assertParseResult(["--lib", "es5,es2015.symbol.wellknown", "--target", "es5", "0.ts"], {
                errors: [],
                fileNames: ["0.ts"],
                options: {
                    lib: ["lib.es5.d.ts", "lib.es2015.symbol.wellknown.d.ts"],
                    target: ts.ScriptTarget.ES5,
                }
            });
        });
        it("Parse multiple compiler flags with input files in the middle", () => {
            // --module commonjs --target es5 0.ts --lib es5,es2015.symbol.wellknown
            assertParseResult(["--module", "commonjs", "--target", "es5", "0.ts", "--lib", "es5,es2015.symbol.wellknown"], {
                errors: [],
                fileNames: ["0.ts"],
                options: {
                    module: ts.ModuleKind.CommonJS,
                    target: ts.ScriptTarget.ES5,
                    lib: ["lib.es5.d.ts", "lib.es2015.symbol.wellknown.d.ts"],
                }
            });
        });
        it("Parse multiple library compiler flags ", () => {
            // --module commonjs --target es5 --lib es5 0.ts --library es2015.array,es2015.symbol.wellknown
            assertParseResult(["--module", "commonjs", "--target", "es5", "--lib", "es5", "0.ts", "--lib", "es2015.core, es2015.symbol.wellknown "], {
                errors: [],
                fileNames: ["0.ts"],
                options: {
                    module: ts.ModuleKind.CommonJS,
                    target: ts.ScriptTarget.ES5,
                    lib: ["lib.es2015.core.d.ts", "lib.es2015.symbol.wellknown.d.ts"],
                }
            });
        });
        it("Parse explicit boolean flag value", () => {
            assertParseResult(["--strictNullChecks", "false", "0.ts"], {
                errors: [],
                fileNames: ["0.ts"],
                options: {
                    strictNullChecks: false,
                }
            });
        });
        it("Parse non boolean argument after boolean flag", () => {
            assertParseResult(["--noImplicitAny", "t", "0.ts"], {
                errors: [],
                fileNames: ["t", "0.ts"],
                options: {
                    noImplicitAny: true,
                }
            });
        });
        it("Parse implicit boolean flag value", () => {
            assertParseResult(["--strictNullChecks"], {
                errors: [],
                fileNames: [],
                options: {
                    strictNullChecks: true,
                }
            });
        });
        it("parse --incremental", () => {
            // --lib es6 0.ts
            assertParseResult(["--incremental", "0.ts"], {
                errors: [],
                fileNames: ["0.ts"],
                options: { incremental: true }
            });
        });
        it("parse --tsBuildInfoFile", () => {
            // --lib es6 0.ts
            assertParseResult(["--tsBuildInfoFile", "build.tsbuildinfo", "0.ts"], {
                errors: [],
                fileNames: ["0.ts"],
                options: { tsBuildInfoFile: "build.tsbuildinfo" }
            });
        });
        describe("Watch options", () => {
            it("parse --watchFile", () => {
                assertParseResult(["--watchFile", "UseFsEvents", "0.ts"], {
                    errors: [],
                    fileNames: ["0.ts"],
                    options: {},
                    watchOptions: { watchFile: ts.WatchFileKind.UseFsEvents }
                });
            });
            it("parse --watchDirectory", () => {
                assertParseResult(["--watchDirectory", "FixedPollingInterval", "0.ts"], {
                    errors: [],
                    fileNames: ["0.ts"],
                    options: {},
                    watchOptions: { watchDirectory: ts.WatchDirectoryKind.FixedPollingInterval }
                });
            });
            it("parse --fallbackPolling", () => {
                assertParseResult(["--fallbackPolling", "PriorityInterval", "0.ts"], {
                    errors: [],
                    fileNames: ["0.ts"],
                    options: {},
                    watchOptions: { fallbackPolling: ts.PollingWatchKind.PriorityInterval }
                });
            });
            it("parse --synchronousWatchDirectory", () => {
                assertParseResult(["--synchronousWatchDirectory", "0.ts"], {
                    errors: [],
                    fileNames: ["0.ts"],
                    options: {},
                    watchOptions: { synchronousWatchDirectory: true }
                });
            });
            it("errors on missing argument to --fallbackPolling", () => {
                assertParseResult(["0.ts", "--fallbackPolling"], {
                    errors: [
                        {
                            messageText: "Watch option 'fallbackPolling' requires a value of type string.",
                            category: ts.Diagnostics.Watch_option_0_requires_a_value_of_type_1.category,
                            code: ts.Diagnostics.Watch_option_0_requires_a_value_of_type_1.code,
                            file: undefined,
                            start: undefined,
                            length: undefined
                        },
                        {
                            messageText: "Argument for '--fallbackPolling' option must be: 'fixedinterval', 'priorityinterval', 'dynamicpriority'.",
                            category: ts.Diagnostics.Argument_for_0_option_must_be_Colon_1.category,
                            code: ts.Diagnostics.Argument_for_0_option_must_be_Colon_1.code,
                            file: undefined,
                            start: undefined,
                            length: undefined
                        }
                    ],
                    fileNames: ["0.ts"],
                    options: {},
                    watchOptions: { fallbackPolling: undefined }
                });
            });
        });
    });
    describe("unittests:: config:: commandLineParsing:: parseBuildOptions", () => {
        function assertParseResult(commandLine: string[], expectedParsedBuildCommand: ts.ParsedBuildCommand) {
            const parsed = ts.parseBuildCommand(commandLine);
            const parsedBuildOptions = JSON.stringify(parsed.buildOptions);
            const expectedBuildOptions = JSON.stringify(expectedParsedBuildCommand.buildOptions);
            assert.equal(parsedBuildOptions, expectedBuildOptions);
            assert.deepEqual(parsed.watchOptions, expectedParsedBuildCommand.watchOptions);
            const parsedErrors = parsed.errors;
            const expectedErrors = expectedParsedBuildCommand.errors;
            assert.isTrue(parsedErrors.length === expectedErrors.length, `Expected error: ${JSON.stringify(expectedErrors)}. Actual error: ${JSON.stringify(parsedErrors)}.`);
            for (let i = 0; i < parsedErrors.length; i++) {
                const parsedError = parsedErrors[i];
                const expectedError = expectedErrors[i];
                assert.equal(parsedError.code, expectedError.code);
                assert.equal(parsedError.category, expectedError.category);
                assert.equal(parsedError.messageText, expectedError.messageText);
            }
            const parsedProjects = parsed.projects;
            const expectedProjects = expectedParsedBuildCommand.projects;
            assert.deepEqual(parsedProjects, expectedProjects, `Expected projects: [${JSON.stringify(expectedProjects)}]. Actual projects: [${JSON.stringify(parsedProjects)}].`);
        }
        it("parse build without any options ", () => {
            // --lib es6 0.ts
            assertParseResult([], {
                errors: [],
                projects: ["."],
                buildOptions: {},
                watchOptions: undefined
            });
        });
        it("Parse multiple options", () => {
            // --lib es5,es2015.symbol.wellknown 0.ts
            assertParseResult(["--verbose", "--force", "tests"], {
                errors: [],
                projects: ["tests"],
                buildOptions: { verbose: true, force: true },
                watchOptions: undefined
            });
        });
        it("Parse option with invalid option ", () => {
            // --lib es5,invalidOption 0.ts
            assertParseResult(["--verbose", "--invalidOption"], {
                errors: [{
                        messageText: "Unknown build option '--invalidOption'.",
                        category: ts.Diagnostics.Unknown_build_option_0.category,
                        code: ts.Diagnostics.Unknown_build_option_0.code,
                        file: undefined,
                        start: undefined,
                        length: undefined,
                    }],
                projects: ["."],
                buildOptions: { verbose: true },
                watchOptions: undefined
            });
        });
        it("parse build with listFilesOnly ", () => {
            // --lib es6 0.ts
            assertParseResult(["--listFilesOnly"], {
                errors: [{
                        messageText: "Unknown build option '--listFilesOnly'.",
                        category: ts.Diagnostics.Unknown_build_option_0.category,
                        code: ts.Diagnostics.Unknown_build_option_0.code,
                        file: undefined,
                        start: undefined,
                        length: undefined,
                    }],
                projects: ["."],
                buildOptions: {},
                watchOptions: undefined,
            });
        });
        it("Parse multiple flags with input projects at the end", () => {
            // --lib es5,es2015.symbol.wellknown --target es5 0.ts
            assertParseResult(["--force", "--verbose", "src", "tests"], {
                errors: [],
                projects: ["src", "tests"],
                buildOptions: { force: true, verbose: true },
                watchOptions: undefined,
            });
        });
        it("Parse multiple flags with input projects in the middle", () => {
            // --module commonjs --target es5 0.ts --lib es5,es2015.symbol.wellknown
            assertParseResult(["--force", "src", "tests", "--verbose"], {
                errors: [],
                projects: ["src", "tests"],
                buildOptions: { force: true, verbose: true },
                watchOptions: undefined,
            });
        });
        it("Parse multiple flags with input projects in the beginning", () => {
            // --module commonjs --target es5 0.ts --lib es5,es2015.symbol.wellknown
            assertParseResult(["src", "tests", "--force", "--verbose"], {
                errors: [],
                projects: ["src", "tests"],
                buildOptions: { force: true, verbose: true },
                watchOptions: undefined,
            });
        });
        it("parse build with --incremental", () => {
            // --lib es6 0.ts
            assertParseResult(["--incremental", "tests"], {
                errors: [],
                projects: ["tests"],
                buildOptions: { incremental: true },
                watchOptions: undefined,
            });
        });
        it("parse build with --locale en-us", () => {
            // --lib es6 0.ts
            assertParseResult(["--locale", "en-us", "src"], {
                errors: [],
                projects: ["src"],
                buildOptions: { locale: "en-us" },
                watchOptions: undefined,
            });
        });
        it("parse build with --tsBuildInfoFile", () => {
            // --lib es6 0.ts
            assertParseResult(["--tsBuildInfoFile", "build.tsbuildinfo", "tests"], {
                errors: [{
                        messageText: "Unknown build option '--tsBuildInfoFile'.",
                        category: ts.Diagnostics.Unknown_build_option_0.category,
                        code: ts.Diagnostics.Unknown_build_option_0.code,
                        file: undefined,
                        start: undefined,
                        length: undefined
                    }],
                projects: ["build.tsbuildinfo", "tests"],
                buildOptions: {},
                watchOptions: undefined,
            });
        });
        describe("Combining options that make no sense together", () => {
            function verifyInvalidCombination(flag1: keyof ts.BuildOptions, flag2: keyof ts.BuildOptions) {
                it(`--${flag1} and --${flag2} together is invalid`, () => {
                    // --module commonjs --target es5 0.ts --lib es5,es2015.symbol.wellknown
                    assertParseResult([`--${flag1}`, `--${flag2}`], {
                        errors: [{
                                messageText: `Options '${flag1}' and '${flag2}' cannot be combined.`,
                                category: ts.Diagnostics.Options_0_and_1_cannot_be_combined.category,
                                code: ts.Diagnostics.Options_0_and_1_cannot_be_combined.code,
                                file: undefined,
                                start: undefined,
                                length: undefined,
                            }],
                        projects: ["."],
                        buildOptions: { [flag1]: true, [flag2]: true },
                        watchOptions: undefined,
                    });
                });
            }
            verifyInvalidCombination("clean", "force");
            verifyInvalidCombination("clean", "verbose");
            verifyInvalidCombination("clean", "watch");
            verifyInvalidCombination("watch", "dry");
        });
        describe("Watch options", () => {
            it("parse --watchFile", () => {
                assertParseResult(["--watchFile", "UseFsEvents", "--verbose"], {
                    errors: [],
                    projects: ["."],
                    buildOptions: { verbose: true },
                    watchOptions: { watchFile: ts.WatchFileKind.UseFsEvents }
                });
            });
            it("parse --watchDirectory", () => {
                assertParseResult(["--watchDirectory", "FixedPollingInterval", "--verbose"], {
                    errors: [],
                    projects: ["."],
                    buildOptions: { verbose: true },
                    watchOptions: { watchDirectory: ts.WatchDirectoryKind.FixedPollingInterval }
                });
            });
            it("parse --fallbackPolling", () => {
                assertParseResult(["--fallbackPolling", "PriorityInterval", "--verbose"], {
                    errors: [],
                    projects: ["."],
                    buildOptions: { verbose: true },
                    watchOptions: { fallbackPolling: ts.PollingWatchKind.PriorityInterval }
                });
            });
            it("parse --synchronousWatchDirectory", () => {
                assertParseResult(["--synchronousWatchDirectory", "--verbose"], {
                    errors: [],
                    projects: ["."],
                    buildOptions: { verbose: true },
                    watchOptions: { synchronousWatchDirectory: true }
                });
            });
            it("errors on missing argument", () => {
                assertParseResult(["--verbose", "--fallbackPolling"], {
                    errors: [
                        {
                            messageText: "Watch option 'fallbackPolling' requires a value of type string.",
                            category: ts.Diagnostics.Watch_option_0_requires_a_value_of_type_1.category,
                            code: ts.Diagnostics.Watch_option_0_requires_a_value_of_type_1.code,
                            file: undefined,
                            start: undefined,
                            length: undefined
                        },
                        {
                            messageText: "Argument for '--fallbackPolling' option must be: 'fixedinterval', 'priorityinterval', 'dynamicpriority'.",
                            category: ts.Diagnostics.Argument_for_0_option_must_be_Colon_1.category,
                            code: ts.Diagnostics.Argument_for_0_option_must_be_Colon_1.code,
                            file: undefined,
                            start: undefined,
                            length: undefined
                        }
                    ],
                    projects: ["."],
                    buildOptions: { verbose: true },
                    watchOptions: { fallbackPolling: undefined }
                });
            });
        });
    });
}
