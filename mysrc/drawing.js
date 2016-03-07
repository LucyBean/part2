Sk.drawing = {};
Sk.drawing.treeStyle = {};
Sk.drawing.bracketStyle = {};

Sk.drawing.treeStyle.cellWidth = 80;
Sk.drawing.treeStyle.cellHeight = 25;
Sk.drawing.treeStyle.padding = 20;
Sk.drawing.treeStyle.margin = 5;
Sk.drawing.treeStyle.textSize = 14;

Sk.drawing.bracketStyle.wordPadding = 4;
Sk.drawing.bracketStyle.padding = 10;
Sk.drawing.bracketStyle.ySpacing = 20;
Sk.drawing.bracketStyle.textSize = 24;

// This will return the maximum depth of the tree (as a number of nodes)
// Can be used to automatically scale the canvas
Sk.drawing.addDrawingInformation = function (node, depth) {
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
			var childMaxDepth = Sk.drawing.addDrawingInformation(node.children[i], depth+1, Sk.drawing.treeStyle.cellWidth, Sk.drawing.treeStyle.padding);
			
			// Calculate the total width needed to display all the ancestors of this node
			node.width += node.children[i].width;
			childXTotal += node.children[i].x + offset;
			
			offset += node.children[i].width + Sk.drawing.treeStyle.padding;
			
			if (i < node.children.length - 1) {
				node.width += Sk.drawing.treeStyle.padding;
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
		node.width = Sk.drawing.treeStyle.cellWidth;
		node.x = 0;
		node.depth = depth;
		
		return depth+1;
	}
}

Sk.drawing.drawTreeFabric = function (canvas, node, scaleCanvas, info) {
	if (info === undefined) {
		info = function (node) {
			return node.val;
		}
	}
	
	canvas.clear();
	
	var depth = Sk.drawing.addDrawingInformation(node);
	
	if (scaleCanvas){
		var width = node.width;
		var height = depth* (Sk.drawing.treeStyle.cellHeight + Sk.drawing.treeStyle.padding) - Sk.drawing.treeStyle.padding;
		
		canvas.setWidth(width+2*Sk.drawing.treeStyle.margin);
		canvas.setHeight(height+2*Sk.drawing.treeStyle.margin);
	}
	
	// Draw the tree
	Sk.drawing.drawNodeFabric(canvas, node, info);
}

Sk.drawing.drawNodeFabric = function (canvas, node, info, offset) {
	if (offset === undefined) {
		offset = Sk.drawing.treeStyle.margin;
	}
	
	//draw this node
	var x = node.x + offset;
	var y = node.depth * (Sk.drawing.treeStyle.cellHeight + Sk.drawing.treeStyle.padding) + Sk.drawing.treeStyle.margin;
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
	
	var rect = new fabric.Rect({fill:colour, width:Sk.drawing.treeStyle.cellWidth, height:Sk.drawing.treeStyle.cellHeight, stroke:'black'});
	
	var text = new fabric.Text(t, {fontSize:Sk.drawing.treeStyle.textSize, fontFamily:'Segoe UI', textAlign:'center'});
	text.set({left:(Sk.drawing.treeStyle.cellWidth-text.getWidth())/2, top:(Sk.drawing.treeStyle.cellHeight-text.getHeight())/2});
	
	var group = new fabric.Group([rect, text], {left:x, top:y});
	group.hasControls = false;
	
	canvas.add(group);
	
	// Draw the children
	if (node.children) {
		for (var i = 0; i < node.children.length; i++) {
			var x1 = x+Sk.drawing.treeStyle.cellWidth/2;
			var y1 = y+Sk.drawing.treeStyle.cellHeight;
			var x2 = offset+node.children[i].x+Sk.drawing.treeStyle.cellWidth/2;
			var y2 = y+Sk.drawing.treeStyle.cellHeight+Sk.drawing.treeStyle.padding;
			
			var line = new fabric.Line([x1,y1,x2,y2], {stroke: 'black'});
			canvas.add(line);
			line.selectable = false;
			Sk.drawing.drawNodeFabric(canvas, node.children[i], info, offset);
			
			offset += node.children[i].width + Sk.drawing.treeStyle.padding;
		}
	}
}

Sk.drawing.drawBrackets = function (canvas, line) {
	canvas.clear();
	
	var brackets = Sk.find.unbalancedBrackets(line).brackets;
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
	var text = new fabric.Text(line, {fontSize:Sk.drawing.bracketStyle.textSize, fontFamily:"Segoe UI"});
	var xStart = Sk.drawing.bracketStyle.padding;
	var yStart = Sk.drawing.bracketStyle.padding;
	var xRel = 0;
	
	// Add each segment of text
	// Track max depth
	var maxDepth = 0;
	
	for (var i = 0; i < segments.length; i++) {
		var group = new fabric.Group([],{left:xRel+xStart, top:yStart + Sk.drawing.bracketStyle.ySpacing*segments[i].depth});
		var t = new fabric.Text(segments[i].text, {fontSize:Sk.drawing.bracketStyle.textSize, fontFamily:"Segoe UI"});
		group.add(t);
		
		if (segments[i].text.length > 0 && segments[i].depth > maxDepth) {
			maxDepth = segments[i].depth;
		}
		
		// Highlight brackets according to matched label
		if (segments[i].matched !== undefined) {
			var rect = new fabric.Rect({width:t.getWidth()+Sk.drawing.bracketStyle.wordPadding, height:t.getHeight(), left:-Sk.drawing.bracketStyle.wordPadding/2});
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
		xRel += t.getWidth() + Sk.drawing.bracketStyle.wordPadding;
		
		canvas.add(group);
	}
	
	// Scale the canvas
	var width = text.getWidth() + (segments.length-1) * Sk.drawing.bracketStyle.wordPadding + 2*Sk.drawing.bracketStyle.padding;
	var height = text.getHeight() + maxDepth * Sk.drawing.bracketStyle.ySpacing + 2*Sk.drawing.bracketStyle.padding;
	canvas.setWidth(width);
	canvas.setHeight(height);
}