import { redirect } from "next/navigation";

// Road incidents are filed on the main report form now; old links open it with "Another vehicle"
export default function ReportIncidentPage() {
  redirect("/submit-report?subject=vehicle");
}
