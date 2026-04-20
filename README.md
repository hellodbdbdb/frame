# frame

A quiet place to rehearse your voice before an interview. Self-paced. No streaks. No noise.

Seeded with Daniel's 26 Product Design Director answers (25 questions, Q18 split into two failure stories).

---

## What this is

- Static web app. No build step. No backend.
- Google sign-in (Firebase Auth) + Firestore sync across mobile + desktop.
- Hosted on GitHub Pages. Free. Private to you (Firestore rules lock data to your own uid).

## What it does

- **Browse** all 25 questions, grouped by theme.
- **Anchor drill** — recall the 1–2 sentence opener.
- **Structure drill** — recall the bullet structure.
- **Story drill** — record yourself against a beat checklist (6 story-type questions).
- **Mock mode** — timed random draw, rate per question.
- **Readiness score** (0–100) — composite of strength + recency.
- **Edit** your answers, anchors, beats in-app. Your content stays yours.

## What it does not do

No daily goals. No streak shame. No notifications. No social. No AI-generated content.

---

## Setup (one-time, ~10 minutes)

### 1. Create a Firebase project

1. Go to https://console.firebase.google.com/
2. Add project → name it `frame` (or whatever). Skip Google Analytics.
3. In the project, click **Build → Authentication → Get started**.
   - Enable **Google** as a sign-in provider. Your email is the support email.
4. Click **Build → Firestore Database → Create database**.
   - Production mode. Region closest to you (e.g. `eur3` for Europe).
5. Project settings (gear icon top-left) → **General** → scroll to **Your apps** → click the web `</>` icon.
   - App nickname: `frame-web`. Register app.
   - Copy the `firebaseConfig` object.

### 2. Wire it up locally

```bash
cp firebase-config.example.js firebase-config.js
# open firebase-config.js and paste your config values
```

`firebase-config.js` is gitignored — it never reaches GitHub.

### 3. Lock down Firestore

In the Firebase console → **Firestore Database → Rules**, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Publish. This ensures nobody can read or write your data but you.

### 4. Push to GitHub

```bash
cd frame
git init
git add .
git commit -m "frame mvp"
git branch -M main
git remote add origin https://github.com/YOUR_USER/frame.git
git push -u origin main
```

### 5. Enable GitHub Pages

In the repo on github.com:

1. **Settings → Pages**
2. Source: `Deploy from a branch` · Branch: `main` · Folder: `/ (root)` · Save.
3. Wait ~30 seconds. Your app is at `https://YOUR_USER.github.io/frame/`.

### 6. Authorize the Pages domain in Firebase

Back in the Firebase console → **Authentication → Settings → Authorized domains** → add:

- `YOUR_USER.github.io`

Sign-in will be rejected from non-authorized domains. Localhost and your Firebase project domain are allowed by default.

---

## Run locally

You need to serve the files over HTTP (not `file://`) because ES modules + Firebase require it.

```bash
cd frame
python3 -m http.server 8000
# open http://localhost:8000
```

`localhost` is already an authorized domain in Firebase, so sign-in works.

---

## First-time sign-in

On first sign-in, the app seeds your Firestore with all 26 question entries (titles, prompts, answers, anchors, beats, baseline strengths pulled from your v2 evaluation). This happens once per user. After that, edits in the in-app editor persist to Firestore and sync across devices.

## Data model

```
users/{uid}                      — profile + seedVersion
users/{uid}/questions/{qid}      — answer/anchor/beats/etc.
users/{uid}/logs/{autoId}        — one per practice rep
users/{uid}/sessions/{autoId}    — mock sessions
```

## Readiness score

- Strength per question: exponentially weighted mean of the last 5 ratings (newer > older). Falls back to the v2 baseline if you've never drilled it.
- Readiness: 70% mean strength (normalized 0–1) + 30% share of questions practiced in the last 7 days. Rounded to 0–100.

## Reset

To start a fresh interview cycle, delete the document at `users/{your-uid}` in the Firestore console. Next sign-in re-seeds from `data.js`.

---

## Stack

- Vanilla JS ES modules, no bundler
- Firebase v10 modular SDK via `gstatic.com` CDN
- GitHub Pages static hosting
- Mobile-first CSS with dark mode via `prefers-color-scheme`

No dependencies to install. No CI to configure. The whole app is five files + data.
