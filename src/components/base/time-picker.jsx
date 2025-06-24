'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/src/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/src/components/ui/popover';
import { Button } from '@/src/components/ui/button';
import { Clock } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const generate12HourTimeOptions = () => {
  const times = [];
  for (let hour = 1; hour <= 12; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      for (const period of ['AM', 'PM']) {
        const h = hour.toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        times.push(`${h}:${m} ${period}`);
      }
    }
  }
  return times;
};

export function TimePicker({ value, onChange, className }) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const times = generate12HourTimeOptions();

  const handleSelect = (val) => {
    onChange(val);
    setInputValue(val);
    setOpen(false);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('w-full justify-start text-left', className)}>
          <Clock className="mr-2 h-4 w-4 opacity-70" />
          {inputValue || <span className="text-muted-foreground">Select time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] space-y-2 p-2" align="start">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder="hh:mm AM/PM"
          className="text-sm"
        />
        <div className="max-h-[200px] space-y-1 overflow-y-auto">
          {times.map((time) => (
            <button
              key={time}
              onClick={() => handleSelect(time)}
              className="w-full rounded-md px-2 py-1 text-left text-sm hover:bg-accent"
            >
              {time}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
