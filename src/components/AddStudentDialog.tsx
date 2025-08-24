import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { supabase } from "@/integrations/supabase/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import CollegeSelect from '@/components/CollegeSelect'

const studentSchema = z.object({
  student_id: z.string().min(1, "Student ID is required"),
  name: z.string().min(1, "Name is required"),
  gender: z.string().min(1, "Gender is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  parent_name: z.string().min(1, "Parent's name is required"),
  parent_phone: z.string().optional(),
  address: z.string().optional(),
  year: z.string().min(1, "Year is required"),
  department_id: z.string().min(1, "Department is required"),
  college: z.string().min(1, "College is required"),
  room_number: z.string().optional(),
})

type StudentFormData = z.infer<typeof studentSchema>

interface AddStudentDialogProps {
  departments: any[]
}

export const AddStudentDialog = ({ departments }: AddStudentDialogProps) => {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch rooms for dropdown
  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("*").order("room_number")
      if (error) throw error
      return data || []
    },
  })

  // Fetch students to compute occupancy (use a separate cache key to avoid clobbering full students data)
  const { data: students = [] } = useQuery({
    queryKey: ["students-mini"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id,room_number")
      if (error) throw error
      return data || []
    },
  })

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      student_id: "",
      name: "",
  gender: "",
      phone: "",
      email: "",
      parent_name: "",
      parent_phone: "",
      address: "",
      year: "",
      department_id: "",
      college: "",
  room_number: "none",
    },
  })

  const onSubmit = async (data: StudentFormData) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.from("students").insert({
        student_id: data.student_id,
        gender: data.gender,
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        parent_name: data.parent_name,
        parent_phone: data.parent_phone || null,
        address: data.address || null,
        year: parseInt(data.year),
        department_id: data.department_id,
        college: data.college,
        room_number: data.room_number && data.room_number !== 'none' ? data.room_number : null,
        admission_date: new Date().toISOString().split('T')[0],
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Student added successfully",
      })

      queryClient.invalidateQueries({ queryKey: ["students"] })
  queryClient.invalidateQueries({ queryKey: ["students-mini"] })
  queryClient.invalidateQueries({ queryKey: ["rooms"] })
      // If assigned to a room, update that room's status depending on occupancy
      const assignedRoom = data.room_number && data.room_number !== 'none' ? data.room_number : null
      if (assignedRoom) {
        try {
          // get current occupancy for that room from server
          const { data: occData, error: occErr } = await supabase.from('students').select('id').eq('room_number', assignedRoom)
          if (occErr) throw occErr
          const occCount = occData ? occData.length : 0
          const room = rooms.find((r: any) => r.room_number === assignedRoom)
          if (room) {
            const status = occCount >= room.capacity ? 'full' : 'available'
            await supabase.from('rooms').update({ status }).eq('room_number', assignedRoom)
            queryClient.invalidateQueries({ queryKey: ['rooms'] })
          }
        } catch (err) {
          // non-fatal — just continue
        }
      }
      form.reset()
      setOpen(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add student",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Add New Student
        </Button>
      </DialogTrigger>
  <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="student_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter student ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parent_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent's Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter parent's name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parent_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent's Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter parent's phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="college"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>College</FormLabel>
                  <CollegeSelect onChange={field.onChange} value={field.value} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
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
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="room_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No Room Assigned</SelectItem>
                      {rooms
                        .filter((room: any) => {
                          const occ = (students || []).filter((s: any) => s.room_number === room.room_number).length
                          return occ < room.capacity
                        })
                        .map((room: any) => {
                          const occ = (students || []).filter((s: any) => s.room_number === room.room_number).length
                          const available = Math.max(0, room.capacity - occ)
                          return (
                            <SelectItem key={room.id} value={room.room_number}>
                              {room.room_number} (capacity : {available})
                            </SelectItem>
                          )
                        })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Student"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}