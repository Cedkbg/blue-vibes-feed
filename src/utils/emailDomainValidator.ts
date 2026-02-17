const KNOWN_DOMAINS = [
  "gmail.com", "yahoo.com", "yahoo.fr", "hotmail.com", "hotmail.fr",
  "outlook.com", "outlook.fr", "live.com", "live.fr", "icloud.com",
  "aol.com", "protonmail.com", "proton.me", "mail.com",
  "gmx.com", "gmx.fr", "orange.fr", "free.fr", "sfr.fr",
  "laposte.net", "wanadoo.fr", "bbox.fr", "numericable.fr",
  "msn.com", "yandex.com", "zoho.com", "tutanota.com",
  "fastmail.com", "hey.com", "pm.me",
];

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

export interface EmailValidation {
  isValid: boolean;
  suggestion?: string;
  message?: string;
}

export function validateEmailDomain(email: string): EmailValidation {
  const parts = email.split("@");
  if (parts.length !== 2 || !parts[1]) {
    return { isValid: false, message: "Format d'email invalide." };
  }

  const domain = parts[1].toLowerCase();

  if (KNOWN_DOMAINS.includes(domain)) {
    return { isValid: true };
  }

  // Check for close matches (typos)
  let bestMatch = "";
  let bestDist = Infinity;
  for (const known of KNOWN_DOMAINS) {
    const dist = levenshtein(domain, known);
    if (dist < bestDist) {
      bestDist = dist;
      bestMatch = known;
    }
  }

  if (bestDist <= 2 && bestDist > 0) {
    return {
      isValid: false,
      suggestion: bestMatch,
      message: `Le domaine "${domain}" semble incorrect. Vouliez-vous dire ${bestMatch} ?`,
    };
  }

  // Unknown domain but no close match — allow it (could be corporate email)
  return { isValid: true };
}
