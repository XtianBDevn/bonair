import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const STAGES = [
  { name: "New Lead", position: 0, color: "#6366f1" },
  { name: "Contacted", position: 1, color: "#8b5cf6" },
  { name: "Qualified", position: 2, color: "#0ea5e9" },
  { name: "Consultation", position: 3, color: "#14b8a6" },
  { name: "Retained", position: 4, color: "#22c55e", isTerminal: true },
  { name: "Lost", position: 5, color: "#94a3b8", isTerminal: true },
];

const SAMPLE_LEADS = [
  {
    firstName: "Maria",
    lastName: "Gonzalez",
    email: "maria.g@email.com",
    phone: "+15551234001",
    source: "website",
    practiceArea: "personal_injury",
    status: "new",
    score: 72,
    urgency: "high",
    caseTypeDetail: "rear-end collision",
    stageIndex: 0,
  },
  {
    firstName: "James",
    lastName: "Whitfield",
    email: "j.whitfield@email.com",
    phone: "+15551234002",
    source: "phone",
    practiceArea: "criminal_defense",
    status: "contacted",
    score: 58,
    urgency: "medium",
    caseTypeDetail: "first-offense DUI",
    stageIndex: 1,
  },
  {
    firstName: "Sarah",
    lastName: "Chen",
    email: "s.chen@email.com",
    phone: "+15551234003",
    source: "chatbot",
    practiceArea: "family",
    status: "qualified",
    score: 81,
    urgency: "medium",
    caseTypeDetail: "custody modification",
    stageIndex: 2,
  },
  {
    firstName: "Robert",
    lastName: "Hayes",
    email: "r.hayes@email.com",
    phone: "+15551234004",
    source: "referral",
    practiceArea: "personal_injury",
    status: "consultation_booked",
    score: 88,
    urgency: "high",
    caseTypeDetail: "slip and fall",
    stageIndex: 3,
  },
  {
    firstName: "Linda",
    lastName: "Brooks",
    email: "l.brooks@email.com",
    phone: "+15551234005",
    source: "sms",
    practiceArea: "estate",
    status: "new",
    score: 45,
    urgency: "low",
    caseTypeDetail: "simple will",
    stageIndex: 0,
  },
];

