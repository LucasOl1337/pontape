// The résumé tool (/ferramentas/curriculo): the choices on the form. Informal work counts the same.
export const SKILLS = [
  'Limpeza', 'Cozinha', 'Cuidar de criança', 'Cuidar de idoso', 'Construção civil', 'Pintura',
  'Jardinagem', 'Carga e descarga', 'Atendimento ao cliente', 'Caixa', 'Vendas', 'Entrega', 'Costura',
  'Cabelo e unha', 'Lavagem de carro', 'Reciclagem', 'Portaria', 'Vigilância', 'Mecânica', 'Elétrica',
  'Marcenaria', 'Garçom', 'Padaria', 'Estoque',
] as const;

export const SHIFTS = ['Manhã', 'Tarde', 'Noite', 'Fim de semana'] as const;

export const SCHOOLING = [
  'Não frequentei escola', 'Fundamental incompleto', 'Fundamental completo', 'Médio incompleto',
  'Médio completo', 'Curso técnico', 'Superior incompleto', 'Superior completo',
] as const;

// Fictitious person, for the "Ver com um exemplo inventado" button. Not a real candidate.
export const EXAMPLE = {
  name: 'Maria Aparecida Ferreira (exemplo inventado)',
  phone: '(11) 91234-5678',
  district: 'Jardim Ângela',
  city: 'São Paulo',
  skills: ['Limpeza', 'Cozinha', 'Cuidar de idoso'],
  extraSkills: ['Passar roupa'],
  jobs: [
    { what: 'Faxina', where: 'Casas de família', time: '4 anos' },
    { what: 'Cuidar de idoso', where: '', time: '1 ano' },
  ],
  courses: ['Cuidador de idoso, 40 horas'],
  school: 'Fundamental completo',
  shifts: ['Manhã', 'Tarde'],
};
