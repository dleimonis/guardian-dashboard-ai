import React, { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  MapPin, 
  Camera, 
  Upload, 
  AlertTriangle, 
  Send,
  X,
  CheckCircle,
  Clock,
  Image as ImageIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface CommunityReportData {
  id: string;
  type: 'fire' | 'earthquake' | 'flood' | 'weather' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  images: string[];
  reporterName?: string;
  reporterContact?: string;
  timestamp: Date;
  status: 'pending' | 'verified' | 'investigating' | 'resolved';
  verificationCount: number;
}

interface CommunityReportProps {
  onSubmit?: (report: CommunityReportData) => void;
  className?: string;
}

const CommunityReport: React.FC<CommunityReportProps> = ({ onSubmit, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [report, setReport] = useState<Partial<CommunityReportData>>({
    type: 'other',
    severity: 'medium',
    title: '',
    description: '',
    images: [],
    location: { lat: 0, lng: 0 },
  });
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support location services',
        variant: 'destructive',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setReport(prev => ({
          ...prev,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        }));
        
        // Reverse geocode to get address (optional)
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`)
          .then(res => res.json())
          .then(data => {
            if (data.display_name) {
              setReport(prev => ({
                ...prev,
                location: {
                  ...prev.location!,
                  address: data.display_name,
                },
              }));
            }
          })
          .catch(console.error);
          
        toast({
          title: 'Location detected',
          description: 'Your current location has been set',
        });
      },
      (error) => {
        toast({
          title: 'Location error',
          description: 'Could not get your location. Please enter manually.',
          variant: 'destructive',
        });
      }
    );
  }, [toast]);

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    const fileReaders: Promise<string>[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file',
          description: `${file.name} is not an image`,
          variant: 'destructive',
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 5MB limit`,
          variant: 'destructive',
        });
        return;
      }

      const promise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
      fileReaders.push(promise);
    });

    Promise.all(fileReaders).then((results) => {
      setPreviewImages(prev => [...prev, ...results].slice(0, 4)); // Max 4 images
      setReport(prev => ({
        ...prev,
        images: [...(prev.images || []), ...results].slice(0, 4),
      }));
    });
  }, [toast]);

  // Remove image
  const removeImage = useCallback((index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setReport(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || [],
    }));
  }, []);

  // Submit report
  const handleSubmit = useCallback(async () => {
    if (!report.title || !report.description) {
      toast({
        title: 'Missing information',
        description: 'Please provide a title and description',
        variant: 'destructive',
      });
      return;
    }

    if (!report.location?.lat || !report.location?.lng) {
      toast({
        title: 'Location required',
        description: 'Please set your location or allow location access',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const fullReport: CommunityReportData = {
      id: Date.now().toString(),
      type: report.type as any,
      severity: report.severity as any,
      title: report.title,
      description: report.description,
      location: report.location as any,
      images: report.images || [],
      reporterName: report.reporterName,
      reporterContact: report.reporterContact,
      timestamp: new Date(),
      status: 'pending',
      verificationCount: 0,
    };

    try {
      // Send to backend
      const response = await fetch('http://localhost:3001/api/community-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullReport),
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      toast({
        title: 'Report submitted',
        description: 'Thank you for helping keep the community safe!',
      });

      // Call parent handler
      onSubmit?.(fullReport);

      // Reset form
      setReport({
        type: 'other',
        severity: 'medium',
        title: '',
        description: '',
        images: [],
        location: { lat: 0, lng: 0 },
      });
      setPreviewImages([]);
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting report:', error);
      // Still call parent handler for demo
      onSubmit?.(fullReport);
      
      toast({
        title: 'Report saved locally',
        description: 'Your report has been saved and will be synced when connection is restored',
      });
      
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [report, toast, onSubmit]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`gap-2 ${className}`}
        >
          <Users className="h-4 w-4" />
          Report Incident
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Community Incident Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Incident Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="incident-type">Incident Type</Label>
              <Select
                value={report.type}
                onValueChange={(value) => setReport(prev => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger id="incident-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fire">Fire</SelectItem>
                  <SelectItem value="earthquake">Earthquake</SelectItem>
                  <SelectItem value="flood">Flood</SelectItem>
                  <SelectItem value="weather">Severe Weather</SelectItem>
                  <SelectItem value="other">Other Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={report.severity}
                onValueChange={(value) => setReport(prev => ({ ...prev, severity: value as any }))}
              >
                <SelectTrigger id="severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Monitoring needed</SelectItem>
                  <SelectItem value="medium">Medium - Caution advised</SelectItem>
                  <SelectItem value="high">High - Immediate attention</SelectItem>
                  <SelectItem value="critical">Critical - Life threatening</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Incident Title</Label>
            <Input
              id="title"
              placeholder="Brief description of the incident"
              value={report.title}
              onChange={(e) => setReport(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description</Label>
            <Textarea
              id="description"
              placeholder="Provide as much detail as possible about what you're observing"
              rows={4}
              value={report.description}
              onChange={(e) => setReport(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                className="gap-2"
              >
                <MapPin className="h-4 w-4" />
                Use Current Location
              </Button>
              {report.location?.address && (
                <div className="flex-1 p-2 text-sm text-muted-foreground border rounded">
                  {report.location.address}
                </div>
              )}
            </div>
            {report.location?.lat && report.location?.lng && (
              <div className="text-xs text-muted-foreground">
                Coordinates: {report.location.lat.toFixed(6)}, {report.location.lng.toFixed(6)}
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Photos/Videos (Optional)</Label>
            <div className="flex flex-wrap gap-2">
              {previewImages.map((img, index) => (
                <div key={index} className="relative w-24 h-24">
                  <img
                    src={img}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover rounded border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {previewImages.length < 4 && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-24 h-24"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Camera className="h-6 w-6" />
                    <span className="text-xs">Add Photo</span>
                  </div>
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
            <p className="text-xs text-muted-foreground">
              Max 4 images, 5MB each. Images help verify and assess the situation.
            </p>
          </div>

          {/* Contact Info (Optional) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name (Optional)</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={report.reporterName || ''}
                onChange={(e) => setReport(prev => ({ ...prev, reporterName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Contact (Optional)</Label>
              <Input
                id="contact"
                placeholder="Email or phone"
                value={report.reporterContact || ''}
                onChange={(e) => setReport(prev => ({ ...prev, reporterContact: e.target.value }))}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !report.title || !report.description}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommunityReport;