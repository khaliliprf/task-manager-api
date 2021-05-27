const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/user");

const router = new express.Router();
const auth = require("../middlewares/auth");

const errHndl = (error, req, res, next) => {
  res.status(400).send({ error: error.message });
};

///////////////////////////
//sign up
router.post("/users", async (req, res) => {
  try {
    // console.log(req.body);
    const user = new User(req.body);
    await user.save();
    const token = await user.generateToken();
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error.message);
  }
});
/////////////////////////
//login
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateToken();
    res.send({ user, token });
  } catch (error) {
    res.status(400).send(error.message);
  }
});
///
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (tokenObj) => tokenObj.token !== req.token
    );
    await req.user.save();
    res.send("come back soon !");
  } catch (error) {
    res.status(500).send();
  }
});
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    const user = req.user;
    user.tokens = [];
    await user.save();
    res.send(user);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
////////////////////////////////////////////////
//get your own profile
router.get("/users/profile", auth, async (req, res) => {
  const user = req.user;
  const token = req.token;
  res.send({ user, token });
});

//////////////////////////////

router.patch("/users/profile", auth, async (req, res) => {
  const updatedFeilds = Object.keys(req.body);
  const allowdFields = ["name", "email", "age", "password"];
  const isAllowed = updatedFeilds.every((field) =>
    allowdFields.includes(field)
  );
  if (!isAllowed) {
    return res.status(400).send("invalid updates");
  }
  try {
    const user = req.user;
    const token = req.token;
    updatedFeilds.forEach((feild) => {
      user[feild] = req.body[feild];
      return 1;
    });
    await user.save();
    res.send({ user, token });
  } catch (error) {
    res.status(400).send(error.message);
  }
});
router.delete("/users/profile", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send({ user: req.user, message: "succesfully deleted" });
  } catch (error) {
    res.status(500).send();
  }
});

const uploadAva = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/gm)) {
      return cb(
        new Error("please upload one of the following formats: jpg/ jpeg/ png")
      );
    }
    cb(undefined, true);
  },
});
router.post(
  "/users/profile/avatar",
  auth,
  uploadAva.single("avatar"),
  async (req, res) => {
    const buffer = sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  errHndl
);
router.delete("/users/profile/avatar", auth, async (req, res) => {
  const user = req.user;
  user.avatar = undefined;
  await user.save();
  res.send();
});
router.get("/users/profile/avatar", auth, (req, res) => {
  res.set("content-type", "image/png");
  res.send(req.user.avatar);
});
module.exports = router;
