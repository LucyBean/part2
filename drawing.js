var cellWidth = 120;
var cellHeight = 40;
var padding = 20;
var margin = 5;
var textSize = 14;

setStyle = function (width, height, pad, f) {
	cellWidth = width;
	cellHeight = height;
	padding = pad;
	font = f;
}

// This will return the maximum depth of the tree (as a number of nodes)
// Can be used to automatically scale the canvas
addDrawingInformation = function (node, depth) {
	if (depth === undefined) {
		depth = 0;
	}
	
	// node.x will represent the relative x co-ordinate of the node
	// within its width box
	
	// For a branch node
	if (node.children && node.children.length > 0) {
		node.width = 0;
		
		var offset = 0;
		var childXTotal =0;
		var maxDepth = depth;
		
		// Add drawing information to each child
		for (var i = 0; i < node.children.length; i++) {
			var childMaxDepth = addDrawingInformation(node.children[i], depth+1, cellWidth, padding);
			
			// Calculate the total width needed to display all the ancestors of this node
			node.width += node.children[i].width;
			childXTotal += node.children[i].x + offset;
			
			offset += node.children[i].width + padding;
			
			if (i < node.children.length - 1) {
				node.width += padding;
			}
			
			// Find the maximum depth ancestor
			if (childMaxDepth > maxDepth) {
				maxDepth = childMaxDepth;
			}
		}
		
		// Set the x position of this node to be the average of the children's absolute x positions
		node.x = childXTotal / node.children.length;
		node.depth = depth;
		
		return maxDepth;
	}
	
	// For a leaf node
	else {
		node.width = cellWidth;
		node.x = 0;
		node.depth = depth;
		
		return depth+1;
	}
}

drawTreeFabric = function (canvas, node, scaleCanvas, info) {
	if (info === undefined) {
		info = function (node) {
			return node.val;
		}
	}
	
	canvas.clear();
	
	var depth = addDrawingInformation(node);
	
	if (scaleCanvas){
		var width = node.width;
		var height = depth* (cellHeight + padding) - padding;
		
		canvas.setWidth(width+2*margin);
		canvas.setHeight(height+2*margin);
	}
	
	drawNodeFabric(canvas, node, info);
}

drawNodeFabric = function (canvas, node, info, offset) {
	if (offset === undefined) {
		offset = margin;
	}
	
	//draw this node
	var x = node.x + offset;
	var y = node.depth * (cellHeight + padding) + margin;
	var t = info(node);
	var colour = "#ffffff";
	
	if (node.tags) {
		if (node.tags.indexOf("Appended") !== -1) {
			colour = "#ffaaaa";
		}
		else if (node.tags.indexOf("SOL") !== -1) {
			colour = "#aaaaff";
		}
	}
	
	var rect = new fabric.Rect({fill:colour, width:cellWidth, height:cellHeight, stroke:'black'});
	
	//var text = new fabric.Text(t, {left:x, top:y, fontSize:20, fontFamily:'Arial', textAlign:'center'});
	var text = new fabric.Text(t, {fontSize:textSize, fontFamily:'Arial', textAlign:'center'});
	text.set({left:(cellWidth-text.getWidth())/2, top:(cellHeight-text.getHeight())/2});
	
	var group = new fabric.Group([rect, text], {left:x, top:y});
	group.hasControls = false;
	
	canvas.add(group);
	
	// Draw the children
	if (node.children) {
		for (var i = 0; i < node.children.length; i++) {
			var x1 = x+cellWidth/2;
			var y1 = y+cellHeight;
			var x2 = offset+node.children[i].x+cellWidth/2;
			var y2 = y+cellHeight+padding;
			
			var line = new fabric.Line([x1,y1,x2,y2], {stroke: 'black'});
			canvas.add(line);
			line.selectable = false;
			drawNodeFabric(canvas, node.children[i], info, offset);
			
			offset += node.children[i].width + padding;
		}
	}
}

