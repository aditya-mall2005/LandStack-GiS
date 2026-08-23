"use client";

import React, { useState, useRef, useEffect } from "react";
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const filteredLanguages = supportedLanguages.filter((l) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      l.name.toLowerCase().includes(q) ||
      l.englishName.toLowerCase().includes(q) ||
      l.region.toLowerCase().includes(q) ||
      l.landTermsSummary.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  });

  const activeMeta = isMounted ? currentLanguageMeta : supportedLanguages[0];

  return (
    <div className={`language-selector-wrapper ${className}`} style={{ position: "relative", display: "inline-block" }} ref={dropdownRef}>
      {/* Trigger Buttons by Variant */}
      {variant === "compact" && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn btn-outline"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 20,
            background: "var(--bg-input)",
            borderColor: isOpen ? "var(--brand-primary)" : "var(--border-default)",
            color: "var(--text-primary)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          title="Change language / भाषा बदलें"
          aria-label="Select Language"
          aria-expanded={isOpen}
        >
          <Globe size={14} style={{ color: "var(--brand-primary)" }} />
          <span>{activeMeta.name}</span>
          <span style={{ fontSize: 10, color: "var(--text-tertiary)", borderLeft: "1px solid var(--border-default)", paddingLeft: 4 }}>
            {activeMeta.code.toUpperCase()}
          </span>
        </button>
      )}

      {variant === "pill" && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 20,
            background: "var(--bg-input)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
            cursor: "pointer",
          }}
          aria-label="Select Language"
        >
          <Globe size={13} style={{ color: "var(--brand-primary)" }} />
          <span>{activeMeta.name}</span>
        </button>
      )}

      {variant === "sidebar" && (
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-input)",
            border: "1px solid var(--border-default)",
            cursor: "pointer",
            fontSize: 12,
            color: "var(--text-primary)",
            transition: "all 0.15s ease",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Globe size={16} style={{ color: "var(--brand-primary)" }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{activeMeta.name}</div>
              <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{activeMeta.englishName} • {activeMeta.region.split("(")[0]}</div>
            </div>
          </div>
          <span className="badge badge-neutral" style={{ fontSize: 10 }}>
            Change 🌐
          </span>
        </div>
      )}

      {/* Language Modal / Dropdown Menu */}
      {isOpen && (
        <div
          className="animate-in"
          style={{
            position: "absolute",
            top: variant === "sidebar" ? "auto" : "calc(100% + 8px)",
            bottom: variant === "sidebar" ? 0 : "auto",
            left: variant === "sidebar" ? "calc(100% + 12px)" : "auto",
            right: variant === "sidebar" ? "auto" : 0,
            width: 320,
            maxWidth: "90vw",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-xl)",
            zIndex: 1000,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header & Search */}
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-default)", background: "var(--bg-card)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 13, color: "var(--text-primary)" }}>
                <Globe size={16} style={{ color: "var(--brand-primary)" }} />
                <span>Pan-India Regional Languages</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-tertiary)", cursor: "pointer", padding: 2 }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Search */}
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "var(--text-tertiary)" }} />
              <input
                type="text"
                placeholder="Search language or state (e.g. Tamil, Bihar)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px 6px 30px",
                  fontSize: 11,
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

          {/* Language Options List */}
          <div
            className="no-scrollbar"
            style={{
              maxHeight: 340,
              overflowY: "auto",
              padding: "6px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {filteredLanguages.map((lang) => {
              const isSelected = language === lang.code;

              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: "var(--radius-md)",
                    background: isSelected ? "var(--brand-gradient-subtle)" : "transparent",
                    border: isSelected ? "1px solid var(--brand-primary)" : "1px solid transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
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
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{lang.flag}</span>
                      <strong style={{ fontSize: 13, color: isSelected ? "var(--brand-primary)" : "var(--text-primary)" }}>
                        {lang.name}
                      </strong>
                      <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                        ({lang.englishName})
                      </span>
                    </div>

                    <div style={{ fontSize: 10, color: "var(--text-accent)", marginTop: 2 }}>
                      📍 {lang.region}
                    </div>

                    <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 2, fontStyle: "italic" }}>
                      Key Terms: {lang.landTermsSummary}
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--brand-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0, marginTop: 2 }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}

            {filteredLanguages.length === 0 && (
              <div style={{ padding: "20px 10px", textAlign: "center", color: "var(--text-tertiary)", fontSize: 12 }}>
                No languages found matching &quot;{searchQuery}&quot;
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border-default)", background: "var(--bg-card)", fontSize: 10, color: "var(--text-tertiary)", textAlign: "center" }}>
            Pan-India National Cadastral Multi-Language Standard
          </div>
        </div>
      )}
    </div>
  );
}
