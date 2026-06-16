export type ColumnType = 'status' | 'priority' | 'assignee' | 'dueDate';

export type ColumnSubvariant = {
  tagColorVariableName: string;
  textColorVariableName: string;
  materialSymbolName?: string;
  isTagOpaque: boolean;
  fontVariationSettings?: string;
};

export type ColumnVariant = {
  subvariants: Record<string, ColumnSubvariant>;
};

export const taskGroupColumnVariants: Record<ColumnType, ColumnVariant> = {
  status: {
    subvariants: {
      not_started: {
        isTagOpaque: true,
        tagColorVariableName: 'tag-color-status-not-started',
        materialSymbolName: 'radio_button_unchecked',
        textColorVariableName: 'text-color-tag-var-1',
      },
      active: {
        isTagOpaque: true,
        tagColorVariableName: 'tag-color-status-active',
        materialSymbolName: 'radio_button_partial',
        textColorVariableName: 'text-color-tag-var-1',
      },
      done: {
        isTagOpaque: true,
        tagColorVariableName: 'tag-color-status-done',
        materialSymbolName: 'check',
        textColorVariableName: 'text-color-tag-var-1',
      },
    },
  },
  priority: {
    subvariants: {
      urgent: {
        isTagOpaque: false,
        tagColorVariableName: 'tag-color-priority-urgent',
        materialSymbolName: 'flag_2',
        textColorVariableName: 'tag-color-priority-urgent',
        fontVariationSettings: "'FILL' 1",
      },
      high: {
        isTagOpaque: false,
        tagColorVariableName: 'tag-color-priority-high',
        materialSymbolName: 'flag_2',
        textColorVariableName: 'tag-color-priority-high',
        fontVariationSettings: "'FILL' 1",
      },
      normal: {
        isTagOpaque: false,
        tagColorVariableName: 'tag-color-priority-normal',
        materialSymbolName: 'flag_2',
        textColorVariableName: 'tag-color-priority-normal',
        fontVariationSettings: "'FILL' 1",
      },
      low: {
        isTagOpaque: false,
        tagColorVariableName: 'tag-color-priority-low',
        materialSymbolName: 'flag_2',
        textColorVariableName: 'tag-color-priority-low',
        fontVariationSettings: "'FILL' 1",
      },
      null: {
        isTagOpaque: false,
        tagColorVariableName: 'tag-color-priority-low',
        materialSymbolName: 'flag_2',
        textColorVariableName: 'tag-color-priority-low',
        fontVariationSettings: "'FILL' 1",
      },
    },
  },
  assignee: {
    subvariants: {
      user: {
        isTagOpaque: false,
        tagColorVariableName: 'text-color-tag-var-2',
        textColorVariableName: 'tag-color-priority-low',
      },
    },
  },
  dueDate: {
    subvariants: {
      overdue: {
        isTagOpaque: false,
        tagColorVariableName: 'tag-color-date-overdue',
        textColorVariableName: 'tag-color-date-overdue',
      },
      today: {
        isTagOpaque: false,
        tagColorVariableName: 'tag-color-date-today',
        textColorVariableName: 'tag-color-date-today',
      },
      tomorrow: {
        isTagOpaque: false,
        tagColorVariableName: 'tag-color-date-tomorrow',
        textColorVariableName: 'tag-color-date-tomorrow',
      },
      future: {
        isTagOpaque: false,
        tagColorVariableName: 'tag-color-date-future',
        textColorVariableName: 'tag-color-date-future',
      },
      null: {
        isTagOpaque: false,
        tagColorVariableName: 'tag-color-date-future',
        textColorVariableName: 'tag-color-date-future',
      },
      done: {
        isTagOpaque: false,
        tagColorVariableName: 'tag-color-date-done',
        textColorVariableName: 'tag-color-date-done',
      },
    },
  },
};
