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
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

const paymentSchema = z.object({
  paid_amount: z.number().min(1, "Payment amount must be greater than 0"),
  payment_method: z.enum(["cash", "upi", "bank_transfer"], {
    required_error: "Please select payment method",
  }),
  transaction_id: z.string().optional(),
  remarks: z.string().optional(),
}).refine((data) => {
  if (data.payment_method !== "cash") {
    return data.transaction_id && data.transaction_id.length > 0
  }
  return true
}, {
  message: "Transaction ID is required for UPI/Bank Transfer payments",
  path: ["transaction_id"],
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface PaymentDialogProps {
  fee: any
  children?: React.ReactNode
}

export function PaymentDialog({ fee, children }: PaymentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const dueAmount = Number(fee.amount) - Number(fee.paid_amount)

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paid_amount: dueAmount,
      payment_method: "cash",
      transaction_id: "",
      remarks: "",
    },
  })

  const watchPaymentMethod = form.watch("payment_method")

  const onSubmit = async (data: PaymentFormData) => {
    try {
      setLoading(true)

      const newPaidAmount = Number(fee.paid_amount) + data.paid_amount
      const totalAmount = Number(fee.amount)
      const newStatus = newPaidAmount >= totalAmount ? 'paid' : 
                       newPaidAmount > 0 ? 'partial' : 
                       new Date(fee.due_date) < new Date() ? 'overdue' : 'pending'

      const updateData = {
        paid_amount: newPaidAmount,
        payment_method: data.payment_method,
        transaction_id: data.transaction_id || null,
        status: newStatus,
        payment_date: new Date().toISOString().split('T')[0],
        remarks: data.remarks || fee.remarks,
      }

      const { error } = await supabase
        .from('fees')
        .update(updateData)
        .eq('id', fee.id)

      if (error) throw error

      toast.success("Payment processed successfully")
      queryClient.invalidateQueries({ queryKey: ['fees'] })
      queryClient.invalidateQueries({ queryKey: ['fee-stats'] })
      setOpen(false)
      form.reset()
    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error("Failed to process payment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" className="bg-primary hover:bg-primary-hover">
            Pay Now
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
          <DialogDescription>
            Make payment for {fee.students?.name} ({fee.students?.student_id})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Student:</span>
                <span className="text-sm">{fee.students?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Phone:</span>
                <span className="text-sm">{fee.students?.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total Fee:</span>
                <span className="text-sm">₹{Number(fee.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Already Paid:</span>
                <span className="text-sm">₹{Number(fee.paid_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-sm">Due Amount:</span>
                <span className="text-sm text-status-error">₹{dueAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <FormLabel>Payment Amount *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter payment amount"
                        max={dueAmount}
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

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional notes..."
                        rows={2}
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
                  {loading ? "Processing..." : "Process Payment"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}