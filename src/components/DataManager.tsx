import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, Database, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DataManager() {
  const [loading, setLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const { toast } = useToast();

  const exportData = async (tableName: 'students' | 'departments' | 'fees') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from(tableName).select("*");
      if (error) throw error;

      const csv = convertToCSV(data);
      downloadCSV(csv, `${tableName}_export_${new Date().toISOString().split('T')[0]}.csv`);
      toast({ title: `${tableName} data exported successfully` });
    } catch (error: any) {
      toast({ title: "Export failed", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const createBackup = async () => {
    setLoading(true);
    try {
      const tables = ['students', 'departments', 'fees'];
      const backupData: any = {};
      
      for (const tableName of tables) {
        const { data, error } = await supabase.from(tableName as 'students' | 'departments' | 'fees').select("*");
        if (error) throw error;
        backupData[tableName] = data;
      }
      
      const backupJson = JSON.stringify(backupData, null, 2);
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hostel_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: "Backup created successfully" });
    } catch (error: any) {
      toast({ title: "Backup failed", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const diagnosticResults = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('departments').select('id', { count: 'exact', head: true }),
        supabase.from('fees').select('id', { count: 'exact', head: true }),
        supabase.from('fees').select('status').eq('status', 'overdue'),
        supabase.from('students').select('id').is('email', null)
      ]);

      const [studentsCount, deptCount, feesCount, overdueResult, studentsWithoutEmail] = diagnosticResults;

      setDiagnostics({
        studentsCount: studentsCount.count || 0,
        departmentsCount: deptCount.count || 0,
        feesCount: feesCount.count || 0,
        overdueFeesCount: overdueResult.data?.length || 0,
        studentsWithoutEmailCount: studentsWithoutEmail.data?.length || 0,
        timestamp: new Date().toLocaleString()
      });

      toast({ title: "System diagnostics completed" });
    } catch (error: any) {
      toast({ title: "Diagnostics failed", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const importData = async (file: File, tableName: 'students' | 'departments' | 'fees') => {
    if (!file) return;
    
    setLoading(true);
    try {
      const text = await file.text();
      let data;
      
      if (file.name.endsWith('.json')) {
        data = JSON.parse(text);
        if (data[tableName]) {
          data = data[tableName];
        }
      } else if (file.name.endsWith('.csv')) {
        data = parseCSV(text);
      } else {
        throw new Error('Unsupported file format. Please use JSON or CSV.');
      }

      const { error } = await supabase.from(tableName).insert(data);
      if (error) throw error;
      
      toast({ title: `Data imported successfully to ${tableName}` });
    } catch (error: any) {
      toast({ title: "Import failed", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  // Utility functions
  const convertToCSV = (data: any[]) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    
    return lines.slice(1).filter(line => line.trim()).map(line => {
      const values = line.split(',').map(v => v.replace(/"/g, ''));
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || null;
      });
      return obj;
    });
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Data Management</h2>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Backup Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create a complete backup of all hostel data
            </p>
            <Button onClick={createBackup} disabled={loading} className="w-full">
              Create Backup
            </Button>
          </CardContent>
        </Card>

        {/* Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground mb-4">
              Export specific tables as CSV
            </p>
            <Button onClick={() => exportData('students')} disabled={loading} variant="outline" size="sm" className="w-full">
              Export Students
            </Button>
            <Button onClick={() => exportData('fees')} disabled={loading} variant="outline" size="sm" className="w-full">
              Export Fees
            </Button>
            <Button onClick={() => exportData('departments')} disabled={loading} variant="outline" size="sm" className="w-full">
              Export Departments
            </Button>
          </CardContent>
        </Card>

        {/* Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Import data from JSON or CSV files
            </p>
            <div className="space-y-2">
              <Label>Import to Students</Label>
              <Input 
                type="file" 
                accept=".json,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) importData(file, 'students');
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Diagnostics */}
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Diagnostics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Check system health and data integrity
              </p>
              <Button onClick={runDiagnostics} disabled={loading}>
                Run Diagnostics
              </Button>
            </div>
            
            {diagnostics && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mt-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{diagnostics.studentsCount}</div>
                  <div className="text-sm text-muted-foreground">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{diagnostics.departmentsCount}</div>
                  <div className="text-sm text-muted-foreground">Departments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{diagnostics.feesCount}</div>
                  <div className="text-sm text-muted-foreground">Fee Records</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">{diagnostics.overdueFeesCount}</div>
                  <div className="text-sm text-muted-foreground">Overdue Fees</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-status-warning">{diagnostics.studentsWithoutEmailCount}</div>
                  <div className="text-sm text-muted-foreground">No Email</div>
                </div>
                <div className="md:col-span-2 lg:col-span-5 text-center text-xs text-muted-foreground mt-2">
                  Last checked: {diagnostics.timestamp}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}