export interface Employee {
  email: string;
  name: string;
  receiptEmail?: string;
}

export const employees: Employee[] = [
  { email: 'j.delacruz@cnt.com', name: 'Juan Dela Cruz' },
  { email: 'm.santos@cnt.com', name: 'Maria Santos' },
  { email: 'a.reyes@cnt.com', name: 'Ana Reyes' },
  { email: 'k.garcia@cnt.com', name: 'Kevin Garcia' },
  { email: 'l.mendoza@cnt.com', name: 'Liza Mendoza' },
  { email: 'IT.support@cntpromoads.com', name: 'CNT IT Support' },
];

export const findEmployeeByEmail = (email: string): Employee | undefined => {
  const target = email.toLowerCase().trim();
  return employees.find(e => e.email.toLowerCase() === target);
};

export const getAllEmployees = (): Employee[] => employees;
