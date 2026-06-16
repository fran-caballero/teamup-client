import { StatusColor } from '@shared/types/ui.types';

export const defaultStatusColors: StatusColor[] = [
  { id: 1, light: '#5F55EE', dark: '#7F77F1' },
  { id: 2, light: '#4466FF', dark: '#6985FF' },
  { id: 3, light: '#1090E0', dark: '#40A6E6' },
  { id: 4, light: '#0F9D9F', dark: '#3FB1B2' },
  { id: 5, light: '#64C6A2', dark: '#64C6A2' },
  { id: 6, light: '#008844', dark: '#33A069' },
  { id: 7, light: '#F8AE00', dark: '#F9BE33' },
  { id: 8, light: '#E16B16', dark: '#E78945' },
  { id: 9, light: '#D33D44', dark: '#DC646A' },
  { id: 10, light: '#EE5E99', dark: '#F17EAD' },
  { id: 11, light: '#B660E0', dark: '#C580E6' },
  { id: 12, light: '#AA8D80', dark: '#BBA399' },
  { id: 13, light: '#656F7D', dark: '#656F7D' },
  { id: 14, light: '#87909E', dark: '#87909E' },
];

export const defaultStatusColorIds = {
  not_started: 14,
  active: 3,
  done: 6,
};
