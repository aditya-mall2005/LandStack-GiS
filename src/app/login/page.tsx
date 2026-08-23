"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, DEMO_PERSONAS, UserPersona, getLucideIcon } from "@/lib/security/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";
import { LanguageSelector } from "@/components/LanguageSelector";
import * as Lucide from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, loginAs } = useAuth();
  const { t } = useLanguage();
  const [selectedPersona, setSelectedPersona] = useState<UserPersona>(currentUser);
  const [loggingIn, setLoggingIn] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<string | null>(null);

  const handleLogin = (persona: UserPersona) => {
    setSelectedPersona(persona);
    setLoggingIn(true);
    setAuthFeedback(`Authenticating ${persona.name} (${persona.role})...`);

    // Authenticate via central Auth Context
    loginAs(persona.id);

    setTimeout(() => {
      setAuthFeedback(`Access Granted: ${persona.title} [${persona.jurisdiction}]`);
      setTimeout(() => {
        router.push(persona.landingUrl);
      }, 400);
    }, 500);
  };

  return (
    <div className="app-content animate-in" style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--space-2xl) var(--space-lg)" }}>
      {/* Top Language Bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <LanguageSelector variant="compact" />
      </div>

      {/* Header Banner */}
      <div style={{ textAlign: "center", marginBottom: "var(--space-2xl)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--brand-primary)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(59, 130, 246, 0.4)" }}>
            <Lucide.Building2 size={24} color="#fff" />
          </div>
          <span style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.03em" }}>LANDSTACK</span>
          <span className="badge badge-info" style={{ fontSize: 11, fontWeight: 700 }}>RBAC & ABAC Engine</span>
        </div>
        <p style={{ color: "var(--text-accent)", fontSize: 14, maxWidth: 640, margin: "0 auto", lineHeight: 1.6 }}>
          Role-Based Access Control (RBAC) & Attribute-Based Access Control (ABAC) simulation for Departmental Officers & Public Citizens.
        </p>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 18,
            padding: "8px 16px",
            background: "rgba(15, 23, 42, 0.8)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            borderRadius: 30,
            fontSize: 12,
            color: "#e2e8f0",
            maxWidth: "100%",
          }}
        >
          <span>{t("nav.active_role")}:</span>
          <strong style={{ color: "#38bdf8", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span>{React.createElement(getLucideIcon(currentUser.icon), { size: 14 })}</span> {currentUser.name}
          </strong>
          <span style={{ fontSize: 10, background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
            {currentUser.role}
          </span>
        </div>

        {authFeedback && (
          <div
            style={{
              marginTop: 12,
              color: "#34d399",
              fontSize: 13,
              fontWeight: 600,
              animation: "fadeIn 0.2s ease",
            }}
          >
            ✓ {authFeedback}
          </div>
        )}
      </div>

      {/* Personas Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "var(--space-md)" }}>
        {DEMO_PERSONAS.map((account) => {
          const isCurrentActive = currentUser.id === account.id || currentUser.role === account.role;
          const isSelected = selectedPersona.id === account.id;

          return (
            <div
              key={account.id}
              className="card"
              style={{
                cursor: "pointer",
                border: isCurrentActive
                  ? "2px solid #38bdf8"
                  : isSelected
                  ? "2px solid var(--brand-primary)"
                  : "1px solid var(--border-color)",
                background: isCurrentActive
                  ? "rgba(56, 189, 248, 0.06)"
                  : isSelected
                  ? "var(--brand-gradient-subtle)"
                  : "var(--bg-secondary)",
                transition: "all 0.2s ease",
                transform: isCurrentActive || isSelected ? "translateY(-3px)" : "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
                padding: "var(--space-md)",
              }}
              onClick={() => handleLogin(account)}
            >
              {/* Active Badge indicator */}
              {isCurrentActive && (
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    background: "#0284c7",
                    color: "#ffffff",
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: 6,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  ACTIVE
                </div>
              )}

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-subtle)", flexShrink: 0 }}>
                    {(() => { const Icon = getLucideIcon(account.icon); return <Icon size={22} color="var(--text-primary)" />; })()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)" }}>{account.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-accent)", fontWeight: 600 }}>{account.title}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  <span className="badge badge-neutral" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}><Lucide.Building size={12} /> {account.department}</span>
                  <span className="badge badge-info" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}><Lucide.MapPin size={12} /> {account.jurisdiction.split(",")[0]}</span>
                </div>

                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 16 }}>
                  {account.description}
                </p>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
                  <span>Landing: <strong style={{ color: "var(--text-primary)" }}>{account.landingUrl.split("?")[0]}</strong></span>
                  <span style={{ fontFamily: "monospace" }}>{account.role}</span>
                </div>

                <button
                  className={`btn ${isCurrentActive ? "btn-outline" : "btn-primary"}`}
                  style={{ width: "100%", justifyContent: "center", fontWeight: 700, padding: "10px 16px" }}
                  disabled={loggingIn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogin(account);
                  }}
                >
                  {loggingIn && isSelected
                    ? "Switching Persona..."
                    : isCurrentActive
                    ? `Continue as ${account.name} →`
                    : `Sign in as ${account.name} →`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
