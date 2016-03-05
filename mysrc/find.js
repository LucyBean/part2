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
	var unmatchedBrackets = [];
	
	// Extract all the brackets and their positions in the string
	for (var k = 0; k < lines.length; k++) {
		var index = brackets.indexOf(lines.charAt(k));
		
		if (index !== -1) {
			var b = {type:brackets.charAt(index), pos:k, matched:false};
			extractedBrackets.push(b);
			unmatchedBrackets.push(b);
		}
	}
	
	var changed = true;
	
	// Repeatedly remove adjacent brackets until nothing happens
	OUTERWHILE:
	while (changed) {
		changed = false;
		
		// Remove adjacent pairs of unmatched brackets
		for (var i = 0; i < unmatchedBrackets.length-1; i++) {
			var now = unmatchedBrackets[i];
			var next = unmatchedBrackets[i+1];
			
			var nown = brackets.indexOf(now.type);
			var nexn = brackets.indexOf(next.type);
			
			// If they match, mark them as matched and remove them
			if (nown%2 === 0 && nexn === nown + 1) {
				now.matched = true;
				next.matched = true;
				unmatchedBrackets.splice(i,2);
				changed = true;
				continue OUTERWHILE;
			}
			// If they're an adjacent open/close pair that do not match
			// then one needs to be removed
			else if (nown%2 === 0 && nexn%2 === 1) {
				// <now> is an opening bracket. Search right to find its
				// closest closing bracket
				var nowMatch = i+2;
				var nowf = false;
				while (nowMatch < unmatchedBrackets.length && !nowf) {
					if (brackets.indexOf(unmatchedBrackets[nowMatch].type) === nown+1) {
						nowf = true;
					} else {
						nowMatch++;
					}
				}
				
				// <next> is a closing bracket. Search left to find its
				// closest opening bracket
				var nextMatch = i-1;
				var nexf = false;
				
				while (nextMatch >= 0 && !nexf) {
					if (nexn == brackets.indexOf(unmatchedBrackets[nextMatch].type)+1) {
						nexf = true;
					} else {
						nextMatch--;
					}
				}
				
				// Discard one or the other, depending on how far away the match is
				// Throw away brackets found to have no match
				if (!nowf && !nexf) {
					now.matched = false;
					next.matched = false;
					unmatchedBrackets.splice(i,2);
					changed = true;
					continue OUTERWHILE;
				}
				else if (!nowf && nexf) {
					now.matched = false;
					unmatchedBrackets.splice(i,1);
					changed = true;
					continue OUTERWHILE;
				}
				else if (!nexf && nowf) {
					next.matched = false;
					unmatchedBrackets.splice(i+1,1);
					changed = true;
					continue OUTERWHILE;
				}
				else if (nowf && nexf) {
					if (nowMatch - i > (i+1) - nextMatch) {
						now.matched = false;
						unmatchedBrackets.splice(i,1);
					} else {
						next.matched = false;
						unmatchedBrackets.splice(i+1,1);
					}
					changed = true;
					continue OUTERWHILE;
				}
			}
		}
	}
	
	var balanced = true;
	
	for (j in extractedBrackets) {
		var b = extractedBrackets[j];
		if (!b.matched) {
			console.log('Unmatched bracket ' + b.type + ' at ' + b.pos);
			balanced = false;
		}
	}
	
	return {isvalid:balanced, brackets:extractedBrackets};
};