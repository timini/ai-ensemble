# Complete Application Specification: AI Ensemble

This document provides a comprehensive, top-to-bottom technical specification for the AI Ensemble application. It covers the application's architecture, data flow, core components, and the user journey.

## 1. High-Level Overview

**Purpose**: The AI Ensemble application is a web-based tool for power users, developers, and researchers to compare and analyze responses from multiple large language models (LLMs) simultaneously.

**Core Features**:
-   **Multi-Provider Configuration**: Users can securely configure API keys for multiple AI providers (OpenAI, Google, Anthropic, Grok).
-   **Dynamic Model Selection**: Users can select 2-8 models from the pool of their configured providers to include in a comparison.
-   **Real-time Streaming**: Model responses are streamed back to the UI in real-time, allowing users to see outputs as they are generated.
-   **Consensus Generation**: A user-selected "summarizer" model synthesizes the individual responses into a single, high-quality consensus response.
-   **Agreement Analysis**: The application calculates and visualizes the semantic similarity (agreement) between each pair of model responses using vector embeddings.
-   **Manual Response Injection**: Users can add their own text as a "manual response" to be included in the agreement analysis alongside the AI-generated responses.
-   **State Persistence**: The user's configuration (API keys, selected models, last prompt) is persisted in the browser's `localStorage` for a seamless experience.

---

## 2. Architecture

The application is a modern, full-stack web application built on the Next.js framework.

