import supertest from 'supertest';
import app from '../../createApp.js';
import jwt from "jsonwebtoken";
import * as Services from '../../services/service.js';

jest.mock('../../services/service.js', () => ({
  Services: {
    findByEmail: jest.fn(),
    findByUserName: jest.fn(),
    createUser: jest.fn(),
    findByUserName: jest.fn(),
    comparePassword: jest.fn(),
    validParanthesisCheck: jest.fn(),
    dsl_parser: jest.fn(),
    checkValidity: jest.fn(),
    findByUserID: jest.fn(),
    createRule: jest.fn(),
    pushRuleToUser: jest.fn(),
    getAllRulesOfUser: jest.fn(),
    deleteRuleOfUser: jest.fn(),
    findByRuleID: jest.fn(),
    findRuleArray: jest.fn(),
    processArray: jest.fn(),
    findByRuleID: jest.fn(),
    updateRule: jest.fn()
  }
}));

const mockedService = jest.mocked(Services);

describe('API Testing with Supertest ', () => {

  let server, token;

  beforeAll(async () => {
    server = await app.listen({ port: 3000 });
    token = jwt.sign({ id: 'user123' }, 'PrivateKey');
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('API Testing with Supertest - signup functionality', () => {

    it('should return 401 for unauthorized user', async () => {
      
      const tkn = jwt.sign({ id: 'user123' }, 'privaeKe');
      const response = await supertest(server)
        .post('/api/signup')
        .send({
          email: "test@example.com",
          username: "testuser",
          password: "password123"
        }).set('Authorization', 'Bearer ' + tkn);

      expect(response.statusCode).toBe(401);
      expect(response.text).toBe("Unauthorized");
    });

    it('should return 400 if email or username already exists', async () => {
      mockedService.Services.findByEmail.mockResolvedValue({ email: "bis@gmail.com" });
      mockedService.Services.findByUserName.mockResolvedValue({ username: "testuser" });

      const response = await supertest(server)
        .post('/api/signup')
        .send({
          email: "test@example.com",
          username: "testuser",
          password: "password123"
        }).set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("Username or Email Already Exist ! Go for Login");
    });

    it('should return 400 if username already exists', async () => {
      mockedService.Services.findByEmail.mockResolvedValue(null);
      mockedService.Services.findByUserName.mockResolvedValue({ username: "testuser" });

      const response = await supertest(server)
        .post('/api/signup')
        .send({
          email: "test@example.com",
          username: "testuser",
          password: "password123"
        }).set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("Username or Email Already Exist ! Go for Login");
    });

    it('should return 200 and register the user successfully', async () => {
      mockedService.Services.findByEmail.mockResolvedValue(null);
      mockedService.Services.findByUserName.mockResolvedValue(null);
      mockedService.Services.createUser.mockResolvedValue({
        email: "test@example.com",
        username: "testuser",
        password: "hashedpassword"
      });

      const response = await supertest(server)
        .post('/api/signup')
        .send({
          email: "test@example.com",
          username: "testuser",
          password: "password123"
        }).set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("User registration Successful");
      expect(response.body.data.user.email).toBe("test@example.com");
      expect(response.body.data.user.username).toBe("testuser");
    });

    it('should return 500 on server error', async () => {
      mockedService.Services.findByEmail.mockRejectedValue(new Error("Database error"));

      const response = await supertest(server)
        .post('/api/signup')
        .send({
          email: "test@example.com",
          username: "testuser",
          password: "password123"
        }).set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(500);
      expect(response.body.err).toBe("Database error");
    });
  })

  describe('API Testing with Supertest - login functionality', () => {

    it('should return 400 if user does not exist', async () => {
      mockedService.Services.findByUserName.mockResolvedValue(null);

      const response = await supertest(server)
        .post('/api/login')
        .send({
          username: "nonexistentuser",
          password: "password123"
        }).set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("User not exist ! Go for Signup First");
    });

    it('should return 400 if password is incorrect', async () => {
      mockedService.Services.findByUserName.mockResolvedValue({
        username: "testuser",
        password: "hashedpassword"
      });
      mockedService.Services.comparePassword.mockResolvedValue(false);

      const response = await supertest(server)
        .post('/api/login')
        .send({
          username: "testuser",
          password: "wrongpassword"
        }).set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("Login Details are incorrect");
    });

    it('should return 200 and a token if login is successful', async () => {
      mockedService.Services.findByUserName.mockResolvedValue({
        _id: "userId123",
        username: "testuser",
        password: "hashedpassword"
      });
      mockedService.Services.comparePassword.mockResolvedValue(true);

      const response = await supertest(server)
        .post('/api/login')
        .send({
          username: "testuser",
          password: "correctpassword"
        }).set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Successfully Logged in");
      expect(response.body.data).toHaveProperty("token");

      const decodedToken = jwt.verify(response.body.data.token, 'PrivateKey');
      expect(decodedToken).toHaveProperty("id", "userId123");
    });

    it('should return 500 if there is a server error', async () => {
      mockedService.Services.findByUserName.mockRejectedValue(new Error("Database error"));

      const response = await supertest(server)
        .post('/api/login')
        .send({
          username: "testuser",
          password: "password123"
        }).set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(500);
      expect(response.body.err).toBe("Database error");
    });
  });

  describe('API Testing with Supertest - newrule functionality', () => {

    it('should return 200 and create a new rule successfully', async () => {
      mockedService.Services.validParanthesisCheck.mockReturnValue(true);
      mockedService.Services.dsl_parser.mockReturnValueOnce(['max', '21', 'sumof2', 'count-a', '17']).mockReturnValueOnce(['avgof2', 'sumofallnumberfromstring', 'min', '10', 'avgof2', 'count-b', '30']);
      mockedService.Services.checkValidity.mockReturnValue(true);
      mockedService.Services.findByUserID.mockResolvedValue({ _id: 'userId123' });
      mockedService.Services.createRule.mockResolvedValue({ _id: 'ruleId123' });
      mockedService.Services.pushRuleToUser.mockResolvedValue({ success: true });

      const response = await supertest(server)
        .post('/api/newrule')
        .send({
          rule: "max(21,sumof2(count('a'),17))<=avgof2(sumofallnumberfromstring,min(10,avgof2(count('b'),30))"
        })
        .set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Your Rule Successfully Inserted");
      expect(response.body.data.newrule).toEqual({ _id: 'ruleId123' });
    });

    it('should return 500 if the rule does not have a valid operator', async () => {
      mockedService.Services.validParanthesisCheck.mockReturnValue(true);

      const response = await supertest(server)
        .post('/api/newrule')
        .send({
          rule: "count('a') * 10"
        })
        .set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe('Rule is not in format');
    });

    it('should return 500 if the rule has unbalanced parentheses', async () => {
      mockedService.Services.validParanthesisCheck.mockReturnValue(false);

      const response = await supertest(server)
        .post('/api/newrule')
        .send({
          rule: "count('a')) > (10"
        })
        .set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe('Rule is not in format');
    });

    it('should return 500 if operands are not parsable', async () => {
      mockedService.Services.validParanthesisCheck.mockReturnValue(true);
      mockedService.Services.dsl_parser.mockReturnValue([]);
      mockedService.Services.checkValidity.mockReturnValue(true);

      const response = await supertest(server)
        .post('/api/newrule')
        .send({
          rule: "count('a') > 10"
        })
        .set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe('Invalid Rule');
    });

    it('should return 500 if operands are invalid', async () => {
      mockedService.Services.validParanthesisCheck.mockReturnValue(true);
      mockedService.Services.dsl_parser.mockReturnValue(['operand']);
      mockedService.Services.checkValidity.mockReturnValue(false);

      const response = await supertest(server)
        .post('/api/newrule')
        .send({
          rule: "count('a') > 10"
        })
        .set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe('Invalid Rule');
    });

    it('should return 500 if user is not found', async () => {
      mockedService.Services.validParanthesisCheck.mockReturnValue(true);
      mockedService.Services.dsl_parser.mockReturnValue(['count-a', '10']);
      mockedService.Services.checkValidity.mockReturnValue(true);
      mockedService.Services.findByUserID.mockResolvedValue(null);

      const response = await supertest(server)
        .post('/api/newrule')
        .send({
          rule: "count('a') > 10"
        })
        .set('user', 'nonexistentUserId')
        .set('Authorization', 'Bearer ' + token)

      expect(response.statusCode).toBe(500);
    });

    it('should return 500 if there is an error during rule creation', async () => {
      mockedService.Services.validParanthesisCheck.mockReturnValue(true);
      mockedService.Services.dsl_parser.mockReturnValue(['count-a', '10']);
      mockedService.Services.checkValidity.mockReturnValue(true);
      mockedService.Services.findByUserID.mockResolvedValue({ _id: 'userId123' });
      mockedService.Services.createRule.mockRejectedValue(new Error('Database error'));

      const response = await supertest(server)
        .post('/api/newrule')
        .send({
          rule: "count('a') > 10"
        })
        .set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe('Database error');
    });
  });
  describe('API Testing with Supertest - getrules functionality', () => {

    it('should return 200 and fetch all rules successfully', async () => {
      mockedService.Services.getAllRulesOfUser.mockResolvedValue([
        { id: 1, rule: "Rule 1" },
        { id: 2, rule: "Rule 2" }
      ]);

      const response = await supertest(server)
        .get('/api/getrules')
        .set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Your Rules Successfully Fetched");
      expect(response.body.data.getAllRules).toHaveLength(2);
      expect(response.body.data.getAllRules[0]).toEqual({ id: 1, rule: "Rule 1" });
      expect(response.body.data.getAllRules[1]).toEqual({ id: 2, rule: "Rule 2" });
    });

    it('should return 200 and an empty array if no rules are found', async () => {
      mockedService.Services.getAllRulesOfUser.mockResolvedValue([]);

      const response = await supertest(server)
        .get('/api/getrules')
        .set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Your Rules Successfully Fetched");
      expect(response.body.data.getAllRules).toHaveLength(0);
    });

    it('should return 500 if there is a server error', async () => {
      mockedService.Services.getAllRulesOfUser.mockRejectedValue(new Error("Database error"));

      const response = await supertest(server)
        .get('/api/getrules')
        .set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(500);
      expect(response.body.err).toBe("Database error");
    });

  });
  describe('API Testing with Supertest - updaterule functionality', () => {

    it('should return 200 and update rule successfully', async () => {
      mockedService.Services.validParanthesisCheck.mockReturnValue(true);
      mockedService.Services.dsl_parser.mockReturnValueOnce(['max', '21', 'sumof2', 'count-a', '17']).mockReturnValueOnce(['avgof2', 'sumofallnumberfromstring', 'min', '10', 'avgof2', 'count-b', '30']);
      mockedService.Services.checkValidity.mockReturnValue(true);
      mockedService.Services.updateRule.mockResolvedValue({ success: true });

      const response = await supertest(server)
        .put('/api/updaterule')
        .send({
          ruleID: 123,
          rule: "max(21,sumof2(count('a'),17))<=avgof2(sumofallnumberfromstring,min(10,avgof2(count('b'),30))"
        })
        .set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Your Rule Successfully Updated");
      expect(response.body.data.updatedrule).toEqual({ success: true });
    });

    it('should return 500 if the rule does not have a valid operator', async () => {
      mockedService.Services.validParanthesisCheck.mockReturnValue(true);

      const response = await supertest(server)
        .put('/api/updaterule')
        .send({
          ruleID: 123,
          rule: "count('a') * 10"
        })
        .set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe('Rule is not in format');
    });

    it('should return 500 if the rule has unbalanced parentheses', async () => {
      mockedService.Services.validParanthesisCheck.mockReturnValue(false);

      const response = await supertest(server)
        .put('/api/updaterule')
        .send({
          ruleID: 123,
          rule: "count('a')) > (10"
        })
        .set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe('Rule is not in format');
    });

    it('should return 500 if operands are not parsable', async () => {
      mockedService.Services.validParanthesisCheck.mockReturnValue(true);
      mockedService.Services.dsl_parser.mockReturnValue([]);
      mockedService.Services.checkValidity.mockReturnValue(true);

      const response = await supertest(server)
        .put('/api/updaterule')
        .send({
          ruleID: 123,
          rule: "count('a') > 10"
        })
        .set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe('Invalid Rule');
    });

    it('should return 500 if operands are invalid', async () => {
      mockedService.Services.validParanthesisCheck.mockReturnValue(true);
      mockedService.Services.dsl_parser.mockReturnValue(['operand']);
      mockedService.Services.checkValidity.mockReturnValue(false);

      const response = await supertest(server)
        .put('/api/updaterule')
        .send({
          ruleID: 123,
          rule: "sumof2('a') > 10"
        })
        .set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe('Invalid Rule');
    });

    it('should return 500 if error occure in database updation', async () => {
      mockedService.Services.validParanthesisCheck.mockReturnValue(true);
      mockedService.Services.dsl_parser.mockReturnValue(['count-a', '10']);
      mockedService.Services.checkValidity.mockReturnValue(true);
      mockedService.Services.updateRule.mockRejectedValue(new Error('Database error'));

      const response = await supertest(server)
        .put('/api/updaterule')
        .send({
          ruleID: 123,
          rule: "count('a') > 10"
        })
        .set('user', 'nonexistentUserId')
        .set('Authorization', 'Bearer ' + token)

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe('Database error');
    });

  });
  describe('API Testing with Supertest - deleterule functionality', () => {

    it('should return 200 and delete the rule successfully', async () => {
      mockedService.Services.findByRuleID.mockResolvedValue({ ruleID: "rule123", user: "user123" });
      mockedService.Services.deleteRuleOfUser.mockResolvedValue({ ruleID: "rule123", message: "Deleted" });

      const response = await supertest(server)
        .delete('/api/deleterule')
        .send({ ruleID: "rule123" })
        .set('Authorization', 'Bearer ' + token)
        .set('user', 'user123');

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("The Rule Successfully Deleted");
      expect(response.body.data).toEqual({ ruleID: "rule123", message: "Deleted" });
    });

    it('should return 400 if the rule does not exist', async () => {
      mockedService.Services.findByRuleID.mockResolvedValue(null);

      const response = await supertest(server)
        .delete('/api/deleterule')
        .send({ ruleID: "rule123" })
        .set('Authorization', 'Bearer ' + token)
        .set('user', 'user123');

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("Either Rule not Exist or the rule doesn't belongs to the User");
    });

    it('should return 400 if the rule does not belong to the user', async () => {
      mockedService.Services.findByRuleID.mockResolvedValue({ ruleID: "rule123", user: "differentUser" });

      const response = await supertest(server)
        .delete('/api/deleterule')
        .send({ ruleID: "rule123" })
        .set('Authorization', 'Bearer ' + token)
        .set('user', 'user123');

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("Either Rule not Exist or the rule doesn't belongs to the User");
    });

    it('should return 500 if there is a server error', async () => {
      mockedService.Services.findByRuleID.mockRejectedValue(new Error("Database error"));

      const response = await supertest(server)
        .delete('/api/deleterule')
        .send({ ruleID: "rule123" })
        .set('Authorization', 'Bearer ' + token)
        .set('user', 'user123');

      expect(response.statusCode).toBe(500);
      expect(response.body.err).toBe("Database error");
    });
  });

  describe('API Testing with Supertest - check functionality', () => {

    it('should return 200 and process the input string correctly', async () => {
      mockedService.Services.findRuleArray.mockResolvedValue(['1', '2']);
      mockedService.Services.findByRuleID.mockImplementation((ruleID) => {
        return { operand1: ["max", "count-a", "count-b"], operator: '>=', operand2: ["min", "5", "sumof2", "count-c", "2"] };
      });
      mockedService.Services.processArray.mockResolvedValueOnce(10).mockResolvedValueOnce(5).mockResolvedValueOnce(15).mockResolvedValueOnce(14);

      const response = await supertest(server)
        .post('/api/check')
        .send({
          inputString: "123abc456 ycvjs 5bjs ks s5bs jsi78ybsvsjj 234svgfghv 41hdsvfdgh "
        })
        .set('Authorization', 'Bearer ' + token);


      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("OK");
      expect(response.body.data.resultArray).toEqual([true, true]);
    });

    it('should return 200 and handle no digits in input string', async () => {
      mockedService.Services.findRuleArray.mockResolvedValue(['1']);
      mockedService.Services.findByRuleID.mockImplementation((ruleID) => {
        return { operand1: ["max", "count-a", "count-b"], operator: '>=', operand2: ["min", "5", "sumof2", "count-c", "2"] };
      });
      mockedService.Services.processArray.mockResolvedValueOnce(10).mockResolvedValueOnce(11);

      const response = await supertest(server)
        .post('/api/check')
        .send({
          inputString: "abc"
        })
        .set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("OK");
      expect(response.body.data.resultArray).toEqual([false]);
    });

    it('should return 500 if there is a server error', async () => {
      mockedService.Services.findRuleArray.mockRejectedValue(new Error("Database error"));

      const response = await supertest(server)
        .post('/api/check')
        .send({
          inputString: "123abc"
        })
        .set('Authorization', 'Bearer ' + token);

      expect(response.statusCode).toBe(500);
      expect(response.body.err).toBe("Database error");
    });
  });
});



