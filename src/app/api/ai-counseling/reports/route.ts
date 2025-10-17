// 통합 보고서 API

import { NextRequest, NextResponse } from 'next/server';
import ReportGenerator from '@/lib/reporting/integrated-report-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, clientId, format = 'json' } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    switch (action) {
      case 'generate_report':
        const report = await ReportGenerator.generateIntegratedReport(clientId);
        
        if (format === 'pdf') {
          const pdfBuffer = await ReportGenerator.exportToPDF(report);
          return new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="counseling-report-${clientId}-${new Date().toISOString().split('T')[0]}.pdf"`
            }
          });
        } else {
          return NextResponse.json({ success: true, data: report });
        }

      case 'export_report':
        const existingReport = body.report;
        if (!existingReport) {
          return NextResponse.json({ error: 'Report data is required' }, { status: 400 });
        }

        if (format === 'pdf') {
          const pdfBuffer = await ReportGenerator.exportToPDF(existingReport);
          return new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="counseling-report-${existingReport.clientId}-${new Date().toISOString().split('T')[0]}.pdf"`
            }
          });
        } else {
          const jsonData = await ReportGenerator.exportToJSON(existingReport);
          return new NextResponse(jsonData, {
            headers: {
              'Content-Type': 'application/json',
              'Content-Disposition': `attachment; filename="counseling-report-${existingReport.clientId}-${new Date().toISOString().split('T')[0]}.json"`
            }
          });
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Report API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    const format = searchParams.get('format') || 'json';

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const report = await ReportGenerator.generateIntegratedReport(parseInt(clientId));
    
    if (format === 'pdf') {
      const pdfBuffer = await ReportGenerator.exportToPDF(report);
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="counseling-report-${clientId}-${new Date().toISOString().split('T')[0]}.pdf"`
        }
      });
    } else {
      return NextResponse.json({ success: true, data: report });
    }
  } catch (error) {
    console.error('Report API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
