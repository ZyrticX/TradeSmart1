import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadFile } from "@/api/integrations";
import { Loader2, Upload } from 'lucide-react';

export default function NewJournalModal({ isOpen, onClose, onSubmit, entry = null }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    content: '',
    mood: 'neutral',
    lessons_learned: '',
    screenshot_urls: []
  });
  const [isUploading, setIsUploading] = useState(false);
  const language = localStorage.getItem('language') || 'en';

  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };

  useEffect(() => {
    if (entry) {
      setFormData({
        date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        title: entry.title || '',
        content: entry.content || '',
        mood: entry.mood || 'neutral',
        lessons_learned: entry.lessons_learned || '',
        screenshot_urls: entry.screenshot_urls || []
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        title: '',
        content: '',
        mood: 'neutral',
        lessons_learned: '',
        screenshot_urls: []
      });
    }
  }, [entry, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files) return;
    setIsUploading(true);
    try {
      const uploadedUrls = await Promise.all(Array.from(files).map(file => UploadFile({ file }).then(res => res.file_url)));
      setFormData(prev => ({
        ...prev,
        screenshot_urls: [...prev.screenshot_urls, ...uploadedUrls]
      }));
    } catch (error) {
      console.error("File upload error:", error);
    }
    setIsUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const moods = ['excellent', 'good', 'neutral', 'poor', 'terrible'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry ? getText('Edit Journal Entry', 'ערוך רישום ביומן') : getText('New Journal Entry', 'רישום חדש ביומן')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="date">{getText('Date', 'תאריך')}</Label>
              <Input id="date" type="date" value={formData.date} onChange={(e) => handleInputChange('date', e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="title">{getText('Title', 'כותרת')}</Label>
              <Input id="title" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} placeholder={getText('e.g., Market Analysis', 'לדוגמה: ניתוח שוק')} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="content">{getText('Content', 'תוכן')}</Label>
            <Textarea id="content" value={formData.content} onChange={(e) => handleInputChange('content', e.target.value)} placeholder={getText('Your thoughts and observations...', 'מחשבות ותצפיות...')} rows={6} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lessons_learned">{getText('Lessons Learned', 'לקחים')}</Label>
            <Input id="lessons_learned" value={formData.lessons_learned} onChange={(e) => handleInputChange('lessons_learned', e.target.value)} placeholder={getText('What did you learn today?', 'מה למדת היום?')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="mood">{getText('Mood', 'מצב רוח')}</Label>
            <Select value={formData.mood} onValueChange={(value) => handleInputChange('mood', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {moods.map(mood => <SelectItem key={mood} value={mood} className="capitalize">{mood}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="screenshots">{getText('Upload Screenshots', 'העלה צילומי מסך')}</Label>
            <Input id="screenshots" type="file" multiple onChange={handleFileChange} disabled={isUploading} />
            {isUploading && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="w-4 h-4 animate-spin" />{getText('Uploading...', 'מעלה...')}</div>}
            {formData.screenshot_urls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.screenshot_urls.map((url, i) => (
                  <img key={i} src={url} alt={`screenshot ${i}`} className="h-16 w-auto rounded border" />
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>{getText('Cancel', 'ביטול')}</Button>
            <Button type="submit">{entry ? getText('Save Changes', 'שמור שינויים') : getText('Create Entry', 'צור רישום')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}