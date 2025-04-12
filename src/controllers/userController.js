const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// Create a new user
exports.createUser = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, wechat_id, password, subscription_plan, gender, age, city } = req.body;

    // Check if user with the same email already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        user_id: uuidv4(),
        first_name,
        last_name,
        email,
        phone,
        wechat_id,
        password_hash: hashedPassword,
        subscription_plan,
        gender,
        age,
        city
      }
    });

    // Don't return the password hash
    const { password_hash, ...userWithoutPassword } = newUser;
    
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        wechat_id: true,
        signup_timestamp: true,
        subscription_plan: true,
        gender: true,
        age: true,
        city: true
      }
    });
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: {
        user_id: id
      },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        wechat_id: true,
        signup_timestamp: true,
        subscription_plan: true,
        gender: true,
        age: true,
        city: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, wechat_id, password, subscription_plan, gender, age, city } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: {
        user_id: id
      }
    });
    
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prepare update data
    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (wechat_id) updateData.wechat_id = wechat_id;
    if (subscription_plan) updateData.subscription_plan = subscription_plan;
    if (gender) updateData.gender = gender;
    if (age) updateData.age = age;
    if (city) updateData.city = city;
    
    // If password is provided, hash it
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(password, salt);
    }
    
    // Update the user
    const updatedUser = await prisma.user.update({
      where: {
        user_id: id
      },
      data: updateData,
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        wechat_id: true,
        signup_timestamp: true,
        subscription_plan: true,
        gender: true,
        age: true,
        city: true
      }
    });
    
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: {
        user_id: id
      }
    });
    
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete the user
    await prisma.user.delete({
      where: {
        user_id: id
      }
    });
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 