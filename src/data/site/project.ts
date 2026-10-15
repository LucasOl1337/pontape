// The only place with the project name (D016) and the date of the module statuses.
export const PROJECT_NAME = 'PontaPé';
export const STATUS_DATE = '2026-09-23';
export const REPOSITORY_OPEN = true;

export const withName = (text: string) => text.replaceAll('{name}', PROJECT_NAME);
export const formatDay = (isoDate: string) => isoDate.split('-').reverse().join('/');
// The day this version of the site was built, in São Paulo time (F44, plano 1.6): the footer said
// "Atualizado em" with the status date, weeks old on pages that changed later.
export const buildDay = (now = new Date()) => now.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
