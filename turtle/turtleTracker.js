Sk.turtleTracker = {};

Sk.turtleTracker.tracks = [];

Sk.turtleTracker.reset = function () {
	Sk.turtleTracker.tracks = [];
}

Sk.turtleTracker.addTrack = function (turtle) {
	Sk.turtleTracker.tracks.push(turtle);
	console.log(turtle);
	
	if (Sk.formattedOutput) {
		var loc = {x:Math.round(turtle.x), y:Math.round(turtle.y)};
		Sk.formattedOutput.turtleLocation(loc);
	}
}