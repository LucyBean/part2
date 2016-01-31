drawing = {};
treeStyle = {};
bracketStyle = {};

drawing.textSize = 14;

treeStyle.cellWidth = 120;
treeStyle.cellHeight = 40;
treeStyle.padding = 20;
treeStyle.margin = 5;

bracketStyle.padding = 2;
bracketStyle.ySpacing = 20;

setStyle = function (width, height, pad, f) {
	treeStyle.cellWidth = width;
	treeStyle.cellHeight = height;
	treeStyle.padding = pad;
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
			var childMaxDepth = addDrawingInformation(node.children[i], depth+1, treeStyle.cellWidth, treeStyle.padding);
			
			// Calculate the total width needed to display all the ancestors of this node
			node.width += node.children[i].width;
			childXTotal += node.children[i].x + offset;
			
			offset += node.children[i].width + treeStyle.padding;
			
			if (i < node.children.length - 1) {
				node.width += treeStyle.padding;
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
		node.width = treeStyle.cellWidth;
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
		var height = depth* (treeStyle.cellHeight + treeStyle.padding) - treeStyle.padding;
		
		canvas.setWidth(width+2*treeStyle.margin);
		canvas.setHeight(height+2*treeStyle.margin);
	}
	
	drawNodeFabric(canvas, node, info);
}

