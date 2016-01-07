// low level parser to a concrete syntax tree, derived from cpython's lib2to3

/**
 *
 * @constructor
 * @param {Object} grammar
 *
 * p = new Parser(grammar);
 * p.setup([start]);
 * foreach input token:
 *     if p.addtoken(...):
 *         break
 * root = p.rootnode
 *
 * can throw ParseError
 */
function Parser (filename, grammar) {
    this.filename = filename;
    this.grammar = grammar;
    this.p_flags = 0;
    return this;
}

// all possible parser flags
Parser.FUTURE_PRINT_FUNCTION = "print_function";
Parser.FUTURE_UNICODE_LITERALS = "unicode_literals";
Parser.FUTURE_DIVISION = "division";
Parser.FUTURE_ABSOLUTE_IMPORT = "absolute_import";
Parser.FUTURE_WITH_STATEMENT = "with_statement";
Parser.FUTURE_NESTED_SCOPES = "nested_scopes";
Parser.FUTURE_GENERATORS = "generators";
Parser.CO_FUTURE_PRINT_FUNCTION = 0x10000;
Parser.CO_FUTURE_UNICODE_LITERALS = 0x20000;
Parser.CO_FUTURE_DIVISON = 0x2000;
Parser.CO_FUTURE_ABSOLUTE_IMPORT = 0x4000;
Parser.CO_FUTURE_WITH_STATEMENT = 0x8000;

Parser.prototype.setup = function (start) {
    var stackentry;
    var newnode;
    start = start || this.grammar.start;
    //print("START:"+start);

    newnode =
    {
        type    : start,
        value   : null,
        context : null,
        children: []
    };
    stackentry =
    {
        dfa  : this.grammar.dfas[start],
        state: 0,
        node : newnode
    };
    this.stack = [stackentry];
    this.used_names = {};
};

function findInDfa (a, obj) {
    var i = a.length;
    while (i--) {
        if (a[i][0] === obj[0] && a[i][1] === obj[1]) {
            return true;
        }
    }
    return false;
}


