"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/lib/i18n/language-context";
import { Globe, Check, Search, X } from "lucide-react";

interface LanguageSelectorProps {
  variant?: "compact" | "pill" | "sidebar" | "full";
  className?: string;
}

export function LanguageSelector({ variant = "compact", className = "" }: LanguageSelectorProps) {
  const { language, setLanguage, supportedLanguages, currentLanguageMeta, isMounted } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const filteredLanguages = supportedLanguages.filter((l) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      l.name.toLowerCase().includes(q) ||
      l.englishName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  });

  const activeMeta = isMounted ? currentLanguageMeta : supportedLanguages[0];

  const modalDialog = (
    <>
      {/* Universal Fullscreen Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 99998,
          background: "rgba(15, 23, 42, 0.45)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
        }}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Universal Centered Modal Dialog */}
      <div
        className="animate-in no-scrollbar language-dropdown-menu"
        ref={modalRef}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(340px, calc(100vw - 32px))",
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "80vh",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.08)",
          zIndex: 99999,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header & Search */}
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid var(--border-default)",
            background: "var(--bg-card)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 700,
                fontSize: 13,
                color: "var(--text-primary)",
              }}
            >
              <Globe size={16} style={{ color: "var(--brand-primary)" }} />
              <span>Select Language / भाषा चुनें</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-tertiary)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                borderRadius: 4,
              }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Quick Search Input */}
          <div style={{ position: "relative" }}>
            <Search
              size={13}
              style={{
                position: "absolute",
                left: 10,
                top: 9,
                color: "var(--text-tertiary)",
              }}
            />
            <input
              type="text"
              placeholder="Search language / भाषा खोजें..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 10px 6px 30px",
                fontSize: 12,
                background: "var(--bg-input)",
                border: "1px solid var(--border-default)",
                borderRadius: 6,
                color: "var(--text-primary)",
                outline: "none",
              }}
              autoFocus
            />
          </div>
        </div>

        {/* Clean Language Options List */}
        <div
          className="no-scrollbar"
          style={{
            maxHeight: 300,
            overflowY: "auto",
            padding: "6px",
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {filteredLanguages.map((lang) => {
            const isSelected = language === lang.code;

            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                  setSearchQuery("");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  borderRadius: "var(--radius-md)",
                  background: isSelected ? "var(--brand-gradient-subtle)" : "transparent",
                  border: isSelected ? "1px solid var(--brand-primary)" : "1px solid transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.1s ease",
                  fontFamily: "inherit",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "var(--bg-input)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: isSelected ? 700 : 600,
                      color: isSelected ? "var(--brand-primary)" : "var(--text-primary)",
                    }}
                  >
                    {lang.name}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                    {lang.englishName !== lang.name ? `(${lang.englishName})` : ""}
                  </span>
                </div>

                {isSelected && (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "var(--brand-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}

          {filteredLanguages.length === 0 && (
            <div
              style={{
                padding: "20px 8px",
                textAlign: "center",
                color: "var(--text-tertiary)",
                fontSize: 12,
              }}
            >
              No language found / कोई भाषा नहीं मिली
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      <div
        className={`language-selector-wrapper ${className}`}
        style={{
          position: "relative",
          display: variant === "sidebar" ? "block" : "inline-block",
          width: variant === "sidebar" ? "100%" : "auto",
        }}
      >
        {/* 1. Compact Header Variant */}
        {variant === "compact" && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 20,
              background: "var(--bg-input)",
              border: `1px solid ${isOpen ? "var(--brand-primary)" : "var(--border-default)"}`,
              color: "var(--text-primary)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Select Language / भाषा चुनें"
            aria-label="Select Language"
            aria-expanded={isOpen}
          >
            <Globe size={13} style={{ color: "var(--brand-primary)" }} />
            <span>{activeMeta.name}</span>
            <span style={{ fontSize: 10, color: "var(--text-tertiary)", opacity: 0.8 }}>
              {activeMeta.code.toUpperCase()}
            </span>
          </button>
        )}

        {/* 2. Pill Variant (Mobile Header) */}
        {variant === "pill" && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 9px",
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 18,
              background: "var(--bg-input)",
              border: `1px solid ${isOpen ? "var(--brand-primary)" : "var(--border-default)"}`,
              color: "var(--text-primary)",
              cursor: "pointer",
              maxWidth: 130,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            aria-label="Select Language"
          >
            <Globe size={12} style={{ color: "var(--brand-primary)", flexShrink: 0 }} />
            <span>{activeMeta.name}</span>
          </button>
        )}

        {/* 3. Sidebar Footer Variant */}
        {variant === "sidebar" && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-input)",
              border: `1px solid ${isOpen ? "var(--brand-primary)" : "var(--border-default)"}`,
              cursor: "pointer",
              fontSize: 12,
              color: "var(--text-primary)",
              transition: "all 0.15s ease",
              marginBottom: 8,
              textAlign: "left",
              fontFamily: "inherit",
            }}
            aria-label="Select Language"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Globe size={15} style={{ color: "var(--brand-primary)" }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{activeMeta.name}</div>
                <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{activeMeta.englishName}</div>
              </div>
            </div>
            <span className="badge badge-neutral" style={{ fontSize: 10, padding: "2px 6px" }}>
              Change
            </span>
          </button>
        )}
      </div>

      {/* Render Modal via Portal directly to body */}
      {isOpen && isMounted && typeof document !== "undefined" && createPortal(modalDialog, document.body)}
    </>
  );
}
