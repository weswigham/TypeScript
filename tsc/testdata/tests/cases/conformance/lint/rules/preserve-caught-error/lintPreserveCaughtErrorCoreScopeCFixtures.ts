// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCFixtures/preserve-caught-error (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "preserve-caught-error": [
                "error",
                {
                    "errorClassNames": [
                        {
                            "argumentPosition": 3,
                            "name": "CustomError"
                        }
                    ],
                    "requireCatchParameter": true
                }
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
try {} catch (error) {
    throw new Error("symptom");
}
try {} catch (error) {
    throw new Error("symptom", { cause: error });
}
try {} catch (error) {
    throw new Error("symptom", { cause: other });
}
try {} catch (error) {
    {
        const error = other;
        throw new Error("symptom", { cause: error });
    }
}
try {} catch {
    throw new TypeError("symptom");
}
try {} catch (error) {
    throw new CustomError("code", "symptom", { cause: error });
}