'use client';

import { Select, SelectItem } from '@heroui/react';
import { Avatar } from '@heroui/react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function SelectMenu() {
  const [isPending, startTranslation] = useTransition();
  const router = useRouter();
  const localeActive = useLocale();

  const handleChangeLocale = (e) => {
    const nextLocale = e.target?.value;
    startTranslation(() => {
      router.replace(`/${nextLocale}`);
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
