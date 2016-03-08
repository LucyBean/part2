Sk.parseTrees = Sk.parseTrees || {};

// Extract the tree to be printed from a parse tree
// This extracts it in a compact form (with all single child nodes eliminated)
Sk.parseTrees.extractPrintTree = function (node, f) {
	// Okay so the token type isn't quite an ilabel here so I have to do this?
	var v;
	var t = Sk.Tokenizer.tokenNames[node.type];
	
	if (f === undefined) {
		f = [];
	}
	
	// In the parse tree, do not display the value of
	// 0-endmarker, 4-newline, 5-indent, 6-dedent, 53-NL
	var ignoreTokens = [0, 4, 5, 6, 53];
	
	if (node.type === 323 || node.type === 320) {
		f.push("SOL");
	}
	
	// If the token represents a value (that is not to be ignored) then
	// add it to the print tree
	if (t !== undefined) {
		v = t;
		if (ignoreTokens.indexOf(node.type) === -1) {
			v = node.value;
		}
	}
	else {
		v = "";
	}
	
	if (!node.children) {
		return {val:v, tags:f};
	}
	// If this node has only one child, ignore this node
	// If this node is a "simple_stmt" then ignore the trailing newline character
	// Any Start Of Line flags need to be passed down in this case
	else if (node.children.length === 1 || node.type === 320) {
		var child = node.children[0];
		if (f && f.indexOf("SOL") !== -1) {
			return Sk.parseTrees.extractPrintTree(child, ["SOL"]);
		}
		return Sk.parseTrees.extractPrintTree(child);
	}
	else {
		var c = [];
		for (var i = 0; i < node.children.length; i++) {
			c.push(Sk.parseTrees.extractPrintTree(node.children[i]));
		}
		return {val:v, children:c, tags:f};
	}
}

// Produces a parse tree, representing a partially parsed line
// from the state of the current parse stack
Sk.parseTrees.parseStackToTree = function (stack) {
	if (!stack || stack.length === 0) {
		return;
	}
	
	var stackTrees = [];
	
	// Convert each node in the stack to its print tree
	for (var i = 0; i < stack.length; i++) {
		var node = stack[i].node;
		
		// Ignore all nodes that have no children
		// Unless it is the first node
		if (i == 0 || (node.children && node.children.length > 0)) {
			var tree = Sk.parseTrees.extractPrintTree(node);
			
			// All trees, except the first, will be appended to the
			// previous tree
			if (i > 0) {
				tree.tags = tree.tags || [];
				tree.tags.push("Appended");
			}
			stackTrees.push(tree);
		}
	}
	
	// Append the trees, working from the bottom up
	for (var i = 1; i < stackTrees.length; i++) {
		var j = stackTrees.length - i - 1;
		Sk.parseTrees.appendTree(stackTrees[j], stackTrees[j+1]);
	}
	
	return stackTrees[0];
}

// Appends the child tree as the right-most child at the lowest level.
// (The child tree will appear as the last element in an infix tree traversal)
Sk.parseTrees.appendTree = function (parent, child) {
	// If the parent has children then append the child to
	// the right-most subtree
	if (parent.children && parent.children.length > 0) {
		var newParent = parent.children[parent.children.length-1];
		Sk.parseTrees.appendTree(newParent, child);
	}
	// Else add it as the right-most child
	else {
		parent.children = parent.children || [];
		parent.children.push(child);
	}
}