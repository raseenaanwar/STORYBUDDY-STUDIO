/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        buddy: {
          purple: "#7C3AED",
          "purple-light": "#EDE9FE",
          yellow: "#F59E0B",
          "yellow-light": "#FEF3C7",
          green: "#10B981",
          "green-light": "#D1FAE5",
          pink: "#EC4899",
          "pink-light": "#FCE7F3",
          blue: "#3B82F6",
          "blue-light": "#DBEAFE",
        },
      },
      fontFamily: {
        story: ["Georgia", "Cambria", "serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-soft": "bounce 2s infinite",
      },
    },
  },
  plugins: [],
};