async function main() {
  await prisma.auditEvent.deleteMany();
  await prisma.usageEvent.deleteMany();
  await prisma.reviewRequest.deleteMany();
  await prisma.workflowExecution.deleteMany();
  await prisma.analyticsSnapshot.deleteMany();
  await prisma.communication.deleteMany();
  await prisma.intakeSession.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.pipeline.deleteMany();
  await prisma.intakeForm.deleteMany();
  await prisma.automationWorkflow.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.attorney.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.plan.deleteMany();

  const plan = await prisma.plan.create({
    data: {
      name: "Professional",
      stripePriceId: "price_seren_professional",
      monthlyPrice: 299,
      aiCredits: 50000,
      smsIncluded: 500,
      maxUsers: 10,
      maxAttorneys: 5,
      features: {
        pipeline: true,
        intake: true,
        aiQualification: true,
        automations: true,
      },
    },
  });

  const tenant = await prisma.tenant.create({
    data: {
      name: "Smith & Associates",
      slug: "smith-associates",
      planId: plan.id,
      settings: {
        timezone: "America/New_York",
        branding: { primary: "#1e3a5f", accent: "#4f46e5" },
      },
    },
  });

  const passwordHash = await bcrypt.hash("demo1234", 10);
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "demo@serenlegal.ai",
      passwordHash,
      firstName: "Jordan",
      lastName: "Smith",
      role: "owner",
    },
  });

  const attorney = await prisma.attorney.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      practiceAreas: ["personal_injury", "criminal_defense", "family"],
      bio: "Managing partner with 15 years of trial experience.",
      isAccepting: true,
    },
  });

  const pipeline = await prisma.pipeline.create({
    data: {
      tenantId: tenant.id,
      name: "Default Pipeline",
      isDefault: true,
    },
  });

  const stages = await Promise.all(
    STAGES.map((s) =>
      prisma.pipelineStage.create({
        data: {
          tenantId: tenant.id,
          pipelineId: pipeline.id,
          name: s.name,
          position: s.position,
          color: s.color,
          isTerminal: s.isTerminal ?? false,
        },
      })
    )
  );

  const intakeForm = await prisma.intakeForm.create({
    data: {
      tenantId: tenant.id,
      name: "General Intake",
      practiceArea: "general",
      embedToken: "smith-intake-embed",
      fields: [
        { key: "incident_date", type: "date", label: "When did the incident occur?", required: true },
        { key: "description", type: "textarea", label: "Briefly describe your situation", required: true },
      ],
    },
  });

  const contactsAndLeads: { contactId: string; leadId: string }[] = [];

  for (const sample of SAMPLE_LEADS) {
    const contact = await prisma.contact.create({
      data: {
        tenantId: tenant.id,
        firstName: sample.firstName,
        lastName: sample.lastName,
        email: sample.email,
        phone: sample.phone,
        phoneNormalized: sample.phone,
      },
    });

    const lead = await prisma.lead.create({
      data: {
        tenantId: tenant.id,
        contactId: contact.id,
        source: sample.source,
        practiceArea: sample.practiceArea,
        status: sample.status,
        score: sample.score,
        urgency: sample.urgency,
        caseTypeDetail: sample.caseTypeDetail,
        caseSummary: `Demo lead: ${sample.caseTypeDetail}`,
        pipelineStageId: stages[sample.stageIndex].id,
        assignedAttorneyId: sample.stageIndex >= 2 ? attorney.id : null,
      },
    });

    contactsAndLeads.push({ contactId: contact.id, leadId: lead.id });
  }

  await prisma.intakeSession.create({
    data: {
      tenantId: tenant.id,
      leadId: contactsAndLeads[0].leadId,
      contactId: contactsAndLeads[0].contactId,
      formId: intakeForm.id,
      channel: "chatbot",
      status: "completed",
      transcript: [
        { role: "bot", content: "Hi! How can Smith & Associates help you today?", ts: new Date().toISOString() },
        { role: "user", content: "I was in a car accident last week.", ts: new Date().toISOString() },
        { role: "bot", content: "I'm sorry to hear that. Were you injured?", ts: new Date().toISOString() },
        { role: "user", content: "Yes, neck and back pain.", ts: new Date().toISOString() },
      ],
      formData: { incident_date: "2025-05-15", description: "Rear-ended at red light" },
      aiSummary: "Potential PI case: rear-end collision with reported neck/back injuries.",
      aiUrgency: "high",
      aiPracticeArea: "personal_injury",
      aiScore: 78,
      completedAt: new Date(),
      durationSeconds: 420,
    },
  });

  await prisma.intakeSession.create({
    data: {
      tenantId: tenant.id,
      leadId: contactsAndLeads[2].leadId,
      contactId: contactsAndLeads[2].contactId,
      formId: intakeForm.id,
      channel: "form",
      status: "in_progress",
      transcript: [
        { role: "user", content: "Need help with custody modification.", ts: new Date().toISOString() },
      ],
      formData: { matter: "custody_modification" },
    },
  });

  await prisma.communication.createMany({
    data: [
      {
        tenantId: tenant.id,
        contactId: contactsAndLeads[0].contactId,
        leadId: contactsAndLeads[0].leadId,
        channel: "sms",
        direction: "outbound",
        status: "delivered",
        body: "Thank you for contacting Smith & Associates. We'll review your case shortly.",
        sentByUserId: user.id,
      },
      {
        tenantId: tenant.id,
        contactId: contactsAndLeads[1].contactId,
        leadId: contactsAndLeads[1].leadId,
        channel: "call",
        direction: "inbound",
        status: "received",
        body: "Missed call — left voicemail about DUI charge.",
        durationSeconds: 45,
      },
    ],
  });

  const workflow = await prisma.automationWorkflow.create({
    data: {
      tenantId: tenant.id,
      name: "Missed Call Recovery",
      description: "Text back within 60 seconds of missed call",
      triggerType: "missed_call",
      triggerConfig: {},
      steps: [
        { type: "send_sms", template: "Sorry we missed your call. Reply here or call us back.", delay_minutes: 0 },
        { type: "wait", delay_minutes: 1440 },
        { type: "send_email", template: "Following up on your inquiry — please call us when convenient.", subject: "Follow-up" },
      ],
      isSystem: true,
    },
  });

  await prisma.workflowExecution.create({
    data: {
      tenantId: tenant.id,
      workflowId: workflow.id,
      leadId: contactsAndLeads[1].leadId,
      contactId: contactsAndLeads[1].contactId,
      status: "running",
      currentStepIndex: 1,
      stepResults: [
        {
          stepIndex: 0,
          type: "send_sms",
          status: "completed",
          executedAt: new Date().toISOString(),
        },
      ],
      nextRunAt: new Date(Date.now() + 60 * 1000),
    },
  });

  const consultStart = new Date();
  consultStart.setDate(consultStart.getDate() + 2);
  consultStart.setHours(10, 0, 0, 0);
  const consultEnd = new Date(consultStart);
  consultEnd.setMinutes(30);

  await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      leadId: contactsAndLeads[3].leadId,
      attorneyId: attorney.id,
      contactId: contactsAndLeads[3].contactId,
      type: "consultation",
      status: "scheduled",
      startsAt: consultStart,
      endsAt: consultEnd,
      meetingUrl: "https://meet.serenlegal.ai/stub/demo",
    },
  });

  await prisma.analyticsSnapshot.create({
    data: {
      tenantId: tenant.id,
      snapshotDate: new Date(),
      metrics: {
        leadsTotal: SAMPLE_LEADS.length,
        leadsQualified: 2,
        conversionRate: 0,
        consultationsBooked: 1,
      },
    },
  });

  await prisma.subscription.create({
    data: {
      tenantId: tenant.id,
      planId: plan.id,
      stripeCustomerId: "cus_demo_smith",
      status: "trialing",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("Seed complete:");
  console.log("  Tenant: Smith & Associates (smith-associates)");
  console.log("  Login:  demo@serenlegal.ai / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
