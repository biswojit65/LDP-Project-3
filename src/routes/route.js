import { Controller } from "../controllers/controller.js";

//Defining routes for differnt actions
export const Routes = async (fastify, _opts) => {
    fastify.post('/signup', Controller.signup);
    fastify.post('/login', Controller.login);
    fastify.post('/newrule', Controller.newrule);
    fastify.get('/getrules', Controller.getrules);
    fastify.put('/updaterule', Controller.updaterule);
    fastify.delete('/deleterule', Controller.deleterule);
    fastify.post('/check', Controller.userRequest);
    fastify.get('/websocket', { websocket: true }, Controller.socketHandler);
}