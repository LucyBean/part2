Sk.formattedOutput = Sk.formattedOutput || {};

Sk.formattedOutput.setOutputs = function (outputs) {
	Sk.formattedOutput.err = outputs["err"];
	Sk.formattedOutput.errCanvas = outputs["errCanvas"];
	Sk.formattedOutput.byLine = outputs["byLine"];
	Sk.formattedOutput.byLineCanvas = outputs["byLineCanvas"];
	Sk.formattedOutput.taskList = outputs["taskList"];
}

var errCanvasContents = [];
var byLineCanvasContents = [];

Sk.formattedOutput.suggestBrackets = function (original, alternatives, lineNum) {
	var err = Sk.formattedOutput.err;
	
	err.innerHTML = "";
	errCanvasContents = [];
	
	// Display explanation
	if (lineNum) {
		err.innerHTML += "Your brackets aren't balanced on line " + lineNum + ".<br/>";
	} else {
		err.innerHTML += "You have unbalanced brackets.<br/>";
	}
	
	// Display original
	errCanvasContents.push(original);
	err.innerHTML += "<span class=\"codeStyle\" onclick=\"Sk.drawing.drawBrackets(Sk.formattedOutput.errCanvas, errCanvasContents[0])\">" + original + "</span><br/>";
	
	// Display alternatives, if they exist
	if (alternatives) {
		err.innerHTML += "You could try:<br/>";
		var listContent = "";
		for (var i = 0; i < alternatives.length; i++) {
			errCanvasContents.push(alternatives[i]);
			listContent += "<li><span class=\"codeStyle\" onclick=\"Sk.drawing.drawBrackets(Sk.formattedOutput.errCanvas, errCanvasContents[" + (i+1) + "])\">" + alternatives[i] + "</span></li>";
		}
		err.innerHTML += "<ol>" + listContent + "</ol>";
	}
}

Sk.formattedOutput.suggestParseTrees = function (original, alternatives, lineNum) {
	var err = Sk.formattedOutput.err;
	
	err.innerHTML = "";
	errCanvasContents = [];
	
	// Display explanation
	if (lineNum) {
		err.innerHTML += "There is a syntax error on line " + lineNum + ".<br/>";
	} else {
		err.innerHTML += "You have a syntax error.<br/>";
	}
	
	// Display original
	errCanvasContents.push(original.tree);
	err.innerHTML += "<span class=\"codeStyle\" onclick=\"Sk.drawing.drawTreeFabric(Sk.formattedOutput.errCanvas, errCanvasContents[0])\">" + original.line + "</span><br/>";
	
	// Display alternatives
	err.innerHTML += "You could try:<br/>";
	var listContent = "";
	for (var i = 0; i < alternatives.length; i++) {
		errCanvasContents.push(alternatives[i].tree);
		listContent += "<li><span class=\"codeStyle\" onclick=\"Sk.drawing.drawTreeFabric(Sk.formattedOutput.errCanvas, errCanvasContents[" + (i+1) + "])\">" + alternatives[i].line + "</span><br/></li>";
	}
	err.innerHTML += "<ol>" + listContent + "</ol>";
}

Sk.formattedOutput.displayByLine = function (treeLines) {
	if(Sk.formattedOutput.byLine && Sk.formattedOutput.byLineCanvas) {
		var byLine = Sk.formattedOutput.byLine;
	
		byLine.innerHTML = "";
		byLineCanvasContents = [];
		
		// Display each line and tree
		for (var i = 0; i < treeLines.length; i++) {
			byLineCanvasContents.push(treeLines[i].tree);
			byLine.innerHTML += "<span class=\"codeStyle\" onclick=\"Sk.drawing.drawTreeFabric(Sk.formattedOutput.byLineCanvas, byLineCanvasContents[" + (i+1) + "])\">" + treeLines[i].line + "</span><br/>";
		}
	}
}

Sk.formattedOutput.turtleLocation = function (location) {
	Sk.output("Turtle visited (" + location.x + ", " + location.y + ")<br/>");
}

Sk.formattedOutput.transcribeTaskList = function (tasks) {
	if (Sk.formattedOutput.taskList) {
			var text = "<ol>"
		for (i in tasks) {
			var t = tasks[i];
			text += "<li>" + Sk.turtleTasks.taskNames[t[0]](t[1]) + "</li>";
		}
		text += "</ol>";
		
		Sk.formattedOutput.taskList.innerHTML = text;
	}
}

Sk.formattedOutput.suggestStringFix = function (original, fix, lineNum) {
	var err = Sk.formattedOutput.err;
	
	err.innerHTML = "";
	errCanvasContents = [];
	
	// Display explanation
	if (lineNum) {
		err.innerHTML += "There is an unterminated string on line " + lineNum + ".<br/>";
	} else {
		err.innerHTML += "There is an unterminated string.<br/>";
	}
	
	// Display original
	err.innerHTML += "<span class=\"codeStyle\">" + original + "</span><br/>";
	
	// Display fix, if it exists.
	if (fix) {
		err.innerHTML += "You could try:<br/>";
		err.innerHTML += "<span class = \"codeStyle\">" + fix + "</span>";
	}
}