import pymysql as mysqldb
from urllib.request import urlopen as uReq
from bs4 import BeautifulSoup as soup
import pymongo
import connections
#create connection
db=mysqldb.connect("localhost","admin","root","books")
cursor = db.cursor()
#----------------------------------------------------------------------------------
dbmongo = pymongo.MongoClient(username="admin",password="root",authSource="admin")
collection = dbmongo.links.links

def getList(query="default"):
	search_query = {'$regex': "", '$options': 'i'}
	search_query["$regex"] = query
	
	links = []
	num = 0
	
	for item in collection.find({'link': search_query}):
		#print(item["name"])
		if links.__len__()-1 != num:
			links.append({})
		links[num]['id'] = str(item["_id"])
		links[num]['name'] = item["name"]
		links[num]['link'] = item["link"]
		links[num]['type'] = item["type"]
		#links.append({}) extra append should be created
		num += 1

	return links

def crawl(url):
	errors = ''
	try:
		uClient = uReq(url)
		page_html = uClient.read()
		uClient.close()
		#print("Parsing URL...")
		page_soup = soup(page_html, "html.parser")
		links = page_soup.findAll("a",href=True)
	except:
		#print("This ended in an error ----> ",url)
		errors += url
		#return status,url
	num = 0
	for link in links:
		completeLink = url+link["href"]
		#print(link)
		sql = "insert into book_links(book_name,book_link) values(\"%s\",\"%s\")" % (str(link.text),str(completeLink))
		try:
			cursor.execute(sql)
			db.commit()
			num += 1
		except:
			errors += link.text
	status = 200
	return status,num


if __name__ == '__main__':
	print(crawl(input("Enter:")))
