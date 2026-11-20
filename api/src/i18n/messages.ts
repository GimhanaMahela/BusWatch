// Passenger-facing text the API sends out (emails and PDF receipts) in English, Sinhala and Tamil.
// The UI has its own translations in ui/messages/*.json; keep category and status names in step.

import type {
  AccidentInvolvement,
  BusService,
  Commendee,
  InjuryLevel,
  Language,
  ReportCategory,
  ReportStatus,
  ReportType,
  RoadHazard,
  VehicleKind,
} from "../config/constants.js";

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
  codeEmail: {
    subject: (code: string) => string;
    intro: string;
    expires: (minutes: number) => string;
    ignore: string;
  };
  messageEmail: {
    subject: (receiptId: string) => string;
    intro: (receiptId: string) => string;
    replyLink: string;
    operatorSubject: (receiptId: string) => string;
    operatorIntro: (receiptId: string, organisation: string | null) => string;
  };
  sms: {
    code: (code: string, minutes: number) => string;
    received: (receiptId: string) => string;
    status: (receiptId: string, status: string) => string;
    message: (receiptId: string) => string;
    operator: (receiptId: string) => string;
    link: (url: string) => string;
  };
  push: {
    statusTitle: string;
    statusBody: (receiptId: string, status: string) => string;
    messageTitle: string;
    messageBody: (receiptId: string) => string;
    operatorTitle: string;
    operatorBody: (receiptId: string) => string;
  };
  telegram: {
    linked: (receiptId: string) => string;
    welcome: string;
    invalidLink: string;
    stopped: string;
  };
  whatsapp: {
    welcome: string;
    welcomeNoAi: (url: string) => string;
    /** Reply-button titles: WhatsApp allows 20 characters */
    buttons: {
      report: string;
      commend: string;
      track: string;
      follow: string;
      send: string;
      change: string;
      cancel: string;
    };
    reportPrompt: string;
    commendPrompt: string;
    trackPrompt: string;
    notFound: (id: string) => string;
    status: (id: string, status: string, date: string) => string;
    teamMessages: (count: number) => string;
    followPrompt: string;
    followed: (id: string) => string;
    alreadyFollowing: (id: string) => string;
    mediaAdded: (photos: number, videos: number) => string;
    mediaFull: string;
    locationAdded: string;
    voiceTooLong: string;
    unsupported: string;
    aiBusy: string;
    tooMany: string;
    checkTitle: Record<ReportType, string>;
    labels: {
      category: string;
      bus: string;
      route: string;
      place: string;
      when: string;
      media: string;
      pin: string;
      description: string;
    };
    mediaCount: (photos: number, videos: number) => string;
    checkFooter: string;
    missing: string;
    changePrompt: string;
    cancelled: string;
    sent: (id: string) => string;
    sentLink: (url: string) => string;
    mediaFailed: string;
    sendFailed: string;
    receiptCaption: (id: string) => string;
    stopped: string;
  };
  /** Road incidents: the vehicle, accident and road problem (PDF receipt) */
  road: {
    vehicle: string;
    plate: string;
    colourMake: string;
    accident: string;
    injuries: string;
    vehiclesInvolved: string;
    hazard: string;
    vehicleKinds: Record<VehicleKind, string>;
    involvement: Record<AccidentInvolvement, string>;
    injuryLevels: Record<InjuryLevel, string>;
    hazards: Record<RoadHazard, string>;
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
    busService: string;
    busServices: Record<BusService, string>;
    /** Commendations: who the passenger thanked */
    commendee: string;
    commendees: Record<Commendee, string>;
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
    accessibility: "Accessibility (elderly / disabled passengers)",
    other: "Other",
    safe_driving: "Safe, careful driving",
    helpful_staff: "Kind, helpful crew",
    clean_vehicle: "Clean, well-kept bus",
    on_time: "On time, every halt served",
    fair_fare: "Correct fare and ticket",
    helped_passenger: "Helped a passenger in need",
    comfortable_service: "Comfortable, well-run service",
    bag: "Bag",
    phone: "Phone",
    wallet: "Wallet / purse",
    documents: "Documents / ID",
    keys: "Keys",
    clothing: "Clothing / umbrella",
    speeding: "Speeding",
    drunk_driving: "Drunk driving",
    red_light: "Jumping a red light",
    wrong_side: "Driving on the wrong side",
    dangerous_overtaking: "Dangerous overtaking",
    phone_while_driving: "Phone use while driving",
    no_helmet: "No helmet",
    road_rage: "Road rage / threats",
    unsafe_load: "Overloaded or unsecured load",
    smoke_emission: "Black smoke",
    noisy_exhaust: "Loud or modified exhaust",
    illegal_parking: "Illegal parking / blocking the road",
    hit_and_run: "Hit and run",
    accident: "Accident",
    road_hazard: "Road hazard",
  },
  receiptEmail: {
    subject: (id, type) =>
      type === "road_incident"
        ? `Your TransitX road incident report - ID: ${id}`
        : type === "lost_item"
          ? `Your TransitX lost item report - ID: ${id}`
          : type === "commendation"
            ? `Thank you for your TransitX commendation - ID: ${id}`
            : `Your TransitX Report Receipt - ID: ${id}`,
    greeting: "Hi there!",
    thanks: {
      complaint:
        "Thank you for taking the time to report an issue with public transport. Your vigilance helps us make a real difference!",
      commendation:
        "Thank you for taking the time to recognise good service. We will pass your kind words on to the operator.",
      lost_item:
        "We're sorry you lost something. We'll pass the details to the bus operator where we can, and let you know as soon as we hear anything.",
      road_incident:
        "Thank you for reporting this road incident. Your report helps make roads safer for everyone. Our team will review it and let you know what happens.",
    },
    received:
      "We've successfully received it. For your records, please find your official <strong>receipt attached</strong> to this email.",
    idLabel: "Your Report ID:",
    idHelp:
      "This unique ID helps us track and follow up efficiently. If you need to refer to it later, please use the ID above.",
    trackLink: "Track the status of your report",
    signOff: "Sincerely,",
    team: "The TransitX Team",
    visit: "Visit us at",
  },
  statusEmail: {
    subject: (id, status) => `Update on your TransitX report ${id}: ${status}`,
    changedTo: (id) => `The status of your report <strong>${id}</strong> has changed to:`,
    teamMessage: "Message from the TransitX team:",
    timelineLink: "View your report's full timeline",
    ratePrompt: "Were you satisfied with how this was handled?",
    rateLink: "Rate the outcome (1 to 5 stars)",
    thanks: "Thank you for helping make public transport safer.",
  },
  codeEmail: {
    subject: (code) => `${code} is your TransitX sign-in code`,
    intro: 'Use this code to open "My reports" on TransitX:',
    expires: (minutes) => `It works once and expires in ${minutes} minutes.`,
    ignore:
      "If you didn't ask for it, you can ignore this email. Nobody can sign in without the code.",
  },
  messageEmail: {
    subject: (id) => `New message about your TransitX report ${id}`,
    intro: (id) => `The TransitX team sent you a message about your report <strong>${id}</strong>:`,
    replyLink: "Read and reply",
    operatorSubject: (id) => `The bus operator replied about your TransitX report ${id}`,
    operatorIntro: (id, organisation) =>
      `${organisation ?? "The bus operator"} replied about your report <strong>${id}</strong>:`,
  },
  sms: {
    code: (code, minutes) =>
      `TransitX: your sign-in code is ${code}. It expires in ${minutes} minutes. Never share it.`,
    received: (id) => `TransitX: we received your report. Your receipt ID is ${id}.`,
    status: (id, status) => `TransitX: your report ${id} is now "${status}".`,
    message: (id) => `TransitX: the team sent you a message about report ${id}.`,
    operator: (id) => `TransitX: the bus operator replied about your report ${id}.`,
    link: (url) => ` Details: ${url}`,
  },
  push: {
    statusTitle: "Your report was updated",
    statusBody: (id, status) => `${id} is now: ${status}`,
    messageTitle: "New message from TransitX",
    messageBody: (id) => `About your report ${id}. Tap to read and reply.`,
    operatorTitle: "The bus operator replied",
    operatorBody: (id) => `About your report ${id}. Tap to read it.`,
  },
  telegram: {
    linked: (id) =>
      `You're following TransitX report ${id}. We'll message you here when its status changes or the team writes to you. Send /stop to stop.`,
    welcome:
      "Hi! This bot sends updates about your TransitX reports. Open your report's tracking page and tap “Get updates on Telegram” to follow it here.",
    invalidLink:
      "This link has expired or isn't valid. Open your report's tracking page and tap “Get updates on Telegram” again.",
    stopped:
      "Done. You won't get any more TransitX updates here. You can follow a report again from its tracking page.",
  },
  whatsapp: {
    welcome:
      "Hi, this is TransitX 🚌 You can report a problem on a bus or praise a driver, conductor or bus service right here, in English, සිංහල or தமிழ். Just tell me what happened. You can also send photos, a voice note or your location.\n\nTo check a report, send its receipt ID (like BW-2026-ABC123).\n\nIn an emergency call 119.",
    welcomeNoAi: (url) =>
      `Hi, this is TransitX 🚌 Send a receipt ID (like BW-2026-ABC123) to check a report and get updates here. To report a problem, use the form: ${url}`,
    buttons: {
      report: "Report a problem",
      commend: "Praise good service",
      track: "Track a report",
      follow: "Get updates here",
      send: "Send report",
      change: "Change something",
      cancel: "Cancel",
    },
    reportPrompt:
      "I'm sorry that happened. Tell me in your own words: what happened, the bus number (from the number plate, like NB-1234), the route, and where and when. You can type or send a voice note, plus photos or videos.",
    commendPrompt:
      "Lovely! Who would you like to thank: the driver, the conductor or the bus service? Tell me what they did well, plus the bus number and the route.",
    trackPrompt: "Send me your receipt ID. It looks like BW-2026-ABC123.",
    notFound: (id) =>
      `I couldn't find a report with the receipt ID ${id}. Please check it and try again.`,
    status: (id, status, date) => `Report *${id}*\nStatus: *${status}*\nUpdated: ${date}`,
    teamMessages: (count) =>
      `The team has sent you ${count} message${count === 1 ? "" : "s"}: read and reply on the tracking page.`,
    followPrompt: "Want updates about this report here on WhatsApp?",
    followed: (id) =>
      `Done ✅ We'll message you here when report ${id} changes or the team writes to you. Send STOP to stop all updates.`,
    alreadyFollowing: (id) => `You already get updates about ${id} here.`,
    mediaAdded: (photos, videos) =>
      `Got it 📎 (${photos} photo${photos === 1 ? "" : "s"}, ${videos} video${videos === 1 ? "" : "s"} so far). They'll go with your report.`,
    mediaFull: "That's the most I can attach (5 photos and 2 videos). The rest wasn't added.",
    locationAdded: "📍 Location added to your report.",
    voiceTooLong: "That voice note is too long for me. Please send a shorter one or type it.",
    unsupported: "Sorry, I can read text, photos, videos, voice notes and shared locations.",
    aiBusy: "Sorry, I'm busy right now. Please try again in a minute.",
    tooMany: "You've sent a lot of messages. Please wait a while and try again.",
    checkTitle: {
      complaint: "Please check your report:",
      commendation: "Please check your commendation:",
      lost_item: "Please check your lost item report:",
      road_incident: "Please check your road incident report:",
    },
    labels: {
      category: "Type",
      bus: "Bus",
      route: "Route",
      place: "Place",
      when: "When",
      media: "Attached",
      pin: "Map pin",
      description: "What happened",
    },
    mediaCount: (photos, videos) =>
      [
        photos && `${photos} photo${photos === 1 ? "" : "s"}`,
        videos && `${videos} video${videos === 1 ? "" : "s"}`,
      ]
        .filter(Boolean)
        .join(", "),
    checkFooter: "Press Send report if it's right.",
    missing:
      "The report still needs what happened, the bus number and the route (and the place for a complaint). Please tell me those first.",
    changePrompt: "Sure, what would you like to change?",
    cancelled: "OK, I've thrown that report away. Write to me any time.",
    sent: (id) =>
      `Thank you 🙏 Your report is sent.\nReceipt ID: *${id}*\n\nWe'll message you here when it's reviewed or the team needs more details. Send STOP to stop updates.`,
    sentLink: (url) => `\nTrack it: ${url}`,
    mediaFailed:
      "Some photos or videos couldn't be attached. You can tell the team in a reply on the tracking page.",
    sendFailed:
      "Sorry, I couldn't send your report just now. Please press Send report again in a moment.",
    receiptCaption: (id) => `TransitX receipt ${id}`,
    stopped:
      "Done. You won't get any more TransitX updates here, and I've forgotten our chat. Write any time to start again.",
  },
  road: {
    vehicle: "Vehicle",
    plate: "Number plate",
    colourMake: "Colour / make",
    accident: "Accident",
    injuries: "Injuries",
    vehiclesInvolved: "Vehicles involved",
    hazard: "Road problem",
    vehicleKinds: {
      car: "Car",
      van: "Van",
      lorry: "Lorry / truck",
      tipper: "Tipper / heavy vehicle",
      three_wheeler: "Three-wheeler",
      motorcycle: "Motorcycle",
      private_bus: "Tour or staff bus (not on a route)",
      school_van: "School van / bus",
      taxi: "Taxi / ride-hailing car",
      government: "Government vehicle",
      tractor: "Tractor / farm vehicle",
      unknown: "Not sure",
    },
    involvement: {
      involved: "I was involved",
      witness: "I saw it happen",
    },
    injuryLevels: {
      none: "No one hurt",
      minor: "Minor injuries",
      serious: "Serious injuries",
      unknown: "Not sure",
    },
    hazards: {
      pothole: "Pothole / broken road",
      broken_signal: "Traffic light not working",
      streetlight_out: "Street lights out",
      flooding: "Flooding",
      fallen_tree: "Fallen tree or branch",
      landslide: "Landslide / rocks on the road",
      missing_sign: "Missing or damaged sign",
      debris: "Debris or oil on the road",
      animals: "Animals on the road",
      other: "Something else",
    },
  },
  pdf: {
    subtitle: "Public Transport Monitoring System",
    title: {
      complaint: ["INCIDENT", "REPORT"],
      commendation: ["GOOD SERVICE", "COMMENDATION"],
      lost_item: ["LOST", "ITEM"],
      road_incident: ["ROAD", "INCIDENT"],
    },
    reportId: "Report ID",
    date: "Date",
    detailsHeading: {
      complaint: "Incident Report Details",
      commendation: "Commendation Details",
      lost_item: "Lost Item Details",
      road_incident: "Road Incident Details",
    },
    summary: "Report Summary",
    identifier: "Unique Report Identifier",
    generatedOn: "Report Generated On",
    overview: {
      complaint: "Incident Overview",
      commendation: "What was good",
      lost_item: "The lost item",
      road_incident: "What happened",
    },
    busNumber: "Bus Number",
    routeNumber: "Route Number",
    busName: "Bus Name",
    busService: "Bus service",
    busServices: {
      private: "Private bus",
      sltb: "SLTB bus (government)",
      metro: "Metro Bus",
    },
    commendee: "Thanking",
    commendees: {
      driver: "The driver",
      conductor: "The conductor",
      crew: "The driver and conductor",
      service: "The bus service as a whole",
    },
    category: "Category",
    location: "Location",
    incidentAt: {
      complaint: "Date & Time of Incident",
      commendation: "Date & Time of Journey",
      lost_item: "Date & Time of Journey",
      road_incident: "Date & Time of Incident",
    },
    reportedOn: "Reported On",
    description: {
      complaint: "Detailed Description",
      commendation: "What they did well",
      lost_item: "Description of the item",
      road_incident: "Detailed Description",
    },
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
      lost_item:
        "Your lost item report has been recorded. We'll share it with the bus operator and let you know if the item is found.",
      road_incident:
        "Thank you for helping make our roads safer. Your report has been recorded and will be reviewed by our team. Keep this receipt if you need it for the police or an insurance claim.",
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
    accessibility: "ප්‍රවේශ්‍යතාව (වැඩිහිටි / ආබාධිත මගීන්)",
    other: "වෙනත්",
    safe_driving: "ආරක්ෂිත, සැලකිලිමත් රිය පැදවීම",
    helpful_staff: "කාරුණික, උදව්කාරී කාර්ය මණ්ඩලය",
    clean_vehicle: "පිරිසිදු, හොඳින් නඩත්තු කළ බස් රථය",
    on_time: "නියමිත වේලාවට, සෑම නැවතුමකම නැවැත්වීම",
    fair_fare: "නිවැරදි ගාස්තුව සහ ප්‍රවේශපත්‍රය",
    helped_passenger: "උදව් අවශ්‍ය මගියෙකුට උදව් කළා",
    comfortable_service: "සුවපහසු, හොඳින් පවත්වාගෙන යන සේවාව",
    bag: "බෑගය",
    phone: "දුරකථනය",
    wallet: "පසුම්බිය",
    documents: "ලේඛන / හැඳුනුම්පත",
    keys: "යතුරු",
    clothing: "ඇඳුම් / කුඩය",
    speeding: "අධික වේගය",
    drunk_driving: "බීමතින් රිය පැදවීම",
    red_light: "රතු එළිය නොසලකා යාම",
    wrong_side: "වැරදි පැත්තෙන් ධාවනය",
    dangerous_overtaking: "අනතුරුදායක ලෙස ඉස්සර කිරීම",
    phone_while_driving: "රිය පදවන අතරතුර දුරකථන භාවිතය",
    no_helmet: "ආරක්ෂිත හිස්වැසුම් නොමැතිව",
    road_rage: "මාර්ගයේ කෝපය / තර්ජන",
    unsafe_load: "අධික හෝ නොබැඳි භාණ්ඩ",
    smoke_emission: "කළු දුම් පිටවීම",
    noisy_exhaust: "ඝෝෂාකාරී හෝ වෙනස් කළ සයිලන්සරය",
    illegal_parking: "නීති විරෝධී නැවැත්වීම / මාර්ගය අවහිර කිරීම",
    hit_and_run: "ගැටී පලා යාම",
    accident: "අනතුර",
    road_hazard: "මාර්ග අවදානම",
  },
  receiptEmail: {
    subject: (id, type) =>
      type === "road_incident"
        ? `ඔබේ TransitX මාර්ග සිද්ධි වාර්තාව - අංකය: ${id}`
        : type === "lost_item"
          ? `ඔබේ TransitX නැතිවූ භාණ්ඩ වාර්තාව - අංකය: ${id}`
          : type === "commendation"
            ? `ඔබේ TransitX ප්‍රශංසාවට ස්තූතියි - අංකය: ${id}`
            : `ඔබේ TransitX පැමිණිලි රිසිට්පත - අංකය: ${id}`,
    greeting: "ආයුබෝවන්!",
    thanks: {
      complaint:
        "පොදු ප්‍රවාහනයේ ගැටලුවක් වාර්තා කිරීමට කාලය ගත කළාට ස්තූතියි. ඔබේ අවධානය සැබෑ වෙනසක් ඇති කිරීමට උපකාරී වේ!",
      commendation:
        "හොඳ සේවාවක් අගය කිරීමට කාලය ගත කළාට ස්තූතියි. ඔබේ කාරුණික වචන අපි බස් රථ හිමිකරු වෙත යොමු කරන්නෙමු.",
      lost_item:
        "ඔබේ භාණ්ඩයක් නැති වීම ගැන අපි කනගාටු වෙමු. හැකි සෑම විටම අපි විස්තර බස් රථ හිමිකරු වෙත යොමු කරන අතර, යමක් දැනගත් වහාම ඔබට දන්වන්නෙමු.",
      road_incident:
        "මෙම මාර්ග සිද්ධිය වාර්තා කළාට ස්තූතියි. ඔබේ වාර්තාව සැමට ආරක්ෂිත මාර්ග ඇති කිරීමට උපකාරී වේ. අපගේ කණ්ඩායම එය සමාලෝචනය කර, සිදුවන දේ ඔබට දන්වනු ඇත.",
    },
    received: "අපට එය සාර්ථකව ලැබුණි. ඔබේ වාර්තා සඳහා, නිල <strong>රිසිට්පත මෙම ඊමේලයට අමුණා ඇත</strong>.",
    idLabel: "ඔබේ වාර්තා අංකය:",
    idHelp:
      "මෙම අද්විතීය අංකය මඟින් අපට ඔබේ වාර්තාව කාර්යක්ෂමව පසුවිපරම් කළ හැකිය. පසුව යොමු කිරීමට ඉහත අංකය භාවිත කරන්න.",
    trackLink: "ඔබේ වාර්තාවේ තත්ත්වය බලන්න",
    signOff: "ස්තූතියි,",
    team: "TransitX කණ්ඩායම",
    visit: "අපගේ වෙබ් අඩවිය",
  },
  statusEmail: {
    subject: (id, status) => `ඔබේ TransitX වාර්තාව ${id} පිළිබඳ යාවත්කාලීනයක්: ${status}`,
    changedTo: (id) => `ඔබේ වාර්තාව <strong>${id}</strong> හි තත්ත්වය මෙසේ වෙනස් විය:`,
    teamMessage: "TransitX කණ්ඩායමේ පණිවිඩය:",
    timelineLink: "ඔබේ වාර්තාවේ සම්පූර්ණ කාලරේඛාව බලන්න",
    ratePrompt: "මෙය හසුරුවන ලද ආකාරය ගැන ඔබ සෑහීමකට පත්ද?",
    rateLink: "ප්‍රතිඵලය ශ්‍රේණිගත කරන්න (තරු 1 සිට 5 දක්වා)",
    thanks: "පොදු ප්‍රවාහනය වඩාත් ආරක්ෂිත කිරීමට උදව් කළාට ස්තූතියි.",
  },
  codeEmail: {
    subject: (code) => `${code} ඔබේ TransitX පිවිසුම් කේතයයි`,
    intro: 'TransitX හි "මගේ වාර්තා" විවෘත කිරීමට මෙම කේතය භාවිත කරන්න:',
    expires: (minutes) => `එය එක් වරක් පමණක් ක්‍රියා කරන අතර මිනිත්තු ${minutes} කින් කල් ඉකුත් වේ.`,
    ignore: "ඔබ මෙය ඉල්ලුවේ නැත්නම්, මෙම ඊමේලය නොසලකා හරින්න. කේතය නොමැතිව කිසිවෙකුට පිවිසිය නොහැක.",
  },
  messageEmail: {
    subject: (id) => `ඔබේ TransitX වාර්තාව ${id} පිළිබඳ නව පණිවිඩයක්`,
    intro: (id) => `TransitX කණ්ඩායම ඔබේ වාර්තාව <strong>${id}</strong> පිළිබඳව ඔබට පණිවිඩයක් එවා ඇත:`,
    replyLink: "කියවා පිළිතුරු දෙන්න",
    operatorSubject: (id) => `ඔබේ TransitX වාර්තාව ${id} ගැන බස් රථ හිමිකරු පිළිතුරු දී ඇත`,
    operatorIntro: (id, organisation) =>
      `ඔබේ වාර්තාව <strong>${id}</strong> ගැන ${organisation ?? "බස් රථ හිමිකරු"} පිළිතුරු දී ඇත:`,
  },
  sms: {
    code: (code, minutes) =>
      `TransitX: ඔබේ පිවිසුම් කේතය ${code}. මිනිත්තු ${minutes} කින් කල් ඉකුත් වේ. කිසිවෙකුට නොදෙන්න.`,
    received: (id) => `TransitX: ඔබේ වාර්තාව අපට ලැබුණි. ඔබේ රිසිට්පත් අංකය ${id}.`,
    status: (id, status) => `TransitX: ඔබේ වාර්තාව ${id} දැන් "${status}".`,
    message: (id) => `TransitX: වාර්තාව ${id} පිළිබඳව කණ්ඩායම ඔබට පණිවිඩයක් එවා ඇත.`,
    operator: (id) => `TransitX: ඔබේ වාර්තාව ${id} ගැන බස් රථ හිමිකරු පිළිතුරු දී ඇත.`,
    link: (url) => ` විස්තර: ${url}`,
  },
  push: {
    statusTitle: "ඔබේ වාර්තාව යාවත්කාලීන විය",
    statusBody: (id, status) => `${id} දැන්: ${status}`,
    messageTitle: "TransitX වෙතින් නව පණිවිඩයක්",
    messageBody: (id) => `ඔබේ වාර්තාව ${id} ගැන. කියවා පිළිතුරු දීමට තට්ටු කරන්න.`,
    operatorTitle: "බස් රථ හිමිකරු පිළිතුරු දුන්නා",
    operatorBody: (id) => `ඔබේ වාර්තාව ${id} ගැන. කියවීමට තට්ටු කරන්න.`,
  },
  telegram: {
    linked: (id) =>
      `ඔබ දැන් TransitX වාර්තාව ${id} අනුගමනය කරයි. එහි තත්ත්වය වෙනස් වූ විට හෝ කණ්ඩායම ඔබට පණිවිඩයක් එවූ විට අපි මෙහි ඔබට දන්වන්නෙමු. නැවැත්වීමට /stop යවන්න.`,
    welcome:
      "ආයුබෝවන්! මෙම බොට් ඔබේ TransitX වාර්තා පිළිබඳ යාවත්කාලීන තොරතුරු එවයි. ඔබේ වාර්තාවේ ලුහුබැඳීමේ පිටුව විවෘත කර “Telegram හරහා යාවත්කාලීන ලබාගන්න” තට්ටු කරන්න.",
    invalidLink:
      "මෙම සබැඳිය කල් ඉකුත් වී ඇත හෝ වලංගු නැත. ඔබේ වාර්තාවේ ලුහුබැඳීමේ පිටුව විවෘත කර “Telegram හරහා යාවත්කාලීන ලබාගන්න” නැවත තට්ටු කරන්න.",
    stopped:
      "හරි. ඔබට තවදුරටත් මෙහි TransitX යාවත්කාලීන නොලැබේ. ලුහුබැඳීමේ පිටුවෙන් ඕනෑම වේලාවක වාර්තාවක් නැවත අනුගමනය කළ හැක.",
  },
  whatsapp: {
    welcome:
      "ආයුබෝවන්, මෙය TransitX 🚌 බස් රථයක ගැටලුවක් වාර්තා කිරීමට හෝ රියදුරෙකුට, කොන්දොස්තරවරයෙකුට හෝ බස් සේවාවකට ප්‍රශංසා කිරීමට මෙතැනින්ම පුළුවන්, සිංහලෙන්, English හෝ தமிழ் භාෂාවෙන්. සිදු වූ දේ මට කියන්න. ඡායාරූප, හඬ පණිවිඩයක් හෝ ඔබේ ස්ථානයද එවිය හැක.\n\nවාර්තාවක් පරීක්ෂා කිරීමට එහි රිසිට්පත් අංකය (BW-2026-ABC123 වැනි) එවන්න.\n\nහදිසි අවස්ථාවකදී 119 අමතන්න.",
    welcomeNoAi: (url) =>
      `ආයුබෝවන්, මෙය TransitX 🚌 වාර්තාවක් පරීක්ෂා කර මෙහි යාවත්කාලීන ලබා ගැනීමට රිසිට්පත් අංකය (BW-2026-ABC123 වැනි) එවන්න. ගැටලුවක් වාර්තා කිරීමට පෝරමය භාවිතා කරන්න: ${url}`,
    buttons: {
      report: "පැමිණිල්ලක් කරන්න",
      commend: "සේවාවට ප්‍රශංසා",
      track: "වාර්තාව බලන්න",
      follow: "මෙහි දැනුම් දෙන්න",
      send: "වාර්තාව යවන්න",
      change: "වෙනස් කරන්න",
      cancel: "අවලංගු කරන්න",
    },
    reportPrompt:
      "එය සිදු වීම ගැන කණගාටුයි. ඔබේම වචනවලින් කියන්න: සිදු වූ දේ, බස් අංකය (අංක තහඩුවේ ඇති, NB-1234 වැනි), මාර්ගය, සහ කොහේද කවදාද යන්න. ටයිප් කරන්න හෝ හඬ පණිවිඩයක් එවන්න; ඡායාරූප හෝ වීඩියෝද එවිය හැක.",
    commendPrompt:
      "ඉතා හොඳයි! ඔබ ස්තුති කිරීමට කැමති කාටද: රියදුරු, කොන්දොස්තර හෝ බස් සේවාව? ඔවුන් හොඳින් කළේ කුමක්ද, බස් අංකය සහ මාර්ගය කියන්න.",
    trackPrompt: "ඔබේ රිසිට්පත් අංකය එවන්න. එය BW-2026-ABC123 වැනි ය.",
    notFound: (id) => `${id} රිසිට්පත් අංකය සහිත වාර්තාවක් හමු නොවීය. කරුණාකර පරීක්ෂා කර නැවත උත්සාහ කරන්න.`,
    status: (id, status, date) => `වාර්තාව *${id}*\nතත්ත්වය: *${status}*\nයාවත්කාලීන කළේ: ${date}`,
    teamMessages: (count) => `කණ්ඩායම ඔබට පණිවිඩ ${count}ක් එවා ඇත: ලුහුබැඳීමේ පිටුවේ කියවා පිළිතුරු දෙන්න.`,
    followPrompt: "මෙම වාර්තාව ගැන යාවත්කාලීන මෙහි WhatsApp හරහා ලබා ගන්නද?",
    followed: (id) =>
      `හරි ✅ වාර්තාව ${id} වෙනස් වූ විට හෝ කණ්ඩායම ඔබට ලියූ විට අපි මෙහි දන්වන්නෙමු. සියලු යාවත්කාලීන නැවැත්වීමට STOP යවන්න.`,
    alreadyFollowing: (id) => `ඔබට දැනටමත් ${id} ගැන යාවත්කාලීන මෙහි ලැබේ.`,
    mediaAdded: (photos, videos) =>
      `ලැබුණා 📎 (මෙතෙක් ඡායාරූප ${photos}, වීඩියෝ ${videos}). ඒවා ඔබේ වාර්තාව සමඟ යවනු ලැබේ.`,
    mediaFull: "මට එකතු කළ හැකි උපරිමය එයයි (ඡායාරූප 5 සහ වීඩියෝ 2). ඉතිරිය එකතු නොකළා.",
    locationAdded: "📍 ස්ථානය ඔබේ වාර්තාවට එකතු කළා.",
    voiceTooLong: "එම හඬ පණිවිඩය මට දිග වැඩියි. කෙටි එකක් එවන්න හෝ ටයිප් කරන්න.",
    unsupported: "සමාවන්න, මට කියවිය හැක්කේ පෙළ, ඡායාරූප, වීඩියෝ, හඬ පණිවිඩ සහ ස්ථාන පමණි.",
    aiBusy: "සමාවන්න, මම දැන් කාර්යබහුලයි. විනාඩියකින් නැවත උත්සාහ කරන්න.",
    tooMany: "ඔබ පණිවිඩ බොහොමයක් එවා ඇත. ටික වේලාවකින් නැවත උත්සාහ කරන්න.",
    checkTitle: {
      complaint: "කරුණාකර ඔබේ වාර්තාව පරීක්ෂා කරන්න:",
      commendation: "කරුණාකර ඔබේ ප්‍රශංසාව පරීක්ෂා කරන්න:",
      lost_item: "කරුණාකර ඔබේ නැතිවූ භාණ්ඩ වාර්තාව පරීක්ෂා කරන්න:",
      road_incident: "කරුණාකර ඔබේ මාර්ග සිද්ධි වාර්තාව පරීක්ෂා කරන්න:",
    },
    labels: {
      category: "වර්ගය",
      bus: "බස් රථය",
      route: "මාර්ගය",
      place: "ස්ථානය",
      when: "කවදාද",
      media: "අමුණා ඇත",
      pin: "සිතියම් ලකුණ",
      description: "සිදු වූ දේ",
    },
    mediaCount: (photos, videos) =>
      [photos && `ඡායාරූප ${photos}`, videos && `වීඩියෝ ${videos}`].filter(Boolean).join(", "),
    checkFooter: "නිවැරදි නම් “වාර්තාව යවන්න” ඔබන්න.",
    missing:
      "වාර්තාවට තවමත් සිදු වූ දේ, බස් අංකය සහ මාර්ගය (පැමිණිල්ලකට ස්ථානයද) අවශ්‍යයි. කරුණාකර ඒවා මුලින් කියන්න.",
    changePrompt: "හරි, ඔබට වෙනස් කිරීමට අවශ්‍ය කුමක්ද?",
    cancelled: "හරි, මම එම වාර්තාව ඉවත් කළා. ඕනෑම වේලාවක මට ලියන්න.",
    sent: (id) =>
      `ස්තූතියි 🙏 ඔබේ වාර්තාව යවා ඇත.\nරිසිට්පත් අංකය: *${id}*\n\nඑය සමාලෝචනය කළ විට හෝ කණ්ඩායමට තවත් විස්තර අවශ්‍ය වූ විට අපි මෙහි දන්වන්නෙමු. යාවත්කාලීන නැවැත්වීමට STOP යවන්න.`,
    sentLink: (url) => `\nලුහුබඳින්න: ${url}`,
    mediaFailed: "සමහර ඡායාරූප හෝ වීඩියෝ එකතු කළ නොහැකි විය. ලුහුබැඳීමේ පිටුවේ පිළිතුරකින් කණ්ඩායමට දැනුම් දිය හැක.",
    sendFailed: "සමාවන්න, ඔබේ වාර්තාව දැන් යැවිය නොහැකි විය. මොහොතකින් “වාර්තාව යවන්න” නැවත ඔබන්න.",
    receiptCaption: (id) => `TransitX රිසිට්පත ${id}`,
    stopped:
      "හරි. ඔබට තවදුරටත් මෙහි TransitX යාවත්කාලීන නොලැබේ, අපේ කතාබහද මකා දැමුවා. නැවත ආරම්භ කිරීමට ඕනෑම වේලාවක ලියන්න.",
  },
  road: {
    vehicle: "වාහනය",
    plate: "ලියාපදිංචි අංකය",
    colourMake: "වර්ණය / නිෂ්පාදනය",
    accident: "අනතුර",
    injuries: "තුවාල",
    vehiclesInvolved: "සම්බන්ධ වාහන ගණන",
    hazard: "මාර්ග ගැටලුව",
    vehicleKinds: {
      car: "කාර් රථය",
      van: "වෑන් රථය",
      lorry: "ලොරිය / ට්‍රක් රථය",
      tipper: "ටිපර් / බර වාහනය",
      three_wheeler: "ත්‍රිරෝද රථය",
      motorcycle: "යතුරුපැදිය",
      private_bus: "සංචාරක හෝ සේවක බස් රථය (මාර්ගයක නොවේ)",
      school_van: "පාසල් වෑන් / බස් රථය",
      taxi: "කුලී රථය / ටැක්සි",
      government: "රජයේ වාහනය",
      tractor: "ට්‍රැක්ටරය / ගොවි වාහනය",
      unknown: "විශ්වාස නැත",
    },
    involvement: {
      involved: "මම එයට සම්බන්ධ වුණා",
      witness: "මම එය සිදුවනු දුටුවා",
    },
    injuryLevels: {
      none: "කිසිවෙකුට තුවාල නැත",
      minor: "සුළු තුවාල",
      serious: "බරපතල තුවාල",
      unknown: "විශ්වාස නැත",
    },
    hazards: {
      pothole: "වළ / කැඩුණු මාර්ගය",
      broken_signal: "මාර්ග සංඥා ලාම්පු ක්‍රියා නොකරයි",
      streetlight_out: "වීදි ලාම්පු නිවී ඇත",
      flooding: "ගංවතුර",
      fallen_tree: "ගසක් හෝ අත්තක් වැටී ඇත",
      landslide: "නායයෑම / මාර්ගයේ ගල්",
      missing_sign: "නැතිවූ හෝ හානි වූ සංඥා පුවරුව",
      debris: "මාර්ගයේ සුන්බුන් හෝ තෙල්",
      animals: "මාර්ගයේ සතුන්",
      other: "වෙනත් දෙයක්",
    },
  },
  pdf: {
    subtitle: "පොදු ප්‍රවාහන නිරීක්ෂණ පද්ධතිය",
    title: {
      complaint: ["සිද්ධි", "වාර්තාව"],
      commendation: ["හොඳ සේවාවට", "ප්‍රශංසාව"],
      lost_item: ["නැතිවූ", "භාණ්ඩය"],
      road_incident: ["මාර්ග", "සිද්ධිය"],
    },
    reportId: "වාර්තා අංකය",
    date: "දිනය",
    detailsHeading: {
      complaint: "සිද්ධි වාර්තාවේ විස්තර",
      commendation: "ප්‍රශංසාවේ විස්තර",
      lost_item: "නැතිවූ භාණ්ඩයේ විස්තර",
      road_incident: "මාර්ග සිද්ධියේ විස්තර",
    },
    summary: "වාර්තා සාරාංශය",
    identifier: "අද්විතීය වාර්තා අංකය",
    generatedOn: "වාර්තාව සකස් කළ දිනය",
    overview: {
      complaint: "සිද්ධියේ දළ විශ්ලේෂණය",
      commendation: "හොඳින් කළ දේ",
      lost_item: "නැතිවූ භාණ්ඩය",
      road_incident: "සිදු වූ දේ",
    },
    busNumber: "බස් අංකය",
    routeNumber: "මාර්ග අංකය",
    busName: "බස් රථයේ නම",
    busService: "බස් සේවාව",
    busServices: {
      private: "පුද්ගලික බස් රථය",
      sltb: "ලංගම බස් රථය (රජයේ)",
      metro: "මෙට්‍රෝ බස් රථය",
    },
    commendee: "ස්තුති කරන්නේ",
    commendees: {
      driver: "රියදුරුට",
      conductor: "කොන්දොස්තරට",
      crew: "රියදුරු සහ කොන්දොස්තරට",
      service: "සමස්ත බස් සේවාවට",
    },
    category: "වර්ගය",
    location: "ස්ථානය",
    incidentAt: {
      complaint: "සිද්ධිය වූ දිනය සහ වේලාව",
      commendation: "ගමනේ දිනය සහ වේලාව",
      lost_item: "ගමනේ දිනය සහ වේලාව",
      road_incident: "සිද්ධිය වූ දිනය සහ වේලාව",
    },
    reportedOn: "වාර්තා කළ දිනය",
    description: {
      complaint: "සවිස්තර විස්තරය",
      commendation: "ඔවුන් හොඳින් කළ දේ",
      lost_item: "භාණ්ඩයේ විස්තරය",
      road_incident: "සවිස්තර විස්තරය",
    },
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
      lost_item:
        "ඔබේ නැතිවූ භාණ්ඩ වාර්තාව සටහන් කර ඇත. අපි එය බස් රථ හිමිකරු සමඟ බෙදාගෙන, භාණ්ඩය හමු වුවහොත් ඔබට දන්වන්නෙමු.",
      road_incident:
        "අපගේ මාර්ග වඩාත් ආරක්ෂිත කිරීමට උදව් කළාට ස්තූතියි. ඔබේ වාර්තාව සටහන් කර ඇති අතර අපගේ කණ්ඩායම එය සමාලෝචනය කරනු ඇත. පොලිසියට හෝ රක්ෂණ හිමිකම් පෑමකට අවශ්‍ය නම් මෙම රිසිට්පත තබා ගන්න.",
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
    accessibility: "அணுகல்தன்மை (முதியோர் / மாற்றுத்திறனாளி பயணிகள்)",
    other: "மற்றவை",
    safe_driving: "பாதுகாப்பான, கவனமான ஓட்டுதல்",
    helpful_staff: "அன்பான, உதவிகரமான பணியாளர்கள்",
    clean_vehicle: "சுத்தமான, நன்கு பராமரிக்கப்பட்ட பேருந்து",
    on_time: "சரியான நேரம், எல்லா நிறுத்தங்களிலும் நின்றது",
    fair_fare: "சரியான கட்டணம் மற்றும் பயணச்சீட்டு",
    helped_passenger: "உதவி தேவைப்பட்ட பயணிக்கு உதவினார்கள்",
    comfortable_service: "வசதியான, சிறப்பாக நடத்தப்படும் சேவை",
    bag: "பை",
    phone: "தொலைபேசி",
    wallet: "பணப்பை",
    documents: "ஆவணங்கள் / அடையாள அட்டை",
    keys: "சாவிகள்",
    clothing: "உடை / குடை",
    speeding: "அதிவேகம்",
    drunk_driving: "குடிபோதையில் வாகனம் ஓட்டுதல்",
    red_light: "சிவப்பு விளக்கை மீறுதல்",
    wrong_side: "தவறான பக்கத்தில் ஓட்டுதல்",
    dangerous_overtaking: "ஆபத்தான முந்துதல்",
    phone_while_driving: "வாகனம் ஓட்டும்போது தொலைபேசி பயன்பாடு",
    no_helmet: "தலைக்கவசம் இல்லை",
    road_rage: "சாலை ஆத்திரம் / அச்சுறுத்தல்",
    unsafe_load: "அதிக அல்லது கட்டப்படாத சுமை",
    smoke_emission: "கரும்புகை வெளியேற்றம்",
    noisy_exhaust: "அதிக சத்தம் / மாற்றிய புகைபோக்கி",
    illegal_parking: "சட்டவிரோத நிறுத்தம் / வழியடைப்பு",
    hit_and_run: "மோதிவிட்டுத் தப்பியோடுதல்",
    accident: "விபத்து",
    road_hazard: "சாலை அபாயம்",
  },
  receiptEmail: {
    subject: (id, type) =>
      type === "road_incident"
        ? `உங்கள் TransitX சாலைச் சம்பவ அறிக்கை - எண்: ${id}`
        : type === "lost_item"
          ? `உங்கள் TransitX தொலைந்த பொருள் அறிக்கை - எண்: ${id}`
          : type === "commendation"
            ? `உங்கள் TransitX பாராட்டுக்கு நன்றி - எண்: ${id}`
            : `உங்கள் TransitX புகார் ரசீது - எண்: ${id}`,
    greeting: "வணக்கம்!",
    thanks: {
      complaint:
        "பொதுப் போக்குவரத்தில் உள்ள பிரச்சினையைப் புகாரளிக்க நேரம் ஒதுக்கியதற்கு நன்றி. உங்கள் விழிப்புணர்வு உண்மையான மாற்றத்தை ஏற்படுத்த உதவுகிறது!",
      commendation:
        "நல்ல சேவையைப் பாராட்ட நேரம் ஒதுக்கியதற்கு நன்றி. உங்கள் அன்பான வார்த்தைகளை பேருந்து உரிமையாளரிடம் தெரிவிப்போம்.",
      lost_item:
        "உங்கள் பொருள் தொலைந்ததற்கு வருந்துகிறோம். முடிந்தவரை விவரங்களை பேருந்து உரிமையாளருக்கு அனுப்புவோம், ஏதேனும் தகவல் கிடைத்தவுடன் உங்களுக்குத் தெரிவிப்போம்.",
      road_incident:
        "இந்தச் சாலைச் சம்பவத்தைப் புகாரளித்ததற்கு நன்றி. உங்கள் அறிக்கை அனைவருக்கும் சாலைகளைப் பாதுகாப்பானதாக்க உதவுகிறது. எங்கள் குழு அதை மதிப்பாய்வு செய்து, என்ன நடக்கிறது என்பதை உங்களுக்குத் தெரிவிக்கும்.",
    },
    received:
      "அது எங்களுக்கு வெற்றிகரமாகக் கிடைத்தது. உங்கள் பதிவுக்காக, அதிகாரப்பூர்வ <strong>ரசீது இந்த மின்னஞ்சலுடன் இணைக்கப்பட்டுள்ளது</strong>.",
    idLabel: "உங்கள் அறிக்கை எண்:",
    idHelp:
      "இந்த தனித்துவமான எண் உங்கள் அறிக்கையைத் திறம்படப் பின்தொடர எங்களுக்கு உதவுகிறது. பின்னர் குறிப்பிட மேலே உள்ள எண்ணைப் பயன்படுத்தவும்.",
    trackLink: "உங்கள் அறிக்கையின் நிலையைப் பார்க்கவும்",
    signOff: "நன்றி,",
    team: "TransitX குழு",
    visit: "எங்கள் இணையதளம்",
  },
  statusEmail: {
    subject: (id, status) => `உங்கள் TransitX அறிக்கை ${id} பற்றிய புதுப்பிப்பு: ${status}`,
    changedTo: (id) => `உங்கள் அறிக்கை <strong>${id}</strong> இன் நிலை இவ்வாறு மாறியுள்ளது:`,
    teamMessage: "TransitX குழுவின் செய்தி:",
    timelineLink: "உங்கள் அறிக்கையின் முழு காலவரிசையைப் பார்க்கவும்",
    ratePrompt: "இது கையாளப்பட்ட விதத்தில் நீங்கள் திருப்தி அடைந்தீர்களா?",
    rateLink: "முடிவை மதிப்பிடுங்கள் (1 முதல் 5 நட்சத்திரங்கள்)",
    thanks: "பொதுப் போக்குவரத்தைப் பாதுகாப்பானதாக்க உதவியதற்கு நன்றி.",
  },
  codeEmail: {
    subject: (code) => `${code} உங்கள் TransitX உள்நுழைவுக் குறியீடு`,
    intro: 'TransitX இல் "எனது அறிக்கைகள்" பக்கத்தைத் திறக்க இந்தக் குறியீட்டைப் பயன்படுத்தவும்:',
    expires: (minutes) => `இது ஒருமுறை மட்டுமே செயல்படும், ${minutes} நிமிடங்களில் காலாவதியாகும்.`,
    ignore:
      "நீங்கள் இதைக் கோரவில்லை என்றால், இந்த மின்னஞ்சலைப் புறக்கணிக்கலாம். குறியீடு இல்லாமல் யாரும் உள்நுழைய முடியாது.",
  },
  messageEmail: {
    subject: (id) => `உங்கள் TransitX அறிக்கை ${id} பற்றிய புதிய செய்தி`,
    intro: (id) =>
      `உங்கள் அறிக்கை <strong>${id}</strong> பற்றி TransitX குழு உங்களுக்கு ஒரு செய்தி அனுப்பியுள்ளது:`,
    replyLink: "படித்துப் பதிலளிக்கவும்",
    operatorSubject: (id) => `உங்கள் TransitX அறிக்கை ${id} பற்றி பேருந்து உரிமையாளர் பதிலளித்துள்ளார்`,
    operatorIntro: (id, organisation) =>
      `உங்கள் அறிக்கை <strong>${id}</strong> பற்றி ${organisation ?? "பேருந்து உரிமையாளர்"} பதிலளித்துள்ளார்:`,
  },
  sms: {
    code: (code, minutes) =>
      `TransitX: உங்கள் உள்நுழைவுக் குறியீடு ${code}. ${minutes} நிமிடங்களில் காலாவதியாகும். யாருடனும் பகிர வேண்டாம்.`,
    received: (id) => `TransitX: உங்கள் அறிக்கை எங்களுக்குக் கிடைத்தது. உங்கள் ரசீது எண் ${id}.`,
    status: (id, status) => `TransitX: உங்கள் அறிக்கை ${id} இப்போது "${status}".`,
    message: (id) => `TransitX: அறிக்கை ${id} பற்றி குழு உங்களுக்கு ஒரு செய்தி அனுப்பியுள்ளது.`,
    operator: (id) => `TransitX: உங்கள் அறிக்கை ${id} பற்றி பேருந்து உரிமையாளர் பதிலளித்துள்ளார்.`,
    link: (url) => ` விவரங்கள்: ${url}`,
  },
  push: {
    statusTitle: "உங்கள் அறிக்கை புதுப்பிக்கப்பட்டது",
    statusBody: (id, status) => `${id} இப்போது: ${status}`,
    messageTitle: "TransitX இலிருந்து புதிய செய்தி",
    messageBody: (id) => `உங்கள் அறிக்கை ${id} பற்றி. படித்துப் பதிலளிக்கத் தட்டவும்.`,
    operatorTitle: "பேருந்து உரிமையாளர் பதிலளித்தார்",
    operatorBody: (id) => `உங்கள் அறிக்கை ${id} பற்றி. படிக்கத் தட்டவும்.`,
  },
  telegram: {
    linked: (id) =>
      `நீங்கள் இப்போது TransitX அறிக்கை ${id} ஐப் பின்தொடர்கிறீர்கள். அதன் நிலை மாறும்போது அல்லது குழு உங்களுக்கு எழுதும்போது இங்கே தெரிவிப்போம். நிறுத்த /stop அனுப்பவும்.`,
    welcome:
      "வணக்கம்! இந்த பாட் உங்கள் TransitX அறிக்கைகள் பற்றிய புதுப்பிப்புகளை அனுப்புகிறது. உங்கள் அறிக்கையின் கண்காணிப்புப் பக்கத்தைத் திறந்து “Telegram இல் புதுப்பிப்புகளைப் பெறுக” என்பதைத் தட்டவும்.",
    invalidLink:
      "இந்த இணைப்பு காலாவதியானது அல்லது செல்லாது. உங்கள் அறிக்கையின் கண்காணிப்புப் பக்கத்தைத் திறந்து “Telegram இல் புதுப்பிப்புகளைப் பெறுக” என்பதை மீண்டும் தட்டவும்.",
    stopped:
      "முடிந்தது. இனி இங்கே TransitX புதுப்பிப்புகள் வராது. கண்காணிப்புப் பக்கத்திலிருந்து எப்போது வேண்டுமானாலும் ஓர் அறிக்கையை மீண்டும் பின்தொடரலாம்.",
  },
  whatsapp: {
    welcome:
      "வணக்கம், இது TransitX 🚌 பேருந்தில் நடந்த பிரச்சினையைப் புகாரளிக்க அல்லது ஓட்டுநர், நடத்துநர் அல்லது பேருந்து சேவையைப் பாராட்ட இங்கேயே முடியும், தமிழ், English அல்லது සිංහල மொழியில். என்ன நடந்தது என்று சொல்லுங்கள். புகைப்படங்கள், குரல் செய்தி அல்லது உங்கள் இருப்பிடத்தையும் அனுப்பலாம்.\n\nஓர் அறிக்கையைப் பார்க்க அதன் ரசீது எண்ணை (BW-2026-ABC123 போன்றது) அனுப்புங்கள்.\n\nஅவசர நிலையில் 119 ஐ அழைக்கவும்.",
    welcomeNoAi: (url) =>
      `வணக்கம், இது TransitX 🚌 ஓர் அறிக்கையைப் பார்த்து இங்கே புதுப்பிப்புகளைப் பெற ரசீது எண்ணை (BW-2026-ABC123 போன்றது) அனுப்புங்கள். பிரச்சினையைப் புகாரளிக்கப் படிவத்தைப் பயன்படுத்தவும்: ${url}`,
    buttons: {
      report: "புகாரளிக்கவும்",
      commend: "சேவையைப் பாராட்டு",
      track: "அறிக்கையைப் பார்",
      follow: "இங்கே தெரிவிக்கவும்",
      send: "அறிக்கையை அனுப்பு",
      change: "மாற்றவும்",
      cancel: "ரத்துசெய்",
    },
    reportPrompt:
      "அப்படி நடந்ததற்கு வருந்துகிறோம். உங்கள் சொந்த வார்த்தைகளில் சொல்லுங்கள்: என்ன நடந்தது, பேருந்து எண் (இலக்கத் தகட்டில் உள்ளது, NB-1234 போன்றது), வழித்தடம், எங்கே எப்போது. தட்டச்சு செய்யலாம் அல்லது குரல் செய்தி அனுப்பலாம்; புகைப்படங்கள், வீடியோக்களையும் அனுப்பலாம்.",
    commendPrompt:
      "அருமை! யாருக்கு நன்றி சொல்ல விரும்புகிறீர்கள்: ஓட்டுநர், நடத்துநர் அல்லது பேருந்து சேவை? அவர்கள் என்ன நன்றாகச் செய்தார்கள், பேருந்து எண், வழித்தடம் ஆகியவற்றைச் சொல்லுங்கள்.",
    trackPrompt: "உங்கள் ரசீது எண்ணை அனுப்புங்கள். அது BW-2026-ABC123 போல இருக்கும்.",
    notFound: (id) => `${id} என்ற ரசீது எண்ணுடன் அறிக்கை எதுவும் கிடைக்கவில்லை. சரிபார்த்து மீண்டும் முயலவும்.`,
    status: (id, status, date) => `அறிக்கை *${id}*\nநிலை: *${status}*\nபுதுப்பிக்கப்பட்டது: ${date}`,
    teamMessages: (count) =>
      `குழு உங்களுக்கு ${count} செய்தி(கள்) அனுப்பியுள்ளது: கண்காணிப்புப் பக்கத்தில் படித்துப் பதிலளிக்கவும்.`,
    followPrompt: "இந்த அறிக்கை பற்றிய புதுப்பிப்புகளை இங்கே WhatsApp இல் பெற வேண்டுமா?",
    followed: (id) =>
      `முடிந்தது ✅ அறிக்கை ${id} மாறும்போது அல்லது குழு உங்களுக்கு எழுதும்போது இங்கே தெரிவிப்போம். எல்லாப் புதுப்பிப்புகளையும் நிறுத்த STOP அனுப்பவும்.`,
    alreadyFollowing: (id) => `${id} பற்றிய புதுப்பிப்புகள் ஏற்கனவே இங்கே வருகின்றன.`,
    mediaAdded: (photos, videos) =>
      `கிடைத்தது 📎 (இதுவரை ${photos} புகைப்படம், ${videos} வீடியோ). அவை உங்கள் அறிக்கையுடன் செல்லும்.`,
    mediaFull: "என்னால் இணைக்கக்கூடிய அதிகபட்சம் இதுதான் (5 புகைப்படங்கள், 2 வீடியோக்கள்). மீதி சேர்க்கப்படவில்லை.",
    locationAdded: "📍 இருப்பிடம் உங்கள் அறிக்கையில் சேர்க்கப்பட்டது.",
    voiceTooLong: "அந்தக் குரல் செய்தி மிக நீளமானது. சிறியதாக அனுப்பவும் அல்லது தட்டச்சு செய்யவும்.",
    unsupported:
      "மன்னிக்கவும், என்னால் உரை, புகைப்படங்கள், வீடியோக்கள், குரல் செய்திகள், இருப்பிடங்களை மட்டுமே படிக்க முடியும்.",
    aiBusy: "மன்னிக்கவும், இப்போது பரபரப்பாக இருக்கிறேன். ஒரு நிமிடத்தில் மீண்டும் முயலவும்.",
    tooMany: "நீங்கள் நிறைய செய்திகளை அனுப்பியுள்ளீர்கள். சிறிது நேரம் கழித்து மீண்டும் முயலவும்.",
    checkTitle: {
      complaint: "தயவுசெய்து உங்கள் அறிக்கையைச் சரிபார்க்கவும்:",
      commendation: "தயவுசெய்து உங்கள் பாராட்டைச் சரிபார்க்கவும்:",
      lost_item: "உங்கள் தொலைந்த பொருள் அறிக்கையைச் சரிபார்க்கவும்:",
      road_incident: "உங்கள் சாலைச் சம்பவ அறிக்கையைச் சரிபார்க்கவும்:",
    },
    labels: {
      category: "வகை",
      bus: "பேருந்து",
      route: "வழித்தடம்",
      place: "இடம்",
      when: "எப்போது",
      media: "இணைக்கப்பட்டவை",
      pin: "வரைபடக் குறி",
      description: "என்ன நடந்தது",
    },
    mediaCount: (photos, videos) =>
      [photos && `${photos} புகைப்படம்`, videos && `${videos} வீடியோ`].filter(Boolean).join(", "),
    checkFooter: "சரியாக இருந்தால் “அறிக்கையை அனுப்பு” என்பதை அழுத்தவும்.",
    missing:
      "அறிக்கைக்கு இன்னும் என்ன நடந்தது, பேருந்து எண், வழித்தடம் (புகாருக்கு இடமும்) தேவை. முதலில் அவற்றைச் சொல்லுங்கள்.",
    changePrompt: "சரி, எதை மாற்ற விரும்புகிறீர்கள்?",
    cancelled: "சரி, அந்த அறிக்கையை நீக்கிவிட்டேன். எப்போது வேண்டுமானாலும் எழுதுங்கள்.",
    sent: (id) =>
      `நன்றி 🙏 உங்கள் அறிக்கை அனுப்பப்பட்டது.\nரசீது எண்: *${id}*\n\nஅது மதிப்பாய்வு செய்யப்படும்போது அல்லது குழுவுக்கு மேலும் விவரங்கள் தேவைப்படும்போது இங்கே தெரிவிப்போம். புதுப்பிப்புகளை நிறுத்த STOP அனுப்பவும்.`,
    sentLink: (url) => `\nகண்காணிக்க: ${url}`,
    mediaFailed:
      "சில புகைப்படங்கள் அல்லது வீடியோக்களை இணைக்க முடியவில்லை. கண்காணிப்புப் பக்கத்தில் பதில் மூலம் குழுவுக்குத் தெரிவிக்கலாம்.",
    sendFailed:
      "மன்னிக்கவும், உங்கள் அறிக்கையை இப்போது அனுப்ப முடியவில்லை. சிறிது நேரத்தில் “அறிக்கையை அனுப்பு” என்பதை மீண்டும் அழுத்தவும்.",
    receiptCaption: (id) => `TransitX ரசீது ${id}`,
    stopped:
      "முடிந்தது. இனி இங்கே TransitX புதுப்பிப்புகள் வராது, எங்கள் உரையாடலையும் மறந்துவிட்டேன். மீண்டும் தொடங்க எப்போது வேண்டுமானாலும் எழுதுங்கள்.",
  },
  road: {
    vehicle: "வாகனம்",
    plate: "வாகன இலக்கம்",
    colourMake: "நிறம் / தயாரிப்பு",
    accident: "விபத்து",
    injuries: "காயங்கள்",
    vehiclesInvolved: "சம்பந்தப்பட்ட வாகனங்கள்",
    hazard: "சாலைப் பிரச்சினை",
    vehicleKinds: {
      car: "கார்",
      van: "வேன்",
      lorry: "லொறி / டிரக்",
      tipper: "டிப்பர் / கனரக வாகனம்",
      three_wheeler: "முச்சக்கர வண்டி",
      motorcycle: "மோட்டார் சைக்கிள்",
      private_bus: "சுற்றுலா அல்லது ஊழியர் பேருந்து (வழித்தடம் அல்ல)",
      school_van: "பாடசாலை வேன் / பேருந்து",
      taxi: "டாக்ஸி / வாடகை கார்",
      government: "அரசாங்க வாகனம்",
      tractor: "டிராக்டர் / உழவு வாகனம்",
      unknown: "உறுதியாகத் தெரியவில்லை",
    },
    involvement: {
      involved: "நான் அதில் சம்பந்தப்பட்டேன்",
      witness: "அது நடப்பதை நான் பார்த்தேன்",
    },
    injuryLevels: {
      none: "யாருக்கும் காயமில்லை",
      minor: "சிறு காயங்கள்",
      serious: "கடுமையான காயங்கள்",
      unknown: "உறுதியாகத் தெரியவில்லை",
    },
    hazards: {
      pothole: "குழி / உடைந்த சாலை",
      broken_signal: "போக்குவரத்து விளக்கு வேலை செய்யவில்லை",
      streetlight_out: "தெரு விளக்குகள் எரியவில்லை",
      flooding: "வெள்ளம்",
      fallen_tree: "விழுந்த மரம் அல்லது கிளை",
      landslide: "மண்சரிவு / சாலையில் பாறைகள்",
      missing_sign: "காணாமல் போன அல்லது சேதமடைந்த அடையாளப் பலகை",
      debris: "சாலையில் குப்பைகள் அல்லது எண்ணெய்",
      animals: "சாலையில் விலங்குகள்",
      other: "வேறு ஏதாவது",
    },
  },
  pdf: {
    subtitle: "பொதுப் போக்குவரத்து கண்காணிப்பு அமைப்பு",
    title: {
      complaint: ["சம்பவ", "அறிக்கை"],
      commendation: ["நல்ல சேவைக்கான", "பாராட்டு"],
      lost_item: ["தொலைந்த", "பொருள்"],
      road_incident: ["சாலைச்", "சம்பவம்"],
    },
    reportId: "அறிக்கை எண்",
    date: "தேதி",
    detailsHeading: {
      complaint: "சம்பவ அறிக்கை விவரங்கள்",
      commendation: "பாராட்டு விவரங்கள்",
      lost_item: "தொலைந்த பொருளின் விவரங்கள்",
      road_incident: "சாலைச் சம்பவ விவரங்கள்",
    },
    summary: "அறிக்கை சுருக்கம்",
    identifier: "தனித்துவமான அறிக்கை எண்",
    generatedOn: "அறிக்கை உருவாக்கப்பட்ட தேதி",
    overview: {
      complaint: "சம்பவ கண்ணோட்டம்",
      commendation: "சிறப்பாகச் செய்தவை",
      lost_item: "தொலைந்த பொருள்",
      road_incident: "என்ன நடந்தது",
    },
    busNumber: "பேருந்து எண்",
    routeNumber: "வழித்தட எண்",
    busName: "பேருந்தின் பெயர்",
    busService: "பேருந்து சேவை",
    busServices: {
      private: "தனியார் பேருந்து",
      sltb: "இ.போ.ச பேருந்து (அரசு)",
      metro: "மெட்ரோ பேருந்து",
    },
    commendee: "நன்றி சொல்லப்படுபவர்",
    commendees: {
      driver: "ஓட்டுநர்",
      conductor: "நடத்துநர்",
      crew: "ஓட்டுநர் மற்றும் நடத்துநர்",
      service: "முழு பேருந்து சேவை",
    },
    category: "வகை",
    location: "இடம்",
    incidentAt: {
      complaint: "சம்பவ தேதி மற்றும் நேரம்",
      commendation: "பயண தேதி மற்றும் நேரம்",
      lost_item: "பயணத்தின் தேதி மற்றும் நேரம்",
      road_incident: "சம்பவ தேதி மற்றும் நேரம்",
    },
    reportedOn: "அறிவிக்கப்பட்ட தேதி",
    description: {
      complaint: "விரிவான விளக்கம்",
      commendation: "அவர்கள் சிறப்பாகச் செய்தவை",
      lost_item: "பொருளின் விவரம்",
      road_incident: "விரிவான விளக்கம்",
    },
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
      lost_item:
        "உங்கள் தொலைந்த பொருள் அறிக்கை பதிவு செய்யப்பட்டது. அதை பேருந்து உரிமையாளருடன் பகிர்ந்து, பொருள் கிடைத்தால் உங்களுக்குத் தெரிவிப்போம்.",
      road_incident:
        "எங்கள் சாலைகளைப் பாதுகாப்பானதாக்க உதவியதற்கு நன்றி. உங்கள் அறிக்கை பதிவு செய்யப்பட்டுள்ளது, எங்கள் குழு அதை மதிப்பாய்வு செய்யும். காவல்துறை அல்லது காப்பீட்டுக் கோரிக்கைக்குத் தேவைப்பட்டால் இந்த ரசீதை வைத்திருங்கள்.",
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
