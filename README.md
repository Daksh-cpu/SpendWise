# SpendWise Expense Dashboard

SpendWise is a sleek, premium dark-themed single-page application built to help users manually log and track their personal home expenses. It features a modern glassmorphism aesthetic and interactive data visualization.

## 🌟 Features

- **Premium Dark Mode UI**: Modern aesthetic with intuitive navigation and fully responsive layout.
- **Budget Tracking**: Set monthly limits for different categories and track your spending against them with real-time visual progress bars.
- **Interactive Dashboards**: Color-coded donut pie charts and monthly bar charts summarizing your data.
- **Expense Logging**: Easily log expenses with description, amount in INR (₹), category, and date.
- **Local Storage**: All data is kept completely private and saved securely in your local browser storage.

## 🚀 Technologies Used

- **HTML5** & **Vanilla CSS**
- **Vanilla JavaScript** (No heavy frameworks used)
- **Chart.js** (For dynamic charts and graphs)

## 💻 How to Run Locally ?

Since this application utilizes Local Storage, you will need to serve it over a local HTTP server (opening the file directly via `file:///` may cause the browser to block data persistence).

**Option 1: Using VS Code**
1. Install the "Live Server" extension.
2. Right-click on `index.html` and click "Open with Live Server".

**Option 2: Using Python**
1. Open your terminal in the project directory.
2. Run `python -m http.server 8000` (or `python3 -m http.server 8000`).
3. Open your browser and navigate to `http://localhost:8000`.
