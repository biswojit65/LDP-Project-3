
import { Services } from '../../services/service.js';

describe('dsl_parser', () => {

    test('parses basic operators and functions', () => {
        const input = "max(min(count('a'),sumof2(3,5)),avgof2(sumofallnumberfromstring,avgofallnumberfromstring))";
        const expectedOutput = ['max', 'min', 'count-a', 'sumof2', '3', '5', 'avgof2', 'sumofallnumberfromstring', 'avgofallnumberfromstring'];
        expect(Services.dsl_parser(input)).toEqual(expectedOutput);
    });

    test('the operation is not listed in OPERATION array', () => {
        const input = "max(min(count('a'),sumof(3,5)),avgof2(sumofallnumberfromstring,avgofallnumberfromstring))";
        const expectedOutput = [];
        expect(Services.dsl_parser(input)).toEqual(expectedOutput);
    });

    test('handles spaces and case insensitivity', () => {
        const input = "MAx(mIN(    COunt('a'),sumof2(3,5)),    AVGOf2(sumofallnumberfromSTring,      avgofallnumberfromstring))";
        const expectedOutput = ['max', 'min', 'count-a', 'sumof2', '3', '5', 'avgof2', 'sumofallnumberfromstring', 'avgofallnumberfromstring'];
        expect(Services.dsl_parser(input)).toEqual(expectedOutput);
    });

    test('handles empty input', () => {
        const input = "";
        const expectedOutput = [];
        expect(Services.dsl_parser(input)).toEqual(expectedOutput);
    });

});

describe('validParanthesisCheck', () => {

    test('should return true for balanced parentheses', () => {
        const input = '()';
        expect(Services.validParanthesisCheck(input)).toBe(true);
    });

    test('should return false for unbalanced parentheses', () => {
        const input = '(';
        expect(Services.validParanthesisCheck(input)).toBe(false);
    });

    test('should return false for unbalanced closing parentheses', () => {
        const input = ')';
        expect(Services.validParanthesisCheck(input)).toBe(false);
    });

    test('should return true for nested balanced parentheses', () => {
        const input = '(())';
        expect(Services.validParanthesisCheck(input)).toBe(true);
    });

    test('should return false for nested unbalanced parentheses', () => {
        const input = '(()';
        expect(Services.validParanthesisCheck(input)).toBe(false);
    });

    test('should return false for complex unbalanced parentheses', () => {
        const input = '((())';
        expect(Services.validParanthesisCheck(input)).toBe(false);
    });

    test('should return true for complex balanced parentheses', () => {
        const input = '(()())';
        expect(Services.validParanthesisCheck(input)).toBe(true);
    });

    test('should return false for mismatched parentheses', () => {
        const input = ')(()';
        expect(Services.validParanthesisCheck(input)).toBe(false);
    });

    test('should return true for balanced parentheses with other characters', () => {
        const input = 'a(b)c(d)e';
        expect(Services.validParanthesisCheck(input)).toBe(true);
    });

    test('should return false for unbalanced parentheses with other characters', () => {
        const input = 'a(b(c)d)e)';
        expect(Services.validParanthesisCheck(input)).toBe(false);
    });

    test('should return true for empty input string', () => {
        const input = '';
        expect(Services.validParanthesisCheck(input)).toBe(true);
    });

    test('should return true for string without parentheses', () => {
        const input = 'abcd';
        expect(Services.validParanthesisCheck(input)).toBe(true);
    });

    test('should return true for multiple sets of balanced parentheses', () => {
        const input = '()()';
        expect(Services.validParanthesisCheck(input)).toBe(true);
    });

    test('should return false for multiple sets of unbalanced parentheses', () => {
        const input = '())(';
        expect(Services.validParanthesisCheck(input)).toBe(false);
    });

    test('should return true for interleaved balanced parentheses', () => {
        const input = '((a)b(c)d)e';
        expect(Services.validParanthesisCheck(input)).toBe(true);
    });

    test('should return false for interleaved unbalanced parentheses', () => {
        const input = '((a)b(c)de';
        expect(Services.validParanthesisCheck(input)).toBe(false);
    });

    test('should return true for long balanced parentheses string', () => {
        const input = '((((((()))))))';
        expect(Services.validParanthesisCheck(input)).toBe(true);
    });

    test('should return false for long unbalanced parentheses string', () => {
        const input = '((((((())))';
        expect(Services.validParanthesisCheck(input)).toBe(false);
    });

});

