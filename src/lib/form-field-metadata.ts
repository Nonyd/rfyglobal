/** Mirrors Prisma `FieldType` — defined here so client components never import `@prisma/client`. */

export const FIELD_TYPE_VALUES = [
  'SHORT_TEXT',
  'LONG_TEXT',
  'EMAIL',
  'PHONE',
  'NUMBER',
  'DROPDOWN',
  'RADIO',
  'CHECKBOXES',
  'DATE',
  'FILE_UPLOAD',
  'LOCATION',
  'BIRTHDAY_MONTH',
  'BIRTHDAY_DAY',
] as const

export type AppFieldType = (typeof FIELD_TYPE_VALUES)[number]

export const FIELD_TYPE_LABELS: Record<AppFieldType, string> = {
  SHORT_TEXT: 'Short Text',
  LONG_TEXT: 'Long Text',
  EMAIL: 'Email',
  PHONE: 'Phone',
  NUMBER: 'Number',
  DROPDOWN: 'Dropdown',
  RADIO: 'Radio',
  CHECKBOXES: 'Checkboxes',
  DATE: 'Date',
  FILE_UPLOAD: 'File Upload',
  LOCATION: 'Location',
  BIRTHDAY_MONTH: 'Birthday Month',
  BIRTHDAY_DAY: 'Birthday Day',
}

export const BIRTHDAY_FIELD_TYPES: AppFieldType[] = ['BIRTHDAY_MONTH', 'BIRTHDAY_DAY']

export const HAS_OPTIONS: AppFieldType[] = ['DROPDOWN', 'RADIO', 'CHECKBOXES']

export const NO_PLACEHOLDER: AppFieldType[] = [
  'DATE',
  'FILE_UPLOAD',
  'LOCATION',
  'CHECKBOXES',
  'RADIO',
  'BIRTHDAY_MONTH',
  'BIRTHDAY_DAY',
]

export type FieldTypeUiItem = {
  type: AppFieldType
  label: string
  icon: string
  /** When set, new fields get this label instead of the generic default */
  defaultLabel?: string
}

export const FIELD_TYPES_UI: FieldTypeUiItem[] = [
  { type: 'SHORT_TEXT', label: 'Name', icon: '👤', defaultLabel: 'Name' },
  { type: 'SHORT_TEXT', label: 'Short Text', icon: 'T' },
  { type: 'LONG_TEXT', label: 'Long Text', icon: '¶' },
  { type: 'EMAIL', label: 'Email', icon: '@' },
  { type: 'PHONE', label: 'Phone', icon: '📞' },
  { type: 'NUMBER', label: 'Number', icon: '#' },
  { type: 'DROPDOWN', label: 'Dropdown', icon: '▾' },
  { type: 'RADIO', label: 'Radio', icon: '◉' },
  { type: 'CHECKBOXES', label: 'Checkboxes', icon: '☑' },
  { type: 'DATE', label: 'Date', icon: '📅' },
  { type: 'FILE_UPLOAD', label: 'File Upload', icon: '↑' },
  { type: 'LOCATION', label: 'Location', icon: '📍' },
  { type: 'BIRTHDAY_MONTH', label: 'Birthday Month', icon: '🎂', defaultLabel: 'Birthday Month' },
  { type: 'BIRTHDAY_DAY', label: 'Birthday Day', icon: '📅', defaultLabel: 'Birthday Day' },
]
