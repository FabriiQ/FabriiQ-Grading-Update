'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Filter, Plus, Upload, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTable } from "@/components/ui/data-display/data-table";
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';

interface CampusTeachersContentProps {
  campus: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
  searchParams: {
    search?: string;
  };
  isCoordinator?: boolean;
}

export function CampusTeachersContent({
  campus,
  searchParams,
  isCoordinator = false
}: CampusTeachersContentProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(searchParams.search || '');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const basePath = isCoordinator ? '/admin/coordinator' : '/admin/campus';

  // Define columns for the data table
  const teacherColumns = [
    {
      accessorKey: "name",
      header: "Teacher Name",
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
      accessorKey: "specialization",
      header: "Specialization",
    },
    {
      accessorKey: "contact",
      header: "Contact",
      cell: ({ row }: any) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            <span>{row.original.email}</span>
          </div>
          {row.original.phone && (
            <div className="flex items-center text-sm">
              <Phone className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <span>{row.original.phone}</span>
            </div>
          )}
        </div>
      ),
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
          <Link href={`${basePath}/teachers/${row.original.id}`}>
            View
          </Link>
        </Button>
      ),
    },
  ];

  // Fetch real teachers data using tRPC
  const { data: teachersData, isLoading, error } = api.coordinator.getTeachers.useQuery(
    {
      campusId: campus.id,
      search: searchQuery || undefined,
    },
    {
      enabled: !!campus.id,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );

  // Process teachers data when it changes
  useEffect(() => {
    if (teachersData?.teachers) {
      const processedTeachers = teachersData.teachers.map((teacher: any) => ({
        id: teacher.id,
        name: teacher.name || 'Unknown Teacher',
        email: teacher.email || 'No email',
        phone: teacher.phone || 'No phone',
        specialization: teacher.specialization || teacher.subjects?.[0]?.name || 'General',
        classCount: teacher.classes?.length || 0,
        status: teacher.status || 'ACTIVE'
      }));
      setTeachers(processedTeachers);
    }
    setLoading(isLoading);
  }, [teachersData, isLoading]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error("Error fetching teachers:", error);
      setLoading(false);
    }
  }, [error]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);

    router.push(`${basePath}/teachers?${params.toString()}`);
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

  // Filter teachers based on search
  const filteredTeachers = teachers.filter(teacher => {
    return !searchQuery ||
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (teacher.specialization && teacher.specialization.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Management</h1>
          <p className="text-muted-foreground">Manage teachers at {campus.name}</p>
        </div>
        {!isCoordinator && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              asChild
              className="transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Link href={`${basePath}/teachers/import`}>
                <Upload className="mr-2 h-4 w-4" /> Import
              </Link>
            </Button>
            <Button
              asChild
              className="transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Link href={`${basePath}/teachers/new`}>
                <Plus className="mr-2 h-4 w-4" /> Add Teacher
              </Link>
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teacher Management</CardTitle>
          <CardDescription>View and manage teachers for your campus</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search teachers..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" type="submit">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </form>

          <DataTable
            columns={teacherColumns}
            data={filteredTeachers}
            pagination
            isLoading={loading}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredTeachers.length} teachers
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
