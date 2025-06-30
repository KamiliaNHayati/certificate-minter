import React, { useState } from 'react';
import { Award, User, BookOpen, Calendar, FileText, Send } from 'lucide-react';
import { CertificateData } from '../types/certificate';

interface CertificateFormProps {
  onSubmit: (data: CertificateData) => void;
  isLoading: boolean;
}

const CertificateForm: React.FC<CertificateFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<CertificateData>({
    recipientName: '',
    courseName: '',
    issueDate: new Date().toISOString().split('T')[0],
    description: '',
    imageUrl: ''
  });

  const [errors, setErrors] = useState<Partial<CertificateData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CertificateData> = {};

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = 'Recipient name is required';
    }

    if (!formData.courseName.trim()) {
      newErrors.courseName = 'Course name is required';
    }

    if (!formData.issueDate) {
      newErrors.issueDate = 'Issue date is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof CertificateData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-100 rounded-xl">
          <Award className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Certificate</h2>
          <p className="text-gray-600">Fill in the details to mint a new certificate NFT</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient Name */}
        <div>
          <label htmlFor="recipientName" className="block text-sm font-semibold text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Recipient Name
          </label>
          <input
            type="text"
            id="recipientName"
            value={formData.recipientName}
            onChange={(e) => handleInputChange('recipientName', e.target.value)}
            placeholder="Enter the recipient's full name"
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
              errors.recipientName ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.recipientName && (
            <p className="text-red-600 text-sm mt-1">{errors.recipientName}</p>
          )}
        </div>

        {/* Course Name */}
        <div>
          <label htmlFor="courseName" className="block text-sm font-semibold text-gray-700 mb-2">
            <BookOpen className="w-4 h-4 inline mr-2" />
            Course Name
          </label>
          <input
            type="text"
            id="courseName"
            value={formData.courseName}
            onChange={(e) => handleInputChange('courseName', e.target.value)}
            placeholder="Enter the course or program name"
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
              errors.courseName ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.courseName && (
            <p className="text-red-600 text-sm mt-1">{errors.courseName}</p>
          )}
        </div>

        {/* Issue Date */}
        <div>
          <label htmlFor="issueDate" className="block text-sm font-semibold text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Issue Date
          </label>
          <input
            type="date"
            id="issueDate"
            value={formData.issueDate}
            onChange={(e) => handleInputChange('issueDate', e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
              errors.issueDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.issueDate && (
            <p className="text-red-600 text-sm mt-1">{errors.issueDate}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-2" />
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter a description of the achievement or course completion"
            rows={4}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none ${
              errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.description && (
            <p className="text-red-600 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {/* Image URL (Optional) */}
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-semibold text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-2" />
            Certificate Image URL (Optional)
          </label>
          <input
            type="url"
            id="imageUrl"
            value={formData.imageUrl}
            onChange={(e) => handleInputChange('imageUrl', e.target.value)}
            placeholder="https://example.com/certificate-image.jpg"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to use a default certificate image
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Minting Certificate...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Mint Certificate NFT
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CertificateForm;