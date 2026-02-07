# Joyhomes CRM

Hệ thống CRM quản lý khách hàng, bảng hàng và booking cho Joyhomes Real Estate.

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **UI Components:** shadcn/ui
- **Database:** PostgreSQL + Prisma ORM
- **State Management:** TanStack Query + Zustand
- **Auth:** Better Auth

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Update DATABASE_URL in .env.local with your PostgreSQL connection string

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── forms/             # Form components
│   ├── tables/            # Data tables
│   └── layouts/           # Layout components
├── lib/                   # Utilities and configurations
├── hooks/                 # Custom React hooks
├── stores/                # Zustand stores
├── providers/             # React context providers
└── types/                 # TypeScript types
```

## Features

- **CRM:** Quản lý khách hàng, lịch sử liên hệ, nhắc lịch
- **Bảng hàng:** Quản lý sản phẩm BĐS, trạng thái, mặt bằng 360°
- **Booking:** Đặt chỗ, đặt cọc, hoa hồng
- **Chat:** Liên lạc real-time giữa sales và nguồn hàng
- **Báo cáo:** Dashboard tổng hợp, export Excel/PDF
- **Task Management:** Giao việc, deadline, nhắc việc
- **Sự kiện:** Quản lý event, điểm danh

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```
