# AI Aid Now

Build a Full-Stack AI-Powered Smart Emergency Response & Ambulance Management System

1. PROJECT OVERVIEW

Build a modern, professional, responsive full-stack web application called:

"AI-Powered Smart Emergency Response & Ambulance Management System"

The system is an end-to-end emergency coordination platform connecting:

Patient/Bystander → AI → Ambulance → Paramedic → Hospital → Doctor → Family → Admin

The primary goal is to demonstrate how AI, GPS/location services, intelligent ambulance dispatch, hospital recommendation, live tracking, emergency timelines, notifications, and role-based dashboards can work together.

This is a college project prototype using simulated/demo data. Do not claim that this is a certified real-world emergency dispatch system.

The application must have a polished production-style UI and a complete end-to-end demo workflow.

2. CORE DEMO WORKFLOW

The most important workflow must be:

Patient/bystander logs in.

Patient presses a large emergency SOS button.

Browser requests and captures GPS location.

User selects emergency type.

User provides symptoms/condition.

System creates an emergency case.

AI analyzes the emergency information.

AI assigns priority:

LOW

MEDIUM

HIGH

CRITICAL

System searches available ambulances.

Intelligent dispatch selects the most suitable ambulance using:

distance

availability

ambulance type

traffic/demo traffic score

emergency priority

Driver receives an emergency request.

Driver accepts the request.

Patient sees ambulance assignment and ETA.

Ambulance location is displayed on a live map/demo map.

System evaluates hospitals.

AI/intelligent recommendation selects the most suitable hospital based on:

distance

emergency availability

ICU availability

beds

specialization

emergency severity

Hospital receives an incoming emergency alert.

Hospital can prepare the emergency department.

Doctor can view patient information and emergency timeline.

Driver updates ambulance status:

AVAILABLE

BUSY

GOING_TO_PATIENT

ARRIVED_AT_PATIENT

PATIENT_ONBOARD

GOING_TO_HOSPITAL

ARRIVED_AT_HOSPITAL

COMPLETED

Patient/family receives status updates.

Admin dashboard updates statistics in real time.

Complete emergency timeline is stored.

3. IMPORTANT DEVELOPMENT RULE

Build this as a fully working prototype, not merely a static UI.

Every major button should perform an action.

Use simulated data where external APIs or real services are unavailable.

Do not leave major sections with "Coming Soon".

The application should be demoable from beginning to end without requiring actual emergency services.

4. TECHNOLOGY STACK

Use:

Frontend:

React

TypeScript

Vite

Tailwind CSS

shadcn/ui

Lucide icons

Backend/database:

Supabase

PostgreSQL

Supabase Auth

Supabase Realtime

AI:

Implement the AI decision-support logic through a clean service/API abstraction.

If a real AI API is available through environment variables, allow integration.

Otherwise provide a deterministic demo AI engine so the project works without an external AI API.

Maps:

Use browser geolocation.

If Google Maps API key is available, support Google Maps.

Otherwise provide a polished simulated map interface using OpenStreetMap/Leaflet or a map-style fallback.

Notifications:

Implement in-app notifications.

Structure the notification service so Firebase Cloud Messaging can be integrated later.

Authentication:

Supabase Auth

Role-based authorization

5. USER ROLES

Implement these roles:

PATIENT

DRIVER

PARAMEDIC

DOCTOR

HOSPITAL

ADMIN

Each role must have its own dashboard and permissions.

6. AUTHENTICATION

Create:

Login page

Registration page

Forgot password

Logout

Role-based routing

Protected routes

Session persistence

Registration fields:

Full Name

Phone

Email

Password

Role

For the prototype, allow demo accounts for every role.

Create a prominent:

"Use Demo Account"

section with buttons:

Patient Demo

Driver Demo

Hospital Demo

Doctor Demo

Admin Demo

Clicking a demo account should authenticate or enter the corresponding demo dashboard.

Never expose real passwords in the UI.

7. GLOBAL UI DESIGN

Use a modern emergency/healthcare technology design.

Visual style:

Professional

Clean

High contrast

Modern dashboard

Medical/technology aesthetic

Responsive

