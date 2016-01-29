stripTrailingNewLine = function (string) {
	var lastChar = string.charAt(string.length-1);
	if (lastChar == '\n') {
		return string.substring(0, string.length-1);
	}
	else {
		return string;
	}
	
	/*var nl = string.indexOf('\n');
	if (nl !== -1) {
		return string.substring(0, nl);
	}
	else {
		return string;
	}*/
};

/*
 * Check fix will return true or false on whether the lexer can successfully
 * parse the tokens. Need to prevent infinite loops.
 */
Sk.Tokenizer.checkLex = function (fix) {
	var fixed = true;
	
	var checkFix = new Sk.Tokenizer(this.filename, this.interactive, function (type, value, start, end, line) {
		// This is the callback function that is called when a token has been generated and identified
		// Extract the start line and column from the start array
        var s_lineno = start[0];
        var s_column = start[1];
		
		// Indicate failure and return true to stop checking the rest of the string
        if (type === Sk.Tokenizer.Tokens.T_ERRORTOKEN) {
			fixed = false;
			return true;
		}
		
		// Return false to check the rest of the string
		if (end[1] < line.length) {
			return false;
		} else {
			return true;
		}
	});
	
	result = checkFix.generateTokens(fix);
	
	if (fixed && result === 'done') {
		return true;
	} else {
		return false;
	}
}

Sk.Tokenizer.classifyToken = function (string) {
	var token = Sk.Tokenizer.extractOneToken(string);
	return Sk.Tokenizer.tokenNames[token.type];
}

Sk.Tokenizer.extractOneToken = function (string) {
	var token;
	
	var extract = new Sk.Tokenizer(this.filename, this.interactive, function (t, v, s, e, l) {
		if (t === Sk.Tokenizer.Tokens.T_OP) {
            t = Sk.OpMap[v];
        }
		token = {type:t, value:v, start:s, end:e, line:l}
		return true;
	});
	
	extract.generateTokens(string);
	
	return token;
}

Sk.fix = {};

Sk.fix.unfinishedInfix = function (alts, context, stack, fixErrs) {
	var start = context[0][1];
	var end = context[1][1];
	var lineNo = context[0][0];
	var string = context[2];
	fixErrs = fixErrs || 0;
	
	// Extract the currently parsed string from the stack
	// By extracting it from the stack rather than the context, we can
	// use a recursive approach
	// This is compiled into a string for the context
	var prevTokens = Sk.help.extractTokensFromStack(stack);
	var stringStart = Sk.help.tokensToString(prevTokens);
	
	var lines = Sk.help.splitToLines(stringStart);
	var currentLine = lines[lineNo-1];
	
	// Extract the next token from the unparsed stringEnd
	var stringEnd = string.substring(end-1);
	var nextToken = Sk.Tokenizer.extractOneToken(stringEnd);
	stringEnd = stringEnd.slice(nextToken.value.length);
	
	// This seems to get confused when the error is happening right at the
	// end of the line and gives the newline token a type of 53 rather
	// than 4
	if (string.length === end) {
		nextToken.type = 4;
	}
	
	// possibleAppends holds the ilabels of tokens that may work. It is populated
	// by checking all the first sets of the alternative symbols
	var possibleAppends = [];
	for (i in alts) {
		var a = alts[i];
		var first = Sk.help.generateFirstSet(a);
		possibleAppends.push.apply(possibleAppends, first);
	}
	
	var alts = [];
	
	// Try to remove the top token in the stack
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	// Try to insert a single token
	for (i in possibleAppends) {
		var ilabel = possibleAppends[i];
		var meaning = Sk.ilabelMeaning.niceToken(ilabel);
		// Converting back to a token number
		var tokenNum = Sk.ilabelMeaning.ilabelToTokenNumber(ilabel);
		
		// Prevent trying to insert a token that is the same type
		// as the token that just came before it.
		var prevToken = prevTokens[prevTokens.length-1];
		if (prevToken.type === tokenNum) {
			continue;
		}
		
		// Do not bother trying to add in any opening brackets
		// 30-(  14-[  9-{
		if (["30","14","9"].indexOf(ilabel) !== -1) {
			continue;
		}
		
		var fixedLine = currentLine + meaning + nextToken.value + stringEnd;
		
		// Creates a new parser to check the parsing of this line
		var p = makeParser(undefined, undefined, fixErrs);
		var parseFunc = p[0];
		var manualAdd = p[1];
		var parser = p[2];
		
		try {
			var pos = 0;
			var genContext = function (tokenVal) {
				var len = tokenVal.length;
				var context = [[lineNo, pos], [lineNo, pos+len], fixedLine];
				pos += len;
				return context;
			}
			
			for (var i = 0; i < prevTokens.length; i++) {
				manualAdd(prevTokens[i].type, prevTokens[i].value, genContext(prevTokens[i].value));
			}
			var c1 = genContext(meaning);
			
			manualAdd(tokenNum, meaning, c1);
			
			var c2 = genContext(nextToken.value);
			manualAdd(nextToken.type, nextToken.value, c2, 0);
			
			var tree = Sk.parseTrees.parseStackToTree(parser.stack);			
			var reportLine = stripTrailingNewLine(fixedLine);
			
			// If the token we have just add is NOT the last in the line then
			// report back only the fragment we have parsed
			if (c2[1][1] !== reportLine.length && nextToken.type !== 4) {
				reportLine = reportLine.substring(0,c2[1][1]) + "...";
			}
			
			var alt = {text:reportLine, tree:tree, context:c1};
			alts.push(alt);
		}
		catch (err) {
			Sk.debugout(stripTrailingNewLine(fixedLine) + ' was tried and did not work');
		}
	}
	var otext = stringStart + nextToken.value
	// If there were unparsed characters then add a "...";
	if (otext.length !== stripTrailingNewLine(string).length) {
		otext += "...";
	}
	var otree = Sk.parseTrees.parseStackToTree(stack);
	var org = {text:otext, tree:otree, context:context};

	Sk.specialOutput.displayAlternatives(org, alts);	
};

