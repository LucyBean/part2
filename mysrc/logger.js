Logger = {};

Logger.setName = function (name) {
	Logger.name = name;
	Logger.savedLog = "";
}

Logger.log = function (event, msg, text) {
	console.log("Logging " + event);
	var d = new Date();
	Logger.savedLog += "user:" + Logger.name + ",";
	Logger.savedLog += "time:" + d.getTime() + ",";
	if (event) Logger.savedLog += "event:" + event + ",";
	if (msg) Logger.savedLog += "msg:" + msg + ",";
	if (text) Logger.savedLog += "text:" + escape(text) + ",";
	Logger.savedLog += ";\r\n";
}

Logger.save = function () {
	var d = new Date();
	var saveName = Logger.name + "-" + d.getTime();
	console.log("Saving log " + saveName);
	var blob = new Blob([Logger.savedLog], {type: "text/plain;charset=utf-8"});
	saveAs(blob, saveName);
	
	Logger.savedLog = "";
	localStorage.removeItem("logName");
	localStorage.removeItem("savedLog");
}

Logger.load = function() {
	var name = localStorage.logName;
	
	// Create a new log if new user
	if (name === undefined) {
		name = prompt("Please enter your logging number.");
		Logger.setName(name);
		Logger.log("Log created");
	}
	// Continue the log if there is a saved user
	else {
		var log = localStorage.savedLog;
		Logger.setName(name);
		Logger.savedLog = log;
		Logger.log("Log loaded");
	}
};

Logger.store = function () {
	if (Logger.name && Logger.savedLog.length > 0) {
		Logger.log("Log stored");
		localStorage.setItem("logName", Logger.name);
		localStorage.setItem("savedLog", Logger.savedLog);
	}
};

Logger.reset = function () {
	Logger.name = undefined;
	Logger.savedLog = undefined;
	localStorage.removeItem("logName");
	localStorage.removeItem("savedLog");
	location.reload();
}