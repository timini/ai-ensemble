# Cursor AI Instructions for ai-ensemble project

This document outlines the development guidelines for the AI assistant working on this project.

## 1. Development Methodology: Test-Driven Development (TDD)

- **Always write a failing test first:** Before writing any new implementation code, create a test case that clearly defines the desired functionality and fails because the functionality doesn't exist yet.
- **Write the minimum code to pass the test:** Implement only the code necessary to make the failing test pass. Avoid adding extra functionality that isn't required by the test.
- **Refactor:** Once the test is passing, refactor the code for clarity, performance, and maintainability, ensuring all tests continue to pass.

## 2. Coverage Ratchet: Always Increase Coverage

- **Check coverage before commit:** Before every commit, run the coverage report (`npm run coverage`).
- **Update thresholds:** If the overall statement, branch, function, or line coverage has increased, update the corresponding thresholds in `vitest.config.ts` to match the new, higher values.
- **Never decrease coverage:** The test suite will fail if coverage drops below the established thresholds. Do not commit code that lowers test coverage.

## 3. Commit Strategy: Feature-Based Commits

- **Commit after each new feature or significant change:** Make small, atomic commits. Each commit should represent a single logical change (e.g., a new feature, a bug fix, a refactor).
- **Write clear commit messages:** Follow conventional commit standards (e.g., `feat:`, `fix:`, `refactor:`). The message should clearly describe the change.
- **Never bypass pre-commit hooks:** Do not use `--no-verify` or other methods to bypass the pre-commit checks. All linting and tests must pass before a commit is made.
