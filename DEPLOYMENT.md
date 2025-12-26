# Deployment Guide

## Prerequisites
- Node.js v16+ installed
- PostgreSQL database (local or cloud)
- OpenAI API key (for AI features)
- Email service API key (optional)

## Environment Setup

1. **Database Setup**
   - Create a PostgreSQL database
   - Note the connection string

2. **Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your values:
   ```env
   DATABASE_URL=postgresql://username:password@host:port/database
   JWT_SECRET=your-random-secret-key-at-least-32-chars
   OPENAI_API_KEY=sk-your-openai-api-key
   PORT=3001
   FRONTEND_URL=https://your-frontend-domain.com
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Initialize Database**
   ```bash
   npm run init-db
   ```

## Development

```bash
npm run dev
```

Backend will run on http://localhost:3001

For frontend, serve the `frontend/` directory with any static server or open directly in browser.

## Production Deployment

### Option 1: Railway (Recommended for Backend)

1. **Create Railway Account** at railway.app

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Add PostgreSQL**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically set DATABASE_URL

4. **Configure Environment Variables**
   - Go to your service → Variables
   - Add all variables from .env.example

5. **Deploy**
   - Push to main branch triggers deployment
   - Get your backend URL from Railway dashboard

### Option 2: Render

1. **Create Render Account** at render.com

2. **Create PostgreSQL Database**
   - New → PostgreSQL
   - Note the Internal Database URL

3. **Create Web Service**
   - New → Web Service
   - Connect repository
   - Build Command: `npm install`
   - Start Command: `npm start`

4. **Add Environment Variables**
   - Add all variables from .env.example
   - Use the Internal Database URL

### Frontend Deployment

#### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel
   ```

3. **Configure**
   - Update `frontend/js/app.js` API_BASE_URL to your backend URL
   - Set CORS in backend to allow your frontend domain

#### Option 2: Netlify

1. **Create netlify.toml** in frontend/
   ```toml
   [build]
     publish = "."
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy**
   - Drag & drop `frontend/` folder to Netlify
   - Or connect GitHub repository

#### Option 3: GitHub Pages

1. **Update package.json**
   ```json
   {
     "homepage": "https://username.github.io/repository-name"
   }
   ```

2. **Deploy**
   ```bash
   cd frontend
   git subtree push --prefix frontend origin gh-pages
   ```

## Post-Deployment Checklist

- [ ] Update FRONTEND_URL in backend .env
- [ ] Update API_BASE_URL in frontend/js/app.js
- [ ] Configure CORS to allow frontend domain
- [ ] Test user registration and login
- [ ] Test planning creation
- [ ] Test AI features (requires OpenAI API key)
- [ ] Verify database connections
- [ ] Check all API endpoints
- [ ] Test on mobile devices
- [ ] Set up monitoring (optional)

## Database Migrations

When updating database schema:

1. **Backup Current Database**
   ```bash
   pg_dump $DATABASE_URL > backup.sql
   ```

2. **Create Migration Script**
   - Add new migration in `backend/scripts/`
   - Example: `migration_001_add_column.js`

3. **Run Migration**
   ```bash
   node backend/scripts/migration_001_add_column.js
   ```

## Monitoring and Logs

### Backend Logs
- Railway: View in dashboard → Deployments → Logs
- Render: View in dashboard → Logs tab

### Frontend Monitoring
- Use browser DevTools Network tab
- Check for API errors in Console

## Troubleshooting

### Database Connection Fails
- Verify DATABASE_URL format
- Check database is running
- Verify network access (firewall, security groups)

### CORS Errors
- Verify FRONTEND_URL in backend .env
- Check cors configuration in backend/server.js
- Ensure backend allows your frontend domain

### API Returns 401
- Check JWT token is being sent
- Verify JWT_SECRET matches between deployments
- Check token expiration (default 7 days)

### AI Features Not Working
- Verify OPENAI_API_KEY is set
- Check OpenAI account has credits
- Review API rate limits

## Scaling Considerations

### Database
- Add connection pooling
- Enable read replicas for high traffic
- Implement caching layer (Redis)

### Backend
- Enable horizontal scaling (multiple instances)
- Add load balancer
- Implement rate limiting per user

### Frontend
- Enable CDN for assets
- Implement service worker for caching
- Lazy load components

## Security Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Use HTTPS for all connections
- [ ] Enable rate limiting
- [ ] Validate all user inputs
- [ ] Keep dependencies updated
- [ ] Regular security audits
- [ ] Monitor for suspicious activity
- [ ] Backup database regularly

## Support

For issues or questions:
- Check documentation in README.md
- Review API endpoint documentation
- Check server logs
- Verify environment variables
- Test with API tools (Postman, Insomnia)

## Performance Optimization

1. **Database Indexes** - Already implemented in schema
2. **API Response Caching** - Consider Redis
3. **Image Optimization** - Use CDN
4. **Code Minification** - Use build tools
5. **Lazy Loading** - Implement in frontend

Good luck with your deployment! 🚀
