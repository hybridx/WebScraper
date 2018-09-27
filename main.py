from flask import Flask,request,render_template
import json
import model
#--------------------------------------------------------------------------------------
app = Flask(__name__)
#--------------------------------------------------------------------------------------
@app.route('/')
def index():
	#print(request.method)
	# if request.method == 'POST':
	# 	search=request.form['search']
	# 	if search == "":
	# 		search = "++++++++++++++++++++++"
	# 	links=model.getList(search)
	# print(links)
	# itemsFound = links.__len__()
	return render_template("index.html")
#--------------------------------------------------------------------------------------
#for index ajax purpose
@app.route('/searchAJAX',methods=['POST'])
def process():
	search=request.form['search']
	if search == "":
		search = "++++++++++++++++++++++"
	links=model.getList(search)
	if links:
		return json.dumps(links)
	else:
		return json.dumps({'error':'True'})
#--------------------------------------------------------------------------------------

#admin page only
@app.route('/admin/')
def admin():
	return render_template("admin.html")

#--------------------------------------------------------------------------------------

#admin page ajax
@app.route('/adminAJAX',methods=['POST'])
def adminAJAX():
	if request.method == 'POST':
		link = request.form['addLink']
		if link == "":
			result = [{"status":"error","response":"Incorrect input"}]
			return json.dumps(result)
	if link.startswith("http"):		
		status,response = model.crawl(link)
		if status==200:
			result = [{"status":"OK","response":response}]
			return json.dumps(result)
	else:
		result = [{"status":"error","response":"Invalid link"}]
		return json.dumps(result)

#--------------------------------------------------------------------------------------

@app.errorhandler(404)
def page_not_found(e):
	return render_template('404.html'),404


#--------------------------------------------------------------------------------------

# @app.route('/name/<name>')
# def name(name):
# 	return 'Hey there %s ' % name
#--------------------------------------------------------------------------------------
# @app.route('/number/<int:num>')
# def number(num):
# 	num += 1
# 	return " %s " % num

#--------------------------------------------------------------------------------------
# @app.route('/testGetPost',methods=['GET','POST'])
# def testGetPost():
# 	if request.method == 'POST':
# 		return 'You are using POST method'
# 	else:
# 		return 'You are using GET method'

#--------------------------------------------------------------------------------------

if __name__ == '__main__':
	app.run(debug=True)

#--------------------------------------------------------------------------------------