Mobile-first for patient and driver interfaces

Use:

Rounded cards

Soft shadows

Clear typography

Status badges

Progress indicators

Timeline components

Alert cards

Interactive maps

Charts

Tables

Modal dialogs

Toast notifications

Use red only for emergency-critical elements.

Do not make the entire application red.

Primary colors can be based around:

deep navy

white

neutral gray

healthcare blue

emergency red

green for successful/available status

amber for warning

8. MAIN NAVIGATION

Create a responsive sidebar for dashboards.

Navigation should change depending on role.

Patient:

Dashboard

Emergency SOS

Live Emergency

Hospitals

Medical Profile

Emergency History

Notifications

Settings

Driver/Paramedic:

Dashboard

Emergency Requests

Active Emergency

Navigation

Patient Details

Status

History

Notifications

Profile

Hospital:

Dashboard

Incoming Emergencies

Active Patients

Beds & ICU

Emergency Department

Doctors

Emergency History

Notifications

Settings

Doctor:

Dashboard

Incoming Patients

Patient Details

Emergency Timeline

Medical Information

History

Admin:

Dashboard

Live Emergencies

Ambulances

Hospitals

Patients

Users

AI Analytics

Reports

Emergency History

System Settings

9. PATIENT DASHBOARD

Create a highly polished patient dashboard.

Top section:

"Emergency Assistance"

Large SOS card:

🚨 EMERGENCY SOS

"Press SOS to request emergency assistance"

Large button:

PRESS SOS

Below it display:

Current GPS status

Current location

Emergency availability

Emergency contact

Dashboard cards:

Active Emergency

Ambulance Status

ETA

Recommended Hospital

Also display:

Recent emergency history

Notifications

Medical profile summary

10. SOS FLOW

When user presses SOS:

Open an emergency modal/page.

Step 1:

Display:

"Detecting your location..."

Request browser geolocation permission.

Show:

Location detected ✓

Display:

Latitude

Longitude

Approximate address if available

If GPS fails:

Show:

"Unable to automatically detect location."

Provide:

Retry GPS

Enter location manually

11. EMERGENCY FORM

Create emergency information form.

Emergency Type:

Road Accident

Heart Problem

Breathing Problem

Unconscious

Chest Pain

Heavy Bleeding

Stroke Symptoms

Other

Condition fields:

Conscious?

Breathing difficulty?

Heavy bleeding?

Chest pain?

Heart-related symptoms?

Accident involved?

Severe pain?

Number of injured people?

Additional:

Age

Gender

Description

Known allergies

Existing medical conditions

Blood group

Do not require excessive medical information before an SOS can be created.

12. AI PRIORITY ANALYSIS

After submitting emergency information, display a beautiful AI analysis screen.

Header:

AI Emergency Assessment

Show animated processing:

"Analyzing emergency information..."

Then show:

Priority:

LOW / MEDIUM / HIGH / CRITICAL

For example:

Accident = YES
Unconscious = YES
Heavy Bleeding = YES
Breathing Problem = YES

Result:

CRITICAL

Show explanation:

Unconsciousness detected

Heavy bleeding detected

Breathing difficulty detected

Accident reported

Important disclaimer:

"AI assessment is decision support only. It does not replace professional medical judgment."

13. AI PRIORITY LOGIC

Implement a deterministic scoring engine for the prototype.

Example:

CRITICAL indicators:

unconscious

severe breathing difficulty

heavy bleeding

cardiac emergency

severe accident

HIGH:

chest pain

moderate breathing problem

serious injury

suspected stroke

MEDIUM:

moderate pain

non-critical injury

LOW:

minor symptoms

Create the logic in a reusable service:

aiPriorityService

Return:

priority
score
reasons[]
confidence

Do not present the score as a medical diagnosis.

14. AMBULANCE DISPATCH

After AI priority:

Display:

Finding Best Ambulance

Show animated searching state.

Search simulated ambulance data.

Each ambulance must have:

ambulance number

latitude

longitude

status

ambulance type

equipment

driver

paramedic

traffic score

Types:

NORMAL

ICU

ADVANCED_LIFE_SUPPORT

