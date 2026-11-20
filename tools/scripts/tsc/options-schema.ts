import assert from "node:assert/strict";
import {
    type Declaration,
    type GoValue,
    optionKind,
} from "./options-model.ts";
import {
    formattingProperties,
    options,
} from "./options.ts";

export interface JSONSchema {
    $schema?: string;
    $comment?: string;
    $ref?: string;
    title?: string;
    description?: string;
    markdownDescription?: string;
    type?: string | string[];
    properties?: Record<string, JSONSchema>;
    definitions?: Record<string, JSONSchema>;
    additionalProperties?: boolean | JSONSchema;
    required?: string[];
    items?: JSONSchema | JSONSchema[];
    additionalItems?: boolean;
    minItems?: number;
    anyOf?: JSONSchema[];
    allOf?: JSONSchema[];
    enum?: (string | number | null)[];
    enumDescriptions?: string[];
    pattern?: string;
    default?: string | boolean | number;
    minimum?: number;
    minLength?: number;
    deprecated?: boolean;
    deprecationMessage?: string;
    allowComments?: boolean;
    allowTrailingCommas?: boolean;
}

function nullable(schema: JSONSchema): JSONSchema {
    return { anyOf: [schema, { type: "null" }] };
}

function enumSchema(name: string): JSONSchema {
    const map = options.enumMaps[name];
    assert(map, `Missing enum map: ${name}`);
    const keys = [...map.values.map(entry => entry.name), ...(map.schemaOnlyValues ?? [])];
    return stringEnumSchema(keys, [...(map.deprecatedKeys ?? []), ...(map.schemaOnlyValues ?? [])]);
}

function stringEnumSchema(keys: string[], deprecatedKeys: string[] = []): JSONSchema {
    assert(keys.length > 0, "Empty schema enum");
    assert.equal(new Set(keys).size, keys.length, "Duplicate schema enum values");
    assert(keys.every(key => key === key.toLowerCase()), "Schema enum values must be lowercase");
    const pattern = keys.map(key => [...key].map(char => /[a-z]/.test(char) ? `[${char.toUpperCase()}${char}]` : char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("")).join("|");
    const suggestions: JSONSchema = { enum: keys };
    if (deprecatedKeys.length) {
        suggestions.enumDescriptions = keys.map(key => deprecatedKeys.includes(key) ? "Deprecated." : "");
    }
    // Keep enum completions while accepting every casing supported by the parser.
    return { type: "string", anyOf: [suggestions, { pattern: `^(${pattern})$` }] };
}

function defaultValue(value: GoValue | undefined, name: string): string | number | boolean | undefined {
    // Help text may wrap a literal string default in a Markdown code span.
    if (typeof value === "string") return value.replace(/^`([^`]*)`$/, "$1");
    if (value === undefined || typeof value !== "object") return value;
    if ("text" in value || value.go === "core.TSUnknown") return undefined;
    let constant = value.go;
    if (constant === "core.ScriptTargetLatestStandard") {
        const target = options.enums.find(enumDef => enumDef.name === "ScriptTarget")?.members.find(member => member.name === "LatestStandard");
        assert(target, "Missing ScriptTargetLatestStandard");
        constant = `core.ScriptTarget${target.value}`;
    }
    const entry = options.enumMaps[name]?.values.find(entry => typeof entry.value === "object" && entry.value.go === constant);
    assert(entry, `No schema default for ${name}: ${constant}`);
    return entry.name;
}

function valueSchema(declaration: Declaration): JSONSchema {
    switch (declaration.kind) {
        case "Boolean":
            return { type: "boolean" };
        case "String":
            return { type: "string" };
        case "Number":
            return { type: "number", ...(declaration.minValue !== undefined ? { minimum: declaration.minValue } : {}) };
        case "Enum":
            return enumSchema(declaration.name);
        case "List":
        case "ListOrElement": {
            const element = options.elements[declaration.name];
            assert(element, `Missing list element: ${declaration.name}`);
            const items = valueSchema(element);
            const array: JSONSchema = { type: "array", items };
            return declaration.kind === "List" ? array : { anyOf: [items, array] };
        }
        case "Object":
            if (declaration.name === "paths") {
                return { type: "object", additionalProperties: { type: "array", items: { type: "string" } } };
            }
            if (declaration.name === "plugin") {
                return { type: "object", properties: { name: { type: "string" } } };
            }
            if (declaration.name === "references") {
                return {
                    type: "object",
                    properties: { path: { type: "string", minLength: 1 }, circular: { type: "boolean" } },
                    required: ["path"],
                };
            }
            if (declaration.name === "generate") {
                return {
                    type: "object",
                    properties: {
                        cwd: { type: "string", minLength: 1, description: "Working directory for the command and its input/output patterns, relative to this configuration file." },
                        ...Object.fromEntries(["inputs", "outputs", "command"].map(name => [name, {
                            type: "array",
                            items: { type: "string", minLength: 1 },
                        }])),
                    },
                    required: ["inputs", "outputs", "command"],
                    additionalProperties: false,
                };
            }
            if (declaration.name === "contentMappers") {
                return {
                    type: "object",
                    properties: {
                        package: { type: "string", minLength: 1 },
                        extensions: { type: "array", items: { type: "string" } },
                        options: { type: "object" },
                    },
                    required: ["package", "extensions"],
                    additionalProperties: false,
                };
            }
            throw new Error(`Missing object schema: ${declaration.name}`);
    }
}

function withDescription(schema: JSONSchema, description: string | undefined, anchor: string | false): JSONSchema {
    if (description !== undefined) {
        schema.description = description;
        schema.markdownDescription = anchor === false
            ? description
            : `${description}\n\nSee the [TSConfig reference](https://www.typescriptlang.org/tsconfig/${anchor ? `#${anchor}` : ""}).`;
    }
    return schema;
}

