package com.webui.backend.service.email;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.Properties;
import java.util.UUID;

@Slf4j
@Service("smtpEmailDeliveryService")
public class SmtpEmailDeliveryService implements EmailDeliveryService {

    private final String host;
    private final int port;
    private final String username;
    private final String password;
    private final boolean authEnabled;
    private final boolean starttlsEnabled;
    private final String fromAddress;
    private final String fromName;
    private final String replyToAddress;
    private final int connectionTimeoutMs;
    private final int readTimeoutMs;

    @Autowired(required = false)
    private JavaMailSender autowiredMailSender;

    public SmtpEmailDeliveryService(
            @Value("${app.mail.host:localhost}") String host,
            @Value("${app.mail.port:587}") int port,
            @Value("${app.mail.username:}") String username,
            @Value("${app.mail.password:}") String password,
            @Value("${app.mail.auth:true}") boolean authEnabled,
            @Value("${app.mail.starttls:true}") boolean starttlsEnabled,
            @Value("${app.mail.from-address:invitations@archeon.design}") String fromAddress,
            @Value("${app.mail.from-name:ArcheOn Design Studio}") String fromName,
            @Value("${app.mail.reply-to:support@archeon.design}") String replyToAddress,
            @Value("${app.mail.connection-timeout-ms:5000}") int connectionTimeoutMs,
            @Value("${app.mail.read-timeout-ms:10000}") int readTimeoutMs) {
        this.host = host;
        this.port = port;
        this.username = username;
        this.password = password;
        this.authEnabled = authEnabled;
        this.starttlsEnabled = starttlsEnabled;
        this.fromAddress = fromAddress;
        this.fromName = fromName;
        this.replyToAddress = replyToAddress;
        this.connectionTimeoutMs = connectionTimeoutMs > 0 ? connectionTimeoutMs : 5000;
        this.readTimeoutMs = readTimeoutMs > 0 ? readTimeoutMs : 10000;
    }

    protected JavaMailSender getMailSender() {
        if (autowiredMailSender != null) {
            return autowiredMailSender;
        }
        JavaMailSenderImpl impl = new JavaMailSenderImpl();
        impl.setHost(this.host);
        impl.setPort(this.port);
        if (this.username != null && !this.username.isBlank()) {
            impl.setUsername(this.username);
            impl.setPassword(this.password);
        }

        Properties props = impl.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", String.valueOf(this.authEnabled));
        props.put("mail.smtp.starttls.enable", String.valueOf(this.starttlsEnabled));
        props.put("mail.smtp.starttls.required", String.valueOf(this.starttlsEnabled));
        props.put("mail.smtp.connectiontimeout", String.valueOf(this.connectionTimeoutMs));
        props.put("mail.smtp.timeout", String.valueOf(this.readTimeoutMs));
        props.put("mail.smtp.writetimeout", String.valueOf(this.readTimeoutMs));
        return impl;
    }

