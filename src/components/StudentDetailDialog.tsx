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

  const generatePdfInvoice = () => {
    if (!studentDetails) return

    const fees = studentDetails.fees || []
    const totalFees = getTotalFees()
    const totalPaid = getTotalPaid()
    const balance = getBalance()

    const rows = fees.map((fee: any) => `
      <tr>
        <td style="padding:8px;border:1px solid #e5e7eb">${fee.academic_year}</td>
        <td style="padding:8px;border:1px solid #e5e7eb">${fee.fee_year}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:right">₹${Number(fee.amount).toLocaleString()}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:right">₹${Number(fee.paid_amount || 0).toLocaleString()}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:right">₹${(Number(fee.amount) - Number(fee.paid_amount || 0)).toLocaleString()}</td>
      </tr>
    `).join('\n')

    const html = `<!doctype html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Invoice - ${studentDetails.student_id}</title>
      <style>
        body{font-family: Arial, Helvetica, sans-serif; color:#111827; padding:24px}
        .header{display:flex;justify-content:space-between;align-items:center}
        .company{font-weight:700;font-size:18px}
        .muted{color:#6b7280}
        table{width:100%;border-collapse:collapse;margin-top:16px}
        th{background:#f3f4f6;padding:8px;border:1px solid #e5e7eb;text-align:left}
        td{padding:8px;border:1px solid #e5e7eb}
        .right{text-align:right}
        .totals{margin-top:12px;width:100%}
        .totals td{border:none;padding:4px}
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="company">Poornaprajna Institute of Management</div>
          <div class="muted">Hostel Management System</div>
        </div>
        <div style="text-align:right">
          <div><strong>Invoice</strong></div>
          <div class="muted">Date: ${new Date().toLocaleDateString()}</div>
          <div class="muted">Invoice ID: INV-${studentDetails.student_id}-${new Date().toISOString().split('T')[0]}</div>
        </div>
      </div>

      <hr style="margin:16px 0;border:none;border-top:1px solid #e5e7eb"/>

      <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap">
        <div>
          <div style="font-weight:600">Billed To</div>
          <div>${studentDetails.name}</div>
          <div class="muted">ID: ${studentDetails.student_id}</div>
          <div class="muted">Gender: ${studentDetails.gender || ''}</div>
          <div class="muted">${studentDetails.email || ''}</div>
          <div class="muted">${studentDetails.phone || ''}</div>
        </div>
        <div>
          <div style="font-weight:600">Details</div>
          <div class="muted">Department: ${studentDetails.departments?.name || ''}</div>
          <div class="muted">Year: ${studentDetails.year || ''}</div>
          <div class="muted">Room: ${studentDetails.room_number || 'Not Assigned'}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Academic Year</th>
            <th>Fee Year</th>
            <th class="right">Amount</th>
            <th class="right">Paid</th>
            <th class="right">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <table class="totals">
        <tr>
          <td></td>
          <td style="text-align:right">Total Fees:</td>
          <td style="text-align:right">₹${totalFees.toLocaleString()}</td>
        </tr>
        <tr>
          <td></td>
          <td style="text-align:right">Total Paid:</td>
          <td style="text-align:right">₹${totalPaid.toLocaleString()}</td>
        </tr>
        <tr>
          <td></td>
          <td style="text-align:right;font-weight:700">Balance Due:</td>
          <td style="text-align:right;font-weight:700">₹${balance.toLocaleString()}</td>
        </tr>
      </table>

  <div style="margin-top:24px;font-size:12px;color:#6b7280">This invoice was generated by HMS - Poornaprajna Institute of Management.</div>
  <div style="margin-top:8px;font-size:12px;color:#6b7280">Developed by Svvaap Innovations and Team</div>
    </body>
    </html>`

    const win = window.open('', '_blank')
    if (!win) {
      toast({ title: 'Popup blocked', description: 'Please allow popups to download PDF' })
      return
    }

    win.document.open()
    win.document.write(html)
    win.document.close()
    // Give the new window a moment to render, then trigger print
    setTimeout(() => {
      try {
        win.focus()
        win.print()
      } catch (err) {
        // ignore
      }
    }, 500)
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
                    <span className="font-medium">Gender:</span>
                    <span>{studentDetails.gender || 'Not specified'}</span>
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
                    <Button onClick={generatePdfInvoice} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
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