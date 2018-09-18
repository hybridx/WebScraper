from flask import Flask,request,render_template
import json
import model

app = Flask(__name__)

@app.route('/',methods=['POST','GET'])
@app.route('/<search>',methods=['POST','GET'])
def index(search=None,links=""):
	#print(request.method)
	if request.method == 'POST':
		search=request.form['search']
		if search == "":
			search = "++++++++++++++++++++++"
		links=model.getList(search)
	print(links)
	# items=[
	# 	{
	# 	'id':1,
	# 	'name':'Learn Flask',
	# 	'link':'http://localhost:5000/flask',
	# 	},
	# 	{
	# 	'id':2,
	# 	'name':'Learn Python',
	# 	'link':'http://localhost:5000/python',
	# 	}
	# ]

	itemsFound = links.__len__()
	return render_template("index.html",items=links,itemsFound=itemsFound)


@app.route('/process',methods=['POST'])
def process():
	search=request.form
	return json.dumps(search)









# @app.route('/name/<name>')
# def name(name):
# 	return 'Hey there %s ' % name


# @app.route('/number/<int:num>')
# def number(num):
# 	num += 1
# 	return " %s " % num


# @app.route('/testGetPost',methods=['GET','POST'])
# def testGetPost():
# 	if request.method == 'POST':
# 		return 'You are using POST method'
# 	else:
# 		return 'You are using GET method'



if __name__ == '__main__':
	app.run(debug=True)