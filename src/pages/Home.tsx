import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PieChart from '@/components/PieChart';
import PriorityForm from '@/components/PriorityForm';
import HoverInfo from '@/components/HoverInfo';
import DataBar from '@/components/DataBar';
import LocalCompletionCounter from '@/components/LocalCompletionCounter';
import ThemeToggle from '@/components/ThemeToggle';
import EmailSettingsModal from '@/components/EmailSettingsModal';
import { Section, Subsection, Task, ChartSlice, EmailSettings } from '@/types/priorities';
import { PieChart as PieChartIcon, Target, Calendar, AlertTriangle, Clock, HardDrive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  getStoredHandle,
  storeHandle,
  verifyPermission,
  readFromHandle,
  saveToHandle,
  pickNewFile,
  pickOpenFile,
  DataFile,
} from '@/utils/fileStore';

const generateId = () => Math.random().toString(36).substr(2, 9);

const today = () => format(new Date(), 'yyyy-MM-dd');

const parseLocalDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const isOverdueDate = (dateString: string) => {
  if (!dateString) return false;
  const d = parseLocalDate(dateString);
  d.setHours(0, 0, 0, 0);
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return d < t;
};

const isDueTodayDate = (dateString: string) => {
  if (!dateString) return false;
  const d = parseLocalDate(dateString);
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'No due date';
  return parseLocalDate(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const Home = () => {
  const { toast } = useToast();
  const [sections, setSections] = useState<Section[]>([]);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({});
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [fileInitDone, setFileInitDone] = useState(false);
  const [showFilePrompt, setShowFilePrompt] = useState(false);

  const [hoveredSlice, setHoveredSlice] = useState<ChartSlice | null>(null);
  const [pinnedSlice, setPinnedSlice] = useState<ChartSlice | null>(null);
  const [isOverdueModalOpen, setIsOverdueModalOpen] = useState(false);
  const [isDueTodayModalOpen, setIsDueTodayModalOpen] = useState(false);
  const [isDueSoonModalOpen, setIsDueSoonModalOpen] = useState(false);
  const [showOverdueArcs, setShowOverdueArcs] = useState(
    () => localStorage.getItem('pv-local-showOverdueArcs') === 'true'
  );

  const [formPrefilledSectionId, setFormPrefilledSectionId] = useState('');
  const [formPrefilledSubsectionId, setFormPrefilledSubsectionId] = useState('');
  const [formActiveTab, setFormActiveTab] = useState<'section' | 'subsection' | 'task'>('section');
  const [isFormHighlighted, setIsFormHighlighted] = useState(false);

  const suppressChartRef = useRef(false);
  const suppressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleRef = useRef<FileSystemFileHandle | null>(null);

  // Keep refs in sync
  useEffect(() => { handleRef.current = fileHandle; }, [fileHandle]);
  useEffect(() => { emailSettingsRef.current = emailSettings; }, [emailSettings]);

  const emailSettingsRef = useRef<EmailSettings>({});

  const saveToFile = useCallback((nextSections: Section[], overrideEmail?: EmailSettings) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const handle = handleRef.current;
      if (!handle) return;
      try {
        await saveToHandle(handle, {
          sections: nextSections,
          emailSettings: overrideEmail ?? emailSettingsRef.current,
        });
        setLastSaved(new Date());
      } catch (err) {
        console.error('Save error:', err);
      }
    }, 500);
  }, []);

  // On mount: try to load previously chosen file
  useEffect(() => {
    (async () => {
      const stored = await getStoredHandle();
      if (stored) {
        const ok = await verifyPermission(stored, true);
        if (ok) {
          const data = await readFromHandle(stored);
          setFileHandle(stored);
          setFileName(stored.name);
          setSections(data.sections);
          setEmailSettings(data.emailSettings ?? {});
          emailSettingsRef.current = data.emailSettings ?? {};
          setFileInitDone(true);
          return;
        }
      }
      setFileInitDone(true);
      setShowFilePrompt(true);
    })();
  }, []);

  const handlePickNewFile = async () => {
    const handle = await pickNewFile();
    if (!handle) return;
    await storeHandle(handle);
    setFileHandle(handle);
    setFileName(handle.name);
    setShowFilePrompt(false);
    saveToFile(sections);
  };

  const handleOpenExistingFile = async () => {
    const handle = await pickOpenFile();
    if (!handle) return;
    const ok = await verifyPermission(handle, true);
    if (!ok) { toast({ title: 'Permission denied', variant: 'destructive' }); return; }
    const data = await readFromHandle(handle);
    await storeHandle(handle);
    setFileHandle(handle);
    setFileName(handle.name);
    setSections(data.sections);
    setEmailSettings(data.emailSettings ?? {});
    emailSettingsRef.current = data.emailSettings ?? {};
    setPinnedSlice(null);
    setShowFilePrompt(false);
    toast({ title: 'File opened', description: handle.name });
  };

  const handleSaveEmailSettings = (settings: EmailSettings) => {
    setEmailSettings(settings);
    emailSettingsRef.current = settings;
    saveToFile(sections, settings);
  };

  const handleSaveCopy = () => {
    const data = JSON.stringify({ sections, savedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `priorityviz-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Backup saved', description: 'JSON file downloaded.' });
  };

  const handleHoverInfoDialogChange = useCallback((open: boolean) => {
    if (!open) {
      if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current);
      suppressChartRef.current = true;
      suppressTimerRef.current = setTimeout(() => { suppressChartRef.current = false; }, 400);
    }
  }, []);

  // ── CRUD handlers (local state + file save) ──────────────────────────────

  const handleAddSection = (title: string, color?: string): Section => {
    const newSection: Section = { id: generateId(), title, color, subsections: [] };
    setSections(prev => {
      const next = [...prev, newSection];
      saveToFile(next);
      return next;
    });
    return newSection;
  };

  const handleAddSubsection = (sectionId: string, title: string): Subsection => {
    const newSub: Subsection = { id: generateId(), title, tasks: [] };
    setSections(prev => {
      const next = prev.map(s => s.id === sectionId
        ? { ...s, subsections: [...s.subsections, newSub] }
        : s);
      saveToFile(next);
      return next;
    });
    return newSub;
  };

  const handleAddTask = (sectionId: string, subsectionId: string, title: string, dueDate: string, description?: string) => {
    const newTask: Task = { id: generateId(), title, dueDate: dueDate || '', description };
    setSections(prev => {
      const next = prev.map(s => s.id === sectionId
        ? {
            ...s, subsections: s.subsections.map(sub => sub.id === subsectionId
              ? { ...sub, tasks: [...sub.tasks, newTask] }
              : sub)
          }
        : s);
      saveToFile(next);
      return next;
    });
  };

  const handleEdit = (type: 'section' | 'subsection' | 'task', id: string, newTitle: string, newDueDate?: string, newDescription?: string) => {
    setSections(prev => {
      const next = prev.map(s => {
        if (type === 'section' && s.id === id) return { ...s, title: newTitle };
        return {
          ...s, subsections: s.subsections.map(sub => {
            if (type === 'subsection' && sub.id === id) return { ...sub, title: newTitle };
            return {
              ...sub, tasks: sub.tasks.map(t => {
                if (type === 'task' && t.id === id) return {
                  ...t, title: newTitle,
                  dueDate: newDueDate !== undefined ? newDueDate : t.dueDate,
                  description: newDescription !== undefined ? newDescription : t.description,
                };
                return t;
              })
            };
          })
        };
      });
      saveToFile(next);

      // Update pinned/hovered slice references
      const refresh = (slice: ChartSlice | null): ChartSlice | null => {
        if (!slice) return null;
        const sec = next.find(s => s.id === slice.section.id);
        if (!sec) return null;
        const sub = slice.subsection ? sec.subsections.find(ss => ss.id === slice.subsection!.id) : undefined;
        const task = slice.task && sub ? sub.tasks.find(t => t.id === slice.task!.id) : undefined;
        return { ...slice, section: sec, subsection: sub, task };
      };
      setHoveredSlice(h => refresh(h));
      setPinnedSlice(p => refresh(p));

      return next;
    });
  };

  const handleDelete = (type: 'section' | 'subsection' | 'task', sectionId: string, subsectionId?: string, taskId?: string) => {
    setSections(prev => {
      let next: Section[];
      if (type === 'section') {
        next = prev.filter(s => s.id !== sectionId);
      } else if (type === 'subsection') {
        next = prev.map(s => s.id === sectionId
          ? { ...s, subsections: s.subsections.filter(sub => sub.id !== subsectionId) }
          : s);
      } else {
        next = prev.map(s => s.id === sectionId
          ? {
              ...s, subsections: s.subsections.map(sub => sub.id === subsectionId
                ? { ...sub, tasks: sub.tasks.filter(t => t.id !== taskId) }
                : sub)
            }
          : s);
      }
      saveToFile(next);

      if (type === 'task' && taskId) {
        if (pinnedSlice?.task?.id === taskId) setPinnedSlice(null);
        if (hoveredSlice?.task?.id === taskId) setHoveredSlice(null);
      } else if (type === 'subsection' && subsectionId) {
        if (pinnedSlice?.subsection?.id === subsectionId) setPinnedSlice(null);
        if (hoveredSlice?.subsection?.id === subsectionId) setHoveredSlice(null);
      } else if (type === 'section') {
        if (pinnedSlice?.section?.id === sectionId) setPinnedSlice(null);
        if (hoveredSlice?.section?.id === sectionId) setHoveredSlice(null);
      }

      return next;
    });
  };

  const handleComplete = (type: 'section' | 'subsection' | 'task', id: string) => {
    const completedAt = today();
    setSections(prev => {
      let next: Section[];

      if (type === 'task') {
        next = prev.map(s => ({
          ...s, subsections: s.subsections.map(sub => ({
            ...sub, tasks: sub.tasks.map(t =>
              t.id === id ? { ...t, completed: true, completedAt } : t
            )
          }))
        }));
        if (pinnedSlice?.task?.id === id) setPinnedSlice(null);
        if (hoveredSlice?.task?.id === id) setHoveredSlice(null);
      } else if (type === 'subsection') {
        // Mark all tasks in subsection complete
        next = prev.map(s => ({
          ...s, subsections: s.subsections.map(sub =>
            sub.id === id
              ? { ...sub, tasks: sub.tasks.map(t => ({ ...t, completed: true, completedAt })) }
              : sub
          )
        }));
        if (pinnedSlice?.subsection?.id === id) setPinnedSlice(null);
        if (hoveredSlice?.subsection?.id === id) setHoveredSlice(null);
      } else {
        // Mark all tasks in section complete
        next = prev.map(s =>
          s.id === id
            ? {
                ...s, subsections: s.subsections.map(sub => ({
                  ...sub, tasks: sub.tasks.map(t => ({ ...t, completed: true, completedAt }))
                }))
              }
            : s
        );
        if (pinnedSlice?.section?.id === id) setPinnedSlice(null);
        if (hoveredSlice?.section?.id === id) setHoveredSlice(null);
      }

      saveToFile(next);
      toast({ title: 'Completed!', description: 'Task(s) marked as done.' });
      return next;
    });
  };

  const handleColorChange = (sectionId: string, color: string) => {
    setSections(prev => {
      const next = prev.map(s => s.id === sectionId ? { ...s, color } : s);
      saveToFile(next);
      return next;
    });
  };

  const handlePriorityChange = (type: 'section' | 'subsection' | 'task', id: string, highPriority: boolean) => {
    setSections(prev => {
      const next = prev.map(s => {
        if (type === 'section' && s.id === id) return { ...s, high_priority: highPriority };
        return {
          ...s, subsections: s.subsections.map(sub => {
            if (type === 'subsection' && sub.id === id) return {
              ...sub, high_priority: highPriority,
              tasks: sub.tasks.map(t => ({ ...t, high_priority: highPriority }))
            };
            return {
              ...sub, tasks: sub.tasks.map(t =>
                type === 'task' && t.id === id ? { ...t, high_priority: highPriority } : t
              )
            };
          })
        };
      });
      saveToFile(next);

      const refresh = (slice: ChartSlice | null): ChartSlice | null => {
        if (!slice) return null;
        const sec = next.find(s => s.id === slice.section.id);
        if (!sec) return null;
        const sub = slice.subsection ? sec.subsections.find(ss => ss.id === slice.subsection!.id) : undefined;
        const task = slice.task && sub ? sub.tasks.find(t => t.id === slice.task!.id) : undefined;
        return { ...slice, section: sec, subsection: sub, task };
      };
      setHoveredSlice(h => refresh(h));
      setPinnedSlice(p => refresh(p));

      return next;
    });
  };

  const handleMoveSubsection = (subsectionId: string, fromSectionId: string, toSectionId: string) => {
    setSections(prev => {
      let moved: Subsection | null = null;
      const step1 = prev.map(s => {
        if (s.id === fromSectionId) {
          moved = s.subsections.find(sub => sub.id === subsectionId) ?? null;
          return { ...s, subsections: s.subsections.filter(sub => sub.id !== subsectionId) };
        }
        return s;
      });
      if (!moved) return prev;
      const next = step1.map(s =>
        s.id === toSectionId ? { ...s, subsections: [...s.subsections, moved!] } : s
      );
      saveToFile(next);
      if (hoveredSlice?.subsection?.id === subsectionId) setHoveredSlice(null);
      if (pinnedSlice?.subsection?.id === subsectionId) setPinnedSlice(null);
      return next;
    });
    toast({ title: 'Moved', description: 'Subsection moved.' });
  };

  const handleMoveTask = (taskId: string, fromSubsectionId: string, toSubsectionId: string) => {
    setSections(prev => {
      let moved: Task | null = null;
      const step1 = prev.map(s => ({
        ...s, subsections: s.subsections.map(sub => {
          if (sub.id === fromSubsectionId) {
            moved = sub.tasks.find(t => t.id === taskId) ?? null;
            return { ...sub, tasks: sub.tasks.filter(t => t.id !== taskId) };
          }
          return sub;
        })
      }));
      if (!moved) return prev;
      const next = step1.map(s => ({
        ...s, subsections: s.subsections.map(sub =>
          sub.id === toSubsectionId ? { ...sub, tasks: [...sub.tasks, moved!] } : sub
        )
      }));
      saveToFile(next);
      if (hoveredSlice?.task?.id === taskId) setHoveredSlice(null);
      if (pinnedSlice?.task?.id === taskId) setPinnedSlice(null);
      return next;
    });
    toast({ title: 'Moved', description: 'Task moved.' });
  };

  // ── Computed stats ────────────────────────────────────────────────────────

  const activeSections = sections.filter(s =>
    s.subsections.some(sub => sub.tasks.some(t => !t.completed))
  );

  const allActiveTasks = sections.flatMap(s =>
    s.subsections.flatMap(sub =>
      sub.tasks.filter(t => !t.completed).map(t => ({
        ...t, sectionTitle: s.title, subsectionTitle: sub.title,
        sectionId: s.id, subsectionId: sub.id,
      }))
    )
  );

  const dueTodayTasks = allActiveTasks.filter(t => isDueTodayDate(t.dueDate));
  const overdueTasks = allActiveTasks.filter(t => isOverdueDate(t.dueDate));
  const upcomingTasks = allActiveTasks.filter(t => {
    if (!t.dueDate) return false;
    const d = parseLocalDate(t.dueDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const soon = new Date(now);
    soon.setDate(soon.getDate() + 7);
    return d > now && d <= soon;
  });

  // Sections passed to PieChart have completed tasks filtered out
  const chartSections = sections.map(s => ({
    ...s, subsections: s.subsections.map(sub => ({
      ...sub, tasks: sub.tasks.filter(t => !t.completed)
    })).filter(sub => sub.tasks.length > 0 || s.subsections.length === 1)
  }));

  // ── Chart interaction ─────────────────────────────────────────────────────

  const handleSliceClickForForm = (slice: ChartSlice) => {
    if (suppressChartRef.current) return;
    setPinnedSlice(slice);
    if (slice.level === 'section') {
      setFormPrefilledSectionId(slice.section.id);
      setFormPrefilledSubsectionId('');
      setFormActiveTab('subsection');
      setIsFormHighlighted(true);
      setTimeout(() => setIsFormHighlighted(false), 2000);
    } else if (slice.level === 'subsection') {
      setFormPrefilledSectionId(slice.section.id);
      setFormPrefilledSubsectionId(slice.subsection?.id || '');
      setFormActiveTab('task');
      setIsFormHighlighted(true);
      setTimeout(() => setIsFormHighlighted(false), 2000);
    }
  };

  const handleWhiteSpaceClick = () => {
    if (suppressChartRef.current) return;
    if (pinnedSlice) { setPinnedSlice(null); setIsFormHighlighted(false); }
  };

  const handleTaskClick = (taskId: string, sectionId: string, subsectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    const subsection = section?.subsections.find(sub => sub.id === subsectionId);
    const task = subsection?.tasks.find(t => t.id === taskId);
    if (!section || !subsection || !task) return;
    setPinnedSlice({
      section, subsection, task,
      startAngle: 0, endAngle: 0, radius: 0,
      level: 'task', color: section.color || 'hsl(var(--chart-1))'
    });
    setIsDueTodayModalOpen(false);
    setIsOverdueModalOpen(false);
    setIsDueSoonModalOpen(false);
  };

  // ── File not ready ────────────────────────────────────────────────────────

  if (!fileInitDone) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const TaskListModal = ({ open, onOpenChange, tasks, title }: {
    open: boolean; onOpenChange: (v: boolean) => void;
    tasks: typeof allActiveTasks; title: string;
  }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          {tasks.length === 0
            ? <p className="text-sm text-muted-foreground text-center py-8">None.</p>
            : tasks.map(t => (
              <div
                key={t.id}
                className="p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleTaskClick(t.id, t.sectionId, t.subsectionId)}
              >
                <p className="font-medium text-sm">{t.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{t.sectionTitle} → {t.subsectionTitle}</span>
                  {t.dueDate && <span className="text-xs text-muted-foreground ml-auto">{formatDate(t.dueDate)}</span>}
                </div>
              </div>
            ))
          }
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <header className="relative bg-card/30 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 mr-auto">
              <div className="p-1.5 bg-gradient-primary rounded-lg">
                <Target className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                Priority Viz
              </h1>
            </div>
            <div className="flex-1 min-w-[200px] max-w-lg">
              <DataBar
                fileName={fileName}
                lastSaved={lastSaved}
                onOpenFile={handleOpenExistingFile}
                onSaveCopy={handleSaveCopy}
              />
            </div>
            <EmailSettingsModal settings={emailSettings} onSave={handleSaveEmailSettings} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* No file prompt */}
      {showFilePrompt && (
        <div className="container mx-auto px-4 md:px-6 py-12 flex flex-col items-center gap-6 text-center">
          <div className="p-4 bg-primary/10 rounded-full">
            <HardDrive className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Choose where to save your data</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              PriorityViz saves your tasks to a JSON file on your computer. Pick a location to create a new file, or open an existing one.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Button onClick={handlePickNewFile} size="lg">
              Create new data file
            </Button>
            <Button onClick={handleOpenExistingFile} variant="outline" size="lg">
              Open existing file
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Requires Chrome or Edge. The app reads and writes this file directly.
          </p>
        </div>
      )}

      {/* Main content */}
      {!showFilePrompt && (
        <div className="container mx-auto px-4 md:px-6 py-6 space-y-6">

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <PieChartIcon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allActiveTasks.length}</p>
                  <p className="text-sm text-muted-foreground">Active Tasks</p>
                </div>
              </CardContent>
            </Card>

            <button
              className="text-left"
              onClick={() => overdueTasks.length > 0 && setIsOverdueModalOpen(true)}
            >
              <Card className={`bg-card/50 backdrop-blur-sm h-full transition-colors ${overdueTasks.length > 0 ? 'cursor-pointer hover:bg-card/70 border-destructive/30' : ''}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-destructive/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{overdueTasks.length}</p>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                  </div>
                </CardContent>
              </Card>
            </button>

            <button
              className="text-left"
              onClick={() => dueTodayTasks.length > 0 && setIsDueTodayModalOpen(true)}
            >
              <Card className={`bg-card/50 backdrop-blur-sm h-full transition-colors ${dueTodayTasks.length > 0 ? 'cursor-pointer hover:bg-card/70 border-amber-500/30' : ''}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Calendar className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{dueTodayTasks.length}</p>
                    <p className="text-sm text-muted-foreground">Due Today</p>
                  </div>
                </CardContent>
              </Card>
            </button>

            <button
              className="text-left"
              onClick={() => upcomingTasks.length > 0 && setIsDueSoonModalOpen(true)}
            >
              <Card className={`bg-card/50 backdrop-blur-sm h-full transition-colors ${upcomingTasks.length > 0 ? 'cursor-pointer hover:bg-card/70' : ''}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Clock className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{upcomingTasks.length}</p>
                    <p className="text-sm text-muted-foreground">Due Soon</p>
                  </div>
                </CardContent>
              </Card>
            </button>
            <LocalCompletionCounter sections={sections} />
          </div>

          {/* Chart + HoverInfo + Form */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Chart */}
            <div
              className="flex-1 flex flex-col items-center min-h-[500px]"
              onClick={handleWhiteSpaceClick}
            >
              <PieChart
                sections={chartSections}
                onHover={setHoveredSlice}
                onSliceClick={handleSliceClickForForm}
                showOverdueArcs={showOverdueArcs}
              />

              {/* Overdue arcs toggle */}
              <div className="mt-3 flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showOverdueArcs}
                    onChange={e => {
                      setShowOverdueArcs(e.target.checked);
                      localStorage.setItem('pv-local-showOverdueArcs', String(e.target.checked));
                    }}
                    className="rounded"
                  />
                  Show overdue indicators
                </label>
              </div>
            </div>

            {/* Right column: HoverInfo + Form */}
            <div className="w-full lg:w-96 shrink-0 flex flex-col gap-4">
              <HoverInfo
                slice={pinnedSlice || hoveredSlice}
                isPinned={!!pinnedSlice}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onColorChange={handleColorChange}
                onPriorityChange={handlePriorityChange}
                onComplete={handleComplete}
                onClose={() => setPinnedSlice(null)}
                sections={sections}
                onMoveSubsection={handleMoveSubsection}
                onMoveTask={handleMoveTask}
                onTaskClick={handleTaskClick}
                onAnyDialogChange={handleHoverInfoDialogChange}
              />
              <PriorityForm
                sections={sections}
                onAddSection={handleAddSection}
                onAddSubsection={handleAddSubsection}
                onAddTask={handleAddTask}
                prefilledSectionId={formPrefilledSectionId}
                prefilledSubsectionId={formPrefilledSubsectionId}
                activeTab={formActiveTab}
                isHighlighted={isFormHighlighted}
              />
            </div>
          </div>
        </div>
      )}

      {/* Task modals */}
      <TaskListModal open={isOverdueModalOpen} onOpenChange={setIsOverdueModalOpen} tasks={overdueTasks} title={`Overdue (${overdueTasks.length})`} />
      <TaskListModal open={isDueTodayModalOpen} onOpenChange={setIsDueTodayModalOpen} tasks={dueTodayTasks} title={`Due Today (${dueTodayTasks.length})`} />
      <TaskListModal open={isDueSoonModalOpen} onOpenChange={setIsDueSoonModalOpen} tasks={upcomingTasks} title={`Due This Week (${upcomingTasks.length})`} />
    </div>
  );
};

export default Home;
