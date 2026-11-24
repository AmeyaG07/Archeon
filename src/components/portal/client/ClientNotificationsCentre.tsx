
"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  FileText,
  CreditCard,
  MessageSquare,
  FolderOpen,
  Megaphone,
  CheckCheck,
  Circle,
  Clock3,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

export type ClientNotificationCategory =
  | "Project"
  | "Invoice"
  | "Payment"
  | "Dispute"
  | "Document"
  | "Announcement";

export interface ClientNotification {
  id: string;
  title: string;
  message: string;
  category: ClientNotificationCategory;
  createdAt: string;
  read: boolean;
  relatedReference?: string;
}

type NotificationFilter = "All" | "Unread";

interface ClientNotificationsCentreProps {
  notifications: ClientNotification[];
  loading?: boolean;
  error?: string;
  onMarkAsRead: (notificationId: string) => void | Promise<void>;
  onMarkAllAsRead: () => void | Promise<void>;
  onOpenNotification: (
    notification: ClientNotification
  ) => void | Promise<void>;
  onRetry?: () => void;
}

function NotificationIcon({
  category,
}: {
  category: ClientNotificationCategory;
}) {
  const iconProps = {
    size: 19,
    strokeWidth: 1.6,
  };

  switch (category) {
    case "Project":
      return <FolderOpen {...iconProps} />;

    case "Invoice":
      return <FileText {...iconProps} />;

    case "Payment":
      return <CreditCard {...iconProps} />;

    case "Dispute":
      return <MessageSquare {...iconProps} />;

    case "Document":
      return <FileText {...iconProps} />;

    case "Announcement":
      return <Megaphone {...iconProps} />;
  }
}

