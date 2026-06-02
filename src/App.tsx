import { useState } from "react";
import { AccountVault } from "./components/account-vault";
import { LOCAL_SESSION_KEY, LocalLogin } from "./components/local-login";
import { type AppTheme, isAppTheme, THEME_STORAGE_KEY } from "./theme";

export default function App() {
  const [unlocked, setUnlocked] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.sessionStorage.getItem(LOCAL_SESSION_KEY) === "true";
  });
  const [theme, setTheme] = useState<AppTheme>(() => {
    if (typeof window === "undefined") {
      return "andre";
    }

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    return isAppTheme(storedTheme) ? storedTheme : "andre";
  });

  function changeTheme(nextTheme: AppTheme) {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  }

  function unlock() {
    window.sessionStorage.setItem(LOCAL_SESSION_KEY, "true");
    setUnlocked(true);
  }

  function lock() {
    window.sessionStorage.removeItem(LOCAL_SESSION_KEY);
    setUnlocked(false);
  }

  return unlocked ? (
    <AccountVault theme={theme} onLock={lock} onThemeChange={changeTheme} />
  ) : (
    <LocalLogin theme={theme} onThemeChange={changeTheme} onUnlock={unlock} />
  );
}
