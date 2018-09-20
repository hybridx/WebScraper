import pymysql as mysqldb


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


if __name__ == '__main__':
	print(getList(input("Enter:")))