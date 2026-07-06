import pptxgen from 'pptxgenjs';
import path from 'path';
import fs from 'fs';
import { IAnalysis } from '../../models/Analysis';
import { AppError } from '../../utils/AppError';

export const generatePPTX = async (analysis: IAnalysis, style: string, whiteLabel: boolean = false): Promise<string> => {
  try {
    const pptx = new pptxgen();

    // Setup style parameters
    let bgColor = 'FFFFFF';
    let textColor = '000000';
    let brandColor = '7C3AED'; // Violet default

    if (style === 'corporate') {
      bgColor = 'F8FAFC'; textColor = '0F172A'; brandColor = '2563EB'; // Blue
    } else if (style === 'startup') {
      bgColor = 'FFFFFF'; textColor = '1E1E24'; brandColor = '8B5CF6'; // Violet
    } else if (style === 'technical') {
      bgColor = '0F172A'; textColor = 'E2E8F0'; brandColor = '38BDF8'; // Light Blue/Dark
    }

    pptx.layout = 'LAYOUT_16x9';

    // Master Slide Definition
    const masterObjects: any[] = [
      { rect: { x: 0, y: 0, w: "100%", h: 0.6, fill: { color: brandColor } } }
    ];

    if (!whiteLabel) {
      masterObjects.push({ 
        text: { 
          text: `SmartPitch AI | ${analysis.repoName}`, 
          options: { x: 0.5, y: '95%', w: '90%', h: 0.5, color: '888888', fontSize: 10, align: 'left'} 
        } 
      });
    }

    pptx.defineSlideMaster({
      title: "MASTER_SLIDE",
      background: { color: bgColor },
      objects: masterObjects
    });

    // 1. Cover Slide
    const coverSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
    coverSlide.addText(analysis.repoName, {
      x: 1, y: 2, w: 8, h: 1.5,
      fontSize: 48, bold: true, color: brandColor, align: 'center'
    });
    coverSlide.addText(analysis.repoDescription || "AI-Generated Executive Pitch", {
      x: 1, y: 3.5, w: 8, h: 1,
      fontSize: 24, color: textColor, align: 'center'
    });

    // 2. Body Slides
    for (const dataSlide of analysis.result.pitchSlides) {
      const slide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
      
      // Title
      slide.addText(dataSlide.title, {
        x: 0.5, y: 0.8, w: 9, h: 1,
        fontSize: 32, bold: true, color: brandColor
      });

      // Content Parsing (Handling bullets and lists)
      const cleanContent = dataSlide.content.replace(/\*\*/g, '');
      const lines = cleanContent.split('\n');
      const textItems: any[] = [];
      
      lines.forEach((line) => {
        const cleanLine = line.trim();
        if (!cleanLine) return;

        if (cleanLine.startsWith('-')) {
          textItems.push({ 
            text: cleanLine.replace(/^-+\s*/, ''), 
            options: { bullet: true, indentLevel: 0, margin: [0, 0, 10, 0] } 
          });
        } else {
          textItems.push({ 
            text: cleanLine, 
            options: { breakLine: true, margin: [0, 0, 15, 0] } 
          });
        }
      });

      slide.addText(textItems, {
        x: 0.5, y: 1.8, w: 9, h: 4.8,
        fontSize: 18, color: textColor, valign: 'top'
      });

      // Speaker Notes
      if (dataSlide.speakerNotes) {
        slide.addNotes(dataSlide.speakerNotes);
      }
    }

    // 3. Red Team Slide
    if (analysis.mode === 'red_team' && analysis.result.investorChallenges?.length) {
      const slide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
      slide.addText("Investor Challenges & Defensibility", {
        x: 0.5, y: 0.8, w: 9, h: 1, fontSize: 32, bold: true, color: brandColor
      });

      let yPos = 2;
      for (const challenge of analysis.result.investorChallenges.slice(0, 3)) { // Max 3 per slide for readability
        slide.addText(`Q: ${challenge.question}`, {
          x: 0.5, y: yPos, w: 9, h: 0.5, fontSize: 16, bold: true, color: textColor
        });
        slide.addText(`A: ${challenge.suggestedAnswer}`, {
          x: 0.5, y: yPos + 0.5, w: 9, h: 0.8, fontSize: 14, color: '666666'
        });
        yPos += 1.5;
      }
    }

    // Generate output
    const exportsDir = path.resolve(__dirname, '../../../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const fileName = `pitch_${analysis._id}_${Date.now()}.pptx`;
    const filePath = path.join(exportsDir, fileName);

    await pptx.writeFile({ fileName: filePath });

    return fileName;
  } catch (error: any) {
    throw new AppError('PPTX Generation failed: ' + error.message, 500);
  }
};
