/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        primary: ["var(--primary-font)"],
        mono: ["var(--secondary-font)"],
      },
      colors: {
        midnight: "#091A23",
        "hyper-04": "#FD736A",
        "hyper-05": "#FF4438",
        "hyper-06": "#EB352A",
        "hyper-07": "#E4291E",
        "hyper-08": "#D1281E",
        "hyper-09": "#8A221C",
        "hyper-10": "#351D22",
        dusk: {
          DEFAULT: "#163341",
          "01": "#F3F3F3",
          "09": "#0D212C",
          "90": "#2D4754",
          "50": "#8A99A0",
          "30": "#B9C2C6",
          "10": "#D9D9D9",
        },
        volt: {
          DEFAULT: "#DCFF1E",
          "06": "#D0F41D",
          "07": "#BFE112",
          "08": "#A9CA03",
          "09": "#8CAA00",
          "11": "#4E5F02",
          "50": "#F1FFA5",
          "10": "#FBFFE8",
        },
      },
      boxShadow: {},
    },
  },
  plugins: [],
};
