
import React from 'react';
import { SearchIcon } from './icons';

interface SearchBarProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, onSearchTermChange, placeholder = "Search elements...", disabled }) => {
  return (
    <div className="p-4 border-b border-slate-300">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="text-gray-400" />
        </div>
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none disabled:bg-slate-50"
        />
      </div>
    </div>
  );
};

export default SearchBar;
