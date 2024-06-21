import User from '../models/user.js';
import Rule from '../models/rule.js';
import bcrypt from 'bcrypt'
import { OPERATION } from '../constants/constant.js';

//Defining various database services
export const Services = {
    //Finding user using email
    findByEmail: async (email) => {
        return await User.findOne({ email })
    },
    //Finding user using username
    findByUserName: async (username) => {
        return await User.findOne({ username })
    },
    //Inserting user data to db
    createUser: async (data) => {
        data.password = bcrypt.hashSync(data.password, 10);
        return await User.create(data);
    },
    //Finding user using _id
    findByUserID: async (userID) => {
        return await User.findOne({ _id: userID })
    },
    //Finding rule using _id
    findByRuleID: async (ruleID) => {
        return await Rule.findOne({ _id: ruleID })
    },
    //Inserting a new rule into db
    createRule: async (data) => {
        return await Rule.create(data);
    },
    //Adding newly created ruleID to "rules" array in user db
    pushRuleToUser: async (userId, ruleID) => {
        return await User.updateOne({ _id: userId }, { $push: { rules: ruleID } });
    },
    //Comparing user given password and our db-stored password during user login
    comparePassword: async (userPassword, password) => {
        const isCompared = await bcrypt.compare(userPassword, password);
        return isCompared;
    },
    //Deleting a rule
    deleteRuleOfUser: async (userId, ruleID) => {
        await Rule.deleteOne({ _id: ruleID });
        return await User.updateOne({ _id: userId }, { $pull: { rules: ruleID } });
    },
    //Updating a rule
    updateRule: async (data, ruleID) => {
        return await Rule.findByIdAndUpdate(ruleID, data, { new: true });
    },
    //Extracting all stored rules
    getAllRulesOfUser: async (data) => {
        return await Rule.find({ user: data });
    },
    //Converting rule string to array of different operation with checking validity
    dsl_parser: (extractedRule) => {
        /*
            operators allowed : ["<","<=",">",">=","=","!="]
            max : maximum between 2 numbers 
            min : minimum between 2 numbers
            sumof2 : sum of 2 numbers 
            avgof2 : avg of 2 numbers 
            count("***") : number of occurances of given string in incoming request string
            sumofallnumberfromstring : sum of all numbers formed from incoming request string
            avgofallnumberfromstring : avg of all numbers formed from incoming request string
        */

        const transformedRule = extractedRule.replaceAll(' ', '').replaceAll('"', '').replaceAll("'", '').replaceAll(",", '-').replaceAll("(", '-').replaceAll(")", '-').toLowerCase();
        const processedArray = [];
        let tempString = "", prevString = "";
        for (let index = 0; index < transformedRule.length; index++) {
            if (transformedRule[index] != '-') {
                tempString += transformedRule[index];
            } else if (tempString != '') {
                if (OPERATION.includes(tempString) || !isNaN(tempString)) {
                    processedArray.push(tempString);
                    prevString = tempString;
                    tempString = "";
                } else if (prevString == 'count') {
                    processedArray[processedArray.length - 1] = processedArray[processedArray.length - 1] + '-' + tempString;
                    prevString = "";
                    tempString = "";
                }
                else return [];
            }
        }
        if (tempString != '') processedArray.push(tempString);
        return processedArray;

    },
    //Checking for balanced paranthesis of recieved rule string
    validParanthesisCheck: (inputString) => {
        const characters = inputString.split('');
        const parentheses = characters.filter(char => char === '(' || char === ')');
        const expressionString = parentheses.join('');
        console.log(expressionString);
        let stack = [];

        for (let i = 0; i < expressionString.length; i++) {
            let x = expressionString[i];
            if (x == '(') {
                stack.push(x);
                continue;
            }
            if (stack.length == 0) return false;
            let check = stack.pop();
        }
        return (stack.length == 0);
    },
    //Extracting the stored rule-array
    findRuleArray: async (userID) => {
        const user = await User.findOne({ _id: userID });
        return user.rules; 
    },
    //Processing the inputString against the stored-rules and returning the processed result 
    processArray: async (operandArray, inputString, totalSum, totalAvg) => {
        const stack = [];
        let flag = 0;

        for (let i1 = 0; i1 < operandArray.length; i1++) {
            let num = 0;
            if (operandArray[i1] == 'max' || operandArray[i1] == 'min' || operandArray[i1] == 'sumof2' || operandArray[i1] == 'avgof2') {
                stack.push(operandArray[i1]);
                flag = 0;
                continue;
            } else if (operandArray[i1].search('-') != -1) {
                const searchString = operandArray[i1].split('-')[1];
                let pos = inputString.indexOf(searchString);
                while (pos !== -1) {
                    num++;
                    pos = inputString.indexOf(searchString, pos + 1);
                }
            } else if (operandArray[i1] == 'sumofallnumberfromstring') {
                num = totalSum;
            } else if (operandArray[i1] == 'avgofallnumberfromstring') {
                num = totalAvg;
            } else {
                num = Number(operandArray[i1]);
            }

            if (flag == 0) {
                stack.push(num);
                flag = 1;
            } else {
                while (stack.length && !isNaN(stack[stack.length - 1])) {
                    let num2 = stack.pop();
                    let operation = stack.pop();
                    switch (operation) {
                        case "max":
                            num = Math.max(num, num2);
                            break;
                        case "min":
                            num = Math.min(num, num2)
                            break;
                        case "sumof2":
                            num = num + num2;
                            break;
                        case "avgof2":
                            num = Math.floor((num + num2) / 2);
                            break;
                    }
                }
                stack.push(num);
                flag = 0;
            }
        }
        return stack[0];
    },
    //Checking validity of rule wheather it is according to our defined format or not
    checkValidity: (operandArray) => {

        const stack = [];
        let flag = 0;

        for (let i1 = 0; i1 < operandArray.length; i1++) {
            let num = 0;
            if (operandArray[i1] == 'max' || operandArray[i1] == 'min' || operandArray[i1] == 'sumof2' || operandArray[i1] == 'avgof2') {
                stack.push(0);
                flag = 0;
            } else if (flag == 0) {
                stack.push(1);
                flag = 1;
            } else {
                while (stack.length && stack[stack.length - 1] == 1) {
                    let num2 = stack.pop();
                    if (!stack.length || stack[0] == '1') return false;
                    let operation = stack.pop();
                    if (operation == 1 || stack[0] == '1') return false;
                }
                stack.push(1);
                flag = 1;
            }
        }
        if (stack.length == 1 && stack[0] == 1) return true;
        return false;

    }
}


