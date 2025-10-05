
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, TrendingUp, TrendingDown, MinusSquare, Trash2, FileSearch, Settings, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const colorVariants = {
  emerald: "border-emerald-200 bg-emerald-50",
  gray: "border-gray-200 bg-gray-50",
  blue: "border-blue-200 bg-blue-50"
};

export default function TradesSection({
  title,
  icon: Icon,
  trades,
  isLoading,
  account,
  onCloseClick,
  onAddQuantityClick,
  onEditClick,
  onDeleteClick,
  onViewClick,
  showActions,
  color,
  deletingTradeId,
}) {
  const language = localStorage.getItem('language') || 'en';
  
  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    symbol: true,
    direction: true,
    quantity: true,
    entryPrice: true,
    tradeValue: true,
    stopPrice: true,
    risk: true,
    target: true,
    pl: title.includes("Closed"),
    strategy: true,
    actions: true,
  });

  const getText = (en, he) => {
    switch(language) {
        case 'he': return he;
        default: return en;
    }
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number);
  };
  
  const getColumnName = (key) => {
      const names = {
          date: getText('Date', 'תאריך'),
          symbol: getText('Symbol', 'סימבול'),
          direction: getText('Direction', 'כיוון'),
          quantity: getText('Quantity', 'כמות'),
          entryPrice: getText('Entry Price', 'מחיר כניסה'),
          tradeValue: getText('Trade Value', 'שווי עסקה'),
          stopPrice: getText('Stop Price', 'מחיר סטופ'),
          risk: getText('Risk Amount / %', 'סכום סיכון / %'),
          target: getText('Target', 'יעד'),
          pl: getText('P/L', 'רווח/הפסד'),
          strategy: getText('Strategy', 'אסטרטגיה'),
          actions: getText('Actions', 'פעולות'),
      };
      return names[key] || key;
  };

  if (isLoading) {
    return (
      <Card className={colorVariants[color]}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Icon className="w-5 h-5" />{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center space-x-4"><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-16" /></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isOpenTrades = title.includes(getText('Open', 'פתוחות'));
  const totalPositionValue = isOpenTrades ? trades.reduce((sum, trade) => sum + (trade.position_size || 0), 0) : 0;
  const totalRiskValue = isOpenTrades ? trades.reduce((sum, trade) => sum + (trade.risk_amount || 0), 0) : 0;

  return (
    <Card className={colorVariants[color]}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Icon className="w-5 h-5" />{title} ({formatNumber(trades.length)})</div>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><Settings className="w-4 h-4 me-2" />{getText('Columns', 'עמודות')}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.entries(visibleColumns).map(([key, visible]) => (
                <DropdownMenuItem key={key} onClick={() => setVisibleColumns(prev => ({...prev, [key]: !prev[key]}))}>
                  <input type="checkbox" checked={visible} className="me-2" readOnly />{getColumnName(key)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {trades.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Icon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>{`${getText('No', 'אין')} ${title.toLowerCase()} ${getText('currently.', 'כרגע.')}`}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.date && <TableHead>{getText('Date', 'תאריך')}</TableHead>}
                  {visibleColumns.symbol && <TableHead>{getText('Symbol', 'סימבול')}</TableHead>}
                  {visibleColumns.direction && <TableHead>{getText('Direction', 'כיוון')}</TableHead>}
                  {visibleColumns.quantity && <TableHead>{getText('Quantity', 'כמות')}</TableHead>}
                  {visibleColumns.entryPrice && <TableHead>{getText('Entry Price', 'מחיר כניסה')}</TableHead>}
                  {visibleColumns.tradeValue && <TableHead>{getText('Trade Value', 'שווי עסקה')}</TableHead>}
                  {visibleColumns.stopPrice && <TableHead>{getText('Stop Price', 'מחיר סטופ')}</TableHead>}
                  {visibleColumns.risk && <TableHead>{getText('Risk Amount / %', 'סכום סיכון / %')}</TableHead>}
                  {visibleColumns.target && <TableHead>{getText('Target', 'יעד')}</TableHead>}
                  {visibleColumns.pl && <TableHead>{getText('P/L', 'רווח/הפסד')}</TableHead>}
                  {visibleColumns.strategy && <TableHead>{getText('Strategy', 'אסטרטגיה')}</TableHead>}
                  {visibleColumns.actions && <TableHead className="text-right">{getText('Actions', 'פעולות')}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade) => {
                    const positionValue = (trade.entry_price || 0) * (trade.quantity || 0);
                    const positionValuePercent = account?.account_size > 0 ? (positionValue / account.account_size) * 100 : 0;
                    return (
                        <TableRow key={trade.id} className="hover:bg-white/50">
                          {visibleColumns.date && <TableCell>{trade.date_time ? format(new Date(trade.date_time), 'dd/MM/yyyy') : 'N/A'}</TableCell>}
                          {visibleColumns.symbol && <TableCell className="font-medium flex items-center gap-2">{trade.symbol}{trade.is_partially_closed && <MinusSquare className="w-3 h-3 text-orange-500" title={getText('Partially closed', 'נסגר חלקית')} />}</TableCell>}
                          {visibleColumns.direction && <TableCell><Badge variant={trade.direction === 'long' ? 'default' : 'secondary'} className={trade.direction === 'long' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>{trade.direction === 'long' ? <TrendingUp className="w-3 h-3 me-1" /> : <TrendingDown className="w-3 h-3 me-1" />}{trade.direction === 'long' ? getText('Long', 'לונג') : getText('Short', 'שורט')}</Badge></TableCell>}
                          {visibleColumns.quantity && <TableCell>{formatNumber(trade.quantity || 0)}</TableCell>}
                          {visibleColumns.entryPrice && <TableCell>${(trade.entry_price || 0).toFixed(2)}</TableCell>}
                          {visibleColumns.tradeValue && (
                              <TableCell className="font-semibold">
                                  <div>${formatNumber(positionValue.toFixed(2))}</div>
                                  <div className="text-xs font-normal text-gray-500">{positionValuePercent.toFixed(2)}%</div>
                              </TableCell>
                          )}
                          {visibleColumns.stopPrice && <TableCell>${(trade.stop_price || 0).toFixed(2)}</TableCell>}
                          {visibleColumns.risk && <TableCell className="text-red-600"><div className="text-sm"><div className="font-semibold">-${formatNumber((trade.risk_amount || 0).toFixed(2))}</div><div className="text-xs">{(trade.risk_percentage || 0).toFixed(2)}%</div></div></TableCell>}
                          {visibleColumns.target && <TableCell>${(trade.target_price || 0).toFixed(2) || getText('Not set', 'לא הוגדר')}</TableCell>}
                          {visibleColumns.pl && <TableCell className={(trade.profit_loss || 0) >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>{(trade.profit_loss !== null && trade.profit_loss !== undefined) ? `$${formatNumber(trade.profit_loss.toFixed(2))}` : 'N/A'}</TableCell>}
                          {visibleColumns.strategy && <TableCell><span className="text-sm text-gray-600">{trade.strategy || getText('Not specified', 'לא צוין')}</span></TableCell>}
                          {visibleColumns.actions && showActions && (
                            <TableCell>
                              <div className="flex items-center gap-1 justify-end">
                                {trade.status === 'open' && onAddQuantityClick && (<Button size="sm" onClick={() => onAddQuantityClick(trade)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2">{getText('Add', 'הוסף')}</Button>)}
                                {trade.status === 'open' && onCloseClick && (<Button size="sm" onClick={() => onCloseClick(trade)} className="bg-red-500 hover:bg-red-600 text-white text-xs px-2">{getText('Sell', 'מכור')}</Button>)}
                                {onViewClick && (<Button variant="outline" size="sm" onClick={() => onViewClick(trade)}><FileSearch className="w-3 h-3" /></Button>)}
                                {onEditClick && (<Button variant="outline" size="sm" onClick={() => onEditClick(trade)}><Edit className="w-3 h-3" /></Button>)}
                                {onDeleteClick && (<Button variant="outline" size="sm" onClick={() => onDeleteClick(trade.id)} className="text-gray-500 hover:bg-red-50 hover:text-red-600" disabled={deletingTradeId === trade.id}>
                                    {deletingTradeId === trade.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                </Button>)}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                    )
                })}
              </TableBody>
              {isOpenTrades && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={visibleColumns.tradeValue ? 5 : 4} className="font-bold">{getText('Totals', 'סך הכל')}</TableCell>
                    {visibleColumns.tradeValue && <TableCell className="font-bold">${formatNumber(totalPositionValue.toFixed(2))}</TableCell>}
                    <TableCell/>
                    {visibleColumns.risk && <TableCell className="font-bold text-red-600">-${formatNumber(totalRiskValue.toFixed(2))}</TableCell>}
                    <TableCell colSpan={4}></TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
