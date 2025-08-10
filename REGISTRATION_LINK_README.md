# Налаштування посилань для реєстрації

## Що додано

1. **Нова колонка "Посилання для реєстрації"** в таблиці запрошень
2. **Функція копіювання посилання** в буфер обміну
3. **Автоматичне формування URL** на основі токена запрошення

## Конфігурація

### BASE_URL
Створіть файл `.env.local` в корені проекту:

```bash
# Frontend configuration
NEXT_PUBLIC_BASE_URL=https://travel-agentonline.com
NEXT_PUBLIC_API_URL=http://travel-agentonline.com:3000/api
```

### Формат посилання
Посилання формується за шаблоном: `{BASE_URL}/register/{TOKEN}`

Приклад: `https://travel-agentonline.com/register/8995f4bb-0e1f-4d10-9a28-00a5201e7e61`

## Функціональність

- **Відображення посилання**: Показується тільки для активних (невикористаних) запрошень
- **Копіювання**: Кнопка 📋 копіює посилання в буфер обміну
- **Статус**: Для використаних запрошень показується "-"

## Файли змін

- `src/app/config/constants.ts` - конфігурація BASE_URL
- `src/app/(protected)/manager/invitations/page.tsx` - сторінка менеджера
- `src/app/(protected)/admin/invitations/page.tsx` - сторінка адміністратора

## API вимоги

API повинен повертати поле `token` в відповіді при створенні запрошення:

```json
{
  "invitation": {
    "id": "7bdf922e-d0e3-43dc-8433-9de2a401deb2",
    "email": "agent_1@example.com",
    "role": "agent",
    "token": "ddacf1c1-8294-4f59-b0ea-93f242edb3fb",
    "expiresAt": "2025-08-17T07:37:33.846Z"
  },
  "message": "Invitation created successfully"
}
``` 