# 🚀 CivicAssist — Intelligent Civic Engagement \& Governance Platform

CivicAssist is an AI-powered municipal management and citizen engagement platform that streamlines reporting, AI verification, smart departmental dispatch, on-site resolution proof, and civic analytics across Maharashtra (Mumbai MMR, Pune \& PCMC).

\---

## 💡 Key Highlights \& Recent Additions

* 📍 **Precise Pinpoint Geocoding \& GPS Navigation**: High-accuracy street, road, and campus resolution (e.g. MIT Alandi, Dehu - Alandi Road) with an interactive Leaflet map and **1-click Google Maps turn-by-turn navigation** for field inspection officers.
* 🗺️ **Maharashtra \& Pune Dynamic Heatmap**: Live multi-region civic heatmap (`All Maharashtra`, `Pune / PCMC`, `Mumbai MMR`) with real-time issue clustering, density thresholds, and area risk rankings.
* 🤖 **AI Authenticity \& Fake Report Guard**: Dual-modality AI (OpenAI CLIP + DistilBERT) analyzing image relevance and text veracity to flag fake/spam complaints automatically with admin review \& dismissal controls.
* 📸 **Department Work \& Resolution Proof Workflow**: Department Heads receive assigned tickets, conduct field work, and upload on-site photographic proof before Central Admin verifies and closes the case with before/after comparisons.
* 🌐 **Bilingual Civic Assistant (English \& Hindi)**: Built-in AI helper supporting instant issue reporting guidance, civic helplines, and FAQs in English and Hindi.
* 👥 **Citizen Engagement \& Priority Signals**: Community upvoting/likes, comments, status timeline tracking, and leaderboard gamification.

\---

## 🔄 End-to-End Workflow

```text
\\\\\\\[Citizen Reports Issue] ──► \\\\\\\[Photo + GPS Geocoded] ──► \\\\\\\[AI Authenticity Scan (CLIP)]
                                                                  │
                                                        ┌─────────┴─────────┐
                                                  \\\\\\\[Genuine]              \\\\\\\[Spam Flagged]
                                                        │                       │
                                          \\\\\\\[Mumbai Central Admin]      \\\\\\\[Admin Review/Dismiss]
                                                        │
                                          \\\\\\\[Assign to Dept Head]
                                                        │
                                        \\\\\\\[Field Officer Dispatched]
                                      (1-Click Google Maps Nav)
                                                        │
                                      \\\\\\\[Uploads On-Site Work Proof]
                                                        │
                                     \\\\\\\[Central Admin Verifies \\\\\\\& Closes]
                                                        │
                                          \\\\\\\[Public Status: Resolved]
```

\---

## 🏛️ Roles \& Portals

1. **Citizen Portal**

   * Phone OTP Login (+91).
   * Voice speech-to-text, photo upload, interactive pinpoint map.
   * Real-time status tracker (Pending → In Progress → Under Review → Resolved).
   * Public before/after resolution proof inspector.
2. **Mumbai Central Admin Portal**

   * Live Maharashtra issue analytics \& area severity rankings.
   * AI Moderation Inspector (override or officially dismiss spam).
   * Department assignment \& resolution proof approval/rejection.
3. **Department Head Portal**

   * Dedicated dashboard for each department (Solid Waste, Roads, Street Lighting, Water, etc.).
   * Exact site coordinates \& GPS navigation to dispatch field teams.
   * Proof submission form with Cloudinary image upload and field notes.

\---

## 🛠️ Tech Stack

* **Frontend**: React 18, Vite, Tailwind CSS, Leaflet / React-Leaflet, FontAwesome
* **Backend**: Node.js, Express.js (REST API)
* **Database**: Supabase (PostgreSQL with real-time queries)
* **Media Storage**: Cloudinary (incident photos \& resolution proofs)
* **AI / ML**: Python 3, PyTorch, OpenAI CLIP, Transformers (DistilBERT)
* **Maps \& Geocoding**: OpenStreetMap, Nominatim API, Leaflet, Google Maps Navigation Links

\---

## 📂 Project Structure

```text
Civic\\\\\\\_Assist\\\\\\\_Platform/
├── ai\\\\\\\_engine/           # Python CLIP \\\\\\\& DistilBERT AI models
├── backend/
│   ├── config/          # Supabase \\\\\\\& Cloudinary configs
│   ├── controllers/     # Admin, issues, and auth business logic
│   ├── routes/          # Express API routes
│   └── server.js        # Node.js entry point (:3001)
├── src/
│   ├── admin/           # Admin Dashboard, Heatmap, Department workflows
│   ├── components/      # Navbar, Sidebar, AI Helper, Modals
│   ├── context/         # App \\\\\\\& Language State Context
│   ├── lib/             # API client \\\\\\\& Supabase helpers
│   └── screens/         # Feed, Report Issue, Issue Details, My Reports
└── package.json
```

\---

## 🚀 Quick Start

### 1\. Prerequisites

* Node.js (v18+)
* Python 3.10+ (for local AI engine)

### 2\. Environment Setup

Create a `.env` file in the root directory:

```env
PORT=3001
VITE\\\\\\\_API\\\\\\\_BASE=http://localhost:3001
SUPABASE\\\\\\\_URL=your\\\\\\\_supabase\\\\\\\_url
SUPABASE\\\\\\\_KEY=your\\\\\\\_supabase\\\\\\\_anon\\\\\\\_key
CLOUDINARY\\\\\\\_CLOUD\\\\\\\_NAME=your\\\\\\\_cloud\\\\\\\_name
CLOUDINARY\\\\\\\_API\\\\\\\_KEY=your\\\\\\\_api\\\\\\\_key
CLOUDINARY\\\\\\\_API\\\\\\\_SECRET=your\\\\\\\_api\\\\\\\_secret
ADMIN\\\\\\\_PASSWORD=your\\\\\\\_admin\\\\\\\_password
```

### 3\. Install \& Run

```bash
# Install dependencies
npm install

# Run backend and frontend concurrently
npm run dev
```

* **Frontend**: `http://localhost:5000`
* **Backend API**: `http://localhost:3001`
* **Admin Access**: Sign in with Administrator or Department Head credentials.

