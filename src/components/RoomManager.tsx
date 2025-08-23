import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Users, Building } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Student {
  id: string;
  name: string;
  student_id: string;
  room_number?: string;
}

interface Room {
  id: string;
  room_number: string;
  capacity: number;
  floor_number?: number;
  room_type: string;
  amenities?: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

const RoomManager = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState({
    room_number: "",
    capacity: 3,
    floor_number: 1,
    room_type: "standard",
    status: "available"
  });

  // Fetch students
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch rooms
  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("*").order("room_number");
      if (error) throw error;
      return data || [];
    },
  });

  // Group students by room number
  const roomsWithStudents = rooms.map(room => {
    const roomStudents = students.filter(student => student.room_number === room.room_number);
    return { ...room, students: roomStudents };
  });

  // Get unassigned students
  const unassignedStudents = students.filter((s: Student) => !s.room_number);

  // Mutation to allot student to room
  const allotStudentMutation = useMutation({
    mutationFn: async ({ studentId, room }: { studentId: string; room: string }) => {
      const { error } = await supabase
        .from("students")
        .update({ room_number: room })
        .eq("id", studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setShowModal(false);
      setSelectedStudentId("");
      setSelectedRoom("");
      toast({ title: "Success", description: "Student allotted to room successfully" });
    },
  });

  // Mutation to create/update room
  const roomMutation = useMutation({
    mutationFn: async (roomData: any) => {
      if (editingRoom) {
        const { error } = await supabase
          .from("rooms")
          .update(roomData)
          .eq("id", editingRoom.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("rooms").insert(roomData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setShowRoomModal(false);
      setEditingRoom(null);
      setRoomForm({ room_number: "", capacity: 3, floor_number: 1, room_type: "standard", status: "available" });
      toast({ 
        title: "Success", 
        description: editingRoom ? "Room updated successfully" : "Room created successfully" 
      });
    },
  });

  // Mutation to delete room
  const deleteRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      // First, unassign students from this room
      const roomToDelete = rooms.find(r => r.id === roomId);
      if (roomToDelete) {
        await supabase
          .from("students")
          .update({ room_number: null })
          .eq("room_number", roomToDelete.room_number);
      }
      
      const { error } = await supabase.from("rooms").delete().eq("id", roomId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", "students"] });
      toast({ title: "Success", description: "Room deleted successfully" });
    },
  });

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    roomMutation.mutate(roomForm);
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomForm({
      room_number: room.room_number,
      capacity: room.capacity,
      floor_number: room.floor_number || 1,
      room_type: room.room_type,
      status: room.status
    });
    setShowRoomModal(true);
  };

  const handleDeleteRoom = (roomId: string) => {
    if (window.confirm("Are you sure you want to delete this room? All students will be unassigned.")) {
      deleteRoomMutation.mutate(roomId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Room Management</h1>
        <Button onClick={() => setShowRoomModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Room
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roomsWithStudents.map((room) => (
          <Card key={room.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Room {room.room_number}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditRoom(room)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteRoom(room.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Badge className={`${room.students.length === room.capacity ? "bg-green-500" : room.students.length > room.capacity ? "bg-red-500" : "bg-orange-500"}`}>
                  <Users className="h-3 w-3 mr-1" />
                  {room.students.length} / {room.capacity}
                </Badge>
                <Badge variant="secondary">{room.room_type}</Badge>
                <Badge variant={room.status === 'available' ? 'default' : room.status === 'maintenance' ? 'destructive' : 'secondary'}>
                  {room.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="text-sm text-muted-foreground mb-2">
                  Floor: {room.floor_number || 'N/A'}
                </div>
              </div>
              
              {room.students.length > room.capacity && (
                <div className="text-red-500 text-sm mb-2">
                  Overcapacity! Max {room.capacity} students allowed.
                </div>
              )}
              
              <ul className="space-y-2 mb-4">
                {room.students.map((student: Student) => (
                  <li key={student.id} className="flex justify-between items-center text-sm">
                    <span>{student.name}</span>
                    <span className="text-xs text-muted-foreground">{student.student_id}</span>
                  </li>
                ))}
                {room.students.length === 0 && (
                  <li className="text-muted-foreground text-sm">No students assigned</li>
                )}
              </ul>
              
              <Button
                className="w-full"
                variant={room.students.length >= room.capacity ? "secondary" : "default"}
                disabled={room.students.length >= room.capacity || room.status !== 'available'}
                onClick={() => {
                  setSelectedRoom(room.room_number);
                  setShowModal(true);
                }}
              >
                {room.students.length >= room.capacity ? "Room Full" : "Allot Student"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Allot Student Modal */}
      {showModal && (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Allot Student to Room: {selectedRoom}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="student">Select Student</Label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedStudents.map((student: Student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} ({student.student_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    allotStudentMutation.mutate({ studentId: selectedStudentId, room: selectedRoom });
                  }}
                  disabled={!selectedStudentId}
                  className="flex-1"
                >
                  Allot Student
                </Button>
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Room Form Modal */}
      {showRoomModal && (
        <Dialog open={showRoomModal} onOpenChange={setShowRoomModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRoomSubmit} className="space-y-4">
              <div>
                <Label htmlFor="room_number">Room Number</Label>
                <Input
                  id="room_number"
                  value={roomForm.room_number}
                  onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })}
                  placeholder="e.g., 101"
                  required
                />
              </div>
              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) })}
                  min="1"
                  max="10"
                  required
                />
              </div>
              <div>
                <Label htmlFor="floor_number">Floor Number</Label>
                <Input
                  id="floor_number"
                  type="number"
                  value={roomForm.floor_number}
                  onChange={(e) => setRoomForm({ ...roomForm, floor_number: parseInt(e.target.value) })}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="room_type">Room Type</Label>
                <Select value={roomForm.room_type} onValueChange={(value) => setRoomForm({ ...roomForm, room_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="deluxe">Deluxe</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={roomForm.status} onValueChange={(value) => setRoomForm({ ...roomForm, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingRoom ? "Update Room" : "Create Room"}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowRoomModal(false);
                  setEditingRoom(null);
                  setRoomForm({ room_number: "", capacity: 3, floor_number: 1, room_type: "standard", status: "available" });
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default RoomManager;