import nodemailer from "nodemailer";
import { config } from "./config.js";

let _transport = null;

function getTransport() {
  if (_transport) return _transport;
  const { smtp } = config;
  if (!smtp?.host) return null;
  _transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port || 587,
    secure: smtp.secure || false,
    requireTLS: smtp.requireTls !== false,
    auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
  });
  return _transport;
}

async function sendHtmlMail(to, subject, html) {
  const transport = getTransport();
  if (!transport) return false;
  const info = await transport.sendMail({
    from: config.smtp.from || `"PromptDeck" <noreply@promptdeck>`,
    to, subject, html,
  });
  console.log(`[mailer] message accepted=${!(info.rejected && info.rejected.length)}`);
  return !(info.rejected && info.rejected.length);
}

function linkEmailHtml(title, bodyText, linkUrl, linkLabel) {
  const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <h2 style="margin:0 0 16px;font-size:20px">${escapeHtml(title)}</h2>
      <p style="margin:0 0 24px;color:#444;line-height:1.6">${escapeHtml(bodyText)}</p>
      <a href="${escapeHtml(linkUrl)}" style="display:inline-block;padding:12px 28px;background:#1f5eff;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px">
        ${escapeHtml(linkLabel)}
      </a>
      <p style="margin:24px 0 0;font-size:12px;color:#888">링크는 24시간 동안 유효합니다.</p>
    </div>
  `;
}

export async function sendVerificationEmail(to, verifyUrl, appName) {
  const name = String(appName || "PromptDeck").replace(/[\r\n]/g, " ").slice(0, 80);
  return sendHtmlMail(
    to,
    `[${name}] 이메일 인증`,
    linkEmailHtml(
      `${name} 이메일 인증`,
      "아래 버튼을 클릭하면 이메일 인증이 완료되고 서비스를 이용하실 수 있습니다.",
      verifyUrl,
      "이메일 인증하기"
    )
  );
}

export async function sendEmailChangeConfirmation(to, confirmUrl, appName) {
  const name = String(appName || "PromptDeck").replace(/[\r\n]/g, " ").slice(0, 80);
  return sendHtmlMail(
    to,
    `[${name}] 이메일 변경 확인`,
    linkEmailHtml(
      `${name} 이메일 변경 확인`,
      "아래 버튼을 클릭하면 이 이메일 주소로 계정 이메일이 변경됩니다. 본인이 요청하지 않았다면 이 메일을 무시하세요.",
      confirmUrl,
      "이메일 변경 확인하기"
    )
  );
}
