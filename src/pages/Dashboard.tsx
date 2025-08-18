import { Users, DollarSign, AlertCircle, TrendingUp } from "lucide-react"
import { StatCard } from "@/components/StatCard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const Dashboard = () => {
  const stats = [
    {
      title: "Total Students",
      value: "1,247",
      icon: Users,
      description: "Currently enrolled",
      trend: { value: "+12% from last month", isPositive: true }
    },
    {
      title: "Fees Collected",
      value: "₹18.2L",
      icon: DollarSign,
      description: "This academic year",
      trend: { value: "+8% from target", isPositive: true }
    },
    {
      title: "Pending Dues",
      value: "₹2.8L",
      icon: AlertCircle,
      description: "Outstanding payments",
      trend: { value: "-15% from last month", isPositive: true }
    },
    {
      title: "Occupancy Rate",
      value: "94%",
      icon: TrendingUp,
      description: "Current capacity",
      trend: { value: "+2% from last month", isPositive: true }
    }
  ]

  const recentActivities = [
    { id: 1, action: "New student registration", student: "John Doe", department: "Computer Science", time: "2 hours ago" },
    { id: 2, action: "Fee payment received", student: "Jane Smith", amount: "₹45,000", time: "3 hours ago" },
    { id: 3, action: "Room assignment updated", student: "Mike Wilson", room: "A-201", time: "5 hours ago" },
    { id: 4, action: "Outstanding fee reminder sent", student: "Sarah Johnson", time: "1 day ago" },
  ]

  const departmentStats = [
    { department: "Computer Science", students: 342, percentage: 27 },
    { department: "Electrical Engineering", students: 298, percentage: 24 },
    { department: "Mechanical Engineering", students: 276, percentage: 22 },
    { department: "Civil Engineering", students: 198, percentage: 16 },
    { department: "Others", students: 133, percentage: 11 },
  ]

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
                      {activity.department && (
                        <>
                          <span>•</span>
                          <span>{activity.department}</span>
                        </>
                      )}
                      {activity.amount && (
                        <>
                          <span>•</span>
                          <Badge variant="secondary">{activity.amount}</Badge>
                        </>
                      )}
                      {activity.room && (
                        <>
                          <span>•</span>
                          <Badge variant="outline">Room {activity.room}</Badge>
                        </>
                      )}
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