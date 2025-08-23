import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';

interface PersonaOption {
  id: 'super_admin' | 'builder' | 'end_user';
  name: string;
  description: string;
  icon: string;
  color: string;
}

const personaOptions: PersonaOption[] = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Full platform access and management',
    icon: '👑',
    color: 'bg-purple-500',
  },
  {
    id: 'builder',
    name: 'Builder',
    description: 'Create and monetize projects',
    icon: '🛠️',
    color: 'bg-blue-500',
  },
  {
    id: 'end_user',
    name: 'End User',
    description: 'Purchase and implement widgets',
    icon: '🎯',
    color: 'bg-green-500',
  },
];

interface PersonaSelectorProps {
  onPersonaChange?: (persona: string) => void;
  showCurrentPersona?: boolean;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  onPersonaChange,
  showCurrentPersona = true,
}) => {
  const { persona, switchPersona } = useAuth();

  const handlePersonaChange = (newPersona: string) => {
    switchPersona(newPersona);
    onPersonaChange?.(newPersona);
  };

  return (
    <div className="space-y-4">
      {showCurrentPersona && persona && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Current Persona:</span>
          <Badge variant="secondary" className="capitalize">
            {personaOptions.find(p => p.id === persona)?.icon} {persona.replace('_', ' ')}
          </Badge>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {personaOptions.map((option) => (
          <Card 
            key={option.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              persona === option.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handlePersonaChange(option.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${option.color} flex items-center justify-center text-white text-lg`}>
                  {option.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{option.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {option.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                variant={persona === option.id ? "default" : "outline"}
                className="w-full"
                onClick={() => handlePersonaChange(option.id)}
              >
                {persona === option.id ? 'Current' : 'Switch to'} {option.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
