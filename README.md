# 🏦 FinTech Microservices Backend

A scalable, production-ready fintech backend built with NestJS microservices architecture, Docker, and Paystack payment integration.

## ✨ Features

### 🔐 Authentication & Security
- **JWT Authentication** - Secure token-based authentication
- **OTP Email Verification** - 6-digit code verification for new users
- **Passcode Login** - 6-digit passcode for quick mobile access
- **Password Reset** - OTP-based password recovery
- **Account Lockout** - 5 failed attempts locks account for 15 minutes
- **Bcrypt Hashing** - All passwords and passcodes are securely hashed

### 💳 Payment Processing
- **Paystack Integration** - Complete payment gateway integration
- **Automatic Deposits** - Balance updates automatically on successful payment
- **Transaction Tracking** - Full audit trail for all transactions
- **Payment Verification** - Webhook and manual verification support

## 🏦 Account Management
- **Account Creation** - Automatic account number generation
- **Balance Management** - Deposit, withdraw, and transfer funds
- **Transaction History** - Complete transaction records
- **Account Details** - View account information and balance

### 🏗️ Architecture
- **Microservices** - 5 independent services communicating via TCP
- **API Gateway** - Single entry point for all client requests
- **Docker Containerization** - Complete Docker setup with Docker Compose
- **Database Versioning** - Prisma migrations for schema management
- **Error Handling** - Global exception filters for consistent error responses

## 🏗️ Architecture
┌─────────────────┐
│ React Native │
│ Mobile App │
└────────┬────────┘
│
▼
┌─────────────────┐
│ API Gateway │ (Port: 3000)
│ NestJS + HTTP │
└────────┬────────┘
│
┌────┴────────────────────────────┐
│ │
▼ ▼
┌───────────────┐ ┌───────────────┐
│ Auth Service │ │Payment Service│
│ (3001) │ │ (3004) │
└───────────────┘ └───────┬───────┘
│
▼
┌───────────────┐ ┌───────────────┐
│Account Service│◄─────────────┤ Paystack API │
│ (3002) │ │ Integration │
└───────┬───────┘ └───────────────┘
│
▼
┌───────────────┐
│Transaction │
│Service (3003) │
└───────────────┘
│
▼
┌─────────────────────────┐
│ PostgreSQL Database │
│ (Port: 5432) │
└─────────────────────────┘


## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) 18+ (for local development)
- [Git](https://git-scm.com/)

### Environment Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/fintech-back.git
cd fintech-back

2. **Edit .env with your values**

# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/fintech?schema=public

# JWT Secret (change this in production)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Paystack
PAYSTACK_SECRET=sk_test_your_test_secret_key_here

# Email Configuration (for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Service Hosts (for Docker)
ACCOUNT_SERVICE_HOST=account-service
PAYMENT_SERVICE_HOST=payment-service
TRANSACTION_SERVICE_HOST=transaction-service
AUTH_SERVICE_HOST=auth-service



