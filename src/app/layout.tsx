"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { AuthProvider, useAuth, DEMO_PERSONAS, getLucideIcon } from "@/lib/security/auth-context";
import { getFilteredNavSections } from "@/lib/security/route-guard";
import { RouteGuard } from "@/components/RouteGuard";
import * as Lucide from "lucide-react";
import "./globals.css";

function Sidebar() {
  const pathname = usePathname();
  const { currentUser, getInitials, isMounted } = useAuth();
  const activeUser = isMounted ? currentUser : DEMO_PERSONAS[0];
  const navSections = getFilteredNavSections(activeUser.role);

  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-text" style={{ color: "var(--brand-primary)" }}>SIH 2026</span>
      </div>

      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.label} className="sidebar-section">
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map((item) => {
              const IconComponent = getLucideIcon(item.icon);
              return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
              >
                <span className="sidebar-link-icon"><IconComponent size={18} /></span>
                {item.label}
                {item.badge && (
                  <span className="sidebar-link-badge">{item.badge}</span>
                )}
              </Link>
            )})}
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
              background: "var(--bg-input)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md)",
              padding: "10px",
            }}
          >
            <div className="sidebar-avatar" style={{ background: "var(--brand-primary)", color: "#fff", fontWeight: 700 }}>
              {getInitials(activeUser.name)}
            </div>
            <div className="sidebar-user-info" style={{ overflow: "hidden" }}>
              <div className="sidebar-user-name" style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                <span>{activeUser.name}</span>
              </div>
              <div className="sidebar-user-role" style={{ fontSize: 11, color: "var(--text-accent)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {activeUser.title.split("/")[0].trim()} • Switch ⇄
              </div>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}

function AppShellWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMapPage = pathname === "/map";
  const isLoginPage = pathname === "/login";

  if (isMapPage || isLoginPage) {
    return (
      <main style={{ width: "100vw", height: "100vh", overflow: isMapPage ? "hidden" : "auto", background: isMapPage ? "#0B0F19" : "var(--bg-app)" }}>
        <RouteGuard>{children}</RouteGuard>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <RouteGuard>{children}</RouteGuard>
      </main>
    </div>
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
          <AppShellWrapper>{children}</AppShellWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
