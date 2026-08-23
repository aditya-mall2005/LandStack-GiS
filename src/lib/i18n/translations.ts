/**
 * LandStack — Pan-India Multi-Language Translation Dictionary
 * Supporting 11 Indian languages with regional land revenue terminology.
 */

export interface LanguageMeta {
  code: string;
  name: string;
  englishName: string;
  region: string;
  flag: string;
  landTermsSummary: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  {
    code: "en",
    name: "English",
    englishName: "English",
    region: "Pan-India / Central",
    flag: "🇮🇳",
    landTermsSummary: "RoR, Cadastre, Mutation, Encumbrance, Tax",
  },
  {
    code: "hi",
    name: "हिन्दी",
    englishName: "Hindi",
    region: "North & Central (Bihar, UP, MP, RJ, HR, DL, UK)",
    flag: "🌾",
    landTermsSummary: "जमाबंदी, खतियान, खेसरा, दाखिल-खारिज, लगान",
  },
  {
    code: "ta",
    name: "தமிழ்",
    englishName: "Tamil",
    region: "South (Tamil Nadu, Puducherry)",
    flag: "🏛️",
    landTermsSummary: "பட்டா, சிட்டா, புல எண், பட்டா மாறுதல், வில்லங்கம்",
  },
  {
    code: "te",
    name: "తెలుగు",
    englishName: "Telugu",
    region: "South (Andhra Pradesh, Telangana)",
    flag: "🌾",
    landTermsSummary: "పహానీ, 1-B రికార్డు, ఖాతా, పట్టా బదిలీ, ఈసీ",
  },
  {
    code: "bn",
    name: "বাংলা",
    englishName: "Bengali",
    region: "East (West Bengal, Tripura, Assam)",
    flag: "🌿",
    landTermsSummary: "পরচা, খতিয়ান, দাগ নম্বর, নামপত্তন, খাজনা",
  },
  {
    code: "mr",
    name: "मराठी",
    englishName: "Marathi",
    region: "West (Maharashtra, Goa)",
    flag: "🏰",
    landTermsSummary: "७/१२ उतारा, ८-अ, गट नंबर, फेरफार, शेतसारा",
  },
  {
    code: "gu",
    name: "ગુજરાતી",
    englishName: "Gujarati",
    region: "West (Gujarat, Daman & Diu)",
    flag: "🏢",
    landTermsSummary: "૭/૧૨ નો ઉતારો, ૮-અ, સર્વે નંબર, હક્ક પત્રક, મહેસૂલ",
  },
  {
    code: "kn",
    name: "ಕನ್ನಡ",
    englishName: "Kannada",
    region: "South (Karnataka)",
    flag: "🌲",
    landTermsSummary: "ಪಹಣಿ, ಭೂಮಿ ಆರ್‌ಟಿಸಿ, ಸರ್ವೇ ನಂಬರ್, ಕಂದಾಯ, ಪೌತಿ",
  },
  {
    code: "pa",
    name: "ਪੰਜਾਬੀ",
    englishName: "Punjabi",
    region: "North (Punjab, Chandigarh)",
    flag: "🌾",
    landTermsSummary: "ਜਮ੍ਹਾਂਬੰਦੀ, ਫ਼ਰਦ, ਖਸਰਾ ਨੰਬਰ, ਇੰਤਕਾਲ, ਮਾਲੀਆ",
  },
  {
    code: "ml",
    name: "മലയാളം",
    englishName: "Malayalam",
    region: "South (Kerala, Lakshadweep)",
    flag: "🌴",
    landTermsSummary: "തണ്ടപ്പേര്, ബി.ടി.ആർ, സർവേ നമ്പർ, പോക്കുവരവ്, ഭൂനികുതി",
  },
  {
    code: "or",
    name: "ଓଡ଼ିଆ",
    englishName: "Odia",
    region: "East (Odisha)",
    flag: "🛕",
    landTermsSummary: "ଭୂଲେଖ ଖତିୟାନ, ପଟ୍ଟା, ପ୍ଲଟ୍ ନମ୍ବର, ଦାଖଲ ଖାରଜ, ଖଜଣା",
  },
];

