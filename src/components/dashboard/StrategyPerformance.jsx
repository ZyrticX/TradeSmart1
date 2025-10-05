import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function StrategyPerformance({ trades }) {
  const language = localStorage.getItem('language') || 'en';

  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };
  
  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number);
  };

  if (!trades || trades.length === 0) {
    return <div className="text-center text-gray-500 py-8">{getText('No closed trades to analyze performance.', 'אין עסקאות סגורות לניתוח ביצועים.')}</div>;
  }

  const performanceByStrategy = trades.reduce((acc, trade) => {
    const strategy = trade.strategy || getText('Uncategorized', 'ללא קטגוריה');
    if (!acc[strategy]) {
      acc[strategy] = {
        trades: 0,
        wins: 0,
        totalPl: 0,
      };
    }
    acc[strategy].trades += 1;
    if (trade.profit_loss > 0) {
      acc[strategy].wins += 1;
    }
    acc[strategy].totalPl += trade.profit_loss || 0;
    return acc;
  }, {});

  const performanceData = Object.entries(performanceByStrategy).map(([strategy, data]) => ({
    strategy,
    ...data,
    winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
  }));
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{getText('Strategy', 'אסטרטגיה')}</TableHead>
            <TableHead>{getText('# Trades', 'מספר עסקאות')}</TableHead>
            <TableHead>{getText('Win Rate', 'אחוז הצלחה')}</TableHead>
            <TableHead>{getText('Total P/L', 'סה"כ רווח/הפסד')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {performanceData.map(({ strategy, trades, winRate, totalPl }) => (
            <TableRow key={strategy}>
              <TableCell className="font-medium">{strategy}</TableCell>
              <TableCell>{trades}</TableCell>
              <TableCell>
                <Badge variant={winRate >= 50 ? "default" : "secondary"} className={winRate >= 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                  {winRate.toFixed(1)}%
                </Badge>
              </TableCell>
              <TableCell className={totalPl >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                ${formatNumber(totalPl.toFixed(2))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}