# Naashpati E-commerce Platform

A full-stack e-commerce platform for herbal products built with React, Node.js, Express, and MongoDB.

## 🚀 Features

- **User Authentication**: JWT-based authentication with access and refresh tokens
- **Product Management**: CRUD operations for products with image uploads
- **Shopping Cart**: Persistent cart with localStorage
- **Order Management**: Complete order lifecycle with Stripe payments
- **Reviews & Ratings**: User reviews and product ratings
- **Admin Dashboard**: Comprehensive admin panel for managing products, orders, and users
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Security**: Input validation, rate limiting, CORS, and secure password hashing

## 🛠️ Tech Stack

### Frontend

- React 19
- Vite
- Redux Toolkit
- React Router
- Tailwind CSS
- React Hot Toast
- Lucide React Icons

### Backend

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs
- Cloudinary (image uploads)
- Stripe (payments)
- Nodemailer (email)

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB
- npm or yarn

## 🔧 Installation

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory and add your environment variables:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/naashpati
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
   JWT_REFRESH_EXPIRE=7d
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_EMAIL=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   FROM_NAME=Naashpati
   FROM_EMAIL=noreply@naashpati.com
   CLIENT_URL=http://localhost:5173
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the root directory (if not already there)

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:

   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   VITE_APP_NAME=Naashpati
   VITE_APP_URL=http://localhost:5173
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## 🗄️ Database Setup

Make sure MongoDB is running on your system. The application will automatically create the necessary collections.

To create an admin account, run:

```bash
cd backend
npm run seed
```

The admin account can be customized using `backend/.env`:

```env
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@naashpati.com
ADMIN_PASSWORD=Admin@123
ADMIN_ROLE=admin
```

## 📧 Email Configuration

For password reset functionality, configure your SMTP settings in the backend `.env` file. You can use Gmail, SendGrid, or any other SMTP provider.

## 💳 Payment Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe dashboard
3. Add them to your environment variables
4. For testing, use Stripe's test card numbers

## 🖼️ Image Upload Setup

1. Create a Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. Get your cloud name, API key, and API secret
3. Add them to your backend environment variables

## 🚀 Deployment

### Backend Deployment

- Use services like Heroku, Railway, or Vercel
- Set environment variables in your deployment platform
- Make sure MongoDB is accessible from your deployment environment

### Hostinger Deployment (No-Crash Checklist)

If you are deploying on Hostinger, use this sequence to avoid the common runtime crashes (especially port conflicts and CORS problems):

1. Backend setup on Hostinger:
   - Upload the `backend` folder.
   - In Hostinger Node.js app settings, set:
     - Application mode: `production`
     - Startup file: `server.js`
     - Node version: 18+ (20+ recommended)
   - Run install command in backend directory: `npm install --omit=dev`

2. Backend environment variables:
   - Use `backend/.env.production.example` as template.
   - Set `NODE_ENV=production`.
   - Set `PORT` to the value provided by Hostinger if required by panel.
   - Set `CLIENT_URLS` with your real frontend domains (comma-separated).
   - Set all secrets (MongoDB/JWT/SMTP/Stripe/Cloudinary).

3. Frontend build and publish:
   - In project root, set `.env.production` with:
     - `VITE_API_URL=https://your-backend-domain/api`
   - Build frontend: `npm run build`
   - Upload the generated `dist` contents to your frontend public site path.

4. Start strategy that avoids crashes:
   - In production, run only one backend instance.
   - Use `npm start` (not `npm run dev`) in production.
   - Do not manually start multiple terminals/sessions for the backend.

5. Verify after deploy:
   - Check `https://your-backend-domain/api/health` returns JSON with `status: OK`.
   - Confirm login/register requests hit your Hostinger backend domain (not localhost).

### Frontend Deployment

- Build the project: `npm run build`
- Deploy the `dist` folder to services like Vercel, Netlify, or Firebase Hosting
- Set environment variables in your deployment platform

## 📱 Usage

1. Register a new user account or use the admin account
2. Browse products and add them to cart
3. Complete checkout with Stripe payment
4. Leave reviews and ratings for products
5. Admin users can manage products, orders, and users

## 🧪 Testing

Run tests with:

```bash
npm test
```

## 📚 API Documentation

The API endpoints are documented in the backend routes. Key endpoints include:

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/products` - Get products
- `POST /api/orders` - Create order
- `GET /api/orders/myorders` - Get user orders

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, email support@naashpati.com or create an issue in the repository.
