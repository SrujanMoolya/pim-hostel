import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Department {
  id: string;
  code: string;
  name: string;
}

interface College {
  id: string;
  name: string;
  code?: string;
}

export default function CollegeDepartmentManager() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [deptForm, setDeptForm] = useState({ code: "", name: "" });
  const [collegeForm, setCollegeForm] = useState({ name: "", code: "" });
  const [dialogOpen, setDialogOpen] = useState({ dept: false, college: false });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [deptResult, collegeResult] = await Promise.all([
      supabase.from("departments").select("*").order("name"),
      supabase.from("colleges").select("*").order("name")
    ]);

    if (deptResult.data) setDepartments(deptResult.data as any[]);
    if (collegeResult.data) {
      setColleges((collegeResult.data as any[]).map(c => ({ id: String(c.id), name: c.name, code: c.code })));
    }
    setLoading(false);
  }

  // Department functions
  async function handleDeptSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingDept) {
        const { error } = await supabase
          .from("departments")
          .update({ code: deptForm.code, name: deptForm.name })
          .eq("id", editingDept.id);
        if (error) throw error;
        toast({ title: "Department updated successfully" });
      } else {
        const { error } = await supabase
          .from("departments")
          .insert({ code: deptForm.code, name: deptForm.name });
        if (error) throw error;
        toast({ title: "Department created successfully" });
      }
      
      setDeptForm({ code: "", name: "" });
      setEditingDept(null);
      setDialogOpen({ ...dialogOpen, dept: false });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  }

  async function deleteDepartment(id: string) {
    if (!confirm("Are you sure you want to delete this department?")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from("departments").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Department deleted successfully" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  }

  // College functions
  async function handleCollegeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingCollege) {
        // update colleges table (name + code)
        const { error: upErr } = await supabase.from('colleges').update({ name: collegeForm.name, code: collegeForm.code }).eq('id', editingCollege.id)
        if (upErr) throw upErr
        // Update all students with old college name to new name
        const { error } = await supabase
          .from("students")
          .update({ college: collegeForm.name })
          .eq("college", editingCollege.name);
        if (error) throw error;
        toast({ title: "College updated successfully" });
      } else {
        // insert into colleges table (name + code required)
        const { error: insertErr } = await supabase.from('colleges').insert({ name: collegeForm.name, code: collegeForm.code })
        if (insertErr) throw insertErr
        toast({ title: "College created successfully" });
      }
      
  setCollegeForm({ name: "", code: "" });
      setEditingCollege(null);
      setDialogOpen({ ...dialogOpen, college: false });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  }

  async function deleteCollege(name: string) {
    if (!confirm("Are you sure you want to delete this college? This will remove it from all students.")) return;
    
    setLoading(true);
    try {
      // find college id
      const { data: colData, error: findErr } = await supabase.from('colleges').select('id').eq('name', name).limit(1).single()
      if (findErr && findErr.code !== 'PGRST116') throw findErr
      if (colData && colData.id) {
        const { error: delErr } = await supabase.from('colleges').delete().eq('id', colData.id)
        if (delErr) throw delErr
      }
      // unset college on students
      const { error } = await supabase
        .from("students")
        .update({ college: null })
        .eq("college", name);
      if (error) throw error;
      toast({ title: "College removed successfully" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">College & Department Management</h2>
      
      <Tabs defaultValue="departments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="colleges">Colleges</TabsTrigger>
        </TabsList>
        
        <TabsContent value="departments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Departments</h3>
            <Dialog open={dialogOpen.dept} onOpenChange={(open) => setDialogOpen({ ...dialogOpen, dept: open })}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingDept(null);
                  setDeptForm({ code: "", name: "" });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingDept ? "Edit Department" : "Add Department"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleDeptSubmit} className="space-y-4">
                  <div>
                    <Label>Department Code</Label>
                    <Input 
                      value={deptForm.code} 
                      onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                      placeholder="e.g., CSE, ECE, ME"
                      required 
                    />
                  </div>
                  <div>
                    <Label>Department Name</Label>
                    <Input 
                      value={deptForm.name} 
                      onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                      placeholder="e.g., Computer Science Engineering"
                      required 
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {editingDept ? "Update" : "Create"} Department
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid gap-4">
            {departments.map((dept) => (
              <Card key={dept.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{dept.name}</h4>
                      <p className="text-sm text-muted-foreground">Code: {dept.code}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingDept(dept);
                          setDeptForm({ code: dept.code, name: dept.name });
                          setDialogOpen({ ...dialogOpen, dept: true });
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteDepartment(dept.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="colleges" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Colleges</h3>
            <Dialog open={dialogOpen.college} onOpenChange={(open) => setDialogOpen({ ...dialogOpen, college: open })}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingCollege(null);
              setCollegeForm({ name: "", code: "" });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add College
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCollege ? "Edit College" : "Add College"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCollegeSubmit} className="space-y-4">
                  <div>
                    <Label>College Name</Label>
                    <Input 
                      value={collegeForm.name} 
                      onChange={(e) => setCollegeForm({ ...collegeForm, name: e.target.value })}
                      placeholder="e.g., Engineering College"
                      required 
                    />
                  </div>
                  <div>
                    <Label>College Code</Label>
                    <Input
                      value={collegeForm.code}
                      onChange={(e) => setCollegeForm({ ...collegeForm, code: e.target.value })}
                      placeholder="e.g., PIM, PPC"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {editingCollege ? "Update" : "Add"} College
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid gap-4">
            {colleges.map((college) => (
              <Card key={college.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">{college.name}</h4>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCollege(college);
                          setCollegeForm({ name: college.name, code: (college as any).code || '' });
                          setDialogOpen({ ...dialogOpen, college: true });
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteCollege(college.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}