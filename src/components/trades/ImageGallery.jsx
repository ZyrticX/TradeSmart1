import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { TradeEvent } from "@/api/entities";
import { UploadFile } from "@/api/integrations";

export default function ImageGallery({ trade, events, onUpdate, getText }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const imageEvents = events.filter(e => e.screenshot_url);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      await TradeEvent.create({
        trade_id: trade.id,
        type: 'note',
        date: new Date().toISOString(),
        notes: 'Image Upload',
        screenshot_url: file_url,
        quantity: 0,
        price: 0
      });
      onUpdate();
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(getText('Failed to upload image.', 'נכשל בהעלאת התמונה.'));
    }
    setIsUploading(false);
  };

  const handleDelete = async (event) => {
    if (window.confirm(getText('Are you sure you want to delete this image?', 'האם למחוק תמונה זו?'))) {
      try {
        await TradeEvent.update(event.id, { ...event, screenshot_url: null });
        // If the event is just an image upload with no other data, delete it entirely
        if (event.type === 'note' && !event.notes && (event.quantity === 0 || !event.quantity)) {
           await TradeEvent.delete(event.id);
        }
        onUpdate();
      } catch (error) {
        console.error("Error deleting image:", error);
        alert(getText('Failed to delete image.', 'נכשל במחיקת התמונה.'));
      }
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm lg:text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
             <ImageIcon className="w-4 h-4" />
             {getText('Image Gallery', 'גלריית תמונות')}
          </div>
          <Button variant="outline" size="sm" onClick={handleUploadClick} disabled={isUploading}>
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {imageEvents.length > 0 ? (
          <div className="flex overflow-x-auto gap-3 p-2 -mx-2">
            {imageEvents.map(event => (
              <div key={event.id} className="relative flex-shrink-0 w-32 h-32 group">
                <a href={event.screenshot_url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={event.screenshot_url}
                    alt={getText('Trade screenshot', 'צילום מסך עסקה')}
                    className="w-full h-full object-cover rounded-md border"
                  />
                </a>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(event)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p>{getText('No images uploaded for this trade.', 'לא הועלו תמונות לעסקה זו.')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}