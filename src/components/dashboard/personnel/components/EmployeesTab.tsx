import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Filter, X, LayoutGrid, List } from 'lucide-react';
import { EmployeeForm } from '../EmployeeForm';
import { EmployeeTable } from '../EmployeeTable';
import { EmployeeCard } from '../EmployeeCard';
import { Employee, EmployeeFormData } from '../types';
import { UseFormReturn } from 'react-hook-form';

interface EmployeesTabProps {
  employees: Employee[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  posteFilter: string;
  setPosteFilter: (filter: string) => void;
  viewMode: 'card' | 'list';
  setViewMode: (mode: 'card' | 'list') => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: number) => void;
}

export const EmployeesTab: React.FC<EmployeesTabProps> = ({
  employees,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  posteFilter,
  setPosteFilter,
  viewMode,
  setViewMode,
  onEditEmployee,
  onDeleteEmployee
}) => {
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.noms.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.prenoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.fonction.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || employee.statut_contractuel === statusFilter;
    const matchesPoste = posteFilter === '' || employee.fonction === posteFilter;
    
    return matchesSearch && matchesStatus && matchesPoste;
  });

  const clearFilters = () => {
    setStatusFilter('');
    setPosteFilter('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des Employés</CardTitle>
        <CardDescription>
          Fiches complètes du personnel avec données RH
        </CardDescription>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un employé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filtres
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filtres</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter('Actif')}>
                Employés actifs
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('Congé')}>
                En congé
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setPosteFilter('Pharmacien titulaire')}>
                Pharmaciens titulaires
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPosteFilter('Pharmacien adjoint')}>
                Pharmaciens adjoints
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPosteFilter('Préparateur')}>
                Préparateurs
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Effacer les filtres
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'card' | 'list')}>
            <ToggleGroupItem value="card" aria-label="Vue carte">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Vue liste">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'list' ? (
          <EmployeeTable 
            employees={filteredEmployees}
            onEdit={onEditEmployee}
            onDelete={onDeleteEmployee}
          />
        ) : (
          <EmployeeCard 
            employees={filteredEmployees}
            onEdit={onEditEmployee}
            onDelete={onDeleteEmployee}
          />
        )}
      </CardContent>
    </Card>
  );
};