export function ClientNotificationsCentre({
  notifications,
  loading = false,
  error,
  onMarkAsRead,
  onMarkAllAsRead,
  onOpenNotification,
  onRetry,
}: ClientNotificationsCentreProps) {
  const [activeFilter, setActiveFilter] =
    useState<NotificationFilter>("All");

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "Unread") {
      return notifications.filter(
        (notification) => !notification.read
      );
    }

    return notifications;
  }, [notifications, activeFilter]);

  async function handleOpen(notification: ClientNotification) {
    if (!notification.read) {
      await onMarkAsRead(notification.id);
    }

    await onOpenNotification(notification);
  }

  if (loading) {
    return (
      <div className="min-h-80 bg-[#F2F0EB] p-8">
        <p className="text-sm text-[#77736C]">
          Loading notifications...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <section
        role="alert"
        className="border border-[#E3C9C5] bg-[#FAF3F1] p-7"
      >
        <AlertCircle size={22} className="text-[#9A5147]" />

        <h2 className="mt-4 font-serif text-2xl text-[#773B34]">
          Notifications unavailable
        </h2>

        <p className="mt-3 text-sm leading-7 text-[#805B55]">
          {error}
        </p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 text-xs uppercase tracking-widest text-[#773B34] underline"
          >
            Try Again
          </button>
        )}
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <header className="flex flex-col justify-between gap-6 border-b border-[#D8D6D0] pb-9 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
              Client Portal / Communication
            </p>

            <h1 className="mt-5 font-serif text-4xl text-[#171717] md:text-5xl">
              Notifications
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#77736C]">
              Stay informed about project activity, financial
              updates and messages shared by the studio.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Bell size={21} className="text-[#A58A64]" />

            <div>
              <p className="font-serif text-2xl text-[#171717]">
                {unreadCount}
              </p>

              <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
                Unread
              </p>
            </div>
          </div>
        </header>

        {/* Notification Summary */}
        <section className="mt-8 flex flex-col justify-between gap-5 border border-[#D8D6D0] bg-white p-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-serif text-xl text-[#171717]">
              Your Activity Feed
            </p>

            <p className="mt-2 text-xs text-[#99958D]">
              {notifications.length} total notifications
            </p>
          </div>

          <button
            type="button"
            onClick={() => void onMarkAllAsRead()}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#A58A64] hover:text-[#171717] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCheck size={16} />
            Mark All as Read
          </button>
        </section>

        {/* Filters */}
        <nav
          aria-label="Notification filters"
          className="mt-9 flex gap-7 border-b border-[#D8D6D0]"
        >
          {(["All", "Unread"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              aria-pressed={activeFilter === filter}
              className={`border-b-2 pb-4 text-xs transition-colors ${
                activeFilter === filter
                  ? "border-[#A58A64] text-[#171717]"
                  : "border-transparent text-[#99958D] hover:text-[#33312D]"
              }`}
            >
              {filter}
              {filter === "Unread" && (
                <span className="ml-2 font-mono text-[9px]">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Notification List */}
        <section className="mt-6">
          {filteredNotifications.length === 0 ? (
            <div className="border border-[#D8D6D0] bg-white px-6 py-16 text-center">
              <Bell
                size={29}
                strokeWidth={1.3}
                className="mx-auto text-[#A58A64]"
              />

              <h2 className="mt-5 font-serif text-2xl text-[#171717]">
                {activeFilter === "Unread"
                  ? "You're all caught up"
                  : "No notifications yet"}
              </h2>

              <p className="mt-3 text-sm leading-7 text-[#77736C]">
                {activeFilter === "Unread"
                  ? "You have no unread notifications."
                  : "New project and account updates will appear here."}
              </p>
            </div>
          ) : (
            <div className="border-t border-[#D8D6D0]">
              {filteredNotifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`border-b border-[#D8D6D0] transition-colors ${
                    notification.read ? "bg-transparent" : "bg-white"
                  }`}
                >
                  <div className="flex items-start gap-4 px-4 py-6 sm:px-6">

                    {/* Category Icon */}
                    <div
                      className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center ${
                        notification.read
                          ? "bg-[#ECEAE5] text-[#99958D]"
                          : "bg-[#F4EFE2] text-[#A58A64]"
                      }`}
                    >
                      <NotificationIcon
                        category={notification.category}
                      />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                          {notification.category}
                        </span>

                        {!notification.read && (
                          <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-[#94743F]">
                            <Circle size={7} fill="currentColor" />
                            New
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleOpen(notification)}
                        className="mt-2 block text-left"
                      >
                        <h3 className="text-sm font-medium text-[#171717] hover:text-[#A58A64]">
                          {notification.title}
                        </h3>

                        <p className="mt-2 text-xs leading-6 text-[#77736C]">
                          {notification.message}
                        </p>
                      </button>

                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        <span className="inline-flex items-center gap-2 font-mono text-[9px] text-[#99958D]">
                          <Clock3 size={12} />
                          {notification.createdAt}
                        </span>

                        {notification.relatedReference && (
                          <span className="font-mono text-[9px] text-[#99958D]">
                            REF: {notification.relatedReference}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Read State */}
                    {!notification.read && (
                      <button
                        type="button"
                        onClick={() =>
                          void onMarkAsRead(notification.id)
                        }
                        aria-label={`Mark ${notification.title} as read`}
                        title="Mark as read"
                        className="mt-2 shrink-0 text-[#A58A64] hover:text-[#171717]"
                      >
                        <CheckCheck size={17} />
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Footer Notice */}
        <div className="mt-10 flex items-start gap-3 border border-[#D8D6D0] bg-white p-5">
          <ShieldCheck
            size={19}
            className="mt-0.5 shrink-0 text-[#A58A64]"
          />

          <p className="text-xs leading-6 text-[#77736C]">
            Notifications are account-specific. Private project
            and financial information must only be delivered to
            authorised users through the secure client portal.
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-10 border-t border-[#D8D6D0] pt-6">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
            ARCHEON DESIGN STUDIO / CLIENT COMMUNICATION
          </p>
        </footer>
      </div>
    </main>
  );
}
