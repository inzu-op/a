const mongoose = require("mongoose");

const semesterSchema = new mongoose.Schema({
  cat1: [
    {
      subject: { type: String, required: true },
      marks: { type: Number, required: true, min: 0, max: 100 },
    },
  ],
  cat2: [
    {
      subject: { type: String, required: true },
      marks: { type: Number, required: true, min: 0, max: 100 },
    },
  ],
  model: [
    {
      subject: { type: String, required: true },
      marks: { type: Number, required: true, min: 0, max: 100 },
    },
  ],
  sem: [
    {
      subject: { type: String, required: true },
      Grade: { type: String, required: true },
    }, 
  ],
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollno: { type: Number, required: true, unique: true }, // Remove `unique: true` if needed
  branch: { type: String, required: true },
  sem1: semesterSchema,
  sem2: semesterSchema,
  sem3: semesterSchema,
  sem4: semesterSchema,
  sem5: semesterSchema,
  sem6: semesterSchema,
  sem7: semesterSchema,
  sem8: semesterSchema,
});

const userModel = mongoose.model("students", userSchema);

const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    default: 'visitor'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const AdminModel = mongoose.model("Users", AdminSchema);

module.exports = { userModel, AdminModel };

