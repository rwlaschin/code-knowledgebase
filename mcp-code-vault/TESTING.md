# Testing

## TDD: Test Driven Design

**Write the tests first.** Then implement the code to make them pass.

If tests are written after the code, design problems (e.g. untestable APIs, blocking calls, missing seams) show up too late. Writing tests first forces:

- Small, testable units
- Clear contracts (inputs/outputs)
- No “write code then hope tests fit”

**Process:** Red → Green → Refactor. Write a failing test, implement the minimum to pass, then refactor. Do not add production code without a failing test that justifies it.

---

## Coverage report

Coverage is collected from `src/**/*.ts` (excluding types).

- **View report:** `npm run test:unit:coverage`
- **Output:** Terminal summary + `coverage/` (HTML: open `coverage/lcov-report/index.html`)
- **Thresholds (enforced):** Global minimum 50% for statements, branches, functions, lines. The build fails until coverage meets these. Raising coverage is required; single-digit coverage is not acceptable.

---

## Hard requirements

1. **Unit tests** – Total time for all unit tests &lt; 3 seconds.
2. **Integration tests** – Total time for all integration tests &lt; 30 seconds.
3. **No stubs** – Tests must hit real production code. Do not stub the code under test.
4. **Tests first** – New behavior gets a failing test before implementation (TDD).

---

## When to run what

- **After feature work:** `npm test` (unit only, fast).
- **Coverage:** `npm run test:unit:coverage` (unit + coverage report; fails if below thresholds).
- **Full build:** `npm run build` (integration tests, then `tsc`).

---

## Conventions

- Unit tests: `__tests__/**/*.test.ts` (exclude filenames containing `integration`).
- Integration tests: `__tests__/**/*.integration.test.ts`.
- Use real implementations; mock only external boundaries (DB, network) when needed in integration tests.
- **Do not filter test results.** Run `npm test` and `npm run test:unit:coverage` without piping or filtering output so that full results (all suites, test names, pass/fail, and coverage table) are always visible.
