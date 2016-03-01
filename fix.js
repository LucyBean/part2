Sk.fix.testFix = function (prevTokens, manualAddTokens, stringEnd, fixErrs) {
	// Extract the currently parsed string from the stack to recover the
	// string that has actually been parsed.
	// Take the last line from this.
	var stringStart = Sk.help.tokensToString(prevTokens);
	var lines = Sk.help.splitToLines(stringStart);
	var lineNo = lines.length-1;
	var currentLine = lines[lineNo];
	var ret = {};
	
	if (fixErrs === undefined || fixErrs < 0) {
		fixErrs = 0;
	}
	
	var fixedLine = currentLine;
	var reportLine;
	for (i in manualAddTokens) {
		fixedLine += manualAddTokens[i].value + " ";
	}
	reportLine = fixedLine;
	fixedLine += stringEnd;
	
	var pos = 0;
	var genContext = function (tokenVal) {
		var len = tokenVal.length;
		var con = [[lineNo, pos], [lineNo, pos+len], fixedLine];
		pos += len+1;
		return con;
	}
	
	try {
		var p = makeParser(undefined, undefined, fixErrs);
		var parseFunc = p[0];
		var manualAdd = p[1];
		var parser = p[2];
		
		var tokens = prevTokens.concat(manualAddTokens);
		
		var context;
		// Parse the tokens using the manual add function
		// <manualAdd> has <fixErrs> set to 1. This will mean inserting up to two
		// adjacent symbols will be tried
		for (i in tokens) {
			context = genContext(tokens[i].value);
			manualAdd(tokens[i].type, tokens[i].value, context, fixErrs);
		}
		
		// If we have got this far, we know the fix works
		// Attempt fix for rest of line
		var tree = Sk.parseTrees.parseStackToTree(parser.stack);
		Sk.debugout("At least partial fix found: " + reportLine);
		
		try {
			// Add in the next tokens.
			var nextToken;
			var stringEndA = stringEnd;
			var context;
			do {
				do {
					nextToken = Sk.Tokenizer.extractOneToken(stringEndA);
					stringEndA = stringEndA.slice(nextToken.value.length);
					context = genContext(nextToken.value);
				} while (nextToken.type === 5);
				if (stringEndA.length === 0) {
					nextToken.type = 4;
				}
				manualAdd(nextToken.type, nextToken.value, context, fixErrs);
				reportLine += nextToken.value;
			} while (stringEndA.length > 0);			
			console.log("The rest of the line was parsed successfully.");
			tree = Sk.parseTrees.parseStackToTree(parser.stack);
		}
		catch (err) {
			console.log("There was an error parsing the rest of the line.");
			ret.incomplete = 1;
		}
		ret.text = reportLine;
		ret.tree = tree;
		ret.context = context;
		return ret;
	}
	catch (err) {
		Sk.debugout(stripTrailingNewLine(fixedLine) + ' was tried and did not work');
	}
}

Sk.fix.concatAdjacentNames = function (prevToken, nextToken, prevTokens, usedNames, stringEnd, fixErrs) {	
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
		var a = Sk.fix.testFix(prevTokensA, [newToken], stringEnd, fixErrs);
		if (a) {
			return a;
		}
	}
}