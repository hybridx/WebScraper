from urllib.request import urlopen as uReq
from bs4 import BeautifulSoup as soup
import pymysql as MySQLdb


#url = 'https://theswissbay.ch/pdf/Gentoomen%20Library/Programming/Python/'

db = MySQLdb.connect("localhost","admin","root","books")
cursor = db.cursor()

my_url = []

print ("Enter index URL to get information or exit to Exit:")
while True:
	urls = input()
	if urls == "exit" or urls == "EXIT":
		break
	else:
		my_url.append(urls)

print("Getting Data...and Crawling the page magically.....")

for url in my_url:
	try:
		uClient = uReq(url)
		page_html = uClient.read()
		uClient.close()
		print("Parsing URL...")
		page_soup = soup(page_html, "html.parser")
		links = page_soup.findAll("a",href=True)
	except:
		print("This ended in an error ----> ",url)

	for link in links:
		completeLink = url+link["href"]
		print(link)
		sql = "insert into book_links(book_name,book_link) values(\"%s\",\"%s\")" % (str(link.text),str(completeLink)) 
		try:
			cursor.execute(sql)
			db.commit()
		except:
			print("This ended in an error ----> ",link.text , " ------>",completeLink)
db.close()
print("Thank you....")