export type TranslationKey = string;

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    // Brand & Header
    "app.title": "LandStack",
    "app.tagline": "Integrated GIS Digital Public Infrastructure for Land Governance",
    "app.sih_badge": "SIH 2026",
    "nav.language": "Language",
    "nav.select_language": "Select Language",
    "nav.switch_role": "Switch Role",
    "nav.active_role": "Currently Active",

    // Navigation Items
    "nav.home": "Home",
    "nav.map": "Cadastral GIS Map",
    "nav.search": "Land 360° Search",
    "nav.services": "Citizen Services",
    "nav.applications": "Track Applications",
    "nav.officer_desk": "Officer Desk",
    "nav.conflicts": "Dispute Desk",
    "nav.intelligence": "AI Intelligence",
    "nav.security": "Security & Audit",
    "nav.adapters": "State Adapters",
    "nav.menu": "Menu",

    // Section Titles
    "section.core_navigation": "Core Navigation",
    "section.citizen_services": "Citizen Self-Service Workflows",
    "section.officer_tools": "Statutory Review & Verification",
    "section.admin_governance": "System Governance & Security",

    // Search Hero
    "hero.title": "Land 360° Unified Registry",
    "hero.subtitle": "Search any parcel across departments — RoR Khatiyan, deeds, encumbrance, cadastral GIS & tax.",
    "hero.placeholder": "Search by ULPIN (e.g. 1051), Survey No, or Raiyat Name...",
    "hero.search_button": "Search",

    // Home Statistics
    "stat.recorded_parcels": "My Recorded Parcels",
    "stat.total_landholding": "Total Landholding",
    "stat.active_applications": "Active Applications",
    "stat.annual_lagan": "Annual Lagan / Revenue",
    "stat.pending_queue": "Pending Queue",
    "stat.in_review": "In Active Review",
    "stat.approved_certified": "Approved / Certified",
    "stat.sla_breaches": "SLA Breaches / Escalated",

    // Citizen Service Cards
    "service.my_parcels": "My Parcels on Cadastre",
    "service.my_parcels_desc": "Interactive Cadastral GIS with Survey #",
    "service.ror_extract": "RoR / Khatiyan Extract",
    "service.ror_extract_desc": "Download certified digital Jamabandi copy",
    "service.apply_mutation": "Apply for Mutation",
    "service.apply_mutation_desc": "Initiate title transfer after deed purchase",
    "service.track_apps": "Track My Applications",
    "service.track_apps_desc": "Live SLA tracking with step progress",
    "service.encumbrance": "Encumbrance Certificate",
    "service.encumbrance_desc": "Verify non-encumbrance & bank charges",
    "service.building_permission": "Building Plan Sanction",
    "service.building_permission_desc": "Apply for municipal building permit",

    // GIS Map & Layers
    "map.layers": "Layers",
    "map.layer_satellite": "Satellite Hybrid",
    "map.layer_cadastral": "Cadastral Vector",
    "map.layer_land_use": "Land Use / Zoning",
    "map.layer_conflicts": "Boundary Conflicts",
    "map.layer_topo": "Topographic",
    "map.search_placeholder": "Search ULPIN, Survey Plot...",
    "map.legend_agricultural": "Agricultural",
    "map.legend_residential": "Residential",
    "map.legend_commercial": "Commercial",
    "map.legend_forest": "Forest",
    "map.legend_water": "Water Body",
    "map.legend_govt": "Government Land",
    "map.view_land360": "View Land 360°",

    // Parcel Details Tabs
    "tab.overview": "Overview",
    "tab.ownership": "Ownership",
    "tab.documents": "Documents",
    "tab.history": "History",
    "tab.prechecks": "Automated Pre-Checks",
    "tab.satellite_changes": "Satellite Changes",
    "tab.anomalies": "Risk & Anomalies",

    // Land Terms
    "term.ulpin": "ULPIN",
    "term.survey_no": "Survey No.",
    "term.khata_no": "Khata Number",
    "term.khesra_no": "Khesra / Plot",
    "term.area": "Area",
    "term.village": "Village / Mauza",
    "term.district": "District",
    "term.state": "State",
    "term.land_use": "Land Use",
    "term.raiyat": "Primary Raiyat / Owner",
    "term.relation": "Relation",
    "term.share": "Ownership Share",
    "term.lagan": "Annual Lagan / Tax",
    "term.status": "Status",
    "term.verified": "Verified",
    "term.conflict": "Dispute Flagged",
    "term.encumbrance_free": "Nil Encumbrance",
    "term.court_case": "Court Case",

    // Actions & Buttons
    "action.apply": "Apply Now",
    "action.view_details": "View Details",
    "action.download_certificate": "Download Certificate",
    "action.switch_persona": "Switch Persona",
    "action.approve": "Approve Title",
    "action.reject": "Reject Request",
    "action.request_inspection": "Request Field Survey",
    "action.close": "Close",
    "action.back": "Back",
  },

  hi: {
    // Brand & Header
    "app.title": "लैंडस्टैक (LandStack)",
    "app.tagline": "भूमि अभिशासन हेतु एकीकृत जीआईएस डिजिटल सार्वजनिक अवसंरचना",
    "app.sih_badge": "एसआईएच 2026",
    "nav.language": "भाषा",
    "nav.select_language": "भाषा चुनें",
    "nav.switch_role": "भूमिका बदलें",
    "nav.active_role": "सक्रिय उपयोगकर्ता",

    // Navigation Items
    "nav.home": "मुख्य पृष्ठ (होम)",
    "nav.map": "भू-नक्शा (कैडस्ट्रल जीआईएस)",
    "nav.search": "भू 360° खोज",
    "nav.services": "नागरिक सेवाएं",
    "nav.applications": "आवेदन स्थिति ट्रैक करें",
    "nav.officer_desk": "राजस्व अधिकारी डेस्क",
    "nav.conflicts": "सीमा विवाद निवारण",
    "nav.intelligence": "एआई भू-खुफिया",
    "nav.security": "सुरक्षा एवं ऑडिट",
    "nav.adapters": "राज्य भू-अभिलेख एडेप्टर",
    "nav.menu": "मेनू",

    // Section Titles
    "section.core_navigation": "मुख्य नेविगेशन",
    "section.citizen_services": "नागरिक स्व-सेवा कार्यप्रवाह",
    "section.officer_tools": "सांविधिक समीक्षा एवं सत्यापन",
    "section.admin_governance": "प्रणाली शासन एवं सुरक्षा",

    // Search Hero
    "hero.title": "भू 360° एकीकृत भूमि रजिस्ट्री",
    "hero.subtitle": "विभिन्न विभागों के रिकॉर्ड खोजें — जमाबंदी खतियान, पंजीकृत विलेख, गैर-भार प्रमाण, भू-नक्शा व कर।",
    "hero.placeholder": "यूलपिन (ULPIN), खेसरा/सर्वे नं. या रैयत के नाम से खोजें...",
    "hero.search_button": "खोजें",

    // Home Statistics
    "stat.recorded_parcels": "मेरे दर्ज भू-खंड (खेसरा)",
    "stat.total_landholding": "कुल भूमि रकबा",
    "stat.active_applications": "सक्रिय आवेदन",
    "stat.annual_lagan": "वार्षिक लगान / भू-राजस्व",
    "stat.pending_queue": "लंबित कार्य सूची",
    "stat.in_review": "सक्रिय समीक्षाधीन",
    "stat.approved_certified": "स्वीकृत / प्रमाणित",
    "stat.sla_breaches": "समय-सीमा उल्लंघन",

    // Citizen Service Cards
    "service.my_parcels": "नक्शे पर मेरी जमीन",
    "service.my_parcels_desc": "खेसरा नंबर सहित भू-नक्शा देखें",
    "service.ror_extract": "अधिकार अभिलेख (खतियान/जमाबंदी)",
    "service.ror_extract_desc": "डिजिटल हस्ताक्षरित खतियान प्रति डाउनलोड करें",
    "service.apply_mutation": "दाखिल-खारिज (म्यूटेशन) आवेदन",
    "service.apply_mutation_desc": "केवाला खरीद के बाद नामंतरण हेतु आवेदन करें",
    "service.track_apps": "आवेदन की स्थिति जानें",
    "service.track_apps_desc": "समय-सीमा एवं चरणवार प्रगति देखें",
    "service.encumbrance": "गैर-भार प्रमाणपत्र (ईसी)",
    "service.encumbrance_desc": "बैंक बंधक एवं वित्तीय भार की जांच करें",
    "service.building_permission": "भवन निर्माण स्वीकृति",
    "service.building_permission_desc": "नगर निकाय निर्माण परमिट हेतु आवेदन करें",

    // GIS Map & Layers
    "map.layers": "मानचित्र परतें",
    "map.layer_satellite": "उपग्रह हाइब्रिड",
    "map.layer_cadastral": "भू-नक्शा (वेक्टर सीमा)",
    "map.layer_land_use": "भूमि उपयोग / ज़ोनिंग",
    "map.layer_conflicts": "सीमा विवाद",
    "map.layer_topo": "स्थलाकृतिक",
    "map.search_placeholder": "यूलपिन या खेसरा नं. खोजें...",
    "map.legend_agricultural": "कृषि भूमि (धनहर/भीट)",
    "map.legend_residential": "आवासीय (बस्ती)",
    "map.legend_commercial": "व्यावसायिक",
    "map.legend_forest": "वन भूमि",
    "map.legend_water": "जलाशय / पोखर",
    "map.legend_govt": "सरकारी / गैर-मजरूआ",
    "map.view_land360": "भू 360° विवरण देखें",

    // Parcel Details Tabs
    "tab.overview": "सिंहावलोकन",
    "tab.ownership": "स्वामित्व (रैयत)",
    "tab.documents": "दस्तावेज़",
    "tab.history": "इतिहास",
    "tab.prechecks": "स्वचालित पूर्व-जांच",
    "tab.satellite_changes": "उपग्रह परिवर्तन",
    "tab.anomalies": "जोखिम एवं विसंगतियां",

    // Land Terms
    "term.ulpin": "यूलपिन (ULPIN)",
    "term.survey_no": "खेसरा / सर्वे नं.",
    "term.khata_no": "खाता संख्या",
    "term.khesra_no": "खेसरा संख्या",
    "term.area": "रकबा (क्षेत्रफल)",
    "term.village": "मौजा / ग्राम",
    "term.district": "जिला",
    "term.state": "राज्य",
    "term.land_use": "भूमि का प्रकार",
    "term.raiyat": "मुख्य रैयत / भूस्वामी",
    "term.relation": "पिता/पति का नाम",
    "term.share": "स्वामित्व अंश",
    "term.lagan": "वार्षिक लगान",
    "term.status": "स्थिति",
    "term.verified": "सत्यापित",
    "term.conflict": "विवादित",
    "term.encumbrance_free": "भार मुक्त",
    "term.court_case": "न्यायालय वाद",

    // Actions & Buttons
    "action.apply": "आवेदन करें",
    "action.view_details": "विवरण देखें",
    "action.download_certificate": "प्रमाणपत्र डाउनलोड करें",
    "action.switch_persona": "भूमिका बदलें",
    "action.approve": "दाखिल-खारिज स्वीकृत करें",
    "action.reject": "अस्वीकार करें",
    "action.request_inspection": "स्थलीय जांच आदेश",
    "action.close": "बंद करें",
    "action.back": "वापस",
  },

  ta: {
    // Brand & Header
    "app.title": "லேண்ட்பேக் (LandStack)",
    "app.tagline": "நில நிர்வாகத்திற்கான ஒருங்கிணைந்த ஜிஐஎஸ் டிஜிட்டல் பொது உள்கட்டமைப்பு",
    "app.sih_badge": "எஸ்ஐஎச் 2026",
    "nav.language": "மொழி",
    "nav.select_language": "மொழியைத் தேர்ந்தெடுக்கவும்",
    "nav.switch_role": "பயனர் பங்கு மாற்றவும்",
    "nav.active_role": "செயலில் உள்ள பயனர்",

    // Navigation Items
    "nav.home": "முகப்பு",
    "nav.map": "நில வரைபடம் (ஜிஐஎஸ்)",
    "nav.search": "நிலம் 360° தேடல்",
    "nav.services": "குடிமக்கள் சேவைகள்",
    "nav.applications": "விண்ணப்பத்தைக் கண்காணிக்கவும்",
    "nav.officer_desk": "வருவாய் அலுவலர் பிரிவு",
    "nav.conflicts": "எல்லை தகராறு தீர்வு",
    "nav.intelligence": "செயற்கை நுண்ணறிவு புலனாய்வு",
    "nav.security": "பாதுகாப்பு மற்றும் தணிக்கை",
    "nav.adapters": "மாநில நில பதிவேடு அடாப்டர்",
    "nav.menu": "பட்டியல்",

    // Section Titles
    "section.core_navigation": "முதன்மை வழிசெலுத்தல்",
    "section.citizen_services": "குடிமக்கள் சுய சேவை",
    "section.officer_tools": "சட்டப்பூர்வ சரிபார்ப்பு",
    "section.admin_governance": "கணினி நிர்வாகம் & பாதுகாப்பு",

    // Search Hero
    "hero.title": "நிலம் 360° ஒருங்கிணைந்த பதிவேடு",
    "hero.subtitle": "பட்டா/சிட்டா, பத்திரங்கள், வில்லங்கம், நில வரைபடம் மற்றும் வரி விவரங்களைத் தேடுங்கள்.",
    "hero.placeholder": "யுஎல்பிஐஎன் (ULPIN), புல எண் (Survey No) அல்லது உரிமையாளர் பெயர் மூலம் தேடுங்கள்...",
    "hero.search_button": "தேடுக",

    // Home Statistics
    "stat.recorded_parcels": "எனது பதிவு செய்யப்பட்ட நிலங்கள்",
    "stat.total_landholding": "மொத்த நிலப்பரப்பு",
    "stat.active_applications": "செயலில் உள்ள விண்ணப்பங்கள்",
    "stat.annual_lagan": "ஆண்டு நில தீர்வை / வரி",
    "stat.pending_queue": "நிலுவை வரிசை",
    "stat.in_review": "பரிசீலனையில் உள்ளவை",
    "stat.approved_certified": "அங்கீகரிக்கப்பட்டது",
    "stat.sla_breaches": "காலக்கெடு மீறல்கள்",

    // Citizen Service Cards
    "service.my_parcels": "வரைபடத்தில் எனது நிலம்",
    "service.my_parcels_desc": "புல எண் கொண்டு ஜிஐஎஸ் வரைபடம் பார்க்க",
    "service.ror_extract": "பட்டா / சிட்டா நகல்",
    "service.ror_extract_desc": "மின்-கையொப்பமிட்ட பட்டா பதிவிறக்கம்",
    "service.apply_mutation": "பட்டா மாறுதல் விண்ணப்பம்",
    "service.apply_mutation_desc": "பத்திரப் பதிவுக்குப் பின் பெயர் மாற்றம் செய்ய",
    "service.track_apps": "விண்ணப்ப நிலையை அறிய",
    "service.track_apps_desc": "படி வாரியான முன்னேற்றத்தைக் கண்காணிக்க",
    "service.encumbrance": "வில்லங்கச் சான்றிதழ் (EC)",
    "service.encumbrance_desc": "வங்கி அடமானம் மற்றும் கடன்களைச் சரிபார்க்க",
    "service.building_permission": "கட்டட வரைபட அனுமதி",
    "service.building_permission_desc": "நகராட்சி கட்டட அனுமதிக்கு விண்ணப்பிக்க",

    // GIS Map & Layers
    "map.layers": "வரைபட அடுக்குகள்",
    "map.layer_satellite": "செயற்கைக்கோள் காட்சி",
    "map.layer_cadastral": "நில வரைபடம் (வெக்டார்)",
    "map.layer_land_use": "நில பயன்பாடு / மண்டலம்",
    "map.layer_conflicts": "எல்லை மோதல்கள்",
    "map.layer_topo": "நிலப்பரப்பு",
    "map.search_placeholder": "புல எண் அல்லது யுஎல்பிஐஎன் தேடுக...",
    "map.legend_agricultural": "விவசாய நிலம் (நஞ்சை/புஞ்சை)",
    "map.legend_residential": "குடியிருப்பு நத்தம்",
    "map.legend_commercial": "வணிக நிலம்",
    "map.legend_forest": "காடு",
    "map.legend_water": "நீர்நிலை / குளம்",
    "map.legend_govt": "அரசு புறம்போக்கு நிலம்",
    "map.view_land360": "நிலம் 360° பார்க்க",

    // Parcel Details Tabs
    "tab.overview": "பொதுக் கண்ணோட்டம்",
    "tab.ownership": "உரிமையாளர் விவரம்",
    "tab.documents": "ஆவணங்கள்",
    "tab.history": "வரலாறு",
    "tab.prechecks": "தானியங்கி முன்-சோதனை",
    "tab.satellite_changes": "செயற்கைக்கோள் மாற்றங்கள்",
    "tab.anomalies": "அபாயங்கள் மற்றும் முரண்பாடுகள்",

    // Land Terms
    "term.ulpin": "யுஎல்பிஐஎன் (ULPIN)",
    "term.survey_no": "புல எண் (Survey No)",
    "term.khata_no": "பட்டா எண்",
    "term.khesra_no": "உட்பிரிவு எண்",
    "term.area": "பரப்பளவு",
    "term.village": "கிராமம்",
    "term.district": "மாவட்டம்",
    "term.state": "மாநிலம்",
    "term.land_use": "நில வகைப்பாடு",
    "term.raiyat": "நில உரிமையாளர் (பட்டாதாரர்)",
    "term.relation": "தந்தை / கணவர் பெயர்",
    "term.share": "பங்கு விகிதம்",
    "term.lagan": "நில வரி / தீர்வை",
    "term.status": "நிலை",
    "term.verified": "சரிபார்க்கப்பட்டது",
    "term.conflict": "தகராறு உள்ளது",
    "term.encumbrance_free": "வில்லங்கமற்றது",
    "term.court_case": "நீதிமன்ற வழக்கு",

    // Actions & Buttons
    "action.apply": "விண்ணப்பிக்கவும்",
    "action.view_details": "விவரங்களைக் காண்க",
    "action.download_certificate": "சான்றிதழ் பதிவிறக்குக",
    "action.switch_persona": "பங்கு மாற்றவும்",
    "action.approve": "பட்டா மாறுதல் ஒப்புதல்",
    "action.reject": "நிராகரிக்கவும்",
    "action.request_inspection": "கள ஆய்வு கோருக",
    "action.close": "மூடுக",
    "action.back": "பின்செல்",
  },

  te: {
    // Brand & Header
    "app.title": "ల్యాండ్‌స్టాక్ (LandStack)",
    "app.tagline": "భూ పరిపాలన కోసం సమీకృత జీఐఎస్ డిజిటల్ పబ్లిక్ ఇన్‌ఫ్రాస్ట్రక్చర్",
    "app.sih_badge": "ఎస్ఐహెచ్ 2026",
    "nav.language": "భాష",
    "nav.select_language": "భాషను ఎంచుకోండి",
    "nav.switch_role": "పాత్ర మార్చు",
    "nav.active_role": "ప్రస్తుత వినియోగదారు",

    // Navigation Items
    "nav.home": "హోమ్",
    "nav.map": "భూ నక్షా (జీఐఎస్ మ్యాప్)",
    "nav.search": "ల్యాండ్ 360° శోధన",
    "nav.services": "పౌర సేవలు",
    "nav.applications": "దరఖాస్తు స్థితిని తనిఖీ చేయండి",
    "nav.officer_desk": "రెవెన్యూ అధికారి డెస్క్",
    "nav.conflicts": "సరిహద్దు వివాదాల పరిష్కారం",
    "nav.intelligence": "ఏఐ భూ మేధస్సు",
    "nav.security": "భద్రత మరియు ఆడిట్",
    "nav.adapters": "రాష్ట్ర భూ రికార్డుల అడాప్టర్",
    "nav.menu": "మెనూ",

    // Section Titles
    "section.core_navigation": "ప్రధాన నావిగేషన్",
    "section.citizen_services": "పౌరుల స్వీయ సేవా వర్క్‌ఫ్లోలు",
    "section.officer_tools": "చట్టబద్ధమైన సమీక్ష మరియు ధృవీకరణ",
    "section.admin_governance": "సిస్టమ్ పాలన & భద్రత",

    // Search Hero
    "hero.title": "ల్యాండ్ 360° సమీకృత రిజిస్ట్రీ",
    "hero.subtitle": "పహానీ/1-B, రిజిస్టర్డ్ డీడ్స్, ఈసీ, భూ నక్షా మరియు పన్ను వివరాలను శోధించండి.",
    "hero.placeholder": "యూఎల్‌పీఐఎన్ (ULPIN), సర్వే నంబరు లేదా పట్టాదారు పేరుతో శోధించండి...",
    "hero.search_button": "శోధించండి",

    // Home Statistics
    "stat.recorded_parcels": "నా నమోదిత భూములు",
    "stat.total_landholding": "మొత్తం భూ విస్తీర్ణం",
    "stat.active_applications": "క్రియాశీల దరఖాస్తులు",
    "stat.annual_lagan": "వార్షిక భూమి పన్ను",
    "stat.pending_queue": "పెండింగ్ జాబితా",
    "stat.in_review": "పరిశీలనలో ఉన్నవి",
    "stat.approved_certified": "ఆమోదించబడినవి",
    "stat.sla_breaches": "గడువు ఉల్లంఘనలు",

    // Citizen Service Cards
    "service.my_parcels": "మ్యాప్‌లో నా భూమి",
    "service.my_parcels_desc": "సర్వే నంబరుతో జీఐఎస్ మ్యాప్ వీక్షించండి",
    "service.ror_extract": "పహానీ / 1-B నకలు",
    "service.ror_extract_desc": "డిజిటల్ సంతకం చేసిన పహానీ డౌన్‌లోడ్",
    "service.apply_mutation": "మ్యుటేషన్ (పట్టా బదిలీ) దరఖాస్తు",
    "service.apply_mutation_desc": "రిజిస్ట్రేషన్ తర్వాత పేరు మార్పిడి కోసం దరఖాస్తు",
    "service.track_apps": "దరఖాస్తు స్థితి తెలుసుకోండి",
    "service.track_apps_desc": "దశలవారీ పురోగతిని ట్రాక్ చేయండి",
    "service.encumbrance": "ఈసీ (ఎన్‌కంబరెన్స్ సర్టిఫికేట్)",
    "service.encumbrance_desc": "బ్యాంకు తనఖాలు మరియు చార్జీలను తనిఖీ చేయండి",
    "service.building_permission": "భవన నిర్మాణ అనుమతి",
    "service.building_permission_desc": "మున్సిపల్ భవన అనుమతి కోసం దరఖాస్తు",

    // GIS Map & Layers
    "map.layers": "మ్యాప్ లేయర్లు",
    "map.layer_satellite": "శాటిలైట్ హైబ్రిడ్",
    "map.layer_cadastral": "భూ నక్షా (వెక్టర్)",
    "map.layer_land_use": "భూ వినియోగం / జోనింగ్",
    "map.layer_conflicts": "సరిహద్దు వివాదాలు",
    "map.layer_topo": "టోపోగ్రాఫిక్",
    "map.search_placeholder": "సర్వే నంబరు లేదా యూఎల్‌పీఐఎన్ శోధించండి...",
    "map.legend_agricultural": "వ్యవసాయ భూమి (మాగాణి/మెట్ట)",
    "map.legend_residential": "నివాస ప్రాంతం",
    "map.legend_commercial": "వాణిజ్య భూమి",
    "map.legend_forest": "అటవీ భూమి",
    "map.legend_water": "జలాశయం / చెరువు",
    "map.legend_govt": "ప్రభుత్వ భూమి / పోరంబోకు",
    "map.view_land360": "ల్యాండ్ 360° వీక్షించండి",

    // Parcel Details Tabs
    "tab.overview": "అవలోకనం",
    "tab.ownership": "యాజమాన్యం (పట్టాదారు)",
    "tab.documents": "పత్రాలు",
    "tab.history": "చరిత్ర",
    "tab.prechecks": "ఆటోమేటెడ్ ప్రీ-చెక్స్",
    "tab.satellite_changes": "శాటిలైట్ మార్పులు",
    "tab.anomalies": "రిస్క్ మరియు వ్యత్యాసాలు",

    // Land Terms
    "term.ulpin": "యూఎల్‌పీఐఎన్ (ULPIN)",
    "term.survey_no": "సర్వే నంబరు",
    "term.khata_no": "ఖాతా నంబరు",
    "term.khesra_no": "సబ్-డివిజన్ నంబరు",
    "term.area": "విస్తీర్ణం",
    "term.village": "గ్రామం / మౌజా",
    "term.district": "జిల్లా",
    "term.state": "రాష్ట్రం",
    "term.land_use": "భూమి వర్గీకరణ",
    "term.raiyat": "పట్టాదారు / భూ యజమాని",
    "term.relation": "తండ్రి / భర్త పేరు",
    "term.share": "యాజమాన్య వాటా",
    "term.lagan": "భూమి పన్ను",
    "term.status": "స్థితి",
    "term.verified": "ధృవీకరించబడింది",
    "term.conflict": "వివాదంలో ఉంది",
    "term.encumbrance_free": "తనఖా రహితం",
    "term.court_case": "కోర్టు కేసు",

    // Actions & Buttons
    "action.apply": "దరఖాస్తు చేసుకోండి",
    "action.view_details": "వివరాలు చూడండి",
    "action.download_certificate": "సర్టిఫికేట్ డౌన్‌లోడ్",
    "action.switch_persona": "పాత్ర మార్చు",
    "action.approve": "మ్యుటేషన్ ఆమోదించండి",
    "action.reject": "తిరస్కరించండి",
    "action.request_inspection": "క్షేత్ర తనిఖీని కోరండి",
    "action.close": "మూసివేయి",
    "action.back": "వెనుకకు",
  },

  bn: {
    // Brand & Header
    "app.title": "ল্যান্ডস্ট্যাক (LandStack)",
    "app.tagline": "ভূমি শাসনের জন্য সমন্বিত জিআইএস ডিজিটাল পাবলিক ইনফ্রাস্ট্রাকচার",
    "app.sih_badge": "এসআইএইচ ২০২৬",
    "nav.language": "ভাষা",
    "nav.select_language": "ভাষা নির্বাচন করুন",
    "nav.switch_role": "ভূমিকা পরিবর্তন",
    "nav.active_role": "সক্রিয় ব্যবহারকারী",

    // Navigation Items
    "nav.home": "হোম",
    "nav.map": "ক্যা Groundাস্ট্রাল জিআইএস ম্যাপ",
    "nav.search": "ভূমি ৩৬০° অনুসন্ধান",
    "nav.services": "নাগরিক পরিষেবা",
    "nav.applications": "আবেদনের স্থিতি ট্র্যাক করুন",
    "nav.officer_desk": "রাজস্ব আধিকারিক ডেস্ক",
    "nav.conflicts": "সীমানা বিরোধ নিষ্পত্তি",
    "nav.intelligence": "এআই ভূ-গোয়েন্দা",
    "nav.security": "নিরাপত্তা ও নিরীক্ষা",
    "nav.adapters": "রাজ্য ভূমি রেকর্ড অ্যাডাপ্টার",
    "nav.menu": "মেনু",

    // Section Titles
    "section.core_navigation": "মূল নেভিগেশন",
    "section.citizen_services": "নাগরিক স্ব-পরিষেবা কর্মপ্রবাহ",
    "section.officer_tools": "সংবিধিবদ্ধ পর্যালোচনা ও যাচাইকরণ",
    "section.admin_governance": "সিস্টেম শাসন ও নিরাপত্তা",

    // Search Hero
    "hero.title": "ভূমি ৩৬০° একীভূত রেজিস্ট্রি",
    "hero.subtitle": "পরচা/খতিয়ান, নিবন্ধিত দলিল, নির্ভার সনদ, নকশা ও খাজনা রেকর্ড অনুসন্ধান করুন।",
    "hero.placeholder": "ইউএলপিআইএন (ULPIN), দাগ/খতিয়ান নং বা রায়তের নাম দিয়ে খুঁজুন...",
    "hero.search_button": "অনুসন্ধান",

    // Home Statistics
    "stat.recorded_parcels": "আমার রেকর্ডভুক্ত দাগ",
    "stat.total_landholding": "মোট জমির পরিমাণ",
    "stat.active_applications": "সক্রিয় আবেদন",
    "stat.annual_lagan": "বার্ষিক খাজনা / ভূমি রাজস্ব",
    "stat.pending_queue": "মুলতুবি তালিকা",
    "stat.in_review": "পর্যালোচনাধীন",
    "stat.approved_certified": "অনুমোদিত / প্রত্যয়িত",
    "stat.sla_breaches": "সময়সীমা লঙ্ঘন",

    // Citizen Service Cards
    "service.my_parcels": "মানচিত্রে আমার জমি",
    "service.my_parcels_desc": "দাগ নম্বর সহ জিআইএস নকশা দেখুন",
    "service.ror_extract": "খতিয়ান / পরচা নকল",
    "service.ror_extract_desc": "ডিজিটাল স্বাক্ষরিত পরচা ডাউনলোড করুন",
    "service.apply_mutation": "নামপত্তন (মিউটেশন) আবেদন",
    "service.apply_mutation_desc": "দলিল রেজিস্ট্রির পর স্বত্ব পরিবর্তনের আবেদন",
    "service.track_apps": "আবেদনের স্থিতি জানুন",
    "service.track_apps_desc": "ধাপভিত্তিক অগ্রগতি পর্যবেক্ষণ করুন",
    "service.encumbrance": "দায়মুক্ত সনদ (ইসি)",
    "service.encumbrance_desc": "ব্যাংক বন্ধক ও আর্থিক দায় যাচাই করুন",
    "service.building_permission": "ভবন নির্মাণ অনুমোদন",
    "service.building_permission_desc": "পৌরসভা ভবন নির্মাণ পারমিটের আবেদন",

    // GIS Map & Layers
    "map.layers": "মানচিত্র স্তর",
    "map.layer_satellite": "স্যাটেলাইট হাইব্রিড",
    "map.layer_cadastral": "ক্যাডাস্ট্রাল নকশা (ভেক্টর)",
    "map.layer_land_use": "জমির ব্যবহার / জোনিং",
    "map.layer_conflicts": "সীমানা বিরোধ",
    "map.layer_topo": "টপোগ্রাফিক",
    "map.search_placeholder": "দাগ নং বা ইউএলপিআইএন খুঁজুন...",
    "map.legend_agricultural": "কৃষি জমি (আমোণ/আউশ)",
    "map.legend_residential": "বাস্তু (বসতভিটা)",
    "map.legend_commercial": "বাণিজ্যিক",
    "map.legend_forest": "বনভূমি",
    "map.legend_water": "জলাশয় / পুকুর",
    "map.legend_govt": "সরকারি খাস জমি",
    "map.view_land360": "ভূমি ৩৬০° দেখুন",

    // Parcel Details Tabs
    "tab.overview": "সারসংক্ষেপ",
    "tab.ownership": "মালিকানা (রায়ত)",
    "tab.documents": "নথিপত্র",
    "tab.history": "ইতিহাস",
    "tab.prechecks": "স্বয়ংক্রিয় প্রাক-যাচাই",
    "tab.satellite_changes": "উপগ্রহীয় পরিবর্তন",
    "tab.anomalies": "ঝুঁকি ও অসঙ্গতি",

    // Land Terms
    "term.ulpin": "ইউএলপিআইএন (ULPIN)",
    "term.survey_no": "দাগ নম্বর (Survey No)",
    "term.khata_no": "খতিয়ান নম্বর",
    "term.khesra_no": "দাগ নম্বর",
    "term.area": "জমির পরিমাণ (শতক/একর)",
    "term.village": "মৌজা / গ্রাম",
    "term.district": "জেলা",
    "term.state": "রাজ্য",
    "term.land_use": "জমির শ্রেণি",
    "term.raiyat": "প্রধান রায়ত / জমির মালিক",
    "term.relation": "পিতা/স্বামীর নাম",
    "term.share": "মালিকানার অংশ",
    "term.lagan": "বার্ষিক খাজনা",
    "term.status": "স্থিতি",
    "term.verified": "যাচাইকৃত",
    "term.conflict": "বিরোধপূর্ণ",
    "term.encumbrance_free": "দায়মুক্ত",
    "term.court_case": "আদালত মামলা",

    // Actions & Buttons
    "action.apply": "আবেদন করুন",
    "action.view_details": "বিস্তারিত দেখুন",
    "action.download_certificate": "সনদপত্র ডাউনলোড করুন",
    "action.switch_persona": "ভূমিকা পরিবর্তন",
    "action.approve": "নামপত্তন অনুমোদন করুন",
    "action.reject": "প্রত্যাখ্যান করুন",
    "action.request_inspection": "সরেজমিনে তদন্ত নির্দেশ",
    "action.close": "বন্ধ করুন",
    "action.back": "পেছনে",
  },

  mr: {
    // Brand & Header
    "app.title": "लँडस्टॅक (LandStack)",
    "app.tagline": "भूमी प्रशासनासाठी एकात्मिक जीआयएस डिजिटल सार्वजनिक पायाभूत सुविधा",
    "app.sih_badge": "एसआयएच २०२६",
    "nav.language": "भाषा",
    "nav.select_language": "भाषा निवडा",
    "nav.switch_role": "भूमिका बदला",
    "nav.active_role": "सक्रिय वापरकर्ता",

    // Navigation Items
    "nav.home": "मुख्य पृष्ठ",
    "nav.map": "भू-नकाशा (कॅडस्ट्रल जीआयएस)",
    "nav.search": "भूमी ३६०° शोध",
    "nav.services": "नागरिक सेवा",
    "nav.applications": "अर्जाची स्थिती ट्रॅक करा",
    "nav.officer_desk": "महसूल अधिकारी कक्ष",
    "nav.conflicts": "सीमा वाद निवारण",
    "nav.intelligence": "एआय भू-माहिती",
    "nav.security": "सुरक्षा आणि ऑडिट",
    "nav.adapters": "राज्य भूमी अभिलेख अडॅप्टर",
    "nav.menu": "मेनू",

    // Section Titles
    "section.core_navigation": "मुख्य नेव्हिगेशन",
    "section.citizen_services": "नागरिक स्व-सेवा कार्यप्रवाह",
    "section.officer_tools": "वैधानिक पुनरावलोकन व पडताळणी",
    "section.admin_governance": "प्रणाली प्रशासन व सुरक्षा",

    // Search Hero
    "hero.title": "भूमी ३६०° एकात्मिक नोंदवही",
    "hero.subtitle": "७/१२ उतारा, ८-अ, नोंदणीकृत दस्तऐवज, बोजा प्रमाणपत्र, भू-नकाशा आणि शेतसारा शोधा.",
    "hero.placeholder": "यूलपीआयएन (ULPIN), गट/सर्व्हे नं. किंवा खातेदाराच्या नावाने शोधा...",
    "hero.search_button": "शोधा",

    // Home Statistics
    "stat.recorded_parcels": "माझ्या नोंदणीकृत जमिनी (गट नं.)",
    "stat.total_landholding": "एकूण जमीन क्षेत्र",
    "stat.active_applications": "सक्रिय अर्ज",
    "stat.annual_lagan": "वार्षिक शेतसारा / महसूल",
    "stat.pending_queue": "प्रलंबित यादी",
    "stat.in_review": "सक्रिय पुनरावलोकनात",
    "stat.approved_certified": "मंजूर / प्रमाणित",
    "stat.sla_breaches": "वेळमर्यादा उल्लंघन",

    // Citizen Service Cards
    "service.my_parcels": "नकाशावर माझी जमीन",
    "service.my_parcels_desc": "गट क्रमांकासह जीआयएस नकाशा पहा",
    "service.ror_extract": "७/१२ आणि ८-अ उतारा",
    "service.ror_extract_desc": "डिजिटल स्वाक्षरी केलेला ७/१२ उतारा डाउनलोड करा",
    "service.apply_mutation": "फेरफार नोंद अर्ज",
    "service.apply_mutation_desc": "दस्त नोंदणीनंतर मालकी हक्क हस्तांतरणासाठी अर्ज",
    "service.track_apps": "अर्जाची स्थिती तपासा",
    "service.track_apps_desc": "टप्प्याटप्प्याने प्रगती ट्रॅक करा",
    "service.encumbrance": "बोजा प्रमाणपत्र (EC)",
    "service.encumbrance_desc": "बँक कर्ज व बोजाची पडताळणी करा",
    "service.building_permission": "इमारत बांधकाम परवानगी",
    "service.building_permission_desc": "महानगरपालिका बांधकाम परवानगीसाठी अर्ज करा",

    // GIS Map & Layers
    "map.layers": "नकाशा स्तर",
    "map.layer_satellite": "उपग्रह दृश्य",
    "map.layer_cadastral": "भू-नकाशा (कॅडस्ट्रल)",
    "map.layer_land_use": "जमीन वापर / झोनिंग",
    "map.layer_conflicts": "सीमा वाद",
    "map.layer_topo": "टोपोग्राफिक",
    "map.search_placeholder": "गट नं. किंवा यूलपीआयएन शोधा...",
    "map.legend_agricultural": "शेती जमीन (जिरायत/बागायत)",
    "map.legend_residential": "निवासी (गावठाण)",
    "map.legend_commercial": "व्यावसायिक",
    "map.legend_forest": "वन जमीन",
    "map.legend_water": "पाणवठा / तलाव",
    "map.legend_govt": "सरकारी / गायरान जमीन",
    "map.view_land360": "भूमी ३६०° पहा",

    // Parcel Details Tabs
    "tab.overview": "आढावा",
    "tab.ownership": "मालकी (खातेदार)",
    "tab.documents": "कागदपत्रे",
    "tab.history": "इतिहास",
    "tab.prechecks": "स्वयंचलित पूर्व-तपासणी",
    "tab.satellite_changes": "उपग्रह बदल",
    "tab.anomalies": "जोखीम आणि विसंगती",

    // Land Terms
    "term.ulpin": "यूलपीआयएन (ULPIN)",
    "term.survey_no": "गट / सर्व्हे नंबर",
    "term.khata_no": "खाते क्रमांक",
    "term.khesra_no": "पोट हिस्सा नंबर",
    "term.area": "क्षेत्रफळ (हेक्टर/आर)",
    "term.village": "गाव / मौजे",
    "term.district": "जिल्हा",
    "term.state": "राज्य",
    "term.land_use": "जमिनीचा प्रकार",
    "term.raiyat": "मुख्य खातेदार / भूधारक",
    "term.relation": "वडिलांचे/पतीचे नाव",
    "term.share": "मालकी हिस्सा",
    "term.lagan": "वार्षिक शेतसारा",
    "term.status": "स्थिती",
    "term.verified": "पडताळणी पूर्ण",
    "term.conflict": "वादग्रस्त",
    "term.encumbrance_free": "बोजा मुक्त",
    "term.court_case": "न्यायालयीन खटला",

    // Actions & Buttons
    "action.apply": "अर्ज करा",
    "action.view_details": "तपशील पहा",
    "action.download_certificate": "प्रमाणपत्र डाउनलोड करा",
    "action.switch_persona": "भूमिका बदला",
    "action.approve": "फेरफार मंजूर करा",
    "action.reject": "नाकारा",
    "action.request_inspection": "स्थळ पाहणी आदेश",
    "action.close": "बंद करा",
    "action.back": "मागे",
  },

  kn: {
    // Brand & Header
    "app.title": "ಲ್ಯಾಂಡ್‌ಸ್ಟಾಕ್ (LandStack)",
    "app.tagline": "ಭೂ ಆಡಳಿತಕ್ಕಾಗಿ ಸಮಗ್ರ ಜಿಐಎಸ್ ಡಿಜಿಟಲ್ ಸಾರ್ವಜನಿಕ ಮೂಲಸೌಕರ್ಯ",
    "app.sih_badge": "ಎಸ್ಐಎಚ್ 2026",
    "nav.language": "ಭಾಷೆ",
    "nav.select_language": "ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    "nav.switch_role": "ಪಾತ್ರ ಬದಲಾಯಿಸಿ",
    "nav.active_role": "ಪ್ರಸ್ತುತ ಸಕ್ರಿಯ",

    // Navigation Items
    "nav.home": "ಮುಖಪುಟ",
    "nav.map": "ಭೂ ನಕ್ಷೆ (ಕ್ಯಾಡಾಸ್ಟ್ರಲ್ ಜಿಐಎಸ್)",
    "nav.search": "ಭೂಮಿ 360° ಹುಡುಕಾಟ",
    "nav.services": "ನಾಗರಿಕ ಸೇವೆಗಳು",
    "nav.applications": "ಅರ್ಜಿ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ",
    "nav.officer_desk": "ಕಂದಾಯ ಅಧಿಕಾರಿ ಡೆಸ್ಕ್",
    "nav.conflicts": "ಗಡಿ ವಿವಾದ ಪರಿಹಾರ",
    "nav.intelligence": "ಎಐ ಭೂ ಗುಪ್ತಚರ",
    "nav.security": "ಭದ್ರತೆ ಮತ್ತು ಲೆಕ್ಕಪರಿಶೋಧನೆ",
    "nav.adapters": "ರಾಜ್ಯ ಭೂ ದಾಖಲೆ ಅಡಾಪ್ಟರ್",
    "nav.menu": "ಮೆನು",

    // Section Titles
    "section.core_navigation": "ಮುಖ್ಯ ನ್ಯಾವಿಗೇಷನ್",
    "section.citizen_services": "ನಾಗರಿಕ ಸ್ವಯಂ ಸೇವೆ",
    "section.officer_tools": "ಶಾಸನಬದ್ಧ ಪರಿಶೀಲನೆ",
    "section.admin_governance": "ವ್ಯವಸ್ಥೆಯ ಆಡಳಿತ ಮತ್ತು ಭದ್ರತೆ",

    // Search Hero
    "hero.title": "ಭೂಮಿ 360° ಸಮಗ್ರ ನೋಂದಣಿ",
    "hero.subtitle": "ಪಹಣಿ/ಆರ್‌ಟಿಸಿ, ನೋಂದಾಯಿತ ಪತ್ರ, ಇಸಿ, ಭೂ ನಕ್ಷೆ ಮತ್ತು ಕಂದಾಯ ದಾಖಲೆಗಳನ್ನು ಹುಡುಕಿ.",
    "hero.placeholder": "ಯುಎಲ್‌ಪಿಐಎನ್ (ULPIN), ಸರ್ವೇ ನಂಬರ್ ಅಥವಾ ಮಾಲೀಕರ ಹೆಸರಿನಿಂದ ಹುಡುಕಿ...",
    "hero.search_button": "ಹುಡುಕಿ",

    // Home Statistics
    "stat.recorded_parcels": "ನನ್ನ ನೋಂದಾಯಿತ ಭೂಮಿ",
    "stat.total_landholding": "ಒಟ್ಟು ಜಮೀನು ವಿಸ್ತೀರ್ಣ",
    "stat.active_applications": "ಸಕ್ರಿಯ ಅರ್ಜಿಗಳು",
    "stat.annual_lagan": "ವಾರ್ಷಿಕ ಕಂದಾಯ",
    "stat.pending_queue": "ಬಾಕಿ ಇರುವ ಪಟ್ಟಿ",
    "stat.in_review": "ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ",
    "stat.approved_certified": "ಅನುಮೋದಿಸಲಾಗಿದೆ",
    "stat.sla_breaches": "ಗಡುವು ಮೀರಿದವು",

    // Citizen Service Cards
    "service.my_parcels": "ನಕ್ಷೆಯಲ್ಲಿ ನನ್ನ ಜಮೀನು",
    "service.my_parcels_desc": "ಸರ್ವೇ ನಂಬರ್‌ನೊಂದಿಗೆ ಜಿಐಎಸ್ ನಕ್ಷೆ ವೀಕ್ಷಿಸಿ",
    "service.ror_extract": "ಪಹಣಿ / ಆರ್‌ಟಿಸಿ ಪ್ರತಿ",
    "service.ror_extract_desc": "ಡಿಜಿಟಲ್ ಸಹಿ ಮಾಡಿದ ಪಹಣಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    "service.apply_mutation": "ಖಾತಾ ಬದಲಾವಣೆ (ಮ್ಯುಟೇಶನ್) ಅರ್ಜಿ",
    "service.apply_mutation_desc": "ಕ್ರಯಪತ್ರದ ನಂತರ ಹೆಸರು ಬದಲಾವಣೆಗಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
    "service.track_apps": "ಅರ್ಜಿ ಸ್ಥಿತಿ ತಿಳಿಯಿರಿ",
    "service.track_apps_desc": "ಹಂತ ಹಂತದ ಪ್ರಗತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
    "service.encumbrance": "ಋಣಭಾರ ಪ್ರಮಾಣಪತ್ರ (EC)",
    "service.encumbrance_desc": "ಬ್ಯಾಂಕ್ ಸಾಲ ಮತ್ತು ಹೊಣೆಗಾರಿಕೆ ಪರಿಶೀಲಿಸಿ",
    "service.building_permission": "ಕಟ್ಟಡ ನಿರ್ಮಾಣ ಅನುಮತಿ",
    "service.building_permission_desc": "ಪುರಸಭೆ ಕಟ್ಟಡ ಪರವಾನಗಿಗಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",

    // GIS Map & Layers
    "map.layers": "ನಕ್ಷೆಯ ಪದರಗಳು",
    "map.layer_satellite": "ಉಪಗ್ರಹ ಹೈಬ್ರಿಡ್",
    "map.layer_cadastral": "ಭೂ ನಕ್ಷೆ (ವೆಕ್ಟರ್)",
    "map.layer_land_use": "ಭೂ ಬಳಕೆ / ವಲಯ",
    "map.layer_conflicts": "ಗಡಿ ವಿವಾದಗಳು",
    "map.layer_topo": "ಸ್ಥಳಾಕೃತಿ",
    "map.search_placeholder": "ಸರ್ವೇ ನಂ. ಅಥವಾ ಯುಎಲ್‌ಪಿಐಎನ್ ಹುಡುಕಿ...",
    "map.legend_agricultural": "ಕೃಷಿ ಭೂಮಿ (ತರಿ/ಖುಷ್ಕಿ)",
    "map.legend_residential": "ವಸತಿ ಪ್ರದೇಶ",
    "map.legend_commercial": "ವಾಣಿಜ್ಯ",
    "map.legend_forest": "ಅರಣ್ಯ ಭೂಮಿ",
    "map.legend_water": "ಜಲಮೂಲ / ಕೆರೆ",
    "map.legend_govt": "ಸರ್ಕಾರಿ ಗೋಮಾಳ ಭೂಮಿ",
    "map.view_land360": "ಭೂಮಿ 360° ವೀಕ್ಷಿಸಿ",

    // Parcel Details Tabs
    "tab.overview": "ಅವಲೋಕನ",
    "tab.ownership": "ಮಾಲೀಕತ್ವ (ಖಾತೆದಾರ)",
    "tab.documents": "ದಾಖಲೆಗಳು",
    "tab.history": "ಇತಿಹಾಸ",
    "tab.prechecks": "ಸ್ವಯಂಚಾಲಿತ ಪೂರ್ವ-ಪರಿಶೀಲನೆ",
    "tab.satellite_changes": "ಉಪಗ್ರಹ ಬದಲಾವಣೆಗಳು",
    "tab.anomalies": "ಅಪಾಯಗಳು ಮತ್ತು ವ್ಯತ್ಯಾಸಗಳು",

    // Land Terms
    "term.ulpin": "ಯುಎಲ್‌ಪಿಐಎನ್ (ULPIN)",
    "term.survey_no": "ಸರ್ವೇ ನಂಬರ್",
    "term.khata_no": "ಖಾತೆ ನಂಬರ್",
    "term.khesra_no": "ಹಿಸ್ಸಾ ನಂಬರ್",
    "term.area": "ವಿಸ್ತೀರ್ಣ (ಎಕರೆ/ಗುಂಟೆ)",
    "term.village": "ಗ್ರಾಮ",
    "term.district": "ಜಿಲ್ಲೆ",
    "term.state": "ರಾಜ್ಯ",
    "term.land_use": "ಜಮೀನಿನ ವಿವರ",
    "term.raiyat": "ಖಾತೆದಾರ / ಮಾಲೀಕ",
    "term.relation": "ತಂದೆ/ಗಂಡನ ಹೆಸರು",
    "term.share": "ಮಾಲೀಕತ್ವದ ಪಾಲು",
    "term.lagan": "ವಾರ್ಷಿಕ ಕಂದಾಯ",
    "term.status": "ಸ್ಥಿತಿ",
    "term.verified": "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    "term.conflict": "ವಿವಾದದಲ್ಲಿದೆ",
    "term.encumbrance_free": "ಋಣಭಾರ ರಹಿತ",
    "term.court_case": "ನ್ಯಾಯಾಲಯದ ಮೊಕದ್ದಮೆ",

    // Actions & Buttons
    "action.apply": "ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
    "action.view_details": "ವಿವರ ವೀಕ್ಷಿಸಿ",
    "action.download_certificate": "ಪ್ರಮಾಣಪತ್ರ ಡೌನ್‌ಲೋಡ್",
    "action.switch_persona": "ಪಾತ್ರ ಬದಲಾಯಿಸಿ",
    "action.approve": "ಮ್ಯುಟೇಶನ್ ಅನುಮೋದಿಸಿ",
    "action.reject": "ತಿರಸ್ಕರಿಸಿ",
    "action.request_inspection": "ಸ್ಥಳ ಪರಿಶೀಲನೆ ಆದೇಶ",
    "action.close": "ಮುಚ್ಚಿ",
    "action.back": "ಹಿಂದಕ್ಕೆ",
  },

  gu: {
    // Brand & Header
    "app.title": "લેન્ડસ્ટેક (LandStack)",
    "app.tagline": "જમીન શાસન માટે એકીકૃત જીઆઈએસ ડિજિટલ જાહેર માળખું",
    "app.sih_badge": "એસઆઈએચ ૨૦૨૬",
    "nav.language": "ભાષા",
    "nav.select_language": "ભાષા પસંદ કરો",
    "nav.switch_role": "ભૂમિકા બદલો",
    "nav.active_role": "સક્રિય વપરાશકર્તા",

    // Navigation Items
    "nav.home": "હોમ (મુખ્ય પૃષ્ઠ)",
    "nav.map": "જમીન નકશો (જીઆઈએસ)",
    "nav.search": "જમીન ૩૬૦° શોધ",
    "nav.services": "નાગરિક સેવાઓ",
    "nav.applications": "અરજીની સ્થિતિ તપાસો",
    "nav.officer_desk": "મહેસૂલ અધિકારી ડેસ્ક",
    "nav.conflicts": "સીમા વિવાદ નિવારણ",
    "nav.intelligence": "એઆઈ ભૂ-ઇન્ટેલિજન્સ",
    "nav.security": "સુરક્ષા અને ઓડિટ",
    "nav.adapters": "રાજ્ય જમીન રેકોર્ડ એડેપ્ટર",
    "nav.menu": "મેનુ",

    // Section Titles
    "section.core_navigation": "મુખ્ય નેવિગેશન",
    "section.citizen_services": "નાગરિક સ્વ-સેવા પ્રક્રિયા",
    "section.officer_tools": "કાનૂની સમીક્ષા અને ચકાસણી",
    "section.admin_governance": "સિસ્ટમ શાસન અને સુરક્ષા",

    // Search Hero
    "hero.title": "જમીન ૩૬૦° એકીકૃત રજિસ્ટ્રી",
    "hero.subtitle": "૭/૧૨ નો ઉતારો, ૮-અ, દસ્તાવેજ, બોજા પ્રમાણપત્ર અને જમીન મહેસૂલ રેકોર્ડ શોધો.",
    "hero.placeholder": "યૂએલપીઆઈએન (ULPIN), સર્વે/બ્લોક નં. અથવા ખાતેદારના નામથી શોધો...",
    "hero.search_button": "શોધો",

    // Home Statistics
    "stat.recorded_parcels": "મારા નોંધાયેલા સર્વે નંબર",
    "stat.total_landholding": "કુલ જમીન ક્ષેત્રફળ",
    "stat.active_applications": "ચાલુ અરજીઓ",
    "stat.annual_lagan": "વાર્ષિક જમીન મહેસૂલ",
    "stat.pending_queue": "બાકી યાદી",
    "stat.in_review": "સમીક્ષા હેઠળ",
    "stat.approved_certified": "મંજૂર / પ્રમાણિત",
    "stat.sla_breaches": "સમયમર્યાદા ઉલ્લંઘન",

    // Citizen Service Cards
    "service.my_parcels": "નકશા પર મારી જમીન",
    "service.my_parcels_desc": "સર્વે નંબર સાથે જીઆઈએસ નકશો જુઓ",
    "service.ror_extract": "૭/૧૨ અને ૮-અ નો ઉતારો",
    "service.ror_extract_desc": "ડિજિટલી સહી કરેલ ૭/૧૨ ઉતારો ડાઉનલોડ કરો",
    "service.apply_mutation": "હક્ક પત્રક ફેરફાર (નોંધ) અરજી",
    "service.apply_mutation_desc": "દસ્તાવેજ રજિસ્ટ્રી પછી નામ ફેરફાર માટે અરજી",
    "service.track_apps": "અરજીની સ્થિતિ જાણો",
    "service.track_apps_desc": "તબક્કાવાર પ્રગતિ તપાસો",
    "service.encumbrance": "બોજા મુક્તિ પ્રમાણપત્ર (EC)",
    "service.encumbrance_desc": "બેંક લોન અને બોજાની ચકાસણી કરો",
    "service.building_permission": "બાંધકામ મંજૂરી (રજાચિઠ્ઠી)",
    "service.building_permission_desc": "નગરપાલિકા બાંધકામ પરવાનગી માટે અરજી",

    // GIS Map & Layers
    "map.layers": "નકશા લેયર્સ",
    "map.layer_satellite": "સેટેલાઇટ હાઇબ્રિડ",
    "map.layer_cadastral": "જમીન નકશો (વેક્ટર)",
    "map.layer_land_use": "જમીન વપરાશ / ઝોનિંગ",
    "map.layer_conflicts": "સીમા વિવાદો",
    "map.layer_topo": "સ્થળાકૃતિ",
    "map.search_placeholder": "સર્વે નં. અથવા યૂએલપીઆઈએન શોધો...",
    "map.legend_agricultural": "ખેતીની જમીન (પીયત/બિનપીયત)",
    "map.legend_residential": "રહેણાંક (ગામતળ)",
    "map.legend_commercial": "વાણિજ્યિક",
    "map.legend_forest": "જંગલ જમીન",
    "map.legend_water": "જળાશય / તળાવ",
    "map.legend_govt": "સરકારી / ગૌચર જમીન",
    "map.view_land360": "જમીન ૩૬૦° જુઓ",

    // Parcel Details Tabs
    "tab.overview": "વિહંગાવલોકન",
    "tab.ownership": "માલિકી (ખાતેદાર)",
    "tab.documents": "દસ્તાવેજો",
    "tab.history": "ઇતિહાસ",
    "tab.prechecks": "સ્વચાલિત પૂર્વ-તપાસ",
    "tab.satellite_changes": "સેટેલાઇટ ફેરફારો",
    "tab.anomalies": "જોખમો અને વિસંગતતાઓ",

    // Land Terms
    "term.ulpin": "યૂએલપીઆઈએન (ULPIN)",
    "term.survey_no": "સર્વે / બ્લોક નંબર",
    "term.khata_no": "ખાતા નંબર",
    "term.khesra_no": "પૈકી નંબર",
    "term.area": "ક્ષેત્રફળ (હેક્ટર-આરે)",
    "term.village": "ગામ / મોજે",
    "term.district": "જિલ્લો",
    "term.state": "રાજ્ય",
    "term.land_use": "જમીનનો પ્રકાર",
    "term.raiyat": "મુખ્ય ખાતેદાર / જમીન માલિક",
    "term.relation": "પિતા/પતિનું નામ",
    "term.share": "માલિકી હિસ્સો",
    "term.lagan": "વાર્ષિક મહેસૂલ",
    "term.status": "સ્થિતિ",
    "term.verified": "ચકાસાયેલ",
    "term.conflict": "વિવાદગ્રસ્ત",
    "term.encumbrance_free": "બોજા મુક્ત",
    "term.court_case": "કોર્ટ કેસ",

    // Actions & Buttons
    "action.apply": "અરજી કરો",
    "action.view_details": "વિગત જુઓ",
    "action.download_certificate": "પ્રમાણપત્ર ડાઉનલોડ",
    "action.switch_persona": "ભૂમિકા બદલો",
    "action.approve": "ફેરફાર નોંધ મંજૂર કરો",
    "action.reject": "નામંજૂર કરો",
    "action.request_inspection": "સ્થળ તપાસ હુકમ",
    "action.close": "બંધ કરો",
    "action.back": "પાછા જાઓ",
  },

  pa: {
    // Brand & Header
    "app.title": "ਲੈਂਡਸਟੈਕ (LandStack)",
    "app.tagline": "ਜ਼ਮੀਨੀ ਸ਼ਾਸਨ ਲਈ ਏਕੀਕ੍ਰਿਤ ਜੀਆਈਐਸ ਡਿਜੀਟਲ ਜਨਤਕ ਬੁਨਿਆਦੀ ਢਾਂਚਾ",
    "app.sih_badge": "ਐਸਆਈਐਚ 2026",
    "nav.language": "ਭਾਸ਼ਾ",
    "nav.select_language": "ਭਾਸ਼ਾ ਚੁਣੋ",
    "nav.switch_role": "ਭੂਮਿਕਾ ਬਦਲੋ",
    "nav.active_role": "ਸਰਗਰਮ ਉਪਭੋਗਤਾ",

    // Navigation Items
    "nav.home": "ਮੁੱਖ ਪੰਨਾ (ਹੋਮ)",
    "nav.map": "ਭੂ-ਨਕਸ਼ਾ (ਕੈਡਸਟ੍ਰਲ ਜੀਆਈਐਸ)",
    "nav.search": "ਜ਼ਮੀਨ 360° ਖੋਜ",
    "nav.services": "ਨਾਗਰਿਕ ਸੇਵਾਵਾਂ",
    "nav.applications": "ਅਰਜ਼ੀ ਦੀ ਸਥਿਤੀ ਦੇਖੋ",
    "nav.officer_desk": "ਮਾਲ ਅਧਿਕਾਰੀ ਡੈਸਕ",
    "nav.conflicts": "ਹੱਦਬੰਦੀ ਝਗੜਾ ਨਿਪਟਾਰਾ",
    "nav.intelligence": "ਏਆਈ ਖੁਫੀਆ ਤੰਤਰ",
    "nav.security": "ਸੁਰੱਖਿਆ ਅਤੇ ਆਡਿਟ",
    "nav.adapters": "ਰਾਜ ਜ਼ਮੀਨੀ ਰਿਕਾਰਡ ਅਡਾਪਟਰ",
    "nav.menu": "ਮੀਨੂ",

    // Section Titles
    "section.core_navigation": "ਮੁੱਖ ਨੈਵੀਗੇਸ਼ਨ",
    "section.citizen_services": "ਨਾਗਰਿਕ ਸਵੈ-ਸੇਵਾ",
    "section.officer_tools": "ਕਾਨੂੰਨੀ ਪੜਤਾਲ ਅਤੇ ਤਸਦੀਕ",
    "section.admin_governance": "ਪ੍ਰਣਾਲੀ ਪ੍ਰਸ਼ਾਸਨ ਅਤੇ ਸੁਰੱਖਿਆ",

    // Search Hero
    "hero.title": "ਜ਼ਮੀਨ 360° ਏਕੀਕ੍ਰਿਤ ਰਜਿਸਟਰੀ",
    "hero.subtitle": "ਜਮ੍ਹਾਂਬੰਦੀ/ਫ਼ਰਦ, ਰਜਿਸਟਰੀਆਂ, ਗੈਰ-ਭਾਰ ਸਰਟੀਫਿਕੇਟ, ਅਕਸ-ਸ਼ਜਰਾ ਅਤੇ ਮਾਲੀਆ ਰਿਕਾਰਡ ਲੱਭੋ.",
    "hero.placeholder": "ਯੂਐਲਪੀਆਈਐਨ (ULPIN), ਖਸਰਾ ਨੰਬਰ ਜਾਂ ਮਾਲਕ ਦੇ ਨਾਮ ਨਾਲ ਖੋਜੋ...",
    "hero.search_button": "ਖੋਜੋ",

    // Home Statistics
    "stat.recorded_parcels": "ਮੇਰੇ ਦਰਜ ਖਸਰਾ ਨੰਬਰ",
    "stat.total_landholding": "ਕੁੱਲ ਰਕਬਾ (ਜ਼ਮੀਨ)",
    "stat.active_applications": "ਚੱਲ ਰਹੀਆਂ ਅਰਜ਼ੀਆਂ",
    "stat.annual_lagan": "ਸਾਲਾਨਾ ਮਾਲੀਆ / ਮਾਮਲਾ",
    "stat.pending_queue": "ਬਕਾਇਆ ਸੂਚੀ",
    "stat.in_review": "ਸਮੀਖਿਆ ਅਧੀਨ",
    "stat.approved_certified": "ਮਨਜ਼ੂਰ / ਪ੍ਰਮਾਣਿਤ",
    "stat.sla_breaches": "ਮਿਆਦ ਪੁੱਗੀਆਂ ਅਰਜ਼ੀਆਂ",

    // Citizen Service Cards
    "service.my_parcels": "ਨਕਸ਼ੇ 'ਤੇ ਮੇਰੀ ਜ਼ਮੀਨ",
    "service.my_parcels_desc": "ਖਸਰਾ ਨੰਬਰ ਨਾਲ ਜੀਆਈਐਸ ਨਕਸ਼ਾ ਦੇਖੋ",
    "service.ror_extract": "ਜਮ੍ਹਾਂਬੰਦੀ / ਫ਼ਰਦ ਨਕਲ",
    "service.ror_extract_desc": "ਡਿਜੀਟਲ ਦਸਤਖਤਾਂ ਵਾਲੀ ਫ਼ਰਦ ਡਾਊਨਲੋਡ ਕਰੋ",
    "service.apply_mutation": "ਇੰਤਕਾਲ (ਨਾਮਾਂਤਰਣ) ਅਰਜ਼ੀ",
    "service.apply_mutation_desc": "ਬੈਅਨਾਮਾ ਰਜਿਸਟਰੀ ਤੋਂ ਬਾਅਦ ਇੰਤਕਾਲ ਦਰਜ ਕਰਵਾਓ",
    "service.track_apps": "ਅਰਜ਼ੀ ਦੀ ਸਥਿਤੀ ਜਾਣੋ",
    "service.track_apps_desc": "ਪੜਾਅਵਾਰ ਤਰੱਕੀ ਦੀ ਨਿਗਰਾਨੀ ਕਰੋ",
    "service.encumbrance": "ਗੈਰ-ਬੋਝ ਸਰਟੀਫਿਕੇਟ (EC)",
    "service.encumbrance_desc": "ਬੈਂਕ ਗਹਿਣੇ ਅਤੇ ਕਰਜ਼ੇ ਦੀ ਪੜਤਾਲ ਕਰੋ",
    "service.building_permission": "ਇਮਾਰਤ ਉਸਾਰੀ ਮਨਜ਼ੂਰੀ",
    "service.building_permission_desc": "ਮਿਊਂਸੀਪਲ ਕਮੇਟੀ ਤੋਂ ਨਕਸ਼ਾ ਪਾਸ ਕਰਵਾਓ",

    // GIS Map & Layers
    "map.layers": "ਨਕਸ਼ਾ ਪਰਤਾਂ",
    "map.layer_satellite": "ਸੈਟੇਲਾਈਟ ਹਾਈਬ੍ਰਿਡ",
    "map.layer_cadastral": "ਭੂ-ਨਕਸ਼ਾ (ਅਕਸ-ਸ਼ਜਰਾ)",
    "map.layer_land_use": "ਜ਼ਮੀਨ ਵਰਤੋਂ / ਜ਼ੋਨਿੰਗ",
    "map.layer_conflicts": "ਹੱਦਬੰਦੀ ਵਿਵਾਦ",
    "map.layer_topo": "ਧਰਾਤਲ ਨਕਸ਼ਾ",
    "map.search_placeholder": "ਖਸਰਾ ਨੰਬਰ ਜਾਂ ਯੂਐਲਪੀਆਈਐਨ ਖੋਜੋ...",
    "map.legend_agricultural": "ਖੇਤੀਬਾੜੀ ਜ਼ਮੀਨ (ਨਹਿਰੀ/ਚਾਹੀ)",
    "map.legend_residential": "ਰਿਹਾਇਸ਼ੀ (ਆਬਾਦੀ ਦੇਹ)",
    "map.legend_commercial": "ਵਪਾਰਕ",
    "map.legend_forest": "ਜੰਗਲਾਤ ਜ਼ਮੀਨ",
    "map.legend_water": "ਛੱਪੜ / ਦਰਿਆ",
    "map.legend_govt": "ਸ਼ਾਮਲਾਤ / ਸਰਕਾਰੀ ਜ਼ਮੀਨ",
    "map.view_land360": "ਜ਼ਮੀਨ 360° ਦੇਖੋ",

    // Parcel Details Tabs
    "tab.overview": "ਸੰਖੇਪ ਜਾਣਕਾਰੀ",
    "tab.ownership": "ਮਾਲਕੀ (ਖੇਵਟਦਾਰ)",
    "tab.documents": "ਦਸਤਾਵੇਜ਼",
    "tab.history": "ਇਤਿਹਾਸ",
    "tab.prechecks": "ਆਟੋਮੈਟਿਕ ਪੂਰਵ-ਜਾਂਚ",
    "tab.satellite_changes": "ਸੈਟੇਲਾਈਟ ਤਬਦੀਲੀਆਂ",
    "tab.anomalies": "ਜੋਖਮ ਅਤੇ ਅੰਤਰ",

    // Land Terms
    "term.ulpin": "ਯੂਐਲਪੀਆਈਐਨ (ULPIN)",
    "term.survey_no": "ਖਸਰਾ / ਕਿੱਲਾ ਨੰਬਰ",
    "term.khata_no": "ਖੇਵਟ / ਖਤੌਨੀ ਨੰਬਰ",
    "term.khesra_no": "ਕਿੱਲਾ ਨੰਬਰ",
    "term.area": "ਰਕਬਾ (ਕਨਾਲ/ਮਰਲੇ)",
    "term.village": "ਪਿੰਡ / ਹਦਬਸਤ",
    "term.district": "ਜ਼ਿਲ੍ਹਾ",
    "term.state": "ਰਾਜ",
    "term.land_use": "ਕਿਸਮ ਜ਼ਮੀਨ",
    "term.raiyat": "ਖੁਦਕਾਸ਼ਤ / ਜ਼ਮੀਨ ਮਾਲਕ",
    "term.relation": "ਪਿਤਾ/ਪਤੀ ਦਾ ਨਾਮ",
    "term.share": "ਮਾਲਕੀ ਹਿੱਸਾ",
    "term.lagan": "ਮਾਲੀਆ / ਮਾਮਲਾ",
    "term.status": "ਸਥਿਤੀ",
    "term.verified": "ਤਸਦੀਕਸ਼ੁਦਾ",
    "term.conflict": "ਝਗੜੇ ਅਧੀਨ",
    "term.encumbrance_free": "ਬੋਝ ਮੁਕਤ",
    "term.court_case": "ਅਦਾਲਤੀ ਕੇਸ",

    // Actions & Buttons
    "action.apply": "ਅਰਜ਼ੀ ਦਿਓ",
    "action.view_details": "ਵੇਰਵਾ ਦੇਖੋ",
    "action.download_certificate": "ਸਰਟੀਫਿਕੇਟ ਡਾਊਨਲੋਡ ਕਰੋ",
    "action.switch_persona": "ਭੂਮਿਕਾ ਬਦਲੋ",
    "action.approve": "ਇੰਤਕਾਲ ਮਨਜ਼ੂਰ ਕਰੋ",
    "action.reject": "ਰੱਦ ਕਰੋ",
    "action.request_inspection": "ਮੌਕਾ ਮੁਆਇਨਾ ਹੁਕਮ",
    "action.close": "ਬੰਦ ਕਰੋ",
    "action.back": "ਪਿੱਛੇ",
  },
};

export function getTranslation(lang: string, key: string, params?: Record<string, string | number>): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  let text = dict[key] || TRANSLATIONS.en[key] || key;

  if (params) {
    Object.entries(params).forEach(([paramKey, paramVal]) => {
      text = text.replace(new RegExp(`{${paramKey}}`, "g"), String(paramVal));
    });
  }

  return text;
}

