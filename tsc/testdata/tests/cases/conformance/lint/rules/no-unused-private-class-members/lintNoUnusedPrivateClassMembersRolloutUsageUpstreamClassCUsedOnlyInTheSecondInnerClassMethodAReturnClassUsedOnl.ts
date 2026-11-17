// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-unused-private-class-members/class_C_{_____#usedOnlyInTheSecondInnerClass;______method(a)_{_________return_class_{_____________#usedOnlyInTheSecondInnerClass;______________method2(b)_{_________________foo_=_b.#usedOnlyInTheSecondInnerClass;_____________}______________method3(b)_{_________________foo_=_b.#usedOnlyInTheSecondInnerClass;_____________}_________}_____}_} (invocation 1).
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
            "no-unused-private-class-members": "error"
        }
    },
    "files": [
        "/input.ts",
        "globals.d.ts"
    ]
}
// @filename: /globals.d.ts

// @filename: /input.ts
class C {
    #usedOnlyInTheSecondInnerClass;

    method(a) {
        return class {
            #usedOnlyInTheSecondInnerClass;

            method2(b) {
                foo = b.#usedOnlyInTheSecondInnerClass;
            }

            method3(b) {
                foo = b.#usedOnlyInTheSecondInnerClass;
            }
        }
    }
}