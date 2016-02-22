Sk.fix.testFix = function (prevTokens, manualAddTokens, stringEnd, fixErrs) {
	// Extract the currently parsed string from the stack to recover the
	// string that has actually been parsed.
	// Take the last line from this.
	var stringStart = Sk.help.tokensToString(prevTokens);
	var lines = Sk.help.splitToLines(stringStart);
	var lineNo = lines.length-1;
	var currentLine = lines[lineNo];
	
	if (fixErrs === undefined || fixErrs < 0) {
		fixErrs = 0;
	}
	
	var fixedLine = currentLine;
	for (i in manualAddTokens) {
		fixedLine += manualAddTokens[i].value;
	}
	fixedLine += stringEnd;
	
	var pos = 0;
	var genContext = function (tokenVal) {
		var len = tokenVal.length;
		var con = [[lineNo, pos], [lineNo, pos+len], fixedLine];
		pos += len;
		return con;
	}
	
	try {
		var p = makeParser(undefined, undefined, 1);
		var parseFunc = p[0];
		var manualAdd = p[1];
		var parser = p[2];
		
		var tokens = prevTokens.concat(manualAddTokens);
		
		var context;
		// Parse the tokens using the manual add function
		for (i in tokens) {
			context = genContext(tokens[i].value);
			manualAdd(tokens[i].type, tokens[i].value, context, fixErrs);
		}
		
		// If we have got this far, we know the fix works
		// Attempt fix for rest of line
		var tree = Sk.parseTrees.parseStackToTree(parser.stack);
		var reportLine = stripTrailingNewLine(fixedLine);
		Sk.debugout("At least partial fix found: " + reportLine);
		
		try {
			parseFunc(stringEnd);
			console.log("The rest of the line was parsed successfully.");
			tree = Sk.parseTrees.parseStackToTree(parser.stack);
			reportLine = Sk.help.tokensToString(Sk.help.extractTokensFromStack(parser.stack));
		}
		catch (err) {
			console.log("There was an error parsing the rest of the line.");
		}
		
		return {text:reportLine, tree:tree, context:context};
	}
	catch (err) {
		Sk.debugout(stripTrailingNewLine(fixedLine) + ' was tried and did not work');
	}
}

Sk.fix.concatAdjacentNames = function (prevToken, nextToken, prevTokens, usedNames, stringEnd) {	
	// Form a new token consisting of the concatenated names and check
	// whether it is a previous used name or is a keyword.
	// If so, suggest that as a fix.
	var newTokenVal = prevToken.value + nextToken.value;
	if (Sk.ParseTables.keywords[newTokenVal] || usedNames[newTokenVal]) {
		// Create a new token with the two names
		var newToken = {type:1, value:newTokenVal};
		
		// Attempt the parse, removing the prev token if required
		var prevTokensA = prevTokens.slice();
		if (prevTokensA[prevTokensA.length-1] == prevToken) {
			prevTokensA = prevTokensA.slice(0, prevTokensA.length-1);
		}
		var a = Sk.fix.testFix(prevTokensA, [newToken], stringEnd);
		if (a) {
			return a;
		}
	}
}




























