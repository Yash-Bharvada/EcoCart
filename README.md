# EcoCart Backend 🌿

A production-ready **FastAPI** backend for **EcoCart** — an AI-powered sustainable shopping platform that analyzes receipts, calculates carbon footprints, and recommends eco-friendly alternatives.

## 🚀 Features

- 📸 **Receipt Analysis** — Upload any shopping receipt; Google Gemini AI identifies products and calculates CO₂ footprint per item
- 🌱 **Eco Score** — 0-100 sustainability score using Life Cycle Assessment (LCA) methodology
- 🛒 **Sustainable Alternatives** — Personalized eco-friendly product recommendations with affiliate tracking
- 💳 **Stripe Payments** — Subscription tiers (Free / Premium / Pro), carbon offset purchases, webhook processing
- 🌍 **Carbon Offsets** — Purchase verified carbon offsets from 5 project types (reforestation, renewable energy, etc.)
- 🏆 **Gamification** — Badge system, levels, points, community leaderboard
- 🔐 **Secure Auth** — JWT access/refresh tokens, bcrypt, email verification, password reset
- 📊 **Analytics** — User dashboards, monthly trend charts, category breakdowns
- 🐳 **Production-Ready** — Docker, rate limiting, Sentry, TTL indexes, S3 image storage

---

## 🏗 Project Structure

```
EcoCart/
├── app/
│   ├── api/
│   │   ├── dependencies.py      # FastAPI dependency injection
│   │   └── routes/
│   │       ├── health.py        # GET /health
│   │       ├── auth.py          # POST /auth/*
│   │       ├── analyze.py       # POST /analyze/ (receipt AI)
│   │       ├── products.py      # GET /products/*
│   │       ├── payments.py      # POST /payments/*
│   │       ├── users.py         # GET/PATCH /users/*
│   │       ├── history.py       # GET /history/*
│   │       └── carbon_offsets.py
│   ├── database/
│   │   ├── mongodb.py           # Motor async client
│   │   └── redis_client.py      # Redis async client
│   ├── middleware/
│   │   └── auth_middleware.py   # JWT deps + tier gates
│   ├── models/
│   │   ├── user.py              # MongoDB document models
│   │   ├── analysis.py
│   │   ├── product.py
│   │   ├── transaction.py
│   │   ├── carbon_offset.py
│   │   └── schemas.py           # Pydantic request/response schemas
│   ├── services/
│   │   ├── gemini_service.py    # Gemini AI integration
│   │   ├── payment_service.py   # Stripe integration
│   │   ├── user_service.py      # User management + badges
│   │   ├── product_service.py   # Product search + recommendations
│   │   ├── analytics_service.py # Event tracking
│   │   ├── carbon_calculator.py # LCA-based carbon estimation
│   │   └── email_service.py     # SendGrid email templates
│   ├── utils/
│   │   ├── security.py          # JWT, bcrypt, token generation
│   │   ├── image_processor.py   # Pillow image optimization
│   │   ├── validators.py        # Custom validators
│   │   ├── affiliate_links.py   # Redirect URL generation
│   │   └── helpers.py           # MongoDB serialization, pagination
│   ├── config.py                # Pydantic BaseSettings
│   └── main.py                  # FastAPI app with lifespan
├── migrations/
│   └── init_indexes.py          # MongoDB index creation
├── tests/
│   ├── conftest.py              # pytest fixtures (mongomock + fakeredis)
│   ├── test_auth.py
│   ├── test_analysis.py
│   ├── test_payments.py
│   └── test_products.py
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── run.py
└── .env.example
```

---

## ⚡ Quick Start

### 1. Clone & Configure