Select ambulance using a weighted score.

Example:

Ambulance suitability:

availability

distance

emergency priority

ambulance type

traffic

Critical cases should prefer suitable ICU/advanced ambulances.

Do not simply select the closest ambulance.

15. AMBULANCE SEARCH UI

Display cards such as:

Ambulance TN38AB1234

Status:
AVAILABLE

Distance:
2.1 km

Type:
ICU

ETA:
7 min

Equipment:

Ventilator

Oxygen

Cardiac Monitor

Button:

ASSIGN AMBULANCE

Then automatically assign the best ambulance.

16. DRIVER DASHBOARD

Create a dedicated driver/paramedic dashboard.

Header:

"Ambulance Control"

Status toggle:

AVAILABLE / BUSY / OFFLINE

Dashboard cards:

Current Status

Today's Emergencies

Distance Travelled

Response Time

Incoming emergency card:

🚨 NEW EMERGENCY

Priority:
CRITICAL

Emergency:
Road Accident

Distance:
2.1 km

Patient condition:
Unconscious
Heavy bleeding

Buttons:

ACCEPT

REJECT

If accepted:

Update emergency status to:

GOING_TO_PATIENT

17. AMBULANCE STATUS FLOW

Implement the complete status progression.

AVAILABLE

↓

EMERGENCY_ASSIGNED

↓

GOING_TO_PATIENT

↓

ARRIVED_AT_PATIENT

↓

PATIENT_ONBOARD

↓

GOING_TO_HOSPITAL

↓

ARRIVED_AT_HOSPITAL

↓

COMPLETED

Every status change must:

update database

update UI

create timeline event

notify relevant users

18. LIVE TRACKING

Create a live tracking screen.

Patient should see:

Ambulance marker 🚑

Patient marker 📍

Hospital marker 🏥

Display:

Ambulance distance

ETA

Current status

Driver name

Ambulance number

If real maps are unavailable, create a professional simulated map with moving ambulance marker.

Include:

"Live location updates"

and timestamp.

19. FAMILY TRACKING

Allow emergency status to be viewed by an emergency contact/family member.

Display:

Emergency ID

Ambulance assigned ✓

Driver assigned ✓

Ambulance on the way 🚑

Patient picked up ✓

Hospital selected 🏥

Patient reached hospital ✓

Family timeline:

SOS Received
↓
AI Assessment
↓
Ambulance Assigned
↓
Driver Accepted
↓
Patient Picked Up
↓
Hospital Selected
↓
Hospital Arrival

20. HOSPITAL DATABASE

Create hospital records containing:

name

address

latitude

longitude

phone

available beds

ICU beds

emergency availability

specializations

status

Specializations:

Trauma

Cardiology

Neurology

Orthopedics

Emergency Medicine

21. AI HOSPITAL RECOMMENDATION

Create:

hospitalRecommendationService

Do NOT simply choose the nearest hospital.

Calculate suitability based on:

distance

emergency availability

ICU availability

available beds

required specialization

emergency severity

Return:

hospital
score
distance
reasons[]

Example:

Hospital A

Distance: 3 km

ICU: Available ✓
Trauma: Available ✓
Emergency: Available ✓
Beds: Available ✓

Recommendation:

Hospital A

Reason:

"Suitable trauma facility with ICU availability and acceptable travel distance."

22. HOSPITAL DASHBOARD

Create:

Hospital Emergency Control Center

Statistics:

Emergency cases today

Incoming ambulances

Active patients

Available beds

ICU beds

Emergency department status

Incoming emergency card:

🚨 INCOMING CRITICAL PATIENT

Patient:
Patient Name

Emergency:
Road Accident

Priority:
CRITICAL

Condition:
Unconscious
Heavy bleeding

Ambulance:
TN38AB1234

ETA:
7 minutes

Buttons:

PREPARE EMERGENCY DEPARTMENT

VIEW PATIENT

23. HOSPITAL RESOURCE MANAGEMENT

Create editable cards:

Available Beds

ICU Beds

Emergency Department

Specialists Available

Allow hospital staff to update these values.

Changes should immediately affect hospital recommendation.

