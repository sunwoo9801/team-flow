import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(
    @Inject(ConfigService)
    private readonly config: ConfigService,
  ) {
    this.from = this.config.get<string>('MAIL_FROM') ?? this.config.getOrThrow<string>('SMTP_USER');
    this.transporter = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port: Number(this.config.get<string>('SMTP_PORT') ?? '587'),
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.config.getOrThrow<string>('SMTP_USER'),
        pass: this.config.getOrThrow<string>('SMTP_PASS'),
      },
    });
  }

  async sendPasswordResetEmail(to: string, resetUrl: string) {
    try {
      await this.transporter.sendMail({
        from: `"Team Flow" <${this.from}>`,
        to,
        subject: '[Team Flow] 비밀번호 재설정 안내',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; line-height: 1.6;">
            <h2 style="color: #2563eb;">비밀번호 재설정</h2>
            <p>안녕하세요, Team Flow 계정의 비밀번호 재설정을 요청하셨습니다.</p>
            <p>아래 버튼을 눌러 새 비밀번호를 설정해 주세요. 이 링크는 <strong>30분</strong> 동안만 유효합니다.</p>
            <p style="margin: 24px 0;">
              <a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
                비밀번호 재설정하기
              </a>
            </p>
            <p style="color:#71717a;font-size:12px;">본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error(`비밀번호 재설정 메일 발송 실패: ${(err as Error).message}`);
      throw err;
    }
  }
}
