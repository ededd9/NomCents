# 🥦 NomCents: Affordable Nutrition Made Simple

**NomCents** is a full-stack web app that helps users make informed grocery choices by balancing both *nutrition* and *budget*. With rising food costs and limited time to plan meals, many people struggle to maintain a healthy diet without overspending — NomCents provides a simple, centralized way to track both.

---

## 🧠 Motivation

Nutrition apps focus on calories and macros. Budgeting apps focus on spending. But there isn't a tool that effectively combines both.  
NomCents bridges that gap — helping users make smarter food decisions by integrating cost-awareness with dietary tracking.

This project was developed as part of a university software engineering course.

---

## 🚀 Features

- 🌤️ Dynamic homepage greeting based on time of day (includes user's name if logged in)
- 🔍 Product search powered by USDA and Kroger APIs, with filters and price toggle
- 🏪 Store selector that populates Kroger locations near a given ZIP code
- 💵 Product details popup with price comparisons between selected Kroger stores
- ⭐ Favorites page to manage bookmarked items and add to grocery list
- 🛒 Grocery list with:
  - Quantity controls
  - Cart total
  - Weekly budget tracking
- 📅 Logs page with:
  - Daily calorie bar graph (turns red if over budget)
  - Food log (calories, protein, fat, carbs)
  - Weight & spending logs
- 📈 Progress graphs for weekly calories, weight change, and spending
- 👤 Profile page to enter personal info for BMR & daily calorie estimation, weekly grocery budget
- 🔐 Login system with Google OAuth or custom email/password auth

---

## 🛠️ Tech Stack

- **Frontend**: React + Vite  
- **Backend**: Flask (Python)  
- **Database**: MongoDB  
- **Auth**: Google OAuth 2.0 + custom login system

---

## 🌐 APIs Used

- [USDA FoodData Central API](https://fdc.nal.usda.gov/)
- [Kroger API](https://developer.kroger.com/)
- [Google OAuth](https://developers.google.com/identity)

---

## ⚙️ Getting Started (Local Development)

### 1. Clone the repository

git clone https://github.com/CMSC447-Software-Engineering-I-SP2025/Team-4-Repository.git
cd Team-4-Repository/frontend

2. Install frontend dependencies

npm install

3. Install backend dependencies

cd ../backend
pip install -r requirements.txt

4. Set up environment variables

Update the .env file in the backend directory with:
KROGER_API_KEY=your-kroger-api-key
KROGER_API_SECRET=your-kroger-api-secret

🔁 Note: Kroger API keys expire every ~30 days and must be refreshed at developer.kroger.com.
The USDA API key is already embedded in the code (backend/backend.py) and doesn’t require setup.

5. Run the app

cd ../frontend
npm run dev
This runs both the frontend and backend concurrently.

📄 License / Notes
This project is intended for educational and demonstration purposes only.
Food and pricing data provided by USDA and Kroger APIs.
