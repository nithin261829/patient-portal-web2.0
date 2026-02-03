// Dynamic Form Section - Renders a section of form fields
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFormStore } from '@/stores/form-store';
import type { FormSection } from '@/stores/form-store';
import { DynamicField } from './DynamicField';

interface DynamicFormSectionProps {
  section: FormSection;
  formData: Record<string, any>;
  validationErrors: Record<string, string>;
}

export function DynamicFormSection({
  section,
  formData,
  validationErrors,
}: DynamicFormSectionProps) {
  const { updateFieldValue } = useFormStore();

  const handleFieldChange = (fieldId: string, value: any) => {
    updateFieldValue(fieldId, value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{section.title}</CardTitle>
        {section.description && (
          <CardDescription>{section.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {section.fields.map((field) => (
          <DynamicField
            key={field.id}
            field={field}
            value={formData[field.id]}
            error={validationErrors[field.id]}
            onChange={(value) => handleFieldChange(field.id, value)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
