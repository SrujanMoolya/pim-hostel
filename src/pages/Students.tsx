import { useState } from "react"
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddStudentDialog } from "@/components/AddStudentDialog"
import { EditStudentDialog } from "@/components/EditStudentDialog"
import { StudentDetailDialog } from "@/components/StudentDetailDialog"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/integrations/supabase/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

const Students = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [yearFilter, setYearFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch students with departments
  const { data: studentsData = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          departments (name),
          fees (status, paid_amount, amount)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    }
  })

  // Fetch departments for filter
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name')

      if (error) throw error
      return data || []
    }
  })

  const filteredStudents = studentsData.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.student_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.room_number?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesYear = yearFilter === "all" || student.year.toString() === yearFilter
    const matchesDepartment = departmentFilter === "all" || student.departments?.name === departmentFilter

    return matchesSearch && matchesYear && matchesDepartment
  })

  const getFeeStatus = (fees: any[]) => {
    if (!fees || fees.length === 0) return 'No Fees'
    
    const currentYearFees = fees.filter(f => f.status)
    if (currentYearFees.length === 0) return 'No Fees'
    
    const paidFees = currentYearFees.filter(f => f.status === 'paid')
    const partialFees = currentYearFees.filter(f => f.status === 'partial')
    
    if (paidFees.length === currentYearFees.length) return 'Paid'
    if (partialFees.length > 0 || paidFees.length > 0) return 'Partial'
    return 'Pending'
  }

  const getFeeStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge className="bg-status-success text-white">Paid</Badge>
      case "Pending":
        return <Badge variant="secondary">Pending</Badge>
      case "Overdue":
        return <Badge className="bg-status-error text-white">Overdue</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        const { error } = await supabase
          .from("students")
          .delete()
          .eq("id", studentId)

        if (error) throw error

        toast({
          title: "Success",
          description: "Student deleted successfully",
        })

        queryClient.invalidateQueries({ queryKey: ["students"] })
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete student",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground">
            Manage student records, room assignments, and information
          </p>
        </div>
        <AddStudentDialog departments={departments} />
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, ID, or room number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="1">1st Year</SelectItem>
                <SelectItem value="2">2nd Year</SelectItem>
                <SelectItem value="3">3rd Year</SelectItem>
                <SelectItem value="4">4th Year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Records ({filteredStudents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Fee Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4">
                      Loading students...
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{student.student_id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{student.name}</span>
                          <span className="text-xs text-muted-foreground">
                            Joined: {new Date(student.admission_date || student.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{student.departments?.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{student.college || 'Not Set'}</Badge>
                      </TableCell>
                      <TableCell>{student.year}th Year</TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.room_number || 'Not Assigned'}</Badge>
                      </TableCell>
                      <TableCell>{student.phone || 'N/A'}</TableCell>
                      <TableCell>{getFeeStatusBadge(getFeeStatus(student.fees))}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <StudentDetailDialog student={student}>
              <div className="flex items-center w-full">
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </div>
            </StudentDetailDialog>
          </DropdownMenuItem>
                          <EditStudentDialog student={student} departments={departments}>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Student
                            </DropdownMenuItem>
                          </EditStudentDialog>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteStudent(student.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Student
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Students