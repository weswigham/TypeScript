// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-useless-catch": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
try { call(); } catch (error) { /* keep */ throw error; }
try { call(); } catch (error) { throw (error); } finally { cleanup(); }
try { call(); } catch (error) { throw error; unreachable(); }
try { call(); } catch ({ error }) { throw error; }
try { call(); } catch (error) { work(); throw error; }