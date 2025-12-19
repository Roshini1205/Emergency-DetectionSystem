import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'roshini.gdg24@gmail.com',
    pass: 'xxhtqnaepogbffmj', // 16-char App Password
  },
});

transporter.sendMail({
  from: 'roshini.gdg24@gmail.com',
  to: 'roshini.gdg24@gmail.com',
  subject: 'Test Email',
  text: 'Hello from Nodemailer!',
})
.then(() => console.log('Email sent!'))
.catch(console.error);
