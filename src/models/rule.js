import mongoose from "mongoose";
const Schema = mongoose.Schema;

//defining schema for "rule" database
const RuleSchema = new Schema({
    operand1: [{
        type: String,
        required: true
    }],
    operator: {
        type: String,
        required: true
    },
    operand2: [{
        type: String,
        required: true
    }],
    user: {
        type: Schema.Types.ObjectId,
        ref: "Rule"
    },
}, { timestamps: true });

const Rule = mongoose.model('newRuleSchema', RuleSchema);
export default Rule;