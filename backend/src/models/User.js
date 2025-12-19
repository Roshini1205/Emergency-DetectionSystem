import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    emergencyContacts: {
      type: [
        {
          name: { type: String, trim: true },
          email: { type: String, required: true, lowercase: true, trim: true },
          phone: { type: String, required: true, trim: true },
        },
      ],
      default: [],
    },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});

export default mongoose.model('User', userSchema);