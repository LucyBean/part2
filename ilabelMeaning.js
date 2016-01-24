Sk.ilabelMeaning = function (ilabel) {
	if (ilabel === 256) return 'START';
	if (ilabel > 256) return Sk.ilabelMeaning.nonterms(ilabel);
	
	var token = Sk.ilabelMeaning.token(ilabel);
	if (token) {
		return token;
	}
	
	var keyword = Sk.ilabelMeaning.keywords(ilabel);
	if (keyword) {
		return keyword;
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
	//return Sk.Tokenizer.tokenNames[ilabel];
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