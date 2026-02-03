// Dynamic Form Page - JSON-driven form renderer
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Save, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/stores/auth-store';
import { useFormStore } from '@/stores/form-store';
import { apiService } from '@/services/api';
import { DynamicFormSection } from '@/components/forms/DynamicFormSection';

export function DynamicFormPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { clientId, patient } = useAuthStore();
  const {
    currentTemplate,
    formData,
    currentSectionIndex,
    isLoading,
    isSaving,
    isSubmitting,
    setCurrentTemplate,
    setCurrentSectionIndex,
    setLoading,
    setSaving,
    setSubmitting,
    resetForm,
    getCurrentSection,
    isFirstSection,
    isLastSection,
    getProgress,
  } = useFormStore();

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (formId) {
      loadFormTemplate();
    }
    return () => resetForm();
  }, [formId]);

  const loadFormTemplate = async () => {
    if (!formId || !clientId) return;

    setLoading(true);
    try {
      const response = await apiService.forms.getTemplate(clientId, formId);
      setCurrentTemplate(response.data);
    } catch (error) {
      console.error('Failed to load form template:', error);
      toast.error('Failed to load form');
      navigate('/dashboard/forms');
    } finally {
      setLoading(false);
    }
  };

  const validateCurrentSection = (): boolean => {
    const section = getCurrentSection();
    if (!section) return true;

    const errors: Record<string, string> = {};

    section.fields.forEach((field) => {
      if (field.required && !formData[field.id]) {
        errors[field.id] = `${field.label} is required`;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentSection()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!isLastSection()) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setValidationErrors({});
    }
  };

  const handleBack = () => {
    if (!isFirstSection()) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      setValidationErrors({});
    }
  };

  const handleSaveDraft = async () => {
    if (!patient || !clientId || !formId) return;

    setSaving(true);
    try {
      await apiService.forms.saveForm(clientId, patient.patientId, formId, {
        sections: formData,
        status: 'draft',
      });
      toast.success('Draft saved successfully');
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentSection()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!patient || !clientId || !formId) return;

    setSubmitting(true);
    try {
      await apiService.forms.submitForm(clientId, patient.patientId, formId, {
        sections: formData,
        signature: formData['signature'] || '',
        date: new Date().toISOString(),
      });
      toast.success('Form submitted successfully!');
      navigate('/dashboard/forms');
    } catch (error) {
      console.error('Failed to submit form:', error);
      toast.error('Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentTemplate) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Form not found</p>
      </div>
    );
  }

  const currentSection = getCurrentSection();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{currentTemplate.title}</h1>
          {currentTemplate.description && (
            <p className="text-muted-foreground mt-1">{currentTemplate.description}</p>
          )}
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard/forms')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                Section {currentSectionIndex + 1} of {currentTemplate.sections.length}
              </span>
              <span className="text-muted-foreground">
                {Math.round(getProgress())}% Complete
              </span>
            </div>
            <Progress value={getProgress()} />
          </div>
        </CardContent>
      </Card>

      {/* Form Section */}
      {currentSection && (
        <DynamicFormSection
          section={currentSection}
          formData={formData}
          validationErrors={validationErrors}
        />
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={isFirstSection() || isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <Button
          variant="outline"
          onClick={handleSaveDraft}
          disabled={isSaving || isSubmitting}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </>
          )}
        </Button>

        {!isLastSection() ? (
          <Button onClick={handleNext} disabled={isSubmitting}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Submit Form
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
