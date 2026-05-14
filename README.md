# Amber Calc — Калькулятор подбора контейнеров

Production-ready веб-приложение для подбора контейнеров с янтарём по целевому весу.

## Стек

- **Frontend + Backend**: Next.js 14 (App Router)
- **БД**: PostgreSQL через Prisma ORM
- **Хостинг**: Vercel
- **База данных**: Neon или Supabase

## Алгоритм

Задача сводится к **ограниченному knapsack** (bounded subset sum):
- Цель: `total_weight >= target_weight`
- Приоритет 1: минимальный перевес
- Приоритет 2: минимальное количество контейнеров

## Локальный запуск

### 1. Клонируйте репозиторий

```bash
git clone https://github.com/YOUR_USERNAME/amber-calc.git
cd amber-calc
npm install
```

### 2. Настройте базу данных

Создайте БД на [Neon](https://neon.tech) или [Supabase](https://supabase.com) и скопируйте строку подключения.

```bash
cp .env.example .env.local
# Отредактируйте .env.local, добавив DATABASE_URL и DIRECT_URL
```

### 3. Выполните миграции

```bash
npm run db:push
```

### 4. Запустите dev-сервер

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Деплой на Vercel

1. Запушьте код на GitHub
2. Импортируйте репозиторий в [Vercel](https://vercel.com)
3. Добавьте переменные окружения:
   - `DATABASE_URL` — строка подключения с пулингом (для Neon: `?pgbouncer=true&connect_timeout=15`)
   - `DIRECT_URL` — прямая строка подключения (без пулинга)
4. Vercel автоматически выполнит `prisma generate && next build`

## API Endpoints

| Метод | URL | Описание |
|-------|-----|----------|
| GET | /api/containers | Список контейнеров |
| POST | /api/containers | Создать контейнер |
| PUT | /api/containers/:id | Обновить контейнер |
| DELETE | /api/containers/:id | Удалить контейнер |
| POST | /api/calculate | Выполнить расчёт |
| GET | /api/history | История расчётов |
| POST | /api/history | Сохранить расчёт |
| GET | /api/history/:id | Получить расчёт |

## Структура проекта

```
src/
├── app/
│   ├── page.tsx          # Страница калькулятора
│   ├── history/page.tsx  # История расчётов
│   └── api/              # API routes
├── components/           # React компоненты
└── lib/
    ├── prisma.ts         # Prisma client
    ├── knapsack.ts       # Алгоритм подбора
    └── types.ts          # TypeScript типы
```
