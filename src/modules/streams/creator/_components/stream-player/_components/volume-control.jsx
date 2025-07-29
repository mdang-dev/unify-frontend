'use client';

import { Volume1, Volume2, VolumeX } from 'lucide-react';
import { Hint } from '@/src/components/base';
import { Slider } from '@/src/components/ui/slider';

import React from 'react';

export default function VolumeControl({ onToggle, onChange, value }) {
  const isMuted = value === 0;
  const isAboveHalf = value > 50;

  let Icon = Volume1;

  if (isMuted) {
    Icon = VolumeX;
  } else if (isAboveHalf) {
    Icon = Volume2;
  }

  const label = isMuted ?? '';

  const handleChange = (value) => {
    onChange(value[0]);
  };

  return (
    <div className="flex items-center gap-2">
      <Hint label={label} asChild>
        <button onClick={onToggle} className="rounded-lg p-1.5 text-white hover:bg-white/10">
          <Icon className="h-6 w-6" />
        </button>
      </Hint>
      <Slider
        className="w-[8rem] cursor-pointer"
        onValueChange={handleChange}
        value={[value]}
        max={100}
        step={1}
      />
    </div>
  );
}
