stripTrailingNewLine = function (string) {
	var nl = string.indexOf('\n');
	if (nl !== -1) {
		return string.substring(0, nl);
	}
	else {
		return string;
	}
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
	var result;
	
	var classify = new Sk.Tokenizer(this.filename, this.interactive, function (type, value, start, end, line) {
		result = type;
		return true;
	});
	
	classify.generateTokens(string);
	
	return Sk.Tokenizer.tokenNames[result];
}

Sk.fix = {};

Sk.fix.unfinishedInfix = function (alts, context, fixErrs) {
	var start = context[0][1];
	var end = context[1][1];
	var string = context[2];
	var stringStart = string.substring(0, end-1);
	var stringEnd = string.substring(end-1);
	fixErrs = fixErrs || 0;
	
	// possibleAppends holds the ilabels of tokens that may work
	var possibleAppends = [];
	
	Sk.helpout(stripTrailingNewLine(string) + ' is an invalid expression\n');
	
	for (i in alts) {
		var a = alts[i];
		var first = Sk.help.generateFirstSet(a);
		possibleAppends.push.apply(possibleAppends, first);
	}
	
	for (i in possibleAppends) {
		var ilabel = possibleAppends[i];
		var meaning = Sk.ilabelMeaning(ilabel);
		
		// Converting back to a token number
		var tokenNum = Sk.ilabelMeaning.ilabelToTokenNumber(ilabel);
		
		// Empty context
		var context = [[], [], stringStart + ' ' + meaning + ' ' + stringEnd];
		
		// Creates a new parser to check the parsing of this line
		var p = makeParser(undefined, undefined, fixErrs - 1);
		var parseFunc = p[0];
		var manualAdd = p[1];
		
		try {			
			var a = parseFunc(stringStart);
			var b = manualAdd(tokenNum, meaning, context);
			var c = parseFunc(stringEnd);
			var d = manualAdd(4, Sk.Tokenizer.tokenNames[4], context);
			
			Sk.helpout(stripTrailingNewLine(context[2]) + ' appeared to work\n');
			
		}
		catch (err) {
			Sk.debugout(stripTrailingNewLine(context[2]) + ' was tried and did not work');
		}
	}
};

// Attempts to fix unbalanced brackets by inserting brackets into the string
// Brackets should be the object returned from Sk.help.findUnbalancedBrackets
Sk.fix.unbalancedBrackets = function (input, brackets) {
	var b = "()[]{}";
	
	// offset measures the number of characters inserted and deleted. This is
	// used to translate between the position of the brackets in the original
	// string and their position in the edited string
	var offset = 0;
	
	if (brackets === undefined) {
		brackets = Sk.help.findUnbalancedBrackets(input);
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
					input = input.slice(0, input.length-1) + closeBracket + "\n";
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
	
	Sk.helpout("\nTry:\n" + input);
	Sk.help.checkParse(input);
};

/**
 *	Returns feedback on an eolInString error.
 */
Sk.fix.eolInString = function (line, errPosition) {
	Sk.helpout(line + " has a string that contains a newline character\n");
	
	// TODO: Find parethesis depth of the error
	
	// Try inserting a quote at the end
	var quotesUsed = line.charAt(errPosition);
	var fix = line.substring(0, line.length-1);
	fix += quotesUsed + '\n'
	
	var fixed = Sk.Tokenizer.checkLex(fix);
	if (fixed) {
		Sk.helpout(fix + " is an alternative that may work.");
	}
};

Sk.help = {};

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

Sk.help.parseStackDump = function (stack) {
	for (var i = 0; i < stack.length; i++) {
		var node = stack[i].node;
		
		Sk.debugout('Level ' + i);
		Sk.debugout(Sk.parseTreeDump(node));
		Sk.debugout('\n-----------------------');
	}
};

// Prints all the possible next 
Sk.help.printAlts = function (ilabel, value, alts) {
	Sk.debugout("\t\tUnfound alternative symbol for " + Sk.ilabelMeaning(ilabel) + " " + value);
			
			for (i in alts) {
				var a = alts[i];
				var meaning = Sk.ilabelMeaning(a);
				
				if (meaning !== undefined) {
					var print = meaning;
					
					if (meaning === 'terminal') {
						print = Sk.ilabelMeaning(Sk.ilabelMeaning.ilabelToNonTerm(a));
					}
					Sk.debugout("\t\t" + a + " " + print);
				}
				
				// non-terminal production expected
				// print first set
				// only if t > 256?
				if (meaning === 'terminal') {
					Sk.help.printFirstSet(a);
				}
			}
};

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

// Detects whether the set of brackets within the program is balanced
// Not the most efficient way of doing it but it works
// I'm almost certain some of these loops can be combined
Sk.help.findUnbalancedBrackets = function (input) {
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

Sk.help.printFirstSet = function (ilabel) {
	var set = Sk.help.generateFirstSet(ilabel);
	
	for (i in set) {
		var s = set[i];
		var sM = Sk.ilabelMeaning(s);
		
		if (sM !== undefined) {
			Sk.debugout("\t\t\t" + s + " " + sM);
		}
	}
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

Sk.ilabelMeaning = function (ilabel) {
	if (ilabel === 256) return 'START';
	if (ilabel > 256) return Sk.ilabelMeaning.nonterms(ilabel);
	
	var keyword = Sk.ilabelMeaning.keywords(ilabel);
	if (keyword) {
		return keyword;
	}
	
	var token = Sk.ilabelMeaning.token(ilabel);
	if (token) {
		return token;
	}
	
	var t = Sk.ilabelMeaning.ilabelToNonTerm(ilabel);
	if (t) {
		return 'terminal';
	}
};

Sk.ilabelMeaning.ilabelToNonTerm = function (ilabel) {
	var table = Sk.ParseTables.labels[ilabel];
	if (table !== undefined) {
		return table[0];
	}
}

Sk.ilabelMeaning.keywords = function (ilabel) {
	var map = {
		4: 'def',
		5: 'raise',
		
		7: 'not',
		
		10: 'class',
		11: 'lambda',
		12: 'print',
		
		13: 'debugger',
		
		16: 'try',
		17: 'exec',
		18: 'while',
		
		20: 'return',
		21: 'assert',
		22: 'T_NAME',
		23: 'del',
		24: 'pass',
		
		25: 'import',
		
		27: 'yield',
		28: 'global',
		29: 'for',
		
		31: 'from',
		32: 'if',	
		33: 'break',
		34: 'continue',
		
		36: 'with',
		
		41: 'and',
		
		74: 'in',
		
		83: 'is',
		
		100: 'as',
		
		104: 'except',
		
		116: 'else',
		
		120: 'elif',
		
		134: 'or',
		
		162: 'finally',
	};
	
	return map[ilabel];
};

Sk.ilabelMeaning.token = function (ilabel) {
	var tn = Sk.ilabelMeaning.ilabelToTokenNumber(ilabel);
	return Sk.Tokenizer.tokenNames[tn];
};

Sk.ilabelMeaning.nonterms = function (ilabel) {
	return Sk.ParseTables.number2symbol[ilabel];
	/*ilabel -= 257;
	
	if (ilabel >= 0) {
		return Object.keys(Sk.ParseTables.sym)[ilabel];
	}*/
};

Sk.ilabelMeaning.ilabelToTokenNumber = function (ilabel) {
	// tti is a token# -> ilabel table
	var tti = Sk.ParseTables.tokens;
	
	// check each token within the table to see whether it has
	// the required ilabel
	for (i = 0; i < Object.keys(tti).length; i++) {
		if (ilabel == tti[i]) {
			return i;
		}
	}
}