drawBrackets = function (canvas, line) {
	canvas.clear();
	
	var brackets = temp.unbalancedBrackets(line).brackets;
	var ptr = 0;
	var depth = 0;
	var openB = "([{";
	var segments = [];
	
	// Separate the string into sections
	for (var i = 0; i < brackets.length; i++) {
		var string;
		// If it is an opening bracket, extract up to and including the bracket
		// Increment the bracket depth
		if (openB.indexOf(brackets[i].type) !== -1) {
			string = line.substring(ptr, brackets[i].pos+1);
			ptr = brackets[i].pos+1;
			segments.push({text:string, depth:depth});
			depth++;
		}
		// Else, extract up to but excluding the bracket
		// Decrement the bracket depth
		else {
			string = line.substring(ptr, brackets[i].pos);
			ptr = brackets[i].pos;
			segments.push({text:string, depth:depth});
			depth--;
		}
	}
	
	// Extract the remainder of the line
	segments.push({text:line.substring(ptr, line.length), depth:depth});
	
	// Display the segments of text with the y co-ordinate modified according to the depth
	
	// Calculate the total width of the text
	var text = new fabric.Text(line, {fontSize:textSize, fontFamily:"Arial"});
	var width = text.getWidth();
	var xStart = 20;
	var yStart = 20;
	var xRel = 0;
	
	// Add each segment of text
	for (var i = 0; i < segments.length; i++) {
		var t = new fabric.Text(segments[i].text, {fontSize:textSize, fontFamily:"Arial", left:xRel+xStart, top:yStart + 40*segments[i].depth});
		xRel += t.getWidth();
		
		canvas.add(t);
	}
}

var temp = {};

temp.unbalancedBrackets = function (input) {
	var lines = temp.stripStringCharacters(input);
	
	var brackets = "()[]{}";
	var extractedBrackets = [];
	
	// Extract all the brackets and their positions in the string
	for (var k = 0; k < lines.length; k++) {
		var index = brackets.indexOf(lines.charAt(k));
		
		if (index !== -1) {
			extractedBrackets.push({type:brackets.charAt(index), pos:k, matched:false});
		}
	}
	
	// Remove matching pairs of brackets
	var i = 0;
	while (i < extractedBrackets.length - 1) {
		if (extractedBrackets[i].matched) {
			// The current bracket we are checking has been matched
			i++;
		} else {
			// The bracket has been unmatched
			var current = extractedBrackets[i];
			
			// Find the next unmatched bracket
			while (i < extractedBrackets.length - 1 && extractedBrackets[i+1].matched) {
				i++;
			}
			if (i === extractedBrackets.length - 1) {
				break;
			}
			var next = extractedBrackets[i+1];
			
			// Check if they can be matched up
			var cn = brackets.indexOf(current.type);
			var nn = brackets.indexOf(next.type);
			
			// If they are a matching pair of brackets, mark them as matched
			// and start from the beginning
			if (cn%2 == 0 && nn === cn + 1) {
				current.matched = true;
				next.matched = true;
				i = 0;
			}
			// Else move on to next bracket
			else {
				i++;
			}
		}
	}
	
	var balanced = true;
	
	for (j in extractedBrackets) {
		var b = extractedBrackets[j];
		if (!b.matched) {
			console.log('Unmatched bracket ' + b.type + ' at ' + b.pos);
			balanced = false;
		}
	}
	
	return {isvalid:balanced, brackets:extractedBrackets};
};

temp.stripStringCharacters = function (string, replacement) {
	var input = string;
	var insideQuote = false;
	var escaped = false;
	replacement = replacement || '_';
	
	//This will replace all characters within a string with the replacement char
	for (var i = 0; i < input.length; i++) {
		var c = input.charAt(i);
		
		// Check for escaping backslashes
		if (!escaped && c === "\\") {
			escaped = true;
			
			if (insideQuote) {
					var prefix = input.slice(0,i);
					var suffix = input.slice(i+1);
					var input = prefix + replacement + suffix;
			}
		}
		else {
			// If we find an unescaped quote then flip inside/outside indicator
			if (!escaped && (c === "\"" || c === "'")) {
				insideQuote = !insideQuote;
			} else {
				
				// If we are inside a quote then replace the characters
				if (insideQuote) {
					var prefix = input.slice(0,i);
					var suffix = input.slice(i+1);
					var input = prefix + replacement + suffix;
				}
			}
			
			escaped = false;
		}
	}
	
	return input;
};