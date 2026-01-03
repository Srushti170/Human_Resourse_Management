import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const UserSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    role: {
      type: String,
      enum: ["Employee", "HR", "Admin"],
      default: "Employee",
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
    },

    designation: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    profile: {
      type: Object,
      default: {},
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

//
// ---------- PRE SAVE : HASH PASSWORD ----------
//
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//
// ---------- INSTANCE METHOD : validate password ----------
//
UserSchema.methods.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//
// ---------- INSTANCE METHOD : generate JWT ----------
//
UserSchema.methods.generatejwt = function () {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  return jwt.sign(
    {
      id: this._id,
      username: this.username,
      email: this.email,
      role: this.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES || "1d",
    }
  );
};

const User = mongoose.model("User", UserSchema);
export default User;
