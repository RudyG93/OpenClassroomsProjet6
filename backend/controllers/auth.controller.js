const Auth = require('../models/auth');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = (req, res, next) => {
    const { email, password } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !password || !emailRegex.test(email)) {
        return res.status(400).json(new Error('Email and password are required'));
    }

    Auth.findOne({ email })
        .then(user => {
            if (!user) {
                return res.status(401).json(new Error('Invalid credentials'));
            }
            bcrypt.compare(password, user.password)
                .then(valid => {
                    if (valid) {
                        const token = jwt.sign(
                            { userId: user._id },
                            process.env.JWT_SECRET || 'RANDOM_SECRET_KEY',
                            { expiresIn: '24h' }
                        );
                        res.status(200).json({
                            userId: user._id,
                            token: token
                        });
                    } else {
                        res.status(401).json(new Error('Invalid credentials'));
                    }
                })
                .catch(error => res.status(500).json(new Error(error.message)));
        })
        .catch(error => res.status(400).json(new Error(error.message)));
};


exports.signup = (req, res, next) => {
    const { email, password } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    if (!email || !password) {
        return res.status(400).json(new Error('Email and password are required'));
    }

    if (!emailRegex.test(email)) {
        return res.status(400).json(new Error('Invalid email format'));
    }

    if (!passwordRegex.test(password)) {
        return res.status(400).json(new Error('Password must be at least 8 characters long and contain a lowercase letter, an uppercase letter, a number and a special character.'));
    }

    bcrypt.hash(password, 10)
        .then(hash => {
            const newUser = new Auth({ email, password: hash });
            return newUser.save();
        })
        .then(newUser => res.status(201).json({ message: 'User created', userId: newUser._id }))
        .catch(error => res.status(400).json(new Error(error.message)));
};