// Add a token; return true if we're done
Parser.prototype.addtoken = function (type, value, context, fixErrs) {
    var errline;
    var itsfirst;
    var itsdfa;
    var state;
    var v;
    var t;
    var newstate;
    var i;
    var a;
    var arcs;
    var first;
    var states;
    var tp;
	var root;
	
	if (fixErrs === undefined) {
		fixErrs = 2;
	}
	
	if (fixErrs < 0) {
		fixErrs = 0;
	}
	
	// Classify is used to turn a token into an 'ilabel'
    var ilabel = this.classify(type, value, context);
    //Sk.debugout("Next symbol ilabel:" + ilabel + " " + Sk.ilabelMeaning(ilabel)	+ "  type:" + type + "  value:" + value);
		
	var alternatives = [];

	// This uses a stack based parser
    OUTERWHILE:
    while (true) {
		// Initialise the top pointer
        tp = this.stack[this.stack.length - 1];
        states = tp.dfa[0];
		
		// first represents the ilabels of all possible nodes that could be the first symbol
		// for that production
        first = tp.dfa[1];
		root = this.stack[0].node;
		
		// arcs represents all the possible transitions that can be taken by the parser
        arcs = states[tp.state];

        // for the current state we are in, check for a transition that can shift the current
		//  token we are looking at, or another state we can change into that has the current
		//  token in its first set
        for (a = 0; a < arcs.length; ++a) {
			// i - ilabel of the state we are looking for if we are going to shift a terminal
			// newstate - the state that the parser will transition into if we take the current arc
			// t - ilabel of the state we are looking for if we are going to push a non-terminal
			// v - ???
            i = arcs[a][0];
			var istate = Sk.ilabelMeaning(i);
            newstate = arcs[a][1];
            t = this.grammar.labels[i][0];
			var tstate = Sk.ilabelMeaning(t);
            v = this.grammar.labels[i][1];
            if (ilabel === i) {
                // look it up in the list of labels
                goog.asserts.assert(t < 256);
                // shift a token; we're done with it
                this.shift(type, value, newstate, context);
                // pop while we are in an accept-only state
                state = newstate;
                //console.log("before:"+JSON.stringify(states[state]) + ":state:"+state+":"+JSON.stringify(states[state]));
                /* jshint ignore:start */
                while (states[state].length === 1
                    && states[state][0][0] === 0
                    && states[state][0][1] === state) {
                    // states[state] == [(0, state)])
					//Sk.debugout("\tPopping accepting states");
                    this.pop();
                    //print("in after pop:"+JSON.stringify(states[state]) + ":state:"+state+":"+JSON.stringify(states[state]));
                    if (this.stack.length === 0) {
                        // done!
						//Sk.debugout(Sk.parseTreeDump(this.rootnode));
						Sk.debugout("Finished parsing");
                        return true;
                    }
                    tp = this.stack[this.stack.length - 1];
                    state = tp.state;
                    states = tp.dfa[0];
                    first = tp.dfa[1];
                    //print(JSON.stringify(states), JSON.stringify(first));
                    //print("bottom:"+JSON.stringify(states[state]) + ":state:"+state+":"+JSON.stringify(states[state]));
                }
                /* jshint ignore:end */
                // done with this token
                
				// Display the alternatives
				// Store any unconsidered arcs as alternatives
				for (b = a; b < arcs.length; ++b) {
					var j = arcs[b][0];
					alternatives.push(j);
				}
				//Sk.help.printAlts(ilabel, value, alternatives);
				
                return false;
            }
			
			// t > 256 if the arc represents a "non-terminal production"? (I honestly can't remember the technical name for it)
			else if (t >= 256) {
                itsdfa = this.grammar.dfas[t];
				
				// itsfirst represents ilabels (tokens) that can be first within the production rule
                itsfirst = itsdfa[1];
                if (itsfirst.hasOwnProperty(ilabel)) {
                    // push a non-terminal symbol
					//debugger
					//Sk.debugout("\tPushing " + this.grammar.number2symbol[t])
                    this.push(t, this.grammar.dfas[t], newstate, context);
                    continue OUTERWHILE;
                }
				else {
					alternatives.push(i);
				}
            }
			
			else {
				alternatives.push(i);
			}
        }

        //print("findInDfa: " + JSON.stringify(arcs)+" vs. " + tp.state);
        if (findInDfa(arcs, [0, tp.state])) {
            // an accepting state, pop it and try somethign else
            //print("WAA");
			//Sk.debugout("\tPopping " + this.grammar.number2symbol[this.stack[this.stack.length-1].node.type]);
			
            this.pop();
            if (this.stack.length === 0) {
                throw new Sk.builtin.ParseError("too much input", this.filename);
            }
        } else {
            errline = context[0][0];
			
			if (fixErrs) {
				//Sk.help.printAlts(ilabel, value, alternatives);
				
				// Find a valid token that can be inserted at this point
				var fixToken = Sk.fix.unfinishedInfix(alternatives, context, this.stack, fixErrs - 1);
				
				// Manually add it, the current token, and return the result
				this.addtoken(fixToken.type, fixToken.value, fixToken.context, 0);
				
				// Getting the corrected context
				var lineNo = fixToken.context[0][0];
				var pos = fixToken.context[1][1];
				var len = value.length;
				var fixedContext = [[lineNo, pos], [lineNo, pos+len], fixToken.context[2]];
				
				return this.addtoken(type, value, fixedContext, 0);
			}
			
			//Sk.help.parseStackDump(this.stack);
			
            // no transition
			console.log("Parsing error: " + context[2]);

            throw new Sk.builtin.ParseError("bad input", this.filename, errline, context);
        }
    }
};

