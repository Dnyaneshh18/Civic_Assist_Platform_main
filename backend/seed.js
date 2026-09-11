import { supabase } from './config/supabase.js';
import { runAIAnalysis } from './services/aiRunner.js';


const S = (n) => Array.from({ length: n }, (_, i) => `seed_u${i + 1}`);

const SEED_ISSUES = [
  {
    complaintId: '#C001',
    title: 'Overflowing garbage bins near City Mall',
    description: 'The garbage bins near City Mall have been overflowing for the past 3 days. Strong odor is affecting nearby shops and pedestrians.',
    category: 'garbage',
    location: 'Linking Road, Bandra West, Mumbai',
    coordinates: { lat: 19.0607, lng: 72.8362 },
    imageUrl: 'https://images.pexels.com/photos/2768961/pexels-photo-2768961.jpeg?auto=compress&cs=tinysrgb&w=1200',
    reporter: { userId: 'seed_u1', name: 'Rahul Mehra', phone: '+91 98765 43210' },
    status: 'pending',
    supporters: S(38),
    shares: 23,
    comments: [
      { userId: 'seed_u2', userName: 'Priya S.', text: 'This has been an issue for weeks!', createdAt: new Date('2026-04-11T11:00:00') },
      { userId: 'seed_u3', userName: 'Arun K.', text: 'I reported this to the municipal corporation but no action yet.', createdAt: new Date('2026-04-11T12:30:00') },
      { userId: 'seed_u4', userName: 'Sneha R.', text: 'The smell is unbearable.', createdAt: new Date('2026-04-11T14:00:00') },
    ],
    timeline: [
      { time: '10:23 AM, Apr 11', event: 'Complaint submitted by citizen', icon: 'fa-circle-plus', color: '#2563eb' },
    ],
    createdAt: new Date('2026-04-11T10:23:00'),
  },
  {
    complaintId: '#C002',
    title: 'Multiple streetlights not working on 5th Cross',
    description: 'At least 6 consecutive streetlights on 5th Cross Road have stopped working. The area is completely dark at night causing safety concerns.',
    category: 'streetlight',
    location: 'SV Road, Andheri West, Mumbai',
    coordinates: { lat: 19.1364, lng: 72.8296 },
    imageUrl: 'https://imgs.search.brave.com/OOLOp_ShZF4wtGba639MjQ0_jHMvyGRPMVUmbE7cpZI/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93d3cu/emdzbS1jaGluYS5j/b20vd3AtY29udGVu/dC91cGxvYWRzLzIw/MjEvMTIvU2VyaWVz/LUgtbGVkLXN0cmVl/dC1saWdodC1pbi1V/cmJhbi1yb2FkLWlu/LVBhbGVzdGluZS0w/Mi5qcGc',
    reporter: { userId: 'seed_u2', name: 'Divya Patel', phone: '+91 87654 32109' },
    status: 'inprogress',
    supporters: S(29),
    shares: 15,
    comments: [
      { userId: 'seed_u5', userName: 'Vikram T.', text: 'I nearly had an accident here last night.', createdAt: new Date('2026-04-10T09:00:00') },
      { userId: 'seed_u6', userName: 'Meera N.', text: 'Women feel very unsafe walking here after dark.', createdAt: new Date('2026-04-10T10:30:00') },
    ],
    assignedTo: 'Streetlight & Electrical Dept',
    timeline: [
      { time: '7:45 AM, Apr 10', event: 'Complaint submitted', icon: 'fa-circle-plus', color: '#2563eb' },
      { time: '9:00 AM, Apr 10', event: 'Assigned to Streetlight & Electrical Dept', icon: 'fa-building', color: '#7c3aed' },
      { time: '10:30 AM, Apr 10', event: 'Status changed to In Progress', icon: 'fa-arrows-rotate', color: '#f59e0b' },
    ],
    createdAt: new Date('2026-04-10T07:45:00'),
  },
  {
    complaintId: '#C003',
    title: 'Water supply disrupted for 4 days in Sector 12',
    description: 'Residents of Sector 12 have not received piped water supply for 4 consecutive days. Children and elderly are the most affected.',
    category: 'water',
    location: 'Sector 12, Vashi, Navi Mumbai',
    coordinates: { lat: 19.0696, lng: 72.9987 },
    imageUrl: 'https://images.pexels.com/photos/159305/pexels-photo-159305.jpeg?auto=compress&cs=tinysrgb&w=1200',
    reporter: { userId: 'seed_u3', name: 'Suresh Gupta', phone: '+91 76543 21098' },
    status: 'pending',
    supporters: S(45),
    shares: 67,
    comments: [
      { userId: 'seed_u4', userName: 'Kavitha B.', text: 'We have small children at home. This is a serious health concern.', createdAt: new Date('2026-04-12T08:00:00') },
      { userId: 'seed_u5', userName: 'Rajan L.', text: 'Elderly residents are having extreme difficulty.', createdAt: new Date('2026-04-12T09:30:00') },
    ],
    timeline: [
      { time: '7:00 AM, Apr 12', event: 'Complaint submitted by citizen', icon: 'fa-circle-plus', color: '#2563eb' },
    ],
    createdAt: new Date('2026-04-12T07:00:00'),
  },
  {
    complaintId: '#C004',
    title: 'Large pothole causing accidents on Highway Road',
    description: 'A massive pothole on the main Highway road near the bus stop has caused at least 3 accidents this week. Immediate repair is needed.',
    category: 'road',
    location: 'Western Express Highway, Goregaon East, Mumbai',
    coordinates: { lat: 19.1666, lng: 72.8506 },
    imageUrl: 'https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=1200',
    reporter: { userId: 'seed_u4', name: 'Amit Joshi', phone: '+91 65432 10987' },
    status: 'resolved',
    supporters: S(34),
    shares: 44,
    comments: [
      { userId: 'seed_u6', userName: 'Sanjay H.', text: 'My bike tyre burst here yesterday.', createdAt: new Date('2026-04-09T07:00:00') },
    ],
    assignedTo: 'Roads & Infrastructure Dept',
    timeline: [
      { time: '6:30 AM, Apr 9', event: 'Complaint submitted', icon: 'fa-circle-plus', color: '#2563eb' },
      { time: '8:00 AM, Apr 9', event: 'Assigned to Roads & Infrastructure Dept', icon: 'fa-building', color: '#7c3aed' },
      { time: '10:00 AM, Apr 9', event: 'Repair team dispatched', icon: 'fa-arrows-rotate', color: '#f59e0b' },
      { time: '4:00 PM, Apr 9', event: 'Pothole repaired and resolved', icon: 'fa-circle-check', color: '#059669' },
    ],
    createdAt: new Date('2026-04-09T06:30:00'),
  },
  {
    complaintId: '#C005',
    title: 'Broken swings and slides in Central Park',
    description: "The children's play area in Central Park has multiple broken swings and damaged slides. Children are at risk of injury.",
    category: 'park',
    location: 'Shivaji Park, Dadar West, Mumbai',
    coordinates: { lat: 19.0270, lng: 72.8381 },
    imageUrl: 'https://imgs.search.brave.com/wW7049iL9Ld-NIQPVVYxCv4DKiW0d8QtHfJlRhgaubM/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudG9paW1nLmNv/bS90aHVtYi9tc2lk/LTczMDQwMTYyLGlt/Z3NpemUtNjAxOTY3/LHdpZHRoLTQwMCxo/ZWlnaHQtMjI1LHJl/c2l6ZW1vZGUtNzIv/NzMwNDAxNjIuanBn',
    reporter: { userId: 'seed_u5', name: 'Neha Tiwari', phone: '+91 54321 09876' },
    status: 'pending',
    supporters: S(22),
    shares: 8,
    comments: [
      { userId: 'seed_u9', userName: 'Ritu M.', text: 'My daughter got hurt here last week.', createdAt: new Date('2026-04-11T17:00:00') },
    ],
    timeline: [
      { time: '4:45 PM, Apr 11', event: 'Complaint submitted by citizen', icon: 'fa-circle-plus', color: '#2563eb' },
    ],
    createdAt: new Date('2026-04-11T16:45:00'),
  },
  {
    complaintId: '#C006',
    title: 'Sewage overflow flooding residential street',
    description: 'Raw sewage is overflowing onto the main residential street in Ward 7. Health hazard for all residents, children cannot go to school.',
    category: 'sewage',
    location: 'Chembur Camp, Chembur, Mumbai',
    coordinates: { lat: 19.0600, lng: 72.8970 },
    imageUrl: 'https://images.pexels.com/photos/2480807/pexels-photo-2480807.jpeg?auto=compress&cs=tinysrgb&w=1200',
    reporter: { userId: 'seed_u6', name: 'Kumar Raj', phone: '+91 43210 98765' },
    status: 'inprogress',
    supporters: S(41),
    shares: 55,
    comments: [
      { userId: 'seed_u7', userName: 'Lakshmi P.', text: 'Children cannot go to school because of this.', createdAt: new Date('2026-04-10T10:00:00') },
      { userId: 'seed_u10', userName: 'Mohan D.', text: 'Health department must intervene immediately.', createdAt: new Date('2026-04-10T11:30:00') },
    ],
    assignedTo: 'Water & Sewage Board',
    timeline: [
      { time: '9:00 AM, Apr 10', event: 'Complaint submitted', icon: 'fa-circle-plus', color: '#2563eb' },
      { time: '11:00 AM, Apr 10', event: 'Assigned to Water & Sewage Board', icon: 'fa-building', color: '#7c3aed' },
      { time: '2:00 PM, Apr 10', event: 'Status changed to In Progress', icon: 'fa-arrows-rotate', color: '#f59e0b' },
    ],
    createdAt: new Date('2026-04-10T09:00:00'),
  },
  {
    complaintId: '#C007',
    title: 'Frequent power outages in residential colony',
    description: 'The colony has been experiencing 4-5 hour power cuts daily for the past week. No prior notice is given to residents.',
    category: 'electricity',
    location: 'Powai, Mumbai',
    coordinates: { lat: 19.1187, lng: 72.9053 },
    imageUrl: 'https://images.pexels.com/photos/236089/pexels-photo-236089.jpeg?auto=compress&cs=tinysrgb&w=1200',
    reporter: { userId: 'seed_u7', name: 'Venkat Rao', phone: '+91 32109 87654' },
    status: 'pending',
    supporters: S(27),
    shares: 19,
    comments: [
      { userId: 'seed_u8', userName: 'Anita S.', text: 'This is affecting work from home employees badly.', createdAt: new Date('2026-04-13T10:00:00') },
    ],
    timeline: [
      { time: '8:30 AM, Apr 13', event: 'Complaint submitted by citizen', icon: 'fa-circle-plus', color: '#2563eb' },
    ],
    createdAt: new Date('2026-04-13T08:30:00'),
  },
  {
    complaintId: '#C008',
    title: 'Loud late-night construction noise disturbing residents',
    description: 'Construction work with heavy machinery running past midnight for 2 weeks straight, violating noise pollution norms. Hundreds of residents are affected.',
    category: 'noise',
    location: 'Juhu Tara Road, Juhu, Mumbai',
    coordinates: { lat: 19.1075, lng: 72.8263 },
    imageUrl: 'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=1200',
    reporter: { userId: 'seed_u8', name: 'Vijay Kumar', phone: '+91 21098 76543' },
    status: 'resolved',
    supporters: S(31),
    shares: 31,
    comments: [
      { userId: 'seed_u3', userName: 'Preethi M.', text: 'Finally some action! Thank you.', createdAt: new Date('2026-04-08T09:00:00') },
    ],
    assignedTo: 'Public Safety & Noise Control',
    timeline: [
      { time: '6:30 AM, Apr 7', event: 'Complaint submitted', icon: 'fa-circle-plus', color: '#2563eb' },
      { time: '8:00 AM, Apr 7', event: 'Assigned to Public Safety & Noise Control', icon: 'fa-building', color: '#7c3aed' },
      { time: '9:00 AM, Apr 7', event: 'Inspection team deployed', icon: 'fa-arrows-rotate', color: '#f59e0b' },
      { time: '11:00 AM, Apr 7', event: 'Notice issued to contractor, work stopped', icon: 'fa-circle-check', color: '#059669' },
    ],
    createdAt: new Date('2026-04-07T06:30:00'),
  },
  {
    complaintId: '#C009',
    title: 'Illegal garbage dumping near school gate',
    description: 'A large illegal dump has formed right outside the school gate on MG Road. Students are forced to walk through filth every day. Flies and rodents are visible.',
    category: 'garbage',
    location: 'MG Road, Vile Parle East, Mumbai',
    coordinates: { lat: 19.0990, lng: 72.8534 },
    imageUrl: 'https://images.pexels.com/photos/2988040/pexels-photo-2988040.jpeg?auto=compress&cs=tinysrgb&w=1200',
    reporter: { userId: 'seed_u11', name: 'Pooja Sharma', phone: '+91 91234 56789' },
    status: 'pending',
    supporters: S(52),
    shares: 38,
    comments: [
      { userId: 'seed_u12', userName: 'Dinesh K.', text: 'Kids are falling sick because of this. Authorities must act NOW.', createdAt: new Date('2026-04-14T08:30:00') },
      { userId: 'seed_u13', userName: 'Sunita R.', text: 'This has been going on for a month. No one cares.', createdAt: new Date('2026-04-14T10:00:00') },
      { userId: 'seed_u14', userName: 'Harish P.', text: 'I have complained 3 times already with no response.', createdAt: new Date('2026-04-14T11:30:00') },
    ],
    timeline: [
      { time: '8:00 AM, Apr 14', event: 'Complaint submitted by citizen', icon: 'fa-circle-plus', color: '#2563eb' },
    ],
    createdAt: new Date('2026-04-14T08:00:00'),
  },
  {
    complaintId: '#C010',
    title: 'Entire stretch of road crumbling near flyover',
    description: 'The 200-metre stretch of road beneath the flyover at Santacruz has completely deteriorated. Deep cracks and loose gravel are causing frequent skids and near-accidents daily.',
    category: 'road',
    location: 'Santacruz East, Near Flyover, Mumbai',
    coordinates: { lat: 19.0810, lng: 72.8489 },
    imageUrl: 'https://images.pexels.com/photos/1437489/pexels-photo-1437489.jpeg?auto=compress&cs=tinysrgb&w=1200',
    reporter: { userId: 'seed_u15', name: 'Ravi Nair', phone: '+91 82345 67890' },
    status: 'pending',
    supporters: S(48),
    shares: 41,
    comments: [
      { userId: 'seed_u16', userName: 'Geeta V.', text: 'Two-wheelers skidding here every morning during rush hour.', createdAt: new Date('2026-04-13T07:15:00') },
      { userId: 'seed_u17', userName: 'Ashok B.', text: 'My car suspension got damaged because of this road.', createdAt: new Date('2026-04-13T09:00:00') },
    ],
    timeline: [
      { time: '6:45 AM, Apr 13', event: 'Complaint submitted by citizen', icon: 'fa-circle-plus', color: '#2563eb' },
    ],
    createdAt: new Date('2026-04-13T06:45:00'),
  },
  {
    complaintId: '#C011',
    title: 'Street flooding after every rain blocks commute',
    description: 'The main road in Kurla floods knee-deep after every moderate rainfall. Vehicles stall, commuters are stranded for hours, and businesses lose lakhs daily. The drainage has been clogged for months.',
    category: 'water',
    location: 'LBS Road, Kurla West, Mumbai',
    coordinates: { lat: 19.0709, lng: 72.8796 },
    imageUrl: 'https://imgs.search.brave.com/KL52B4LmtWKtXrzeTA_9mZ9cufvunxFvyqFL_ipXWJY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pY2hl/Zi5iYmNpLmNvLnVr/L2FjZS9zdGFuZGFy/ZC82NDAvY3BzcHJv/ZHBiL3Zpdm8vbGl2/ZS9pbWFnZXMvMjAy/My85LzI5LzgzNWM3/ODhlLTRiZmUtNDYx/YS1iMmQyLWNlNzZh/NmE3ZmI1Ni5qcGcu/d2VicA',
    reporter: { userId: 'seed_u18', name: 'Shweta Iyer', phone: '+91 73456 78901' },
    status: 'pending',
    supporters: S(63),
    shares: 72,
    comments: [
      { userId: 'seed_u19', userName: 'Aditya N.', text: 'This happens every monsoon. Year after year no permanent fix.', createdAt: new Date('2026-04-12T10:00:00') },
      { userId: 'seed_u20', userName: 'Fatima Z.', text: 'My children missed school for 3 days due to waterlogging.', createdAt: new Date('2026-04-12T11:30:00') },
      { userId: 'seed_u21', userName: 'Rajesh T.', text: 'Cars submerged up to the bonnet. Complete disaster.', createdAt: new Date('2026-04-12T12:00:00') },
    ],
    timeline: [
      { time: '9:30 AM, Apr 12', event: 'Complaint submitted by citizen', icon: 'fa-circle-plus', color: '#2563eb' },
    ],
    createdAt: new Date('2026-04-12T09:30:00'),
  },
  {
    complaintId: '#C012',
    title: 'Factory smoke causing severe air pollution in neighbourhood',
    description: 'A chemical factory near the residential zone has been releasing thick black smoke continuously for 10 days. Residents are suffering from respiratory issues. Children and elderly are at risk.',
    category: 'other',
    location: 'MIDC Industrial Area, Andheri East, Mumbai',
    coordinates: { lat: 19.1136, lng: 72.8697 },
    imageUrl: 'https://images.pexels.com/photos/221012/pexels-photo-221012.jpeg?auto=compress&cs=tinysrgb&w=1200',
    reporter: { userId: 'seed_u22', name: 'Kiran Desai', phone: '+91 64567 89012' },
    status: 'inprogress',
    supporters: S(57),
    shares: 84,
    comments: [
      { userId: 'seed_u23', userName: 'Deepa M.', text: 'My asthma has worsened severely since this started.', createdAt: new Date('2026-04-11T08:00:00') },
      { userId: 'seed_u24', userName: 'Bhushan L.', text: 'We cannot open our windows anymore. This is unacceptable.', createdAt: new Date('2026-04-11T09:30:00') },
    ],
    assignedTo: 'Pollution Control Board',
    timeline: [
      { time: '7:30 AM, Apr 11', event: 'Complaint submitted', icon: 'fa-circle-plus', color: '#2563eb' },
      { time: '10:00 AM, Apr 11', event: 'Assigned to Pollution Control Board', icon: 'fa-building', color: '#7c3aed' },
      { time: '12:00 PM, Apr 11', event: 'Inspection scheduled', icon: 'fa-arrows-rotate', color: '#f59e0b' },
    ],
    createdAt: new Date('2026-04-11T07:30:00'),
  },
  {
    complaintId: '#C013',
    title: 'Fallen electricity pole blocking road for 5 days',
    description: 'An electricity pole snapped during a storm 5 days ago and is lying across the main road in Malad. Live wires dangling near the road pose a deadly risk to pedestrians and drivers.',
    category: 'electricity',
    location: 'S.V. Road, Malad West, Mumbai',
    coordinates: { lat: 19.1864, lng: 72.8481 },
    imageUrl: 'https://images.pexels.com/photos/2036656/pexels-photo-2036656.jpeg?auto=compress&cs=tinysrgb&w=1200',
    reporter: { userId: 'seed_u25', name: 'Ajay Bhatt', phone: '+91 55678 90123' },
    status: 'inprogress',
    supporters: S(44),
    shares: 62,
    comments: [
      { userId: 'seed_u26', userName: 'Varsha N.', text: 'A child nearly touched a live wire yesterday. This is DANGEROUS.', createdAt: new Date('2026-04-13T08:00:00') },
      { userId: 'seed_u27', userName: 'Prakash S.', text: 'BEST has been informed 10 times. No action at all.', createdAt: new Date('2026-04-13T09:00:00') },
    ],
    assignedTo: 'Electrical & Power Dept',
    timeline: [
      { time: '6:00 AM, Apr 11', event: 'Complaint submitted', icon: 'fa-circle-plus', color: '#2563eb' },
      { time: '9:00 AM, Apr 11', event: 'Assigned to Electrical & Power Dept', icon: 'fa-building', color: '#7c3aed' },
      { time: '11:00 AM, Apr 11', event: 'Team dispatched for assessment', icon: 'fa-arrows-rotate', color: '#f59e0b' },
    ],
    createdAt: new Date('2026-04-11T06:00:00'),
  },
  {
    complaintId: '#C014',
    title: 'Public park turned into garbage dump by vendors',
    description: 'The neighbourhood park in Borivali has been taken over by vendors who dump waste there every night. The park is now unusable — benches are buried in trash and the smell is unbearable.',
    category: 'park',
    location: 'Eksar Road, Borivali West, Mumbai',
    coordinates: { lat: 19.2290, lng: 72.8573 },
    imageUrl: 'https://imgs.search.brave.com/xljYXTRQlEHPMBoM5SggiZQJ6F4bq4tEZyHva_YmOyA/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvNTMx/MTY4OTMyL3Bob3Rv/L3RyYXNoLWluLXRo/ZS1wYXJrLmpwZz9z/PTYxMng2MTImdz0w/Jms9MjAmYz1EU0NO/dnBzNTM1REtJNVd1/NF9lNk9PdWh5eDNC/Q0RRa0dzWkFzUzFR/Nk9rPQ',
    reporter: { userId: 'seed_u28', name: 'Meenakshi Rao', phone: '+91 46789 01234' },
    status: 'pending',
    supporters: S(35),
    shares: 28,
    comments: [
      { userId: 'seed_u29', userName: 'Ganesh K.', text: 'Senior citizens have no place to sit and relax anymore.', createdAt: new Date('2026-04-14T09:00:00') },
      { userId: 'seed_u30', userName: 'Usha P.', text: 'The municipality built this park 2 years ago. It is already destroyed.', createdAt: new Date('2026-04-14T10:30:00') },
    ],
    timeline: [
      { time: '7:15 AM, Apr 14', event: 'Complaint submitted by citizen', icon: 'fa-circle-plus', color: '#2563eb' },
    ],
    createdAt: new Date('2026-04-14T07:15:00'),
  },
  {
    complaintId: '#C015',
    title: 'Entire highway stretch dark — no streetlights for 2 km',
    description: 'The 2-kilometre stretch of the Eastern Freeway near Wadala has had no functional streetlights for over 3 weeks. Three road accidents have already occurred in this stretch after dark.',
    category: 'streetlight',
    location: 'Eastern Freeway, Wadala, Mumbai',
    coordinates: { lat: 18.9969, lng: 72.8544 },
    imageUrl: 'https://images.pexels.com/photos/338936/pexels-photo-338936.jpeg?auto=compress&cs=tinysrgb&w=1200',
    reporter: { userId: 'seed_u31', name: 'Mahesh Kulkarni', phone: '+91 37890 12345' },
    status: 'pending',
    supporters: S(40),
    shares: 47,
    comments: [
      { userId: 'seed_u32', userName: 'Nandini V.', text: 'I avoid this road after 8 PM entirely. It is pitch black.', createdAt: new Date('2026-04-12T07:30:00') },
      { userId: 'seed_u33', userName: 'Dilip A.', text: 'Three accidents in the last week! When will authorities wake up?', createdAt: new Date('2026-04-12T08:45:00') },
    ],
    timeline: [
      { time: '6:00 AM, Apr 12', event: 'Complaint submitted by citizen', icon: 'fa-circle-plus', color: '#2563eb' },
    ],
    createdAt: new Date('2026-04-12T06:00:00'),
  },
  {
    complaintId: '#C016',
    title: 'Water main burst — road dug up for 10 days with no repair',
    description: 'A water main burst on the main road in Ghatkopar 10 days ago. MCGM dug up the road but never returned to fix it. The open trench is unfenced and a serious hazard, especially at night.',
    category: 'water',
    location: 'LBS Marg, Ghatkopar West, Mumbai',
    coordinates: { lat: 19.0865, lng: 72.9062 },
    imageUrl: 'https://images.pexels.com/photos/2339009/pexels-photo-2339009.jpeg?auto=compress&cs=tinysrgb&w=1200',
    reporter: { userId: 'seed_u34', name: 'Sandeep More', phone: '+91 28901 23456' },
    status: 'inprogress',
    supporters: S(36),
    shares: 33,
    comments: [
      { userId: 'seed_u35', userName: 'Rekha S.', text: 'A bike rider fell into the trench last night. This is criminal negligence.', createdAt: new Date('2026-04-13T06:30:00') },
      { userId: 'seed_u36', userName: 'Jayesh P.', text: 'Wasted thousands of litres of water already. No action from BMC.', createdAt: new Date('2026-04-13T08:00:00') },
    ],
    assignedTo: 'Water Supply Dept',
    timeline: [
      { time: '8:00 AM, Apr 13', event: 'Complaint submitted', icon: 'fa-circle-plus', color: '#2563eb' },
      { time: '10:00 AM, Apr 13', event: 'Assigned to Water Supply Dept', icon: 'fa-building', color: '#7c3aed' },
      { time: '12:00 PM, Apr 13', event: 'Work order issued', icon: 'fa-arrows-rotate', color: '#f59e0b' },
    ],
    createdAt: new Date('2026-04-13T08:00:00'),
  },
  {
    complaintId: '#C017',
    title: 'Illegal burning of construction waste causing smoke menace',
    description: 'A construction site in Vikhroli is burning debris and waste materials openly every evening. Thick acrid smoke engulfs the nearby housing societies from 6 PM onwards, causing eye irritation and breathing problems.',
    category: 'noise',
    location: 'Vikhroli East, Mumbai',
    coordinates: { lat: 19.1080, lng: 72.9290 },
    imageUrl: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1200',
    reporter: { userId: 'seed_u37', name: 'Padma Krishnan', phone: '+91 19012 34567' },
    status: 'pending',
    supporters: S(33),
    shares: 25,
    comments: [
      { userId: 'seed_u38', userName: 'Vivek C.', text: 'My children cannot go to the balcony after 5 PM. Smoke is everywhere.', createdAt: new Date('2026-04-14T18:30:00') },
      { userId: 'seed_u39', userName: 'Archana D.', text: 'This has been going on for three weeks. No one has stopped them.', createdAt: new Date('2026-04-14T19:00:00') },
    ],
    timeline: [
      { time: '6:45 PM, Apr 14', event: 'Complaint submitted by citizen', icon: 'fa-circle-plus', color: '#2563eb' },
    ],
    createdAt: new Date('2026-04-14T18:45:00'),
  },
  {
    complaintId: '#C018',
    title: 'Broken footpath tiles injuring pedestrians daily',
    description: 'The footpath along Hill Road in Bandra has completely broken tiles with sharp edges jutting out. Three elderly pedestrians have already been injured. The area has no temporary barrier or warning sign.',
    category: 'road',
    location: 'Hill Road, Bandra West, Mumbai',
    coordinates: { lat: 19.0544, lng: 72.8282 },
    imageUrl: 'https://images.pexels.com/photos/5695648/pexels-photo-5695648.jpeg?auto=compress&cs=tinysrgb&w=1200',
    reporter: { userId: 'seed_u40', name: 'Lalitha Menon', phone: '+91 90123 45678' },
    status: 'pending',
    supporters: S(30),
    shares: 22,
    comments: [
      { userId: 'seed_u41', userName: 'Sunil G.', text: 'My neighbour slipped and fractured her wrist here. Please fix this urgently.', createdAt: new Date('2026-04-15T07:00:00') },
      { userId: 'seed_u42', userName: 'Kavya R.', text: 'This stretch is used by school children every morning. Very dangerous.', createdAt: new Date('2026-04-15T08:00:00') },
    ],
    timeline: [
      { time: '6:30 AM, Apr 15', event: 'Complaint submitted by citizen', icon: 'fa-circle-plus', color: '#2563eb' },
    ],
    createdAt: new Date('2026-04-15T06:30:00'),
  },
];

