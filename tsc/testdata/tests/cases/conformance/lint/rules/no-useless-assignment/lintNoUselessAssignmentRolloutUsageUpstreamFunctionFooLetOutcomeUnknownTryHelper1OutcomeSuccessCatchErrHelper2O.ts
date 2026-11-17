// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-useless-assignment/function_foo()_{____let_outcome_=_'unknown';_____try_{_____helper1();_____outcome_=_'success';____}_catch_(err)_{_____helper2();_____outcome_=_'exception';_____}_finally_{_____console.log(outcome);____}___} (invocation 1).
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
function foo() {
			let outcome = 'unknown';

			try {
				helper1();
				outcome = 'success';
			} catch (err) {
				helper2();
				outcome = 'exception'; 
			} finally {
				console.log(outcome);
			}
		}