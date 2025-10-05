import React, { useState, useMemo } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format, isSameDay, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TradingCalendar({ trades, onTradeClick }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const renderStars = (count) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${i < count ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  // Group trades by date
  const tradesByDate = useMemo(() => {
    const grouped = {};
    trades.forEach(trade => {
      if (trade.date_time) {
        const dateKey = format(parseISO(trade.date_time), 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(trade);
      }
    });
    return grouped;
  }, [trades]);

  // Calculate daily P&L
  const dailyPnL = useMemo(() => {
    const pnl = {};
    Object.keys(tradesByDate).forEach(dateKey => {
      const dayTrades = tradesByDate[dateKey];
      const totalPnL = dayTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);
      pnl[dateKey] = totalPnL;
    });
    return pnl;
  }, [tradesByDate]);

  const handleDateClick = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    if (tradesByDate[dateKey]) {
      setSelectedDate({ date, trades: tradesByDate[dateKey] });
      setIsModalOpen(true);
    }
  };

  const modifiers = {
    hasTrades: (date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      return tradesByDate[dateKey] && tradesByDate[dateKey].length > 0;
    }
  };

  const modifiersStyles = {
    hasTrades: {
      backgroundColor: '#3B82F6',
      color: 'white',
      borderRadius: '50%'
    }
  };

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={new Date()}
        onDayClick={handleDateClick}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        className="rounded-md border mx-auto"
      />
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {getText('Trades on', 'עסקאות בתאריך')} {selectedDate && format(selectedDate.date, 'dd/MM/yyyy')}
            </DialogTitle>
            <DialogDescription>
              {selectedDate && `${selectedDate.trades.length} ${getText('trades executed', 'עסקאות בוצעו')}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDate && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{getText('Symbol', 'סימבול')}</TableHead>
                    <TableHead>{getText('Direction', 'כיוון')}</TableHead>
                    <TableHead>{getText('Quantity', 'כמות')}</TableHead>
                    <TableHead>{getText('Entry Price', 'מחיר כניסה')}</TableHead>
                    <TableHead>{getText('Strategy', 'אסטרטגיה')}</TableHead>
                    <TableHead>{getText('Confidence', 'ביטחון')}</TableHead>
                    <TableHead>{getText('Status', 'סטטוס')}</TableHead>
                    <TableHead>{getText('Actions', 'פעולות')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedDate.trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell className="font-medium">{trade.symbol}</TableCell>
                      <TableCell>
                        <Badge variant={trade.direction === 'long' ? 'default' : 'secondary'} className={trade.direction === 'long' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                          {trade.direction === 'long' ? <TrendingUp className="w-3 h-3 me-1" /> : <TrendingDown className="w-3 h-3 me-1" />}
                          {trade.direction === 'long' ? getText('Long', 'לונג') : getText('Short', 'שורט')}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatNumber(trade.quantity || 0)}</TableCell>
                      <TableCell>${(trade.entry_price || 0).toFixed(2)}</TableCell>
                      <TableCell>{trade.strategy || getText('Not specified', 'לא צוין')}</TableCell>
                      <TableCell>{renderStars(trade.confidence_level || 0)}</TableCell>
                      <TableCell>
                        <Badge variant={trade.status === 'open' ? 'default' : 'secondary'}>
                          {trade.status === 'open' ? getText('Open', 'פתוח') : getText('Closed', 'סגור')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => onTradeClick(trade)}>
                          {getText('View', 'צפה')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}