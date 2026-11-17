// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "preserve-caught-error": ["error", { "requireCatchParameter": true, "errorClassNames": [{ "name": "CustomError", "argumentPosition": 3 }] }] } }
}
// @filename: input.ts
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