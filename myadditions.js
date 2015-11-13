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