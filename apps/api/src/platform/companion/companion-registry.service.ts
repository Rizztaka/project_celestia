import { ICompanionProvider } from '@/core/contracts/companion.interfaces.js';

class CompanionRegistry {
  private readonly providers = new Map<string, ICompanionProvider>();

  register(provider: ICompanionProvider): void {
    if (this.providers.has(provider.gameId)) {
      throw new Error(`CompanionProvider for gameId "${provider.gameId}" is already registered.`);
    }
    this.providers.set(provider.gameId, provider);
  }

  getProvider(gameId: string): ICompanionProvider {
    const provider = this.providers.get(gameId);
    if (!provider) {
      throw new Error(`CompanionProvider for gameId "${gameId}" is not registered.`);
    }
    return provider;
  }
}

export const companionRegistry = new CompanionRegistry();
