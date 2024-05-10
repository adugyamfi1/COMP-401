import nodemailer from "nodemailer";
import path from "path";
import Email from "email-templates";
import { IEmailTemplates } from "../utils/types";
require("dotenv").config();

export default async function sendEmail(
  template: IEmailTemplates,
  email: string,
  message: string,
  heading: string,
  name: string
): Promise<boolean> {
  const { SMTP_HOST, SMTP_PORT, SMTP_EMAIL_ADDRESS, SMTP_PASSWORD, NO_REPLY } =
    process.env;
  try {
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_EMAIL_ADDRESS || !SMTP_PASSWORD) {
      throw new Error("SMTP configuration environment variables are missing.");
    }
    const transporter = nodemailer.createTransport({
      service: SMTP_HOST,
      auth: {
        user: SMTP_EMAIL_ADDRESS,
        pass: SMTP_PASSWORD,
      },
    });

    let locals: any = { message: message, name: name, heading: heading };
    let emailTemplate: IEmailTemplates = template;

    const emailConfig = new Email({
      views: {
        root: path.resolve(__dirname, "..", "utils", "templates"),
        options: { extension: "ejs" },
      },
      message: {
        from: NO_REPLY,
      },
      preview: false,
      send: true,
      transport: transporter,
    });

    await emailConfig.send({
      template: emailTemplate,
      message: {
        to: email,
        from: SMTP_EMAIL_ADDRESS,
      },
      locals: locals,
    });

    return true;
  } catch (error) {
    return false;
  }
}
