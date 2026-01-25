# Deployment Guide - Agro Career Platform

## Backend Deployment to Render (Docker)

### Step 1: Prepare Backend for Docker
Ensure your backend has a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Step 2: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up/login with GitHub account
3. Connect your GitHub repository

### Step 3: Create Web Service on Render
1. Click "New +" → "Web Service"
2. Connect your repository
3. Configure service:
   - **Name**: `agro-career-backend`
   - **Environment**: `Docker`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`

### Step 4: Configure Environment Variables
Add these environment variables in Render dashboard:
```
NODE_ENV=production
JWT_SECRET=your-jwt-secret
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
PORT=3000
```

### Step 5: Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy
3. Note the deployed URL (e.g., `https://agro-career-backend.onrender.com`)

## Frontend Deployment to Vercel (CI/CD)

### Step 1: Prepare Frontend
Create `vercel.json` in frontend directory:

```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Step 2: Update API Base URL
Update your frontend API configuration to use Render backend URL:

```typescript
// src/config/api.ts
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://agro-career-backend.onrender.com/api';
```

### Step 3: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub account
3. Install Vercel GitHub app

### Step 4: Deploy to Vercel
1. Click "New Project"
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### Step 5: Configure Environment Variables
Add in Vercel dashboard:
```
REACT_APP_API_URL=https://agro-career-backend.onrender.com/api
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Step 6: Enable Auto-Deploy
1. Go to Project Settings → Git
2. Ensure "Auto-deploy" is enabled for main branch
3. Every push to main will trigger automatic deployment

## GitHub CI/CD Pipeline (Optional Enhancement)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install and Build
        working-directory: ./frontend
        run: |
          npm ci
          npm run build
      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
```

## Post-Deployment Steps

### Step 1: Update CORS Settings
Update backend CORS to allow your Vercel domain:

```typescript
app.use(cors({
  origin: ['https://your-app.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

### Step 2: Test Deployment
1. Visit your Vercel URL
2. Test user registration/login
3. Test property creation and booking
4. Verify image uploads work

### Step 3: Custom Domain (Optional)
1. **Vercel**: Project Settings → Domains → Add custom domain
2. **Render**: Settings → Custom Domains → Add domain

## Monitoring & Maintenance

- **Render**: Monitor logs in dashboard
- **Vercel**: Check function logs and analytics
- **Supabase**: Monitor database performance
- Set up uptime monitoring (e.g., UptimeRobot)

## Troubleshooting

**Backend Issues:**
- Check Render logs for build/runtime errors
- Verify environment variables are set
- Ensure Dockerfile is in backend directory

**Frontend Issues:**
- Check Vercel function logs
- Verify API URL environment variable
- Test API endpoints directly

**CORS Errors:**
- Update backend CORS configuration
- Ensure frontend URL is whitelisted
