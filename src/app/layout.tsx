"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
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
    label: "Services",
    items: [
      { href: "/services", icon: "📋", label: "Services" },
      { href: "/applications", icon: "📄", label: "My Applications", badge: "2" },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/officer", icon: "👨‍💼", label: "Officer Portal" },
      { href: "/admin", icon: "⚙️", label: "Admin Dashboard" },
      { href: "/admin/import", icon: "📥", label: "Data Import" },
    ],
  },
];

function Sidebar() {
  const pathname = usePathname();

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
        <div className="sidebar-user">
          <div className="sidebar-avatar">RK</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">Ramesh Kumar</div>
            <div className="sidebar-user-role">Citizen</div>
          </div>
        </div>
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
        <div className="app-shell">
          <Sidebar />
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
