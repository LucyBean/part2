Sk.turtleTasks = [
	{},
	{
		promptText:"Move the turtle forwards 20",
		tasks: [[0,[50]], [2,[45]], [0,[30]]],
		initCode:"import turtle\nt = turtle.Turtle()\nt.shape(\"circle\")\nt.fillcolor(150,250,200)\n\nt.stamp()\nt.forward(100)\nt.stamp()"
	},
	{},
	{}
]

Sk.turtleTasks.taskNames = {
	0: function (args) { return "Go forward " + args[0] + " units."},
	1: function (args) { return "Go left " + args[0] + " degrees."},
	2: function (args) { return "Go right " + args[0] + " degrees."}
}

Sk.turtleTasks.validateTask = {
	// Turtle moved forwards by x units
	0: function (args, prev, now) {
		var x = args[0];
	}
}