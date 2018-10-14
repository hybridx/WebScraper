import pymongo
import pymysql as mysqldb

dbmongo = pymongo.MongoClient(username="admin",password="root",authSource="admin")
collection = dbmongo.links.links

#db.users.find({'name': {'$regex': 'sometext', '$options': 'i'}})

def query(text="default"):
	search_query = {'$regex': "", '$options': 'i'}
	search_query["$regex"] = text
	#db.links.find({$and:[{"link":{$regex:"cold",$options:"i"}},{"link":{$regex:"skin",$options:"i"}}]})
	links = []
	num = 0
	
	for item in collection.find({'name': search_query}):
		#print(item["name"])
		if links.__len__()-1 != num:
			links.append({})
		links[num]['id'] = item["_id"]
		links[num]['name'] = item["name"]
		links[num]['link'] = item["link"]
		links[num]['type'] = item["type"]
		#links.append({}) extra append should be created
		num += 1
	
	for link in links:
		print(link)

def main():
	dbmysql = mysqldb.connect("localhost","admin","root","books")
	cursor = dbmysql.cursor()

	f = open("num","r")
	num = int(f.read())
	f.close()


	sql='DELETE n1 FROM book_links n1, book_links n2 WHERE n1.id > n2.id AND n1.book_link = n2.book_link;'
	cursor.execute(sql)

	sql = "select * from book_links where id > %d;" % num
	print(sql)
	cursor.execute(sql)
	result = cursor.fetchall()

	links = []
	num = 0
	#save elements in list with id , name and link
	for item in result:
		if links.__len__()-1 != num:
			links.append({})
		#links[num]['id'] = item[0]
		links[num]['name'] = item[1]
		links[num]['link'] = item[2]
		if links[num]["link"].lower().endswith(("mp4","mkv","3gp","avi","mov","mpg","mpeg","wmv","m4v")):
			links[num]["type"] = "video"
		elif links[num]["link"].lower().endswith(("mp3","aif","mid","midi","mpa","ogg","wav","wma","wpl")):
			links[num]["type"] = "audio"
		elif links[num]["link"].lower().endswith(("rar","zip","deb","pkg","tar.gz",".z","rpm",".7z","arj")):
			links[num]["type"] = "compressed"
		elif links[num]["link"].lower().endswith(("bin","dmg","iso","toast","vcd")):
			links[num]["type"] = "disk"
		elif links[num]["link"].lower().endswith(("exe","apk","bat","com","jar",".py",".wsf")):
			links[num]["type"] = "executeable"
		elif links[num]["link"].lower().endswith(("ai","bmp","gif","ico","jpeg","png","jpg","tif","svg")):
			links[num]["type"] = "image"
		elif links[num]["link"].lower().endswith(("pdf","txt","doc","rtf","wpd","docx","odt","wps","wks")):
			links[num]["type"] = "text"
		else:
			links[num]["type"] = "others"
		num += 1
		#links.append({}) extra append should be created


	# for item in links:
	# 	print(item)

	sql='SELECT * FROM book_links ORDER BY id DESC LIMIT 1;'
	cursor.execute(sql)
	result = cursor.fetchall()
	f = open("num","w")
	f.write(str(result[0][0]))
	f.close()


	collection.insert_many(links)









#print(collection , "\n")

# for item in collection.find():
# 	print(item)

# new_documents = [
#   {
#     "name": "Sun Bakery Trattoria",
#     "stars": 4,
#     "categories": ["Pizza","Pasta","Italian","Coffee","Sandwiches"]
#   }, {
#     "name": "Blue Bagels Grill",
#     "stars": 3,
#     "categories": ["Bagels","Cookies","Sandwiches"]
#   }, {
#     "name": "Hot Bakery Cafe",
#     "stars": 4,
#     "categories": ["Bakery","Cafe","Coffee","Dessert"]
#   }, {
#     "name": "XYZ Coffee Bar",
#     "stars": 5,
#     "categories": ["Coffee","Cafe","Bakery","Chocolates"]
#   }, {
#     "name": "456 Cookies Shop",
#     "stars": 4,
#     "categories": ["Bakery","Cookies","Cake","Coffee"]
#   }
# ]

# query = "%" + query + "%"
# if query:
# 	sql = "select * from book_links where book_link like \"%s\";" % query
# else:
# 	sql = "select * from book_links where book_link like \"null\";"
# #execute the sql statement
# cursor.execute(sql)
# #after preparing the statment fetch all the tuples
# result = cursor.fetchall()

# print(collection.insert_many(new_documents))	


# for item in collection.find({"stars":4}):
# 	print(item)

# #collection.update({item["stars":4]},{"tag":"good"})

# query = {"stars":4}
# values = {"$set":{"tags":["movie","mp4"]}}

# collection.update_many(query,values)


# for item in collection.find({"tags":"movie"}):
# 	print(item)





if __name__ == '__main__':
	main()
	#query(input("Please enter:"))