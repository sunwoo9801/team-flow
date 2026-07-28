export const CARD_INCLUDE = {
  assignees: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
  checklistItems: { orderBy: { position: 'asc' } },
  labels: { select: { id: true, boardId: true, name: true, color: true } },
} as const;
