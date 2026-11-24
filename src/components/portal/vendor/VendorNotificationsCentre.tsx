
"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock3,
  FileText,
  FolderOpen,
  IndianRupee,
  MessageSquare,
  Megaphone,
  Search,
  ShieldCheck,
  AlertCircle,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

export type VendorNotificationCategory =
  | "Project"
  | "Invoice"
  | "Payment"
  | "Dispute"
  | "Announcement"
  | "System";

export type VendorNotificationPriority =
  | "Normal"
  | "Important"
  | "Urgent";

export interface VendorNotificationRecord {
  id: string;
  title: string;
  message: string;
  category: VendorNotificationCategory;
  priority: VendorNotificationPriority;
  createdAt: string;
  isRead: boolean;
  actionLabel?: string;
  relatedReference?: string;
  actionTarget?: string;
}

interface VendorNotificationsCentreProps {
  notifications: VendorNotificationRecord[];
  loading?: boolean;
  error?: string;
  onOpenNotification: (
    notification: VendorNotificationRecord
  ) => void;
  onMarkAsRead: (notificationId: string) => void | Promise<void>;
  onMarkAllAsRead: () => void | Promise<void>;
  onRefresh?: () => void;
}

type NotificationFilter =
  | "All"
  | "Unread"
  | VendorNotificationCategory;

const FILTERS: NotificationFilter[] = [
  "All",
  "Unread",
  "Project",
  "Invoice",
  "Payment",
  "Dispute",
  "Announcement",
  "System",
];

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function renderCategoryIcon(category: VendorNotificationCategory, size: number) {
  switch (category) {
    case "Project":
      return <FolderOpen size={size} />;

    case "Invoice":
      return <FileText size={size} />;

    case "Payment":
      return <IndianRupee size={size} />;

    case "Dispute":
      return <MessageSquare size={size} />;

    case "Announcement":
      return <Megaphone size={size} />;

    default:
      return <Bell size={size} />;
  }
}

function getPriorityStyle(priority: VendorNotificationPriority) {
  switch (priority) {
    case "Urgent":
      return "bg-[#F8EAE7] text-[#9A5147]";

    case "Important":
      return "bg-[#F4EFE2] text-[#94743F]";

    default:
      return "bg-[#ECEAE5] text-[#77736C]";
  }
}

