const User = require('../models/User');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

//signup
const signup = async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ email, password: hashed })
        res.json({ message: "User created successfully" })
    }
    catch (error) {
        res.status(500).json({ error: error.message })

    }
};

//login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email })
        if (!user) return res.status(401).json({ error: "Invalid credentials" })

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: "invalid cred" })
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        res.json({ token });



    } catch (error) {
        res.status(500).json({ error: error.message })
    }
};
module.exports = { signup, login }