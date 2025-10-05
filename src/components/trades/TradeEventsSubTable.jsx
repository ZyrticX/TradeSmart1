import React, { useState, useEffect } from 'react';
import { TradeEvent } from '@/api/entities';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

// Helper to parse notes and extract commission
const parseCommission = (notes) => {
  if (!notes) return { commission: 0, cleanNotes: '' };
  const commissionMatch = notes.match(/Commission: \$([\d.,]+)/);
  const commission = commissionMatch ? parseFloat(commissionMatch[1].replace(/,/g, '')) : 0;
  const cleanNotes = notes.replace(/(\r\n|\n|\r)?Commission: \$[\d.,]+/, '').trim();
  return { commission, cleanNotes };
};

export default function TradeEventsSubTable({ tradeId }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const language = localStorage.getItem('language') || 'en';

  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };
  
  const formatCurrency = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  useEffect(() => {
    const fetchEvents = async () => {
      if (!tradeId) return;
      setIsLoading(true);
      try {
        const fetchedEvents = await TradeEvent.filter({ trade_id: tradeId }, 'date');
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Failed to fetch trade events:", error);
      }
      setIsLoading(false);
    };
    fetchEvents();
  }, [tradeId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span>{getText('Loading events...', 'טוען אירועים...')}</span>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 text-gray-500">
        <Info className="w-5 h-5 mr-2" />
        <span>{getText('No events found for this trade.', 'לא נמצאו אירועים לעסקה זו.')}</span>
      </div>
    );
  }

  return (
    <div className="p-2 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold mb-2 px-2">{getText('Trade History', 'היסטוריית עסקה')}</h4>
        <Table size="sm">
            <TableHeader>
                <TableRow>
                    <TableHead className="text-xs">{getText('Date', 'תאריך')}</TableHead>
                    <TableHead className="text-xs">{getText('Type', 'סוג')}</TableHead>
                    <TableHead className="text-xs">{getText('Qty', 'כמות')}</TableHead>
                    <TableHead className="text-xs">{getText('Price', 'מחיר')}</TableHead>
                    <TableHead className="text-xs">{getText('Stop', 'סטופ')}</TableHead>
                    <TableHead className="text-xs">{getText('Fees', 'עמלות')}</TableHead>
                    <TableHead className="text-xs">{getText('Notes', 'הערות')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {events.map(event => {
                    const { commission, cleanNotes } = parseCommission(event.notes);
                    return (
                        <TableRow key={event.id}>
                            <TableCell className="text-xs whitespace-nowrap">{format(new Date(event.date), 'dd/MM/yy HH:mm')}</TableCell>
                            <TableCell>
                                <Badge variant={event.type === 'sell' ? 'destructive' : 'default'} className={`text-xs ${event.type === 'buy' || event.type === 'add' ? 'bg-blue-100 text-blue-800' : ''}`}>
                                    {getText(event.type, event.type, event.type)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{event.quantity}</TableCell>
                            <TableCell className="text-xs">{formatCurrency(event.price)}</TableCell>
                            <TableCell className="text-xs">{formatCurrency(event.stop_loss_at_event)}</TableCell>
                            <TableCell className="text-xs">{formatCurrency(commission)}</TableCell>
                            <TableCell className="text-xs max-w-[200px] truncate" title={cleanNotes}>{cleanNotes}</TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    </div>
  );
}