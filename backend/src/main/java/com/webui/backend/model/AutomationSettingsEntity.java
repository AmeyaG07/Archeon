package com.webui.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "automation_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutomationSettingsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // WhatsApp Configuration
    @Builder.Default
    @Column(name = "whatsapp_enabled")
    private Boolean whatsappEnabled = true;

    @Builder.Default
    @Column(name = "whatsapp_sender_number")
    private String whatsappSenderNumber = "+91 9876543210";

    @Builder.Default
    @Column(name = "whatsapp_sender_name")
    private String whatsappSenderName = "MB's ArcheOn Design Studio (Ar. Mandar Bhalekar)";

    @Builder.Default
    @Column(name = "whatsapp_phone_number_id")
    private String whatsappPhoneNumberId = "104829384918234";

    @Builder.Default
    @Column(name = "whatsapp_business_account_id")
    private String whatsappBusinessAccountId = "102938475619283";

    @Builder.Default
    @Column(name = "whatsapp_access_token")
    private String whatsappAccessToken = "EAAGm0PXq1Z...[METACLOUD_TOKEN]";

    @Builder.Default
    @Column(name = "whatsapp_webhook_verify_token")
    private String whatsappWebhookVerifyToken = "archeon_secure_webhook_token_2026";

    @Builder.Default
    @Column(name = "whatsapp_reminder_days")
    private Integer whatsappReminderDays = 3;

    @Builder.Default
    @Column(name = "quiet_hours_start")
    private String quietHoursStart = "21:00";

    @Builder.Default
    @Column(name = "quiet_hours_end")
    private String quietHoursEnd = "09:00";

    @Builder.Default
    @Column(name = "invitation_template", length = 2000)
    private String invitationTemplate = "Namaste {{name}}, Welcome to MB's ArcheOn Design Studio! Your private project portal is ready. Activate your secure account here: {{link}} (Valid for 7 days).";

    @Builder.Default
    @Column(name = "new_bill_template", length = 2000)
    private String newBillTemplate = "Hello {{name}}, A new contractor bill of ₹{{amount}} has been submitted by {{vendor}} for {{project}}. Review details here: {{link}}.";

    @Builder.Default
    @Column(name = "reminder_template", length = 2000)
    private String reminderTemplate = "Hello {{name}}, This is a polite reminder from MB's ArcheOn Design Studio regarding pending invoice #{{invoice}} for ₹{{amount}}. Please review: {{link}}.";

    // Email Configuration
    @Builder.Default
    @Column(name = "email_enabled")
    private Boolean emailEnabled = true;

    @Builder.Default
    @Column(name = "email_from_address")
    private String emailFromAddress = "invitations@archeon.design";

    @Builder.Default
    @Column(name = "email_from_name")
    private String emailFromName = "MB's ArcheOn Design Studio";

    @Builder.Default
    @Column(name = "email_reply_to")
    private String emailReplyTo = "support@archeon.design";

    @Builder.Default
    @Column(name = "smtp_host")
    private String smtpHost = "smtp.archeon.design";

    @Builder.Default
    @Column(name = "smtp_port")
    private Integer smtpPort = 587;

    @Builder.Default
    @Column(name = "smtp_username")
    private String smtpUsername = "notifications@archeon.design";

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by")
    private String updatedBy;
}
