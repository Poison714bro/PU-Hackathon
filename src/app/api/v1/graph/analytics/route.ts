import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateCentralityScores, detectGraphCommunities, findShortestPath } from '@/lib/graphAnalytics';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const target = searchParams.get('target');

    // Fetch active intelligence entities and connected nodes
    const entities = await prisma.intelEntity.findMany({
      include: { cryptoWallets: true, pgpKeys: true }
    });

    const nodes: any[] = [];
    const edges: any[] = [];

    entities.forEach(entity => {
      nodes.push({
        id: entity.id,
        label: entity.primaryAlias,
        type: 'suspect',
        riskScore: entity.riskScore,
        category: entity.category,
        status: entity.status
      });

      entity.cryptoWallets.forEach(wallet => {
        const wNodeId = `wallet-${wallet.address}`;
        if (!nodes.find(n => n.id === wNodeId)) {
          nodes.push({
            id: wNodeId,
            label: `${wallet.currency}: ${wallet.address.substring(0, 8)}...`,
            type: 'wallet',
            walletBalance: wallet.observedVolumeUSD?.toString()
          });
        }
        edges.push({
          id: `edge-${entity.id}-${wNodeId}`,
          source: entity.id,
          target: wNodeId,
          relation: 'OWNS_WALLET',
          label: 'Owns'
        });
      });

      entity.pgpKeys.forEach(pgp => {
        const pgpNodeId = `pgp-${pgp.fingerprint}`;
        if (!nodes.find(n => n.id === pgpNodeId)) {
          nodes.push({
            id: pgpNodeId,
            label: `PGP: ${pgp.shortKeyId}`,
            type: 'pgp'
          });
        }
        edges.push({
          id: `edge-${entity.id}-${pgpNodeId}`,
          source: entity.id,
          target: pgpNodeId,
          relation: 'USES_PGP',
          label: 'Uses'
        });
      });
    });

    // Run Semantica Analytics Algorithms
    const centralityMap = calculateCentralityScores(nodes, edges);
    const communities = detectGraphCommunities(nodes, edges);

    let pathResult = null;
    if (source && target) {
      pathResult = findShortestPath(nodes, edges, source, target);
    }

    // Rank Kingpins
    const topKingpins = Object.entries(centralityMap)
      .map(([nodeId, metrics]) => {
        const n = nodes.find(x => x.id === nodeId);
        return {
          nodeId,
          label: n?.label || nodeId,
          type: n?.type || 'unknown',
          riskScore: n?.riskScore || 0,
          ...metrics
        };
      })
      .sort((a, b) => b.kingpinIndex - a.kingpinIndex)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      summary: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        totalCommunities: communities.length
      },
      communities,
      topKingpins,
      centralityScores: centralityMap,
      shortestPath: pathResult
    });
  } catch (error: any) {
    // If DB is unavailable, return mock analytics
    return NextResponse.json({
      success: true,
      mode: 'mock',
      summary: { totalNodes: 5, totalEdges: 6, totalCommunities: 2 },
      communities: [
        { id: 'syndicate_1', label: 'DarkPhoenix Syndicate (3 targets)', size: 3, members: ['ent-001', 'ent-002', 'wallet-btc-1'], density: 0.8 },
        { id: 'syndicate_2', label: 'Ghost Supply Cell (2 targets)', size: 2, members: ['ent-003', 'ent-005'], density: 0.6 }
      ],
      topKingpins: [
        { nodeId: 'ent-001', label: 'DarkPhoenix_77', type: 'suspect', kingpinIndex: 96.5, pagerank: 0.082, betweenness: 0.45, inferredRole: 'Primary Kingpin / Network Coordinator' },
        { nodeId: 'ent-004', label: 'SilkRoad_Vendor', type: 'suspect', kingpinIndex: 88.2, pagerank: 0.061, betweenness: 0.32, inferredRole: 'Key Financial Hub / Exchange Gateway' }
      ]
    });
  }
}
