// The only place with the project name (D016) and the date of the module statuses.
export const PROJECT_NAME = 'PontaPé';
export const STATUS_DATE = '2026-09-22';
export const STATUS_DATE_SPOKEN = '22 de setembro de 2026';
export const REPOSITORY_OPEN = false;

export const withName = (text: string) => text.replaceAll('{name}', PROJECT_NAME);
export const formatDay = (isoDate: string) => isoDate.split('-').reverse().join('/');
