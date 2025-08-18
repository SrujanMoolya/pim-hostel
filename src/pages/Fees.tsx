import { useState } from "react"
import { DollarSign, TrendingUp, TrendingDown, Calendar, Download, Filter } from "lucide-react"
import { StatCard } from "@/components/StatCard"
import { Button } from "@/components/ui/button"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Sample fee data
const feeData = [
  {
    studentId: "STU001",
    studentName: "John Doe",
    department: "Computer Science",
    year: "2nd Year",
    roomNumber: "A-201",
    semesterFee: 45000,
    hostelFee: 25000,
    totalFee: 70000,
    paidAmount: 70000,
    dueAmount: 0,
    status: "Paid",
    dueDate: "2024-01-15",
    paymentDate: "2024-01-10"
  },
  {
    studentId: "STU002",
    studentName: "Jane Smith",
    department: "Electrical Engineering",
    year: "3rd Year",
    roomNumber: "B-105",
    semesterFee: 45000,
    hostelFee: 25000,
    totalFee: 70000,
    paidAmount: 45000,
    dueAmount: 25000,
    status: "Partial",
    dueDate: "2024-01-15",
    paymentDate: "2024-01-12"
  },
  {
    studentId: "STU003",
    studentName: "Mike Wilson",
    department: "Mechanical Engineering",
    year: "1st Year",
    roomNumber: "C-301",
    semesterFee: 45000,
    hostelFee: 25000,
    totalFee: 70000,
    paidAmount: 70000,
    dueAmount: 0,
    status: "Paid",
    dueDate: "2024-01-15",
    paymentDate: "2024-01-08"
  },
  {
    studentId: "STU004",
    studentName: "Sarah Johnson",
    department: "Civil Engineering",
    year: "4th Year",
    roomNumber: "A-405",
    semesterFee: 45000,
    hostelFee: 25000,
    totalFee: 70000,
    paidAmount: 0,
    dueAmount: 70000,
    status: "Overdue",
    dueDate: "2024-01-15",
    paymentDate: null
  }
]

const Fees = () => {
  const [academicYear, setAcademicYear] = useState("2023-2024")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredFeeData = feeData.filter(fee => 
    statusFilter === "all" || fee.status.toLowerCase() === statusFilter
  )

  const feeStats = [
    {
      title: "Total Collected",
      value: "₹18.2L",
      icon: DollarSign,
      description: "Current academic year",
      trend: { value: "+12% from last year", isPositive: true }
    },
    {
      title: "Pending Collection",
      value: "₹2.8L",
      icon: TrendingDown,
      description: "Outstanding fees",
      trend: { value: "-8% from last month", isPositive: true }
    },
    {
      title: "Collection Rate",
      value: "87%",
      icon: TrendingUp,
      description: "Payment completion",
      trend: { value: "+5% from target", isPositive: true }
    },
    {
      title: "Overdue Amount",
      value: "₹95K",
      icon: Calendar,
      description: "Past due date",
      trend: { value: "-15% from last month", isPositive: true }
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge className="bg-status-success text-white">Paid</Badge>
      case "Partial":
        return <Badge className="bg-status-warning text-white">Partial</Badge>
      case "Overdue":
        return <Badge className="bg-status-error text-white">Overdue</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fee Management</h1>
          <p className="text-muted-foreground">
            Track payments, manage dues, and monitor fee collection
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
            <DollarSign className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Fee Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {feeStats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-foreground">Academic Year:</label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023-2024">2023-2024</SelectItem>
                  <SelectItem value="2022-2023">2022-2023</SelectItem>
                  <SelectItem value="2021-2022">2021-2022</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-foreground">Status:</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="ml-auto">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fee Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Records ({filteredFeeData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Department & Year</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead className="text-right">Total Fee</TableHead>
                  <TableHead className="text-right">Paid Amount</TableHead>
                  <TableHead className="text-right">Due Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeeData.map((fee) => (
                  <TableRow key={fee.studentId} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{fee.studentName}</span>
                        <span className="text-xs text-muted-foreground">{fee.studentId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{fee.department}</span>
                        <span className="text-xs text-muted-foreground">{fee.year}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{fee.roomNumber}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(fee.totalFee)}
                    </TableCell>
                    <TableCell className="text-right text-status-success">
                      {formatCurrency(fee.paidAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {fee.dueAmount > 0 ? (
                        <span className="text-status-error font-medium">
                          {formatCurrency(fee.dueAmount)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(fee.status)}</TableCell>
                    <TableCell>
                      <span className={`text-sm ${new Date(fee.dueDate) < new Date() && fee.dueAmount > 0 ? 'text-status-error' : 'text-foreground'}`}>
                        {new Date(fee.dueDate).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {fee.dueAmount > 0 && (
                          <Button size="sm" className="bg-primary hover:bg-primary-hover">
                            Pay Now
                          </Button>
                        )}
                      </div>
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

export default Fees