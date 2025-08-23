import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const rooms = filteredStudents.reduce((acc: Record<string, any[]>, student: any) => {
    const room = student.room_number || "Not Assigned";
    if (!acc[room]) acc[room] = [];
    acc[room].push(student);
    return acc;
  }, {});

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  // Mutation to update student's room_number
  const allotStudentMutation = useMutation({
    mutationFn: async ({ studentId, room }) => {
      const { error } = await supabase
        .from("students")
        .update({ room_number: room })
        .eq("id", studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["students"]);
      setShowModal(false);
      setSelectedStudentId("");
      setSelectedRoom("");
    },
  });

  // Get students not assigned to any room
  const unassignedStudents = students.filter((s) => !s.room_number);

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(rooms)
          .filter(([room, members]) => {
            if (capacityFilter === 'all') return true
            if (capacityFilter === 'full') return members.length >= 3
            if (capacityFilter === 'has-space') return members.length < 3
            return true
          })
          .map(([room, members]) => (
          <Card key={room}>
            <CardHeader>
              <CardTitle>
                Room: {room}
                <Badge className={`ml-2 ${members.length >= 3 ? "bg-green-500" : "bg-orange-500"}`}>{members.length} / 3</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {members.length > 3 && (
                <div className="text-red-500 mb-2">Max 3 students allowed!</div>
              )}
              <ul className="space-y-2">
                {members.map((student) => (
                  <li key={student.id} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{student.name || "No Name"}</div>
                      <div className="text-xs text-muted-foreground">{student.student_id || "N/A"} • {student.gender || 'N/A'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{student.departments?.name || ''}</div>
                      <div className="text-xs text-muted-foreground">Year: {student.year || '-'}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                className="mt-4 px-4 py-2 rounded-full bg-orange-500 text-white font-semibold flex items-center gap-2 disabled:bg-gray-400"
                disabled={members.length >= 3}
                onClick={() => {
                  setSelectedRoom(room);
                  setShowModal(true);
                }}
              >
                {/* Optional: Add an icon here if you want, e.g. a plus sign */}
                Allot Student
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Modal for allotting student */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-80">
            <h2 className="text-lg font-bold mb-4">Allot Student to Room: {selectedRoom}</h2>
            <select
              className="w-full mb-4 p-2 border rounded"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <option value="">Select Student</option>
              {unassignedStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-orange-500 text-white rounded-full"
                disabled={!selectedStudentId}
                onClick={() => {
                  allotStudentMutation.mutate({ studentId: selectedStudentId, room: selectedRoom });
                }}
              >
                Allot
              </button>
              <button
                className="px-4 py-2 bg-gray-300 rounded-full"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;