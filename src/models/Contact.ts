//create contact model for mongodb
import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt";

export interface IContact extends Document {
  name: String;
  message: String;
  services: String;
  email: String;
  unique_id: String;
}


const contactSchema = new Schema<IContact>(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    unique_id: { type: String, required: true, unique: true },
    services: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Contact: Model<IContact> = mongoose.model('contacts', contactSchema)//, 'auth_service_database');
export default Contact;


