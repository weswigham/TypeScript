//// [tests/cases/conformance/lint/rules/no-useless-catch/noUselessCatchCore.ts] ////

//// [input.ts]
try { call(); } catch (error) { /* keep */ throw error; }
try { call(); } catch (error) { throw (error); } finally { cleanup(); }
try { call(); } catch (error) { throw error; unreachable(); }
try { call(); } catch ({ error }) { throw error; }
try { call(); } catch (error) { work(); throw error; }

//// [input.ts]
try { call(); } catch (error) { /* keep */ throw error; }
try { call(); } catch (error) { throw (error); } finally { cleanup(); }
try { call(); } catch (error) { throw error; unreachable(); }
try { call(); } catch ({ error }) { throw error; }
try { call(); } catch (error) { work(); throw error; }