// Attempts to fix unbalanced brackets by inserting brackets into the line
// Brackets should be the object returned from Sk.find.unbalancedBrackets
Sk.fix.unbalancedBrackets = function (input, brackets) {
	var b = "()[]{}";
	
	// <offset> measures the number of characters inserted and deleted. This is
	// used to translate between the position of the brackets in the original
	// string and their position in the edited string
	var offset = 0;
	
	if (brackets === undefined) {
		brackets = Sk.find.ubalancedBrackets(input);
	}
	
	var extractedBrackets = brackets.brackets;
	
	for (var i = 0; i < extractedBrackets.length; i++) {
		var current = extractedBrackets[i];
		
		if (!current.matched) {
			var index = b.indexOf(current.type);
			
			// If it is an unmatched opening bracket
			if (index % 2 === 0) {
				var closeBracket = b[index+1];
				// Insert the corresponding closing bracket before
				// the next bracket or at EOF
				var next = extractedBrackets[i+1];
				if (next === undefined) {
					input = input + closeBracket;
				}
				else {
					input = input.slice(0, next.pos + offset) + closeBracket + input.slice(next.pos + offset);
					offset++;
				}
			}
			// Else it is an unmatched closing bracket
			else {
				// Delete the offending bracket from the input
				input = input.slice(0, current.pos + offset) + input.slice(current.pos + 1 + offset);
				offset--;
			}
		}
	}
	
	Sk.specialOutput.help("<br>Try: ");
	Sk.specialOutput.helpCode(input);
	if (Sk.help.checkParse(input)) {
		return input;
	}
};

/**
 *	Returns feedback on an eolInString error.
 */
