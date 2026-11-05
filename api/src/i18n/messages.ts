// Passenger-facing text the API sends out (emails and PDF receipts) in English, Sinhala and Tamil.
// The UI has its own translations in ui/messages/*.json; keep category and status names in step.

import type { Language, ReportCategory, ReportStatus, ReportType } from "../config/constants.js";

export interface ApiMessages {
  tagline: string;
  statuses: Record<ReportStatus, string>;
  categories: Record<ReportCategory, string>;
  receiptEmail: {
    subject: (receiptId: string, type: ReportType) => string;
    greeting: string;
    thanks: Record<ReportType, string>;
    received: string;
    idLabel: string;
    idHelp: string;
    trackLink: string;
    signOff: string;
    team: string;
    visit: string;
  };
  statusEmail: {
    subject: (receiptId: string, status: string) => string;
    changedTo: (receiptId: string) => string;
    teamMessage: string;
    timelineLink: string;
    ratePrompt: string;
    rateLink: string;
    thanks: string;
  };
  pdf: {
    subtitle: string;
    title: Record<ReportType, [string, string]>;
    reportId: string;
    date: string;
    detailsHeading: Record<ReportType, string>;
    summary: string;
    identifier: string;
    generatedOn: string;
    overview: Record<ReportType, string>;
    busNumber: string;
    routeNumber: string;
    busName: string;
    category: string;
    location: string;
    incidentAt: Record<ReportType, string>;
    reportedOn: string;
    description: Record<ReportType, string>;
    notSpecified: string;
    none: string;
    evidence: string;
    evidenceCount: (count: number) => string;
    imageUnavailable: (name: string) => string;
    submitted: string;
    thanks: Record<ReportType, string>;
    reference: string;
    provideId: (receiptId: string) => string;
    contact: string;
    page: (page: number, total: number) => string;
  };
}

const en: ApiMessages = {
  tagline: "Your Eye on Public Transport",
  statuses: {
    pending: "Pending",
    reviewed: "Reviewed",
    escalated: "Escalated to authorities",
    resolved: "Resolved",
    rejected: "Closed without action",
  },
  categories: {
    reckless_driving: "Reckless / dangerous driving",
    overcharging: "Overcharging / wrong fare",
    no_ticket: "Ticket not issued",
    refused_to_stop: "Refused to stop / skipped halt",
    harassment: "Harassment",
    overcrowding: "Overcrowding",
    loud_music: "Loud music",
    vehicle_condition: "Poor vehicle condition",
    staff_behaviour: "Rude driver / conductor",
    other: "Other",
    safe_driving: "Safe, careful driving",
    helpful_staff: "Kind, helpful crew",
    clean_vehicle: "Clean, well-kept bus",
    on_time: "On time, every halt served",
    fair_fare: "Correct fare and ticket",
  },
  receiptEmail: {
    subject: (id, type) =>
      type === "commendation"
        ? `Thank you for your BusWatch commendation - ID: ${id}`
        : `Your BusWatch Report Receipt - ID: ${id}`,
    greeting: "Hi there!",
    thanks: {
      complaint:
        "Thank you for taking the time to report an issue with public transport. Your vigilance helps us make a real difference!",
      commendation:
        "Thank you for taking the time to recognise good service. We will pass your kind words on to the operator.",
    },
    received:
      "We've successfully received it. For your records, please find your official <strong>receipt attached</strong> to this email.",
    idLabel: "Your Report ID:",
    idHelp:
      "This unique ID helps us track and follow up efficiently. If you need to refer to it later, please use the ID above.",
    trackLink: "Track the status of your report",
    signOff: "Sincerely,",
    team: "The BusWatch Team",
    visit: "Visit us at",
  },
  statusEmail: {
    subject: (id, status) => `Update on your BusWatch report ${id}: ${status}`,
    changedTo: (id) => `The status of your report <strong>${id}</strong> has changed to:`,
    teamMessage: "Message from the BusWatch team:",
    timelineLink: "View your report's full timeline",
    ratePrompt: "Were you satisfied with how this was handled?",
    rateLink: "Rate the outcome (1 to 5 stars)",
    thanks: "Thank you for helping make public transport safer.",
  },
  pdf: {
    subtitle: "Public Transport Monitoring System",
    title: { complaint: ["INCIDENT", "REPORT"], commendation: ["DRIVER", "COMMENDATION"] },
    reportId: "Report ID",
    date: "Date",
    detailsHeading: {
      complaint: "Incident Report Details",
      commendation: "Commendation Details",
    },
    summary: "Report Summary",
    identifier: "Unique Report Identifier",
    generatedOn: "Report Generated On",
    overview: { complaint: "Incident Overview", commendation: "What was good" },
    busNumber: "Bus Number",
    routeNumber: "Route Number",
    busName: "Bus Name",
    category: "Category",
    location: "Location",
    incidentAt: { complaint: "Date & Time of Incident", commendation: "Date & Time of Journey" },
    reportedOn: "Reported On",
    description: { complaint: "Detailed Description", commendation: "What they did well" },
    notSpecified: "Not specified",
    none: "N/A",
    evidence: "Attached Evidence",
    evidenceCount: (n) => `Total ${n} image(s) attached to this report:`,
    imageUnavailable: (name) => `[Image ${name} unavailable or failed to download]`,
    submitted: "Report Successfully Submitted",
    thanks: {
      complaint:
        "Thank you for contributing to safer public transportation. Your report has been recorded and will be reviewed by our team.",
      commendation:
        "Thank you for recognising good service. Your commendation has been recorded and will be shared with the operator.",
    },
    reference: "Need to reference this report?",
    provideId: (id) => `Please provide this Report ID: ${id}`,
    contact: "For follow-up inquiries, contact support@buswatch.example.com",
    page: (page, total) => `Page ${page} of ${total}`,
  },
};

