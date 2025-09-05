# AI Ensemble

**Tagline:** Comparison. Consensus. Synthesis.

## Overview

AI Ensemble is a powerful utility for users to harness the collective intelligence of multiple AI models through a single interface. It takes a single prompt and queries multiple AI providers, then uses a final AI call to synthesize their outputs into a single, comprehensive "consensus" response.

This project is the Minimum Viable Product (MVP) implementation based on the provided product specification.

## MVP Goal

To validate the core value proposition: **Do users find significant value in receiving a synthesized "consensus" answer generated from the outputs of multiple LLMs?** The MVP delivers this experience via a simple web interface powered by a dedicated backend API.

## Core Features

*   **Simple Frontend Interface:** A clean UI for entering a prompt and API keys (OpenAI, Google, Anthropic).
*   **Local Key Storage:** API keys are stored in the browser's `localStorage` for session persistence, so you don't have to re-enter them on every visit.
*   **Centralized Backend API:** A single endpoint that handles the complexity of communicating with the different AI provider APIs.
*   **The "Ensemble Engine":** The core backend logic that performs three parallel queries to the providers and a fourth summarization query.
*   **Selectable Summarizer:** The user can select which AI model acts as the "Summarizer."
*   **Hierarchical Information Display:** The UI displays the final "Consensus" response prominently, with the individual AI responses available for reference.

## How It Works

1.  **Setup:** The user enters their API keys for OpenAI, Google (Gemini), and Anthropic in the settings area.
2.  **Interact:** The user types a prompt, selects a "Summarizer" model, and submits.
3.  **Process:** The frontend sends a single request to the backend API. The backend then orchestrates the four API calls to the external AI providers.
4.  **Display:** The final JSON object, containing the consensus and individual responses, is sent back to the frontend and rendered for the user.

## Architecture

*   **Frontend:** A Next.js (React) single-page application.
*   **Backend:** A stateless tRPC API running on Node.js. It receives the prompt and keys, performs the ensemble queries, and returns the result. The backend does **not** store any user data or API keys.

---

### 🚨 Crucial Security Consideration

This MVP architecture requires the user's secret API keys to be transmitted from the frontend to the backend with every request.

*   **Mitigation:** All traffic between the client and backend **must** be encrypted with HTTPS (TLS) in a production environment.
*   **Trust:** This model requires the user to trust that the backend will not store, log, or misuse their keys. This should be stated very clearly in a privacy policy.
*   **Post-MVP Goal:** A more secure, long-term architecture would involve user accounts where keys are stored **once**, encrypted at rest in a database, and never transmitted again.

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Testing

### Unit Tests
```bash
# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch
```

### E2E Tests (Playwright)
```bash
# Run all E2E tests (no HTML report server)
npx playwright test

# Run smoke tests only
npx playwright test tests/e2e/smoke.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests for specific browser only
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug
```

For detailed testing information, see [tests/README.md](tests/README.md).