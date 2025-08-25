import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function EditFeeDialog({ fee, onUpdated }: { fee: any; onUpdated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(fee.amount || "");
  const [paidAmount, setPaidAmount] = useState(fee.paid_amount || "");
  const [dueDate, setDueDate] = useState(fee.due_date ? fee.due_date.split("T")[0] : "");
  const [status, setStatus] = useState(fee.status || "pending");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from("fees").update({
      amount: Number(amount),
      paid_amount: Number(paidAmount),
      due_date: dueDate,
      status,
    }).eq("id", fee.id);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Fee record updated." });
      setOpen(false);
      onUpdated && onUpdated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Edit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Fee Record</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Total Fee</label>
            <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Paid Amount</label>
            <Input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Due Date</label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Status</label>
            <select className="w-full border rounded px-2 py-1" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
