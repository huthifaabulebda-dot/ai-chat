# AI Chat App

A full-stack AI chat application built with Next.js, featuring user authentication, MongoDB database, and profile management.

## Features

- User registration and login
- Secure password hashing
- JWT-based authentication
- Chat with AI assistant using OpenAI GPT-3.5
- User profile management with image upload
- Professional UI with Tailwind CSS

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env.local` file with:
   ```
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-secret-key
   OPENAI_API_KEY=your-openai-api-key
   ```
   Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys).

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

Use MongoDB Atlas for free database:
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get the connection string and update MONGODB_URI

## Deployment

Deploy for free on Vercel:
1. Push to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard

## Technologies Used

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
