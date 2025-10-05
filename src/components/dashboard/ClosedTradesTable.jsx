
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, TrendingUp, TrendingDown, FileSearch, Settings, Loader2, ArrowRight, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import TradeEventsSubTable from "../trades/TradeEventsSubTable";

export default function ClosedTradesTable({ 
  trades, 
  isLoading, 
  account, 
  onViewClick,
  onEditClick,
  onDeleteClick,
  totalRealizedPL,
  deletingTradeId
}) {
  // Load column settings from localStorage as fallback with error handling
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const defaultColumns = {
      date: true,
      symbol: true,
      direction: true,
      quantity: true,
      entryPrice: true,
      exitPrice: true,
      tradeValue: true,
      realizedPL: true,
      plPercentage: true,
      confidence: true,
      strategy: true,
      commission: true,
      target: true,
      actions: true
    };
    try {
      const saved = localStorage.getItem('closedTradesColumns');
      return saved ? JSON.parse(saved) : defaultColumns;
    } catch (error) {
      console.error("Failed to parse closedTradesColumns from localStorage:", error);
      return defaultColumns; // Fallback to default in case of parsing error
    }
  });

  // Save to localStorage whenever columns change
  useEffect(() => {
    localStorage.setItem('closedTradesColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const [selectedTradeForModal, setSelectedTradeForModal] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  
  const language = localStorage.getItem('language') || 'en';
  const isRTL = language === 'he';

  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };

  const formatNumber = (value) => {
    let num = value;
    if (typeof value === 'string') {
      num = parseFloat(value);
    }
    if (typeof num !== 'number' || isNaN(num)) {
      return '0';
    }
    return new Intl.NumberFormat('en-US').format(num);
  };

  const handleColumnVisibilityChange = (columnKey) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const toggleRowExpansion = (tradeId) => {
    setExpandedRows(prev => ({ ...prev, [tradeId]: !prev[tradeId] }));
  };

  const handleTradeAction = (action, trade) => {
    // Verify trade exists before performing action
    if (!trade || !trade.id) {
      alert(getText('This trade no longer exists. Please refresh the page.', 'עסקה זו כבר לא קיימת. אנא רענן את הדף.'));
      return;
    }

    switch(action) {
      case 'view':
        onViewClick(trade);
        break;
      case 'edit':
        onEditClick(trade);
        break;
      case 'delete':
        onDeleteClick(trade.id);
        break;
      default:
        break;
    }
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

  const calculateExitPrice = (trade) => {
    if (trade.status === 'closed' && (trade.total_investment || 0) > 0) {
      const totalReturnValue = (trade.total_investment + (trade.profit_loss || 0));
      return totalReturnValue / (trade.total_quantity || 1);
    }
    return trade.entry_price || 0;
  };

  const calculatePLPercentage = (trade) => {
    if (trade.status === 'closed' && (trade.total_investment || 0) > 0) {
      return ((trade.profit_loss || 0) / trade.total_investment) * 100;
    }
    return 0;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <TrendingDown className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>{getText('No closed trades currently', 'אין עסקאות סגורות כרגע')}</p>
        <p className="text-sm">{getText('Close some trades to see performance data', 'סגור כמה עסקאות כדי לראות נתוני ביצועים')}</p>
      </div>
    );
  }

  const renderDesktopTable = () => {
    const visibleColumnKeys = Object.keys(visibleColumns).filter(key => visibleColumns[key]);
    const plIndex = visibleColumnKeys.indexOf('realizedPL');
    
    // Adjusted colSpan calculations for the new expander column
    const colSpanForTotalLabel = (plIndex === -1 ? 0 : plIndex + 1); // +1 for the expander column
    const colSpanForAfterTotal = plIndex === -1 ? 0 : (visibleColumnKeys.length + 1) - colSpanForTotalLabel - 1; // Total columns - label span - P/L value span

    return (
    <div className="overflow-x-auto">
      <Table className="bg-white">
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead> {/* For expander */}
            {visibleColumns.date && <TableHead className="w-20">{getText('Date', 'תאריך')}</TableHead>}
            {visibleColumns.symbol && <TableHead className="w-16">{getText('Symbol', 'סימבול')}</TableHead>}
            {visibleColumns.direction && <TableHead className="w-16">{getText('Dir.', 'כיוון')}</TableHead>}
            {visibleColumns.quantity && <TableHead className="w-16">{getText('Qty', 'כמות')}</TableHead>}
            {visibleColumns.entryPrice && <TableHead className="w-16">{getText('Entry', 'כניסה')}</TableHead>}
            {visibleColumns.exitPrice && <TableHead className="w-16">{getText('Exit', 'יציאה')}</TableHead>}
            {visibleColumns.tradeValue && <TableHead className="w-20">{getText('Value', 'שווי')}</TableHead>}
            {visibleColumns.realizedPL && <TableHead className="w-20">{getText('P/L', 'רווח')}</TableHead>}
            {visibleColumns.plPercentage && <TableHead className="w-16">{getText('P/L %', 'רווח %')}</TableHead>}
            {visibleColumns.confidence && <TableHead className="w-16">{getText('Conf.', 'ביטחון')}</TableHead>}
            {visibleColumns.strategy && <TableHead className="w-20">{getText('Strategy', 'אסטרטגיה')}</TableHead>}
            {visibleColumns.commission && <TableHead className="w-16">{getText('Comm.', 'עמלה')}</TableHead>}
            {visibleColumns.target && <TableHead className="w-16">{getText('Target', 'יעד')}</TableHead>}
            {visibleColumns.actions && <TableHead className="w-24">{getText('Actions', 'פעולות')}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => {
            // Safety check for trade
            if (!trade || !trade.id) return null;

            const entryPrice = trade.entry_price || 0;
            const quantity = trade.total_quantity || trade.quantity || 0;
            const tradeValue = trade.total_investment || (entryPrice * quantity);
            const realizedPL = trade.profit_loss || 0;
            const exitPrice = calculateExitPrice(trade);
            const plPercentage = calculatePLPercentage(trade);
            const commission = trade.total_commission || 0;
            const isExpanded = expandedRows[trade.id];
            
            return (
              <React.Fragment key={trade.id}>
                <TableRow className="hover:bg-gray-50">
                   <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => toggleRowExpansion(trade.id)} className="w-6 h-6 p-0">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                  {visibleColumns.date && (
                    <TableCell className="text-xs">{trade.date_time ? format(new Date(trade.date_time), 'dd/MM') : 'N/A'}</TableCell>
                  )}
                  {visibleColumns.symbol && (
                    <TableCell className="font-medium text-center text-sm">{trade.symbol || ''}</TableCell>
                  )}
                  {visibleColumns.direction && (
                    <TableCell>
                      <Badge variant={trade.direction === 'long' ? 'default' : 'secondary'} className={`${trade.direction === 'long' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'} text-xs px-1`}>
                        {trade.direction === 'long' ? <TrendingUp className="w-2 h-2 me-1" /> : <TrendingDown className="w-2 h-2 me-1" />}
                        {trade.direction === 'long' ? 'L' : 'S'}
                      </Badge>
                    </TableCell>
                  )}
                  {visibleColumns.quantity && (
                    <TableCell className="text-xs">{formatNumber(quantity)}</TableCell>
                  )}
                  {visibleColumns.entryPrice && (
                    <TableCell className="text-xs">${entryPrice.toFixed(2)}</TableCell>
                  )}
                  {visibleColumns.exitPrice && (
                    <TableCell className="text-xs">${exitPrice.toFixed(2)}</TableCell>
                  )}
                  {visibleColumns.tradeValue && (
                    <TableCell className="font-semibold text-xs">${formatNumber(tradeValue.toFixed(0))}</TableCell>
                  )}
                  {visibleColumns.realizedPL && (
                    <TableCell className={`${realizedPL >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'} text-xs`}>
                      ${formatNumber(realizedPL.toFixed(0))}
                    </TableCell>
                  )}
                  {visibleColumns.plPercentage && (
                    <TableCell className={`${plPercentage >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'} text-xs`}>
                      {plPercentage.toFixed(1)}%
                    </TableCell>
                  )}
                  {visibleColumns.confidence && (
                    <TableCell className="text-center">
                      {renderStars(trade.confidence_level || 0)}
                    </TableCell>
                  )}
                  {visibleColumns.strategy && (
                    <TableCell>
                      <span className="text-xs truncate">{trade.strategy || 'N/A'}</span>
                    </TableCell>
                  )}
                  {visibleColumns.commission && (
                    <TableCell className="text-xs">${formatNumber(commission.toFixed(0))}</TableCell>
                  )}
                  {visibleColumns.target && (
                    <TableCell className="text-xs">${(trade.target_price || 0).toFixed(2)}</TableCell>
                  )}
                  {visibleColumns.actions && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {onViewClick && (
                          <Button variant="outline" size="sm" onClick={() => handleTradeAction('view', trade)} className="h-6 w-6 p-0">
                            <FileSearch className="w-3 h-3" />
                          </Button>
                        )}
                        {onEditClick && (
                          <Button variant="outline" size="sm" onClick={() => handleTradeAction('edit', trade)} className="h-6 w-6 p-0">
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
                        {onDeleteClick && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleTradeAction('delete', trade)}
                            disabled={deletingTradeId === trade.id}
                            className="text-gray-500 hover:bg-red-50 hover:text-red-600 h-6 w-6 p-0"
                          >
                            {deletingTradeId === trade.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
                 {isExpanded && (
                    <TableRow key={`${trade.id}-details`}>
                        <TableCell colSpan={visibleColumnKeys.length + 1} className="p-0">
                           <TradeEventsSubTable tradeId={trade.id} />
                        </TableCell>
                    </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            {plIndex !== -1 && (
              <TableCell colSpan={colSpanForTotalLabel} className="font-bold text-xs">{getText('Total P/L', 'סה"כ רווח')}</TableCell>
            )}
            {visibleColumns.realizedPL && (
              <TableCell className={`font-bold text-xs ${totalRealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${formatNumber(totalRealizedPL.toFixed(0))}
              </TableCell>
            )}
            {plIndex !== -1 && colSpanForAfterTotal > 0 && <TableCell colSpan={colSpanForAfterTotal}></TableCell>}
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )};

  const renderMobileList = () => (
    <div className="space-y-3">
      {trades.map(trade => {
        // Safety check for trade
        if (!trade || !trade.id) return null;

        const realizedPL = trade.profit_loss || 0;
        return(
          <Card key={trade.id} className="p-0">
            <button onClick={() => setSelectedTradeForModal(trade)} className="w-full text-left p-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex flex-col text-sm">
                   <span className="font-bold text-base">{trade.symbol}</span>
                   <span className="text-gray-500">{trade.date_time ? format(new Date(trade.date_time), 'dd MMM yyyy') : 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`text-right text-sm font-semibold ${realizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <div>${formatNumber(realizedPL.toFixed(2))}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </button>
          </Card>
      )})}
    </div>
  );
  
  const DetailItem = ({ label, value, valueClass = "" }) => (
    <div className="flex justify-between items-center py-2 border-b">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
    </div>
  );

  const renderMobileDetailModal = () => {
    if (!selectedTradeForModal) return null;
    
    const trade = selectedTradeForModal;
    const entryPrice = trade.entry_price || 0;
    const quantity = trade.total_quantity || trade.quantity || 0;
    const tradeValue = trade.total_investment || (entryPrice * quantity);
    const realizedPL = trade.profit_loss || 0;
    const exitPrice = calculateExitPrice(trade);
    const plPercentage = calculatePLPercentage(trade);

    return (
      <Dialog open={!!selectedTradeForModal} onOpenChange={() => setSelectedTradeForModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{trade.symbol}</DialogTitle>
            <DialogDescription>
              {getText('Direction:', 'כיוון:')} {' '}
              <span className={trade.direction === 'long' ? 'text-emerald-600' : 'text-red-600'}>
                {trade.direction === 'long' ? getText('Long', 'לונג') : getText('Short', 'שורט')}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <DetailItem label={getText('Date', 'תאריך')} value={trade.date_time ? format(new Date(trade.date_time), 'dd/MM/yyyy') : 'N/A'} />
            <DetailItem label={getText('Quantity', 'כמות')} value={formatNumber(quantity)} />
            <DetailItem label={getText('Entry Price', 'מחיר כניסה')} value={`$${entryPrice.toFixed(2)}`} />
            <DetailItem label={getText('Exit Price', 'מחיר יציאה')} value={`$${exitPrice.toFixed(2)}`} />
            <DetailItem label={getText('Trade Value', 'שווי עסקה')} value={`$${formatNumber(tradeValue.toFixed(2))}`} />
            <DetailItem label={getText('Realized P/L', 'רווח/הפסד ממומש')} value={`$${formatNumber(realizedPL.toFixed(2))} (${plPercentage.toFixed(2)}%)`} valueClass={realizedPL >= 0 ? 'text-green-600' : 'text-red-600'} />
          </div>
           <div className="flex pt-4 items-center gap-1">
              {onViewClick && <Button variant="outline" size="sm" onClick={() => handleTradeAction('view', trade)}><FileSearch className="w-3 h-3" /></Button>}
              {onEditClick && <Button variant="outline" size="sm" onClick={() => handleTradeAction('edit', trade)}><Edit className="w-3 h-3" /></Button>}
              {onDeleteClick && <Button variant="ghost" size="sm" onClick={() => handleTradeAction('delete', trade)} className="text-gray-500 hover:bg-red-50 hover:text-red-600" disabled={deletingTradeId === trade.id}>{deletingTradeId === trade.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</Button>}
            </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {getText('Closed Trades', 'עסקאות סגורות')} ({formatNumber(trades.length)})
        </h3>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden md:flex">
                <Settings className="w-4 h-4 me-2" />
                {getText('Columns', 'עמודות')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.entries(visibleColumns).map(([key, visible]) => (
                <DropdownMenuItem 
                  key={key}
                  onClick={() => handleColumnVisibilityChange(key)}
                >
                  <input type="checkbox" checked={visible} className="me-2" readOnly />
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="hidden md:block">
        {renderDesktopTable()}
      </div>
      <div className="block md:hidden">
        {renderMobileList()}
      </div>

      {renderMobileDetailModal()}
    </div>
  );
}
