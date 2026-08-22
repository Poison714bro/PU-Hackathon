import { NextResponse } from 'next/server';

function generateDenseNetwork() {
  const nodes: any[] = [];
  const edges: any[] = [];
  
  // Create 4 main Identity Hubs
  const hubs = [
    { id: 'HUB_1', label: 'KhaosAdmin', nodeType: 'username', suspectRole: 'supplier', riskScore: 98 },
    { id: 'HUB_2', label: 'WhiteRabbit', nodeType: 'username', suspectRole: 'dealer', riskScore: 92 },
    { id: 'HUB_3', label: 'TorZonOp', nodeType: 'username', suspectRole: 'courier', riskScore: 85 },
    { id: 'HUB_4', label: 'OxyKing', nodeType: 'username', suspectRole: 'supplier', riskScore: 95 }
  ];

  hubs.forEach(hub => {
    nodes.push({
      id: hub.id,
      label: hub.label,
      type: 'evidenceNode',
      nodeType: hub.nodeType,
      suspectRole: hub.suspectRole,
      riskScore: hub.riskScore,
      metadata: { 'Platform': 'Multiple', 'Status': 'Active Target' },
      details: `High value target identified in primary nexus scan. Known ${hub.suspectRole}.`
    });
  });

  // Generate 46 other nodes
  const nodeTypes = ['wallet', 'email', 'pgp', 'listing'];
  const nodePool: string[] = [];
  
  for (let i = 1; i <= 46; i++) {
    const nType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
    let label = '';
    
    if (nType === 'wallet') label = `bc1q...${Math.floor(Math.random()*9000)+1000}`;
    else if (nType === 'email') label = `alias${i}@protonmail.com`;
    else if (nType === 'pgp') label = `PGP_0x${(Math.random() * 0xFFFFFF << 0).toString(16).toUpperCase()}`;
    else label = `Listing #${Math.floor(Math.random() * 10000)}`;

    const id = `N_${i}`;
    nodePool.push(id);
    
    nodes.push({
      id,
      label,
      type: 'evidenceNode',
      nodeType: nType,
      suspectRole: 'unknown',
      riskScore: Math.floor(Math.random() * 50) + 20,
      metadata: { 'Auto-Generated': 'True' },
      details: 'Automated extraction from darknet crawling.'
    });
  }

  // Connect edges
  let edgeCounter = 0;
  const methods = ['darknet', 'encrypted', 'in-person', 'phone'];
  const labels = ['Sends Payment To', 'Uses Key', 'Operates Listing', 'Communicates With', 'Shares Infrastructure'];

  // Hub to Hub connections (overlapping evidence)
  for (let i = 0; i < hubs.length; i++) {
    for (let j = i + 1; j < hubs.length; j++) {
      if (Math.random() > 0.5) { // 50% chance hubs are directly linked
        edges.push({
          id: `E_${edgeCounter++}`,
          source: hubs[i].id,
          target: hubs[j].id,
          label: 'Direct Association',
          contactMethod: 'encrypted'
        });
      }
    }
  }

  // Connect pool nodes to hubs heavily (to create density)
  nodePool.forEach(nodeId => {
    // Each node connects to 1-3 hubs
    const connectionsCount = Math.floor(Math.random() * 3) + 1;
    const shuffledHubs = [...hubs].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < connectionsCount; i++) {
      edges.push({
        id: `E_${edgeCounter++}`,
        source: shuffledHubs[i].id,
        target: nodeId,
        label: labels[Math.floor(Math.random() * labels.length)],
        contactMethod: methods[Math.floor(Math.random() * methods.length)]
      });
    }
  });

  // Connect pool nodes to each other sparsely
  for (let i = 0; i < nodePool.length; i++) {
    if (Math.random() > 0.7) { // 30% chance for lateral connections
      const targetId = nodePool[Math.floor(Math.random() * nodePool.length)];
      if (nodePool[i] !== targetId) {
         edges.push({
          id: `E_${edgeCounter++}`,
          source: nodePool[i],
          target: targetId,
          label: labels[Math.floor(Math.random() * labels.length)],
          contactMethod: methods[Math.floor(Math.random() * methods.length)]
        });
      }
    }
  }

  return { nodes, edges };
}

export async function GET() {
  try {
    const networkData = generateDenseNetwork();
    return NextResponse.json({ success: true, data: networkData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
