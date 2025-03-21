import { createTransport } from 'nodemailer';
import { EmailConfirmationCodeDto, PasswordRecoveryCodeDto } from '../dto';

//TODO add to env file
const EMAIL_USER = 'dzmitryincubatoryesisincubator@gmail.com';
const EMAIL_PASSWORD = 'zknfjmaxbqusvorj';

const transporter = createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

export class EmailNotificationService {
  async sendEmailWithConfirmationCode(
    data: EmailConfirmationCodeDto,
  ): Promise<void> {
    const emailHtml = `<h1>Hello ${data.login}</h1> <p><a href="https://some-url.com/confirm-registration?code=${data.code}"></a>Click to confirm your email</p>`;

    try {
      await transporter.sendMail({
        from: 'Dzmitry Yesis',
        to: data.email,
        subject: 'Confirm your Email',
        html: emailHtml,
      });
    } catch (error) {
      console.log('Error sending email: ', error);
    }
  }

  async sendEmailWithRecoveryPasswordCode(
    data: PasswordRecoveryCodeDto,
  ): Promise<void> {
    const emailHtml = `<h1>To finish password recovery please follow the link below:</h1> <p><a href="https://some-url.com/password-recovery?recoveryCode=${data.code}"></a>Click to confirm your email</p>`;

    try {
      await transporter.sendMail({
        from: 'Dzmitry Yesis',
        to: data.email,
        subject: 'Confirm your Email',
        html: emailHtml,
      });
    } catch (error) {
      console.log('Error sending email: ', error);
    }
  }
}