const si: ApiMessages = {
  tagline: "පොදු ප්‍රවාහනය දෙස ඔබේ ඇස",
  statuses: {
    pending: "සලකා බැලීමට නියමිතයි",
    reviewed: "පරීක්ෂා කරන ලදී",
    escalated: "බලධාරීන් වෙත යොමු කරන ලදී",
    resolved: "විසඳන ලදී",
    rejected: "ක්‍රියාමාර්ගයකින් තොරව වසා දමන ලදී",
  },
  categories: {
    reckless_driving: "අවදානම් සහගත ලෙස රිය පැදවීම",
    overcharging: "අධික ගාස්තු / වැරදි ගාස්තු",
    no_ticket: "ප්‍රවේශපත්‍රයක් ලබා නොදීම",
    refused_to_stop: "නැවැත්වීම ප්‍රතික්ෂේප කිරීම / නැවතුම මඟහැරීම",
    harassment: "හිරිහැර කිරීම",
    overcrowding: "අධික තදබදය",
    loud_music: "අධික ශබ්දයෙන් සංගීතය",
    vehicle_condition: "වාහනයේ දුර්වල තත්ත්වය",
    staff_behaviour: "රියැදුරුගේ / කොන්දොස්තරගේ අකාරුණික හැසිරීම",
    other: "වෙනත්",
    safe_driving: "ආරක්ෂිත, සැලකිලිමත් රිය පැදවීම",
    helpful_staff: "කාරුණික, උදව්කාරී කාර්ය මණ්ඩලය",
    clean_vehicle: "පිරිසිදු, හොඳින් නඩත්තු කළ බස් රථය",
    on_time: "නියමිත වේලාවට, සෑම නැවතුමකම නැවැත්වීම",
    fair_fare: "නිවැරදි ගාස්තුව සහ ප්‍රවේශපත්‍රය",
  },
  receiptEmail: {
    subject: (id, type) =>
      type === "commendation"
        ? `ඔබේ BusWatch ප්‍රශංසාවට ස්තූතියි - අංකය: ${id}`
        : `ඔබේ BusWatch පැමිණිලි රිසිට්පත - අංකය: ${id}`,
    greeting: "ආයුබෝවන්!",
    thanks: {
      complaint:
        "පොදු ප්‍රවාහනයේ ගැටලුවක් වාර්තා කිරීමට කාලය ගත කළාට ස්තූතියි. ඔබේ අවධානය සැබෑ වෙනසක් ඇති කිරීමට උපකාරී වේ!",
      commendation:
        "හොඳ සේවාවක් අගය කිරීමට කාලය ගත කළාට ස්තූතියි. ඔබේ කාරුණික වචන අපි බස් රථ හිමිකරු වෙත යොමු කරන්නෙමු.",
    },
    received:
      "අපට එය සාර්ථකව ලැබුණි. ඔබේ වාර්තා සඳහා, නිල <strong>රිසිට්පත මෙම ඊමේලයට අමුණා ඇත</strong>.",
    idLabel: "ඔබේ වාර්තා අංකය:",
    idHelp:
      "මෙම අද්විතීය අංකය මඟින් අපට ඔබේ වාර්තාව කාර්යක්ෂමව පසුවිපරම් කළ හැකිය. පසුව යොමු කිරීමට ඉහත අංකය භාවිත කරන්න.",
    trackLink: "ඔබේ වාර්තාවේ තත්ත්වය බලන්න",
    signOff: "ස්තූතියි,",
    team: "BusWatch කණ්ඩායම",
    visit: "අපගේ වෙබ් අඩවිය",
  },
  statusEmail: {
    subject: (id, status) => `ඔබේ BusWatch වාර්තාව ${id} පිළිබඳ යාවත්කාලීනයක්: ${status}`,
    changedTo: (id) => `ඔබේ වාර්තාව <strong>${id}</strong> හි තත්ත්වය මෙසේ වෙනස් විය:`,
    teamMessage: "BusWatch කණ්ඩායමේ පණිවිඩය:",
    timelineLink: "ඔබේ වාර්තාවේ සම්පූර්ණ කාලරේඛාව බලන්න",
    ratePrompt: "මෙය හසුරුවන ලද ආකාරය ගැන ඔබ සෑහීමකට පත්ද?",
    rateLink: "ප්‍රතිඵලය ශ්‍රේණිගත කරන්න (තරු 1 සිට 5 දක්වා)",
    thanks: "පොදු ප්‍රවාහනය වඩාත් ආරක්ෂිත කිරීමට උදව් කළාට ස්තූතියි.",
  },
  pdf: {
    subtitle: "පොදු ප්‍රවාහන නිරීක්ෂණ පද්ධතිය",
    title: { complaint: ["සිද්ධි", "වාර්තාව"], commendation: ["රියැදුරු", "ප්‍රශංසාව"] },
    reportId: "වාර්තා අංකය",
    date: "දිනය",
    detailsHeading: { complaint: "සිද්ධි වාර්තාවේ විස්තර", commendation: "ප්‍රශංසාවේ විස්තර" },
    summary: "වාර්තා සාරාංශය",
    identifier: "අද්විතීය වාර්තා අංකය",
    generatedOn: "වාර්තාව සකස් කළ දිනය",
    overview: { complaint: "සිද්ධියේ දළ විශ්ලේෂණය", commendation: "හොඳින් කළ දේ" },
    busNumber: "බස් අංකය",
    routeNumber: "මාර්ග අංකය",
    busName: "බස් රථයේ නම",
    category: "වර්ගය",
    location: "ස්ථානය",
    incidentAt: { complaint: "සිද්ධිය වූ දිනය සහ වේලාව", commendation: "ගමනේ දිනය සහ වේලාව" },
    reportedOn: "වාර්තා කළ දිනය",
    description: { complaint: "සවිස්තර විස්තරය", commendation: "ඔවුන් හොඳින් කළ දේ" },
    notSpecified: "සඳහන් කර නැත",
    none: "නැත",
    evidence: "අමුණා ඇති සාක්ෂි",
    evidenceCount: (n) => `මෙම වාර්තාවට ඡායාරූප ${n}ක් අමුණා ඇත:`,
    imageUnavailable: (name) => `[${name} ඡායාරූපය ලබාගත නොහැක]`,
    submitted: "වාර්තාව සාර්ථකව ඉදිරිපත් කරන ලදී",
    thanks: {
      complaint:
        "ආරක්ෂිත පොදු ප්‍රවාහනයක් සඳහා දායක වූවාට ස්තූතියි. ඔබේ වාර්තාව සටහන් කර ඇති අතර අපගේ කණ්ඩායම එය සමාලෝචනය කරනු ඇත.",
      commendation:
        "හොඳ සේවාව අගය කළාට ස්තූතියි. ඔබේ ප්‍රශංසාව සටහන් කර ඇති අතර එය බස් රථ හිමිකරු සමඟ බෙදා ගනු ඇත.",
    },
    reference: "මෙම වාර්තාව යොමු කිරීමට අවශ්‍යද?",
    provideId: (id) => `කරුණාකර මෙම වාර්තා අංකය සඳහන් කරන්න: ${id}`,
    contact: "වැඩිදුර විමසීම් සඳහා support@buswatch.example.com අමතන්න",
    page: (page, total) => `පිටුව ${page} / ${total}`,
  },
};