    @Override
    public EmailDispatchResult sendInvitationEmail(InvitationEmailPayload payload) {
        String recipient = payload.getRecipientEmail();
        String roleDisplayName = formatRoleName(payload.getTargetRole());
        String expiryStr = payload.getExpiresAt() != null
                ? payload.getExpiresAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm 'IST'"))
                : "7 days from issuance";

        log.info("Dispatching authenticated SMTP invitation to recipient='{}' for role='{}' via {}:{}",
                recipient, payload.getTargetRole(), host, port);

        try {
            JavaMailSender sender = getMailSender();
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name()
            );

            helper.setFrom(new InternetAddress(fromAddress, fromName, StandardCharsets.UTF_8.name()));
            helper.setTo(recipient);
            helper.setReplyTo(new InternetAddress(replyToAddress, "ArcheOn Support", StandardCharsets.UTF_8.name()));
            helper.setSubject("Welcome to ArcheOn Design Studio — Activate Your Account");

            String textBody = buildPlainTextBody(payload.getRecipientName(), roleDisplayName, payload.getInvitationUrl(), expiryStr);
            String htmlBody = buildHtmlBody(payload.getRecipientName(), roleDisplayName, payload.getInvitationUrl(), expiryStr);

            helper.setText(textBody, htmlBody);

            sender.send(message);

            String messageId = message.getMessageID() != null ? message.getMessageID() : "smtp-msg-" + UUID.randomUUID();
            log.info("Successfully sent invitation email to '{}' [MessageID: {}]", recipient, messageId);

            return EmailDispatchResult.success("SMTP", messageId, recipient);
        } catch (Exception e) {
            log.error("Failed to deliver invitation email to '{}' via SMTP ({}:{}): {}",
                    recipient, host, port, e.getMessage());
            return EmailDispatchResult.failure("SMTP", recipient, e.getMessage());
        }
    }

    @Override
    public String getActiveProviderName() {
        return "SMTP";
    }

    private String formatRoleName(String role) {
        if (role == null) return "Member";
        if ("ROLE_CLIENT".equalsIgnoreCase(role)) return "Client Partner";
        if ("ROLE_VENDOR".equalsIgnoreCase(role)) return "Vendor / Contractor";
        if ("ROLE_STAFF".equalsIgnoreCase(role)) return "Studio Staff";
        if ("ROLE_ADMIN".equalsIgnoreCase(role)) return "Studio Administrator";
        if (role.startsWith("ROLE_FINANCE_")) return "Finance Team Member";
        return role.replace("ROLE_", "");
    }

    private String buildPlainTextBody(String name, String role, String url, String expiry) {
        String greeting = (name != null && !name.isBlank()) ? "Hello " + name + "," : "Hello,";
        return greeting + "\n\n"
                + "You have been invited to join the ArcheOn Design Studio enterprise portal as a " + role + ".\n\n"
                + "To activate your account and set up your password, please click the secure link below:\n"
                + url + "\n\n"
                + "IMPORTANT SECURITY NOTICE:\n"
                + "• This link is single-use and will expire on " + expiry + ".\n"
                + "• Do not share this link with anyone. Once activated, your username and password will protect your portal access.\n"
                + "• If you did not expect this invitation, please disregard this email.\n\n"
                + "Warm regards,\n"
                + "ArcheOn Design Studio Team\n"
                + "Krishna-Kunj, Nagpur, Maharashtra, India\n"
                + "https://archeon.design";
    }

    private String buildHtmlBody(String name, String role, String url, String expiry) {
        String safeName = HtmlUtils.htmlEscape(name != null ? name.trim() : "");
        String safeRole = HtmlUtils.htmlEscape(role != null ? role.trim() : "Member");
        String safeUrl = HtmlUtils.htmlEscape(url != null ? url.trim() : "");
        String safeExpiry = HtmlUtils.htmlEscape(expiry != null ? expiry.trim() : "");

        String greeting = !safeName.isBlank() ? "Hello " + safeName + "," : "Hello,";
        return "<!DOCTYPE html><html><body style=\"font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 24px; background-color: #f7f7f8; color: #1a1a1a;\">"
                + "<div style=\"max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e5e5e7; overflow: hidden;\">"
                + "  <div style=\"background-color: #111111; padding: 24px 32px;\">"
                + "    <h1 style=\"color: #ffffff; font-size: 20px; margin: 0; font-weight: 600; letter-spacing: 0.5px;\">ARCHÉON DESIGN STUDIO</h1>"
                + "    <p style=\"color: #a0a0a5; font-size: 13px; margin: 4px 0 0;\">Architectural Enterprise Portal</p>"
                + "  </div>"
                + "  <div style=\"padding: 32px;\">"
                + "    <h2 style=\"font-size: 18px; margin-top: 0; color: #111111;\">" + greeting + "</h2>"
                + "    <p style=\"font-size: 15px; line-height: 1.6; color: #333333;\">"
                + "      You have been invited to join the ArcheOn Design Studio portal as a <strong>" + safeRole + "</strong>."
                + "    </p>"
                + "    <p style=\"font-size: 15px; line-height: 1.6; color: #333333;\">"
                + "      To activate your account and establish your credentials, please click the secure activation button below:"
                + "    </p>"
                + "    <div style=\"text-align: center; margin: 32px 0;\">"
                + "      <a href=\"" + safeUrl + "\" style=\"display: inline-block; background-color: #111111; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 4px; font-weight: 600; font-size: 15px;\">Activate My Account</a>"
                + "    </div>"
                + "    <p style=\"font-size: 13px; line-height: 1.5; color: #666666;\">"
                + "      If the button above does not work, copy and paste this link into your browser:<br/>"
                + "      <a href=\"" + safeUrl + "\" style=\"color: #0066cc; word-break: break-all;\">" + safeUrl + "</a>"
                + "    </p>"
                + "    <hr style=\"border: none; border-top: 1px solid #eeeeee; margin: 28px 0;\" />"
                + "    <div style=\"background-color: #fcfcfd; border: 1px solid #eeeeee; border-radius: 4px; padding: 16px;\">"
                + "      <p style=\"font-size: 12px; margin: 0; color: #666666; font-weight: 600;\">SECURITY NOTICE</p>"
                + "      <ul style=\"font-size: 12px; color: #666666; margin: 8px 0 0; padding-left: 18px; line-height: 1.5;\">"
                + "        <li>This invitation link is strictly single-use and will expire on <strong>" + safeExpiry + "</strong>.</li>"
                + "        <li>Neither method permits unauthorized role alteration; your role has been verified by studio administration.</li>"
                + "        <li>If you did not expect this invitation, please disregard this email.</li>"
                + "      </ul>"
                + "    </div>"
                + "  </div>"
                + "  <div style=\"background-color: #f7f7f8; padding: 16px 32px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #eeeeee;\">"
                + "    ArcheOn Design Studio &bull; Krishna-Kunj, Nagpur, Maharashtra, India &bull; <a href=\"https://archeon.design\" style=\"color: #888888;\">archeon.design</a>"
                + "  </div>"
                + "</div></body></html>";
    }
}
