export interface TaskDraftLike {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
}

export interface TaskDraftErrors {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function validateTaskDraft(
  draft: TaskDraftLike,
  options: { isCreate: boolean },
): TaskDraftErrors {
  const errors: TaskDraftErrors = {};

  const title = draft.title.trim();
  if (!title) {
    errors.title = 'Title is required.';
  } else if (title.length < 3) {
    errors.title = 'Title must be at least 3 characters.';
  }

  if (draft.description.length > 500) {
    errors.description = 'Description must be 500 characters or fewer.';
  }

  if (!draft.status) {
    errors.status = 'Status is required.';
  }

  if (!draft.priority) {
    errors.priority = 'Priority is required.';
  }

  if (!draft.dueDate) {
    errors.dueDate = 'Due date is required.';
  } else {
    const parsed = parseDate(draft.dueDate);
    if (!parsed) {
      errors.dueDate = 'Enter a valid date.';
    } else if (options.isCreate && parsed < startOfToday()) {
      errors.dueDate = 'Due date cannot be before today.';
    }
  }

  return errors;
}

export function hasTaskDraftErrors(errors: TaskDraftErrors): boolean {
  return Object.keys(errors).length > 0;
}
