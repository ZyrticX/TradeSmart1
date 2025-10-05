
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calculator, Upload, Loader2, Shield } from "lucide-react";
import { UploadFile } from "@/api/integrations";

export default function AddQuantityModal({ isOpen, onClose, trade, onSubmit, settings }) {
  const [formData, setFormData] = useState({
    quantity: '',
    entry_price: '',
    stop_price: '',
    notes: '',
    screenshot_url: '',
    date: new Date().toISOString().slice(0, 16),
    amount: '' // Added amount field
  });
  const [isUploading, setIsUploading] = useState(false);
  
  const language = localStorage.getItem('language') || 'en';

  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };

  // Modified formatNumber to handle decimals and ensure proper number formatting for display
  const formatNumber = (number, decimals = 0) => {
    const num = parseFloat(number); // Ensure the input is a number
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num);
  };

  React.useEffect(() => {
    if (trade) {
      setFormData({
        quantity: '',
        entry_price: '',
        stop_price: (trade.stop_price || 0).toString(),
        notes: '',
        screenshot_url: '',
        date: new Date().toISOString().slice(0, 16),
        amount: ''
      });
    }
  }, [trade, isOpen]);

  const handleInputChange = (field, value) => {
    let newFormData = { ...formData, [field]: value };
    
    // Auto-calculate shares when amount is entered
    if (field === 'amount' && value) {
      const amount = parseFloat(value) || 0;
      const entryPrice = parseFloat(newFormData.entry_price) || 0;
      if (entryPrice > 0) {
        newFormData.quantity = Math.floor(amount / entryPrice).toString();
      }
    }
    
    // Auto-calculate amount when quantity is entered
    if (field === 'quantity' && value) {
      const quantity = parseInt(value) || 0;
      const entryPrice = parseFloat(newFormData.entry_price) || 0;
      if (entryPrice > 0) {
        newFormData.amount = (quantity * entryPrice).toFixed(2);
      }
    }
    
    setFormData(newFormData);
  };
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      handleInputChange('screenshot_url', file_url);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
    setIsUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!trade) return;

    const newQuantity = parseInt(formData.quantity) || 0;
    const newPrice = parseFloat(formData.entry_price) || 0;
    const newStop = parseFloat(formData.stop_price) || trade.stop_price || 0;
    const commission = settings?.commission_fee || 0;

    const currentQuantity = trade.quantity || 0;
    const currentPrice = trade.entry_price || 0;
    const totalShares = currentQuantity + newQuantity;
    
    // Calculate new average price correctly
    const totalValue = (currentPrice * currentQuantity) + (newPrice * newQuantity);
    const newAvgPrice = totalShares > 0 ? totalValue / totalShares : 0;
    
    // Calculate position size correctly: Total Shares × Average Price
    const positionSize = totalShares * newAvgPrice;
    
    // Calculate risk amount correctly: (Entry Price - Stop Price) × Total Shares
    const isShort = trade.direction === 'short';
    let riskAmount = 0;
    if (isShort) {
      riskAmount = Math.max(0, newStop - newAvgPrice) * totalShares;
    } else {
      riskAmount = Math.max(0, newAvgPrice - newStop) * totalShares;
    }
    
    // Calculate risk percentage correctly: Risk Amount ÷ Account Size × 100
    const accountSize = settings?.account_size || 100000;
    const riskPercentage = accountSize > 0 ? (riskAmount / accountSize) * 100 : 0;

    const currentTotalInvestment = trade.total_investment || trade.position_size || 0;
    const newTotalInvestment = currentTotalInvestment + (newQuantity * newPrice);
    const currentTotalQuantity = trade.total_quantity || trade.quantity || 0;
    const newTotalQuantity = currentTotalQuantity + newQuantity;
    const currentTotalCommission = trade.total_commission || 0;
    const newTotalCommission = currentTotalCommission + commission;

    const updateData = {
        quantity: totalShares,
        entry_price: newAvgPrice,
        stop_price: newStop,
        risk_amount: riskAmount,
        position_size: positionSize,
        risk_percentage: riskPercentage,
        total_investment: newTotalInvestment,
        total_quantity: newTotalQuantity,
        total_commission: newTotalCommission,
    };

    const eventData = {
        type: 'add',
        date: formData.date,
        quantity: newQuantity,
        price: newPrice,
        stop_loss_at_event: newStop,
        // Ensure commission is formatted with two decimals
        notes: `${formData.notes}\n${getText('Commission:', 'עמלה:')} $${formatNumber(commission, 2)}`,
        screenshot_url: formData.screenshot_url
    };

    onSubmit(trade.id, updateData, eventData);
    
    setFormData({
      quantity: '',
      entry_price: '',
      stop_price: '',
      notes: '',
      screenshot_url: '',
      date: new Date().toISOString().slice(0, 16),
      amount: ''
    });
  };

  if (!trade) return null;

  const newQuantity = parseInt(formData.quantity) || 0;
  const newPrice = parseFloat(formData.entry_price) || 0;
  const currentQuantity = trade.quantity || 0;
  const currentPrice = trade.entry_price || 0;
  const currentRisk = trade.risk_amount || 0;
  const currentStop = trade.stop_price || 0;
  
  // Calculate current position value
  const currentPositionValue = currentPrice * currentQuantity;
  
  // FIX: Calculate risk as a percentage of the position, not the account
  const currentPositionRiskPercent = currentPositionValue > 0 ? (currentRisk / currentPositionValue) * 100 : 0;
  
  const totalShares = currentQuantity + newQuantity;
  const totalValue = (currentPrice * currentQuantity) + (newPrice * newQuantity);
  const newAvgPrice = totalShares > 0 ? totalValue / totalShares : 0;
  const newStopPrice = formData.stop_price ? parseFloat(formData.stop_price) : (trade.stop_price || 0);
  
  // Calculate price change percentage
  const priceChangePercent = currentPrice > 0 ? ((newAvgPrice - currentPrice) / currentPrice) * 100 : 0;
  
  // Calculate new position size correctly: Total Shares × Average Price
  const newPositionValue = totalShares * newAvgPrice;
  
  // Calculate new risk amount correctly
  const isShort = trade.direction === 'short';
  let newRiskAmount = 0;
  if (totalShares > 0 && newStopPrice) {
    if (isShort) {
      newRiskAmount = Math.max(0, newStopPrice - newAvgPrice) * totalShares;
    } else {
      newRiskAmount = Math.max(0, newAvgPrice - newStopPrice) * totalShares;
    }
  }
  
  // Calculate new risk percentage correctly: Risk Amount ÷ Account Size × 100
  const accountSize = settings?.account_size || 100000;
  const newRiskPercent = accountSize > 0 ? (newRiskAmount / accountSize) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            {getText('Add to Trade', 'הוספה לעסקה')} {trade.symbol || ''}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto pr-2">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">{getText('Addition Details', 'פרטי הוספה')}</TabsTrigger>
                <TabsTrigger value="notes">{getText('Notes & Files', 'הערות וקבצים')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-3 pt-3">
                <Card className="bg-blue-50/50 border-blue-200">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-800">{getText('Current Position', 'פוזיציה נוכחית')}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      <div><p className="text-gray-600">{getText('Shares:', 'מניות:')}</p><p className="font-bold">{formatNumber(currentQuantity, 0)}</p></div>
                      <div><p className="text-gray-600">{getText('Avg Price:', 'מחיר ממוצע:')}</p><p className="font-bold">${(currentPrice || 0).toFixed(2)}</p></div>
                      <div><p className="text-gray-600">{getText('Position Value:', 'שווי פוזיציה:')}</p><p className="font-bold">${formatNumber(currentPositionValue, 2)}</p></div>
                      <div><p className="text-gray-600">{getText('Stop Loss:', 'סטופ לוס:')}</p><p className="font-bold">${(currentStop || 0).toFixed(2)}</p></div>
                      <div><p className="text-gray-600">{getText('Risk Amount:', 'סכום סיכון:')}</p><p className="font-bold text-red-600">-${formatNumber(currentRisk, 2)}</p></div>
                      <div><p className="text-gray-600">{getText('Risk %:', 'סיכון %:')}</p><p className="font-bold text-red-600">{currentPositionRiskPercent.toFixed(2)}%</p></div>
                    </div>
                  </CardContent>
                </Card>

                <form onSubmit={handleSubmit} className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="space-y-1"><Label htmlFor="entry_price">{getText('Entry Price', 'מחיר כניסה')}</Label><Input id="entry_price" type="number" step="0.01" value={formData.entry_price} onChange={(e) => handleInputChange('entry_price', e.target.value)} placeholder="0.00" required className="h-8" /></div>
                    <div className="space-y-1"><Label htmlFor="stop_price">{getText('New Stop (Optional)', 'סטופ חדש (אופציונלי)')}</Label><Input id="stop_price" type="number" step="0.01" value={formData.stop_price} onChange={(e) => handleInputChange('stop_price', e.target.value)} placeholder={(trade.stop_price || 0).toFixed(2)} className="h-8" /></div>
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                     <div className="space-y-1"><Label htmlFor="amount">{getText('Trade Amount', 'סכום עסקה')}</Label><Input id="amount" type="number" step="0.01" value={formData.amount} onChange={(e) => handleInputChange('amount', e.target.value)} placeholder="0.00" className="h-8" /></div>
                    <div className="space-y-1"><Label htmlFor="quantity">{getText('Additional Quantity', 'כמות נוספת')}</Label><Input id="quantity" type="number" value={formData.quantity} onChange={(e) => handleInputChange('quantity', e.target.value)} placeholder="0" required className="h-8" /></div>
                  </div>
                  <div className="space-y-1"><Label htmlFor="date">{getText('Date', 'תאריך')}</Label><Input id="date" type="datetime-local" value={formData.date} onChange={(e) => handleInputChange('date', e.target.value)} required className="h-8" /></div>
                  
                  {newQuantity > 0 && newPrice > 0 && (
                    <Card className="bg-emerald-50/50 border-emerald-200">
                      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-emerald-800"><Calculator className="w-4 h-4" />{getText('New Position After Addition', 'פוזיציה חדשה לאחר ההוספה')}</CardTitle></CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <div><p className="text-gray-600">{getText('Total Shares:', 'סה"כ מניות:')}</p><p className="font-bold text-emerald-600">{formatNumber(totalShares, 0)}</p></div>
                          <div>
                            <p className="text-gray-600">{getText('New Avg Price:', 'מחיר ממוצע חדש:')}</p>
                            <p className="font-bold text-emerald-600">${newAvgPrice.toFixed(2)}</p>
                            {priceChangePercent !== 0 && (
                              <p className={`text-xs ${priceChangePercent > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                ({priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                              </p>
                            )}
                          </div>
                          <div><p className="text-gray-600">{getText('Total Value:', 'שווי כולל:')}</p><p className="font-bold text-emerald-600">${formatNumber(newPositionValue, 2)}</p></div>
                          <div>
                            <p className="text-gray-600">{getText('New Risk:', 'סיכון חדש:')}</p>
                            <p className="font-bold text-red-600">-${formatNumber(newRiskAmount, 2)}</p>
                            <p className="text-xs text-red-600">{newRiskPercent.toFixed(2)}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </form>
              </TabsContent>
              
              <TabsContent value="notes" className="space-y-4 pt-4">
                <div className="space-y-2"><Label htmlFor="notes">{getText('Addition Notes', 'הערות להוספה')}</Label><Textarea id="notes" value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} placeholder={getText('Reason for increasing position...', 'סיבה להגדלת הפוזיציה...')} rows={4}/></div>
                <div className="space-y-2"><Label htmlFor="add_screenshot">{getText('Upload Screenshot', 'העלאת צילום מסך')}</Label><Input id="add_screenshot" type="file" onChange={handleFileUpload} disabled={isUploading} accept="image/*" />{isUploading && (<div className="flex items-center text-sm text-gray-500"><Loader2 className="w-4 h-4 me-2 animate-spin" />{getText('Uploading...', 'מעלה...')}</div>)}{formData.screenshot_url && (<a href={formData.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{getText('View uploaded screenshot', 'צפה בצילום המסך שהועלה')}</a>)}</div>
              </TabsContent>
            </Tabs>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t bg-white fixed-bottom-buttons">
          <Button type="button" variant="outline" onClick={onClose}>{getText('Cancel', 'ביטול')}</Button>
          <Button type="submit" onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">{getText('Add Quantity', 'הוסף כמות')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