const ta: ApiMessages = {
  tagline: "பொதுப் போக்குவரத்தின் மீது உங்கள் கண்",
  statuses: {
    pending: "நிலுவையில் உள்ளது",
    reviewed: "பரிசீலிக்கப்பட்டது",
    escalated: "அதிகாரிகளுக்கு அனுப்பப்பட்டது",
    resolved: "தீர்க்கப்பட்டது",
    rejected: "நடவடிக்கை இன்றி மூடப்பட்டது",
  },
  categories: {
    reckless_driving: "அபாயகரமான ஓட்டுதல்",
    overcharging: "அதிக கட்டணம் / தவறான கட்டணம்",
    no_ticket: "பயணச்சீட்டு வழங்கப்படவில்லை",
    refused_to_stop: "நிறுத்த மறுத்தல் / நிறுத்தத்தைத் தவிர்த்தல்",
    harassment: "துன்புறுத்தல்",
    overcrowding: "அளவுக்கு மீறிய நெரிசல்",
    loud_music: "அதிக சத்தமான இசை",
    vehicle_condition: "வாகனத்தின் மோசமான நிலை",
    staff_behaviour: "ஓட்டுநர் / நடத்துநரின் முரட்டுத்தனம்",
    other: "மற்றவை",
    safe_driving: "பாதுகாப்பான, கவனமான ஓட்டுதல்",
    helpful_staff: "அன்பான, உதவிகரமான பணியாளர்கள்",
    clean_vehicle: "சுத்தமான, நன்கு பராமரிக்கப்பட்ட பேருந்து",
    on_time: "சரியான நேரம், எல்லா நிறுத்தங்களிலும் நின்றது",
    fair_fare: "சரியான கட்டணம் மற்றும் பயணச்சீட்டு",
  },
  receiptEmail: {
    subject: (id, type) =>
      type === "commendation"
        ? `உங்கள் BusWatch பாராட்டுக்கு நன்றி - எண்: ${id}`
        : `உங்கள் BusWatch புகார் ரசீது - எண்: ${id}`,
    greeting: "வணக்கம்!",
    thanks: {
      complaint:
        "பொதுப் போக்குவரத்தில் உள்ள பிரச்சினையைப் புகாரளிக்க நேரம் ஒதுக்கியதற்கு நன்றி. உங்கள் விழிப்புணர்வு உண்மையான மாற்றத்தை ஏற்படுத்த உதவுகிறது!",
      commendation:
        "நல்ல சேவையைப் பாராட்ட நேரம் ஒதுக்கியதற்கு நன்றி. உங்கள் அன்பான வார்த்தைகளை பேருந்து உரிமையாளரிடம் தெரிவிப்போம்.",
    },
    received:
      "அது எங்களுக்கு வெற்றிகரமாகக் கிடைத்தது. உங்கள் பதிவுக்காக, அதிகாரப்பூர்வ <strong>ரசீது இந்த மின்னஞ்சலுடன் இணைக்கப்பட்டுள்ளது</strong>.",
    idLabel: "உங்கள் அறிக்கை எண்:",
    idHelp:
      "இந்த தனித்துவமான எண் உங்கள் அறிக்கையைத் திறம்படப் பின்தொடர எங்களுக்கு உதவுகிறது. பின்னர் குறிப்பிட மேலே உள்ள எண்ணைப் பயன்படுத்தவும்.",
    trackLink: "உங்கள் அறிக்கையின் நிலையைப் பார்க்கவும்",
    signOff: "நன்றி,",
    team: "BusWatch குழு",
    visit: "எங்கள் இணையதளம்",
  },
  statusEmail: {
    subject: (id, status) => `உங்கள் BusWatch அறிக்கை ${id} பற்றிய புதுப்பிப்பு: ${status}`,
    changedTo: (id) => `உங்கள் அறிக்கை <strong>${id}</strong> இன் நிலை இவ்வாறு மாறியுள்ளது:`,
    teamMessage: "BusWatch குழுவின் செய்தி:",
    timelineLink: "உங்கள் அறிக்கையின் முழு காலவரிசையைப் பார்க்கவும்",
    ratePrompt: "இது கையாளப்பட்ட விதத்தில் நீங்கள் திருப்தி அடைந்தீர்களா?",
    rateLink: "முடிவை மதிப்பிடுங்கள் (1 முதல் 5 நட்சத்திரங்கள்)",
    thanks: "பொதுப் போக்குவரத்தைப் பாதுகாப்பானதாக்க உதவியதற்கு நன்றி.",
  },
  pdf: {
    subtitle: "பொதுப் போக்குவரத்து கண்காணிப்பு அமைப்பு",
    title: { complaint: ["சம்பவ", "அறிக்கை"], commendation: ["ஓட்டுநர்", "பாராட்டு"] },
    reportId: "அறிக்கை எண்",
    date: "தேதி",
    detailsHeading: { complaint: "சம்பவ அறிக்கை விவரங்கள்", commendation: "பாராட்டு விவரங்கள்" },
    summary: "அறிக்கை சுருக்கம்",
    identifier: "தனித்துவமான அறிக்கை எண்",
    generatedOn: "அறிக்கை உருவாக்கப்பட்ட தேதி",
    overview: { complaint: "சம்பவ கண்ணோட்டம்", commendation: "சிறப்பாகச் செய்தவை" },
    busNumber: "பேருந்து எண்",
    routeNumber: "வழித்தட எண்",
    busName: "பேருந்தின் பெயர்",
    category: "வகை",
    location: "இடம்",
    incidentAt: { complaint: "சம்பவ தேதி மற்றும் நேரம்", commendation: "பயண தேதி மற்றும் நேரம்" },
    reportedOn: "அறிவிக்கப்பட்ட தேதி",
    description: { complaint: "விரிவான விளக்கம்", commendation: "அவர்கள் சிறப்பாகச் செய்தவை" },
    notSpecified: "குறிப்பிடப்படவில்லை",
    none: "இல்லை",
    evidence: "இணைக்கப்பட்ட ஆதாரங்கள்",
    evidenceCount: (n) => `இந்த அறிக்கையுடன் ${n} படம்(கள்) இணைக்கப்பட்டுள்ளன:`,
    imageUnavailable: (name) => `[${name} படம் கிடைக்கவில்லை]`,
    submitted: "அறிக்கை வெற்றிகரமாகச் சமர்ப்பிக்கப்பட்டது",
    thanks: {
      complaint:
        "பாதுகாப்பான பொதுப் போக்குவரத்துக்குப் பங்களித்ததற்கு நன்றி. உங்கள் அறிக்கை பதிவு செய்யப்பட்டுள்ளது, எங்கள் குழு அதைப் பரிசீலிக்கும்.",
      commendation:
        "நல்ல சேவையைப் பாராட்டியதற்கு நன்றி. உங்கள் பாராட்டு பதிவு செய்யப்பட்டு பேருந்து உரிமையாளருடன் பகிரப்படும்.",
    },
    reference: "இந்த அறிக்கையைக் குறிப்பிட வேண்டுமா?",
    provideId: (id) => `தயவுசெய்து இந்த அறிக்கை எண்ணைக் குறிப்பிடவும்: ${id}`,
    contact: "மேலதிக விசாரணைகளுக்கு support@buswatch.example.com ஐத் தொடர்பு கொள்ளவும்",
    page: (page, total) => `பக்கம் ${page} / ${total}`,
  },
};

const MESSAGES: Record<Language, ApiMessages> = { en, si, ta };

export const messagesFor = (lang: Language | null | undefined): ApiMessages =>
  MESSAGES[lang ?? "en"] ?? en;

/** BCP 47 locale used to format dates for each language (Sri Lankan variants). */
export const DATE_LOCALES: Record<Language, string> = { en: "en-LK", si: "si-LK", ta: "ta-LK" };
