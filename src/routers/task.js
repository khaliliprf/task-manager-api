const express = require("express");
const Task = require("../models/task");
const auth = require("../middlewares/auth");
const router = new express.Router();
//////////////////////////////////
//create new task
router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    // descriptio: req.body.description,
    // completed: req.body.completed,
    ...req.body,
    owner: req.user._id,
  });
  try {
    await task.save();
    res.status(201).send(task);
  } catch (error) {
    res.status(400).send(error.message);
  }
});
router.patch("/tasks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowdFields = ["description", "completed"];
  const isAllowed = updates.every((field) => allowdFields.includes(field));
  if (!isAllowed) {
    return res.status(400).send("invalid updates");
  }
  try {
    const user = req.user;
    const task = await Task.findOne({ _id: req.params.id, owner: user._id });
    if (!task) {
      res.status(404).send("no task matched with this id");
    }
    updates.forEach((field) => {
      task[field] = req.body[field];
    });
    await task.save();

    res.send(task);
  } catch (error) {
    res.status(400).send(error.message);
  }
});
/////////////////////////////////////
router.get("/tasks", auth, async (req, res) => {
  // const tasks = await Task.find({ owner: req.user._id });
  const match = {};
  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }
  const user = req.user;
  await user
    .populate({
      path: "tasks",
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
      },
    })
    .execPopulate();
  try {
    res.status(202).send(user.tasks);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
//////////////////////////////////////
router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  const task = await Task.findOne({ _id, owner: req.user._id });
  try {
    if (!task) {
      return res.status(404).send("sorry");
    }
    res.send(task);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

///////////////////////////////////////
router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const _id = req.params.id;
    const user = req.user;
    //we also can use findOneAndDelete
    const task = await Task.findOne({ _id, owner: user._id });
    if (!task) {
      return res.status(404).send("there is no such a task");
    }
    await task.remove();
    res.send("successfully deleted!!");
  } catch (error) {
    res.status(500).send();
  }
});

module.exports = router;
