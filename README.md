# 🏦 FinTech Microservices Backend

A scalable, production-ready fintech backend built with NestJS microservices architecture, Docker, and Paystack payment integration.

## ✨ Features

- 🔐 **Authentication Service** - User registration, login, and JWT token management
- 💰 **Account Service** - Manage user accounts and balances
- 📊 **Transaction Service** - Record all financial transactions
- 💳 **Payment Service** - Paystack payment integration with automatic deposits
- 🚪 **API Gateway** - Single entry point for all client requests
- 🐳 **Dockerized** - Complete containerization with Docker Compose
- 📝 **Prisma ORM** - Type-safe database access with PostgreSQL

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

# Service Hosts (for Docker)
ACCOUNT_SERVICE_HOST=account-service
PAYMENT_SERVICE_HOST=payment-service
TRANSACTION_SERVICE_HOST=transaction-service
AUTH_SERVICE_HOST=auth-service

