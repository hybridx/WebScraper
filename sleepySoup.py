from urllib2 import urlopen as uReq
from bs4 import BeautifulSoup as soup

#my_url = ['http://vampirediaries.wikia.com/wiki/Original_Vampire','http://vampirediaries.wikia.com/wiki/Hybrid','http://vampirediaries.wikia.com/wiki/Vampire']
my_url = []

print "Enter wikia URL to get information:"
while True:
	urls = raw_input()
	if urls == "exit":
		break
	else:
		my_url.append(urls)
		

#my_url[0] = 'http://vampirediaries.wikia.com/wiki/Hybrid'
#my_url[1] = 'http://vampirediaries.wikia.com/wiki/Vampire'

#opening a connection and geting the html contents
for url in my_url:
	uClient = uReq(url)
	page_html = uClient.read()
	uClient.close()
	page_soup = soup(page_html, "html.parser")
	containers = page_soup.findAll("div",{"class":"pi-item"})
	figures = page_soup.findAll("h2",{"class":"pi-item"})

	#for container,figure in zip(containers,figures):
	for container in containers:
		#print figure.text
		print container.text
		#print container
		print "\n"
		# print container.a
		# print "\n"
		# print container.li
		# print "\n"