drawNodeFabric = function (canvas, node, info, offset) {
	if (offset === undefined) {
		offset = treeStyle.margin;
	}
	
	//draw this node
	var x = node.x + offset;
	var y = node.depth * (treeStyle.cellHeight + treeStyle.padding) + treeStyle.margin;
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
	
	var rect = new fabric.Rect({fill:colour, width:treeStyle.cellWidth, height:treeStyle.cellHeight, stroke:'black'});
	
	//var text = new fabric.Text(t, {left:x, top:y, fontSize:20, fontFamily:'Arial', textAlign:'center'});
	var text = new fabric.Text(t, {fontSize:drawing.textSize, fontFamily:'Arial', textAlign:'center'});
	text.set({left:(treeStyle.cellWidth-text.getWidth())/2, top:(treeStyle.cellHeight-text.getHeight())/2});
	
	var group = new fabric.Group([rect, text], {left:x, top:y});
	group.hasControls = false;
	
	canvas.add(group);
	
	// Draw the children
	if (node.children) {
		for (var i = 0; i < node.children.length; i++) {
			var x1 = x+treeStyle.cellWidth/2;
			var y1 = y+treeStyle.cellHeight;
			var x2 = offset+node.children[i].x+treeStyle.cellWidth/2;
			var y2 = y+treeStyle.cellHeight+treeStyle.padding;
			
			var line = new fabric.Line([x1,y1,x2,y2], {stroke: 'black'});
			canvas.add(line);
			line.selectable = false;
			drawNodeFabric(canvas, node.children[i], info, offset);
			
			offset += node.children[i].width + treeStyle.padding;
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
		
		// If it is an opening bracket, extract
		// Increment the bracket depth if matched
		if (openB.indexOf(brackets[i].type) !== -1) {
			var string = line.substring(ptr, brackets[i].pos);
			segments.push({text:string, depth:depth});
			segments.push({text:brackets[i].type, depth:depth, matched:brackets[i].matched});
			ptr = brackets[i].pos+1;
			
			if (brackets[i].matched) {
				depth++;
			}
		}
		// Else, extract up to but excluding the bracket
		// Decrement the bracket depth if matched
		else {
			var string = line.substring(ptr, brackets[i].pos);
			segments.push({text:string, depth:depth});
			
			if (brackets[i].matched) {
				depth--;
			}
			segments.push({text:brackets[i].type, depth:depth, matched:brackets[i].matched});
			ptr = brackets[i].pos+1;
		}
	}
	
	// Extract the remainder of the line
	segments.push({text:line.substring(ptr, line.length), depth:depth});
	
	// Display the segments of text with the y co-ordinate modified according to the depth
	
	// Calculate the total width of the text
	var text = new fabric.Text(line, {fontSize:drawing.textSize, fontFamily:"Arial"});
	var width = text.getWidth();
	var xStart = 20;
	var yStart = 20;
	var xRel = 0;
	
	// Add each segment of text
	for (var i = 0; i < segments.length; i++) {
		var group = new fabric.Group([],{left:xRel+xStart, top:yStart + bracketStyle.ySpacing*segments[i].depth});
		var t = new fabric.Text(segments[i].text, {fontSize:drawing.textSize, fontFamily:"Arial"});
		group.add(t);
		
		// Highlight brackets according to matched label
		if (segments[i].matched !== undefined) {
			var rect = new fabric.Rect({width:t.getWidth()+bracketStyle.padding, height:t.getHeight(), left:-bracketStyle.padding/2});
			t.set({fill:'white'});
			if (segments[i].matched) {
				rect.set({fill:'green'});
			}
			else {
				rect.set({fill:'red'});
			}
			
			// <t> is added again so it is drawn above the box
			group.add(rect);
			group.add(t);
		}
		xRel += t.getWidth() + bracketStyle.padding;
		
		canvas.add(group);
	}
}

var temp = {};

temp.unbalancedBrackets = function (input) {
	var lines = temp.stripStringCharacters(input);
	
	var brackets = "()[]{}";
	var extractedBrackets = [];
	var unmatchedBrackets = [];
	
	// Extract all the brackets and their positions in the string
	for (var k = 0; k < lines.length; k++) {
		var index = brackets.indexOf(lines.charAt(k));
		
		if (index !== -1) {
			var b = {type:brackets.charAt(index), pos:k, matched:false};
			extractedBrackets.push(b);
			unmatchedBrackets.push(b);
		}
	}
	
	var changed = true;
	
	// Repeatedly remove adjacent brackets until nothing happens
	OUTERWHILE:
	while (changed) {
		changed = false;
		
		// Remove adjacent pairs of unmatched brackets
		for (var i = 0; i < unmatchedBrackets.length-1; i++) {
			var now = unmatchedBrackets[i];
			var next = unmatchedBrackets[i+1];
			
			var nown = brackets.indexOf(now.type);
			var nexn = brackets.indexOf(next.type);
			
			// If they match, mark them as matched and remove them
			if (nown%2 === 0 && nexn === nown + 1) {
				now.matched = true;
				next.matched = true;
				unmatchedBrackets.splice(i,2);
				changed = true;
				continue OUTERWHILE;
			}
			// If they're an adjacent open/close pair that do not match
			// then one needs to be removed
			else if (nown%2 === 0 && nexn%2 === 1) {
				// <now> is an opening bracket. Search right to find its
				// closest closing bracket
				var nowMatch = i+2;
				var nowf = false;
				while (nowMatch < unmatchedBrackets.length && !nowf) {
					if (brackets.indexOf(unmatchedBrackets[nowMatch].type) === nown+1) {
						nowf = true;
					} else {
						nowMatch++;
					}
				}
				
				// <next> is a closing bracket. Search left to find its
				// closest opening bracket
				var nextMatch = i-1;
				var nexf = false;
				
				while (nextMatch >= 0 && !nexf) {
					if (nexn == brackets.indexOf(unmatchedBrackets[nextMatch].type)+1) {
						nexf = true;
					} else {
						nextMatch--;
					}
				}
				
				// Discard one or the other, depending on how far away the match is
				// Throw away brackets found to have no match
				if (!nowf && !nexf) {
					now.matched = false;
					next.matched = false;
					unmatchedBrackets.splice(i,2);
					changed = true;
					continue OUTERWHILE;
				}
				else if (!nowf && nexf) {
					now.matched = false;
					unmatchedBrackets.splice(i,1);
					changed = true;
					continue OUTERWHILE;
				}
				else if (!nexf && nowf) {
					next.matched = false;
					unmatchedBrackets.splice(i+1,1);
					changed = true;
					continue OUTERWHILE;
				}
				else if (nowf && nexf) {
					if (nowMatch - i > (i+1) - nextMatch) {
						now.matched = false;
						unmatchedBrackets.splice(i,1);
					} else {
						next.matched = false;
						unmatchedBrackets.splice(i+1,1);
					}
					changed = true;
					continue OUTERWHILE;
				}
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