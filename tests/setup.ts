// Vitest setup — runs once per test file.
// Keep this minimal. Per-test setup belongs in the test file.

// Silence noisy console output from the code under test so test logs stay readable.
// Override individual tests with vi.spyOn(console, "log").mockRestore() if needed.
if (!process.env.VITEST_VERBOSE) {
  console.log = () => {};
  console.warn = () => {};
}
