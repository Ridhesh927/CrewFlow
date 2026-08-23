'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Define Zod schema with strict date validation logic
const leaveSchema = z.object({
  leaveType: z.enum(['CASUAL', 'SICK', 'VACATION'], {
    message: 'Please select a valid leave type.'
  }),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters long.'),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: 'End date cannot be prior to start date.',
  path: ['endDate'], // Binds error to the endDate input field
});

export default function LeaveRequestForm({ onSubmitSuccess }: { onSubmitSuccess?: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(leaveSchema),
  });

  const onFormSubmit = async (data: z.infer<typeof leaveSchema>) => {
    try {
      // apiClient POST logic here
      console.log('Valid Form Data:', data);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err) {
      console.error('Submission failed', err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Leave Type</label>
        <select {...register('leaveType')} className="w-full mt-1 border rounded-md p-2">
          <option value="">Select Type</option>
          <option value="CASUAL">Casual Leave</option>
          <option value="SICK">Sick Leave</option>
          <option value="VACATION">Vacation</option>
        </select>
        {errors.leaveType && (
          <p className="text-xs text-red-500 mt-1">{errors.leaveType.message}</p>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input type="date" {...register('startDate')} className="w-full mt-1 border rounded-md p-2" />
          {errors.startDate && (
            <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input type="date" {...register('endDate')} className="w-full mt-1 border rounded-md p-2" />
          {errors.endDate && (
            <p className="text-xs text-red-500 mt-1">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Reason</label>
        <textarea {...register('reason')} rows={3} className="w-full mt-1 border rounded-md p-2" />
        {errors.reason && (
          <p className="text-xs text-red-500 mt-1">{errors.reason.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Request'}
      </button>
    </form>
  );
}
