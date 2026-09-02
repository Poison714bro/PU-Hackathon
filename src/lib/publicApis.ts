/**
 * publicApis.ts
 * 
 * Auto-generated wrapper functions for free Cyber Security APIs extracted from
 * the public-apis repository.
 */

// 1. URLhaus API (Abuse.ch)
// A project from abuse.ch with the goal of sharing malicious URLs that are being used for malware distribution.
// Documentation: https://urlhaus-api.abuse.ch/
export async function getRecentMalwareUrls() {
  try {
    const response = await fetch('https://urlhaus-api.abuse.ch/v1/urls/recent/', {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(`Error fetching malware URLs: ${response.statusText}`);
    }
    const data = await response.json();
    return data.urls || [];
  } catch (error) {
    console.error('Failed to fetch from URLhaus:', error);
    return [];
  }
}

// 2. NetworkCalc API
// Network calculators, including subnets, DNS, binary, and security tools.
// Documentation: https://networkcalc.com/api/docs
export async function getDnsRecords(domain: string) {
  try {
    const response = await fetch(`https://networkcalc.com/api/dns/lookup/${domain}`);
    if (!response.ok) {
      throw new Error(`Error fetching DNS records: ${response.statusText}`);
    }
    const data = await response.json();
    return data.records || null;
  } catch (error) {
    console.error('Failed to fetch from NetworkCalc:', error);
    return null;
  }
}
