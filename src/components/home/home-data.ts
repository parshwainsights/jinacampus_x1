import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarCheck2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  IdCard,
  IndianRupee,
  Layers3,
  MessageSquareText,
  QrCode,
  ReceiptIndianRupee,
  ShieldCheck,
  UsersRound
} from "lucide-react";

export const navItems = [
  { label: "Features", href: "#features" },
  { label: "Modules", href: "#modules" },
  { label: "Attendance", href: "#attendance" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" }
] as const;

export const valueCards = [
  {
    title: "Multi-tenant SaaS foundation",
    description: "Designed for tenants, institutions, branches, academic years, and operational separation from day one.",
    icon: Layers3
  },
  {
    title: "Secure role-based access",
    description: "Permission-led access for principals, admins, class teachers, staff, parents, and students.",
    icon: ShieldCheck
  },
  {
    title: "Student and staff attendance",
    description: "Daily class attendance and QR staff check-in workflows built for busy school days.",
    icon: CalendarCheck2
  },
  {
    title: "Print-ready school reports",
    description: "Clean report surfaces for attendance, fees, academics, staff, and management review.",
    icon: FileText
  }
] as const;

export const modules = [
  {
    name: "CampusCore",
    description: "Tenant, branch, academic year, users, roles, and permissions foundation.",
    icon: Building2
  },
  {
    name: "Academia",
    description: "Students, guardians, classes, sections, subjects, enrollments, and daily class attendance.",
    icon: GraduationCap
  },
  {
    name: "StaffBoard Lite",
    description: "Staff profiles, staff categories, QR check-in/check-out, late and half-day tracking.",
    icon: IdCard
  },
  {
    name: "GradeBook",
    description: "Exam planning, marks entry, grading, results, and report cards.",
    icon: BookOpen
  },
  {
    name: "FeeDesk",
    description: "Fee heads, structures, collections, concessions, receipts, and defaulter reports.",
    icon: ReceiptIndianRupee
  },
  {
    name: "SchoolCast",
    description: "Notices, circulars, alerts, broadcasts, and parent communication.",
    icon: MessageSquareText
  },
  {
    name: "InsightBoard",
    description: "Dashboards for principals, admins, academics, fees, staff, and management.",
    icon: BarChart3
  }
] as const;

export const dashboardMetrics = [
  { label: "Students Present Today", value: "1,248", note: "91% present", icon: UsersRound },
  { label: "Staff Checked In", value: "84", note: "7 late arrivals", icon: QrCode },
  { label: "Fee Collection", value: "₹4.8L", note: "Today", icon: IndianRupee },
  { label: "Classes Marked", value: "38/42", note: "4 pending", icon: ClipboardCheck },
  { label: "Pending Alerts", value: "16", note: "Parent notices", icon: Bell }
] as const;

export const previewCards = [
  { label: "Present Students", value: "1,248", tone: "green" },
  { label: "Absent Students", value: "72", tone: "red" },
  { label: "Staff Late Today", value: "7", tone: "amber" },
  { label: "Fee Collection", value: "₹4.8L", tone: "blue" },
  { label: "Classes Not Marked", value: "4", tone: "slate" },
  { label: "Notices Sent", value: "129", tone: "violet" }
] as const;

export const benefits = [
  "Built for Indian school workflows",
  "Multi-branch ready",
  "Secure RBAC-based access",
  "Audit-friendly operations",
  "Parent communication ready",
  "Future-ready modular architecture"
] as const;
