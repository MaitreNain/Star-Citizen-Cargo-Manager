import { createContext, useContext, useState } from "react";
import { type Locale, type TranslationKey, getTranslations } from "./translations";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem("locale");
    return saved === "en" ? "en" : "fr";
  });

  function setLocaleAndSave(l: Locale) {
    localStorage.setItem("locale", l);
    setLocale(l);
  }
  const translations = getTranslations(locale);
  const t = (key: TranslationKey) => translations[key];

  return (
    <LanguageContext.Provider value={{ locale, setLocale: setLocaleAndSave, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
