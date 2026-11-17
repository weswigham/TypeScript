//// [tests/cases/conformance/lint/rules/preserve-caught-error/preserveCaughtErrorScopeC.ts] ////

//// [input.ts]
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

//// [input.ts]
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
