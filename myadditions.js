/**
 *	Returns feedback on an eolInString error.
 */
Sk.Tokenizer.eolInString = function (line, errPosition) {
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
}

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

Sk.fix = {};

Sk.fix.unfinishedInfix = function (alts, context) {
	var start = context[0][1];
	var end = context[1][1];
	var string = context[2];
	
	//Strip newline character
	var nl = string.indexOf('\n');
	if (nl !== -1) {
		string = string.substring(0, nl);
		string;
	}
	
	var possibleAppends = [];
	
	Sk.helpout(string + ' is an unfinished expression\n');
	
	for (i in alts) {
		var a = alts[i];
		var first = Sk.help.generateFirstSet(a);
		possibleAppends.push.apply(possibleAppends, first);
	}
	
	for (i in possibleAppends) {
		var p = possibleAppends[i];
		var pM = Sk.ilabelMeaning(p);
		
		// TODO: Check if they work
		Sk.helpout(string + ' ' + pM + ' --may work\n');
	}
	
	
}

Sk.help = {};

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
	// tti is a token# -> ilabel table
	var tti = Sk.ParseTables.tokens;
	
	// check each token within the table to see whether it has
	// the required ilabel
	for (i = 0; i < Object.keys(tti).length; i++) {
		if (ilabel == tti[i]) {
			return Sk.Tokenizer.tokenNames[i];
		}
	}
};

Sk.ilabelMeaning.nonterms = function (ilabel) {
	return Sk.ParseTables.number2symbol[ilabel];
	/*ilabel -= 257;
	
	if (ilabel >= 0) {
		return Object.keys(Sk.ParseTables.sym)[ilabel];
	}*/
};