const SEED_OFFICERS = [
  { name: 'Rajan Mehta',   phone: '9876543210', role: 'Senior Officer', zone: 'North Zone',         initials: 'RM', color: '#2563eb', cases: 32, resolved: 28 },
  { name: 'Priya Sharma',  phone: '9876543211', role: 'Field Officer',  zone: 'South Zone',         initials: 'PS', color: '#7c3aed', cases: 25, resolved: 21 },
  { name: 'Arjun Das',     phone: '9876543212', role: 'Junior Officer', zone: 'East Zone',          initials: 'AD', color: '#059669', cases: 18, resolved: 14 },
  { name: 'Meena Kapoor',  phone: '9876543213', role: 'Field Officer',  zone: 'West Zone',          initials: 'MK', color: '#d97706', cases: 22, resolved: 19 },
  { name: 'Suresh Patil',  phone: '9876543214', role: 'Zonal Head',     zone: 'Central Zone',       initials: 'SP', color: '#0891b2', cases: 40, resolved: 36 },
  { name: 'Nisha Rao',     phone: '9876543215', role: 'Field Officer',  zone: 'Pimpri-Chinchwad',   initials: 'NR', color: '#ef4444', cases: 20, resolved: 17 },
];

export async function seedDB() {
  try {
    for (const seed of SEED_ISSUES) {
      const { data: existing } = await supabase
        .from('issues')
        .select('ai_analysis, assigned_to')
        .eq('complaint_id', seed.complaintId)
        .maybeSingle();

      let aiAnalysis = existing?.ai_analysis || null;
      if (!aiAnalysis || aiAnalysis.finalScore === null || aiAnalysis.finalScore === undefined) {
        aiAnalysis = await runAIAnalysis({
          description: seed.description,
          category: seed.category,
          imageUrl: seed.imageUrl,
        });
      }

      const timeline = [...(seed.timeline || [])];
      const spamEventExists = timeline.some((t) => String(t.event || '').includes('AI moderation flagged'));
      if (aiAnalysis?.isSpam && !spamEventExists) {
        timeline.push({
          time: new Date().toLocaleString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true,
            day: '2-digit', month: 'short',
          }),
          event: 'AI moderation flagged this complaint as SPAM',
          icon: 'fa-triangle-exclamation',
          color: '#ef4444',
        });
      }

      const payload = {
        complaint_id: seed.complaintId,
        title: seed.title,
        description: seed.description,
        category: seed.category,
        location: seed.location,
        coordinates: seed.coordinates,
        image_url: seed.imageUrl || '',
        reporter: seed.reporter,
        status: seed.status,
        supporters: seed.supporters || [],
        shares: seed.shares || 0,
        comments: seed.comments || [],
        assigned_to: aiAnalysis?.isSpam ? 'Spam Queue' : seed.assignedTo || null,
        timeline,
        ai_analysis: aiAnalysis,
        created_at: seed.createdAt || new Date().toISOString(),
      };

      const { error: upsertErr } = await supabase
        .from('issues')
        .upsert(payload, { onConflict: 'complaint_id' });

      if (upsertErr) {
        console.warn(`[Seed] Error upserting issue ${seed.complaintId}:`, upsertErr.message);
      }
    }

    const { count } = await supabase.from('issues').select('*', { count: 'exact', head: true });
    console.log(`Seed ensured for ${SEED_ISSUES.length} issues (total now ${count || SEED_ISSUES.length})`);

    const { count: officerCount } = await supabase.from('officers').select('*', { count: 'exact', head: true });
    if (officerCount && officerCount > 0) {
      console.log(`DB already has ${officerCount} officers — skipping officer seed`);
    } else {
      const { error: officerErr } = await supabase.from('officers').insert(SEED_OFFICERS);
      if (officerErr) {
        console.warn('[Seed] Officer insert warning:', officerErr.message);
      } else {
        console.log(`Seeded ${SEED_OFFICERS.length} officers`);
      }
    }
  } catch (err) {
    console.error('seedDB error:', err.message);
  }
}

