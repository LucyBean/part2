
var input = read('test/unit/test_unpack.py');
print('test/unit/test_unpack.py');
Sk.configure({syspath:["test/unit"], read:read, python3:false});
Sk.importMain("test_unpack", false);
        