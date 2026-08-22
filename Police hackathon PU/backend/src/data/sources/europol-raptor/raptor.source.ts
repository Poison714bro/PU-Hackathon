import { SourceType, Classification } from '@prisma/client';

export const europolRaptorSource = {
  source: {
    sourceCode: 'SRC-001-EUROPOL-RAPTOR',
    name: 'Europol - Operation RapTor',
    publisher: 'Europol (European Union Agency for Law Enforcement Cooperation)',
    title: '270 arrested in global dark web crackdown targeting online drug and criminal networks',
    url: 'https://www.europol.europa.eu/media-press/newsroom/news/270-arrested-in-global-dark-web-crackdown-targeting-online-drug-and-criminal-networks',
    publicationDate: new Date('2024-05-07'),
    sourceType: SourceType.LAW_ENFORCEMENT_NOTICE,
    description: 'Global law enforcement operation coordinated by Europol striking vendors and buyers across ten countries resulting in 270 arrests.',
    classification: Classification.SOURCE_FACT,
  },
  documents: [
    {
      documentTitle: 'Operation RapTor Official Press Release',
      author: 'Europol Media & Press Center',
      sectionReference: 'Executive Summary & Key Operational Results',
      rawTextExcerpt: 'A global law enforcement operation coordinated by Europol has struck a major blow to the criminal underground, with 270 arrests of dark web vendors and buyers across ten countries. Known as Operation RapTor, this international sweep has dismantled networks trafficking in drugs, weapons, and counterfeit goods. The suspects were identified through coordinated investigations based on intelligence from the takedowns of the dark web marketplaces Nemesis, Tor2Door, Bohemia and Kingdom Markets.',
      contentHash: 'e7c1d29f8a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d',
      classification: Classification.SOURCE_FACT,
    },
  ],
  facts: [
    {
      factKey: 'RAPTOR_ARRESTS_GLOBAL',
      statement: 'Operation RapTor resulted in 270 arrests of dark web vendors and buyers globally.',
      numericValue: 270,
      unit: 'suspects',
      jurisdiction: 'Global (10 countries)',
      timeframe: '2024',
      confidenceScore: 1.0,
      classification: Classification.SOURCE_FACT,
    },
    {
      factKey: 'RAPTOR_TAKEDOWN_MARKETS',
      statement: 'Intelligence derived from takedowns of Nemesis, Tor2Door, Bohemia, and Kingdom Markets.',
      numericValue: 4,
      unit: 'marketplaces',
      jurisdiction: 'International',
      timeframe: '2023-2024',
      confidenceScore: 1.0,
      classification: Classification.SOURCE_FACT,
    },
    {
      factKey: 'SPECTOR_HISTORICAL_ARRESTS',
      statement: 'Predecessor Operation SpecTor in 2023 led to 288 arrests.',
      numericValue: 288,
      unit: 'suspects',
      jurisdiction: 'International',
      timeframe: '2023',
      confidenceScore: 1.0,
      classification: Classification.SOURCE_FACT,
    },
  ],
};
