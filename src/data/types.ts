export type Employee = {
  id: string;
  name: string;
  designation: string;
  institution: string;
  email: string;
  avatar: string;
};

export type ReportRow = {
  id: number;
  slNo: number;
  date: string;
  area: string;
  report: string;
};

export type StatCard = {
  label: string;
  value: string | number;
  change: string;
  positive: boolean;
  icon: string;
  color: string;
};
