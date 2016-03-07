Logger = {};

Logger.setName = function (name) {
	Logger.name = name;
	Logger.savedLog = "";
}

Logger.log = function (event, msg, text) {
	console.log("Logging " + event);
	var d = new Date();
	Logger.savedLog += "time:" + d.getTime() + ",";
	Logger.savedLog += "event:" + event + ",";
	Logger.savedLog += "msg:" + msg + ",";
	Logger.savedLog += "text:" + escape(text) + ",";
	Logger.savedLog += ";\r\n";
}

Logger.save = function () {
	var d = new Date();
	var saveName = Logger.name + "-" + d.getTime();
	console.log("Saving log " + saveName);
	var blob = new Blob([Logger.savedLog], {type: "text/plain;charset=utf-8"});
	saveAs(blob, saveName);
	
	Logger.savedLog = "";
}