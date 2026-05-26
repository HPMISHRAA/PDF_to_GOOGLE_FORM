# Formify PDF — Question Paper to Google Forms MCQ Converter

**Formify PDF** is a premium, client-side React + TypeScript application built with Vite. It allows educators, students, and professionals to upload text-based PDFs, scanned question papers, and photos of handwritten tests, and automatically parse them into fully configured Google Forms Multiple Choice Question (MCQ) quizzes using Gemini 1.5 Flash.

It includes an interactive question editor, a live-syncing Google Forms simulator, and support for exporting quizzes in multiple popular LMS and interactive formats.

---

## 🌟 Key Features

*   **Multimodal OCR Processing**: Parse text PDFs, scanned documents, and direct snapshots of question sheets (PNG, JPG, JPEG, WEBP) using Gemini 1.5 Flash.
*   **Dual-Export Channels**:
    *   **Method A (Direct REST API)**: Grant OAuth permissions via Google Identity Services (GIS) to automatically build the form directly in your Google Drive.
    *   **Method B (Google Apps Script)**: Copy-paste a generated App Script snippet into [script.new](https://script.new) to compile the form in Google Drive with **zero API configuration**.
*   **Alternative Formats**: Download quiz configurations as **CSV**, **JSON**, **Moodle XML**, **Kahoot import templates**, or **Quizizz templates**.
*   **Live Google Forms Simulator**: A realistic, live-updating mock view of your form displaying options, titles, description, points, and correct answer keys as you edit.
*   **Intelligent Validation**: Warns you about empty fields, duplicate options, duplicate questions, low-confidence OCR text, or missing correct keys.
*   **Local Auto-Save**: Preserves your draft progress in `localStorage` so that you never lose your work on browser refreshes or crashes.
*   **Bulk Actions Panel**: Collapsible panel above the question list enabling mass point changes, mass difficulty overrides, option choice shuffles (keeping answer keys aligned), and global regex-escaped search and replace text parsing.
*   **AI Translation Engine**: Translate the entire quiz (title, description, questions, choices, answers) into target languages directly client-side, while keeping mathematical LaTeX and KaTeX formatting strictly intact.
*   **LaTeX Exporter Cleanup**: Automatically unwraps LaTeX text formatting commands (like `\text{...}`) and translates LaTeX math symbols to their Unicode equivalents during export, ensuring clean, backslash-free text in Google Forms.
*   **Fully Responsive Web Layout**: Optimized for desktop, tablet, and mobile screen sizes. Features a sticky mobile tab navigation (`.mobile-workspace-tabs`) that switches between the Editor and the Google Form Live Simulator seamlessly, preventing long-scrolling issues on small displays.

---

## 📂 Project Structure

*   [`index.html`](file:///c:/Users/91990/Desktop/PDF%20to%20Survey%20Form/index.html) — HTML template loading the Google OAuth Identity Client scripts.
*   [`src/index.css`](file:///c:/Users/91990/Desktop/PDF%20to%20Survey%20Form/src/index.css) — Custom global stylesheet implementing the glassmorphism dark-theme dashboard and the simulated Google Form elements.
*   [`src/App.tsx`](file:///c:/Users/91990/Desktop/PDF%20to%20Survey%20Form/src/App.tsx) — Main dashboard interface managing application step routing, edits, validation, and layout.
*   [`src/services/GeminiService.ts`](file:///c:/Users/91990/Desktop/PDF%20to%20Survey%20Form/src/services/GeminiService.ts) — Integrates the `@google/generative-ai` SDK and compiles structured OpenAPI JSON schemas for Gemini.
*   [`src/services/GoogleFormsService.ts`](file:///c:/Users/91990/Desktop/PDF%20to%20Survey%20Form/src/services/GoogleFormsService.ts) — Creates Apps Script code, routes REST API batchUpdates, and formats Moodle XML / Kahoot CSV files.
*   [`src/services/GoogleFormsService.test.ts`](file:///c:/Users/91990/Desktop/PDF%20to%20Survey%20Form/src/services/GoogleFormsService.test.ts) — Testing suite confirming correct escaping, truncation, and formatting.

---

## 🚀 Running the Project

Follow these steps to run the application on your computer:

### 1. Install Dependencies
Run this in the project folder to install the required packages (`@google/generative-ai`, `lucide-react`, `vitest`):
```bash
npm install
```

### 2. Start the Development Server
Launch the local dev server:
```bash
npm run dev
```
Open your browser and navigate to **`http://localhost:5173`** (or the URL printed in the terminal).

### 3. Build for Production
To build a optimized static bundle in the `dist/` directory:
```bash
npm run build
```

### 4. Execute Unit Tests
To run the Vitest test suite checking file exports:
```bash
npm run test
```

---

## 🔑 Quick Setup

### Step 1: Obtain a Gemini API Key
1. Go to the [Google AI Studio](https://aistudio.google.com) website.
2. Sign in with your Google account.
3. Click **"Get API key"** -> **"Create API key"** and copy the code.
4. Paste it into the **Credentials** settings panel inside the Formify PDF dashboard.

### Step 2: Upload & Parse
1. Click the file uploader or drag a file containing multiple-choice questions into the upload zone.
2. Wait a few seconds for the AI to complete OCR extraction and structure the quiz.

### Step 3: Review & Export
1. Edit questions, options, point values, or correct answer keys.
2. Click **"Export Quiz"** and select **"Google Apps Script"** or alternative download formats like **CSV** or **Moodle XML**.
