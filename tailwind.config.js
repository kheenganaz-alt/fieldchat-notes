/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 50px -24px rgba(15, 23, 42, 0.45)",
        glass: "0 18px 60px -28px rgba(59, 130, 246, 0.45)"
      },
      colors: {
        field: {
          ink: "#111827",
          mist: "#f8fafc",
          blue: "#2563eb",
          violet: "#7c3aed",
          mint: "#10b981",
          rose: "#f43f5e",
          amber: "#f59e0b"
        }
      }
    }
  },
  plugins: []
};