24. DOCTOR DASHBOARD

Create a doctor dashboard.

Show:

Patient Information

Name

Age

Gender

Blood Group

Allergies

Medical History

Current Emergency:

Emergency Type

Priority

Symptoms

Description

Ambulance:

Ambulance number

Current location

ETA

Emergency Timeline:

SOS
→ AI Assessment
→ Ambulance Assigned
→ Driver Accepted
→ Patient Pickup
→ Hospital Arrival

25. ADMIN DASHBOARD

Create a professional emergency control center.

Header:

Emergency Operations Center

Top statistics:

Total Emergencies
1248

Critical Cases
186

Average Response Time
8.2 min

Available Ambulances
27

Busy Ambulances
13

Hospitals Connected
18

Create charts:

Emergency types

Emergencies per day

Response time

Ambulance utilization

Hospital usage

Priority distribution

Use Recharts.

26. ADMIN LIVE EMERGENCY MAP

Create a large map section.

Show:

active ambulance markers

patient locations

hospitals

emergency cases

Clicking an emergency should open:

Emergency ID

Patient

Priority

Ambulance

Hospital

ETA

Current status

27. ADMIN EMERGENCY TABLE

Create a professional table.

Columns:

Emergency ID
Patient
Type
Priority
Ambulance
Hospital
Status
Created
Response Time

Add:

Search

Filter

Sort

Priority filter

Status filter

Date filter

28. DATABASE SCHEMA

Use PostgreSQL/Supabase.

Create tables:

users/profiles

Fields:

id

name

phone

email

role

created_at

Roles:

PATIENT
DRIVER
PARAMEDIC
DOCTOR
HOSPITAL
ADMIN

patients

id

user_id

name

age

gender

blood_group

phone

emergency_contact

medical_history

allergies

created_at

ambulances

id

ambulance_number

driver_id

paramedic_id

latitude

longitude

status

ambulance_type

equipment

current_case_id

hospitals

id

name

address

latitude

longitude

phone

available_beds

icu_beds

emergency_available

specializations

status

emergencies

id

patient_id

reported_by

emergency_type

description

severity

latitude

longitude

ambulance_id

hospital_id

status

created_at

accepted_at

pickup_at

hospital_arrival_at

completed_at

emergency_timeline

id

emergency_id

event

timestamp

user_id

description

notifications

id

user_id

emergency_id

title

message

type

read

created_at

ambulance_locations

id

ambulance_id

latitude

longitude

timestamp

29. ROLE-BASED SECURITY

Implement Row Level Security.

PATIENT:

can access own profile

can create emergencies

can view own emergency cases

DRIVER:

can view assigned emergencies

can update assigned ambulance status

can update location

PARAMEDIC:

can view assigned patient information

can update emergency status

DOCTOR:

can view relevant patient emergency information

HOSPITAL:

can view emergencies assigned to that hospital

can update hospital availability

ADMIN:

full management access

Do not expose sensitive patient data unnecessarily.

30. EMERGENCY TIMELINE

Every important action must create a timeline record.

Example:

10:31 AM
SOS received

10:32 AM
AI priority calculated

10:33 AM
Ambulance assigned

10:34 AM
Driver accepted

10:39 AM
Ambulance reached patient

10:42 AM
Patient picked up

10:55 AM
Hospital reached

Make the timeline visually impressive.

31. NOTIFICATION SYSTEM

Create real-time in-app notifications.

Patient:

"Ambulance assigned."

Driver:

"New emergency request received."

Hospital:

"Critical patient arriving in 8 minutes."

Family:

"Patient has been picked up."

Admin:

"New critical emergency detected."

Use notification bell with unread count.

32. REAL-TIME UPDATES

Use Supabase Realtime.

When:

ambulance accepts emergency

ambulance status changes

hospital availability changes

ambulance location changes

emergency status changes

all relevant dashboards should update automatically without manual page refresh.

33. FAILURE HANDLING

Implement graceful fallbacks.

GPS failure:

"GPS unavailable. Enter location manually."

AI failure:

"AI assessment unavailable. Manual priority selection required."

Ambulance rejection:

Automatically search another available ambulance.

Example:

