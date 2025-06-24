'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Upload, X, Loader2, ImageIcon } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { ButtonCommon } from '@/src/components/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import { Calendar } from '@/src/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Card, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Alert, AlertDescription } from '@/src/components/ui/alert';
import { useAuthStore } from '@/src/stores/auth.store';
import { streamsCommandApi } from '@/src/apis/streams/command/streams.command.api';

export default function CreateStreamModal({ isOpen, onClose, onStreamCreated }) {
  const user = useAuthStore((s) => s.user);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: null,
    startTime: '12:00',
    thumbnail: null,
  });

  const [errors, setErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const { mutate, isLoading } = useMutation({
    mutationFn: (data) => streamsCommandApi.createStream(data),
    onSuccess: (data) => {
      onStreamCreated(data);
      onClose();
      resetForm();
    },
    onError: (error) => {
      setErrors({ general: 'Failed to create stream. Please try again.' });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: null,
      startTime: '12:00',
      thumbnail: null,
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Stream title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.thumbnail) {
      newErrors.thumbnail = 'Thumbnail image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleDateSelect = (date) => {
    setFormData((prev) => ({ ...prev, startDate: date }));
    if (errors.startDate) {
      setErrors((prev) => ({ ...prev, startDate: '' }));
    }
  };

  const handleTimeChange = (time) => {
    setFormData((prev) => ({ ...prev, startTime: time }));
  };

  const handleFileChange = (file) => {
    if (file && file.type.startsWith('image/')) {
      setFormData((prev) => ({ ...prev, thumbnail: file }));
      if (errors.thumbnail) {
        setErrors((prev) => ({ ...prev, thumbnail: '' }));
      }
    } else {
      setErrors((prev) => ({ ...prev, thumbnail: 'Please select a valid image file' }));
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const removeThumbnail = () => {
    setFormData((prev) => ({ ...prev, thumbnail: null }));
    if (errors.thumbnail) {
      setErrors((prev) => ({ ...prev, thumbnail: '' }));
    }
  };

  const combineDateTime = () => {
    if (!formData.startDate || !formData.startTime) return null;

    const [hours, minutes] = formData.startTime.split(':');
    const combinedDate = new Date(formData.startDate);
    combinedDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return combinedDate;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const startDateTime = combineDateTime();
    if (!startDateTime) return;

    const payload = new FormData();
    payload.append('title', formData.title);
    payload.append('description', formData.description);
    payload.append('startTime', startDateTime.toISOString());
    payload.append('streamerId', user?.id);
    payload.append('thumbnail', formData.thumbnail);

    mutate(payload);
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = format(new Date(2024, 0, 1, hour, minute), 'h:mm a');
        times.push({ value: timeString, label: displayTime });
      }
    }
    return times;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="no-scrollbar max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create New Stream</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <Alert variant="destructive">
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* Stream Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Stream Title *
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="Enter an engaging stream title..."
              value={formData.title}
              onChange={handleInputChange}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-2">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Date *</Label>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <ButtonCommon
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      errors.startDate ? 'border-red-500' : ''
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? (
                      format(formData.startDate, 'PPP')
                    ) : (
                      <span className="text-muted-foreground">Pick a date</span>
                    )}
                  </ButtonCommon>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => {
                      handleDateSelect(date);
                      setPopoverOpen(false);
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
            </div>

            {/* Time Picker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Time</Label>
              <Select value={formData.startTime} onValueChange={handleTimeChange}>
                <SelectTrigger>
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {generateTimeOptions().map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Stream Thumbnail *</Label>

            {!formData.thumbnail ? (
              <div
                className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : errors.thumbnail
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('thumbnail-input')?.click()}
              >
                <input
                  id="thumbnail-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <Upload className="h-6 w-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(formData.thumbnail)}
                        alt="Thumbnail preview"
                        className="h-16 w-24 rounded-lg object-cover"
                      />
                      <ButtonCommon
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0"
                        onClick={removeThumbnail}
                      >
                        <X className="h-3 w-3" />
                      </ButtonCommon>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <ImageIcon className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">{formData.thumbnail.name}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {(formData.thumbnail.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Badge variant="secondary" className="mt-2">
                        Ready to upload
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {errors.thumbnail && <p className="text-sm text-red-500">{errors.thumbnail}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Tell viewers what your stream is about... (optional)"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/500 characters
            </p>
          </div>

          <DialogFooter className="gap-2">
            <ButtonCommon type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </ButtonCommon>
            <ButtonCommon type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Stream...
                </>
              ) : (
                'Create Stream'
              )}
            </ButtonCommon>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
