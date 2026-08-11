import { Section, Task } from '@/types/priorities';
import { format } from 'date-fns';

export function today(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getAllTasks(sections: Section[]): (Task & { sectionTitle: string; subsectionTitle: string })[] {
  return sections.flatMap(s =>
    s.subsections.flatMap(sub =>
      sub.tasks.map(t => ({ ...t, sectionTitle: s.title, subsectionTitle: sub.title }))
    )
  );
}

export function countCompletedToday(sections: Section[]): number {
  const t = today();
  return getAllTasks(sections).filter(task => task.completed && task.completedAt === t).length;
}

export function getCompletedTasks(sections: Section[]) {
  return getAllTasks(sections)
    .filter(t => t.completed)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
}

export function getEffortDays(task: Task): number {
  return task.effortLog?.length ?? 0;
}

export function isOverdue(dueDate: string): boolean {
  if (!dueDate) return false;
  return dueDate < today();
}

export function isDueToday(dueDate: string): boolean {
  return dueDate === today();
}

export function isDueSoon(dueDate: string): boolean {
  if (!dueDate) return false;
  const d = new Date(dueDate + 'T00:00:00');
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - t.getTime()) / 86400000);
  return diff > 0 && diff <= 7;
}
