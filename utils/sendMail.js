const sgMail = require("@sendgrid/mail");
require("dotenv").config();

const { SENDGRID_KEY } = process.env;

sgMail.setApiKey(SENDGRID_KEY)
const sendMail = async ({ to, subject, text }) => {
    const mail = {
        to,
        from: "karpinskiy94@gmail.com",
        subject,
        text,
    }
    try {
        const answer = await sgMail.send(mail);
        return answer;
    } catch (error) {
        throw error
    }
}
module.exports = sendMail;