export function VendorNotificationsCentre({
  notifications,
  loading = false,
  error,
  onOpenNotification,
  onMarkAsRead,
  onMarkAllAsRead,
  onRefresh,
}: VendorNotificationsCentreProps) {
  const [filter, setFilter] =
    useState<NotificationFilter>("All");

  const [search, setSearch] = useState("");

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesSearch =
        !query ||
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query) ||
        (notification.relatedReference ?? "")
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        filter === "All" ||
        (filter === "Unread" && !notification.isRead) ||
        notification.category === filter;

      return matchesSearch && matchesFilter;
    });
  }, [notifications, search, filter]);

  async function handleOpen(
    notification: VendorNotificationRecord
  ) {
    if (!notification.isRead) {
      await onMarkAsRead(notification.id);
    }

    onOpenNotification(notification);
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

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
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
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <header className="border-b border-[#D8D6D0] pb-9">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
            Vendor Portal / Communication
          </p>

          <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="font-serif text-4xl text-[#171717] md:text-5xl">
                Notifications
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#77736C]">
                Stay informed about your assignments, invoices,
                payments, disputes and studio updates.
              </p>
            </div>

            <div className="flex items-center gap-3 border border-[#D8D6D0] bg-white px-5 py-3">
              <Bell size={17} className="text-[#A58A64]" />

              <span className="font-serif text-2xl text-[#171717]">
                {unreadCount}
              </span>

              <span className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
                Unread
              </span>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-4">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void onMarkAllAsRead()}
                className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#987543] hover:text-[#171717]"
              >
                <CheckCheck size={15} />
                Mark All as Read
              </button>
            )}
          </div>
        </header>

        {/* Summary */}
        <section className="mt-9 grid grid-cols-1 gap-px border border-[#D8D6D0] bg-[#D8D6D0] sm:grid-cols-3">
          <SummaryCard
            label="Total Notifications"
            value={String(notifications.length)}
            icon={<Bell size={19} />}
          />

          <SummaryCard
            label="Unread"
            value={String(unreadCount)}
            icon={<AlertCircle size={19} />}
          />

          <SummaryCard
            label="Read"
            value={String(notifications.length - unreadCount)}
            icon={<CheckCircle2 size={19} />}
          />
        </section>

        {/* Notification List */}
        <section className="mt-12">
          <div className="border-b border-[#D8D6D0] pb-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
              Updates & Activity
            </p>

            <h2 className="mt-3 font-serif text-3xl text-[#171717]">
              Your Activity
            </h2>
          </div>

          {/* Search */}
          <div className="relative mt-6">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#99958D]"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notifications..."
              aria-label="Search notifications"
              className="h-12 w-full border border-[#D8D6D0] bg-white pl-11 pr-4 text-sm text-[#33312D] outline-none focus:border-[#A58A64]"
            />
          </div>

          {/* Filters */}
          <div className="mt-5 flex gap-2 overflow-x-auto pb-3">
            {FILTERS.map((item) => {
              const active = filter === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  aria-pressed={active}
                  className={`shrink-0 border px-4 py-3 text-[9px] uppercase tracking-widest transition-colors ${
                    active
                      ? "border-[#171717] bg-[#171717] text-white"
                      : "border-[#D8D6D0] bg-white text-[#77736C] hover:border-[#A58A64]"
                  }`}
                >
                  {item === "All" ? "All Updates" : item}
                </button>
              );
            })}
          </div>

          {/* Results */}
          <div className="mt-5 space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="border border-[#D8D6D0] bg-white px-6 py-16 text-center">
                <Bell
                  size={28}
                  strokeWidth={1.3}
                  className="mx-auto text-[#A58A64]"
                />

                <h3 className="mt-5 font-serif text-2xl text-[#171717]">
                  No notifications found
                </h3>

                <p className="mt-3 text-sm text-[#77736C]">
                  There are no notifications matching your current filter.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onOpen={() => void handleOpen(notification)}
                />
              ))
            )}
          </div>
        </section>

        {/* Security Notice */}
        <div className="mt-12 flex items-start gap-4 border border-[#D8D6D0] bg-white p-5">
          <ShieldCheck
            size={20}
            className="mt-1 shrink-0 text-[#A58A64]"
          />

          <p className="text-xs leading-6 text-[#77736C]">
            Notifications are account-specific. Project and financial
            information must only be shown to authorised vendor accounts.
            Important financial actions should always be completed in
            their respective secure workflows.
          </p>
        </div>

        <footer className="mt-12 border-t border-[#D8D6D0] pt-6">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
            ARCHEON DESIGN STUDIO / CONFIDENTIAL VENDOR WORKSPACE
          </p>
        </footer>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="bg-white p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
          {label}
        </p>

        <span className="text-[#A58A64]">{icon}</span>
      </div>

      <p className="mt-7 font-serif text-3xl text-[#171717]">
        {value}
      </p>
    </div>
  );
}

function NotificationCard({
  notification,
  onOpen,
}: {
  notification: VendorNotificationRecord;
  onOpen: () => void;
}) {
  return (
    <article
      className={`border bg-white transition-colors ${
        notification.isRead
          ? "border-[#D8D6D0]"
          : "border-[#C8B28F]"
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-4 p-5 text-left md:p-6"
      >
        <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center border border-[#E5E2DC] bg-[#FAF9F6] text-[#A58A64]">
          {renderCategoryIcon(notification.category, 18)}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-[#33312D]">
              {notification.title}
            </span>

            {!notification.isRead && (
              <span className="h-2 w-2 rounded-full bg-[#A58A64]" />
            )}
          </span>

          <span className="mt-2 block text-xs leading-7 text-[#77736C]">
            {notification.message}
          </span>

          <span className="mt-4 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
              {notification.category}
            </span>

            <span
              className={`px-2 py-1 font-mono text-[8px] uppercase tracking-widest ${getPriorityStyle(notification.priority)}`}
            >
              {notification.priority}
            </span>

            {notification.relatedReference && (
              <span className="font-mono text-[9px] text-[#99958D]">
                {notification.relatedReference}
              </span>
            )}
          </span>

          <span className="mt-3 block text-[10px] text-[#99958D]">
            {formatDate(notification.createdAt)}
          </span>
        </span>

        <ArrowUpRight
          size={16}
          className="mt-2 shrink-0 text-[#99958D]"
        />
      </button>

      {notification.actionLabel && (
        <div className="border-t border-[#E5E2DC] px-5 py-3 md:px-6">
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
            {notification.actionLabel}
          </span>
        </div>
      )}
    </article>
  );
}
