export type RootStackParamList = {
  MainTabs: undefined;
  AddTransaction: { mode: 'expense' | 'income' };
  EditTransaction: { id: number };
  BudgetSetting: undefined;
};
