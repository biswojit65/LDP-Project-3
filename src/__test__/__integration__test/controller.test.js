import supertest from 'supertest';
import app from '../../createApp.js';
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

describe('API Testing with Supertest ', () => {
    let server, token, ruleID;

    beforeAll(async () => {
        server = await app.listen({ port: 3000 });
        mongoose.connect('').then(() => {
            console.log('Database connected Successfully')
        }).catch((err) => {
            console.error('Error while connecting to database')
            process.exit(1);
        });
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await app.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('API-Integration Test', () => {

        it('should create a new user', async () => {

            const response = await supertest(server)
                .post('/api/signup')
                .send({
                    email: "test@example.com",
                    username: "test",
                    password: "test"
                });

            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe("User registration Successful");
            expect(response.body.data.user.email).toBe("test@example.com");
            expect(response.body.data.user.username).toBe("test");
        });

        it('should return 200 and a token if login is successful', async () => {
            const response = await supertest(server)
                .post('/api/login')
                .send({
                    username: "test",
                    password: "test"
                });

            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe("Successfully Logged in");
            expect(response.body.data).toHaveProperty("token");
            const decodedToken = jwt.verify(response.body.data.token, 'PrivateKey');
            token = jwt.sign({ id: decodedToken.id }, 'PrivateKey');
            expect(decodedToken).toHaveProperty("id");
        });
        it('should return 200 and create a new rule successfully', async () => {
            const response = await supertest(server)
                .post('/api/newrule')
                .send({
                    rule: "max(30,sumof2(count('a'),count('b')))<=avgof2(sumofallnumberfromstring,min(10,avgof2(avgofallnumberfromstring,10)))"
                })
                .set('Authorization', 'Bearer ' + token);

            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe("Your Rule Successfully Inserted");
            expect(response.body.data.newrule).toHaveProperty("_id");
            ruleID = response.body.data.newrule._id;
        });
        it('should return 200 and process the input string correctly', async () => {
            const response = await supertest(server)
                .post('/api/check')
                .send({
                    inputString: "1abc4 ycvjs 5bjs ks s5bs jsiybsvsjj 4svgfghv 1hdsvfdgh "
                })
                .set('Authorization', 'Bearer ' + token);


            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe("OK");
            expect(response.body.data.resultArray).toEqual([false]);
        });
        it('should return 200 and fetch all rules successfully', async () => {

            const response = await supertest(server)
                .get('/api/getrules')
                .set('Authorization', 'Bearer ' + token);

            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe("Your Rules Successfully Fetched");
            expect(response.body.data.getAllRules).toHaveLength(1);
        });
        it('should return 500 if there are no user of give userID', async () => {
            const tkn = jwt.sign({ id: 'user123' }, 'PrivateKey');
            const response = await supertest(server)
                .get('/api/getrules')
                .set('Authorization', 'Bearer ' + tkn);

            expect(response.statusCode).toBe(500);
        });
        it('should return 200 and update a rule successfully', async () => {
            const response = await supertest(server)
                .put('/api/updaterule')
                .send({
                    ruleID: ruleID,
                    rule: "max(40,sumof2(count('c'),count('x')))<=avgof2(sumofallnumberfromstring,min(15,avgof2(avgofallnumberfromstring,15)))"
                })
                .set('Authorization', 'Bearer ' + token);

            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe("Your Rule Successfully Updated");
        });
        it('should return 200 and delete the rule successfully', async () => {
            const response = await supertest(server)
                .delete('/api/deleterule')
                .send({ ruleID: ruleID })
                .set('Authorization', 'Bearer ' + token);

            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe("The Rule Successfully Deleted");
        });
    })

});