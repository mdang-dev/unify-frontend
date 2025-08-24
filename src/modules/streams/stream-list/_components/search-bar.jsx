'use client';

import { Input } from '@/src/components/ui/input';
import { ButtonCommon } from '@/src/components/button';
import { cn } from '@/src/lib/utils';
import { Search, X } from 'lucide-react';
import { useState } from 'react';

export default function SearchBar({ placeholder = 'Search...', onSearch, className }) {
  const [query, setQuery] = useState('');

  const handleClear = () => setQuery('');
  const handleSubmit = (e) => {
    e.preventDefault();

    if (onSearch) onSearch(query);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'relative flex w-[30%] items-center rounded-full bg-muted px-4 py-2 shadow-md transition-all duration-300',
        className
      )}
    >
      <Search className="mr-2 h-5 w-5 text-muted-foreground" />

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="h-4 flex-1 border-none bg-transparent text-sm placeholder-muted-foreground ring-0 ring-transparent focus:ring-offset-transparent focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />

      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="ml-2 text-muted-foreground transition hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <ButtonCommon
        type="submit"
        size="sm"
        className="ml-2 rounded-full dark:bg-primary dark:text-black transition dark:hover:bg-primary/90 "
      >
        Search
      </ButtonCommon>
    </form>
  );
}
