import { Services } from "../services/service.js"
import jwt from "jsonwebtoken";

export const Controller = {
    //Registering new user (signup)
    signup: async (req, res) => {
        try {
            if (await Services.findByEmail(req.body.email) || await Services.findByUserName(req.body.email)) {
                res.code(400);
                return {
                    message: "Username or Email Already Exist ! Go for Login"
                }
            }
            const user = await Services.createUser(req.body);
            res.code(200);
            return {
                message: "User registration Successful",
                data: { user }
            }
        } catch (err) {
            res.code(500);
            return { err: err.message };
        }
    },
    //Login user
    login: async (req, res) => {
        try {
            const user = await Services.findByUserName(req.body.username);
            if (!user) {
                res.code(400)
                return {
                    message: "User not exist ! Go for Signup First",
                }
            }
            const isSame = await Services.comparePassword(req.body.password, user.password);
            if (!isSame) {
                res.code(400)
                return {
                    message: "Login Details are incorrect",
                }
            }
            const token = jwt.sign({ id: user._id }, 'PrivateKey');
            res.code(200);
            return {
                message: "Successfully Logged in",
                data: {
                    token
                }
            }
        } catch (err) {
            res.code(500);
            return { err: err.message };
        }
    },
    //Creating a new Rule
    newrule: async (req, res) => {
        try {
            const ruleString = req.body.rule;
            const regex = /(<|<=|>|>=|=|!=)/;
            const index = ruleString.search(regex);

            if (index == -1 || (index + 1) >= ruleString.length || !Services.validParanthesisCheck(ruleString)) {
                throw new Error('Rule is not in format');
            }

            let operator = ruleString[index];
            let operand1 = ruleString.substring(0, index);
            let operand2 = ruleString.substring(index + 1);
            if (operand2[0] == '=') {
                operand2 = operand2.replace('=', '');
                operator += '=';
            }

            const operand1Array = Services.dsl_parser(operand1);
            const operand2Array = Services.dsl_parser(operand2);

            console.log(operand1Array);
            console.log(operand2Array);
            console.log(operator);
            console.log(Services.checkValidity(operand1Array));
            console.log(Services.checkValidity(operand2Array));

            if (!operand1Array.length || !operand2Array.length || operator == '' || !Services.checkValidity(operand1Array) || !Services.checkValidity(operand2Array)) {
                throw new Error('Invalid Rule');
            }

            const user = await Services.findByUserID(req.user);
            const newrule = await Services.createRule({ user: req.user, operand1: operand1Array, operand2: operand2Array, operator });
            const pushRule = await Services.pushRuleToUser(user._id, newrule._id);

            return {
                message: "Your Rule Successfully Inserted",
                data: {
                    newrule
                }
            }
        } catch (err) {
            res.code(500);
            //console.log(err.message);
            return { message: err.message };
        }
    },
    //Getting all stored-rules for a logged-in user
    getrules: async (req, res) => {
        try {
            const getAllRules = await Services.getAllRulesOfUser(req.user);
            return {
                message: "Your Rules Successfully Fetched",
                data: {
                    getAllRules
                }
            }
        } catch (err) {
            res.code(500);
            return { err: err.message };
        }
    },
    //Updating a rule
    updaterule: async (req, res) => {

        try {
            const ruleString = req.body.rule;
            const regex = /(<|<=|>|>=|=|!=)/;
            const index = ruleString.search(regex);

            if (index == -1 || (index + 1) >= ruleString.length || !Services.validParanthesisCheck(ruleString)) {
                throw new Error('Rule is not in format');
            }

            let operator = ruleString[index];
            let operand1 = ruleString.substring(0, index);
            let operand2 = ruleString.substring(index + 1);
            if (operand2[0] == '=') {
                operand2 = operand2.replace('=', '');
                operator += '=';
            }

            const operand1Array = Services.dsl_parser(operand1);
            const operand2Array = Services.dsl_parser(operand2);

            console.log(operand1Array);
            console.log(operand2Array);
            console.log(operator);

            if (!operand1Array.length || !operand2Array.length || operator == '' || !Services.checkValidity(operand1Array) || !Services.checkValidity(operand2Array)) {
                throw new Error('Invalid Rule');
            }


            const updatedrule = await Services.updateRule({ operand1: operand1Array, operand2: operand2Array, operator }, req.body.ruleID);

            return {
                message: "Your Rule Successfully Updated",
                data: {
                    updatedrule
                }
            }
        } catch (err) {
            res.code(500);
            return { message: err.message };
        }
    },
    //Deleting a rule
    deleterule: async (req, res) => {
        try {
            const rule = await Services.findByRuleID(req.body.ruleID);
            if (!rule || rule.user != req.user) {
                res.code(400);
                return {
                    message: "Either Rule not Exist or the rule doesn't belongs to the User",
                }
            }
            const ruleDeleted = await Services.deleteRuleOfUser(req.user, req.body.ruleID);
            return {
                message: "The Rule Successfully Deleted",
                data: ruleDeleted
            }
        } catch (err) {
            res.code(500);
            return { err: err.message };
        }
    },
    //Processing the strings array recieved through web-socket
    socketHandler: (socket, req) => {
        let authenticated = false;
        let userID = "";

        socket.on('message', async (message) => {
            const data = JSON.parse(message);
            console.log(data);

            if (data.type === 'auth') {
                const token = data.token;

                if (!token) {
                    socket.send(JSON.stringify({ type: 'auth', success: false, message: 'No token provided' }));
                    socket.close(4001, 'Unauthorized: No token provided');
                    return;
                }

                jwt.verify(token, "PrivateKey", (err, decoded) => {
                    if (err) {
                        socket.send(JSON.stringify({ type: 'auth', success: false, message: 'Invalid token' }));
                        socket.close(4002, 'Unauthorized: Invalid token');
                        return;
                    }

                    authenticated = true;
                    userID = decoded.id;
                    console.log('WebSocket connection authorized for user:', decoded);
                    socket.send(JSON.stringify({ type: 'auth', success: true }));
                });
            } else {
                if (!authenticated) {
                    socket.close(4003, 'Unauthorized: Authentication required');
                    return;
                }
                try {
                    const data = JSON.parse(message.toString());
                    const finalArr = [];

                    if (Array.isArray(data)) {
                        console.log('Processing array:', data);
                        for (let index = 0; index < data.length; index++) {
                            const inputString = data[index];
                            const ruleArray = await Services.findRuleArray(userID);
                            let totalSum = 0, totalNumber = 0, tempNumber = "", totalAvg = 0;
                            for (let index = 0; index < inputString.length; index++) {
                                if (!isNaN(parseInt(inputString[index]))) {
                                    tempNumber += inputString[index];
                                } else if (tempNumber != '') {
                                    totalSum += Number(tempNumber);
                                    totalNumber += 1;
                                    tempNumber = "";
                                }
                            }
                            if (tempNumber != '') {
                                totalSum += Number(tempNumber);
                                totalNumber += 1;
                                tempNumber = "";
                            }
                            totalAvg = Math.floor(totalSum / totalNumber);
                            const resultArray = [];

                            for (let index = 0; index < ruleArray.length; index++) {
                                const ruleID = ruleArray[index];
                                const rule = await Services.findByRuleID(ruleID);
                                const operand1Array = rule.operand1;
                                const operator = rule.operator;
                                const operand2Array = rule.operand2;
                                const result1 = await Services.processArray(operand1Array, inputString, totalSum, totalAvg);
                                const result2 = await Services.processArray(operand2Array, inputString, totalSum, totalAvg);
                                console.log(result1, result2);
                                let flag = 0;

                                switch (operator) {
                                    case '<': if (result1 < result2) flag = 1;
                                        break;
                                    case '<=': if (result1 <= result2) flag = 1;
                                        break;
                                    case '>': if (result1 > result2) flag = 1;
                                        break;
                                    case '>=': if (result1 >= result2) flag = 1;
                                        break;
                                    case '=': if (result1 == result2) flag = 1;
                                        break;
                                    case '!=': if (result1 != result2) flag = 1;
                                        break;
                                }

                                if (flag) resultArray.push(true);
                                else resultArray.push(false);
                            }
                            finalArr.push(resultArray);
                        }
                        console.log(finalArr);
                        socket.send(JSON.stringify(finalArr));
                    } else {
                        socket.send(JSON.stringify(finalArr));
                        console.error('Invalid data format: expected an array');
                    }
                } catch (err) {
                    console.error('Failed to parse message:', err);
                }
            }
        });

        socket.on('close', () => {
            console.log('WebSocket connection closed');
        });
    },
    //Handling the API request to process the strings array recieved through api-request-bpdy
    userRequest: async (req, res) => {
        try {
            const ruleArray = await Services.findRuleArray(req.user);
            const inputString = req.body.inputString;
            let totalSum = 0, totalNumber = 0, tempNumber = "", totalAvg = 0;
            for (let index = 0; index < inputString.length; index++) {
                if (!isNaN(parseInt(inputString[index]))) {
                    tempNumber += inputString[index];
                } else if (tempNumber != '') {
                    totalSum += Number(tempNumber);
                    totalNumber += 1;
                    tempNumber = "";
                }
            }
            if (tempNumber != '') {
                totalSum += Number(tempNumber);
                totalNumber += 1;
                tempNumber = "";
            }
            totalAvg = Math.floor(totalSum / totalNumber);
            const resultArray = [];

            for (let index = 0; index < ruleArray.length; index++) {
                const ruleID = ruleArray[index];
                const rule = await Services.findByRuleID(ruleID);
                const operand1Array = rule.operand1;
                const operator = rule.operator;
                const operand2Array = rule.operand2;
                const result1 = await Services.processArray(operand1Array, inputString, totalSum, totalAvg);
                const result2 = await Services.processArray(operand2Array, inputString, totalSum, totalAvg);
                let flag = 0;

                switch (operator) {
                    case '<': if (result1 < result2) flag = 1;
                        break;
                    case '<=': if (result1 <= result2) flag = 1;
                        break;
                    case '>': if (result1 > result2) flag = 1;
                        break;
                    case '>=': if (result1 >= result2) flag = 1;
                        break;
                    case '=': if (result1 == result2) flag = 1;
                        break;
                    case '!=': if (result1 != result2) flag = 1;
                        break;
                }
                if (flag) resultArray.push(true);
                else resultArray.push(false);
            }
            return {
                message: "OK",
                data: {
                    resultArray
                }
            }
        } catch (err) {
            res.code(500);
            return { err: err.message };
        }
    }
}