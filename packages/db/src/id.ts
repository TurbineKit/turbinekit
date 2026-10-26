const ALPHABET =
	"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * A random ID with a readable prefix: `prj_4fQ9…`. The prefix says what the
 * ID points at in logs, URLs and support requests. 16 base62 characters
 * give about 95 bits of randomness.
 */
export function createId(prefix: string, size = 16): string {
	const bytes = crypto.getRandomValues(new Uint8Array(size * 2));
	let id = "";
	for (const byte of bytes) {
		// 248 is the largest multiple of 62 below 256: no modulo bias.
		if (byte < 248) {
			id += ALPHABET[byte % 62];
			if (id.length === size) {
				break;
			}
		}
	}
	return id.length === size ? `${prefix}_${id}` : createId(prefix, size);
}

/** The prefix of each better-auth table's IDs (see packages/auth). */
export const ID_PREFIXES: Record<string, string> = {
	user: "usr",
	session: "ses",
	account: "acc",
	verification: "ver",
	passkey: "pky",
	twoFactor: "tfa",
	apikey: "key",
	jwks: "jwk",
	organization: "org", // turbinekit:orgs
	member: "mem", // turbinekit:orgs
	invitation: "inv", // turbinekit:orgs
};
