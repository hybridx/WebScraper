# WebScraper - Next.js Edition.

A modern, full-featured web scraper built with Next.js and Supabase. Crawl directory listings, classify files, and search through media collections with a beautiful UI.

## 🚀 Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hybridx/WebScraper)

## ✨ Features

- **🔍 Search Interface**: Advanced search with file type filtering
- **📖 Browse Page**: Paginated file viewer (10/20/50 per page)
- **📥 Download Manager**: Bulk downloads in TXT, wget, and aria2 formats
- **⚙️ Admin Panel**: URL management and crawler controls
- **🤖 Smart Crawler**: Enhanced Node.js crawler with JSDOM + regex fallback
- **🎨 Modern UI**: Beautiful, responsive design with Tailwind CSS
- **☁️ Cloud Database**: Powered by Supabase PostgreSQL

## 📊 File Type Support

Automatically classifies and searches:
- 🎥 **Video**: mp4, mkv, avi, mov, mpg, mpeg, wmv, m4v
- 🎵 **Audio**: mp3, wav, ogg, wma, aif, mid, midi, mpa, wpl
- 🗜️ **Compressed**: zip, rar, 7z, tar.gz, deb, pkg, arj
- 💿 **Disk Images**: iso, dmg, bin, toast, vcd
- 🖼️ **Images**: jpg, png, gif, bmp, svg, ico, tif
- 📄 **Documents**: pdf, txt, doc, docx, rtf, wpd, odt
- ⚙️ **Executables**: exe, apk, bat, com, jar, py, wsf

## 🛠️ Setup Instructions

### 1. Clone & Deploy

```bash
git clone https://github.com/hybridx/WebScraper.git
cd WebScraper
npm install
```

### 2. Set Up Supabase Database

1. **Create Supabase Project**: Go to [supabase.com](https://supabase.com/dashboard)
2. **Get Credentials**:
   - Project URL: `https://[project-id].supabase.co`
   - Anon Key: `eyJ...` (from Settings → API)

### 3. Configure Environment Variables

In your deployment platform (Vercel/Netlify/etc.), add:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Initialize Database

1. Go to your Supabase project → **SQL Editor**
2. Copy and paste the content from `supabase-schema.sql`
3. Click **Run** to create all tables and indexes

### 5. Deploy & Test

The application will auto-deploy when you push to git. Check the admin panel at `/admin` for system status.

## 🔧 Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev

# Open http://localhost:3000
```

## 📱 Usage

### Admin Panel (`/admin`)
- **Password**: `admin123` (change in API routes)
- **Add URLs**: Submit directory listing URLs to crawl
- **Monitor Status**: Real-time system health and database status
- **Manage URLs**: View, delete, and track crawled URLs

### Search (`/`)
- **Smart Search**: Find files by name or URL
- **Type Filtering**: Filter by media type (video, audio, etc.)
- **Real-time Results**: Instant search with pagination

### Browse (`/browse`)
- **Paginated View**: 10, 20, or 50 files per page
- **Bulk Operations**: Select multiple files for download
- **Filter by Type**: Click stats cards to filter results

### Download (`/download`)
- **Multiple Formats**: TXT, wget script, or aria2 download files
- **Bulk Downloads**: Generate download files for all or filtered results

## 🚀 Auto-Deployment Setup

### Vercel (Recommended)

1. **Connect Repository**: Import your GitHub repository to Vercel
2. **Configure Environment Variables**: Add `SUPABASE_URL` and `SUPABASE_ANON_KEY`
3. **Auto-Deploy**: Every git push to `master`/`main` automatically deploys

### Manual Deploy Commands

```bash
# Deploy to production
npx vercel --prod

# View deployment logs
npx vercel logs

# Check environment variables
npx vercel env ls
```

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with responsive design
- **Database**: Supabase PostgreSQL with Row Level Security
- **Crawler**: Node.js with JSDOM and regex fallback
- **Deployment**: Vercel with git-based auto-deployment
- **File Classification**: 27+ supported file types

## 🔐 Security

- **Environment Variables**: All sensitive data via environment variables
- **Password Protection**: Admin panel protected with configurable password
- **Database Security**: Supabase RLS policies (customizable)
- **Input Validation**: URL validation and SQL injection prevention

## 🐛 Troubleshooting

### Common Issues

1. **500 Errors**: Check environment variables in admin panel health status
2. **Database Connection**: Ensure Supabase URL and key are correct
3. **Missing Tables**: Run the SQL schema in Supabase SQL Editor
4. **Crawler Not Working**: Check admin panel for detailed error messages

### Health Check

Visit `/api/health` to see detailed system status including:
- Environment variable configuration
- Database connection status
- Deployment information

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database by [Supabase](https://supabase.com/)
- UI components with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide React](https://lucide.dev/)

---

**Ready to scrape the web?** 🕸️ Deploy now and start discovering media files!
