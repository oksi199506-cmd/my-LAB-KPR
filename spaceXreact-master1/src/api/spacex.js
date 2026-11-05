const CACHE_PREFIX = "spacex-api-cache:";
const COOLDOWN_KEY = "spacex-api-cooldown-until";
const LAUNCH_CACHE_TTL = 6 * 60 * 60 * 1000;
const PAD_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

class SpaceX {
  constructor(baseUrl = "https://ll.thespacedevs.com/2.3.0/") {
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    this.cache = new Map();
  }

  readCache(url) {
    try {
      const cached = localStorage.getItem(`${CACHE_PREFIX}${url}`);
      if (!cached) {
        return null;
      }

      const parsed = JSON.parse(cached);
      return Number.isFinite(parsed.savedAt) && "data" in parsed
        ? parsed
        : null;
    } catch (error) {
      console.warn("Unable to read Space API cache", error);
      return null;
    }
  }

  writeCache(url, data) {
    try {
      localStorage.setItem(
        `${CACHE_PREFIX}${url}`,
        JSON.stringify({ savedAt: Date.now(), data }),
      );
    } catch (error) {
      console.warn("Unable to save Space API cache", error);
    }
  }

  setCooldown(response, body) {
    const retryAfter = response.headers.get("retry-after");
    const retrySeconds = Number(retryAfter);
    const detailSeconds = body?.detail?.match(
      /available in (\d+)\s+seconds?/i,
    )?.[1];
    const cooldownMs =
      Number.isFinite(retrySeconds) && retrySeconds > 0
        ? retrySeconds * 1000
        : Number(detailSeconds ?? 60) * 1000;

    try {
      localStorage.setItem(COOLDOWN_KEY, String(Date.now() + cooldownMs));
    } catch (error) {
      console.warn("Unable to save Space API rate limit", error);
    }

    return cooldownMs;
  }

  readCooldownUntil() {
    try {
      return Number(localStorage.getItem(COOLDOWN_KEY));
    } catch (error) {
      console.warn("Unable to read Space API rate limit", error);
      return 0;
    }
  }

  async request(url, cacheTtl) {
    const cached = this.readCache(url);
    if (cached && Date.now() - cached.savedAt < cacheTtl) {
      return cached.data;
    }

    const cooldownUntil = this.readCooldownUntil();
    if (cooldownUntil > Date.now()) {
      if (cached) {
        return cached.data;
      }
      const minutes = Math.ceil((cooldownUntil - Date.now()) / 60000);
      throw new Error(
        `Space API rate limit active. Try again in about ${minutes} minutes.`,
      );
    }

    if (!this.cache.has(url)) {
      const request = fetch(url)
        .then(async (response) => {
          if (!response.ok) {
            const body = await response.json().catch(() => null);
            const cooldownMs =
              response.status === 429 ? this.setCooldown(response, body) : 0;
            if (cached) {
              console.warn(
                "Space API request failed; using cached data.",
                body?.detail,
              );
              return cached.data;
            }
            const retryMessage = cooldownMs
              ? ` Try again in about ${Math.ceil(cooldownMs / 60000)} minutes.`
              : "";
            throw new Error(
              `${body?.detail ?? `Space API request failed (${response.status}).`}${retryMessage}`,
            );
          }
          const data = await response.json();
          this.writeCache(url, data);
          return data;
        })
        .catch((error) => {
          this.cache.delete(url);
          if (cached) {
            console.warn("Space API request failed; using cached data.", error);
            return cached.data;
          }
          throw error;
        });

      this.cache.set(url, request);
    }

    return this.cache.get(url);
  }

  async firstPageResults(url) {
    const ttl = url.includes("/pads/") ? PAD_CACHE_TTL : LAUNCH_CACHE_TTL;
    const page = await this.request(url, ttl);
    if (!Array.isArray(page.results)) {
      throw new Error(`Unexpected Space API response: ${url}`);
    }
    return page.results;
  }

  async launches() {
    const launches = await this.firstPageResults(
      `${this.baseUrl}launches/?limit=100&ordering=-net`,
    );

    return launches.map((launch) => ({
      ...launch,
      launchpad: launch.pad?.id ?? (typeof launch.pad === "string" ? launch.pad : null),
    }));
  }

  async launchpads() {
    return this.firstPageResults(`${this.baseUrl}pads/?limit=100`);
  }

  launchpad(id) {
    return this.request(
      `${this.baseUrl}pads/${encodeURIComponent(id)}/`,
      PAD_CACHE_TTL,
    );
  }
}

export { SpaceX };
