import mongoose from "mongoose";
const Schema = mongoose.Schema;

//defining schema for "user" database
const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    rules: [{
        type: Schema.Types.ObjectId,
        ref: "Rule"
    }],
}, { timestamps: true });

const User = mongoose.model('NewUserSchema', UserSchema);
export default User;