import path from "node:path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

config({ path: path.join(__dirname, "../.env.local") });
config({ path: path.join(__dirname, "../.env") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const starterPlan = await prisma.plan.upsert({
    where: { code: "starter" },
    update: {},
    create: {
      code: "starter",
      name: "Starter",
      monthlyPriceCents: 4900,
      annualPriceCents: 47000,
      limits: {
        geoPages: 25,
        gbpPosts: 50,
        locations: 3,
        aiCredits: 500,
      },
      features: ["geo_pages", "gbp_posts", "ai_generation"],
      stripePriceMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? "price_bonair_starter_monthly",
      stripePriceAnnual: process.env.STRIPE_PRICE_STARTER_ANNUAL ?? "price_bonair_starter_annual",
    },
  });

  await prisma.plan.upsert({
    where: { code: "agency" },
    update: {},
    create: {
      code: "agency",
      name: "Agency",
      monthlyPriceCents: 14900,
      annualPriceCents: 149000,
      limits: {
        geoPages: 200,
        gbpPosts: 500,
        locations: 25,
        aiCredits: 5000,
      },
      features: ["geo_pages", "gbp_posts", "ai_generation", "agency_mode"],
      stripePriceMonthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY ?? "price_bonair_agency_monthly",
      stripePriceAnnual: process.env.STRIPE_PRICE_AGENCY_ANNUAL ?? "price_bonair_agency_annual",
    },
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-agency" },
    update: {},
    create: {
      slug: "demo-agency",
      name: "Demo Local SEO Agency",
      planId: starterPlan.id,
      isAgency: true,
      brand: { primaryColor: "#0d9488" },
      settings: { timezone: "America/New_York" },
    },
  });

  const passwordHash = await bcrypt.hash("demo1234", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@bonairlocal.ai" },
    update: { passwordHash, name: "Demo User" },
    create: {
      email: "demo@bonairlocal.ai",
      passwordHash,
      name: "Demo User",
      isActive: true,
    },
  });

  await prisma.membership.upsert({
    where: {
      tenantId_userId: { tenantId: tenant.id, userId: user.id },
    },
    update: { role: "owner" },
    create: {
      tenantId: tenant.id,
      userId: user.id,
      role: "owner",
    },
  });

  const location = await prisma.businessLocation.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      tenantId: tenant.id,
      name: "Bon Air Plumbing & HVAC",
      address: {
        street: "123 Main St",
        city: "Richmond",
        region: "VA",
        postalCode: "23235",
        country: "US",
      },
      phone: "(804) 555-0142",
      website: "https://bonairplumbing.example.com",
      primaryCategory: "Plumber",
      categories: ["Plumber", "HVAC contractor"],
      serviceRadiusMiles: 25,
      timezone: "America/New_York",
    },
  });

  await prisma.service.upsert({
    where: {
      tenantId_locationId_slug: {
        tenantId: tenant.id,
        locationId: location.id,
        slug: "emergency-plumbing",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      locationId: location.id,
      name: "Emergency Plumbing",
      slug: "emergency-plumbing",
      description: "24/7 emergency plumbing repairs in the Richmond metro.",
    },
  });

  const geoContent1 = {
    hero: {
      headline: "Trusted Plumber in Richmond, VA",
      subheadline:
        "Bon Air Plumbing & HVAC delivers fast, licensed plumbing services across Richmond and Bon Air.",
    },
    sections: [
      {
        title: "Local plumbing experts",
        body: "From burst pipes to water heater installs, our Richmond team responds same-day.",
      },
      {
        title: "Service areas",
        body: "We serve Richmond, Bon Air, Midlothian, Chesterfield, and surrounding neighborhoods.",
      },
    ],
    faqs: [
      {
        question: "Do you offer emergency plumbing in Richmond?",
        answer: "Yes — 24/7 emergency service with licensed technicians.",
      },
      {
        question: "Are you licensed in Virginia?",
        answer: "Fully licensed and insured for residential and commercial work.",
      },
    ],
  };

  await prisma.geoPage.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: "plumber-richmond-va" },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      locationId: location.id,
      pageType: "city_service",
      slug: "plumber-richmond-va",
      targetCity: "Richmond",
      targetRegion: "VA",
      title: "Plumber in Richmond, VA | Bon Air Plumbing & HVAC",
      metaDescription:
        "Licensed Richmond plumber for repairs, installs, and 24/7 emergencies. Serving Bon Air and Chesterfield.",
      status: "published",
      content: geoContent1,
      wordCount: 420,
      uniquenessScore: 0.92,
      publishedAt: new Date(),
      createdById: user.id,
    },
  });

  const geoContent2 = {
    hero: {
      headline: "Bon Air Neighborhood Plumber",
      subheadline: "Your neighbors in Bon Air trust us for honest pricing and clean work.",
    },
    sections: [
      {
        title: "Bon Air specialists",
        body: "Hyper-local service with technicians who know Bon Air homes and codes.",
      },
    ],
    faqs: [
      {
        question: "How fast can you reach Bon Air?",
        answer: "Most Bon Air calls receive arrival within 60 minutes.",
      },
    ],
  };

  await prisma.geoPage.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: "plumber-bon-air-va" },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      locationId: location.id,
      pageType: "neighborhood",
      slug: "plumber-bon-air-va",
      targetCity: "Bon Air",
      targetRegion: "VA",
      title: "Plumber in Bon Air, VA | Bon Air Plumbing & HVAC",
      metaDescription:
        "Neighborhood plumber in Bon Air, VA. Same-day repairs, drains, and water heaters.",
      status: "draft",
      content: geoContent2,
      wordCount: 280,
      createdById: user.id,
    },
  });

  await prisma.gbpPost.upsert({
    where: { id: "00000000-0000-4000-8000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000002",
      tenantId: tenant.id,
      locationId: location.id,
      topic: "Spring plumbing checkup",
      body: "Schedule your spring plumbing inspection in Richmond & Bon Air. Book online or call (804) 555-0142 — spots fill fast!",
      ctaType: "BOOK",
      status: "scheduled",
      scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.gbpPost.upsert({
    where: { id: "00000000-0000-4000-8000-000000000003" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000003",
      tenantId: tenant.id,
      locationId: location.id,
      topic: "Water heater flush special",
      body: "Book a water heater flush this week — Richmond & Bon Air homeowners save $25.",
      status: "scheduled",
      scheduledFor: new Date(Date.now() - 60 * 1000),
    },
  });

  const rankKeywords = [
    { id: "00000000-0000-4000-8000-000000000010", keyword: "plumber richmond va" },
    { id: "00000000-0000-4000-8000-000000000011", keyword: "emergency plumber bon air" },
    { id: "00000000-0000-4000-8000-000000000012", keyword: "hvac repair chesterfield va" },
  ];

  for (const kw of rankKeywords) {
    await prisma.rankKeyword.upsert({
      where: { id: kw.id },
      update: {},
      create: {
        id: kw.id,
        tenantId: tenant.id,
        locationId: location.id,
        keyword: kw.keyword,
        searchEngine: "google",
        geo: { city: "Richmond", region: "VA", country: "US" },
      },
    });
  }

  const snapshotDays = [0, 7, 14, 21];
  const positions = [
    [4, 5, 3, 3],
    [8, 7, 6, 5],
    [12, 11, 10, 9],
  ];

  const snapshotIds = [
    "00000000-0000-4000-8000-000000000101",
    "00000000-0000-4000-8000-000000000102",
    "00000000-0000-4000-8000-000000000103",
    "00000000-0000-4000-8000-000000000104",
    "00000000-0000-4000-8000-000000000111",
    "00000000-0000-4000-8000-000000000112",
    "00000000-0000-4000-8000-000000000113",
    "00000000-0000-4000-8000-000000000114",
    "00000000-0000-4000-8000-000000000121",
    "00000000-0000-4000-8000-000000000122",
    "00000000-0000-4000-8000-000000000123",
    "00000000-0000-4000-8000-000000000124",
  ];

  let snapIdx = 0;
  for (let ki = 0; ki < rankKeywords.length; ki++) {
    for (let di = 0; di < snapshotDays.length; di++) {
      const capturedAt = new Date();
      capturedAt.setDate(capturedAt.getDate() - snapshotDays[di]);
      const snapId = snapshotIds[snapIdx++];
      await prisma.rankSnapshot.upsert({
        where: { id: snapId },
        update: {},
        create: {
          id: snapId,
          tenantId: tenant.id,
          keywordId: rankKeywords[ki].id,
          position: positions[ki][di],
          localPack: positions[ki][di] <= 3 ? positions[ki][di] : null,
          capturedAt,
          source: "demo",
        },
      });
    }
  }

  const directories = [
    { directory: "Google Business Profile", status: "healthy" },
    { directory: "Yelp", status: "healthy" },
    { directory: "Apple Maps", status: "healthy" },
    { directory: "Bing Places", status: "mismatch", issues: [{ code: "phone_mismatch" }] },
    { directory: "Facebook", status: "missing", issues: [{ code: "listing_not_found" }] },
  ];

  for (let i = 0; i < directories.length; i++) {
    const d = directories[i];
    await prisma.citationListing.upsert({
      where: {
        tenantId_locationId_directory: {
          tenantId: tenant.id,
          locationId: location.id,
          directory: d.directory,
        },
      },
      update: {},
      create: {
        id: `00000000-0000-4000-8000-00000000020${i}`,
        tenantId: tenant.id,
        locationId: location.id,
        directory: d.directory,
        listingUrl: `https://example.com/listings/${d.directory.toLowerCase().replace(/\s+/g, "-")}`,
        napName: "Bon Air Plumbing & HVAC",
        napPhone: "(804) 555-0142",
        napAddress: "123 Main St, Richmond, VA 23235",
        status: d.status,
        lastCheckedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        issues: d.issues ?? [],
      },
    });
  }

  const competitors = [
    { name: "River City Plumbing", rank: 1, rating: 4.9, reviews: 312 },
    { name: "Chesterfield HVAC Pros", rank: 2, rating: 4.7, reviews: 198 },
    { name: "Midlothian Pipe Masters", rank: 3, rating: 4.6, reviews: 156 },
  ];

  const capturedAt = new Date();
  for (let i = 0; i < competitors.length; i++) {
    const c = competitors[i];
    await prisma.competitorSnapshot.upsert({
      where: { id: `00000000-0000-4000-8000-00000000030${i}` },
      update: {},
      create: {
        id: `00000000-0000-4000-8000-00000000030${i}`,
        tenantId: tenant.id,
        locationId: location.id,
        competitorName: c.name,
        rankPosition: c.rank,
        rating: c.rating,
        reviewCount: c.reviews,
        keyword: "plumber richmond va",
        capturedAt,
        metadata: { source: "demo" },
      },
    });
  }

  console.log("Seed complete:");
  console.log("  Tenant:", tenant.slug);
  console.log("  Login: demo@bonairlocal.ai / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
