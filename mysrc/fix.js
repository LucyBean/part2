Sk.fix = {};

Sk.fix.unfinishedInfix = function (context, stack, fixErrs, usedNames) {
	var start = context[0][1];
	var end = context[1][1];
	var lineNo = context[0][0];
	var string = context[2];
	fixErrs = fixErrs || 0;
	var stringEndGlobal = string.substr(start);
	var prevTokens = Sk.help.extractTokensFromStack(stack);
	var prevToken = prevTokens[prevTokens.length-1];
	var nextToken = Sk.Tokenizer.extractOneToken(stringEndGlobal);
	var stringEnd = stringEndGlobal.slice(nextToken.value.length);
	var tryGeneric = true;
	var altFound = false;

	var nextNextToken;
	var stringEndA = stringEnd;
	do {
		nextNextToken = Sk.Tokenizer.extractOneToken(stringEndA);
		stringEndA = stringEndA.slice(nextNextToken.value.length);
	} while (nextNextToken.type === 5);
	
	// Report original
	{
		var otree = Sk.parseTrees.parseStackToTree(stack);
		var org = {text:stripTrailingNewLine(string), tree:otree, context:context};
		Sk.formattedOutput.setOriginalTree(org, lineNo);
	}
	
	// When the nextToken is a newline, the tokenizer will get a bit
	// confused and returns the wrong kind of newline. This fixes that.
	if (string.length === end) {
		nextToken.type = 4;
	}
	
	// If there are two adjacent names use special tactics
	if (prevToken.type === 1 && nextToken.type === 1) {
		var a = Sk.fix.concatAdjacentNames(prevToken, nextToken, prevTokens, usedNames, stringEnd, fixErrs);
		if (a) {
			tryGeneric = false;
			altFound = true;
			a.explanation = "Two names were concatenated. Names in python cannot contain spaces.";
			Sk.formattedOutput.suggestAlternativeTree(a);
		}
	}
	// For infix keywords, we must check whether the next and nextNext tokens
	// are names to detect a fix
	if (nextToken.type === 1 && nextNextToken.type === 1) {
		var a = Sk.fix.concatAdjacentNames(nextToken, nextNextToken, prevTokens, usedNames, stringEndA, fixErrs);
		if (a) {
			tryGeneric = false;
			altFound = true;
			a.explanation = "Two names were concatenated. Names in python cannot contain spaces.";
			Sk.formattedOutput.suggestAlternativeTree(a);
		}
	}
	
	// If there are two adjacent tokens that may be part of a function list
	// then suggest inserting commas
	// First check if we are currently in an arglist
	if (Sk.help.containsUnfinishedArgList(stack[stack.length-1].node)) {
		// Check if the next token could actually be accepted
		// as an argument
		var possArgs = Sk.help.generateFirstSet(259);
		
		// Convert nextToken token type to ilabel
		var nti = Sk.ParseTables.tokens[nextToken.type].toString();
		
		if (possArgs.indexOf(nti) !== -1) {
			var commaToken = {type:12, value:","};
			var a = Sk.fix.testFix(prevTokens, [commaToken, nextToken], stringEnd, fixErrs);
			if (a) {
				tryGeneric = false;
				altFound = true;
				a.explanation = "This is a function call.";
				Sk.formattedOutput.suggestAlternativeTree(a);
			}
		}
	}
	
	// If the next token is a newline, try inserting a colon
	if (nextToken.type === 4) {
		var colonToken = {type:11, value:":"};
		var a = Sk.fix.testFix(prevTokens, [colonToken, nextToken], stringEnd, fixErrs);
		if (a) {
				tryGeneric = false;
				altFound = true;
				a.explanation = "This is the start of a block, so a colon is required at the end.";
				Sk.formattedOutput.suggestAlternativeTree(a);
			}
	}
	
	// Try generic strategies
	if (tryGeneric) {
		// Generic strategy
		// Attempt the parse without the top token in the stack
		// Don't try this if we are throwing out a bracket
		if ([7,8,9,10,26,27].indexOf(prevToken.type) === -1) {
			var a = Sk.fix.testFix(prevTokens.slice(0,prevTokens.length-1), [nextToken], stringEnd, fixErrs);
			if (a) {
				altFound = true;
				Sk.formattedOutput.suggestAlternativeTree(a);
			}
		}
		
		// Generic strategy
		// Attempt the parse without the next token
		// Ignore if throwing out a bracket or newline
		if ([4,7,8,9,10,26,27].indexOf(nextToken.type) === -1) {
			var a = Sk.fix.testFix(prevTokens, [nextNextToken], stringEndA, fixErrs);
			if (a) {
				altFound = true;
				Sk.formattedOutput.suggestAlternativeTree(a);
			}
		}
	
		// Generic strategy of adding in a token
		
		// Generate possible alternatives from looking at the grammar
		var tp = stack[stack.length-1];
		var possibleTokens = Sk.help.generateAlternatives(tp.node.type, tp.state);
		
		// Try to insert a single token group
		for (m in possibleTokens) {
			for (n in possibleTokens[m]) {
				var tokenGroup = possibleTokens[m][n];
				var tokens = Object.keys(tokenGroup);
				
				// Take the first symbol in the group as the representative
				var rep = tokens[0];
				
				// Build a string that represents the whole group
				var meaning = "[";
				for (var k = 0; k < tokens.length; k++) {
					meaning += Sk.ilabelMeaning.niceToken(tokens[k]);
					if (k !== tokens.length-1) {
						meaning += ", ";
					}
				}
				meaning += "]";
				
				var tokenNum = Sk.ilabelMeaning.ilabelToTokenNumber(rep);
				var newToken = {value:meaning, type:tokenNum, requiresReplacement:1};
				
				// Prevent trying to insert a token that is the same type
				// as the token that just came before it.
				if (prevToken.type === tokenNum) {
					continue;
				}
				
				// Attempt the parse
				var a = Sk.fix.testFix (prevTokens, [newToken, nextToken], stringEnd, fixErrs);
				
				if (a) {
					altFound = true;
					Sk.formattedOutput.suggestAlternativeTree(a);
				}
			}
		}
	}
	
	return altFound;
};

