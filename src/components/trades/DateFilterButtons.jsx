import React from 'react';
import { Button } from '@/components/ui/button';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export default function DateFilterButtons({ onFilterChange, language }) {
  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };

  const setDateRange = (from, to) => {
    onFilterChange({ from, to });
  };

  const today = new Date();
  const filters = [
    { label: getText('Today', 'היום'), from: startOfDay(today), to: endOfDay(today) },
    { label: getText('Yesterday', 'אתמול'), from: startOfDay(subDays(today, 1)), to: endOfDay(subDays(today, 1)) },
    { label: getText('This Week', 'השבוע'), from: startOfWeek(today), to: endOfWeek(today) },
    { label: getText('This Month', 'החודש'), from: startOfMonth(today), to: endOfMonth(today) },
    { label: getText('Last Month', 'חודש שעבר'), from: startOfMonth(subDays(startOfMonth(today), 1)), to: endOfMonth(subDays(startOfMonth(today), 1)) },
    { label: getText('Last Year', 'שנה שעברה'), from: startOfYear(subDays(startOfYear(today), 1)), to: endOfYear(subDays(startOfYear(today), 1)) },
    { label: getText('Reset', 'איפוס'), from: null, to: null }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(filter => (
        <Button
          key={filter.label}
          variant="outline"
          size="sm"
          onClick={() => setDateRange(filter.from, filter.to)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}