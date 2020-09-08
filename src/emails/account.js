const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'eric@noinc.com',
        subject: 'Thanks for signing up!',
        text: `Hi ${name}! Welcome to the app!`
    })
}

const sendGoodbyeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'eric@noinc.com',
        subject: 'bye bye bb',
        text: `We'll miss you ${name} :(`,
    })
}

module.exports = {
    sendWelcomeEmail,
    sendGoodbyeEmail,
}