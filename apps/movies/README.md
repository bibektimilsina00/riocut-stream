<div align="center">

![Riocut Logo](public/logo.svg)

**🎬 A Next.js-powered streaming platform with real-time features, social watching, and comprehensive movie/TV show discovery**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[🌐 Live Demo](https://riocut.com) • [📝 Blog](https://blog.riocut.com) • [🐛 Report Bug](https://github.com/bibektimilsina00/riocut-stream/issues) • [✨ Request Feature](https://github.com/bibektimilsina00/riocut-stream/issues)

</div>

---

## 📋 Table of Contents

- [✨ Overview](#-overview)
- [🚀 Key Features](#-key-features)
- [🎯 Live Demo](#-live-demo)
- [🛠 Tech Stack](#-tech-stack)
- [📦 Quick Start](#-quick-start)
- [⚙️ Configuration](#️-configuration)
- [🗄️ Database Setup](#️-database-setup)
- [💻 Development](#-development)
- [🐳 Docker Deployment](#-docker-deployment)
- [🔄 CI/CD Pipeline](#-cicd-pipeline)
- [📁 Project Structure](#-project-structure)
- [🔌 API Reference](#-api-reference)
- [🎨 UI Components](#-ui-components)
- [🧪 Testing](#-testing)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)
- [📞 Support](#-support)

---

## ✨ Overview

**Riocut** is a cutting-edge streaming platform that revolutionizes how people discover and watch movies and TV shows together. Built with modern web technologies, it offers a seamless, fast, and social viewing experience.

### 🎯 What Makes Riocut Special?

- 🎥 **50,000+ Movies & TV Shows** - Powered by TMDB API with real-time updates
- 👥 **Watch Together** - Synchronized playback with WebRTC video calling
- ⚡ **Blazing Fast** - Next.js 15 with Turbopack and React 19 Server Components
- 📱 **Progressive Web App** - Install on any device, works offline
- 🎨 **Beautiful UI** - Modern, responsive design with Radix UI and Tailwind CSS
- 🔒 **Secure** - NextAuth.js with role-based access control
- 🚀 **Production Ready** - Docker, CI/CD, zero-downtime deployments

---

## 🚀 Key Features

### 🎬 Content Discovery & Streaming

<table>
<tr>
<td width="50%">

**Advanced Search & Filters**
- Full-text search across 50k+ titles
- Filter by genre, year, rating, popularity
- Real-time search suggestions
- Trending & popular content

</td>
<td width="50%">

**Multi-Source Video Players**
- 5+ embedded video providers
- Automatic failover & health checks
- Episode thumbnail previews
- Season & episode navigation

</td>
</tr>
<tr>
<td width="50%">

**Rich Content Details**
- High-quality posters & backdrops
- Cast & crew information
- Trailers & video clips
- User ratings & reviews
- Similar content recommendations

</td>
<td width="50%">

**Smart Personalization**
- Custom watchlists
- Continue watching history
- Viewing statistics
- Content recommendations

</td>
</tr>
</table>

### 👥 Social Features

- **🎭 Watch Together Rooms** - Create private rooms, invite friends, synchronized playback
- **💬 Real-time Chat** - Socket.IO-powered messaging during watch sessions
- **📹 Video Calling** - WebRTC peer-to-peer video connections
- **🔗 Share Sessions** - Unique room codes for easy joining
- **🔔 Notifications** - Real-time updates for activities

### 🔐 Authentication & Security

- **NextAuth.js v5** - Secure JWT-based authentication
- **Role-Based Access** - User, Moderator, Admin roles
- **Password Encryption** - bcrypt with salt rounds
- **Session Management** - Automatic refresh & persistence
- **Admin Panel** - User management & moderation tools

### 📊 Analytics & Performance

- **Google Analytics 4** - Comprehensive user insights and behavior tracking
- **Umami Analytics** - Privacy-focused, lightweight analytics alternative
- **Web Vitals Tracking** - LCP, FID, CLS monitoring with real-time metrics
- **Sentry Integration** - Error tracking and performance monitoring
- **Provider Health Checks** - Automatic video source monitoring and failover
- **SEO Optimized** - Dynamic sitemaps, meta tags, structured data

### 🎨 User Experience

- **Responsive Design** - Mobile-first, tablet, and desktop optimized
- **Dark Theme** - Eye-friendly color scheme
- **Lazy Loading** - Intersection Observer for images and content
- **Infinite Scroll** - Seamless browsing experience
- **Accessibility** - WCAG 2.1 compliant with Radix UI
- **PWA Support** - Install, offline mode, push notifications

---

## 🎯 Live Demo

🌐 **Website**: [riocut.com](https://riocut.com)  
📝 **Blog**: [blog.riocut.com](https://blog.riocut.com)

### Test Credentials

To explore the platform, you can create a test account or use the admin script to elevate your user:

```bash
npm run make-admin your@email.com
```

---

## 🛠 Tech Stack

### Frontend Architecture

<table>
<tr>
<td width="33%">

**Core Framework**
- Next.js 15.5.4
- React 19.1.0
- TypeScript 5.6+
- Turbopack

</td>
<td width="33%">

**Styling & UI**
- Tailwind CSS 4.0
- Radix UI Components
- Lucide React Icons
- CSS Modules

</td>
<td width="33%">

**State & Data**
- TanStack Query v5
- Axios HTTP Client
- Socket.IO Client
- LocalForage

</td>
</tr>
</table>

### Backend & Infrastructure

<table>
<tr>
<td width="33%">

**Server & API**
- Next.js API Routes
- Socket.IO v4.8
- NextAuth.js v5
- TMDB API

</td>
<td width="33%">

**Database**
- PostgreSQL 14+
- Prisma ORM 6.17
- Redis (optional)
- Connection Pooling

</td>
<td width="33%">

**DevOps**
- Docker & Compose
- GitHub Actions
- Nginx Reverse Proxy
- Let's Encrypt SSL

</td>
</tr>
</table>

### Development Tools

- **TypeScript** - Strict mode with full type safety
- **ESLint** - Next.js recommended config
- **Prettier** - Code formatting (integrated)
- **Husky** - Git hooks for quality checks
- **ts-node** - TypeScript script execution

---

## 📦 Quick Start

### Prerequisites

Ensure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org/) | 18.x+ | JavaScript runtime |
| [npm](https://www.npmjs.com/) | 9.x+ | Package manager |
| [PostgreSQL](https://www.postgresql.org/) | 14.x+ | Database |
| [TMDB API Key](https://www.themoviedb.org/settings/api) | - | Movie/TV data |
| [Git](https://git-scm.com/) | 2.x+ | Version control |

### Installation

1️⃣ **Clone the repository**

```bash
git clone https://github.com/bibektimilsina00/riocut-stream.git
cd movies
```

2️⃣ **Install dependencies**

```bash
npm install
```

3️⃣ **Configure environment**

```bash
cp .env.example .env.local
# Edit .env.local with your configuration (see Configuration section)
```

4️⃣ **Setup database**

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed with initial data
npm run db:seed
```

5️⃣ **Start development server**

```bash
npm run dev
```

6️⃣ **Open your browser**

Navigate to [http://localhost:8000](http://localhost:8000) 🎉

---

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# ==================
# 🗄️ DATABASE
# ==================
DATABASE_URL="postgresql://user:password@localhost:5432/riocut"

# ==================
# 🔐 AUTHENTICATION
# ==================
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:8000"

# ==================
# 🎬 TMDB API
# ==================
TMDB_API_KEY="your-tmdb-api-key"
NEXT_PUBLIC_TMDB_API_KEY="your-tmdb-api-key"
NEXT_PUBLIC_TMDB_BASE_URL="https://api.themoviedb.org/3"

# ==================
# 🌐 APPLICATION
# ==================
NEXT_PUBLIC_APP_URL="http://localhost:8000"
NEXT_PUBLIC_BASE_URL="http://localhost:8000"

# ==================
# 📊 ANALYTICS (Optional)
# ==================
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_UMAMI_WEBSITE_ID="your-umami-id"
NEXT_PUBLIC_UMAMI_URL="https://analytics.umami.is"

# ==================
# 🔴 ERROR TRACKING (Optional)
# ==================
SENTRY_DSN="your-sentry-dsn"
NEXT_PUBLIC_SENTRY_DSN="your-public-sentry-dsn"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"

# ==================
# 📹 VIDEO PROVIDERS
# ==================
VIDSRC_API_URL="https://vidsrc.xyz/embed"
VIDSRC_PRO_API_URL="https://vidsrc.pro/embed"

# ==================
# 🗄️ CACHING (Optional)
# ==================
REDIS_URL="redis://localhost:6379"
```

### Configuration Reference

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | - |
| `NEXTAUTH_SECRET` | ✅ | JWT secret (32+ characters) | - |
| `NEXTAUTH_URL` | ✅ | Base URL of your app | http://localhost:8000 |
| `TMDB_API_KEY` | ✅ | The Movie Database API key | - |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public app URL for SEO | - |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ⚪ | Google Analytics 4 ID | - |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | ⚪ | Umami Analytics website ID | - |
| `NEXT_PUBLIC_UMAMI_URL` | ⚪ | Umami Analytics server URL | https://analytics.umami.is |
| `SENTRY_DSN` | ⚪ | Sentry error tracking | - |
| `REDIS_URL` | ⚪ | Redis cache connection | - |

### Getting API Keys

**TMDB API Key:**
1. Visit [themoviedb.org](https://www.themoviedb.org/signup)
2. Create an account
3. Go to Settings → API
4. Request an API key (free)

**Google Analytics:**
1. Visit [analytics.google.com](https://analytics.google.com/)
2. Create a property
3. Get your GA4 Measurement ID

**Umami Analytics:**
1. Visit [umami.is](https://umami.is/) or use [cloud.umami.is](https://cloud.umami.is/)
2. Create an account and website
3. Get your Website ID from the script tag
4. Set `NEXT_PUBLIC_UMAMI_WEBSITE_ID` to your website ID

---

## 🗄️ Database Setup

### Prisma ORM Commands

```bash
# 🔧 Generate Prisma Client (after schema changes)
npm run db:generate

# 🚀 Create and apply migrations (development)
npm run db:migrate

# 📦 Deploy migrations (production)
npm run db:migrate:deploy

# 🎨 Open Prisma Studio (visual database editor)
npm run db:studio

# 🌱 Seed database with initial data
npm run db:seed

# ⚠️ Reset database (CAUTION: deletes all data)
npm run db:reset
```

### Database Schema Overview

**Core Models:**

- **User** - Authentication, profiles, roles
- **Watchlist** - User's saved content
- **ContinueWatching** - Viewing progress tracking
- **WatchRoom** - Watch Together sessions
- **Notification** - User notifications
- **BlogGenerationProgress** - Blog automation tracking

**Admin Models:**

- **VideoProvider** - Video source configuration
- **ProviderHealthLog** - Provider uptime monitoring
- **BlogPost** - Content management

📖 **Full Schema**: See [`prisma/schema.prisma`](./prisma/schema.prisma)

### Database Migrations

Migrations are version-controlled in `prisma/migrations/`. Key migrations:

- `20251016065259_init_database_with_watchlist_and_rooms` - Initial schema
- `20251016071256_add_notifications_system` - Notifications feature

---

## 💻 Development

### Available Scripts

```bash
# 🚀 Start development server (Turbopack)
npm run dev

# 🔧 Start with Webpack (fallback)
npm run dev:webpack

# 🏗️ Build for production
npm run build

# ▶️ Start production server
npm start

# 🧹 Run ESLint
npm run lint

# 🧪 Run tests
npm test

# 👤 Promote user to admin
npm run make-admin user@example.com
```

### Development Workflow

#### 1. Create Feature Branch

```bash
git checkout -b feature/amazing-feature
```

#### 2. Make Changes

- **Components**: Follow Server Component patterns
- **Styling**: Use Tailwind utility classes
- **Types**: Add to `src/types/`
- **API**: Use TanStack Query hooks in `src/lib/hooks/`

#### 3. Code Quality

```bash
# Lint your code
npm run lint

# Type check
npx tsc --noEmit

# Build to catch errors
npm run build
```

#### 4. Commit & Push

```bash
git add .
git commit -m "feat: add amazing feature"
git push origin feature/amazing-feature
```

#### 5. Create Pull Request

Open a PR on GitHub with:
- Clear description
- Screenshots (if UI changes)
- Testing notes

### Code Style Guidelines

**TypeScript**
```typescript
// ✅ Good - Strict typing
interface MovieDetails {
  id: number;
  title: string;
  releaseDate: string;
}

// ❌ Avoid - Any types
const movie: any = fetchMovie();
```

**React Components**
```typescript
// ✅ Good - Server Component (default)
export default async function MoviePage({ params }: { params: { id: string } }) {
  const movie = await getMovieDetails(params.id);
  return <MovieView movie={movie} />;
}

// ✅ Good - Client Component (when needed)
'use client';
export function InteractiveButton() {
  const [clicked, setClicked] = useState(false);
  return <button onClick={() => setClicked(true)}>Click</button>;
}
```

**API Fetching**
```typescript
// ✅ Good - React Query hook
export function useMovieDetails(id: number) {
  return useQuery({
    queryKey: tmdbKeys.movieDetails(id),
    queryFn: () => getMovieDetails(id),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// ❌ Avoid - Direct fetch in components
useEffect(() => {
  fetch(`/api/movie/${id}`).then(/* ... */);
}, [id]);
```

**File Naming**
- Components: `PascalCase.tsx` (e.g., `MovieCard.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Pages: `kebab-case/page.tsx` (e.g., `movie/[id]/watch/page.tsx`)

---

## 🐳 Docker Deployment

### Quick Deploy with Docker Compose

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Manual Docker Build

```bash
# Build image
docker build -t riocut-movies:latest .

# Run container
docker run -d \
  --name movies \
  -p 8000:8000 \
  --env-file .env \
  riocut-movies:latest
```

### Production Docker Build Script

```bash
# Build and push to GitHub Container Registry
./build.sh --env production --version v1.0.0 --push
```

### Docker Configuration

**Dockerfile Highlights:**
- Multi-stage build for optimization
- Node.js 18 Alpine base
- Prisma client generation
- Production dependencies only
- Health checks included

**docker-compose.yml Services:**
- `app` - Next.js application (port 8000)
- `db` - PostgreSQL 14 (port 5432)
- `redis` - Redis cache (port 6379, optional)

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Automated deployment on push to `main` or `production` branches:

```yaml
Trigger: Push to main/production
  ↓
[Parallel Jobs - 40-50% Faster]
  ├── Lint & Type Check
  ├── Security Audit
  ├── Build & Test
  └── Dependency Check
  ↓
Build Docker Image
  ↓
Push to GHCR (GitHub Container Registry)
  ↓
Deploy to Production Server (SSH)
  ↓
Blue-Green Deployment
  ├── Start new container (port 8001)
  ├── Health check
  ├── Switch traffic to new container
  └── Clean up old container
  ↓
✅ Zero-Downtime Deployment Complete
```

### Required GitHub Secrets

**Settings → Secrets and variables → Actions**

**Secrets:**
```
SSH_PRIVATE_KEY      - SSH key for server access
REGISTRY_TOKEN       - GitHub Container Registry token
NEXTAUTH_SECRET      - NextAuth JWT secret
TMDB_API_KEY         - TMDB API key
SENTRY_DSN          - Sentry error tracking (optional)
UMAMI_WEBSITE_ID    - Umami Analytics website ID (optional)
```

**Variables:**
```
SERVER_HOST              - Production server IP/domain
SERVER_USER              - SSH username (e.g., ubuntu)
APP_URL                  - Production URL (https://riocut.com)
GA_MEASUREMENT_ID_MAIN   - Google Analytics ID
```

### Server Setup

**Prerequisites on production server:**
```bash
# Install Docker & Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Create deployment directory
mkdir -p ~/riocut
cd ~/riocut

# Upload deploy.sh script
# (Handles blue-green deployment)
```

**Deploy Script** (`deploy.sh` on server):
- Pulls latest Docker image from GHCR
- Starts new container on port 8001
- Runs health checks
- Switches Nginx to new container
- Cleans up old deployment

📖 **Full Setup Guide**: See [CICD_SETUP.md](.github/copilot-instructions.md)

---

## 📁 Project Structure

```
movies/
├── 📂 .github/
│   └── workflows/
│       └── deploy-production.yml    # CI/CD workflow
│
├── 📂 prisma/
│   ├── schema.prisma                # Database schema
│   ├── migrations/                  # Version-controlled migrations
│   └── seed.ts                      # Database seeding
│
├── 📂 public/
│   ├── logo.svg                     # Brand logo
│   ├── icon.svg                     # Favicon
│   ├── manifest.json                # PWA manifest
│   ├── sw.js                        # Service worker
│   └── robots.txt                   # SEO robots
│
├── 📂 src/
│   ├── 📂 app/                      # Next.js App Router
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Home page
│   │   ├── globals.css              # Global styles
│   │   ├── api/                     # API routes
│   │   │   ├── auth/                # NextAuth endpoints
│   │   │   ├── watchlist/           # Watchlist CRUD
│   │   │   ├── socketio.ts          # Socket.IO handler
│   │   │   └── ...
│   │   ├── movie/
│   │   │   └── [id]/
│   │   │       ├── page.tsx         # Movie details
│   │   │       └── watch/
│   │   │           └── page.tsx     # Movie player
│   │   ├── tv/
│   │   │   └── [id]/
│   │   │       ├── page.tsx         # TV details
│   │   │       └── watch/
│   │   │           └── page.tsx     # TV player
│   │   ├── search/                  # Search page
│   │   ├── watchlist/               # User watchlist
│   │   ├── watch-together/          # WebRTC rooms
│   │   └── sitemap-*.xml/           # Dynamic sitemaps
│   │
│   ├── 📂 components/
│   │   ├── ui/                      # Radix UI wrappers
│   │   │   ├── button.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── ...
│   │   ├── catalog/
│   │   │   ├── MediaCard.tsx        # Content cards
│   │   │   ├── MediaGrid.tsx        # Grid layouts
│   │   │   └── ...
│   │   ├── player/
│   │   │   ├── EmbeddedPlayer.tsx   # Video player
│   │   │   └── ...
│   │   ├── Navigation.tsx           # Main navbar
│   │   ├── Footer.tsx               # Site footer
│   │   ├── NotificationBell.tsx     # Notifications
│   │   └── ...
│   │
│   ├── 📂 lib/
│   │   ├── api/
│   │   │   └── tmdb.ts              # TMDB API client
│   │   ├── hooks/
│   │   │   └── useTMDb.ts           # React Query hooks
│   │   ├── services/
│   │   │   ├── watchlistService.ts
│   │   │   ├── notificationService.ts
│   │   │   └── ...
│   │   ├── auth.ts                  # NextAuth config
│   │   ├── prisma.ts                # Prisma client
│   │   ├── videoSources.ts          # Video providers
│   │   ├── utils.ts                 # Utilities
│   │   └── ...
│   │
│   ├── 📂 types/
│   │   ├── tmdb.ts                  # TMDB types
│   │   ├── user.ts                  # User types
│   │   └── ...
│   │
│   └── 📂 pages/api/
│       └── socketio.ts              # Socket.IO (Pages Router)
│
├── 📂 scripts/
│   ├── make-admin.ts                # Admin promotion script
│   └── README.md                    # Script documentation
│
├── 📄 Dockerfile                    # Docker config
├── 📄 docker-compose.yml            # Compose services
├── 📄 next.config.ts                # Next.js config
├── 📄 tailwind.config.ts            # Tailwind config
├── 📄 tsconfig.json                 # TypeScript config
├── 📄 prisma/schema.prisma          # Database schema
└── 📄 package.json                  # Dependencies
```

### Key Directories Explained

**`src/app/`** - Next.js App Router pages and API routes  
**`src/components/ui/`** - Reusable Radix UI components  
**`src/lib/api/`** - External API integrations (TMDB)  
**`src/lib/hooks/`** - Custom React hooks with TanStack Query  
**`src/lib/services/`** - Database operations via Prisma  
**`prisma/migrations/`** - Version-controlled database changes

---

## 🔌 API Reference

### Internal REST Endpoints

#### Authentication

```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123"
}
```

#### Watchlist Management

```http
GET /api/watchlist
Authorization: Bearer {session-token}
```

```http
POST /api/watchlist
Content-Type: application/json
Authorization: Bearer {session-token}

{
  "tmdbId": 12345,
  "mediaType": "movie",
  "title": "Inception",
  "posterPath": "/poster.jpg"
}
```

```http
DELETE /api/watchlist/[id]
Authorization: Bearer {session-token}
```

#### Watch Together

```http
POST /api/watch-party/create
Content-Type: application/json
Authorization: Bearer {session-token}

{
  "mediaType": "movie",
  "tmdbId": 12345,
  "title": "Inception"
}
```

### Socket.IO Events

**Connection**
```javascript
socket.on('connect', () => {
  console.log('Connected to Socket.IO server');
});
```

**Watch Together Room**
```javascript
// Join room
socket.emit('join-watch-together', { roomCode: 'ABC123' });

// Leave room
socket.emit('leave-watch-together', { roomCode: 'ABC123' });

// Send chat message
socket.emit('send-chat-message', {
  roomCode: 'ABC123',
  message: 'Hello!',
  userId: 'user-id',
  userName: 'John Doe'
});

// Receive chat message
socket.on('chat-message', (data) => {
  console.log(`${data.userName}: ${data.message}`);
});
```

**WebRTC Signaling**
```javascript
// Send WebRTC offer
socket.emit('webrtc-offer', {
  roomCode: 'ABC123',
  offer: rtcOffer,
  userId: 'user-id'
});

// Receive WebRTC answer
socket.on('webrtc-answer', (data) => {
  peerConnection.setRemoteDescription(data.answer);
});

// Exchange ICE candidates
socket.emit('webrtc-ice-candidate', {
  roomCode: 'ABC123',
  candidate: iceCandidate
});
```

### External APIs

**TMDB API Integration**

All TMDB API calls are abstracted in `src/lib/api/tmdb.ts`:

```typescript
// Get movie details
const movie = await getMovieDetails(movieId);

// Get TV show details
const tvShow = await getTVDetails(tvId);

// Get season details with episodes
const season = await getSeasonDetails(tvId, seasonNumber);

// Search content
const results = await searchMulti(query, page);

// Get trending content
const trending = await getTrending('movie', 'week');
```

📖 **TMDB API Docs**: [developers.themoviedb.org](https://developers.themoviedb.org/3)

---

## 🎨 UI Components

### Component Library

Riocut uses **Radix UI** for accessible, unstyled components styled with **Tailwind CSS**.

#### Button Component

```tsx
import { Button } from '@/components/ui/button';

<Button variant="primary" size="lg">
  Watch Now
</Button>
```

**Variants:** `primary`, `secondary`, `outline`, `ghost`, `danger`  
**Sizes:** `sm`, `md`, `lg`

#### Modal/Dialog

```tsx
import { Dialog, DialogContent, DialogTrigger } from '@radix-ui/react-dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <h2>Modal Title</h2>
    <p>Modal content goes here</p>
  </DialogContent>
</Dialog>
```

#### Media Card

```tsx
import { MediaCard } from '@/components/catalog/MediaCard';

<MediaCard
  id={movie.id}
  title={movie.title}
  posterPath={movie.poster_path}
  rating={movie.vote_average}
  mediaType="movie"
/>
```

#### Tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';

<Tabs defaultValue="movies">
  <TabsList>
    <TabsTrigger value="movies">Movies</TabsTrigger>
    <TabsTrigger value="tv">TV Shows</TabsTrigger>
  </TabsList>
  <TabsContent value="movies">Movie content</TabsContent>
  <TabsContent value="tv">TV content</TabsContent>
</Tabs>
```

### Available UI Components

Located in `src/components/ui/`:

- `button.tsx` - Button with variants
- `modal.tsx` - Dialog/Modal
- `tabs.tsx` - Tab navigation
- `dropdown-menu.tsx` - Dropdown menus
- `avatar.tsx` - User avatars
- `separator.tsx` - Dividers
- `select.tsx` - Select inputs

📖 **Radix UI Docs**: [radix-ui.com](https://www.radix-ui.com/)

---

## 🧪 Testing

### Test Structure

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Testing Guidelines

**Unit Tests** - Test individual functions and utilities  
**Component Tests** - Test React components in isolation  
**Integration Tests** - Test API routes and database operations  
**E2E Tests** - Test full user flows (planned)

### Example Test

```typescript
import { render, screen } from '@testing-library/react';
import { MediaCard } from '@/components/catalog/MediaCard';

describe('MediaCard', () => {
  it('renders movie title', () => {
    render(
      <MediaCard
        id={123}
        title="Inception"
        posterPath="/poster.jpg"
        mediaType="movie"
      />
    );
    expect(screen.getByText('Inception')).toBeInTheDocument();
  });
});
```

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

- 🐛 **Report Bugs** - [Open an issue](https://github.com/bibektimilsina00/riocut-stream/issues/new)
- ✨ **Suggest Features** - Share your ideas
- 📝 **Improve Documentation** - Fix typos, add examples
- 🔧 **Submit Pull Requests** - Fix bugs or add features
- ⭐ **Star the Repo** - Show your support

### Contribution Process

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add watch together feature
fix: resolve video playback issue
docs: update API documentation
style: format code with prettier
refactor: reorganize component structure
test: add unit tests for utils
chore: update dependencies
```

### Pull Request Guidelines

- ✅ Clear description of changes
- ✅ Link to related issues
- ✅ Screenshots for UI changes
- ✅ Tests pass (`npm test`)
- ✅ Linting passes (`npm run lint`)
- ✅ Build succeeds (`npm run build`)

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Maintain professional communication

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Riocut Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 🙏 Acknowledgments

Riocut wouldn't be possible without these amazing technologies and services:

### Core Technologies

- **[Next.js](https://nextjs.org/)** - The React framework for production
- **[React](https://react.dev/)** - A JavaScript library for building user interfaces
- **[TypeScript](https://www.typescriptlang.org/)** - JavaScript with syntax for types
- **[Tailwind CSS](https://tailwindcss.com/)** - A utility-first CSS framework

### UI & Components

- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible components
- **[Lucide Icons](https://lucide.dev/)** - Beautiful & consistent icon toolkit
- **[TanStack Query](https://tanstack.com/query)** - Powerful data synchronization

### Backend & Database

- **[Prisma](https://www.prisma.io/)** - Next-generation Node.js and TypeScript ORM
- **[PostgreSQL](https://www.postgresql.org/)** - The world's most advanced open source database
- **[NextAuth.js](https://next-auth.js.org/)** - Authentication for Next.js

### APIs & Services

- **[TMDB](https://www.themoviedb.org/)** - The Movie Database for content data
- **[Socket.IO](https://socket.io/)** - Real-time bidirectional event-based communication
- **[Sentry](https://sentry.io/)** - Error tracking and performance monitoring

### DevOps & Hosting

- **[Docker](https://www.docker.com/)** - Containerization platform
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD automation
- **[Vercel](https://vercel.com/)** - Inspiration for modern web development

### Community

- **Contributors** - Everyone who has contributed to this project
- **Open Source Community** - For creating amazing tools and libraries
- **You** - For using and supporting Riocut!

---

## 📞 Support

Need help? Have questions? We're here for you!

### 📧 Contact

- **Website**: [riocut.com](https://riocut.com)
- **Blog**: [blog.riocut.com](https://blog.riocut.com)
- **Email**: [support@riocut.com](mailto:support@riocut.com)

### 🐛 Issues & Bugs

Found a bug? Please report it:

1. **Search** [existing issues](https://github.com/bibektimilsina00/riocut-stream/issues)
2. **Create** a [new issue](https://github.com/bibektimilsina00/riocut-stream/issues/new) if not found
3. **Include** details:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots (if applicable)
   - Environment (OS, browser, Node version)

### ✨ Feature Requests

Have an idea? We'd love to hear it!

- [Open a feature request](https://github.com/bibektimilsina00/riocut-stream/issues/new?labels=enhancement)
- Describe the feature and use case
- Explain why it would be beneficial

### 📚 Documentation

- **Getting Started**: [Quick Start](#-quick-start)
- **API Docs**: [API Reference](#-api-reference)
- **Deployment**: [Docker Deployment](#-docker-deployment)
- **CI/CD Setup**: `.github/copilot-instructions.md`

### 💬 Community

- **GitHub Discussions**: Coming soon
- **Discord Server**: Coming soon
- **Twitter**: [@riocut](https://twitter.com/riocut)

---

<div align="center">

### 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=bibektimilsina00/riocut-stream&type=Date)](https://star-history.com/#bibektimilsina00/riocut-stream&Date)

---

**Built with ❤️ by [Riocut Team](https://github.com/bibektimilsina00)**

If you find this project helpful, please consider giving it a ⭐ star on GitHub!

[⬆ Back to Top](#readme)

</div>
