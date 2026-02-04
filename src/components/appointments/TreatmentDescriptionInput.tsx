// Treatment Description Input with Autocomplete
// Based on Angular appointment-scheduler component
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Send, Sparkles, TrendingUp } from 'lucide-react';

interface TreatmentDescriptionInputProps {
  onSubmit: (description: string) => void;
  isLoading?: boolean;
  hasTreatmentPlan?: boolean;
}

export function TreatmentDescriptionInput({
  onSubmit,
  isLoading = false,
  hasTreatmentPlan = false,
}: TreatmentDescriptionInputProps) {
  const [description, setDescription] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  // Treatment suggestions - matches Angular implementation
  const treatmentSuggestions = [
    ...(hasTreatmentPlan ? ['Based on the active treatment plan'] : []),
    'Chipped tooth',
    'Toothache',
    'Knocked-out tooth',
    'Lost filling or crown',
    'Abscess',
    'Teeth cleaning',
    'Cavity filling',
    'Root canal',
    'Teeth whitening',
    'Dental crown',
    'Tooth extraction',
    'Gum treatment',
    'Dental bridge',
    'Dental implant',
    'Emergency dental care',
    'Routine checkup',
  ];

  useEffect(() => {
    if (description.length > 0) {
      const filtered = treatmentSuggestions.filter((treatment) =>
        treatment.toLowerCase().includes(description.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions(treatmentSuggestions);
    }
  }, [description, hasTreatmentPlan]);

  const handleSubmit = () => {
    if (description.trim()) {
      onSubmit(description.trim());
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setDescription(suggestion);
    setShowSuggestions(false);
    // Auto-submit when suggestion is selected
    setTimeout(() => onSubmit(suggestion), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <CardTitle>Describe Your Dental Need</CardTitle>
        </div>
        <CardDescription>
          Tell us what you need help with, and we'll find the right appointment type
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasTreatmentPlan && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm font-medium text-primary">
              You have an active treatment plan
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You can schedule based on your treatment plan
            </p>
          </div>
        )}

        <div className="relative">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder="E.g., Teeth cleaning, cavity filling, toothache..."
            className="min-h-[100px] resize-none"
            maxLength={300}
            disabled={isLoading}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {description.length}/300
            </span>
            <Button
              onClick={handleSubmit}
              disabled={!description.trim() || isLoading}
              size="sm"
            >
              {isLoading ? (
                <>Processing...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Find Appointments
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Autocomplete Suggestions */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <Card className="absolute z-10 w-full mt-1 shadow-lg">
            <Command>
              <CommandList className="max-h-[200px]">
                <CommandEmpty>No suggestions found</CommandEmpty>
                <CommandGroup heading="Suggestions">
                  {filteredSuggestions.slice(0, 8).map((suggestion, index) => (
                    <CommandItem
                      key={index}
                      value={suggestion}
                      onSelect={() => handleSuggestionClick(suggestion)}
                      className="cursor-pointer"
                    >
                      <TrendingUp className="w-4 h-4 mr-2 text-primary" />
                      <span>{suggestion}</span>
                      {suggestion === 'Based on the active treatment plan' && (
                        <Badge variant="secondary" className="ml-auto">
                          Treatment Plan
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </Card>
        )}

        {/* Popular Treatments - Quick Chips */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Popular treatments:</p>
          <div className="flex flex-wrap gap-2">
            {['Teeth cleaning', 'Cavity filling', 'Root canal', 'Emergency care'].map((quick) => (
              <Badge
                key={quick}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => handleSuggestionClick(quick)}
              >
                {quick}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
