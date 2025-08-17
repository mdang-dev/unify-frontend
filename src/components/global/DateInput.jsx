'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';

const DateSelector = ({ date, setDate, months }) => {
  const [daysInMonth, setDaysInMonth] = useState(31);

  useEffect(() => {
    if (date.month && date.year) {
      const monthIndex = months.indexOf(date.month);
      const days = new Date(parseInt(date.year), monthIndex + 1, 0).getDate();
      setDaysInMonth(days);

      if (parseInt(date.day) > days) {
        setDate((prev) => ({
          ...prev,
          day: days.toString().padStart(2, '0'),
        }));
      }
    }
  }, [date.month, date.year, months, setDate]);

  const generateDays = () => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 100 }, (_, i) => currentYear - i);
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <Select
        value={date.month}
        onValueChange={(value) => setDate((prev) => ({ ...prev, month: value }))}
      >
        <SelectTrigger className="h-12 dark:bg-neutral-900">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {months.map((month, index) => (
            <SelectItem key={month} value={month}>
              {month}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={date.day}
        onValueChange={(value) => setDate((prev) => ({ ...prev, day: value }))}
      >
        <SelectTrigger className="h-12 dark:bg-neutral-900">
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent>
          {generateDays().map((day) => (
            <SelectItem key={day} value={day.toString().padStart(2, '0')}>
              {day}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={date.year}
        onValueChange={(value) => setDate((prev) => ({ ...prev, year: value }))}
      >
        <SelectTrigger className="h-12 dark:bg-neutral-900">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {generateYears().map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default DateSelector;
