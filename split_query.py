a = input("Please Enter:")
b = a.split(" ")
c = []
for item in b:
	if item != "":
		c.append(item)

print(c[0])