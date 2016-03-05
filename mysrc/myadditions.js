stripTrailingNewLine = function (string) {
	/*var lastChar = string.charAt(string.length-1);
	if (lastChar == '\n') {
		return string.substring(0, string.length-1);
	}
	else {
		return string;
	}*/
	
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

turtleKeywords = {
	"setheading":1,
	"towards":1,
	"distance":1,
	"heading":1,
	"position":1,
	"xcor":1,
	"ycor":1,
	"setpos":1,
	"setx":1,
	"sety":1,
	"home":1,
	"forward":1,
	"backward":1,
	"left":1,
	"right":1,
	"penup":1,
	"pendown":1,
	"isdown":1,
	"circle":1,
	"pencolor":1,
	"fillcolor":1,
	"stamp":1
}