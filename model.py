import pymysql as mysqldb
from urllib.request import urlopen as uReq
from bs4 import BeautifulSoup as soup
import pymysql as MySQLdb


#create connection
db=mysqldb.connect("localhost","admin","root","books")
cursor = db.cursor()

def getList(query):
	query = "%" + query + "%"
	if query:
		sql = "select * from book_links where book_name like \"%s\";" % query
	else:
		sql = "select * from book_links where book_name like \"null\";"
	#execute the sql statement
	cursor.execute(sql)
	#after preparing the statment fetch all the tuples
	result = cursor.fetchall()
	#defined a list called links
	links = []
	num = 0
	#save elements in list with id , name and link
	for item in result:
		if links.__len__()-1 != num:
			links.append({})
		links[num]['id'] = item[0]
		links[num]['name'] = item[1]
		links[num]['link'] = item[2]
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