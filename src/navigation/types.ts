export type RootStackParamList = {
  MainTabs: undefined;
  AddTransaction: { mode: 'expense' | 'income'; initialDate?: string };
  EditTransaction: { id: number };
  BudgetSetting: { year?: number; month?: number };
};
