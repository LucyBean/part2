with open('turtle.js','r') as f1, open('compiledTurtle.js','w') as f2:
    f2.write('\t\t\"src/lib/turtle.js": ')
    f2.write('\"')

    for line in f1:
        a = ''

        #escape character processing
        for char in line:
            if (char == '\n'):
                a += '\\n'
            elif (char == '\"'):
                a += '\\"'
            elif (char == '\t'):
                a += '\\t'
            elif (char == '\d'):
                a += '\\d'
            elif (char == '\\'):
                a += '\\\\'
            elif (char == '\s'):
                a += '\\s'
            else:
                a += char
        f2.write(a)

    f2.write('\",')
