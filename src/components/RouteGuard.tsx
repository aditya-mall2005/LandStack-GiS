"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/security/auth-context";
import { checkRouteAccess } from "@/lib/security/route-guard";
import apiClient from "@/lib/api-client";
import { ShieldAlert } from "lucide-react";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, isMounted } = useAuth();
  const accessState = checkRouteAccess(pathname, currentUser.role);

  useEffect(() => {
    // Log security event for audit trail when access is denied
    if (isMounted && !accessState.allowed) {
      apiClient.post("/api/v1/security/policy-check", {
        userId: currentUser.id,
        userRole: currentUser.role,
        action: `NAVIGATE_TO_${pathname.toUpperCase().replace(/\//g, "_")}`,
        resourceType: "ROUTE",
        resourceId: pathname,
        userScope: {
          state: currentUser.stateCode,
          district: currentUser.districtCode,
          circle: currentUser.circleCode,
        },
        resourceScope: {
          state: "BR",
          district: "BR-10",
        },
      }).catch(() => {});
    }
  }, [isMounted, accessState.allowed, pathname, currentUser]);

  if (isMounted && !accessState.allowed) {
    return (
      <div className="app-content animate-in" style={{ maxWidth: 840, margin: "40px auto", padding: "0 20px" }}>
        <div
          className="card"
          style={{
            background: "var(--bg-elevated)",
            border: "2px solid #ef4444",
            borderRadius: "var(--radius-lg)",
            padding: "36px 32px",
            boxShadow: "0 8px 32px rgba(239, 68, 68, 0.1)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.1)",
              border: "2px solid #ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 0 24px rgba(239, 68, 68, 0.2)",
            }}
          >
            <ShieldAlert size={36} color="#ef4444" />
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span className="badge badge-error" style={{ fontSize: 12, padding: "4px 10px" }}>
              403 FORBIDDEN • RBAC ACCESS DENIED
            </span>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--text-primary)", margin: "12px 0 8px" }}>
            Restricted Statutory Route
          </h1>

          <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 580, margin: "0 auto 24px", lineHeight: 1.6 }}>
            You do not have the required authorization or jurisdictional clearance to access 
            <strong style={{ color: "var(--text-primary)", fontFamily: "monospace", margin: "0 4px", background: "var(--bg-input)", padding: "2px 6px", borderRadius: 4 }}>{pathname}</strong>.
          </p>

          {/* Security Audit Details Box */}
          <div
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md)",
              padding: "16px 20px",
              maxWidth: 620,
              margin: "0 auto 28px",
              textAlign: "left",
              fontSize: 12,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8, marginBottom: 6 }}>
              <span style={{ color: "var(--text-tertiary)" }}>Current Active Role:</span>
              <strong style={{ color: "var(--text-primary)" }}>
                {currentUser.role} ({currentUser.name})
              </strong>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8, marginBottom: 6 }}>
              <span style={{ color: "#94a3b8" }}>Assigned Jurisdiction:</span>
              <span style={{ color: "#e2e8f0" }}>{currentUser.jurisdiction}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8, marginBottom: 6 }}>
              <span style={{ color: "#94a3b8" }}>Authorized Roles:</span>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {accessState.requiredRoles.map((r) => (
                  <span key={r} className="badge badge-neutral" style={{ fontSize: 10 }}>
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8 }}>
              <span style={{ color: "#94a3b8" }}>Audit Trail:</span>
              <span style={{ color: "#34d399", fontFamily: "monospace", fontSize: 11 }}>
                ● Logged to SHA-256 Tamper-Evident Security Log
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" className="btn btn-primary" style={{ padding: "10px 20px", fontSize: 13, fontWeight: 700 }}>
              <span>⇄</span> Switch to Authorized Persona
            </Link>
            <Link href="/" className="btn btn-outline" style={{ padding: "10px 20px", fontSize: 13 }}>
              Return to My Dashboard →
            </Link>
            <Link href="/map" className="btn btn-secondary" style={{ padding: "10px 20px", fontSize: 13 }}>
              🗺️ Cadastral Map
            </Link>
          </div>

          <div style={{ marginTop: 24, fontSize: 11, color: "var(--text-tertiary)" }}>
            Statutory Notice: Unauthorized access attempts are monitored under the Digital Personal Data Protection (DPDPA) Act 2023 and Information Technology Act 2000.
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
