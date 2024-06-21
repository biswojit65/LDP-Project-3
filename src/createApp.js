import Fastify from 'fastify'
import { Routes } from './routes/route.js';
import jwt from 'jsonwebtoken';
import fastifyWebsocket from '@fastify/websocket';
const app = Fastify();
// const app = Fastify({ logger: true });

//Registering websocket
app.register(fastifyWebsocket);

//defining preHandler for extracting userID from Json Web Token
app.addHook('preHandler', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) { return; }
    try {
        const token = authHeader.replace("Bearer ", "");
        const decoded = jwt.verify(token, "PrivateKey")
        request.user = decoded.id;
    } catch (e) { 
        console.log(e);
        reply.code(401).send('Unauthorized');
    }
});

//Registering Routes
app.register(Routes, { prefix: '/api' });

export default app;

