Sk.turtleTracker = {};

Sk.turtleTracker.locations = [];

Sk.turtleTracker.reset = function () {
	Sk.turtleTracker.locations = [];
}

Sk.turtleTracker.addLocation = function (loc) {
	Sk.turtleTracker.locations.push(loc);
	
	if (Sk.formattedOutput) {
		Sk.formattedOutput.turtleLocation(loc);
	}
}