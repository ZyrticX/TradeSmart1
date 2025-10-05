
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadFile } from "@/api/integrations";
import { TrendingUp, TrendingDown, Calculator, Upload, Loader2, Info, Star, BarChart3, X, RotateCcw } from "lucide-react";
import { format as formatDateFn } from "date-fns";

// Helper function to get current local date/time in the correct format
const getCurrentLocalDateTime = () => {
  const now = new Date();
  // Adjust for timezone offset to get true local time
  const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
  return localDate.toISOString().slice(0, 16);
};

// Helper function to format datetime for display (DD/MM/YYYY HH:MM)
const formatDateTimeForDisplay = (dateTimeString) => {
  if (!dateTimeString) return '';
  try {
    const date = new Date(dateTimeString);
    return formatDateFn(date, 'dd/MM/yyyy HH:mm');
  } catch (error) {
    return dateTimeString;
  }
};

// Helper function to convert display format back to input format
const convertDisplayToInputFormat = (displayString) => {
  if (!displayString) return '';
  try {
    // Parse DD/MM/YYYY HH:MM format
    const [datePart, timePart] = displayString.split(' ');
    const [day, month, year] = datePart.split('/');
    const [hours, minutes] = timePart.split(':');
    
    const date = new Date(year, month - 1, day, hours, minutes);
    return date.toISOString().slice(0, 16);
  } catch (error) {
    return displayString;
  }
};

const getInitialFormData = (settings, trade) => {
  const baseData = {
    symbol: '',
    date_time: getCurrentLocalDateTime(), // Use local system time
    action: 'buy',
    direction: 'long',
    entry_price: '',
    target_price: '',
    stop_price: '',
    quantity: '',
    position_amount: '',
    risk_percentage: settings?.default_risk_percentage?.toString() || '2',
    confidence_level: 0,
    notes: '',
    strategy: '',
    screenshot_url: ''
  };

  if (trade) {
    // For existing trades, use their date or current time if none exists
    const tradeDateTime = trade.date_time ? 
      new Date(trade.date_time).toISOString().slice(0, 16) : 
      getCurrentLocalDateTime();
      
    return {
        ...baseData, 
        ...trade,
        action: trade.direction === 'long' ? 'buy' : 'sell',
        date_time: tradeDateTime,
        entry_price: trade.entry_price?.toString() || '',
        target_price: trade.target_price?.toString() || '',
        stop_price: trade.stop_price?.toString() || '',
        quantity: trade.quantity?.toString() || '',
        position_amount: (trade.quantity * trade.entry_price).toString() || '',
        risk_percentage: trade.risk_percentage?.toString() || settings?.default_risk_percentage?.toString() || '2',
        confidence_level: trade.confidence_level || 0,
    };
  }
  return baseData;
};

