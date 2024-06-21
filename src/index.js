import mongoose from "mongoose";
import app from "./createApp.js";

//connecting to mongodb
mongoose.connect('').then(() => {
    console.log('Database connected Successfully')
}).catch((err) => {
    console.error('Error while connecting to database')
    process.exit(1);
})

//App listening at port 3000
app.listen({ port: 3000 }, (err, address) => {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
    console.info(`Server is now listening on ${address}`);
});






