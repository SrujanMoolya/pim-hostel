import { useState } from "react"
import { Download, Plus, Search, Filter, TrendingUp, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
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
import { useToast } from "@/hooks/use-toast"
import { StatCard } from "@/components/StatCard"

const Income = () => {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    id: "",
    incomeType: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    description: ""
  })

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Add form submission logic here
    toast({
      title: "Income Added",
      description: "New income record has been added successfully.",
    })
    setIsAddDialogOpen(false)
  }

  // Fetch income data
  const { data: incomeData, isLoading } = useQuery({
    queryKey: ['income'],
    queryFn: async () => {
      // This will be replaced with actual API call once the database is set up
      return []
    }
  })

  // Stats for the income dashboard
  const statsData = [
    {
      title: "Total Income",
      value: "₹0",
      icon: TrendingUp,
      description: "Current month",
      trend: { value: "0% from last month", isPositive: true }
    },
    {
      title: "Hostel Fees",
      value: "₹0",
      icon: DollarSign,
      description: "Current month",
      trend: { value: "0% from last month", isPositive: true }
    },
    {
      title: "Program Income",
      value: "₹0",
      icon: TrendingUp,
      description: "Current month",
      trend: { value: "0% from last month", isPositive: true }
    },
    {
      title: "Other Income",
      value: "₹0",
      icon: DollarSign,
      description: "Current month",
      trend: { value: "0% from last month", isPositive: true }
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Income Management</h1>
          <p className="text-muted-foreground">
            Track and manage all hostel income sources
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Income
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Income</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="id">ID</Label>
                  <Input
                    id="id"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="Enter ID"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incomeType">Income Type</Label>
                  <Select
                    value={formData.incomeType}
                    onValueChange={(value) => setFormData({ ...formData, incomeType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Income Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fees">Hostel Fees</SelectItem>
                      <SelectItem value="program">Program</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="Enter Amount"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter Description"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Add Income</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Income Stats */}
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
              <Input 
                placeholder="Search income..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="fees">Hostel Fees</SelectItem>
                <SelectItem value="program">Program</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Income Table */}
      <Card>
        <CardHeader>
          <CardTitle>Income Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Added By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No income records found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default Income