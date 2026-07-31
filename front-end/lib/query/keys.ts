export const queryKeys = {
  activities: {
    all: ['activities'] as const,
    detail: (id: number | string) => ['activities', String(id)] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  timeline: {
    all: ['timeline'] as const,
    month: (month: string) => ['timeline', month] as const,
  },
};
