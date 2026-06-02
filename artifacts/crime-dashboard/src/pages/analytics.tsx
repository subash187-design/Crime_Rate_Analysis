import { useGetHourlyPattern, useGetIncidentsByDistrict, useGetCrimeTrend, useGetIncidentsByType } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AnalyticsPage() {
  const { data: hourly, isLoading: isHourlyLoading } = useGetHourlyPattern();
  const { data: district, isLoading: isDistrictLoading } = useGetIncidentsByDistrict({ startDate: null, endDate: null });
  const { data: trend, isLoading: isTrendLoading } = useGetCrimeTrend({ months: 12 });
  const { data: typeData, isLoading: isTypeLoading } = useGetIncidentsByType();

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Deep Analytics</h2>
        <p className="text-muted-foreground mt-1 text-sm">Granular insights into crime patterns and distributions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Hourly Pattern</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isHourlyLoading ? null : hourly ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourly}>
                  <XAxis dataKey="hour" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}:00`} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} cursor={{fill: 'hsl(var(--muted))'}} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">District Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isDistrictLoading ? null : district ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={district} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="district" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} cursor={{fill: 'hsl(var(--muted))'}} />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Crime Volume Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isTrendLoading ? null : trend ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
