import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UploadFile } from "@/api/integrations";
import { Upload, Loader2, GraduationCap } from "lucide-react";

export default function NewMaterialModal({ isOpen, onClose, onSubmit, language }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    topic: '',
    author: '',
    external_url: '',
    completion_status: 'not_started',
    rating: '',
    notes: '',
    tags: '',
    file_url: ''
  });
  const [isUploading, setIsUploading] = useState(false);

  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      handleInputChange('file_url', file_url);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
    setIsUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const materialData = {
      ...formData,
      rating: formData.rating ? parseInt(formData.rating) : null,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
    };
    
    onSubmit(materialData);
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      type: '',
      topic: '',
      author: '',
      external_url: '',
      completion_status: 'not_started',
      rating: '',
      notes: '',
      tags: '',
      file_url: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            {getText('Add Learning Material', 'הוסף חומר למידה')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">{getText('Title', 'כותרת')} *</Label>
              <Input 
                id="title" 
                value={formData.title} 
                onChange={(e) => handleInputChange('title', e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">{getText('Type', 'סוג')} *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={getText('Select type', 'בחר סוג')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="book">{getText('Book', 'ספר')}</SelectItem>
                  <SelectItem value="video">{getText('Video', 'וידאו')}</SelectItem>
                  <SelectItem value="document">{getText('Document', 'מסמך')}</SelectItem>
                  <SelectItem value="course">{getText('Course', 'קורס')}</SelectItem>
                  <SelectItem value="article">{getText('Article', 'מאמר')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{getText('Description', 'תיאור')}</Label>
            <Textarea 
              id="description" 
              value={formData.description} 
              onChange={(e) => handleInputChange('description', e.target.value)} 
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="topic">{getText('Topic/Category', 'נושא/קטגוריה')}</Label>
              <Input 
                id="topic" 
                value={formData.topic} 
                onChange={(e) => handleInputChange('topic', e.target.value)} 
                placeholder={getText('e.g., Technical Analysis', 'לדוגמה, ניתוח טכני')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">{getText('Author/Creator', 'יוצר/כותב')}</Label>
              <Input 
                id="author" 
                value={formData.author} 
                onChange={(e) => handleInputChange('author', e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">{getText('Upload File', 'העלה קובץ')}</Label>
            <Input 
              id="file" 
              type="file" 
              onChange={handleFileUpload} 
              disabled={isUploading}
              accept=".pdf,.doc,.docx,.txt,.epub,.mp4,.mov,.avi,.mp3"
            />
            {isUploading && (
              <div className="flex items-center text-sm text-gray-500">
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
                {getText('Uploading...', 'מעלה...')}
              </div>
            )}
            {formData.file_url && (
              <p className="text-sm text-purple-600">
                {getText('File uploaded successfully', 'הקובץ הועלה בהצלחה')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="external_url">{getText('External URL', 'קישור חיצוני')}</Label>
            <Input 
              id="external_url" 
              type="url"
              value={formData.external_url} 
              onChange={(e) => handleInputChange('external_url', e.target.value)} 
              placeholder={getText('https://example.com', 'https://example.com')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="completion_status">{getText('Status', 'סטטוס')}</Label>
              <Select value={formData.completion_status} onValueChange={(value) => handleInputChange('completion_status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">{getText('Not Started', 'לא החל')}</SelectItem>
                  <SelectItem value="in_progress">{getText('In Progress', 'בתהליך')}</SelectItem>
                  <SelectItem value="completed">{getText('Completed', 'הושלם')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating">{getText('Rating (1-5)', 'דירוג (1-5)')}</Label>
              <Select value={formData.rating} onValueChange={(value) => handleInputChange('rating', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={getText('Select rating', 'בחר דירוג')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 ⭐</SelectItem>
                  <SelectItem value="2">2 ⭐⭐</SelectItem>
                  <SelectItem value="3">3 ⭐⭐⭐</SelectItem>
                  <SelectItem value="4">4 ⭐⭐⭐⭐</SelectItem>
                  <SelectItem value="5">5 ⭐⭐⭐⭐⭐</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">{getText('Tags (comma separated)', 'תגיות (מופרד בפסיקים)')}</Label>
            <Input 
              id="tags" 
              value={formData.tags} 
              onChange={(e) => handleInputChange('tags', e.target.value)} 
              placeholder={getText('trading, strategy, beginner', 'מסחר, אסטרטגיה, מתחיל')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{getText('Personal Notes', 'הערות אישיות')}</Label>
            <Textarea 
              id="notes" 
              value={formData.notes} 
              onChange={(e) => handleInputChange('notes', e.target.value)} 
              rows={3}
              placeholder={getText('Your thoughts about this material...', 'המחשבות שלך על החומר הזה...')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {getText('Cancel', 'ביטול')}
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              {getText('Add Material', 'הוסף חומר')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}