Ambulance A
No response

↓

Ambulance B
Request sent

Network issue:

Display:

"Connection interrupted. Retrying..."

Do not crash the application.

34. DEMO DATA

Seed the application with:

5 ambulances

Example:

TN38AB1234
AVAILABLE
ICU

TN38AB5678
AVAILABLE
NORMAL

TN38CD1234
BUSY
NORMAL

TN38CD5678
AVAILABLE
ADVANCED_LIFE_SUPPORT

TN38EF1234
AVAILABLE
ICU

Create 5 hospitals:

Hospital A
Hospital B
Hospital C
Hospital D
Hospital E

Give each different:

distance

beds

ICU

emergency availability

specialization

Create realistic demo patients.

35. DEMO SCENARIO

The application must support this exact demonstration.

PATIENT:

Open patient dashboard.

Press:

🚨 SOS

Select:

Road Accident

Unconscious:
YES

Heavy Bleeding:
YES

Breathing Problem:
YES

Submit.

AI shows:

CRITICAL

Then:

"Searching for suitable ambulance..."

Show:

TN38AB1234

Distance:
2.1 km

Type:
ICU

Status:
AVAILABLE

Assign.

Switch to Driver Dashboard.

Show:

NEW CRITICAL EMERGENCY

Click:

ACCEPT

Switch back to Patient Dashboard.

Show:

Ambulance Assigned ✓

ETA:
7 minutes

Live Tracking.

Switch to Hospital Dashboard.

Show:

INCOMING CRITICAL PATIENT

Trauma
ICU Required

ICU Available:
YES

Then show:

AI RECOMMENDATION

Hospital A ⭐

Reasons:

✓ ICU available
✓ Trauma department
✓ Emergency available
✓ Suitable distance

Click:

PREPARE

Then update ambulance:

GOING_TO_HOSPITAL

ARRIVED_AT_HOSPITAL

COMPLETED

Finally open Admin Dashboard.

Show the case as:

COMPLETED

and show the full timeline.

36. API/SERVICE STRUCTURE

Organize the code cleanly.

Create service modules:

authService

emergencyService

ambulanceService

hospitalService

aiPriorityService

hospitalRecommendationService

notificationService

locationService

timelineService

analyticsService

Keep business logic separate from UI components.

37. COMPONENT STRUCTURE

Create reusable components:

Sidebar

Header

EmergencySOSButton

EmergencyCard

PriorityBadge

AmbulanceCard

HospitalCard

PatientCard

Timeline

LiveMap

StatusBadge

NotificationPanel

StatsCard

DataTable

LoadingState

EmptyState

ErrorState

ConfirmDialog

38. RESPONSIVE DESIGN

The application must work on:

Desktop

Laptop

Tablet

Mobile

Patient and driver screens should be especially mobile-friendly.

The SOS button must be easy to access on mobile.

39. ACCESSIBILITY

Implement:

semantic HTML

keyboard navigation

accessible buttons

proper labels

sufficient contrast

aria labels where necessary

clear error messages

40. ERROR STATES

Create polished UI states for:

Loading
Empty
Error
Offline
GPS unavailable
No ambulance available
No suitable hospital
AI unavailable
Network disconnected

41. LANDING PAGE

Create a professional landing page before login.

Hero:

AI-Powered Smart Emergency Response

Subtitle:

"Connecting patients, ambulances, paramedics, hospitals and doctors through intelligent emergency coordination."

Buttons:

Request Emergency Assistance

Login

View Demo

Sections:

How It Works

SOS

AI Assessment

Smart Ambulance Dispatch

Live Tracking

Hospital Recommendation

Medical Coordination

Features:

AI Emergency Priority

Smart Ambulance Dispatch

GPS Tracking

Hospital Recommendation

Real-Time Notifications

Emergency Timeline

Hospital Availability

Analytics

Add a disclaimer:

"Prototype for educational and demonstration purposes. AI recommendations are decision support and do not replace professional medical judgment."

42. UI QUALITY REQUIREMENTS

Do NOT create a generic template.

The UI should look like a real emergency technology startup product.

Use:

polished cards

subtle animations

