import {
  LayoutDashboard,
  Search,
  Activity,
  Users,
  Newspaper,
  KeyRound,
  Compass,
  FileText,
  Bell,
  DollarSign,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Optional badge text (e.g. "Soon", "3") */
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Scans", href: "/dashboard/scans", icon: Search },
      { label: "Traffic", href: "/dashboard/traffic", icon: Activity },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Competitors", href: "/dashboard/competitors", icon: Users },
      { label: "Publications", href: "/dashboard/publications", icon: Newspaper },
      { label: "Keywords", href: "/dashboard/keywords", icon: KeyRound },
      { label: "Strategy", href: "/dashboard/strategy", icon: Compass },
    ],
  },
  {
    label: "Actions",
    items: [
      { label: "Briefs", href: "/dashboard/briefs", icon: FileText },
      { label: "Alerts", href: "/dashboard/alerts", icon: Bell },
    ],
  },
  {
    label: "Revenue",
    items: [
      { label: "Monetization", href: "/dashboard/monetization", icon: DollarSign },
    ],
  },
  {
    label: "",
    items: [{ label: "Settings", href: "/dashboard/settings", icon: Settings }],
  },
];
