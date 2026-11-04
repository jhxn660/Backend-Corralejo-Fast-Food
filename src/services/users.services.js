import User from '../models/user.model.js';

const findUserByEmail = async (email) => await User.findOne({ email });
const createUser = async (userData) => await User.create(userData);
const getAllUsers = async () => await User.find({}, { password: 0 });
const updateUserByEmail = async (email, updateData) => await User.findOneAndUpdate({ email }, updateData, { new: true }).select('-password');
const findUserById = async (id) => await User.findById(id); // NUEVO

export { findUserByEmail, createUser, getAllUsers, updateUserByEmail, findUserById };