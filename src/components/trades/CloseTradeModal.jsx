
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadFile } from "@/api/integrations";
import { X, Upload, Loader2, FileText, StickyNote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function CloseTradeModal({ isOpen, onClose, trade, onSubmit, settings }) {
  const [formData, setFormData] = useState({
    exit_date: '',
    exit_price: '',
    quantity_to_sell: '',
    notes: '',
    screenshot_url: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  
  const language = localStorage.getItem('language') || 'en';
  const isRTL = language === 'he';

  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };

  const formatNumber = (number, decimals = 2) => {
    if (typeof number !== 'number' || isNaN(number)) return '0';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number);
  };

  React.useEffect(() => {
    if (trade && isOpen) {
      setFormData({
        exit_date: new Date().toISOString().slice(0, 16),
        exit_price: '',
        quantity_to_sell: (trade.quantity || 0).toString(),
        notes: '',
        screenshot_url: ''
      });
    }
  }, [trade, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    const exitPrice = parseFloat(formData.exit_price) || 0;
    const quantityToSell = parseInt(formData.quantity_to_sell) || 0;
    const tradeQuantity = trade.quantity || 0;
    const entryPrice = trade.entry_price || 0;
    const isPartialSale = quantityToSell < tradeQuantity;
    const commission = settings?.commission_fee || 0;
    
    const profit_loss_on_sale = (exitPrice - entryPrice) * quantityToSell * (trade.direction === 'long' ? 1 : -1);

    const eventData = {
        type: 'sell',
        date: formData.exit_date,
        quantity: quantityToSell,
        price: exitPrice,
        notes: `${formData.notes}\n${getText('Commission:', 'עמלה:')} $${formatNumber(commission)}`,
        screenshot_url: formData.screenshot_url
    };
    
    let updateData;
    if (isPartialSale) {
        const remainingQuantity = tradeQuantity - quantityToSell;
        const stopPrice = trade.stop_price || 0;
        updateData = {
            quantity: remainingQuantity,
            position_size: remainingQuantity * entryPrice,
            risk_amount: Math.abs((entryPrice - stopPrice) * remainingQuantity),
            profit_loss: (trade.profit_loss || 0) + profit_loss_on_sale - commission,
            is_partially_closed: true,
            total_commission: (trade.total_commission || 0) + commission
        };
    } else {
        updateData = {
            quantity: 0,
            status: 'closed',
            profit_loss: (trade.profit_loss || 0) + profit_loss_on_sale - commission,
            position_size: 0,
            risk_amount: 0,
            total_commission: (trade.total_commission || 0) + commission
        };
    }
    onSubmit(trade.id, updateData, eventData);
  };

  if (!trade) return null;
  
  const quantityToSell = parseInt(formData.quantity_to_sell) || 0;
  const exitPrice = parseFloat(formData.exit_price) || 0;
  const entryPrice = parseFloat(trade.entry_price) || 0;
  const tradeQuantity = parseInt(trade.quantity) || 0;
  
  const purchaseValueOfSoldShares = quantityToSell * entryPrice;
  const saleValueOfSoldShares = quantityToSell * exitPrice;
  const realizedProfitLoss = saleValueOfSoldShares - purchaseValueOfSoldShares;
  const pnlPercentage = purchaseValueOfSoldShares > 0 ? (realizedProfitLoss / purchaseValueOfSoldShares) * 100 : 0;
  
  const remainingShares = tradeQuantity - quantityToSell;
  const remainingSharesValue = remainingShares * entryPrice;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-4" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader className={isRTL ? "text-right" : "text-left"}>
          <DialogTitle className={`${isRTL ? "text-right" : "text-left"} text-lg font-semibold flex items-center justify-between`}>
            <span className="flex items-center gap-2">
                <X className="w-5 h-5 text-red-500" />
                {getText('Close Trade', 'סגירת עסקה')}: {trade?.symbol}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            {/* Entry Price Display */}
            <div className="bg-gray-100 p-2 rounded-md text-right">
                <span className="text-sm">{getText('Average entry price:', 'מחיר כניסה ממוצע:')}</span>
                <span className="font-bold text-lg mr-2">${formatNumber(entryPrice)}</span>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-8">
                    <TabsTrigger value="details" className="text-xs">{getText('Sale Details', 'פרטי מכירה')}</TabsTrigger>
                    <TabsTrigger value="notes" className="text-xs">{getText('Notes & Files', 'הערות וקבצים')}</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="space-y-3 pt-3">
                    {/* Date and Price Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className={isRTL ? "text-right" : "text-left"}>
                            <Label className="text-sm">{getText('Exit price', 'מחיר יציאה')}</Label>
                            <Input 
                            type="number" 
                            step="0.01"
                            value={formData.exit_price}
                            onChange={(e) => handleInputChange('exit_price', e.target.value)}
                            className="text-center h-8"
                            required
                            />
                        </div>
                        <div className={isRTL ? "text-right" : "text-left"}>
                            <Label className="text-sm">{getText('Exit date and time', 'תאריך ושעת יציאה')}</Label>
                            <Input 
                            type="datetime-local"
                            value={formData.exit_date}
                            onChange={(e) => handleInputChange('exit_date', e.target.value)}
                            className="text-center h-8"
                            required
                            />
                        </div>
                    </div>

                    {/* Quantity */}
                    <div className={isRTL ? "text-right" : "text-left"}>
                        <Label className="text-sm">
                            {getText('Quantity to sell (Available:', 'כמות למכירה (זמין:')} {tradeQuantity})
                        </Label>
                        <Input 
                            type="number"
                            value={formData.quantity_to_sell}
                            onChange={(e) => handleInputChange('quantity_to_sell', e.target.value)}
                            className="text-center h-8"
                            max={tradeQuantity}
                            min="0"
                            required
                        />
                    </div>
                </TabsContent>
                <TabsContent value="notes" className="space-y-3 pt-3">
                     {/* Notes */}
                     <div className={isRTL ? "text-right" : "text-left"}>
                        <Label className="text-sm">{getText('Closing notes', 'הערות סגירה')}</Label>
                        <Textarea 
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            placeholder={getText('Reason for closing, outcome, etc.', 'סיבת סגירה, תוצאה, וכד.')}
                            className={isRTL ? "text-right h-20" : "text-left h-20"}
                            rows={3}
                        />
                     </div>

                     {/* File Upload */}
                     <div className={isRTL ? "text-right" : "text-left"}>
                        <Label className="text-sm">{getText('Upload screenshot', 'העלאת צילום מסך')}</Label>
                        <div className="flex items-center gap-2">
                            <Input 
                                type="file"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                                accept="image/*"
                                className="flex-1 h-8"
                            />
                            {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                            ) : formData.screenshot_url ? (
                            <a href={formData.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs">
                                {getText('View', 'צפה')}
                            </a>
                            ) : null}
                        </div>
                     </div>
                </TabsContent>
            </Tabs>
            
            {/* Calculation Card */}
            <Card className="bg-gray-50">
              <CardContent className="p-3">
                <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                  <FileText className="w-4 h-4" />
                  <span className="font-semibold text-sm">{getText('Profit/Loss Summary', 'סיכום רווח/הפסד')} - {trade?.symbol}</span>
                </div>
                
                <div className="space-y-1 text-sm" dir="ltr">
                  <div className="flex justify-between">
                    <span className="font-bold">${formatNumber(purchaseValueOfSoldShares)}</span>
                    <span className="text-right">:{getText('Purchase value (', 'שווי קנייה (')} {quantityToSell} {getText('shares)', 'מניות)')}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-bold">${formatNumber(saleValueOfSoldShares)}</span>
                    <span className="text-right">:{getText('Sale value', 'שווי מכירה')}</span>
                  </div>
                  
                  <hr className="my-1" />
                  
                  <div className="flex justify-between">
                    <span className={`font-bold text-lg ${realizedProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {realizedProfitLoss >= 0 ? '' : '-'}${formatNumber(Math.abs(realizedProfitLoss))}
                    </span>
                    <span className="font-semibold text-right">:($) {getText('Profit/Loss', 'רווח/הפסד')}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className={`font-bold ${realizedProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {pnlPercentage.toFixed(2)}%
                    </span>
                    <span className="font-semibold text-right">:(%) {getText('Profit/Loss', 'רווח/הפסד')}</span>
                  </div>
                </div>

                {remainingShares > 0 && (
                    <div className="mt-3 pt-2 border-t">
                         <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                            <StickyNote className="w-4 h-4" />
                            <span className="font-semibold text-sm">{getText('Remaining Position', 'פוזיציה נותרת')}</span>
                        </div>
                        <div className="space-y-1 text-sm" dir="ltr">
                            <div className="flex justify-between">
                              <span className="font-bold">{new Intl.NumberFormat().format(remainingShares)}</span>
                              <span className="text-right">:{getText('Remaining Shares', 'מניות נותרו')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-bold">${formatNumber(remainingSharesValue)}</span>
                              <span className="text-right">:{getText('Value of Remaining Shares', 'שווי מניות נותרות')}</span>
                            </div>
                        </div>
                    </div>
                )}
              </CardContent>
            </Card>

            {/* Buttons */}
            <div className="flex gap-2 pt-3">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-8 text-sm">
                {getText('Cancel', 'ביטול')}
              </Button>
              <Button type="submit" className="flex-1 h-8 text-sm bg-red-600 hover:bg-red-700">
                {getText('Close Trade', 'סגור עסקה')}
              </Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
