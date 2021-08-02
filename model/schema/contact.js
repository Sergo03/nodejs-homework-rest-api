const { Schema,SchemaTypes } = require("mongoose");

const contactSchema = Schema({
  name: {
    type: String,
    required: [true, 'Set name for contact'],
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  favorite: {
    type: Boolean,
    default: false,
  },
  owner: {
      type: SchemaTypes.ObjectId,
      ref: 'user',
    }
});
  
module.exports = contactSchema;