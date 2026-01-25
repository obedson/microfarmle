#!/bin/bash

# Agro Career Deployment Script

echo "🚀 Starting Agro Career Deployment..."

# 1. Build and test backend
echo "📦 Building backend..."
cd backend
npm install
npm run build
npm test

# 2. Build and test frontend  
echo "🎨 Building frontend..."
cd ../frontend
npm install
npm run build

# 3. Deploy to production
echo "🌐 Deploying to production..."

# Backend deployment (via git push to connected Render service)
echo "Deploying backend to Render..."
cd ..
git add .
git commit -m "Production deployment $(date)"
git push origin main

# Frontend deployment
echo "Deploying frontend to Vercel..."
cd frontend
vercel --prod

echo "✅ Deployment complete!"
echo "Backend: https://agro-career-backend.onrender.com"
echo "Frontend: Check Vercel dashboard for URL"
