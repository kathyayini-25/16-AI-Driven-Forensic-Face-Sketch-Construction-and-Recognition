
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import nodemailer from 'nodemailer';

export const Register=async(req,res)=> {

    const { username, email, password } = req.body;
    console.log(username,email,password);
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ error: 'User already exists' });

        user = new User({
            userId: Date.now().toString(),
            username,
            email,
            password: await bcrypt.hash(password, 10)
        });

        await user.save();
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json(user);
    } catch (err) {
        console.log(err);
        res.status(500).send('Server error');
    }
}

export const Login=async(req,res)=>{

    const { email, password } = req.body;
    console.log("email",email);
    console.log("password",password);

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return res.status(400).json({error:'password incorrect'});

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json(user);
    } catch (err) {
        res.status(500).send('Server error');
    }
}

export const ChangePass=async(req,res)=>{

    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'User not found' });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASS
            }
        });

        const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Password Reset',
            text: `Click to reset: ${process.env.CLIENT_URL}/reset-password/${resetToken}`
        };

        await transporter.sendMail(mailOptions);
        res.json({ msg: 'Password reset email sent' });
    } catch (err) {
        res.status(500).send('Server error');
    }
}