```bash
git clone https://github.com/your-org/ecocart.git
cd EcoCart
cp .env.example .env
# Edit .env with your API keys
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Development Server

```bash
python run.py
# or
uvicorn app.main:app --reload
```

### 4. Create Database Indexes

```bash
python migrations/init_indexes.py
```

### 5. Open API Docs

Visit [http://localhost:8000/docs](http://localhost:8000/docs) for the Swagger UI.

---

## 🐳 Docker Development

```bash
# Start all services (FastAPI + MongoDB + Redis + Mongo Express)
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop
docker-compose down
```

**Services:**
| Service       | URL                         |
|---------------|-----------------------------|
| API           | http://localhost:8000        |
| API Docs      | http://localhost:8000/docs   |
| MongoDB       | mongodb://localhost:27017    |
| Mongo Express | http://localhost:8081        |
| Redis         | redis://localhost:6379       |

---

## 📡 API Reference

### Auth
| Method | Endpoint                    | Description                  | Auth  |
|--------|-----------------------------|------------------------------|-------|
| POST   | `/api/v1/auth/register`     | Create account               | ❌     |
| POST   | `/api/v1/auth/login`        | Login → JWT tokens           | ❌     |
| POST   | `/api/v1/auth/refresh`      | Refresh access token         | ❌     |
| POST   | `/api/v1/auth/logout`       | Revoke session               | ✅     |
| POST   | `/api/v1/auth/verify-email` | Verify email                 | ❌     |
| POST   | `/api/v1/auth/forgot-password` | Send reset email          | ❌     |
| POST   | `/api/v1/auth/reset-password`  | Reset with token          | ❌     |
| GET    | `/api/v1/auth/me`           | Current user profile         | ✅     |

### Analysis
| Method | Endpoint                     | Description                  | Auth  |
|--------|------------------------------|------------------------------|-------|
| POST   | `/api/v1/analyze/`           | Analyze receipt image        | ✅     |
| GET    | `/api/v1/analyze/history`    | Paginated history            | ✅     |
| GET    | `/api/v1/analyze/stats`      | Aggregate analytics          | ✅     |
| GET    | `/api/v1/analyze/{id}`       | Single analysis              | ✅     |
| DELETE | `/api/v1/analyze/{id}`       | Soft-delete analysis         | ✅     |

### Products
| Method | Endpoint                              | Description                  | Auth     |
|--------|---------------------------------------|------------------------------|----------|
| GET    | `/api/v1/products/`                   | Search/filter products       | Optional |
| GET    | `/api/v1/products/recommendations`    | Personalized recommendations | ✅        |
| GET    | `/api/v1/products/alternatives/{id}`  | Alternatives for analysis    | ✅        |
| GET    | `/api/v1/products/{id}`               | Product detail               | Optional |
| POST   | `/api/v1/products/{id}/click`         | Track click                  | Optional |
| GET    | `/r/{code}`                           | Affiliate redirect           | ❌        |

### Payments
| Method | Endpoint                              | Description                  | Auth  |
|--------|---------------------------------------|------------------------------|-------|
| POST   | `/api/v1/payments/subscribe`          | Create subscription          | ✅     |
| POST   | `/api/v1/payments/cancel-subscription`| Cancel at period end         | ✅     |
| POST   | `/api/v1/payments/create-intent`      | Create PaymentIntent         | ✅     |
| POST   | `/api/v1/payments/carbon-offset`      | Purchase carbon offset       | ✅     |
| GET    | `/api/v1/payments/history`            | Transaction history          | ✅     |
| GET    | `/api/v1/payments/subscription/status`| Subscription details         | ✅     |
| POST   | `/api/v1/payments/webhook`            | Stripe webhook               | ❌ (signed) |

### Users
| Method | Endpoint                    | Description                  | Auth  |
|--------|-----------------------------|------------------------------|-------|
| GET    | `/api/v1/users/me`          | User profile                 | ✅     |
| PATCH  | `/api/v1/users/me`          | Update profile               | ✅     |
| GET    | `/api/v1/users/dashboard`   | Analytics dashboard          | ✅     |
| GET    | `/api/v1/users/badges`      | Badge achievements           | ✅     |
| GET    | `/api/v1/users/leaderboard` | Community leaderboard        | Optional |
| POST   | `/api/v1/users/preferences` | Update preferences           | ✅     |
| DELETE | `/api/v1/users/me`          | GDPR account deletion        | ✅     |

---

## 🔧 Environment Variables

See [`.env.example`](.env.example) for all available settings.

**Required:**
```env
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=ecocart
SECRET_KEY=your-256-bit-secret-key
GEMINI_API_KEY=your-gemini-api-key
STRIPE_SECRET_KEY=sk_live_...
```

---

## 🧪 Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx mongomock fakeredis

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html
```

---

## 💎 Subscription Tiers

| Feature                  | Free  | Premium ($9.99/mo) | Pro ($19.99/mo) |
|--------------------------|:-----:|:------------------:|:---------------:|
| Monthly analyses         | 5     | Unlimited          | Unlimited       |
| Gemini model             | Flash | Pro                | Pro             |
| Carbon offset purchases  | ✅    | ✅                  | ✅              |
| Personalized recommendations | ✅ | ✅                 | ✅              |
| API access               | ❌    | ❌                  | ✅              |
| Priority support         | ❌    | ✅                  | ✅              |
| Bulk analysis            | ❌    | ❌                  | ✅              |

---

## 🌍 Carbon Offset Projects

| Project Type      | Price/ton CO₂ | Certification   |
|-------------------|:-------------:|-----------------|
| Reforestation     | $12           | Gold Standard   |
| Renewable Energy  | $10           | VCS             |
| Ocean Cleanup     | $20           | Plan Vivo       |
| Methane Capture   | $15           | Gold Standard   |
| Direct Air Capture| $30           | Carbon Removal  |

---

## 🛡 Security

- JWT RS256 access tokens (15-min expiry) + refresh tokens (30-day TTL)
- Bcrypt password hashing (cost factor configurable)
- Rate limiting via `slowapi`
- Stripe webhook signature verification
- GDPR Right to Erasure (PII anonymization)
- MongoDB TTL indexes (auto-delete expired sessions and analytics)

---

## 📝 License

MIT © EcoCart 2024
