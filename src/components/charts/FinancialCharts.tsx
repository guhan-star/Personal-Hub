import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { formatINR, formatINRCompact } from '@/utils';
import { useTheme } from '@/context/ThemeContext';

interface IncomeExpenseChartProps {
  income: number;
  expense: number;
}

export const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({ income, expense }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const data = [
    { name: 'Income', amount: income, fill: '#22A879' },
    { name: 'Expense', amount: expense, fill: '#E56B73' },
  ];

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
          <XAxis
            type="number"
            tickFormatter={(val) => formatINRCompact(val)}
            stroke={isDark ? '#6B7280' : '#9CA3AF'}
            fontSize={11}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke={isDark ? '#6B7280' : '#9CA3AF'}
            fontSize={12}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: any) => [formatINR(Number(value)), 'Total']}
            contentStyle={{
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              borderColor: isDark ? '#374151' : '#E5E7EB',
              borderRadius: '12px',
              color: isDark ? '#F3F4F6' : '#111827',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface CategoryDonutChartProps {
  categories: { name: string; amount: number; color?: string }[];
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({ categories }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const defaultColors = ['#7167E8', '#E56B73', '#5599E8', '#F59E0B', '#22A879', '#EC4899', '#8E83F5'];

  const filtered = categories.filter((c) => c.amount > 0);

  if (filtered.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-hub-muted">
        No expense category data recorded yet
      </div>
    );
  }

  return (
    <div className="h-52 w-full flex flex-col sm:flex-row items-center justify-between">
      <div className="h-44 w-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered}
              innerRadius={45}
              outerRadius={65}
              paddingAngle={3}
              dataKey="amount"
            >
              {filtered.map((entry, index) => (
                <Cell key={`slice-${index}`} fill={entry.color || defaultColors[index % defaultColors.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: any) => [formatINR(Number(val)), 'Spent']}
              contentStyle={{
                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                borderColor: isDark ? '#374151' : '#E5E7EB',
                borderRadius: '10px',
                fontSize: '11px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 pl-0 sm:pl-4 space-y-1.5 w-full max-h-40 overflow-y-auto">
        {filtered.slice(0, 5).map((cat, idx) => (
          <div key={cat.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color || defaultColors[idx % defaultColors.length] }}
              />
              <span className="truncate text-hub-text dark:text-hub-text-dark">{cat.name}</span>
            </div>
            <span className="font-semibold text-hub-muted dark:text-hub-muted-dark">
              {formatINRCompact(cat.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface SpendingTrendChartProps {
  data: { date: string; amount: number }[];
}

export const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({ data }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2A2D40' : '#E9EAF0'} />
          <XAxis
            dataKey="date"
            stroke={isDark ? '#6B7280' : '#9CA3AF'}
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke={isDark ? '#6B7280' : '#9CA3AF'}
            fontSize={11}
            tickFormatter={(val) => formatINRCompact(val)}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: any) => [formatINR(Number(value)), 'Amount']}
            contentStyle={{
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              borderColor: isDark ? '#374151' : '#E5E7EB',
              borderRadius: '10px',
              fontSize: '11px',
            }}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#7167E8"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#7167E8' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
