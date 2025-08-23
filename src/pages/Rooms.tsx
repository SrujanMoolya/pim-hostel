import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Rooms = () => {
  const queryClient = useQueryClient();
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Group students by room number
  const rooms = students.reduce((acc, student) => {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(rooms).map(([room, members]) => (
          <Card key={room}>
            <CardHeader>
              <CardTitle>
                Room: {room}
                <Badge className={`ml-2 ${members.length === 3 ? "bg-green-500" : "bg-orange-500"}`}>{members.length} / 3</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {members.length > 3 && (
                <div className="text-red-500 mb-2">Max 3 students allowed!</div>
              )}
              <ul className="space-y-2">
                {members.slice(0, 3).map((student) => (
                  <li key={student.id} className="flex justify-between items-center">
                    <span>{student.name || "No Name"}</span>
                    <span className="text-xs text-muted-foreground">{student.student_id || "N/A"}</span>
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