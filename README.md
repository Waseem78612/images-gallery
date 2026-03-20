# 🖼️ Image Gallery — Full Stack MERN App
**React · Tailwind CSS · Vite · Node.js · Express · MongoDB · Sharp · Docker**

---

## ✨ Features

- **Auth** — Register / Login with JWT. First page is always Register.
- **Image Upload** — Drag & drop or browse. Up to 20 files × 50MB each.
- **Server-side Compression** — Every image is compressed with Sharp (→ WebP, quality 75–80, max 1920px). 500MB of photos becomes ~50–100MB.
- **Gallery Grid** — Responsive masonry-style grid (2 → 3 → 4 → 5 columns).
- **Lightbox** — Click any image to view full size with compression stats.
- **Edit / Delete** — Add title & description, delete your own images.
- **Stats Bar** — See total photos, original size, stored size, and space saved.
- **Mobile-first** — Every screen built mobile-first with Tailwind CSS breakpoints.

---

## 📁 Project Structure

```
/
├── server.js              ← Unified entry (API + SPA, port 3000)
├── package.json
├── Dockerfile             ← Back4App / Docker ready
│
├── backend/
│   ├── server.js          ← Express app (exported, no listen)
│   ├── .env               ← MONGODB_URI, JWT_SECRET, PORT
│   ├── config/
│   │   ├── mongodb.js
│   │   ├── multer.js      ← Memory storage, 50MB limit
│   │   └── compress.js    ← Sharp WebP compression
│   ├── models/
│   │   ├── userModel.js
│   │   └── imageModel.js  ← Stores compressed Buffer in MongoDB
│   ├── controllers/
│   │   ├── userController.js
│   │   └── imageController.js
│   ├── routes/
│   │   ├── userRoute.js
│   │   └── imageRoute.js
│   └── middleware/
│       └── auth.js
│
└── image-gallery/         ← React frontend (Vite + Tailwind)
    └── src/
        ├── pages/
        │   ├── RegisterPage.jsx   ← First page
        │   ├── LoginPage.jsx
        │   ├── HomePage.jsx
        │   ├── GalleryPage.jsx    ← Main feature
        │   ├── AboutPage.jsx
        │   ├── SkillsPage.jsx
        │   ├── ProjectsPage.jsx
        │   └── ContactPage.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   └── Footer.jsx
        └── context/
            └── AuthContext.jsx
```

---

## ▶️ Run Locally

### Step 1 — Backend `.env`
```
cd backend
cp .env.example .env
# Edit .env:
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/image-gallery
JWT_SECRET=change_this_to_a_long_random_string
PORT=3000
NODE_ENV=development
```

### Step 2 — Build & Start (Unified)
```bash
# Install all deps
cd backend && npm install && cd ..
cd image-gallery && npm install && npm run build && cd ..
npm install

# Start
node server.js
# → http://localhost:3000
```

### Dev Mode (Hot Reload)
```bash
# Terminal 1 — API
node server.js

# Terminal 2 — Frontend with HMR
cd image-gallery && npm run dev
# → http://localhost:5173 (proxied to :3000)
```

---

## 🔌 API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/user/register` | — | Create account |
| POST | `/api/user/login` | — | Sign in, get JWT |
| GET | `/api/user/me` | ✅ Bearer | Current user |
| GET | `/api/user/all` | — | All users (dev) |
| POST | `/api/images/upload` | ✅ Bearer | Upload images (multipart, field=`images`) |
| GET | `/api/images` | ✅ Bearer | My images (no binary) |
| GET | `/api/images/:id/view` | — | Serve compressed image |
| PATCH | `/api/images/:id` | ✅ Bearer | Update title/description |
| DELETE | `/api/images/:id` | ✅ Bearer | Delete image |

---

## 🗜️ Compression Details

| Input | Quality | Max Size | Output Format | Typical Ratio |
|-------|---------|----------|---------------|---------------|
| JPEG/JPG | 75 | 1920px | WebP | ~85–90% smaller |
| PNG | 80 | 1920px | WebP | ~70–85% smaller |
| WebP | 75 | 1920px | WebP | ~60–75% smaller |
| GIF | 70 | 1920px | WebP | ~80–90% smaller |

500MB of mixed photos → ~50–100MB stored.

---

## 🚀 Deploy to Back4App

Set in Back4App dashboard:
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=long_random_string
PORT=3000
NODE_ENV=production
```
Back4App reads `Dockerfile` automatically.