Sk.fix.eolInString = function (line, errPosition) {	
	Sk.specialOutput.helpCode("<br>" + line);
	Sk.specialOutput.help(" has a string that contains a newline character\n");
	
	
	// Find the unbalanced brackets within the line and check whether
	// these have accidentally been included in the string
	var unbalanced = Sk.find.unbalancedBrackets(line).brackets;
	var brackets = "()[]{}";
	var string = line.slice(errPosition);
	
	// <ubIndex> represents the unbalanced bracket we are currently trying
	// to match
	// <quotePoint> represents the position (from the end of the string) to
	// insert the quote mark
	var ubIndex = 0;
	var quotePoint = 0;
	
	// Attempt to match each unbalanced bracket from the end of the string
	for (var j = 0; j < string.length; j++) {
		var i = string.length - 1 - j;
		// Extract the bracket to be matched and its match
		var toMatch = unbalanced[ubIndex].type;
		var index = brackets.indexOf(toMatch);
		var b;
		if (index%2 === 0) {
			b = brackets.charAt(index+1);
		} else {
			b = brackets.charAt(index-1);
		}
		
		var c = string.charAt(i);
		if (c === b) {
			quotePoint = j+1;
			ubIndex++;
		}
		
		if (ubIndex >= unbalanced.length) {
			break;
		}
	}
	
	// Try inserting a quote at <quotePoint> from the end of the string
	var quotesUsed = line.charAt(errPosition);
	var start = line.substring(0, line.length-quotePoint);
	var end = line.substring(line.length-quotePoint);
	var fix = start + quotesUsed + end;
	
	var fixed = Sk.Tokenizer.checkLex(fix);
	if (fixed) {
		Sk.specialOutput.help("<br>");
		Sk.specialOutput.helpCode(fix);
		Sk.specialOutput.help(" is an alternative that may work.");
		return fix;
	}
};

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
		s += tokens[i].value;
	}
	
	return s;
};

Sk.help.generateFirstSet = function (ilabel) {
	var aset = [];
	
	var term = Sk.ilabelMeaning.ilabelToNonTerm(ilabel);
	
	if (term > 256) {
		var firstSet = Object.keys(Sk.ParseTables.dfas[term][1]);
		
		for (i in firstSet) {
			var first = firstSet[i];			
			var tset = Sk.help.generateFirstSet(first);
			
			for (t in tset) {
				aset.push(tset[t]);
			}
		}
		
	} else {
		var meaning = Sk.ilabelMeaning(ilabel);
		if (meaning !== undefined) {
			aset.push(ilabel);
		}
	}
	
	return aset;
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
			v += "\n" + node.value;
		}
	}
	else {
		v = Sk.ilabelMeaning(node.type);
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

Sk.find = Sk.find || {};

// If there is an unfinished quote, returns the position of the opening quote
Sk.find.unfinishedString = function (line) {
	var insideQuote = false;
	var tripleQuote = false;
	var quoteChar;
	var escaped = false;
	var lastQuote;
	
	for (var i = 0; i < line.length; i++) {
		var c = line.charAt(i);
		
		// Check for a newline character
		if (c === "\n") {
			// if the character appears within a single quoted string
			// then return the position of the opening quote
			if (insideQuote) {
				return lastQuote;
			}
		}
		
		// Check for escaping backslashes
		if (!escaped && c === "\\") {
			escaped = true;
		}
		// Check for comments
		if (c === "#" && !insideQuote && !tripleQuote) {
			break;
		}
		else {
			// If we find an unescaped quote then...
			if (!escaped && (c === "\"" || c === "'")) {
				// if we are inside a triple quote
				if (tripleQuote) {
					// check for a closing triple quote
					if (line.charAt(i+1) === c && line.charAt(i+2) === c && c === quoteChar) {
						tripleQuote = false;
						i += 2;
					}
				}
				
				// if we are inside a single quote
				else if (insideQuote && c === quoteChar) {
					// close the quote
					insideQuote = false;
				}
				
				// else check for an opening quote
				else if (!insideQuote && !tripleQuote) {
					// check if it is a triple quote
					if (line.charAt(i+1) === c && line.charAt(i+2) === c) {
						tripleQuote = true;
						i += 2;
					}
					
					// else it is an opening single quote
					else {
						insideQuote = true;
					}
					
					quoteChar = c;
					lastQuote = i;
				}
			}
			
			escaped = false;
		}
	}
	
	// If we reach the end of the input and there is an open string
	// return the position of the opening quote
	if (insideQuote || tripleQuote) {
		return lastQuote;
	}
}

// Detects whether the set of brackets within the program is balanced
// Not the most efficient way of doing it but it works
// I'm almost certain some of these loops can be combined
Sk.find.unbalancedBrackets = function (input) {
	var lines = Sk.help.stripStringCharacters(input);
	
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
			Sk.debugout('Unmatched bracket ' + b.type + ' at ' + b.pos);
			balanced = false;
		}
	}
	
	return {isvalid:balanced, brackets:extractedBrackets};
};
