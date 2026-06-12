import { useAppStore, THEME_CYCLE, type Theme } from "@/stores/appStore";

const themeLabels: Record<Theme, string> = {
  light: "Hell",
  dark: "Dunkel",
  auto: "Auto",
};

const themeIcons: Record<Theme, string> = {
  light: "\u2600\uFE0F",
  dark: "\uD83C\uDF19",
  auto: "\uD83D\uDDA5\uFE0F",
};

export function ThemeToggle() {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);

  return (
    <button
      type="button"
      className="btn btn-icon theme-toggle"
      onClick={toggleTheme}
      title={`Thema: ${themeLabels[theme]} – Klicken für ${themeLabels[THEME_CYCLE[theme]]}`}
      aria-label={`Theme wechseln (aktuell: ${themeLabels[theme]})`}
    >
      {themeIcons[theme]}
    </button>
  );
}