// turn a token into an ilabel value
Parser.prototype.classify = function (type, value, context) {
    var ilabel;
	
	// If it is a name reference
    if (type === Sk.Tokenizer.Tokens.T_NAME) {
		// How is this.used_names populated?
        this.used_names[value] = true;
		
		// If the word is a keyword, this will extract the ilabel for that value
		// this.grammar.keywords.hasOwnProperty(value) === true if the value (word) is a keyword
		// this.grammar.keywords[value] will then get the assigned ilabel value for that keyword
        ilabel = this.grammar.keywords.hasOwnProperty(value) && this.grammar.keywords[value];

        /* Check for handling print as an builtin function */
        if(value === "print" && (this.p_flags & Parser.CO_FUTURE_PRINT_FUNCTION || Sk.python3 === true)) {
            ilabel = false; // ilabel determines if the value is a keyword
        }

        if (ilabel) {
            //print("is keyword");
            return ilabel;
        }
    }
	
	// What is this for?
    ilabel = this.grammar.tokens.hasOwnProperty(type) && this.grammar.tokens[type];
    if (!ilabel) {
        // throw new Sk.builtin.ParseError("bad token", type, value, context);
        // Questionable modification to put line number in position 2
        // like everywhere else and filename in position 1.
        throw new Sk.builtin.ParseError("bad token", this.filename, context[0][0], context);
    }
    return ilabel;
};

// shift a token
Parser.prototype.shift = function (type, value, newstate, context) {
    var dfa = this.stack[this.stack.length - 1].dfa;
    var state = this.stack[this.stack.length - 1].state;
    var node = this.stack[this.stack.length - 1].node;
    //print("context", context);
    var newnode = {
        type      : type,
        value     : value,
        lineno    : context[0][0],         // throwing away end here to match cpython
        col_offset: context[0][1],
        children  : null
    };
    if (newnode) {
        node.children.push(newnode);
    }
    this.stack[this.stack.length - 1] = {
        dfa  : dfa,
        state: newstate,
        node : node
    };
};

// push a nonterminal
Parser.prototype.push = function (type, newdfa, newstate, context) {
    var dfa = this.stack[this.stack.length - 1].dfa;
    var node = this.stack[this.stack.length - 1].node;
    var newnode = {
        type      : type,
        value     : null,
        lineno    : context[0][0],      // throwing away end here to match cpython
        col_offset: context[0][1],
        children  : []
    };
    this.stack[this.stack.length - 1] = {
        dfa  : dfa,
        state: newstate,
        node : node
    };
    this.stack.push({
        dfa  : newdfa,
        state: 0,
        node : newnode
    });
};

//var ac = 0;
//var bc = 0;

// pop a nonterminal
Parser.prototype.pop = function () {
    var node;
    var pop = this.stack.pop();
    var newnode = pop.node;
    //print("POP");
    if (newnode) {
        //print("A", ac++, newnode.type);
        //print("stacklen:"+this.stack.length);
        if (this.stack.length !== 0) {
            //print("B", bc++);
            node = this.stack[this.stack.length - 1].node;
            node.children.push(newnode);
        } else {
            //print("C");
            this.rootnode = newnode;
            this.rootnode.used_names = this.used_names;
        }
    }
};

/**
 * parser for interactive input. returns a function that should be called with
 * lines of input as they are entered. the function will return false
 * until the input is complete, when it will return the rootnode of the parse.
 *
 * @param {string} filename
 * @param {string=} style root of parse tree (optional)
 */
