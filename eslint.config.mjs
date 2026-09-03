import js from "@eslint/js";

// Google Apps Script top-level service globals (V8 runtime).
// The `globals` package dropped its googleappsscript preset, so we define the
// commonly used built-in services here. Extend as needed.
const gasGlobals = Object.fromEntries(
  [
    "SpreadsheetApp",
    "DriveApp",
    "DocumentApp",
    "FormApp",
    "SlidesApp",
    "SitesApp",
    "GmailApp",
    "MailApp",
    "CalendarApp",
    "ContactsApp",
    "GroupsApp",
    "LanguageApp",
    "Logger",
    "console",
    "Browser",
    "Session",
    "Utilities",
    "UrlFetchApp",
    "HtmlService",
    "ContentService",
    "XmlService",
    "PropertiesService",
    "CacheService",
    "LockService",
    "ScriptApp",
    "Maps",
    "Charts",
    "Jdbc",
    "CardService",
    "LinearOptimizationService",
    "BigQuery",
    "Drive",
    "Sheets",
    "Docs",
    "Slides",
    "Calendar",
    "Gmail",
    "Tasks",
    "People",
    "Analytics",
    "AdminDirectory",
  ].map((name) => [name, "readonly"]),
);

export default [
  {
    ignores: ["node_modules/**", "gas/**/*.html", "gas/**/*.json"],
  },
  js.configs.recommended,
  {
    files: ["gas/**/*.js", "gas/**/*.gs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: gasGlobals,
    },
    rules: {
      "no-unused-vars": "warn",
    },
  },
];
