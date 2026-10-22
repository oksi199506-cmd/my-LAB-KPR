class SpaceX {
  constructor(baseUrl = "https://ll.thespacedevs.com/2.3.0/") {
    this.baseUrl = baseUrl;
    this.cache = new Map(); // Кэш для защиты от rate-limit
  }

  async fetchWithCache(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }
    // Небольшая задержка, чтобы API не ругалось
    await new Promise((resolve) => setTimeout(resolve, 300));
    const response = await fetch(url);
    const data = await response.json();
    this.cache.set(url, data);
    return data;
  }

  async launches() {
    // Получаем запуски вместе с информацией о площадках (pad)
    const data = await this.fetchWithCache(`${this.baseUrl}launches/?limit=10`);
    return data.results;
  }
}

export { SpaceX };
