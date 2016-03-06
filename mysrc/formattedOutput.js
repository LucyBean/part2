Sk.formattedOutput = Sk.formattedOutput || {};
Sk.formattedOutput.original = {};
var errCanvasContents = [];
var byLineCanvasContents = [];

Sk.formattedOutput.setOutputs = function (outputs) {
	Sk.formattedOutput.err = outputs["err"];
	Sk.formattedOutput.errCanvas = outputs["errCanvas"];
	Sk.formattedOutput.byLine = outputs["byLine"];
	Sk.formattedOutput.byLineCanvas = outputs["byLineCanvas"];
	Sk.formattedOutput.taskList = outputs["taskList"];
	Sk.formattedOutput.codeMirror = outputs["codeMirror"];
	Sk.formattedOutput.lineReplace = outputs["lineReplace"];
}

Sk.formattedOutput.reset = function () {
	Sk.formattedOutput.original = undefined;
	Sk.formattedOutput.err.innerHTML = "";
	errCanvasContents = [];
	byLineCanvasContents = [];
}


Sk.formattedOutput.suggestBrackets = function (original, alternatives, lineNum) {
	var err = Sk.formattedOutput.err;
	lineNum++;
	
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
	err.innerHTML += "<span class=\"codeStyle\" onmouseover=\"Sk.drawing.drawBrackets(Sk.formattedOutput.errCanvas, errCanvasContents[0])\">" + original + "</span><br/>";
	
	// Display alternatives, if they exist
	if (alternatives) {
		err.innerHTML += "You could try:<br/>";
		var listContent = "";
		for (var i = 0; i < alternatives.length; i++) {
			errCanvasContents.push(alternatives[i]);
			
			// Build the HTML to represent this
			var html = "<span class = \"codeStyle\"";
			html += "onmouseover=\"Sk.drawing.drawBrackets(Sk.formattedOutput.errCanvas, errCanvasContents[" + (i+1) + "])\"";
			if (Sk.formattedOutput.lineReplace) {
				html += "onclick=\"Sk.formattedOutput.lineReplace(" + lineNum + ", '" + alternatives[i] + "')\"";
			}
			html += ">";
			html += alternatives[i];
			html += "</span>";
			
			listContent += "<li>" + html + "</li>";
		}
		err.innerHTML += "<ol>" + listContent + "</ol>";
	}
}

Sk.formattedOutput.setOriginalTree = function (original, lineNum) {
	if (!Sk.formattedOutput.original) {
		Sk.formattedOutput.original = {originial:original, lineNum:lineNum};
		var err = Sk.formattedOutput.err;
		
		// Display explanation and jump to line if possible
		if (lineNum) {
			if (Sk.formattedOutput.codeMirror) {
				Sk.formattedOutput.codeMirror.setCursor(lineNum-1);
			}
			err.innerHTML += "There is a syntax error on line " + lineNum + ".<br/>";
		} else {
			err.innerHTML += "You have a syntax error.<br/>";
		}
		
		// Display original
		errCanvasContents.push(original.tree);
		err.innerHTML += "<span class=\"codeStyle\" onmouseover=\"Sk.drawing.drawTreeFabric(Sk.formattedOutput.errCanvas, errCanvasContents[0], true)\">" + original.text + "</span><br/>";
		Sk.drawing.drawTreeFabric(Sk.formattedOutput.errCanvas, original.tree, true);
	}
}

Sk.formattedOutput.suggestAlternativeTree = function (alt) {
	var err = Sk.formattedOutput.err;
	
	// Add a suggestion message if the canvas has length 1 or less
	// indicates only the original is on the page.
	if (errCanvasContents.length <= 1) {
		err.innerHTML += "Here are some alternatives. Click on one to try it. If you are unhappy with the results, click the undo button.<br/>";
	}
	var index = errCanvasContents.length;
	errCanvasContents.push(alt.tree);
	
	// Build the HTML that represents the line
	// show the tree on mouseover
	var html = "<span class=\"codeStyle\" onmouseover=\"Sk.drawing.drawTreeFabric(Sk.formattedOutput.errCanvas, errCanvasContents[" + index + "], true)\""
	
	// replace the line on click
	if (Sk.formattedOutput.lineReplace) {
		html += " onclick = \"Sk.formattedOutput.lineReplace(" + Sk.formattedOutput.original.lineNum + ", '" + stripTrailingNewLine(alt.context[2]) + "')\"";
	}
	
	// if there is an explanation, add it as a title (tooltip)
	if (alt.explanation) {
		html +=  " title = \"" + alt.explanation + "\"";
	}
	
	// close the tag
	html += ">" + stripTrailingNewLine(alt.text) + "</span>";
	
	// if the line is an incomplete fragment then append a "..." with a tooltip
	if (alt.incomplete) {
		html += "<span class=\"codeStyle\" title=\"This indicates that the line was incomplete.\">...</span>";
	}
	html += "<br/>";
	
	err.innerHTML += html;
}

Sk.formattedOutput.displayByLine = function (treeLines) {
	if(Sk.formattedOutput.byLine && Sk.formattedOutput.byLineCanvas) {
		var byLine = Sk.formattedOutput.byLine;
	
		byLine.innerHTML = "";
		byLineCanvasContents = [];
		
		// Display each line and tree
		for (var i = 0; i < treeLines.length; i++) {
			byLineCanvasContents.push(treeLines[i].tree);
			byLine.innerHTML += "<span class=\"codeStyle\" onmouseover=\"Sk.drawing.drawTreeFabric(Sk.formattedOutput.byLineCanvas, byLineCanvasContents[" + (i+1) + "])\">" + treeLines[i].line + "</span><br/>";
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
		var html = "<span class=\"codeStyle\"";
		if (Sk.formattedOutput.lineReplace) {
			var esc = escapeDoubleQuotes(fix);
			html += " onclick=\"Sk.formattedOutput.lineReplace(" + lineNum + ", '" + esc + "')\"";
		}
		html += ">";
		html += fix;
		html += "</span>";
		
		err.innerHTML += html;
	}
}