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
import { supabase } from "@/integrations/supabase/client"
import { useQuery } from "@tanstack/react-query"

const Fees = () => {
  const [academicYear, setAcademicYear] = useState("2024-25")
  const [statusFilter, setStatusFilter] = useState("all")

  // Fetch fees with student and department info
  const { data: feeData = [], isLoading } = useQuery({
    queryKey: ['fees', academicYear, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('fees')
        .select(`
          *,
          students (
            student_id,
            name,
            room_number,
            year,
            departments (name)
          )
        `)
        .eq('academic_year', academicYear)

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    }
  })

  // Calculate fee stats
  const { data: feeStats } = useQuery({
    queryKey: ['fee-stats', academicYear],
    queryFn: async () => {
      const { data: fees, error } = await supabase
        .from('fees')
        .select('amount, paid_amount, status')
        .eq('academic_year', academicYear)

      if (error) throw error

      const totalFees = fees.reduce((sum, fee) => sum + Number(fee.amount), 0)
      const totalPaid = fees.reduce((sum, fee) => sum + Number(fee.paid_amount), 0)
      const totalDue = totalFees - totalPaid
      const paidFees = fees.filter(f => f.status === 'paid').length
      const overdueFees = fees.filter(f => f.status === 'overdue')
      const overdueAmount = overdueFees.reduce((sum, fee) => sum + (Number(fee.amount) - Number(fee.paid_amount)), 0)
      const collectionRate = fees.length > 0 ? Math.round((paidFees / fees.length) * 100) : 0

      return {
        totalPaid,
        totalDue,
        collectionRate,
        overdueAmount
      }
    }
  })

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(0)}K`
    } else {
      return `₹${amount.toLocaleString()}`
    }
  }

  const filteredFeeData = feeData

  const statsData = [
    {
      title: "Total Collected",
      value: formatCurrency(feeStats?.totalPaid || 0),
      icon: DollarSign,
      description: "Current academic year",
      trend: { value: `${feeStats?.collectionRate || 0}% collection rate`, isPositive: true }
    },
    {
      title: "Pending Collection",
      value: formatCurrency(feeStats?.totalDue || 0),
      icon: TrendingDown,
      description: "Outstanding fees",
      trend: { value: "Needs attention", isPositive: false }
    },
    {
      title: "Collection Rate",
      value: `${feeStats?.collectionRate || 0}%`,
      icon: TrendingUp,
      description: "Payment completion",
      trend: { value: "This academic year", isPositive: true }
    },
    {
      title: "Overdue Amount",
      value: formatCurrency(feeStats?.overdueAmount || 0),
      icon: Calendar,
      description: "Past due date",
      trend: { value: "Requires immediate action", isPositive: false }
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-status-success text-white">Paid</Badge>
      case "partial":
        return <Badge className="bg-status-warning text-white">Partial</Badge>
      case "overdue":
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
        {statsData.map((stat, index) => (
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
                  <SelectItem value="2024-25">2024-2025</SelectItem>
                  <SelectItem value="2023-24">2023-2024</SelectItem>
                  <SelectItem value="2022-23">2022-2023</SelectItem>
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4">
                      Loading fees...
                    </TableCell>
                  </TableRow>
                ) : filteredFeeData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4">
                      No fee records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFeeData.map((fee) => {
                    const dueAmount = Number(fee.amount) - Number(fee.paid_amount)
                    return (
                      <TableRow key={fee.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{fee.students?.name}</span>
                            <span className="text-xs text-muted-foreground">{fee.students?.student_id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{fee.students?.departments?.name}</span>
                            <span className="text-xs text-muted-foreground">{fee.students?.year}th Year</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{fee.students?.room_number || 'Not Assigned'}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(fee.amount))}
                        </TableCell>
                        <TableCell className="text-right text-status-success">
                          {formatCurrency(Number(fee.paid_amount))}
                        </TableCell>
                        <TableCell className="text-right">
                          {dueAmount > 0 ? (
                            <span className="text-status-error font-medium">
                              {formatCurrency(dueAmount)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(fee.status)}</TableCell>
                        <TableCell>
                          <span className={`text-sm ${new Date(fee.due_date) < new Date() && dueAmount > 0 ? 'text-status-error' : 'text-foreground'}`}>
                            {new Date(fee.due_date).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                            {dueAmount > 0 && (
                              <Button size="sm" className="bg-primary hover:bg-primary-hover">
                                Pay Now
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Fees