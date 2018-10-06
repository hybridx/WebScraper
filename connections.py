import pymysql as mysqldb
import pymongo


db=mysqldb.connect("localhost","admin","root","books")
cursor = db.cursor()