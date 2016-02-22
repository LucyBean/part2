Sk.debug = Sk.debug || {};

// Given a parse stack, this will dump the parse tree for each node currently
// on the stack
Sk.debug.parseStackDump = function (stack) {
	for (var i = 0; i < stack.length; i++) {
		var node = stack[i].node;
		
		Sk.debugout('Level ' + i + ', State ' + stack[i].state);
		Sk.debugout(Sk.parseTreeDump(node));
		Sk.debugout('\n-----------------------');
	}
};

// Prints all the first sets of every transition in <alts>
Sk.debug.printAlts = function (ilabel, value, alts) {
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

Sk.debug.printFirstSet = function (ilabel) {
	var set = Sk.help.generateFirstSet(ilabel);
	
	for (i in set) {
		var s = set[i];
		var sM = Sk.ilabelMeaning(s);
		
		if (sM !== undefined) {
			Sk.debugout("\t\t\t" + s + " " + sM);
		}
	}
};