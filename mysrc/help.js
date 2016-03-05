Sk.help = {};

// This will parse as string, correcting up to <checkErrs> number of errors
// Returns true or false depending on whether the string does parse
Sk.help.checkParse = function (string, checkErrs) {
	checkErrs = checkErrs || 0;
	
	if (string.charAt(string.length-1) !== "\n") {
		string += "\n";
	}
	
	var parseFunc = makeParser(undefined, undefined, checkErrs)[0];
	
	try {
		parseFunc(string);
		Sk.debugout(stripTrailingNewLine(string) + " does parse");
		return true;
	}
	catch (err) {
		Sk.debugout(stripTrailingNewLine(string) + " does not parse");
		return false;
	}
};

// Strips all characters within a string and replaces them with <replacement> char
// (default = '_'). This is useful for checking for unbalanced brackets, as we
// do not want to attempt to match brackets that appear within a string.
Sk.help.stripStringCharacters = function (string, replacement) {
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

// Given a parse stack, this will extract all the tokens into an array.
Sk.help.extractTokensFromStack = function (stack) {
	var tokens = [];
	
	for (var i = 0; i < stack.length; i++) {
		var st = Sk.help.stackNodeToTokens(stack[i].node);
		
		for (var j = 0; j < st.length; j++) {
			tokens.push(st[j]);
		}
	}
	
	return tokens;
};

// Given a parse tree node, this will extract all the children token
Sk.help.stackNodeToTokens = function (node) {
	var tokens = [];
	
	// If the node is a leaf it represents a token.
	if (node.children === null) {
		var t = {type:node.type, value:node.value};
		tokens.push(t);
	}
	// Else the node represents a branch and represents a rule rather\
	// than a token
	else {
		for (var i = 0; i < node.children.length; i++) {
			var ct = Sk.help.stackNodeToTokens(node.children[i]);
			
			for (var j = 0; j < ct.length; j++) {
				tokens.push(ct[j]);
			}
		}
	}
	
	return tokens;
};

// Converts an array of tokens into a string.
Sk.help.tokensToString = function (tokens) {
	var s = "";
	
	for (var i = 0; i < tokens.length; i++) {
		s += tokens[i].value + " ";
	}
	
	return s;
};

// I think this may be redundant, as Sk.ParseTables.dfas[term][1]
// appears to be the first set
Sk.help.generateFirstSet = function (ilabel) {
	var term = Sk.ilabelMeaning.ilabelToNonTerm(ilabel) || ilabel;
	
	if (term > 256) {
		return Object.keys(Sk.ParseTables.dfas[term][1]);
		
	} else {
		return ilabel;
	}
}

// Generates groups of alternatives
Sk.help.generateAlternatives = function (term, state) {
	// Contains token numbers
	var firstSet = Object.keys(Sk.ParseTables.dfas[term][1]);
	var alts = {};
	
	for (f in firstSet) {
		var ilabel = firstSet[f];
		var tokenNum = Sk.ilabelMeaning.ilabelToTokenNumber(ilabel);
		// Ignore brackets and backquote
		if (["9","14","15","30"].indexOf(ilabel) !== -1) {
			continue;
		}
		
		// Create a parser with the root as the current term and state
		var p = makeParser(undefined, undefined, 0);
		var parseFunc = p[0];
		var manualAdd = p[1];
		var parser = p[2];
		
		// Manually set the root node to be the current term in the current state
		var dfa = Sk.ParseTables.dfas[term];
		var node = {children:[], context:null, type:term, value:null};
		var newStack = {dfa:dfa, node:node, state:state};
		
		parser.stack = [newStack];
		
		manualAdd(tokenNum);
		
		var tp = parser.stack[parser.stack.length-1];
		var topState = tp.state;
		var topType = tp.node.type;
		
		alts[topType] = alts[topType] || {};
		alts[topType][topState] = alts[topType][topState] || {};
		alts[topType][topState][ilabel] = 1;
	}
	
	return alts;
}

// Also throws away comments
Sk.help.splitToLines = function (input) {
	var tripleQuote = false;
	var lines = [""];
	var lineNum = 0;
	var escaped = false;
	
	for (var i = 0; i < input.length; i++) {
		var c = input.charAt(i);
		
		// When a comment (#) is found, skip to end of line
		if (c === "#") {
			while (c !== "\n") {
				//lines[lineNum] += c;
				i++;
				c = input.charAt(i);
			}
			
			lines.push("");
			lineNum++;
		}
		
		// Check for triple quotes
		else if (!escaped && c === "\\") {
			escaped = true;
		}
		
		// If we find three unescaped quotes then we are in a triplequote!
		else {
			if (!escaped && (c === "\"" || c === "'")) {
				// if we are inside a triple quote
				if (input.charAt(i+1) === c && input.charAt(i+2) === c) {
					tripleQuote = !tripleQuote;
					i += 2;
					lines[lineNum] += (c + c + c);
				}
				else {
					lines[lineNum] += c;
				}
			}
			
			// if we find a newline character
			else if (c === "\n") {
				// if we are inside a triple quote, treat it like a normal character
				if (tripleQuote) {
					lines[lineNum] += c;
				}
				// else start a new line
				else {
					lines.push("");
					lineNum++;
				}
			}
			
			else {
				lines[lineNum] += c;
			}
			
			escaped = false;
		}
	}
	
	return lines;
}

Sk.help.containsUnfinishedArgList = function(node) {
	// Check whether this node is an arglist (type=259)
	if (node.type === 259) {
		return true;
	}
	// Else check whether the rightmost child is
	// Due to the nature of the compiler, only the last child will be
	// an unfinished construction
	else if (node.children) {
		return Sk.help.containsUnfinishedArgList(node.children[node.children.length-1]);
	} else {
		return false;
	}
}