// Attempts to fix unbalanced brackets by inserting brackets into the line
// Brackets should be the object returned from Sk.find.unbalancedBrackets
Sk.fix.unbalancedBrackets = function (input, brackets) {
	var b = "()[]{}";
	
	if (brackets === undefined) {
		brackets = Sk.find.unbalancedBrackets(input);
	}
	var extractedBrackets = brackets.brackets;
	
	// For unbalanced opening brackets, we will use these strategies:
	// 0 - Simply remove the offending bracket
	// 1 - Add a corresponding closing bracket immediately next to the
	//     offending bracket
	// 2 - Add a closing bracket immediately before the next bracket
	// 3 - Add a closing bracket before the next closing bracket at the correct
	//     nesting depth *DOES NOT WORK YET!*
	// Unmatched closing brackets will always be deleted.
	var strategies = 3;
	
	var fixes = [];
	
	for (var j = 0; j < strategies; j++) {
		var copy = input;
		
		// <offset> measures the number of characters inserted and deleted. This is
		// used to translate between the position of the brackets in the original
		// string and their position in the edited string
		var offset = 0;
		
		for (var i = 0; i < extractedBrackets.length; i++) {
			var current = extractedBrackets[i];
			
			if (!current.matched) {
				var index = b.indexOf(current.type);
				
				// If it is an unmatched opening bracket
				if (index % 2 === 0) {
					var closeBracket = b[index+1];
					// Choose tactic according to strategy
					if (j === 0) {
						// Delete the offending bracket from the copy
						copy = copy.slice(0, current.pos + offset) + copy.slice(current.pos + 1 + offset);
						offset--;
					} else if (j === 1) {
						// Insert a closing bracket adjacent
						copy = copy.slice(0, current.pos + offset + 1) + closeBracket + copy.slice(current.pos + offset + 1);
						offset++;
					} else if (j === 2) {
						// Insert the closing bracket before the next bracket
						var next = extractedBrackets[i+1];
						if (next === undefined) {
							copy = copy + closeBracket;
						} else if (next.pos === current.pos + 1) {
							copy = copy.slice(0, current.pos + offset + 1) + closeBracket + copy.slice(current.pos + offset + 1);
							offset++;
						} else {
							copy = copy.slice(0, next.pos + offset) + closeBracket + copy.slice(next.pos + offset);
							offset++;
						}
					} /*
						This code has problems because it tries to insert a bracket ahead of where
						the pointer currently is. A simple <offset> variable will not work in this case :(
					
						else if (j === 3) {
						// Insert the closing bracket before the next closing bracket
						// that is at the correct bracketing depth
						var ptr = i+1;
						var next = extractedBrackets[ptr];
						var depth = 0;
						
						// This loop terminates with next pointing to the bracket immediately after where the closing
						// bracket is to be inserted
						while (next !== undefined && !(next.matched && b.indexOf(next.type)%2 === 1 && depth === 0)) {
							// Ignore unmatched brackets
							if (!next.matched) {
								// Do nothing
							}
							// For opening brackets, increase the depth
							else if (b.indexOf(next.type)%2 === 0) {
								depth++;
							}
							// For closing brackets, decrease the depth
							else {
								depth--;
							}
							
							ptr++;
							next = extractedBrackets[ptr];
						}
						
						// Insert the bracket before the bracket identified by the above loop
						if (next === undefined) {
							copy = copy + closeBracket;
							modified = true;
						} else if (next.pos === current.pos + 1) {
							continue;
						} else {
							copy = copy.slice(0, next.pos + offset) + closeBracket + copy.slice(next.pos + offset);
							offset++;
							modified = true;
						}
					}*/
				}
				// Else it is an unmatched closing bracket
				else {
					// Delete the offending bracket from the copy
					copy = copy.slice(0, current.pos + offset) + copy.slice(current.pos + 1 + offset);
					offset--;
					modified = true;
				}
			}
		}
		fixes.push(copy);
	}
	
	return fixes;
};

