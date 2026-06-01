import nodemailer from "nodemailer";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const host = process.env.SMTP_HOST || "";
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const from = process.env.FROM_EMAIL || "Denim Dynasty Studio <noreply@denimdynasty.com>";

  if (!host || !user || !pass) {
    console.log("\n================ MOCK EMAIL START ================");
    console.log(`TO:       ${to}`);
    console.log(`SUBJECT:  ${subject}`);
    console.log("------------------ HTML CONTENT ------------------");
    console.log(html);
    console.log("================= MOCK EMAIL END =================\n");
    return { success: true, mock: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for others
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    return { success: true, mock: false };
  } catch (error) {
    console.error("Nodemailer SMTP Error:", error);
    throw error;
  }
}
