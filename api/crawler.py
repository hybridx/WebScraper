import json
import urllib.request
import urllib.parse
from urllib.error import URLError, HTTPError
from bs4 import BeautifulSoup
import psycopg2
import os
from http.server import BaseHTTPRequestHandler

def get_db_connection():
    """Get PostgreSQL connection using Vercel environment variables"""
    database_url = os.environ.get('POSTGRES_URL')
    if not database_url:
        raise Exception("POSTGRES_URL environment variable not found")
    return psycopg2.connect(database_url)

def classify_file_type(url):
    """Classify file type based on extension"""
    url_lower = url.lower()
    
    if url_lower.endswith(("mp4", "mkv", "3gp", "avi", "mov", "mpg", "mpeg", "wmv", "m4v")):
        return "video"
    elif url_lower.endswith(("mp3", "aif", "mid", "midi", "mpa", "ogg", "wav", "wma", "wpl")):
        return "audio"
    elif url_lower.endswith(("rar", "zip", "deb", "pkg", "tar.gz", ".z", "rpm", ".7z", "arj")):
        return "compressed"
    elif url_lower.endswith(("bin", "dmg", "iso", "toast", "vcd")):
        return "disk"
    elif url_lower.endswith(("exe", "apk", "bat", "com", "jar", ".py", ".wsf")):
        return "executable"
    elif url_lower.endswith(("ai", "bmp", "gif", "ico", "jpeg", "png", "jpg", "tif", "svg")):
        return "image"
    elif url_lower.endswith(("pdf", "txt", "doc", "rtf", "wpd", "docx", "odt", "wps", "wks")):
        return "text"
    else:
        return "other"

def crawl_directory_listing(url):
    """Crawl a directory listing page and extract file links"""
    try:
        user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.47 Safari/537.36'
        headers = {'User-Agent': user_agent}
        
        request = urllib.request.Request(url, headers=headers)
        response = urllib.request.urlopen(request, timeout=30)
        page_html = response.read()
        response.close()
        
        soup = BeautifulSoup(page_html, "html.parser")
        links = soup.find_all("a", href=True)
        
        extracted_links = []
        subdirectories = []
        
        for link in links:
            href = link["href"]
            
            # Skip parent directory links
            if href == "../" or href.startswith("/") or href.startswith("http"):
                continue
                
            complete_link = url.rstrip('/') + '/' + href
            
            if href.endswith("/"):
                # It's a subdirectory
                subdirectories.append(complete_link)
            else:
                # It's a file
                file_type = classify_file_type(complete_link)
                if file_type != "other":  # Only store media and document files
                    extracted_links.append({
                        "name": link.text or href,
                        "link": complete_link,
                        "type": file_type
                    })
        
        return extracted_links, subdirectories
        
    except Exception as e:
        print(f"Error crawling {url}: {str(e)}")
        return [], []

def store_links_in_db(links):
    """Store extracted links in PostgreSQL database"""
    if not links:
        return
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        for link in links:
            cursor.execute("""
                INSERT INTO links (name, link, type) 
                VALUES (%s, %s, %s)
                ON CONFLICT (link) DO NOTHING
            """, (link["name"], link["link"], link["type"]))
        
        conn.commit()
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Database error: {str(e)}")

def update_url_status(url, status, error_message=None):
    """Update the status of a crawled URL"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE crawled_urls 
            SET status = %s, crawled_at = CURRENT_TIMESTAMP, error_message = %s
            WHERE url = %s
        """, (status, error_message, url))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error updating URL status: {str(e)}")

def add_error_url(url, error_message):
    """Add error URL to database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO error_urls (url, error_message) 
            VALUES (%s, %s)
        """, (url, error_message))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error adding error URL: {str(e)}")

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            url = data.get('url')
            if not url:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "URL is required"}).encode())
                return
            
            # Crawl the URL
            links, subdirs = crawl_directory_listing(url)
            
            # Store links in database
            store_links_in_db(links)
            
            # Update URL status
            update_url_status(url, 'completed')
            
            # Optionally crawl subdirectories (limit depth to prevent infinite recursion)
            sub_links_count = 0
            for subdir in subdirs[:3]:  # Limit to 3 subdirectories
                try:
                    sub_links, _ = crawl_directory_listing(subdir)
                    store_links_in_db(sub_links)
                    sub_links_count += len(sub_links)
                except Exception as e:
                    add_error_url(subdir, str(e))
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                "success": True,
                "links_found": len(links),
                "subdirs_crawled": len(subdirs[:3]),
                "total_links": len(links) + sub_links_count,
                "message": f"Successfully crawled {url}"
            }
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            error_response = {
                "error": str(e),
                "success": False
            }
            
            self.wfile.write(json.dumps(error_response).encode())
            
            # Log error in database
            try:
                add_error_url(data.get('url', 'unknown'), str(e))
                update_url_status(data.get('url', 'unknown'), 'error', str(e))
            except:
                pass 