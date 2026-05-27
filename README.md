# 🔐 CyberBrief

> AI-powered cybersecurity news dashboard with real-time threat intelligence and TL;DR summaries.

![CyberBrief](https://img.shields.io/badge/powered%20by-Gemini%202.5-blue?style=flat-square&logo=google)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?style=flat-square&logo=vercel)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

## 📸 Features

- 🔴 **Live threat feed** — fetches real cybersecurity news from the last 48 hours
- ⚡ **AI TL;DR** — every story summarized in 1-2 sentences by Gemini 2.5
- 🎯 **Severity ratings** — Critical / High / Medium / Low / Info color coding
- 🗂️ **Category filters** — Vulnerabilities, Data Breaches, Malware, Nation-State, Zero-Day
- 🌐 **Grounded search** — powered by Google Search via Gemini's grounding tool
- 🎨 **Hacker aesthetic** — dark UI built for security professionals

## 🚀 Live Demo

[cyberbrief.vercel.app](https://cyberbrief.vercel.app)

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| AI Model | Gemini 2.5 Flash |
| Search | Google Search Grounding |
| Deployment | Vercel |
| Styling | Inline styles + Google Fonts |

## ⚙️ Local Setup

### 1. Clone the repo
```bash
git clone https://github.com/chris12x1/cyberbrief.git
cd cyberbrief
```

### 2. Install dependencies
```bash
npm install
```

### 3. Add your Gemini API key
```bash
cp .env.example .env.local
```
Open `.env.local` and paste your key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

```env
GEMINI_API_KEY=your_key_here
```

### 4. Run locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🌍 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/chris12x1/cyberbrief)

1. Click the button above or import the repo at [vercel.com](https://vercel.com)
2. Add environment variable: `GEMINI_API_KEY`
3. Deploy ✅

## 📁 Project Structure

```
cyberbrief/
├── app/
│   ├── api/
│   │   └── news/
│   │       └── route.js       # Backend — Gemini API call (key stays secret)
│   ├── components/
│   │   └── NewsCard.jsx       # Expandable article card
│   ├── globals.css            # Global styles + animations
│   ├── layout.jsx             # Root layout
│   └── page.jsx               # Main dashboard UI
├── .env.example               # Environment variable template
├── next.config.js
└── package.json
```
## 🔑 Environment Variables

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `GEMINI_API_KEY` | Google Gemini API key | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |

## 📜 License

MIT — free to use, modify, and deploy.

---

Built by [Christopher Diaz](https://github.com/chris12x1) · Powered by [Google Gemini](https://deepmind.google/technologies/gemini/)
