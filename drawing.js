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