/**
 *	Returns feedback on an eolInString error.
 */
Sk.fix.eolInString = function (line, lineNum, errPosition) {		
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
	
	// If there are unbalanced brackets, try to match them with brackets inside the string
	if (unbalanced.length > 0) {
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
	}
	
	// Try inserting a quote at <quotePoint> from the end of the string
	var quotesUsed = line.charAt(errPosition);
	var start = line.substring(0, line.length-quotePoint);
	var end = line.substring(line.length-quotePoint);
	var fix = start + quotesUsed + end;
	
	var fixed = Sk.Tokenizer.checkLex(fix);
	if (fixed) {
		Sk.formattedOutput.suggestStringFix(line, fix, lineNum+1);
		return true;
	}
	return false;
};

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
		fixedLine += manualAddTokens[i].value;
	}
	reportLine = fixedLine;
	fixedLine += stringEnd;
	
	var pos = 0;
	var genContext = function (tokenVal) {
		var len = tokenVal.length;
		var con = [[lineNo, pos], [lineNo, pos+len], fixedLine];
		
		// Increase pos according to any following blank spaces
		pos += len;
		while (fixedLine[pos] === " ") {
			pos++;
		}
		return con;
	}
	
	try {
		var p = makeParser(undefined, undefined, fixErrs);
		var parseFunc = p[0];
		var manualAdd = p[1];
		var parser = p[2];
		
		var tokens = prevTokens.concat(manualAddTokens);
		
		var replacements = [];		
		var context;
		// Parse the tokens using the manual add function
		// <manualAdd> has <fixErrs> set to 1. This will mean inserting up to two
		// adjacent symbols will be tried
		for (i in tokens) {
			context = genContext(tokens[i].value);
			manualAdd(tokens[i].type, tokens[i].value, context, fixErrs, tokens[i].requiresReplacement);
			
			if(tokens[i].requiresReplacement) {
				var replacement = {start:context[0][1], end:context[1][1], prompt:tokens[i].value};
				replacements.push(replacement);
			}
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
				// Extract the next non-space token
				while (stringEndA[0] === " ") {
					stringEndA = stringEndA.slice(1);
					genContext(" ");
				}
				nextToken = Sk.Tokenizer.extractOneToken(stringEndA);
				stringEndA = stringEndA.slice(nextToken.value.length);
				context = genContext(nextToken.value);
				
				/*
				do {
					nextToken = Sk.Tokenizer.extractOneToken(stringEndA);
					stringEndA = stringEndA.slice(nextToken.value.length);
					context = genContext(nextToken.value);
				} while (nextToken.type === 5);*/
				
				// If a token has been extracted, add it
				if (nextToken.type !== 0) {
					if (nextToken.type === 53) {
						nextToken.type = 4;
					}
					manualAdd(nextToken.type, nextToken.value, context, fixErrs, nextToken.requiresReplacement);
					reportLine += nextToken.value;
				}
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
		ret.replacements = replacements;
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
	if (Sk.ParseTables.keywords[newTokenVal] || usedNames[newTokenVal] || turtleKeywords[newTokenVal]) {
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