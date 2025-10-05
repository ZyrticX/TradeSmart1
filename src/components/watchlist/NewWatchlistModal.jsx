
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadFile } from "@/api/integrations";
import { Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function NewWatchlistModal({ isOpen, onClose, onSubmit, settings }) {
  const availableSentiments = settings?.sentiments || [];

  const [formData, setFormData] = useState({
    symbol: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    price: '',
    sentiment: '', // Initialize with an empty string
    screenshot_urls: []
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const handleFileChange = async (e) => {
    if (e.target.files.length === 0) return;
    setIsUploading(true);
    const uploadedUrls = [];
    for (const file of e.target.files) {
      try {
        const { file_url } = await UploadFile({ file });
        uploadedUrls.push(file_url);
      } catch (error) { console.error("File upload error:", error); }
    }
    setFormData(prev => ({ ...prev, screenshot_urls: [...prev.screenshot_urls, ...uploadedUrls] }));
    setIsUploading(false);
  };
  
  const removeScreenshot = (urlToRemove) => {
    setFormData(prev => ({ ...prev, screenshot_urls: prev.screenshot_urls.filter(url => url !== urlToRemove) }));
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({...formData, price: parseFloat(formData.price) || null});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>הערת מעקב חדשה</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">סימבול</Label>
              <Input id="symbol" value={formData.symbol} onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())} placeholder="לדוגמה: AAPL" required/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">תאריך</Label>
              <Input id="date" type="date" value={formData.date} onChange={(e) => handleInputChange('date', e.target.value)} required/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="price">מחיר נוכחי</Label>
               <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => handleInputChange('price', e.target.value)} placeholder="0.00"/>
             </div>
             <div className="space-y-2">
               <Label htmlFor="sentiment">סנטימנט</Label>
                <Select value={formData.sentiment} onValueChange={(v) => handleInputChange('sentiment', v)}>
                    <SelectTrigger><SelectValue placeholder="בחר סנטימנט"/></SelectTrigger>
                    <SelectContent>
                      {availableSentiments.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
             </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">הערות מחקר</Label>
            <Textarea id="notes" value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} placeholder="תובנות, רמות מחיר חשובות וכו'." rows={4} required/>
          </div>

          <div className="space-y-2">
            <Label htmlFor="screenshots">העלאת צילומי מסך</Label>
            <Input id="screenshots" type="file" onChange={handleFileChange} multiple disabled={isUploading} accept="image/*"/>
            {isUploading && <div className="flex items-center text-sm text-gray-500"><Loader2 className="w-4 h-4 me-2 animate-spin" />מעלה...</div>}
            {formData.screenshot_urls.length > 0 && 
                <div className="flex flex-wrap gap-2 mt-2">
                    {formData.screenshot_urls.map((url, index) => (
                        <Badge key={index} variant="secondary" className="relative pe-6">
                           <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">תמונה {index+1}</a>
                           <button type="button" onClick={() => removeScreenshot(url)} className="absolute end-1 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-red-200"><X className="w-3 h-3 text-red-600"/></button>
                        </Badge>
                    ))}
                </div>
            }
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
            <Button type="submit">שמור הערה</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
