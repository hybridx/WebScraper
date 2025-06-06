# WebScraper - Next.js Directory Listing Crawler

A modern web application that crawls directory listing pages ("index of /" pages) to extract and index media files, documents, and other downloadable content. Built with Next.js for easy deployment on Vercel.

## 🚀 Features

- **Modern Web Interface**: Beautiful, responsive UI built with Next.js and Tailwind CSS
- **Smart File Detection**: Automatically categorizes files by type (video, audio, images, documents, etc.)
- **Advanced Search**: Search through crawled files with filtering by file type
- **Bulk Download**: Select multiple files and generate download links in various formats
- **Admin Panel**: Simple password-protected interface to add new URLs for crawling
- **SQLite Database**: Lightweight, serverless database that works perfectly with Vercel
- **Python Crawler**: Powerful web scraper using BeautifulSoup for extracting file links
- **Real-time Stats**: Dashboard showing crawling progress and database statistics

## 🎯 Use Cases

- Index and search through large file repositories
- Create downloadable file databases from directory listings
- Batch download multiple files using wget, aria2, or other download managers
- Monitor and organize scattered file collections across different servers

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes with TypeScript
- **Database**: SQLite with better-sqlite3
- **Crawler**: Python serverless function using BeautifulSoup
- **Deployment**: Optimized for Vercel with zero configuration

## 📦 Installation

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/webscraper-nextjs)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/webscraper-nextjs.git
   cd webscraper-nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🌐 Deployment on Vercel

### One-Click Deployment

1. Fork this repository to your GitHub account
2. Visit [vercel.com](https://vercel.com) and import your forked repository
3. Vercel will automatically detect the Next.js configuration
4. Deploy! Your app will be live in minutes

### Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**
   ```bash
   vercel
   ```

3. **Follow the prompts** to configure your deployment

### Environment Variables

The application works out of the box without any environment variables. The admin password is set to `admin123` by default. To change it, you can modify the password check in `app/api/admin/add-url/route.ts`.

## 📖 Usage Guide

### 1. Admin Panel
- Navigate to `/admin`
- Enter the admin password (default: `admin123`)
- Add URLs of directory listing pages to crawl
- Monitor crawling progress through the stats dashboard

### 2. Search Files
- Use the main search page to find files
- Filter by file type (video, audio, image, etc.)
- View detailed file information and direct download links

### 3. Bulk Download
- Visit the `/download` page
- Select multiple files you want to download
- Choose your preferred download format:
  - **TXT**: Simple list of URLs
  - **wget script**: Ready-to-run bash script
  - **aria2**: Input file for aria2 download manager

### 4. File Types Supported

- **Video**: mp4, mkv, avi, mov, mpg, mpeg, wmv, m4v, 3gp
- **Audio**: mp3, wav, ogg, m4a, aac, flac, wma
- **Images**: jpg, png, gif, bmp, svg, ico, tiff
- **Documents**: pdf, doc, docx, txt, rtf, odt
- **Compressed**: zip, rar, tar.gz, 7z, deb, rpm
- **Executables**: exe, apk, deb, dmg, jar
- **Disk Images**: iso, img, dmg, toast

## 🔧 Configuration

### Database

The application uses SQLite stored in `webscraper.db`. The database is automatically created and initialized on first run.

### Crawler Settings

The Python crawler is configured to:
- Respect robots.txt (configurable)
- Use proper User-Agent headers
- Handle timeouts and errors gracefully
- Limit subdirectory crawling depth to prevent infinite loops

### Search Configuration

- Default search limit: 50 results
- Bulk download limit: 1000 files
- Case-insensitive search
- Partial matching on file names and URLs

## 🛠️ Development

### Project Structure

```
webscraper-nextjs/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin panel pages
│   ├── download/          # Bulk download page
│   ├── api/               # API routes
│   │   ├── search/        # Search functionality
│   │   ├── stats/         # Statistics API
│   │   └── admin/         # Admin API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (search)
├── api/                   # Python serverless functions
│   └── crawler.py         # Web crawler
├── lib/                   # Utilities and database
│   └── database.ts        # SQLite database manager
├── public/                # Static assets
├── package.json           # Node.js dependencies
├── requirements.txt       # Python dependencies
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── next.config.js         # Next.js configuration
```

### Adding New File Types

To add support for new file types:

1. Update the `classify_file_type` function in `api/crawler.py`
2. Add the new type to the search filters in the frontend components
3. Optionally add new icons in the `getFileIcon` functions

### Customizing the UI

The UI is built with Tailwind CSS. Key files to modify:
- `app/globals.css` - Global styles and CSS variables
- `app/layout.tsx` - Navigation and overall layout
- Individual page components for specific functionality

## 🔐 Security Considerations

- **Admin Authentication**: Currently uses a simple password. For production, implement proper authentication
- **Input Validation**: All URLs are validated before crawling
- **Rate Limiting**: Consider implementing rate limiting for the crawler
- **CORS**: API routes are configured to handle CORS appropriately

## 🚨 Limitations

- **Vercel Function Timeout**: Serverless functions have execution time limits
- **Database Size**: SQLite has size limitations on some platforms
- **Concurrent Crawling**: Limited by serverless function concurrency

## 🐛 Troubleshooting

### Common Issues

1. **Database not found**
   - Ensure write permissions in the deployment environment
   - Check if the database file is being created properly

2. **Crawler timeout**
   - Some directory listings may take longer to crawl
   - Consider implementing queue-based processing for large sites

3. **Search not working**
   - Verify the database has been initialized
   - Check if there are any crawled URLs in the database

### Debug Mode

Enable debug logging by setting the `DEBUG` environment variable:
```bash
DEBUG=1 npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Web scraping with [BeautifulSoup](https://www.crummy.com/software/BeautifulSoup/)
- Database with [better-sqlite3](https://github.com/JoshuaWise/better-sqlite3)

## 📞 Support

For support, please open an issue on GitHub or contact the maintainers.

---

**Happy Crawling! 🕷️**
