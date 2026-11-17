// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRestrictionsUpstream/no-restricted-imports/114 (invocation 1).
// Upstream source revisions and MIT notices: ../../UPSTREAM-LICENSE.txt.
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-restricted-imports": [
                "error",
                {
                    "paths": [
                        {
                            "importNames": [
                                "Text"
                            ],
                            "message": "import Text from ui/_components instead",
                            "name": "react-native"
                        },
                        {
                            "importNames": [
                                "TextInput"
                            ],
                            "message": "import TextInput from ui/_components instead",
                            "name": "react-native"
                        },
                        {
                            "importNames": [
                                "View"
                            ],
                            "message": "import View from ui/_components instead ",
                            "name": "react-native"
                        },
                        {
                            "importNames": [
                                "ScrollView"
                            ],
                            "message": "import ScrollView from ui/_components instead",
                            "name": "react-native"
                        },
                        {
                            "importNames": [
                                "KeyboardAvoidingView"
                            ],
                            "message": "import KeyboardAvoidingView from ui/_components instead",
                            "name": "react-native"
                        },
                        {
                            "importNames": [
                                "ImageBackground"
                            ],
                            "message": "import ImageBackground from ui/_components instead",
                            "name": "react-native"
                        },
                        {
                            "importNames": [
                                "Image"
                            ],
                            "message": "import Image from ui/_components instead",
                            "name": "react-native"
                        }
                    ]
                }
            ]
        }
    },
    "files": [
        "/input.tsx"
    ]
}
// @filename: /input.tsx
import { Image, Text, ScrollView } from 'react-native'