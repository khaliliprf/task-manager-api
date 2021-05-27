const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./task");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("email is invalid");
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 6,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("password phrase can not be in password");
        }
      },
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error("age must be positive");
        }
      },
    },
    avatar: {
      type: Buffer,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);
//
userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});
///////////////////////////////////
//set middleware for hashing password
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});
//
userSchema.pre("remove", async function (next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

////////////////
userSchema.statics.findByCredentials = async (email, pass) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("login failed");
  }
  const ismatch = await bcrypt.compare(pass, user.password);
  if (!ismatch) {
    throw new Error("login failed");
  }
  return user;
};
//////////////
userSchema.methods.toJSON = function () {
  const user = this;
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.tokens;
  delete userObj.avatar;
  return userObj;
};
userSchema.methods.generateToken = async function () {
  const user = this;
  // const token = jwt.sign({ _id: user._id }, "itsmohammad");
  //there is no need to convert to String but to be ensure that its a standard String we put it
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
  //////////////////////////////////////
  // const array1 = [{ token: "ali" }];
  // const object = { token: "mohammad" };
  // const array3 = array1.concat(object);

  // console.log(array3);
  //output:> Array [Object { token: "ali" }, Object { token: "mohammad" }]
  ///////////////////////////////
  // user.tokens = user.tokens.concat({ token });
  user.tokens.push({ token });
  await user.save();
  return token;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
