/**
 *	Returns feedback on an eolInString error.
 */
Sk.Tokenizer.eolInString = function (line, errPosition) {
	Sk.helpout(line + " has a string that contains a newline character\n");
	
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

Sk.parseStackDump = function (stack) {
	for (var i = 0; i < stack.length; i++) {
		var node = stack[i].node;
		
		Sk.debugout('Level ' + i);
		Sk.debugout(Sk.parseTreeDump(node));
		Sk.debugout('\n-----------------------');
	}
}

Sk.statesDump = function (states) {
	debugger
	for (var i = 0; i < states.length; i++) {
		var ilabel = states[i][0][0];
		var term = Sk.ParseTables.labels[ilabel][0];
		
		// Expected a terminal
		if (term < 256) {
			Sk.debugout('Expected: ' + Sk.ilabelMeaning(ilabel));
		}
		// Expected a non-terminal production
		else {
			var dfa = Sk.ParseTables.dfas[term];
			var first = dfa[1];
			
			// TODO: Print out ilabelMeaning of first set (using Object.keys?)
			
		}
	}
	Sk.debugout('\n-----------------------');
}

Sk.ilabelMeaning = function (ilabel) {
	if (ilabel === 256) return 'START';
	if (ilabel > 256) return Sk.ilabelMeaning.nonterms(ilabel);
	
	var keyword = Sk.ilabelMeaning.keywords(ilabel);
	var token = Sk.ilabelMeaning.token(ilabel);
	
	var t = Sk.ParseTables.labels[ilabel][0];
	var nonterm = Sk.ilabelMeaning.nonterms(t);
	
	return keyword || token || nonterm;
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
		if (ilabel === tti[i]) {
			return Sk.Tokenizer.tokenNames[i];
		}
	}
};

Sk.ilabelMeaning.nonterms = function (ilabel) {
	ilabel -= 257;
	
	if (ilabel >= 0) {
		return Object.keys(Sk.ParseTables.sym)[ilabel];
	}
}
