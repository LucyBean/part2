var cellWidth = 80;
var cellHeight = 20;
var padding = 20;
var font = "12px Arial";
var textAlign = "center";
var textBaseline = "middle";

setStyle = function (width, height, pad, f) {
	cellWidth = width;
	cellHeight = height;
	padding = pad;
	font = f;
}
	
drawGrid = function (ctx) {
	var gridSize = 5;
	var width = 100;
	var height = 100;
	var padding = 20;

	var x = 0;
	var y = 0;

	for (var j = 0; j < gridSize; j++) {
		for (var i = 0; i < gridSize; i++) {
			ctx.rect(x, y, width, height);
			ctx.fillText(i+j*gridSize, x+width/2, y+height/2);
			
			// Draw connecting lines if not the last in the grid
			if (i < gridSize - 1) {
				ctx.moveTo(x+width,y+height/2);
				ctx.lineTo(x+width+padding, y+height/2);
			}
			if (j < gridSize - 1) {
				ctx.moveTo(x+width/2,y+height);
				ctx.lineTo(x+width/2, y+height+padding);
			}
			
			x += width + padding;
		}
		x = 0;
		y += height + padding;
	}

	ctx.stroke();
}

drawTree = function (ctx, node, canvas, info) {
	
	if (info === undefined) {
		info = function (node) {
			return node.val;
		}
	}
	
	var depth = addDrawingInformation(node);
	
	if (canvas !== undefined) {
		var width = node.width;
		var height = depth* (cellHeight + padding) - padding;
		
		canvas.width = width;
		canvas.height = height;
		ctx.font = font;
		ctx.textAlign = textAlign;
		ctx.textBaseline = textBaseline;
	}
	
	drawNode(ctx, node, info);
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
	if (node.children) {
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

drawNode = function (ctx, node, info, offset) {
	if (offset === undefined) {
		offset = 0;
	}
	
	//draw this node
	var x = node.x + offset;
	var y = node.depth * (cellHeight + padding);
	var t = info(node);
	
	if (node.colour !== undefined) {
		ctx.fillStyle = node.colour;
		ctx.fillRect(x, y, cellWidth, cellHeight);
		ctx.fillStyle = "#000000";
	}
	
	ctx.fillText(t, x+cellWidth/2, y+cellHeight/2);
	ctx.rect(x, y, cellWidth, cellHeight);
	ctx.stroke();
	
	
	// Draw the children
	if (node.children) {
		for (var i = 0; i < node.children.length; i++) {
			ctx.moveTo(x+cellWidth/2, y+cellHeight);
			ctx.lineTo(offset+node.children[i].x+cellWidth/2, y+cellHeight+padding);
			drawNode(ctx, node.children[i], info, offset);
			
			offset += node.children[i].width + padding;
		}
	}	
	
}

