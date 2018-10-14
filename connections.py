import pymongo
import pymysql as mysqldb

db=mysqldb.connect("localhost","admin","root","books")
cursor = db.cursor()