function optionSchema(declaration: Declaration): JSONSchema {
    const schema = nullable(valueSchema(declaration));
    if (declaration.schemaDescription !== undefined) schema.description = declaration.schemaDescription;
    else if (declaration.description) schema.description = declaration.description.text;
    const value = defaultValue(declaration.defaultValueDescription, declaration.name);
    if (value !== undefined) schema.default = value;
    const defaultDescription = declaration.defaultValueDescription;
    if (typeof defaultDescription === "object" && "text" in defaultDescription) {
        schema.description = [schema.description, `Default: ${defaultDescription.text}`].filter(Boolean).join("\n\n");
    }
    return withDescription(schema, schema.description, declaration.documentationAnchor ?? declaration.name);
}

function optionObject(properties: Record<string, JSONSchema>) {
    return { type: ["object", "null"], properties, additionalProperties: true };
}

export function generateConfigSchema(kind: "tsconfig" | "jsconfig") {
    const compilerProperties: Record<string, JSONSchema> = {};
    for (const option of options.compilerOptions) {
        const declaration = option.declaration;
        if (!declaration || declaration.isCommandLineOnly || declaration.category?.go === "diagnostics.Command_line_Options") continue;
        const schema = optionSchema({
            name: option.name,
            kind: optionKind(option),
            ...declaration,
            ...(kind === "jsconfig" && option.jsconfigDefault !== undefined ? { defaultValueDescription: option.jsconfigDefault } : {}),
        });
        if (option.deprecated) {
            schema.deprecated = true;
            schema.deprecationMessage = "This compiler option is deprecated.";
        }
        compilerProperties[option.name] = schema;
    }
    for (const option of options.schemaOnlyOptions) {
        assert(!options.compilerOptions.some(current => current.name === option.name), `Schema-only option also exists in compiler options: ${option.name}`);
        assert(!Object.hasOwn(compilerProperties, option.name), `Duplicate schema-only option: ${option.name}`);
        const schema = nullable(option.type === "enum" ? stringEnumSchema(option.values) : { type: option.type });
        schema.deprecated = true;
        schema.deprecationMessage = "This option has been removed from TypeScript. It is retained in the schema for historical configurations.";
        compilerProperties[option.name] = withDescription(schema, option.description, option.name);
    }
    const acquisitionProperties = Object.fromEntries(options.typeAcquisition.map(option => [
        option.name,
        optionSchema({
            documentationAnchor: "typeAcquisition",
            ...option,
            ...(kind === "jsconfig" && option.jsconfigDefault !== undefined ? { defaultValueDescription: option.jsconfigDefault } : {}),
        }),
    ]));
    const descriptions: Record<string, string> = {
        compilerOptions: "Options for the TypeScript compiler.",
        formattingOptions: "Formatting preferences, inherited per property and overriding editor formatting preferences.",
        typeAcquisition: "Options for automatic type acquisition in JavaScript projects.",
        extends: "Configuration file or files to inherit from. Later entries take precedence. Relative paths are resolved relative to the configuration file in which they occur.",
        files: "Files to include in the project, in addition to files matched by include.",
        include: "File names or glob patterns to include. Defaults to all supported files when neither files nor include is specified.",
        exclude: "File names or glob patterns excluded from include. Does not exclude files brought in by imports, references, types, or files.",
        references: "Referenced projects. Each path identifies a configuration file or a directory containing one.",
        compileOnSave: "Compile this project when a file is saved in a supporting editor.",
        contentMappers: "External content mapper packages and the file extensions they handle. Execution must be enabled separately with --runExternalCode.",
        generate: "Code generation commands and their input and output patterns. Execution requires --generate or --generateOnly together with --runExternalCode.",
        lint: "Lint rules, plugins, ignores, and ordered file overrides. Severity-only overrides retain inherited options; tuples with options replace them. Paths and file patterns are relative to the declaring configuration. Execution requires --lint or --lintOnly; JavaScript plugins additionally require --runExternalCode.",
    };
    const lintSeverity: JSONSchema = { enum: ["off", "warn", "warning", "error", 0, 1, 2] };
    const lintRules: JSONSchema = {
        type: ["object", "null"],
        additionalProperties: {
            anyOf: [lintSeverity, { type: "null" }, { type: "array", minItems: 1, items: [lintSeverity], additionalItems: true }],
        },
    };
    const lintPatterns: JSONSchema = { type: ["array", "null"], items: { type: "string", minLength: 1 } };
    const properties: Record<string, JSONSchema> = {
        $schema: { type: "string", description: "The JSON schema used to validate this configuration." },
    };
    for (const option of options.rootOptions) {
        const schema = option.name === "lint" ? {
            type: ["object", "null"],
            properties: {
                rules: lintRules,
                plugins: {
                    type: ["object", "null"],
                    additionalProperties: {
                        anyOf: [
                            { type: "string", minLength: 1 },
                            {
                                type: "object",
                                properties: { specifier: { type: "string", minLength: 1 }, resolveFrom: { type: "string", minLength: 1 } },
                                required: ["specifier"],
                                additionalProperties: false,
                            },
                        ],
                    },
                },
                ignores: lintPatterns,
                overrides: {
                    type: ["array", "null"],
                    items: {
                        type: "object",
                        properties: { name: { type: "string" }, files: lintPatterns, ignores: lintPatterns, rules: lintRules },
                        additionalProperties: false,
                    },
                },
                reportUnusedDisableDirectives: lintSeverity,
            },
            additionalProperties: false,
        } : option.elementOptions && option.elementOptions !== "extends"
            ? { allOf: [{ $ref: `#/definitions/${option.elementOptions}` }] }
            : option.name === "extends" ? valueSchema(option) : optionSchema(option);
        properties[option.name] = withDescription(schema, option.schemaDescription ?? descriptions[option.name], option.documentationAnchor ?? option.name);
    }
    return {
        $schema: "http://json-schema.org/draft-07/schema#",
        $comment: "Generated by tools/scripts/tsc/generate-options.ts. DO NOT EDIT.",
        title: kind === "tsconfig" ? "TypeScript configuration" : "JavaScript configuration",
        type: "object",
        allowComments: true,
        allowTrailingCommas: true,
        properties,
        // Root properties are extensible so tools can use their own config sections.
        additionalProperties: true,
        definitions: {
            compilerOptions: optionObject(compilerProperties),
            typeAcquisition: optionObject(acquisitionProperties),
            formattingOptions: {
                type: ["object", "null"],
                properties: Object.fromEntries(
                    Object.entries(formattingProperties).map(([name, property]) => [
                        name,
                        nullable(
                            "enum" in property ? stringEnumSchema(property.enum) : {
                                type: property.type,
                                ...(name === "newLineCharacter" ? { enum: ["", "\n", "\r\n", "\r"] } : {}),
                                ...(property.type === "integer" ? { minimum: 0 } : {}),
                            },
                        ),
                    ]),
                ),
                additionalProperties: false,
            },
        },
    };
}
