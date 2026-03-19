# EloElo Thumbnail Design Analyzer V4 — Context-Aware

## Overview
A Google Apps Script that plugs into a Google Sheet to **analyze, score, and regenerate YouTube/Reels/EloElo thumbnails** using the Gemini Vision API. Built for tier 2/3 Hindi-speaking Indian audiences.

## Key Innovation (V4)
Instead of blanket category rules ("Remove `?` in Finance!"), V4 first **classifies the title's content type**, then applies rules contextually:
- `EARNING_AMOUNT` → `₹` helps, `?` hurts
- `CURIOSITY_HOOK` → `?` helps, `!` hurts
- `EDUCATION` → `?` is OK, `₹` not needed
- `LISTICLE` → numbers essential, `?` hurts
- `URGENCY_NEWS` → `!` helps, `?` hurts
- `COMPARISON` → `?` can help
- `DEFAULT` → falls back to category-level rules

## Architecture

### Single File
- **`startingscript.groovy`** — The entire script (actually JavaScript/Google Apps Script, saved as `.groovy`).

### Core Functions

| Function | Purpose |
|---|---|
| `classifyTitleContent_(title)` | Classifies a video title into one of 7 content types via keyword/regex matching |
| `getSmartRule_(element, category, contentType, title)` | Returns context-aware rule (`boost`/`hurts`/`neutral`/`context`) for `?`, `₹`, numbers, `!` |
| `getSmartTip_(category, contentType, title)` | Returns a category × content-type specific design tip |
| `callGeminiVision(imageBase64, title, category, topic, script)` | Sends thumbnail + prompt to Gemini API, returns structured JSON analysis |
| `writeResults(sheet, row, analysis, category, title)` | Computes score (design 75pts + category fit 25pts), writes results to columns E–P |
| `generateThumbnailForRow(sheet, row)` | Takes Column O feedback prompt, calls Gemini Image Gen, saves result to Drive |
| `callGeminiImageGen(prompt)` | Tries multiple Gemini image models with fallback chain |

### Google Sheet Layout

| Column | Content |
|---|---|
| A | Topic / Video Title |
| B | Optional video script (for script-aware feedback) |
| C | Category (dropdown — Finance, Earning Apps, Business, etc.) |
| D | Thumbnail image URL (Drive link or direct URL) |
| E | Detected text on thumbnail |
| F | Score /100 |
| G | Verdict: `PUBLISH` / `REVISE` / `REDESIGN` |
| H | Score breakdown + content type |
| I | Context-aware category warnings |
| J | Top 3 design fixes |
| K | Visual analysis (BG type, focal point, flow, colors) |
| L | Scroll-stop power + face expression + quality |
| M | Dominant colors + overall impression |
| N | Design checklist (readable, contrast, bold, clean, etc.) |
| O | Complete thumbnail feedback (AI image-gen prompt) |
| P | Generated thumbnail link (Drive) |

### Supported Categories
`Earning Apps`, `Finance`, `Business`, `Astrology`, `Devotion`, `Government Jobs`, `YT/IG Mastery`, `Technology`, `Spoken English`, `AI Tips and Tricks`, `Government Schemes`, `Sarkari Services`, `Career`, `Law`, `Secrets of India`, `Skill-based Earning`, `Motivation`, `Scams`, `Trending`

## Scoring
- **Design Quality (75 pts):** text readable (20), high contrast (15), bold font (10), clean layout (10), word count ≤7 (8), face visible (7), Hindi text (5)
- **Category Fit (25 pts):** context-aware bonus/penalty for `₹`, numbers, `?`, `!` presence/absence
- **Verdict:** ≥70 → PUBLISH, ≥45 → REVISE, <45 → REDESIGN

## APIs & Models
- **Analysis:** `gemini-2.5-flash` (free tier: 10 RPM, 250 req/day)
- **Image Generation (fallback chain):**
  1. `gemini-2.5-flash-preview-image-generation`
  2. `gemini-2.5-flash-image`
  3. `gemini-2.0-flash-exp-image-generation`
  4. `gemini-2.0-flash-001`

## Setup
1. Get API key from https://aistudio.google.com/apikey
2. In Google Sheets → Extensions → Apps Script → paste code
3. Project Settings → Script Properties → `GEMINI_API_KEY` = your key
4. Save, refresh sheet → custom menu "🎨 Thumbnail Analyzer" appears
