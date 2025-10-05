import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';

const ReportTable = ({ trades, isLoading, onTradeClick }) => {
  const language = localStorage.getItem('language') || 'en';
  const isRTL = language === 'he';

  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };

  if (isLoading) {
    return <p>{getText('Loading report data...', 'טוען נתוני דוח...')}</p>;
  }

  if (trades.length === 0) {
    return <p className="text-center text-gray-500 py-8">{getText('No trades match the selected filters.', 'אין עסקאות התואמות לסינון הנבחר.')}</p>;
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-800">
          <Clock className="w-3 h-3 me-1"/>
          {getText('Open', 'פתוח')}
        </Badge>;
      case 'closed':
        return <Badge className="bg-emerald-100 text-emerald-800">
          <CheckCircle className="w-3 h-3 me-1"/>
          {getText('Closed', 'סגור')}
        </Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getExitPrice = (trade) => {
    if (trade.status === 'closed' && (trade.total_investment || 0) > 0) {
      const totalReturnValue = (trade.total_investment + (trade.profit_loss || 0));
      return totalReturnValue / (trade.total_quantity || 1);
    }
    return null;
  };

  const getPLPercentage = (trade) => {
    if (trade.status === 'closed' && (trade.total_investment || 0) > 0) {
      return ((trade.profit_loss || 0) / trade.total_investment) * 100;
    }
    return null;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{getText('Date', 'תאריך')}</TableHead>
            <TableHead>{getText('Symbol', 'סימבול')}</TableHead>
            <TableHead>{getText('Status', 'סטטוס')}</TableHead>
            <TableHead>{getText('Direction', 'כיוון')}</TableHead>
            <TableHead>{getText('Entry Price', 'מחיר כניסה')}</TableHead>
            <TableHead>{getText('Exit Price', 'מחיר יציאה')}</TableHead>
            <TableHead>{getText('Commissions', 'עמלות')}</TableHead>
            <TableHead>{getText('P/L ($)', 'רווח/הפסד ($)')}</TableHead>
            <TableHead>{getText('P/L (%)', 'רווח/הפסד (%)')}</TableHead>
            <TableHead>{getText('Strategy', 'אסטרטגיה')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map(trade => {
            const exitPrice = getExitPrice(trade);
            const plPercentage = getPLPercentage(trade);
            const pnl = trade.profit_loss !== undefined && trade.profit_loss !== null ? trade.profit_loss : null;

            return (
              <TableRow key={trade.id} onClick={() => onTradeClick(trade)} className={trade.status === 'closed' ? "cursor-pointer hover:bg-gray-100" : ""}>
                <TableCell>{trade.date_time ? format(new Date(trade.date_time), 'yyyy-MM-dd') : 'N/A'}</TableCell>
                <TableCell className="font-medium">{trade.symbol}</TableCell>
                <TableCell>{getStatusBadge(trade.status)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={trade.direction === 'long' ? 'text-emerald-700' : 'text-red-700'}>
                    {trade.direction === 'long' ? <TrendingUp className="w-3 h-3 me-1" /> : <TrendingDown className="w-3 h-3 me-1" />}
                    {trade.direction === 'long' ? getText('Long', 'לונג') : getText('Short', 'שורט')}
                  </Badge>
                </TableCell>
                <TableCell>${trade.entry_price?.toFixed(2) ?? 'N/A'}</TableCell>
                <TableCell>
                  {exitPrice !== null ? `$${exitPrice.toFixed(2)}` : 'N/A'}
                </TableCell>
                 <TableCell>${trade.total_commission?.toFixed(2) ?? '0.00'}</TableCell>
                <TableCell className={pnl !== null && pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                  {trade.status === 'closed' ? (pnl !== null ? `$${pnl.toFixed(2)}` : 'N/A') : 'N/A'}
                </TableCell>
                <TableCell className={plPercentage !== null && plPercentage >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                  {trade.status === 'closed' ? (plPercentage !== null ? `${plPercentage.toFixed(2)}%` : 'N/A') : 'N/A'}
                </TableCell>
                <TableCell>{trade.strategy || 'N/A'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ReportTable;