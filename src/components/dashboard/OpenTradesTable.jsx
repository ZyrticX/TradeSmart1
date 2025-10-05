
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, TrendingUp, TrendingDown, FileSearch, RefreshCw, Settings, Trash2, Loader2, ArrowRight, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { InvokeLLM } from "@/api/integrations";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import TradeEventsSubTable from "../trades/TradeEventsSubTable";

export default function OpenTradesTable({ 
  trades, 
  isLoading, 
  account, 
  onCloseClick, 
  onAddQuantityClick,
  onViewClick, 
  onDeleteClick, 
  deletingTradeId,
  totalPositionValue, 
  totalRiskValue 
}) {
  const [stockPrices, setStockPrices] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [selectedTradeForModal, setSelectedTradeForModal] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [pricesFetchAttempted, setPricesFetchAttempted] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  
  // Load column settings from localStorage as fallback
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('openTradesColumns');
    return saved ? JSON.parse(saved) : {
      date: true,
      symbol: true,
      direction: true,
      quantity: true,
      entryPrice: true,
      stopPrice: true,
      tradeValue: true,
      risk: true,
      confidence: true,
      strategy: true,
      realizedPL: true,
      target: true,
      acctValuePercent: true,
      posValuePercent: true,
      currentPrice: true,
      unrealizedPL: true,
      actions: true
    };
  });

  const language = localStorage.getItem('language') || 'en';
  const isRTL = language === 'he';

  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };

  // Validate if a symbol is a valid stock symbol (English letters and numbers only)
  const isValidStockSymbol = (symbol) => {
    if (!symbol || typeof symbol !== 'string') return false;
    // Only allow English letters, numbers, and some special characters like dots and hyphens
    const validSymbolPattern = /^[A-Za-z0-9.-]+$/;
    return validSymbolPattern.test(symbol.trim()) && symbol.trim().length >= 1 && symbol.trim().length <= 10;
  };

  const handleTradeAction = (action, trade) => {
    // Verify trade exists before performing action
    if (!trade || !trade.id) {
      alert(getText('This trade no longer exists. Please refresh the page.', 'עסקה זו כבר לא קיימת. אנא רענן את הדף.'));
      return;
    }

    switch(action) {
      case 'close':
        onCloseClick(trade);
        break;
      case 'addQuantity':
        onAddQuantityClick(trade);
        break;
      case 'view':
        onViewClick(trade);
        break;
      case 'delete':
        onDeleteClick(trade.id);
        break;
      default:
        break;
    }
  };

  // Load user and their preferences with error handling
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        // First try to get user
        const { User } = await import('@/api/entities');
        const user = await User.me();
        setCurrentUser(user);
        
        // Then try to load preferences, but don't fail if it doesn't work
        const currentAccountId = localStorage.getItem('currentAccountId');
        if (currentAccountId) {
          try {
            const { UserPreferences } = await import('@/api/entities');
            const preferences = await UserPreferences.filter({
              user_email: user.email,
              preference_type: 'open_trades_columns',
              account_id: currentAccountId
            });
            
            if (preferences.length > 0) {
              setVisibleColumns(preferences[0].settings);
            }
          } catch (preferencesError) {
            console.warn('Could not load user preferences, using defaults:', preferencesError);
            // Keep using localStorage fallback - no need to show error to user
          }
        }
      } catch (error) {
        console.warn('Could not load user data:', error);
        // Still allow the component to function without user preferences
      }
    };

    loadUserPreferences();
  }, []);

  // Save column settings with error handling
  const saveColumnPreferences = async (newColumns) => {
    // Always save to localStorage as primary storage
    localStorage.setItem('openTradesColumns', JSON.stringify(newColumns));
    
    // Try to save to UserPreferences if available
    if (currentUser) {
      try {
        const { UserPreferences } = await import('@/api/entities');
        const currentAccountId = localStorage.getItem('currentAccountId');
        
        if (currentAccountId) {
          const existingPrefs = await UserPreferences.filter({
            user_email: currentUser.email,
            preference_type: 'open_trades_columns',
            account_id: currentAccountId
          });
          
          if (existingPrefs.length > 0) {
            await UserPreferences.update(existingPrefs[0].id, {
              settings: newColumns
            });
          } else {
            await UserPreferences.create({
              user_email: currentUser.email,
              preference_type: 'open_trades_columns',
              account_id: currentAccountId,
              settings: newColumns
            });
          }
        }
      } catch (error) {
        console.warn('Could not save preferences to server, saved locally:', error);
        // Don't show error to user - local storage still works
      }
    }
  };

  const handleColumnVisibilityChange = (columnKey) => {
    const newColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    };
    setVisibleColumns(newColumns);
    saveColumnPreferences(newColumns);
  };

  const formatNumber = (value) => {
    let num = value;
    if (typeof value === 'string') {
      num = parseFloat(value);
    }
    if (typeof num !== 'number' || isNaN(num)) {
      return '0';
    }
    return new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US').format(num);
  };

  const handleSymbolClick = (symbol) => {
    setSelectedSymbol(symbol);
    setShowChart(true);
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

  useEffect(() => {
    if (trades.length > 0 && !pricesFetchAttempted) {
      fetchStockPrices();
    }
  }, [trades, pricesFetchAttempted]);

  const fetchStockPrices = async () => {
    setLoadingPrices(true);
    setPricesFetchAttempted(true); // Mark that an attempt has been made
    
    try {
      // Filter for valid stock symbols only
      const validSymbols = trades
        .map(trade => trade.symbol)
        .filter(symbol => isValidStockSymbol(symbol))
        .map(symbol => symbol.toUpperCase());
      
      const uniqueValidSymbols = [...new Set(validSymbols)];
      
      if (uniqueValidSymbols.length === 0) {
        console.log('No valid stock symbols found to fetch prices for');
        setStockPrices({});
        setLoadingPrices(false);
        return;
      }
      
      const symbolsString = uniqueValidSymbols.join(', ');
      
      const response_json_schema = {
          type: "object",
          properties: {
              prices: {
                  type: "array",
                  items: {
                      type: "object",
                      properties: {
                          symbol: { 
                              type: "string",
                              description: "The stock symbol, in uppercase."
                          },
                          price: {
                              type: "number",
                              description: "The current stock price."
                          }
                      },
                      required: ["symbol", "price"]
                  }
              }
          },
          required: ["prices"]
      };

      // Add timeout and retry logic
      const fetchWithTimeout = async (retryCount = 0) => {
        try {
          const response = await Promise.race([
            InvokeLLM({
              prompt: `Get the current stock price for each of the following valid stock symbols: ${symbolsString}. Only include symbols that are valid publicly traded stock symbols. You must respond with only a JSON object matching this schema: ${JSON.stringify(response_json_schema)}. The symbol in the response must exactly match a symbol from the requested list.`,
              add_context_from_internet: true,
              response_json_schema: response_json_schema
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout')), 30000) // 30 second timeout
            )
          ]);
          return response;
        } catch (error) {
          if (retryCount < 2 && (error.message.includes('Network Error') || error.message.includes('timeout'))) {
            console.log(`Retrying stock price fetch, attempt ${retryCount + 1}`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
            return fetchWithTimeout(retryCount + 1);
          }
          throw error;
        }
      };

      const response = await fetchWithTimeout();
      
      if (response && response.prices && Array.isArray(response.prices)) {
        const pricesObject = response.prices.reduce((acc, item) => {
            if (item && typeof item.symbol === 'string' && typeof item.price === 'number') {
               acc[item.symbol.toUpperCase()] = item.price;
            }
            return acc;
        }, {});
        setStockPrices(pricesObject);
      } else {
        console.error('LLM response did not match expected structure or was empty:', response);
        setStockPrices({});
      }

    } catch (error) {
      console.error('Error fetching stock prices:', error);
      // Don't show error to user for network issues, just continue without prices
      setStockPrices({});
      // Don't set pricesFetchAttempted to true on error, allow retry later
      setPricesFetchAttempted(false);
    }
    setLoadingPrices(false);
  };

  // Manual refresh function for stock prices
  const handleRefreshPrices = () => {
    setPricesFetchAttempted(false); // Reset flag to allow refetch
    setStockPrices({}); // Clear existing prices
    fetchStockPrices(); // Trigger fetch
  };

  const calculatePnL = (trade, currentPrice) => {
    if (!currentPrice || typeof currentPrice !== 'number') return { amount: 0, percentage: 0 };
    
    const entryPrice = trade.entry_price || 0;
    const quantity = trade.quantity || 0;
    
    let pnlAmount = 0;
    if (trade.direction === 'long') {
      pnlAmount = (currentPrice - entryPrice) * quantity;
    } else {
      pnlAmount = (entryPrice - currentPrice) * quantity;
    }
    
    const entryValue = entryPrice * quantity;
    const pnlPercentage = entryValue > 0 ? (pnlAmount / entryValue) * 100 : 0;
    
    return { amount: pnlAmount, percentage: pnlPercentage };
  };

  const toggleRowExpansion = (tradeId) => {
    setExpandedRows(prev => ({ ...prev, [tradeId]: !prev[tradeId] }));
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
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>{getText('No open trades currently', 'אין עסקאות פתוחות כרגע')}</p>
        <p className="text-sm">{getText('Add your first trade to get started', 'הוסף את העסקה הראשונה שלך כדי להתחיל')}</p>
      </div>
    );
  }

  const accountSize = account?.account_size || 0;

  const renderDesktopTable = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead> {/* For expander */}
            {visibleColumns.date && <TableHead className="w-16">{getText('Date', 'תאריך')}</TableHead>}
            {visibleColumns.symbol && <TableHead className="w-16">{getText('Symbol', 'סימבול')}</TableHead>}
            {visibleColumns.direction && <TableHead className="w-16">{getText('Dir.', 'כיוון')}</TableHead>}
            {visibleColumns.quantity && <TableHead className="w-16">{getText('Qty', 'כמות')}</TableHead>}
            {visibleColumns.entryPrice && <TableHead className="w-16">{getText('Entry', 'כניסה')}</TableHead>}
            {visibleColumns.stopPrice && <TableHead className="w-16">{getText('Stop', 'סטופ')}</TableHead>}
            {visibleColumns.tradeValue && <TableHead className="w-20">{getText('Value', 'שווי')}</TableHead>}
            {visibleColumns.risk && <TableHead className="w-16 text-red-600">{getText('Risk', 'סיכון')}</TableHead>}
            {visibleColumns.confidence && <TableHead className="w-16">{getText('Conf.', 'ביטחון')}</TableHead>}
            {visibleColumns.strategy && <TableHead className="w-20">{getText('Strategy', 'אסטרטגיה')}</TableHead>}
            {visibleColumns.realizedPL && <TableHead className="w-16">{getText('Real. P/L', 'רווח ממומש')}</TableHead>}
            {visibleColumns.target && <TableHead className="w-16">{getText('Target', 'יעד')}</TableHead>}
            {visibleColumns.acctValuePercent && <TableHead className="w-16">{getText('% Acct', '% חשבון')}</TableHead>}
            {visibleColumns.posValuePercent && <TableHead className="w-16">{getText('% Trade', '% עסקה')}</TableHead>}
            {visibleColumns.currentPrice && (
              <TableHead className="w-16 flex items-center gap-1">
                {getText('Current', 'נוכחי')}
                {!loadingPrices && Object.keys(stockPrices).length === 0 && pricesFetchAttempted && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRefreshPrices}
                    className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
                    title={getText('Retry fetching prices', 'נסה שוב לטעון מחירים')}
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                )}
              </TableHead>
            )}
            {visibleColumns.unrealizedPL && <TableHead className="w-20">{getText('Unreal. P/L', 'רווח לא ממומש')}</TableHead>}
            {visibleColumns.actions && <TableHead className="w-32">{getText('Actions', 'פעולות')}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => {
            // Safety check for trade
            if (!trade || !trade.id) return null;

            const entryPrice = trade.entry_price || 0;
            const quantity = trade.quantity || 0;
            const stopPrice = trade.stop_price || 0;
            const positionValue = entryPrice * quantity;
            const positionValuePercentOfTotal = totalPositionValue > 0 ? (positionValue / totalPositionValue) * 100 : 0;
            const positionValuePercentOfAccount = accountSize > 0 ? (positionValue / accountSize) * 100 : 0;
            
            const riskPercentage = entryPrice > 0 && stopPrice > 0 ? (Math.abs(entryPrice - stopPrice) / entryPrice) * 100 : 0;
            const riskAmount = trade.risk_amount || 0;
            const realizedPL = trade.profit_loss || 0;

            // Only try to get current price if symbol is valid
            const currentPrice = isValidStockSymbol(trade.symbol) ? stockPrices[trade.symbol?.toUpperCase()] : null;
            const pnl = calculatePnL(trade, currentPrice);

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
                    <TableCell className="font-medium text-center">
                      {isValidStockSymbol(trade.symbol) ? (
                        <button 
                          onClick={() => handleSymbolClick(trade.symbol)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm"
                        >
                          {trade.symbol || ''}
                        </button>
                      ) : (
                        <span className="font-medium text-sm text-gray-600">{trade.symbol || ''}</span>
                      )}
                    </TableCell>
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
                  {visibleColumns.stopPrice && (
                    <TableCell className="text-xs">${(trade.stop_price || 0).toFixed(2)}</TableCell>
                  )}
                  {visibleColumns.tradeValue && (
                    <TableCell className="font-semibold text-xs">
                        ${formatNumber(positionValue.toFixed(0))}
                    </TableCell>
                  )}
                  {visibleColumns.risk && (
                    <TableCell className="text-red-600 font-semibold text-xs">
                      <div>
                        <div>-${formatNumber(riskAmount.toFixed(0))}</div>
                        <div className="text-xs">{riskPercentage.toFixed(1)}%</div>
                      </div>
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
                  {visibleColumns.realizedPL && (
                    <TableCell className={`${realizedPL >= 0 ? 'text-green-600' : 'text-red-600'} text-xs`}>
                      {realizedPL !== 0 ? `$${formatNumber(realizedPL.toFixed(0))}` : '$0'}
                    </TableCell>
                  )}
                  {visibleColumns.target && (
                    <TableCell className="text-xs">${(trade.target_price || 0).toFixed(2)}</TableCell>
                  )}
                  {visibleColumns.acctValuePercent && (
                    <TableCell className="text-xs">{positionValuePercentOfAccount.toFixed(1)}%</TableCell>
                  )}
                  {visibleColumns.posValuePercent && (
                    <TableCell className="text-xs">{positionValuePercentOfTotal.toFixed(1)}%</TableCell>
                  )}
                  {visibleColumns.currentPrice && (
                    <TableCell className="font-medium text-xs">
                      {loadingPrices ? (
                        <Skeleton className="h-3 w-12" />
                      ) : currentPrice && typeof currentPrice === 'number' ? (
                        <span className={currentPrice > entryPrice ? 'text-green-600' : currentPrice < entryPrice ? 'text-red-600' : ''}>
                          ${currentPrice.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          {pricesFetchAttempted ? 'N/A' : getText('Loading...', 'טוען...')}
                        </span>
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.unrealizedPL && (
                    <TableCell className={`${pnl.amount >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'} text-xs`}>
                      {currentPrice && typeof currentPrice === 'number' ? (
                        <div>
                          <div>${formatNumber(pnl.amount.toFixed(0))}</div>
                          <div className="text-xs">({pnl.percentage >= 0 ? '+' : ''}{pnl.percentage.toFixed(1)}%)</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">
                          {pricesFetchAttempted ? 'N/A' : getText('Loading...', 'טוען...')}
                        </span>
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.actions && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {onAddQuantityClick && trade.status === 'open' && (
                          <Button size="sm" onClick={() => handleTradeAction('addQuantity', trade)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 h-8 min-w-[60px]">
                            <Plus className="w-3 h-3 mr-1" />
                            {getText('Add', 'הוסף')}
                          </Button>
                        )}
                        {onCloseClick && trade.status === 'open' && (
                          <Button size="sm" onClick={() => handleTradeAction('close', trade)} className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 h-8 min-w-[60px]">
                            {getText('Sell', 'מכור')}
                          </Button>
                        )}
                        {onViewClick && (
                          <Button variant="outline" size="sm" onClick={() => handleTradeAction('view', trade)} className="h-8 w-10 p-0">
                            <FileSearch className="w-3 h-3" />
                          </Button>
                        )}
                        {onDeleteClick && (
                          <Button variant="ghost" size="icon" onClick={() => handleTradeAction('delete', trade)} className="text-gray-500 hover:bg-red-50 hover:text-red-600 h-8 w-10" disabled={deletingTradeId === trade.id}>
                            {deletingTradeId === trade.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
                {isExpanded && (
                    <TableRow key={`${trade.id}-details`}>
                        <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} className="p-0">
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
            <TableCell colSpan={1} className="font-bold text-xs"></TableCell> {/* For the expander column */}
            <TableCell colSpan={5} className="font-bold text-xs">{getText('Totals', 'סך הכל')}</TableCell>
            {visibleColumns.tradeValue && (
              <TableCell className="font-bold text-xs">${formatNumber(totalPositionValue.toFixed(0))}</TableCell>
            )}
            {visibleColumns.risk && (
              <TableCell className="font-bold text-red-600 text-xs">
                -${formatNumber(totalRiskValue.toFixed(0))}
              </TableCell>
            )}
            {/* The +1 accounts for the new expander column */}
            <TableCell colSpan={Object.values(visibleColumns).filter(key => key !== 'tradeValue' && key !== 'risk').length - 1}></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );

  const renderMobileList = () => (
    <div className="space-y-3">
      {trades.map(trade => {
        const currentPrice = isValidStockSymbol(trade.symbol) ? stockPrices[trade.symbol?.toUpperCase()] : null;
        const pnl = calculatePnL(trade, currentPrice);
        const isExpanded = expandedRows[trade.id];
        return(
          <React.Fragment key={trade.id}>
            <Card className="p-0">
              <button onClick={() => toggleRowExpansion(trade.id)} className="w-full text-left p-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col text-sm">
                    <span className="font-bold text-base">{trade.symbol}</span>
                    <span className="text-gray-500">{trade.date_time ? format(new Date(trade.date_time), 'dd MMM yyyy') : 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`text-right text-sm font-semibold ${pnl.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {currentPrice ? <div>${formatNumber(pnl.amount.toFixed(2))}</div> : 
                      pricesFetchAttempted ? <div>-</div> : <div>{getText('Loading...', 'טוען...')}</div>}
                  </div>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </div>
              </button>
            </Card>
            {isExpanded && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <TradeEventsSubTable tradeId={trade.id} />
                <div className="flex pt-4 items-center gap-1">
                  {onAddQuantityClick && trade.status === 'open' && <Button size="sm" onClick={() => handleTradeAction('addQuantity', trade)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2">{getText('Add', 'הוסף')}</Button>}
                  {onCloseClick && trade.status === 'open' && <Button size="sm" onClick={() => handleTradeAction('close', trade)} className="bg-red-500 hover:bg-red-600 text-white text-xs px-2">{getText('Sell', 'מכור')}</Button>}
                  {onViewClick && <Button variant="outline" size="sm" onClick={() => handleTradeAction('view', trade)}><FileSearch className="w-3 h-3" /></Button>}
                  {onDeleteClick && <Button variant="ghost" size="icon" onClick={() => handleTradeAction('delete', trade)} className="text-gray-500 hover:bg-red-50 hover:text-red-600 h-8 w-8" disabled={deletingTradeId === trade.id}>{deletingTradeId === trade.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</Button>}
                </div>
              </div>
            )}
          </React.Fragment>
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
    // This modal is now effectively replaced by the in-line expansion for mobile.
    // However, if there was a separate "view details" button that brought up a modal, this would be relevant.
    // For now, disabling or re-purposing this based on current UX.
    // The current mobile UX uses toggleRowExpansion to show details directly in the list.
    // Keeping this render function but removing the code that opens it for now.
    // If setSelectedTradeForModal is still used elsewhere, this modal might pop up.
    // It's safer to ensure this modal is not triggered if the new inline expansion is the primary detail view.

    // If setSelectedTradeForModal is null, return null.
    if (!selectedTradeForModal) return null;
    
    // The below code is mostly a fallback or for a different interaction.
    // For the current implementation, we are using inline expansion.
    // So, this modal won't be triggered. If it was, it would look like this:

    const trade = selectedTradeForModal;
    const entryPrice = trade.entry_price || 0;
    const quantity = trade.quantity || 0;
    const positionValue = entryPrice * quantity;
    const positionValuePercentOfAccount = accountSize > 0 ? (positionValue / accountSize) * 100 : 0;
    const riskAmount = trade.risk_amount || 0;
    const realizedPL = trade.profit_loss || 0;
    const currentPrice = isValidStockSymbol(trade.symbol) ? stockPrices[trade.symbol?.toUpperCase()] : null;
    const pnl = calculatePnL(trade, currentPrice);

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
            <DetailItem label={getText('Trade Value', 'שווי עסקה')} value={`$${formatNumber(positionValue.toFixed(2))}`} />
            <DetailItem label={getText('% of Acct.', '% מהחשבון')} value={`${positionValuePercentOfAccount.toFixed(1)}%`} />
            <DetailItem label={getText('Stop Price', 'מחיר סטופ')} value={`$${(trade.stop_price || 0).toFixed(2)}`} />
            <DetailItem label={getText('Risk', 'סיכון')} value={`-$${formatNumber(riskAmount.toFixed(2))}`} valueClass="text-red-600" />
            <DetailItem label={getText('Current Price', 'מחיר נוכחי')} value={currentPrice ? `$${currentPrice.toFixed(2)}` : pricesFetchAttempted ? 'N/A' : getText('Loading...', 'טוען...')} />
            <DetailItem label={getText('Unrealized P/L', 'רווח/הפסד לא ממומש')} value={currentPrice ? `$${formatNumber(pnl.amount.toFixed(2))} (${pnl.percentage.toFixed(2)}%)` : pricesFetchAttempted ? 'N/A' : getText('Loading...', 'טוען...')} valueClass={pnl.amount > 0 ? 'text-green-600' : 'text-red-600'} />
            <DetailItem label={getText('Realized P/L', 'רווח/הפסד ממומש')} value={`$${formatNumber(realizedPL.toFixed(2))}`} valueClass={realizedPL >= 0 ? 'text-green-600' : 'text-red-600'} />
          </div>
           <div className="flex pt-4 items-center gap-1">
              {onAddQuantityClick && selectedTradeForModal.status === 'open' && <Button size="sm" onClick={() => handleTradeAction('addQuantity', selectedTradeForModal)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2">{getText('Add', 'הוסף')}</Button>}
              {onCloseClick && selectedTradeForModal.status === 'open' && <Button size="sm" onClick={() => handleTradeAction('close', selectedTradeForModal)} className="bg-red-500 hover:bg-red-600 text-white text-xs px-2">{getText('Sell', 'מכור')}</Button>}
              {onViewClick && <Button variant="outline" size="sm" onClick={() => handleTradeAction('view', selectedTradeForModal)}><FileSearch className="w-3 h-3" /></Button>}
              {onDeleteClick && <Button variant="ghost" size="icon" onClick={() => handleTradeAction('delete', selectedTradeForModal)} className="text-gray-500 hover:bg-red-50 hover:text-red-600 h-8 w-8" disabled={deletingTradeId === selectedTradeForModal.id}>{deletingTradeId === selectedTradeForModal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</Button>}
            </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {getText('Open Trades', 'עסקאות פתוחות')} ({formatNumber(trades.length)})
        </h3>
        <div className="flex gap-2">
          {!loadingPrices && Object.keys(stockPrices).length === 0 && pricesFetchAttempted && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshPrices}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {getText('Retry Prices', 'נסה מחירים שוב')}
            </Button>
          )}
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

      {/* Chart Modal */}
      {showChart && isValidStockSymbol(selectedSymbol) && (
        <Dialog open={showChart} onOpenChange={setShowChart}>
          <DialogContent className="max-w-[95vw] max-h-[90vh] w-full h-full p-2">
            <DialogHeader className="pb-2">
              <DialogTitle>{selectedSymbol} {getText('Chart', 'גרף')}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 w-full h-full min-h-[70vh]">
              <iframe 
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${selectedSymbol}&interval=D&hidesidetoolbar=0&hidetoptoolbar=0&symboledit=1&saveimage=1&toolbarbg=F1F3F6&studies=[]&hideideas=1&theme=Light&style=1&timezone=Etc/UTC&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=localhost&utm_medium=widget_new&utm_campaign=chart&utm_term=${selectedSymbol}`} 
                className="w-full h-full border-0 rounded-lg" 
                allowFullScreen 
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
