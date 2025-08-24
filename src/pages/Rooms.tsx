import React, { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Rooms = () => {
  const queryClient = useQueryClient();
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(`*, departments (name)`)
        .order('room_number', { ascending: true })
      if (error) throw error;
      return data || [];
    },
  });

  // fetch departments for filter
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from('departments').select('*').order('name')
      if (error) throw error
      return data || []
    }
  })

  // local filters
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")
  const [genderFilter, setGenderFilter] = useState("all")
  const [capacityFilter, setCapacityFilter] = useState("all") // all / full / has-space
  const [roomFilter, setRoomFilter] = useState("all");

  // Apply filters to students before grouping
  const filteredStudents = students.filter((s: any) => {
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch = !q || (s.name || "").toLowerCase().includes(q) || (s.student_id || "").toLowerCase().includes(q)
    if (!matchesSearch) return false
    if (departmentFilter !== 'all' && s.department_id !== departmentFilter) return false
    if (yearFilter !== 'all' && String(s.year) !== String(yearFilter)) return false
    if (genderFilter !== 'all' && ((s.gender || '').toLowerCase() !== genderFilter.toLowerCase())) return false
    return true
  })

  // Group filtered students by room number
  const studentsByRoom = filteredStudents.reduce((acc: Record<string, any[]>, student: any) => {
    const room = student.room_number || "Not Assigned";
    if (!acc[room]) acc[room] = [];
    acc[room].push(student);
    return acc;
  }, {});

  // Fetch rooms table for CRUD
  const { data: roomsList = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("*").order("room_number");
      if (error) throw error;
      return data || [];
    },
  });

  // room modal / form state
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [roomForm, setRoomForm] = useState<any>({
    room_number: "",
    capacity: 3,
    floor_number: 1,
    room_type: "standard",
    status: "available",
  });
  const { toast } = useToast();

  // mutations for room create/update/delete
  const roomMutation = useMutation({
    mutationFn: async (roomData: any) => {
      if (editingRoom) {
        const { error } = await supabase.from('rooms').update(roomData).eq('id', editingRoom.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('rooms').insert(roomData)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      setShowRoomModal(false)
      setEditingRoom(null)
      setRoomForm({ room_number: '', capacity: 3, floor_number: 1, room_type: 'standard', status: 'available' })
      toast({ title: 'Success', description: editingRoom ? 'Room updated' : 'Room created' })
    }
  })

  const deleteRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const roomToDelete = roomsList.find((r: any) => r.id === roomId)
      if (roomToDelete) {
        await supabase.from('students').update({ room_number: null }).eq('room_number', roomToDelete.room_number)
      }
      const { error } = await supabase.from('rooms').delete().eq('id', roomId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', 'students'] })
      toast({ title: 'Success', description: 'Room deleted' })
    }
  })

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    roomMutation.mutate(roomForm)
  }

  const handleEditRoom = (room: any) => {
    setEditingRoom(room)
    setRoomForm({
      room_number: room.room_number,
      capacity: room.capacity,
      floor_number: room.floor_number || 1,
      room_type: room.room_type,
      status: room.status
    })
    setShowRoomModal(true)
  }

  const handleDeleteRoom = (roomId: string) => {
    if (window.confirm('Delete room and unassign its students?')) {
      deleteRoomMutation.mutate(roomId)
    }
  }

  // (No allot modal here) — we list rooms in a table and RoomManager handles CRUD/allotment UI.

  // Example: Mark some rooms as full (simulate)
  // You can assign students in DB to make rooms full, or use this for demo:
  // For now, the badge and button logic will reflect actual DB state.

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Rooms</h1>
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0 mb-4">
        <div className="flex-1">
          <Input placeholder="Search by name or student ID" value={searchQuery} onChange={(e:any) => setSearchQuery(e.target.value)} />
        </div>
        <div>
          <Select value={roomFilter} onValueChange={setRoomFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Room" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              {roomsList.map((r: any) => (
                <SelectItem key={r.id} value={r.room_number}>{r.room_number}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d: any) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={capacityFilter} onValueChange={setCapacityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Room Capacity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              <SelectItem value="full">Full (&gt;=3)</SelectItem>
              <SelectItem value="has-space">Has Space (&lt;3)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>


      {/* Room management: Add / Edit / Delete handled here */}
      <div className="flex items-center justify-between my-6">
        <h2 className="text-2xl font-bold mb-2">Room Management</h2>
        <Button onClick={() => { setEditingRoom(null); setRoomForm({ room_number: '', capacity: 3, floor_number: 1, room_type: 'standard', status: 'available' }); setShowRoomModal(true); }} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Room
        </Button>
      </div>


      <Card>
        <CardHeader>
          <CardTitle>Rooms ({roomsList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Departments</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roomsList
                  .filter((room: any) => {
                    if (roomFilter && roomFilter !== 'all' && room.room_number !== roomFilter) return false;
                    const members = studentsByRoom[room.room_number] || [];
                    if (capacityFilter === 'all') return true;
                    if (capacityFilter === 'full') return members.length >= room.capacity;
                    if (capacityFilter === 'has-space') return members.length < room.capacity;
                    return true;
                  })
                  .map((room: any) => {
                    const members = studentsByRoom[room.room_number] || [];
                    return (
                      <TableRow key={room.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{room.room_number}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            {members.length === 0 ? (
                              <span className="text-muted-foreground">No students</span>
                            ) : (
                              members.map((s: any) => (
                                <span key={s.id} className="text-sm">{s.name} <span className="text-xs text-muted-foreground">({s.student_id})</span></span>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{members.length} / {room.capacity}</TableCell>
                        <TableCell>
                          {Array.from(new Set(members.map((m: any) => m.departments?.name).filter(Boolean))).join(', ')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditRoom(room)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteRoom(room.id)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Room Modal */}
      <Dialog open={showRoomModal} onOpenChange={setShowRoomModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRoom ? 'Edit Room' : 'Add Room'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRoomSubmit} className="space-y-4">
            <div>
              <Label htmlFor="room_number">Room Number</Label>
              <Input id="room_number" value={roomForm.room_number} onChange={(e:any) => setRoomForm({ ...roomForm, room_number: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input id="capacity" type="number" value={roomForm.capacity} onChange={(e:any) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) })} min={1} required />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">{editingRoom ? 'Update Room' : 'Create Room'}</Button>
              <Button type="button" variant="outline" onClick={() => { setShowRoomModal(false); setEditingRoom(null); setRoomForm({ room_number: '', capacity: 3, floor_number: 1, room_type: 'standard', status: 'available' }) }}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
  {/* Allot modal removed — use RoomManager for allotment */}
    </div>
  );
};

export default Rooms;