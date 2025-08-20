import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { supabase } from "@/integrations/supabase/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { DollarSign } from "lucide-react"

const paymentSchema = z.object({
  student_id: z.string().min(1, "Please select a student"),
  academic_year: z.string().min(1, "Please select academic year"),
  fee_year: z.string().min(1, "Please select fee year"),
  amount: z.number().min(1, "Amount must be greater than 0"),
  paid_amount: z.number().min(0, "Paid amount must be 0 or greater"),
  payment_method: z.enum(["cash", "upi", "bank_transfer"], {
    required_error: "Please select payment method",
  }),
  transaction_id: z.string().optional(),
  due_date: z.string().min(1, "Please select due date"),
  remarks: z.string().optional(),
}).refine((data) => {
  if (data.payment_method !== "cash" && data.paid_amount > 0) {
    return data.transaction_id && data.transaction_id.length > 0
  }
  return true
}, {
  message: "Transaction ID is required for UPI/Bank Transfer payments",
  path: ["transaction_id"],
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface RecordPaymentDialogProps {
  children?: React.ReactNode
}

export function RecordPaymentDialog({ children }: RecordPaymentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      academic_year: "2024-25",
      fee_year: "Year 1",
      amount: 0,
      paid_amount: 0,
      payment_method: "cash",
      transaction_id: "",
      remarks: "",
    },
  })

  const watchPaymentMethod = form.watch("payment_method")

  // Fetch students for dropdown
  const { data: students = [] } = useQuery({
    queryKey: ['students-for-payment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, student_id, name, phone, departments(name)')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      return data || []
    }
  })

  const onSubmit = async (data: PaymentFormData) => {
    try {
      setLoading(true)

      const feeData = {
        student_id: data.student_id,
        academic_year: data.academic_year,
        fee_year: data.fee_year,
        amount: data.amount,
        paid_amount: data.paid_amount,
        payment_method: data.payment_method,
        transaction_id: data.transaction_id || null,
        due_date: data.due_date,
        status: data.paid_amount >= data.amount ? 'paid' : data.paid_amount > 0 ? 'partial' : 'pending',
        payment_date: data.paid_amount > 0 ? new Date().toISOString().split('T')[0] : null,
        remarks: data.remarks || null,
      }

      const { error } = await supabase
        .from('fees')
        .insert([feeData])

      if (error) throw error

      toast.success("Payment recorded successfully")
      queryClient.invalidateQueries({ queryKey: ['fees'] })
      queryClient.invalidateQueries({ queryKey: ['fee-stats'] })
      setOpen(false)
      form.reset()
    } catch (error) {
      console.error('Error recording payment:', error)
      toast.error("Failed to record payment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
            <DollarSign className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record New Payment</DialogTitle>
          <DialogDescription>
            Add a new fee record and payment details for a student
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="student_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            <div className="flex flex-col">
                              <span>{student.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {student.student_id} • {student.phone || 'No phone'} • {student.departments?.name}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="academic_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="2024-25">2024-2025</SelectItem>
                        <SelectItem value="2023-24">2023-2024</SelectItem>
                        <SelectItem value="2022-23">2022-2023</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fee_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Year *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Year 1">Year 1</SelectItem>
                        <SelectItem value="Year 2">Year 2</SelectItem>
                        <SelectItem value="Year 3">Year 3</SelectItem>
                        <SelectItem value="Year 4">Year 4</SelectItem>
                        <SelectItem value="Annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Fee Amount *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter total fee amount"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paid_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paid Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter paid amount (0 for no payment)"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchPaymentMethod !== "cash" && (
                <FormField
                  control={form.control}
                  name="transaction_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction ID *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter transaction ID"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional notes..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}