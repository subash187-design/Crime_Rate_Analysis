import { useGetHotspots } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ZAxis } from "recharts";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DISTRICT_COLORS: Record<string, string> = {
  'North': 'hsl(var(--chart-1))',
  'South': 'hsl(var(--chart-2))',
  'East': 'hsl(var(--chart-3))',
  'West': 'hsl(var(--chart-4))',
  'Central': 'hsl(var(--chart-5))',
};

export default function MapPage() {
  const [filterType, setFilterType] = useState<string>("all");
  const { data: hotspots, isLoading } = useGetHotspots({ limit: 1000 });

  const filteredHotspots = useMemo(() => {
    if (!hotspots) return [];
    if (filterType === "all") return hotspots;
    return hotspots.filter(h => h.crimeType === filterType);
  }, [hotspots, filterType]);

  const uniqueCrimeTypes = useMemo(() => {
    if (!hotspots) return [];
    const types = new Set(hotspots.map(h => h.crimeType));
    return Array.from(types);
  }, [hotspots]);

  return (
    <div className="p-8 space-y-6 h-full flex flex-col">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Geographic Hotspots</h2>
          <p className="text-muted-foreground mt-1 text-sm">Spatial distribution of incidents by coordinates.</p>
        </div>
        <div className="w-[200px]">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Crime Types</SelectItem>
              {uniqueCrimeTypes.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="flex-1 min-h-0 flex flex-col">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Incident Scatter Grid</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis 
                  type="number" 
                  dataKey="longitude" 
                  name="Longitude" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => val.toFixed(3)}
                />
                <YAxis 
                  type="number" 
                  dataKey="latitude" 
                  name="Latitude" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => val.toFixed(3)}
                />
                <ZAxis type="number" dataKey="count" range={[50, 400]} name="Incident Count" />
                <RechartsTooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(value: number, name: string) => [value, name === 'count' ? 'Incidents' : name]}
                />
                <Scatter name="Hotspots" data={filteredHotspots}>
                  {filteredHotspots.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DISTRICT_COLORS[entry.district] || 'hsl(var(--primary))'} fillOpacity={0.7} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
