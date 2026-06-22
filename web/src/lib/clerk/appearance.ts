export const clerkAppearance = {
  variables: {
    colorPrimary: "#14b8a6",
    colorDanger: "#ef4444",
    colorSuccess: "#22c55e",
    colorWarning: "#f97316",
    colorNeutral: "#ffffff",
    colorForeground: "#ffffff",
    colorMutedForeground: "#9ca3af",
    colorBackground: "#0a0a0a",
    colorMuted: "#1a1a1a",
    colorInput: "#1a1a1a",
    colorInputForeground: "#ffffff",
    colorBorder: "#2a2a2a",
    colorRing: "rgba(20, 184, 166, 0.4)",
    borderRadius: "0.75rem",
    fontSize: "0.875rem",
  },
  layout: {
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "iconButton" as const,
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "bg-transparent shadow-none border-0 p-0 gap-5",
    header: "hidden",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton:
      "h-11 border border-command-border bg-command-card-elevated text-command-text transition-colors hover:border-command-teal/40 hover:bg-command-card",
    socialButtonsBlockButtonText: "text-sm font-medium",
    dividerLine: "bg-command-border",
    dividerText:
      "text-[10px] font-semibold uppercase tracking-[0.2em] text-command-text-muted",
    formFieldLabel:
      "text-[11px] font-semibold uppercase tracking-wider text-command-text-muted",
    formFieldInput:
      "h-11 border-command-border bg-command-card-elevated text-command-text placeholder:text-command-text-muted focus:border-command-teal/50",
    formButtonPrimary:
      "h-11 bg-command-teal text-xs font-bold uppercase tracking-wider text-black shadow-none transition-colors hover:bg-command-teal-bright",
    footerActionLink: "text-command-teal-bright hover:text-command-teal",
    footerActionText: "text-command-text-secondary text-sm",
    identityPreviewText: "text-command-text",
    identityPreviewEditButton: "text-command-teal-bright",
    formFieldInputShowPasswordButton: "text-command-text-muted",
    otpCodeFieldInput: "border-command-border bg-command-card-elevated",
    alertText: "text-sm",
    footerAction: "hidden",
    footer: "pt-2 [&_.cl-footer]:opacity-50",
  },
};
