export interface CompanyEmail {
  _id: string;
  email: string;
  name: string;
  businessUnit?: string;
  birthdate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getCompanyEmails = async (): Promise<CompanyEmail[]> => {
  const res = await fetch('/api/company-emails', { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
};

export const createCompanyEmail = async (data: Omit<CompanyEmail, '_id' | 'createdAt' | 'updatedAt'>) => {
  const res = await fetch('/api/company-emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create company email');
  return res.json();
};

export const updateCompanyEmail = async (id: string, data: Partial<Omit<CompanyEmail, '_id'>>) => {
  const res = await fetch(`/api/company-emails/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update company email');
  return res.json();
};

export const deleteCompanyEmail = async (id: string) => {
  const res = await fetch(`/api/company-emails/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete company email');
  return res.json();
};

export const findCompanyEmailByEmail = async (email: string): Promise<CompanyEmail | null> => {
  const res = await fetch(`/api/company-emails/find?email=${encodeURIComponent(email)}`);
  if (!res.ok) return null;
  return res.json();
};
