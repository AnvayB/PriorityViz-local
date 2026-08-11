import React from 'react';
import { Download, FolderOpen, HardDrive, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataBarProps {
  fileName: string | null;
  lastSaved: Date | null;
  onOpenFile: () => void;
  onSaveCopy: () => void;
}

export default function DataBar({ fileName, lastSaved, onOpenFile, onSaveCopy }: DataBarProps) {
  const timeStr = lastSaved
    ? lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-card/50 border border-border/50 rounded-lg text-sm">
      <HardDrive className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground truncate flex-1">
        {fileName ?? 'No file selected'}
      </span>
      {fileName && (
        <span className="flex items-center gap-1 text-xs text-emerald-500 shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {timeStr ? `Saved ${timeStr}` : 'Changes saved automatically'}
        </span>
      )}
      <Button variant="ghost" size="sm" onClick={onOpenFile} className="shrink-0">
        <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
        Open file
      </Button>
      <Button variant="ghost" size="sm" onClick={onSaveCopy} className="shrink-0">
        <Download className="w-3.5 h-3.5 mr-1.5" />
        Download
      </Button>
    </div>
  );
}
