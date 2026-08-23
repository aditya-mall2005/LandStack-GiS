"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { AuthProvider, useAuth } from "@/lib/security/auth-context";
import "./globals.css";

const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { href: "/", icon: "🏠", label: "Dashboard" },
      { href: "/map", icon: "🗺️", label: "GIS Map" },
      { href: "/search", icon: "🔍", label: "Search Land" },
    ],
  },
  {
    label: "Citizen Services",
    items: [
      { href: "/services", icon: "📋", label: "Services" },
      { href: "/applications", icon: "📄", label: "My Applications", badge: "2" },
    ],
  },
  {
    label: "Department Governance",
    items: [
      { href: "/officer", icon: "👨‍💼", label: "Officer Portal" },
      { href: "/officer/conflicts", icon: "⚠️", label: "Data Conflicts", badge: "3" },
    ],
  },
  {
    label: "Intelligence & Standards",
    items: [
      { href: "/admin/intelligence", icon: "🧠", label: "AI & Satellite AI" },
      { href: "/admin/adapters", icon: "🔌", label: "State Adapters" },
      { href: "/admin/security", icon: "🛡️", label: "Security & Audit" },
      { href: "/admin", icon: "⚙️", label: "Admin Overview" },
      { href: "/admin/import", icon: "📥", label: "Data Import" },
    ],
  },
];

function Sidebar() {
  const pathname = usePathname();
  const { currentUser, getInitials } = useAuth();

  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🏛</div>
        <span className="sidebar-logo-text">LANDSTACK</span>
        <span className="sidebar-logo-badge">SIH</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="sidebar-section">
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {item.label}
                {item.badge && (
                  <span className="sidebar-link-badge">{item.badge}</span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <Link href="/login" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
          <div
            className="sidebar-user"
            style={{
              cursor: "pointer",
              transition: "background 0.2s",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "var(--radius-md)",
              padding: "10px",
            }}
          >
            <div className="sidebar-avatar" style={{ background: "var(--brand-primary)", color: "#fff", fontWeight: 700 }}>
              {getInitials(currentUser.name)}
            </div>
            <div className="sidebar-user-info" style={{ overflow: "hidden" }}>
              <div className="sidebar-user-name" style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                <span>{currentUser.name}</span>
              </div>
              <div className="sidebar-user-role" style={{ fontSize: 11, color: "var(--text-accent)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {currentUser.title.split("/")[0].trim()} • Switch ⇄
              </div>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>LandStack — Integrated GIS Land Governance</title>
        <meta
          name="description"
          content="An Integrated GIS-based Digital Public Infrastructure for Land Governance. SIH 2026 | PS #26014"
        />
      </head>
      <body>
        <AuthProvider>
          <div className="app-shell">
            <Sidebar />
            <main className="app-main">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
