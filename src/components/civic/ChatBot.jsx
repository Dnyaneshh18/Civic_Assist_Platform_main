import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

const FLOWS_EN = {
  start: {
    message: "Hi! I'm your CivicAssist helper 👋\nWhat do you need help with today?\n(You can switch between English and हिन्दी anytime using the toggle above)",
    options: [
      { label: '🗺️ How do I report an issue?', next: 'report' },
      { label: '📋 How do I track my complaint?', next: 'track' },
      { label: '🔍 What types of issues can I report?', next: 'categories' },
      { label: "⚠️ My report isn't being resolved", next: 'unresolved' },
      { label: '🏆 How do points & leaderboard work?', next: 'points' },
      { label: '📱 How does CivicAssist work?', next: 'howItWorks' },
      { label: '👥 What is Community Feed?', next: 'feed' },
      { label: '📞 Emergency helplines', next: 'helplines' },
      { label: '🌐 हिन्दी में जानकारी चाहिए (Switch to Hindi)', next: 'switch_to_hi' },
    ],
  },
  report: {
    message: "To report an issue in CivicAssist:\n\n1️⃣ Click 'Report Issue' in the sidebar or tap the '+' button\n2️⃣ Choose a category (Road, Water, Electricity, Garbage…)\n3️⃣ Write a clear description of the problem\n4️⃣ Add a clear photo — genuine photos speed up resolution!\n5️⃣ Your location is auto-detected or you can pin it manually on the map\n6️⃣ Hit 'Submit' ✅\n\nAuthorities (BMC Department) are notified instantly. You'll earn points for every valid report!",
    options: [
      { label: '📂 What categories can I choose?', next: 'categories' },
      { label: '← Back to menu', next: 'start' },
    ],
  },
  track: {
    message: "To track your complaints:\n\n📂 Go to 'My Reports' in the sidebar.\n\nEach report shows its live status:\n\n🟡 Pending — received, awaiting review & assignment\n🟠 In Progress — municipal department is working on-site\n🔵 Under Review — field work done, proof uploaded for admin verification\n🟢 Resolved — verified & closed with Before & After photo proof!\n🔴 Rejected (Fake / Spam) — flagged if photo does not match\n\n🔔 You get an instant alert in 'Notifications' whenever status changes.\n\nYou can also add comments or upload new photos to an existing report in 'My Reports'.",
    options: [
      { label: '← Back to menu', next: 'start' },
    ],
  },
  categories: {
    message: "You can report issues in these categories in 'Report Issue':",
    options: [
      { label: '🚧 Road & Footpath', next: 'cat_road' },
      { label: '💡 Electricity & Street lights', next: 'cat_elec' },
      { label: '💧 Water & Drainage', next: 'cat_water' },
      { label: '🗑️ Garbage & Waste', next: 'cat_garbage' },
      { label: '🌳 Parks & Public spaces', next: 'cat_parks' },
      { label: '📢 Noise & Other', next: 'cat_other' },
      { label: '← Back to menu', next: 'start' },
    ],
  },
  cat_road: {
    message: "🚧 Road & Footpath\n\nReport: potholes, broken footpaths, road cave-ins, damaged dividers, missing manhole covers, waterlogged roads.\n\n📸 Tip: Include a photo clearly showing the road damage — it greatly improves response time.\n\nSelect 'Road' when filling your 'Report Issue' form.",
    options: [{ label: '← Back to categories', next: 'categories' }],
  },
  cat_elec: {
    message: "💡 Electricity & Street lights\n\nReport: broken/flickering street lights, exposed wires, power outages in public areas, damaged electric poles, sparking transformers.\n\n📸 Tip: Photos taken at night for lighting issues are very helpful.\n\nSelect 'Electricity' when filling your 'Report Issue' form.",
    options: [{ label: '← Back to categories', next: 'categories' }],
  },
  cat_water: {
    message: "💧 Water & Drainage\n\nReport: water pipeline bursts, supply disruptions, contaminated water, overflowing drains, sewage leaks, blocked storm drains.\n\n📸 Tip: A photo showing the extent of flooding or leakage helps dispatch the right crew.\n\nSelect 'Water' when filling your 'Report Issue' form.",
    options: [{ label: '← Back to categories', next: 'categories' }],
  },
  cat_garbage: {
    message: "🗑️ Garbage & Waste\n\nReport: overflowing dustbins, illegal dumping spots, uncleared garbage piles, waste burning in public, dead animals on roads.\n\n📸 Tip: A wide-angle photo showing the heap gets faster action from Solid Waste Management.\n\nSelect 'Garbage' when filling your 'Report Issue' form.",
    options: [{ label: '← Back to categories', next: 'categories' }],
  },
  cat_parks: {
    message: "🌳 Parks & Public Spaces\n\nReport: broken benches/swings, unkept parks, encroachment on public land, damaged fountains, missing signage in public areas.\n\nSelect 'Park & Green' or 'Other' when filling your 'Report Issue' form.",
    options: [{ label: '← Back to categories', next: 'categories' }],
  },
  cat_other: {
    message: "📢 Noise & Other Issues\n\nReport: construction noise violations, loud music, public nuisance, stray animal menace, unauthorized hoardings.\n\nSelect 'Other' or 'Noise' when filling your 'Report Issue' form and describe clearly.",
    options: [{ label: '← Back to categories', next: 'categories' }],
  },
  unresolved: {
    message: "If your report hasn't been addressed yet, here is what helps:\n\n1️⃣ Check 'My Reports' — status may have transitioned to 'In Progress' or 'Under Review'\n2️⃣ Add a comment with new photos to provide live updates\n3️⃣ Ask community members to Upvote your issue in 'Community Feed' — higher upvotes = higher authority priority!\n4️⃣ Check the 'Helplines' section to contact the BMC department directly\n5️⃣ Check if the report was 'Rejected' with a moderation notice in 'My Reports'\n\n⏱️ Average municipal resolution time is 48–72 hours.",
    options: [
      { label: '📞 View emergency helplines', next: 'helplines' },
      { label: '← Back to menu', next: 'start' },
    ],
  },
  points: {
    message: "🏆 Points & Leaderboard System:\n\nYou earn points for active civic participation:\n\n✅ Submitting a valid report — +10 pts\n📸 Adding photo proof — +5 pts\n👍 Getting upvotes in 'Community Feed' — +2 pts each\n🟢 Issue verified & 'Resolved' — +15 pts\n\nPoints appear on the 'Leaderboard' — see how you rank among active citizens in your city!\n\n🥇 Top reporters get featured and earn community recognition.",
    options: [{ label: '← Back to menu', next: 'start' }],
  },
  howItWorks: {
    message: "Here's how CivicAssist works end-to-end:\n\n1️⃣ Sign in with your mobile number via OTP\n2️⃣ Go to 'Report Issue' and submit details with a real photo\n3️⃣ Our AI checks authenticity and routes the issue to the relevant BMC Department\n4️⃣ Department Head dispatches field officers to fix the issue\n5️⃣ Once fixed, Department Head uploads 'Before & After' proof\n6️⃣ Mumbai Central Admin verifies the proof and marks it 'Resolved'\n7️⃣ You receive an alert in 'Notifications' and earn points! 🏆",
    options: [
      { label: '🏆 Tell me about points', next: 'points' },
      { label: '← Back to menu', next: 'start' },
    ],
  },
  feed: {
    message: "👥 Community Feed\n\nThe 'Community Feed' shows all civic issues reported by citizens in your area:\n\n👍 Upvote issues that affect you too — this raises authority priority!\n💬 Leave comments with updates or additional info\n🔍 Filter by category (Road, Water, Garbage), status, or location\n📍 View issues pinned on a live map\n\nThe more people engage with an issue, the faster it gets resolved!",
    options: [{ label: '← Back to menu', next: 'start' }],
  },
  helplines: {
    message: "📞 Emergency & Civic Helplines\n\nFor urgent emergencies, open the 'Helplines' section in the sidebar for direct contact:\n\n🚨 Police Control Room — 100\n🔥 Fire Brigade — 101\n🚑 Ambulance — 108\n🏙️ BMC Disaster Management — 1916\n💡 Electricity Emergency — 1912\n💧 BMC Water Supply Dept — 022-22694725\n\nFor non-emergencies, always file a report through 'Report Issue' so it is officially tracked.",
    options: [{ label: '← Back to menu', next: 'start' }],
  },
};

