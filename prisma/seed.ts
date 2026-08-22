import { PrismaClient } from '@prisma/client'
import { mockIntelligenceData } from '../src/lib/mockIntelligenceData'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Insert mock users (Admin, Agent, Analyst)
  const users = [
    { username: 'admin', email: 'admin@cyberintel.gov', role: 'ADMIN', clearanceLevel: 3, passwordHash: 'mock-hash' },
    { username: 'agent', email: 'agent@cyberintel.gov', role: 'INVESTIGATOR', clearanceLevel: 2, passwordHash: 'mock-hash' },
    { username: 'analyst', email: 'analyst@cyberintel.gov', role: 'ANALYST', clearanceLevel: 1, passwordHash: 'mock-hash' }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        username: u.username,
        email: u.email,
        role: u.role as any,
        clearanceLevel: u.clearanceLevel,
        passwordHash: u.passwordHash,
      },
    })
  }
  console.log('Users seeded.')

  // Extract entities
  const { entities, mapIncidents, feedItems } = mockIntelligenceData;

  for (const entity of entities) {
    try {
      await prisma.intelEntity.upsert({
        where: { id: entity.id },
        update: {},
        create: {
          id: entity.id,
          primaryAlias: entity.primaryAlias,
          category: entity.category,
          colorHex: entity.colorHex,
          riskScore: entity.riskScore,
          status: entity.status,
          firstSeen: new Date(entity.firstSeen),
          lastActive: new Date(entity.lastActive),
          summary: entity.summary,
          cryptoWallets: {
            create: entity.identifiers.cryptoWallets.map(w => ({
              address: w.address,
              currency: w.currency,
              observedVolumeUSD: w.observedVolumeUSD
            }))
          },
          pgpKeys: entity.identifiers.pgpKeyFingerprint ? {
            create: [{
              fingerprint: entity.identifiers.pgpKeyFingerprint.fingerprint,
              shortKeyId: entity.identifiers.pgpKeyFingerprint.shortKeyId,
            }]
          } : undefined
        }
      })
    } catch (e: any) {
      console.error(`Skipping entity ${entity.id} due to constraint: ${e.message}`)
    }
  }
  console.log('Entities seeded.')

  for (const feed of feedItems) {
    try {
      await prisma.feedEntry.create({
        data: {
          id: feed.feedId,
          source: feed.sourceName,
          sourceType: feed.sourceType.toLowerCase(),
          riskScore: feed.riskScore,
          category: feed.category,
          details: feed.rawArtifactSnippet,
          timestamp: new Date(feed.timestamp),
          severity: "medium", // Default mock mapping
          entityId: feed.entityId
        }
      })
    } catch(e) {}
  }
  console.log('Feed Items seeded.')

  for (const incident of mapIncidents) {
    try {
      await prisma.mapIncident.create({
        data: {
          id: incident.incidentId,
          lat: incident.bustLocation.lat,
          lng: incident.bustLocation.lng,
          label: incident.bustLocation.name,
          details: `Seizure: ${incident.seizureWeightGrams}g ${incident.drugType}`,
          drugCategory: incident.drugType,
          riskScore: 80, // Default mock mapping
          date: new Date(incident.timestamp),
          originRoute: JSON.stringify(incident.backtrackingRoute.map(r => ({ lat: r[0], lng: r[1] }))),
          entityId: incident.entityId
        }
      })
    } catch(e) {}
  }
  console.log('Map Incidents seeded.')

  // Read OSINT data
  const osintPath = path.join(__dirname, 'osint_data.json')
  if (fs.existsSync(osintPath)) {
    console.log('Found osint_data.json, seeding OSINT data...')
    const osintData = JSON.parse(fs.readFileSync(osintPath, 'utf8'))

    for (const entity of (osintData.IntelEntity || [])) {
      await prisma.intelEntity.upsert({
        where: { id: entity.id },
        update: {},
        create: {
          id: entity.id,
          primaryAlias: entity.primaryAlias,
          category: entity.category,
          colorHex: entity.colorHex,
          riskScore: entity.riskScore,
          status: entity.status,
          firstSeen: new Date(entity.firstSeen),
          lastActive: new Date(entity.lastActive),
          summary: entity.summary,
        }
      })
    }
    console.log('OSINT Entities seeded.')

    for (const cw of (osintData.CryptoWallet || [])) {
      await prisma.cryptoWallet.upsert({
        where: { address: cw.address },
        update: {},
        create: cw
      })
    }
    console.log('OSINT CryptoWallets seeded.')

    for (const fe of (osintData.FeedEntry || [])) {
      await prisma.feedEntry.upsert({
        where: { id: fe.id },
        update: {},
        create: {
          id: fe.id,
          source: fe.source,
          sourceType: fe.sourceType,
          riskScore: fe.riskScore,
          category: fe.category,
          details: fe.details,
          timestamp: new Date(fe.timestamp),
          severity: fe.severity,
          entityId: fe.entityId
        }
      })
    }
    console.log('OSINT Feed Entries seeded.')
  }

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
