import { useState } from "react"
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
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

// Sample student data
const studentsData = [
  {
    id: "STU001",
    name: "John Doe",
    department: "Computer Science",
    year: "2nd Year",
    roomNumber: "A-201",
    contact: "+91 9876543210",
    feeStatus: "Paid",
    joinDate: "2023-08-15"
  },
  {
    id: "STU002",
    name: "Jane Smith",
    department: "Electrical Engineering",
    year: "3rd Year",
    roomNumber: "B-105",
    contact: "+91 9876543211",
    feeStatus: "Pending",
    joinDate: "2022-08-20"
  },
  {
    id: "STU003",
    name: "Mike Wilson",
    department: "Mechanical Engineering",
    year: "1st Year",
    roomNumber: "C-301",
    contact: "+91 9876543212",
    feeStatus: "Paid",
    joinDate: "2023-08-25"
  },
  {
    id: "STU004",
    name: "Sarah Johnson",
    department: "Civil Engineering",
    year: "4th Year",
    roomNumber: "A-405",
    contact: "+91 9876543213",
    feeStatus: "Overdue",
    joinDate: "2021-08-10"
  },
  {
    id: "STU005",
    name: "David Brown",
    department: "Computer Science",
    year: "2nd Year",
    roomNumber: "B-202",
    contact: "+91 9876543214",
    feeStatus: "Paid",
    joinDate: "2023-08-18"
  }
]

const Students = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [yearFilter, setYearFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")

  const filteredStudents = studentsData.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesYear = yearFilter === "all" || student.year === yearFilter
    const matchesDepartment = departmentFilter === "all" || student.department === departmentFilter

    return matchesSearch && matchesYear && matchesDepartment
  })

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
        <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Add New Student
        </Button>
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
                <SelectItem value="1st Year">1st Year</SelectItem>
                <SelectItem value="2nd Year">2nd Year</SelectItem>
                <SelectItem value="3rd Year">3rd Year</SelectItem>
                <SelectItem value="4th Year">4th Year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
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
                  <TableHead>Year</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Fee Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{student.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{student.name}</span>
                        <span className="text-xs text-muted-foreground">
                          Joined: {new Date(student.joinDate).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{student.department}</TableCell>
                    <TableCell>{student.year}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.roomNumber}</Badge>
                    </TableCell>
                    <TableCell>{student.contact}</TableCell>
                    <TableCell>{getFeeStatusBadge(student.feeStatus)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Student
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Student
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Students