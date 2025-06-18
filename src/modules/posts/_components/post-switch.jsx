import { Switch, cn } from '@heroui/react';

export default function PostSwitch({
  title,
  subtitle = '',
  className = '',
  isOn, // 🔹 Receive the state from the parent
  onToggle,
}) {
  const handleChange = () => {
    onToggle(!isOn); // 🔹 Toggle the state in the parent
  };

  return (
    <Switch
      color="success"
      className={`${className} ${
        isOn ? 'border-gray-300 dark:border-white' : 'border-gray-200 dark:border-gray-500'
      } transition duration-300 dark:border`}
      onValueChange={handleChange}
      isSelected={isOn} // 🔹 Controlled by parent
      classNames={{
        base: cn(
          'inline-flex flex-row-reverse w-full max-w-full bg-content1 dark:bg-black hover:bg-content2 items-center',
          'justify-between cursor-pointer rounded-lg gap-2 p-4 border-2 border-transparent'
        ),
        wrapper: 'p-0 h-4 overflow-visible',
        thumb: cn(
          'w-6 h-6',
          'group-data-[hover=true]:border-primary',
          'group-data-[selected=true]:ms-6',
          'group-data-[pressed=true]:w-7',
          'group-data-[selected]:group-data-[pressed]:ms-4'
        ),
      }}
    >
      <div className="flex flex-col gap-1">
        <p
          className={`text-medium ${isOn ? 'text-dark dark:text-white' : 'text-gray-500 dark:text-gray-500'}`}
        >
          {title}
        </p>
        <p className="text-tiny text-gray-600">{subtitle}</p>
      </div>
    </Switch>
  );
}
