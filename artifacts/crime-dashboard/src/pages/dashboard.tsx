import { useGetAnalyticsSummary, useGetCrimeTrend, useGetIncidentsByType, useGetRecentIncidents } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function DashboardPage() {
  const { data: summary, isLoading: isSummaryLoading } = useGetAnalyticsSummary();
  const { data: trend, isLoading: isTrendLoading } = useGetCrimeTrend({ months: 6 });
  const { data: typeBreakdown, isLoading: isTypeLoading } = useGetIncidentsByType();
  const { data: recent, isLoading: isRecentLoading } = useGetRecentIncidents({ limit: 5 });

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground mt-1 text-sm">System intelligence and recent trends.</p>
        </div>
      </div>

      {isSummaryLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24"></CardHeader>
            </Card>
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.totalIncidents.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{summary.changeFromLastMonth > 0 ? '+' : ''}{summary.changeFromLastMonth}% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Open Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">{summary.openCases.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Critical Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{summary.criticalIncidents.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Daily</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.avgDailyIncidents.toFixed(1)}</div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Crime Trend (6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isTrendLoading ? null : trend ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Crime by Type</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isTypeLoading ? null : typeBreakdown ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeBreakdown} layout="vertical" margin={{ left: 40 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="crimeType" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} cursor={{fill: 'transparent'}}/>
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Incidents Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isRecentLoading ? null : recent?.map(incident => (
              <div key={incident.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{incident.crimeType}</span>
                    <Badge variant="outline" className={`
                      ${incident.severity === 'low' ? 'border-green-500 text-green-500' : ''}
                      ${incident.severity === 'medium' ? 'border-yellow-500 text-yellow-500' : ''}
                      ${incident.severity === 'high' ? 'border-orange-500 text-orange-500' : ''}
                      ${incident.severity === 'critical' ? 'border-red-500 text-red-500' : ''}
                    `}>
                      {incident.severity}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{incident.district} • {incident.address}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(incident.occurredAt), 'MMM d, yyyy HH:mm')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
