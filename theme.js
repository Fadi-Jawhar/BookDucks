/** Temahantering */
const loadTheme = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/api/themes?filters[active][$eq]=true`);
    const theme = res.data.data[0]?.name || "light";
    applyTheme(theme);
  } catch {
    applyTheme("light");
  }
};

const applyTheme = (theme) => {
  const root = document.documentElement;
  if (theme === "dark") {
    root.style.setProperty("--bg", "#1e1e1e");
    root.style.setProperty("--text", "#f5f5f5");
    root.style.setProperty("--primary", "#333");
  } else if (theme === "sepia") {
    root.style.setProperty("--bg", "#f4ecd8");
    root.style.setProperty("--text", "#5b4636");
    root.style.setProperty("--primary", "#a58c6f");
  } else {
    root.style.setProperty("--bg", "#ffffff");
    root.style.setProperty("--text", "#000000");
    root.style.setProperty("--primary", "#0055aa");
  }
};