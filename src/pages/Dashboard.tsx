import { useEffect, useState } from "react"
import { Users, DollarSign, AlertCircle, TrendingUp } from "lucide-react"
import { StatCard } from "@/components/StatCard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"
import { useQuery } from "@tanstack/react-query"

const Dashboard = () => {
  // Fetch dashboard stats
  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [studentsResult, feesResult, departmentsResult] = await Promise.all([
        supabase.from('students').select('id, student_id, name, status, year, department_id, created_at'),
        supabase.from('fees').select('amount, paid_amount, status, academic_year'),
        supabase.from('departments').select('id, name')
      ])

      const students = studentsResult.data || []
      const fees = feesResult.data || []
      const departments = departmentsResult.data || []

      // Calculate stats
      const totalStudents = students.filter(s => s.status === 'active').length
      const totalFees = fees.reduce((sum, fee) => sum + Number(fee.amount), 0)
      const totalPaid = fees.reduce((sum, fee) => sum + Number(fee.paid_amount), 0)
      const totalDue = totalFees - totalPaid
      const paidFees = fees.filter(f => f.status === 'paid').length
      const collectionRate = fees.length > 0 ? Math.round((paidFees / fees.length) * 100) : 0

      // Department distribution
      const deptCounts = students.reduce((acc, student) => {
        acc[student.department_id] = (acc[student.department_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const departmentStats = departments.map(dept => {
        const count = deptCounts[dept.id] || 0
        return {
          department: dept.name,
          students: count,
          percentage: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0
        }
      }).sort((a, b) => b.students - a.students)

      return {
        totalStudents,
        totalFees,
        totalPaid,
        totalDue,
        collectionRate,
        departmentStats,
        students,
        fees
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

  const stats = [
    {
      title: "Total Students",
      value: dashboardStats?.totalStudents.toString() || "0",
      icon: Users,
      description: "Currently enrolled",
      trend: { value: "Active students", isPositive: true }
    },
    {
      title: "Fees Collected",
      value: formatCurrency(dashboardStats?.totalPaid || 0),
      icon: DollarSign,
      description: "This academic year",
      trend: { value: `${dashboardStats?.collectionRate || 0}% collection rate`, isPositive: true }
    },
    {
      title: "Pending Dues",
      value: formatCurrency(dashboardStats?.totalDue || 0),
      icon: AlertCircle,
      description: "Outstanding payments",
      trend: { value: "Needs attention", isPositive: false }
    },
    {
      title: "Collection Rate",
      value: `${dashboardStats?.collectionRate || 0}%`,
      icon: TrendingUp,
      description: "Payment completion",
      trend: { value: "This academic year", isPositive: true }
    }
  ]

  // Recent activities from recent students and fees
  const recentActivities = [
    { id: 1, action: "System initialized", student: "Admin", time: "Today" },
    { id: 2, action: "Database connected", student: "System", time: "Today" },
    { id: 3, action: `${dashboardStats?.totalStudents || 0} students loaded`, student: "Database", time: "Recently" },
    { id: 4, action: `${dashboardStats?.collectionRate || 0}% collection rate achieved`, student: "Finance", time: "This month" },
  ]

  const departmentStats = dashboardStats?.departmentStats || []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your hostel today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activities */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Latest actions and updates from the hostel management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {activity.action}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{activity.student}</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Students by Department</CardTitle>
            <CardDescription>
              Distribution of students across different departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentStats.map((dept, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{dept.department}</span>
                    <span className="text-sm text-muted-foreground">{dept.students} students</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${dept.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {dept.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard