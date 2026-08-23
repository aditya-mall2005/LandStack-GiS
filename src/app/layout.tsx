"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { AuthProvider, useAuth, DEMO_PERSONAS, getLucideIcon } from "@/lib/security/auth-context";
import { getFilteredNavSections } from "@/lib/security/route-guard";
import { RouteGuard } from "@/components/RouteGuard";
import * as Lucide from "lucide-react";
import "./globals.css";

import { useState, useEffect } from "react";
import { Menu, X, Home, Map as MapIcon, Search, Landmark, Layers } from "lucide-react";

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { currentUser, getInitials, isMounted } = useAuth();
  const activeUser = isMounted ? currentUser : DEMO_PERSONAS[0];
  const navSections = getFilteredNavSections(activeUser.role);

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-backdrop ${isOpen ? "active" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`app-sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-logo" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="sidebar-logo-text" style={{ color: "var(--brand-primary)", fontWeight: 800 }}>SIH 2026</span>
          <button
            onClick={onClose}
            className="mobile-close-btn"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "var(--text-tertiary)",
              display: "none",
            }}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
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
                    onClick={onClose}
                    className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
                  >
                    <span className="sidebar-link-icon"><IconComponent size={18} /></span>
                    {item.label}
                    {item.badge && (
                      <span className="sidebar-link-badge">{item.badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link href="/login" onClick={onClose} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
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
    </>
  );
}

function MobileHeader({ onToggleMenu, isOpen }: { onToggleMenu: () => void; isOpen: boolean }) {
  const { currentUser, isMounted } = useAuth();
  const activeUser = isMounted ? currentUser : DEMO_PERSONAS[0];

  return (
    <header className="mobile-header">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={onToggleMenu}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-primary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 6,
            borderRadius: 6,
          }}
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span style={{ fontWeight: 800, fontSize: 16, color: "var(--brand-primary)", letterSpacing: "-0.02em" }}>
          LandStack
        </span>
      </div>

      <Link href="/login" style={{ textDecoration: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-input)", border: "1px solid var(--border-default)", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
          <span>{activeUser.title.split(" ")[0]}</span>
        </div>
      </Link>
    </header>
  );
}

function MobileBottomNav({ onToggleMenu }: { onToggleMenu: () => void }) {
  const pathname = usePathname();
  const { currentUser, isMounted } = useAuth();
  const role = isMounted ? currentUser.role : "CITIZEN";
  const servicesHref = role === "CITIZEN" ? "/services" : "/officer";
  const servicesLabel = role === "CITIZEN" ? "Services" : "Officer";

  return (
    <nav className="mobile-bottom-nav">
      <Link href="/" className={`mobile-nav-item ${pathname === "/" ? "active" : ""}`}>
        <span className="mobile-nav-icon"><Home size={20} /></span>
        <span>Home</span>
      </Link>

      <Link href="/map" className={`mobile-nav-item ${pathname === "/map" ? "active" : ""}`}>
        <span className="mobile-nav-icon"><MapIcon size={20} /></span>
        <span>GIS Map</span>
      </Link>

      <Link href="/search" className={`mobile-nav-item ${pathname === "/search" ? "active" : ""}`}>
        <span className="mobile-nav-icon"><Search size={20} /></span>
        <span>Search</span>
      </Link>

      <Link href={servicesHref} className={`mobile-nav-item ${pathname.startsWith(servicesHref) ? "active" : ""}`}>
        <span className="mobile-nav-icon"><Landmark size={20} /></span>
        <span>{servicesLabel}</span>
      </Link>

      <button
        onClick={onToggleMenu}
        className="mobile-nav-item"
        style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
      >
        <span className="mobile-nav-icon"><Layers size={20} /></span>
        <span>Menu</span>
      </button>
    </nav>
  );
}

function AppShellWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isLoginPage = pathname === "/login";

  // Automatically close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (isLoginPage) {
    return (
      <main style={{ width: "100vw", height: "100vh", overflow: "auto", background: "var(--bg-app)" }}>
        <RouteGuard>{children}</RouteGuard>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <MobileHeader onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isOpen={isMobileMenuOpen} />
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className="app-main">
        <RouteGuard>{children}</RouteGuard>
      </main>
      <MobileBottomNav onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
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