function makeParser (filename, style, fixErrs) {
    var tokenizer;
    var T_OP;
    var T_NL;
    var T_COMMENT;
    var prefix;
    var column;
    var lineno;
    var p;
	
    if (style === undefined) {
        style = "file_input";
    }
    p = new Parser(filename, Sk.ParseTables);
    // for closure's benefit
    if (style === "file_input") {
        p.setup(Sk.ParseTables.sym.file_input);
    } else {
        goog.asserts.fail("todo;");
    }
    lineno = 1;
    column = 0;
    prefix = "";
    T_COMMENT = Sk.Tokenizer.Tokens.T_COMMENT;
    T_NL = Sk.Tokenizer.Tokens.T_NL;
    T_OP = Sk.Tokenizer.Tokens.T_OP;
	
	// Takes three arguments; filename, interactive and callback function
	// The callback function is called during tokenizer.generateTokens after the type of token
	// has been identified.
    tokenizer = new Sk.Tokenizer(filename, style === "single_input", function (type, value, start, end, line) {
		// This is the callback function that is called when a token has been generated and identified
		// Extract the start line and column from the start array
        var s_lineno = start[0];
        var s_column = start[1];
        /*
         if (s_lineno !== lineno && s_column !== column)
         {
         // todo; update prefix and line/col
         }
         */
        if (type === T_COMMENT || type === T_NL) {
            prefix += value;
            lineno = end[0];
            column = end[1];
            if (value[value.length - 1] === "\n") {
                lineno += 1;
                column = 0;
            }
            //print("  not calling addtoken");
            return undefined;
        }
		
		// Map from generic 'operation' token type to a more specific token type depending on value
        if (type === T_OP) {
            type = Sk.OpMap[value];
        }
		
		// Parse the token, and check it is as expected by the grammar.
        if (p.addtoken(type, value, [start, end, line], fixErrs)) {
            return true;
        }
    });

    // create parser function
    var parseFunc = function (line) {
		var ret = tokenizer.generateTokens(line);
		//print("tok:"+ret);
		if (ret) {
			if (ret !== "done") {
				throw new Sk.builtin.ParseError("incomplete input", this.filename);
			}
			return p.rootnode;
		}
		
        return false;
    };
	
	// manually add a token
	// never attempt to fix errors when manually adding
	var addToken = function (type, value, context) {
		return p.addtoken(type, value, context, 0);
	}

    // set flags, and return
    parseFunc.p_flags = p.p_flags;
    return [parseFunc, addToken];
}

Sk.parse = function parse (filename, input) {
    var i;
    var ret;
    var lines;
    var parseFunc = makeParser(filename)[0];
    if (input.substr(input.length - 1, 1) !== "\n") {
        input += "\n";
    }
	
	// Check for any unterminated strings on each line
	// BUT NOT WHEN THE NEWLINE IS IN A STRING
	var lines = Sk.help.splitToLines(input);
	
	// Check each line for an unfinished string and balanced brackets
	for (var j = 0; j < lines.length; j++) {
		var errPos = Sk.find.unfinishedString(lines[j]);
		if (errPos) {
			Sk.helpout("<br>There's an unterminated string at " + errPos + " on line " + j);
			var fix = Sk.fix.eolInString(lines[j], errPos);
			
			if (fix) {
				lines[j] = fix;
			}
			else {
				// The error could not be fixed
			}
		}
		
		var brackets = Sk.help.findUnbalancedBrackets(lines[j]);
		
		if (!brackets.isvalid) {
			Sk.helpout("<br>Line " + j + " has unbalanced brackets");
			var fix = Sk.fix.unbalancedBrackets(lines[j], brackets);
			
			if (fix !== undefined) {
				lines[j] = fix;
			}
			else {
				// The error could not be fixed
			}
		}
	}
	
	for (i = 0; i < lines.length; ++i) {
		ret = parseFunc(lines[i] + ((i === lines.length - 1) ? "" : "\n"));
	}
	
	// ret is the root node of the completed parse tree
	// Small adjustments here in order to return th flags and the cst
	return {"cst": ret, "flags": parseFunc.p_flags};
	
	/*var brackets = Sk.help.findUnbalancedBrackets(input);
	
	if (!brackets.isvalid) {
		Sk.helpout("Your program has unbalanced brackets");
		Sk.fix.unbalancedBrackets(input, brackets);
		// Throw exception
	} else {
		lines = input.split("\n");
		
		//print("input:"+input);
		

		
		
		
	}*/
};

Sk.parseTreeDump = function parseTreeDump (n, indent) {
    //return JSON.stringify(n, null, 2);
    var i;
    var ret;
    indent = indent || "";
    ret = "";
    ret += indent;
    if (n.type >= 256) { // non-term
        ret += Sk.ParseTables.number2symbol[n.type] + " " + n.children.length + "\n";
        for (i = 0; i < n.children.length; ++i) {
            ret += Sk.parseTreeDump(n.children[i], indent + "  ");
        }
    } else {
        ret += Sk.Tokenizer.tokenNames[n.type] + ": " + new Sk.builtin.str(n.value)["$r"]().v + "\n";
    }
    return ret;
};


goog.exportSymbol("Sk.parse", Sk.parse);
goog.exportSymbol("Sk.parseTreeDump", Sk.parseTreeDump);
