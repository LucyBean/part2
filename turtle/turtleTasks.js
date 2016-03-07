Sk.turtleTasks = [
	{},
	{
		promptText:"Here is a skeleton turtle program.",
		initCode:"import turtle\n\
t = turtle.Turtle()\n\
"
	},
	{
		promptText:"Here is a sample turtle program.",
		initCode:"import turtle\n\
t = turtle.Turtle()\n\
t.shape(\"triangle\")\n\
t.fillcolor(150,250,200)\n\
\n\
t.penup()\n\
t.setpos(-200,-100)\n\
t.pendown()\n\
\n\
nt = 5\n\
anglet = 360 / nt\n\
\n\
for i in range(nt):\n\
    t.forward(100)\n\
    t.left(anglet)\n\
    t.stamp()\n\
    \n\
s = turtle.Turtle()\n\
s.shape(\"circle\")\n\
s.fillcolor(200,150,250)\n\
\n\
s.penup()\n\
s.setpos(150,100)\n\
s.setheading(180)\n\
s.pendown()\n\
\n\
ns = 8\n\
angles = 360 / ns\n\
\n\
for i in range(ns):\n\
    s.backward(50)\n\
    s.right(angles)\n\
    s.stamp()\n\
    \n\
r = turtle.Turtle()\n\
r.shape(\"square\")\n\
r.pencolor(255,100,100)\n\
\n\
r.circle(50)"
	},
	{}
]