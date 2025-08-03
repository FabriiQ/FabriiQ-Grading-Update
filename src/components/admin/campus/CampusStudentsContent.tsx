'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Filter, Plus, Upload, MoreHorizontal, Wrench } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-display/data-table";
import { useRouter } from 'next/navigation';
import { api } from "@/trpc/react";

interface CampusStudentsContentProps {
  campus: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
  programCampuses: any[];
  searchParams: {
    search?: string;
    programId?: string;
  };
  isCoordinator?: boolean;
}

export function CampusStudentsContent({
  campus,
  programCampuses,
  searchParams,
  isCoordinator = false
}: CampusStudentsContentProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(searchParams.search || '');
  const [selectedProgramId, setSelectedProgramId] = useState(searchParams.programId || '');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const basePath = isCoordinator ? '/admin/coordinator' : '/admin/campus';

  // Define columns for the data table
  const studentColumns = [
    {
      accessorKey: "name",
      header: "Student Name",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-sm text-muted-foreground">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "enrollmentNumber",
      header: "Enrollment #",
    },
    {
      accessorKey: "program",
      header: "Program",
    },
    {
      accessorKey: "classCount",
      header: "Classes",
      cell: ({ row }: any) => row.original.classCount,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => (
        <Badge variant={row.original.status === "ACTIVE" ? "success" : "secondary"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }: any) => (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`${basePath}/students/${row.original.id}`}>
            View
          </Link>
        </Button>
      ),
    },
  ];

  // Fetch students data using tRPC with pagination
  const { data: studentsResponse, isLoading: isLoadingStudents, error } = api.coordinator.getStudents.useQuery(
    {
      campusId: campus.id,
      search: searchQuery || undefined,
      limit: 50,
      offset: 0
    },
    {
      enabled: !!campus.id,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error("Error fetching students:", error);
        setLoading(false);
      }
    }
  );

  // Update students state when data changes
  useEffect(() => {
    if (studentsResponse?.students) {
      setStudents(studentsResponse.students);
      setLoading(false);
    } else if (error) {
      setStudents([]);
      setLoading(false);
    } else if (isLoadingStudents) {
      setLoading(true);
    }
  }, [studentsResponse, error, isLoadingStudents]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedProgramId) params.set('programId', selectedProgramId);

    router.push(`${basePath}/students?${params.toString()}`);
  };

  // Helper function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Filter students based on search and program
  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchQuery ||
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProgram = !selectedProgramId || student.program === selectedProgramId;

    return matchesSearch && matchesProgram;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
          <p className="text-muted-foreground">Manage students at {campus.name}</p>
        </div>
        {!isCoordinator && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              asChild
              className="transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Link href={`${basePath}/students/import`}>
                <Upload className="mr-2 h-4 w-4" /> Import
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Link href={`${basePath}/students/export`}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Link>
            </Button>
            <Button
              asChild
              className="transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Link href={`${basePath}/students/new`}>
                <Plus className="mr-2 h-4 w-4" /> Add Student
              </Link>
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Management</CardTitle>
          <CardDescription>View and manage students for your campus</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search students..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Programs</SelectItem>
                  {programCampuses.map(pc => (
                    <SelectItem key={pc.program.id} value={pc.program.id}>
                      {pc.program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" type="submit">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </form>

          <DataTable
            columns={studentColumns}
            data={filteredStudents}
            searchField="name"
            pagination
            loading={loading}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredStudents.length} students
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
