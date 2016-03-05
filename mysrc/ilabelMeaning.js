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
};

Sk.ilabelMeaning.niceToken = function (ilabel) {
	var tn = Sk.ilabelMeaning.ilabelToTokenNumber(ilabel);
	
	niceNames = {
		0:"END",	1:"Name",	2:"Number",	3:"String",	4:"NEWLINE",
		5:"INDENT",	6:"DEDENT",	7:"(",		8:")",		9:"[",
		10:"]",		11:":",		12:",",		13:";",		14:"+",
		15:"-",		16:"*",		17:"/",		18:"|",		19:"&",
		20:"<",		21:">",		22:"=",		23:".",		24:"%",
		25:"\\",	26:"{",		27:"}",		28:"==",	29:"!=",
		30:"<=",	31:">=",	32:"~",		33:"^",		34:"<<",
		35:">>",	36:"**",	37:"+=",	38:"-=",	39:"*=",
		40:"/=",	41:"%=",	42:"&=",	43:"|=",	44:"^=",
		45:"<<=",	46:">>=",	47:"**=",	48:"//",	49:"//=",
		50:"@",		51:"OP",	52:"COMMENT",			53:"NL",
		54:"->",	55:"ERR",	56:"N_TOKENS",			57:"NT_OFFSET"
	}
	
	return niceNames[tn];
}

Sk.ilabelMeaning.nonterms = function (ilabel) {
	return Sk.ParseTables.number2symbol[ilabel];
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