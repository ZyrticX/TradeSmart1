import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, Trash2, Edit, Tag, Image, MessageSquare, BookOpen, Smile, Frown, Meh, Laugh, Angry } from "lucide-react";

export default function JournalCard({ entry, onDelete, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(entry.content);
  
  const language = localStorage.getItem('language') || 'en';

  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };

  const moodIcons = {
    excellent: <Laugh className="w-4 h-4 text-purple-500" />,
    good: <Smile className="w-4 h-4 text-emerald-500" />,
    neutral: <Meh className="w-4 h-4 text-yellow-500" />,
    poor: <Frown className="w-4 h-4 text-orange-500" />,
    terrible: <Angry className="w-4 h-4 text-red-500" />,
  };
  
  const handleSave = () => {
    onEdit({ ...entry, content });
    setIsEditing(false);
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div>
          <CardTitle className="text-lg font-semibold">{entry.title || getText('Daily Note', 'רישום יומי')}</CardTitle>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
            <div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{format(new Date(entry.date), 'MMM dd, yyyy')}</div>
            {entry.mood && <div className="flex items-center gap-1 capitalize">{moodIcons[entry.mood]} {entry.mood}</div>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(!isEditing)}><Edit className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => onDelete(entry.id)}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded-md min-h-[100px]"
          />
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>
        )}
        
        {isEditing && (
            <div className="flex justify-end mt-2 gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>{getText('Cancel', 'ביטול')}</Button>
                <Button size="sm" onClick={handleSave}>{getText('Save', 'שמור')}</Button>
            </div>
        )}

        {entry.lessons_learned && (
          <div className="mt-4 pt-3 border-t">
            <h4 className="font-semibold flex items-center gap-2 text-sm text-gray-800"><BookOpen className="w-4 h-4 text-blue-500" />{getText('Lessons Learned', 'לקחים שנלמדו')}</h4>
            <p className="text-sm text-gray-600 mt-1 ms-6">{entry.lessons_learned}</p>
          </div>
        )}

        {entry.screenshot_urls && entry.screenshot_urls.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <h4 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-2"><Image className="w-4 h-4 text-purple-500" />{getText('Screenshots', 'צילומי מסך')}</h4>
            <div className="flex flex-wrap gap-2">
              {entry.screenshot_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt={`Screenshot ${i+1}`} className="h-20 w-auto rounded-md border" />
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}