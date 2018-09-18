import pymysql as mysqldb

db=mysqldb.connect("localhost","admin","root","books")
cursor = db.cursor()

query = input("Enter your search item:")
query = "%" + query + "%"


if query:
	sql = "select * from book_links where book_name like \"%s\";" % query
else:
	sql = "select * from book_links where book_name like \"null\";"


print(sql)

print(cursor.execute(sql))

result = cursor.fetchall()

links = [{}]
num = 0
print("----------------------------------------------------------------")

for item in result:
	print(item)
	links.append({})
	links[num]['id'] = item[0]
	links[num]['name'] = item[1]
	links[num]['link'] = item[2]
	print(num)
	num += 1


print("----------------------------------------------------------------")
print(links)