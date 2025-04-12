const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// User Signup
exports.signup = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, wechat_id, password, subscription_plan, gender, age, city } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

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

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.user_id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Don't return the password hash
    const { password_hash, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// User Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: {
        email: email
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Don't return the password hash
    const { password_hash, ...userWithoutPassword } = user;

    res.status(200).json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// User Logout (client-side only for JWT)
exports.logout = async (req, res) => {
  // With JWT, logout is typically handled client-side by removing the token
  // This endpoint can be used for logging or future token blacklisting
  res.status(200).json({ message: 'Logged out successfully' });
};

// Get User Profile
exports.getProfile = async (req, res) => {
  try {
    // User ID is attached by the authMiddleware
    const userId = req.user.id; 

    const user = await prisma.user.findUnique({
      where: {
        user_id: userId
      },
      // Select the fields you want to return (exclude password hash)
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
      // This shouldn't happen if verifyToken middleware works correctly
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 