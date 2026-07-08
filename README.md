# 🛍️ Chettinad E-commerce Website

A full-stack e-commerce web application built using **Node.js**, **Express.js**, **MongoDB**, and **EJS**. The project provides a complete shopping experience with user authentication, product browsing, cart management, orders, and an admin dashboard.

---

## 🚀 Features

### User
- User Registration & Login
- Secure Password Hashing (bcrypt)
- Session-based Authentication
- Product Listing
- Product Search
- Shopping Cart
- Wishlist
- Checkout Process
- Order History
- User Profile Management

### Admin
- Admin Login
- Dashboard
- Product Management (Add/Edit/Delete)
- Category Management
- User Management
- Block/Unblock Users
- Order Management

---

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript
- Bootstrap
- EJS Templates

### Backend
- Node.js
- Express.js

### Database
- MongoDB
- Mongoose

### Authentication
- express-session
- bcrypt

### Deployment
- AWS EC2
- Nginx
- PM2
- Let's Encrypt SSL
- Git & GitHub

---

## 📂 Project Structure

```
project/
│
├── config/
├── controllers/
├── middleware/
├── models/
├── public/
│   ├── css/
│   ├── images/
│   └── js/
├── routes/
├── views/
│   ├── admin/
│   └── user/
├── app.js
├── package.json
└── README.md
```

---

## ⚙️ Installation

Clone the repository

```bash
git clone <repository-url>
```

Go to the project folder

```bash
cd nodewebapp
```

Install dependencies

```bash
npm install
```

Create a `.env` file

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_secret_key
```

Start the application

```bash
npm start
```

or

```bash
npm run dev
```

---

## 🌐 Deployment

The application is deployed using:

- AWS EC2
- Nginx Reverse Proxy
- PM2 Process Manager
- MongoDB Atlas
- HTTPS using Let's Encrypt

---

## 🔐 Security Features

- Password Hashing using bcrypt
- Session Authentication
- Environment Variables using dotenv
- Protected Routes
- Input Validation

---

## 📚 Learning Outcomes

Through this project I learned:

- Express.js routing
- MVC architecture
- MongoDB & Mongoose
- Authentication using Sessions
- CRUD operations
- Nginx configuration
- PM2 process management
- AWS EC2 deployment
- Git & GitHub workflow

---

## 👩‍💻 Author

**Sruthi M**

GitHub: https://github.com/sruthi-m123

LinkedIn: https://www.linkedin.com/in/sruthi-m-983061202/

---