-   **Framework**: Next.js 14 (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS for utility-first styling.
-   **Frontend**: React (Client Components, denoted by `"use client";`)
-   **Backend**: Next.js API Routes for server-side logic.
-   **API Layer**: tRPC is used for type-safe, end-to-end communication between the client and server, primarily for API key validation. Real-time communication for model responses is handled via Server-Sent Events (SSE).

### Key Directories:
-   `src/app/_components/`: Contains all the React components that make up the user interface.
-   `src/app/api/`: Houses the backend API route handlers, including the core streaming logic.
-   `src/server/`: Contains server-side business logic, including the AI provider classes and tRPC routers.
-   `src/types/`: Defines shared TypeScript types used across the application.

---

## 3. The User Journey & Data Flow

The application flow is a linear progression from configuration to analysis.

### Step 1: Configuration (`ProviderConfiguration.tsx`)
-   **Action**: The user opens the "Configure Providers" popover and enters their API keys.
-   **Data Flow**:
    1.  On input, the key is stored in the `providerKeys` state in the main `ImprovedEnsembleInterface` component.
    2.  `localStorage` is updated to persist the key.
    3.  A debounced (1000ms) tRPC call is made to the backend (`api.validation.validateApiKey`).
    4.  The backend attempts to authenticate with the provider.
    5.  If successful, another tRPC call (`api.validation.getModels`) fetches the list of available models.
    6.  The `providerStatus` and `availableModels` states are updated, causing the UI to show a "valid" status and the number of models.

### Step 2: Model Selection (`ModelSelection.tsx`)
-   **Action**: The user opens the "Select Models" popover.
-   **Data Flow**:
    1.  The component receives the `availableModels` and `providerStatus` as props. It only displays models from providers with a `'valid'` status.
    2.  As the user adds or removes models, the `onSelectedModelsChange` callback updates the `selectedModels` state in the parent component.
    3.  `localStorage` is updated to persist the selection.

### Step 3: Query & Summarizer (`ImprovedEnsembleInterface.tsx`)
-   **Action**: The user types a prompt and selects a summarizer model from the dropdown.
-   **Data Flow**:
    1.  The `prompt` and `selectedSummarizer` states are updated on user input.
    2.  The summarizer dropdown is populated directly from the `selectedModels` state array.

### Step 4: Streaming (`/api/ensemble-stream-v2/route.ts`)
-   **Action**: The user clicks the "Compare Models" button.
-   **Data Flow**:
    1.  A `POST` request is sent to `/api/ensemble-stream-v2` with a JSON payload containing the prompt, the full list of `selectedModels`, all API `keys`, and the chosen `summarizer`.
    2.  The backend parses this request and initiates a Server-Sent Events (SSE) connection.
    3.  For each model, the backend creates a provider instance and calls its `generateContentStream` method.
    4.  As text chunks are received from the AI APIs, the backend pushes them to the client via the SSE stream, tagged with the `model.id`.
    5.  The frontend listens for these events and continuously updates the `streamingData.modelResponses` state, causing the individual response cards to update in real-time.

### Step 5: Analysis & Consensus (Backend -> Frontend)
-   **Action**: This happens automatically on the backend after all individual model streams are complete.
-   **Data Flow**:
    1.  **Agreement**: The backend collects all successful responses. It requires at least one OpenAI provider to generate embeddings for all responses. It then calculates the cosine similarity between each pair and sends the `AgreementScore[]` array back to the client in a single SSE event.
    2.  **Consensus**: The backend constructs a new prompt containing all the individual responses and sends it to the user-selected summarizer model.
    3.  The consensus response is streamed back to the client chunk-by-chunk, just like the individual responses.
    4.  The frontend receives the agreement scores and the consensus text, updating the `streamingData` state. This triggers the `ConsensusDiagram` to render and the "Consensus Response" section to populate.

---

## 4. Core Components & State Management

The application is architected around a single, stateful parent component that manages the entire UI and data lifecycle.

### `src/app/_components/ImprovedEnsembleInterface.tsx`
This is the "god component" of the application.

-   **Role**: It initializes and manages all the critical pieces of state and passes them down as props to its children. It also defines the callback functions that allow child components to update the state.
-   **Core State Variables**:
    -   `providerKeys`: `Record<Provider, string>` - Stores the API keys.
    -   `providerStatus`: `Record<Provider, 'valid' | ...>` - Tracks the validation status of each key.
    -   `availableModels`: `Record<Provider, string[]>` - Stores the list of models for each valid provider.
    -   `selectedModels`: `SelectedModel[]` - The list of models chosen for the current ensemble.
    -   `prompt`: `string` - The user's input prompt.
    -   `selectedSummarizer`: `string` - The ID of the model chosen as the summarizer.
    -   `isStreaming`: `boolean` - A flag to control the UI state during the streaming process.
    -   `streamingData`: `StreamingData` - An object that holds all the real-time data from the backend (responses, states, scores).

### Child Components (Presentational)
The other components are largely presentational, receiving data and callbacks via props.

-   `ProviderConfiguration`: Receives keys/status and calls back with changes.
-   `ModelSelection`: Receives available/selected models and calls back with changes.
-   `SelectedModelsDisplay`: Renders the grid of selected models and the `SummaryStatsBar`.
-   `ConsensusDiagram`: Renders the visualization based on the final `agreementScores`.
-   `CopyButton`, `ShareButton`, etc.: Small, reusable utility components.

---

## 5. Backend & API

### `src/app/api/ensemble-stream-v2/route.ts`
This is the single, most critical backend endpoint.

-   **Technology**: Next.js Route Handler using the Web `ReadableStream` API to implement Server-Sent Events.
-   **Input**: A JSON object defined by `StreamRequestSchemaV2`, containing the prompt, model configurations, keys, and summarizer info.
-   **Process**:
    1.  **Validation**: Validates the incoming payload with Zod.
    2.  **Instantiation**: Creates instances of the AI Provider classes (`OpenAIProvider`, `GoogleProvider`, etc.).
    3.  **Parallel Streaming**: Initiates all individual model streams in parallel using `Promise.all`.
    4.  **SSE Broadcasting**: As data arrives from the AI APIs, it's immediately encoded and pushed to the client. It uses a `type` field in the JSON payload to distinguish between different event types (`chunk`, `config_complete`, `agreement`, `consensus_chunk`, etc.).
    5.  **Post-Processing**: After all streams finish, it proceeds to the agreement calculation and then the consensus generation stages, sending updates to the client at each step.

This specification provides a complete blueprint of the AI Ensemble application, from its high-level architecture down to the logic of its most complex components.



