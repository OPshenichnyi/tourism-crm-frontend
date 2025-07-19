# Зміни в інтерфейсі форми замовлення

## Огляд змін

Внесено зміни до форми замовлення згідно з технічним завданням:

### 1. Поле Client Country

**Тип поля**: Змінено з текстового поля на випадаючий список (select/dropdown)

**Функціональність**:
- Використовує список всіх країн світу відповідно до стандарту ISO 3166-1 alpha-2
- Користувач бачить повну назву країни (наприклад, "Denmark")
- При виборі країни у поле підставляється дволітерний код (наприклад, "DE")
- Підтримує пошук по назві країни
- Показує код країни додатково у списку (наприклад, "Denmark (DE)")

**Компонент**: `CountrySelect` - кастомний компонент з пошуком та фільтрацією

### 2. Поле Reservation Number

**Тип поля**: Змінено на disabled/readOnly

**Автогенерація**: Значення формується автоматично за шаблоном:
- Client Country: дволітерний ISO-код із поля Client Country
- Check-in Date: дата заїзду у форматі ДДММРРРР
- Символ: завжди літера N
- Property Number: значення з відповідного поля

**Формат результату**: `[Client Country][Check-in Date][N][Property Number]`
**Приклад**: `DE19052025N249-2025`

**Логіка**: Reservation Number оновлюється автоматично при зміні хоча б одного з полів:
- Client Country
- Check-in Date  
- Property Number

### 3. Файли та компоненти

#### Створені файли:
- `src/app/data/countries.ts` - дані країн ISO 3166-1 alpha-2
- `src/app/components/common/CountrySelect.tsx` - компонент випадаючого списку країн
- `CHANGES.md` - опис змін

#### Оновлені файли:
- `src/app/(protected)/agent/orders/create/page.tsx` - форма створення замовлення
- `src/app/(protected)/agent/orders/[id]/edit/page.tsx` - форма редагування замовлення агента
- `src/app/(protected)/manager/orders/[id]/edit/page.tsx` - форма редагування замовлення менеджера
- `src/app/services/apiService.ts` - оновлено інтерфейс OrderFormData
- `src/app/types/order.ts` - оновлено тип OrderDetails

### 4. Валідація та UX

**Валідація**:
- Приймається виключно значення з довідника ISO 3166-1 alpha-2
- Reservation Number має бути не порожнім після вибору/введення всіх залежних полів

**UX покращення**:
- Можливість пошуку по назві країни
- Показ коду країни у списку
- Підказка щодо структури Reservation Number
- Індикація що поле генерується автоматично

### 5. Технічна реалізація

**Генерація Reservation Number**:
```typescript
const generateReservationNumber = (): string => {
  const { clientCountry, checkIn, propertyNumber } = formData;
  
  if (!clientCountry || !checkIn || !propertyNumber) {
    return "";
  }

  const checkInDate = new Date(checkIn);
  const day = checkInDate.getDate().toString().padStart(2, '0');
  const month = (checkInDate.getMonth() + 1).toString().padStart(2, '0');
  const year = checkInDate.getFullYear().toString();
  const formattedDate = `${day}${month}${year}`;

  return `${clientCountry}${formattedDate}N${propertyNumber}`;
};
```

**Автоматичне оновлення**:
```typescript
useEffect(() => {
  const newReservationNumber = generateReservationNumber();
  setFormData(prev => ({
    ...prev,
    reservationNumber: newReservationNumber
  }));
}, [formData.clientCountry, formData.checkIn, formData.propertyNumber]);
```

### 6. Тестування

Всі описані сценарії перевірені:
- Зміна полів, що впливають на Reservation Number
- Валідація country code
- Неможливість зміни Reservation Number вручну
- Пошук по назві країни
- Відображення коду країни у списку

### 7. Безпека

- Всі валідації та автогенерації реалізовані на фронтенді
- Немає додаткових запитів до бекенду для генерації
- Користувач не може ввести некоректний country code
- Користувач не може змінити Reservation Number вручну 