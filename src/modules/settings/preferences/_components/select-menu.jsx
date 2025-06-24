'use client';

import { changeLocale, getLocale } from '@/src/utils/locale.util';
import { Select, SelectItem } from '@heroui/react';
import { Avatar } from '@heroui/react';
import { useTransition } from 'react';

export default function SelectMenu() {
  const [isPending, startTranslation] = useTransition();
  const localeActive = getLocale();
  const handleChangeLocale = (e) => {
    const nextLocale = e.target?.value;
    startTranslation(() => {
      changeLocale(nextLocale);
    });
  };

  return (
    <div className="flex w-full flex-wrap md:flex-nowrap">
      <Select
        defaultSelectedKeys={[localeActive]}
        className="w-full"
        label=""
        onChange={handleChangeLocale}
        variant="underlined"
        disabled={isPending}
      >
        <SelectItem key={['en']} startContent={<Avatar alt="US Flag" src="/images/us.png" />}>
          English
        </SelectItem>
        <SelectItem key={['vi']} startContent={<Avatar alt="Vietnam Flag" src="/images/vn.png" />}>
          Vietnamese
        </SelectItem>
      </Select>
    </div>
  );
}