skeleton loaders

smooth transitions

modern tables

interactive charts

status indicators

professional empty states

confirmation dialogs

responsive layouts

Use Lucide icons.

Use consistent spacing.

Avoid excessive gradients.

Avoid excessive rounded elements.

Avoid unnecessary animations.

Keep emergency actions visually obvious.

43. DATA VISUALIZATION

Admin dashboard charts:

Emergency type distribution

Priority distribution

Daily emergency trend

Ambulance utilization

Average response time

Hospital usage

Use Recharts.

Charts must use real data from the database/demo seed data.

44. SEARCH AND FILTERING

Admin:

Search emergencies.

Filter by:

priority

status

emergency type

ambulance

hospital

date

Hospital:

Filter incoming emergencies.

Driver:

Filter emergency requests.

Patient:

Filter emergency history.

45. AUDIT LOGGING

Store important events:

login

emergency created

priority calculated

ambulance assigned

driver accepted

status changed

hospital recommended

hospital accepted

emergency completed

Display these in emergency timeline.

46. SECURITY AND PRIVACY

The application contains simulated medical information.

Implement:

authentication

authorization

role-based access

protected routes

database security policies

no sensitive information in URLs

safe form validation

Never expose secrets or API keys in frontend code.

Use environment variables.

47. ENVIRONMENT VARIABLES

Create .env.example.

Include placeholders for:

SUPABASE_URL
SUPABASE_ANON_KEY
GOOGLE_MAPS_API_KEY
AI_API_KEY
FIREBASE_API_KEY

Do not hardcode secret keys.

The app must still run using demo/mock functionality if optional API keys are missing.

48. README

Generate a complete README containing:

Project overview
Features
Architecture
Technology stack
Database schema
Installation
Environment variables
Supabase setup
Demo accounts
How to run
AI module explanation
Hospital recommendation logic
Ambulance dispatch logic
Testing
Limitations
Future improvements

49. IMPORTANT PROTOTYPE LIMITATION

Clearly communicate throughout the project documentation:

This is an educational prototype.

It must NOT be represented as a replacement for emergency services.

AI predictions are decision-support recommendations only.

Final medical decisions remain with qualified healthcare professionals.

50. FINAL ACCEPTANCE CRITERIA

Before considering the project complete, verify:

[ ] Landing page works
[ ] Authentication works
[ ] Demo accounts work
[ ] Role-based dashboards work
[ ] Patient can create SOS
[ ] GPS works or manual location fallback works
[ ] Emergency form works
[ ] AI priority works
[ ] Ambulance selection works
[ ] Driver receives request
[ ] Driver can accept
[ ] Ambulance status updates work
[ ] Patient sees ambulance status
[ ] Live/simulated map works
[ ] Hospital recommendation works
[ ] Hospital receives emergency
[ ] Hospital can update availability
[ ] Doctor can view patient information
[ ] Emergency timeline works
[ ] Notifications work
[ ] Admin dashboard works
[ ] Analytics work
[ ] Search/filter works
[ ] Real-time updates work
[ ] Error handling works
[ ] Responsive design works
[ ] Database is connected
[ ] Demo data is seeded
[ ] README is complete

51. MOST IMPORTANT INSTRUCTION TO LOVABLE

Build the application incrementally but ensure the final result is a cohesive, connected system.

Do not create disconnected mock pages.

Every dashboard must operate on the same emergency record.

The central object is the:

Emergency Case

Everything should revolve around it:

Patient
↓
SOS
↓
AI Priority
↓
Ambulance
↓
Live Tracking
↓
Hospital Recommendation
↓
Hospital
↓
Doctor
↓
Emergency Timeline
↓
Admin Analytics

Use Supabase as the shared source of truth.

When one role changes an emergency status, other relevant dashboards should reflect the change.

Prioritize a fully functional end-to-end demo over unnecessary advanced features.

Start by creating the database schema, authentication, role system, and core emergency workflow. Then implement each dashboard around that shared workflow.

The final application should look like a polished AI healthcare/emergency-management SaaS product suitable for a college project demonstration.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/93d2d474-df83-4553-906f-2e67e83a3f86).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