export default function NewTradeModal({ isOpen, onClose, onSubmit, settings, trade = null, accountId }) {
  const [formData, setFormData] = useState(getInitialFormData(settings, trade));
  const [isUploading, setIsUploading] = useState(false);
  const [positionSizeWarning, setPositionSizeWarning] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  
  const language = localStorage.getItem('language') || 'en';

  const accountSize = settings?.account_size || 100000;
  const availableStrategies = settings?.strategies || [];
  const maxPositionPercentage = settings?.max_position_size_percentage || 25;
  const maxPositionSize = (accountSize * maxPositionPercentage) / 100;
  
  useEffect(() => {
    if (isOpen) {
      const initialData = getInitialFormData(settings, trade);
      setFormData(initialData);
      setScreenshotUrl(trade?.screenshot_url || '');
      setPositionSizeWarning(null);
    }
  }, [isOpen, trade, settings]);

  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number);
  };

  const handleInputChange = (field, value) => {
    // Restrict symbol input to English letters only
    if (field === 'symbol') {
      value = value.replace(/[^A-Za-z]/g, '').toUpperCase();
    }
    
    const numericFields = ['entry_price', 'stop_price', 'target_price', 'risk_percentage', 'quantity', 'position_amount'];
    if (numericFields.includes(field)) {
      const numericValue = value.replace(/[^0-9.]/g, '');
      if (numericValue.split('.').length > 2) return;
      value = numericValue;
    }

    let newFormData = { ...formData, [field]: value };
    
    if (field === 'action') {
        newFormData.direction = value === 'buy' ? 'long' : 'short';
    }

    const entryPrice = parseFloat(newFormData.entry_price);
    const stopPrice = parseFloat(newFormData.stop_price);
    const riskPercentage = parseFloat(newFormData.risk_percentage);

    if (field === 'position_amount') {
        const positionAmount = parseFloat(value);
        if (entryPrice > 0) {
            newFormData.quantity = Math.floor(positionAmount / entryPrice).toString();
        }
    } else if (field === 'quantity') {
        const quantity = parseFloat(value);
        if (entryPrice > 0) {
            newFormData.position_amount = (quantity * entryPrice).toFixed(2);
        }
    } else if (!['strategy', 'confidence_level', 'notes', 'screenshot_url'].includes(field)) { 
        if (entryPrice > 0 && stopPrice > 0 && riskPercentage > 0) {
            const riskAmount = (accountSize * riskPercentage) / 100;
            const priceRisk = Math.abs(entryPrice - stopPrice);
            const quantity = priceRisk > 0 ? Math.floor(riskAmount / priceRisk) : 0;
            newFormData.quantity = quantity.toString();
            newFormData.position_amount = (quantity * entryPrice).toFixed(2);
        }
    }
    
    const finalPositionSize = parseFloat(newFormData.position_amount) || 0;
    if (finalPositionSize > maxPositionSize && finalPositionSize > 0) { 
        setPositionSizeWarning(getText(`Warning: Position size ($${formatNumber(finalPositionSize)}) exceeds max ($${formatNumber(maxPositionSize)})`, `אזהרה: גודל הפוזיציה ($${formatNumber(finalPositionSize)}) חורג מהמקסימום המותר ($${formatNumber(maxPositionSize)})`));
    } else {
        setPositionSizeWarning(null);
    }

    setFormData(newFormData);
  };
  
  const handleDateTimeChange = (e) => {
    const newDateTime = e.target.value;
    handleInputChange('date_time', newDateTime);
  };
  
  // Reset date to current system time
  const handleResetDateTime = () => {
    const currentDateTime = getCurrentLocalDateTime();
    handleInputChange('date_time', currentDateTime);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setScreenshotUrl(file_url);
      setFormData(prev => ({ ...prev, screenshot_url: file_url }));
    } catch (error) {
      console.error("Error uploading file:", error);
    }
    setIsUploading(false);
  };

  const handleDeleteFile = () => {
    setScreenshotUrl('');
    setFormData(prev => ({ ...prev, screenshot_url: '' }));
  };

  const calculateValues = () => {
    const { entry_price, stop_price, target_price, quantity, direction } = formData;
    const entryPrice = parseFloat(entry_price) || 0;
    const stopPrice = parseFloat(stop_price) || 0;
    const targetPrice = parseFloat(target_price) || 0;
    const qty = parseInt(quantity) || 0;
    const isShort = direction === 'short';
    
    let riskAmount = 0, positionSize = 0, riskRewardRatio = 0, positionRiskPercent = 0, expectedProfit = 0, accountRiskPercent = 0;
    
    if (entryPrice > 0 && stopPrice > 0 && qty > 0) {
      let priceRisk, potentialProfit;
      
      if (isShort) {
        priceRisk = Math.max(0, stopPrice - entryPrice);
        potentialProfit = targetPrice > 0 ? Math.max(0, entryPrice - targetPrice) : 0;
      } else {
        priceRisk = Math.max(0, entryPrice - stopPrice);
        potentialProfit = targetPrice > 0 ? Math.max(0, targetPrice - entryPrice) : 0;
      }
      
      riskAmount = priceRisk * qty;
      positionSize = qty * entryPrice;
      positionRiskPercent = positionSize > 0 ? (riskAmount / positionSize) * 100 : 0;
      accountRiskPercent = accountSize > 0 ? (riskAmount / accountSize) * 100 : 0;
      expectedProfit = potentialProfit * qty;
      
      if (potentialProfit > 0 && priceRisk > 0) {
        riskRewardRatio = potentialProfit / priceRisk;
      }
    }

    return { 
      quantity: qty, 
      riskAmount, 
      positionSize, 
      riskRewardRatio,
      positionRiskPercent,
      accountRiskPercent,
      expectedProfit
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!accountId) {
        alert(getText("No account selected!", "לא נבחר חשבון!"));
        return;
    }
    if (positionSizeWarning) {
        if (!window.confirm(getText("Position size exceeds the maximum allowed. Do you want to continue anyway?", "גודל הפוזיציה חורג מהמותר. האם ברצונך להמשיך בכל זאת?"))) {
            return;
        }
    }
    
    const { quantity, riskAmount, positionSize } = calculateValues();
    const commission = settings?.commission_fee || 0;
    
    const tradeData = {
      account_id: accountId,
      symbol: formData.symbol,
      date_time: formData.date_time,
      direction: formData.direction,
      entry_price: parseFloat(formData.entry_price),
      quantity,
      total_quantity: quantity,
      stop_price: parseFloat(formData.stop_price),
      target_price: formData.target_price ? parseFloat(formData.target_price) : null,
      risk_percentage: parseFloat(formData.risk_percentage),
      risk_amount: riskAmount,
      position_size: positionSize,
      total_investment: positionSize,
      strategy: formData.strategy,
      confidence_level: formData.confidence_level,
      is_partially_closed: trade?.is_partially_closed || false,
      profit_loss: trade?.profit_loss || 0,
      total_commission: commission,
      status: 'open',
    };

    const eventData = trade ? null : {
        type: 'buy',
        date: formData.date_time,
        quantity,
        price: parseFloat(formData.entry_price),
        stop_loss_at_event: parseFloat(formData.stop_price),
        notes: `${formData.notes}\n${getText('Commission:', 'עמלה:')} $${formatNumber(commission)}`,
        screenshot_url: screenshotUrl
    };
    
    onSubmit(tradeData, eventData);
  };

  const handleConfidenceClick = (starIndex) => {
    const newRating = starIndex + 1;
    setFormData(prev => ({ ...prev, confidence_level: newRating }));
  };

  const renderInteractiveStars = (currentLevel, onStarClick) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onStarClick(i)}
            className={`w-6 h-6 transition-colors hover:scale-110 ${
              i < currentLevel ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
            }`}
          >
            <Star className={`w-full h-full ${i < currentLevel ? 'fill-current' : ''}`} />
          </button>
        ))}
        <span className="text-sm text-gray-600 ml-2">
          {currentLevel} {getText('stars', 'כוכבים')}
        </span>
      </div>
    );
  };

  // Trade Summary Component - identical for both mobile and desktop
  const renderTradeSummary = () => {
    const { quantity, riskAmount, positionSize, riskRewardRatio, positionRiskPercent, accountRiskPercent, expectedProfit } = calculateValues();
    
    return (
      <div className="bg-gray-50 border rounded p-2 mt-3">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-800">
            {getText('Trade Summary', 'סיכום עסקה')} 
            {formData.symbol && <span className="text-blue-600 ml-1">- {formData.symbol}</span>}
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-gray-50 rounded border text-center">
              <p className="text-xs font-medium text-gray-600 mb-1">{getText('Shares', 'מניות')}</p>
              <p className="font-semibold text-sm text-black">{formatNumber(quantity)}</p>
            </div>
            <div className="p-2 bg-gray-50 rounded border text-center">
              <p className="text-xs font-medium text-gray-600 mb-1">{getText('Entry Price', 'מחיר כניסה')}</p>
              <p className="font-semibold text-sm text-black">${(parseFloat(formData.entry_price) || 0).toFixed(2)}</p>
            </div>
            <div className="p-2 bg-gray-50 rounded border text-center">
              <p className="text-xs font-medium text-gray-600 mb-1">{getText('Trade Value', 'שווי עסקה')}</p>
              <p className="font-semibold text-sm text-black">${formatNumber(positionSize.toFixed(2))}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-red-50/70 rounded border border-red-100 text-center">
              <p className="text-xs font-medium text-red-600 mb-1">{getText('Stop Price', 'מחיר סטופ')}</p>
              <p className="font-semibold text-sm text-red-600">${(parseFloat(formData.stop_price) || 0).toFixed(2)}</p>
            </div>
            <div className="p-2 bg-red-50/70 rounded border border-red-100 text-center">
              <p className="text-xs font-medium text-red-600 mb-1">{getText('Risk Amount', 'סכום סיכון')}</p>
              <p className="font-semibold text-sm text-red-600">-${formatNumber(riskAmount.toFixed(2))} ({positionRiskPercent.toFixed(1)}%)</p>
            </div>
            <div className="p-2 bg-red-50/70 rounded border border-red-100 text-center">
              <p className="text-xs font-medium text-red-600 mb-1">{getText('Risk % of Account', 'סיכון מהחשבון באחוזים')}</p>
              <p className="font-semibold text-sm text-red-600">{accountRiskPercent.toFixed(2)}%</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-blue-50/70 rounded border border-blue-100 text-center">
              <p className="text-xs font-medium text-blue-600 mb-1">{getText('Risk/Reward', 'יחס סיכון')}</p>
              <p className="font-semibold text-sm text-blue-600">{riskRewardRatio > 0 ? `1:${riskRewardRatio.toFixed(2)}` : 'N/A'}</p>
            </div>
            <div className="p-2 bg-blue-50/70 rounded border border-blue-100 text-center">
              <p className="text-xs font-medium text-blue-600 mb-1">{getText('Target', 'יעד')}</p>
              <p className="font-semibold text-sm text-blue-600">${(parseFloat(formData.target_price) || 0).toFixed(2)}</p>
            </div>
            <div className="p-2 bg-blue-50/70 rounded border border-blue-100 text-center">
              <p className="text-xs font-medium text-blue-600 mb-1">{getText('Expected Profit', 'רווח צפוי')}</p>
              <p className="font-semibold text-sm text-blue-600">${formatNumber(expectedProfit.toFixed(2))}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // calculateValues() must be called here to provide these variables to the JSX outside of renderTradeSummary
  const { quantity, riskAmount, positionSize, riskRewardRatio, positionRiskPercent, accountRiskPercent, expectedProfit } = calculateValues();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl mx-auto p-0 max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <DialogHeader className="flex-shrink-0 p-4 border-b bg-white">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5" />
            {trade ? getText('Edit Trade', 'עריכת עסקה') : getText('New Trade', 'עסקה חדשה')}
          </DialogTitle>
        </DialogHeader>
        
        {/* Main Content Area - Same structure for mobile and desktop */}
        <div className="flex-grow overflow-y-auto">
          <div className="px-4 py-3 md:px-6 md:py-4">
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-9 md:h-10 mb-3 md:mb-4">
                  <TabsTrigger value="details" className="text-sm">{getText('Trade Details', 'פרטי עסקה')}</TabsTrigger>
                  <TabsTrigger value="analysis" className="text-sm">{getText('Analysis & Notes', 'ניתוח והערות')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Symbol input */}
                    <div className="space-y-1">
                      <Label htmlFor="symbol" className="text-sm font-medium">{getText('Symbol', 'סימבול')}</Label>
                      <Input 
                        id="symbol" 
                        value={formData.symbol} 
                        onChange={(e) => handleInputChange('symbol', e.target.value)} 
                        placeholder="e.g. AAPL" 
                        required 
                        className="h-8 md:h-9 bg-white text-sm"
                        maxLength="10"
                      />
                    </div>
                    {/* Date & Time input */}
                    <div className="space-y-1">
                      <Label htmlFor="date_time" className="text-sm font-medium flex items-center justify-between">
                        {getText('Date & Time', 'תאריך ושעה')}
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleResetDateTime}
                          className="h-5 px-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          {getText('Reset', 'איפוס')}
                        </Button>
                      </Label>
                      <Input
                        id="date_time"
                        type="datetime-local"
                        value={formData.date_time}
                        onChange={handleDateTimeChange}
                        required
                        className="h-8 md:h-9 bg-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Action */}
                    <div className="space-y-1">
                      <Label htmlFor="action" className="text-sm font-medium">{getText('Action', 'פעולה')}</Label>
                      <Select value={formData.action} onValueChange={(value) => handleInputChange('action', value)}>
                        <SelectTrigger className="h-8 md:h-9 w-full bg-white text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buy"><div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" />{getText('Buy (Long)', 'קנייה (לונג)')}</div></SelectItem>
                          <SelectItem value="sell"><div className="flex items-center gap-2"><TrendingDown className="w-4 h-4 text-red-600" />{getText('Sell (Short)', 'מכירה (שורט)')}</div></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Strategy */}
                    <div className="space-y-1">
                      <Label htmlFor="strategy" className="text-sm font-medium">{getText('Strategy', 'אסטרטגיה')}</Label>
                      <Select value={formData.strategy} onValueChange={(value) => handleInputChange('strategy', value)}>
                          <SelectTrigger className="h-8 md:h-9 w-full bg-white text-sm"><SelectValue placeholder={getText('Select Strategy', 'בחר אסטרטגיה')} /></SelectTrigger>
                          <SelectContent>
                            {availableStrategies.map((strategy) => ( <SelectItem key={strategy} value={strategy}>{strategy}</SelectItem> ))}
                          </SelectContent>
                      </Select>
                    </div>
                    {/* Chart */}
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">{getText('Chart', 'גרף')}</Label>
                      <Button 
                        type="button" 
                        variant="default" 
                        size="sm" 
                        onClick={() => setShowChart(true)} 
                        disabled={!formData.symbol} 
                        className="h-8 md:h-9 w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                      >
                        <BarChart3 className="w-4 h-4" />
                        {getText('Chart', 'גרף')}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {/* Entry, Stop, Target Price */}
                    <div className="space-y-1">
                      <Label htmlFor="entry_price" className="text-sm font-medium">{getText('Entry Price', 'מחיר כניסה')}</Label>
                      <Input id="entry_price" type="text" inputMode="decimal" value={formData.entry_price} onChange={(e) => handleInputChange('entry_price', e.target.value)} placeholder="0.00" required className="h-8 md:h-9 bg-white text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="stop_price" className="text-sm font-medium">{getText('Stop Price', 'מחיר סטופ')}</Label>
                      <Input id="stop_price" type="text" inputMode="decimal" value={formData.stop_price} onChange={(e) => handleInputChange('stop_price', e.target.value)} placeholder="0.00" required className="h-8 md:h-9 bg-white text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="target_price" className="text-sm font-medium">{getText('Target', 'יעד')}</Label>
                      <Input id="target_price" type="text" inputMode="decimal" value={formData.target_price} onChange={(e) => handleInputChange('target_price', e.target.value)} placeholder="0.00" className="h-8 md:h-9 bg-white text-sm" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {/* Risk, Quantity, Position Amount */}
                    <div className="space-y-1">
                      <Label htmlFor="risk_percentage" className="text-sm font-medium">{getText('Risk Percentage', 'אחוז סיכון')}</Label>
                      <div className="relative"><Input id="risk_percentage" type="text" inputMode="decimal" value={formData.risk_percentage} onChange={(e) => handleInputChange('risk_percentage', e.target.value)} placeholder="2.0" required className="h-8 md:h-9 ps-2 pe-6 bg-white text-sm" /><span className="absolute end-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">%</span></div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="quantity" className="text-sm font-medium">{getText('Share Quantity', 'כמות מניות')}</Label>
                      <Input id="quantity" type="text" inputMode="numeric" value={formData.quantity} onChange={(e) => handleInputChange('quantity', e.target.value)} placeholder={getText('Auto calculated', 'מחושב אוטומטית')} className="h-8 md:h-9 bg-white text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="position_amount" className="text-sm font-medium">{getText('Position Amount', 'סכום פוזיציה')}</Label>
                      <Input id="position_amount" type="text" inputMode="numeric" value={formData.position_amount} onChange={(e) => handleInputChange('position_amount', e.target.value)} placeholder={getText('Auto calculated', 'אוטו')} className="h-8 md:h-9 bg-white text-sm" />
                    </div>
                  </div>
                  
                  {renderTradeSummary()}
                </TabsContent>
                
                <TabsContent value="analysis" className="space-y-3 md:space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="notes" className="text-sm font-medium">{getText('Trade Reasons & Notes', 'סיבת הכניסה והערות')}</Label>
                    <Textarea id="notes" value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} placeholder={getText('Why are you entering this trade?', 'למה נכנסת לעסקה הזו?')} rows={2} className="text-sm bg-white" />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="screenshot" className="text-sm font-medium">{getText('Upload Screenshot', 'העלאת צילום מסך')}</Label>
                    <Input id="screenshot" type="file" onChange={handleFileUpload} disabled={isUploading} accept="image/*" className="h-8 md:h-9 bg-white text-sm" />
                    {isUploading && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Loader2 className="w-3 h-3 me-1 animate-spin" />
                        {getText('Uploading...', 'מעלה...')}
                      </div>
                    )}
                    {screenshotUrl && (
                      <div className="flex items-center gap-2">
                        <a href={screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                          {getText('View uploaded screenshot', 'צפה בצילום המסך שהועלה')}
                        </a>
                        <Button type="button" variant="ghost" size="sm" onClick={handleDeleteFile} className="text-red-500 hover:text-red-700 h-5 px-2">
                          <X className="w-3 h-3" />
                          {getText('Delete', 'מחק')}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">{getText('Trade Confidence Level', 'רמת ביטחון בעסקה')}</Label>
                    <div className="pt-1">
                      {renderInteractiveStars(formData.confidence_level, handleConfidenceClick)}
                    </div>
                  </div>
                  
                  {renderTradeSummary()}
                </TabsContent>
              </Tabs>
            </form>
          </div>
        </div>

        {/* Warning message - fixed position above buttons */}
        {positionSizeWarning && (
          <div className="flex-shrink-0 px-3 md:px-4 py-2 border-t border-yellow-200 bg-yellow-50">
            <div className="flex items-center gap-2 justify-center">
              <Info className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">{positionSizeWarning}</span>
            </div>
          </div>
        )}
        
        {/* Fixed Footer with Buttons */}
        <div className="flex-shrink-0 flex justify-end gap-2 p-3 md:p-4 border-t bg-white">
          <Button type="button" variant="outline" onClick={onClose} className="h-9 text-sm">
            {getText('Cancel', 'ביטול')}
          </Button>
          <Button type="submit" onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700 h-9 text-sm">
            {trade ? getText('Update Trade', 'עדכן עסקה') : getText('Create Trade', 'צור עסקה')}
          </Button>
        </div>

        {showChart && (
          <Dialog open={showChart} onOpenChange={setShowChart}>
            <DialogContent className="max-w-[95vw] max-h-[90vh] w-full h-full p-2">
              <DialogHeader className="pb-2"><DialogTitle>{formData.symbol} {getText('Chart', 'גרף')}</DialogTitle></DialogHeader>
              <div className="flex-1 w-full h-full min-h-[70vh]">
                <iframe 
                  src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${formData.symbol}&interval=D&hidesidetoolbar=0&hidetoptoolbar=0&symboledit=1&saveimage=1&toolbarbg=F1F3F6&studies=[]&hideideas=1&theme=Light&style=1&timezone=Etc/UTC&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=localhost&utm_medium=widget_new&utm_campaign=chart&utm_term=${formData.symbol}`} 
                  className="w-full h-full border-0 rounded-lg" 
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
