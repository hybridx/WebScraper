from urllib.request import urlopen
from bs4 import BeautifulSoup as soup
import pymongo



#create connection
dbmongo = pymongo.MongoClient(username="admin",password="root",authSource="admin")
#------------------
LinksLinksCollection = dbmongo.links.links
LinksUrlCollection = dbmongo.links.urls
LinksErrorUrlCollection = dbmongo.links.errorUrl
#------------------
TestdbUrlsCollection = dbmongo.testdb.urls
TestdbStudentsCollection = dbmongo.testdb.students
#----------------------------------------------------------------------------------

def getList(query="default",linkType="all"):
	search_query = {'$regex': "", '$options': 'i'}
	search_query["$regex"] = query
	
	links = []
	num = 0
	
	if linkType == "all":
		for item in LinksLinksCollection.find({'link': search_query}).limit(10):
			#print(item["name"])
			if links.__len__()-1 != num:
				links.append({})
			links[num]['id'] = str(item["_id"])
			links[num]['name'] = item["name"]
			links[num]['link'] = item["link"]
			links[num]['type'] = item["type"]
			#links.append({}) extra append should be created
			num += 1
	#db.links.find({$and:[{"link":{$regex:"cold",$options:"i"}},{"link":{$regex:"skin",$options:"i"}}]})
	if linkType == "video":
		for item in LinksLinksCollection.find({"$and":[{"type":"video"},{'link': search_query}]}).limit(10):
			#print(item["name"])
			if links.__len__()-1 != num:
				links.append({})
			links[num]['id'] = str(item["_id"])
			links[num]['name'] = item["name"]
			links[num]['link'] = item["link"]
			links[num]['type'] = item["type"]
			#links.append({}) extra append should be created
			num += 1

	if linkType == "audio":
		for item in LinksLinksCollection.find({"$and":[{"type":"audio"},{'link': search_query}]}).limit(10):
			#print(item["name"])
			if links.__len__()-1 != num:
				links.append({})
			links[num]['id'] = str(item["_id"])
			links[num]['name'] = item["name"]
			links[num]['link'] = item["link"]
			links[num]['type'] = item["type"]
			#links.append({}) extra append should be created
			num += 1

	if linkType == "image":
		for item in LinksLinksCollection.find({"$and":[{"type":"image"},{'link': search_query}]}).limit(10):
			#print(item["name"])
			if links.__len__()-1 != num:
				links.append({})
			links[num]['id'] = str(item["_id"])
			links[num]['name'] = item["name"]
			links[num]['link'] = item["link"]
			links[num]['type'] = item["type"]
			#links.append({}) extra append should be created
			num += 1

	if linkType == "compressed":
		for item in LinksLinksCollection.find({"$and":[{"type":"compressed"},{'link': search_query}]}).limit(10):
			#print(item["name"])
			if links.__len__()-1 != num:
				links.append({})
			links[num]['id'] = str(item["_id"])
			links[num]['name'] = item["name"]
			links[num]['link'] = item["link"]
			links[num]['type'] = item["type"]
			#links.append({}) extra append should be created
			num += 1

	if linkType == "executable":
		for item in LinksLinksCollection.find({"$and":[{"type":"executable"},{'link': search_query}]}).limit(10):
			#print(item["name"])
			if links.__len__()-1 != num:
				links.append({})
			links[num]['id'] = str(item["_id"])
			links[num]['name'] = item["name"]
			links[num]['link'] = item["link"]
			links[num]['type'] = item["type"]
			#links.append({}) extra append should be created
			num += 1

	if linkType == "disk":
		for item in LinksLinksCollection.find({"$and":[{"type":"disk"},{'link': search_query}]}).limit(10):
			#print(item["name"])
			if links.__len__()-1 != num:
				links.append({})
			links[num]['id'] = str(item["_id"])
			links[num]['name'] = item["name"]
			links[num]['link'] = item["link"]
			links[num]['type'] = item["type"]
			#links.append({}) extra append should be created
			num += 1

	if linkType == "text":
		for item in LinksLinksCollection.find({"$and":[{"type":"text"},{'link': search_query}]}).limit(10):
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

def Crawl(url):
	try:
		uClient = urlopen(url)
		page_html = uClient.read()
		uClient.close()
		print("Parsing URL..."+ url)
		page_soup = soup(page_html, "html.parser")
		links = page_soup.findAll("a",href=True)
	except:
		LinksErrorUrlCollection.insert({"ErrorUrl":url})
		#print("ERROR:"+url)
	try:
		dirLink = []
		num = 0
		for link in links:
			completeLink = url+link["href"]

			if link["href"].endswith("/") and not link["href"].endswith("../") and not link["href"].startswith("/"):
				#call the crawl function again
				Crawl(str(url+link["href"]))
			else:
				if dirLink.__len__()-1 != num:
					dirLink.append({})
				fullLink=str(url+link["href"])

				if fullLink.lower().endswith(("mp4","mkv","3gp","avi","mov","mpg","mpeg","wmv","m4v")):
					dirLink[num]["name"]=link.text
					dirLink[num]["link"]=fullLink
					dirLink[num]["type"]="video"
					num += 1
				elif fullLink.lower().endswith(("mp3","aif","mid","midi","mpa","ogg","wav","wma","wpl")):
					dirLink[num]["name"]=link.text
					dirLink[num]["link"]=fullLink
					dirLink[num]["type"]="audio"
					num += 1
				elif fullLink.lower().endswith(("rar","zip","deb","pkg","tar.gz",".z","rpm",".7z","arj")):
					dirLink[num]["name"]=link.text
					dirLink[num]["link"]=fullLink
					dirLink[num]["type"]="compressed"
					num += 1
				elif fullLink.lower().endswith(("bin","dmg","iso","toast","vcd")):
					dirLink[num]["name"]=link.text
					dirLink[num]["link"]=fullLink
					dirLink[num]["type"]="disk"
					num += 1
				elif fullLink.lower().endswith(("exe","apk","bat","com","jar",".py",".wsf")):
					dirLink[num]["name"]=link.text
					dirLink[num]["link"]=fullLink
					dirLink[num]["type"]="executable"
					num += 1
				elif fullLink.lower().endswith(("ai","bmp","gif","ico","jpeg","png","jpg","tif","svg")):
					dirLink[num]["name"]=link.text
					dirLink[num]["link"]=fullLink
					dirLink[num]["type"]="image"
					num += 1
				elif fullLink.lower().endswith(("pdf","txt","doc","rtf","wpd","docx","odt","wps","wks")):
					dirLink[num]["name"]=link.text
					dirLink[num]["link"]=fullLink
					dirLink[num]["type"]="text"
					num += 1
				else:
					pass	

		if dirLink != [{}]:
			LinksLinksCollection.insert_many(dirLink)
			LinksUrlCollection.insert({"url":url})
			return dirLink
	except:
		LinksErrorUrlCollection.insert({"ErrorUrl":url})
		#print("ERROR in second try:"+url)

if __name__ == '__main__':
	print(Crawl(input("Enter:")))
