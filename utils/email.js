const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendOrderConfirmation = async (order) => {
    try {
        const mailOptions = {
            from: '"GoodBoy Store" <no-reply@goodboy.com>',
            to: order.customer.email,
            subject: `Order Confirmation - #${order._id}`,
            html: `
                <h1>Thank you for your order, ${order.customer.name}!</h1>
                <p>We have received your order and are processing it.</p>
                <h2>Order Details:</h2>
                <ul>
                    ${order.items.map(item => `<li>${item.name} x ${item.quantity} - R${item.price.toFixed(2)}</li>`).join('')}
                </ul>
                <h3>Total: R${order.total.toFixed(2)}</h3>
                <p>We will notify you when your order ships.</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        // Don't throw error to prevent crashing the webhook
        return null;
    }
};

module.exports = { sendOrderConfirmation };
