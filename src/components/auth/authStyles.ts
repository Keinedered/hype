/**
 * Общие стили для компонентов авторизации
 * Систематизированные классы для консистентного дизайна
 * Использует CSS переменные из темы для поддержки темной/светлой темы
 */

// Базовые стили для форм
export const authFormStyles = {
  container: "w-full max-w-md space-y-5",
  fieldGroup: "space-y-2",
  label: "font-mono text-xs uppercase tracking-wider flex items-center gap-2 text-foreground font-semibold",
  input: "border-2 border-border font-mono h-12 transition-all duration-200 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] focus:border-border bg-input-background",
  button: "w-full h-14 border-2 border-border bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground font-mono tracking-wider text-base transition-all duration-200 disabled:opacity-50 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  toggleButton: "text-sm font-mono underline hover:no-underline text-muted-foreground hover:text-foreground transition-colors duration-200",
} as const;

// Стили для карточек
export const authCardStyles = {
  base: "bg-card border-2 border-border p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
  infoBox: "p-4 border-2 border-border bg-muted",
  infoTitle: "text-xs font-mono mb-2 font-bold uppercase tracking-wider text-foreground",
  infoText: "text-xs font-mono text-muted-foreground",
} as const;

// Стили для заголовков
export const authHeaderStyles = {
  iconContainer: "inline-flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground mb-6 relative transition-transform duration-300 hover:scale-105",
  iconCorner: "absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-border bg-card",
  iconCornerBottom: "absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-border bg-card",
  title: "text-4xl font-mono font-bold tracking-wider mb-3 text-foreground",
  subtitle: "text-base text-muted-foreground font-mono leading-relaxed",
  badge: "bg-primary text-primary-foreground px-4 py-2 inline-block font-mono text-sm tracking-wide mb-4",
} as const;

// Стили для сообщений об ошибках
export const authErrorStyles = {
  container: "p-4 border-2 border-destructive bg-destructive/10 flex items-center gap-2 transition-all duration-300",
  icon: "h-4 w-4 text-destructive flex-shrink-0",
  text: "text-sm font-mono text-destructive",
} as const;

// Стили для информационных панелей (черный фон)
export const authInfoPanelStyles = {
  container: "bg-black text-white flex-col items-center justify-center p-12 relative overflow-hidden",
  decorative: "absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2",
  content: "max-w-md relative z-10 space-y-8",
  featureItem: "flex items-start gap-4 group",
  featureIcon: "w-10 h-10 border-2 border-white flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:text-black transition-all duration-300",
} as const;

// Стили для информационных карточек (белый фон)
export const authInfoCardStyles = {
  container: "bg-card border-2 border-border p-4",
  title: "font-mono font-bold mb-2 tracking-wide text-foreground",
  description: "text-sm text-muted-foreground font-mono leading-relaxed",
} as const;

// Стили для логотипа
export const authLogoStyles = {
  container: "relative inline-block mb-6",
  badge: "bg-primary text-primary-foreground px-8 py-4 inline-block font-mono tracking-wider text-2xl",
  cornerTop: "absolute -top-2 -left-2 w-5 h-5 border-l-2 border-t-2 border-border",
  cornerBottom: "absolute -bottom-2 -right-2 w-5 h-5 border-r-2 border-b-2 border-border",
} as const;

