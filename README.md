# Planning Platform - Complete Productivity Application

A comprehensive planning and productivity platform with AI-powered features, social networking, advanced statistics, and gamification.

## 🚀 Features

### Core Features
- ✅ **Complete Authentication System** - Registration, login, JWT tokens, profile management
- ✅ **Planning Management** - Create, read, update, delete plannings with templates
- ✅ **Task Management** - Full CRUD operations with drag & drop support
- ✅ **AI Assistant** - OpenAI-powered planning suggestions and motivational coaching
- ✅ **Social Features** - Follow users, like/comment on public plannings, discover feed
- ✅ **Advanced Statistics** - Dashboard with completion rates, streaks, heatmaps
- ✅ **Gamification** - Points/XP system, achievements, levels, streaks
- ✅ **Notifications** - In-app notifications for social interactions
- ✅ **Dark Mode** - Toggle between light and dark themes
- ✅ **Responsive Design** - Optimized for mobile and desktop

## 🏗️ Architecture

### Backend (Node.js + Express)
```
backend/
├── server.js              # Main server file
├── config/
│   ├── database.js        # PostgreSQL configuration
│   └── auth.js            # JWT configuration
├── models/
│   ├── User.js            # User model
│   ├── Planning.js        # Planning model
│   └── Task.js            # Task model
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── users.js           # User management routes
│   ├── plannings.js       # Planning CRUD routes
│   ├── tasks.js           # Task CRUD routes
│   ├── ai.js              # AI assistant routes
│   └── stats.js           # Statistics routes
├── middleware/
│   ├── auth.js            # JWT authentication middleware
│   └── validation.js      # Input validation
├── services/
│   └── aiService.js       # OpenAI integration
└── scripts/
    └── initDatabase.js    # Database initialization
```

### Frontend (HTML + Tailwind CSS + Vanilla JS)
```
frontend/
├── index.html             # Landing & authentication page
├── dashboard.html         # Main dashboard
├── discover.html          # Public plannings feed (to be created)
├── stats.html             # Statistics page (to be created)
├── profile.html           # User profile (to be created)
├── css/
│   └── style.css          # Custom styles
└── js/
    ├── app.js             # Core utilities
    ├── auth.js            # Authentication logic
    ├── planning.js        # Planning management (to be created)
    ├── social.js          # Social features (to be created)
    └── stats.js           # Statistics charts (to be created)
```

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
```bash
git clone <repository-url>
cd my_website-
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Initialize database**
```bash
npm run init-db
```

5. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

6. **Open frontend**
Open `frontend/index.html` in your browser or serve with a local server.

## 🔐 Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/planning_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=sk-your-api-key

# Email Service (optional)
EMAIL_SERVICE_API_KEY=your-email-api-key
EMAIL_FROM=noreply@yourapp.com

# Frontend
FRONTEND_URL=http://localhost:3000

# Server
PORT=3001
NODE_ENV=development
```

## 📊 Database Schema

### Main Tables
- **users** - User accounts with authentication
- **plannings** - Planning containers
- **tasks** - Individual tasks with scheduling
- **follows** - User follow relationships
- **likes** - Planning likes
- **comments** - Planning comments
- **stats** - Daily productivity statistics
- **achievements** - User achievements/badges
- **notifications** - User notifications
- **user_points** - Points, XP, and levels

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/logout` - Logout

### Plannings
- `GET /api/plannings` - Get user's plannings
- `GET /api/plannings/public` - Get public plannings
- `GET /api/plannings/:id` - Get single planning
- `POST /api/plannings` - Create planning
- `PUT /api/plannings/:id` - Update planning
- `DELETE /api/plannings/:id` - Delete planning
- `POST /api/plannings/:id/duplicate` - Duplicate planning
- `POST /api/plannings/:id/like` - Like/unlike planning
- `POST /api/plannings/:id/comments` - Add comment

### Tasks
- `GET /api/tasks/planning/:planningId` - Get tasks
- `GET /api/tasks/planning/:planningId/date/:date` - Get tasks by date
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `POST /api/tasks/:id/toggle` - Toggle completion
- `DELETE /api/tasks/:id` - Delete task
- `PUT /api/tasks/reorder` - Reorder tasks

### Users
- `GET /api/users/:username` - Get user profile
- `POST /api/users/:userId/follow` - Follow/unfollow user
- `GET /api/users/:userId/followers` - Get followers
- `GET /api/users/:userId/following` - Get following
- `GET /api/users/:userId/achievements` - Get achievements
- `GET /api/users/me/notifications` - Get notifications

### AI
- `POST /api/ai/generate-planning` - Generate AI planning
- `GET /api/ai/motivation` - Get motivational message
- `POST /api/ai/analyze` - Analyze planning effectiveness

### Statistics
- `GET /api/stats/dashboard` - Get dashboard stats
- `GET /api/stats/by-category` - Get category breakdown
- `GET /api/stats/heatmap` - Get heatmap data
- `GET /api/stats/weekly-report` - Get weekly report
- `GET /api/stats/leaderboard` - Get leaderboard

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration
- Helmet.js security headers
- SQL injection protection (parameterized queries)

## 🎨 Design System

- **Primary Color**: Blue (#3b82f6)
- **Secondary Color**: Emerald (#10b981)
- **Dark Theme**: Slate tones
- **Icons**: Lucide Icons
- **CSS Framework**: Tailwind CSS
- **Animations**: Custom CSS animations

## 📱 Progressive Web App (PWA)

To be implemented:
- Service worker for offline mode
- manifest.json for installability
- Push notifications
- Cache strategies

## 🚧 Remaining Features to Implement

- [ ] Complete frontend pages (discover, stats, profile)
- [ ] Planning and task UI modules
- [ ] Chart.js integration for statistics
- [ ] Email service integration
- [ ] Password reset flow
- [ ] OAuth integration (Google, GitHub)
- [ ] PWA features (manifest, service worker)
- [ ] Export to PDF functionality
- [ ] Import from Google Calendar/Outlook
- [ ] Weekly challenges
- [ ] Pomodoro timer

## 🧪 Testing

```bash
# Run tests (to be implemented)
npm test
```

## 🚀 Deployment

### Backend
- Recommended: Railway, Render, or Heroku
- Ensure PostgreSQL database is provisioned
- Set environment variables on platform

### Frontend
- Recommended: Vercel, Netlify, or GitHub Pages
- Update API_BASE_URL in frontend/js/app.js

## 📄 License

MIT

## 👤 Author

Planning Platform Team

---

**Note**: This is a work in progress. The core backend infrastructure and authentication system are complete. Frontend pages and additional features are being actively developed.