describe('checkValidity', () => {

    test('should return true', () => {
        const operandArray = ['max', 'min', 'count-a', 'sumof2', '3', '5', 'avgof2', 'sumofallnumberfromstring', 'avgofallnumberfromstring'];
        expect(Services.checkValidity(operandArray)).toBe(true);
    });

    test('should return false', () => {
        const operandArray = ['max', 'min', 'count-a', 'sumof2', '3', '5', '7', 'avgof2', 'sumofallnumberfromstring', 'avgofallnumberfromstring'];
        expect(Services.checkValidity(operandArray)).toBe(false);
    });

    test('should return false', () => {
        const operandArray = ['max', 'min', 'count-a', 'sumof2', '3', '5', 'avgof2', 'sumofallnumberfromstring', 'avgofallnumberfromstring', 'avgof2'];
        expect(Services.checkValidity(operandArray)).toBe(false);
    });

    test('should return false', () => {
        const operandArray = ['max', 'min', 'count-a', 'sumof2', '3', '5', 'sumofallnumberfromstring', 'sumofallnumberfromstring', 'avgofallnumberfromstring'];
        expect(Services.checkValidity(operandArray)).toBe(false);
    });

    test('should return true', () => {
        const operandArray = ['sumof2', 'min', 'count-a', 'sumof2', '3', '5', 'avgof2', 'sumofallnumberfromstring', 'avgofallnumberfromstring'];
        expect(Services.checkValidity(operandArray)).toBe(true);
    });

    test('should return true', () => {
        const operandArray = ['avgof2', 'sumof2', '1', '2', '3'];
        expect(Services.checkValidity(operandArray)).toBe(true);
    });

    test('should return false ', () => {
        const operandArray = ['1', 'sumof2', '2'];
        expect(Services.checkValidity(operandArray)).toBe(false);
    });

    test('should return true', () => {
        const operandArray = ['sumof2', 'max', '1', '2', '3'];
        expect(Services.checkValidity(operandArray)).toBe(true);
    });
});


describe('processArray', () => {

    test('processes max operation correctly', async () => {
        const operandArray = ['max', 'min', 'count-a', 'sumof2', '3', '5', 'avgof2', 'sumofallnumberfromstring', 'avgofallnumberfromstring'];
        const inputString = 'abc 23eft fata4s2van bis23woj1t @175sed2xc';
        const result = await Services.processArray(operandArray, inputString, 230, 32);
        expect(result).toBe(131);
    });

    test('processes max operation correctly', async () => {
        const operandArray = ['max', '1', '2'];
        const inputString = 'abc 23eft fata4s2van bis23woj1t @175sed2xc';
        const result = await Services.processArray(operandArray, inputString, 0, 0);
        expect(result).toBe(2);
    });

    test('processes sumof operation correctly', async () => {
        const operandArray = ['sumof2', '1', '2'];
        const inputString = 'abc 23eft fata4s2van bis23woj1t @175sed2xc';
        const result = await Services.processArray(operandArray, inputString, 0, 0);
        expect(result).toBe(3);
    });

    test('processes count operation correctly', async () => {
        const operandArray = ['count-aa'];
        const inputString = 'aaaaa aa aaa';
        const result = await Services.processArray(operandArray, inputString, 0, 0);
        expect(result).toBe(7);
    });

    test('processes count operation correctly', async () => {
        const operandArray = ['sumof2', '5', 'avgof2', '6', 'count-b'];
        const inputString = 'abcabcabc';
        const result = await Services.processArray(operandArray, inputString, 0, 0);
        expect(result).toBe(9);
    });

});



