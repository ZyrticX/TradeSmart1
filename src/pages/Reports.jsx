import React, { useState, useEffect } from "react";
import { Trade, Account } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, BarChart3, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { format } from "date-fns";
import ReportTable from "../components/reports/ReportTable";
import TradeDetailModal from "../components/trades/TradeDetailModal";

export default function Reports() {
  const [trades, setTrades] = useState([]);
  const [filteredTrades, setFilteredTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [tradeToView, setTradeToView] = useState(null);
  
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: 'all',
    symbol: '',
    strategy: ''
  });
  
  const language = localStorage.getItem('language') || 'en';
  const isRTL = language === 'he';

  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number);
  };

  const currentAccountId = localStorage.getItem('currentAccountId');

  useEffect(() => {
    const initializePage = async () => {
      // Set default date range to show all data
      const today = new Date();
      const sixMonthsAgo = new Date(today);
      sixMonthsAgo.setMonth(today.getMonth() - 6);
      
      setFilters(prev => ({
          ...prev,
          dateFrom: format(sixMonthsAgo, 'yyyy-MM-dd'),
          dateTo: format(today, 'yyyy-MM-dd'),
      }));
      
      if (currentAccountId) {
          await loadTrades();
      } else {
          setIsLoading(false);
      }
    };

    initializePage();
  }, [currentAccountId]);

  useEffect(() => {
    applyFilters();
  }, [trades, filters]);

  const loadTrades = async () => {
    setIsLoading(true);
    try {
      console.log('Loading trades for account:', currentAccountId);
      
      const [accountData, tradesData] = await Promise.all([
          Account.get(currentAccountId).catch(error => {
            console.error('Error loading account:', error);
            return null;
          }),
          Trade.filter({ account_id: currentAccountId }, '-date_time').catch(error => {
            console.error('Error loading trades:', error);
            return [];
          })
      ]);
      
      console.log('Loaded trades:', tradesData);
      console.log('Loaded account:', accountData);
      
      if (accountData) {
        setCurrentAccount(accountData);
      } else {
        console.warn('⚠️ Account not found:', currentAccountId);
        localStorage.removeItem('currentAccountId');
        setCurrentAccount(null);
      }
      
      // Ensure we set trades even if empty
      setTrades(tradesData || []);
    } catch (error) {
      console.error('Error loading trades:', error);
      setTrades([]);
    }
    setIsLoading(false);
  };

  const applyFilters = () => {
    console.log('Applying filters to trades:', trades.length);
    let filtered = [...trades]; // Create a copy to avoid mutation
    
    // Apply date filter
    if (filters.dateFrom && filters.dateTo) {
        const fromDate = new Date(filters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);

        filtered = filtered.filter(trade => {
            const tradeDate = new Date(trade.date_time);
            return tradeDate >= fromDate && tradeDate <= toDate;
        });
        console.log('After date filter:', filtered.length);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(trade => {
        const tradeStatus = trade.status || 'open';
        return tradeStatus === filters.status;
      });
      console.log('After status filter:', filtered.length);
    }
    
    // Apply symbol filter
    if (filters.symbol) {
      filtered = filtered.filter(trade => 
        trade.symbol && trade.symbol.toLowerCase().includes(filters.symbol.toLowerCase())
      );
      console.log('After symbol filter:', filtered.length);
    }
    
    // Apply strategy filter
    if (filters.strategy) {
      filtered = filtered.filter(trade => 
        trade.strategy && trade.strategy.toLowerCase().includes(filters.strategy.toLowerCase())
      );  
      console.log('After strategy filter:', filtered.length);
    }

    console.log('Final filtered trades:', filtered.length);
    setFilteredTrades(filtered);
  };

  const handleFilterChange = (field, value) => {
    console.log('Filter changed:', field, value);
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTradeClick = (trade) => {
    setTradeToView(trade);
  };

  const exportToCSV = () => {
    if (filteredTrades.length === 0) return;
    
    const headers = [
      getText('Date', 'תאריך'),
      getText('Symbol', 'סימבול'),
      getText('Direction', 'כיוון'),
      getText('Bought Qty', 'כמות נקנתה'),
      getText('Sold Qty', 'כמות נמכרה'),
      getText('Entry Price', 'מחיר כניסה'),
      getText('Exit Price', 'מחיר יציאה'),
      getText('Status', 'סטטוס'),
      getText('Strategy', 'אסטרטגיה'),
      getText('Commissions', 'עמלות'),
      getText('P/L ($)', 'רווח/הפסד ($)'),
      getText('P/L (%)', 'רווח/הפסד (%)')
    ];

    const csvData = filteredTrades.map(trade => {
      let exitPrice = null;
      let plPercentage = null;
      let quantitySold = 0;

      if (trade.status === 'closed') {
          quantitySold = trade.total_quantity || trade.quantity;
          if ((trade.total_investment || 0) > 0) {
              const totalReturnValue = (trade.total_investment + (trade.profit_loss || 0));
              exitPrice = totalReturnValue / (trade.total_quantity || trade.quantity || 1);
              plPercentage = ((trade.profit_loss || 0) / trade.total_investment) * 100;
          }
      }
      
      return [
        format(new Date(trade.date_time), 'yyyy-MM-dd HH:mm:ss'),
        trade.symbol, 
        trade.direction === 'long' ? getText('Long', 'לונג') : getText('Short', 'שורט'), 
        trade.total_quantity || trade.quantity,
        quantitySold,
        trade.entry_price?.toFixed(2) || '',
        exitPrice ? exitPrice.toFixed(2) : '',
        getText(trade.status, trade.status === 'closed' ? 'סגור' : 'פתוח', trade.status === 'closed' ? 'Cerrado' : 'Abierto'),
        trade.strategy || '',
        trade.total_commission?.toFixed(2) || '0.00',
        trade.profit_loss?.toFixed(2) || '',
        plPercentage ? plPercentage.toFixed(2) + '%' : ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${getText('trades_report', 'דוח_עסקאות')}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const closedTrades = filteredTrades.filter(trade => trade.status === 'closed');
  const totalPL = closedTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);
  const totalCommissions = filteredTrades.reduce((sum, trade) => sum + (trade.total_commission || 0), 0);
  const winningTrades = closedTrades.filter(trade => (trade.profit_loss || 0) > 0);
  const losingTrades = closedTrades.filter(trade => (trade.profit_loss || 0) < 0);
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
  const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, trade) => sum + trade.profit_loss, 0) / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, trade) => sum + trade.profit_loss, 0) / losingTrades.length : 0;

  if (!currentAccountId) {
      return <div className="p-6 text-center text-gray-600">{getText('Please select an account from settings to view reports.', 'אנא בחר חשבון מההגדרות כדי לצפות בדוחות.')}</div>
  }

  return (
    <div className="space-y-6">
      {/* Account Banner */}
      {currentAccount && (
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">{getText('Active Account:', 'חשבון פעיל:')} {currentAccount.name}</h2>
              <p className="text-sm opacity-90">{getText('Displaying reports for this account', 'מציג דוחות עבור חשבון זה')}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{getText('Reports & Analytics', 'דוחות וניתוחים')}</h1>
          <p className="text-gray-600 mt-1">{getText('Exporting and analyzing trading data', 'ייצוא וניתוח נתוני המסחר')}</p>
        </div>
        <Button onClick={exportToCSV} className="bg-purple-600 hover:bg-purple-700 text-white" disabled={filteredTrades.length === 0}>
          <Download className="w-4 h-4 mx-2" />
          {getText('Export to CSV', 'ייצוא ל-CSV')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {getText('Report Filters', 'מסנני דוח')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">{getText('From Date', 'מתאריך')}</Label>
              <Input id="dateFrom" type="date" value={filters.dateFrom} onChange={(e) => handleFilterChange('dateFrom', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">{getText('To Date', 'עד תאריך')}</Label>
              <Input id="dateTo" type="date" value={filters.dateTo} onChange={(e) => handleFilterChange('dateTo', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">{getText('Status', 'סטטוס')}</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{getText('All', 'הכל')}</SelectItem>
                  <SelectItem value="open">{getText('Open', 'פתוח')}</SelectItem>
                  <SelectItem value="closed">{getText('Closed', 'סגור')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="symbol">{getText('Symbol', 'סימבול')}</Label>
              <Input id="symbol" value={filters.symbol} onChange={(e) => handleFilterChange('symbol', e.target.value)} placeholder={getText('e.g.: AAPL', 'לדוגמה: AAPL')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strategy">{getText('Strategy', 'אסטרטגיה')}</Label>
              <Input id="strategy" value={filters.strategy} onChange={(e) => handleFilterChange('strategy', e.target.value)} placeholder={getText('e.g.: Breakout', 'לדוגמה: פריצה')} />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
         <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">{getText('Total P/L', 'סה"כ רווח/הפסד')}</p><p className={`text-2xl font-bold ${totalPL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: currentAccount?.currency || 'USD' }).format(totalPL)}</p></div><TrendingUp className="w-8 h-8 text-gray-400" /></div></CardContent></Card>
         <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">{getText('Total Commissions', 'סה"כ עמלות')}</p><p className="text-2xl font-bold text-orange-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: currentAccount?.currency || 'USD' }).format(totalCommissions)}</p></div><DollarSign className="w-8 h-8 text-gray-400" /></div></CardContent></Card>
         <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">{getText('Win Rate', 'אחוז הצלחה')}</p><p className="text-2xl font-bold text-blue-600">{winRate.toFixed(1)}%</p></div><BarChart3 className="w-8 h-8 text-gray-400" /></div></CardContent></Card>
         <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">{getText('Average Win', 'ממוצע רווח')}</p><p className="text-2xl font-bold text-emerald-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: currentAccount?.currency || 'USD' }).format(avgWin)}</p></div><TrendingUp className="w-8 h-8 text-gray-400" /></div></CardContent></Card>
         <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">{getText('Average Loss', 'ממוצע הפסד')}</p><p className="text-2xl font-bold text-red-600">-{new Intl.NumberFormat('en-US', { style: 'currency', currency: currentAccount?.currency || 'USD' }).format(Math.abs(avgLoss))}</p></div><TrendingDown className="w-8 h-8 text-gray-400" /></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {`${getText('Filtered Results', 'תוצאות מסוננות')} (${formatNumber(filteredTrades.length)} ${getText('trades', 'עסקאות')})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReportTable trades={filteredTrades} isLoading={isLoading} onTradeClick={handleTradeClick} />
        </CardContent>
      </Card>
      
      <TradeDetailModal
        isOpen={!!tradeToView}
        onClose={() => setTradeToView(null)}
        trade={tradeToView}
      />
    </div>
  );
}