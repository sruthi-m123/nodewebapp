import { sendMail } from "../emailService.js";
class ContactService {

    async sendContactMail(name, email, message) {

        const mailOptions = {
            from: `"${name}" <${process.env.EMAIL_USER}>`,
            to: process.env.NODEMAILER_EMAIL,
            replyTo: email,
            subject: `New Contact Message from ${name}`,
            html: `
                <div style="font-family:Arial;padding:20px">

                    <h2>New Contact Request</h2>

                    <hr>

                    <p><strong>Name :</strong> ${name}</p>

                    <p><strong>Email :</strong> ${email}</p>

                    <p><strong>Message :</strong></p>

                    <p>${message.replace(/\n/g,"<br>")}</p>

                </div>
            `
        };

        await sendMail(mailOptions);

        return {
            success: true,
            message: "Email Sent Successfully"
        };

    }

}

export default new ContactService();