const FLOWS_HI = {
  start: {
    message: "नमस्ते! मैं आपका CivicAssist Helper हूँ 👋\nआज मैं आपकी क्या सहायता कर सकता हूँ?\n(ऊपर दिए गए 'EN / हिन्दी' बटन से आप कभी भी भाषा बदल सकते हैं)",
    options: [
      { label: '🗺️ समस्या (Issue) कैसे दर्ज करें?', next: 'report' },
      { label: '📋 अपनी Complaint कैसे ट्रैक करें?', next: 'track' },
      { label: '🔍 किन Categories में रिपोर्ट कर सकते हैं?', next: 'categories' },
      { label: '⚠️ मेरी रिपोर्ट Resolve नहीं हो रही है', next: 'unresolved' },
      { label: '🏆 Points और Leaderboard कैसे काम करते हैं?', next: 'points' },
      { label: '📱 CivicAssist कैसे काम करता है?', next: 'howItWorks' },
      { label: '👥 Community Feed क्या है?', next: 'feed' },
      { label: '📞 Emergency Helplines', next: 'helplines' },
      { label: '🌐 Switch to English', next: 'switch_to_en' },
    ],
  },
  report: {
    message: "CivicAssist पर समस्या दर्ज करने के आसान चरण:\n\n1️⃣ Sidebar में 'Report Issue' पर क्लिक करें या स्क्रीन पर नीचे दिए गए '+' बटन को दबाएं।\n2️⃣ समस्या की Category चुनें (जैसे Road, Water, Electricity, Garbage…)।\n3️⃣ समस्या का स्पष्ट विवरण (Description) लिखें।\n4️⃣ वास्तविक Photo जोड़ें — साफ़ और सही फ़ोटो से कार्रवाई बहुत तेज़ होती है!\n5️⃣ आपकी Location स्वतः पहचान ली जाएगी या आप Map पर पिन कर सकते हैं।\n6️⃣ 'Submit' बटन दबाएं ✅\n\nसंबंधित BMC Department को तुरंत सूचित किया जाता है। प्रत्येक मान्य रिपोर्ट पर आपको Points भी मिलेंगे!",
    options: [
      { label: '📂 कौन-सी Categories उपलब्ध हैं?', next: 'categories' },
      { label: '← मुख्य मेनू (Main Menu)', next: 'start' },
    ],
  },
  track: {
    message: "अपनी शिकायत ट्रैक करने का तरीका:\n\n📂 Sidebar में 'My Reports' सेक्शन में जाएं।\n\nवहां आपकी प्रत्येक रिपोर्ट का लाइव Status दिखाई देगा:\n\n🟡 Pending — रिपोर्ट प्राप्त हुई, BMC समीक्षा की प्रतीक्षा है\n🟠 In Progress — संबंधित विभाग की टीम मौके पर काम कर रही है\n🔵 Under Review — विभाग ने काम पूरा कर Before & After Proof अपलोड किया है\n🟢 Resolved — Mumbai Admin द्वारा सत्यापन के बाद समस्या हल!\n🔴 Rejected (Fake / Spam) — गलत या गैर-नागरिक फ़ोटो होने पर अस्वीकृत\n\n🔔 स्टेटस बदलते ही आपको 'Notifications' में तत्काल अलर्ट प्राप्त होगा।\n\nआप 'My Reports' में जाकर अपनी शिकायत पर Comments या नई Photos भी जोड़ सकते हैं।",
    options: [
      { label: '← मुख्य मेनू (Main Menu)', next: 'start' },
    ],
  },
  categories: {
    message: "'Report Issue' फ़ॉर्म में आप इन Categories में अपनी शिकायत दर्ज कर सकते हैं:",
    options: [
      { label: '🚧 Road & Footpath (सड़क व फुटपाथ)', next: 'cat_road' },
      { label: '💡 Electricity & Street lights (बिजली व लाइट)', next: 'cat_elec' },
      { label: '💧 Water & Drainage (पानी व नाले)', next: 'cat_water' },
      { label: '🗑️ Garbage & Waste (कचरा व सफ़ाई)', next: 'cat_garbage' },
      { label: '🌳 Parks & Public spaces (पार्क व सार्वजनिक स्थल)', next: 'cat_parks' },
      { label: '📢 Noise & Other (शोर व अन्य मुद्दे)', next: 'cat_other' },
      { label: '← मुख्य मेनू (Main Menu)', next: 'start' },
    ],
  },
  cat_road: {
    message: "🚧 Road & Footpath (सड़क व फुटपाथ)\n\nइन समस्याओं की रिपोर्ट करें:\n• सड़क पर गड्ढे (Potholes)\n• टूटे हुए फुटपाथ व पेवर ब्लॉक्स\n• सड़क धंसना व क्षतिग्रस्त डिवाइडर\n• खुले या टूटे मैनहोल कवर्स\n• सड़कों पर जलभराव\n\n📸 महत्वपूर्ण टिप: सड़क की क्षति को साफ़ दिखाने वाली Photo लें।\n'Report Issue' फ़ॉर्म में Category में 'Road' चुनें।",
    options: [{ label: '← Categories पर वापस जाएं', next: 'categories' }],
  },
  cat_elec: {
    message: "💡 Electricity & Street lights (बिजली व स्ट्रीटलाइट)\n\nइन समस्याओं की रिपोर्ट करें:\n• बंद या टिमटिमाती स्ट्रीटलाइट्स\n• खुले या लटकते बिजली के खतरनाक तार\n• सार्वजनिक क्षेत्रों में अंधेरा\n• टूटे या झुके हुए बिजली के खंभे\n• स्पार्किंग या ट्रांसफार्मर की खराबी\n\n📸 महत्वपूर्ण टिप: स्ट्रीटलाइट की समस्या के लिए रात में ली गई Photo बहुत उपयोगी होती है।\n'Report Issue' फ़ॉर्म में Category में 'Electricity' चुनें।",
    options: [{ label: '← Categories पर वापस जाएं', next: 'categories' }],
  },
  cat_water: {
    message: "💧 Water & Drainage (पानी व ड्रेनेज)\n\nइन समस्याओं की रिपोर्ट करें:\n• पेयजल पाइपलाइन फटना या रिसाव\n• दूषित पानी की आपूर्ति या कम दबाव\n• उफनते गटर और सीवेज लीकेज\n• बंद बरसाती नाले और गंभीर जलभराव\n\n📸 महत्वपूर्ण टिप: लीकेज या पानी जमाव का फैलाव दिखाने वाली Photo लें।\n'Report Issue' फ़ॉर्म में Category में 'Water' चुनें।",
    options: [{ label: '← Categories पर वापस जाएं', next: 'categories' }],
  },
  cat_garbage: {
    message: "🗑️ Garbage & Waste (कचरा व ठोस अपशिष्ट)\n\nइन समस्याओं की रिपोर्ट करें:\n• ओवरफ्लो होते सार्वजनिक कूड़ेदान\n• कई दिनों से सड़कों पर न उठाया गया कचरा\n• खुले में अवैध कचरा डंपिंग\n• कचरा जलाए जाने का धुआं व प्रदूषण\n• सड़क पर मृत पशुओं को हटाना\n\n📸 महत्वपूर्ण टिप: कचरे के ढेर का पूरा फैलाव दिखाने वाली Photo अपलोड करें ताकि BMC Solid Waste Management तुरंत वाहन भेज सके।\n'Report Issue' फ़ॉर्म में Category में 'Garbage' चुनें।",
    options: [{ label: '← Categories पर वापस जाएं', next: 'categories' }],
  },
  cat_parks: {
    message: "🌳 Parks & Public Spaces (पार्क व सार्वजनिक उद्यान)\n\nइन समस्याओं की रिपोर्ट करें:\n• बच्चों के टूटे झूले या टूटी बेंचें\n• पार्कों में गंदगी या झाड़ियों की अनियंत्रित वृद्धि\n• टूटे हुए वॉकिंग ट्रैक्स और फव्वारे\n• सार्वजनिक मैदानों पर अवैध अतिक्रमण\n\n'Report Issue' फ़ॉर्म में Category में 'Park & Green' या 'Other' चुनें।",
    options: [{ label: '← Categories पर वापस जाएं', next: 'categories' }],
  },
  cat_other: {
    message: "📢 Noise & Other Issues (शोर व अन्य नागरिक समस्याएं)\n\nइन समस्याओं की रिपोर्ट करें:\n• रात में नियमों के विरुद्ध निर्माण कार्य या लाउडस्पीकर का शोर\n• सार्वजनिक स्थानों पर उपद्रव\n• आवारा पशुओं से सुरक्षा का खतरा\n• अवैध होर्डिंग्स या पोस्टर्स\n\n'Report Issue' फ़ॉर्म में Category में 'Other' या 'Noise' चुनें और विवरण स्पष्ट रूप से लिखें।",
    options: [{ label: '← Categories पर वापस जाएं', next: 'categories' }],
  },
  unresolved: {
    message: "यदि आपकी रिपोर्ट का अभी तक समाधान नहीं हुआ है, तो ये कदम उठाएं:\n\n1️⃣ 'My Reports' में स्टेटस देखें — संभव है विभाग ने काम शुरू कर दिया हो ('In Progress' या 'Under Review')।\n2️⃣ 'My Reports' में जाकर ताज़ा Photo या नया Comment जोड़ें, जिससे अधिकारियों को अपडेट मिल सके।\n3️⃣ अन्य नागरिकों से कहें कि वे 'Community Feed' में आपकी रिपोर्ट को Upvote करें (अधिक Upvotes मिलने से BMC में Priority बढ़ जाती है!)।\n4️⃣ Sidebar के 'Helplines' सेक्शन से सीधे संबंधित BMC कंट्रोल रूम या हेल्पलाइन पर संपर्क करें।\n5️⃣ यदि रिपोर्ट 'Rejected' दिख रही है, तो दिए गए Rejection Reason को देखें।\n\n⏱️ अधिकांश सामान्य नागरिक समस्याओं का समाधान 48 से 72 घंटों में हो जाता है।",
    options: [
      { label: '📞 Emergency Helplines देखें', next: 'helplines' },
      { label: '← मुख्य मेनू (Main Menu)', next: 'start' },
    ],
  },
  points: {
    message: "🏆 Points और Leaderboard प्रणाली:\n\nसक्रिय नागरिक भागीदारी के लिए Points अर्जित करें:\n\n✅ मान्य नागरिक समस्या की रिपोर्ट सबमिट करने पर — +10 Points\n📸 स्पष्ट Photo प्रमाण जोड़ने पर — +5 Points\n👍 'Community Feed' में अन्य नागरिकों द्वारा आपकी रिपोर्ट को Upvote करने पर — +2 Points प्रति Upvote\n🟢 BMC द्वारा समस्या का समाधान होकर 'Resolved' होने पर — +15 Points\n\nआपके कुल Points आपको 'Leaderboard' पर शहर के शीर्ष सक्रिय नागरिकों में स्थान दिलाते हैं!\n\n🥇 शीर्ष नागरिकों को विशेष पहचान और मान्यता मिलती है।",
    options: [{ label: '← मुख्य मेनू (Main Menu)', next: 'start' }],
  },
  howItWorks: {
    message: "CivicAssist की पारदर्शी कार्यप्रणाली:\n\n1️⃣ अपने मोबाइल नंबर से OTP द्वारा आसानी से Sign In करें।\n2️⃣ 'Report Issue' पर जाकर वास्तविक Photo और विवरण के साथ समस्या पोस्ट करें।\n3️⃣ हमारा AI Moderation फ़ोटो की सत्यता जांचकर संबंधित BMC Department Head को स्वचालित रूप से भेजता है।\n4️⃣ संबंधित विभाग की टीम मौके पर पहुंचकर समस्या का समाधान करती है।\n5️⃣ काम पूरा होने पर अधिकारी 'Before & After' समाधान का Proof अपलोड करते हैं।\n6️⃣ Mumbai Central Admin द्वारा Proof के सत्यापन के बाद रिपोर्ट 'Resolved' हो जाती है।\n7️⃣ आपको 'Notifications' में अलर्ट मिलता है और आपके खाते में Points जुड़ जाते हैं! 🏆\n\nआपकी व्यक्तिगत जानकारी हमेशा सुरक्षित और गोपनीय रहती है।",
    options: [
      { label: '🏆 Points और Leaderboard के बारे में जानें', next: 'points' },
      { label: '← मुख्य मेनू (Main Menu)', next: 'start' },
    ],
  },
  feed: {
    message: "👥 Community Feed:\n\n'Community Feed' में आपके शहर के नागरिकों द्वारा दर्ज की गई सभी लाइव समस्याएं दिखती हैं:\n\n👍 जो समस्या आपको भी प्रभावित करती है, उसे Upvote करें — इससे BMC में उसकी Priority बढ़ जाती है!\n💬 रिपोर्ट पर Comments करके ताज़ा स्थिति या सुझाव साझा करें।\n🔍 Category (Road, Water, Garbage), Status या Location के आधार पर फ़िल्टर करें।\n📍 Map View में अपने आस-पास के सभी मुद्दों को लाइव पिन के रूप में देखें।\n\nजितने अधिक नागरिक सहयोग करेंगे, प्रशासन उतनी ही तेज़ी से कार्रवाई करेगा!",
    options: [{ label: '← मुख्य मेनू (Main Menu)', next: 'start' }],
  },
  helplines: {
    message: "📞 Emergency और Civic Helplines:\n\nआपातकालीन सहायता के लिए Sidebar में 'Helplines' सेक्शन खोलें, जहां महत्वपूर्ण हेल्पलाइन नंबर उपलब्ध हैं:\n\n🚨 Police Control Room — 100\n🔥 Fire Brigade — 101\n🚑 Medical Emergency (Ambulance) — 108\n🏙️ BMC Disaster Management Cell — 1916\n⚡ Electricity Emergency — 1912 / स्थानीय वितरण नंबर\n💧 BMC Hydraulic (Water Supply) — 022-22694725\n\nगैर-आपातकालीन नागरिक समस्याओं के लिए हमेशा CivicAssist पर 'Report Issue' करें ताकि डिजिटल ट्रैकिंग सुनिश्चित हो सके।",
    options: [{ label: '← मुख्य मेनू (Main Menu)', next: 'start' }],
  },
};

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentFlow, setCurrentFlow] = useState('start');
  const [showOptions, setShowOptions] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  // Language state: 'en' (English) or 'hi' (Hindi)
  const [botLang, setBotLang] = useState(() => {
    return localStorage.getItem('civicassist_helper_lang') || 'en';
  });

  const languageCtx = useLanguage();
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const activeFlows = botLang === 'hi' ? FLOWS_HI : FLOWS_EN;

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // When opening chatbot for the first time
  useEffect(() => {
    if (open && messages.length === 0) {
      setTimeout(() => {
        setMessages([{ type: 'bot', text: activeFlows.start.message }]);
        setTimeout(() => setShowOptions(true), 350);
      }, 250);
    }
  }, [open, botLang]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showOptions]);

  // Switch between English and Hindi
  const handleSwitchLanguage = (newLang) => {
    if (newLang === botLang) return;
    setBotLang(newLang);
    localStorage.setItem('civicassist_helper_lang', newLang);

    const targetFlows = newLang === 'hi' ? FLOWS_HI : FLOWS_EN;
    setShowOptions(false);

    const switchNote = newLang === 'hi'
      ? '🌐 भाषा बदलकर **हिन्दी** कर दी गई है।\n\n' + targetFlows.start.message
      : '🌐 Language switched to **English**.\n\n' + targetFlows.start.message;

    setMessages(prev => [
      ...prev,
      { type: 'bot', text: switchNote }
    ]);
    setCurrentFlow('start');
    setTimeout(() => setShowOptions(true), 350);
  };

  const handleOption = (option) => {
    if (option.next === 'switch_to_hi') {
      handleSwitchLanguage('hi');
      return;
    }
    if (option.next === 'switch_to_en') {
      handleSwitchLanguage('en');
      return;
    }

    setShowOptions(false);
    setMessages(prev => [...prev, { type: 'user', text: option.label }]);
    const nextFlowObj = activeFlows[option.next] || activeFlows.start;

    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', text: nextFlowObj.message }]);
      setCurrentFlow(option.next);
      setTimeout(() => setShowOptions(true), 350);
    }, 450);
  };

  const handleReset = () => {
    setMessages([]);
    setCurrentFlow('start');
    setShowOptions(false);
    setTimeout(() => {
      setMessages([{ type: 'bot', text: activeFlows.start.message }]);
      setTimeout(() => setShowOptions(true), 350);
    }, 200);
  };

  // Smart keyword intent parser for user-typed queries
  const handleSendText = (e) => {
    e?.preventDefault();
    const query = inputQuery.trim();
    if (!query) return;

    setInputQuery('');
    setShowOptions(false);
    setMessages(prev => [...prev, { type: 'user', text: query }]);

    const lower = query.toLowerCase();

    // Language switch commands
    if (lower.includes('hindi') || lower.includes('हिंदी') || lower.includes('हिन्दी')) {
      setTimeout(() => handleSwitchLanguage('hi'), 300);
      return;
    }
    if (lower.includes('english') || lower.includes('अंग्रेजी')) {
      setTimeout(() => handleSwitchLanguage('en'), 300);
      return;
    }

    if (/my reports|my report|track|status|check|stithi|dekhe|स्थिति|ट्रैक|स्टेटस|चेक/.test(lower)) {
      nextKey = 'track';
    } else if (/report|file|submit|daakhil|darj|shikayat|शिकायत|दर्ज|रिपोर्ट|पोस्ट/.test(lower)) {
      nextKey = 'report';
    } else if (/road|pothole|footpath|sadak|gaddha|सड़क|गड्ढा|फुटपाथ/.test(lower)) {
      nextKey = 'cat_road';
    } else if (/electric|light|pole|wire|bijli|batti|बिजली|लाइट|स्ट्रीटलाइट|खंभा/.test(lower)) {
      nextKey = 'cat_elec';
    } else if (/water|drain|sewage|leak|pipe|pani|nala|drainage|पानी|सीवेज|गटर|नाला|पाइप/.test(lower)) {
      nextKey = 'cat_water';
    } else if (/garbage|waste|trash|kachra|safai|kuda|कचरा|कूड़ा|सफाई|सफ़ाई/.test(lower)) {
      nextKey = 'cat_garbage';
    } else if (/park|garden|tree|bagicha|पार्क|बगीचा|उद्यान/.test(lower)) {
      nextKey = 'cat_parks';
    } else if (/noise|sound|loud|shor|शोर|ध्वनि/.test(lower)) {
      nextKey = 'cat_other';
    } else if (/unresolved|delay|late|not fixed|nahi hua|समाधान नहीं|हल नहीं|देरी/.test(lower)) {
      nextKey = 'unresolved';
    } else if (/point|score|rank|leaderboard|पॉइंट|लीडरबोर्ड|अंक|रैंक/.test(lower)) {
      nextKey = 'points';
    } else if (/feed|community|upvote|कम्युनिटी|फीड|फ़ीड/.test(lower)) {
      nextKey = 'feed';
    } else if (/helpline|emergency|police|call|phone|नंबर|हेल्पलाइन|आपातकालीन|फोन/.test(lower)) {
      nextKey = 'helplines';
    } else if (/how|work|kaam|kaise|कार्यप्रणाली|काम/.test(lower)) {
      nextKey = 'howItWorks';
    }

    setTimeout(() => {
      if (nextKey && activeFlows[nextKey]) {
        setMessages(prev => [...prev, { type: 'bot', text: activeFlows[nextKey].message }]);
        setCurrentFlow(nextKey);
      } else {
        const defaultReply = botLang === 'hi'
          ? "मैं CivicAssist के बारे में आपकी सहायता के लिए सदैव यहाँ हूँ। आप नीचे दिए गए विकल्पों में से चुन सकते हैं या अपनी पसंद की भाषा बदल सकते हैं:"
          : "I am here to guide you through CivicAssist! You can pick from the quick guide options below or switch language anytime:";
        setMessages(prev => [...prev, { type: 'bot', text: defaultReply }]);
        setCurrentFlow('start');
      }
      setTimeout(() => setShowOptions(true), 350);
    }, 450);
  };

  return (
    <>
      {/* Floating trigger button */}
      <div style={{ position: 'fixed', bottom: isMobile ? '90px' : '42px', right: '18px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>

        {/* Hover speech bubble */}
        <AnimatePresence>
          {hovered && !open && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.92 }}
              transition={{ duration: 0.18 }}
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '14px 14px 4px 14px',
                padding: '8px 13px',
                fontSize: '0.76rem',
                fontWeight: 500,
                color: 'hsl(var(--foreground))',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                whiteSpace: 'nowrap',
                position: 'relative',
              }}
            >
              {botLang === 'hi' ? '💬 कोई सवाल? सहायता लें!' : '💬 Any query? Ask me!'}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setOpen(o => !o)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          style={{
            width: '68px', height: '68px', borderRadius: '50%', border: '1.5px solid rgba(167,139,250,0.4)', cursor: 'pointer',
            background: 'linear-gradient(145deg, #5b21b6, #7c3aed, #9333ea)',
            boxShadow: '0 0 0 6px rgba(124,58,237,0.15), 0 8px 32px rgba(124,58,237,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Open CivicAssist Helper"
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.i key="close" className="fas fa-times"
                initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }} style={{ color: '#fff', fontSize: '1.15rem' }} />
            ) : (
              <motion.i key="chat" className="fas fa-robot"
                initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }} style={{ color: '#fff', fontSize: '1.4rem' }} />
            )}
          </AnimatePresence>
          {!open && (
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ position: 'absolute', top: '3px', right: '3px', width: '11px', height: '11px', borderRadius: '50%', background: '#fbbf24', border: '2px solid white' }}
            />
          )}
        </motion.button>
      </div>

      {/* Chat window modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              position: 'fixed', bottom: isMobile ? '162px' : '120px', right: isMobile ? '12px' : '18px', zIndex: 999,
              width: isMobile ? 'calc(100vw - 24px)' : '360px', maxWidth: '360px', maxHeight: isMobile ? '64vh' : '520px',
              borderRadius: '20px', overflow: 'hidden',
              background: '#0f0a1e',
              border: '1px solid rgba(124,58,237,0.3)',
              boxShadow: '0 20px 60px rgba(124,58,237,0.38), 0 4px 20px rgba(0,0,0,0.6)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header with Bilingual Selector */}
            <div style={{
              padding: '12px 14px',
              background: 'linear-gradient(135deg, #4c1d95, #6d28d9)',
              borderBottom: '1px solid rgba(167,139,250,0.25)',
              display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
            }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fas fa-robot" style={{ color: '#fff', fontSize: '0.92rem' }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.84rem', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  CivicAssist Helper
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
                  <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
                    style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4ade80' }} />
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.62rem', fontFamily: "'DM Sans', sans-serif" }}>
                    {botLang === 'hi' ? 'सदैव आपकी सहायता में' : 'Always here to help'}
                  </span>
                </div>
              </div>

              {/* Language Switcher Pill [ English | हिन्दी ] */}
              <div style={{
                display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.25)',
                borderRadius: '20px', padding: '2px', border: '1px solid rgba(255,255,255,0.18)'
              }}>
                <button
                  type="button"
                  onClick={() => handleSwitchLanguage('en')}
                  style={{
                    padding: '3px 8px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                    fontSize: '0.65rem', fontWeight: botLang === 'en' ? 700 : 500,
                    background: botLang === 'en' ? '#9333ea' : 'transparent',
                    color: botLang === 'en' ? '#fff' : 'rgba(255,255,255,0.7)',
                    transition: 'all 0.15s',
                  }}
                  title="Switch helper to English"
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchLanguage('hi')}
                  style={{
                    padding: '3px 8px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                    fontSize: '0.65rem', fontWeight: botLang === 'hi' ? 700 : 500,
                    background: botLang === 'hi' ? '#9333ea' : 'transparent',
                    color: botLang === 'hi' ? '#fff' : 'rgba(255,255,255,0.7)',
                    transition: 'all 0.15s',
                  }}
                  title="सहायक को हिन्दी में बदलें"
                >
                  हिन्दी
                </button>
              </div>

              {/* Reset conversation */}
              <button
                type="button"
                onClick={handleReset}
                title={botLang === 'hi' ? 'बातचीत पुनः आरंभ करें' : 'Restart conversation'}
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', color: 'rgba(255,255,255,0.9)', fontSize: '0.72rem' }}>
                <i className="fas fa-rotate-right" />
              </button>
            </div>

            {/* Messages Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#0f0a1e' }}>
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
                    style={{ display: 'flex', justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start', gap: '7px', alignItems: 'flex-end' }}
                  >
                    {msg.type === 'bot' && (
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #6d28d9, #9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: '2px' }}>
                        <i className="fas fa-robot" style={{ color: '#fff', fontSize: '0.62rem' }} />
                      </div>
                    )}
                    <div style={{
                      maxWidth: '82%',
                      padding: '9px 13px',
                      borderRadius: msg.type === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.type === 'user'
                        ? 'linear-gradient(135deg, #6d28d9, #9333ea)'
                        : 'rgba(109,40,217,0.18)',
                      color: '#fff',
                      border: msg.type === 'bot' ? '1px solid rgba(167,139,250,0.2)' : 'none',
                      fontSize: '0.76rem',
                      lineHeight: 1.55,
                      fontFamily: "'DM Sans', sans-serif",
                      whiteSpace: 'pre-line',
                    }}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Option Buttons */}
              <AnimatePresence>
                {showOptions && activeFlows[currentFlow] && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '2px' }}
                  >
                    {activeFlows[currentFlow].options.map((opt, i) => (
                      <motion.button key={i}
                        type="button"
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        onClick={() => handleOption(opt)}
                        style={{
                          padding: '8px 12px', borderRadius: '10px',
                          border: '1px solid rgba(167,139,250,0.25)',
                          background: 'rgba(109,40,217,0.14)',
                          color: 'rgba(233,213,255,0.95)',
                          fontSize: '0.73rem',
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 500,
                          textAlign: 'left', cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(109,40,217,0.35)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.6)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(109,40,217,0.14)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.25)'; e.currentTarget.style.color = 'rgba(233,213,255,0.95)'; }}
                      >
                        {opt.label}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={bottomRef} />
            </div>

            {/* Quick Ask Input Bar */}
            <form onSubmit={handleSendText} style={{
              padding: '8px 10px', background: 'rgba(109,40,217,0.1)',
              borderTop: '1px solid rgba(109,40,217,0.22)', display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                placeholder={botLang === 'hi' ? 'सवाल पूछें (उदा. My Reports, कचरा, गड्ढे...)' : 'Type a query (e.g. My Reports, garbage...)'}
                style={{
                  flex: 1, padding: '7px 11px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(167,139,250,0.25)',
                  color: '#fff', fontSize: '0.72rem', outline: 'none', fontFamily: "'DM Sans', sans-serif"
                }}
              />
              <button
                type="submit"
                style={{
                  width: '32px', height: '32px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                  border: 'none', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', flexShrink: 0
                }}
                title={botLang === 'hi' ? 'भेजें' : 'Send'}
              >
                <i className="fas fa-paper-plane" />
              </button>
            </form>

            {/* Footer Hint */}
            <div style={{ padding: '6px 12px', background: 'rgba(15,10,30,0.95)', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
              <p style={{ fontSize: '0.58rem', color: 'rgba(196,181,253,0.5)', fontFamily: "'DM Sans', sans-serif", textAlign: 'center', margin: 0 }}>
                {botLang === 'hi'
                  ? 'विकल्प चुनें या सवाल लिखें · पुनः आरंभ हेतु ↺ दबाएं'
                  : 'Select an option above · Tap ↺ to restart'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
