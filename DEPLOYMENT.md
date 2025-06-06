# Deployment Guide

This guide will help you deploy the WebScraper application to Vercel successfully.

## 🚀 Quick Deployment Steps

### 1. Prepare Your Repository

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: WebScraper Next.js application"
   ```

2. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/your-username/webscraper-nextjs.git
   git branch -M main
   git push -u origin main
   ```

### 2. Deploy to Vercel

#### Option A: One-Click Deploy
1. Visit [vercel.com](https://vercel.com)
2. Sign up/login with your GitHub account
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js and configure everything
6. Click "Deploy"

#### Option B: Vercel CLI
1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Follow the prompts**:
   - Set up and deploy? Y
   - Which scope? (select your account)
   - Link to existing project? N
   - Project name: webscraper-nextjs
   - Directory: ./
   - Want to override settings? N

### 3. Verify Deployment

After deployment, you should have:
- ✅ Main app accessible at your Vercel URL
- ✅ Admin panel at `/admin`
- ✅ Download page at `/download`
- ✅ API endpoints working
- ✅ Database initialized automatically

## 🔧 Configuration

### Environment Variables (Optional)

While the app works without environment variables, you can add these for production:

1. **In Vercel Dashboard**:
   - Go to your project → Settings → Environment Variables

2. **Add variables**:
   ```
   ADMIN_PASSWORD=your-secure-password
   DATABASE_URL=file:./webscraper.db
   ```

### Custom Domain (Optional)

1. In Vercel Dashboard: Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## 🧪 Testing Your Deployment

### 1. Test the Search Page
- Visit your deployed URL
- The main page should load with search functionality
- Stats should show zeros (empty database initially)

### 2. Test Admin Panel
- Go to `/admin`
- Login with password: `admin123` (or your custom password)
- Try adding a test URL like: `https://www.orion.ox.ac.uk/~vgg/data/pets/`

### 3. Test Crawler
- After adding a URL, the crawler should automatically process it
- Check back after a few minutes to see if files appear in search

### 4. Test Download Page
- Visit `/download`
- Should show any crawled files
- Test bulk download functionality

## 🐛 Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Check for TypeScript errors
   npm run build
   
   # Install missing dependencies
   npm install
   ```

2. **Python Function Fails**
   - Ensure `requirements.txt` is in root directory
   - Check function logs in Vercel dashboard

3. **Database Issues**
   - SQLite is automatically created on first run
   - Check function logs for database errors

4. **CORS Issues**
   - API routes should handle CORS automatically
   - If issues persist, check browser dev tools

### Debugging

1. **Check Vercel Function Logs**:
   - Vercel Dashboard → Your Project → Functions tab
   - Click on any function to see logs

2. **Local Development**:
   ```bash
   npm run dev
   # Test everything locally first
   ```

3. **Check Network Tab**:
   - Open browser dev tools
   - Check API calls in Network tab

## 📈 Scaling Considerations

### For Large Datasets

1. **Database Limits**:
   - SQLite works well for small to medium datasets
   - Consider upgrading to PostgreSQL for larger datasets

2. **Function Timeouts**:
   - Vercel functions have time limits
   - Implement queue-based processing for large crawls

3. **Rate Limiting**:
   - Add rate limiting for production use
   - Implement proper error handling

### Performance Optimization

1. **Caching**:
   - Implement API response caching
   - Use Vercel's edge caching features

2. **Database Indexing**:
   - Indexes are already created for search performance
   - Monitor query performance in production

## 🔒 Security Hardening

### For Production Use

1. **Change Default Password**:
   ```typescript
   // In app/api/admin/add-url/route.ts
   if (password !== process.env.ADMIN_PASSWORD || 'your-secure-password') {
   ```

2. **Implement Proper Authentication**:
   - Consider using NextAuth.js
   - Add session management

3. **Rate Limiting**:
   - Implement API rate limiting
   - Add CAPTCHA for admin access

4. **Input Validation**:
   - Validate all URLs before crawling
   - Sanitize search inputs

## 🚀 Next Steps

After successful deployment:

1. **Add Your First URLs**: Start with a few test directory listing URLs
2. **Monitor Performance**: Check Vercel analytics and function logs
3. **Customize UI**: Modify colors, branding, and layout as needed
4. **Scale Gradually**: Start with small datasets and scale up

## 📞 Support

If you encounter issues:

1. Check this guide and the main README
2. Review Vercel documentation
3. Open an issue on GitHub
4. Check community forums

---

**Congratulations on your deployment! 🎉** 