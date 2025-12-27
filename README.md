## Project Overview

- **Caseflow** is a modern web app built with React and Vite.
- Lets you upload CSV files, map columns, validate data, and send results to a backend (Firebase or mock API).
- Handles large CSVs smoothly by parsing them in a Web Worker, so the UI stays fast and responsive.

## Architecture at a Glance

- **Frontend:**

  - Built with React + Vite.
  - Components live in `src/components/`.
  - Reusable UI elements are in `src/components/ui/`.

- **CSV Processing:**

  - Parsing happens in a Web Worker (`src/workers/csv-parser.worker.js`).
  - Keeps the main UI thread free, even with big files.
  - Data is sent back to the app in chunks.

- **State Management:**

  - Uses a lightweight local store (`src/state/store.js`).
  - Handles navigation, schema mapping, and validation progress.

- **Backend Integration:**
  - Firebase for authentication and data storage.
  - Mock API available for local development.

## How Data Flows

```mermaid
flowchart LR
    Browser[Browser (React + Vite)] -->|User actions| App[React App]
    App -->|CSV parsing| Worker[csv-parser.worker]
    Worker -->|Parsed data| App
    App -->|Submit data| API[(Firebase / Mock API)]
    App -->|Read / Write| Firestore[(Firestore)]
```

## Running Locally

1. Install dependencies:
   ```
   npm install
   ```
2. Start the dev server:
   ```
   npm run dev
   ```
3. For a production build:
   ```
   npm run build
   ```
   - Output is in the `dist/` folder—ready for static hosting.

## Design Choices & Tradeoffs

- **Validation Grid:**

  - Custom grid in `src/components/validation-grid.jsx`.
  - Predictable layout and easy to customize.
  - _Tradeoff:_ More flexibility, but manual handling for scrolling/selection.

- **Virtualized Rendering:**

  - Only visible rows are rendered for big datasets.
  - _Tradeoff:_ Slightly more complex scroll logic, but much better performance.

- **Schema Mapping:**

  - Users map columns and preview sample rows before validation.
  - _Tradeoff:_ Relies on user input, but reduces mapping errors.

- **Performance:**

  - CSV parsing in a Web Worker avoids UI freezes.
  - Data processed in chunks, not all at once.
  - Virtualized rendering keeps DOM small.
  - Releases processed data to save memory.
  - _Result:_ Handles tens of thousands of rows smoothly.

- **Security:**
  - Uses Firebase Authentication for sensitive actions.
  - Firestore rules require authentication.
  - CSV input is always treated as untrusted.
  - UI output is sanitized to prevent XSS.

## Testing

- Uses Jest and React Testing Library.
- Focuses on:
  - CSV parsing
  - Schema mapping
  - Validation logic

## Environment Variables

- Required:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `FIREBASE_EMULATOR_HOST` (optional)
- All variables are kept out of source control.

## Key Code Locations

- CSV parsing worker: `src/workers/csv-parser.worker.js`
- Schema mapping UI: `src/components/schema-mapper.jsx`
- Validation grid: `src/components/validation-grid.jsx`
- Firebase utilities: `src/lib/firebase.js`

## In Summary

Caseflow is a lightweight, fast, and scalable CSV processing app. Its modular design and smart architecture make it easy to use, extend, and maintain—even with very large files.
