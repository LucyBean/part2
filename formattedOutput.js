Sk.formattedOutput = Sk.formattedOutput || {};

Sk.formattedOutput.setOutputs = function (outputs) {
	Sk.formattedOutput.std = outputs["std"];
	Sk.formattedOutput.err = outputs["err"];
	Sk.formattedOutput.errCanvas = outputs["errCanvas"];
	Sk.formattedOutput.byLine = outputs["byLine"];
	Sk.formattedOutput.byLineCanvas = outputs["byLineCanvas"];
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
	
	// Display alternatives
	err.innerHTML += "You could try:<br/>";
	for (var i = 0; i < alternatives.length; i++) {
		errCanvasContents.push(alternatives[i]);
		err.innerHTML += "<span class=\"codeStyle\" onclick=\"Sk.drawing.drawBrackets(Sk.formattedOutput.errCanvas, errCanvasContents[" + (i+1) + "])\">" + alternatives[i] + "</span><br/>";
	}
}

Sk.formattedOutput.suggestParseTrees = function (original, alternatives) {
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
	for (var i = 0; i < alternatives.length; i++) {
		errCanvasContents.push(alternatives[i].tree);
		err.innerHTML += "<span class=\"codeStyle\" onclick=\"Sk.drawing.drawTreeFabric(Sk.formattedOutput.errCanvas, errCanvasContents[" + (i+1) + "])\">" + alternatives[i].line + "</span><br/>";
	}
}

Sk.formattedOutput.displayByLine = function (treeLines) {
	var byLine = Sk.formattedOutput.byLine;
	
	byLine.innerHTML = "";
	byLineCanvasContents = [];
	
	// Display each line and tree
	for (var i = 0; i < treeLines.length; i++) {
		byLineCanvasContents.push(treeLines[i].tree);
		byLine.innerHTML += "<span class=\"codeStyle\" onclick=\"Sk.drawing.drawTreeFabric(Sk.formattedOutput.byLineCanvas, byLineCanvasContents[" + (i+1) + "])\">" + treeLines[i].line + "</span><br/>";
	}
}