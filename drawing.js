var cellWidth = 100;
var cellHeight = 50;
var padding = 40;
	
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

drawTree = function (ctx, node) {
	addDrawingInformation(node);
	drawNode(ctx, node);
}

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
		
		for (var i = 0; i < node.children.length; i++) {
			addDrawingInformation(node.children[i], depth+1, cellWidth, padding);
			node.width += node.children[i].width;
			childXTotal += node.children[i].x + offset;
			
			offset += node.children[i].width + padding;
			
			if (i < node.children.length - 1) {
				node.width += padding;
			}
		}
		
		// Set 
		node.x = childXTotal / node.children.length;
		node.depth = depth;
	}
	
	// For a leaf node
	else {
		node.width = cellWidth;
		node.x = 0;
		node.depth = depth;
	}
}

drawNode = function (ctx, node, offset) {
	if (offset === undefined) {
		offset = 0;
	}
	
	//draw this node
	var x = node.x + offset;
	var y = node.depth * (cellHeight + padding);
	
	ctx.fillText(node.val, x+cellWidth/2, y+cellHeight/2);
	ctx.rect(x, y, cellWidth, cellHeight);
	ctx.stroke();
	
	
	// Draw the children
	if (node.children) {
		for (var i = 0; i < node.children.length; i++) {
			ctx.moveTo(x+cellWidth/2, y+cellHeight);
			ctx.lineTo(offset+node.children[i].x+cellWidth/2, y+cellHeight+padding);
			drawNode(ctx, node.children[i], offset);
			
			offset += node.children[i].width + padding;
		}
	}	
	
}

