import pymongo
import pymysql as mysqldb

db=mysqldb.connect("localhost","admin","root","books")
MySqlCursor = db.cursor()

MongoDB = pymongo.MongoClient(username="admin",password="root",authSource="admin")
TestdbStudentsCollection = MongoDB.testdb.students
TestdbUrlsCollection = MongoDB.testdb.urls