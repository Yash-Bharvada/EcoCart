# 🌿 EcoCart: AI-Powered Sustainable Shopping 🌍

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000.svg?style=flat&logo=next.js&logoColor=white)](https://nextjs.org)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-3.0_Flash-blue.svg)](https://ai.google.dev/)

**Shop smarter for the planet.** EcoCart is a modern, AI-driven platform that helps you understand your environmental impact by analyzing shopping receipts, calculating carbon footprints, and recommending sustainable alternatives.

---

## ✨ Features at a Glance

| | |
| :--- | :--- |
| 📸 **Receipt AI** | Upload any receipt; Google Gemini 3.5 Flash identifies products and calculates CO₂ in seconds. |
| 🌱 **Eco Score** | Understand your footprint with a 0-100 sustainability score based on Life Cycle Assessment (LCA). |
| 🛒 **Smart Swaps** | Get personalized, eco-friendly product recommendations with direct purchase links. |
| 💳 **Offsetting** | Neutralize your impact by funding verified carbon projects (reforestation, renewable energy, etc.). |
| 🏆 **Gamified Impact** | Earn badges, level up, and compete on the global leaderboard as an Eco Warrior. |

---

## 🎨 Visual Preview

<div align="center">
  <img src="assets/dashboard_preview.png" width="400" alt="Dashboard Preview" />
  <img src="assets/login_preview.png" width="400" alt="Login Preview" />
</div>

---

## 🏗 System Architecture

```mermaid
graph TD
    User((User)) -->|Upload Receipt| FE[Next.js Frontend]
    FE -->|API Request| BE[FastAPI Backend]
    BE -->|Image Analysis| Gemini[Google Gemini AI]
    BE -->|Store Data| DB[(MongoDB)]
    BE -->|Cache & Rate Limit| Cache[(Redis)]
    BE -->|Emails| SES[email_service]
    BE -->|Payments| Stripe[Stripe API]
    BE -->|Product Catalog| Products[product_service]
```

---

## 🚀 Getting Started

The project is structured as a mono-repo for easy development.

### 1. Prerequisites
- Python 3.10+
- Node.js 20+
- MongoDB & Redis (or use Docker)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env      # Fill in Gemini & MongoDB keys
python run.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local # Add NEXT_PUBLIC_API_URL
npm run dev
```

---

## 🐳 Docker Support

Spin up the entire stack (API, DB, Redis) with a single command:

```bash
docker-compose up -d
```

---

## 📡 API Endpoints (v1)

- **Auth**: `/api/v1/auth/` (Google & Local)
- **Analyze**: `/api/v1/analyze/` (Receipt processing)
- **Products**: `/api/v1/products/` (Catalog & Suggestions)
- **Users**: `/api/v1/users/` (Profile & Dashboard)
- **Offsets**: `/api/v1/carbon-offsets/` (Impact tracking)

---

## 🛡 Security & Best Practices

- **JWT Authentication** — Secure token-based sessions.
- **Rate Limiting** — Preventing abuse with `slowapi`.
- **GDPR Compliant** — Right to erasure and data portability built-in.
- **Modern UI** — Built with Tailwind CSS, Shadcn/UI, and Radix Primitives.

---

## 📝 License

MIT © [EcoCart](https://github.com/Yash-Bharvada/EcoCart) 2024
