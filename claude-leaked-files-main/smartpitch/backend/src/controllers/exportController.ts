import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../middleware/auth';
import { Analysis } from '../models/Analysis';
import { Export } from '../models/Export';
import { generatePDF } from '../services/export/pdfGenerator';
import { generatePPTX } from '../services/export/pptxGenerator';
import { AppError } from '../utils/AppError';

export const createExport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { analysisId, type, style = 'startup' } = req.body;
    console.log(`[EXPORT_DEBUG] User ${req.user!.id} Plan ${req.user!.plan} requesting ${type} for Analysis ${analysisId}`);
    
    if (!analysisId || !['pdf', 'pptx'].includes(type)) {
      return next(new AppError('Analysis ID and valid type (pdf/pptx) are required', 400));
    }

    const analysis = await Analysis.findOne({ _id: analysisId, userId: req.user!.id });
    if (!analysis || analysis.status !== 'completed') {
      console.log(`[EXPORT_DEBUG] Analysis ${analysisId} not found or not completed`);
      return next(new AppError('Analysis not found or not yet completed', 404));
    }

    if (!analysis.result?.pitchSlides?.length) {
      console.log(`[EXPORT_DEBUG] Analysis ${analysisId} has no pitch slides!`);
      return next(new AppError('This analysis has no pitch slides. Please re-analyze the repository.', 400));
    }

    // Check plan limitations
    if (type === 'pptx' && req.user!.plan === 'hacker') {
      return next(new AppError('PPTX export requires Founder or Agency plan', 403));
    }

    const whiteLabel = req.user!.plan === 'agency';
    let fileName = '';
    try {
      if (type === 'pdf') {
        fileName = await generatePDF(analysis, style, whiteLabel);
      } else if (type === 'pptx') {
        fileName = await generatePPTX(analysis, style, whiteLabel);
      }
      console.log(`[EXPORT_DEBUG] Successfully generated ${fileName} (WhiteLabel: ${whiteLabel})`);
    } catch (genErr: any) {
      console.error(`[EXPORT_DEBUG] Generation Error: ${genErr.message}`);
      return next(new AppError(`Export failed: ${genErr.message}`, 500));
    }

    const exportsDir = path.resolve(__dirname, '../../exports');
    const filePath = path.join(exportsDir, fileName);
    const stats = fs.statSync(filePath);

    const newExport = await Export.create({
      userId: req.user!.id,
      analysisId: analysis._id,
      type,
      style,
      fileName,
      filePath,
      fileSize: stats.size,
      whiteLabel: req.user!.plan === 'agency',
    });

    res.status(201).json({
      status: 'success',
      data: {
        exportId: newExport._id,
        downloadUrl: `/api/export/${newExport._id}/download`
      }
    });

  } catch (err) {
    next(err);
  }
};

export const downloadExport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const exportRecord = await Export.findOne({ _id: req.params.id, userId: req.user!.id });
    
    if (!exportRecord) {
      return next(new AppError('Export not found', 404));
    }

    if (!fs.existsSync(exportRecord.filePath)) {
      return next(new AppError('File has expired or was removed. Please generate it again.', 404));
    }

    exportRecord.downloadCount += 1;
    await exportRecord.save();

    res.download(exportRecord.filePath, exportRecord.fileName);
  } catch (err) {
    next(err);
  }
};
