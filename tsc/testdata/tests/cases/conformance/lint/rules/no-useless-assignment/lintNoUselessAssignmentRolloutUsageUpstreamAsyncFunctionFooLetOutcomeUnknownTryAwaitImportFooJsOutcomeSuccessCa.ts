// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-useless-assignment/async_function_foo()_{____let_outcome_=_'unknown';_____try_{_____await_import("./foo.js");_____outcome_=_'success';____}_catch_(err)_{_____await_import("./bar.js");_____outcome_=_'exception';____}_finally_{_____console.log(outcome);____}___} (invocation 1).
// Upstream source revisions and MIT notices: ../../UPSTREAM-LICENSE.txt.
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "moduleDetection": "force",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-useless-assignment": "error"
        }
    },
    "files": [
        "/input.ts",
        "globals.d.ts"
    ]
}
// @filename: /globals.d.ts

// @filename: /input.ts
async function foo() {
			let outcome = 'unknown';

			try {
				await import("./foo.js");
				outcome = 'success';
			} catch (err) {
				await import("./bar.js");
				outcome = 'exception';
			} finally {
				console.log(outcome);
			}
		}