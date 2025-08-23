import { useState } from "react"
import { Eye, Download, Share, FileText, User, MapPin, Phone, Calendar, Building, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface StudentDetailDialogProps {
  student: any
  children?: React.ReactNode
}

export const StudentDetailDialog = ({ student, children }: StudentDetailDialogProps) => {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  // Fetch detailed student data with fees
  const { data: studentDetails, isLoading } = useQuery({
    queryKey: ['student-details', student.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          departments (name, code),
          fees (
            id, amount, paid_amount, due_date, payment_date, 
            academic_year, fee_year, status, payment_method, 
            transaction_id, remarks
          )
        `)
        .eq('id', student.id)
        .single()

      if (error) throw error
      return data
    },
    enabled: open
  })

  const generateInvoice = () => {
    if (!studentDetails) return

    const invoice = {
      studentName: studentDetails.name,
      studentId: studentDetails.student_id,
      college: studentDetails.college,
      department: studentDetails.departments?.name,
      fees: studentDetails.fees || [],
      generatedAt: new Date().toISOString()
    }

    // Create downloadable invoice
    const content = `
HOSTEL MANAGEMENT SYSTEM
INVOICE

Student Details:
Name: ${invoice.studentName}
ID: ${invoice.studentId}
College: ${invoice.college}
Department: ${invoice.department}

Fee Details:
${invoice.fees.map(fee => `
Academic Year: ${fee.academic_year}
Fee Year: ${fee.fee_year}
Amount: ₹${fee.amount}
Paid Amount: ₹${fee.paid_amount || 0}
Balance: ₹${fee.amount - (fee.paid_amount || 0)}
Status: ${fee.status}
Due Date: ${fee.due_date}
Payment Date: ${fee.payment_date || 'Not Paid'}
Payment Method: ${fee.payment_method || 'N/A'}
Transaction ID: ${fee.transaction_id || 'N/A'}
`).join('\n')}

Generated on: ${new Date().toLocaleDateString()}
    `

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice_${studentDetails.student_id}_${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Invoice Downloaded",
      description: "Invoice has been downloaded successfully"
    })
  }

  const shareInvoice = async () => {
    if (!studentDetails) return

    const shareText = `Student Invoice - ${studentDetails.name} (${studentDetails.student_id})\nTotal Fees: ₹${studentDetails.fees?.reduce((sum: number, fee: any) => sum + fee.amount, 0) || 0}\nPaid: ₹${studentDetails.fees?.reduce((sum: number, fee: any) => sum + (fee.paid_amount || 0), 0) || 0}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Student Fee Invoice',
          text: shareText,
        })
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText)
      toast({
        title: "Copied to Clipboard",
        description: "Invoice details copied to clipboard"
      })
    }
  }

  const getTotalFees = () => {
    if (!studentDetails?.fees) return 0
    return studentDetails.fees.reduce((sum: number, fee: any) => sum + fee.amount, 0)
  }

  const getTotalPaid = () => {
    if (!studentDetails?.fees) return 0
    return studentDetails.fees.reduce((sum: number, fee: any) => sum + (fee.paid_amount || 0), 0)
  }

  const getBalance = () => {
    return getTotalFees() - getTotalPaid()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Student Details & Invoice
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="p-8 text-center">Loading student details...</div>
        ) : studentDetails ? (
          <div className="space-y-6">
            {/* Student Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Name:</span>
                    <span>{studentDetails.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Student ID:</span>
                    <span>{studentDetails.student_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Email:</span>
                    <span>{studentDetails.email || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span className="font-medium">Phone:</span>
                    <span>{studentDetails.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span className="font-medium">Parent Phone:</span>
                    <span>{studentDetails.parent_phone || 'Not provided'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span className="font-medium">College:</span>
                    <span>{studentDetails.college}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Department:</span>
                    <span>{studentDetails.departments?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Year:</span>
                    <span>{studentDetails.year}th Year</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Room:</span>
                    <Badge variant="outline">{studentDetails.room_number || 'Not Assigned'}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Address:</span>
                    <span className="text-sm">{studentDetails.address || 'Not provided'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fee Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Fee Summary
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={shareInvoice} variant="outline" size="sm">
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button onClick={generateInvoice} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download Invoice
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <div className="text-2xl font-bold text-primary">₹{getTotalFees()}</div>
                    <div className="text-sm text-muted-foreground">Total Fees</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">₹{getTotalPaid()}</div>
                    <div className="text-sm text-muted-foreground">Amount Paid</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">₹{getBalance()}</div>
                    <div className="text-sm text-muted-foreground">Balance Due</div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Detailed Fee Records */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Fee Details
                  </h4>
                  {studentDetails.fees && studentDetails.fees.length > 0 ? (
                    studentDetails.fees.map((fee: any) => (
                      <Card key={fee.id} className="border-l-4 border-l-primary">
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="font-medium">Academic Year:</span>
                                <span>{fee.academic_year}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Fee Year:</span>
                                <span>{fee.fee_year}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Amount:</span>
                                <span>₹{fee.amount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Paid Amount:</span>
                                <span>₹{fee.paid_amount || 0}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="font-medium">Status:</span>
                                <Badge variant={fee.status === 'paid' ? 'default' : fee.status === 'partial' ? 'secondary' : 'destructive'}>
                                  {fee.status}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Due Date:</span>
                                <span>{new Date(fee.due_date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Payment Date:</span>
                                <span>{fee.payment_date ? new Date(fee.payment_date).toLocaleDateString() : 'Not Paid'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Payment Method:</span>
                                <span>{fee.payment_method || 'N/A'}</span>
                              </div>
                              {fee.transaction_id && (
                                <div className="flex justify-between">
                                  <span className="font-medium">Transaction ID:</span>
                                  <span className="text-xs font-mono">{fee.transaction_id}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {fee.remarks && (
                            <div className="mt-2 pt-2 border-t">
                              <span className="font-medium">Remarks:</span>
                              <p className="text-sm text-muted-foreground mt-1">{fee.remarks}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No fee records found for this student
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="p-8 text-center">Failed to load student details</div>
        )}
      </DialogContent>
    </Dialog>
  )
}