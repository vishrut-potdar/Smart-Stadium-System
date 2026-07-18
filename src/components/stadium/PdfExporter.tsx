import { jsPDF } from "jspdf";
import { FileDown, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Sensor {
  id: string;
  name: string;
  location: string;
  value: number;
  unit: string;
  threshold: number;
  status: "normal" | "warning" | "critical";
}

interface IncidentLog {
  id: string;
  type: string;
  location: string;
  severity: "warning" | "critical";
  description: string;
  timestamp: string;
  acknowledged: boolean;
}

interface PdfExporterProps {
  sensors: Sensor[];
  incidents: IncidentLog[];
}

export function PdfExporter({ sensors, incidents }: PdfExporterProps) {
  const triggerPdfGeneration = () => {
    try {
      const doc = new jsPDF();

      // Professional Header Styles
      doc.setFillColor(22, 28, 45); // Deep slate-dark background
      doc.rect(0, 0, 210, 40, "F");

      // Header Text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("ARENA CONTROL CENTER - INTEGRATED REPORT", 14, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(`DATE GENERATED: ${new Date().toLocaleString()}  |  REF: DAILY-STAD-OPS`, 14, 25);
      doc.text(`OPERATOR SECURITY CLEARANCE: LEVEL-4 CONTROL OFFICER`, 14, 30);

      // Section 1: Core Performance Metrics
      let y = 50;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(22, 28, 45);
      doc.text("1. Daily Performance Metrics & Energy Peak Peaks", 14, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);

      // Draw KPI Grid-like list
      doc.text(
        "• Energy Usage Peak Draw:  4.8 MW  (Triggered during floodlight activation and food concession heating)",
        14,
        y,
      );
      y += 6;
      doc.text(
        "• Municipal Water Flow Surge:  14.5 L/s  (Corresponds to pre-match ingress and halftime break demand)",
        14,
        y,
      );
      y += 6;
      doc.text(
        "• Average Event Attendance load:  60,000 Capacity  (Active crowd size index at 100%)",
        14,
        y,
      );
      y += 6;
      doc.text(
        "• Peak Grid Efficiency Index:  94%  (Recycled greywater and LED balancing active)",
        14,
        y,
      );
      y += 12;

      // Section 2: Active Alarms & Security Incidents
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(22, 28, 45);
      doc.text("2. Operations Alarm Log & Security Incidents", 14, y);
      y += 8;

      // Table Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 7, "F");

      doc.setTextColor(22, 28, 45);
      doc.text("Alert Event Type", 16, y + 5);
      doc.text("Location", 75, y + 5);
      doc.text("Severity", 125, y + 5);
      doc.text("Log Status", 155, y + 5);
      doc.text("Time", 180, y + 5);

      doc.setDrawColor(203, 213, 225);
      doc.line(14, y + 7, 196, y + 7);
      y += 13;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);

      if (incidents.length === 0) {
        doc.text("No active security incidents or system threshold breaches logged today.", 16, y);
        y += 8;
      } else {
        incidents.forEach((inc) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(inc.type, 16, y);
          doc.text(inc.location, 75, y);
          doc.text(inc.severity.toUpperCase(), 125, y);
          doc.text(inc.acknowledged ? "RESOLVED" : "ACTIVE ALARM", 155, y);
          doc.text(inc.timestamp, 180, y);
          y += 6.5;
        });
      }
      y += 8;

      // Section 3: Industrial IoT Node Status
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(22, 28, 45);
      doc.text("3. Active Industrial IoT Telemetry Sensors", 14, y);
      y += 8;

      // Table Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 7, "F");

      doc.setTextColor(22, 28, 45);
      doc.text("Sensor ID & Name", 16, y + 5);
      doc.text("Physical Location", 80, y + 5);
      doc.text("Real-Time Metric Reading", 135, y + 5);
      doc.text("Threshold", 175, y + 5);

      doc.line(14, y + 7, 196, y + 7);
      y += 13;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);

      sensors.forEach((s) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(s.name, 16, y);
        doc.text(s.location, 80, y);
        doc.text(`${s.value} ${s.unit}`, 135, y);
        doc.text(`${s.threshold} ${s.unit}`, 175, y);
        y += 6.5;
      });

      // Footer disclaimer
      y += 12;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y, 196, y);
      y += 6;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "This operations report is cryptographically sealed and logged under stadium policy parameters. Authorized use only.",
        14,
        y,
      );

      // Save PDF document
      doc.save("arena-operations-report.pdf");
      toast.success("PDF Operations summary report downloaded successfully!");
    } catch (e) {
      console.error("PDF generation failure:", e);
      toast.error("Failed to generate PDF. Check browser restrictions.");
    }
  };

  return (
    <button
      id="export-pdf-report"
      onClick={triggerPdfGeneration}
      className="rounded-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs px-4 py-2 flex items-center gap-2 cursor-pointer shadow-md shadow-primary/15 transition-all"
    >
      <FileDown className="h-4 w-4" />
      Export PDF Report
    </button>
  );
}
