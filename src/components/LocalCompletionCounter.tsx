import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Section } from '@/types/priorities';
import { countCompletedToday, getCompletedTasks } from '@/utils/analytics';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';

interface Props { sections: Section[]; }

export default function LocalCompletionCounter({ sections }: Props) {
  const todayCount = countCompletedToday(sections);
  const allCompleted = getCompletedTasks(sections);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="bg-card/50 backdrop-blur-sm border-success/30 cursor-pointer hover:bg-card/70 transition-colors h-full group">
          <CardContent className="p-4 flex items-center gap-3 h-full">
            <div className="p-2 bg-success/20 rounded-lg group-hover:bg-success/30 transition-colors">
              <CheckCircle className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-xl font-bold">{todayCount}</p>
              <p className="text-xs text-muted-foreground">Completed Today</p>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Completed Tasks</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          {allCompleted.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No completed tasks yet.</p>
          ) : (
            allCompleted.map(task => (
              <div key={task.id} className="p-3 bg-muted/30 rounded-lg">
                <p className="font-medium text-sm">{task.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {task.sectionTitle} → {task.subsectionTitle}
                  </span>
                  {task.completedAt && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {format(parseISO(task.completedAt), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
