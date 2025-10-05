
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function WatchlistTable({ notes, isLoading, onDelete }) {
  if (isLoading) {
    return <p>טוען רשימת מעקב...</p>;
  }

  if (notes.length === 0) {
    return <p className="text-center text-gray-500 py-8">אין הערות ברשימת המעקב.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>תאריך</TableHead>
            <TableHead>סימבול</TableHead>
            <TableHead>מחיר</TableHead>
            <TableHead>סנטימנט</TableHead>
            <TableHead>הערות</TableHead>
            <TableHead>פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notes.map(note => (
            <TableRow key={note.id}>
              <TableCell>{format(new Date(note.date), 'dd/MM/yyyy')}</TableCell>
              <TableCell className="font-medium">{note.symbol}</TableCell>
              <TableCell>${note.price?.toFixed(2) ?? 'N/A'}</TableCell>
              <TableCell><Badge variant="outline">{note.sentiment || 'לא צוין'}</Badge></TableCell>
              <TableCell className="max-w-sm whitespace-pre-wrap">{note.notes}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => onDelete(note.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
