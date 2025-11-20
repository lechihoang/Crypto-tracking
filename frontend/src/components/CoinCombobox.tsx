'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Coin } from '@/types';

interface CoinComboboxProps {
  coins: Coin[];
  value: string;
  onChange: (coin: Coin | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CoinCombobox({
  coins,
  value,
  onChange,
  placeholder = 'Tìm kiếm coin...',
  disabled = false,
}: CoinComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  const selectedCoin = coins.find((coin) => coin.name === value);

  const handleSelect = (coin: Coin) => {
    onChange(coin);
    setOpen(false);
    setSearchValue('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchValue('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between bg-dark-600 border-gray-700/40 text-white hover:bg-dark-700 hover:text-white"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="truncate">
              {selectedCoin ? selectedCoin.name : placeholder}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {selectedCoin && (
              <X
                className="h-4 w-4 text-gray-400 hover:text-white"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 text-gray-400" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-dark-700 border-gray-700/40">
        <Command className="bg-dark-700">
          <CommandInput
            placeholder={placeholder}
            value={searchValue}
            onValueChange={setSearchValue}
            className="text-white placeholder-gray-400"
          />
          <CommandList>
            <CommandEmpty className="text-gray-400 py-6 text-center text-sm">
              Không tìm thấy coin nào
            </CommandEmpty>
            <CommandGroup>
              {coins.slice(0, 50).map((coin) => (
                <CommandItem
                  key={coin.id}
                  value={coin.name}
                  onSelect={() => handleSelect(coin)}
                  className="text-white hover:bg-dark-600 cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {coin.image && (
                        <img
                          src={coin.image}
                          alt={coin.name}
                          className="w-5 h-5 rounded-full"
                        />
                      )}
                      <span className="font-medium">{coin.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">
                        {coin.symbol.toUpperCase()}
                      </span>
                      <Check
                        className={cn(
                          'h-4 w-4',
                          selectedCoin?.id === coin.id
                            ? 'opacity-100 text-primary-500'
                            : 'opacity-0'
                        )}
                      />
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
