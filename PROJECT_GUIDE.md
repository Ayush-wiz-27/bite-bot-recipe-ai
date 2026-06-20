# 🍳 Bite Bot — Complete Project Guide

> **Bite Bot** is an AI-powered cooking assistant that takes a YouTube or Instagram Reel URL, extracts the audio, transcribes it, and uses AI to generate a structured recipe with ingredients (including nutrition data) and step-by-step cooking instructions — all presented in a premium, voice-controlled UI.

---

## 📑 Table of Contents

1. [How the App Works (High Level)](#1-how-the-app-works-high-level)
2. [Folder Structure](#2-folder-structure)
3. [Tech Stack](#3-tech-stack)
4. [Installation & Setup (From Scratch)](#4-installation--setup-from-scratch)
5. [Backend — Deep Dive](#5-backend--deep-dive)
6. [Frontend — Deep Dive](#6-frontend--deep-dive)
7. [How to Run the App](#7-how-to-run-the-app)
8. [API Reference](#8-api-reference)
9. [Data Flow (End-to-End)](#9-data-flow-end-to-end)
10. [Key Concepts for Beginners](#10-key-concepts-for-beginners)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. How the App Works (High Level)

```
User pastes a YouTube/Instagram URL
        │
        ▼
  Frontend sends POST request to Backend
        │
        ▼
  Backend downloads the video's AUDIO (via yt-dlp)
        │
        ▼
  Audio is sent to Groq's Whisper API → returns TRANSCRIPT (text)
        │
        ▼
  Transcript is sent to Groq's LLaMA 3.3 → returns structured RECIPE JSON
        │
        ▼
  Frontend displays the recipe in a premium cinematic UI
  with voice control, ingredient details, and AI chat
```

**In one sentence:** Paste a cooking video URL → get a full recipe with nutrition data, voiced step-by-step instructions, and an AI chat assistant.

---

## 2. Folder Structure

```
recipe-ai-app/
├── .gitignore                  # Root-level git ignore rules
│
├── backend/                    # Express.js API server
│   ├── .env                    # Environment variables (API keys, port)
│   ├── .gitignore              # Backend-specific git ignore
│   ├── package.json            # Backend dependencies & scripts
│   ├── package-lock.json       # Locked dependency versions
│   └── src/
│       ├── server.js           # ⭐ Entry point — starts Express server
│       ├── routes/
│       │   └── recipeRoutes.js # URL routes → maps URLs to controllers
│       ├── controllers/
│       │   └── recipeController.js  # Request handlers (business logic)
│       └── services/
│           ├── aiService.js         # ⭐ Core AI pipeline (download → transcribe → parse)
│           └── youtubeService.js    # YouTube caption extraction (alternative approach)
│
└── frontend/                   # React + Vite application
    ├── index.html              # HTML entry point (loads React)
    ├── vite.config.js          # Vite bundler configuration
    ├── eslint.config.js        # Linting rules
    ├── package.json            # Frontend dependencies & scripts
    ├── package-lock.json       # Locked dependency versions
    ├── .gitignore              # Frontend-specific git ignore
    ├── public/
    │   ├── favicon.svg         # Browser tab icon
    │   └── icons.svg           # SVG icon sprite
    └── src/
        ├── main.jsx            # ⭐ React entry point (renders <App />)
        ├── App.jsx             # ⭐ The entire UI (all components in one file)
        ├── index.css           # Global styles, theme, glassmorphism
        └── assets/
            └── hero.png        # Hero section image
```

### What each folder means:

| Folder | Purpose |
|--------|---------|
| `routes/` | **Defines URL paths.** When someone hits `/api/recipe/generate`, the router decides which controller function to call. Think of it as a receptionist directing calls. |
| `controllers/` | **Handles the request.** Receives data from the route, calls services, and sends back a response. Think of it as the manager who does the actual work. |
| `services/` | **Reusable business logic.** The heavy lifting — downloading audio, calling AI APIs, parsing responses. Controllers use these but don't care *how* they work internally. |
| `src/` (frontend) | **React components and styles.** Everything the user sees and interacts with. |

---

## 3. Tech Stack

### Backend
| Technology | What it does | Why we use it |
|-----------|-------------|---------------|
| **Node.js** | JavaScript runtime for server-side code | Lets us write backend in JS (same language as frontend) |
| **Express.js** | Web framework for Node.js | Makes it easy to create API routes and handle HTTP requests |
| **yt-dlp** (`youtube-dl-exec`) | Downloads audio from YouTube/Instagram | Most reliable video downloader, supports many platforms |
| **FFmpeg** (`ffmpeg-static`) | Audio/video processing | Converts downloaded video to MP3 format |
| **Groq API** (via `openai` SDK) | AI inference (Whisper + LLaMA) | Extremely fast AI inference — free tier available |
| **dotenv** | Loads `.env` variables | Keeps API keys out of code |
| **cors** | Cross-Origin Resource Sharing | Allows frontend (port 5173) to talk to backend (port 8000) |
| **nodemon** | Auto-restarts server on file changes | Developer convenience — no manual restart needed |

### Frontend
| Technology | What it does | Why we use it |
|-----------|-------------|---------------|
| **React 19** | UI component library | Declarative, component-based UI development |
| **Vite** | Build tool & dev server | Lightning-fast hot module replacement (HMR) |
| **Tailwind CSS v4** | Utility-first CSS framework | Rapid styling without writing custom CSS |
| **Framer Motion** | Animation library | Smooth, physics-based animations |
| **Lucide React** | Icon library | Clean, consistent SVG icons |
| **clsx + tailwind-merge** | Class name utilities | Smart merging of conditional Tailwind classes |

### AI Models (via Groq)
| Model | Purpose |
|-------|---------|
| **whisper-large-v3-turbo** | Primary speech-to-text (fast, high limit) |
| **whisper-large-v3** | Fallback speech-to-text (if turbo is rate-limited) |
| **llama-3.3-70b-versatile** | Text-to-recipe conversion + ingredient Q&A chat |

---

## 4. Installation & Setup (From Scratch)

### Prerequisites
- **Node.js** (v18+) — [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **A Groq API key** — [Get one free at console.groq.com](https://console.groq.com/)

### Step-by-step

#### 1. Clone or create the project folder
```bash
mkdir recipe-ai-app
cd recipe-ai-app
```

#### 2. Set up the Backend
```bash
cd backend
npm install          # Installs all dependencies from package.json
```

#### 3. Create the `.env` file
Create `backend/.env` with:
```env
PORT=8000
GROQ_API_KEY=your_groq_api_key_here
```
> ⚠️ **Never commit your `.env` file!** It's already in `.gitignore`.

#### 4. Set up the Frontend
```bash
cd ../frontend
npm install          # Installs all dependencies from package.json
```

#### 5. Run both servers
Open **two terminal windows**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev          # Starts server on http://localhost:8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev          # Starts React app on http://localhost:5173
```

#### 6. Open the app
Go to `http://localhost:5173` in your browser.

---

## 5. Backend — Deep Dive

### 5.1 `server.js` — The Entry Point

This is the first file that runs when you start the backend. It:

1. **Creates an Express app** — `const app = express()`
2. **Adds middleware:**
   - `cors({ origin: "*" })` — Allows any frontend to make requests (necessary because frontend runs on a different port)
   - `express.json()` — Parses incoming JSON request bodies
3. **Mounts routes** — `app.use("/api/recipe", recipeRoutes)` means all recipe-related URLs start with `/api/recipe`
4. **Starts listening** on the PORT from `.env` (default 8000)

```
HTTP Request → Middleware (CORS, JSON parsing) → Router → Controller → Response
```

### 5.2 `recipeRoutes.js` — URL Routing

Maps URL paths to controller functions:

| Method | URL | Controller Function | What it does |
|--------|-----|-------------------|-------------|
| `GET` | `/api/recipe/` | (inline) | Health check — returns "Recipe route working ✅" |
| `POST` | `/api/recipe/generate` | `generateRecipe` | Takes a video URL, returns a full recipe |
| `POST` | `/api/recipe/query` | `ingredientQuery` | Takes a question about ingredients, returns AI answer |

### 5.3 `recipeController.js` — Request Handlers

#### `generateRecipe(req, res)`
1. Extracts `url` from request body
2. Calls `getTranscriptFromVideo(url)` → gets text transcript
3. Calls `convertTranscript(transcript)` → gets structured recipe JSON
4. Returns `{ message, recipe }` to the frontend

#### `ingredientQuery(req, res)`
1. Extracts `question` and `ingredients` from request body
2. Builds a prompt telling the AI to act as a cooking assistant
3. Calls Groq's LLaMA model to answer the question
4. Returns `{ answer }` to the frontend

### 5.4 `aiService.js` — The AI Pipeline (Core Logic)

This is the **heart of the application**. It has 4 key functions:

#### `downloadAudio(url, outputPath)`
- Uses `yt-dlp` (a command-line tool) to download audio from YouTube/Instagram
- Detects if URL is Instagram and adjusts headers accordingly
- Converts to MP3 using FFmpeg
- Saves to a temp file

#### `transcribeAudio(filePath)`
- Sends the MP3 file to Groq's **Whisper** model
- Primary model: `whisper-large-v3-turbo` (fast)
- If rate-limited (HTTP 429), falls back to `whisper-large-v3`
- Returns plain text transcript

#### `getTranscriptFromVideo(url)` — Orchestrator
1. Creates a `temp/` directory if it doesn't exist
2. Downloads audio to `temp/audio_<timestamp>.mp3`
3. Transcribes the audio file
4. **Deletes the temp file** (cleanup)
5. Returns the transcript text

#### `convertTranscript(transcript)`
- Takes the raw transcript text
- Sends it to Groq's **LLaMA 3.3** model with a detailed prompt
- The prompt asks the AI to extract:
  - **Ingredients** with: name, quantity, emoji, fat, protein, carbs, vitamins, purpose, alternatives, skippable flag, impact
  - **Steps** as an ordered list
- Uses `response_format: { type: "json_object" }` to force valid JSON output
- Returns the parsed JSON object

### 5.5 `youtubeService.js` — Caption Extraction (Alternative)

An alternative approach that extracts captions directly from YouTube's timed-text API (no audio download needed). Currently **not used** in the main flow — `aiService.js` handles everything via audio transcription instead, which works for YouTube AND Instagram.

---

## 6. Frontend — Deep Dive

The entire frontend lives in a single file: `App.jsx`. Here's what each section does:

### 6.1 State Management

All state is managed with React's `useState` hook:

| State Variable | Type | Purpose |
|---------------|------|---------|
| `url` | string | The video URL the user types in |
| `recipe` | object/null | The parsed recipe data from the API |
| `loading` | boolean | Shows loading spinner during API call |
| `currentStep` | number | Which cooking step is currently displayed (0-indexed) |
| `listening` | boolean | Whether voice recognition is active |
| `chatHistory` | array | Messages in the AI chat sidebar |
| `activeIngredient` | number/null | Which ingredient card is expanded |
| `theme` | string | `"dark"` or `"light"` |
| `showIngredientsMobile` | boolean | Toggle ingredients panel on mobile |
| `isExploding` | boolean | Controls the cinematic "supernova" transition |

### 6.2 Key Functions

#### `handleSubmit()`
1. Sends POST to `http://localhost:8000/api/recipe/generate` with the URL
2. Triggers the "Supernova" animation (`isExploding = true`)
3. After 2 seconds, sets the recipe data and transitions to the dashboard

#### `speakStep(text)`
- Uses the browser's built-in **Web Speech API** (`SpeechSynthesisUtterance`)
- Reads the current cooking step aloud
- Rate set to 1.1× speed

#### `startListening()`
- Uses the browser's **Speech Recognition API**
- Listens for voice commands:
  - **"next"** → go to next step
  - **"back"** / **"previous"** → go to previous step
  - **"repeat"** → re-read current step
  - **Anything else** → sends to AI as a question

#### `askAI(question)`
- Sends POST to `http://localhost:8000/api/recipe/query`
- Includes the question + current ingredient list
- Adds the response to chat history
- Speaks the answer aloud

### 6.3 UI Screens

The app has **two screens**, toggled by whether `recipe` is null:

#### Screen 1: Home (No Recipe)
- Animated "High Fidelity" badge
- Large "Taste Explosion" headline
- URL input bar with "ENGAGE" button
- Glassmorphism styling with saffron accents

#### Screen 2: Dashboard (Recipe Loaded)
A 3-column layout (on desktop):

| Column | Content |
|--------|---------|
| **Left (col-span-3)** | **Ingredients panel** — Clickable cards showing each ingredient with emoji, quantity. Expands to show protein/fat/carbs/vitamins/purpose/impact |
| **Center (col-span-6)** | **Step display** — Large text showing current cooking step with prev/play/next controls |
| **Right (col-span-3)** | **AI Chat** — Conversation history with the AI assistant |

### 6.4 Styling System

#### Theme Variables (in `index.css`)
The app uses CSS custom properties for theming:

```css
:root {              /* Dark mode (default) */
  --theme-bg: #000;
  --theme-text: #f4f4f5;
  --theme-surface: rgba(15, 23, 42, 0.4);
}

:root.light {        /* Light mode */
  --theme-bg: #f8fafc;
  --theme-text: #0f172a;
  --theme-surface: rgba(255, 255, 255, 0.95);
}
```

#### Key CSS Classes
| Class | What it does |
|-------|-------------|
| `.glass-island` | Glassmorphism card — blurred background, subtle border, shadow |
| `.glass-pill` | Smaller glassmorphism element (badges, pills) |
| `.vital-essential` | Red tint for essential ingredients |
| `.vital-optional` | Yellow tint for optional ingredients |
| `.vital-garnishing` | Green tint for garnishing ingredients |

### 6.5 Animations (Framer Motion)

| Animation | Where | What it does |
|-----------|-------|-------------|
| `explosionContainer` + `explosionItem` | Dashboard entry | Staggered reveal — each column appears one after another |
| Supernova overlay | After "ENGAGE" | Full-screen black overlay with a food image that zooms and blurs out |
| `AnimatePresence mode="wait"` | Step transitions | Smooth 3D flip animation between cooking steps |
| `whileHover={{ rotate: 180 }}` | Chef hat icon | Spins on hover |
| Floating badge | Home screen | Gentle up-down floating animation |

---

## 7. How to Run the App

### Quick Start (Two Terminals)

**Terminal 1 — Backend:**
```bash
cd recipe-ai-app/backend
npm run dev
# Output: Server running on port 8000
```

**Terminal 2 — Frontend:**
```bash
cd recipe-ai-app/frontend
npm run dev
# Output: Local: http://localhost:5173/
```

### Available npm Scripts

#### Backend (`backend/package.json`)
| Script | Command | What it does |
|--------|---------|-------------|
| `npm start` | `node src/server.js` | Runs server (production, no auto-restart) |
| `npm run dev` | `nodemon src/server.js` | Runs server with auto-restart on file changes |

#### Frontend (`frontend/package.json`)
| Script | Command | What it does |
|--------|---------|-------------|
| `npm run dev` | `vite` | Starts dev server with hot reload |
| `npm run build` | `vite build` | Creates optimized production build |
| `npm run preview` | `vite preview` | Preview the production build locally |
| `npm run lint` | `eslint .` | Check code for style issues |

> ⚠️ **Common mistake:** Running `npm start` from the root `recipe-ai-app/` folder will fail because there's no `package.json` at the root. You must `cd` into `backend/` or `frontend/` first.

---

## 8. API Reference

### Base URL: `http://localhost:8000`

### `GET /`
Health check.
- **Response:** `"API is running 🚀"`

### `GET /api/recipe/`
Route health check.
- **Response:** `"Recipe route working ✅"`

### `POST /api/recipe/generate`
Generate a recipe from a video URL.

**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response (200):**
```json
{
  "message": "Recipe generated ✅",
  "recipe": {
    "ingredients": [
      {
        "name": "Chicken Breast",
        "quantity": "500g",
        "emoji": "🍗",
        "fat": "3g",
        "protein": "31g",
        "carbs": "0g",
        "vitamins": "Vit B6, Vit B12",
        "purpose": "Main protein source",
        "alternatives": ["Turkey breast", "Tofu"],
        "skippable": false,
        "impact": "Core ingredient — cannot be removed"
      }
    ],
    "steps": [
      "Preheat oven to 200°C",
      "Season chicken with salt, pepper, and paprika",
      "..."
    ]
  }
}
```

### `POST /api/recipe/query`
Ask an AI question about ingredients.

**Request Body:**
```json
{
  "question": "Can I replace butter with olive oil?",
  "ingredients": [ /* current ingredients array */ ]
}
```

**Response (200):**
```json
{
  "answer": "Yes! Olive oil is a great substitute for butter in this recipe..."
}
```

---

## 9. Data Flow (End-to-End)

Here's exactly what happens when you paste a URL and click **ENGAGE**:

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (React, port 5173)                                    │
│                                                                 │
│  1. User types URL into input                                   │
│  2. Clicks ENGAGE → handleSubmit() fires                        │
│  3. Sets loading=true, shows spinner                            │
│  4. fetch("http://localhost:8000/api/recipe/generate",          │
│         { method: "POST", body: { url } })                      │
│                                                                 │
│         ──── HTTP POST ────►                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND (Express, port 8000)                                   │
│                                                                 │
│  5. Express receives POST at /api/recipe/generate               │
│  6. recipeRoutes.js → routes to generateRecipe()                │
│  7. recipeController.js → calls getTranscriptFromVideo(url)     │
│                                                                 │
│  ┌─── aiService.js ──────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  8. downloadAudio(url) → yt-dlp downloads MP3             │  │
│  │     (saved to backend/temp/audio_1234567890.mp3)          │  │
│  │                                                           │  │
│  │  9. transcribeAudio(filePath)                             │  │
│  │     → Sends MP3 to Groq Whisper API                       │  │
│  │     → Returns text: "today we're making butter chicken.." │  │
│  │                                                           │  │
│  │  10. Deletes temp MP3 file                                │  │
│  │                                                           │  │
│  │  11. convertTranscript(transcript)                        │  │
│  │      → Sends text to Groq LLaMA 3.3                      │  │
│  │      → Returns JSON: { ingredients: [...], steps: [...] } │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  12. Controller sends JSON response back to frontend            │
│                                                                 │
│         ◄──── HTTP Response ────                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (React)                                               │
│                                                                 │
│  13. Triggers "Supernova" explosion animation (2 seconds)       │
│  14. Sets recipe state → UI switches to dashboard               │
│  15. Speaks first cooking step aloud                            │
│  16. User can navigate steps, ask questions, use voice          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Key Concepts for Beginners

### What is an API?
An **API** (Application Programming Interface) is a way for two programs to talk to each other. Our frontend "asks" the backend for data by sending HTTP requests to specific URLs (called **endpoints**).

### What is REST?
**REST** is a style of building APIs using standard HTTP methods:
- `GET` — Read data
- `POST` — Create/send data
- `PUT` — Update data
- `DELETE` — Remove data

Our app uses `GET` (health checks) and `POST` (sending URLs and questions).

### What is Middleware?
**Middleware** are functions that run between receiving a request and sending a response. They can:
- Parse JSON bodies (`express.json()`)
- Add headers for CORS (`cors()`)
- Log requests
- Check authentication

### What is CORS?
**CORS** (Cross-Origin Resource Sharing) is a security feature. Browsers block requests from one domain to another by default. Since our frontend (port 5173) and backend (port 8000) are on different ports, we need `cors()` middleware to allow it.

### What is `dotenv`?
A package that reads a `.env` file and loads its values into `process.env`. This keeps sensitive data (API keys) out of your code.

### What is Nodemon?
A tool that watches your files and **auto-restarts** the Node.js server when you save changes. Without it, you'd have to manually stop and restart the server every time you edit code.

### What is Vite?
A modern build tool for frontend apps. It's extremely fast because it uses native ES modules during development. When you run `npm run dev` in the frontend, Vite serves your React app with instant hot-reloading.

### What is Glassmorphism?
A UI design trend using:
- Semi-transparent backgrounds
- Background blur (`backdrop-filter: blur()`)
- Subtle borders
This creates a "frosted glass" effect. See the `.glass-island` class in `index.css`.

### What is Speech Synthesis / Recognition?
Built-in browser APIs:
- **SpeechSynthesis** — Makes the browser speak text aloud (text-to-speech)
- **SpeechRecognition** — Listens to your microphone and converts speech to text

Both are free and require no external API — they run entirely in your browser.

---

## 11. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `npm error Missing script: "start"` | Running npm from wrong directory | `cd backend` or `cd frontend` first |
| `CORS error` in browser console | Backend not running or wrong port | Make sure backend is running on port 8000 |
| `429 Too Many Requests` | Groq API rate limit hit | Wait 60 seconds and try again |
| Audio download fails | yt-dlp can't access the video | Make sure the URL is public and valid |
| Voice commands don't work | Browser doesn't support Speech API | Use Chrome (best support) |
| `GROQ_API_KEY` not working | Wrong or expired key | Generate a new key at console.groq.com |
| Frontend shows blank page | Node modules not installed | Run `npm install` in the `frontend/` folder |

---

## Current Status

✅ Backend API fully functional (generate recipe + ingredient Q&A)  
✅ Frontend with premium dark/light theme UI  
✅ Voice control (speech recognition + text-to-speech)  
✅ Cinematic "Supernova" transition animation  
✅ Ingredient cards with nutrition data (protein, fat, carbs, vitamins)  
✅ AI chat assistant for cooking questions  
✅ YouTube + Instagram Reel support  

---

*Last updated: June 15, 2026*
